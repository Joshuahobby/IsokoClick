-- ── Sync auth.users → public.users on signup ────────────────────────
-- orders.customer_id references public.users(id), and the app passes
-- auth.uid() as customer_id, so every profile row must be created with
-- id = auth.users.id. Nothing created these rows until now, which made
-- checkout fail with an FK violation for every signed-up user.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  app_role  text := NEW.raw_app_meta_data->>'role';
  user_role text := NEW.raw_user_meta_data->>'role';
  resolved_role text;
BEGIN
  -- Privileged roles are only honored from app_metadata, which can be set
  -- exclusively with the service key (admin API). user_metadata is
  -- client-controlled at signup, so it may only pick self-service roles —
  -- anything else would let anyone sign up as admin.
  IF app_role IN ('customer','b2b_customer','partner',
                  'warehouse_staff','delivery_agent','admin') THEN
    resolved_role := app_role;
  ELSIF user_role IN ('customer','b2b_customer') THEN
    resolved_role := user_role;
  ELSE
    resolved_role := 'customer';
  END IF;

  INSERT INTO public.users (id, auth_id, email, phone, full_name, role)
  VALUES (
    NEW.id,
    NEW.id,
    -- public.users.email is NOT NULL; auth users from future phone-based
    -- signups have no email, so fall back to a per-user placeholder.
    COALESCE(NEW.email, NEW.id::text || '@placeholder.invalid'),
    NEW.phone,
    COALESCE(
      NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
      split_part(NEW.email, '@', 1),
      'Customer'
    ),
    resolved_role
  )
  ON CONFLICT (auth_id) DO NOTHING;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- A throwing trigger on auth.users blocks ALL signups platform-wide.
  -- Losing a profile row is recoverable (re-run the backfill below);
  -- losing the ability to sign up is not.
  RAISE WARNING 'handle_new_user failed for auth user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;

CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── Backfill: profile rows for auth users that predate the trigger ──
INSERT INTO public.users (id, auth_id, email, phone, full_name, role)
SELECT
  au.id,
  au.id,
  COALESCE(au.email, au.id::text || '@placeholder.invalid'),
  au.phone,
  COALESCE(
    NULLIF(TRIM(au.raw_user_meta_data->>'full_name'), ''),
    split_part(au.email, '@', 1),
    'Customer'
  ),
  CASE
    WHEN au.raw_app_meta_data->>'role' IN ('customer','b2b_customer','partner',
                                           'warehouse_staff','delivery_agent','admin')
      THEN au.raw_app_meta_data->>'role'
    WHEN au.raw_user_meta_data->>'role' IN ('customer','b2b_customer')
      THEN au.raw_user_meta_data->>'role'
    ELSE 'customer'
  END
FROM auth.users au
LEFT JOIN public.users pu ON pu.auth_id = au.id
WHERE pu.id IS NULL;
