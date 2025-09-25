from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.models import Evaluation, User, Worklet
from app.schemas import EvaluationCreate, EvaluationUpdate, EvaluationResponse
from app.database import get_db
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

@router.post("/", response_model=EvaluationResponse, status_code=status.HTTP_201_CREATED)
def create_evaluation(evaluation_in: EvaluationCreate, db: Session = Depends(get_db)):
    evaluation = Evaluation(**evaluation_in.dict())
    db.add(evaluation)
    db.commit()
    db.refresh(evaluation)
    return evaluation

@router.get("/", response_model=List[EvaluationResponse])
def list_evaluations(db: Session = Depends(get_db)):
    return db.query(Evaluation).all()

@router.get("/{evaluation_id}", response_model=EvaluationResponse)
def get_evaluation(evaluation_id: int, db: Session = Depends(get_db)):
    evaluation = db.query(Evaluation).filter(Evaluation.id == evaluation_id).first()
    if not evaluation:
        raise HTTPException(status_code=404, detail="Evaluation not found")
    return evaluation

@router.put("/{evaluation_id}", response_model=EvaluationResponse)
def update_evaluation(evaluation_id: int, evaluation_in: EvaluationUpdate, db: Session = Depends(get_db)):
    evaluation = db.query(Evaluation).filter(Evaluation.id == evaluation_id).first()
    if not evaluation:
        raise HTTPException(status_code=404, detail="Evaluation not found")
    
    for field, value in evaluation_in.dict(exclude_unset=True).items():
        setattr(evaluation, field, value)
    db.commit()
    db.refresh(evaluation)
    return evaluation

@router.delete("/{evaluation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_evaluation(evaluation_id: int, db: Session = Depends(get_db)):
    evaluation = db.query(Evaluation).filter(Evaluation.id == evaluation_id).first()
    if not evaluation:
        raise HTTPException(status_code=404, detail="Evaluation not found")
    db.delete(evaluation)
    db.commit()
    return None


# Flexible submission matching frontend modal (aggregated evaluation)
class EvaluationPerks(BaseModel):
    points_awarded: int = 0
    certificate_type: Optional[str] = None
    recommendation_letter: bool = False
    internship_opportunity: bool = False
    bonus_credits: int = 0
    special_recognition: Optional[str] = None
    mentorship_extension: bool = False


class EvaluationSubmit(BaseModel):
    worklet_id: int
    performance_rating: Optional[str] = None
    completion_quality: Optional[str] = None
    innovation_score: Optional[int] = None
    teamwork_rating: Optional[str] = None
    perks: EvaluationPerks = EvaluationPerks()
    comments: Optional[str] = None
    feedback: Optional[str] = None
    evaluated_by: Optional[str] = None  # mentor email
    evaluation_date: Optional[datetime] = None


@router.post("/submit")
def submit_evaluation(payload: EvaluationSubmit, db: Session = Depends(get_db)):
    # Validate worklet exists
    worklet = db.query(Worklet).filter(Worklet.id == payload.worklet_id).first()
    if not worklet:
        raise HTTPException(status_code=404, detail="Worklet not found")

    # Resolve evaluator (mentor) by email if provided
    evaluator_user_id: Optional[int] = None
    if payload.evaluated_by:
        evaluator = db.query(User).filter(User.email == payload.evaluated_by).first()
        evaluator_user_id = evaluator.id if evaluator else None
    if evaluator_user_id is None:
        raise HTTPException(status_code=400, detail="Evaluator not found or not provided")

    # Map ratings into a numeric score (simple heuristic)
    rating_map = {
        None: 0,
        "poor": 40,
        "average": 60,
        "good": 75,
        "very_good": 85,
        "excellent": 95,
        "outstanding": 95,
        "high": 85,
        "standard": 70,
        "needs_improvement": 55,
    }

    perf = rating_map.get((payload.performance_rating or "").lower() or None, 0)
    qual = rating_map.get((payload.completion_quality or "").lower() or None, 0)
    team = rating_map.get((payload.teamwork_rating or "").lower() or None, 0)
    innov = payload.innovation_score or 0
    try:
        innov = max(0, min(10, int(innov))) * 10  # scale 1-10 to 10-100
    except Exception:
        innov = 0

    # Average the available components (ignore zeros that were not provided?)
    components = [c for c in [perf, qual, team, innov] if c > 0]
    score = int(sum(components) / len(components)) if components else 0

    # Persist minimal evaluation record
    evaluation_in = EvaluationCreate(
        user_id=evaluator_user_id,
        worklet_id=payload.worklet_id,
        score=score,
        feedback=payload.feedback or payload.comments or "",
    )
    evaluation = Evaluation(**evaluation_in.dict())
    db.add(evaluation)
    db.commit()
    db.refresh(evaluation)

    return {
        "message": "Evaluation submitted",
        "evaluation_id": evaluation.id,
        "worklet_id": payload.worklet_id,
        "score": score,
        "stored": True,
        "perks": payload.perks.dict(),
        "evaluated_by_user_id": evaluator_user_id,
        "evaluation_date": (payload.evaluation_date or datetime.utcnow()).isoformat(),
    }
