from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from app.core.dependencies import get_current_user
from app.db.mongodb import get_db
from app.schemas.business import (
    BusinessCreateRequest,
    BusinessResponse,
    BusinessUpdateRequest,
    StaffInviteRequest,
    StaffMembershipResponse,
    StaffUpdateRequest,
)
from app.services.business_service import business_service

router = APIRouter(prefix="/businesses", tags=["Businesses"])

@router.post("", response_model=BusinessResponse)
def create_business(
    req: BusinessCreateRequest,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    return business_service.create_business(current_user, req, db=db)

@router.get("/directory", response_model=List[BusinessResponse])
def list_directory(
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db = Depends(get_db)
):
    return business_service.list_public_businesses(category=category, search=search, skip=skip, limit=limit, db=db)

@router.get("/my", response_model=Optional[BusinessResponse])
def get_my_business(current_user: dict = Depends(get_current_user), db = Depends(get_db)):
    """Returns the business owned by or affiliated with the current user."""
    user_id = current_user["id"]
    biz = db.businesses.find_one({"owner_id": user_id})
    if not biz:
        # Check staff membership
        mem = db.memberships.find_one({"user_id": user_id, "status": "active"})
        if mem:
            biz = db.businesses.find_one({"_id": mem["business_id"]}) or db.businesses.find_one({"_id": str(mem["business_id"])})
    if not biz:
        return None
    from app.core.dependencies import serialize_doc
    return serialize_doc(biz)

@router.get("/{business_id}", response_model=BusinessResponse)
def get_business(business_id: str, db = Depends(get_db)):
    return business_service.get_business(business_id, db=db)

@router.put("/{business_id}", response_model=BusinessResponse)
def update_business(
    business_id: str,
    req: BusinessUpdateRequest,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    return business_service.update_business(business_id, current_user, req, db=db)

@router.post("/{business_id}/staff", response_model=StaffMembershipResponse)
def invite_staff_member(
    business_id: str,
    req: StaffInviteRequest,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    return business_service.invite_staff(business_id, current_user, req, db=db)

@router.get("/{business_id}/staff", response_model=List[StaffMembershipResponse])
def list_staff_members(
    business_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    return business_service.list_staff(business_id, current_user, db=db)

@router.put("/{business_id}/staff/{membership_id}", response_model=StaffMembershipResponse)
def update_staff_member(
    business_id: str,
    membership_id: str,
    req: StaffUpdateRequest,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    return business_service.update_staff(business_id, membership_id, current_user, req, db=db)
