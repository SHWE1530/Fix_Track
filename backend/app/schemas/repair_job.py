from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from app.models.enums import JobStatus
from app.schemas.estimate import EstimateResponse
from app.schemas.warranty import WarrantyResponse

class RepairJobCreateRequest(BaseModel):
    asset_id: str
    business_id: str
    reported_issue: str = Field(min_length=5, description="Clear description of the problem")
    customer_notes: Optional[str] = None
    repeat_fault_of_job_id: Optional[str] = Field(default=None, description="ID of earlier repair job if this is a recurring defect")

class JobIntakeRequest(BaseModel):
    physical_condition: str = Field(min_length=3, description="Document scratches, dents, cracked glass, etc.")
    accessories_included: Optional[str] = Field(default="None", description="Chargers, cases, cables, pedals, etc.")
    security_lock_code_provided: Optional[bool] = False
    intake_notes: Optional[str] = None

class JobDiagnosisRequest(BaseModel):
    diagnosis_summary: str = Field(min_length=5)
    technical_findings: str = Field(min_length=5)
    diagnostic_fee_minor: int = Field(default=0, ge=0)
    requires_parts: bool = True
    can_proceed_to_estimate: bool = True
    private_technician_notes: Optional[str] = None

class JobStatusTransitionRequest(BaseModel):
    to_status: JobStatus
    reason: Optional[str] = None

class WorkCompletionRequest(BaseModel):
    work_performed: str = Field(min_length=5, description="Itemized work performed")
    parts_replaced: List[str] = Field(default_factory=list, description="List of parts replaced")
    technician_notes: Optional[str] = None
    handover_notes: Optional[str] = None

class JobHandoverRequest(BaseModel):
    collected_by_name: str = Field(min_length=2)
    confirmation_notes: Optional[str] = None

class JobEventResponse(BaseModel):
    id: str
    job_id: str
    actor_id: str
    actor_name: Optional[str] = None
    actor_role: str
    from_status: Optional[str] = None
    to_status: str
    reason: Optional[str] = None
    created_at: str

class RepairJobResponse(BaseModel):
    id: str
    job_number: str
    asset_id: str
    customer_id: str
    business_id: str
    status: JobStatus
    reported_issue: str
    customer_notes: Optional[str] = None
    
    # Asset details snapshot
    asset_summary: Optional[Dict[str, Any]] = None
    customer_summary: Optional[Dict[str, Any]] = None
    business_summary: Optional[Dict[str, Any]] = None

    # Intake
    physical_condition: Optional[str] = None
    accessories_included: Optional[str] = None
    intake_notes: Optional[str] = None
    checked_in_at: Optional[str] = None

    # Diagnosis
    diagnosis_summary: Optional[str] = None
    technical_findings: Optional[str] = None
    diagnostic_fee_minor: int = 0
    diagnosed_at: Optional[str] = None

    # Work & Handover
    work_performed: Optional[str] = None
    parts_replaced: List[str] = []
    completed_at: Optional[str] = None
    collected_at: Optional[str] = None
    closed_at: Optional[str] = None
    cancellation_reason: Optional[str] = None

    # Repeat fault reference
    repeat_fault_of_job_id: Optional[str] = None
    repeat_fault_job_number: Optional[str] = None

    # Timestamps
    created_at: str
    updated_at: Optional[str] = None

    # Related items
    latest_estimate: Optional[EstimateResponse] = None
    active_warranty: Optional[WarrantyResponse] = None
    events: List[JobEventResponse] = []
