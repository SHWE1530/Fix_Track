from datetime import datetime, timezone
from typing import List, Optional
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from app.core.dependencies import get_current_user, require_role, serialize_doc
from app.db.mongodb import get_db
from app.models.enums import AuditAction, UserRole
from app.schemas.audit import AuditLogResponse
from app.schemas.business import BusinessResponse
from app.schemas.user import UserResponse
from app.services.audit_service import audit_service

router = APIRouter(prefix="/admin", tags=["Platform Administration"], dependencies=[Depends(require_role([UserRole.ADMIN]))])

class AccountStatusUpdateRequest(BaseModel):
    is_active: bool
    reason: Optional[str] = None

class BusinessVerificationRequest(BaseModel):
    is_verified: bool
    notes: Optional[str] = None

class AbuseReportCreateRequest(BaseModel):
    reported_entity_type: str # user, business, job
    reported_entity_id: str
    reason: str
    description: str

class AbuseReportResponse(BaseModel):
    id: str
    reported_by_user_id: str
    reported_entity_type: str
    reported_entity_id: str
    reason: str
    description: str
    status: str # pending, reviewed, resolved, dismissed
    admin_notes: Optional[str] = None
    created_at: str
    updated_at: Optional[str] = None

@router.get("/users", response_model=List[UserResponse])
def list_all_users(
    role: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db = Depends(get_db)
):
    q = {}
    if role:
        q["role"] = role
    cursor = db.users.find(q).skip(skip).limit(limit).sort("created_at", -1)
    return [serialize_doc(u) for u in cursor]

@router.put("/users/{user_id}/status", response_model=UserResponse)
def update_user_account_status(
    user_id: str,
    req: AccountStatusUpdateRequest,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    t_id = ObjectId(user_id) if ObjectId.is_valid(user_id) else user_id
    u = db.users.find_one({"_id": t_id})
    if not u:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    now = datetime.now(timezone.utc).isoformat()
    db.users.update_one(
        {"_id": t_id},
        {"$set": {"is_active": req.is_active, "updated_at": now}}
    )

    audit_service.log(
        action=AuditAction.ACCOUNT_SUSPENDED if not req.is_active else AuditAction.USER_REGISTERED,
        user_id=current_user["id"],
        user_email=current_user.get("email"),
        entity_type="user",
        entity_id=user_id,
        details={"is_active": req.is_active, "reason": req.reason},
        db=db
    )

    updated = db.users.find_one({"_id": t_id})
    return serialize_doc(updated)

@router.get("/businesses", response_model=List[BusinessResponse])
def list_all_businesses(
    verified: Optional[bool] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db = Depends(get_db)
):
    q = {}
    if verified is not None:
        q["is_verified"] = verified
    cursor = db.businesses.find(q).skip(skip).limit(limit).sort("created_at", -1)
    return [serialize_doc(b) for b in cursor]

@router.put("/businesses/{business_id}/verify", response_model=BusinessResponse)
def verify_business(
    business_id: str,
    req: BusinessVerificationRequest,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    t_id = ObjectId(business_id) if ObjectId.is_valid(business_id) else business_id
    biz = db.businesses.find_one({"_id": t_id})
    if not biz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Business not found")

    now = datetime.now(timezone.utc).isoformat()
    db.businesses.update_one(
        {"_id": t_id},
        {"$set": {"is_verified": req.is_verified, "verification_notes": req.notes, "updated_at": now}}
    )

    audit_service.log(
        action=AuditAction.BUSINESS_VERIFIED,
        user_id=current_user["id"],
        user_email=current_user.get("email"),
        entity_type="business",
        entity_id=business_id,
        details={"is_verified": req.is_verified, "notes": req.notes},
        db=db
    )

    updated = db.businesses.find_one({"_id": t_id})
    return serialize_doc(updated)

@router.get("/audit-logs", response_model=List[AuditLogResponse])
def get_audit_logs(
    action: Optional[str] = Query(None),
    entity_type: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db = Depends(get_db)
):
    q = {}
    if action:
        q["action"] = action
    if entity_type:
        q["entity_type"] = entity_type
    cursor = db.audit_logs.find(q).skip(skip).limit(limit).sort("created_at", -1)
    return [serialize_doc(a) for a in cursor]

@router.get("/abuse-reports", response_model=List[AbuseReportResponse])
def list_abuse_reports(
    status_filter: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db = Depends(get_db)
):
    q = {}
    if status_filter:
        q["status"] = status_filter
    cursor = db.abuse_reports.find(q).skip(skip).limit(limit).sort("created_at", -1)
    return [serialize_doc(r) for r in cursor]

@router.put("/abuse-reports/{report_id}")
def update_abuse_report(
    report_id: str,
    status: str = Query(...),
    admin_notes: Optional[str] = Query(None),
    db = Depends(get_db)
):
    t_id = ObjectId(report_id) if ObjectId.is_valid(report_id) else report_id
    now = datetime.now(timezone.utc).isoformat()
    db.abuse_reports.update_one(
        {"_id": t_id},
        {"$set": {"status": status, "admin_notes": admin_notes, "updated_at": now}}
    )
    rep = db.abuse_reports.find_one({"_id": t_id})
    return serialize_doc(rep)
