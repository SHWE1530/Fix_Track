from typing import Optional
from pydantic import BaseModel
from app.models.enums import NotificationType

class NotificationResponse(BaseModel):
    id: str
    user_id: str
    title: str
    message: str
    type: NotificationType
    link_url: Optional[str] = None
    is_read: bool
    created_at: str
