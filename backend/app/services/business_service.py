from datetime import datetime, timezone
from typing import List, Optional
from bson import ObjectId
from fastapi import HTTPException, status
from app.core.dependencies import serialize_doc
from app.core.security import hash_password
from app.db.mongodb import get_db
from app.models.enums import AuditAction, MembershipRole, MembershipStatus, NotificationType, UserRole
from app.schemas.business import BusinessCreateRequest, BusinessUpdateRequest, StaffInviteRequest, StaffUpdateRequest
from app.services.audit_service import audit_service
from app.services.notification_service import notification_service

class BusinessService:
    @staticmethod
    def create_business(user: dict, req: BusinessCreateRequest, db = None) -> dict:
        if db is None:
            db = get_db()
        
        user_id = user["id"]
        # Check if user already owns a business
        existing = db.businesses.find_one({"owner_id": user_id})
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User already owns a registered business"
            )

        now = datetime.now(timezone.utc).isoformat()
        categories = [c.value if hasattr(c, "value") else str(c) for c in req.supported_categories]
        
        business_doc = {
            "owner_id": user_id,
            "name": req.name.strip(),
            "legal_name": req.legal_name.strip() if req.legal_name else req.name.strip(),
            "email": req.email.strip().lower(),
            "phone": req.phone.strip(),
            "address": req.address.strip(),
            "website": req.website.strip() if req.website else None,
            "description": req.description.strip() if req.description else None,
            "supported_categories": categories,
            "is_verified": False,
            "is_active": True,
            "created_at": now,
            "updated_at": now
        }
        res = db.businesses.insert_one(business_doc)
        biz_id = str(res.inserted_id)
        business_doc["id"] = biz_id

        # Update owner user role if not already business_owner
        db.users.update_one(
            {"_id": ObjectId(user_id) if ObjectId.is_valid(user_id) else user_id},
            {"$set": {"role": UserRole.BUSINESS_OWNER.value, "updated_at": now}}
        )

        # Create owner membership record
        db.memberships.insert_one({
            "business_id": biz_id,
            "user_id": user_id,
            "role": MembershipRole.OWNER.value,
            "status": MembershipStatus.ACTIVE.value,
            "created_at": now,
            "updated_at": now
        })

        audit_service.log(
            action=AuditAction.BUSINESS_CREATED,
            user_id=user_id,
            user_email=user.get("email"),
            entity_type="business",
            entity_id=biz_id,
            details={"business_name": req.name},
            db=db
        )

        return serialize_doc(business_doc)

    @staticmethod
    def get_business(business_id: str, db = None) -> dict:
        if db is None:
            db = get_db()
        
        biz = None
        try:
            biz = db.businesses.find_one({"_id": ObjectId(business_id)})
        except Exception:
            pass
        if not biz:
            biz = db.businesses.find_one({"_id": business_id})
        
        if not biz:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Business not found"
            )
        return serialize_doc(biz)

    @staticmethod
    def list_public_businesses(category: Optional[str] = None, search: Optional[str] = None, skip: int = 0, limit: int = 20, db = None) -> List[dict]:
        if db is None:
            db = get_db()
        
        query = {"is_active": True}
        if category:
            query["supported_categories"] = category
        if search:
            query["$or"] = [
                {"name": {"$regex": search, "$options": "i"}},
                {"description": {"$regex": search, "$options": "i"}},
                {"address": {"$regex": search, "$options": "i"}}
            ]
        
        cursor = db.businesses.find(query).skip(skip).limit(limit).sort("created_at", -1)
        return [serialize_doc(b) for b in cursor]

    @staticmethod
    def update_business(business_id: str, user: dict, req: BusinessUpdateRequest, db = None) -> dict:
        if db is None:
            db = get_db()
        
        biz = BusinessService.get_business(business_id, db)
        if biz["owner_id"] != user["id"] and user.get("role") != UserRole.ADMIN.value:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the business owner or platform administrator can update business profile"
            )
        
        update_data = {}
        if req.name is not None:
            update_data["name"] = req.name.strip()
        if req.legal_name is not None:
            update_data["legal_name"] = req.legal_name.strip()
        if req.phone is not None:
            update_data["phone"] = req.phone.strip()
        if req.address is not None:
            update_data["address"] = req.address.strip()
        if req.website is not None:
            update_data["website"] = req.website.strip()
        if req.description is not None:
            update_data["description"] = req.description.strip()
        if req.supported_categories is not None:
            update_data["supported_categories"] = [c.value if hasattr(c, "value") else str(c) for c in req.supported_categories]
        
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()

        target_id = ObjectId(business_id) if ObjectId.is_valid(business_id) else business_id
        db.businesses.update_one({"_id": target_id}, {"$set": update_data})
        return BusinessService.get_business(business_id, db)

    @staticmethod
    def invite_staff(business_id: str, owner_user: dict, req: StaffInviteRequest, db = None) -> dict:
        if db is None:
            db = get_db()
        
        biz = BusinessService.get_business(business_id, db)
        if biz["owner_id"] != owner_user["id"] and owner_user.get("role") != UserRole.ADMIN.value:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the business owner can manage staff memberships"
            )
        
        normalized_email = req.email.strip().lower()
        now = datetime.now(timezone.utc).isoformat()

        # Find or create user
        staff_user = db.users.find_one({"email": normalized_email})
        if not staff_user:
            default_pwd = req.password or "StaffPass123!"
            u_doc = {
                "email": normalized_email,
                "password_hash": hash_password(default_pwd),
                "full_name": req.full_name.strip(),
                "role": UserRole.TECHNICIAN.value if req.role == MembershipRole.TECHNICIAN else UserRole.BUSINESS_OWNER.value,
                "is_active": True,
                "created_at": now,
                "updated_at": now
            }
            res = db.users.insert_one(u_doc)
            staff_user_id = str(res.inserted_id)
        else:
            staff_user_id = str(staff_user["_id"])

        # Check existing membership
        existing_mem = db.memberships.find_one({"business_id": business_id, "user_id": staff_user_id})
        if existing_mem:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="User is already a staff member in this business"
            )

        membership_doc = {
            "business_id": business_id,
            "user_id": staff_user_id,
            "user_email": normalized_email,
            "user_name": req.full_name.strip(),
            "role": req.role.value,
            "status": MembershipStatus.ACTIVE.value,
            "created_at": now,
            "updated_at": now
        }
        res_m = db.memberships.insert_one(membership_doc)
        mem_id = str(res_m.inserted_id)
        membership_doc["id"] = mem_id

        notification_service.create(
            user_id=staff_user_id,
            title="Business Membership Granted",
            message=f"You have been added as {req.role.value} to {biz['name']}.",
            type=NotificationType.STAFF_INVITED,
            db=db
        )

        return serialize_doc(membership_doc)

    @staticmethod
    def list_staff(business_id: str, current_user: dict, db = None) -> List[dict]:
        if db is None:
            db = get_db()
        
        # Verify access
        biz = BusinessService.get_business(business_id, db)
        is_owner = biz["owner_id"] == current_user["id"]
        is_admin = current_user.get("role") == UserRole.ADMIN.value
        mem = db.memberships.find_one({"business_id": business_id, "user_id": current_user["id"]})

        if not (is_owner or is_admin or mem):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

        cursor = db.memberships.find({"business_id": business_id})
        return [serialize_doc(m) for m in cursor]

    @staticmethod
    def update_staff(business_id: str, membership_id: str, owner_user: dict, req: StaffUpdateRequest, db = None) -> dict:
        if db is None:
            db = get_db()
        
        biz = BusinessService.get_business(business_id, db)
        if biz["owner_id"] != owner_user["id"] and owner_user.get("role") != UserRole.ADMIN.value:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only owner can modify staff")

        target_id = ObjectId(membership_id) if ObjectId.is_valid(membership_id) else membership_id
        mem = db.memberships.find_one({"_id": target_id, "business_id": business_id})
        if not mem:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Staff membership not found")

        updates = {}
        if req.role:
            updates["role"] = req.role.value
        if req.status:
            updates["status"] = req.status.value
        updates["updated_at"] = datetime.now(timezone.utc).isoformat()

        db.memberships.update_one({"_id": target_id}, {"$set": updates})
        updated = db.memberships.find_one({"_id": target_id})
        return serialize_doc(updated)

business_service = BusinessService()
