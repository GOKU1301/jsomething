import os
import fitz
import boto3
from dotenv import load_dotenv

load_dotenv()

s3_client = boto3.client(
    "s3",
    region_name=os.getenv("AWS_REGION"),
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY"),
    aws_secret_access_key=os.getenv("AWS_SECRET_KEY"),
)

def download_and_extract_text(s3_key: str) -> str:
    """Download PDF from S3 and return its text content."""
    try:
        bucket = os.getenv("S3_BUCKET")
        response = s3_client.get_object(Bucket=bucket, Key=s3_key)
        pdf_content = response["Body"].read()
        
        # Open PDF from memory
        doc = fitz.open(stream=pdf_content, filetype="pdf")
        text = ""
        for page in doc:
            text += page.get_text()
        
        doc.close()
        return text
    except Exception as e:
        print(f"Extraction Error: {e}")
        return ""
