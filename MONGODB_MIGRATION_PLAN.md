# Postgres -> MongoDB Migration Plan (Semi-Manual)

This runbook is tailored to the current codebase and is ordered as requested: backend first, frontend second.

## 1. Scope and Migration Strategy

### Goal
Move persistence from PostgreSQL to MongoDB while keeping API routes and frontend behavior stable.

### Recommended approach for this repo
Use Prisma with MongoDB first (not Mongoose) to minimize code churn:
- You already use Prisma in backend routes.
- Most changes stay in `backend/prisma/schema.prisma` and migration/data scripts.
- Existing route handlers in `backend/src/routes/*.ts` can mostly remain the same.

### Constraints to keep in mind
- Prisma + MongoDB does not use Prisma Migrate the same way as SQL providers.
- MongoDB `_id` is `ObjectId`; API should continue returning string `_id` to frontend.
- Existing data must be copied from Postgres before cutover.

## 2. Pre-Migration Preparation (Backend)

1. Create a migration branch.
2. Freeze writes during final cutover window (or accept delta loss and do a second sync).
3. Back up Postgres data.
4. Provision MongoDB database + user + network access.
5. Add/prepare env var value for MongoDB connection string.

Files to update/check:
- `backend/.env` (replace `DATABASE_URL` with Mongo URI for target env)
- `backend/.env.example` (document Mongo URI format)

Suggested Mongo URI format:

```env
DATABASE_URL="mongodb+srv://<user>:<password>@<cluster>/<db>?retryWrites=true&w=majority"
```

## 3. Backend Phase A: Schema Conversion

### 3.1 Update Prisma datasource provider

File:
- `backend/prisma/schema.prisma`

Change:
- `datasource db { provider = "postgresql" }` -> `provider = "mongodb"`

### 3.2 Convert model IDs and relations for MongoDB

File:
- `backend/prisma/schema.prisma`

Required pattern (example):
- String IDs should become ObjectId-backed strings in Prisma:
  - `id String @id @default(auto()) @map("_id") @db.ObjectId`
- Relation foreign keys should also be ObjectId-backed strings:
  - `eventId String @db.ObjectId`

Apply to these models:
- `User`
- `Event`
- `BudgetItem`

Important: Keep API contract unchanged (frontend expects `_id` string), so continue mapping `id -> _id` in backend response mappers.

### 3.3 Optional field decisions

You already made `ticketUrl` optional in flow. Keep schema aligned:
- `ticketUrl String?`

## 4. Backend Phase B: Generate Client and Resolve Compile Issues

Run in `backend/`:

```bash
npm run prisma:generate
npm run build
```

Expected changes to verify:
- `backend/src/routes/events.ts`
- `backend/src/routes/auth.ts`

What to look for:
- Prisma error handling codes can differ from SQL assumptions.
- Unique constraint handling for user email still needs conflict behavior.
- `findUnique`, `update`, and `delete` calls should continue to work with ObjectId-backed string IDs.

## 5. Backend Phase C: Data Migration (Semi-Manual)

Use a one-time script approach to copy data from Postgres to MongoDB.

### 5.1 Create migration script(s)

Create folder/files:
- `backend/scripts/migrate-postgres-to-mongo.ts`
- optionally `backend/scripts/verify-migration.ts`

Script responsibilities:
1. Connect to Postgres source (using old Prisma client/schema or raw SQL client).
2. Read `User`, `Event`, and `BudgetItem` rows.
3. Insert into MongoDB in this order:
   1. Users
   2. Events
   3. BudgetItems
4. Preserve references:
   - Build map from old Postgres IDs -> new Mongo ObjectId strings if needed.
   - Write `BudgetItem.eventId` to mapped Mongo `Event.id`.
5. Add idempotency guard:
   - Upsert by natural key where possible (`User.email`), or record migration markers.

### 5.2 Validation checklist

After migration, run spot-checks:
- User count matches.
- Event count matches.
- Budget item count matches.
- Randomly verify 5 events have correct `budgetItems` and date fields.

### 5.3 Cutover step

1. Stop backend writes.
2. Run final delta migration (if needed).
3. Point `DATABASE_URL` to MongoDB.
4. Start backend.

## 6. Backend Phase D: Runtime Verification

