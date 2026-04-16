"""
Document Proxy Routes - serves S3 documents through backend to avoid CORS issues
"""
import boto3
import os
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import text
from sqlalchemy.orm import Session
from urllib.parse import urlparse

from app.core.database import get_db
from app.core.security import require_auth_roles

router = APIRouter(prefix="/api/v1/documents", tags=["document-proxy"])


@router.get(
    "/download/{document_id}",
    dependencies=[Depends(require_auth_roles({"loan_officer", "credit_analyst", "underwriter", "compliance_officer"}))],
)
def download_document(document_id: int, db: Session = Depends(get_db)):
    """
    Proxy endpoint to download documents from S3 through the backend.
    Avoids CORS issues when frontend tries to access S3 directly.
    """
    # Get document from DB
    row = db.execute(text(
        "SELECT storage_url, doc_type FROM documents WHERE id = :id"
    ), {"id": document_id}).fetchone()
    
    if not row or not row[0]:
        raise HTTPException(status_code=404, detail="Document not found")
    
    storage_url = row[0]
    doc_type = row[1]
    
    # Download from S3
    try:
        parsed = urlparse(storage_url)
        bucket = os.getenv("AWS_BUCKET_NAME", "credit-shield-document")
        key = parsed.path.lstrip("/")
        
        # Handle path-style URLs
        if key.startswith(bucket + "/"):
            key = key[len(bucket) + 1:]
        
        s3 = boto3.client(
            "s3",
            region_name=os.getenv("AWS_REGIONS3", "ap-south-1"),
            aws_access_key_id=os.getenv("AWS_ACCESS_KEY"),
            aws_secret_access_key=os.getenv("AWS_SECRET_KEY"),
        )
        
        obj = s3.get_object(Bucket=bucket, Key=key)
        content = obj["Body"].read()
        content_type = obj.get("ContentType", "application/octet-stream")
        
        # Determine filename from key
        filename = key.split("/")[-1]
        
        return Response(
            content=content,
            media_type=content_type,
            headers={
                "Content-Disposition": f'inline; filename="{filename}"',
                "Cache-Control": "private, max-age=3600",
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to download document: {str(e)}")
