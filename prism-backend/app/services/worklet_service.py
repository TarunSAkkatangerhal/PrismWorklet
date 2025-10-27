"""
Worklet Service - Centralized business logic for worklet operations
This service layer consolidates duplicate logic from multiple routers
"""
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime, date
from app.models import Worklet, User, UserWorkletAssociation
from app.routers.helpers.worklet_helpers import (
    calculate_worklet_progress,
    get_worklet_college,
    get_worklet_students,
    map_status_text
)
import re


class WorkletService:
    """Centralized service for worklet operations"""
    
    @staticmethod
    def get_worklet_by_identifier(db: Session, identifier: str) -> Optional[Worklet]:
        """
        Get worklet by either integer ID or cert_id string
        
        Args:
            db: Database session
            identifier: Either numeric ID or cert_id string
            
        Returns:
            Worklet object or None
        """
        try:
            worklet_id = int(identifier)
            return db.query(Worklet).filter(Worklet.id == worklet_id).first()
        except ValueError:
            return db.query(Worklet).filter(Worklet.cert_id == identifier).first()
    
    @staticmethod
    def get_students_for_worklet(db: Session, worklet_id: int) -> List[Dict[str, Any]]:
        """
        Get all students associated with a worklet
        
        Args:
            db: Database session
            worklet_id: Worklet ID
            
        Returns:
            List of student dictionaries with name and email
        """
        students = (
            db.query(User.name, User.email)
            .join(UserWorkletAssociation, User.id == UserWorkletAssociation.user_id)
            .filter(
                UserWorkletAssociation.worklet_id == worklet_id,
                UserWorkletAssociation.role_in_worklet == "Student",
            )
            .all()
        )
        return [{"name": s.name, "email": s.email} for s in students if s.email]
    
    @staticmethod
    def get_mentors_for_worklet(db: Session, worklet_id: int) -> List[User]:
        """
        Get all mentors associated with a worklet
        
        Args:
            db: Database session
            worklet_id: Worklet ID
            
        Returns:
            List of User objects with mentor role
        """
        return (
            db.query(User)
            .join(UserWorkletAssociation, User.id == UserWorkletAssociation.user_id)
            .filter(
                UserWorkletAssociation.worklet_id == worklet_id,
                UserWorkletAssociation.role_in_worklet == "Mentor",
            )
            .all()
        )
    
    @staticmethod
    def get_professors_for_worklet(db: Session, worklet_id: int) -> List[User]:
        """
        Get all professors associated with a worklet
        
        Args:
            db: Database session
            worklet_id: Worklet ID
            
        Returns:
            List of User objects with professor role
        """
        return (
            db.query(User)
            .join(UserWorkletAssociation, User.id == UserWorkletAssociation.user_id)
            .filter(
                UserWorkletAssociation.worklet_id == worklet_id,
                UserWorkletAssociation.role_in_worklet == "Professor",
            )
            .all()
        )
    
    @staticmethod
    def extract_github_repo_name(github_url: Optional[str]) -> Optional[str]:
        """
        Extract repository name from GitHub URL
        
        Args:
            github_url: GitHub repository URL
            
        Returns:
            Repository name in format "owner/repo" or None
        """
        if not github_url or not isinstance(github_url, str):
            return None
        
        try:
            if 'github.com' in github_url:
                m = re.search(r"github\.com/([^/]+/[^/]+)", github_url)
                if m:
                    return m.group(1)
        except Exception:
            pass
        return None
    
    @staticmethod
    def derive_worklet_year(worklet: Worklet) -> Optional[int]:
        """
        Derive year from worklet dates
        
        Args:
            worklet: Worklet object
            
        Returns:
            Year integer or None
        """
        try:
            if getattr(worklet, "start_date", None):
                return worklet.start_date.year
            elif getattr(worklet, "end_date", None):
                return worklet.end_date.year
        except Exception:
            pass
        return None
    
    @staticmethod
    def format_worklet_detail(
        db: Session,
        worklet: Worklet,
        include_students: bool = True,
        include_mentors: bool = False,
        include_professors: bool = False,
        include_performance: bool = True
    ) -> Dict[str, Any]:
        """
        Format worklet with all details in a standardized way
        
        Args:
            db: Database session
            worklet: Worklet object
            include_students: Include student list
            include_mentors: Include mentor list
            include_professors: Include professor list
            include_performance: Include performance data
            
        Returns:
            Dictionary with formatted worklet data
        """
        # Calculate progress
        percentage_completion = calculate_worklet_progress(worklet)
        
        # Get status text
        status_text = map_status_text(getattr(worklet, 'status_id', None))
        
        # Get performance
        performance = getattr(worklet, 'Performance', None) if include_performance else None
        
        # Derive year
        derived_year = WorkletService.derive_worklet_year(worklet)
        
        # Get GitHub info
        github_url = getattr(worklet, 'github_url', None)
        repo_name = WorkletService.extract_github_repo_name(github_url)
        
        # Build base response
        response = {
            "id": worklet.id,
            "cert_id": str(worklet.cert_id) if getattr(worklet, 'cert_id', None) is not None else str(worklet.id),
            "title": worklet.title,
            "description": getattr(worklet, "problem_statement", None),
            "start_date": worklet.start_date.isoformat() if worklet.start_date else None,
            "end_date": worklet.end_date.isoformat() if worklet.end_date else None,
            "created_at": worklet.created_at.isoformat() if getattr(worklet, "created_at", None) else None,
            "updated_at": worklet.updated_at.isoformat() if getattr(worklet, "updated_at", None) else None,
            "year": derived_year if derived_year is not None else datetime.utcnow().year,
            "domain": getattr(worklet, "domain", None),
            "status": status_text,
            "percentage_completion": percentage_completion,
            "worklet_progress": percentage_completion,
            "problem_statement": getattr(worklet, "problem_statement", None),
            "expectation": getattr(worklet, "expectation", None),
            "prerequisites": getattr(worklet, "prerequisites", None),
            "college_id": getattr(worklet, 'college_id', None),
            "college": worklet.college_rel.college_name if getattr(worklet, 'college_rel', None) else None,
            "github_repo_url": github_url,
            "github_repo": repo_name,
        }
        
        # Add performance if requested
        if include_performance:
            response["performance"] = performance
        
        # Add students if requested
        if include_students:
            students = get_worklet_students(db, worklet.id)
            response["students"] = [s.name for s in students if s.name]
            response["student_count"] = len(students)
        
        # Add mentors if requested
        if include_mentors:
            mentors = WorkletService.get_mentors_for_worklet(db, worklet.id)
            response["mentors"] = mentors
            response["mentor_count"] = len(mentors)
        
        # Add professors if requested
        if include_professors:
            professors = WorkletService.get_professors_for_worklet(db, worklet.id)
            response["professors"] = [p.name for p in professors if getattr(p, "name", None)]
            response["professor_count"] = len(professors)
        
        return response
    
    @staticmethod
    def get_worklets_for_mentor(
        db: Session,
        mentor_id: int,
        status_filter: Optional[str] = None,
        include_performance: bool = True
    ) -> Dict[str, Any]:
        """
        Get all worklets for a mentor with filtering options
        
        Args:
            db: Database session
            mentor_id: Mentor user ID
            status_filter: Optional status filter ("ongoing", "completed", or None)
            include_performance: Include performance data
            
        Returns:
            Dictionary with worklets and statistics
        """
        # Verify mentor exists
        mentor = db.query(User).filter(
            User.id == mentor_id,
            User.role.in_(["Mentor", "mentor"])
        ).first()
        
        if not mentor:
            return None
        
        # Get all worklet associations for this mentor
        associations = db.query(UserWorkletAssociation).filter(
            UserWorkletAssociation.user_id == mentor_id,
            UserWorkletAssociation.role_in_worklet.in_(["Mentor", "mentor"])
        ).all()
        
        all_worklets = []
        all_student_ids = set()
        
        for assoc in associations:
            worklet = assoc.worklet
            status_id = getattr(worklet, 'status_id', None)
            
            # Apply status filter
            if status_filter:
                if status_filter.lower() == "ongoing" and status_id != 1:
                    continue
                elif status_filter.lower() == "completed" and status_id != 2:
                    continue
            
            # Get students for this worklet
            students = get_worklet_students(db, worklet.id)
            
            # Collect unique student IDs
            for s in students:
                if s.id is not None:
                    all_student_ids.add(s.id)
            
            # Get college info
            worklet_college, college_id = get_worklet_college(worklet, students, mentor)
            
            # Calculate progress
            percentage_completion = calculate_worklet_progress(worklet)
            
            # Get status text
            status_text = map_status_text(status_id)
            
            # Get performance
            performance = getattr(worklet, 'Performance', None) if include_performance else None
            
            # Get GitHub info
            github_url = getattr(worklet, 'github_url', None)
            repo_name = WorkletService.extract_github_repo_name(github_url)
            
            worklet_data = {
                "id": worklet.id,
                "cert_id": worklet.cert_id,
                "title": getattr(worklet, "title", None),
                "description": getattr(worklet, "problem_statement", None),
                "status": status_text,
                "college_id": college_id,
                "college": worklet_college,
                "problem_statement": getattr(worklet, "problem_statement", None),
                "expectation": getattr(worklet, "expectation", None),
                "prerequisites": getattr(worklet, "prerequisites", None),
                "worklet_progress": getattr(worklet, "worklet_progress", None),
                "percentage_completion": percentage_completion,
                "performance": performance,
                "students": [s.name for s in students if s.name],
                "start_date": worklet.start_date.isoformat() if worklet.start_date else None,
                "end_date": worklet.end_date.isoformat() if worklet.end_date else None,
                "github_repo_url": github_url,
                "github_repo": repo_name,
            }
            
            all_worklets.append(worklet_data)
        
        # Separate by status
        ongoing = [w for w in all_worklets if w.get("status") == "Ongoing"]
        completed = [w for w in all_worklets if w.get("status") == "Completed"]
        
        return {
            "mentor_id": mentor_id,
            "mentor_name": mentor.name,
            "total_worklets": len(all_worklets),
            "total_mentees": len(all_student_ids),
            "worklets": all_worklets,
            "ongoing_worklets": ongoing,
            "completed_worklets": completed,
            "total_ongoing": len(ongoing),
            "total_completed": len(completed)
        }
    
    @staticmethod
    def get_worklets_for_student(
        db: Session,
        student_id: int
    ) -> List[Dict[str, Any]]:
        """
        Get all worklets for a student
        
        Args:
            db: Database session
            student_id: Student user ID
            
        Returns:
            List of worklet dictionaries
        """
        # Get student
        student = db.query(User).filter(User.id == student_id).first()
        if not student:
            return []
        
        # Get worklets via associations
        query = (
            db.query(Worklet)
            .join(UserWorkletAssociation, Worklet.id == UserWorkletAssociation.worklet_id)
            .filter(
                UserWorkletAssociation.user_id == student_id,
                UserWorkletAssociation.role_in_worklet == "Student",
            )
        )
        
        worklets = query.all()
        response = []
        
        for w in worklets:
            # Calculate progress
            progress = calculate_worklet_progress(w)
            
            # Get college
            college_id = getattr(w, 'college_id', None)
            college_name = w.college_rel.college_name if getattr(w, 'college_rel', None) else None
            if college_name is None:
                college_id = getattr(student, "college_id", None)
                college_name = getattr(student, "college", None)
            
            # Get status
            status_text = map_status_text(getattr(w, 'status_id', None))
            
            # Derive year
            derived_year = WorkletService.derive_worklet_year(w)
            
            response.append({
                'id': w.id,
                'cert_id': w.cert_id,
                'title': w.title,
                'description': getattr(w, 'problem_statement', None),
                'start_date': w.start_date,
                'end_date': w.end_date,
                'created_at': w.created_at,
                'updated_at': w.updated_at,
                'year': derived_year if derived_year is not None else datetime.utcnow().year,
                'domain': getattr(w, 'domain', None),
                'status': status_text,
                'worklet_progress': progress,
                'college_id': college_id,
                'college': college_name,
            })
        
        return response
