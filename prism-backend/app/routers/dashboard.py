from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_, func, case, or_
from app.database import get_db
from app.models import User, Worklet, UserWorkletAssociation, Paper, Patent
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from app.core.config import settings
from app.core.constants import normalize_performance
from datetime import date, datetime, time
from calendar import monthrange
from typing import Optional
import logging
import pandas as pd
import numpy as np

logger = logging.getLogger(__name__)

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def decode_token(token: str):
    """Decode JWT token"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    """Get current user from JWT token"""
    try:
        payload = decode_token(token)
        user_id = payload.get("user_id")
        if user_id:
            user = db.query(User).filter(User.id == user_id).first()
        else:
            user = db.query(User).filter(User.email == payload.get("sub"), User.role == payload.get("role")).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid authentication")

@router.get("/statistics")
def get_dashboard_statistics(
    year: int | None = None, 
    domain: str | None = None,
    team: str | None = None,
    debug: bool | None = False, 
    db: Session = Depends(get_db)
):
    """Get platform-wide dashboard statistics.
    When a year is provided, compute KPIs scoped to that year using start_date:
      - total_worklets: worklets with start_date in the specified year
      - completed_worklets: worklets with status_id=2 (Completed) and start_date in year
      - ongoing_worklets: worklets with status_id=1 (Ongoing) and start_date in year
      - total_mentors/students/professors: unique users associated to year worklets (by role)
      - publications: counts of papers/patents in that year
    Supports optional domain and team filtering.
    Without year, returns overall totals.
    """
    from app.models import TechDomain, TeamMG
    
    today = date.today()
    selected_year = year

    def safe_count(q) -> int:
        try:
            return int(q.count())
        except Exception as e:
            logger.warning(f"count failed: {e}")
            return 0

    # Role matching: compare Enum directly to expected values
    role_eq = lambda col, val: col == val

    # Collect debug info containers
    debug_info = {}

    try:
        # Build base worklet query with domain and team filters
        worklets_query = db.query(Worklet)
        
        # Apply domain filter if provided
        if domain is not None and domain != "All":
            domain_obj = db.query(TechDomain).filter(TechDomain.domain_name == domain).first()
            if domain_obj:
                worklets_query = worklets_query.filter(Worklet.tech_domain_id == domain_obj.id)
        
        # Apply team filter if provided
        if team is not None and team != "All":
            team_obj = db.query(TeamMG).filter(TeamMG.team_name == team).first()
            if team_obj:
                worklets_query = worklets_query.filter(Worklet.team_mg_id == team_obj.id)
        
        if selected_year is None:
            # Count all mentors and students regardless of created_at or active_till
            mentors_list = db.query(User.id, User.name).filter(role_eq(User.role, "Mentor")).all()
            students_list = db.query(User.id, User.name).filter(role_eq(User.role, "Student")).all()
            professors_list = db.query(User.id, User.name).filter(role_eq(User.role, "Professor")).all()

            total_mentors = len(mentors_list)
            total_students = len(students_list)
            total_professors = len(professors_list)

            # Use filtered worklets query
            total_worklets = safe_count(worklets_query)
            completed_worklets = safe_count(worklets_query.filter(getattr(Worklet, 'status_id') == 2))
            ongoing_worklets = safe_count(worklets_query.filter(getattr(Worklet, 'status_id') == 1))

            # Debug: show distinct role distribution in Users table
            role_distribution = db.query(User.role, func.count(User.id)).group_by(User.role).all()
            logger.debug(f"Users role distribution: {role_distribution}")
            logger.debug(f"Users table mentors: {len(mentors_list)} -> {[m.id for m in mentors_list]}")
            logger.debug(f"Users table students: {len(students_list)} -> {[s.id for s in students_list]}")

            logger.debug(f"All Years counts (Users table only):")
            print(
                f"  users_table: mentors={total_mentors}, students={total_students}, professors={total_professors}"
            )
            if debug:
                debug_info["users_role_distribution"] = [(str(r), int(c)) for r, c in role_distribution]
                debug_info["mentors_ids_all"] = [int(m.id) for m in mentors_list]
                debug_info["students_ids_all"] = [int(s.id) for s in students_list]
            papers_count = safe_count(db.query(Paper))
            patents_count = safe_count(db.query(Patent))
        else:
            year_start = date(selected_year, 1, 1)
            year_end = date(selected_year, 12, 31)
            start_dt = datetime.combine(year_start, time.min)
            end_dt = datetime.combine(year_end, time.max)

            # Filter worklets by start_date year
            year_worklets_query = worklets_query.filter(
                Worklet.start_date >= year_start,
                Worklet.start_date <= year_end
            )

            total_worklets = safe_count(year_worklets_query)
            # Completed: status_id = 2
            completed_worklets = safe_count(year_worklets_query.filter(Worklet.status_id == 2))
            # Ongoing: status_id = 1
            ongoing_worklets = safe_count(year_worklets_query.filter(Worklet.status_id == 1))

            # Get worklet IDs for user association filtering
            year_worklet_ids = [w.id for w in year_worklets_query.all()]

            # Get users associated with worklets that started in this year
            if year_worklet_ids:
                # Get distinct user IDs by role from associations
                mentor_ids = db.query(UserWorkletAssociation.user_id).distinct().filter(
                    UserWorkletAssociation.worklet_id.in_(year_worklet_ids),
                    UserWorkletAssociation.role_in_worklet == 'Mentor'
                ).all()
                student_ids = db.query(UserWorkletAssociation.user_id).distinct().filter(
                    UserWorkletAssociation.worklet_id.in_(year_worklet_ids),
                    UserWorkletAssociation.role_in_worklet == 'Student'
                ).all()
                professor_ids = db.query(UserWorkletAssociation.user_id).distinct().filter(
                    UserWorkletAssociation.worklet_id.in_(year_worklet_ids),
                    UserWorkletAssociation.role_in_worklet == 'Professor'
                ).all()
                
                total_mentors = len(mentor_ids)
                total_students = len(student_ids)
                total_professors = len(professor_ids)
            else:
                total_mentors = 0
                total_students = 0
                total_professors = 0

            logger.debug(f"Year-specific counts (from worklet associations):")
            logger.debug(
                f"  year={selected_year}: mentors={total_mentors}, students={total_students}, professors={total_professors}"
            )

            papers_count = db.query(Paper).filter(Paper.publication_year == selected_year).count()
            patents_count = db.query(Patent).filter(Patent.filing_year == selected_year).count()

        # Calculate performance distribution from worklets using pandas for efficiency
        if selected_year is None:
            perf_worklets = worklets_query.all()
        else:
            perf_worklets = year_worklets_query.all()
        
        # Convert worklets to DataFrame for efficient performance categorization
        if perf_worklets:
            perf_data = []
            for w in perf_worklets:
                raw_performance = getattr(w, 'Performance', None)
                performance = normalize_performance(raw_performance)
                perf_data.append({'performance': performance})
            
            df_perf = pd.DataFrame(perf_data)
            
            # Normalize performance values using pandas operations (vectorized)
            df_perf['performance'] = df_perf['performance'].fillna('').str.lower().str.replace(' ', '_')
            
            # Categorize performance efficiently
            def categorize_performance(perf):
                if not perf or perf in ('na', 'n/a', ''):
                    return 'not_rated'
                elif perf == 'excellent':
                    return 'excellent'
                elif perf in ('very_good', 'verygood'):
                    return 'very_good'
                elif perf == 'good':
                    return 'good'
                elif perf == 'average':
                    return 'average'
                elif perf in ('poor', 'needs_improvement', 'needsimprovement'):
                    return 'needs_improvement'
                else:
                    return 'not_rated'
            
            df_perf['category'] = df_perf['performance'].apply(categorize_performance)
            
            # Count using pandas value_counts (very fast)
            perf_counts = df_perf['category'].value_counts().to_dict()
            
            performance_counts = {
                "excellent": perf_counts.get("excellent", 0),
                "very_good": perf_counts.get("very_good", 0),
                "good": perf_counts.get("good", 0),
                "average": perf_counts.get("average", 0),
                "needs_improvement": perf_counts.get("needs_improvement", 0),
                "not_rated": perf_counts.get("not_rated", 0),
            }
        else:
            performance_counts = {
                "excellent": 0,
                "very_good": 0,
                "good": 0,
                "average": 0,
                "needs_improvement": 0,
                "not_rated": 0,
            }

        logger.debug(f"Dashboard statistics computed:")
        logger.info(f"  total_mentors: {total_mentors}")
        logger.info(f"  total_worklets: {total_worklets}")
        logger.info(f"  total_students: {total_students}")
        logger.info(f"  ongoing_worklets: {ongoing_worklets}")
        logger.info(f"  completed_worklets: {completed_worklets}")
        logger.info(f"  total_professors: {total_professors}")
        logger.info(f"  papers_count: {papers_count}")
        logger.info(f"  patents_count: {patents_count}")
        print(
            f"  completion_rate: {round((completed_worklets / total_worklets * 100) if total_worklets > 0 else 0, 1)}"
        )
        result = {
            "total_mentors": total_mentors,
            "total_worklets": total_worklets,
            "total_students": total_students,
            "ongoing_worklets": ongoing_worklets,
            "completed_worklets": completed_worklets,
            "completion_rate": round((completed_worklets / total_worklets * 100) if total_worklets > 0 else 0, 1),
            "total_professors": total_professors,
            "publications": {"papers": papers_count, "patents": patents_count},
            "performance_distribution": performance_counts,
        }
        if debug:
            result["debug"] = debug_info
        return result
    except Exception as e:
        import traceback
        logger.error(f"Exception in get_dashboard_statistics: {e}", exc_info=True)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Internal server error")
@router.get("/platform-monthly-trends")
def get_platform_monthly_trends(
    year: int | None = None,
    domain: str | None = None,
    team: str | None = None,
    db: Session = Depends(get_db)
):
    """Platform-wide monthly trends for a given year (Pandas-optimized for large datasets).
    For each month:
      - worklets: number of worklets with start_date in that month
      - completed: number of worklets with status_id=2 (Completed) and start_date in that month
      - students: total student associations for worklets starting in that month
    Uses Worklet.start_date for filtering by month.
    Supports optional domain and team filtering.
    """
    try:
        from app.models import TechDomain, TeamMG
        
        today = date.today()
        selected_year = year if year is not None else today.year

        # Build base worklet query with domain and team filters
        worklets_query = db.query(Worklet)
        
        # Apply domain filter if provided
        if domain is not None and domain != "All":
            domain_obj = db.query(TechDomain).filter(TechDomain.domain_name == domain).first()
            if domain_obj:
                worklets_query = worklets_query.filter(Worklet.tech_domain_id == domain_obj.id)
        
        # Apply team filter if provided
        if team is not None and team != "All":
            team_obj = db.query(TeamMG).filter(TeamMG.team_name == team).first()
            if team_obj:
                worklets_query = worklets_query.filter(Worklet.team_mg_id == team_obj.id)

        # Pull filtered worklets and convert to DataFrame for efficient processing
        worklets = worklets_query.all()
        
        if not worklets:
            # Return empty structure if no worklets
            months = []
            for m in range(1, 13):
                start_d = date(selected_year, m, 1)
                months.append({
                    "month": start_d.strftime('%b %Y'),
                    "worklets": 0,
                    "completed": 0,
                    "students": 0,
                    "order": m - 1,
                    "month_key": f"{start_d.year:04d}-{start_d.month:02d}"
                })
            return {"monthly": months, "years": [today.year]}
        
        # Convert worklets to pandas DataFrame for efficient aggregation
        worklets_data = []
        for w in worklets:
            start_date_val = getattr(w, 'start_date', None)
            if start_date_val:
                worklets_data.append({
                    'worklet_id': w.id,
                    'start_date': start_date_val,
                    'status_id': getattr(w, 'status_id', None)
                })
        
        df_worklets = pd.DataFrame(worklets_data)
        df_worklets['start_date'] = pd.to_datetime(df_worklets['start_date'])
        
        # Extract years from all worklets BEFORE year filtering
        all_years_set = df_worklets['start_date'].dt.year.unique().tolist()
        present_years = sorted([int(y) for y in all_years_set if y <= today.year])
        if not present_years:
            present_years = [today.year]
        
        # Filter by year
        year_start = pd.Timestamp(selected_year, 1, 1)
        year_end = pd.Timestamp(selected_year, 12, 31)
        df_worklets = df_worklets[
            (df_worklets['start_date'] >= year_start) & 
            (df_worklets['start_date'] <= year_end)
        ]
        
        if df_worklets.empty:
            # Return empty structure
            months = []
            for m in range(1, 13):
                start_d = date(selected_year, m, 1)
                months.append({
                    "month": start_d.strftime('%b %Y'),
                    "worklets": 0,
                    "completed": 0,
                    "students": 0,
                    "order": m - 1,
                    "month_key": f"{start_d.year:04d}-{start_d.month:02d}"
                })
            return {"monthly": months, "years": [today.year]}
        
        # Add year-month column for grouping
        df_worklets['year_month'] = df_worklets['start_date'].dt.to_period('M')
        df_worklets['is_completed'] = (df_worklets['status_id'] == 2).astype(int)
        
        # Get student counts using pandas for efficiency
        worklet_ids = df_worklets['worklet_id'].tolist()
        assocs = db.query(UserWorkletAssociation).filter(
            and_(
                UserWorkletAssociation.worklet_id.in_(worklet_ids),
                UserWorkletAssociation.role_in_worklet == 'Student'
            )
        ).all()
        
        # Convert associations to DataFrame
        if assocs:
            df_assocs = pd.DataFrame([
                {'worklet_id': a.worklet_id, 'user_id': a.user_id} 
                for a in assocs
            ])
            # Count unique students per worklet
            student_counts = df_assocs.groupby('worklet_id')['user_id'].count().to_dict()
            df_worklets['students'] = df_worklets['worklet_id'].map(student_counts).fillna(0).astype(int)
        else:
            df_worklets['students'] = 0
        
        # Aggregate by month using pandas groupby (very efficient for large datasets)
        monthly_agg = df_worklets.groupby('year_month').agg({
            'worklet_id': 'count',  # Total worklets
            'is_completed': 'sum',  # Completed worklets
            'students': 'sum'       # Total students
        }).reset_index()
        
        monthly_agg.columns = ['year_month', 'worklets', 'completed', 'students']
        
        # Create full 12-month structure
        months = []
        for m in range(1, 13):
            start_d = date(selected_year, m, 1)
            period = pd.Period(f"{selected_year}-{m:02d}", freq='M')
            
            # Find matching data from aggregation
            match = monthly_agg[monthly_agg['year_month'] == period]
            
            months.append({
                "month": start_d.strftime('%b %Y'),
                "worklets": int(match['worklets'].iloc[0]) if not match.empty else 0,
                "completed": int(match['completed'].iloc[0]) if not match.empty else 0,
                "students": int(match['students'].iloc[0]) if not match.empty else 0,
                "order": m - 1,
                "month_key": f"{start_d.year:04d}-{start_d.month:02d}"
            })
        
        # Years list was already extracted before year filtering
        return {
            "monthly": months,
            "years": present_years
        }
    except Exception as e:
        logger.error(f"Error computing platform monthly trends: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/platform-status-trends")
def get_platform_status_trends(
    year: int | None = None,
    domain: str | None = None,
    team: str | None = None,
    db: Session = Depends(get_db)
):
    """Platform-wide monthly status trends for a given year (Pandas-optimized for large datasets).
    Groups worklets by start_date month and status_id:
    - Status 0 (To Start) and 1 (Ongoing) → ongoing
    - Status 2 (Completed) → completed
    - Status 3 (On Hold) → on_hold
    - Status 4 (Dropped) → excluded
    Supports optional domain and team filtering.
    """
    try:
        from app.models import TechDomain, TeamMG
        
        today = date.today()
        selected_year = year if year is not None else today.year

        # Build base worklet query with domain and team filters
        worklets_query = db.query(Worklet)
        
        # Apply domain filter if provided
        if domain is not None and domain != "All":
            domain_obj = db.query(TechDomain).filter(TechDomain.domain_name == domain).first()
            if domain_obj:
                worklets_query = worklets_query.filter(Worklet.tech_domain_id == domain_obj.id)
        
        # Apply team filter if provided
        if team is not None and team != "All":
            team_obj = db.query(TeamMG).filter(TeamMG.team_name == team).first()
            if team_obj:
                worklets_query = worklets_query.filter(Worklet.team_mg_id == team_obj.id)

        # Pull filtered worklets
        worklets = worklets_query.all()
        
        if not worklets:
            # Return empty structure
            months = []
            for m in range(1, 13):
                start_d = date(selected_year, m, 1)
                months.append({
                    "month": start_d.strftime('%b %Y'),
                    "completed": 0,
                    "ongoing": 0,
                    "on_hold": 0,
                    "terminated": 0,
                    "order": m - 1,
                    "month_key": f"{start_d.year:04d}-{start_d.month:02d}"
                })
            return {"monthly": months, "years": [today.year]}
        
        # Convert worklets to pandas DataFrame for efficient processing
        worklets_data = []
        for w in worklets:
            start_date_val = getattr(w, 'start_date', None)
            status_id = getattr(w, 'status_id', None)
            # Exclude Dropped (status_id = 4)
            if status_id != 4 and start_date_val:
                worklets_data.append({
                    'worklet_id': w.id,
                    'start_date': start_date_val,
                    'status_id': status_id
                })
        
        if not worklets_data:
            months = []
            for m in range(1, 13):
                start_d = date(selected_year, m, 1)
                months.append({
                    "month": start_d.strftime('%b %Y'),
                    "completed": 0,
                    "ongoing": 0,
                    "on_hold": 0,
                    "terminated": 0,
                    "order": m - 1,
                    "month_key": f"{start_d.year:04d}-{start_d.month:02d}"
                })
            return {"monthly": months, "years": [today.year]}
        
        df_worklets = pd.DataFrame(worklets_data)
        df_worklets['start_date'] = pd.to_datetime(df_worklets['start_date'])
        
        # Extract years from all worklets BEFORE year filtering
        all_years_set = df_worklets['start_date'].dt.year.unique().tolist()
        present_years = sorted([int(y) for y in all_years_set if y <= today.year])
        if not present_years:
            present_years = [today.year]
        
        # Filter by year using pandas datetime operations
        year_start = pd.Timestamp(selected_year, 1, 1)
        year_end = pd.Timestamp(selected_year, 12, 31)
        df_worklets = df_worklets[
            (df_worklets['start_date'] >= year_start) & 
            (df_worklets['start_date'] <= year_end)
        ]
        
        if df_worklets.empty:
            months = []
            for m in range(1, 13):
                start_d = date(selected_year, m, 1)
                months.append({
                    "month": start_d.strftime('%b %Y'),
                    "completed": 0,
                    "ongoing": 0,
                    "on_hold": 0,
                    "terminated": 0,
                    "order": m - 1,
                    "month_key": f"{start_d.year:04d}-{start_d.month:02d}"
                })
            return {"monthly": months, "years": [today.year]}
        
        # Add year-month column
        df_worklets['year_month'] = df_worklets['start_date'].dt.to_period('M')
        
        # Categorize status using efficient pandas operations
        df_worklets['completed'] = (df_worklets['status_id'] == 2).astype(int)
        df_worklets['ongoing'] = df_worklets['status_id'].isin([0, 1]).astype(int)
        df_worklets['on_hold'] = (df_worklets['status_id'] == 3).astype(int)
        df_worklets['terminated'] = 0  # Status 4 already excluded
        
        # Aggregate by month using pandas groupby (very efficient)
        monthly_agg = df_worklets.groupby('year_month').agg({
            'completed': 'sum',
            'ongoing': 'sum',
            'on_hold': 'sum',
            'terminated': 'sum'
        }).reset_index()
        
        # Create full 12-month structure
        months = []
        for m in range(1, 13):
            start_d = date(selected_year, m, 1)
            period = pd.Period(f"{selected_year}-{m:02d}", freq='M')
            
            # Find matching data from aggregation
            match = monthly_agg[monthly_agg['year_month'] == period]
            
            months.append({
                "month": start_d.strftime('%b %Y'),
                "completed": int(match['completed'].iloc[0]) if not match.empty else 0,
                "ongoing": int(match['ongoing'].iloc[0]) if not match.empty else 0,
                "on_hold": int(match['on_hold'].iloc[0]) if not match.empty else 0,
                "terminated": int(match['terminated'].iloc[0]) if not match.empty else 0,
                "order": m - 1,
                "month_key": f"{start_d.year:04d}-{start_d.month:02d}"
            })
        
        # Years list was already extracted before year filtering
        return {
            "monthly": months,
            "years": present_years
        }
    except Exception as e:
        logger.error(f"Error computing platform status trends: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/domains")
def get_domains(
    year: int | None = None,
    db: Session = Depends(get_db)
):
    """Get all domains with optional year filtering.
    Returns domains that have worklets in the specified year.
    If no year is provided, returns all domains.
    """
    try:
        from app.models import TechDomain
        
        if year is None:
            # Return all domains
            domains = db.query(TechDomain.domain_name).order_by(TechDomain.domain_name).all()
            return {"domains": [d.domain_name for d in domains]}
        
        # Filter domains by year - get domains that have worklets starting in that year
        year_start = date(year, 1, 1)
        year_end = date(year, 12, 31)
        
        # Get distinct domain IDs from worklets with start_date in the year
        domain_ids = db.query(Worklet.tech_domain_id).distinct().filter(
            and_(
                Worklet.start_date >= year_start,
                Worklet.start_date <= year_end
            )
        ).all()
        
        domain_ids = [d[0] for d in domain_ids if d[0] is not None]
        
        if not domain_ids:
            return {"domains": []}
        
        # Get domain names
        domains = db.query(TechDomain.domain_name).filter(
            TechDomain.id.in_(domain_ids)
        ).order_by(TechDomain.domain_name).all()
        
        return {"domains": [d.domain_name for d in domains]}
        
    except Exception as e:
        logger.error(f"Error getting domains: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/teams")
def get_teams(
    year: int | None = None,
    domain: str | None = None,
    db: Session = Depends(get_db)
):
    """Get all teams with optional year and domain filtering.
    Returns teams that have worklets matching the filters.
    Nested filtering: year -> domain -> team
    """
    try:
        from app.models import TeamMG, TechDomain
        
        # Start with base query
        query = db.query(Worklet.team_mg_id).distinct()
        
        # Apply year filter if provided
        if year is not None:
            year_start = date(year, 1, 1)
            year_end = date(year, 12, 31)
            query = query.filter(
                and_(
                    Worklet.start_date >= year_start,
                    Worklet.start_date <= year_end
                )
            )
        
        # Apply domain filter if provided
        if domain is not None and domain != "All":
            # Get domain ID from name
            domain_obj = db.query(TechDomain).filter(TechDomain.domain_name == domain).first()
            if domain_obj:
                query = query.filter(Worklet.tech_domain_id == domain_obj.id)
        
        team_ids = query.all()
        team_ids = [t[0] for t in team_ids if t[0] is not None]
        
        if not team_ids:
            return {"teams": []}
        
        # Get team names
        teams = db.query(TeamMG.team_name).filter(
            TeamMG.id.in_(team_ids)
        ).order_by(TeamMG.team_name).all()
        
        return {"teams": [t.team_name for t in teams]}
        
    except Exception as e:
        logger.error(f"Error getting teams: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

