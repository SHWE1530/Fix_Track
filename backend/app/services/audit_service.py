from datetime import datetime, timezone
from typing import Any, Dict, Optional
from app.db.mongodb import get_db
from app.models.enums import AuditAction

class AuditService:
    @staticmethod
    def log(
        action: AuditAction,
        user_id: Optional[str] = None,
        user_email: Optional[str] = None,
        entity_type: Optional[str] = None,
        entity_id: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        db = None
    ):
        if db is None:
            db = get_db()
        
        doc = {
            "action": action.value if hasattr(action, "value") else str(action),
            "user_id": str(user_id) if user_id else None,
            "user_email": user_email,
            "entity_type": entity_type,
            "entity_id": str(entity_id) if entity_id else None,
            "details": details or {},
            "ip_address": ip_address,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        try:
            db.audit_logs.insert_one(doc)
        except Exception as e:
            # Audit logging should never crash primary workflow
            pass

audit_service = AuditService()
