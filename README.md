# Event Management

A modern event planning dashboard with a Vite + React frontend and an Express + Prisma backend.

Create events, set capacity, and manage per-event budgets with multi-currency support.

## Features

- Event CRUD flow (create, list, view, edit, delete)
- Per-event budget page with:
- KPI cards (total budget, spent, remaining)
- Budget line items by category
- Spend breakdown chart
- Multi-currency support:
- USD (US Dollar)
- CAD (Canadian Dollar)
- AUD (Australian Dollar)
- GBP (British Pound)
- EUR (Euro)
- SEK, NOK, DKK, ISK
- Dashboard-style app layout

## Tech Stack

- React + Vite
- TypeScript
- Tailwind CSS
- Recharts
- Express
- Prisma ORM
- PostgreSQL

## Getting Started

### 1. Install dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure environment variables

Create these files:

- backend/.env
- frontend/.env

Required values:

- backend/.env

```env
DATABASE_URL="postgresql://..."
JWT_SECRET="your-secret"
CORS_ORIGIN="http://localhost:5173"
PORT="4000"
NODE_ENV="development"
```

- frontend/.env

```env
VITE_API_BASE_URL="http://localhost:4000"
```

### 3. Run Prisma migration

```bash
cd backend
npm run prisma:migrate
```

### 4. Run development servers

In terminal 1:

```bash
cd backend
npm run dev
```

In terminal 2:

```bash
cd frontend
npm run dev
```

Open http://localhost:5173

### 5. Build for production

```bash
cd backend && npm run build
cd ../frontend && npm run build
```

## Root Commands

You can also run common commands directly from the repository root:

```bash
npm run setup:github-project
npm run dev:backend
npm run dev:frontend
npm run build:backend
npm run build:frontend
```

Tip: run `dev:backend` and `dev:frontend` in separate terminals during local development.

## GitHub Project Setup

The repository includes [scripts/setup-github-project.js](c:\Users\matti\Desktop\GitProjektit\event-management\scripts\setup-github-project.js) to create roadmap labels and issues in GitHub.

Do not store a real personal access token in this repository, in the README, or in committed shell history.

Use a token with repository issue/label write access and provide it through an environment variable only at runtime.

Git Bash:

```bash
GITHUB_TOKEN="<your-github-token>" npm run setup:github-project
```

PowerShell:

```powershell
$env:GITHUB_TOKEN = "<your-github-token>"
npm run setup:github-project
```

Dry run:

```bash
DRY_RUN=true npm run setup:github-project
```

## Project Routes

- / : Landing page
- /events : Events list
- /events/new : Create event
- /events/:id : Event details + edit
- /events/:id/budget : Event-specific budget dashboard
- /budget : Global budget view (legacy dashboard page)
- /signin : Sign in page
- /signup : Sign up page
- /feature-request : Feature request page

## API Routes

- /api/auth/signup
- /api/auth/signin
- /api/auth/me
- /api/auth/logout
- /api/events
- /api/events/:id
- /api/events/:id/budget
- /api/feature-requests

## Notes

- Budget currency is selected on the event form and carried through event budget displays.
- Event and budget data are persisted with PostgreSQL through Prisma.

## Next Steps

- Phase 1: add Share Event action on event detail page
- Phase 1: add social share fallbacks (X, LinkedIn, Facebook, WhatsApp, Email)
- Phase 1: add Google Calendar `.ics` export
- Phase 1: add direct Google Calendar integration (OAuth)
- Build guest list management with RSVP tracking
- Add role-based permissions (admin, organizer, viewer)
