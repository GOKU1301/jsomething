# JayPrint - Digital Printing Management System

A queue-free printing solution for college environments.

## 📁 Project Structure

```
JAYPRINT/
├── backend/              # Node.js + Express backend
├── frontend/             # React application  
├── database/             # SQL migrations
└── documentation files
```

## 🚀 Quick Start (No Account Creation Required!)

### Step 1: Get Your Supabase Database Host

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to Settings → Database
4. Find "Connection string" - it looks like:
   ```
   postgresql://postgres:[password]@db.abcdefghijk.supabase.co:5432/postgres
   ```
5. Copy the part: `db.abcdefghijk.supabase.co`

### Step 2: Configure Backend

1. Open `backend/.env`
2. Replace `DB_HOST` with your Supabase host from Step 1
3. **That's it!** All other credentials are pre-configured for testing

**See [TEST_CREDENTIALS.md](file:///C:/Users/debu1/JAYPRINT/TEST_CREDENTIALS.md) for the complete .env template**

### Step 3: Add Password Column

Run this in Supabase SQL Editor:
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT NOT NULL DEFAULT '';
```

### Step 4: Install & Run

**Backend:**
```bash
cd backend
npm install
npm run dev
```

**Frontend (new terminal):**
```bash
cd frontend
npm install
npm start
```

**Open:** http://localhost:3000

## 🧪 Test Payment (No Bank Account Needed)

Use these test card details:
```
Card: 4111 1111 1111 1111
CVV: 123
Expiry: 12/25
```

## 📚 Documentation

- **[TEST_CREDENTIALS.md](file:///C:/Users/debu1/JAYPRINT/TEST_CREDENTIALS.md)** ⭐ START HERE - Complete .env with test credentials
- **[CREDENTIALS_GUIDE.md](file:///C:/Users/debu1/JAYPRINT/CREDENTIALS_GUIDE.md)** - For production credentials
- **[PROJECT_STRUCTURE.md](file:///C:/Users/debu1/JAYPRINT/PROJECT_STRUCTURE.md)** - Project overview
- **[QUICK_START.md](file:///C:/Users/debu1/JAYPRINT/QUICK_START.md)** - Quick reference

## ✨ Features

**Students:**
- Upload PDFs with drag & drop
- Select print preferences (color, copies, binding)
- Pay online with Razorpay
- Track orders in real-time

**Admins:**
- View print queue
- Update order status
- Download files
- Real-time notifications

## 🔧 Tech Stack

- **Backend:** Node.js, Express, PostgreSQL, JWT, Razorpay
- **Frontend:** React, React Router, Axios
- **Database:** Supabase PostgreSQL
- **Storage:** AWS S3 (optional for testing)
- **Real-time:** Server-Sent Events (SSE)

## 📝 License

Educational project for college use.
