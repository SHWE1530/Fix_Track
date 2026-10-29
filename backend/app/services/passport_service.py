from datetime import datetime, timezone
from typing import List, Optional
from bson import ObjectId
from fastapi import HTTPException, status
from app.core.dependencies import serialize_doc
from app.db.mongodb import get_db
from app.models.enums import SharingGrantStatus, UserRole

class PassportService:
    @staticmethod
    def get_repair_passport(
        asset_id: str,
        current_user: dict,
        target_business_id: Optional[str] = None,
        db = None
    ) -> dict:
        if db is None:
            db = get_db()
        
        asset_obj_id = ObjectId(asset_id) if ObjectId.is_valid(asset_id) else asset_id
        asset = db.assets.find_one({"_id": asset_obj_id})
        if not asset:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found")

        user_id = current_user["id"]
        user_role = current_user.get("role")
        is_owner = asset["owner_id"] == user_id
        is_admin = user_role == UserRole.ADMIN.value

        grant_doc = None
        has_active_grant = False

        # If not the owner or admin, check authorization strictly via active job or sharing grant
        if not (is_owner or is_admin):
            # Identify user's businesses
            owned_biz = [str(b["_id"]) for b in db.businesses.find({"owner_id": user_id})]
            staff_biz = [str(m["business_id"]) for m in db.memberships.find({"user_id": user_id, "status": "active"})]
            user_biz_ids = list(set(owned_biz + staff_biz))

            if not user_biz_ids:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied. You do not own this asset and are not affiliated with a repair business."
                )

            # Check if there is an active job at any of these businesses
            has_active_job = db.repair_jobs.find_one({
                "asset_id": asset_id,
                "business_id": {"$in": user_biz_ids}
            }) is not None

            # Check if there is an active sharing grant for any of these businesses
            now = datetime.now(timezone.utc).isoformat()
            grant_doc = db.sharing_grants.find_one({
                "asset_id": asset_id,
                "target_business_id": {"$in": user_biz_ids},
                "status": SharingGrantStatus.ACTIVE.value,
                "expires_at": {"$gte": now}
            })

            if grant_doc:
                has_active_grant = True

            if not (has_active_job or has_active_grant):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied. The asset owner has not granted your business access to this Repair Passport, and you have no active jobs for this asset."
                )

        # Retrieve jobs for this asset
        job_query = {"asset_id": asset_id}
        # If accessing via sharing grant with restricted job IDs, filter to allowed jobs
        if grant_doc and grant_doc.get("selected_job_ids"):
            allowed_ids = [ObjectId(jid) if ObjectId.is_valid(jid) else jid for jid in grant_doc["selected_job_ids"]]
            job_query["_id"] = {"$in": allowed_ids}

        jobs_cursor = db.repair_jobs.find(job_query).sort("created_at", 1)
        records = []

        for job in jobs_cursor:
            job_id_str = str(job["_id"])
            biz = db.businesses.find_one({"_id": ObjectId(job["business_id"]) if ObjectId.is_valid(job["business_id"]) else job["business_id"]})
            biz_name = biz.get("name") if biz else "Independent Repair Provider"

            # Fetch approved estimate summary (if any)
            approved_est = db.estimates.find_one({"job_id": job_id_str, "status": "approved"})
            est_summary = None
            if approved_est:
                est_summary = {
                    "total_minor": approved_est.get("total_minor"),
                    "currency": approved_est.get("currency", "USD"),
                    "version": approved_est.get("version"),
                    "item_count": len(approved_est.get("line_items", []))
                }

            # Fetch warranty (if any)
            warranty = db.warranties.find_one({"job_id": job_id_str})
            war_summary = None
            if warranty:
                now_str = datetime.now(timezone.utc).isoformat()
                is_active = warranty.get("status") == "active" and warranty.get("end_date", "") >= now_str
                war_summary = {
                    "warranty_number": warranty.get("warranty_number"),
                    "start_date": warranty.get("start_date"),
                    "end_date": warranty.get("end_date"),
                    "duration_days": warranty.get("duration_days"),
                    "covered_terms": warranty.get("covered_terms"),
                    "limitations": warranty.get("limitations"),
                    "is_active": is_active
                }

            # Fetch customer-visible attachments
            attachments = list(db.attachments.find({
                "job_id": job_id_str,
                "is_customer_visible": True
            }))

            rec = {
                "job_id": job_id_str,
                "job_number": job.get("job_number"),
                "business_id": job.get("business_id"),
                "business_name": biz_name,
                "service_date": job.get("checked_in_at") or job.get("created_at"),
                "reported_issue": job.get("reported_issue"),
                "diagnosis_summary": job.get("diagnosis_summary"),
                "work_performed": job.get("work_performed"),
                "parts_replaced": job.get("parts_replaced", []),
                "status": job.get("status"),
                "approved_estimate_summary": est_summary,
                "warranty": war_summary,
                "repeat_fault_of_job_number": job.get("repeat_fault_job_number"),
                "customer_attachments": [
                    {
                        "id": str(a["_id"]),
                        "filename": a.get("filename"),
                        "attachment_type": a.get("attachment_type"),
                        "url": a.get("url")
                    } for a in attachments
                ]
            }
            records.append(rec)

        # Owner information
        owner = db.users.find_one({"_id": ObjectId(asset["owner_id"]) if ObjectId.is_valid(asset["owner_id"]) else asset["owner_id"]})
        owner_name = owner.get("full_name") if owner else "Verified Owner"

        # Active warranty on asset
        now_str = datetime.now(timezone.utc).isoformat()
        latest_active_warranty = db.warranties.find_one({
            "asset_id": asset_id,
            "status": "active",
            "end_date": {"$gte": now_str}
        }, sort=[("end_date", -1)])

        return {
            "asset": serialize_doc(asset),
            "owner_name": owner_name,
            "total_service_records": len(records),
            "active_warranty": serialize_doc(latest_active_warranty) if latest_active_warranty else None,
            "records": records,
            "has_active_grant": has_active_grant or is_owner or is_admin,
            "grant_id": str(grant_doc["_id"]) if grant_doc else None,
            "grant_expires_at": grant_doc.get("expires_at") if grant_doc else None
        }

passport_service = PassportService()
