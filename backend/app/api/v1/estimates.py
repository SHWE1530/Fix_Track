from typing import List
from fastapi import APIRouter, Depends
from app.core.dependencies import get_current_user
from app.db.mongodb import get_db
from app.schemas.estimate import EstimateCreateRequest, EstimateDecisionRequest, EstimateResponse
from app.services.estimate_service import estimate_service

router = APIRouter(prefix="/estimates", tags=["Estimates"])

@router.post("/jobs/{job_id}", response_model=EstimateResponse)
def create_estimate(
    job_id: str,
    req: EstimateCreateRequest,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    return estimate_service.create_estimate(job_id, current_user, req, db=db)

@router.get("/jobs/{job_id}", response_model=List[EstimateResponse])
def get_job_estimates(job_id: str, db = Depends(get_db)):
    return estimate_service.get_job_estimates(job_id, db=db)

@router.post("/{estimate_id}/decide", response_model=EstimateResponse)
def decide_estimate(
    estimate_id: str,
    req: EstimateDecisionRequest,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    return estimate_service.decide_estimate(estimate_id, current_user, req, db=db)
