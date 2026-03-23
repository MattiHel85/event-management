# Product Roadmap

This roadmap outlines the planned evolution of Event Management.

## Phase 0: Architecture Split (Backend + Frontend) - DONE
- [x] Split app into separate Node.js + TypeScript backend and React + Vite frontend
- [x] Move Prisma and database access to backend only
- [x] Migrate auth routes first (sign up, sign in, me, logout)
- [x] Add CORS/session setup for frontend-backend communication
- [x] Migrate event and budget APIs incrementally, then remove Next.js API routes

## Phase 1: Organizations, Membership, And Event Visibility
- [ ] Add organization model and organization creation flow
- [ ] Allow inviting and assigning users to an organization
- [ ] Add membership roles (Owner, Admin, Member, Viewer)
- [ ] Let each user keep both private and work emails on one account
- [ ] Keep account identity separate from organization membership
- [ ] Remove access to the old organization when a user leaves or is removed
- [ ] Allow the same user account to be invited into a new organization later
- [ ] Scope all non-public events to users in the same organization only
- [ ] Allow events to be marked public so they are visible outside the organization

## Phase 2: Sharing And Calendar
- [ ] Add Share Event button on event detail page
- [x] Support native Web Share API where available
- [ ] Add social share fallbacks (X, LinkedIn, Facebook, WhatsApp, Email)
- [x] Add Copy Link fallback
- [ ] Add Google Calendar export via `.ics` file
- [ ] Add direct Google Calendar integration (OAuth) in a later step

## Phase 3: Venues And Online Meeting Links
- [ ] Build searchable venue directory (filterable by location, capacity, amenities)
- [ ] Add venue model and link to events
- [ ] Support in-person venues with address, map, parking/amenities info
- [ ] Support online-only events with platform selector
- [ ] Supported platforms: Zoom, Google Meet, Teams, Discord, Slack
- [ ] Store meeting links and generate shareable invite with platform link
- [ ] Include meeting link in calendar exports and event shares

## Phase 4: Budget Exports
- [ ] Export event budgets as CSV
- [ ] Export event budgets as XLSX
- [ ] Export event budgets as PDF
- [ ] Add export actions directly on each event budget page

## Phase 5: Event Files And Receipts
- [ ] Add Files section on each event detail page
- [ ] Upload receipt and document files (PDF, JPG, PNG, HEIC, WEBP, DOCX, XLSX, CSV, TXT)
- [ ] Attach files to budget entries or keep them as general event documents
- [ ] Add file preview, download, and delete actions
- [ ] Store uploader, upload time, and optional note/tag metadata
- [ ] Enforce file type and size validation
- [ ] Restrict file access to authorized event members only

## Phase 6: Guest List And Exports
- [ ] Build guest list model and UI per event
- [ ] Track RSVP status and basic guest notes
- [ ] Export guest lists as TXT
- [ ] Export guest lists as XLSX
- [ ] Export guest lists as PDF

## Phase 7: Ticketing MVP
- [ ] Add ticket types per event (Free, Paid, Donation)
- [ ] Set ticket quantity limits and sales windows
- [ ] Collect attendee registration details at checkout
- [ ] Generate order record and attendee confirmation email
- [ ] Add reusable custom ticket template for app view, email, and printable PDF
- [ ] Add basic organizer sales dashboard (sold, remaining, gross)

## Phase 8: Ticketing Payments And Ops
- [ ] Integrate payment provider (Stripe)
- [ ] Handle refunds and canceled orders
- [ ] Add promo/discount codes
- [ ] Add simple check-in support (manual list + optional QR later)
- [ ] Add payout and fee reporting for organizers

## Phase 9: Security And Reliability
- [ ] Enforce organization-scoped authorization across all resources
- [ ] Add duplicate-prevention for repeated export/share actions
- [ ] Add automated tests for export formats and API responses
- [ ] Add lightweight product analytics for feature usage

## Delivery Order (Recommended)
1. [x] Architecture split: Node.js/TypeScript backend + React/Vite frontend
2. [ ] Organization creation + user assignment
3. [ ] Organization-scoped event visibility + public events
4. [ ] Share Event + social sharing
5. [ ] Venues + online meeting links
6. [ ] Google Calendar `.ics` export
7. [ ] Budget exports (CSV -> XLSX -> PDF)
8. [ ] Event files and receipts
9. [ ] Guest list model + UI
10. [ ] Guest list exports (TXT -> XLSX -> PDF)
11. [ ] Ticketing MVP (free + basic paid flow)
12. [ ] Ticketing payments + operations