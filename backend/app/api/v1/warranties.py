from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from app.core.dependencies import get_current_user
from app.db.mongodb import get_db
from app.schemas.warranty import WarrantyCreateRequest, WarrantyResponse
from app.services.warranty_service import warranty_service

router = APIRouter(prefix="/warranties", tags=["Warranties"])

@router.post("/jobs/{job_id}", response_model=WarrantyResponse)
def issue_warranty(
    job_id: str,
    req: WarrantyCreateRequest,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    return warranty_service.issue_warranty(job_id, current_user, req, db=db)

@router.get("", response_model=List[WarrantyResponse])
def list_warranties(
    asset_id: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    return warranty_service.list_warranties(current_user, asset_id=asset_id, db=db)

@router.get("/{warranty_id}", response_model=WarrantyResponse)
def get_warranty(
    warranty_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    return warranty_service.get_warranty(warranty_id, current_user, db=db)

@router.get("/check/asset/{asset_id}", response_model=Optional[WarrantyResponse])
def check_asset_warranty(asset_id: str, db = Depends(get_db)):
    return warranty_service.check_asset_warranty(asset_id, db=db)
