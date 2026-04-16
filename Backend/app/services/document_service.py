"""
Document Service for File Upload Handling

This service handles document file validation, S3 upload, and database
record creation for borrower document uploads via secure upload links.
"""

import os
from datetime import datetime
from typing import Optional

from fastapi import UploadFile
from sqlalchemy import text
from sqlalchemy.orm import Session


class DocumentService:
    """Service for handling document uploads"""

    # File validation constants
    ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png"}
    MAX_FILE_SIZE_MB = 10
    MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

    # Allowed document types
    ALLOWED_DOCUMENT_TYPES = [
        "Aadhaar Card",
        "PAN Card",
        "Bank Statement",
        "Salary Slip",
        "ITR",
        "Business Proof",
        "Property Documents",
        "Other"
    ]

    @staticmethod
    def validate_file(file: UploadFile) -> tuple[bool, Optional[str]]:
        """
        Validate uploaded file format and extension.
        
        Checks:
        1. File has a valid extension (.pdf, .jpg, .jpeg, .png)
        2. File size is checked during upload (not here)
        
        Args:
            file: FastAPI UploadFile object
            
        Returns:
            tuple: (is_valid, error_message)
                - is_valid: True if file is valid, False otherwise
                - error_message: Error message if invalid, None if valid
        """
        # Check if filename exists
        if not file.filename:
            return False, "No filename provided"

        # Extract file extension
        filename = file.filename
        ext = os.path.splitext(filename)[1].lower()

        # Validate extension
        if ext not in DocumentService.ALLOWED_EXTENSIONS:
            allowed_formats = ", ".join(DocumentService.ALLOWED_EXTENSIONS)
            return False, f"Invalid file format. Allowed formats: {allowed_formats}"

        return True, None

    @staticmethod
    def validate_document_type(doc_type: str) -> tuple[bool, Optional[str]]:
        """
        Validate document type against allowed types.
        
        Args:
            doc_type: Document type string
            
        Returns:
            tuple: (is_valid, error_message)
        """
        if doc_type not in DocumentService.ALLOWED_DOCUMENT_TYPES:
            return False, f"Invalid document type. Allowed types: {', '.join(DocumentService.ALLOWED_DOCUMENT_TYPES)}"
        return True, None

    @staticmethod
    async def upload_document(
        file: UploadFile,
        application_id: int,
        arn: str,
        doc_type: str,
        db: Session
    ) -> tuple[bool, Optional[str], Optional[dict]]:
        """
        Upload document to S3 and create database record.
        
        Process:
        1. Validate file format
        2. Validate document type
        3. Upload file to S3 with organized folder structure
        4. Create new document record in database (always insert, never update)
        5. Return document details
        
        Args:
            file: FastAPI UploadFile object
            application_id: Loan application ID
            arn: Application Reference Number
            doc_type: Document type (e.g., "Bank Statement")
            db: Database session
            
        Returns:
            tuple: (success, error_message, document_data)
                - success: True if upload successful, False otherwise
                - error_message: Error details if failed, None if successful
                - document_data: Document details dict if successful, None otherwise
        """
        # Validate file
        is_valid, error = DocumentService.validate_file(file)
        if not is_valid:
            return False, error, None

        # Validate document type
        is_valid, error = DocumentService.validate_document_type(doc_type)
        if not is_valid:
            return False, error, None

        try:
            # Import S3 service
            from app.services.s3 import upload_document_file

            # Read file content
            file_content = await file.read()

            # Check file size
            file_size = len(file_content)
            if file_size > DocumentService.MAX_FILE_SIZE_BYTES:
                return False, f"File size exceeds {DocumentService.MAX_FILE_SIZE_MB}MB limit", None

            # Reset file pointer for S3 upload
            await file.seek(0)

            # Upload to S3
            storage_url = upload_document_file(
                file=file.file,
                arn=arn,
                doc_type=doc_type,
                filename=file.filename,
                content_type=file.content_type or "application/octet-stream"
            )

            # Create document record in database (always insert new record)
            from app.models.loan_application import LoanApplication

            # Verify application exists
            application = db.query(LoanApplication).filter(
                LoanApplication.id == application_id
            ).first()

            if not application:
                return False, "Loan application not found", None

            # Create document record using raw SQL (since Document model may not exist yet)
            result = db.execute(
                text("""
                INSERT INTO documents (
                    application_id, doc_type, status, confidence, 
                    storage_url, uploaded_by_user_id, uploaded_at
                )
                VALUES (:application_id, :doc_type, :status, :confidence, 
                        :storage_url, :uploaded_by_user_id, NOW())
                RETURNING id, doc_type, status, storage_url, uploaded_at
                """),
                {
                    "application_id": application_id,
                    "doc_type": doc_type,
                    "status": "Pending OCR",
                    "confidence": None,
                    "storage_url": storage_url,
                    "uploaded_by_user_id": None  # NULL for borrower uploads
                }
            )
            db.commit()

            # Fetch the created document
            document_row = result.fetchone()

            # Build document data response
            document_data = {
                "id": document_row[0],
                "doc_type": document_row[1],
                "filename": file.filename,
                "status": document_row[2],
                "storage_url": document_row[3],
                "uploaded_at": document_row[4].isoformat() if document_row[4] else None
            }

            return True, None, document_data

        except Exception as e:
            db.rollback()
            print(f"Document upload error: {e}")
            return False, f"Failed to upload document: {str(e)}", None
