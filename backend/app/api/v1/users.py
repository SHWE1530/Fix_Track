from datetime import datetime, timezone
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.dependencies import get_current_user, serialize_doc
from app.db.mongodb import get_db
from app.schemas.user import UserResponse, UserUpdateRequest

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/profile", response_model=UserResponse)
def get_profile(current_user: dict = Depends(get_current_user)):
    return current_user

@router.put("/profile", response_model=UserResponse)
def update_profile(req: UserUpdateRequest, current_user: dict = Depends(get_current_user), db = Depends(get_db)):
    user_id = current_user["id"]
    updates = {}
    if req.full_name is not None:
        updates["full_name"] = req.full_name.strip()
    if req.phone is not None:
        updates["phone"] = req.phone.strip()
    
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    target_id = ObjectId(user_id) if ObjectId.is_valid(user_id) else user_id
    db.users.update_one({"_id": target_id}, {"$set": updates})
    
    updated = db.users.find_one({"_id": target_id})
    return serialize_doc(updated)
