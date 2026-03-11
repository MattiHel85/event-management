# Event Management

A modern event planning dashboard built with Next.js and TypeScript.

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

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Recharts
- Mongoose 

## Current Data Mode

The app currently uses mock data for UI development.

MongoDB integration points are already scaffolded and marked with TODO comments, so you can switch to database persistence when ready.

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Run development server

```bash
npm run dev
```

Open http://localhost:3000

### 3. Build for production

```bash
npm run build
```

## Project Routes

- / : Landing page
- /events : Events list
- /events/new : Create event
- /events/[id] : Event details + edit
- /events/[id]/budget : Event-specific budget dashboard
- /budget : Global budget view (legacy dashboard page)

## API Routes

- /api/events
- /api/events/[id]
- /api/events/[id]/budget

## Notes

- Budget currency is selected on the event form and carried through event budget displays.
- Event budget items are currently added via API route and maintained in client state for preview mode.

## Next Steps

- Enable full MongoDB persistence for events and budget items
- Add authentication flow (sign-in/sign-up)
- Add guest list management with RSVP tracking
- Add role-based permissions (admin, organizer, viewer)
