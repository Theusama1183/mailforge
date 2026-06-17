ALTER TABLE domains
ADD COLUMN smtp_host TEXT,
ADD COLUMN smtp_port INTEGER DEFAULT 587,
ADD COLUMN smtp_username TEXT,
ADD COLUMN smtp_password TEXT,
ADD COLUMN smtp_provider TEXT DEFAULT 'mailgun' CHECK (smtp_provider IN ('mailgun', 'gmail', 'custom'));

ALTER TABLE domains
ALTER COLUMN mailgun_api_key DROP NOT NULL;
