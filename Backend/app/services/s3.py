import boto3
import os

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