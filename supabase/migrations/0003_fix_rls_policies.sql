DROP POLICY IF EXISTS "Users can read own domains" ON domains;
DROP POLICY IF EXISTS "Users can read own emails" ON emails;
DROP POLICY IF EXISTS "Users can read own email_addresses" ON email_addresses;
DROP POLICY IF EXISTS "Users can read own profile" ON users;

CREATE POLICY "Users can manage own domains" ON domains
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own emails" ON emails
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own email_addresses" ON email_addresses
  FOR ALL USING (
    domain_id IN (SELECT id FROM domains WHERE user_id = auth.uid())
  ) WITH CHECK (
    domain_id IN (SELECT id FROM domains WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can manage own profile" ON users
  FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
