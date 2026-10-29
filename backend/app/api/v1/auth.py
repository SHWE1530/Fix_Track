from fastapi import APIRouter, Depends, Request
from app.core.dependencies import get_current_user
from app.core.rate_limiter import auth_rate_limiter
from app.db.mongodb import get_db
from app.schemas.auth import PasswordChangeRequest, TokenResponse, UserLoginRequest, UserRegisterRequest
from app.schemas.user import UserResponse
from app.services.auth_service import auth_service

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenResponse)
def register(req: UserRegisterRequest, request: Request, db = Depends(get_db)):
    auth_rate_limiter.check(request, key_prefix="auth:register")
    client_ip = request.client.host if request.client else None
    return auth_service.register_user(req, ip_address=client_ip, db=db)

@router.post("/login", response_model=TokenResponse)
def login(req: UserLoginRequest, request: Request, db = Depends(get_db)):
    auth_rate_limiter.check(request, key_prefix="auth:login")
    client_ip = request.client.host if request.client else None
    return auth_service.login_user(req, ip_address=client_ip, db=db)

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: dict = Depends(get_current_user)):
    return current_user

@router.post("/logout")
def logout(current_user: dict = Depends(get_current_user)):
    # JWT tokens are stateless; client clears token. Server returns confirmation.
    return {"message": "Successfully logged out"}
