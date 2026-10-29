from typing import List, Optional
from pydantic import BaseModel, Field
from app.models.enums import EstimateDecision, EstimateStatus

class EstimateLineItem(BaseModel):
    description: str = Field(min_length=1)
    quantity: int = Field(ge=1, default=1)
    unit_price_minor: int = Field(ge=0, description="Price per unit in minor units (e.g. cents)")
    item_type: str = Field(default="parts", description="parts, labor, diagnostic, or fee")

    @property
    def total_minor(self) -> int:
        return self.quantity * self.unit_price_minor

class EstimateCreateRequest(BaseModel):
    line_items: List[EstimateLineItem] = Field(min_length=1)
    currency: str = Field(default="USD", min_length=3, max_length=3)
    tax_rate_percent: float = Field(default=0.0, ge=0.0, le=100.0)
    notes: Optional[str] = None
    expires_in_days: int = Field(default=14, ge=1, le=90)

class EstimateDecisionRequest(BaseModel):
    decision: EstimateDecision
    notes: Optional[str] = None

class EstimateResponse(BaseModel):
    id: str
    job_id: str
    version: int
    status: EstimateStatus
    line_items: List[dict]
    subtotal_minor: int
    tax_minor: int
    total_minor: int
    currency: str
    notes: Optional[str] = None
    created_by_user_id: str
    expires_at: Optional[str] = None
    created_at: str
    decided_at: Optional[str] = None
    decision_notes: Optional[str] = None
