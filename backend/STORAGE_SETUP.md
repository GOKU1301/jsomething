# File Storage Configuration

## Overview
The JayPrint backend supports two file storage options:
1. **AWS S3** (for production)
2. **Local File Storage** (for development/testing)

The system automatically detects which storage method to use based on your `.env` configuration.

## How It Works

### Automatic Detection
The backend checks your AWS credentials in the `.env` file:
- If valid AWS credentials are found → Uses AWS S3
- If credentials are missing or contain placeholder values → Uses Local File Storage

### Local File Storage (Current Setup)
When using local storage:
- Files are stored in `backend/uploads/documents/`
- Files are served via the endpoint: `GET /api/files/download/:fileKey`
- No AWS account or credentials required
- Perfect for development and testing

### AWS S3 Storage (Production)
To use AWS S3, you need to:
1. Create an AWS account
2. Create an S3 bucket
3. Generate AWS access keys (IAM user with S3 permissions)
4. Update your `.env` file with real credentials

## Configuration

### Current Setup (Local Storage)
Your current `.env` has placeholder values, so the system uses local storage:
```env
AWS_ACCESS_KEY_ID=test-access-key
AWS_SECRET_ACCESS_KEY=test-secret-key
AWS_REGION=ap-south-1
AWS_S3_BUCKET=jayprint-test-bucket
```

### For AWS S3 (Production)
Replace with real AWS credentials:
```env
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=ap-south-1
AWS_S3_BUCKET=your-actual-bucket-name
```

## Setting Up AWS S3 (Optional)

### Step 1: Create AWS Account
1. Go to https://aws.amazon.com/
2. Sign up for a free account

### Step 2: Create S3 Bucket
1. Go to AWS Console → S3
2. Click "Create bucket"
3. Choose a unique bucket name (e.g., `jayprint-documents-prod`)
4. Select region: `ap-south-1` (Asia Pacific - Mumbai)
5. Keep default settings
6. Click "Create bucket"

### Step 3: Create IAM User
1. Go to AWS Console → IAM
2. Click "Users" → "Add user"
3. Username: `jayprint-backend`
4. Access type: Programmatic access
5. Attach policy: `AmazonS3FullAccess` (or create custom policy)
6. Save the Access Key ID and Secret Access Key

### Step 4: Update .env
Replace the placeholder values with your real AWS credentials.

### Step 5: Restart Backend
After updating `.env`, restart the backend server:
```bash
npm run dev
```

You should see: `[Storage] Using AWS S3 for file uploads`

## Troubleshooting

### "InvalidAccessKeyId" Error
This means your AWS credentials are invalid or not configured. The system will now automatically fall back to local storage.

### Files Not Uploading
1. Check backend console for storage method being used
2. If using local storage, ensure `backend/uploads/` directory exists (created automatically)
3. If using AWS S3, verify your credentials and bucket name

### Files Not Downloading
1. For local storage: Files are served from `backend/uploads/documents/`
2. For AWS S3: Signed URLs are generated with 1-hour expiration

## Current Status
✅ **Local File Storage is active**
- No AWS setup required
- Files stored in: `backend/uploads/documents/`
- Ready for development and testing
