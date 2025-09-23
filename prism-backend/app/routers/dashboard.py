from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_, func, case
from app.database import get_db
from app.models import User, Worklet, UserWorkletAssociation
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from app.core.config import settings

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
                UserWorkletAssociation.role_in_worklet == 'Mentor',
                UserWorkletAssociation.is_active == True
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
        status_counts = {
            "Ongoing": 0,
            "Completed": 0,
            "On Hold": 0,
            "Not Started": 0
        }
        
        for assoc in mentor_associations:
            completion_status = assoc.completion_status or "Not Started"
            if completion_status == "In Progress":
                status_counts["Ongoing"] += 1
            elif completion_status in status_counts:
                status_counts[completion_status] += 1
            else:
                status_counts["Not Started"] += 1
        
        # Count students assigned to mentor's worklets
        student_count = db.query(UserWorkletAssociation).filter(
            and_(
                UserWorkletAssociation.worklet_id.in_(worklet_ids),
                UserWorkletAssociation.role_in_worklet == 'Student',
                UserWorkletAssociation.is_active == True
            )
        ).count()
        
        # Calculate average progress
        progress_values = [assoc.progress_percentage for assoc in mentor_associations if assoc.progress_percentage is not None]
        avg_progress = round(sum(progress_values) / len(progress_values)) if progress_values else 0
        
        # Count high priority (worklets with low progress or high risk)
        high_priority = 0
        for worklet in mentor_worklets:
            if (worklet.percentage_completion and worklet.percentage_completion < 50) or \
               (worklet.risk_status and worklet.risk_status == "High Risk"):
                high_priority += 1
        
        # Performance analysis based on progress and worklet metrics
        performance_counts = {
            "Excellent": 0,
            "Very Good": 0, 
            "Good": 0,
            "Needs Attention": 0
        }
        
        for assoc in mentor_associations:
            progress = assoc.progress_percentage or 0
            if progress >= 90:
                performance_counts["Excellent"] += 1
            elif progress >= 75:
                performance_counts["Very Good"] += 1
            elif progress >= 50:
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
            # Determine risk based on progress and timeline
            progress = worklet.percentage_completion or 0
            if progress < 30:
                risk_data["High Risk"] += 1
            elif progress < 70:
                risk_data["Medium Risk"] += 1
            else:
                risk_data["Low Risk"] += 1
        
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
                "active_worklets": len([a for a in mentor_associations if a.completion_status in ["In Progress", "Not Started"]])
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
                "description": worklet.description,
                "status": worklet.status,
                "completion_status": assoc.completion_status,
                "progress_percentage": assoc.progress_percentage or 0,
                "student_count": students,
                "assigned_at": assoc.assigned_at.isoformat() if assoc.assigned_at else None,
                "notes": assoc.notes,
                "team": worklet.team,
                "college": worklet.college
            }
            
            worklets_detail.append(worklet_info)
            
            if assoc.progress_percentage is not None:
                total_progress += assoc.progress_percentage
                progress_count += 1
        
        avg_progress = round(total_progress / progress_count) if progress_count > 0 else 0
        
        return {
            "mentor": {
                "id": mentor.id,
                "name": mentor.name,
                "email": mentor.email,
                "team": mentor.team,
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