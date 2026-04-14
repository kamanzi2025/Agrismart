# AgriSmart

A mobile-optimised web application that helps smallholder bean farmers in East Africa grow better crops. Farmers sign in and get a personalised dashboard with live weather data, planting recommendations, watering schedules, pest identification, and a local finance tracker — all in one place.

| | |
|---|---|
| **Live app** | [agrismart-seven.vercel.app](https://agrismart-seven.vercel.app) |
| **Backend API** | [agrismart-4fcn.onrender.com](https://agrismart-4fcn.onrender.com) |
| **Frontend hosting** | Vercel |
| **Backend hosting** | Render (Node — Free tier) |

---

## Table of Contents

1. [What the app does](#what-the-app-does)
2. [Architecture](#architecture)
3. [How each feature works](#how-each-feature-works)
4. [Tech stack](#tech-stack)
5. [Database schema](#database-schema)
6. [API reference](#api-reference)
7. [Project structure](#project-structure)
8. [Local development](#local-development)
9. [Environment variables](#environment-variables)
10. [Testing](#testing)
11. [Deployment](#deployment)
12. [Security](#security)

---

## What the app does

After a farmer signs up and logs in, the app shows five tabs:

| Tab | Description |
|-----|-------------|
| **Weather** | 5-day forecast for any location, powered by Open-Meteo (free, no API key needed). Results cached on the backend for 30 minutes and in the browser between sessions. |
| **Planting** | Uses the live weather data to tell the farmer whether current conditions are good, not ideal, or poor for planting beans — with a specific reason and the agronomic thresholds used. Also shows Rwanda's two bean seasons (Season A: Feb–Apr, Season B: Aug–Oct). |
| **Watering** | Farmer selects their current growth stage (Germination → Vegetative → Flowering → Pod Fill → Maturity). The app calculates how much water the crop needs that day, compares it with forecast rainfall, and gives a plain-language recommendation. |
| **Pests** | A built-in library of the most common bean pests and diseases (aphids, stem maggot, whitefly, angular leaf spot, rust, etc.) with symptoms, treatment steps, and prevention tips for each. Searchable and filterable by type and severity. |
| **Finance** | Farmers record income (crops sold, livestock, other) and expenses (seeds, fertiliser, labour, equipment, transport). Totals and category breakdowns are shown instantly. Data is saved in the browser's `localStorage` — no server round-trip needed. |

---

## Architecture

```
┌──────────────────────────────────────────────┐
│            Farmer's Browser / Phone           │
│                                               │
│   React 19 + Vite SPA (Vercel)               │
│   ┌──────────────────────────────────────┐   │
│   │  FarmerAuthPage  (login / sign-up)   │   │
│   └──────────────────────────────────────┘   │
│   ┌──────────────────────────────────────┐   │
│   │  FarmerApp  (5-tab shell)            │   │
│   │  WeatherPage   PlantingPage          │   │
│   │  WateringPage  PestsPage             │   │
│   │  FinancePage (localStorage only)     │   │
│   └──────────────────────────────────────┘   │
│                                               │
│   Zustand authStore → persisted in           │
│   localStorage (access + refresh tokens)     │
└──────────────┬───────────────────────────────┘
               │ HTTPS  (Axios + JWT Bearer)
               ▼
┌──────────────────────────────────────────────┐
│        Node.js + Express API  (Render)        │
│                                               │
│  Middleware chain (every request):            │
│   rateLimiter → auditLogger → route handler  │
│   → ownershipGuard → errorHandler            │
│                                               │
│  Routes exposed to the farmer app:            │
│   POST /api/auth/register                     │
│   POST /api/auth/login                        │
│   POST /api/auth/refresh                      │
│   POST /api/auth/logout                       │
│   GET  /api/weather?loc=<location>            │
│                                               │
│  Additional routes (schema-complete):         │
│   /api/advisory  /api/pest  /api/finance      │
│   /api/sync  /api/notifications               │
│   /api/officer  /api/cooperative  /api/admin  │
└──────────────┬───────────────────────────────┘
               │ Prisma ORM
               ▼
┌──────────────────────────────────────────────┐
│           PostgreSQL 15  (Render)             │
│                                               │
│  Tables: users, farmers, cooperatives,        │
│  advisories, pest_reports, financial_records, │
│  planting_calendars, audit_logs               │
└──────────────────────────────────────────────┘

           External services
┌──────────────────────────────────────────────┐
│  Open-Meteo Geocoding API  (geocode by name)  │
│  Open-Meteo Forecast API   (weather data)     │
│  No API key required — completely free        │
└──────────────────────────────────────────────┘
```

### Request lifecycle

1. The browser sends every request with `Authorization: Bearer <accessToken>`.
2. If the backend returns `401`, the Axios interceptor automatically calls `/api/auth/refresh` with the stored refresh token, updates `localStorage`, retries the original request, and is transparent to the user.
3. If refresh also fails (token expired or revoked), the user is redirected to the login page.

### Weather data flow

1. Frontend calls `GET /api/weather?loc=Musanze`.
2. Backend checks an in-memory cache (30-minute TTL keyed by lowercase location string).
3. On miss: geocodes the location name using Open-Meteo's geocoding API, then fetches a 5-day daily forecast (temperature max, precipitation sum, humidity, WMO weather code).
4. Raw WMO codes are mapped to one of four human-readable conditions: `sunny / cloudy / rain / heavy rain`.
5. Averages for temperature, rainfall, and humidity are computed and returned alongside the daily breakdown.
6. Frontend caches the response in `localStorage` under `agrismart_weather` so it survives a page refresh.

---

## How each feature works

### Authentication

- On sign-up the farmer provides name, phone number, password (min 6 chars), and region.
- The backend hashes the password with bcryptjs (12 salt rounds), creates a `User` record with `role: FARMER`, and also creates a linked `Farmer` record.
- Login returns a short-lived **access token** (24 h) and a long-lived **refresh token** (7 d).
- Both tokens are persisted to `localStorage` via Zustand's `persist` middleware.

### Planting advisor

- Reads the weather averages (`avgTemp`, `avgRainfall`) from the shared weather state.
- Compares them against hard-coded bean agronomic thresholds:
  - Temperature: 16 °C – 27 °C
  - Rainfall: 10 mm/day – 35 mm/day
- Returns one of three ratings: **Good (plant now)**, **Not ideal** (with specific reason), or **Wait**.
- Also displays Rwanda's two planting seasons and a reference table of thresholds.

### Smart watering

- Farmer selects their current growth stage from a dropdown (5 stages, each with a target daily water need in mm).
- The daily water need is compared against the 5-day forecast rainfall average.
- Output: how many mm of irrigation are needed today, and plain-language tips per stage.

### Pest library

- The pest data is bundled directly in the frontend (`PestsPage.tsx`) — no API call needed.
- Covers fungal, viral, bacterial, and insect threats.
- Each entry includes: name, type, severity, weather conditions that favour the pest, symptoms, treatment steps, and prevention tips.
- Filterable by pest type (Fungal / Viral / Insect / All) and searchable by name.

### Finance tracker

- All data written to `localStorage` key `agrismart_finance` — works fully offline.
- Two entry types: **Income** (Crops sold, Livestock, Other) and **Expense** (Seeds, Fertiliser, Labour, Equipment, Transport, Other).
- Dashboard shows net balance, total income, total expenses, and a per-category breakdown.
- Entries can be deleted. No sync to the backend (intentionally client-side only).

---

## Tech stack

### Frontend

| Library | Purpose |
|---------|---------|
| React 19 | UI framework |
| Vite 8 | Build tool and dev server |
| Tailwind CSS 3 | Utility-first styling |
| Zustand 5 | Global state (auth) with localStorage persistence |
| Axios | HTTP client with JWT interceptor and auto-refresh |
| React Router DOM 6 | Client-side routing |
| Recharts | Charts (used in finance summary) |
| Lucide React | Icons |

### Backend

| Library | Purpose |
|---------|---------|
| Express 4 | HTTP framework |
| TypeScript | Type safety |
| Prisma 5 | ORM and migrations |
| bcryptjs | Password hashing |
| jsonwebtoken | JWT sign and verify |
| zod | Request body validation |
| helmet | Security HTTP headers |
| cors | Cross-origin resource sharing |
| compression | Gzip responses |
| express-rate-limit | Rate limiting |
| winston | Structured logging |
| node-fetch | Outbound HTTP (Open-Meteo) |
| multer | File upload (pest images) |

### Infrastructure

| | |
|---|---|
| Frontend | Vercel (static SPA, CDN edge) |
| Backend | Render Web Service (Node 20, Free tier) |
| Database | PostgreSQL 15 (Render managed database) |
| Weather data | Open-Meteo (free, no key) |

---

## Database schema

The database has 8 models. The farmer-facing app currently uses `User`, `Farmer`, and indirectly `AuditLog`. The remaining models are fully defined and ready for future features.

```
User (users)
  id           UUID PK
  name         String
  phone        String UNIQUE
  passwordHash String
  role         Enum: FARMER | EXTENSION_OFFICER | COOPERATIVE_LEADER | ADMIN
  location     JSON  { lat, lng, region }
  language     Enum: EN | RW  (default EN)
  isActive     Boolean
  createdAt / updatedAt

Farmer (farmers)                           ← 1-to-1 with User (FARMER role)
  userId            UUID PK → users.id
  farmSize          Float (hectares)
  soilType          String?
  cooperativeId     UUID? → cooperatives.id
  assignedOfficerId UUID? → users.id

Cooperative (cooperatives)
  id        UUID PK
  name      String
  region    String
  leaderId  UUID → users.id

Advisory (advisories)
  id            UUID PK
  farmerId      UUID → farmers.userId
  officerId     UUID? → users.id
  type          Enum: PLANTING | PEST | SOIL | GENERAL
  content       String
  isAutomated   Boolean
  isRead        Boolean
  dateGenerated DateTime

PestReport (pest_reports)
  id                  UUID PK
  farmerId            UUID → farmers.userId
  imagePath           String
  diagnosis           String?
  recommendation      String?
  status              Enum: PENDING | ANALYZED | RESOLVED
  analyzedByOfficerId UUID? → users.id
  createdAt           DateTime

FinancialRecord (financial_records)
  id          UUID PK
  farmerId    UUID → farmers.userId
  type        Enum: EXPENSE | REVENUE
  category    String
  amount      Decimal(12,2)   ← stored encrypted with AES-256-CBC
  description String?         ← stored encrypted
  date        DateTime
  season      String          e.g. "Season A 2025"
  clientUUID  String UNIQUE   (offline sync deduplication key)
  createdAt   DateTime

PlantingCalendar (planting_calendars)
  id        UUID PK
  region    String
  season    String
  startDate DateTime
  endDate   DateTime
  notes     String?
  UNIQUE(region, season)

AuditLog (audit_logs)
  id           UUID PK
  userId       UUID → users.id
  action       String
  resourceType String
  resourceId   String
  timestamp    DateTime
  metadata     JSON?
```

---

## API reference

All endpoints return JSON in the shape `{ success: true, data: {...} }` on success or `{ success: false, error: { code, message } }` on failure.

### Auth — `/api/auth`

| Method | Path | Rate limit | Auth | Description |
|--------|------|-----------|------|-------------|
| POST | `/register` | 10/15 min | — | Create account. Body: `{ name, phone, password, role, location: {lat, lng, region}, farmSize? }` |
| POST | `/login` | 10/15 min | — | Returns `{ user, accessToken, refreshToken }` |
| POST | `/refresh` | 10/15 min | — | Body: `{ refreshToken }`. Returns a new token pair. |
| POST | `/logout` | 10/15 min | — | Body: `{ refreshToken }`. Revokes the refresh token. |

### Weather — `/api/weather`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/?loc=<name>` | — | Returns 5-day forecast + averages. Cached 30 min server-side. |

Response shape:
```json
{
  "location": "Musanze",
  "days": [
    { "date": "2026-04-14", "dayName": "Tue", "tempHigh": 22, "rainfall": 8,
      "humidity": 74, "condition": "rain", "icon": "🌧️" }
  ],
  "avgTemp": 21,
  "avgRainfall": 6,
  "avgHumidity": 70,
  "fetchedAt": "2026-04-14T08:00:00.000Z"
}
```

### Health check

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Returns `{ status: "ok", timestamp }`. Used by Render for health monitoring. |

---

## Project structure

```
AgriSmart/
├── backend/                        # Node.js + TypeScript REST API
│   ├── prisma/
│   │   └── schema.prisma           # Full database schema (8 models)
│   ├── src/
│   │   ├── server.ts               # Entry point — connects DB then starts server
│   │   ├── app.ts                  # Express app setup: middleware + route mounting
│   │   ├── controllers/            # One file per resource (auth, weather, pest, etc.)
│   │   ├── routes/                 # Express Router files — thin, delegate to controllers
│   │   ├── services/               # Business logic decoupled from HTTP layer
│   │   ├── middleware/
│   │   │   ├── authenticateJWT.ts  # Verifies Bearer token, attaches req.user
│   │   │   ├── authorizeRole.ts    # Role-based access control guard
│   │   │   ├── auditLogger.ts      # Non-blocking AuditLog write on mutating requests
│   │   │   ├── ownershipGuard.ts   # Prevents cross-user data access
│   │   │   ├── rateLimiter.ts      # Global (100/15 min) + auth (10/15 min) limiters
│   │   │   ├── validate.ts         # Zod schema validation middleware
│   │   │   └── errorHandler.ts     # Centralised error response formatter
│   │   ├── utils/
│   │   │   ├── jwt.ts              # signAccessToken / signRefreshToken / verify / revoke
│   │   │   ├── encryption.ts       # AES-256-CBC encrypt / decrypt helpers
│   │   │   ├── fileUpload.ts       # Multer config for pest image uploads
│   │   │   └── prisma.ts           # Singleton PrismaClient
│   │   ├── data/
│   │   │   └── pest-library.json   # 20 common bean pests (used by pest controller)
│   │   └── types/                  # Shared TypeScript interfaces (AuthUser, etc.)
│   ├── tests/
│   │   ├── advisory.service.test.ts
│   │   ├── financial.service.test.ts
│   │   ├── auth.middleware.test.ts
│   │   ├── sync.controller.test.ts
│   │   ├── pest.routes.test.ts
│   │   └── cooperative.service.test.ts
│   ├── uploads/pest-images/        # Uploaded pest photos (gitignored)
│   ├── Dockerfile                  # Multi-stage: builder (tsc) → lean runtime
│   └── package.json
│
├── web/                            # React + Vite SPA (farmers)
│   ├── src/
│   │   ├── App.tsx                 # Root: shows FarmerAuthPage or FarmerApp (5-tab shell)
│   │   ├── pages/
│   │   │   ├── FarmerAuthPage.tsx  # Login / sign-up with password strength indicator
│   │   │   ├── WeatherPage.tsx     # Location search, 5-day forecast cards, stale-cache banner
│   │   │   ├── PlantingPage.tsx    # Good/Not Ideal/Wait rating based on weather averages
│   │   │   ├── WateringPage.tsx    # Growth stage selector + irrigation recommendation
│   │   │   ├── PestsPage.tsx       # Searchable/filterable pest library (data bundled in-file)
│   │   │   └── FinancePage.tsx     # Income/expense tracker — localStorage only
│   │   ├── store/
│   │   │   └── authStore.ts        # Zustand store persisted to localStorage (auth-storage)
│   │   ├── services/
│   │   │   ├── api.ts              # Axios instance — points to Render; JWT interceptor + auto-refresh
│   │   │   └── weatherApi.ts       # fetchWeather() + localStorage cache helpers
│   │   └── types/                  # TypeScript interfaces shared across components
│   ├── index.html
│   ├── vite.config.ts              # Dev proxy: /api → http://localhost:3000
│   ├── tailwind.config.js
│   └── package.json
│
├── mobile/                         # Expo React Native app (farmers — separate codebase)
│   └── ...                         # Not deployed; mirrors web features for native mobile
│
├── nginx/                          # Reverse proxy config (for Docker / self-hosted)
│   ├── nginx.conf
│   └── Dockerfile
│
├── docker-compose.yml              # Local: postgres + backend + nginx in one command
└── README.md
```

---

## Local development — complete setup guide

Follow every step in order. Do not skip steps.

---

### Step 1 — Install the required tools

You need three tools installed on your machine before anything else.

**Node.js 20+**

Download and install from [nodejs.org](https://nodejs.org). Choose the LTS version.

Verify it installed correctly:
```bash
node --version   # should print v20.x.x or higher
npm --version    # should print 10.x.x or higher
```

**PostgreSQL 15**

- **macOS:** `brew install postgresql@15` then `brew services start postgresql@15`
- **Windows:** Download the installer from [postgresql.org/download/windows](https://www.postgresql.org/download/windows/) and run it. Keep the default port (5432) and remember the password you set for the `postgres` user.
- **Ubuntu/Debian:** `sudo apt install postgresql-15 && sudo service postgresql start`

Verify it is running:
```bash
psql --version   # should print psql (PostgreSQL) 15.x
```

**Git**

```bash
git --version    # should print git version 2.x.x or higher
```

If Git is not installed: [git-scm.com/downloads](https://git-scm.com/downloads)

---

### Step 2 — Clone the repository

```bash
git clone https://github.com/kamanzi2025/Agrismart.git
cd AgriSmart
```

You should now see these folders inside:
```
backend/   mobile/   nginx/   web/   docker-compose.yml
```

---

### Step 3 — Create the database

Open a PostgreSQL prompt:

```bash
# macOS / Linux
psql -U postgres

# Windows (run in Command Prompt as Administrator)
psql -U postgres
```

Inside the PostgreSQL prompt, run:

```sql
CREATE DATABASE agrismart;
\q
```

The `\q` exits the prompt. The database is now ready.

---

### Step 4 — Configure the backend environment

The backend reads all secrets and connection details from a `.env` file. You must create this file — it is not included in the repository.

```bash
cd backend
```

Create a new file called `.env` inside the `backend/` folder and paste the following, replacing every placeholder with real values:

```env
# PostgreSQL connection string
# Replace 'postgres' (second one) with your actual postgres user password if you set one
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/agrismart"

# JWT secrets — these can be any random string, but must be at least 32 characters long
# Use different values for each one
JWT_SECRET="any-long-random-string-at-least-32-chars-abc123"
JWT_REFRESH_SECRET="a-different-long-random-string-at-least-32-chars"

# AES-256-CBC encryption key for financial data
# Must be exactly 64 hexadecimal characters (represents 32 bytes)
# Generate one by running: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ENCRYPTION_KEY="a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2"

# Leave these as-is for local development
NODE_ENV="development"
PORT=3000
CORS_ORIGIN="http://localhost:5173"
```

**How to generate a proper `ENCRYPTION_KEY`:**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output (64 hex characters) and paste it as the value of `ENCRYPTION_KEY`.

---

### Step 5 — Install backend dependencies

Still inside the `backend/` folder:

```bash
npm install
```

This installs all packages listed in `package.json`. It will take a minute or two.

---

### Step 6 — Set up the database tables

Prisma reads your `schema.prisma` file and creates all the tables in the database.

```bash
npx prisma migrate dev --name init
```

You should see output like:
```
Applying migration `20240101000000_init`
Your database is now in sync with your schema.
```

Then generate the Prisma client (TypeScript types for the database):

```bash
npx prisma generate
```

**Verify the tables were created** (optional but recommended):

```bash
psql -U postgres -d agrismart -c "\dt"
```

You should see tables: `users`, `farmers`, `cooperatives`, `advisories`, `pest_reports`, `financial_records`, `planting_calendars`, `audit_logs`.

---

### Step 7 — Start the backend server

```bash
npm run dev
```

Expected output:
```
[DB] Connected to PostgreSQL
[Server] AgriSmart API running on port 3000 (development)
```

**Test that it is working:**

Open a new terminal and run:
```bash
curl http://localhost:3000/health
```

You should get back:
```json
{ "success": true, "data": { "status": "ok", "timestamp": "..." } }
```

Leave this terminal running. Open a new terminal for the next steps.

---

### Step 8 — Configure the frontend

The frontend needs to know which backend to talk to during development.

```bash
cd web
```

Create a file called `.env.local` inside the `web/` folder:

```env
VITE_API_URL=http://localhost:3000/api
```

This tells the frontend to use your local backend instead of the deployed Render server.

---

### Step 9 — Install frontend dependencies

```bash
npm install
```

---

### Step 10 — Start the frontend

```bash
npm run dev
```

Expected output:
```
  VITE v8.x.x  ready in 300 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

You should see the AgriSmart login screen with the green header.

---

### Step 11 — Create an account and test

1. Click **Create Account** on the login screen.
2. Fill in your name, a phone number (e.g. `+250700000001`), choose a region, and set a password (min 6 characters).
3. Click **Create Account** — you will be logged in automatically.
4. The five tabs (Weather, Planting, Watering, Pests, Finance) will appear.
5. On the **Weather** tab, type a location (e.g. `Kigali` or `Musanze`) and press Enter to fetch a forecast.

If the weather loads, the full stack is working end-to-end.

---

### Troubleshooting

**`ECONNREFUSED` or "Cannot connect to database"**
The PostgreSQL service is not running. Start it:
- macOS: `brew services start postgresql@15`
- Ubuntu: `sudo service postgresql start`
- Windows: Open Services → find PostgreSQL → Start

**`password authentication failed for user "postgres"`**
Your postgres password is different from what is in `DATABASE_URL`. Edit `backend/.env` and update the password in the connection string:
```
postgresql://postgres:YOUR_ACTUAL_PASSWORD@localhost:5432/agrismart
```

**`database "agrismart" does not exist`**
You skipped Step 3. Run `psql -U postgres -c "CREATE DATABASE agrismart;"`.

**`JWT_SECRET environment variable is not set`**
The `backend/.env` file is missing or in the wrong folder. It must be at `AgriSmart/backend/.env`, not at the root.

**`P1001: Can't reach database server`**
Prisma cannot find PostgreSQL. Confirm PostgreSQL is running and the `DATABASE_URL` in `.env` is correct.

**Frontend shows a blank page or fails to load**
Open the browser developer console (F12 → Console tab). If you see a network error to `localhost:3000`, the backend server from Step 7 has stopped. Restart it with `npm run dev` inside the `backend/` folder.

**Port 3000 is already in use**
Another process is using port 3000. Change the port in `backend/.env` to `PORT=3001`, then update `web/.env.local` to `VITE_API_URL=http://localhost:3001/api`.

---

### Optional — Docker (runs everything with one command)

If you have Docker and Docker Compose installed, you can skip Steps 3–7 and run the database and backend together:

```bash
# From the AgriSmart/ root folder
docker-compose up --build
```

Then run migrations inside the container:

```bash
docker-compose exec backend npx prisma migrate deploy
```

The API will be available at `http://localhost/api`.

You still need to run the frontend separately (Steps 8–10).

---

## Environment variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Signs access tokens (min 32 chars) |
| `JWT_REFRESH_SECRET` | Yes | Signs refresh tokens (min 32 chars, different from above) |
| `ENCRYPTION_KEY` | Yes | 64 hex-char (32-byte) key for AES-256-CBC — used to encrypt financial amounts |
| `CORS_ORIGIN` | No | Restrict CORS to a specific origin (default: `*`) |
| `NODE_ENV` | No | `development` enables Prisma query logs. Default: `development` |
| `PORT` | No | Server port. Default: `3000` |

### Frontend (`web/.env.local`)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Override the backend base URL. Defaults to the Render URL in production, `/api` proxy in dev. |

---

## Testing

Tests live in `backend/tests/` and use **Jest** with **supertest** for integration tests.

```bash
cd backend
npm test                  # run all test suites
npm run test:coverage     # run with Istanbul coverage report (target ≥ 80%)
```

| Test file | What it covers |
|-----------|---------------|
| `auth.middleware.test.ts` | JWT verification, role guard, invalid/expired tokens |
| `advisory.service.test.ts` | Advisory CRUD, pagination, filtering by type |
| `financial.service.test.ts` | AES-256-CBC encrypt/decrypt, aggregation by category |
| `pest.routes.test.ts` | Pest report submission, image upload, status update (supertest) |
| `sync.controller.test.ts` | Batch upsert idempotency via `clientUUID` |
| `cooperative.service.test.ts` | Seasonal report generation, member aggregation |

---

## Deployment

### Frontend — Vercel

The `web/` directory is a standard Vite SPA. Vercel detects it automatically.

1. Connect the repository in Vercel and set the **root directory** to `web`.
2. Vercel runs `npm run build` and serves the `dist/` folder.
3. No `VITE_API_URL` env var is needed — the production default in `api.ts` already points to the Render backend.
4. Every push to `main` triggers a new deployment.

Current deployment: [agrismart-seven.vercel.app](https://agrismart-seven.vercel.app)

### Backend — Render

The backend is deployed as a **Node Web Service** on Render (Free tier).

| Setting | Value |
|---------|-------|
| Root directory | `backend` |
| Build command | `npm install && npx prisma generate && npm run build` |
| Start command | `npm start` (runs `node dist/server.js`) |
| Health check path | `/health` |

Required environment variables (set in Render's dashboard):
`DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `ENCRYPTION_KEY`, `NODE_ENV=production`, `CORS_ORIGIN`

After deploy, run migrations once:
```bash
# In Render Shell tab
npx prisma migrate deploy
```

Current endpoint: [agrismart-4fcn.onrender.com](https://agrismart-4fcn.onrender.com)

> **Note:** The free Render tier spins down after 15 minutes of inactivity. The first request after a cold start may take 30–60 seconds.

---

## Security

| Measure | Detail |
|---------|--------|
| Password hashing | bcryptjs with 12 salt rounds |
| JWT access tokens | Signed with `JWT_SECRET`, expire in **24 hours** |
| JWT refresh tokens | Signed with `JWT_REFRESH_SECRET`, expire in **7 days**, rotated on every use, revoked on logout |
| Financial data | `amount` and `description` columns encrypted at rest with **AES-256-CBC** before writing to PostgreSQL |
| Auth rate limiting | 10 requests / 15 min per IP on `/api/auth/*` — protects against brute-force |
| Global rate limiting | 100 requests / 15 min per IP on all routes |
| Security headers | `helmet` sets `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`, etc. |
| Input validation | All request bodies validated with **Zod** schemas before reaching business logic |
| Ownership guard | Middleware verifies that a user can only access their own records |
| Audit logging | Every mutating request is written asynchronously to the `audit_logs` table |

---

## License

MIT

