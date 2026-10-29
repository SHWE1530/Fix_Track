from typing import List
from fastapi import APIRouter, Depends
from app.core.dependencies import get_current_user
from app.db.mongodb import get_db
from app.schemas.sharing import SharingGrantCreateRequest, SharingGrantResponse
from app.services.sharing_service import sharing_service

router = APIRouter(prefix="/sharing-grants", tags=["Record Sharing"])

@router.post("", response_model=SharingGrantResponse)
def create_sharing_grant(
    req: SharingGrantCreateRequest,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    return sharing_service.create_grant(current_user, req, db=db)

@router.post("/{grant_id}/revoke", response_model=SharingGrantResponse)
def revoke_sharing_grant(
    grant_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    return sharing_service.revoke_grant(grant_id, current_user, db=db)

@router.get("/my-grants", response_model=List[SharingGrantResponse])
def list_my_grants(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    return sharing_service.list_user_grants(current_user["id"], db=db)

@router.get("/business/{business_id}", response_model=List[SharingGrantResponse])
def list_business_grants(
    business_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    # Verify user belongs to this business
    from app.core.dependencies import verify_business_membership
    verify_business_membership(business_id, current_user["id"], db=db)
    return sharing_service.list_business_grants(business_id, db=db)
