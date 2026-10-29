from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from bson import ObjectId
from fastapi import HTTPException, status
from app.core.dependencies import serialize_doc
from app.db.mongodb import get_db
from app.models.enums import AuditAction, JobStatus, MembershipRole, NotificationType, UserRole
from app.schemas.repair_job import (
    JobDiagnosisRequest,
    JobHandoverRequest,
    JobIntakeRequest,
    JobStatusTransitionRequest,
    RepairJobCreateRequest,
    WorkCompletionRequest,
)
from app.services.audit_service import audit_service
from app.services.notification_service import notification_service
from app.utils.identifiers import generate_reference

VALID_TRANSITIONS = {
    JobStatus.REQUESTED.value: [JobStatus.CHECKED_IN.value, JobStatus.CANCELLED.value],
    JobStatus.CHECKED_IN.value: [JobStatus.DIAGNOSING.value, JobStatus.AWAITING_APPROVAL.value, JobStatus.CANCELLED.value],
    JobStatus.DIAGNOSING.value: [JobStatus.AWAITING_APPROVAL.value, JobStatus.ON_HOLD.value, JobStatus.CANCELLED.value],
    JobStatus.AWAITING_APPROVAL.value: [JobStatus.APPROVED.value, JobStatus.DIAGNOSING.value, JobStatus.CANCELLED.value],
    JobStatus.APPROVED.value: [JobStatus.IN_PROGRESS.value, JobStatus.ON_HOLD.value, JobStatus.CANCELLED.value],
    JobStatus.IN_PROGRESS.value: [JobStatus.READY_FOR_COLLECTION.value, JobStatus.ON_HOLD.value, JobStatus.AWAITING_APPROVAL.value, JobStatus.CANCELLED.value],
    JobStatus.ON_HOLD.value: [JobStatus.DIAGNOSING.value, JobStatus.IN_PROGRESS.value, JobStatus.AWAITING_APPROVAL.value, JobStatus.CANCELLED.value],
    JobStatus.READY_FOR_COLLECTION.value: [JobStatus.COLLECTED.value, JobStatus.IN_PROGRESS.value],
    JobStatus.COLLECTED.value: [JobStatus.CLOSED.value],
    JobStatus.CLOSED.value: [],
    JobStatus.CANCELLED.value: [],
}

