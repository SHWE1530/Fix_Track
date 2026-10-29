from datetime import datetime, timezone
from typing import Optional
from app.db.mongodb import get_db
from app.models.enums import NotificationType

class NotificationService:
    @staticmethod
    def create(
        user_id: str,
        title: str,
        message: str,
        type: NotificationType,
        link_url: Optional[str] = None,
        db = None
    ):
        if db is None:
            db = get_db()
        
        doc = {
            "user_id": str(user_id),
            "title": title,
            "message": message,
            "type": type.value if hasattr(type, "value") else str(type),
            "link_url": link_url,
            "is_read": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        try:
            db.notifications.insert_one(doc)
        except Exception:
            pass

notification_service = NotificationService()
