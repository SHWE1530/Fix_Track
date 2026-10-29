from datetime import datetime, timezone
from bson import ObjectId
from fastapi import HTTPException, status
from app.core.dependencies import serialize_doc
from app.core.security import create_access_token, hash_password, verify_password
from app.db.mongodb import get_db
from app.models.enums import AuditAction, UserRole
from app.schemas.auth import UserLoginRequest, UserRegisterRequest
from app.services.audit_service import audit_service

class AuthService:
    @staticmethod
    def register_user(req: UserRegisterRequest, ip_address: str = None, db = None) -> dict:
        if db is None:
            db = get_db()
        
        normalized_email = req.email.strip().lower()
        
        existing = db.users.find_one({"email": normalized_email})
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A user with this email address already exists"
            )
        
        # Admin cannot be registered publicly
        role = req.role
        if role == UserRole.ADMIN:
            role = UserRole.CUSTOMER
        
        now = datetime.now(timezone.utc).isoformat()
        user_doc = {
            "email": normalized_email,
            "password_hash": hash_password(req.password),
            "full_name": req.full_name.strip(),
            "phone": req.phone.strip() if req.phone else None,
            "role": role.value,
            "is_active": True,
            "created_at": now,
            "updated_at": now
        }
        result = db.users.insert_one(user_doc)
        user_id = str(result.inserted_id)
        user_doc["id"] = user_id
        user_doc["_id"] = result.inserted_id

        audit_service.log(
            action=AuditAction.USER_REGISTERED,
            user_id=user_id,
            user_email=normalized_email,
            entity_type="user",
            entity_id=user_id,
            details={"role": role.value},
            ip_address=ip_address,
            db=db
        )

        # Issue token immediately
        token = create_access_token(
            subject=user_id,
            extra_claims={"email": normalized_email, "role": role.value}
        )

        return {
            "access_token": token,
            "token_type": "bearer",
            "user": serialize_doc(user_doc)
        }

    @staticmethod
    def login_user(req: UserLoginRequest, ip_address: str = None, db = None) -> dict:
        if db is None:
            db = get_db()
        
        normalized_email = req.email.strip().lower()
        user = db.users.find_one({"email": normalized_email})
        if not user or not verify_password(req.password, user.get("password_hash", "")):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )
        
        if not user.get("is_active", True):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is suspended or deactivated. Contact platform support."
            )
        
        user_id = str(user["_id"])
        role = user.get("role", UserRole.CUSTOMER.value)

        token = create_access_token(
            subject=user_id,
            extra_claims={"email": normalized_email, "role": role}
        )

        audit_service.log(
            action=AuditAction.USER_LOGIN,
            user_id=user_id,
            user_email=normalized_email,
            entity_type="user",
            entity_id=user_id,
            ip_address=ip_address,
            db=db
        )

        return {
            "access_token": token,
            "token_type": "bearer",
            "user": serialize_doc(user)
        }

auth_service = AuthService()
