# AgriSmart Advisor

A digital agricultural advisory platform for smallholder bean farmers in East Africa, connecting farmers with extension officers, cooperative leaders, and administrators.

---

## Overview

AgriSmart Advisor provides:

- **Farmers** (mobile app): offline-first planting advisories, pest diagnosis with photo upload, financial tracking (expenses & sales), soil management guides
- **Extension Officers** (web portal): manage farmers, diagnose pest reports, publish advisories, send SMS notifications
- **Cooperative Leaders** (web portal): view cooperative financial summaries, member performance, multi-season trends, generate reports
- **Admins** (web portal): user management, cooperative oversight, audit logs, platform-wide statistics

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                        Clients                           │
│  ┌─────────────────────┐   ┌────────────────────────┐   │
│  │  React Native App   │   │   React Web Portal     │   │
│  │  (Expo, Farmers)    │   │   (Officers/Leaders/   │   │
│  │  offline SQLite sync│   │    Admins, Vite+TW)    │   │
│  └──────────┬──────────┘   └───────────┬────────────┘   │
└─────────────┼──────────────────────────┼────────────────┘
              │ HTTP/HTTPS               │
              ▼                          ▼
┌─────────────────────────────────────────────────────────┐
│                   Nginx Reverse Proxy                   │
│       Rate limit: 100 req/min/IP  |  Port 80/443        │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│              Node.js + Express Backend                  │
│  TypeScript  |  JWT Auth  |  AES-256-CBC encryption     │
│  Middleware: rateLimiter → auditLogger → routes →       │
│              ownershipGuard → errorHandler              │
└───────────────────────┬─────────────────────────────────┘
                        │ Prisma ORM
                        ▼
┌─────────────────────────────────────────────────────────┐
│                  PostgreSQL 15                          │
│  8 models: User, Farmer, Cooperative, Advisory,         │
│  PestReport, FinancialRecord, Notification, AuditLog    │
└─────────────────────────────────────────────────────────┘
```

---

## User Types

| Role | Interface | Key Capabilities |
|------|-----------|-----------------|
| `FARMER` | Mobile app (Expo) | View advisories offline, report pests with photo, record expenses/sales, soil guidance |
| `EXTENSION_OFFICER` | Web portal | Manage assigned farmers, diagnose pest reports, publish advisories, send notifications |
| `COOPERATIVE_LEADER` | Web portal | View cooperative overview, member breakdown, seasonal trends, generate reports |
| `ADMIN` | Web portal | All data access, user management, cooperative management, audit log |

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 20+ |
| npm | 10+ |
| PostgreSQL | 15 |
| Docker + Docker Compose | 24+ |
| Expo CLI | latest |

---

## Project Structure

```
AgriSmart/
├── backend/                    # Node.js + TypeScript API
│   ├── prisma/
│   │   └── schema.prisma       # Database schema (8 models)
│   ├── src/
│   │   ├── controllers/        # Request handlers
│   │   ├── routes/             # Express route definitions
│   │   ├── services/           # Business logic
│   │   ├── middleware/         # Auth, rate limit, audit, error handling
│   │   ├── utils/              # JWT, encryption, file upload, Prisma client
│   │   └── server.ts           # Entry point
│   ├── tests/                  # Jest + supertest test suites
│   │   ├── advisory.service.test.ts
│   │   ├── financial.service.test.ts
│   │   ├── auth.middleware.test.ts
│   │   ├── sync.controller.test.ts
│   │   ├── pest.routes.test.ts
│   │   └── cooperative.service.test.ts
│   ├── data/
│   │   └── pest-library.json   # 20 common bean pests
│   ├── uploads/pest-images/    # Uploaded pest photos
│   ├── Dockerfile
│   └── package.json
├── mobile/                     # Expo React Native app (farmers)
│   ├── src/
│   │   ├── screens/            # 12 screens (Login, Home, Pest*, Finance*, etc.)
│   │   ├── navigation/         # Stack + bottom tab navigators
│   │   ├── store/              # Zustand (authStore, syncStore)
│   │   ├── services/           # Axios API client, SQLite DB, sync logic
│   │   ├── hooks/              # useNetworkStatus, useSync
│   │   └── i18n/               # en.json + rw.json (Kinyarwanda)
│   └── App.tsx
├── web/                        # React + Vite + Tailwind (officers/leaders/admins)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── officer/        # Dashboard, Farmers, PestReports, Advisories, Notifications
│   │   │   ├── leader/         # Overview, Members, Trends, Reports
│   │   │   └── admin/          # Dashboard, Users, Cooperatives, PestReports, Advisories, AuditLog
│   │   ├── components/layout/  # Sidebar, Header, Layout
│   │   ├── store/              # Zustand authStore (localStorage persist)
│   │   ├── services/           # Axios API client with JWT interceptor + refresh
│   │   └── types/              # TypeScript interfaces
│   └── package.json
├── nginx/
│   ├── nginx.conf              # Rate limiting, gzip, proxy config
│   └── Dockerfile
├── docker-compose.yml          # postgres + backend + nginx
└── README.md
```

---

## Setup

### 1. Clone and configure environment

```bash
git clone <repo-url>
cd AgriSmart
```

Create `backend/.env`:

```env
DATABASE_URL="postgresql://agrismart:agrismart@localhost:5432/agrismart"
JWT_SECRET="your-secret-key-min-32-chars"
JWT_REFRESH_SECRET="your-refresh-secret-min-32-chars"
ENCRYPTION_KEY="32-char-hex-key-for-aes-256-cbc"
AFRICASTALKING_API_KEY="your-at-api-key"
AFRICASTALKING_USERNAME="sandbox"
CORS_ORIGIN="http://localhost:5173"
NODE_ENV="development"
PORT=3000
```

### 2. Run with Docker (recommended)

```bash
docker-compose up --build
```

The API will be available at `http://localhost:80/api`.

