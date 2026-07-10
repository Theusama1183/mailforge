-- Phase 14: Extra Email Features

-- ========== Template Versions ==========
CREATE TABLE IF NOT EXISTS template_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  name TEXT NOT NULL,
  subject TEXT DEFAULT '',
  body_html TEXT DEFAULT '',
  body_text TEXT DEFAULT '',
  metadata JSONB DEFAULT '{}',
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(template_id, version_number)
);

ALTER TABLE template_versions ENABLE ROW LEVEL SECURITY;

-- ========== Preview Links ==========
CREATE TABLE IF NOT EXISTS preview_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  password_hash TEXT,
  expires_at TIMESTAMPTZ,
  max_views INTEGER DEFAULT 0,
  view_count INTEGER NOT NULL DEFAULT 0,
  last_viewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE preview_links ENABLE ROW LEVEL SECURITY;

-- ========== Proofing Comments ==========
CREATE TABLE IF NOT EXISTS proofing_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  resolved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE proofing_comments ENABLE ROW LEVEL SECURITY;

-- ========== Marketplace Templates ==========
CREATE TABLE IF NOT EXISTS marketplace_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT DEFAULT '',
  preview_url TEXT,
  author TEXT DEFAULT '',
  author_url TEXT,
  subject TEXT DEFAULT '',
  body_html TEXT DEFAULT '',
  body_text TEXT DEFAULT '',
  downloads INTEGER NOT NULL DEFAULT 0,
  rating REAL DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE marketplace_templates ENABLE ROW LEVEL SECURITY;

-- ========== Indexes ==========
CREATE INDEX IF NOT EXISTS idx_template_versions_template ON template_versions(template_id);
CREATE INDEX IF NOT EXISTS idx_template_versions_number ON template_versions(template_id, version_number);
CREATE INDEX IF NOT EXISTS idx_preview_links_template ON preview_links(template_id);
CREATE INDEX IF NOT EXISTS idx_preview_links_workspace ON preview_links(workspace_id);
CREATE INDEX IF NOT EXISTS idx_proofing_comments_template ON proofing_comments(template_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_templates_category ON marketplace_templates(category);
CREATE INDEX IF NOT EXISTS idx_marketplace_templates_featured ON marketplace_templates(featured);

-- ========== RLS Policies ==========
CREATE POLICY "workspace_access_template_versions" ON template_versions
  FOR ALL USING (
    template_id IN (SELECT id FROM templates WHERE user_id = auth.uid() OR workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()))
  );

CREATE POLICY "workspace_access_preview_links" ON preview_links
  FOR ALL USING (
    template_id IN (SELECT id FROM templates WHERE user_id = auth.uid() OR workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()))
  );

CREATE POLICY "workspace_access_proofing_comments" ON proofing_comments
  FOR ALL USING (
    template_id IN (SELECT id FROM templates WHERE user_id = auth.uid() OR workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()))
  );

CREATE POLICY "public_read_marketplace_templates" ON marketplace_templates
  FOR SELECT USING (true);

