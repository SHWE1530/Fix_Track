from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from app.core.dependencies import get_current_user
from app.db.mongodb import get_db
from app.schemas.asset import AssetCreateRequest, AssetResponse, AssetUpdateRequest
from app.services.asset_service import asset_service

router = APIRouter(prefix="/assets", tags=["Assets"])

@router.post("", response_model=AssetResponse)
def create_asset(
    req: AssetCreateRequest,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    return asset_service.create_asset(current_user, req, db=db)

@router.get("", response_model=List[AssetResponse])
def list_my_assets(
    category: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    return asset_service.list_user_assets(current_user["id"], category=category, skip=skip, limit=limit, db=db)

@router.get("/{asset_id}", response_model=AssetResponse)
def get_asset(
    asset_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    return asset_service.get_asset(asset_id, current_user, db=db)

@router.put("/{asset_id}", response_model=AssetResponse)
def update_asset(
    asset_id: str,
    req: AssetUpdateRequest,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    return asset_service.update_asset(asset_id, current_user, req, db=db)
