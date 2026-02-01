import boto3
import os
import shutil
from fastapi import UploadFile
from botocore.exceptions import NoCredentialsError


class StorageService:
    def __init__(self):
        self.upload_dir = "data/uploads"
        os.makedirs(self.upload_dir, exist_ok=True)

        # Check for AWS Credentials
        self.aws_access_key = os.getenv("AWS_ACCESS_KEY_ID")
        self.aws_secret_key = os.getenv("AWS_SECRET_ACCESS_KEY")
        self.bucket_name = os.getenv("AWS_BUCKET_NAME")

        self.use_s3 = all([self.aws_access_key, self.aws_secret_key, self.bucket_name])

        if self.use_s3:
            print("🚀 S3 Storage Enabled")
            self.s3_client = boto3.client(
                "s3",
                aws_access_key_id=self.aws_access_key,
                aws_secret_access_key=self.aws_secret_key,
            )
        else:
            print("⚠️ AWS Credentials missing. Falling back to local storage (data/uploads)")

    def upload_file(self, file_obj: UploadFile, file_name: str) -> str:
        """
        Uploads file to S3 or Local Storage.
        Returns the generic path/key.
        """
        if self.use_s3:
            try:
                self.s3_client.upload_fileobj(file_obj.file, self.bucket_name, file_name)
                return f"s3://{self.bucket_name}/{file_name}"
            except Exception as e:
                print(f"❌ S3 Upload Failed: {e}")
                raise e
        else:
            # Local Fallback
            file_path = os.path.join(self.upload_dir, file_name)
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file_obj.file, buffer)
            return file_path

    def download_file(self, file_key: str, destination_path: str):
        """
        Downloads file from S3 to local destination (for processing like OCR).
        If file_key is local path, validates it exists.
        """
        if file_key.startswith("s3://"):
            # Parse bucket and key
            # s3://bucket/key
            parts = file_key.replace("s3://", "").split("/", 1)
            bucket = parts[0]
            key = parts[1]

            print(f"⬇️ Downloading from S3: {key}")
            self.s3_client.download_file(bucket, key, destination_path)
        else:
            # Local File
            if os.path.exists(file_key):
                # If it's already local, we might copy it to dest or just verify
                if os.path.abspath(file_key) != os.path.abspath(destination_path):
                    shutil.copy(file_key, destination_path)
            else:
                raise FileNotFoundError(f"Local file not found: {file_key}")


storage_service = StorageService()
