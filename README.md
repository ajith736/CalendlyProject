# Calendly-Style Scheduling Backend

A Node.js/TypeScript REST API for host-driven appointment scheduling: availability rules, pre-generated bookable slots, race-safe booking, and async side effects (email, Google Calendar) via Temporal.

> Built for interview discussion — every section maps to real code under `src/`, `prisma/`, `k6/`, and `docker-compose.yml`.

---

## Project Overview

Hosts configure **when they are available** (weekly rules + date exceptions) and **what meeting types they offer** (event types with duration and buffers). The backend **materializes concrete time slots** into PostgreSQL, exposes a **public read endpoint** for invitees to view an event type, and accepts **bookings** that atomically reserve a slot. After a booking succeeds, **Temporal workflows** regenerate slots for that day, send a confirmation email, and optionally create a Google Calendar event with a Meet link.

**What it is not (yet):** no JWT/session auth (host routes use an `x-user-id` header), no Redis (OAuth tokens live in env vars), no public “list available slots” HTTP endpoint (slot query helpers exist but are not wired to a router).

---

## Architecture

```
┌─────────────┐     HTTP      ┌──────────────────────────────────────────┐
│   Client    │ ────────────► │  Express (src/app.ts)                    │
│  (k6 / API) │               │  Routers → Controllers → Services        │
└─────────────┘               │              │                           │
                              │              ▼                           │
                              │         Repositories (Prisma)            |
                              │              │                           │
                              │              ▼                           │
                              │         PostgreSQL                       │
                              └──────────────┬───────────────────────────┘
                                             │ start workflow (async)
                                             ▼
                              ┌──────────────────────────────────────────┐
                              │  Temporal Worker (src/temporal/worker.ts)│
                              │  Activities: slot regen, email, GCal     │
                              └──────────────────────────────────────────┘
```

**Layered layout** (`src/`):

| Layer | Folder | Role |
|-------|--------|------|
| HTTP | `routers/`, `controllers/` | Routing, request/response |
| Validation | `middlewares/validate.ts`, `dtos/` | Zod schemas |
| Business logic | `services/` | Booking, slots, availability, integrations |
| Data access | `repositories/` | Prisma queries, raw SQL for locking |
| Infrastructure | `config/` | DB, Temporal, SMTP, env |
| Async | `temporal/` | Workflows, activities, worker, client |

---

## Tech Stack

| Technology | Used for | Key files |
|------------|----------|-----------|
| **Node.js + TypeScript + Express 5** | HTTP API, ESM modules | `src/app.ts`, `src/server.ts` |
| **PostgreSQL + Prisma 7** | Relational data, migrations, transactions | `prisma/schema.prisma`, `src/config/database.ts` |
| **Temporal** | Durable async jobs with retries | `src/temporal/*`, `docker-compose.yml` |
| **Luxon** | Timezone-safe slot math | `src/services/slot-generation.service.ts` |
| **Zod** | Request validation | `src/dtos/*` |
| **Nodemailer + MailHog** | Confirmation emails (dev SMTP) | `src/config/nodemailer.ts`, `docker-compose.yml` |
| **Google APIs (OAuth 2.0)** | Calendar events + Meet links | `src/services/google-calender.service.ts` |
| **Docker Compose** | Temporal server, Temporal UI, MailHog | `docker-compose.yml` |
| **Grafana k6** | Load & concurrency tests | `k6/*.js` |

**Not in use:** Redis (only mentioned in comments as a future place to store OAuth refresh tokens).

---

## Main Features

1. **User management** — CRUD for hosts (`/api/users`). See `src/routers/user.router.ts`.
2. **Event types** — Host-defined meeting templates (duration, buffers, slug). See `src/routers/event-type.router.ts`.
3. **Availability** — Weekly rules + exceptions (block full day, block partial, add extra window). See `src/routers/availability.router.ts`.
4. **Slot generation** — Background job builds `AVAILABLE` slot rows from rules + exceptions. See `src/services/slot.services.ts`.
5. **Public event page data** — Unauthenticated GET for invitees. See `src/routers/public-event-type.router.ts`.
6. **Booking** — Transactional slot reservation + side effects. See `src/routers/booking.router.ts`.
7. **Google Calendar integration** — OAuth setup callback + async event creation. See `src/routers/google.router.ts`.

---

## Request Flow

### Public: view event type

```
GET /api/public/users/:userId/event-types/:slug
  → event-type.controller.getPublicEventType
  → event-types.service.getEventTypePublic
  → returns { eventType, host } (no slots in response)
```

### Host: create availability rule

```
POST /api/availability/rules  (header: x-user-id)
  → validate (Zod) → availability.service.createRule
  → prisma create → startRegenerateHostWorkflow (Temporal)
```

### Book a slot

