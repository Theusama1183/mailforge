# MailForge API Documentation

All API routes are under `/api/` and use Next.js App Router conventions. Responses are JSON. Authentication is handled via Supabase session cookies unless noted otherwise.

**Base URL**: `https://your-domain.vercel.app/api`

**Common Headers**:
- `Content-Type: application/json` (for POST/PATCH/DELETE)
- Session cookies (auto-managed by browser)

**Error Format**:
```json
{ "error": "Error message" }
```

**Auth**: Most endpoints require a valid Supabase session. Unauthenticated requests return `401`. Workspace-scoped endpoints verify membership in `workspace_members` and return `403` if the user is not a member.

---

## Table of Contents

- [Phase 8 Routes](#phase-8-routes)
- [Emails](#emails)
- [Send](#send)
- [Contacts](#contacts)
- [Analytics](#analytics)
- [Templates](#templates)
- [Workspaces](#workspaces)
- [Settings](#settings)
- [Auth](#auth)
- [Other Routes](#other-routes)

---

## Phase 8 Routes

These routes were added in the Performance & Infrastructure phase.

### `GET /api/health`

Health check endpoint. Returns system status including database connectivity. Does not require authentication.

**Response** `200`:
```json
{
  "status": "healthy",
  "timestamp": "2026-07-09T12:00:00.000Z",
  "uptime": 12345.67,
  "checks": {
    "database": "ok"
  }
}
```

**Response** `503` (degraded):
```json
{
  "status": "degraded",
  "timestamp": "2026-07-09T12:00:00.000Z",
  "uptime": 12345.67,
  "checks": {
    "database": "error"
  }
}
```

---

### `GET /api/email-queue`

List email queue entries for a workspace.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `workspace_id` | string | Yes | Workspace ID |
| `status` | string | No | Filter by status (`pending`, `processing`, `sent`, `failed`) |

**Response** `200`:
```json
{ "data": [{ "id": "...", "workspace_id": "...", "status": "pending", "email_data": {}, "priority": 0, "scheduled_at": null, "created_at": "..." }] }
```

### `POST /api/email-queue`

Add an email to the send queue.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `workspace_id` | string | Yes | Target workspace |
| `email_data` | object | Yes | Full email payload |
| `priority` | number | No | Priority level (default: 0) |
| `scheduled_at` | string | No | ISO timestamp for scheduled send |

**Response** `201`: The created queue entry.

---

### `GET /api/webhook-retry`

List webhook retry logs for a workspace.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `workspace_id` | string | Yes | Workspace ID |
| `status` | string | No | Filter by status |

**Response** `200`: Array of retry log entries.

### `POST /api/webhook-retry`

Retry a failed webhook delivery.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Webhook retry log ID |

Schedules a retry with exponential backoff (`2^retry_count` minutes).

**Response** `200`: Updated retry log entry.

### `DELETE /api/webhook-retry`

Purge old webhook retry logs.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `workspace_id` | string | Yes | Workspace ID |
| `older_than_days` | number | No | Delete logs older than N days (default: 365) |

Deletes only `completed` or `failed` logs older than 7 days.

**Response** `200`:
```json
{ "success": true }
```

---

### `GET /api/background-jobs`

List background jobs for a workspace with pagination.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `workspace_id` | string | Yes | Workspace ID |
| `status` | string | No | Filter by status (`pending`, `running`, `completed`, `failed`) |
| `job_type` | string | No | Filter by job type |
| `limit` | number | No | Results per page (default: 20) |
| `offset` | number | No | Pagination offset (default: 0) |

**Response** `200`:
```json
{ "jobs": [...], "total": 42 }
```

### `POST /api/background-jobs`

Create a new background job.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `workspace_id` | string | Yes | Target workspace |
| `job_type` | string | Yes | Job type identifier |
| `payload` | object | No | Job-specific payload (default: `{}`) |
| `priority` | number | No | Priority (default: 0) |
| `scheduled_at` | string | No | ISO timestamp to schedule execution |

**Response** `201`: The created job.

### `PATCH /api/background-jobs`

Update a background job's status and progress.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Job ID |
| `status` | string | Yes | New status (`pending`, `running`, `completed`, `failed`) |
| `progress` | number | No | Progress percentage (0-100) |
| `result` | object | No | Job result data |
| `error` | string | No | Error message if failed |

Automatically sets `started_at` when status is `running`, and `completed_at` when status is `completed` or `failed`.

**Response** `200`: Updated job.

---

### `GET /api/email-archive`

List archived emails for a workspace.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `workspace_id` | string | Yes | Workspace ID |
| `page` | number | No | Page number (default: 1) |
| `limit` | number | No | Results per page (default: 50, max: 100) |

**Response** `200`:
```json
{ "archives": [...], "total": 150 }
```

### `POST /api/email-archive`

Archive emails (moves them from `emails` to `email_archives`).

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `workspace_id` | string | Yes | Target workspace |
| `email_ids` | string[] | Yes | Array of email IDs to archive |

Copies full email data to `email_archives`, then deletes from `emails`.

**Response** `200`:
```json
{ "archived": 5 }
```

### `DELETE /api/email-archive`

Purge old archived emails.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `workspace_id` | string | Yes | Workspace ID |
| `older_than_days` | number | No | Delete archives older than N days (default: 365) |

**Response** `200`:
```json
{ "deleted": 23 }
```

---

### `GET /api/usage-quotas`

Get current month's usage quotas and rate limits for a workspace.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `workspace_id` | string | Yes | Workspace ID |
| `month` | string | No | Month to query, format `YYYY-MM` (default: current month) |

**Response** `200`:
```json
{
  "usage": {
    "emails_sent": 123,
    "emails_received": 456,
    "api_requests": 7890,
    "storage_bytes": 1048576
  },
  "limits": {
    "emails_per_hour": 100,
    "emails_per_day": 500,
    "requests_per_minute": 60
  },
  "month": "2026-07",
  "tier": "free"
}
```

### `POST /api/usage-quotas`

Increment usage counters for the current month. Creates a new record if none exists for the month; increments existing values otherwise.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `workspace_id` | string | Yes | Target workspace |
| `emails_sent` | number | No | Emails sent increment (default: 0) |
| `emails_received` | number | No | Emails received increment (default: 0) |
| `api_requests` | number | No | API request increment (default: 0) |
| `storage_bytes` | number | No | Storage bytes increment (default: 0) |

**Response** `200`: The updated quota record.

---

### `GET /api/delivery-monitor`

Get delivery monitoring statistics for a workspace.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `workspace_id` | string | Yes | Workspace ID |
| `days` | number | No | Lookback window in days (default: 7, minimum: 1) |

**Response** `200`:
```json
{
  "total_sent": 150,
  "delivered": 145,
  "opened": 89,
  "clicked": 34,
  "bounced": 3,
  "complained": 1,
  "delivery_rate": "96.67",
  "open_rate": "61.38",
  "daily_breakdown": [
    { "date": "2026-07-03", "sent": 20, "delivered": 19, "opened": 12 },
    { "date": "2026-07-04", "sent": 15, "delivered": 15, "opened": 10 }
  ]
}
```

---

## Emails

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/emails` | List emails (with pagination, filtering, labels, folders) |
| GET | `/api/emails/[id]` | Get single email |
| GET | `/api/emails/[id]/thread` | Get email thread/conversation |
| POST | `/api/emails/[id]/labels` | Manage email labels |
| POST | `/api/emails/[id]/resend` | Resend an email |
| GET | `/api/drafts` | List drafts |
| POST | `/api/drafts` | Create/update draft |

## Send

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/send` | Send an email |
| POST | `/api/send/confirm/[id]` | Confirm a scheduled send |
| POST | `/api/send/cancel/[id]` | Cancel a scheduled send |
| POST | `/api/bulk-send` | Send bulk emails |

## Contacts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/contacts` | List contacts |
| POST | `/api/contacts` | Create contact |
| GET | `/api/contacts/[id]` | Get contact |
| PATCH | `/api/contacts/[id]` | Update contact |
| DELETE | `/api/contacts/[id]` | Delete contact |
| GET | `/api/contacts/[id]/vcard` | Download vCard |
| GET | `/api/contacts/[id]/activity` | Contact activity log |
| GET | `/api/contacts/search` | Search contacts |
| POST | `/api/contacts/batch` | Batch create/update |
| POST | `/api/contacts/merge` | Merge duplicate contacts |
| POST | `/api/contacts/import` | Import contacts (CSV/vCard) |
| GET | `/api/contacts/export` | Export contacts |
| GET | `/api/contact-groups` | List contact groups |
| POST | `/api/contact-groups` | Create group |
| GET | `/api/contact-groups/[id]` | Get group |
| PATCH | `/api/contact-groups/[id]` | Update group |
| DELETE | `/api/contact-groups/[id]` | Delete group |
| GET | `/api/contact-groups/[id]/members` | List group members |

## Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/summary` | Analytics summary |
| GET | `/api/analytics/time-series` | Time series data |
| GET | `/api/analytics/per-email` | Per-email analytics |
| GET | `/api/analytics/devices` | Device breakdown |
| GET | `/api/analytics/export` | Export analytics |
| GET | `/api/track/open/[id]` | Track email open (pixel) |
| GET | `/api/track/click/[id]` | Track link click (redirect) |

## Templates

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/templates` | List templates |
| POST | `/api/templates` | Create template |
| GET | `/api/templates/[id]` | Get template |
| PATCH | `/api/templates/[id]` | Update template |
| DELETE | `/api/templates/[id]` | Delete template |

## Workspaces

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/workspaces` | List user's workspaces (public — no auth redirect) |
| POST | `/api/workspaces` | Create workspace |
| GET | `/api/workspaces/[id]` | Get workspace |
| PATCH | `/api/workspaces/[id]` | Update workspace |
| GET | `/api/workspaces/[id]/members` | List members |
| GET | `/api/workspaces/[id]/invitations` | List invitations |
| GET | `/api/workspaces/[id]/emails` | List workspace emails |
| POST | `/api/workspaces/[id]/transfer` | Transfer ownership |
| GET | `/api/invitations/[token]` | Get invitation details (public) |
| POST | `/api/invitations/[token]/accept` | Accept invitation (public) |

## Domains

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/domains/[id]/verify` | Verify domain DNS |
| POST | `/api/domains/[id]/catch-all` | Configure catch-all |
| POST | `/api/cloudflare/import` | Import zones from Cloudflare |
| POST | `/api/import-domains` | Import domains |

## Settings

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/user/profile` | Get user profile |
| PATCH | `/api/user/profile` | Update profile |
| POST | `/api/user/avatar` | Upload avatar |
| GET | `/api/settings/smtp-test` | Test SMTP connection |
| GET | `/api/settings/imap-test` | Test IMAP connection |
| GET | `/api/settings/domain-health` | Domain health check |

## Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/send-otp` | Send OTP code |
| POST | `/api/auth/verify-otp` | Verify OTP |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password` | Reset password |
| GET | `/api/sessions` | List active sessions |

## Other Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/webhook/email` | Inbound email webhook (public, uses `x-webhook-secret`) |
| GET/POST | `/api/labels` | Manage labels |
| GET/POST | `/api/folders` | Manage folders |
| GET/POST | `/api/blocked-senders` | Manage blocked senders |
| GET/POST | `/api/trusted-senders` | Manage trusted senders |
| GET/POST | `/api/signatures` | Manage email signatures |
| GET/POST | `/api/email-aliases` | Manage email aliases |
| GET/POST | `/api/pgp-keys` | Manage PGP keys |
| GET/POST | `/api/app-passwords` | Manage app-specific passwords |
| GET/POST | `/api/vacation-autoreply` | Vacation auto-reply settings |
| GET/POST | `/api/forwarding` | Email forwarding rules |
| GET/POST | `/api/ip-allowlists` | IP allowlist management |
| GET/POST | `/api/notification-preferences` | Notification preferences |
| GET | `/api/activity-logs` | Activity log history |
| GET | `/api/audit-logs` | Audit log history |
| POST | `/api/upload/presign` | Get presigned upload URL |
| POST | `/api/push/register` | Register push notification token |
| GET/POST/DELETE | `/api/imap/accounts` | IMAP account management |
| POST | `/api/imap/sync/[id]` | Trigger IMAP sync |
| GET | `/api/imap/sync-logs/[id]` | IMAP sync logs |
| GET/POST | `/api/imap/folder-mappings` | IMAP folder mappings |
| POST | `/api/log-error` | Client error logging |
| GET | `/api/bounce` | Bounce webhook receiver |
| GET | `/api/unsubscribe` | One-click unsubscribe |
| POST | `/api/email-routing/route` | Email routing configuration |
| GET/POST | `/api/ab-tests` | A/B test management |
| POST | `/api/ab-tests/[id]/start` | Start A/B test |
| POST | `/api/ab-tests/[id]/complete` | Complete A/B test |
| POST | `/api/ab-tests/[id]/declare-winner` | Declare test winner |
