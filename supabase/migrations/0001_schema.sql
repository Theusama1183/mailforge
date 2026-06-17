CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  domain TEXT UNIQUE NOT NULL,
  mailgun_api_key TEXT,
  mailgun_domain TEXT,
  cloudflare_token TEXT,
  dns_configured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE email_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id UUID NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
  local_part TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(local_part, domain_id)
);

CREATE TABLE emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mailbox_address TEXT NOT NULL,
  from_address TEXT NOT NULL,
  from_name TEXT,
  to_addresses TEXT[] NOT NULL DEFAULT '{}',
  cc_addresses TEXT[] DEFAULT '{}',
  subject TEXT,
  body_text TEXT,
  body_html TEXT,
  attachments JSONB DEFAULT '[]',
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  message_id TEXT,
  in_reply_to TEXT,
  "references" TEXT[] DEFAULT '{}',
  read BOOLEAN DEFAULT FALSE,
  starred BOOLEAN DEFAULT FALSE,
  folder TEXT DEFAULT 'inbox' CHECK (folder IN ('inbox', 'sent', 'drafts', 'trash', 'spam', 'starred', 'archive')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_emails_user_id ON emails(user_id);
CREATE INDEX idx_emails_mailbox ON emails(mailbox_address);
CREATE INDEX idx_emails_folder ON emails(folder);
CREATE INDEX idx_emails_created ON emails(created_at DESC);
CREATE INDEX idx_emails_user_folder ON emails(user_id, folder);
CREATE INDEX idx_domains_user_id ON domains(user_id);
CREATE INDEX idx_email_addresses_domain_id ON email_addresses(domain_id);

ALTER TABLE emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own emails" ON emails
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can read own domains" ON domains
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can read own email_addresses" ON email_addresses
  FOR ALL USING (
    domain_id IN (SELECT id FROM domains WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can read own profile" ON users
  FOR ALL USING (auth.uid() = id);
