"""
Pydantic schemas for communication and document upload endpoints.

These schemas define the request/response models for:
- Loan officer communication sending
- Borrower document upload
"""

from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field


class CommunicationSendRequest(BaseModel):
    """Request schema for sending communication to borrower"""
    
    channel: Literal["email", "sms", "call"] = Field(
        description="Communication channel to use"
    )
    subject: str = Field(
        min_length=1,
        max_length=200,
        description="Subject line for email or title for SMS"
    )
    message: str = Field(
        min_length=1,
        description="Message content to send to borrower"
    )


class CommunicationResponse(BaseModel):
    """Response schema for communication send operation"""
    
    id: str = Field(description="Communication record ID")
    channel: str = Field(description="Communication channel used")
    subject: str = Field(description="Subject line")
    message: str = Field(description="Message content")
    sent_at: datetime = Field(description="Timestamp when communication was sent")
    status: Literal["Pending", "Delivered", "Failed"] = Field(
        description="Delivery status"
    )
    upload_token: Optional[str] = Field(
        default=None,
        description="Secure upload token (only for email/sms channels)"
    )
    upload_link: Optional[str] = Field(
        default=None,
        description="Full URL to document upload page (only for email/sms channels)"
    )
    expires_at: Optional[datetime] = Field(
        default=None,
        description="Token expiration timestamp (only for email/sms channels)"
    )
    delivery_error: Optional[str] = Field(
        default=None,
        description="Error message if delivery failed"
    )


class DocumentUploadRequest(BaseModel):
    """Request schema for document upload (form data)"""
    
    doc_type: str = Field(
        min_length=1,
        description="Document type (e.g., 'Bank Statement', 'PAN Card')"
    )
    # Note: file is handled separately as UploadFile in the endpoint


class DocumentUploadResponse(BaseModel):
    """Response schema for document upload operation"""
    
    success: bool = Field(description="Whether upload was successful")
    message: str = Field(description="Success or error message")
    document: Optional[dict] = Field(
        default=None,
        description="Document details if upload was successful"
    )


class TokenValidationResponse(BaseModel):
    """Response schema for token validation (GET upload page)"""
    
    valid: bool = Field(description="Whether token is valid")
    arn: Optional[str] = Field(
        default=None,
        description="Application Reference Number if token is valid"
    )
    error: Optional[str] = Field(
        default=None,
        description="Error message if token is invalid"
    )
    allowed_document_types: Optional[list[str]] = Field(
        default=None,
        description="List of allowed document types for upload"
    )
