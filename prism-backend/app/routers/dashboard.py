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
def get_dashboard_statistics(year: int | None = None, db: Session = Depends(get_db)):
    """Get platform-wide dashboard statistics.
    When a year is provided, compute KPIs scoped to that year using active-window semantics:
      - total_worklets: worklets active at any point in the year (overlap)
      - completed_worklets: worklets with end_date in the year
      - ongoing_worklets: worklets active in the year and not completed/terminated within the year
      - total_mentors/students/professors: unique users associated to year-active worklets (by role)
      - publications: counts of papers/patents in that year
    Without year, returns overall totals.
    """
    try:
        today = date.today()
        selected_year = year

        def safe_count(q) -> int:
            try:
                return int(q.count())
            except Exception as e:
                print(f"[WARN] count failed: {e}")
                return 0

        # Normalize roles: trim + lower for robust matching
        role_norm_lower = lambda col: func.lower(func.trim(col))

        if selected_year is None:
            total_worklets = safe_count(db.query(Worklet))
            completed_worklets = safe_count(
                db.query(Worklet).filter(
                    and_(Worklet.status == "Completed", Worklet.completed_date.isnot(None))
                )
            )
            ongoing_worklets = safe_count(db.query(Worklet).filter(Worklet.status == "Ongoing"))

            total_mentors_users = safe_count(db.query(User).filter(role_norm_lower(User.role) == "mentor"))
            total_students_users = safe_count(db.query(User).filter(role_norm_lower(User.role) == "student"))
            total_professors_users = safe_count(db.query(User).filter(role_norm_lower(User.role) == "professor"))


            mentors_list = db.query(User.id, User.name).filter(role_norm_lower(User.role) == "mentor").all()
            students_list = db.query(User.id, User.name).filter(role_norm_lower(User.role) == "student").all()
            # Debug: show distinct role distribution in Users table
            role_distribution = db.query(User.role, func.count(User.id)).group_by(User.role).all()
            print(f"[DEBUG] Users role distribution: {role_distribution}")
            print(f"[DEBUG] Users table mentors: {len(mentors_list)} -> {[m.id for m in mentors_list]}")
            print(f"[DEBUG] Users table students: {len(students_list)} -> {[s.id for s in students_list]}")

            print("[DEBUG] All Years counts (Users table only):")
            print(
                f"  users_table: mentors={total_mentors_users}, students={total_students_users}, professors={total_professors_users}"
            )
            # Use Users table only
            total_mentors = total_mentors_users
            total_students = total_students_users
            total_professors = total_professors_users
            papers_count = safe_count(db.query(Paper))
            patents_count = safe_count(db.query(Patent))
        else:
            year_start = date(selected_year, 1, 1)
            year_end = date(selected_year, 12, 31)
            start_dt = datetime.combine(year_start, time.min)
            end_dt = datetime.combine(year_end, time.max)

            worklets = db.query(Worklet).all()

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
                    status = str(getattr(w, "status", "") or "")
                    completed_d = getattr(w, "completed_date", None)
                    if (
                        status == "Completed"
                        and completed_d is not None
                        and year_start <= completed_d <= year_end
                    ):
                        completed_in_year += 1
                    end_d = getattr(w, "end_date", None)
                    is_terminated_in_year = (
                        status == "Terminated"
                        and end_d is not None
                        and year_start <= end_d <= year_end
                    )
                    is_completed_in_year = (
                        status == "Completed"
                        and completed_d is not None
                        and year_start <= completed_d <= year_end
                    )
                    if not is_terminated_in_year and not is_completed_in_year:
                        ongoing_in_year += 1

            total_worklets = len(year_active_ids)
            completed_worklets = completed_in_year
            ongoing_worklets = ongoing_in_year

            total_mentors_active = safe_count(
                db.query(User).filter(
                    role_norm_lower(User.role) == "mentor",
                    User.created_at <= end_dt,
                    or_(User.active_till == None, User.active_till >= year_start),
                )
            )
            total_students_active = safe_count(
                db.query(User).filter(
                    role_norm_lower(User.role) == "student",
                    User.created_at <= end_dt,
                    or_(User.active_till == None, User.active_till >= year_start),
                )
            )
            total_professors_active = safe_count(
                db.query(User).filter(
                    role_norm_lower(User.role) == "professor",
                    User.created_at <= end_dt,
                    or_(User.active_till == None, User.active_till >= year_start),
                )
            )
            # Debug: show distinct role distribution among users active in year
            active_roles_dist = db.query(User.role, func.count(User.id)).filter(
                User.created_at <= end_dt,
                or_(User.active_till == None, User.active_till >= year_start),
            ).group_by(User.role).all()
            print(f"[DEBUG] Active-year Users role distribution ({selected_year}): {active_roles_dist}")

            # Users table only for year-specific totals
            print("[DEBUG] Year-specific counts (Users table only):")
            print(
                f"  active_window: mentors={total_mentors_active}, students={total_students_active}, professors={total_professors_active}"
            )

            total_mentors = total_mentors_active
            total_students = total_students_active
            total_professors = total_professors_active

            papers_count = db.query(Paper).filter(Paper.publication_year == selected_year).count()
            patents_count = db.query(Patent).filter(Patent.filing_year == selected_year).count()

        print("[DEBUG] Dashboard statistics computed:")
        print(f"  total_mentors: {total_mentors}")
        print(f"  total_worklets: {total_worklets}")
        print(f"  total_students: {total_students}")
        print(f"  ongoing_worklets: {ongoing_worklets}")
        print(f"  completed_worklets: {completed_worklets}")
        print(f"  total_professors: {total_professors}")
        print(f"  papers_count: {papers_count}")
        print(f"  patents_count: {patents_count}")
        print(
            f"  completion_rate: {round((completed_worklets / total_worklets * 100) if total_worklets > 0 else 0, 1)}"
        )
        return {
            "total_mentors": total_mentors,
            "total_worklets": total_worklets,
            "total_students": total_students,
            "ongoing_worklets": ongoing_worklets,
            "completed_worklets": completed_worklets,
            "completion_rate": round((completed_worklets / total_worklets * 100) if total_worklets > 0 else 0, 1),
            "total_professors": total_professors,
            "publications": {"papers": papers_count, "patents": patents_count},
        }
    except Exception as e:
        import traceback
        print("[ERROR] Exception in get_dashboard_statistics:")
        print(e)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/mentor/{mentor_id}/detailed-stats")
