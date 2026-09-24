# ReachInbox Email Scheduler

## Overview

ReachInbox is a queue-driven email scheduler. Users create campaigns in the React dashboard, the Express API stores them in MySQL through Prisma, and BullMQ schedules delivery through Redis. A worker sends each message with Nodemailer and persists its final status.

## Features

- Create campaigns for one or more recipients
- Send immediately or schedule for a future date and time
- Track `SCHEDULED`, `PROCESSING`, `SENT`, `FAILED`, and `CANCELLED` statuses
- Cancel queued campaigns or permanently delete campaign records
- Search and filter campaigns
- Database-backed dashboard statistics and recent activity
- Ethereal SMTP preview delivery

## Tech Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS, Framer Motion
- Backend: Express, TypeScript
- Database: MySQL with Prisma
- Queue: BullMQ with Redis
- Email: Nodemailer with Ethereal SMTP

## Architecture

```text
React frontend
	-> Express API
	-> MySQL + Prisma
	-> BullMQ
	-> Redis
	-> Email worker
	-> Nodemailer
	-> Ethereal SMTP
```

## Project Structure

```text
backend/
	prisma/             Prisma schema and migrations
	src/config/         Prisma and Redis clients
	src/controllers/    HTTP request handlers
	src/queues/         BullMQ queue
	src/routes/         API routes
	src/services/       Email and dashboard services
	src/workers/        BullMQ email worker
frontend/
	src/components/     Dashboard UI components
	src/pages/          Application pages
	src/lib/api.ts      Frontend API client
docker-compose.yml    Redis 7 service
```

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and provide local values:

```env
PORT=5000
DATABASE_URL=mysql://root:<password>@127.0.0.1:3306/reachinbox
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=<ethereal-username>
SMTP_PASSWORD=<ethereal-password>
JWT_SECRET=<long-random-signing-secret>
```

Never commit `backend/.env` or place real credentials in `.env.example`. URL-encode reserved characters in `DATABASE_URL` passwords.

## Installation

Install dependencies in each application directory:

```powershell
cd backend
npm install
cd ..\frontend
npm install
```

## Running Redis

From the repository root:

```powershell
docker compose up -d redis
```

Redis listens on `127.0.0.1:6379`.

## Running Backend

```powershell
cd backend
npm run dev
```

The API runs at `http://localhost:5000`.

## Running Frontend

```powershell
cd frontend
npm run dev
```

The Vite development server runs at `http://localhost:5173`.

## Database Setup

Create or use the existing MySQL database named `reachinbox`, then set `DATABASE_URL`. The application does not reset or recreate the database.

## Prisma Setup

From `backend`:

```powershell
npx prisma validate
npx prisma generate
npx prisma migrate dev --name init
```

The migration command applies schema changes without destructive reset flags.

## API Endpoints

All endpoints use the `/api` prefix.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/health` | Backend health check |
| POST | `/auth/register` | Create an account with a bcrypt-hashed password |
| POST | `/auth/login` | Authenticate and return a JWT |
| POST | `/auth/logout` | End the current authenticated session |
| GET | `/auth/me` | Return the authenticated user |
| PUT | `/auth/me` | Update the authenticated user's name and email |
| POST | `/emails` | Validate, save, and queue an email |
| GET | `/emails` | List emails |
| GET | `/emails/:id` | Get one email |
| POST | `/emails/:id/cancel` | Cancel a scheduled email and remove its queue job |
| DELETE | `/emails/:id` | Permanently delete an email and remove its queue job |
| GET | `/dashboard/stats` | Return status counts from MySQL |
| GET | `/dashboard/recent` | Return the five most recent emails |

Campaign and dashboard endpoints require `Authorization: Bearer <token>`.

## Email Scheduling Flow

1. The frontend sends recipient, subject, body, and `scheduledAt` to `POST /api/emails`.
2. The API validates the request and saves a `SCHEDULED` email in MySQL.
3. BullMQ creates a delayed job containing the email ID.
4. Redis releases the job at the scheduled time.
5. The worker claims the email as `PROCESSING` and sends it through Nodemailer.
6. The worker saves `SENT` and the SMTP `messageId`, or saves `FAILED` after an error.

## Testing

```powershell
cd backend
npx prisma validate
npx prisma generate
npm run build

cd ..\frontend
npm run build
```

For a runtime check, start Redis and the backend, then request `http://localhost:5000/api/health`.

## Troubleshooting

- `P1000`: verify the MySQL credentials and URL-encode reserved password characters.
- Redis connection errors: ensure Docker Desktop is running and run `docker compose up -d redis`.
- SMTP errors: provide valid Ethereal values in `backend/.env`.
- Frontend API errors: ensure the backend is running or set `VITE_API_URL` to the backend API URL.
