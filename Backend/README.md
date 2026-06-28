# AI Hospital Agent System Backend

This repository is a production-ready, enterprise-grade backend for an AI Hospital Agent System built with modern Node.js, Express, GraphQL Yoga, MongoDB, Redis, and BullMQ.

## 🏛️ System Architecture (PPVERP Pattern)

The system isolates boundaries strictly:

```
src/
├── config/              # Zod environment variable parsing
├── database/            # Connection manager and pool policies
├── graphql/             # Yoga schema orchestration, context builder, and DataLoaders
│   ├── typeDefs/
│   ├── resolvers/
│   ├── context/
│   └── loaders/         # Batch relation loaders (preventing N+1 queries)
├── modules/             # Autonomous business domains
│   ├── auth/            # JWT, rotation (RTR), session tracking, RBAC/PBAC
│   ├── patients/        # Profiles and history
│   ├── doctors/         # Schedule availability and metadata
│   ├── appointments/    # Conflict checking booking engine
│   ├── billing/         # PDFKit automated invoice generator
│   ├── labs/            # Background OCR queue processing
│   └── ai-agents/       # Independent specialized AI agents (Planner, Lab, Billing, etc.)
└── shared/              # Central cross-cutting concern services
    ├── cache/           # ioredis caching layer
    ├── errors/          # Custom operational error classes (AppError)
    ├── events/          # System-wide async events
    ├── middleware/      # Auth, rate limiters, global error interceptor
    ├── providers/       # Nodemailer (email), PDFKit (PDF)
    ├── queue/           # BullMQ queue instantiations
    ├── socket/          # Socket.IO authenticated notifications
    ├── utils/           # Reuseable pagination
    └── workers/         # BullMQ queue job executors
```

### Flow of Operations
```
Client (HTTP/WS) ──> Route/Resolver ──> Validator (Zod) ──> Service (Logic) ──> Repository ──> Database (Mongoose/Redis)
```

---

## 🛠️ Tech Stack & Key Features

* **Primary API**: **GraphQL (GraphQL Yoga)**. REST is reserved solely for:
  - Health checks (`/api/health`)
  - File uploads (`/api/upload`)
* **Database**: **MongoDB (Mongoose)** with unique, TTL, text indexes, aggregation pipelines, and base repositories automating soft delete and audit logging (`createdBy`, `deletedAt`).
* **Caching & Queue**: **Redis (ioredis)** and **BullMQ** for background job queues (email, billing invoices, lab reports OCR, AI agent tasks).
* **Real-time Updates**: **Socket.IO** with JWT handshake authentication to emit live appointment status changes and AI task progress.
* **Security & Defense**:
  - **Helmet & CORS** secure response headers.
  - **Redis-backed Rate Limiting** applied globally, on authentication (login/OTP), and file uploads.
  - **Refresh Token Rotation (RTR)** with reuse detection to invalidate all user sessions if a compromised refresh token is re-submitted.
* **Diagnostics & Trace**:
  - **Pino Logger** with `AsyncLocalStorage` to automatically bind and output a `requestId` across asynchronous execution threads.
  - Advanced REST `/health` monitoring CPU, RAM, and database/cache connections.

---

## ⚙️ Setup & Installation

### Prerequisites
* **Node.js**: v22+
* **MongoDB**: Running locally or a connection URI
* **Redis**: Running locally

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and fill in secrets:
```bash
cp .env.example .env
```

### 3. Run Development Server (Nodemon + ts-node)
```bash
npm run dev
```

### 4. Build and Run Production Bundle
```bash
npm run build
npm start
```

### 5. Run Verification Tests
```bash
npm test
```

---

## 🩺 REST API Endpoints

### 1. Health Status check
* **URL**: `GET /api/health`
* **Response**:
```json
{
  "status": "OK",
  "timestamp": "2026-06-27T10:45:00.000Z",
  "uptime": "12m 4s",
  "services": {
    "database": "UP",
    "cache": "UP",
    "queues": "UP"
  },
  "metrics": {
    "memoryUsage": {
      "rss": "85 MB",
      "heapTotal": "45 MB",
      "heapUsed": "28 MB"
    }
  }
}
```

### 2. Secure File Upload
* **URL**: `POST /api/upload`
* **Headers**: `Authorization: Bearer <JWT_ACCESS_TOKEN>`
* **Body**: `multipart/form-data` with key `file` (Supports JPEG, PNG, PDF, DOCX up to 10MB)
* **Optimization**: Sharp automatically resizes and compresses images.
