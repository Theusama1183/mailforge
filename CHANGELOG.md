# Changelog

All notable changes to MailForge are documented here. Format follows [Keep a Changelog](https://keepachangelog.com/).

## [0.1.0] - 2026-07-09

### Performance & Infrastructure

- Email queue system with priority and scheduled sending (`/api/email-queue`)
- Webhook retry management with exponential backoff (`/api/webhook-retry`)
- Background job queue with progress tracking (`/api/background-jobs`)
- Email archiving with bulk archive and purge (`/api/email-archive`)
- Usage quota tracking per workspace (`/api/usage-quotas`)
- Delivery monitoring dashboard with daily breakdown (`/api/delivery-monitor`)
- Health check endpoint (`/api/health`)
- Sliding window rate limiter
- Retry logic with exponential backoff
- Server-side performance monitoring
- Client-side error tracking with React error boundary
- Server error logging infrastructure
- PWA support (manifest, service worker)
- Infinite scroll for email lists (TanStack Virtual)
- Database migration: `0032_phase8_infrastructure.sql`

### Security & Compliance

- OAuth sign-in (Google, GitHub)
- MFA with WebAuthn/Passkeys
- TOTP two-factor authentication
- App-specific passwords
- PGP email encryption (OpenPGP.js)
- Audit logging
- IP allowlisting
- Trusted/blocked sender lists
- Session management
- Rate limiting middleware
- Webhook secret verification
- CSP and security headers
- Database migrations: `0030_phase7_security.sql`, `0031_phase7_remaining.sql`

### Email Builder

- 25+ drag-and-drop blocks (text, image, button, columns, countdown timer, pricing table, product grid, social links, testimonial, video, map, coupon, etc.)
- Block-level style inspector
- Template save/load system
- HTML and JSON export/import
- Pre-built sample templates

### Inbox & Email Management

- Threaded conversation view
- Labels and folders
- Full-text search
- IMAP sync with account management
- Real-time email updates via Supabase Realtime
- Email open/click/bounce tracking

### Contacts

- Full CRUD with search, import (CSV/vCard), export
- Contact groups with member management
- Duplicate detection and merge
- vCard download
- Contact activity history

### Compose & Send

- Rich text editor (TipTap)
- Contact autocomplete
- Draft auto-save
- Undo send (scheduled delay)
- Bulk send
- Signature management
- Vacation auto-reply

### Workspaces

- Multi-workspace support
- Role-based access (owner, admin, member)
- Invitation system with token-based flow
- Workspace transfer

### Analytics

- Summary dashboard with charts (Recharts)
- Time series, per-email, and device breakdowns
- Geographic analytics (GeoIP)
- A/B testing with winner declaration
- CSV export
