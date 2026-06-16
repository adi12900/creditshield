"""
Communication Service for Email and SMS Delivery

This service handles sending emails and SMS messages to borrowers with
document upload links. It integrates with the existing OTP service for
email delivery and supports SMS providers (Twilio/AWS SNS).
"""

import os
from typing import Optional

import requests


class CommunicationService:
    """Service for sending emails and SMS to borrowers"""

    # Configuration from environment variables
    OTP_SERVICE_URL = os.getenv("OTP_SERVICE_URL", "http://localhost:3001")
    SMS_SERVICE_URL = os.getenv("SMS_SERVICE_URL")
    TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
    TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
    TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER")

    @staticmethod
    def send_email(
        to_email: str,
        subject: str,
        message: str,
        upload_link: str,
        arn: str,
        expiry_hours: int = 72
    ) -> tuple[bool, Optional[str]]:
        """
        Send email with document upload link to borrower.
        
        Uses the existing OTP service endpoint for email delivery.
        The email includes a styled HTML template with the upload link,
        message, ARN, and expiration time.
        
        Args:
            to_email: Borrower's email address
            subject: Email subject line
            message: Loan officer's message to borrower
            upload_link: Full URL to document upload page
            arn: Application Reference Number
            expiry_hours: Hours until link expires (default: 72)
            
        Returns:
            tuple: (success, error_message)
                - success: True if email sent successfully, False otherwise
                - error_message: Error details if failed, None if successful
        """
        # Build HTML email template
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
            <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <!-- Header -->
                <div style="background-color: #00c853; padding: 24px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">CreditShield</h1>
                </div>
                
                <!-- Content -->
                <div style="padding: 32px 24px;">
                    <h2 style="color: #1a1a2e; margin: 0 0 16px 0; font-size: 20px;">Document Request - {arn}</h2>
                    
                    <p style="color: #333333; line-height: 1.6; margin: 0 0 24px 0;">
                        {message}
                    </p>
                    
                    <!-- Upload Button -->
                    <div style="text-align: center; margin: 32px 0;">
                        <a href="{upload_link}" 
                           style="display: inline-block; background-color: #00c853; color: #ffffff; 
                                  padding: 14px 32px; text-decoration: none; border-radius: 4px; 
                                  font-weight: bold; font-size: 16px;">
                            Upload Documents
                        </a>
                    </div>
                    
                    <!-- Important Info -->
                    <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 16px; margin: 24px 0;">
                        <p style="color: #856404; margin: 0; font-size: 14px;">
                            <strong>Important:</strong> This link will expire in {expiry_hours} hours. 
                            Please upload your documents before the link expires.
                        </p>
                    </div>
                    
                    <!-- Application Reference -->
                    <p style="color: #666666; font-size: 13px; margin: 24px 0 0 0;">
                        Application Reference: <strong>{arn}</strong>
                    </p>
                </div>
                
                <!-- Footer -->
                <div style="background-color: #f8f9fa; padding: 20px 24px; border-top: 1px solid #e0e0e0;">
                    <p style="color: #666666; font-size: 12px; margin: 0; text-align: center;">
                        If you have any questions, please contact your loan officer.
                    </p>
                    <p style="color: #999999; font-size: 11px; margin: 8px 0 0 0; text-align: center;">
                        © 2026 CreditShield. All rights reserved.
                    </p>
                </div>
            </div>
        </body>
        </html>
        """

        try:
            # Call OTP service email endpoint
            response = requests.post(
                f"{CommunicationService.OTP_SERVICE_URL}/send-email",
                json={
                    "to": to_email,
                    "subject": subject,
                    "html": html_content
                },
                timeout=10
            )
            response.raise_for_status()
            return True, None

        except requests.exceptions.Timeout:
            return False, "Email service timeout. Please try again."
        except requests.exceptions.ConnectionError:
            return False, "Could not connect to email service. Please check service availability."
        except requests.exceptions.HTTPError as e:
            return False, f"Email delivery failed: {e.response.status_code}"
        except Exception as e:
            return False, f"Unexpected error sending email: {str(e)}"

    @staticmethod
    def send_sms(
        to_phone: str,
        message: str,
        upload_link: str,
        arn: str
    ) -> tuple[bool, Optional[str]]:
        """
        Send SMS with document upload link to borrower.
        
        Supports Twilio integration for SMS delivery. The SMS includes
        the message, upload link, and ARN in a concise format.
        
        Args:
            to_phone: Borrower's phone number (E.164 format recommended)
            message: Loan officer's message to borrower
            upload_link: Full URL to document upload page
            arn: Application Reference Number
            
        Returns:
            tuple: (success, error_message)
                - success: True if SMS sent successfully, False otherwise
                - error_message: Error details if failed, None if successful
        """
        # Build SMS text (keep it concise for SMS)
        sms_text = f"{message}\n\nUpload documents: {upload_link}\n\nRef: {arn}"

        try:
            # Check if Twilio credentials are configured
            if not all([
                CommunicationService.TWILIO_ACCOUNT_SID,
                CommunicationService.TWILIO_AUTH_TOKEN,
                CommunicationService.TWILIO_PHONE_NUMBER
            ]):
                return False, "SMS service not configured. Please contact support."

            # Import Twilio client (lazy import to avoid dependency if not used)
            try:
                from twilio.rest import Client
            except ImportError:
                return False, "SMS service dependencies not installed."

            # Send SMS via Twilio
            client = Client(
                CommunicationService.TWILIO_ACCOUNT_SID,
                CommunicationService.TWILIO_AUTH_TOKEN
            )

            message_response = client.messages.create(
                body=sms_text,
                from_=CommunicationService.TWILIO_PHONE_NUMBER,
                to=to_phone
            )

            # Check if message was queued/sent successfully
            if message_response.sid:
                return True, None
            else:
                return False, "SMS delivery failed. No message ID returned."

        except Exception as e:
            return False, f"SMS delivery error: {str(e)}"
