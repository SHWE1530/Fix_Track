from typing import Any, Dict, Optional
from pydantic import BaseModel
from app.models.enums import AuditAction

class AuditLogResponse(BaseModel):
    id: str
    action: AuditAction
    user_id: Optional[str] = None
    user_email: Optional[str] = None
    ip_address: Optional[str] = None
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None
    details: Dict[str, Any] = {}
    created_at: str
