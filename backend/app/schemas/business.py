from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field
from app.models.enums import AssetCategory, MembershipRole, MembershipStatus

class BusinessCreateRequest(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    legal_name: Optional[str] = None
    email: EmailStr
    phone: str = Field(min_length=5)
    address: str = Field(min_length=3)
    website: Optional[str] = None
    description: Optional[str] = None
    supported_categories: List[AssetCategory] = Field(default_factory=lambda: [AssetCategory.SMARTPHONES_TABLETS, AssetCategory.LAPTOPS_COMPUTERS])

class BusinessUpdateRequest(BaseModel):
    name: Optional[str] = None
    legal_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    website: Optional[str] = None
    description: Optional[str] = None
    supported_categories: Optional[List[AssetCategory]] = None

class BusinessResponse(BaseModel):
    id: str
    owner_id: str
    name: str
    legal_name: Optional[str] = None
    email: str
    phone: str
    address: str
    website: Optional[str] = None
    description: Optional[str] = None
    supported_categories: List[str]
    is_verified: bool
    is_active: bool
    created_at: str
    updated_at: Optional[str] = None

class StaffInviteRequest(BaseModel):
    email: EmailStr
    full_name: str
    role: MembershipRole = MembershipRole.TECHNICIAN
    password: Optional[str] = "TemporaryP@ss123"

class StaffMembershipResponse(BaseModel):
    id: str
    business_id: str
    user_id: str
    user_email: str
    user_name: str
    role: MembershipRole
    status: MembershipStatus
    created_at: str

class StaffUpdateRequest(BaseModel):
    role: Optional[MembershipRole] = None
    status: Optional[MembershipStatus] = None
