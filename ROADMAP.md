# Product Roadmap

This roadmap outlines the planned evolution of Event Management.

## Phase 1: Sharing And Calendar
- Add Share Event button on event detail page
- Support native Web Share API where available
- Add social share fallbacks (X, LinkedIn, Facebook, WhatsApp, Email)
- Add Copy Link fallback
- Add Google Calendar export via `.ics` file
- Add direct Google Calendar integration (OAuth) in a later step

## Phase 2: Venues And Online Meeting Links
- Build searchable venue directory (filterable by location, capacity, amenities)
- Add venue model and link to events
- Support in-person venues with address, map, parking/amenities info
- Support online-only events with platform selector
- Supported platforms: Zoom, Google Meet, Teams, Discord, Slack
- Store meeting links and generate shareable invite with platform link
- Include meeting link in calendar exports and event shares

## Phase 3: Budget Exports
- Export event budgets as CSV
- Export event budgets as XLSX
- Export event budgets as PDF
- Add export actions directly on each event budget page

## Phase 4: Event Files And Receipts
- Add Files section on each event detail page
- Upload receipt and document files (PDF, JPG, PNG, HEIC, WEBP, DOCX, XLSX, CSV, TXT)
- Attach files to budget entries or keep them as general event documents
- Add file preview, download, and delete actions
- Store uploader, upload time, and optional note/tag metadata
- Enforce file type and size validation
- Restrict file access to authorized event members only

## Phase 5: Guest List And Exports
- Build guest list model and UI per event
- Track RSVP status and basic guest notes
- Export guest lists as TXT
- Export guest lists as XLSX
- Export guest lists as PDF

## Phase 6: Ticketing MVP
- Add ticket types per event (Free, Paid, Donation)
- Set ticket quantity limits and sales windows
- Collect attendee registration details at checkout
- Generate order record and attendee confirmation email
- Add reusable custom ticket template for app view, email, and printable PDF
- Add basic organizer sales dashboard (sold, remaining, gross)

## Phase 7: Ticketing Payments And Ops
- Integrate payment provider (Stripe)
- Handle refunds and canceled orders
- Add promo/discount codes
- Add simple check-in support (manual list + optional QR later)
- Add payout and fee reporting for organizers

## Phase 8: Companies And Memberships
- Add company/organization model
- Allow multiple users under one company
- Use membership roles (Owner, Admin, Member, Viewer)
- Let users leave a company and join another without losing account
- Keep user identity separate from company membership

## Phase 9: Account Access Safety
- Detect likely work-email accounts and prompt for personal backup email
- Verify backup personal email before enabling login
- Preserve account access if work email is deactivated
- Add account/email change audit trail

## Phase 10: Security And Reliability
- Enforce company-scoped authorization across all resources
- Add duplicate-prevention for repeated export/share actions
- Add automated tests for export formats and API responses
- Add lightweight product analytics for feature usage

## Delivery Order (Recommended)
1. Share Event + social sharing
2. Venues + online meeting links
3. Google Calendar `.ics` export
4. Budget exports (CSV -> XLSX -> PDF)
5. Event files and receipts
6. Guest list model + UI
7. Guest list exports (TXT -> XLSX -> PDF)
8. Ticketing MVP (free + basic paid flow)
9. Ticketing payments + operations
10. Company + membership system
11. Backup personal email flow