### 3. Run locally (development)

**Backend:**
```bash
cd backend
npm install
npx prisma migrate dev --name init
npx prisma generate
npm run dev
```

**Web portal:**
```bash
cd web
npm install
npm run dev
# Opens at http://localhost:5173
```

**Mobile app:**
```bash
cd mobile
npm install
npx expo start
# Scan QR with Expo Go app, or press 'a' for Android emulator
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Access token signing secret (min 32 chars) |
| `JWT_REFRESH_SECRET` | Yes | Refresh token signing secret (min 32 chars) |
| `ENCRYPTION_KEY` | Yes | 32-byte hex key for AES-256-CBC financial data encryption |
| `AFRICASTALKING_API_KEY` | Yes | Africa's Talking SMS API key |
| `AFRICASTALKING_USERNAME` | Yes | Africa's Talking username (`sandbox` for testing) |
| `CORS_ORIGIN` | No | Allowed CORS origin (default: `*`) |
| `NODE_ENV` | No | `development` or `production` |
| `PORT` | No | Server port (default: `3000`) |

---

## API Endpoints

### Auth — `/api/auth`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/register` | — | Register new user (+ Farmer record if FARMER role) |
| POST | `/login` | — | Login, returns access + refresh tokens |
| POST | `/refresh` | — | Rotate refresh token, get new token pair |
| POST | `/logout` | — | Revoke refresh token |

### Advisory — `/api/advisory`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | Any | List advisories (paginated, filterable by crop/season/location) |
| POST | `/` | Officer/Admin | Create advisory |
| GET | `/:id` | Any | Get advisory by ID |
| PUT | `/:id` | Officer/Admin | Update advisory |
| DELETE | `/:id` | Admin | Delete advisory |

### Pest — `/api/pest`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/library` | Any | Get full pest library |
| GET | `/library/:id` | Any | Get single pest entry |
| POST | `/report` | Farmer | Submit pest report (multipart/form-data with image) |
| GET | `/reports` | Officer/Admin | List all pest reports |
| GET | `/report/:id` | Owner/Officer/Admin | Get pest report |
| PUT | `/report/:id/diagnose` | Officer/Admin | Update diagnosis, severity, officer notes |

