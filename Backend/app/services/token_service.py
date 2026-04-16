"""
Token Service for Document Upload Links

This service handles the generation and validation of secure upload tokens
for borrower document uploads. Tokens are cryptographically secure with
72-hour expiration and multi-use capability within the validity period.
"""

import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlalchemy import text
from sqlalchemy.orm import Session


class TokenService:
    """Service for managing upload tokens"""

    TOKEN_EXPIRY_HOURS = 72

    @staticmethod
    def generate_upload_token() -> str:
        """
        Generate a cryptographically secure token with 256 bits of entropy.
        
        Uses secrets.token_urlsafe which generates URL-safe base64-encoded
        random bytes. 32 bytes = 256 bits of entropy, providing strong
        protection against brute force attacks.
        
        Returns:
            str: A URL-safe token string (approximately 43 characters)
        """
        return secrets.token_urlsafe(32)

    @staticmethod
    def get_token_expiry() -> datetime:
        """
        Calculate token expiration timestamp (72 hours from now).
        
        Returns:
            datetime: Expiration timestamp in UTC timezone
        """
        return datetime.now(timezone.utc) + timedelta(hours=TokenService.TOKEN_EXPIRY_HOURS)

    @staticmethod
    def validate_token(token: str, db: Session) -> tuple[bool, Optional[str], Optional[int]]:
        """
        Validate upload token for document upload.
        
        Checks:
        1. Token exists in database
        2. Token has not expired (72-hour window)
        
        Note: Multi-use tokens are allowed within the 72-hour validity period.
        Tokens are NOT marked as "used" after first upload to allow borrowers
        to upload multiple documents with the same link.
        
        Args:
            token: The upload token to validate
            db: Database session
            
        Returns:
            tuple: (is_valid, error_message, application_id)
                - is_valid: True if token is valid, False otherwise
                - error_message: Error message if invalid, None if valid
                - application_id: Associated loan application ID if valid, None otherwise
        """
        from app.models.loan_application import LoanApplication

        # Import here to avoid circular dependency
        try:
            # Query for communication record with this token
            # Note: Using raw SQL query since Communication model may not exist yet
            result = db.execute(
                text("""
                SELECT c.application_id, c.token_expires_at, la.id
                FROM communications c
                JOIN loan_applications la ON c.application_id = la.id
                WHERE c.upload_token = :token
                """),
                {"token": token}
            ).fetchone()

            if not result:
                return False, "Invalid upload link. Please check the link or contact your loan officer.", None

            application_id, token_expires_at, _ = result

            # Check if token has expired
            now = datetime.now(timezone.utc)
            if token_expires_at and token_expires_at < now:
                return False, "This upload link has expired. Please contact your loan officer for a new link.", None

            # Token is valid and not expired
            return True, None, application_id

        except Exception as e:
            # Log error in production
            print(f"Token validation error: {e}")
            return False, "An error occurred while validating the upload link. Please try again.", None
