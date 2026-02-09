# 🔐 Quick Credentials Reference

Copy this template to your `backend/.env` file and fill in the values.

## Complete .env File

```env
# ==========================================
# SERVER CONFIGURATION
# ==========================================
PORT=5000
NODE_ENV=development

# ==========================================
# DATABASE (Supabase PostgreSQL)
# ==========================================
# 📍 How to get DB_HOST:
# 1. Go to https://supabase.com/dashboard
# 2. Select your project
# 3. Go to Settings → Database
# 4. Find "Connection string" 
# 5. Copy the part after @ and before :5432
#    Example: postgresql://postgres:[password]@db.abcdefghijk.supabase.co:5432/postgres
#    Your DB_HOST: db.abcdefghijk.supabase.co

DB_HOST=db.xxxxxxxxxxxxx.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=3r-#F9QP3yBgixD

# ==========================================
# JWT SECRET
# ==========================================
# 📍 Generate using one of these methods:
# Method 1: Run in terminal:
#   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# Method 2: Visit https://randomkeygen.com/ and copy a 256-bit key

JWT_SECRET=REPLACE_WITH_YOUR_GENERATED_SECRET

# ==========================================
# AWS S3 (Skip for now - configure later)
# ==========================================
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=ap-south-1
AWS_S3_BUCKET=jayprint-documents

# ==========================================
# RAZORPAY
# ==========================================
# 📍 How to get these:
# 1. Sign up at https://razorpay.com/
# 2. Go to https://dashboard.razorpay.com/
# 3. Navigate to Settings → API Keys
# 4. Click "Generate Test Key" (for development)
# 5. Copy Key ID and Key Secret

RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXX
RAZORPAY_KEY_SECRET=REPLACE_WITH_YOUR_SECRET

# 📍 Webhook Secret:
# 1. Go to Settings → Webhooks
# 2. Click "Create New Webhook"
# 3. For local testing:
#    - Install ngrok: npm install -g ngrok
#    - Run: ngrok http 5000
#    - Use ngrok URL: https://xxxx.ngrok.io/api/payments/webhook
# 4. Select events: payment.captured, payment.failed
# 5. Copy the webhook secret

RAZORPAY_WEBHOOK_SECRET=whsec_XXXXXXXXXXXX

# ==========================================
# FRONTEND URL (for CORS)
# ==========================================
FRONTEND_URL=http://localhost:3000

# ==========================================
# PRICING CONFIGURATION (in INR)
# ==========================================
PRICE_PER_PAGE_BW=2
PRICE_PER_PAGE_COLOR=10
PRICE_BINDING=50
```

## ✅ Checklist

Before starting the application:

- [ ] Replaced `DB_HOST` with your Supabase host
- [ ] Generated and added `JWT_SECRET`
- [ ] Added `RAZORPAY_KEY_ID` from Razorpay dashboard
- [ ] Added `RAZORPAY_KEY_SECRET` from Razorpay dashboard
- [ ] Set up ngrok and added `RAZORPAY_WEBHOOK_SECRET`
- [ ] Ran SQL migration to add password_hash column
- [ ] Saved the file as `backend/.env`

## 🧪 Test Credentials

### Razorpay Test Card
```
Card Number: 4111 1111 1111 1111
CVV: 123
Expiry: 12/25
Name: Any name
```

### Test Flow
1. Register as student
2. Upload PDF
3. Create order
4. Pay with test card above
5. Check order status changes to "QUEUED"

## 🆘 Quick Troubleshooting

**Database connection failed?**
→ Check DB_HOST format: should be `db.xxxxx.supabase.co`

**Payment not working?**
→ Make sure you're using TEST keys (start with `rzp_test_`)

**Webhook not triggering?**
→ Use ngrok to expose localhost: `ngrok http 5000`

---

📖 **For detailed instructions, see [CREDENTIALS_GUIDE.md](file:///C:/Users/debu1/JAYPRINT/CREDENTIALS_GUIDE.md)**
