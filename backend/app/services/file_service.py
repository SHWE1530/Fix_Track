import os
import secrets
from fastapi import HTTPException, UploadFile, status
from app.core.config import settings

class FileService:
    @staticmethod
    def save_upload(file: UploadFile) -> dict:
        # Check filename
        if not file.filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file must have a filename"
            )
        
        _, ext = os.path.splitext(file.filename)
        ext = ext.lower()
        if ext not in settings.allowed_extensions_set:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file extension '{ext}'. Allowed: {', '.join(settings.allowed_extensions_set)}"
            )

        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        random_suffix = secrets.token_hex(8)
        safe_filename = f"{random_suffix}{ext}"
        target_path = os.path.join(settings.UPLOAD_DIR, safe_filename)

        content = file.file.read()
        file_size = len(content)

        max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
        if file_size > max_bytes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File exceeds maximum allowed size of {settings.MAX_FILE_SIZE_MB}MB"
            )

        with open(target_path, "wb") as f:
            f.write(content)

        return {
            "filename": file.filename,
            "stored_filename": safe_filename,
            "filepath": target_path,
            "content_type": file.content_type or "application/octet-stream",
            "file_size_bytes": file_size,
            "url": f"/api/v1/attachments/files/{safe_filename}"
        }

file_service = FileService()