```
POST /api/bookings  (header: x-user-id, body: slotId, inviteeEmail, inviteeName)
  → booking.service.createBookingPessimistically
       prisma.$transaction:
         1. SELECT ... FOR UPDATE on slot
         2. validate status === AVAILABLE, startAt > now
         3. UPDATE slot status → BOOKED
         4. INSERT booking (status CONFIRMED)
       post-transaction (best-effort):
         → regenerate slots for that day (Temporal)
         → send confirmation email (Temporal)
         → create Google Calendar event (Temporal)
  → 201 { booking: { id, status, startAt, endAt } }
```

---

## Database Design

Schema: `prisma/schema.prisma`

| Model | Purpose |
|-------|---------|
| `User` | Host; unique `email`, `slug`, `timezone` |
| `EventType` | Meeting template; unique `[hostId, slug]` |
| `AvailabilityRule` | Recurring weekday window (`startTime`/`endTime` as `HH:mm`) |
| `AvailabilityException` | One-off override by date (`BLOCK_FULL_DAY`, `BLOCK_PARTIAL`, `ADD_AVAILABLE_WINDOW`) |
| `Slot` | Materialized bookable window; `status`: `AVAILABLE` \| `BOOKED` \| `BLOCKED`; unique `[eventTypeId, startAt, endAt]` |
| `Booking` | Links host, event type, slot, invitee; optional `meetLink`, `calendarEventId` |

Indexes support host/date lookups (`slots`, `bookings`, `availability_*`).

---

## Authentication

**Host-protected routes** (`/api/bookings`, `/api/event-types`, `/api/availability/*`) require header:

```
x-user-id: <numeric user id>
```

Implemented in `src/middlewares/require-user-id.ts`. Returns `401` if missing, `400` if not a number.

**User routes** (`/api/users`) have **no auth middleware** — open CRUD.

**Google OAuth 2.0** (`src/services/google-calender.service.ts`) is for **calendar integration setup**, not end-user login:

- Scopes: Calendar read/write + user email
- `access_type: 'offline'`, `prompt: 'consent'` to obtain a **refresh token**
- Callback: `GET /api/integrations/google/callback?code=...` exchanges code → refresh token (returned in JSON; stored in `GOOGLE_REFRESH_TOKEN` env for the worker)

---

## Booking & Concurrency Control

Two strategies live in `src/services/booking.service.ts`:

| Strategy | Mechanism | Wired to API? |
|----------|-----------|---------------|
| **Pessimistic** (production) | `SELECT id FROM slots WHERE id = $1 FOR UPDATE` then update | Yes — `booking.controller.ts` |
| **Optimistic** | `updateMany({ id, status: 'AVAILABLE' })` — succeeds only if `count === 1` | No — available for comparison/testing |

Both run inside `prisma.$transaction()` so slot update and booking insert are atomic.

**Why pessimistic for interviews:** under 50 simultaneous bookers on the same slot, k6 asserts exactly **1× 201** and **49× 400** with **zero 5xx** (`k6/02_concurrent_book_slot.js`).

Relevant code:

- `src/repositories/slot.repository.ts` — `lockSlotForUpdate`, `markSlotBookedIfAvailable`
- `src/services/booking.service.ts` — `createBookingPessimistically`

---

## Temporal Workflows

**Task queue:** `calendly-tasks` (`src/config/env.ts`)

| Workflow | Trigger | Activity |
|----------|---------|----------|
| `regenerateHostSlotsWorkflow` | Availability/event-type change; after booking | Recompute & upsert slots |
| `sendBookingConfirmationEmailWorkflow` | After booking | Nodemailer HTML email |
| `createGoogleCalendarEventWorkflow` | After booking | Google Calendar + Meet link → update booking |

Files:

- Client (fire-and-forget): `src/temporal/client.ts`
- Worker: `src/temporal/worker.ts` — run via `npm run dev:worker`
- Workflows: `src/temporal/workflows/`
- Activities: `src/temporal/activities/index.ts`

Retries: `maximumAttempts: 3`, `startToCloseTimeout: 10 minutes`.

Temporal can be disabled with `TEMPORAL_ENABLED=false` (workflows skipped, API still works).

---

## API Overview

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | — | Health check |
| GET/POST/PATCH/DELETE | `/api/users` | — | User CRUD |
| GET/POST/PATCH/DELETE | `/api/event-types` | `x-user-id` | Event type CRUD |
| GET/POST/PATCH/DELETE | `/api/availability/rules` | `x-user-id` | Weekly rules |
| GET/POST/PATCH/DELETE | `/api/availability/exceptions` | `x-user-id` | Date exceptions |
| GET | `/api/public/users/:userId/event-types/:slug` | — | Public event + host info |
| GET/POST | `/api/bookings` | `x-user-id` | List/create bookings |
| GET | `/api/integrations/google/callback` | — | OAuth code exchange |

**Response shape:** `{ success: true, data, message? }` or `{ success: false, message, details? }` — see `src/utils/api-response.ts`, `src/middlewares/error-handler.ts`.

---

## Load Testing & Results

Scripts: `k6/01_get_public_event_type.js`, `k6/02_concurrent_book_slot.js`

**Environment (documented in prior test run):** local Windows 11, i5-12450H, 16 GB RAM; PostgreSQL + Temporal in Docker.

