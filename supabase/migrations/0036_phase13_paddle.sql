-- Phase 13: Paddle Billing Integration
-- Replaces Stripe columns with Paddle-specific columns

-- ========== Plan Tiers: Add Paddle price ID columns ==========
ALTER TABLE plan_tiers
  ADD COLUMN IF NOT EXISTS paddle_price_id_monthly TEXT,
  ADD COLUMN IF NOT EXISTS paddle_price_id_yearly TEXT;

-- ========== Subscriptions: Replace Stripe with Paddle ==========
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS paddle_subscription_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS paddle_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS paddle_transaction_id TEXT;

-- Drop Stripe columns (safe to re-run)
ALTER TABLE subscriptions
  DROP COLUMN IF EXISTS stripe_subscription_id,
  DROP COLUMN IF EXISTS stripe_customer_id;

-- Rename index for clarity
DROP INDEX IF EXISTS idx_subscriptions_stripe;
CREATE INDEX IF NOT EXISTS idx_subscriptions_paddle ON subscriptions(paddle_subscription_id);

-- ========== Invoices: Replace Stripe with Paddle ==========
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS paddle_transaction_id TEXT,
  ADD COLUMN IF NOT EXISTS paddle_invoice_id TEXT;

ALTER TABLE invoices
  DROP COLUMN IF EXISTS stripe_invoice_id;

-- ========== Seed plan tiers (idempotent) ==========
INSERT INTO plan_tiers (code, name, description, price_monthly, price_yearly, emails_per_day, emails_per_hour, storage_mb, api_requests_per_minute, domains_allowed, team_members, custom_templates, ab_testing, imap_sync, priority_support, paddle_price_id_monthly, paddle_price_id_yearly)
SELECT 'free', 'Free', 'Perfect for getting started', 0, 0, 100, 10, 500, 60, 1, 1, false, false, false, false, '', ''
WHERE NOT EXISTS (SELECT 1 FROM plan_tiers WHERE code = 'free');

INSERT INTO plan_tiers (code, name, description, price_monthly, price_yearly, emails_per_day, emails_per_hour, storage_mb, api_requests_per_minute, domains_allowed, team_members, custom_templates, ab_testing, imap_sync, priority_support, paddle_price_id_monthly, paddle_price_id_yearly)
SELECT 'pro', 'Pro', 'For professionals and small teams', 1999, 19990, 10000, 500, 5120, 300, 5, 5, true, true, true, false, '', ''
WHERE NOT EXISTS (SELECT 1 FROM plan_tiers WHERE code = 'pro');

INSERT INTO plan_tiers (code, name, description, price_monthly, price_yearly, emails_per_day, emails_per_hour, storage_mb, api_requests_per_minute, domains_allowed, team_members, custom_templates, ab_testing, imap_sync, priority_support, paddle_price_id_monthly, paddle_price_id_yearly)
SELECT 'business', 'Business', 'For growing businesses', 4999, 49990, 50000, 2000, 20480, 1000, 25, 25, true, true, true, true, '', ''
WHERE NOT EXISTS (SELECT 1 FROM plan_tiers WHERE code = 'business');

INSERT INTO plan_tiers (code, name, description, price_monthly, price_yearly, emails_per_day, emails_per_hour, storage_mb, api_requests_per_minute, domains_allowed, team_members, custom_templates, ab_testing, imap_sync, priority_support, paddle_price_id_monthly, paddle_price_id_yearly)
SELECT 'enterprise', 'Enterprise', 'Custom solutions for large organizations', 0, 0, 999999, 50000, 102400, 5000, 999, 999, true, true, true, true, '', ''
WHERE NOT EXISTS (SELECT 1 FROM plan_tiers WHERE code = 'enterprise');

NOTIFY pgrst, 'reload schema';