class JobService:
    @staticmethod
    def create_repair_job(current_user: dict, req: RepairJobCreateRequest, db = None) -> dict:
        if db is None:
            db = get_db()
        
        user_id = current_user["id"]
        
        # Verify asset ownership
        asset_obj_id = ObjectId(req.asset_id) if ObjectId.is_valid(req.asset_id) else req.asset_id
        asset = db.assets.find_one({"_id": asset_obj_id})
        if not asset:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found")
        if asset["owner_id"] != user_id and current_user.get("role") != UserRole.ADMIN.value:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not own this asset")

        # Verify business exists and is active
        biz_obj_id = ObjectId(req.business_id) if ObjectId.is_valid(req.business_id) else req.business_id
        biz = db.businesses.find_one({"_id": biz_obj_id})
        if not biz or not biz.get("is_active", True):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Selected repair business is not available")

        # Verify business supports asset category
        if asset.get("category") not in biz.get("supported_categories", []):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Business does not service category '{asset.get('category')}'"
            )

        # Check repeat fault link if specified
        repeat_job_number = None
        if req.repeat_fault_of_job_id:
            prior_id = ObjectId(req.repeat_fault_of_job_id) if ObjectId.is_valid(req.repeat_fault_of_job_id) else req.repeat_fault_of_job_id
            prior_job = db.repair_jobs.find_one({"_id": prior_id, "asset_id": req.asset_id})
            if not prior_job:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Referenced repeat fault job was not found for this asset"
                )
            if prior_job.get("status") not in [JobStatus.COLLECTED.value, JobStatus.CLOSED.value]:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Repeat faults can only be linked to collected or closed prior repairs"
                )
            repeat_job_number = prior_job.get("job_number")

        now = datetime.now(timezone.utc).isoformat()
        job_number = generate_reference(prefix="FIX")

        job_doc = {
            "job_number": job_number,
            "asset_id": req.asset_id,
            "customer_id": user_id,
            "business_id": req.business_id,
            "status": JobStatus.REQUESTED.value,
            "reported_issue": req.reported_issue.strip(),
            "customer_notes": req.customer_notes.strip() if req.customer_notes else None,
            "repeat_fault_of_job_id": req.repeat_fault_of_job_id,
            "repeat_fault_job_number": repeat_job_number,
            "created_at": now,
            "updated_at": now
        }
        res = db.repair_jobs.insert_one(job_doc)
        job_id = str(res.inserted_id)
        job_doc["id"] = job_id

        # Log timeline event
        event_doc = {
            "job_id": job_id,
            "actor_id": user_id,
            "actor_name": current_user.get("full_name"),
            "actor_role": current_user.get("role"),
            "from_status": None,
            "to_status": JobStatus.REQUESTED.value,
            "reason": "Repair request submitted by customer",
            "created_at": now
        }
        db.job_events.insert_one(event_doc)

        audit_service.log(
            action=AuditAction.JOB_CREATED,
            user_id=user_id,
            user_email=current_user.get("email"),
            entity_type="repair_job",
            entity_id=job_id,
            details={"job_number": job_number, "business_id": req.business_id},
            db=db
        )

        # Notify business owner
        notification_service.create(
            user_id=biz["owner_id"],
            title="New Repair Request",
            message=f"New repair request {job_number} for {asset.get('make')} {asset.get('model')}",
            type=NotificationType.JOB_STATUS_CHANGED,
            link_url=f"/business/jobs/{job_id}",
            db=db
        )

        return JobService.get_job_detail(job_id, current_user, db)

    @staticmethod
    def get_job_detail(job_id: str, current_user: dict, db = None) -> dict:
        if db is None:
            db = get_db()
        
        job_obj_id = ObjectId(job_id) if ObjectId.is_valid(job_id) else job_id
        job = db.repair_jobs.find_one({"_id": job_obj_id})
        if not job:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Repair job not found")

        # Check authorization
        user_id = current_user["id"]
        user_role = current_user.get("role")
        is_customer = job["customer_id"] == user_id
        is_admin = user_role == UserRole.ADMIN.value
        
        is_business_staff = False
        if not (is_customer or is_admin):
            # Verify membership or ownership of business
            biz = db.businesses.find_one({"_id": ObjectId(job["business_id"]) if ObjectId.is_valid(job["business_id"]) else job["business_id"]})
            if biz and biz.get("owner_id") == user_id:
                is_business_staff = True
            else:
                mem = db.memberships.find_one({"business_id": job["business_id"], "user_id": user_id, "status": "active"})
                if mem:
                    is_business_staff = True

        if not (is_customer or is_admin or is_business_staff):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this repair job")

        serialized = serialize_doc(job)

        # Attach snapshots of asset, customer, business
        asset = db.assets.find_one({"_id": ObjectId(job["asset_id"]) if ObjectId.is_valid(job["asset_id"]) else job["asset_id"]})
        serialized["asset_summary"] = serialize_doc(asset) if asset else None

        customer = db.users.find_one({"_id": ObjectId(job["customer_id"]) if ObjectId.is_valid(job["customer_id"]) else job["customer_id"]})
        if customer:
            serialized["customer_summary"] = {
                "id": str(customer["_id"]),
                "full_name": customer.get("full_name"),
                "email": customer.get("email"),
                "phone": customer.get("phone")
            }

        biz = db.businesses.find_one({"_id": ObjectId(job["business_id"]) if ObjectId.is_valid(job["business_id"]) else job["business_id"]})
        if biz:
            serialized["business_summary"] = {
                "id": str(biz["_id"]),
                "name": biz.get("name"),
                "email": biz.get("email"),
                "phone": biz.get("phone"),
                "address": biz.get("address"),
                "is_verified": biz.get("is_verified", False)
            }

        # Latest estimate
        latest_est = db.estimates.find_one({"job_id": job_id}, sort=[("version", -1)])
        serialized["latest_estimate"] = serialize_doc(latest_est) if latest_est else None

        # Active warranty
        warranty = db.warranties.find_one({"job_id": job_id})
        if warranty:
            now_str = datetime.now(timezone.utc).isoformat()
            is_active = warranty.get("status") == "active" and warranty.get("end_date", "") >= now_str
            w_ser = serialize_doc(warranty)
            w_ser["is_active"] = is_active
            serialized["active_warranty"] = w_ser
        else:
            serialized["active_warranty"] = None

        # Events timeline
        events = list(db.job_events.find({"job_id": job_id}).sort("created_at", 1))
        serialized["events"] = [serialize_doc(e) for e in events]

        return serialized

    @staticmethod
    def list_jobs(
        current_user: dict,
        status_filter: Optional[str] = None,
        asset_id: Optional[str] = None,
        business_id: Optional[str] = None,
        skip: int = 0,
        limit: int = 50,
        db = None
    ) -> List[dict]:
        if db is None:
            db = get_db()
        
        user_id = current_user["id"]
        role = current_user.get("role")
        query: Dict[str, Any] = {}

        if role == UserRole.CUSTOMER.value:
            query["customer_id"] = user_id
        elif role in [UserRole.BUSINESS_OWNER.value, UserRole.TECHNICIAN.value]:
            if business_id:
                # verify user is member of this business
                biz = db.businesses.find_one({"_id": ObjectId(business_id) if ObjectId.is_valid(business_id) else business_id})
                mem = db.memberships.find_one({"business_id": business_id, "user_id": user_id, "status": "active"})
                if not (biz and biz.get("owner_id") == user_id or mem):
                    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized for this business")
                query["business_id"] = business_id
            else:
                # Find all businesses user belongs to
                owned = [str(b["_id"]) for b in db.businesses.find({"owner_id": user_id})]
                mems = [str(m["business_id"]) for m in db.memberships.find({"user_id": user_id, "status": "active"})]
                all_biz = list(set(owned + mems))
                query["business_id"] = {"$in": all_biz}
        elif role == UserRole.ADMIN.value:
            if business_id:
                query["business_id"] = business_id
        
        if status_filter:
            query["status"] = status_filter
        if asset_id:
            query["asset_id"] = asset_id

        cursor = db.repair_jobs.find(query).skip(skip).limit(limit).sort("created_at", -1)
        results = []
        for j in cursor:
            results.append(JobService.get_job_detail(str(j["_id"]), current_user, db))
        return results

    @staticmethod
    def transition_status(
        job_id: str,
        current_user: dict,
        req: JobStatusTransitionRequest,
        db = None
    ) -> dict:
        if db is None:
            db = get_db()
        
        job_obj_id = ObjectId(job_id) if ObjectId.is_valid(job_id) else job_id
        job = db.repair_jobs.find_one({"_id": job_obj_id})
        if not job:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

        current_status = job.get("status")
        target_status = req.to_status.value if hasattr(req.to_status, "value") else str(req.to_status)

        # Check valid state transitions
        allowed_next = VALID_TRANSITIONS.get(current_status, [])
        if target_status not in allowed_next:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid transition from '{current_status}' to '{target_status}'. Allowed next states: {allowed_next}"
            )

        user_id = current_user["id"]
        user_role = current_user.get("role")
        is_customer = job["customer_id"] == user_id
        is_admin = user_role == UserRole.ADMIN.value

        # Check actor authorization
        # Customer can only cancel or approve
        if is_customer and not is_admin:
            if target_status not in [JobStatus.CANCELLED.value, JobStatus.APPROVED.value]:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Customers cannot transition jobs to technician operational states"
                )

        # Check reason requirement for ON_HOLD and CANCELLED
        if target_status in [JobStatus.ON_HOLD.value, JobStatus.CANCELLED.value]:
            if not req.reason or len(req.reason.strip()) < 3:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"A clear reason is required when transitioning to '{target_status}'"
                )

        # CRITICAL RULE: "Do not allow repair work requiring approval to proceed until the relevant estimate has been approved."
        if target_status == JobStatus.IN_PROGRESS.value:
            # Check if there is an approved estimate
            approved_est = db.estimates.find_one({"job_id": job_id, "status": "approved"})
            if not approved_est:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot transition to IN_PROGRESS: an approved estimate is strictly required before repair work begins."
                )

        now = datetime.now(timezone.utc).isoformat()
        updates: Dict[str, Any] = {
            "status": target_status,
            "updated_at": now
        }
        if target_status == JobStatus.CANCELLED.value:
            updates["cancellation_reason"] = req.reason.strip()
        elif target_status == JobStatus.CLOSED.value:
            updates["closed_at"] = now

        db.repair_jobs.update_one({"_id": job_obj_id}, {"$set": updates})

        # Record timeline event
        event_doc = {
            "job_id": job_id,
            "actor_id": user_id,
            "actor_name": current_user.get("full_name"),
            "actor_role": user_role,
            "from_status": current_status,
            "to_status": target_status,
            "reason": req.reason.strip() if req.reason else None,
            "created_at": now
        }
        db.job_events.insert_one(event_doc)

        audit_service.log(
            action=AuditAction.JOB_STATUS_TRANSITION,
            user_id=user_id,
            user_email=current_user.get("email"),
            entity_type="repair_job",
            entity_id=job_id,
            details={"from_status": current_status, "to_status": target_status, "reason": req.reason},
            db=db
        )

        # Notify the counterparty
        recipient_id = job["business_id"] if is_customer else job["customer_id"]
        # If recipient is business, notify owner
        if is_customer:
            biz = db.businesses.find_one({"_id": ObjectId(job["business_id"]) if ObjectId.is_valid(job["business_id"]) else job["business_id"]})
            if biz:
                recipient_id = biz["owner_id"]

        notification_service.create(
            user_id=recipient_id,
            title=f"Repair Job {job.get('job_number')} Updated",
            message=f"Status transitioned from {current_status} to {target_status}." + (f" Reason: {req.reason}" if req.reason else ""),
            type=NotificationType.JOB_STATUS_CHANGED,
            link_url=f"/jobs/{job_id}",
            db=db
        )

        return JobService.get_job_detail(job_id, current_user, db)

    @staticmethod
    def record_intake(job_id: str, current_user: dict, req: JobIntakeRequest, db = None) -> dict:
        if db is None:
            db = get_db()
        
        job = db.repair_jobs.find_one({"_id": ObjectId(job_id) if ObjectId.is_valid(job_id) else job_id})
        if not job:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

        now = datetime.now(timezone.utc).isoformat()
        updates = {
            "physical_condition": req.physical_condition.strip(),
            "accessories_included": req.accessories_included.strip() if req.accessories_included else "None",
            "intake_notes": req.intake_notes.strip() if req.intake_notes else None,
            "checked_in_at": now,
            "updated_at": now
        }

        # If job is currently REQUESTED, automatically move it to CHECKED_IN
        if job.get("status") == JobStatus.REQUESTED.value:
            updates["status"] = JobStatus.CHECKED_IN.value
            db.job_events.insert_one({
                "job_id": job_id,
                "actor_id": current_user["id"],
                "actor_name": current_user.get("full_name"),
                "actor_role": current_user.get("role"),
                "from_status": JobStatus.REQUESTED.value,
                "to_status": JobStatus.CHECKED_IN.value,
                "reason": "Intake condition documented and checked in",
                "created_at": now
            })

        db.repair_jobs.update_one({"_id": job["_id"]}, {"$set": updates})
        return JobService.get_job_detail(job_id, current_user, db)

    @staticmethod
    def record_diagnosis(job_id: str, current_user: dict, req: JobDiagnosisRequest, db = None) -> dict:
        if db is None:
            db = get_db()
        
        job = db.repair_jobs.find_one({"_id": ObjectId(job_id) if ObjectId.is_valid(job_id) else job_id})
        if not job:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

        now = datetime.now(timezone.utc).isoformat()
        updates = {
            "diagnosis_summary": req.diagnosis_summary.strip(),
            "technical_findings": req.technical_findings.strip(),
            "diagnostic_fee_minor": req.diagnostic_fee_minor,
            "private_technician_notes": req.private_technician_notes.strip() if req.private_technician_notes else None,
            "diagnosed_at": now,
            "updated_at": now
        }

        # If job is in CHECKED_IN, advance to DIAGNOSING
        if job.get("status") == JobStatus.CHECKED_IN.value:
            updates["status"] = JobStatus.DIAGNOSING.value
            db.job_events.insert_one({
                "job_id": job_id,
                "actor_id": current_user["id"],
                "actor_name": current_user.get("full_name"),
                "actor_role": current_user.get("role"),
                "from_status": JobStatus.CHECKED_IN.value,
                "to_status": JobStatus.DIAGNOSING.value,
                "reason": "Technical diagnosis recorded",
                "created_at": now
            })

        db.repair_jobs.update_one({"_id": job["_id"]}, {"$set": updates})
        return JobService.get_job_detail(job_id, current_user, db)

    @staticmethod
    def record_work_completion(job_id: str, current_user: dict, req: WorkCompletionRequest, db = None) -> dict:
        if db is None:
            db = get_db()
        
        job = db.repair_jobs.find_one({"_id": ObjectId(job_id) if ObjectId.is_valid(job_id) else job_id})
        if not job:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

        now = datetime.now(timezone.utc).isoformat()
        updates = {
            "work_performed": req.work_performed.strip(),
            "parts_replaced": req.parts_replaced,
            "technician_notes": req.technician_notes.strip() if req.technician_notes else None,
            "handover_notes": req.handover_notes.strip() if req.handover_notes else None,
            "completed_at": now,
            "status": JobStatus.READY_FOR_COLLECTION.value,
            "updated_at": now
        }

        db.repair_jobs.update_one({"_id": job["_id"]}, {"$set": updates})

        db.job_events.insert_one({
            "job_id": job_id,
            "actor_id": current_user["id"],
            "actor_name": current_user.get("full_name"),
            "actor_role": current_user.get("role"),
            "from_status": job.get("status"),
            "to_status": JobStatus.READY_FOR_COLLECTION.value,
            "reason": "Work completed and item verified ready for collection",
            "created_at": now
        })

        # Notify customer
        notification_service.create(
            user_id=job["customer_id"],
            title=f"Repair Ready for Collection: {job.get('job_number')}",
            message="Your repair work is complete and ready for pickup!",
            type=NotificationType.JOB_STATUS_CHANGED,
            link_url=f"/jobs/{job_id}",
            db=db
        )

        return JobService.get_job_detail(job_id, current_user, db)

    @staticmethod
    def record_handover(job_id: str, current_user: dict, req: JobHandoverRequest, db = None) -> dict:
        if db is None:
            db = get_db()
        
        job = db.repair_jobs.find_one({"_id": ObjectId(job_id) if ObjectId.is_valid(job_id) else job_id})
        if not job:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

        if job.get("status") != JobStatus.READY_FOR_COLLECTION.value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Item can only be handed over when in READY_FOR_COLLECTION status"
            )

        now = datetime.now(timezone.utc).isoformat()
        updates = {
            "status": JobStatus.COLLECTED.value,
            "collected_at": now,
            "collected_by_name": req.collected_by_name.strip(),
            "handover_confirmation_notes": req.confirmation_notes.strip() if req.confirmation_notes else None,
            "updated_at": now
        }

        db.repair_jobs.update_one({"_id": job["_id"]}, {"$set": updates})

        db.job_events.insert_one({
            "job_id": job_id,
            "actor_id": current_user["id"],
            "actor_name": current_user.get("full_name"),
            "actor_role": current_user.get("role"),
            "from_status": JobStatus.READY_FOR_COLLECTION.value,
            "to_status": JobStatus.COLLECTED.value,
            "reason": f"Item collected by {req.collected_by_name}",
            "created_at": now
        })

        notification_service.create(
            user_id=job["customer_id"],
            title=f"Item Handed Over: {job.get('job_number')}",
            message="Handover successfully recorded. Thank you for using FixTrack!",
            type=NotificationType.JOB_STATUS_CHANGED,
            link_url=f"/jobs/{job_id}",
            db=db
        )

        return JobService.get_job_detail(job_id, current_user, db)

job_service = JobService()
