from datetime import datetime, timedelta, timezone
from typing import List, Optional
from bson import ObjectId
from fastapi import HTTPException, status
from app.core.dependencies import serialize_doc
from app.db.mongodb import get_db
from app.models.enums import AuditAction, NotificationType, UserRole, WarrantyStatus
from app.schemas.warranty import WarrantyCreateRequest
from app.services.audit_service import audit_service
from app.services.notification_service import notification_service
from app.utils.identifiers import generate_reference

class WarrantyService:
    @staticmethod
    def issue_warranty(job_id: str, current_user: dict, req: WarrantyCreateRequest, db = None) -> dict:
        if db is None:
            db = get_db()
        
        job_obj_id = ObjectId(job_id) if ObjectId.is_valid(job_id) else job_id
        job = db.repair_jobs.find_one({"_id": job_obj_id})
        if not job:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Repair job not found")

        # Verify business authorization
        user_id = current_user["id"]
        biz_id = job["business_id"]
        biz = db.businesses.find_one({"_id": ObjectId(biz_id) if ObjectId.is_valid(biz_id) else biz_id})
        is_owner = biz and biz.get("owner_id") == user_id
        mem = db.memberships.find_one({"business_id": biz_id, "user_id": user_id, "status": "active"})
        is_admin = current_user.get("role") == UserRole.ADMIN.value

        if not (is_owner or mem or is_admin):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized to issue warranty for this job")

        # Check existing warranty for this job
        existing = db.warranties.find_one({"job_id": job_id})
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Warranty already issued for this repair job")

        now = datetime.now(timezone.utc)
        end_date = now + timedelta(days=req.duration_days)
        warranty_number = generate_reference(prefix="WAR")

        warranty_doc = {
            "warranty_number": warranty_number,
            "job_id": job_id,
            "asset_id": job["asset_id"],
            "customer_id": job["customer_id"],
            "business_id": biz_id,
            "business_name": biz["name"] if biz else "Repair Business",
            "start_date": now.isoformat(),
            "end_date": end_date.isoformat(),
            "duration_days": req.duration_days,
            "covered_terms": req.covered_terms.strip(),
            "limitations": req.limitations.strip() if req.limitations else None,
            "status": WarrantyStatus.ACTIVE.value,
            "created_at": now.isoformat(),
            "updated_at": now.isoformat()
        }

        res = db.warranties.insert_one(warranty_doc)
        warranty_id = str(res.inserted_id)
        warranty_doc["id"] = warranty_id

        audit_service.log(
            action=AuditAction.WARRANTY_CREATED,
            user_id=user_id,
            user_email=current_user.get("email"),
            entity_type="warranty",
            entity_id=warranty_id,
            details={"warranty_number": warranty_number, "job_id": job_id, "duration_days": req.duration_days},
            db=db
        )

        notification_service.create(
            user_id=job["customer_id"],
            title=f"Warranty Issued: {warranty_number}",
            message=f"A {req.duration_days}-day warranty has been issued for repair job {job.get('job_number')}.",
            type=NotificationType.WARRANTY_ISSUED,
            link_url=f"/warranties/{warranty_id}",
            db=db
        )

        s = serialize_doc(warranty_doc)
        s["is_active"] = True
        return s

    @staticmethod
    def get_warranty(warranty_id: str, current_user: dict, db = None) -> dict:
        if db is None:
            db = get_db()
        
        w_obj_id = ObjectId(warranty_id) if ObjectId.is_valid(warranty_id) else warranty_id
        w = db.warranties.find_one({"_id": w_obj_id})
        if not w:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Warranty not found")

        # Check authorization: customer, business staff, admin
        user_id = current_user["id"]
        is_customer = w["customer_id"] == user_id
        is_admin = current_user.get("role") == UserRole.ADMIN.value
        biz = db.businesses.find_one({"_id": ObjectId(w["business_id"]) if ObjectId.is_valid(w["business_id"]) else w["business_id"]})
        is_biz_staff = biz and (biz.get("owner_id") == user_id or db.memberships.find_one({"business_id": w["business_id"], "user_id": user_id, "status": "active"}))

        if not (is_customer or is_admin or is_biz_staff):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to warranty")

        now = datetime.now(timezone.utc).isoformat()
        is_active = w["status"] == WarrantyStatus.ACTIVE.value and w["end_date"] >= now
        
        s = serialize_doc(w)
        s["is_active"] = is_active
        return s

    @staticmethod
    def list_warranties(current_user: dict, asset_id: Optional[str] = None, db = None) -> List[dict]:
        if db is None:
            db = get_db()
        
        user_id = current_user["id"]
        role = current_user.get("role")
        query = {}

        if role == UserRole.CUSTOMER.value:
            query["customer_id"] = user_id
        elif role in [UserRole.BUSINESS_OWNER.value, UserRole.TECHNICIAN.value]:
            owned = [str(b["_id"]) for b in db.businesses.find({"owner_id": user_id})]
            mems = [str(m["business_id"]) for m in db.memberships.find({"user_id": user_id, "status": "active"})]
            query["business_id"] = {"$in": list(set(owned + mems))}
        
        if asset_id:
            query["asset_id"] = asset_id

        cursor = db.warranties.find(query).sort("created_at", -1)
        now = datetime.now(timezone.utc).isoformat()
        results = []
        for w in cursor:
            s = serialize_doc(w)
            s["is_active"] = s["status"] == WarrantyStatus.ACTIVE.value and s["end_date"] >= now
            results.append(s)
        return results

    @staticmethod
    def check_asset_warranty(asset_id: str, db = None) -> Optional[dict]:
        """Finds any currently active warranty for an asset."""
        if db is None:
            db = get_db()
        now = datetime.now(timezone.utc).isoformat()
        w = db.warranties.find_one({
            "asset_id": asset_id,
            "status": WarrantyStatus.ACTIVE.value,
            "end_date": {"$gte": now}
        }, sort=[("end_date", -1)])
        if not w:
            return None
        s = serialize_doc(w)
        s["is_active"] = True
        return s

warranty_service = WarrantyService()
