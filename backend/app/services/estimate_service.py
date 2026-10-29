from datetime import datetime, timedelta, timezone
from typing import Optional
from bson import ObjectId
from fastapi import HTTPException, status
from app.core.dependencies import serialize_doc
from app.db.mongodb import get_db
from app.models.enums import AuditAction, EstimateDecision, EstimateStatus, JobStatus, NotificationType, UserRole
from app.schemas.estimate import EstimateCreateRequest, EstimateDecisionRequest
from app.services.audit_service import audit_service
from app.services.notification_service import notification_service

class EstimateService:
    @staticmethod
    def create_estimate(job_id: str, current_user: dict, req: EstimateCreateRequest, db = None) -> dict:
        """
        Creates an immutable versioned estimate.
        Once created and submitted, it moves the job to AWAITING_APPROVAL.
        If previous estimates exist, a new incremented version is created (v1 -> v2).
        """
        if db is None:
            db = get_db()
        
        job_obj_id = ObjectId(job_id) if ObjectId.is_valid(job_id) else job_id
        job = db.repair_jobs.find_one({"_id": job_obj_id})
        if not job:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Repair job not found")

        # Verify staff membership or ownership of business
        user_id = current_user["id"]
        biz_id = job["business_id"]
        biz = db.businesses.find_one({"_id": ObjectId(biz_id) if ObjectId.is_valid(biz_id) else biz_id})
        is_owner = biz and biz.get("owner_id") == user_id
        mem = db.memberships.find_one({"business_id": biz_id, "user_id": user_id, "status": "active"})
        is_admin = current_user.get("role") == UserRole.ADMIN.value

        if not (is_owner or mem or is_admin):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only authorized business staff can prepare estimates for this job"
            )

        # Disallow new estimate if job is already CLOSED or CANCELLED
        if job.get("status") in [JobStatus.CLOSED.value, JobStatus.CANCELLED.value]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot create estimate for job in '{job.get('status')}' state"
            )

        # Calculate line item subtotals in integer minor units
        subtotal_minor = 0
        formatted_items = []
        for item in req.line_items:
            item_total = item.quantity * item.unit_price_minor
            subtotal_minor += item_total
            formatted_items.append({
                "description": item.description.strip(),
                "quantity": item.quantity,
                "unit_price_minor": item.unit_price_minor,
                "total_minor": item_total,
                "item_type": item.item_type
            })

        tax_minor = int(round(subtotal_minor * (req.tax_rate_percent / 100.0)))
        total_minor = subtotal_minor + tax_minor

        # Determine version number
        latest_est = db.estimates.find_one({"job_id": job_id}, sort=[("version", -1)])
        next_version = (latest_est["version"] + 1) if latest_est else 1

        # Supersede any previous submitted draft estimates
        db.estimates.update_many(
            {"job_id": job_id, "status": {"$in": [EstimateStatus.DRAFT.value, EstimateStatus.SUBMITTED.value]}},
            {"$set": {"status": EstimateStatus.SUPERSEDED.value}}
        )

        now = datetime.now(timezone.utc)
        expires_at = now + timedelta(days=req.expires_in_days)

        estimate_doc = {
            "job_id": job_id,
            "version": next_version,
            "status": EstimateStatus.SUBMITTED.value,
            "line_items": formatted_items,
            "subtotal_minor": subtotal_minor,
            "tax_minor": tax_minor,
            "total_minor": total_minor,
            "currency": req.currency.upper(),
            "notes": req.notes.strip() if req.notes else None,
            "created_by_user_id": user_id,
            "expires_at": expires_at.isoformat(),
            "created_at": now.isoformat(),
            "decided_at": None,
            "decision_notes": None
        }

        res = db.estimates.insert_one(estimate_doc)
        estimate_id = str(res.inserted_id)
        estimate_doc["id"] = estimate_id

        # Transition job status to AWAITING_APPROVAL
        db.repair_jobs.update_one(
            {"_id": job_obj_id},
            {"$set": {"status": JobStatus.AWAITING_APPROVAL.value, "updated_at": now.isoformat()}}
        )

        db.job_events.insert_one({
            "job_id": job_id,
            "actor_id": user_id,
            "actor_name": current_user.get("full_name"),
            "actor_role": current_user.get("role"),
            "from_status": job.get("status"),
            "to_status": JobStatus.AWAITING_APPROVAL.value,
            "reason": f"Estimate v{next_version} submitted for customer review ({req.currency.upper()} {total_minor/100:.2f})",
            "created_at": now.isoformat()
        })

        audit_service.log(
            action=AuditAction.ESTIMATE_SUBMITTED,
            user_id=user_id,
            user_email=current_user.get("email"),
            entity_type="estimate",
            entity_id=estimate_id,
            details={"job_id": job_id, "version": next_version, "total_minor": total_minor},
            db=db
        )

        # Notify customer
        notification_service.create(
            user_id=job["customer_id"],
            title=f"Estimate Ready for Approval: Job {job.get('job_number')}",
            message=f"Estimate v{next_version} is ready for review. Total: {req.currency.upper()} {total_minor/100:.2f}.",
            type=NotificationType.ESTIMATE_SUBMITTED,
            link_url=f"/jobs/{job_id}",
            db=db
        )

        return serialize_doc(estimate_doc)

    @staticmethod
    def decide_estimate(
        estimate_id: str,
        current_user: dict,
        req: EstimateDecisionRequest,
        db = None
    ) -> dict:
        """
        Customer approves, rejects, or requests changes on an active estimate.
        Rejects decisions on stale or superseded versions.
        """
        if db is None:
            db = get_db()
        
        est_obj_id = ObjectId(estimate_id) if ObjectId.is_valid(estimate_id) else estimate_id
        estimate = db.estimates.find_one({"_id": est_obj_id})
        if not estimate:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Estimate not found")

        job_id = estimate["job_id"]
        job = db.repair_jobs.find_one({"_id": ObjectId(job_id) if ObjectId.is_valid(job_id) else job_id})
        if not job:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Associated job not found")

        user_id = current_user["id"]
        # Only customer who owns the job or admin can make this decision
        if job["customer_id"] != user_id and current_user.get("role") != UserRole.ADMIN.value:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the customer owning this repair job can approve or reject estimates"
            )

        # STALE VERSION CHECK: Cannot decide on superseded or already decided estimate
        if estimate.get("status") != EstimateStatus.SUBMITTED.value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"This estimate is in '{estimate.get('status')}' status and cannot be modified. Only active submitted estimates can be decided upon."
            )

        now = datetime.now(timezone.utc).isoformat()
        decision = req.decision

        if decision == EstimateDecision.APPROVE:
            db.estimates.update_one(
                {"_id": est_obj_id},
                {
                    "$set": {
                        "status": EstimateStatus.APPROVED.value,
                        "decided_at": now,
                        "decision_notes": req.notes.strip() if req.notes else "Approved by customer"
                    }
                }
            )

            # Transition job status to APPROVED
            db.repair_jobs.update_one(
                {"_id": job["_id"]},
                {"$set": {"status": JobStatus.APPROVED.value, "updated_at": now}}
            )

            db.job_events.insert_one({
                "job_id": job_id,
                "actor_id": user_id,
                "actor_name": current_user.get("full_name"),
                "actor_role": current_user.get("role"),
                "from_status": job.get("status"),
                "to_status": JobStatus.APPROVED.value,
                "reason": f"Customer approved Estimate v{estimate.get('version')}",
                "created_at": now
            })

            # Notify business
            biz = db.businesses.find_one({"_id": ObjectId(job["business_id"]) if ObjectId.is_valid(job["business_id"]) else job["business_id"]})
            if biz:
                notification_service.create(
                    user_id=biz["owner_id"],
                    title=f"Estimate Approved: Job {job.get('job_number')}",
                    message=f"Customer approved estimate v{estimate.get('version')}. You may now begin repair work.",
                    type=NotificationType.ESTIMATE_DECIDED,
                    link_url=f"/business/jobs/{job_id}",
                    db=db
                )

        elif decision == EstimateDecision.REJECT:
            db.estimates.update_one(
                {"_id": est_obj_id},
                {
                    "$set": {
                        "status": EstimateStatus.REJECTED.value,
                        "decided_at": now,
                        "decision_notes": req.notes.strip() if req.notes else "Rejected by customer"
                    }
                }
            )

            # Move job back to DIAGNOSING (shop can propose alternative or discuss with customer)
            db.repair_jobs.update_one(
                {"_id": job["_id"]},
                {"$set": {"status": JobStatus.DIAGNOSING.value, "updated_at": now}}
            )

            db.job_events.insert_one({
                "job_id": job_id,
                "actor_id": user_id,
                "actor_name": current_user.get("full_name"),
                "actor_role": current_user.get("role"),
                "from_status": job.get("status"),
                "to_status": JobStatus.DIAGNOSING.value,
                "reason": f"Customer rejected estimate v{estimate.get('version')}. Notes: {req.notes or 'None'}",
                "created_at": now
            })

        elif decision == EstimateDecision.REQUEST_CHANGES:
            db.estimates.update_one(
                {"_id": est_obj_id},
                {
                    "$set": {
                        "status": EstimateStatus.REJECTED.value,
                        "decided_at": now,
                        "decision_notes": f"Changes requested: {req.notes or 'Please revise estimate'}"
                    }
                }
            )

            db.repair_jobs.update_one(
                {"_id": job["_id"]},
                {"$set": {"status": JobStatus.DIAGNOSING.value, "updated_at": now}}
            )

            db.job_events.insert_one({
                "job_id": job_id,
                "actor_id": user_id,
                "actor_name": current_user.get("full_name"),
                "actor_role": current_user.get("role"),
                "from_status": job.get("status"),
                "to_status": JobStatus.DIAGNOSING.value,
                "reason": f"Customer requested estimate changes. Notes: {req.notes or 'None'}",
                "created_at": now
            })

        audit_service.log(
            action=AuditAction.ESTIMATE_DECISION,
            user_id=user_id,
            user_email=current_user.get("email"),
            entity_type="estimate",
            entity_id=estimate_id,
            details={"decision": decision.value, "job_id": job_id},
            db=db
        )

        updated_est = db.estimates.find_one({"_id": est_obj_id})
        return serialize_doc(updated_est)

    @staticmethod
    def get_job_estimates(job_id: str, db = None):
        if db is None:
            db = get_db()
        cursor = db.estimates.find({"job_id": job_id}).sort("version", 1)
        return [serialize_doc(e) for e in cursor]

estimate_service = EstimateService()
