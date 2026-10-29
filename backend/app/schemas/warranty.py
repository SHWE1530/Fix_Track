from typing import Optional
from pydantic import BaseModel, Field
from app.models.enums import WarrantyStatus

class WarrantyCreateRequest(BaseModel):
    duration_days: int = Field(default=90, ge=1, le=3650)
    covered_terms: str = Field(min_length=5, description="Terms and covered components")
    limitations: Optional[str] = Field(default="Excludes accidental drops, water ingress, and unauthorized modifications")

class WarrantyResponse(BaseModel):
    id: str
    warranty_number: str
    job_id: str
    asset_id: str
    customer_id: str
    business_id: str
    business_name: str
    start_date: str
    end_date: str
    duration_days: int
    covered_terms: str
    limitations: Optional[str] = None
    status: WarrantyStatus
    created_at: str
    is_active: bool
