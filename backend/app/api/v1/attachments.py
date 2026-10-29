import os
from datetime import datetime, timezone
from typing import List, Optional
from bson import ObjectId
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from app.core.config import settings
from app.core.dependencies import get_current_user, serialize_doc
from app.db.mongodb import get_db
from app.models.enums import AuditAction
from app.schemas.attachment import AttachmentResponse
from app.services.audit_service import audit_service
from app.services.file_service import file_service

router = APIRouter(prefix="/attachments", tags=["Attachments"])

@router.post("", response_model=AttachmentResponse)
def upload_attachment(
    file: UploadFile = File(...),
    asset_id: str = Form(...),
    job_id: Optional[str] = Form(None),
    attachment_type: str = Form("general"),
    is_customer_visible: bool = Form(True),
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    saved = file_service.save_upload(file)
    now = datetime.now(timezone.utc).isoformat()

    doc = {
        "job_id": job_id,
        "asset_id": asset_id,
        "uploaded_by": current_user["id"],
        "uploader_name": current_user.get("full_name"),
        "filename": saved["filename"],
        "stored_filename": saved["stored_filename"],
        "content_type": saved["content_type"],
        "file_size_bytes": saved["file_size_bytes"],
        "attachment_type": attachment_type,
        "is_customer_visible": is_customer_visible,
        "url": saved["url"],
        "created_at": now
    }

    res = db.attachments.insert_one(doc)
    doc["id"] = str(res.inserted_id)

    audit_service.log(
        action=AuditAction.ATTACHMENT_UPLOADED,
        user_id=current_user["id"],
        user_email=current_user.get("email"),
        entity_type="attachment",
        entity_id=doc["id"],
        details={"filename": saved["filename"], "attachment_type": attachment_type},
        db=db
    )

    return serialize_doc(doc)

@router.get("/jobs/{job_id}", response_model=List[AttachmentResponse])
def list_job_attachments(
    job_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    cursor = db.attachments.find({"job_id": job_id})
    return [serialize_doc(a) for a in cursor]

@router.get("/files/{stored_filename}")
def serve_file(stored_filename: str):
    # Prevent directory traversal attacks
    clean_filename = os.path.basename(stored_filename)
    filepath = os.path.join(settings.UPLOAD_DIR, clean_filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")
    return FileResponse(filepath)
