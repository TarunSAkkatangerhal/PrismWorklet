from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_, func, case
from app.database import get_db
from app.models import User, Worklet, UserWorkletAssociation
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from app.core.config import settings
from datetime import datetime, timedelta, date
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
def get_dashboard_statistics(db: Session = Depends(get_db)):
    """Get platform-wide dashboard statistics"""
    try:
        # Count totals
        total_mentors = db.query(User).filter(User.role == "Mentor").count()
        total_worklets = db.query(Worklet).count()
        total_students = db.query(User).filter(User.role == "Student").count()
        
        # Count by status
        ongoing_worklets = db.query(Worklet).filter(Worklet.status == "Ongoing").count()
        completed_worklets = db.query(Worklet).filter(Worklet.status == "Completed").count()
        
        return {
            "total_mentors": total_mentors,
            "total_worklets": total_worklets,
            "total_students": total_students,
            "ongoing_worklets": ongoing_worklets,
            "completed_worklets": completed_worklets,
            "completion_rate": round((completed_worklets / total_worklets * 100) if total_worklets > 0 else 0, 1)
        }
    except Exception as e:
        print(f"Error getting dashboard statistics: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/mentor-status-trends")
def get_mentor_status_trends(
    year: int | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Monthly status trends for the logged-in mentor for a given year.
        Rules:
      - Exclude 'Dropped' entirely.
      - Completed worklets count as 'ongoing' for all months BEFORE their completion month,
        and count as 'completed' in the completion month.
      - Ongoing/Approved worklets count as 'ongoing' for months they overlap.
      - On Hold worklets count as 'on_hold' for months they overlap.
            - If status is 'Terminated' (if present), count in 'terminated' for months they overlap.
            - Use actual Worklet.end_date when available; otherwise cap active windows at "today" (do not extend to end of year).
            - If dates are missing, derive start from Worklet.year-01-01 when available.
    Returns a list of 12 months (Jan..Dec) with counts and an ordered index for stable sorting, plus a suggested list of years.
    """
    try:
        mentor_id = current_user.id

        # Associations for this mentor
        mentor_associations = db.query(UserWorkletAssociation).filter(
            and_(
                UserWorkletAssociation.user_id == mentor_id,
                UserWorkletAssociation.role_in_worklet == 'Mentor'
            )
        ).all()

        today = date.today()
        selected_year = year if year is not None else today.year

        # Helper to prebuild months for the selected year
        def build_months(y: int):
            arr = []
            for m in range(1, 13):
                last_day = monthrange(y, m)[1]
                start_d = date(y, m, 1)
                end_d = date(y, m, last_day)
                label = start_d.strftime('%b %Y')
                arr.append({
                    "month": label,
                    "month_key": f"{start_d.year:04d}-{start_d.month:02d}",
                    "start": start_d,
                    "end": end_d,
                    "completed": 0,
                    "ongoing": 0,
                    "on_hold": 0,
                    "terminated": 0,
                })
            for idx, m in enumerate(arr):
                m["order"] = idx
            return arr

        # No data – return zeros for the selected year
        if not mentor_associations:
            months = build_months(selected_year)
            return {
                "monthly": [{k: v for k, v in m.items() if k not in ("start", "end") } for m in months],
                "years": [selected_year]
            }

        worklet_ids = [a.worklet_id for a in mentor_associations]
        worklets = db.query(Worklet).filter(Worklet.id.in_(worklet_ids)).all()

        months = build_months(selected_year)
        year_start = date(selected_year, 1, 1)
        year_end = date(selected_year, 12, 31)

        # Compute counts per month per worklet
        now_d = date.today()
        for w in worklets:
            status = str(getattr(w, 'status', '') or '')
            if status == 'Dropped':
                # Skip dropped entirely
                continue

            start_date_val = getattr(w, 'start_date', None)
            end_date_val = getattr(w, 'end_date', None)
            w_year = getattr(w, 'year', None)

            # Effective start
            start_eff = start_date_val if start_date_val is not None else (date(w_year, 1, 1) if w_year else None)

            updated_at_dt = getattr(w, 'updated_at', None)
            updated_at_date = None
            try:
                if updated_at_dt is not None:
                    updated_at_date = updated_at_dt.date()
            except Exception:
                updated_at_date = None

            # Effective end depending on status
            if status == 'Completed':
                # active window for ongoing-before-complete ends at completion (fallback to updated_at or today)
                end_eff = end_date_val if end_date_val is not None else (updated_at_date or now_d)
            elif status in ('Ongoing', 'Approved'):
                # Use real end when available; otherwise cap at today
                end_eff = end_date_val if end_date_val is not None else now_d
            elif status == 'On Hold':
                end_eff = end_date_val if end_date_val is not None else now_d
            elif status == 'Terminated':
                end_eff = end_date_val if end_date_val is not None else (updated_at_date or now_d)
            else:
                # Unknown/other statuses: stop at real end if present, else today
                end_eff = end_date_val if end_date_val is not None else now_d

            # Clamp to selected year bounds
            if start_eff is not None and start_eff < year_start:
                start_eff = year_start
            if end_eff is None or end_eff > year_end:
                end_eff = year_end

            # For each month, add to appropriate bucket(s)
            for m in months:
                overlaps = (start_eff is not None and end_eff is not None and not (end_eff < m['start'] or start_eff > m['end']))
                if not overlaps:
                    continue

                if status == 'Completed':
                    # Completed counts as ongoing for months strictly before completion month
                    if end_date_val is not None and (m['start'] <= end_date_val <= m['end']):
                        m['completed'] += 1
                    elif end_date_val is not None and m['end'] < date(end_date_val.year, end_date_val.month, monthrange(end_date_val.year, end_date_val.month)[1]):
                        # Months strictly before completion
                        m['ongoing'] += 1
                    elif end_date_val is None:
                        # No end date: treat entirely as ongoing
                        m['ongoing'] += 1
                elif status in ('Ongoing', 'Approved'):
                    m['ongoing'] += 1
                elif status == 'On Hold':
                    m['on_hold'] += 1
                elif status == 'Terminated':
                    m['terminated'] += 1
                else:
                    # Default to ongoing for overlapping months
                    m['ongoing'] += 1

        # Build available years set
        years_set: set[int] = set()
        for w in worklets:
            if getattr(w, 'year', None) is not None:
                years_set.add(int(getattr(w, 'year')))
            if getattr(w, 'start_date', None) is not None:
                years_set.add(int(getattr(w, 'start_date').year))
            if getattr(w, 'end_date', None) is not None:
                years_set.add(int(getattr(w, 'end_date').year))
        if not years_set:
            years_set.add(selected_year)

        return {
            "monthly": [{k: v for k, v in m.items() if k not in ("start", "end")} for m in months],
            "years": sorted(years_set)
        }
    except Exception as e:
        print(f"Error computing mentor status trends: {e}")
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

@router.get("/mentor-monthly-trends")
def get_mentor_monthly_trends(
    year: int | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Return last 12 months trends for the logged-in mentor.
    For each month:
      - worklets: number of mentor's worklets active during that month (overlaps window)
      - completed: number of mentor's completed worklets whose end_date falls in that month
      - students: sum of distinct student associations across active worklets for that month
    Uses Worklet.start_date and Worklet.end_date when available.
    """
    try:
        mentor_id = current_user.id

        # Get mentor's worklet associations
        mentor_associations = db.query(UserWorkletAssociation).filter(
            and_(
                UserWorkletAssociation.user_id == mentor_id,
                UserWorkletAssociation.role_in_worklet == 'Mentor'
            )
        ).all()

        if not mentor_associations:
            # Build empty series with explicit ordering to guarantee chronological display
            today = date.today()
            selected_year = year if year is not None else today.year
            months: list[dict] = []
            for m in range(1, 13):
                last_day = monthrange(selected_year, m)[1]
                start_d = date(selected_year, m, 1)
                end_d = date(selected_year, m, last_day)
                label = start_d.strftime('%b %Y')
                months.append({
                    "month": label,
                    "month_key": f"{start_d.year:04d}-{start_d.month:02d}",
                    "start": start_d,
                    "end": end_d,
                    "worklets": 0,
                    "completed": 0,
                    "students": 0
                })
            for idx, m in enumerate(months):
                m["order"] = idx
            return {
                "monthly": [{"month": m["month"], "worklets": 0, "completed": 0, "students": 0, "order": m["order"], "month_key": m["month_key"]} for m in months],
                "years": [selected_year]
            }

        worklet_ids = [assoc.worklet_id for assoc in mentor_associations]
        worklets = db.query(Worklet).filter(Worklet.id.in_(worklet_ids)).all()

        # Precompute student counts per worklet
        student_counts = {}
        for wid in worklet_ids:
            cnt = db.query(UserWorkletAssociation).filter(
                and_(
                    UserWorkletAssociation.worklet_id == wid,
                    UserWorkletAssociation.role_in_worklet == 'Student'
                )
            ).count()
            student_counts[wid] = cnt

        # Build last 12 months windows
        # Build month windows based on query param (year) or last 12 months
        today = date.today()
        months: list[dict] = []
        # Always construct months for full Jan..Dec for the selected year (default current year)
        selected_year = year if year is not None else today.year
        for m in range(1, 13):
            last_day = monthrange(selected_year, m)[1]
            start_d = date(selected_year, m, 1)
            end_d = date(selected_year, m, last_day)
            label = start_d.strftime('%b %Y')
            months.append({
                "month": label,
                "month_key": f"{start_d.year:04d}-{start_d.month:02d}",
                "start": start_d,
                "end": end_d,
                "worklets": 0,
                "completed": 0,
                "students": 0
            })

        # Tally metrics using real end times:
        # - Ongoing: use end_date if present, else cap at today
        # - Completed: use end_date as the completed date; if null, do NOT count as completed, cap active window at today
        # - Other statuses: treat as active up to end_date if present, otherwise up to today
        now_d = date.today()
        year_start = date(selected_year, 1, 1)
        year_end = date(selected_year, 12, 31)
        for w in worklets:
            start_date_val = getattr(w, 'start_date', None)  # Date or None
            end_date_val = getattr(w, 'end_date', None)      # Date or None
            status = str(getattr(w, 'status', None))
            wid = getattr(w, 'id', None)
            stud_count = student_counts.get(wid, 0)
            w_year = getattr(w, 'year', None)
            updated_at_dt = getattr(w, 'updated_at', None)
            updated_at_date = None
            try:
                if updated_at_dt is not None:
                    updated_at_date = updated_at_dt.date()
            except Exception:
                updated_at_date = None

            # Derive effective start (date)
            start_eff = start_date_val if start_date_val is not None else (date(w_year, 1, 1) if w_year is not None else None)

            # Derive effective end based on status semantics (date)
            if status == 'Ongoing':
                # Use end_date when present; otherwise only until today
                end_eff = end_date_val if end_date_val is not None else now_d
                completed_date = None
            elif status == 'Completed':
                # Use real end_date if present; otherwise fallback to updated_at date if available, else today
                eff_completed = end_date_val if end_date_val is not None else (updated_at_date or now_d)
                end_eff = eff_completed
                completed_date = end_date_val or updated_at_date  # only mark completed if we have a concrete date
            else:
                # Dropped, On Hold, Approved, etc.: stop at real end if present, else today
                end_eff = end_date_val if end_date_val is not None else now_d
                completed_date = None

            # Clamp effective range to the selected year's window
            if start_eff is not None and start_eff < year_start:
                start_eff = year_start
            if end_eff is None or end_eff > year_end:
                end_eff = year_end

            for m in months:
                # Active overlap during month window using strict bounds
                active = (start_eff is not None and end_eff is not None and not (end_eff < m['start'] or start_eff > m['end']))
                if active:
                    m['worklets'] += 1
                    m['students'] += stud_count
                # Completed in month only when we have a real completed_date
                if completed_date is not None and (m['start'] <= completed_date <= m['end']):
                    m['completed'] += 1

        # add order index for deterministic frontend sorting
        for idx, m in enumerate(months):
            m["order"] = idx

        # Build available years based on mentor's worklets
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
        years_list = sorted(years_set)

        return {
            "monthly": [{
                "month": m['month'],
                "worklets": m['worklets'],
                "completed": m['completed'],
                "students": m['students'],
                "order": m['order'],
                "month_key": m['month_key']
            } for m in months],
            "years": years_list
        }
    except Exception as e:
        print(f"Error computing mentor monthly trends: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/admin/fix-worklet-dates")
def admin_fix_worklet_dates(
    start_mm_dd: str = "01-15",
    completed_mm_dd: str = "06-30",
    ongoing_mm_dd: str = "12-31",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Admin/Professor-only: Fill missing start_date/end_date using Worklet.year and status.
    - start_date: year-start_mm_dd when start_date is NULL and year present
    - end_date: year-completed_mm_dd when status='Completed' and end_date is NULL
    - end_date: year-ongoing_mm_dd when status='Ongoing' and end_date is NULL

    Query params (optional):
      start_mm_dd (default 01-15), completed_mm_dd (default 06-30), ongoing_mm_dd (default 12-31)
    """
    # Authorization: only Admin or Professor can run bulk fixes
    if current_user.role not in ["Admin", "Professor"]:
        raise HTTPException(status_code=403, detail="Access denied: Admin or Professor role required")

    def make_date(y: int, mmdd: str) -> date:
        try:
            mm, dd = mmdd.split("-")
            return date(int(y), int(mm), int(dd))
        except Exception:
            raise HTTPException(status_code=400, detail=f"Invalid mm-dd value: {mmdd}")

    updated_start = 0
    updated_end = 0
    skipped_no_year = 0

    try:
        worklets = db.query(Worklet).all()
        for w in worklets:
            # year is required to synthesize dates
            if w.year is None:
                if w.start_date is None or w.end_date is None:
                    skipped_no_year += 1
                continue

            # Fill missing start_date
            if w.start_date is None:
                try:
                    w.start_date = make_date(w.year, start_mm_dd)
                    updated_start += 1
                except HTTPException:
                    raise

            # Fill missing end_date depending on status
            if w.end_date is None:
                if str(w.status) == 'Completed':
                    w.end_date = make_date(w.year, completed_mm_dd)
                    updated_end += 1
                elif str(w.status) == 'Ongoing':
                    w.end_date = make_date(w.year, ongoing_mm_dd)
                    updated_end += 1
                # Other statuses: leave as NULL unless explicitly desired

        db.commit()

        return {
            "updated_start_dates": updated_start,
            "updated_end_dates": updated_end,
            "skipped_due_to_missing_year": skipped_no_year,
            "total_processed": len(worklets)
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fixing worklet dates: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Internal server error")
