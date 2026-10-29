from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from app.core.dependencies import get_current_user
from app.db.mongodb import get_db
from app.schemas.repair_job import (
    JobDiagnosisRequest,
    JobHandoverRequest,
    JobIntakeRequest,
    JobStatusTransitionRequest,
    RepairJobCreateRequest,
    RepairJobResponse,
    WorkCompletionRequest,
)
from app.services.job_service import job_service

router = APIRouter(prefix="/repair-jobs", tags=["Repair Jobs"])

@router.post("", response_model=RepairJobResponse)
def create_repair_job(
    req: RepairJobCreateRequest,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    return job_service.create_repair_job(current_user, req, db=db)

@router.get("", response_model=List[RepairJobResponse])
def list_repair_jobs(
    status: Optional[str] = Query(None),
    asset_id: Optional[str] = Query(None),
    business_id: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    return job_service.list_jobs(
        current_user=current_user,
        status_filter=status,
        asset_id=asset_id,
        business_id=business_id,
        skip=skip,
        limit=limit,
        db=db
    )

@router.get("/{job_id}", response_model=RepairJobResponse)
def get_repair_job(
    job_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    return job_service.get_job_detail(job_id, current_user, db=db)

@router.post("/{job_id}/transition", response_model=RepairJobResponse)
def transition_job_status(
    job_id: str,
    req: JobStatusTransitionRequest,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    return job_service.transition_status(job_id, current_user, req, db=db)

@router.post("/{job_id}/intake", response_model=RepairJobResponse)
def record_intake(
    job_id: str,
    req: JobIntakeRequest,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    return job_service.record_intake(job_id, current_user, req, db=db)

@router.post("/{job_id}/diagnosis", response_model=RepairJobResponse)
def record_diagnosis(
    job_id: str,
    req: JobDiagnosisRequest,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    return job_service.record_diagnosis(job_id, current_user, req, db=db)

@router.post("/{job_id}/complete-work", response_model=RepairJobResponse)
def record_work_completion(
    job_id: str,
    req: WorkCompletionRequest,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    return job_service.record_work_completion(job_id, current_user, req, db=db)

@router.post("/{job_id}/handover", response_model=RepairJobResponse)
def record_handover(
    job_id: str,
    req: JobHandoverRequest,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    return job_service.record_handover(job_id, current_user, req, db=db)
