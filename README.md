# MailForge

Create and manage professional email addresses on your own custom domains. Send via Mailgun, receive via Cloudflare Email Routing, all from a modern web interface.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16 (App Router), React 19, Tailwind CSS 4, shadcn/ui, Radix UI, MUI v9 |
| **Rich Text** | TipTap editor, Waypoint email builder (drag-and-drop) |
| **Charts** | Recharts |
| **Backend** | Next.js API Routes, Supabase (PostgreSQL, Auth, Storage, Realtime) |
| **Email Sending** | Nodemailer + Mailgun API |
| **Email Receiving** | Cloudflare Email Workers → Webhook → Supabase |
| **Validation** | Zod v4 |
| **State** | Zustand |
| **Testing** | Jest + React Testing Library (unit), Playwright (E2E) |
| **Deploy** | Vercel (app), Cloudflare Workers (email processing), Supabase (database/auth/storage) |

## Prerequisites

- **Node.js** 20 or later
- **npm** (comes with Node)
- **Supabase** account ([supabase.com](https://supabase.com))
- **Cloudflare** account (for email routing)
- **Mailgun** account (for outbound email)
- **Vercel** account (for deployment)

## Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/your-org/mailforge.git
cd mailforge

# 2. Install dependencies
npm install

# 3. Start Supabase locally (optional, for local dev)
npx supabase start

# 4. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# 5. Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

Copy `.env.example` to `.env.local` and fill in the values:

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Your Supabase publishable/anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (server-side only, never expose to client) |
| `IMAP_ENCRYPTION_KEY` | Yes | Encryption key for storing IMAP account passwords at rest |
| `EMAIL_WEBHOOK_SECRET` | Yes | Shared secret for verifying incoming email webhooks from Cloudflare |
| `NEXT_PUBLIC_BASE_URL` | No | Public base URL (auto-detected on Vercel if omitted) |
| `SMTP_HOST` | No | SMTP host for outbound email testing |
| `SMTP_PORT` | No | SMTP port for outbound email testing |
| `SMTP_USER` | No | SMTP username for outbound email testing |
| `SMTP_PASS` | No | SMTP password for outbound email testing |

## Project Structure

```
mailforge/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (dashboard)/          # Authenticated dashboard routes
│   │   │   ├── [workspaceId]/    # Workspace-scoped pages
│   │   │   │   ├── inbox/        # Email inbox & thread view
│   │   │   │   ├── analytics/    # Delivery analytics dashboard
│   │   │   │   ├── contacts/     # Contact management
│   │   │   │   ├── templates/    # Email templates & builder
│   │   │   │   ├── settings/     # Workspace, domain, SMTP settings
│   │   │   │   ├── ab-tests/     # A/B testing
│   │   │   │   └── imap-sync/    # IMAP sync configuration
│   │   │   └── workspaces/       # Workspace selection
│   │   ├── api/                  # API routes (90+ endpoints)
│   │   ├── login/                # Authentication pages
│   │   ├── onboarding/           # New user onboarding
│   │   └── ...                   # Other public pages
│   ├── components/               # React components
│   │   ├── ui/                   # Base UI primitives (Button, Input, etc.)
│   │   ├── inbox/                # Inbox & email viewer components
│   │   ├── compose/              # Email composer with rich editor
│   │   └── email-builder/        # Drag-and-drop email builder (blocks, inspector, templates)
│   ├── hooks/                    # Custom React hooks
│   ├── lib/                      # Server & client utilities
│   │   ├── supabase/             # Supabase client setup (browser, server, middleware, admin)
│   │   ├── mailgun.ts            # Mailgun API integration
│   │   ├── email.ts              # Email send logic
│   │   ├── delivery-tracking.ts  # Open/click/bounce tracking
│   │   ├── rate-limiter.ts       # Sliding window rate limiter
│   │   ├── retry.ts              # Exponential backoff retry
│   │   ├── pgp-encrypt.ts        # OpenPGP encryption
│   │   ├── performance-monitor.ts # Server performance tracking
│   │   └── error-tracking.ts     # Error logging
│   └── types/                    # TypeScript type definitions
├── email-worker/                 # Cloudflare Email Worker (receives inbound email)
│   └── src/index.ts
├── e2e/                          # Playwright end-to-end tests
├── scripts/                      # Migration & deployment scripts
├── supabase/
│   └── migrations/               # 32 SQL migration files
└── public/                       # Static assets, service worker, icons
```

## Available Scripts

```bash
npm run dev          # Start Next.js development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Testing
npx jest             # Run unit tests (Jest + React Testing Library)
npx playwright test  # Run E2E tests (requires dev server running)
```

## Deployment

### Vercel (Recommended)

1. Push your repository to GitHub/GitLab/Bitbucket
2. Import the project in [vercel.com/new](https://vercel.com/new)
3. Set environment variables in the Vercel dashboard
4. Deploy — Vercel auto-detects Next.js

```bash
# Or deploy manually
npx vercel deploy
```

### Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run the migrations via the Supabase dashboard SQL editor, or:
   ```bash
   npx supabase db push
   ```
3. Enable Google and/or GitHub OAuth providers in Authentication → Providers
4. Enable MFA/WebAuthn in Authentication → MFA if desired

### Cloudflare Email Worker

```bash
cd email-worker
npm install
npx wrangler deploy
```

Then configure Cloudflare Email Routing:
1. Go to Cloudflare Dashboard → your domain → Email → Email Routing
2. Enable Email Routing
3. Create a catch-all rule → Route to Worker → `mailforge-email-worker`

### Post-Deployment Setup

1. Sign up / log in to MailForge
2. Add your domain in Settings → Domains
3. Enter your Mailgun API key in Settings → SMTP
4. Add the DNS records shown in your domain settings
5. Create email addresses and start sending

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Cloudflare DNS                      │
│                           │                              │
│                    Email Routing                          │
│                           │                              │
│                  ┌────────▼────────┐                     │
│                  │  Email Worker   │  (receives inbound) │
│                  └────────┬────────┘                     │
│                           │ webhook POST                 │
│                  ┌────────▼────────┐                     │
│                  │   Next.js API   │  (stores in DB)     │
│                  └────────┬────────┘                     │
│                           │                              │
│                  ┌────────▼────────┐                     │
│                  │    Supabase     │  (PostgreSQL)        │
│                  │  Auth / RLS     │                     │
│                  │  Realtime       │                     │
│                  │  Storage        │                     │
│                  └────────┬────────┘                     │
│                           │                              │
│  ┌────────────────────────▼──────────────────────────┐  │
│  │              Vercel (Next.js 16)                   │  │
│  │  ┌──────────┐  ┌───────────┐  ┌──────────────┐   │  │
│  │  │  Inbox   │  │  Builder  │  │  Analytics   │   │  │
│  │  │  (IMAP)  │  │  (DnD)    │  │  (Charts)    │   │  │
│  │  └────┬─────┘  └───────────┘  └──────────────┘   │  │
│  │       │                                            │  │
│  │  ┌────▼─────────────┐                             │  │
│  │  │  Mailgun API     │  (sends outbound email)     │  │
│  │  └──────────────────┘                             │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Key Features

- **Custom Domain Email** — Create unlimited email addresses on your domains
- **Drag-and-Drop Builder** — 25+ email blocks (text, images, buttons, countdowns, pricing tables, etc.)
- **Rich Inbox** — Threaded conversations, labels, folders, search, IMAP sync
- **Analytics** — Delivery rates, open tracking, click tracking, device/geo breakdowns
- **Contacts** — Full contact management with import/export, groups, merge, vCard
- **Templates** — Save and reuse email templates
- **A/B Testing** — Split test subject lines and content
- **Security** — OAuth, 2FA/WebAuthn, PGP encryption, app passwords, audit logs
- **Workspaces** — Multi-user collaboration with role-based access
- **PWA** — Installable as a Progressive Web App

## License

Private project. All rights reserved.
