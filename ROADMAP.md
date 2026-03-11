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

## Phase 4: Guest List And Exports
- Build guest list model and UI per event
- Track RSVP status and basic guest notes
- Export guest lists as TXT
- Export guest lists as XLSX
- Export guest lists as PDF

## Phase 5: Companies And Memberships
- Add company/organization model
- Allow multiple users under one company
- Use membership roles (Owner, Admin, Member, Viewer)
- Let users leave a company and join another without losing account
- Keep user identity separate from company membership

## Phase 6: Account Access Safety
- Detect likely work-email accounts and prompt for personal backup email
- Verify backup personal email before enabling login
- Preserve account access if work email is deactivated
- Add account/email change audit trail

## Phase 7: Security And Reliability
- Enforce company-scoped authorization across all resources
- Add duplicate-prevention for repeated export/share actions
- Add automated tests for export formats and API responses
- Add lightweight product analytics for feature usage

## Delivery Order (Recommended)
1. Share Event + social sharing
2. Venues + online meeting links
3. Google Calendar `.ics` export
4. Budget exports (CSV -> XLSX -> PDF)
5. Guest list model + UI
6. Guest list exports (TXT -> XLSX -> PDF)
7. Company + membership system
8. Backup personal email flow
