from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_, func, case, or_
from app.database import get_db
from app.models import User, Worklet, UserWorkletAssociation, Paper, Patent
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from app.core.config import settings
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

@router.get("/debug/summary")
def debug_summary(db: Session = Depends(get_db)):
    """Lightweight debug endpoint to verify DB connection and basic Worklet counts.
    Returns only non-sensitive info when DEBUG is enabled.
    """
    from app.core.config import settings as app_settings
    if not getattr(app_settings, "DEBUG", False):
        raise HTTPException(status_code=403, detail="Debug disabled")

    try:
        total = db.query(Worklet).count()
        by_status = db.query(Worklet.status_id, func.count(Worklet.id)).group_by(Worklet.status_id).all()
        status_counts = {int(s if s is not None else 0): int(c) for s, c in by_status}
        sample = db.query(Worklet.id, Worklet.cert_id, Worklet.title).limit(5).all()
        return {
            "db_name": getattr(app_settings, "DB_NAME", None),
            "db_host": getattr(app_settings, "DB_HOST", None),
            "worklet_total": int(total),
            "status_counts": status_counts,
            "sample_worklets": [
                {"id": int(r.id), "cert_id": r.cert_id, "title": r.title} for r in sample
            ],
        }
    except Exception as e:
        logger.debug(f"debug_summary error: {e}")
        raise HTTPException(status_code=500, detail="Debug query failed")

