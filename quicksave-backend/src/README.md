# 🛡️ Quicksave (Ajo) Backend API

![CI Status](https://img.shields.io/badge/build-passing-brightgreen)
![Coverage](https://img.shields.io/badge/coverage-70%25%2B-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue)
![License](https://img.shields.io/badge/license-MIT-green)

The enterprise-grade backend powering the **Quicksave** rotating savings platform (Ajo/Esusu). Designed for high-concurrency financial transactions, real-time WebSocket updates, and robust offline-first synchronization.

---

## 🏗️ Architecture & Tech Stack

- **Framework:** Node.js + Express (TypeScript)
- **Database:** PostgreSQL + Prisma ORM
- **Cache & Queues:** Redis + Bull (Background Workers & Sockets)
- **Real-Time:** Socket.io (Bi-directional events)
- **Validation:** Zod (Strict schema parsing)
- **Payments:** Paystack API & Webhooks
- **CI/CD:** GitHub Actions -> Railway.app

### 💡 Core Engineering Highlights
1. **Atomic Financial Ledger:** Wallet debits and group credits are executed inside isolated Prisma `$transaction` blocks with `SELECT ... FOR UPDATE` Row-Level Locking, eliminating double-spend race conditions.
2. **Offline-First Sync Engine:** Mobile clients can queue contributions via SQLite when offline. This backend processes bulk-sync payloads using **Idempotency Keys** to guarantee no user is ever charged twice for a network retry.
3. **Socket Lifecycle Management:** Users automatically join isolated Socket.io rooms mapped to their database memberships upon JWT verification. Disconnections are gracefully handled via Redis presence sets.
4. **Automated Scheduling:** Bull cron-jobs autonomously calculate rotation dates, process payouts, and dispatch Expo Push Notifications exactly when cycles complete.

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v20+)
- **PostgreSQL** (v15+)
- **Redis** (v7+)

### 2. Local Setup
Clone the repository and install dependencies:
\`\`\`bash
git clone https://github.com/your-username/quicksave-backend.git
cd quicksave-backend
npm install
\`\`\`

Set up your environment variables:
\`\`\`bash
cp .env.example .env
# Edit .env with your local or cloud database credentials
\`\`\`

### 3. Database Migration
Push the Prisma schema to your database and generate the TypeScript client:
\`\`\`bash
npx prisma migrate dev --name init
npx prisma generate
\`\`\`

*(Optional) Seed the database with test users and groups:*
\`\`\`bash
npm run seed
\`\`\`

### 4. Running the Server
Start the development server (with hot-reloading):
\`\`\`bash
npm run dev
\`\`\`
The API will be available at `http://localhost:3000`.

---

## 🧪 Testing

The platform enforces a strict `>70%` test coverage threshold via Jest and Supertest. The integration suite spins up a dedicated test database to perform actual database I/O and Socket concurrency checks.

\`\`\`bash
# 1. Setup the test database
npm run test:db:setup

# 2. Run the full test suite
npm run test
\`\`\`

---

## 📚 API Documentation (Postman)

The complete API contract—including pre-request JWT injection scripts and payload schemas—is documented via Postman.

1. Import the `Quicksave-Production-API.postman_collection.json` file (located in the `/docs` folder) into your Postman workspace.
2. Update the `baseUrl` and `token` collection variables.
3. Fire away!

---

## 📁 Feature-Based Folder Structure
This project uses Domain-Driven Design. Instead of spreading routes, controllers, and services across global folders, everything is self-contained:
\`\`\`text
src/
 ├── config/          # Environment, Prisma, Redis, Socket initialization
 ├── middleware/      # Auth guards, Zod validators, Rate limiters
 ├── modules/         # Feature modules
 │    ├── auth/       # Login, Register, Password Reset
 │    ├── group/      # Group creation, Joining, Rotation Engine
 │    ├── wallet/     # Ledgers, Withdrawals, Funding
 │    └── webhook/    # Paystack event handlers
 ├── queues/          # Bull background workers (Scheduler, Payouts)
 └── tests/           # Integration and Unit tests
\`\`\`

## 🔒 Security
- **Fail-Fast Boot:** The server refuses to boot if `env.ts` fails Zod validation.
- **Rate Limiting:** Global API limiters + strict Authentication limiters (backed by Redis) prevent brute-force attacks.
- **Helmet & CORS:** HTTP headers are secured, and CORS strictly whitelists the Next.js Admin console and Mobile application domains.