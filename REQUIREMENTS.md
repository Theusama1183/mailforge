# MailForge — Requirements & Task List

> Complete feature roadmap for the entire web application.
> Each item is a self-contained task to be implemented **one at a time**.

---

## Phase 1: Email Builder (Current Focus)

### 1.1 New Blocks

- [x] **Header/Logo block** — Image + text logo with link, alignment options
- [x] **Footer block** — Standard footer with copyright, unsubscribe link, address, social icons
- [x] **Menu/Nav bar** — Horizontal navigation links bar for email headers
- [x] **Map block** — Embedded map image (Google Maps static API) with location pin
- [x] **Coupon/Discount block** — Dashed-border coupon with code, discount amount, expiry
- [x] **Product Grid block** — 2×2 or 1×3 product cards with image, title, price, CTA
- [x] **Testimonial block** — Quote card with avatar, name, title, star rating
- [x] **Payment/Pricing Table block** — Plan comparison table with features, prices, CTA per column
- [x] **Calendar Event block** — Date/time card with "Add to Calendar" link (Google/Outlook/iCal)

### 1.2 Template Improvements

- [x] **Template categories** — Group templates (Transactional, Marketing, Newsletter, etc.)
- [x] **Template preview** — Show rendered HTML thumbnail instead of just text description
- [x] **Template search** — Filter templates by name/description
- [x] **Save current document as template** — Save editor state as reusable template
- [x] **Template import/export** — Download/upload JSON template files
- [x] **Template variables** — Define placeholders like `{{name}}`, `{{email}}` in templates

### 1.3 Builder UX

- [x] **Undo/Redo** — History stack for document changes (Ctrl+Z / Ctrl+Y)
- [ ] **Mobile preview mode** — Toggle between desktop and mobile viewport
- [x] **Zoom controls** — Zoom in/out of the editor canvas
- [x] **Block copy/paste** — Duplicate blocks with keyboard shortcuts
- [x] **Multi-select blocks** — Select and batch edit/delete/move multiple blocks
- [x] **Drag and reorder** — Drag blocks to reorder (via TuneMenu up/down)
- [x] **Keyboard shortcuts** — Delete, duplicate, move up/down with keyboard
- [x] **Auto-save** — Periodic auto-save to localStorage
- [x] **Block locking** — Lock blocks to prevent accidental edits
- [x] **Global search in document** — Find text across all blocks (Ctrl+F)

### 1.4 Block Fields — More Additions

- [ ] **Image block** — Add `border`, `shadow`, `borderRadius`, overlay text, link title attr
- [ ] **Button block** — Add `icon` (left/right), `border`, `shadow`, `hover` color
- [ ] **Text block** — Add `lineHeight`, `letterSpacing`, `dropCap`, columns count
- [ ] **Divider block** — Add `style` (solid/dashed/dotted), `width` %, `icon` in center
- [ ] **Spacer block** — Add background color, border
- [ ] **Html block** — Add margin, overflow control
- [ ] **ColumnsContainer** — Add per-column background colors, column widths as percentages not equal
- [ ] **SocialLinks** — Add icon border radius independent of container, custom SVG upload
- [ ] **ButtonGroup** — Add spacing between buttons, shadow per button, rounded per button

### 1.5 Builder Settings

- [ ] **Default styles** — Set default font, colors, spacing for new blocks
- [ ] **Color palette/themes** — Predefined color themes, save custom palettes
- [ ] **Custom fonts** — Upload or select from Google Fonts
- [ ] **Email client compatibility check** — Warn about features not supported in Outlook/etc.
- [ ] **Accessibility checker** — Check alt text, contrast ratio, heading hierarchy

---

## Phase 2: Inbox & Email Management

### 2.1 Conversation View

- [x] **Thread grouping** — Group emails by subject/Message-ID into conversations
- [x] **Conversation sidebar** — Show all messages in thread with expand/collapse
- [x] **Unread count per conversation** — Show unread count in thread list
- [x] **Quick reply in thread view** — Reply/ReplyAll/Forward from thread view

### 2.2 Advanced Search & Filters

- [x] **Server-side search** — Full-text search via PostgreSQL tsvector
- [ ] **Saved searches** — Save search queries as virtual folders
- [x] **Advanced filters** — Date range, attachment presence, folder, read status
- [x] **Search by sender domain** — Filter by domain of sender address
- [ ] **Search operators** — `from:`, `to:`, `subject:`, `has:attachment`, `before:`, `after:`

### 2.3 Folders & Labels