@router.get("/statistics")
def get_dashboard_statistics(
    year: int | None = None, 
    domain: str | None = None,
    team: str | None = None,
    debug: bool | None = False, 
    db: Session = Depends(get_db)
):
    """Get platform-wide dashboard statistics.
    When a year is provided, compute KPIs scoped to that year using active-window semantics:
      - total_worklets: worklets active at any point in the year (overlap)
      - completed_worklets: worklets with end_date in the year
      - ongoing_worklets: worklets active in the year and not completed/terminated within the year
      - total_mentors/students/professors: unique users associated to year-active worklets (by role)
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

            # Use filtered worklets query
            worklets = worklets_query.all()

            def effective_window(w: Worklet):
                s = getattr(w, "start_date", None)
                e = getattr(w, "end_date", None) or today
                return s, e

            year_active_ids: set[int] = set()
            completed_in_year = 0
            ongoing_in_year = 0
            for w in worklets:
                s, e = effective_window(w)
                if s is None:
                    continue
                if not (e < year_start or s > year_end):
                    year_active_ids.add(w.id)
                    status_id = getattr(w, 'status_id', None)
                    end_d = getattr(w, 'end_date', None)
                    if status_id == 2 and end_d is not None and year_start <= end_d <= year_end:
                        completed_in_year += 1
                    is_terminated_in_year = False
                    is_completed_in_year = (status_id == 2 and end_d is not None and year_start <= end_d <= year_end)
                    if not is_terminated_in_year and not is_completed_in_year:
                        ongoing_in_year += 1

            total_worklets = len(year_active_ids)
            completed_worklets = completed_in_year
            ongoing_worklets = ongoing_in_year

            # Overlap logic: user was active at any point during the year
            mentors_year = db.query(User.id, User.name, User.created_at, User.active_till).filter(
                role_eq(User.role, "Mentor"),
                User.created_at <= end_dt.date(),
                or_(User.active_till == None, User.active_till >= year_start),
            ).all()
            students_year = db.query(User.id, User.name, User.created_at, User.active_till).filter(
                role_eq(User.role, "Student"),
                User.created_at <= end_dt.date(),
                or_(User.active_till == None, User.active_till >= year_start),
            ).all()
            professors_year = db.query(User.id, User.name, User.created_at, User.active_till).filter(
                role_eq(User.role, "Professor"),
                User.created_at <= end_dt.date(),
                or_(User.active_till == None, User.active_till >= year_start),
            ).all()

            total_mentors = len(mentors_year)
            total_students = len(students_year)
            total_professors = len(professors_year)

            # Debug: show distinct role distribution among users active in year
            active_roles_dist = db.query(User.role, func.count(User.id)).filter(
                User.created_at <= end_dt.date(),
                or_(User.active_till == None, User.active_till >= year_start),
            ).group_by(User.role).all()
            logger.debug(f"Active-year Users role distribution ({selected_year}): {active_roles_dist}")
            if debug:
                debug_info["active_year_role_distribution"] = [(str(r), int(c)) for r, c in active_roles_dist]
                debug_info["mentors_ids_year"] = [int(m.id) for m in mentors_year]
                debug_info["mentors_details_year"] = [
                    {"id": int(m.id), "name": m.name, "created_at": str(m.created_at), "active_till": str(m.active_till)} for m in mentors_year
                ]

            # Users table only for year-specific totals
            logger.debug(f"Year-specific counts (Users table only):")
            print(
                f"  active_window: mentors={total_mentors}, students={total_students}, professors={total_professors}"
            )

            papers_count = db.query(Paper).filter(Paper.publication_year == selected_year).count()
            patents_count = db.query(Patent).filter(Patent.filing_year == selected_year).count()

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
        }
        if debug:
            result["debug"] = debug_info
        return result
    except Exception as e:
        import traceback
        logger.error(f"Exception in get_dashboard_statistics: {e}", exc_info=True)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Internal server error")
        mentor = db.query(User).filter(
            and_(User.id == mentor_id, User.role == "Mentor")
        ).first()
        
        if not mentor:
            raise HTTPException(status_code=404, detail="Mentor not found")
        
        # Get mentor's associations with worklet details
        associations_query = db.query(
            UserWorkletAssociation,
            Worklet
        ).join(
            Worklet, UserWorkletAssociation.worklet_id == Worklet.id
        ).filter(
            and_(
                UserWorkletAssociation.user_id == mentor_id,
                UserWorkletAssociation.role_in_worklet == 'Mentor'
            )
        ).all()
        
        worklets_detail = []
        total_progress = 0
        progress_count = 0
        
        for assoc, worklet in associations_query:
            # Get students for this worklet
            students = db.query(UserWorkletAssociation).filter(
                and_(
                    UserWorkletAssociation.worklet_id == worklet.id,
                    UserWorkletAssociation.role_in_worklet == 'Student'
                )
            ).count()
            
            worklet_info = {
                "worklet_id": worklet.id,
                "cert_id": worklet.cert_id,
                "title": getattr(worklet, "title", None),
                "description": getattr(worklet, "problem_statement", None),
                "status": worklet.status,
                "student_count": students,
                "domain": getattr(worklet, "domain", None),
            }
            
            worklets_detail.append(worklet_info)
            
            if assoc.progress_percentage is not None:
                total_progress += assoc.progress_percentage
                progress_count += 1
        
        avg_progress = 0
        
        return {
            "mentor": {
                "id": mentor.id,
                "name": mentor.name,
                "email": mentor.email,
                "team": mentor.profile.expertise if mentor.profile else None,
                "college": mentor.college
            },
            "summary": {
                "total_worklets": len(worklets_detail),
                "average_progress": avg_progress,
                "total_students": sum(w["student_count"] for w in worklets_detail)
            },
            "worklets": worklets_detail
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.info(f"Error getting detailed mentor stats: {e}")
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
      - worklets: number of worklets active during that month (overlapping window)
      - completed: number of worklets whose end_date falls in that month
      - students: total student associations across active worklets for that month
    Uses Worklet.start_date and Worklet.end_date when available; if end missing, cap at today.
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

        # Aggregate
        now_d = date.today()
        year_start = date(selected_year, 1, 1)
        year_end = date(selected_year, 12, 31)
        for w in worklets:
            start_date_val = getattr(w, 'start_date', None)
            end_date_val = getattr(w, 'end_date', None)
            status_id = getattr(w, 'status_id', None)
            w_year = getattr(w, 'year', None)

            # Effective start
            start_eff = start_date_val if start_date_val is not None else (date(w_year, 1, 1) if w_year else None)
            # Effective end
            end_eff = end_date_val if end_date_val is not None else now_d

            # Clamp to year
            if start_eff is not None and start_eff < year_start:
                start_eff = year_start
            if end_eff is None or end_eff > year_end:
                end_eff = year_end

            for m in months:
                active = (start_eff is not None and end_eff is not None and not (end_eff < m['start'] or start_eff > m['end']))
                if active:
                    m['worklets'] += 1
                    m['students'] += student_counts.get(getattr(w, 'id', None), 0)
                # Count as completed if status is Completed (2) and end_date falls in this month
                if status_id == 2 and end_date_val is not None and (m['start'] <= end_date_val <= m['end']):
                    m['completed'] += 1

        # Years list from actual dates only (start_date, end_date), capped to current year
        years_set: set[int] = set()
        for w in worklets:
            sd = getattr(w, 'start_date', None)
            ed = getattr(w, 'end_date', None)
            if sd is not None:
                years_set.add(int(sd.year))
            if ed is not None:
                years_set.add(int(ed.year))
        if not years_set:
            years_set.add(today.year)
        # Only include present years up to current year (no future, no filled gaps)
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
    Excludes Dropped. Completed count in completion month; completed worklets count as ongoing in months before their completion.
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
        now_d = date.today()
        year_start = date(selected_year, 1, 1)
        year_end = date(selected_year, 12, 31)

        for w in worklets:
            status_id = getattr(w, 'status_id', None)
            if status_id == 4:  # Dropped
                continue
            start_date_val = getattr(w, 'start_date', None)
            end_date_val = getattr(w, 'end_date', None)
            w_year = getattr(w, 'year', None)
            # Effective start
            start_eff = start_date_val if start_date_val is not None else (date(w_year, 1, 1) if w_year else None)

            # Effective end
            end_eff = end_date_val if end_date_val is not None else now_d

            # Clamp
            if start_eff is not None and start_eff < year_start:
                start_eff = year_start
            if end_eff is None or end_eff > year_end:
                end_eff = year_end

            for m in months:
                overlaps = (start_eff is not None and end_eff is not None and not (end_eff < m['start'] or start_eff > m['end']))
                if not overlaps:
                    continue
                if status_id == 2:  # Completed
                    if end_date_val is not None and (m['start'] <= end_date_val <= m['end']):
                        m['completed'] += 1
                    elif end_date_val is not None and m['end'] < date(end_date_val.year, end_date_val.month, monthrange(end_date_val.year, end_date_val.month)[1]):
                        m['ongoing'] += 1
                    elif end_date_val is None:
                        m['ongoing'] += 1
                elif status_id in (0, 1):  # To Start or On Going
                    m['ongoing'] += 1
                elif status_id == 3:  # On Hold
                    m['on_hold'] += 1
                elif False:
                    m['terminated'] += 1
                else:
                    m['ongoing'] += 1

        years_set: set[int] = set()
        for w in worklets:
            sd = getattr(w, 'start_date', None)
            ed = getattr(w, 'end_date', None)
            if sd is not None:
                years_set.add(int(sd.year))
            if ed is not None:
                years_set.add(int(ed.year))
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
        
        # Filter domains by year - get domains that have worklets active in that year
        year_start = date(year, 1, 1)
        year_end = date(year, 12, 31)
        
        # Get distinct domain IDs from worklets active in the year
        domain_ids = db.query(Worklet.tech_domain_id).distinct().filter(
            and_(
                Worklet.start_date <= year_end,
                or_(
                    Worklet.end_date >= year_start,
                    Worklet.end_date == None
                )
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
                    Worklet.start_date <= year_end,
                    or_(
                        Worklet.end_date >= year_start,
                        Worklet.end_date == None
                    )
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

