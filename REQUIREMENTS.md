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

- [ ] **OAuth providers** — Google, GitHub, Microsoft login (Supabase config + login buttons) — pending
- [ ] **Two-factor auth** — TOTP or SMS-based 2FA — pending
- [ ] **Passkeys** — WebAuthn passwordless authentication — pending
- [x] **Session management** — View and revoke active sessions via Security tab in settings
- [x] **Login history** — Session tracking with IP, user-agent, device type, last active
- [x] **Password policy** — Minimum 6 character enforcement
- [x] **Password reset** — Forgot password flow with email reset link + secure token
- [ ] **Account recovery** — Recovery codes for account access

### 7.2 Data Protection

- [ ] **PGP encryption** — End-to-end encryption for emails
- [ ] **Data retention** — Auto-delete emails older than X days
- [x] **Data export** — Workspace data exported as JSON on deletion (GDPR data portability)
- [x] **Data deletion** — Account and data deletion with workspace export
- [x] **App passwords** — Generate app-specific passwords for SMTP/IMAP/API with scopes via Security tab
- [ ] **IP allowlist** — Restrict access to specific IP ranges

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

- [ ] **Infinite scroll** — Replace pagination with infinite scroll in inbox
- [ ] **Optimistic updates** — UI updates before server confirms (move, star, delete)
- [ ] **Prefetching** — Preload next page of emails
- [ ] **Progressive Web App** — Service worker, offline support, install prompt
- [ ] **Image optimization** — Lazy loading, responsive images
- [ ] **Bundle optimization** — Code splitting, dynamic imports for routes
- [ ] **Loading states** — Skeleton loaders for all pages

### 8.2 Backend

- [ ] **Email queue** — Dedicated queue for outbound emails with retry logic
- [ ] **Webhook retry** — Exponential backoff for webhook delivery failures
- [ ] **Rate limit tiers** — Per-workspace rate limits based on plan
- [ ] **Background jobs** — Queue system for IMAP sync, bulk operations
- [ ] **Database connection pooling** — Optimize Supabase pool settings
- [ ] **CDN for uploaded files** — Serve attachments via CDN
- [ ] **Email archiving** — Archive old emails to cold storage

### 8.3 Monitoring

- [ ] **Health check endpoint** — `/api/health` with DB, email, queue status
- [ ] **Error tracking** — Capture and report client/server errors
- [ ] **Performance monitoring** — Page load times, API latency
- [ ] **Email delivery monitoring** — Track success/failure rates per provider
- [ ] **Usage quotas** — Track and enforce monthly send limits

---

## Phase 9: Quality & Developer Experience

### 9.1 Testing

- [ ] **Unit tests** — Jest tests for utility functions
- [ ] **Component tests** — React Testing Library for core components
- [ ] **API integration tests** — Playwright tests for API routes
- [ ] **E2E tests** — Playwright tests for critical user flows
- [ ] **Visual regression** — Storybook or Chromatic for UI components
- [ ] **Email rendering tests** — Test email templates render correctly in clients

### 9.2 Documentation

- [ ] **README improvements** — Setup guide, architecture docs
- [ ] **API documentation** — OpenAPI/Swagger spec for public API
- [ ] **Developer guide** — How to add new blocks, API routes, etc.
- [ ] **User guide** — Help docs for end users
- [ ] **CHANGELOG** — Track version history

### 9.3 CI/CD

- [ ] **GitHub Actions pipeline** — Lint → Test → Build → Deploy
- [ ] **Preview deployments** — Vercel preview for PRs
- [ ] **Database migration CI** — Auto-run migrations in preview
- [ ] **E2E test in CI** — Run Playwright tests against preview deployment

---

## Phase 10: Polish & UI/UX

### 10.1 Visual Polish

- [ ] **Dark mode complete** — Ensure all pages work in dark mode
- [ ] **Animations** — Smooth transitions for list changes, modals, sidebar
- [ ] **Empty states** — Illustrated empty states for all views
- [ ] **Onboarding tour** — Interactive guide for first-time users
- [ ] **Drag-drop everywhere** — Drag email to folder, reorder sidebar items
- [ ] **Toast system** — Replace all alerts with proper toast notifications

### 10.2 Accessibility

- [ ] **Keyboard navigation** — Full keyboard support for all actions
- [ ] **ARIA labels** — Proper labels for screen readers
- [ ] **Focus management** — Proper focus trapping in modals
- [ ] **Color contrast** — Ensure WCAG AA compliance
- [ ] **Screen reader testing** — Test with VoiceOver/NVDA

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

- [ ] **Email templates marketplace** — Browse and install community templates
- [ ] **Email preview links** — Share email preview with team (password-protected)
- [ ] **Send test email** — Send test to specific address before campaign
- [ ] **Email proofing** — Approval workflow with comments
- [ ] **Link validation** — Check all links in email before sending
- [ ] **Spam score check** — Show spam score before sending
- [ ] **Email preview in clients** — Preview in Gmail, Outlook, Apple Mail
- [ ] **Plain text auto-generation** — Auto-generate plain text from HTML
- [ ] **Template versioning** — Track template edit history

---

## Phase 15: API & Integrations

- [ ] **Public REST API** — Full CRUD for emails, templates, contacts, domains
- [ ] **API keys** — Generate and manage API keys
- [ ] **API rate limiting** — Per-key rate limits
- [ ] **Webhook events** — Send webhooks for email events (delivered, opened, clicked)
- [ ] **Zapier integration** — Connect MailForge to 5000+ apps
- [ ] **Make/Integromat** — Integration module
- [ ] **Slack integration** — Notifications to Slack channels
- [ ] **CRM integrations** — HubSpot, Salesforce, Pipedrive
- [ ] **Form integrations** — Embeddable form widget
- [ ] **WordPress plugin** — Send emails from WordPress via MailForge

---

## How to Use This List

1. Pick **one item** from any phase
2. Create implementation plan
3. Implement and test
4. Mark as `[x]` in this file
5. Move to next item

> Progress tracking: 90 / ~190 items completed
