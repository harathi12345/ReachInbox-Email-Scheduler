# ReachInbox Email Scheduler

## Overview

ReachInbox Email Scheduler is an enterprise-grade, queue-driven email scheduling system. The application enables users to compose, schedule, and manage bulk email campaigns with strict delivery controls including sender-specific rate limiting, minimum inter-email delay, Redis atomic concurrency control, persistence across server restarts, Elasticsearch indexing, Slack notifications, and BullMQ queue monitoring.

---

## Features

- **Authentication**: JWT-based login/signup & Google OAuth 2.0 integration.
- **Email Campaign Scheduling**: Schedule emails for instant or delayed delivery with recipient, subject, and body validation.
- **Bulk CSV/Text Upload**: Easily upload recipient lists with automated recipient count detection.
- **Worker Concurrency**: Configurable worker concurrency (`WORKER_CONCURRENCY`).
- **Sender-Specific Rate Limiting**: Atomic Redis Lua script enforces configurable hourly rate limits (`MAX_EMAILS_PER_HOUR`).
- **Rate Limit Rescheduling**: When an hourly limit is hit, jobs are rescheduled to the next hour window rather than failed or dropped.
- **Minimum Sender Delay**: Configurable inter-email delay (`EMAIL_MIN_DELAY_MS`) to prevent spam flags.
- **Atomic Idempotency**: State transitions (`SCHEDULED` -> `PROCESSING` -> `SENT`/`FAILED`) guarantee zero duplicate email sends across concurrent workers.
- **Restart Persistence**: BullMQ delayed jobs persist in Redis across backend server restarts.
- **Elasticsearch Search**: Full-text search over recipients, senders, subjects, and statuses.
- **Slack OAuth & Rate Limit Alerts**: Automatic Slack notifications triggered when sender rate limits are reached.
- **BullMQ Admin Dashboard**: Web UI at `/admin/queues` for monitoring delayed, active, completed, and failed jobs.

---

## Architecture

```text
React Frontend (Vite)
       │
       ▼  (JWT Bearer Auth)
Express API Server
       │
       ├─────────────────────────┬─────────────────────────┐
       ▼                         ▼                         ▼
MySQL (Prisma ORM)       BullMQ Queue           Elasticsearch 8.x
(User & Email Records)   (Redis Storage)        (Search Indexing)
                                 │
                                 ▼
                         Email Worker Thread
                                 │
                     (Atomic Redis Lua Script)
              ┌──────────────────┴──────────────────┐
              ▼                                     ▼
      Rate Limit / Delay                 Send Email via
      Reschedule to Queue                Ethereal SMTP
              │                                     │
              ▼                                     ▼
    Slack API Alert                     Update DB to SENT
```

---

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Framer Motion, Lucide Icons
- **Backend**: Node.js, Express, TypeScript, Nodemailer
- **Database**: MySQL with Prisma ORM
- **Queue & Storage**: Redis 7, BullMQ
- **Search**: Elasticsearch 8.x
- **Email Transport**: Ethereal SMTP
- **Integrations**: Google OAuth 2.0, Slack OAuth & Chat API
- **Monitoring**: Bull Board (`@bull-board/express`)

---

## Project Structure

```text
ReachInbox-Email-Scheduler/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma         # Prisma data models (User, Email, SlackConnection)
│   ├── src/
│   │   ├── config/               # Prisma, Redis, Elasticsearch clients
│   │   ├── controllers/          # Auth, Email, Dashboard, Slack controllers
│   │   ├── middleware/           # JWT Auth and Error handling middleware
│   │   ├── queues/               # BullMQ email queue definition
│   │   ├── routes/               # API route definitions
│   │   ├── services/             # Email transport and Dashboard services
│   │   ├── utils/                # Async handler utilities
│   │   ├── workers/              # BullMQ email worker & Redis Lua rate limiter
│   │   └── server.ts             # Express server setup and route mounting
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/           # Topbar, Sidebar, StatCards, ActivityChart
│   │   ├── contexts/             # AuthContext and ThemeContext
│   │   ├── lib/                  # Fetch API wrapper (api.ts)
│   │   ├── pages/                # Login, Signup, Dashboard, Campaigns, CreateCampaign
│   │   └── App.tsx               # Protected routing shell
│   └── .env.example
└── docker-compose.yml            # Redis container configuration
```

---

## Prerequisites

- **Node.js**: v18+ or v20+
- **MySQL**: v8.0+ running locally on port 3306
- **Redis**: v7.0+ running locally or in Docker on port 6379
- **Elasticsearch**: v8.x running locally on port 9200

---

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and update with your local configuration:

