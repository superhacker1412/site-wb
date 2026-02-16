# site-wb Full-Stack Setup

## Stack
- Frontend: `client` (Vite + React + TypeScript + shadcn/ui)
- Backend: `backend` (Express + TypeScript + Prisma + PostgreSQL)
- DB: PostgreSQL

## 1) Backend
```powershell
cd backend
Copy-Item .env.example .env
npm install
npm run prisma:generate
npx prisma migrate dev
npm run prisma:seed
npm run dev
```

Backend URLs:
- API: `http://localhost:4000/api/v1`

## 2) Frontend
```powershell
cd client
Copy-Item .env.example .env
npm install
npm run dev
```

Frontend URL:
- App: `http://localhost:8080`

## Seeded admin user
Configured via `backend/.env`:
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `ADMIN_NAME`

## Production (1 VPS + nginx)
Use `backend/nginx.sample.conf` as a starting point:
- static frontend from `client/dist`
- reverse proxy `/api/` and `/uploads/` to backend
