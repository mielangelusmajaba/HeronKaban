-- HeronKaban: Row Level Security, helper functions, auth hook, profile trigger, receipt bucket.
-- The app writes through server code (Drizzle, owner role, bypasses RLS) AFTER its own
-- authorization checks. These policies are defense in depth: with the public (publishable)
-- key, a signed-in user can only read what their org role allows, and nobody can write.

-- ───────────── Helper functions (security definer so policies don't recurse) ─────────────

CREATE OR REPLACE FUNCTION public.org_role_rank(r public.org_role)
RETURNS int LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE r WHEN 'president' THEN 4 WHEN 'officer' THEN 3 WHEN 'committee' THEN 2 ELSE 1 END
$$;
--> statement-breakpoint

-- True when the current user is an ACTIVE member of `org` with at least `min_role`.
CREATE OR REPLACE FUNCTION public.has_org_role(org uuid, min_role public.org_role DEFAULT 'member')
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.memberships m
    WHERE m.org_id = org
      AND m.user_id = (SELECT auth.uid())
      AND m.status = 'active'
      AND public.org_role_rank(m.role) >= public.org_role_rank(min_role)
  )
$$;
--> statement-breakpoint
REVOKE EXECUTE ON FUNCTION public.has_org_role(uuid, public.org_role) FROM anon, public;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.has_org_role(uuid, public.org_role) TO authenticated;
--> statement-breakpoint

-- True when the current user shares at least one active org with `other`.
CREATE OR REPLACE FUNCTION public.shares_org_with(other uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.memberships a
    JOIN public.memberships b ON a.org_id = b.org_id
    WHERE a.user_id = (SELECT auth.uid()) AND a.status = 'active'
      AND b.user_id = other AND b.status IN ('active', 'pending')
  )
$$;
--> statement-breakpoint
REVOKE EXECUTE ON FUNCTION public.shares_org_with(uuid) FROM anon, public;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.shares_org_with(uuid) TO authenticated;
--> statement-breakpoint

-- ───────────── Enable RLS everywhere ─────────────

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.orgs ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.ai_checks ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.activity ENABLE ROW LEVEL SECURITY;--> statement-breakpoint

-- ───────────── Read policies (no insert/update/delete policies = no client writes) ─────────────

CREATE POLICY "profiles: self or org-mates" ON public.profiles FOR SELECT TO authenticated
  USING (id = (SELECT auth.uid()) OR public.shares_org_with(id));
--> statement-breakpoint

-- Org directory is visible to every signed-in UMak student, but join_code is column-protected below.
CREATE POLICY "orgs: directory" ON public.orgs FOR SELECT TO authenticated USING (true);
--> statement-breakpoint
REVOKE SELECT ON public.orgs FROM anon, authenticated;
--> statement-breakpoint
GRANT SELECT (id, slug, name, description, college, status, chain_org_id, chain_threshold, chain_signers,
  created_by, verified_at, created_at) ON public.orgs TO authenticated;
--> statement-breakpoint

CREATE POLICY "memberships: own or same org" ON public.memberships FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()) OR public.has_org_role(org_id, 'member'));
--> statement-breakpoint

CREATE POLICY "events: org members" ON public.events FOR SELECT TO authenticated
  USING (public.has_org_role(org_id, 'member'));
--> statement-breakpoint

CREATE POLICY "requests: org members" ON public.requests FOR SELECT TO authenticated
  USING (public.has_org_role(org_id, 'member'));
--> statement-breakpoint

CREATE POLICY "ai_checks: members of an org holding the receipt" ON public.ai_checks FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.requests r WHERE r.receipt_hash = ai_checks.receipt_hash
                 AND public.has_org_role(r.org_id, 'member')));
--> statement-breakpoint

-- Privacy (Architecture §10): a member sees only their own payments by name; the
-- committee and above see the roster for collection purposes. Totals come from the chain.
CREATE POLICY "deposits: own, or committee and above" ON public.deposits FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()) OR public.has_org_role(org_id, 'committee'));
--> statement-breakpoint

CREATE POLICY "activity: org members" ON public.activity FOR SELECT TO authenticated
  USING (public.has_org_role(org_id, 'member'));
--> statement-breakpoint

-- ───────────── Profile row for every new auth user ─────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    lower(NEW.email),
    coalesce(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
--> statement-breakpoint
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
--> statement-breakpoint

-- ───────────── Auth hook: only UMak accounts can be created ─────────────
-- Enable in Supabase Dashboard → Authentication → Hooks → "Before User Created"
-- → Postgres function → public.hook_restrict_signup_domain.
-- Keep the domain in sync with ALLOWED_EMAIL_DOMAIN (the app checks again on the server).

CREATE OR REPLACE FUNCTION public.hook_restrict_signup_domain(event jsonb)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE
  email text := lower(coalesce(event -> 'user' ->> 'email', ''));
BEGIN
  IF email NOT LIKE '%@umak.edu.ph' THEN
    RETURN jsonb_build_object('error', jsonb_build_object(
      'http_code', 403,
      'message', 'Only University of Makati Google accounts (@umak.edu.ph) can use HeronKaban.'
    ));
  END IF;
  RETURN '{}'::jsonb;
END;
$$;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.hook_restrict_signup_domain(jsonb) TO supabase_auth_admin;
--> statement-breakpoint
REVOKE EXECUTE ON FUNCTION public.hook_restrict_signup_domain(jsonb) FROM authenticated, anon, public;
--> statement-breakpoint

-- ───────────── Private receipt bucket (served via short-lived signed URLs) ─────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('receipts', 'receipts', false, 10485760, ARRAY['image/png', 'image/jpeg', 'image/webp'])
ON CONFLICT (id) DO NOTHING;
