import os
from datetime import datetime
from urllib.parse import urlparse

import boto3


def _s3_region() -> str:
    return os.getenv("AWS_REGIONS3") or os.getenv("AWS_REGION") or "ap-south-1"


def _s3_bucket() -> str:
    bucket = os.getenv("AWS_BUCKET_NAME", "").strip()
    if not bucket:
        raise ValueError("AWS_BUCKET_NAME is not configured")
    return bucket


def _s3_client():
    return boto3.client(
        "s3",
        aws_access_key_id=os.getenv("AWS_ACCESS_KEY") or os.getenv("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.getenv("AWS_SECRET_KEY") or os.getenv("AWS_SECRET_ACCESS_KEY"),
        region_name=_s3_region(),
    )


def _build_storage_url(object_key: str) -> str:
    return f"https://{_s3_bucket()}.s3.{_s3_region()}.amazonaws.com/{object_key}"


def extract_object_key_from_url(storage_url: str) -> str:
    """Extract S3 object key from s3://, path-style, virtual-hosted, or pre-signed URLs."""
    parsed = urlparse(storage_url)
    bucket = _s3_bucket()

    if parsed.scheme == "s3":
        key = parsed.path.lstrip("/")
        if parsed.netloc and parsed.netloc != bucket:
            raise ValueError("S3 bucket in URL does not match configured AWS_BUCKET_NAME")
        if not key:
            raise ValueError("Missing S3 object key")
        return key

    if parsed.scheme not in {"http", "https"}:
        raise ValueError("Unsupported storage URL scheme")

    host = parsed.netloc.lower()
    key = parsed.path.lstrip("/")

    # Path-style: https://s3.<region>.amazonaws.com/<bucket>/<key>
    if host.startswith("s3.") or host.startswith("s3-"):
        if key.startswith(f"{bucket}/"):
            key = key[len(bucket) + 1:]
        if not key:
            raise ValueError("Missing S3 object key")
        return key

    # Virtual-hosted style: https://<bucket>.s3.<region>.amazonaws.com/<key>
    if f"{bucket}.s3." in host:
        if not key:
            raise ValueError("Missing S3 object key")
        return key

    # Allow custom domains that still prefix bucket in path.
    if key.startswith(f"{bucket}/"):
        return key[len(bucket) + 1:]

    return key


def generate_presigned_url(object_key: str, expires_in: int = 3600) -> str:
    return _s3_client().generate_presigned_url(
        "get_object",
        Params={"Bucket": _s3_bucket(), "Key": object_key},
        ExpiresIn=expires_in,
    )


def download_bytes_from_s3(storage_url: str) -> bytes:
    object_key = extract_object_key_from_url(storage_url)
    response = _s3_client().get_object(Bucket=_s3_bucket(), Key=object_key)
    return response["Body"].read()


def upload_file_to_s3(file, filename, content_type):
    _s3_client().upload_fileobj(
        file,
        _s3_bucket(),
        filename,
        ExtraArgs={
            "ContentType": content_type,
        },
    )

    return _build_storage_url(filename)


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
    _s3_client().upload_fileobj(
        file,
        _s3_bucket(),
        s3_key,
        ExtraArgs={
            "ContentType": content_type,
            "ServerSideEncryption": "AES256"  # Encrypt at rest
        }
    )
    
    # Return S3 URL
    return _build_storage_url(s3_key)