from typing import Optional
from pydantic import BaseModel, EmailStr, Field
from app.models.enums import UserRole

class UserRegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, description="Minimum 8 characters")
    full_name: str = Field(min_length=2)
    phone: Optional[str] = None
    role: UserRole = Field(default=UserRole.CUSTOMER, description="Role: customer or business_owner")

class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8)
