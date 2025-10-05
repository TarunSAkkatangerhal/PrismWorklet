from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_, func, case
from app.database import get_db
from app.models import User, Worklet, UserWorkletAssociation, Paper, Patent
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from app.core.config import settings
from datetime import date
from calendar import monthrange

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

        if selected_year is None:
            # Overall totals (no year filter)
            total_worklets = db.query(Worklet).count()
            completed_worklets = db.query(Worklet).filter(Worklet.status == "Completed").count()
            ongoing_worklets = db.query(Worklet).filter(Worklet.status == "Ongoing").count()
            total_mentors = db.query(User).filter(User.role == "Mentor").count()
            total_students = db.query(User).filter(User.role == "Student").count()
            total_professors = db.query(User).filter(User.role == "Professor").count()
            papers_count = db.query(Paper).count()
            patents_count = db.query(Patent).count()
        else:
            year_start = date(selected_year, 1, 1)
            year_end = date(selected_year, 12, 31)

            worklets = db.query(Worklet).all()
            def effective_window(w: Worklet):
                w_year = getattr(w, 'year', None)
                s = getattr(w, 'start_date', None) or (date(w_year, 1, 1) if w_year else None)
                e = getattr(w, 'end_date', None) or today
                # Clamp to the year window to evaluate overlap
                return s, e

            # Determine which worklets were active at any point in the year
            year_active_ids: set[int] = set()
            completed_in_year = 0
            ongoing_in_year = 0
            for w in worklets:
                s, e = effective_window(w)
                if s is None:
                    continue
                # Overlap check
                if not (e < year_start or s > year_end):
                    year_active_ids.add(w.id)
                    status = str(getattr(w, 'status', '') or '')
                    end_d = getattr(w, 'end_date', None)
                    # Completed count: end_date within year
                    if end_d is not None and year_start <= end_d <= year_end:
                        completed_in_year += 1
                    # Ongoing: active during year but not completed/terminated within the year
                    is_terminated_in_year = (status == 'Terminated' and end_d is not None and year_start <= end_d <= year_end)
                    is_completed_in_year = (status == 'Completed' and end_d is not None and year_start <= end_d <= year_end)
                    if not is_terminated_in_year and not is_completed_in_year:
                        ongoing_in_year += 1

            total_worklets = len(year_active_ids)
            completed_worklets = completed_in_year
            ongoing_worklets = ongoing_in_year

            # Unique user counts by role tied to year-active worklets
            total_mentors = 0
            total_students = 0
            total_professors = 0
            if year_active_ids:
                assocs = db.query(UserWorkletAssociation).filter(UserWorkletAssociation.worklet_id.in_(list(year_active_ids))).all()
                mentor_ids = {a.user_id for a in assocs if str(a.role_in_worklet) == 'Mentor'}
                student_ids = {a.user_id for a in assocs if str(a.role_in_worklet) == 'Student'}
                professor_ids = {a.user_id for a in assocs if str(a.role_in_worklet) == 'Professor'}
                total_mentors = len(mentor_ids)
                total_students = len(student_ids)
                total_professors = len(professor_ids)

            # Publications within year
            papers_count = db.query(Paper).filter(Paper.publication_year == selected_year).count()
            patents_count = db.query(Patent).filter(Patent.filing_year == selected_year).count()

        return {
            "total_mentors": total_mentors,
            "total_worklets": total_worklets,
            "total_students": total_students,
            "ongoing_worklets": ongoing_worklets,
            "completed_worklets": completed_worklets,
            "completion_rate": round((completed_worklets / total_worklets * 100) if total_worklets > 0 else 0, 1),
            "total_professors": total_professors,
            "publications": {
                "papers": papers_count,
                "patents": patents_count
            }
        }
    except Exception as e:
        print(f"Error getting dashboard statistics: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/mentor-statistics")
