from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.models import Evaluation
from app.schemas import EvaluationCreate, EvaluationUpdate, EvaluationResponse
from app.database import get_db
from typing import List

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