```env
PORT=5000
CORS_ORIGIN=http://localhost:5173

DATABASE_URL="mysql://username:password@127.0.0.1:3306/reachinbox"

REDIS_HOST=127.0.0.1
REDIS_PORT=6379

JWT_SECRET=your_jwt_secret_key_here

SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=your_ethereal_user@ethereal.email
SMTP_PASSWORD=your_ethereal_password

EMAIL_MIN_DELAY_MS=2000
MAX_EMAILS_PER_HOUR=200
WORKER_CONCURRENCY=5

ELASTICSEARCH_URL=http://localhost:9200
ELASTICSEARCH_INDEX=reachinbox-emails

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/auth/google/callback

SLACK_CLIENT_ID=your_slack_client_id
SLACK_CLIENT_SECRET=your_slack_client_secret
SLACK_REDIRECT_URI=http://localhost:5000/auth/slack/callback
```

---

## Setup & Running Instructions

### 1. Database Setup (MySQL & Prisma)

Ensure MySQL is running and database `reachinbox` exists:

```powershell
cd backend
npx prisma generate
npx prisma db push
```

### 2. Redis Setup

Start Redis using Docker Compose or local instance:

```powershell
docker compose up -d reachinbox-redis
```

### 3. Elasticsearch Setup

Start Elasticsearch 8.x locally on port 9200 (`http://localhost:9200`). The backend automatically initializes index `reachinbox-emails` on startup.

### 4. Running Backend

```powershell
cd backend
npm run dev
```

API runs at `http://localhost:5000`.

### 5. Running Frontend

```powershell
cd frontend
npm run dev
```

App runs at `http://localhost:5173`.

---

## Email Scheduling & Rate Limiting Mechanics

### BullMQ Architecture & Persistence
Emails are enqueued as delayed BullMQ jobs stored in Redis sorted sets. If the backend process restarts, Redis retains all delayed job definitions. When the backend starts up, worker threads resume processing remaining jobs seamlessly.

### Redis Atomic Rate Limiting (Lua Script)
Sender rate limits and inter-email delays are evaluated atomically using a Redis Lua script (`emailWorker.ts`):

1. **Hourly Limit Check**: Evaluates `email-rate:<sender>:<YYYY-MM-DDTHH>` against `MAX_EMAILS_PER_HOUR`.
2. **Minimum Delay Check**: Evaluates `email-last-sent:<sender>` against `EMAIL_MIN_DELAY_MS`.
3. **Rescheduling**: If the limit is reached, status updates to `SCHEDULED` for `nextHour` and a new delayed BullMQ job is enqueued for the next window. No emails are dropped or marked `FAILED`.

### Idempotency Protection
Workers claim jobs using an atomic database update:

```ts
const claimed = await prisma.email.updateMany({
  where: { id: email.id, status: "SCHEDULED" },
  data: { status: "PROCESSING" },
});
```

If `claimed.count === 0`, another worker thread has already claimed the job, preventing duplicate email sends.

---

## Integrations & Monitoring

### BullMQ Dashboard
Access queue status at:
`http://localhost:5000/admin/queues`

### Slack Notifications
When a sender hits their hourly limit, a Slack message is triggered to their connected Slack account. A Redis key (`slack-rate-limit:<sender>:<hour>`) with a 3600-second TTL prevents duplicate notifications within the same hour.

### Elasticsearch Search
Search emails by recipient, sender, subject, or status:
`GET /api/emails/search?q=query`

---

## API Endpoints

| Method | Endpoint | Description | Auth Required |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | Register a new user | No |
| `POST` | `/api/auth/login` | Log in user and return JWT | No |
| `GET` | `/api/auth/google` | Trigger Google OAuth 2.0 | No |
| `GET` | `/api/auth/me` | Fetch current user profile | Yes |
| `POST` | `/api/auth/logout` | Revoke session | Yes |
| `GET` | `/api/dashboard/stats` | Fetch aggregated campaign stats | Yes |
| `GET` | `/api/dashboard/recent` | Fetch 5 recent emails | Yes |
| `POST` | `/api/emails` | Create and schedule email campaign | Yes |
| `GET` | `/api/emails` | List user's scheduled/sent emails | Yes |
| `GET` | `/api/emails/search` | Full-text search via Elasticsearch | Yes |
| `POST` | `/api/emails/:id/cancel`| Cancel scheduled email | Yes |
| `DELETE`| `/api/emails/:id` | Delete email campaign | Yes |
| `GET` | `/admin/queues` | BullMQ Admin Dashboard | Public / Evaluator Accessible |

---

## Assumptions & Tradeoffs

1. **JWT Auth**: Stateless JWT tokens stored in `localStorage` satisfy client-side session management.
2. **Rescheduling Window**: Rate-limited emails are rescheduled to the start of the next UTC hour window (`HH:00:00.000Z`).
3. **Ethereal Transport**: Ethereal SMTP is used for preview delivery testing without triggering real recipient spam filters.

---

## Troubleshooting

- **401 Unauthorized**: Ensure `Authorization: Bearer <token>` header is present in requests.
- **Database Connection Error**: Verify MySQL service is running and `DATABASE_URL` in `.env` is correct.
- **Redis Connection Failure**: Run `docker exec reachinbox-redis redis-cli ping` to verify Redis response.