def get_mentor_statistics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get statistics specific to the logged-in mentor"""
    try:
        mentor_id = current_user.id
        
        # Get mentor's worklet associations
        mentor_associations = db.query(UserWorkletAssociation).filter(
            and_(
                UserWorkletAssociation.user_id == mentor_id,
                UserWorkletAssociation.role_in_worklet == 'Mentor'
            )
        ).all()
        
        worklet_ids = [assoc.worklet_id for assoc in mentor_associations]
        
        if not worklet_ids:
            # Mentor has no worklets
            return {
                "status_counts": {
                    "Ongoing": 0,
                    "Completed": 0,
                    "On Hold": 0,
                    "Not Started": 0
                },
                "engagement_data": {
                    "My Worklets": 0,
                    "My Students": 0,
                    "Avg Progress": 0,
                    "High Priority": 0,
                    "Papers Published": 0,
                    "Patents Filed": 0
                },
                "performance_counts": {
                    "Excellent": 0,
                    "Very Good": 0,
                    "Good": 0,
                    "Needs Attention": 0
                },
                "risk_data": {
                    "High Risk": 0,
                    "Medium Risk": 0,
                    "Low Risk": 0
                }
            }
        
        # Get worklets for this mentor
        mentor_worklets = db.query(Worklet).filter(Worklet.id.in_(worklet_ids)).all()
        
        # Count by completion status from associations
        # Status buckets are simplified based on Worklet.status
        status_counts = {"Ongoing": 0, "Completed": 0, "On Hold": 0}
        for assoc in mentor_associations:
            w = db.query(Worklet).filter(Worklet.id == assoc.worklet_id).first()
            if not w:
                continue
            if str(w.status) in status_counts:
                status_counts[str(w.status)] += 1
        
        # Count students assigned to mentor's worklets
        student_count = db.query(UserWorkletAssociation).filter(
            and_(
                UserWorkletAssociation.worklet_id.in_(worklet_ids),
                UserWorkletAssociation.role_in_worklet == 'Student'
            )
        ).count()
        
        # Calculate average progress
        # Placeholder: progress no longer tracked on association
        avg_progress = 0
        
        # Count high priority (worklets with low progress or high risk)
        high_priority = 0
        for worklet in mentor_worklets:
            # Placeholder for risk/priority
            if worklet.status == 'Ongoing':
                high_priority += 1
        
        # Performance analysis based on progress and worklet metrics
        performance_counts = {
            "Excellent": 0,
            "Very Good": 0, 
            "Good": 0,
            "Needs Attention": 0
        }
        
        # Placeholder performance bucketing based on worklet status
        for assoc in mentor_associations:
            w = db.query(Worklet).filter(Worklet.id == assoc.worklet_id).first()
            if not w:
                continue
            if w.status == 'Completed':
                performance_counts["Excellent"] += 1
            elif w.status == 'Ongoing':
                performance_counts["Good"] += 1
            else:
                performance_counts["Needs Attention"] += 1
        
        # Risk analysis based on worklet data
        risk_data = {
            "High Risk": 0,
            "Medium Risk": 0,
            "Low Risk": 0
        }
        
        for worklet in mentor_worklets:
            # Simple placeholder risk mapping
            if worklet.status == 'Ongoing':
                risk_data["Medium Risk"] += 1
            elif worklet.status == 'Completed':
                risk_data["Low Risk"] += 1
            else:
                risk_data["High Risk"] += 1
        
        # Mock data for papers and patents (could be enhanced with real tracking)
        papers_published = len([w for w in mentor_worklets if w.status == "Completed"]) // 2
        patents_filed = len([w for w in mentor_worklets if w.status == "Completed"]) // 3
        
        return {
            "status_counts": status_counts,
            "engagement_data": {
                "My Worklets": len(mentor_associations),
                "My Students": student_count,
                "Avg Progress": avg_progress,
                "High Priority": high_priority,
                "Papers Published": papers_published,
                "Patents Filed": patents_filed
            },
            "performance_counts": performance_counts,
            "risk_data": risk_data,
            "mentor_info": {
                "name": current_user.name,
                "email": current_user.email,
                "total_worklets": len(mentor_associations),
                "active_worklets": len([a for a in mentor_associations])
            }
        }
        
    except Exception as e:
        print(f"Error getting mentor statistics: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

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
                UserWorkletAssociation.role_in_worklet == 'Mentor',
                UserWorkletAssociation.is_active == True
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
                    UserWorkletAssociation.role_in_worklet == 'Student',
                    UserWorkletAssociation.is_active == True
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
                completed_date = end_date_val
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

        # Years list from worklets
        years_set: set[int] = set()
        for w in worklets:
            if getattr(w, 'year', None) is not None:
                years_set.add(int(getattr(w, 'year')))
            if getattr(w, 'start_date', None) is not None:
                years_set.add(int(getattr(w, 'start_date').year))
            if getattr(w, 'end_date', None) is not None:
                years_set.add(int(getattr(w, 'end_date').year))
        if not years_set:
            years_set.add(today.year)

        return {
            "monthly": [{
                "month": m['month'],
                "worklets": m['worklets'],
                "completed": m['completed'],
                "students": m['students'],
                "order": m['order'],
                "month_key": m['month_key']
            } for m in months],
            "years": sorted(years_set)
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
            if getattr(w, 'year', None) is not None:
                years_set.add(int(getattr(w, 'year')))
            if getattr(w, 'start_date', None) is not None:
                years_set.add(int(getattr(w, 'start_date').year))
            if getattr(w, 'end_date', None) is not None:
                years_set.add(int(getattr(w, 'end_date').year))
        if not years_set:
            years_set.add(today.year)

        return {
            "monthly": [{k: v for k, v in m.items() if k not in ("start", "end")} for m in months],
            "years": sorted(years_set)
        }
    except Exception as e:
        print(f"Error computing platform status trends: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