Run backend:

```bash
npm run dev
```

Test endpoints manually (Postman/Insomnia/curl):
- `GET /health`
- `POST /api/auth/signup`
- `POST /api/auth/signin`
- `GET /api/auth/me`
- `POST /api/events`
- `GET /api/events`
- `PUT /api/events/:id`
- `POST /api/events/:id/budget`
- `DELETE /api/events/:id/budget/:itemId`

Files most likely to need tweaks:
- `backend/src/routes/auth.ts`
- `backend/src/routes/events.ts`
- `backend/src/lib/prisma.ts` (usually no logic changes, but verify imports/client usage)

## 7. Frontend Phase A: API Contract Verification

If backend keeps same JSON response shape, frontend changes are minimal.

Verify these assumptions still hold:
- Event has `_id` as string.
- Date still returned in `YYYY-MM-DD` format.
- `ticketUrl` may be empty string.
- Budget item shape unchanged.

Files to validate first:
- `frontend/src/lib/api/events.ts`
- `frontend/src/lib/models/Event.ts`
- `frontend/src/context/EventsContext.tsx`

If API shape changed, update mappers/types here before touching UI components.

## 8. Frontend Phase B: UI Verification and Adjustments

Run frontend:

```bash
npm run dev
```

Check flows in order:
1. Sign up / sign in / sign out
2. Create event (with and without `ticketUrl`)
3. Event list card rendering
4. Event detail and edit
5. Budget item add/delete

Files most likely affected only if API shape changes:
- `frontend/src/components/EventForm.tsx`
- `frontend/src/components/EventCard.tsx`
- `frontend/src/pages/EventDetailPage.tsx`

## 9. Deployment and Rollback Plan

### Deployment order
1. Deploy backend with Mongo-ready schema/client and data migration script.
2. Run migration script in production environment.
3. Switch production `DATABASE_URL` to MongoDB.
4. Smoke test backend APIs.
5. Deploy frontend only if any API contract/UI changes were required.

### Rollback
- Keep Postgres snapshot and old backend image/tag.
- If critical issue appears:
  1. Restore old backend env (`DATABASE_URL` -> Postgres).
  2. Redeploy previous backend version.
  3. Re-enable writes.

## 10. Concrete File-by-File Change Checklist

### Backend mandatory
- `backend/prisma/schema.prisma`
  - Switch provider to `mongodb`
  - Convert IDs/relations to `@db.ObjectId`
  - Keep optional fields aligned (`ticketUrl String?`)
- `backend/.env`
  - Mongo `DATABASE_URL`
- `backend/.env.example`
  - Document Mongo URI
- `backend/package.json`
  - Add migration script command(s), e.g. `"migrate:data:mongo": "tsx scripts/migrate-postgres-to-mongo.ts"`
- `backend/scripts/migrate-postgres-to-mongo.ts` (new)
- `backend/scripts/verify-migration.ts` (optional new)

### Backend likely/conditional
- `backend/src/routes/auth.ts`
- `backend/src/routes/events.ts`

### Frontend usually no-code-change (validate only)
- `frontend/src/lib/api/events.ts`
- `frontend/src/lib/models/Event.ts`
- `frontend/src/context/EventsContext.tsx`
- `frontend/src/components/EventForm.tsx`
- `frontend/src/components/EventCard.tsx`
- `frontend/src/pages/EventDetailPage.tsx`

## 11. Suggested Execution Order (Short Version)

1. Convert Prisma schema to MongoDB.
2. Generate client and compile backend.
3. Implement data migration script.
4. Run migration on staging data and validate counts.
5. Cut over backend env to MongoDB.
6. Run backend smoke tests.
7. Validate frontend against unchanged API contract.
8. Apply frontend fixes only if contract drift appears.
9. Production cutover + rollback readiness.

## 12. Notes Specific to Your Repo

- Feature requests are currently not persisted in DB (`backend/src/routes/featureRequests.ts` returns generated response only). You can leave this unchanged during migration.
- Event APIs already map `id` -> `_id`, which helps keep frontend stable during storage migration.
- Root scripts exist for backend/frontend builds, so you can verify quickly from repo root:

```bash
npm run build:backend
npm run build:frontend
```
