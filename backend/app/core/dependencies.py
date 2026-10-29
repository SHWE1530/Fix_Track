from typing import List, Optional
from bson import ObjectId
from fastapi import Depends, HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from app.core.security import decode_access_token
from app.db.mongodb import get_db
from app.models.enums import MembershipRole, MembershipStatus, UserRole

security_scheme = HTTPBearer(auto_error=False)

def serialize_doc(doc: Optional[dict]) -> Optional[dict]:
    """Helper to convert MongoDB _id to string id and remove sensitive fields like password_hash."""
    if not doc:
        return None
    d = dict(doc)
    if "_id" in d:
        d["id"] = str(d["_id"])
        del d["_id"]
    if "password_hash" in d:
        del d["password_hash"]
    return d

def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security_scheme),
    db = Depends(get_db)
) -> dict:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    payload = decode_access_token(credentials.credentials)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = payload["sub"]
    user = None
    try:
        user = db.users.find_one({"_id": ObjectId(user_id)})
    except Exception:
        pass
    
    if not user:
        user = db.users.find_one({"_id": user_id})

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated or suspended"
        )
    
    return serialize_doc(user)

def require_role(allowed_roles: List[UserRole]):
    def role_checker(current_user: dict = Depends(get_current_user)) -> dict:
        user_role = current_user.get("role")
        if user_role not in [r.value for r in allowed_roles]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: requires one of roles {[r.value for r in allowed_roles]}"
            )
        return current_user
    return role_checker

def verify_business_membership(
    business_id: str,
    user_id: str,
    allowed_roles: Optional[List[MembershipRole]] = None,
    db = None
) -> dict:
    """Verifies that the user has an active membership in the business with appropriate role."""
    if db is None:
        db = get_db()

    # Check direct ownership first
    business = None
    try:
        business = db.businesses.find_one({"_id": ObjectId(business_id)})
    except Exception:
        pass
    if not business:
        business = db.businesses.find_one({"_id": business_id})

    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business not found"
        )
    
    # If the user is the direct business owner
    if business.get("owner_id") == user_id:
        return {
            "business_id": business_id,
            "user_id": user_id,
            "role": MembershipRole.OWNER.value,
            "status": MembershipStatus.ACTIVE.value,
            "business": serialize_doc(business)
        }

    # Otherwise look up membership
    membership = db.memberships.find_one({
        "business_id": business_id,
        "user_id": user_id,
        "status": MembershipStatus.ACTIVE.value
    })

    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not an active staff member of this business"
        )
    
    if allowed_roles and membership.get("role") not in [r.value for r in allowed_roles]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Staff membership lacks required permission: {[r.value for r in allowed_roles]}"
        )

    return {
        **serialize_doc(membership),
        "business": serialize_doc(business)
    }
