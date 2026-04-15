import os
from urllib.parse import urlparse

import boto3
from botocore.exceptions import ClientError


def _s3_region() -> str:
    return os.getenv("AWS_REGIONS3") or os.getenv("AWS_REGION") or "ap-south-1"


def _bucket_name() -> str:
    bucket = (os.getenv("AWS_BUCKET_NAME") or "").strip()
    if not bucket:
        raise ValueError("AWS_BUCKET_NAME is not configured")
    return bucket


def _s3_client():
    return boto3.client(
        "s3",
        aws_access_key_id=os.getenv("AWS_ACCESS_KEY"),
        aws_secret_access_key=os.getenv("AWS_SECRET_KEY"),
        region_name=_s3_region(),
    )


def upload_file_to_s3(file_obj, object_key: str, content_type: str) -> str:
    bucket = _bucket_name()
    client = _s3_client()
    try:
        client.upload_fileobj(
            file_obj,
            bucket,
            object_key,
            ExtraArgs={"ContentType": content_type or "application/octet-stream"},
        )
    except ClientError as exc:
        code = exc.response.get("Error", {}).get("Code", "Unknown")
        message = str(exc)
        if code == "AccessDenied" and "CreateSession" in message:
            raise RuntimeError(
                "S3 bucket access denied for CreateSession. This bucket appears to be an S3 Express/directory bucket. "
                "Grant permission s3express:CreateSession for this bucket or switch AWS_BUCKET_NAME to a standard S3 bucket."
            ) from exc
        raise RuntimeError(f"S3 upload failed ({code}): {message}") from exc
    return f"https://{bucket}.s3.{_s3_region()}.amazonaws.com/{object_key}"


def extract_object_key_from_url(storage_url: str) -> str:
    parsed = urlparse(storage_url)
    return parsed.path.lstrip("/")


def generate_presigned_url(object_key: str, expires_in: int = 3600) -> str:
    client = _s3_client()
    try:
        return client.generate_presigned_url(
            "get_object",
            Params={
                "Bucket": _bucket_name(),
                "Key": object_key,
            },
            ExpiresIn=expires_in,
        )
    except ClientError as exc:
        code = exc.response.get("Error", {}).get("Code", "Unknown")
        message = str(exc)
        raise RuntimeError(f"Failed to generate signed URL ({code}): {message}") from exc


def download_bytes_from_s3(storage_url: str) -> bytes:
    object_key = extract_object_key_from_url(storage_url)
    client = _s3_client()
    try:
        response = client.get_object(Bucket=_bucket_name(), Key=object_key)
        body = response.get("Body")
        if body is None:
            raise RuntimeError("S3 object body is empty")
        return body.read()
    except ClientError as exc:
        code = exc.response.get("Error", {}).get("Code", "Unknown")
        message = str(exc)
        raise RuntimeError(f"Failed to download S3 object ({code}): {message}") from exc