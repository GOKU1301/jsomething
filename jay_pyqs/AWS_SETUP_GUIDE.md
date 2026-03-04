# AWS S3 Setup for Jay Pyqs Microservice

This guide will help you set up an AWS S3 bucket and configure the necessary credentials for your `jay_pyqs` microservice.

## 1. Create an S3 Bucket

1.  **Log in** to your [AWS Console](https://aws.amazon.com/console/).
2.  Search for **S3** in the top search bar and select it.
3.  Click the orange **Create bucket** button.
4.  **Bucket Name**: Enter a unique name (e.g., `jay-pyqs-YOURNAME-2024`).
    *   *Note: Bucket names must be globally unique.*
5.  **Region**: Choose the region closest to you (e.g., `ap-south-1` for Mumbai, or keep the default `us-east-1` if you are unsure).
6.  **Object Ownership**: Keep "ACLs disabled" (recommended).
7.  **Block Public Access settings**: Keep "Block all public access" checked (recommended for security).
8.  **Bucket Versioning**: Optional (Disable for now to save storage).
9.  Click **Create bucket** at the bottom.

## 2. Create an IAM User (Get Credentials)

To access the bucket from your code securely, you should create a specific user with permissions.

1.  Search for **IAM** in the top search bar and select it.
2.  Click **Users** in the left sidebar.
3.  Click the orange **Create user** button.
4.  **User name**: Enter `jay-pyqs-user`. Click **Next**.
5.  **Permissions**:
    *   Select **Attach policies directly**.
    *   Search for `AmazonS3FullAccess` and check the box next to it.
    *   *Note: For production, you should restrict this to just your specific bucket, but FullAccess is fine for development.*
    *   Click **Next**.
6.  Review and click **Create user**.

## 3. Generate Access Keys

1.  Click on the newly created user (`jay-pyqs-user`).
2.  Go to the **Security credentials** tab.
3.  Scroll down to the **Access keys** section.
4.  Click **Create access key**.
5.  Select **Local code** (or "Application running outside AWS").
6.  Check the confirmation box and click **Next**.
7.  (Optional) Set a description tag. Click **Create access key**.
8.  **IMPORTANT**: Copy the **Access key ID** and **Secret access key**.
    *   *You will not be able to see the Secret access key again once you leave this page.*
    *   Download the `.csv` file just in case.

## 4. Configure Your Application

Open `jay_pyqs/backend/src/main/resources/application.properties` and update the following lines with your values:

```properties
cloud.aws.credentials.access-key=PASTE_YOUR_ACCESS_KEY_ID_HERE
cloud.aws.credentials.secret-key=PASTE_YOUR_SECRET_ACCESS_KEY_HERE
cloud.aws.region.static=YOUR_BUCKET_REGION (e.g., us-east-1 or ap-south-1)
cloud.aws.s3.bucket=YOUR_BUCKET_NAME
```

**⚠️ WARNING**: Do not commit your real keys to GitHub!
If you plan to push this code, consider using environment variables instead.

## 5. Python (ML Service) Configuration

For the Python ML service, create a `.env` file in `jay_pyqs/ml/`:

```
AWS_ACCESS_KEY_ID=PASTE_YOUR_ACCESS_KEY_ID_HERE
AWS_SECRET_ACCESS_KEY=PASTE_YOUR_SECRET_ACCESS_KEY_HERE
AWS_DEFAULT_REGION=YOUR_BUCKET_REGION
S3_BUCKET_NAME=YOUR_BUCKET_NAME
```
