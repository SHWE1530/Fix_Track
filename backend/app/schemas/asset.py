from typing import Any, Dict, Optional
from pydantic import BaseModel, Field
from app.models.enums import AssetCategory

class AssetCreateRequest(BaseModel):
    category: AssetCategory
    make: str = Field(min_length=1, description="e.g. Apple, Dell, Bosch, Trek, Honda")
    model: str = Field(min_length=1, description="e.g. iPhone 15 Pro, XPS 15, Series 8 Washing Machine")
    year: Optional[int] = None
    serial_number: Optional[str] = None
    color: Optional[str] = None
    notes: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Configurable category-specific metadata")

class AssetUpdateRequest(BaseModel):
    category: Optional[AssetCategory] = None
    make: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    serial_number: Optional[str] = None
    color: Optional[str] = None
    notes: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class AssetResponse(BaseModel):
    id: str
    owner_id: str
    category: str
    make: str
    model: str
    year: Optional[int] = None
    serial_number: Optional[str] = None
    color: Optional[str] = None
    notes: Optional[str] = None
    metadata: Dict[str, Any] = {}
    created_at: str
    updated_at: Optional[str] = None
    total_repairs_count: int = 0