### Test 1 — Public event type stress (`01_get_public_event_type.js`)

- **Endpoint:** `GET /api/public/users/{USER_ID}/event-types/{EVENT_SLUG}`
- **Load profile:** staged ramp 25 → 50 → 100 → 200 → 300 → 400 → 500 VUs (30s each), then ramp down
- **Checks:** HTTP 200, JSON, `success === true`, `eventType` + `host` present
- **Recorded results:**
  - **104,418** total requests
  - **434.62 req/s** throughput
  - **p95 918.92 ms**, **p99 1.18 s**
  - **0% HTTP errors**, **100% application-level success**

**What this means:** the read-heavy public endpoint stayed stable under high concurrency on a single local machine — no crashes or connection failures. Latency grows under load (sub-second p95 at peak) but failures stayed at zero.

### Test 2 — Same-slot booking contention (`02_concurrent_book_slot.js`)

- **Endpoint:** `POST /api/bookings` with same `slotId`, **50 VUs**, 1 iteration each
- **Checks:** status is **201 or 400** (never 5xx); custom metric `booking_created` must equal **1**
- **Recorded results:**
  - **1** successful booking, **49** rejections (400)
  - **0** double bookings, **0%** server errors
  - **p95 latency 318.43 ms**

**What this means:** pessimistic locking + transaction correctly serializes writers — exactly one winner, everyone else gets a clean business error, not a server failure.

### Run commands

```bash
# Default base URL in scripts: http://localhost:3001 (override with BASE_URL)
k6 run ./k6/01_get_public_event_type.js
k6 run ./k6/02_concurrent_book_slot.js

# Booking test requires a real slot:
SLOT_ID=<cuid> USER_ID=1 k6 run ./k6/02_concurrent_book_slot.js
```

---

## Important Technical Decisions & Trade-offs

| Decision | Rationale | Trade-off |
|----------|-----------|-----------|
| **Pre-generated slots** | Fast booking lookup; simple `status` flip | Regeneration job must run when rules/bookings change |
| **Pessimistic `FOR UPDATE`** | Clear correctness under contention | Holds row lock for transaction duration |
| **Optimistic alternative kept in code** | Shows understanding of both patterns | Not exposed via API |
| **Temporal for side effects** | Retries, decouples slow IO from HTTP | Extra infra (Docker); worker must run |
| **Luxon for time math** | Correct weekday/timezone handling | Another dependency vs raw `Date` |
| **`x-user-id` header auth** | Simple for backend-focused demo | Not production-ready; no invitee auth either |
| **Refresh token in env** | Works for single-host calendar demo | Comments note Redis/DB would be better per-user |
| **Prisma adapter-pg** | Prisma 7 driver adapter pattern | Slightly more setup than default client |

---

## How to Run

### Prerequisites

- Node.js 18+
- PostgreSQL (connection string in `DATABASE_URL`)
- Docker (for Temporal + MailHog)

### Environment variables

See `src/config/env.ts`:

```
PORT=3000
DATABASE_URL=postgresql://...
TEMPORAL_ADDRESS=localhost:7233
TEMPORAL_NAMESPACE=default
TEMPORAL_TASK_QUEUE=calendly-tasks
TEMPORAL_ENABLED=true
SLOT_GENRATION_DAYS=30
SMTP_HOST=localhost
SMTP_PORT=1025
EMAIL_FROM=Calendly <noreply@example.com>

# Optional — Google Calendar
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=
GOOGLE_REFRESH_TOKEN=
GOOGLE_CALENDAR_ID=primary
```

### Steps

```bash
# Install
npm install

# Database
npm run prisma:all   # format, migrate, generate

# Infrastructure
docker compose up -d   # Temporal (7233), Temporal UI (8080), MailHog (1025/8025)

# App + worker (two terminals)
npm run dev
npm run dev:worker

# Google OAuth setup (prints consent URL)
npm run google:setup
# Visit URL → authorize → hit callback → copy refresh token to .env
```

### Typical demo flow

1. `POST /api/users` — create host
2. `POST /api/event-types` with `x-user-id` — creates event type, triggers slot generation
3. Wait for worker / check `slots` table in Prisma Studio (`npm run prisma:studio`)
4. `GET /api/public/users/:id/event-types/:slug` — public view
5. `POST /api/bookings` with `slotId` — book; worker sends email + optional calendar event

---

## Key Files for Deep-Dive Interviews

| Topic | Read these first |
|-------|------------------|
| Booking + transactions | `src/services/booking.service.ts`, `src/repositories/slot.repository.ts` |
| Slot algorithm | `src/services/slot-generation.service.ts`, `src/services/slot.services.ts` |
| Temporal | `src/temporal/client.ts`, `src/temporal/activities/index.ts` |
| Schema | `prisma/schema.prisma` |
| OAuth | `src/services/google-calender.service.ts` |
| Load tests | `k6/01_get_public_event_type.js`, `k6/02_concurrent_book_slot.js` |

---

## License

ISC
