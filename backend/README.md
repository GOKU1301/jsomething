# Backend

Node.js + Express backend for JayPrint digital printing management system.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables in `.env` (see below for credentials)

3. Run the server:
```bash
npm run dev
```

Server will start on `http://localhost:5000`

## API Endpoints

- **Auth**: `/api/auth/*`
- **Files**: `/api/files/*`
- **Orders**: `/api/orders/*`
- **Payments**: `/api/payments/*`
- **SSE**: `/api/sse/*`

See main README for detailed API documentation.
