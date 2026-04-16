import boto3
import os
from datetime import datetime

s3 = boto3.client(
    "s3",
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY"),
    aws_secret_access_key=os.getenv("AWS_SECRET_KEY"),
    region_name=os.getenv("AWS_REGIONS3"),
)

def upload_file_to_s3(file, filename, content_type):
    s3.upload_fileobj(
        file,
        os.getenv("AWS_BUCKET_NAME"),
        filename,
        ExtraArgs={
            "ContentType": content_type
        }
    )

    return f"https://{os.getenv('AWS_BUCKET_NAME')}.s3.{os.getenv('AWS_REGION')}.amazonaws.com/{filename}"


def upload_document_file(file, arn: str, doc_type: str, filename: str, content_type: str) -> str:
    """
    Upload document file to S3 with organized folder structure.
    
    Organizes files by ARN and document type for easy management:
    documents/{arn}/{doc_type}/{timestamp}_{filename}
    
    Args:
        file: File object to upload
        arn: Application Reference Number
        doc_type: Document type (e.g., "Bank Statement")
        filename: Original filename
        content_type: MIME type of the file
        
    Returns:
        str: S3 URL of the uploaded file
    """
    # Generate timestamp for unique filename
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    # Sanitize doc_type for use in path (replace spaces with underscores)
    doc_type_safe = doc_type.replace(" ", "_")
    
    # Build S3 key with organized folder structure
    s3_key = f"documents/{arn}/{doc_type_safe}/{timestamp}_{filename}"
    
    # Upload to S3 with server-side encryption
    s3.upload_fileobj(
        file,
        os.getenv("AWS_BUCKET_NAME"),
        s3_key,
        ExtraArgs={
            "ContentType": content_type,
            "ServerSideEncryption": "AES256"  # Encrypt at rest
        }
    )
    
    # Return S3 URL
    return f"https://{os.getenv('AWS_BUCKET_NAME')}.s3.{os.getenv('AWS_REGION')}.amazonaws.com/{s3_key}"