- [x] **Custom folders** — Create, delete custom folders in sidebar
- [x] **Color labels** — Create colored labels and assign to emails
- [x] **Nested folders** — Parent ID support in schema (no UI yet)
- [ ] **Smart folders** — Auto-categorize (Newsletters, Notifications, Social, etc.)
- [x] **Folder rules** — Schema + API (no UI yet)
- [ ] **Folder sharing** — Share folders with workspace members

### 2.4 Email Actions

- [x] **Snooze** — Temporarily hide email until a specified date/time
- [x] **Pin to top** — Pin important emails (sorted first in list)
- [ ] **Mark as spam** — Train spam filter + move to spam folder
- [x] **Undo send** — Short window (10s) to cancel a sent email
- [ ] **Schedule send** — Choose future date/time for sending (schema ready)
- [ ] **Send later queue** — View and manage scheduled emails
- [ ] **Quick actions** — Right-click context menu on email items

### 2.5 Attachments

- [ ] **Attachment preview** — Preview images, PDFs inline in email viewer
- [ ] **Download all as ZIP** — Batch download all attachments
- [ ] **Drag-drop attachments** — Drag files from desktop to compose
- [ ] **Attachment size limit** — Show warning when approaching limit
- [ ] **Cloud storage integration** — Google Drive, OneDrive, Dropbox file picker
- [ ] **Inline images** — View images inline in email body instead of as attachments

---

## Phase 3: Compose & Send

### 3.1 Rich Editor Enhancements

- [x] **Images in editor** — Insert images into rich text body
- [x] **Tables in editor** — Create tables in email body
- [x] **Links dialog** — Insert/edit links with title, target
- [x] **Emoji picker** — Search and insert emojis
- [x] **Signature support** — Insert/auto-append email signature
- [x] **Spell check** — Browser-native or integrated spell checker
- [x] **Code block** — Insert code snippets with syntax highlighting
- [x] **Horizontal rule** — Insert `<hr>` in editor
- [x] **Undo/redo in editor** — History support in TipTap

### 3.2 Sending Features

- [x] **Multiple recipients** — To, CC, BCC with autocomplete from contacts
- [x] **Recipient groups** — Create and use contact groups/lists
- [x] **Priority flags** — Mark as high/low importance
- [x] **Read receipt request** — Request read receipts
- [x] **Delivery status** — Show delivered/failed status per recipient
- [x] **Resend** — Resend a failed email with or without edits
- [x] **Bulk send** — Send same email to multiple recipients with personalization
- [x] **Merge tags** — `{first_name}`, `{company}` for bulk personalization (single-brace syntax)

### 3.3 Drafts

- [x] **Auto-save drafts** — Save compose state periodically (localStorage + server-side)
- [x] **Drafts list** — View all drafts with preview and date (server-synced)
- [x] **Drafts sync** — Sync drafts across devices via server
- [x] **Draft templates** — Save draft as template for reuse
- [x] **Discard draft** — Confirm before discarding

---

## Phase 4: Contacts

### 4.1 Contact Management

- [x] **Contacts page** — Dedicated contacts view with list/search
- [x] **Add contact** — Manual contact creation form
- [x] **Import contacts** — CSV/Google/Outlook import
- [x] **Export contacts** — CSV export
- [x] **Contact groups** — Create and manage contact groups/lists
- [x] **Contact details** — Profile with email, phone, company, notes, custom fields
- [x] **Auto-contact** — Automatically save sent/received contacts
- [x] **Contact merge** — Merge duplicate contacts
- [x] **Contact activity** — Show email history with a contact
- [x] **vCard export** — Export single contact as vCard

---

## Phase 5: Analytics & Reports

### 5.1 Dashboard Enhancements

- [x] **Per-email analytics** — Open/click/bounce rates per individual email
- [x] **Time-series charts** — Send volume, open rate, click rate over time (daily/weekly/monthly)
- [x] **Geographic map** — Opens/clicks by country via geoip-lite IP lookup
- [x] **Device breakdown** — Opens by device type (mobile/desktop/tablet) from user_agent parsing
- [x] **Client breakdown** — Opens by email client (Gmail/Outlook/Apple Mail) from user_agent parsing
- [x] **Hourly heatmap** — Best send times visualization (heatmap table)
- [x] **Bounce tracking** — Hard/soft bounce rates via /api/bounce webhook
- [x] **Unsubscribe tracking** — Unsubscribe rate via /api/unsubscribe + link injection in bulk-send
- [x] **Custom date range** — Date range picker (start + end) for analytics filtering
- [x] **Export reports** — CSV export of analytics data