def get_mentor_detailed_stats(
    mentor_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get detailed statistics for a specific mentor (admin or self-access)"""
    try:
        # Allow access only if user is the mentor or has admin role
        if current_user.id != mentor_id and current_user.role not in ["Professor", "Admin"]:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Get mentor user
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
                "description": worklet.description,
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
        print(f"Error getting detailed mentor stats: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/platform-monthly-trends")
def get_platform_monthly_trends(
    year: int | None = None,
    db: Session = Depends(get_db)
):
    """Platform-wide monthly trends for a given year.
    For each month:
      - worklets: number of worklets active during that month (overlapping window)
      - completed: number of worklets whose end_date falls in that month
      - students: total student associations across active worklets for that month
    Uses Worklet.start_date and Worklet.end_date when available; if end missing, cap at today.
    """
    try:
        today = date.today()
        selected_year = year if year is not None else today.year

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

        # Pull all worklets
        worklets = db.query(Worklet).all()

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
            status = str(getattr(w, 'status', ''))
            w_year = getattr(w, 'year', None)

            # Effective start
            start_eff = start_date_val if start_date_val is not None else (date(w_year, 1, 1) if w_year else None)
            # Effective end
            if status == 'Completed':
                end_eff = end_date_val if end_date_val is not None else now_d
                completed_date = getattr(w, 'completed_date', None)
            else:
                end_eff = end_date_val if end_date_val is not None else now_d
                completed_date = None

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
                if completed_date is not None and (m['start'] <= completed_date <= m['end']):
                    m['completed'] += 1

        # Years list from actual dates only (start_date, end_date, completed_date), capped to current year
        years_set: set[int] = set()
        for w in worklets:
            sd = getattr(w, 'start_date', None)
            ed = getattr(w, 'end_date', None)
            cd = getattr(w, 'completed_date', None)
            if sd is not None:
                years_set.add(int(sd.year))
            if ed is not None:
                years_set.add(int(ed.year))
            if cd is not None:
                years_set.add(int(cd.year))
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
        print(f"Error computing platform monthly trends: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/platform-status-trends")
def get_platform_status_trends(
    year: int | None = None,
    db: Session = Depends(get_db)
):
    """Platform-wide monthly status trends for a given year.
    Excludes Dropped. Completed count in completion month; completed worklets count as ongoing in months before their completion.
    """
    try:
        today = date.today()
        selected_year = year if year is not None else today.year

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

        worklets = db.query(Worklet).all()
        now_d = date.today()
        year_start = date(selected_year, 1, 1)
        year_end = date(selected_year, 12, 31)

        for w in worklets:
            status = str(getattr(w, 'status', '') or '')
            if status == 'Dropped':
                continue
            start_date_val = getattr(w, 'start_date', None)
            end_date_val = getattr(w, 'end_date', None)
            w_year = getattr(w, 'year', None)
            # Effective start
            start_eff = start_date_val if start_date_val is not None else (date(w_year, 1, 1) if w_year else None)

            # Effective end
            end_eff = end_date_val if end_date_val is not None else now_d
            if status == 'Terminated':
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
                if status == 'Completed':
                    if end_date_val is not None and (m['start'] <= end_date_val <= m['end']):
                        m['completed'] += 1
                    elif end_date_val is not None and m['end'] < date(end_date_val.year, end_date_val.month, monthrange(end_date_val.year, end_date_val.month)[1]):
                        m['ongoing'] += 1
                    elif end_date_val is None:
                        m['ongoing'] += 1
                elif status in ('Ongoing', 'Approved'):
                    m['ongoing'] += 1
                elif status == 'On Hold':
                    m['on_hold'] += 1
                elif status == 'Terminated':
                    m['terminated'] += 1
                else:
                    m['ongoing'] += 1

        years_set: set[int] = set()
        for w in worklets:
            sd = getattr(w, 'start_date', None)
            ed = getattr(w, 'end_date', None)
            cd = getattr(w, 'completed_date', None)
            if sd is not None:
                years_set.add(int(sd.year))
            if ed is not None:
                years_set.add(int(ed.year))
            if cd is not None:
                years_set.add(int(cd.year))
        if not years_set:
            years_set.add(today.year)
        present_years = sorted([y for y in years_set if y <= today.year])

        return {
            "monthly": [{k: v for k, v in m.items() if k not in ("start", "end")} for m in months],
            "years": present_years
        }
    except Exception as e:
        print(f"Error computing platform status trends: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