-- ========== Seed marketplace templates ==========
INSERT INTO marketplace_templates (name, description, category, subject, body_html, body_text, author, featured, downloads, rating, tags) VALUES
('Welcome Email', 'A warm welcome email for new subscribers with branding and call-to-action', 'Marketing', 'Welcome to our community!', '<div style="font-family:Arial;max-width:600px;margin:0 auto;padding:20px"><h1 style="color:#333">Welcome!</h1><p>We''re excited to have you on board.</p><a href="{{cta_url}}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px">Get Started</a></div>', 'Welcome!\nWe''re excited to have you on board.\n\nGet Started: {{cta_url}}', 'MailForge', true, 1542, 4.8, ARRAY['welcome', 'onboarding', 'starter']),
('Monthly Newsletter', 'Clean newsletter template with article cards and social links', 'Newsletter', 'Your Monthly Update — {{month}}', '<div style="font-family:Arial;max-width:600px;margin:0 auto;padding:20px"><h1 style="color:#333">{{title}}</h1><div style="margin:16px 0"><h3>{{article_1_title}}</h3><p>{{article_1_excerpt}}</p><a href="{{article_1_url}}" style="color:#2563eb">Read more →</a></div><hr><div style="margin:16px 0"><h3>{{article_2_title}}</h3><p>{{article_2_excerpt}}</p><a href="{{article_2_url}}" style="color:#2563eb">Read more →</a></div></div>', '{{title}}\n\n{{article_1_title}}\n{{article_1_excerpt}}\nRead more: {{article_1_url}}\n\n{{article_2_title}}\n{{article_2_excerpt}}\nRead more: {{article_2_url}}', 'MailForge', true, 2103, 4.9, ARRAY['newsletter', 'monthly', 'articles']),
('Password Reset', 'Standard password reset email with security notice', 'Transactional', 'Reset your password', '<div style="font-family:Arial;max-width:600px;margin:0 auto;padding:20px"><h2 style="color:#333">Password Reset</h2><p>You requested a password reset. Click the button below to reset your password.</p><a href="{{reset_url}}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px">Reset Password</a><p style="margin-top:16px;font-size:12px;color:#999">If you did not request this, please ignore this email.</p></div>', 'Password Reset\n\nYou requested a password reset. Click the link below to reset your password.\n\n{{reset_url}}\n\nIf you did not request this, please ignore this email.', 'MailForge', true, 3210, 4.7, ARRAY['password', 'security', 'transactional']),
('Order Confirmation', 'Order confirmation with item details and delivery estimate', 'Transactional', 'Order #{{order_id}} Confirmed', '<div style="font-family:Arial;max-width:600px;margin:0 auto;padding:20px"><h2 style="color:#333">Order Confirmed!</h2><p>Thank you for your order. Here''s a summary:</p><table style="width:100%;border-collapse:collapse"><tr style="border-bottom:1px solid #eee"><td style="padding:8px">{{item_name}}</td><td style="padding:8px">{{item_price}}</td></tr></table><p style="margin-top:16px"><strong>Total:</strong> {{total}}</p><p><strong>Delivery:</strong> {{delivery_date}}</p></div>', 'Order Confirmed!\n\nThank you for your order.\n\n{{item_name}} — {{item_price}}\nTotal: {{total}}\nDelivery: {{delivery_date}}', 'MailForge', true, 1876, 4.6, ARRAY['order', 'confirmation', 'ecommerce']),
('Event Invitation', 'Eye-catching event invitation with date, time, and RSVP', 'Event', 'You''re invited to {{event_name}}!', '<div style="font-family:Arial;max-width:600px;margin:0 auto;padding:20px;text-align:center"><div style="font-size:48px;margin-bottom:16px">🎉</div><h1 style="color:#333">{{event_name}}</h1><p style="font-size:18px;color:#666">{{event_date}} at {{event_time}}</p><p style="color:#666">{{event_location}}</p><a href="{{rsvp_url}}" style="display:inline-block;padding:12px 32px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;font-size:16px">RSVP Now</a></div>', '🎉 {{event_name}}\n{{event_date}} at {{event_time}}\n{{event_location}}\n\nRSVP: {{rsvp_url}}', 'MailForge', false, 987, 4.5, ARRAY['event', 'invitation', 'rsvp']),
('Feedback Request', 'Polite feedback request with star rating and survey link', 'Feedback', 'How was your experience?', '<div style="font-family:Arial;max-width:600px;margin:0 auto;padding:20px"><h2 style="color:#333">We''d love your feedback!</h2><p>Your opinion helps us improve. Please take a moment to share your thoughts.</p><div style="text-align:center;font-size:32px;margin:16px 0">⭐⭐⭐⭐⭐</div><a href="{{survey_url}}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px">Take Survey</a></div>', 'We''d love your feedback!\n\nYour opinion helps us improve.\n\nTake Survey: {{survey_url}}', 'MailForge', false, 654, 4.3, ARRAY['feedback', 'survey', 'customer']),
('Abandoned Cart', 'Recover abandoned carts with product reminder and incentive', 'Promotional', 'You left something behind!', '<div style="font-family:Arial;max-width:600px;margin:0 auto;padding:20px"><h2 style="color:#333">Don''t forget your items!</h2><p>You added these to your cart but didn''t complete your purchase:</p><table style="width:100%;border-collapse:collapse"><tr><td style="padding:8px">{{item_1}}</td><td style="padding:8px">{{item_1_price}}</td></tr></table><div style="margin:16px 0;padding:12px;background:#fef3c7;border-radius:6px;text-align:center"><strong>Use code {{coupon_code}} for 10% off!</strong></div><a href="{{cart_url}}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px">Complete Purchase</a></div>', 'Don''t forget your items!\n\n{{item_1}} — {{item_1_price}}\n\nUse code {{coupon_code}} for 10% off!\n\nComplete Purchase: {{cart_url}}', 'MailForge', false, 1432, 4.4, ARRAY['cart', 'abandoned', 'ecommerce']),
('Social Announcement', 'Bold announcement template for product launches and updates', 'Social', 'Introducing {{product_name}} 🚀', '<div style="font-family:Arial;max-width:600px;margin:0 auto;padding:20px;text-align:center"><h1 style="font-size:32px;color:#333">{{product_name}}</h1><p style="font-size:18px;color:#666">{{tagline}}</p><div style="margin:24px 0;padding:40px;background:#f0f9ff;border-radius:12px"><p style="font-size:16px;color:#333">{{description}}</p></div><a href="{{learn_more_url}}" style="display:inline-block;padding:12px 32px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;font-size:16px">Learn More</a></div>', 'Introducing {{product_name}} 🚀\n\n{{tagline}}\n\n{{description}}\n\nLearn More: {{learn_more_url}}', 'MailForge', false, 876, 4.2, ARRAY['announcement', 'product', 'launch']);

NOTIFY pgrst, 'reload schema';
