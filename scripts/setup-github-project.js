#!/usr/bin/env node
/**
 * setup-github-project.js
 *
 * Creates GitHub labels, epic issues, and child issues from the project roadmap.
 *
 * Usage:
 *   GITHUB_TOKEN=<your-pat> node scripts/setup-github-project.js
 *
 * The token needs `repo` scope (Issues + Labels write access).
 * Dry-run mode (no writes):
 *   DRY_RUN=true node scripts/setup-github-project.js
 */

const OWNER = "MattiHel85";
const REPO = "event-management";
const BASE = `https://api.github.com/repos/${OWNER}/${REPO}`;
const TOKEN = process.env.GITHUB_TOKEN;
const DRY_RUN = process.env.DRY_RUN === "true";

if (!TOKEN && !DRY_RUN) {
  console.error("Set GITHUB_TOKEN or run with DRY_RUN=true");
  process.exit(1);
}

// ─── Labels ──────────────────────────────────────────────────────────────────

const LABELS = [
  { name: "epic",            color: "7B2D8B", description: "Phase-level tracking issue" },
  { name: "backend",         color: "0075CA", description: "Backend / API work" },
  { name: "frontend",        color: "2ECC71", description: "Frontend / UI work" },
  { name: "auth",            color: "E74C3C", description: "Authentication & authorisation" },
  { name: "orgs",            color: "F39C12", description: "Organisation & membership" },
  { name: "visibility",      color: "E67E22", description: "Event visibility & scoping" },
  { name: "budget",          color: "1ABC9C", description: "Budget tracking & exports" },
  { name: "priority: high",  color: "B60205", description: "Must ship in this phase" },
  { name: "priority: medium",color: "FBCA04", description: "Important but not blocking" },
  { name: "priority: low",   color: "C5DEF5", description: "Nice to have" },
  { name: "status: backlog", color: "EDEDED", description: "Not yet started" },
  { name: "status: ready",   color: "0E8A16", description: "Ready for development" },
];

// ─── Epics ───────────────────────────────────────────────────────────────────

const EPICS = [
  {
    title: "[Epic] Phase 1 – Organizations, Membership, and Event Visibility",
    labels: ["epic", "orgs", "visibility", "auth"],
    status: "status: ready",
    priority: "priority: high",
    body: `## Phase 1 – Organizations, Membership, and Event Visibility

Track all work required to introduce multi-tenant organisation support, membership roles, and organisation-scoped event visibility.

### Goals
- Organisation model with creation flow
- Invite/assign users with role-based access
- Private-by-default events scoped to an organisation
- Optional public events visible outside the organisation

### Child Issues
_Issues are linked below as they are created._
`,
  },
  {
    title: "[Epic] Phase 2 – Sharing and Calendar",
    labels: ["epic", "frontend"],
    status: "status: backlog",
    priority: "priority: medium",
    body: `## Phase 2 – Sharing and Calendar

Track all work required to add social sharing and calendar export capabilities.

### Goals
- Share Event button with Web Share API support
- Social share fallbacks (X, LinkedIn, Facebook, WhatsApp, Email)
- Google Calendar \`.ics\` export
- Direct Google Calendar OAuth integration (later step)
`,
  },
  {
    title: "[Epic] Phase 3 – Venues and Online Meeting Links",
    labels: ["epic", "backend", "frontend"],
    status: "status: backlog",
    priority: "priority: medium",
    body: `## Phase 3 – Venues and Online Meeting Links

Track all work required to build a searchable venue directory and online meeting link support.

### Goals
- Venue model linked to events
- Searchable directory with location/capacity/amenities filters
- In-person and online-only event support
- Meeting link storage and shareable invites
`,
  },
  {
    title: "[Epic] Phase 4 – Budget Exports",
    labels: ["epic", "backend", "budget"],
    status: "status: backlog",
    priority: "priority: medium",
    body: `## Phase 4 – Budget Exports

Track all work required to export event budgets in multiple formats.

### Goals
- CSV, XLSX, and PDF export for event budgets
- Export actions surfaced on the event budget page
`,
  },
  {
    title: "[Epic] Phase 5 – Event Files and Receipts",
    labels: ["epic", "backend", "frontend", "budget"],
    status: "status: backlog",
    priority: "priority: medium",
    body: `## Phase 5 – Event Files and Receipts

Track all work required to upload, manage, and secure files attached to events.

### Goals
- Files section on event detail pages
- Multi-format upload (PDF, JPG, PNG, HEIC, WEBP, DOCX, XLSX, CSV, TXT)
- Attach files to budget entries or as general event documents
- Preview, download, delete actions
- Uploader metadata and optional tags
- File type/size validation
- Access restricted to authorised event members
`,
  },
  {
    title: "[Epic] Phase 6 – Guest List and Exports",
    labels: ["epic", "backend", "frontend"],
    status: "status: backlog",
    priority: "priority: medium",
    body: `## Phase 6 – Guest List and Exports

Track all work required to build a per-event guest list with RSVP tracking and export options.

### Goals
- Guest list model and UI per event
- RSVP status and basic notes
- TXT, XLSX, and PDF export
`,
  },
  {
    title: "[Epic] Phase 7 – Ticketing MVP",
    labels: ["epic", "backend", "frontend"],
    status: "status: backlog",
    priority: "priority: medium",
    body: `## Phase 7 – Ticketing MVP

Track all work required to implement a free-tier ticketing flow.

### Goals
- Ticket types: Free, Paid, Donation
- Quantity limits and sales windows
- Attendee registration at checkout
- Order record and confirmation email
- Reusable ticket template (app, email, PDF)
- Organiser sales dashboard
`,
  },
  {
    title: "[Epic] Phase 8 – Ticketing Payments and Ops",
    labels: ["epic", "backend"],
    status: "status: backlog",
    priority: "priority: low",
    body: `## Phase 8 – Ticketing Payments and Ops

Track all work required to add payment processing and operational tooling for ticketing.

### Goals
- Stripe integration
- Refunds and cancellations
- Promo/discount codes
- Manual check-in (optional QR later)
- Payout and fee reporting
`,
  },
  {
    title: "[Epic] Phase 9 – Security and Reliability",
    labels: ["epic", "backend", "auth"],
    status: "status: backlog",
    priority: "priority: medium",
    body: `## Phase 9 – Security and Reliability

Track all work required to harden security, add tests, and improve operational reliability.

### Goals
- Organisation-scoped authorisation across all resources
- Duplicate-prevention for repeated export/share actions
- Automated tests for export formats and API responses
- Lightweight product analytics
`,
  },
];