### Finance — `/api/finance`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/record` | Farmer | Create financial record (encrypted amount + description) |
| GET | `/records` | Farmer (own) / Officer+Admin | List records |
| GET | `/summary` | Farmer/Officer/Admin | Aggregated totals + by-category breakdown |
| DELETE | `/record/:id` | Owner/Admin | Delete record |

### Sync — `/api/sync`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/batch` | Farmer | Batch upsert offline records (idempotent via clientUuid) |

### Notifications — `/api/notifications`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/sms` | Officer/Admin | Send SMS to a specific phone number |
| POST | `/broadcast` | Officer/Admin | Broadcast SMS to all users of a role |
| GET | `/` | Authenticated | List notifications for current user |

### Officer — `/api/officer`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/farmers` | Officer/Admin | List farmers (paginated, searchable) |
| GET | `/pest-reports` | Officer/Admin | List pest reports with farmer info |

### Cooperative — `/api/cooperative`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/overview` | Leader/Admin | Cooperative summary (members, financial, pest reports) |
| GET | `/trends` | Leader/Admin | Multi-season financial trends |
| GET | `/members` | Leader/Admin | Paginated member list |
| GET | `/report/:season` | Leader/Admin | Full season report (URL-encoded season name) |

### Admin — `/api/admin`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/stats` | Admin | Platform-wide statistics |
| GET | `/users` | Admin | List all users (paginated, filterable by role) |
| GET | `/cooperatives` | Admin | List all cooperatives |
| GET | `/audit-log` | Admin | Paginated audit log |

---

## Testing

```bash
cd backend
npm test                    # Run all tests
npm run test:coverage       # With coverage report (target: 80%)
```

Test files cover:
- `advisory.service.test.ts` — advisory CRUD + filtering
- `financial.service.test.ts` — AES encryption/decryption, aggregation
- `auth.middleware.test.ts` — JWT auth guard, role-based access
- `sync.controller.test.ts` — batch sync idempotency
- `pest.routes.test.ts` — integration tests via supertest
- `cooperative.service.test.ts` — report generation, aggregation

---

## Deployment

### Docker Compose (production)

```bash
# 1. Set production env vars in backend/.env
# 2. Build and start all services
docker-compose up -d --build

# 3. Run database migrations
docker-compose exec backend npx prisma migrate deploy
```

Services:
- `postgres` — PostgreSQL 15 with health check
- `backend` — Node.js API (port 3000, internal only)
- `nginx` — Reverse proxy on port 80 (exposes `/api/*` and `/health`)

### HTTPS (production)

After deploying, enable HTTPS via certbot:

```bash
certbot --nginx -d yourdomain.com
```

Then uncomment the HTTPS server block in `nginx/nginx.conf`.

---

## Offline Sync (Mobile)

The mobile app uses `expo-sqlite` for local storage:

1. **Write offline**: Financial records and pest reports are saved to SQLite with `synced = 0`
2. **Background sync**: Every 5 minutes (when online), pending records are pushed to `/api/sync/batch`
3. **Pull advisories**: Latest advisories are fetched and stored locally on each sync
4. **Idempotent**: Each offline record has a `clientUuid` — the backend uses `upsert` to prevent duplicates

---

## Localization

The mobile app supports English (`en`) and Kinyarwanda (`rw`). Users can toggle language from the Profile screen.

Translation files: `mobile/src/i18n/en.json` and `mobile/src/i18n/rw.json`

---

## Security

- Passwords hashed with **bcryptjs** (salt rounds: 12)
- Financial `amount` and `description` fields encrypted with **AES-256-CBC**
- JWT access tokens expire in **24 hours**; refresh tokens in **7 days** with rotation
- Rate limiting: **100 requests/15 min** per IP (Express) + **100 req/min** (Nginx)
- Ownership guards prevent cross-user data access
- All mutating requests logged to `AuditLog` asynchronously

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m "feat: your feature"`
4. Push and open a pull request

Please ensure `npm test` passes with ≥80% coverage before submitting.

---

## License

MIT
