from typing import Optional
from pydantic import BaseModel

class AttachmentResponse(BaseModel):
    id: str
    job_id: Optional[str] = None
    asset_id: str
    uploaded_by: str
    uploader_name: Optional[str] = None
    filename: str
    content_type: str
    file_size_bytes: int
    attachment_type: str # intake_photo, completion_photo, receipt, diagnostic_report, general
    is_customer_visible: bool = True
    url: str
    created_at: str