// ─── Child Issues ─────────────────────────────────────────────────────────────

const ISSUES = [
  // ── Phase 1 ──────────────────────────────────────────────────────────────
  {
    epic: 0,
    title: "Add organisation model and creation flow",
    labels: ["backend", "orgs"],
    priority: "priority: high",
    status: "status: ready",
    body: `### Context
Phase 1 – Organizations, Membership, and Event Visibility

### Acceptance Criteria
- [ ] \`Organisation\` Prisma model exists with \`id\`, \`name\`, \`slug\`, \`createdAt\`
- [ ] \`POST /organisations\` endpoint creates an organisation and assigns the creator as Owner
- [ ] Organisation slug is unique and URL-safe
- [ ] Frontend creation form validates name and shows the new organisation on success
- [ ] Existing tests pass; new unit test covers creation endpoint
`,
  },
  {
    epic: 0,
    title: "Invite and assign users to an organisation",
    labels: ["backend", "frontend", "orgs"],
    priority: "priority: high",
    status: "status: ready",
    body: `### Context
Phase 1 – Organizations, Membership, and Event Visibility

### Acceptance Criteria
- [ ] Owner/Admin can invite a user by email via \`POST /organisations/:id/invitations\`
- [ ] Invited user receives an email with an accept link
- [ ] Accepting the invitation creates a membership record
- [ ] Frontend shows a pending invitations list to admins
- [ ] Inviting a user who is already a member returns a 409 conflict
`,
  },
  {
    epic: 0,
    title: "Add membership roles: Owner, Admin, Member, Viewer",
    labels: ["backend", "auth", "orgs"],
    priority: "priority: high",
    status: "status: ready",
    body: `### Context
Phase 1 – Organizations, Membership, and Event Visibility

### Acceptance Criteria
- [ ] \`OrganisationMember\` model stores \`role\` enum: Owner | Admin | Member | Viewer
- [ ] Role-based middleware enforces permissions on org-scoped routes
- [ ] Owner can promote/demote members; only one Owner per org at a time
- [ ] Viewer role cannot create or edit events
- [ ] Role change is reflected immediately without re-login
`,
  },
  {
    epic: 0,
    title: "Allow users to keep private and work emails on one account",
    labels: ["backend", "auth"],
    priority: "priority: medium",
    status: "status: backlog",
    body: `### Context
Phase 1 – Organizations, Membership, and Event Visibility

### Acceptance Criteria
- [ ] \`UserEmail\` model supports multiple email addresses per user with a \`type\` (personal | work)
- [ ] \`PATCH /me/emails\` allows adding/removing secondary emails
- [ ] At least one email must remain verified at all times
- [ ] Invitations can be sent to any verified email on the account
`,
  },
  {
    epic: 0,
    title: "Keep account identity separate from organisation membership",
    labels: ["backend", "auth", "orgs"],
    priority: "priority: medium",
    status: "status: backlog",
    body: `### Context
Phase 1 – Organizations, Membership, and Event Visibility

### Acceptance Criteria
- [ ] \`User\` model does not embed organisation data; membership is handled via \`OrganisationMember\`
- [ ] Profile data (name, avatar, emails) is independent of organisation context
- [ ] API responses for \`/me\` return user data without embedding org membership details
`,
  },
  {
    epic: 0,
    title: "Remove access when a user leaves or is removed from an organisation",
    labels: ["backend", "auth", "orgs"],
    priority: "priority: high",
    status: "status: ready",
    body: `### Context
Phase 1 – Organizations, Membership, and Event Visibility

### Acceptance Criteria
- [ ] \`DELETE /organisations/:orgId/members/:userId\` removes the membership record
- [ ] Removed user immediately loses access to all org-scoped events and resources
- [ ] Active sessions for the removed user are invalidated for that org context
- [ ] Owner cannot remove themselves; they must transfer ownership first
`,
  },
  {
    epic: 0,
    title: "Allow a removed user to be re-invited to an organisation",
    labels: ["backend", "orgs"],
    priority: "priority: medium",
    status: "status: backlog",
    body: `### Context
Phase 1 – Organizations, Membership, and Event Visibility

### Acceptance Criteria
- [ ] An admin can send a new invitation to a previously removed user
- [ ] Accepting the new invitation restores a membership record with the assigned role
- [ ] Historical data (e.g. created events) is not deleted when a user is removed
`,
  },
  {
    epic: 0,
    title: "Scope all non-public events to organisation members only",
    labels: ["backend", "visibility", "orgs"],
    priority: "priority: high",
    status: "status: ready",
    body: `### Context
Phase 1 – Organizations, Membership, and Event Visibility

### Acceptance Criteria
- [ ] Event queries filter by the requesting user's organisation membership by default
- [ ] A user with no org membership cannot see any private events
- [ ] Existing API tests updated to assert org-scoped filtering
- [ ] No event data leaks across organisations in any list or detail endpoint
`,
  },
  {
    epic: 0,
    title: "Allow events to be marked public and visible outside the organisation",
    labels: ["backend", "frontend", "visibility"],
    priority: "priority: high",
    status: "status: ready",
    body: `### Context
Phase 1 – Organizations, Membership, and Event Visibility

### Acceptance Criteria
- [ ] \`Event\` model has a \`visibility\` field: \`private\` | \`public\`
- [ ] Public events appear in unauthenticated and cross-org queries
- [ ] Frontend event form includes a visibility toggle
- [ ] Default visibility for new events is \`private\`
`,
  },

  // ── Phase 2 ──────────────────────────────────────────────────────────────
  {
    epic: 1,
    title: "Add Share Event button on event detail page",
    labels: ["frontend"],
    priority: "priority: medium",
    status: "status: backlog",
    body: `### Context
Phase 2 – Sharing and Calendar

### Acceptance Criteria
- [ ] Share button is visible on the event detail page for authorised users
- [ ] Clicking the button triggers the Web Share API where supported
- [ ] Falls back gracefully to the social share options (see sibling issue) on unsupported browsers
`,
  },
  {
    epic: 1,
    title: "Add social share fallbacks (X, LinkedIn, Facebook, WhatsApp, Email)",
    labels: ["frontend"],
    priority: "priority: medium",
    status: "status: backlog",
    body: `### Context
Phase 2 – Sharing and Calendar

### Acceptance Criteria
- [ ] Fallback UI shows share buttons for X, LinkedIn, Facebook, WhatsApp, and Email
- [ ] Each button opens the correct share URL with pre-filled event title and link
- [ ] Fallback is displayed only when the Web Share API is unavailable
- [ ] Sharing a private event does not expose private details via URL
`,
  },
  {
    epic: 1,
    title: "Add Google Calendar export via .ics file",
    labels: ["backend", "frontend"],
    priority: "priority: medium",
    status: "status: backlog",
    body: `### Context
Phase 2 – Sharing and Calendar

### Acceptance Criteria
- [ ] \`GET /events/:id/export/ics\` returns a valid \`.ics\` file
- [ ] ICS file includes event title, description, start/end time, and location
- [ ] Frontend offers an "Add to Calendar" button that triggers the download
- [ ] File passes iCalendar spec validation (e.g. ical-validator)
`,
  },
  {
    epic: 1,
    title: "Add direct Google Calendar integration via OAuth",
    labels: ["backend", "frontend", "auth"],
    priority: "priority: low",
    status: "status: backlog",
    body: `### Context
Phase 2 – Sharing and Calendar (later step)

### Acceptance Criteria
- [ ] User can connect their Google account via OAuth 2.0
- [ ] Connected user can push an event directly to their Google Calendar
- [ ] OAuth tokens are stored securely and refreshed automatically
- [ ] User can disconnect the Google integration from their profile settings
`,
  },

  // ── Phase 3 ──────────────────────────────────────────────────────────────
  {
    epic: 2,
    title: "Build searchable venue directory",
    labels: ["backend", "frontend"],
    priority: "priority: medium",
    status: "status: backlog",
    body: `### Context
Phase 3 – Venues and Online Meeting Links

### Acceptance Criteria
- [ ] \`GET /venues\` supports query params for location, capacity, and amenities
- [ ] Results are paginated
- [ ] Frontend directory page renders venue cards with filter controls
- [ ] Empty state shown when no venues match the filter
`,
  },
  {
    epic: 2,
    title: "Add venue model and link venues to events",
    labels: ["backend"],
    priority: "priority: medium",
    status: "status: backlog",
    body: `### Context
Phase 3 – Venues and Online Meeting Links

### Acceptance Criteria
- [ ] \`Venue\` Prisma model: \`id\`, \`name\`, \`address\`, \`city\`, \`country\`, \`capacity\`, \`amenities\`
- [ ] \`Event\` model has an optional foreign key to \`Venue\`
- [ ] \`POST /venues\` creates a venue; \`PATCH /events/:id\` accepts \`venueId\`
- [ ] Venue details are included in the event detail API response
`,
  },
  {
    epic: 2,
    title: "Support in-person venues with address, map, parking, and amenities info",
    labels: ["backend", "frontend"],
    priority: "priority: medium",
    status: "status: backlog",
    body: `### Context
Phase 3 – Venues and Online Meeting Links

### Acceptance Criteria
- [ ] Venue model stores full address, parking notes, and amenities list
- [ ] Frontend event detail page displays a map link and amenities chips
- [ ] Amenities are stored as a searchable array (e.g. \`["wifi", "parking", "accessible"]\`)
`,
  },
  {
    epic: 2,
    title: "Support online-only events with platform selector",
    labels: ["frontend"],
    priority: "priority: medium",
    status: "status: backlog",
    body: `### Context
Phase 3 – Venues and Online Meeting Links

### Acceptance Criteria
- [ ] Event form has an "Online" toggle that hides the venue field and shows platform selector
- [ ] Platform options: Zoom, Google Meet, Teams, Discord, Slack
- [ ] Selected platform is stored on the event record
`,
  },
  {
    epic: 2,
    title: "Store meeting links and generate shareable invite with platform link",
    labels: ["backend"],
    priority: "priority: medium",
    status: "status: backlog",
    body: `### Context
Phase 3 – Venues and Online Meeting Links

### Acceptance Criteria
- [ ] \`Event\` model stores \`meetingLink\` (URL) and \`platform\` (enum)
- [ ] \`GET /events/:id/invite\` returns a shareable invite object including the meeting link
- [ ] Meeting link is only exposed to authenticated, authorised users
`,
  },
  {
    epic: 2,
    title: "Include meeting link in calendar exports and event shares",
    labels: ["backend"],
    priority: "priority: medium",
    status: "status: backlog",
    body: `### Context
Phase 3 – Venues and Online Meeting Links

### Acceptance Criteria
- [ ] The \`.ics\` export includes the meeting link in the \`LOCATION\` or \`DESCRIPTION\` field
- [ ] Share payload (Web Share / social fallbacks) includes the meeting link
- [ ] Meeting link is omitted from public shares if the event is private
`,
  },

  // ── Phase 4 ──────────────────────────────────────────────────────────────
  {
    epic: 3,
    title: "Export event budgets as CSV",
    labels: ["backend", "budget"],
    priority: "priority: medium",
    status: "status: backlog",
    body: `### Context
Phase 4 – Budget Exports

### Acceptance Criteria
- [ ] \`GET /events/:id/budget/export?format=csv\` returns a valid CSV file
- [ ] CSV includes columns: category, description, estimated cost, actual cost, difference
- [ ] File name follows the pattern \`event-<id>-budget.csv\`
- [ ] Response sets correct \`Content-Type: text/csv\` and \`Content-Disposition\` headers
`,
  },
  {
    epic: 3,
    title: "Export event budgets as XLSX",
    labels: ["backend", "budget"],
    priority: "priority: medium",
    status: "status: backlog",
    body: `### Context
Phase 4 – Budget Exports

### Acceptance Criteria
- [ ] \`GET /events/:id/budget/export?format=xlsx\` returns a valid XLSX file
- [ ] Spreadsheet mirrors the CSV column structure
- [ ] Column widths are auto-fitted for readability
- [ ] Response sets correct \`Content-Type\` for XLSX
`,
  },
  {
    epic: 3,
    title: "Export event budgets as PDF",
    labels: ["backend", "budget"],
    priority: "priority: medium",
    status: "status: backlog",
    body: `### Context
Phase 4 – Budget Exports

### Acceptance Criteria
- [ ] \`GET /events/:id/budget/export?format=pdf\` returns a valid PDF file
- [ ] PDF includes event name, date, and a formatted budget table
- [ ] Totals row is included at the bottom of the table
- [ ] Response sets correct \`Content-Type: application/pdf\` header
`,
  },
  {
    epic: 3,
    title: "Add export actions on the event budget page",
    labels: ["frontend", "budget"],
    priority: "priority: medium",
    status: "status: backlog",
    body: `### Context
Phase 4 – Budget Exports

### Acceptance Criteria
- [ ] Budget page shows export buttons: CSV, XLSX, PDF
- [ ] Clicking a button triggers the download without navigating away
- [ ] Buttons are disabled when the budget has no entries
- [ ] Loading state shown while the file is being generated
`,
  },

  // ── Phase 5 ──────────────────────────────────────────────────────────────
  {
    epic: 4,
    title: "Add Files section on each event detail page",
    labels: ["frontend"],
    priority: "priority: medium",
    status: "status: backlog",
    body: `### Context
Phase 5 – Event Files and Receipts

### Acceptance Criteria
- [ ] Event detail page includes a "Files" tab or section
- [ ] Section lists uploaded files with name, type, uploader, and upload date
- [ ] Empty state shown when no files exist
`,
  },
  {
    epic: 4,
    title: "Upload receipt and document files",
    labels: ["backend", "frontend"],
    priority: "priority: medium",
    status: "status: backlog",
    body: `### Context
Phase 5 – Event Files and Receipts

### Acceptance Criteria
- [ ] Supported types: PDF, JPG, PNG, HEIC, WEBP, DOCX, XLSX, CSV, TXT
- [ ] \`POST /events/:id/files\` accepts multipart/form-data
- [ ] Frontend file picker filters by accepted types
- [ ] Upload progress indicator shown in the UI
`,
  },
  {
    epic: 4,
    title: "Attach files to budget entries or keep as general event documents",
    labels: ["backend", "budget"],
    priority: "priority: medium",
    status: "status: backlog",
    body: `### Context
Phase 5 – Event Files and Receipts

### Acceptance Criteria
- [ ] \`EventFile\` model has an optional \`budgetEntryId\` foreign key
- [ ] \`POST /events/:id/files\` accepts an optional \`budgetEntryId\` parameter
- [ ] Budget entry detail view shows linked files
- [ ] Files without a \`budgetEntryId\` appear in the general documents list
`,
  },
  {
    epic: 4,
    title: "Add file preview, download, and delete actions",
    labels: ["frontend"],
    priority: "priority: medium",
    status: "status: backlog",
    body: `### Context
Phase 5 – Event Files and Receipts

### Acceptance Criteria
- [ ] Images and PDFs can be previewed inline (e.g. lightbox or iframe)
- [ ] All file types offer a download action
- [ ] Delete action requires confirmation and is restricted to authorised users
- [ ] Deleted file is removed from storage and the database
`,
  },
  {
    epic: 4,
    title: "Store uploader, upload time, and optional note/tag metadata",
    labels: ["backend"],
    priority: "priority: low",
    status: "status: backlog",
    body: `### Context
Phase 5 – Event Files and Receipts

### Acceptance Criteria
- [ ] \`EventFile\` model stores \`uploaderId\`, \`uploadedAt\`, \`note\` (nullable), \`tags\` (array)
- [ ] \`PATCH /files/:id\` allows updating note and tags
- [ ] Uploader name and date are displayed in the file list
`,
  },
  {
    epic: 4,
    title: "Enforce file type and size validation",
    labels: ["backend"],
    priority: "priority: medium",
    status: "status: backlog",
    body: `### Context
Phase 5 – Event Files and Receipts

### Acceptance Criteria
- [ ] Server rejects files with unsupported MIME types (415 Unsupported Media Type)
- [ ] Maximum file size is configurable via env variable (default 10 MB)
- [ ] Server validates MIME type from file content, not just extension
- [ ] Client shows a clear error message for invalid files
`,
  },
  {
    epic: 4,
    title: "Restrict file access to authorised event members only",
    labels: ["backend", "auth"],
    priority: "priority: high",
    status: "status: backlog",
    body: `### Context
Phase 5 – Event Files and Receipts

### Acceptance Criteria
- [ ] File download/preview URLs are authenticated (signed URLs or session-gated)
- [ ] Unauthenticated requests to file endpoints return 401
- [ ] Users outside the event's organisation receive 403
- [ ] Public events: files remain private (not exposed with the public event)
`,
  },

  // ── Phase 6 ──────────────────────────────────────────────────────────────
  {
    epic: 5,
    title: "Build guest list model and UI per event",
    labels: ["backend", "frontend"],
    priority: "priority: medium",
    status: "status: backlog",
    body: `### Context
Phase 6 – Guest List and Exports

### Acceptance Criteria
- [ ] \`Guest\` model: \`id\`, \`eventId\`, \`name\`, \`email\`, \`rsvpStatus\`, \`notes\`
- [ ] \`GET /events/:id/guests\` returns paginated guest list
- [ ] Frontend renders a sortable, searchable guest list table
- [ ] Authorised users can add guests manually via form
`,
  },
  {
    epic: 5,
    title: "Track RSVP status and basic guest notes",
    labels: ["backend"],
    priority: "priority: medium",
    status: "status: backlog",
    body: `### Context
Phase 6 – Guest List and Exports

### Acceptance Criteria
- [ ] RSVP status enum: \`pending\` | \`accepted\` | \`declined\` | \`maybe\`
- [ ] \`PATCH /events/:id/guests/:guestId\` updates RSVP status and notes
- [ ] Status changes are timestamped
- [ ] RSVP summary counts (accepted/declined/pending) shown in the UI
`,
  },
  {
    epic: 5,
    title: "Export guest lists as TXT",
    labels: ["backend"],
    priority: "priority: low",
    status: "status: backlog",
    body: `### Context
Phase 6 – Guest List and Exports

### Acceptance Criteria
- [ ] \`GET /events/:id/guests/export?format=txt\` returns a plain-text list
- [ ] Each line: \`Name | Email | RSVP Status\`
- [ ] Response sets \`Content-Type: text/plain\`
`,
  },
  {
    epic: 5,
    title: "Export guest lists as XLSX",
    labels: ["backend"],
    priority: "priority: medium",
    status: "status: backlog",
    body: `### Context
Phase 6 – Guest List and Exports

### Acceptance Criteria
- [ ] \`GET /events/:id/guests/export?format=xlsx\` returns a valid XLSX file
- [ ] Columns: Name, Email, RSVP Status, Notes
- [ ] Header row is bold/styled
`,
  },
  {
    epic: 5,
    title: "Export guest lists as PDF",
    labels: ["backend"],
    priority: "priority: medium",
    status: "status: backlog",
    body: `### Context
Phase 6 – Guest List and Exports

### Acceptance Criteria
- [ ] \`GET /events/:id/guests/export?format=pdf\` returns a valid PDF
- [ ] PDF includes event name, date, and a formatted guest table
- [ ] RSVP summary totals shown at the top
`,
  },

  // ── Phase 7 ──────────────────────────────────────────────────────────────
  {
    epic: 6,
    title: "Add ticket types per event: Free, Paid, Donation",
    labels: ["backend", "frontend"],
    priority: "priority: high",
    status: "status: backlog",
    body: `### Context
Phase 7 – Ticketing MVP

### Acceptance Criteria
- [ ] \`TicketType\` model: \`id\`, \`eventId\`, \`name\`, \`type\` (free|paid|donation), \`price\`, \`currency\`
- [ ] Event form allows adding multiple ticket types
- [ ] Free tickets have \`price = 0\`; Donation tickets accept any amount ≥ 0
`,
  },
  {
    epic: 6,
    title: "Set ticket quantity limits and sales windows",
    labels: ["backend"],
    priority: "priority: medium",
    status: "status: backlog",
    body: `### Context
Phase 7 – Ticketing MVP

### Acceptance Criteria
- [ ] \`TicketType\` model stores \`quantity\` (nullable = unlimited), \`salesStart\`, \`salesEnd\`
- [ ] Checkout rejects purchases outside the sales window
- [ ] Sold-out ticket types are marked unavailable in the UI
`,
  },
  {
    epic: 6,
    title: "Collect attendee registration details at checkout",
    labels: ["backend", "frontend"],
    priority: "priority: medium",
    status: "status: backlog",
    body: `### Context
Phase 7 – Ticketing MVP

### Acceptance Criteria
- [ ] Checkout form collects: first name, last name, email, phone (optional)
- [ ] Data is stored on the \`Order\` model
- [ ] Form validates required fields before submission
`,
  },
  {
    epic: 6,
    title: "Generate order record and attendee confirmation email",
    labels: ["backend"],
    priority: "priority: medium",
    status: "status: backlog",
    body: `### Context
Phase 7 – Ticketing MVP

### Acceptance Criteria
- [ ] \`Order\` model: \`id\`, \`ticketTypeId\`, \`attendeeDetails\`, \`status\`, \`createdAt\`
- [ ] Confirmation email sent on successful order with event details and order summary
- [ ] Email delivery failures are logged and do not block the order response
`,
  },
  {
    epic: 6,
    title: "Add reusable custom ticket template for app view, email, and printable PDF",
    labels: ["frontend"],
    priority: "priority: medium",
    status: "status: backlog",
    body: `### Context
Phase 7 – Ticketing MVP

### Acceptance Criteria
- [ ] Shared ticket component renders consistently in the app, email HTML, and PDF
- [ ] Ticket shows: event name, date, ticket type, attendee name, order ID
- [ ] PDF version is downloadable from the order confirmation page
`,
  },
  {
    epic: 6,
    title: "Add basic organiser sales dashboard",
    labels: ["frontend"],
    priority: "priority: medium",
    status: "status: backlog",
    body: `### Context
Phase 7 – Ticketing MVP

### Acceptance Criteria
- [ ] Dashboard shows per-ticket-type stats: sold, remaining, gross revenue
- [ ] Data refreshes without a full page reload
- [ ] Only users with Owner or Admin role can view the dashboard
`,
  },

  // ── Phase 8 ──────────────────────────────────────────────────────────────
  {
    epic: 7,
    title: "Integrate Stripe as the payment provider",
    labels: ["backend"],
    priority: "priority: high",
    status: "status: backlog",
    body: `### Context
Phase 8 – Ticketing Payments and Ops

### Acceptance Criteria
- [ ] Stripe Checkout session created on \`POST /orders\` for paid tickets
- [ ] Webhook handler processes \`checkout.session.completed\` and \`payment_intent.payment_failed\`
- [ ] Stripe secret keys stored in environment variables, never in source code
- [ ] Test mode used in non-production environments
`,
  },
  {
    epic: 7,
    title: "Handle refunds and cancelled orders",
    labels: ["backend"],
    priority: "priority: medium",
    status: "status: backlog",
    body: `### Context
Phase 8 – Ticketing Payments and Ops

### Acceptance Criteria
- [ ] \`POST /orders/:id/refund\` issues a full or partial Stripe refund
- [ ] Order status updated to \`cancelled\` or \`refunded\`
- [ ] Attendee receives a refund confirmation email
- [ ] Refunded quantity is returned to ticket availability
`,
  },
  {
    epic: 7,
    title: "Add promo and discount codes",
    labels: ["backend"],
    priority: "priority: medium",
    status: "status: backlog",
    body: `### Context
Phase 8 – Ticketing Payments and Ops

### Acceptance Criteria
- [ ] \`PromoCode\` model: \`code\`, \`discountType\` (percent|flat), \`discountValue\`, \`usageLimit\`, \`expiresAt\`
- [ ] Checkout applies promo code before payment
- [ ] Expired or exhausted codes return a clear error
- [ ] Organiser can create and deactivate codes via the dashboard
`,
  },
  {
    epic: 7,
    title: "Add simple check-in support (manual list, optional QR later)",
    labels: ["backend", "frontend"],
    priority: "priority: medium",
    status: "status: backlog",
    body: `### Context
Phase 8 – Ticketing Payments and Ops

### Acceptance Criteria
- [ ] Check-in list shows all confirmed attendees per event
- [ ] Organiser can mark an attendee as checked in with a single tap/click
- [ ] Check-in status is timestamped
- [ ] QR scanning is not in scope for this issue (deferred to a later step)
`,
  },
  {
    epic: 7,
    title: "Add payout and fee reporting for organisers",
    labels: ["backend"],
    priority: "priority: medium",
    status: "status: backlog",
    body: `### Context
Phase 8 – Ticketing Payments and Ops

### Acceptance Criteria
- [ ] \`GET /events/:id/payouts\` returns gross revenue, platform fees, and net payout
- [ ] Report is exportable as CSV
- [ ] Data sourced from Stripe balance transactions where possible
`,
  },

  // ── Phase 9 ──────────────────────────────────────────────────────────────
  {
    epic: 8,
    title: "Enforce organisation-scoped authorisation across all resources",
    labels: ["backend", "auth", "orgs"],
    priority: "priority: high",
    status: "status: backlog",
    body: `### Context
Phase 9 – Security and Reliability

### Acceptance Criteria
- [ ] Every protected route validates the requesting user's org membership
- [ ] Cross-org data access returns 403 (not 404 or 500)
- [ ] Automated test suite covers cross-org access attempts for all major resource types
- [ ] No regression in existing org-member access
`,
  },
  {
    epic: 8,
    title: "Add duplicate-prevention for repeated export and share actions",
    labels: ["backend"],
    priority: "priority: medium",
    status: "status: backlog",
    body: `### Context
Phase 9 – Security and Reliability

### Acceptance Criteria
- [ ] Export endpoints are idempotent; repeated requests within 5 s return a cached response
- [ ] Share actions are rate-limited per user (e.g. max 10/min)
- [ ] Duplicate prevention does not affect legitimate concurrent users
`,
  },
  {
    epic: 8,
    title: "Add automated tests for export formats and API responses",
    labels: ["backend"],
    priority: "priority: medium",
    status: "status: backlog",
    body: `### Context
Phase 9 – Security and Reliability

### Acceptance Criteria
- [ ] Integration tests verify CSV, XLSX, PDF, and TXT export endpoints
- [ ] Tests assert correct \`Content-Type\`, file structure, and non-empty content
- [ ] Tests run in CI on every PR
`,
  },
  {
    epic: 8,
    title: "Add lightweight product analytics for feature usage",
    labels: ["backend", "frontend"],
    priority: "priority: low",
    status: "status: backlog",
    body: `### Context
Phase 9 – Security and Reliability

### Acceptance Criteria
- [ ] Key user actions (event created, export triggered, share clicked) emit analytics events
- [ ] Analytics provider is privacy-respecting and configurable via env variable
- [ ] No PII is included in analytics payloads
- [ ] Analytics can be disabled via an opt-out flag
`,
  },
];