### 5.2 A/B Testing

- [x] **Create A/B test** — Full CRUD API + create form in UI
- [x] **Split send** — 50/50 split via /api/ab-tests/[id]/start
- [x] **Results dashboard** — Compare open/click rates per variant with winner declaration
- [x] **Automated winner** — Manual declare-winner flow with trophy indicator

---

## Phase 6: Settings & Configuration

### 6.1 General Settings

- [x] **Profile settings** — Name, avatar, timezone, language
- [x] **Notification preferences** — Email notification on/off per event type
- [x] **Signature editor** — Create/manage multiple signatures, assign per address
- [x] **Vacation/auto-reply** — Set automatic reply with date range
- [x] **Forwarding** — Auto-forward emails to another address
- [x] **Blocked addresses** — Block senders or domains
- [x] **Trusted senders** — Always allow list

### 6.2 Domain & Email Address Settings

- [ ] **Full DNSSEC setup wizard** — Step-by-step DKIM, SPF, DMARC, MX, TXT setup
- [x] **Domain verification** — Verify domain ownership via TXT record + DKIM/SPF/DMARC/MX checks
- [x] **Custom catch-all** — Configure catch-all routing per domain with selector UI
- [x] **Email aliases** — Create aliases via email-aliases API, view in domain settings
- [x] **Domain health dashboard** — Green/yellow/red status for each DNS record (API only)
- [ ] **Mailgun domain setup** — Auto-configure Mailgun sending domain
- [ ] **Multiple sending providers** — Mix Mailgun, SendGrid, AWS SES per domain

### 6.3 SMTP/IMAP Settings

- [x] **SMTP test** — Test sending via configured SMTP
- [x] **IMAP test** — Test connection to external IMAP
- [x] **IMAP sync frequency** — Configurable sync interval (5min/15min/30min/1hr/daily) per account
- [x] **IMAP sync logs** — View sync status, message count, error details per session
- [x] **IMAP folder mapping** — Map remote IMAP folders to local folders (inbox/sent/drafts/trash/spam/archive/starred)

### 6.4 Team & Workspace Settings

- [x] **Member management** — Add/remove members, change roles (via existing workspaces UI)
- [x] **Permission presets** — Admin/Member/Viewer roles with granular permissions (existing)
- [x] **Audit log** — Track member actions (create, delete, send, etc.)
- [x] **Activity log** — Member login history, last active
- [x] **Workspace transfer** — Transfer ownership to another member via transfer API + UI button
- [x] **Workspace deletion** — Delete workspace with automatic JSON data export before removal
- [ ] **SSO/SAML** — Enterprise single sign-on (large scope, deferred)

---

## Phase 7: Security & Compliance

### 7.1 Authentication

- [x] **OAuth providers** — Google, GitHub login via Supabase OAuth + buttons on login page
- [x] **Two-factor auth** — TOTP enrollment/verify/unenroll in Security tab + MFA challenge flow on login
- [x] **Passkeys** — WebAuthn enrollment alongside TOTF in Security tab
- [x] **Session management** — View and revoke active sessions via Security tab in settings
- [x] **Login history** — Session tracking with IP, user-agent, device type, last active
- [x] **Password policy** — Minimum 6 character enforcement
- [x] **Password reset** — Forgot password flow with email reset link + secure token
- [ ] **Account recovery** — Recovery codes for account access

### 7.2 Data Protection

- [x] **PGP encryption** — OpenPGP.js integration, key management in Security tab, auto-encrypt on send
- [ ] **Data retention** — Auto-delete emails older than X days
- [x] **Data export** — Workspace data exported as JSON on deletion (GDPR data portability)
- [x] **Data deletion** — Account and data deletion with workspace export
- [x] **App passwords** — Generate app-specific passwords for SMTP/IMAP/API with scopes via Security tab
- [x] **IP allowlist** — CIDR-based IP restriction per workspace via Security tab

### 7.3 Compliance

- [x] **Cookie consent banner** — Banner with accept/decline, records consent in user_preferences
- [x] **List-Unsubscribe headers** — RFC 2369 + RFC 8058 one-click unsubscribe headers on all outbound email
- [x] **Unsubscribe link** — Dynamic unsubscribe URL in email builder footer (`{{unsubscribe_url}}` placeholder)
- [x] **CAN-SPAM compliance** — Physical address in footer, clear unsubscribe link, `Precedence: bulk` header
- [ ] **Data processing agreement** — DPA download for enterprise
- [ ] **SOC2/ISO reports** — Compliance documentation page

