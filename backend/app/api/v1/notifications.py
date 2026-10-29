from typing import List
from bson import ObjectId
from fastapi import APIRouter, Depends
from app.core.dependencies import get_current_user, serialize_doc
from app.db.mongodb import get_db
from app.schemas.notification import NotificationResponse

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("", response_model=List[NotificationResponse])
def get_notifications(current_user: dict = Depends(get_current_user), db = Depends(get_db)):
    cursor = db.notifications.find({"user_id": current_user["id"]}).sort("created_at", -1).limit(50)
    return [serialize_doc(n) for n in cursor]

@router.post("/{notification_id}/read", response_model=NotificationResponse)
def mark_read(notification_id: str, current_user: dict = Depends(get_current_user), db = Depends(get_db)):
    t_id = ObjectId(notification_id) if ObjectId.is_valid(notification_id) else notification_id
    db.notifications.update_one({"_id": t_id, "user_id": current_user["id"]}, {"$set": {"is_read": True}})
    doc = db.notifications.find_one({"_id": t_id})
    return serialize_doc(doc)

@router.post("/mark-all-read")
def mark_all_read(current_user: dict = Depends(get_current_user), db = Depends(get_db)):
    db.notifications.update_many({"user_id": current_user["id"]}, {"$set": {"is_read": True}})
    return {"message": "All notifications marked as read"}
