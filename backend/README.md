# Backend setup

1. Copy env:
   - `cp .env.example .env` (PowerShell: `Copy-Item .env.example .env`)
2. Install deps:
   - `npm install`
3. Generate Prisma client:
   - `npm run prisma:generate`
4. Run migrations:
   - `npm run prisma:migrate`
5. Seed admin + demo content:
   - `npm run prisma:seed`
6. Start dev server:
   - `npm run dev`

API base URL: `http://localhost:4000/api/v1`
