from pydantic import BaseModel, Field


class DocumentUploadOut(BaseModel):
    id: int
    application_id: int
    doc_type: str
    file_url: str | None
    status: str
    confidence: float | None = Field(default=None, ge=0, le=1)
    agent_verdict: str | None = None
    is_blocking: bool
    verification_attempts: int = 0


class DocumentVerificationListResponse(BaseModel):
    documents: list[DocumentUploadOut]
    can_proceed: bool
