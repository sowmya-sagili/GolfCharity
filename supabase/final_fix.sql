-- ==========================================
-- NUCLEAR CLEANUP: BREAKING ALL RLS RECURSION
-- ==========================================

-- 1. Use a dynamic DO block to drop EVERY SINGLE policy on the problematic tables.
-- This is foolproof and catches policies with names we might not know.
DO $$ 
DECLARE 
    pol record;
BEGIN 
    -- Drop all policies on profiles
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public' LOOP 
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol.policyname); 
    END LOOP; 
    
    -- Drop all policies on golf_scores
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'golf_scores' AND schemaname = 'public' LOOP 
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.golf_scores', pol.policyname); 
    END LOOP;

    -- Drop all policies on winners
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'winners' AND schemaname = 'public' LOOP 
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.winners', pol.policyname); 
    END LOOP;
END $$;

-- 2. Force-drop the problematic function and everything that might still use it
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;

-- 3. Recreate a safe, non-recursive is_admin helper
-- SECURITY DEFINER allows it to bypass RLS when checking the profiles table.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. RPC: Get all profiles (Admin Only)
DROP FUNCTION IF EXISTS public.get_all_profiles_for_admin();
CREATE OR REPLACE FUNCTION public.get_all_profiles_for_admin()
RETURNS TABLE (
  id uuid,
  subscription_status text,
  current_charity_id uuid,
  charity_percentage int,
  is_admin boolean,
  email text,
  created_at timestamptz
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF (SELECT is_admin()) THEN
    RETURN QUERY SELECT p.id, p.subscription_status, p.current_charity_id, p.charity_percentage, p.is_admin, p.email, p.created_at FROM public.profiles p;
  ELSE
    RAISE EXCEPTION 'Access denied';
  END IF;
END;
$$;

-- 5. RPC: Get all scores (Admin Only)
DROP FUNCTION IF EXISTS public.get_all_scores_admin();
CREATE OR REPLACE FUNCTION public.get_all_scores_admin()
RETURNS SETOF public.golf_scores LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF (SELECT is_admin()) THEN
    RETURN QUERY SELECT * FROM public.golf_scores ORDER BY created_at DESC;
  ELSE
    RAISE EXCEPTION 'Access denied';
  END IF;
END;
$$;

-- 6. RPC: Get all winners (Admin Only)
DROP FUNCTION IF EXISTS public.get_all_winners_admin();
CREATE OR REPLACE FUNCTION public.get_all_winners_admin()
RETURNS SETOF public.winners LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF (SELECT is_admin()) THEN
    RETURN QUERY SELECT * FROM public.winners ORDER BY created_at DESC;
  ELSE
    RAISE EXCEPTION 'Access denied';
  END IF;
END;
$$;

-- 7. RPC: Fetch all pending scores with user details (Admin Only)
DROP FUNCTION IF EXISTS public.get_all_scores_with_user_info();
CREATE OR REPLACE FUNCTION public.get_all_scores_with_user_info()
RETURNS TABLE (
  id UUID,
  score INTEGER,
  date DATE,
  status TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (SELECT is_admin()) THEN
    RETURN QUERY
    SELECT 
      s.id, s.score, s.date, s.status, p.email, s.created_at
    FROM golf_scores s
    JOIN profiles p ON s.user_id = p.id
    WHERE s.status = 'pending'
    ORDER BY s.created_at ASC;
  ELSE
    RAISE EXCEPTION 'Access denied';
  END IF;
END;
$$;

-- 8. RPC: Fetch all winners with user and draw details (Admin Only)
DROP FUNCTION IF EXISTS public.get_all_winners();
CREATE OR REPLACE FUNCTION public.get_all_winners()
RETURNS TABLE (
  id UUID,
  match_type INTEGER,
  payment_status TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  email TEXT,
  winning_numbers JSONB,
  user_scores INTEGER[],
  user_numbers INTEGER[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (SELECT is_admin()) THEN
    RETURN QUERY
    SELECT 
      w.id, w.match_type, w.payment_status, w.created_at, p.email, d.winning_numbers, w.user_scores, w.user_numbers
    FROM winners w
    JOIN profiles p ON w.user_id = p.id
    JOIN draws d ON w.draw_id = d.id
    ORDER BY w.created_at DESC;
  ELSE
    RAISE EXCEPTION 'Access denied';
  END IF;
END;
$$;

-- 9. Recreate Clean, Non-Recursive RLS Policies (Owner ONLY)
-- Admins MUST use the RPC functions above to bypass these.

-- Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "owner_view" ON public.profiles;
CREATE POLICY "owner_view" ON public.profiles FOR SELECT USING (auth.uid() = id);

-- Golf Scores
ALTER TABLE public.golf_scores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "owner_all" ON public.golf_scores;
CREATE POLICY "owner_all" ON public.golf_scores FOR ALL USING (auth.uid() = user_id);

-- Winners
ALTER TABLE public.winners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "owner_view_win" ON public.winners;
CREATE POLICY "owner_view_win" ON public.winners FOR SELECT USING (auth.uid() = user_id);

-- Public charities/draws
ALTER TABLE public.charities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_view" ON public.charities;
CREATE POLICY "public_view" ON public.charities FOR SELECT USING (true);

ALTER TABLE public.draws ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_view_draws" ON public.draws;
CREATE POLICY "public_view_draws" ON public.draws FOR SELECT USING (true);

-- 10. Final Permissions Check
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
