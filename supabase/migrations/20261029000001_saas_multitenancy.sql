-- OpenDM SaaS tenancy, administration, and subscription foundation.
-- This is additive: existing user_id / instagram_account_id ownership remains
-- the source of truth for all automation data and webhook processing.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'customer'
    CHECK (role IN ('customer', 'admin')),
  ADD COLUMN IF NOT EXISTS account_status TEXT NOT NULL DEFAULT 'active'
    CHECK (account_status IN ('active', 'suspended')),
  ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suspension_reason TEXT;

CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  max_instagram_accounts INTEGER NOT NULL CHECK (max_instagram_accounts >= 0),
  max_active_automations INTEGER NOT NULL CHECK (max_active_automations >= 0),
  max_monthly_triggers INTEGER NOT NULL CHECK (max_monthly_triggers >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.customer_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
  status TEXT NOT NULL DEFAULT 'trialing'
    CHECK (status IN ('trialing', 'active', 'past_due', 'canceled', 'expired')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  provider TEXT,
  provider_subscription_id TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.usage_counters (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  triggers_used INTEGER NOT NULL DEFAULT 0 CHECK (triggers_used >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, period_start)
);

CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  target_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role_status ON public.profiles(role, account_status);
CREATE INDEX IF NOT EXISTS idx_customer_subscriptions_plan ON public.customer_subscriptions(plan_id, status);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_target ON public.admin_audit_logs(target_user_id, created_at DESC);

CREATE TRIGGER subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER customer_subscriptions_updated_at
  BEFORE UPDATE ON public.customer_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

INSERT INTO public.subscription_plans (code, name, max_instagram_accounts, max_active_automations, max_monthly_triggers)
VALUES ('free', 'Free', 1, 3, 1000)
ON CONFLICT (code) DO NOTHING;

-- Every new Supabase user gets an isolated free subscription. Billing later
-- updates this row; no payment flow is implied or enabled by this migration.
CREATE OR REPLACE FUNCTION public.assign_default_subscription()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_plan_id UUID;
BEGIN
  SELECT id INTO v_plan_id FROM public.subscription_plans WHERE code = 'free';
  IF v_plan_id IS NOT NULL THEN
    INSERT INTO public.customer_subscriptions (user_id, plan_id)
    VALUES (NEW.id, v_plan_id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_created_assign_subscription ON public.profiles;
CREATE TRIGGER on_profile_created_assign_subscription
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.assign_default_subscription();

INSERT INTO public.customer_subscriptions (user_id, plan_id)
SELECT p.id, plan.id
FROM public.profiles p
CROSS JOIN public.subscription_plans plan
WHERE plan.code = 'free'
ON CONFLICT (user_id) DO NOTHING;

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view active plans"
  ON public.subscription_plans FOR SELECT USING (is_active = true);
CREATE POLICY "Users can view own subscription"
  ON public.customer_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own usage"
  ON public.usage_counters FOR SELECT USING (auth.uid() = user_id);

-- Admin reads and all administrative writes use the server service-role client;
-- no browser policy grants cross-tenant visibility.

-- Promote the first platform operator manually after this migration, e.g.:
-- UPDATE public.profiles SET role = 'admin' WHERE id = '<SUPABASE_AUTH_USER_UUID>';
