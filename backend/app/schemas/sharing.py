from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from app.models.enums import SharingGrantStatus

class SharingGrantCreateRequest(BaseModel):
    asset_id: str
    target_business_id: str
    selected_job_ids: Optional[List[str]] = Field(default=None, description="Specific jobs to grant access to. None/empty grants all asset history.")
    expires_in_days: int = Field(default=30, ge=1, le=365)
    notes: Optional[str] = None

class SharingGrantResponse(BaseModel):
    id: str
    asset_id: str
    asset_summary: Optional[Dict[str, Any]] = None
    owner_id: str
    owner_name: Optional[str] = None
    target_business_id: str
    target_business_name: Optional[str] = None
    selected_job_ids: Optional[List[str]] = None
    expires_at: str
    status: SharingGrantStatus
    notes: Optional[str] = None
    token: str
    created_at: str
    is_valid: bool

class RepairPassportRecord(BaseModel):
    job_id: str
    job_number: str
    business_id: str
    business_name: str
    service_date: str
    reported_issue: str
    diagnosis_summary: Optional[str] = None
    work_performed: Optional[str] = None
    parts_replaced: List[str] = []
    status: str
    approved_estimate_summary: Optional[Dict[str, Any]] = None
    warranty: Optional[Dict[str, Any]] = None
    repeat_fault_of_job_number: Optional[str] = None
    customer_attachments: List[Dict[str, Any]] = []

class RepairPassportResponse(BaseModel):
    asset: Dict[str, Any]
    owner_name: str
    total_service_records: int
    active_warranty: Optional[Dict[str, Any]] = None
    records: List[RepairPassportRecord]
    has_active_grant: bool
    grant_id: Optional[str] = None
    grant_expires_at: Optional[str] = None
