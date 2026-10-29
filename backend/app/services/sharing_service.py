from datetime import datetime, timedelta, timezone
from typing import List, Optional
from bson import ObjectId
from fastapi import HTTPException, status
from app.core.dependencies import serialize_doc
from app.db.mongodb import get_db
from app.models.enums import AuditAction, NotificationType, SharingGrantStatus, UserRole
from app.schemas.sharing import SharingGrantCreateRequest
from app.services.audit_service import audit_service
from app.services.notification_service import notification_service
from app.utils.identifiers import generate_token

class SharingService:
    @staticmethod
    def create_grant(owner: dict, req: SharingGrantCreateRequest, db = None) -> dict:
        if db is None:
            db = get_db()
        
        user_id = owner["id"]
        # Verify asset ownership
        asset_obj_id = ObjectId(req.asset_id) if ObjectId.is_valid(req.asset_id) else req.asset_id
        asset = db.assets.find_one({"_id": asset_obj_id})
        if not asset:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found")
        if asset["owner_id"] != user_id and owner.get("role") != UserRole.ADMIN.value:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not own this asset")

        # Verify target business exists
        biz_obj_id = ObjectId(req.target_business_id) if ObjectId.is_valid(req.target_business_id) else req.target_business_id
        biz = db.businesses.find_one({"_id": biz_obj_id})
        if not biz or not biz.get("is_active", True):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Target repair business not found")

        # Verify selected jobs belong to this asset (if provided)
        if req.selected_job_ids:
            for jid in req.selected_job_ids:
                j_obj_id = ObjectId(jid) if ObjectId.is_valid(jid) else jid
                job = db.repair_jobs.find_one({"_id": j_obj_id, "asset_id": req.asset_id})
                if not job:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Selected job '{jid}' is not part of this asset's history"
                    )

        now = datetime.now(timezone.utc)
        expires_at = now + timedelta(days=req.expires_in_days)
        token = generate_token(length=32)

        grant_doc = {
            "asset_id": req.asset_id,
            "owner_id": user_id,
            "target_business_id": req.target_business_id,
            "target_business_name": biz.get("name"),
            "selected_job_ids": req.selected_job_ids or None,
            "expires_at": expires_at.isoformat(),
            "status": SharingGrantStatus.ACTIVE.value,
            "notes": req.notes.strip() if req.notes else None,
            "token": token,
            "created_at": now.isoformat(),
            "updated_at": now.isoformat()
        }

        res = db.sharing_grants.insert_one(grant_doc)
        grant_id = str(res.inserted_id)
        grant_doc["id"] = grant_id

        audit_service.log(
            action=AuditAction.SHARING_GRANTED,
            user_id=user_id,
            user_email=owner.get("email"),
            entity_type="sharing_grant",
            entity_id=grant_id,
            details={"asset_id": req.asset_id, "target_business_id": req.target_business_id, "expires_at": expires_at.isoformat()},
            db=db
        )

        notification_service.create(
            user_id=biz["owner_id"],
            title="Service Record Access Granted",
            message=f"{owner.get('full_name')} shared the Repair Passport for their {asset.get('make')} {asset.get('model')} with your shop.",
            type=NotificationType.SHARING_GRANTED,
            link_url=f"/business/passports/{req.asset_id}",
            db=db
        )

        s = serialize_doc(grant_doc)
        s["asset_summary"] = serialize_doc(asset)
        s["owner_name"] = owner.get("full_name")
        s["is_valid"] = True
        return s

    @staticmethod
    def revoke_grant(grant_id: str, owner: dict, db = None) -> dict:
        if db is None:
            db = get_db()
        
        g_obj_id = ObjectId(grant_id) if ObjectId.is_valid(grant_id) else grant_id
        grant = db.sharing_grants.find_one({"_id": g_obj_id})
        if not grant:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sharing grant not found")

        if grant["owner_id"] != owner["id"] and owner.get("role") != UserRole.ADMIN.value:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only asset owner can revoke this sharing grant")

        now = datetime.now(timezone.utc).isoformat()
        db.sharing_grants.update_one(
            {"_id": g_obj_id},
            {"$set": {"status": SharingGrantStatus.REVOKED.value, "updated_at": now}}
        )

        audit_service.log(
            action=AuditAction.SHARING_REVOKED,
            user_id=owner["id"],
            user_email=owner.get("email"),
            entity_type="sharing_grant",
            entity_id=grant_id,
            details={"asset_id": grant["asset_id"]},
            db=db
        )

        updated = db.sharing_grants.find_one({"_id": g_obj_id})
        s = serialize_doc(updated)
        s["is_valid"] = False
        return s

    @staticmethod
    def list_user_grants(user_id: str, db = None) -> List[dict]:
        if db is None:
            db = get_db()
        cursor = db.sharing_grants.find({"owner_id": user_id}).sort("created_at", -1)
        now = datetime.now(timezone.utc).isoformat()
        results = []
        for g in cursor:
            s = serialize_doc(g)
            is_valid = s["status"] == SharingGrantStatus.ACTIVE.value and s["expires_at"] >= now
            s["is_valid"] = is_valid
            asset = db.assets.find_one({"_id": ObjectId(s["asset_id"]) if ObjectId.is_valid(s["asset_id"]) else s["asset_id"]})
            s["asset_summary"] = serialize_doc(asset) if asset else None
            results.append(s)
        return results

    @staticmethod
    def list_business_grants(business_id: str, db = None) -> List[dict]:
        if db is None:
            db = get_db()
        cursor = db.sharing_grants.find({"target_business_id": business_id, "status": "active"}).sort("created_at", -1)
        now = datetime.now(timezone.utc).isoformat()
        results = []
        for g in cursor:
            s = serialize_doc(g)
            is_valid = s["expires_at"] >= now
            s["is_valid"] = is_valid
            asset = db.assets.find_one({"_id": ObjectId(s["asset_id"]) if ObjectId.is_valid(s["asset_id"]) else s["asset_id"]})
            s["asset_summary"] = serialize_doc(asset) if asset else None
            results.append(s)
        return results

sharing_service = SharingService()
