# 🔐 JayPrint Credentials Setup Guide

This guide explains how to obtain all necessary credentials for the JayPrint system.

---

## Required Credentials

### 1. Supabase PostgreSQL Database

**What you need:**
- Database host URL
- Database password (if not already set)

**How to get it:**
1. Go to https://supabase.com/dashboard
2. Select your project
3. Navigate to **Settings → Database**
4. Find **Connection string** - it looks like:
   ```
   postgresql://postgres:[password]@db.abcdefghijk.supabase.co:5432/postgres
   ```
5. Extract `DB_HOST`: `db.abcdefghijk.supabase.co`

**Add to `backend/.env`:**
```env
DB_HOST=db.xxxxxxxxxxxxx.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your-password
```

**Important:** Run this SQL in Supabase SQL Editor:
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT NOT NULL DEFAULT '';
```

---

### 2. Razorpay Payment Gateway

**For Testing (No Account Required):**
Use these test credentials in `backend/.env`:
```env
RAZORPAY_KEY_ID=rzp_test_1DP5mmOlF5G5ag
RAZORPAY_KEY_SECRET=thisissecretkey
RAZORPAY_WEBHOOK_SECRET=test_webhook_secret
```

**For Production:**
1. Sign up at https://razorpay.com/
2. Complete KYC verification
3. Go to **Settings → API Keys**
4. Generate API keys
5. Set up webhook at **Settings → Webhooks**
   - URL: `https://your-domain.com/api/payments/webhook`
   - Events: `payment.captured`, `payment.failed`

---

### 3. JWT Secret

Generate a secure random string:

**Method 1 - Using Node.js:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Method 2 - Online:**
Visit https://randomkeygen.com/ and copy a 256-bit key

**Add to `backend/.env`:**
```env
JWT_SECRET=your-generated-secret-key-here
```

---

### 4. AWS S3 (Optional)

**For Testing:**
Leave placeholder values - file upload will work but files won't be stored.

**For Production:**
1. Create AWS account
2. Create S3 bucket
3. Generate access keys (IAM → Users → Security credentials)
4. Add to `backend/.env`:
```env
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=ap-south-1
AWS_S3_BUCKET=your-bucket-name
```

---

## Complete .env Template

Create `backend/.env` with:

```env
# Server
PORT=5000
NODE_ENV=development

# Database (Supabase)
DB_HOST=db.xxxxxxxxxxxxx.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your-password

# JWT Secret
JWT_SECRET=your-generated-secret

# AWS S3 (optional for testing)
AWS_ACCESS_KEY_ID=test-key
AWS_SECRET_ACCESS_KEY=test-secret
AWS_REGION=ap-south-1
AWS_S3_BUCKET=jayprint-bucket

# Razorpay
RAZORPAY_KEY_ID=rzp_test_1DP5mmOlF5G5ag
RAZORPAY_KEY_SECRET=thisissecretkey
RAZORPAY_WEBHOOK_SECRET=test_webhook_secret

# Frontend
FRONTEND_URL=http://localhost:3000

# Pricing (INR)
PRICE_PER_PAGE_BW=2
PRICE_PER_PAGE_COLOR=10
PRICE_BINDING=50
```

---

## Testing

**Test Card (Razorpay):**
```
Card: 4111 1111 1111 1111
CVV: 123
Expiry: 12/25
```

**Start Application:**
```bash
# Backend
cd backend
npm install
npm run dev

# Frontend (new terminal)
cd frontend
npm install
npm start
```

Open http://localhost:3000

---

## Security Notes

⚠️ **Never commit `.env` files to Git!**  
⚠️ **Keep API keys and secrets secure**  
⚠️ **Use test credentials for development**  
⚠️ **Generate new secrets for production**
