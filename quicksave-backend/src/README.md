# Quicksave Backend API 💰

The core backend service for Quicksave, a modern group savings and wallet platform. Built to support secure contributions, automated payouts (via Paystack), and real-time notifications.

## 🚀 Tech Stack
- **Runtime:** Node.js + TypeScript
- **Framework:** Express.js
- **Database:** PostgreSQL + Prisma ORM
- **Caching & Queues:** Redis + Bull (for async jobs like processing payouts)
- **Validation:** Zod (Environment, API payloads)
- **Logging:** Pino (Structured JSON logging)
- **Auth:** JWT (Access & Refresh tokens)

---

## 🛠️ Getting Started (Local Development)

### 1. Prerequisites
- Node.js (v18+)
- PostgreSQL (Running locally or via cloud like Neon/Supabase)
- Redis (Running locally or via cloud like Upstash)

### 2. Installation
Clone the repository and install dependencies:
\`\`\`bash
git clone https://github.com/your-username/quicksave-backend.git
cd quicksave-backend
npm install
\`\`\`

### 3. Environment Variables
The application uses strict environment validation. It will refuse to start if variables are missing.
1. Copy the example environment file:
   \`\`\`bash
   cp .env.example .env
   \`\`\`
2. Update the `.env` file with your database and Redis credentials.

### 4. Database Setup
Push the Prisma schema to your PostgreSQL database and generate the TS client:
\`\`\`bash
npx prisma db push
npx prisma generate
\`\`\`

*(Optional)* Seed the database with dummy users, wallets, and groups:
\`\`\`bash
npm run seed
\`\`\`

### 5. Running the App
Start the development server (uses `ts-node-dev` for hot-reloading):
\`\`\`bash
npm run dev
\`\`\`
The server should now be running at `http://localhost:3000`.

---

## 🏗️ Architecture & Core Decisions

### Fail-Fast Configuration
We don't use `process.env` directly in the codebase. All environment variables are strictly validated on startup inside `src/config/env.ts` using **Zod**. If a variable is missing, the app refuses to start and logs a clear error.

### Consistent API Responses
To ensure seamless integration with the React Native frontend, all API endpoints return a standardized envelope. This is enforced via `sendSuccess` and `sendError` in `src/utils/response.ts`.

**Success:**
\`\`\`json
{
  "success": true,
  "message": "Wallet funded successfully",
  "data": { "balance": 50000 }
}
\`\`\`

**Error:**
\`\`\`json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "body.amount", "message": "Amount must be greater than 0" }
  ]
}
\`\`\`

### Global Error Handling & Async Wrapper
Controllers do not use `try/catch` blocks. Instead, they are wrapped in `catchAsync`, which automatically forwards errors to our global `errorHandler` middleware. Prisma database errors (like unique constraint violations) are automatically parsed into clean `400` or `409` HTTP responses.

### Structured Logging
We use **Pino** for logging. 
- In **development**, logs are pretty-printed and colorized via `pino-pretty`.
- In **production**, logs are output as pure JSON, making them easily searchable in Datadog/CloudWatch by `userId`, `groupId`, or `transactionId`.

---

## 📜 Available Scripts

- `npm run dev` — Starts the development server with auto-reload.
- `npm run build` — Compiles TypeScript into JavaScript in the `/dist` folder.
- `npm start` — Runs the compiled production code.
- `npm run seed` — Drops current database state and populates it with faker data.