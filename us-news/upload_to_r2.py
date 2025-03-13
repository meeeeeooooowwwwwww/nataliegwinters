import os
import boto3
from botocore.client import Config
from dotenv import load_dotenv

def upload_directory_to_r2(local_path, bucket_name, s3_client):
    """
    Upload a directory to R2 while maintaining directory structure
    """
    for root, dirs, files in os.walk(local_path):
        for file in files:
            # Skip the upload script and environment files
            if file in ['upload_to_r2.py', '.env', 'requirements.txt']:
                continue
                
            local_file_path = os.path.join(root, file)
            
            # Create the R2 key by removing the local_path prefix
            r2_key = os.path.relpath(local_file_path, local_path)
            
            # Convert Windows path separators to forward slashes for R2
            r2_key = r2_key.replace('\\', '/')
            
            print(f"Uploading {local_file_path} to {r2_key}")
            
            # Determine content type based on file extension
            content_type = 'text/html' if file.endswith('.html') else \
                         'text/css' if file.endswith('.css') else \
                         'application/javascript' if file.endswith('.js') else \
                         'application/json' if file.endswith('.json') else \
                         'image/jpeg' if file.endswith(('.jpg', '.jpeg')) else \
                         'image/png' if file.endswith('.png') else \
                         'application/octet-stream'
            
            try:
                s3_client.upload_file(
                    local_file_path, 
                    bucket_name, 
                    r2_key,
                    ExtraArgs={'ContentType': content_type}
                )
                print(f"Successfully uploaded {r2_key}")
            except Exception as e:
                print(f"Error uploading {r2_key}: {str(e)}")

def main():
    # Load environment variables
    load_dotenv()
    
    # Get R2 credentials from environment variables
    account_id = os.getenv('R2_ACCOUNT_ID')
    access_key_id = os.getenv('R2_ACCESS_KEY_ID')
    access_key_secret = os.getenv('R2_ACCESS_KEY_SECRET')
    bucket_name = os.getenv('R2_BUCKET_NAME')
    
    if not all([account_id, access_key_id, access_key_secret, bucket_name]):
        print("Error: Missing required environment variables")
        return
    
    # Initialize R2 client
    s3 = boto3.client(
        's3',
        endpoint_url=f'https://{account_id}.r2.cloudflarestorage.com',
        aws_access_key_id=access_key_id,
        aws_secret_access_key=access_key_secret,
        config=Config(signature_version='s3v4'),
        region_name='auto'
    )
    
    # Upload the entire directory
    current_dir = os.path.dirname(os.path.abspath(__file__))
    upload_directory_to_r2(current_dir, bucket_name, s3)

if __name__ == "__main__":
    main() 