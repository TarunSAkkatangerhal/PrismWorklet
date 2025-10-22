from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Request
from fastapi.responses import JSONResponse
import os
import json
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
from app.auth import oauth2_scheme, require_access_token

router = APIRouter()

@router.get("/mentor/{mentor_id}")
def get_mentor_portfolio(mentor_id: int, db: Session = Depends(get_db), include_worklets: Optional[bool] = True, request: Request = None):
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
                status_map = {0: "To Start", 1: "Ongoing", 2: "Completed", 3: "On Hold", 4: "Dropped"}
                status_text = status_map.get(getattr(w, 'status_id', None), "Ongoing")
                worklets_data.append({
                    "id": w.id,
                    "cert_id": w.cert_id,
                    "title": w.title,
                    "status": status_text,
                    "year": None,
                    "domain": getattr(w, 'domain', None),
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

    base_url = str(request.base_url).rstrip('/') if request else ''
    def with_abs_link(obj_dict):
        if obj_dict.get("document_link") and base_url and obj_dict["document_link"].startswith("/uploads/"):
            obj_dict["document_link"] = f"{base_url}{obj_dict['document_link']}"
        return obj_dict

    return {
        "mentor": {
            "id": mentor.id,
            "name": mentor.name,
            "email": mentor.email,
            "role": mentor.role,
            "college": mentor.college,
        },
        "achievements": [serialize(a) for a in achievements],
        "papers": [
            {
                **with_abs_link(serialize(p)),
                # authors not persisted in schema; frontend can attach at create time
                "authors": None,
                "status": "Pending",
            }
            for p in papers
        ],
        "patents": [
            {
                **with_abs_link(serialize(p)),
                # inventors not persisted in schema; frontend can attach at create time
                "inventors": None,
            }
            for p in patents
        ],
        "commercializations": [
            {
                **with_abs_link(serialize(c)),
                "revenue": float(c.revenue) if getattr(c, "revenue", None) is not None else None,
            }
            for c in commercializations
        ],
        "worklets": worklets_data,
        "stats": {
            "achievements_count": len(achievements),
            "papers_count": len(papers),
            "patents_count": len(patents),
            "commercializations_count": len(commercializations),
            "worklets_count": len(worklets_data),
        }
    }


@router.get("/student/me")
def get_my_portfolio(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db), request: Request = None):
    """Return portfolio for the authenticated user (works for students too)."""
    payload = require_access_token(token)
    user_email = payload.get("sub")
    user = db.query(User).filter(User.email == user_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return get_student_portfolio(student_id=user.id, db=db, request=request)


@router.get("/student/{student_id}")
def get_student_portfolio(student_id: int, db: Session = Depends(get_db), include_worklets: Optional[bool] = False, request: Request = None):
    """Aggregate portfolio data for a student (achievements/papers/patents/commercializations)."""
    user = db.query(User).filter(User.id == student_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Entities are keyed by user_id
    achievements = (
        db.query(Achievement)
        .filter(Achievement.user_id == student_id)
        .order_by((Achievement.year.is_(None)).asc(), Achievement.year.desc(), Achievement.created_at.desc())
        .all()
    )
    papers = (
        db.query(Paper)
        .filter(Paper.user_id == student_id)
        .order_by((Paper.publication_year.is_(None)).asc(), Paper.publication_year.desc(), Paper.created_at.desc())
        .all()
    )
    patents = (
        db.query(Patent)
        .filter(Patent.user_id == student_id)
        .order_by((Patent.filing_year.is_(None)).asc(), Patent.filing_year.desc(), Patent.created_at.desc())
        .all()
    )
    commercializations = (
        db.query(Commercialization)
        .filter(Commercialization.user_id == student_id)
        .order_by((Commercialization.year.is_(None)).asc(), Commercialization.year.desc(), Commercialization.created_at.desc())
        .all()
    )

    worklets_data = []
    if include_worklets:
        associations = db.query(UserWorkletAssociation).filter(
            UserWorkletAssociation.user_id == student_id,
            UserWorkletAssociation.role_in_worklet == "Student",
        ).all()
        worklet_ids = [a.worklet_id for a in associations]
        if worklet_ids:
            worklets = db.query(Worklet).filter(Worklet.id.in_(worklet_ids)).all()
            for w in worklets:
                status_map = {0: "To Start", 1: "Ongoing", 2: "Completed", 3: "On Hold", 4: "Dropped"}
                status_text = status_map.get(getattr(w, 'status_id', None), "Ongoing")
                worklets_data.append({
                    "id": w.id,
                    "cert_id": w.cert_id,
                    "title": w.title,
                    "status": status_text,
                    "year": None,
                    "domain": getattr(w, 'domain', None),
                    "start_date": w.start_date.isoformat() if w.start_date else None,
                    "end_date": w.end_date.isoformat() if w.end_date else None,
                })

    def serialize(obj):
        data = {}
        for attr in obj.__mapper__.column_attrs:
            key = attr.key
            data[key] = getattr(obj, key)
        return data

    base_url = str(request.base_url).rstrip('/') if request else ''
    def with_abs_link(obj_dict):
        if obj_dict.get("document_link") and base_url and obj_dict["document_link"].startswith("/uploads/"):
            obj_dict["document_link"] = f"{base_url}{obj_dict['document_link']}"
        return obj_dict

    return {
        "mentor": {  # keep key name for frontend compatibility; contains the user info
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "college": user.college,
        },
        "achievements": [serialize(a) for a in achievements],
        "papers": [
            {
                **with_abs_link(serialize(p)),
                "authors": None,
                "status": "Pending",
            }
            for p in papers
        ],
        "patents": [
            {
                **with_abs_link(serialize(p)),
                "inventors": None,
            }
            for p in patents
        ],
        "commercializations": [
            {
                **with_abs_link(serialize(c)),
                "revenue": float(c.revenue) if getattr(c, "revenue", None) is not None else None,
            }
            for c in commercializations
        ],
        "worklets": worklets_data,
        "stats": {
            "achievements_count": len(achievements),
            "papers_count": len(papers),
            "patents_count": len(patents),
            "commercializations_count": len(commercializations),
            "worklets_count": len(worklets_data),
        },
    }


# ---------- Create endpoints for portfolio entities ----------

def _current_user(db: Session, token: str):
    payload = require_access_token(token)
    user_email = payload.get("sub")
    user = db.query(User).filter(User.email == user_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


def _ensure_upload_dir() -> str:
    base = os.environ.get("UPLOAD_DIR", os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "uploads")))
    os.makedirs(base, exist_ok=True)
    return base


@router.post("/papers")
async def create_paper(
    request: Request,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
    title: str = Form(...),
    journal: str = Form(None),
    publication_year: int = Form(None),
    doi: str = Form(None),
    abstract: str = Form(None),
    authors: str = Form(None),  # JSON string (not stored; returned in response)
    worklet_id: int = Form(None),
    worklet_cert_id: str = Form(None),
    document: UploadFile = File(None),
):
    user = _current_user(db, token)

    document_link = None
    if document is not None:
        upload_dir = _ensure_upload_dir()
        filename = f"paper_{user.id}_{document.filename}"
        file_path = os.path.join(upload_dir, filename)
        with open(file_path, "wb") as f:
            f.write(await document.read())
        # build absolute URL
        base_url = str(request.base_url).rstrip('/')
    document_link = f"{base_url}/uploads/{filename}"

    # authors not stored in DB per schema

    paper = Paper(
        user_id=user.id,
        title=title,
        journal=journal,
        publication_year=publication_year,
        doi=doi,
        link=document_link,
        worklet_id=worklet_id,
    )
    db.add(paper)
    db.commit()
    db.refresh(paper)

    # shape response to match frontend expectations
    resp = {
        "id": paper.id,
        "title": paper.title,
        "journal": paper.journal,
        "publication_year": paper.publication_year,
        "doi": paper.doi,
        "abstract": abstract,
        "authors": (json.loads(authors) if authors else None),
        "document_link": paper.link,
        "worklet_id": paper.worklet_id,
        "worklet_cert_id": worklet_cert_id,
        "status": "Pending",
    }
    return JSONResponse(status_code=201, content=resp)


@router.post("/patents")
async def create_patent(
    request: Request,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
    title: str = Form(...),
    application_number: str = Form(None),
    filing_year: int = Form(None),
    status: str = Form("Filed"),
    description: str = Form(None),
    inventors: str = Form(None),  # JSON string (not stored; returned in response)
    document: UploadFile = File(None),
):
    user = _current_user(db, token)

    document_link = None
    if document is not None:
        upload_dir = _ensure_upload_dir()
        filename = f"patent_{user.id}_{document.filename}"
        file_path = os.path.join(upload_dir, filename)
        with open(file_path, "wb") as f:
            f.write(await document.read())
        base_url = str(request.base_url).rstrip('/')
    document_link = f"{base_url}/uploads/{filename}"

    # inventors not stored in DB per schema

    patent = Patent(
        user_id=user.id,
        title=title,
        application_number=application_number,
        filing_year=filing_year,
        status=status if status in ("Filed", "Granted", "Published") else "Filed",
        link=document_link,
    )
    db.add(patent)
    db.commit()
    db.refresh(patent)

    resp = {
        "id": patent.id,
        "title": patent.title,
        "application_number": patent.application_number,
        "filing_year": patent.filing_year,
        "status": patent.status,
    "description": description,
    "inventors": (json.loads(inventors) if inventors else None),
    "document_link": patent.link,
    }
    return JSONResponse(status_code=201, content=resp)


@router.post("/commercializations")
async def create_commercialization(
    request: Request,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
    title: str = Form(...),
    description: str = Form(None),
    year: int = Form(None),
    revenue: float = Form(None),
    link: str = Form(None),
    worklet_id: int = Form(None),
    document: UploadFile = File(None),
):
    user = _current_user(db, token)

    document_link = None
    if document is not None:
        upload_dir = _ensure_upload_dir()
        filename = f"comm_{user.id}_{document.filename}"
        file_path = os.path.join(upload_dir, filename)
        with open(file_path, "wb") as f:
            f.write(await document.read())
        base_url = str(request.base_url).rstrip('/')
    document_link = f"{base_url}/uploads/{filename}"

    rec = Commercialization(
        user_id=user.id,
        title=title,
        description=description,
        year=year,
        revenue=revenue,
        link=document_link or link,
        worklet_id=worklet_id,
    )
    db.add(rec)
    db.commit()
    db.refresh(rec)

    resp = {
        "id": rec.id,
        "title": rec.title,
        "description": rec.description,
        "year": rec.year,
        "revenue": float(rec.revenue) if rec.revenue is not None else None,
        "link": rec.link,
        "document_link": rec.link,
    }
    return JSONResponse(status_code=201, content=resp)