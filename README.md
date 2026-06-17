# MailForge

Create and manage email addresses on your own domain. Send via Mailgun, receive via Cloudflare Email Routing.

## Architecture

```
Cloudflare DNS → Email Routing → Worker → Webhook → Supabase DB
                                                       ↓
Vercel (Next.js 16) → Webmail UI → Mailgun API → Send Email
```

## Setup

### 1. Environment Variables
```bash
cp .env.local.example .env.local
# Fill in your Supabase credentials
```

### 2. Supabase
- Create a project at [supabase.com](https://supabase.com)
- Run the migration: `supabase/migrations/0001_schema.sql`
- Get your URL and anon key

### 3. Deploy Email Worker
```bash
cd email-worker
npm install
npx wrangler deploy
```

### 4. Configure Cloudflare Email Routing
- Go to Cloudflare Dashboard → Email → Email Routing
- Enable Email Routing
- Create a catch-all rule → Send to Worker → `mailforge-email-worker`

### 5. Deploy to Vercel
```bash
npx vercel deploy
```

### 6. Configure in App
- Login and add your domain
- Enter Mailgun API key
- Set DNS records as shown in settings
- Create email addresses

## Tech Stack
- **Frontend**: Next.js 16, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Email Send**: Mailgun API
- **Email Receive**: Cloudflare Email Routing + Workers
- **Deploy**: Vercel + Cloudflare
