# AgriSmart

A web application for smallholder bean farmers in East Africa, providing weather forecasts, planting guidance, pest identification, and farm finance tracking.

- **Frontend** — [agrismart-seven.vercel.app](https://agrismart-seven.vercel.app)
- **Backend API** — [agrismart-4fcn.onrender.com](https://agrismart-4fcn.onrender.com)

---

## What It Does

AgriSmart is a mobile-optimised web app for farmers. After signing in, the app presents five sections:

| Tab | What it does |
|-----|-------------|
| Weather | 5-day forecast based on the farmer's location |
| Planting | Planting calendar with season and crop guidance |
| Watering | Smart watering recommendations based on weather |
| Pests | Pest and disease identification guide |
| Finance | Record income and expenses; stored locally in the browser |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, Tailwind CSS, Zustand |
| Backend | Node.js, Express, TypeScript, Prisma ORM |
| Database | PostgreSQL 15 |
| Auth | JWT (access + refresh tokens), bcryptjs |
| Hosting | Vercel (frontend), Render (backend) |

---

## Project Structure

```
AgriSmart/
├── backend/                    # Node.js + TypeScript REST API
│   ├── prisma/
│   │   └── schema.prisma       # Database schema
│   ├── src/
│   │   ├── controllers/        # Request handlers
│   │   ├── routes/             # Express route definitions
│   │   ├── services/           # Business logic
│   │   ├── middleware/         # Auth, rate limit, audit, error handling
│   │   └── server.ts           # Entry point
│   ├── tests/                  # Jest + supertest test suites
│   ├── Dockerfile
│   └── package.json
├── web/                        # React + Vite frontend (farmers)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── FarmerAuthPage.tsx   # Login / sign-up
│   │   │   ├── WeatherPage.tsx      # Weather forecast
│   │   │   ├── PlantingPage.tsx     # Planting calendar
│   │   │   ├── WateringPage.tsx     # Watering guidance
│   │   │   ├── PestsPage.tsx        # Pest guide
│   │   │   └── FinancePage.tsx      # Income & expense tracker
│   │   ├── store/              # Zustand auth store (persisted to localStorage)
│   │   ├── services/
│   │   │   ├── api.ts          # Axios client — points to Render backend
│   │   │   └── weatherApi.ts   # Weather API + local cache
│   │   └── App.tsx             # Root component with bottom tab navigation
│   └── package.json
├── nginx/                      # Nginx reverse proxy config (Docker)
├── docker-compose.yml
└── README.md
```

---

## Local Development

### Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 20+ |
| npm | 10+ |
| PostgreSQL | 15 |

### 1. Clone the repository

```bash
git clone <repo-url>
cd AgriSmart
```

### 2. Configure the backend

Create `backend/.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/agrismart"
JWT_SECRET="your-secret-key-min-32-chars"
JWT_REFRESH_SECRET="your-refresh-secret-min-32-chars"
ENCRYPTION_KEY="32-char-hex-key-for-aes-256-cbc"
NODE_ENV="development"
PORT=3000
```

### 3. Start the backend

```bash
cd backend
npm install
npx prisma migrate dev --name init
npx prisma generate
npm run dev
# API runs at http://localhost:3000
```

### 4. Start the frontend

```bash
cd web
npm install
npm run dev
# Opens at http://localhost:5173
```

By default the frontend points to the Render backend. To use your local backend instead, set `VITE_API_URL=http://localhost:3000/api` in `web/.env.local`.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Access token signing secret (min 32 chars) |
| `JWT_REFRESH_SECRET` | Yes | Refresh token signing secret (min 32 chars) |
| `ENCRYPTION_KEY` | Yes | 32-byte hex key for AES-256-CBC encryption |
| `NODE_ENV` | No | `development` or `production` |
| `PORT` | No | Server port (default: `3000`) |

### Frontend (`web/.env.local`)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Override the backend URL (defaults to Render) |

---

## API Endpoints

### Auth — `/api/auth`

| Method | Path | Description |
|--------|------|-------------|
| POST | `/register` | Register a new farmer account |
| POST | `/login` | Login, returns access + refresh tokens |
| POST | `/refresh` | Rotate refresh token |
| POST | `/logout` | Revoke refresh token |

---

## Testing

```bash
cd backend
npm test                  # Run all tests
npm run test:coverage     # With coverage report
```

---

## Deployment

### Frontend — Vercel

1. Connect the repository to Vercel
2. Set the root directory to `web`
3. Add `VITE_API_URL` pointing to your Render backend if needed
4. Deploy

### Backend — Render

1. Connect the repository to Render as a Web Service
2. Set the root directory to `backend`
3. Set the build command: `npm install && npx prisma generate && npm run build`
4. Set the start command: `npm start`
5. Add all environment variables from `backend/.env`

---

## Security

| Measure | Detail |
|---------|--------|
| Password hashing | bcryptjs, salt rounds: 12 |
| JWT access tokens | Expire in 24 hours |
| JWT refresh tokens | Expire in 7 days, rotated on each use |
| Rate limiting | 100 requests / 15 min per IP |
| Audit logging | Mutating requests logged asynchronously |

---

## License

MIT
