ALTER TABLE domains
ADD COLUMN IF NOT EXISTS smtp_host TEXT,
ADD COLUMN IF NOT EXISTS smtp_port INTEGER DEFAULT 587,
ADD COLUMN IF NOT EXISTS smtp_username TEXT,
ADD COLUMN IF NOT EXISTS smtp_password TEXT,
ADD COLUMN IF NOT EXISTS smtp_provider TEXT DEFAULT 'mailgun' CHECK (smtp_provider IN ('mailgun', 'gmail', 'custom'));

ALTER TABLE domains
ALTER COLUMN mailgun_api_key DROP NOT NULL;
