# 🛡️ Quicksave (Ajo / Esusu Platform)

![CI Status](https://img.shields.io/badge/build-passing-brightgreen)
![Coverage](https://img.shields.io/badge/coverage-70%25%2B-brightgreen)
![License](https://img.shields.io/badge/license-MIT-green)

Quicksave is an enterprise-grade, offline-first FinTech platform that digitizes traditional rotating savings groups (Ajo/Esusu). It features a robust mobile app for end-users, a Next.js web dashboard for platform admins, and a highly concurrent Node.js backend.

## 📸 Platform Previews

> **Note:** The entire platform natively supports dynamic Light and Dark modes.

| Mobile (Dark Mode) | Mobile (Light Mode) | Web Admin Console |
|:---:|:---:|:---:|
| *(Add your screenshot link here)* | *(Add your screenshot link here)* | *(Add your screenshot link here)* |

---

## 🏗️ Architecture & Tech Stack

This repository is a **Monorepo** containing three interconnected applications:

### 1. Mobile App (`/quicksave-mobile`)
- **Framework:** React Native (Expo SDK 54, New Architecture / Fabric enabled)
- **State Management:** Redux Toolkit + Redux Persist
- **Offline-First:** Expo SQLite (Local queueing for network drops)
- **Hardware Integrations:** FaceID/Fingerprint (Biometrics), Camera (QR Scanning)
- **Real-Time:** Socket.io-client

### 2. Admin Console (`/quicksave-admin`)
- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS + Lucide Icons
- **Auth:** NextAuth.js (Custom Credentials Provider linked to Express backend)
- **Charts:** Recharts for financial data visualization

### 3. Backend Engine (`/quicksave-backend`)
- **Core:** Node.js + Express + TypeScript
- **Database:** PostgreSQL (Neon) managed via Prisma ORM
- **Concurrency:** Prisma `$transaction` with `SELECT ... FOR UPDATE` row-level locking
- **Queues:** BullMQ + Redis (Upstash) for background sync and automated payouts
- **WebSockets:** Socket.io for real-time wallet and group timeline updates

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v20+)
- Docker (Optional, for running Postgres/Redis locally)
- Expo Go or Expo Dev Client

### Environment Variables
Duplicate the `.env.example` files in both the backend and mobile directories to `.env` and fill in the required keys. Do **NOT** use `localhost` for mobile testing; use your machine's IPv4 address.

### Installation & Running Locally

**1. Boot the Backend**
\`\`\`bash
cd quicksave-backend
npm install
npx prisma migrate dev
npm run dev
\`\`\`

**2. Boot the Mobile App**
\`\`\`bash
cd quicksave-mobile
npm install
npx expo start -c
\`\`\`

**3. Boot the Admin Web Console**
\`\`\`bash
cd quicksave-admin
npm install
npm run dev -- -p 3001
\`\`\`

---

## 🧪 Testing & CI/CD
This project enforces a strict `>70%` test coverage threshold. The CI/CD pipeline runs on **GitHub Actions**, performing simultaneous linting, type-checking, and integration testing across the monorepo before deploying the backend to **Railway**, the Web Admin to **Vercel**, and compiling the mobile `.apk` via **EAS (Expo Application Services)**.

\`\`\`bash
# Run backend test suite
cd quicksave-backend && npm run test

# Run mobile E2E and component tests
cd quicksave-mobile && npm run test
\`\`\`