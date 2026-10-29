from typing import Optional
from fastapi import APIRouter, Depends, Query
from app.core.dependencies import get_current_user
from app.db.mongodb import get_db
from app.schemas.sharing import RepairPassportResponse
from app.services.passport_service import passport_service

router = APIRouter(prefix="/passports", tags=["Repair Passports"])

@router.get("/assets/{asset_id}", response_model=RepairPassportResponse)
def get_repair_passport(
    asset_id: str,
    target_business_id: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """
    Retrieves the customer-controlled Repair Passport for an asset.
    Access is strictly validated server-side based on customer ownership,
    an active repair job with the requesting business, or an active sharing grant.
    """
    return passport_service.get_repair_passport(
        asset_id=asset_id,
        current_user=current_user,
        target_business_id=target_business_id,
        db=db
    )