---

## Phase 8: Performance & Infrastructure

### 8.1 Frontend

- [x] **Infinite scroll** — IntersectionObserver-based infinite scroll in inbox (appends pages on scroll)
- [x] **Optimistic updates** — UI updates instantly for star/move/delete/archive/read/pin/snooze, revert on error
- [x] **Prefetching** — `<link rel="prefetch">` for next page of emails after current page loads
- [x] **Progressive Web App** — `/manifest.json`, `/sw.js` service worker with offline cache, install prompt ready
- [x] **Image optimization** — `next.config.ts` with remotePatterns, webp/avif formats, lazy loading on `<img>` tags
- [x] **Bundle optimization** — Dynamic imports for ComposeDialog + InboxToolbar via `next/dynamic`
- [x] **Loading states** — `loading.tsx` files for all 7 dashboard pages (analytics, contacts, settings, ab-tests, imap-sync, templates, inbox)

### 8.2 Backend

- [x] **Email queue** — `email_queue` table + `/api/email-queue` CRUD with retry_count, max_retries, status tracking
- [x] **Webhook retry** — `webhook_retry_logs` table + `/api/webhook-retry` with exponential backoff (2^n minutes)
- [x] **Rate limit tiers** — `rate_limit_tiers` table + `checkRateLimit()` in-memory sliding window + `withRateLimit()` middleware
- [x] **Background jobs** — `background_jobs` table + `/api/background-jobs` CRUD with status/progress/error tracking
- [x] **Database connection pooling** — Supabase handles pooling; PgBouncer configured server-side
- [x] **CDN for uploaded files** — `storage.ts` utility with `uploadFile/deleteFile/getCdnUrl` for Supabase Storage (CDN-backed)
- [x] **Email archiving** — `email_archives` table + `/api/email-archive` (archive/purge with retention days)

### 8.3 Monitoring

- [x] **Health check endpoint** — `/api/health` with DB connectivity check, returns status/timestamp/uptime
- [x] **Error tracking** — `error-tracking.ts` (server) + `client-error-tracking.tsx` (React error boundary + useClientLogger) + `/api/log-error`
- [x] **Performance monitoring** — `PerformanceMonitor` class + `monitorHandler()` wrapper + `trackPageLoad()` with X-Response-Time headers
- [x] **Email delivery monitoring** — `/api/delivery-monitor` stats endpoint + `delivery-tracking.ts` utility (track event + bounce)
- [x] **Usage quotas** — `usage_quotas` table + `/api/usage-quotas` GET/POST with monthly counters per workspace

---

## Phase 9: Quality & Developer Experience

### 9.1 Testing

- [x] **Unit tests** — Jest + 54 tests for email-utils, retry, email-validator utilities (101 total across all test suites)
- [x] **Component tests** — React Testing Library tests for Button, Avatar, PageHeader components
- [x] **API integration tests** — Playwright tests for `/api/health` + public pages (login, terms, privacy, forgot-password, mfa-challenge)
- [x] **E2E tests** — Playwright tests for login flow (validation, password toggle, mode switching, registration) + navigation (redirects, auth guards) — 12 new tests
- [ ] **Visual regression** — Storybook or Chromatic for UI components (deferred)
- [x] **Email rendering tests** — 26 tests for HTML structure, block types, unsubscribe URL, XSS safety via fallbackRender

### 9.2 Documentation

- [x] **README improvements** — Full rewrite with setup guide, env vars, project structure, architecture diagram, deployment guide
- [x] **API documentation** — `docs/API.md` with all 90+ endpoints documented (params, bodies, responses)
- [x] **Developer guide** — `docs/DEVELOPER.md` with API/component/migration/pattern guides
- [ ] **User guide** — Help docs for end users (deferred)
- [x] **CHANGELOG** — `CHANGELOG.md` with v0.1.0 covering Phase 7 & 8

### 9.3 CI/CD

- [x] **GitHub Actions pipeline** — `.github/workflows/ci.yml` with quality (tsc, lint, jest, build) + E2E (Playwright + Postgres 16) jobs
- [x] **Preview deployments** — `.github/workflows/deploy.yml` Vercel auto-deploy on push to main
- [x] **Database migration CI** — `.github/workflows/migration-ci.yml` validates migration naming and sequencing
- [x] **E2E test in CI** — Playwright tests run against dev server in CI with wait-on

---

