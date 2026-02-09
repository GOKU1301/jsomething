# JayPrint Setup Guide

## Quick Start

### 1. Configure Environment Variables

Update `.env` file with your credentials:

```bash
# Database (Supabase PostgreSQL)
DB_HOST=your-project.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your-password

# AWS S3
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_REGION=ap-south-1
AWS_S3_BUCKET=jayprint-documents

# Razorpay
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=your-secret
RAZORPAY_WEBHOOK_SECRET=your-webhook-secret
```

### 2. Add Password Column to Database

Run this SQL in your Supabase SQL editor:

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT NOT NULL DEFAULT '';
```

### 3. Install Dependencies

```bash
# Backend
npm install

# Frontend
cd client
npm install
cd ..
```

### 4. Start the Application

Open two terminals:

**Terminal 1 - Backend:**
```bash
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm start
```

The backend will run on `http://localhost:5000`  
The frontend will run on `http://localhost:3000`

### 5. Create Admin User

After registering a student account, update their role in Supabase:

```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'your-email@college.edu';
```

## Testing the Application

1. **Register** as a student at `http://localhost:3000/login`
2. **Upload** a PDF document
3. **Select** print preferences (color, copies, binding)
4. **Pay** using Razorpay test mode
5. **Track** your order in real-time

For admin testing:
1. Create an admin user (see step 5 above)
2. Login and access the admin dashboard
3. View print queue and update order statuses

## Razorpay Test Mode

Use these test card details:
- Card Number: `4111 1111 1111 1111`
- CVV: Any 3 digits
- Expiry: Any future date

## Troubleshooting

- **CORS errors**: Check `FRONTEND_URL` in `.env`
- **Database connection**: Verify Supabase credentials
- **S3 upload fails**: Check AWS credentials and bucket permissions
- **Payment fails**: Verify Razorpay API keys

## Next Steps

- Deploy backend to a cloud server
- Deploy frontend to Vercel/Netlify
- Set up Razorpay webhook URL
- Package as Electron desktop app
