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
        user = db.query(User).filter(User.email == payload.get("sub")).first()
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

        # Calculate performance distribution from worklets
        if selected_year is None:
            perf_worklets = worklets_query.all()
        else:
            perf_worklets = year_worklets_query.all()
        
        performance_counts = {
            "excellent": 0,
            "very_good": 0,
            "good": 0,
            "average": 0,
            "needs_improvement": 0,
            "not_rated": 0,
        }
        
        for w in perf_worklets:
            raw_performance = getattr(w, 'Performance', None)
            performance = normalize_performance(raw_performance)
            if performance and performance.lower() not in ("na", "n/a", ""):
                perf_lower = performance.lower().replace(" ", "_")
                if perf_lower == "excellent":
                    performance_counts["excellent"] += 1
                elif perf_lower in ("very_good", "very good"):
                    performance_counts["very_good"] += 1
                elif perf_lower == "good":
                    performance_counts["good"] += 1
                elif perf_lower == "average":
                    performance_counts["average"] += 1
                elif perf_lower in ("poor", "needs_improvement", "needs improvement"):
                    performance_counts["needs_improvement"] += 1
                else:
                    performance_counts["not_rated"] += 1
            else:
                performance_counts["not_rated"] += 1

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
    """Platform-wide monthly trends for a given year.
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

        # Build month windows
        months: list[dict] = []
        for m in range(1, 13):
            last_day = monthrange(selected_year, m)[1]
            start_d = date(selected_year, m, 1)
            end_d = date(selected_year, m, last_day)
            months.append({
                "month": start_d.strftime('%b %Y'),
                "month_key": f"{start_d.year:04d}-{start_d.month:02d}",
                "start": start_d,
                "end": end_d,
                "worklets": 0,
                "completed": 0,
                "students": 0,
            })
        for idx, m in enumerate(months):
            m["order"] = idx

        # Pull filtered worklets
        worklets = worklets_query.all()

        # Precompute student counts per worklet
        worklet_ids = [w.id for w in worklets]
        student_counts = {}
        if worklet_ids:
            assocs = db.query(UserWorkletAssociation).filter(
                and_(
                    UserWorkletAssociation.worklet_id.in_(worklet_ids),
                    UserWorkletAssociation.role_in_worklet == 'Student'
                )
            ).all()
            # Sum by worklet_id
            for a in assocs:
                student_counts[a.worklet_id] = student_counts.get(a.worklet_id, 0) + 1

        # Aggregate by start_date
        year_start = date(selected_year, 1, 1)
        year_end = date(selected_year, 12, 31)
        for w in worklets:
            start_date_val = getattr(w, 'start_date', None)
            status_id = getattr(w, 'status_id', None)
            
            # Skip if no start_date or outside year range
            if start_date_val is None or start_date_val < year_start or start_date_val > year_end:
                continue

            # Find the month this worklet belongs to based on start_date
            for m in months:
                if m['start'] <= start_date_val <= m['end']:
                    m['worklets'] += 1
                    m['students'] += student_counts.get(w.id, 0)
                    # Count as completed if status is Completed (2)
                    if status_id == 2:
                        m['completed'] += 1
                    break

        # Years list from start_date only, capped to current year
        years_set: set[int] = set()
        for w in worklets:
            sd = getattr(w, 'start_date', None)
            if sd is not None:
                years_set.add(int(sd.year))
        if not years_set:
            years_set.add(today.year)
        # Only include present years up to current year (no future years)
        present_years = sorted([y for y in years_set if y <= today.year])
        return {
            "monthly": [{
                "month": m['month'],
                "worklets": m['worklets'],
                "completed": m['completed'],
                "students": m['students'],
                "order": m['order'],
                "month_key": m['month_key']
            } for m in months],
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
    """Platform-wide monthly status trends for a given year.
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

        # Build months
        months: list[dict] = []
        for m in range(1, 13):
            last_day = monthrange(selected_year, m)[1]
            start_d = date(selected_year, m, 1)
            end_d = date(selected_year, m, last_day)
            months.append({
                "month": start_d.strftime('%b %Y'),
                "month_key": f"{start_d.year:04d}-{start_d.month:02d}",
                "start": start_d,
                "end": end_d,
                "completed": 0,
                "ongoing": 0,
                "on_hold": 0,
                "terminated": 0,
            })
        for idx, m in enumerate(months):
            m["order"] = idx

        # Pull filtered worklets
        worklets = worklets_query.all()
        year_start = date(selected_year, 1, 1)
        year_end = date(selected_year, 12, 31)

        for w in worklets:
            status_id = getattr(w, 'status_id', None)
            # Exclude Dropped (status_id = 4)
            if status_id == 4:
                continue
                
            start_date_val = getattr(w, 'start_date', None)
            
            # Skip if no start_date or outside year range
            if start_date_val is None or start_date_val < year_start or start_date_val > year_end:
                continue

            # Find the month this worklet belongs to based on start_date
            for m in months:
                if m['start'] <= start_date_val <= m['end']:
                    # Categorize by status_id
                    if status_id == 2:  # Completed
                        m['completed'] += 1
                    elif status_id in (0, 1):  # To Start or Ongoing
                        m['ongoing'] += 1
                    elif status_id == 3:  # On Hold
                        m['on_hold'] += 1
                    break

        years_set: set[int] = set()
        for w in worklets:
            sd = getattr(w, 'start_date', None)
            if sd is not None:
                years_set.add(int(sd.year))
        if not years_set:
            years_set.add(today.year)
        present_years = sorted([y for y in years_set if y <= today.year])

        return {
            "monthly": [{k: v for k, v in m.items() if k not in ("start", "end")} for m in months],
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

