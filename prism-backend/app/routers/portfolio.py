from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.models import (
    User,
    Worklet,
    UserWorkletAssociation,
    Achievement,
    Paper,
    Patent,
    Commercialization,
)

router = APIRouter()

@router.get("/mentor/{mentor_id}")
def get_mentor_portfolio(mentor_id: int, db: Session = Depends(get_db), include_worklets: Optional[bool] = True):
    """Aggregate portfolio data for a mentor to drive the frontend portfolio page."""
    mentor = db.query(User).filter(User.id == mentor_id, User.role.in_(["Mentor", "Professor"])) .first()
    if not mentor:
        raise HTTPException(status_code=404, detail="Mentor not found")

    # New schema entities
    # MySQL doesn't support NULLS LAST syntax; emulate via COALESCE (treat NULL year as 0)
    achievements = (
        db.query(Achievement)
        .filter(Achievement.user_id == mentor_id)
        .order_by((Achievement.year.is_(None)).asc(), Achievement.year.desc(), Achievement.created_at.desc())
        .all()
    )
    papers = (
        db.query(Paper)
        .filter(Paper.user_id == mentor_id)
        .order_by((Paper.publication_year.is_(None)).asc(), Paper.publication_year.desc(), Paper.created_at.desc())
        .all()
    )
    patents = (
        db.query(Patent)
        .filter(Patent.user_id == mentor_id)
        .order_by((Patent.filing_year.is_(None)).asc(), Patent.filing_year.desc(), Patent.created_at.desc())
        .all()
    )
    commercializations = (
        db.query(Commercialization)
        .filter(Commercialization.user_id == mentor_id)
        .order_by((Commercialization.year.is_(None)).asc(), Commercialization.year.desc(), Commercialization.created_at.desc())
        .all()
    )

    worklets_data = []
    if include_worklets:
        # fetch worklets where mentor associated as Mentor
        associations = db.query(UserWorkletAssociation).filter(
            UserWorkletAssociation.user_id == mentor_id,
            UserWorkletAssociation.role_in_worklet == "Mentor"
        ).all()
        worklet_ids = [a.worklet_id for a in associations]
        if worklet_ids:
            worklets = db.query(Worklet).filter(Worklet.id.in_(worklet_ids)).all()
            for w in worklets:
                worklets_data.append({
                    "id": w.id,
                    "cert_id": w.cert_id,
                    "title": w.title,
                    "status": w.status,
                    "year": w.year,
                    "domain": w.domain,
                    "start_date": w.start_date.isoformat() if w.start_date else None,
                    "end_date": w.end_date.isoformat() if w.end_date else None,
                })

    def serialize(obj):
        """Serialize ORM object using mapped attribute keys (e.g., 'id' not underlying column name)."""
        data = {}
        for attr in obj.__mapper__.column_attrs:
            key = attr.key  # mapped attribute name
            data[key] = getattr(obj, key)
        return data

    return {
        "mentor": {
            "id": mentor.id,
            "name": mentor.name,
            "email": mentor.email,
            "role": mentor.role,
            "college": mentor.college,
        },
        "achievements": [serialize(a) for a in achievements],
        "papers": [serialize(p) for p in papers],
        "patents": [serialize(p) for p in patents],
        "commercializations": [serialize(c) for c in commercializations],
        "worklets": worklets_data,
        "stats": {
            "achievements_count": len(achievements),
            "papers_count": len(papers),
            "patents_count": len(patents),
            "commercializations_count": len(commercializations),
            "worklets_count": len(worklets_data),
        }
    }
