from datetime import datetime, timezone
from typing import List, Optional
from bson import ObjectId
from fastapi import HTTPException, status
from app.core.dependencies import serialize_doc
from app.db.mongodb import get_db
from app.models.enums import AuditAction, UserRole
from app.schemas.asset import AssetCreateRequest, AssetUpdateRequest
from app.services.audit_service import audit_service

class AssetService:
    @staticmethod
    def create_asset(owner: dict, req: AssetCreateRequest, db = None) -> dict:
        if db is None:
            db = get_db()
        
        owner_id = owner["id"]
        now = datetime.now(timezone.utc).isoformat()

        asset_doc = {
            "owner_id": owner_id,
            "category": req.category.value if hasattr(req.category, "value") else str(req.category),
            "make": req.make.strip(),
            "model": req.model.strip(),
            "year": req.year,
            "serial_number": req.serial_number.strip() if req.serial_number else None,
            "color": req.color.strip() if req.color else None,
            "notes": req.notes.strip() if req.notes else None,
            "metadata": req.metadata or {},
            "created_at": now,
            "updated_at": now
        }

        res = db.assets.insert_one(asset_doc)
        asset_id = str(res.inserted_id)
        asset_doc["id"] = asset_id

        audit_service.log(
            action=AuditAction.ASSET_CREATED,
            user_id=owner_id,
            user_email=owner.get("email"),
            entity_type="asset",
            entity_id=asset_id,
            details={"make": req.make, "model": req.model, "category": asset_doc["category"]},
            db=db
        )

        serialized = serialize_doc(asset_doc)
        serialized["total_repairs_count"] = 0
        return serialized

    @staticmethod
    def get_asset(asset_id: str, current_user: dict, db = None) -> dict:
        if db is None:
            db = get_db()
        
        asset = None
        try:
            asset = db.assets.find_one({"_id": ObjectId(asset_id)})
        except Exception:
            pass
        if not asset:
            asset = db.assets.find_one({"_id": asset_id})

        if not asset:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found")

        # Authorization: owner, admin, or business with active job or active sharing grant
        user_id = current_user["id"]
        is_owner = asset["owner_id"] == user_id
        is_admin = current_user.get("role") == UserRole.ADMIN.value
        
        has_authorized_business_access = False
        if not (is_owner or is_admin):
            # Check if user belongs to a business that has an active repair job or active sharing grant for this asset
            user_memberships = list(db.memberships.find({"user_id": user_id, "status": "active"}))
            owned_businesses = list(db.businesses.find({"owner_id": user_id, "is_active": True}))
            all_biz_ids = [str(m["business_id"]) for m in user_memberships] + [str(b["_id"]) for b in owned_businesses]

            if all_biz_ids:
                # Active job?
                job = db.repair_jobs.find_one({"asset_id": asset_id, "business_id": {"$in": all_biz_ids}})
                if job:
                    has_authorized_business_access = True
                else:
                    # Active unexpired unrevoked sharing grant?
                    now = datetime.now(timezone.utc).isoformat()
                    grant = db.sharing_grants.find_one({
                        "asset_id": asset_id,
                        "target_business_id": {"$in": all_biz_ids},
                        "status": "active",
                        "expires_at": {"$gte": now}
                    })
                    if grant:
                        has_authorized_business_access = True

        if not (is_owner or is_admin or has_authorized_business_access):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. You do not own this asset or lack an authorized repair job / sharing grant."
            )

        serialized = serialize_doc(asset)
        serialized["total_repairs_count"] = db.repair_jobs.count_documents({"asset_id": asset_id})
        return serialized

    @staticmethod
    def list_user_assets(user_id: str, category: Optional[str] = None, skip: int = 0, limit: int = 50, db = None) -> List[dict]:
        if db is None:
            db = get_db()
        
        query = {"owner_id": user_id}
        if category:
            query["category"] = category

        cursor = db.assets.find(query).skip(skip).limit(limit).sort("created_at", -1)
        results = []
        for doc in cursor:
            s = serialize_doc(doc)
            s["total_repairs_count"] = db.repair_jobs.count_documents({"asset_id": s["id"]})
            results.append(s)
        return results

    @staticmethod
    def update_asset(asset_id: str, owner: dict, req: AssetUpdateRequest, db = None) -> dict:
        if db is None:
            db = get_db()
        
        target_id = ObjectId(asset_id) if ObjectId.is_valid(asset_id) else asset_id
        asset = db.assets.find_one({"_id": target_id})
        if not asset:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found")

        if asset["owner_id"] != owner["id"] and owner.get("role") != UserRole.ADMIN.value:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only owner can update asset")

        updates = {}
        if req.category is not None:
            updates["category"] = req.category.value if hasattr(req.category, "value") else str(req.category)
        if req.make is not None:
            updates["make"] = req.make.strip()
        if req.model is not None:
            updates["model"] = req.model.strip()
        if req.year is not None:
            updates["year"] = req.year
        if req.serial_number is not None:
            updates["serial_number"] = req.serial_number.strip() if req.serial_number else None
        if req.color is not None:
            updates["color"] = req.color.strip() if req.color else None
        if req.notes is not None:
            updates["notes"] = req.notes.strip() if req.notes else None
        if req.metadata is not None:
            updates["metadata"] = req.metadata
        
        updates["updated_at"] = datetime.now(timezone.utc).isoformat()
        db.assets.update_one({"_id": target_id}, {"$set": updates})

        updated = db.assets.find_one({"_id": target_id})
        s = serialize_doc(updated)
        s["total_repairs_count"] = db.repair_jobs.count_documents({"asset_id": asset_id})
        return s

asset_service = AssetService()
