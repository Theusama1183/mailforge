-- Fix missing RLS policies

-- ========== password_reset_tokens: Add missing policies ==========
DROP POLICY IF EXISTS "Users can view own reset tokens" ON public.password_reset_tokens;
CREATE POLICY "Users can view own reset tokens"
  ON public.password_reset_tokens FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create own reset tokens" ON public.password_reset_tokens;
CREATE POLICY "Users can create own reset tokens"
  ON public.password_reset_tokens FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own reset tokens" ON public.password_reset_tokens;
CREATE POLICY "Users can update own reset tokens"
  ON public.password_reset_tokens FOR UPDATE
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own reset tokens" ON public.password_reset_tokens;
CREATE POLICY "Users can delete own reset tokens"
  ON public.password_reset_tokens FOR DELETE
  USING (user_id = auth.uid());

-- ========== plan_tiers: Allow read for authenticated users, restrict mutations ==========
DROP POLICY IF EXISTS "Authenticated users can view plan tiers" ON public.plan_tiers;
CREATE POLICY "Authenticated users can view plan tiers"
  ON public.plan_tiers FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Only admins can insert plan tiers" ON public.plan_tiers;
CREATE POLICY "Only admins can insert plan tiers"
  ON public.plan_tiers FOR INSERT
  WITH CHECK (false);

DROP POLICY IF EXISTS "Only admins can update plan tiers" ON public.plan_tiers;
CREATE POLICY "Only admins can update plan tiers"
  ON public.plan_tiers FOR UPDATE
  USING (false);

DROP POLICY IF EXISTS "Only admins can delete plan tiers" ON public.plan_tiers;
CREATE POLICY "Only admins can delete plan tiers"
  ON public.plan_tiers FOR DELETE
  USING (false);

NOTIFY pgrst, 'reload schema';