// ─── GitHub API helpers ───────────────────────────────────────────────────────

async function ghRequest(method, path, body) {
  const url = `${BASE}${path}`;
  if (DRY_RUN) {
    console.log(`[DRY RUN] ${method} ${url}`, body ? JSON.stringify(body).slice(0, 120) : "");
    return { number: 0, html_url: "(dry-run)" };
  }
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${method} ${url} → ${res.status}: ${text}`);
  }
  return res.json();
}

async function ensureLabel(label) {
  try {
    await ghRequest("POST", "/labels", label);
    console.log(`  ✓ created label: ${label.name}`);
  } catch (err) {
    if (err.message.includes("422")) {
      console.log(`  · label exists: ${label.name}`);
    } else {
      throw err;
    }
  }
}

async function createIssue(issue) {
  const data = await ghRequest("POST", "/issues", issue);
  console.log(`  ✓ #${data.number} ${issue.title.slice(0, 70)}`);
  return data.number;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n=== GitHub Project Setup${DRY_RUN ? " (DRY RUN)" : ""} ===\n`);
  console.log(`Repository: ${OWNER}/${REPO}\n`);

  // 1. Labels
  console.log("── Creating labels ──");
  for (const label of LABELS) {
    await ensureLabel(label);
  }

  // 2. Epics
  console.log("\n── Creating epic issues ──");
  const epicNumbers = [];
  for (const epic of EPICS) {
    const num = await createIssue({
      title: epic.title,
      body: epic.body,
      labels: [...epic.labels, epic.status, epic.priority],
    });
    epicNumbers.push(num);
  }

  // 3. Child issues
  console.log("\n── Creating child issues ──");
  for (const issue of ISSUES) {
    const epicNum = epicNumbers[issue.epic];
    const epicRef = epicNum ? `\n_Part of epic #${epicNum}_\n` : "";
    await createIssue({
      title: issue.title,
      body: epicRef + issue.body,
      labels: [...issue.labels, issue.status, issue.priority],
    });
    // Respect GitHub's secondary rate limit
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log("\n✅ Done.");
  console.log(`Created ${EPICS.length} epics and ${ISSUES.length} issues.`);
}

main().catch((err) => {
  console.error("Fatal:", err.message);
  process.exit(1);
});