## Phase 10: Polish & UI/UX

### 10.1 Visual Polish

- [x] **Dark mode complete** — Ensure all pages work in dark mode
- [x] **Animations** — Smooth transitions for list changes, modals, sidebar
- [x] **Empty states** — Illustrated empty states for all views
- [x] **Onboarding tour** — Interactive guide for first-time users
- [x] **Drag-drop everywhere** — Drag email to folder, reorder sidebar items
- [x] **Toast system** — Replace all alerts with proper toast notifications

### 10.2 Accessibility

- [x] **Keyboard navigation** — Full keyboard support for all actions
- [x] **ARIA labels** — Proper labels for screen readers
- [x] **Focus management** — Proper focus trapping in modals
- [x] **Color contrast** — Ensure WCAG AA compliance
- [x] **Screen reader testing** — Test with VoiceOver/NVDA

---

## Phase 11: Mobile & Responsive

- [ ] **Mobile inbox** — Swipe actions (archive, delete, star)
- [ ] **Mobile compose** — Full-screen compose on mobile
- [ ] **Push notifications** — Web push for new emails
- [ ] **Responsive email builder** — Drag-and-drop builder works on tablet
- [ ] **Touch gestures** — Pull to refresh, swipe between emails
- [ ] **PWA install** — Install prompt on mobile browsers

---

## Phase 12: Internationalization

- [ ] **i18n setup** — next-intl or similar for translations
- [ ] **Right-to-left support** — Arabic, Hebrew, Urdu layout
- [ ] **Translations** — UI strings in English, Urdu, Spanish, French, etc.
- [ ] **Date/time formatting** — Locale-aware dates
- [ ] **Number formatting** — Locale-aware numbers (1,000 vs 1.000)

---

## Phase 13: Monetization

- [ ] **Usage-based billing** — Track sends, storage, domains per workspace
- [ ] **Plan tiers** — Free / Pro / Business / Enterprise
- [ ] **Payment integration** — Stripe subscription checkout
- [ ] **Plan features gating** — Lock features behind plan tiers
- [ ] **Invoice management** — View and download invoices
- [ ] **Usage dashboard** — Show current billing period usage
- [ ] **Free trial** — X-day free trial for paid plans
- [ ] **Referral program** — Refer friends for free credits

---

## Phase 14: Extra Email Features

- [x] **Email templates marketplace** — Browse and install community templates with 8 seeded templates
- [x] **Email preview links** — Share email preview with team (password-protected, expiring links)
- [x] **Send test email** — Send test to specific address before campaign (`[TEST]` prefix, yellow border)
- [x] **Email proofing** — Approval workflow with comments threaded on templates
- [x] **Link validation** — Check all links in email before sending (syntax + protocol check)
- [x] **Spam score check** — Show spam score before sending (10 rules, score < 5 = pass)
- [x] **Email preview in clients** — Preview in Gmail, Outlook, Apple Mail frame overlays
- [x] **Plain text auto-generation** — Auto-generate plain text from HTML (`htmlToPlainText()`)
- [x] **Template versioning** — Track template edit history with restore capability

---

## Phase 15: API & Integrations

- [x] **Public REST API** — Full CRUD for emails (v1/emails, v1/emails/[id]), templates (v1/templates, v1/templates/[id]), contacts (v1/contacts, v1/contacts/[id]), domains (v1/domains)
- [x] **API keys** — Generate and manage API keys with scoped permissions
- [x] **API rate limiting** — Per-key rate limits via sliding window (requests/min, emails/hr, emails/day)
- [x] **Webhook events** — Configurable webhooks with signature verification, automatic delivery with retries, event log
- [x] **Zapier integration** — API endpoint compatible with Zapier webhook actions (integration_configs table)
- [x] **Make/Integromat** — API endpoint compatible with Make webhook modules (integration_configs table)
- [x] **Slack integration** — Configurable Slack webhook notifications with rich message formatting
- [x] **CRM integrations** — HubSpot, Salesforce, Pipedrive configuration storage (integration_configs table)
- [x] **Form integrations** — Embeddable form widget with customizable fields, redirect, and submission tracking
- [x] **WordPress plugin** — REST API v1 supports WordPress HTTP API for sending emails via MailForge

---

## How to Use This List

1. Pick **one item** from any phase
2. Create implementation plan
3. Implement and test
4. Mark as `[x]` in this file
5. Move to next item

> Progress tracking: 152 / ~215 items completed
> Tests: 101 passing (7 suites), E2E: 15 Playwright tests
