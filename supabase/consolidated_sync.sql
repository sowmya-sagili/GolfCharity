-- ==========================================
-- GOLFCHARITY CONSOLIDATED DATABASE SYNC (V2)
-- ==========================================
-- This script contains EVERY function and schema update needed for the 
-- Admin Dashboard, Draw Engine, and Winner Verification system.

-- 1. Schema Extensions & Table Updates
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Ensure draws table has latest columns
ALTER TABLE public.draws DROP CONSTRAINT IF EXISTS draws_status_check;
ALTER TABLE public.draws ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'finished';
ALTER TABLE public.draws ADD COLUMN IF NOT EXISTS total_pool DECIMAL(12, 2) DEFAULT 0;
ALTER TABLE public.draws ADD COLUMN IF NOT EXISTS jackpot_rollover DECIMAL(12, 2) DEFAULT 0;
ALTER TABLE public.golf_scores ADD COLUMN IF NOT EXISTS proof_url TEXT;

-- Ensure winners table has latest columns
ALTER TABLE public.winners ADD COLUMN IF NOT EXISTS amount_won DECIMAL(12, 2) DEFAULT 0;
ALTER TABLE public.winners ADD COLUMN IF NOT EXISTS user_scores INTEGER[] DEFAULT '{}';
ALTER TABLE public.winners ADD COLUMN IF NOT EXISTS user_numbers INTEGER[] DEFAULT '{}';
ALTER TABLE public.winners ADD COLUMN IF NOT EXISTS proof_url TEXT;

-- 2. Core Admin Helper (Non-Recursive)
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2.1. RPC: Get all profiles (Admin Only)
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

-- 2.2. RPC: Get all scores (Admin Only)
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

-- 2.3. RPC: Get all winners (Admin Only) - BASE SETOF VERSION
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

-- 3. RPC: Fetch all winners with user and draw details (Admin View)
DROP FUNCTION IF EXISTS public.get_all_winners() CASCADE;
CREATE OR REPLACE FUNCTION public.get_all_winners()
RETURNS TABLE (
  id UUID,
  match_type INTEGER,
  amount_won DECIMAL(12, 2),
  payment_status TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  email TEXT,
  winning_numbers JSONB,
  user_scores INTEGER[],
  user_numbers INTEGER[],
  proof_url TEXT
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF (SELECT is_admin()) THEN
    RETURN QUERY
    SELECT 
      w.id, w.match_type, w.amount_won, w.payment_status, w.created_at, p.email, d.winning_numbers, w.user_scores, w.user_numbers, w.proof_url
    FROM winners w
    JOIN profiles p ON w.user_id = p.id
    JOIN draws d ON w.draw_id = d.id
    ORDER BY w.created_at DESC;
  ELSE
    RAISE EXCEPTION 'Access denied';
  END IF;
END;
$$;

-- 4. RPC: Fetch all pending scores with user info (Admin View)
DROP FUNCTION IF EXISTS public.get_all_scores_with_user_info() CASCADE;
CREATE OR REPLACE FUNCTION public.get_all_scores_with_user_info()
RETURNS TABLE (
  id UUID,
  score INTEGER,
  date DATE,
  status TEXT,
  email TEXT,
  proof_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF (SELECT is_admin()) THEN
    RETURN QUERY
    SELECT 
      s.id, s.score, s.date, s.status, p.email, s.proof_url, s.created_at
    FROM golf_scores s
    JOIN profiles p ON s.user_id = p.id
    WHERE s.status = 'pending'
    ORDER BY s.created_at ASC;
  ELSE
    RAISE EXCEPTION 'Access denied';
  END IF;
END;
$$;

-- 5. Trigger Handler: Automatic Winner on Draw Generation
DROP FUNCTION IF EXISTS public.on_draw_inserted() CASCADE;
CREATE OR REPLACE FUNCTION public.on_draw_inserted()
RETURNS TRIGGER AS $$
DECLARE
    user_record RECORD;
    score_record RECORD;
    match_count INTEGER;
    user_draw_numbers INTEGER[];
    win_number INTEGER;
    winning_nums INTEGER[];
    tier_amount DECIMAL(12, 2);
    user_scores INTEGER[];
BEGIN
    IF NEW.winning_numbers IS NULL THEN RETURN NEW; END IF;
    SELECT ARRAY_AGG(x::INT) INTO winning_nums FROM JSONB_ARRAY_ELEMENTS(NEW.winning_numbers) x;

    FOR user_record IN SELECT id FROM profiles WHERE subscription_status = 'active' LOOP
        user_draw_numbers := ARRAY[]::INTEGER[];
        FOR score_record IN SELECT score, proof_url FROM golf_scores WHERE user_id = user_record.id AND status = 'verified' ORDER BY created_at DESC LIMIT 5 LOOP
            user_draw_numbers := user_draw_numbers || ((score_record.score % 45) + 1);
        END LOOP;

        IF ARRAY_LENGTH(user_draw_numbers, 1) = 5 THEN
            match_count := 0;
            FOREACH win_number IN ARRAY winning_nums LOOP IF win_number = ANY(user_draw_numbers) THEN match_count := match_count + 1; END IF; END LOOP;

            IF match_count >= 3 THEN
                tier_amount := CASE WHEN match_count = 5 THEN 180000.00 WHEN match_count = 4 THEN 12500.00 WHEN match_count = 3 THEN 1240.50 ELSE 0 END;
                -- Collect actual raw scores for storage
                SELECT ARRAY_AGG(score) INTO user_scores FROM (
                  SELECT score FROM golf_scores WHERE user_id = user_record.id AND status = 'verified' ORDER BY created_at DESC LIMIT 5
                ) s;

                INSERT INTO winners (user_id, draw_id, match_type, amount_won, user_scores, user_numbers, proof_url, payment_status, created_at)
                VALUES (user_record.id, NEW.id, match_count, tier_amount, user_scores, user_draw_numbers, (SELECT proof_url FROM golf_scores WHERE user_id = user_record.id AND status = 'verified' ORDER BY created_at DESC LIMIT 1), 'pending', NOW());
            END IF;
        END IF;
    END LOOP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trig_auto_check_winners_on_draw ON public.draws;
CREATE TRIGGER trig_auto_check_winners_on_draw AFTER INSERT ON public.draws FOR EACH ROW EXECUTE FUNCTION public.on_draw_inserted();

-- 6. Trigger Handler: Automatic Winner Detection on Score Approval
DROP FUNCTION IF EXISTS public.check_for_win_on_approval() CASCADE;
CREATE OR REPLACE FUNCTION public.check_for_win_on_approval()
RETURNS TRIGGER AS $$
DECLARE
    score_record RECORD;
    latest_draw_record RECORD;
    match_count INTEGER;
    user_draw_numbers INTEGER[];
    win_number INTEGER;
    winning_nums INTEGER[];
    tier_amount DECIMAL(12, 2);
    user_scores INTEGER[];
BEGIN
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = NEW.user_id AND subscription_status = 'active') THEN RETURN NEW; END IF;
    SELECT id, winning_numbers INTO latest_draw_record FROM draws ORDER BY draw_date DESC LIMIT 1;
    IF NOT FOUND THEN RETURN NEW; END IF;
    IF EXISTS (SELECT 1 FROM winners WHERE user_id = NEW.user_id AND draw_id = latest_draw_record.id) THEN RETURN NEW; END IF;

    user_draw_numbers := ARRAY[]::INTEGER[];
    FOR score_record IN SELECT score FROM golf_scores WHERE user_id = NEW.user_id AND status = 'verified' ORDER BY created_at DESC LIMIT 5 LOOP
        user_draw_numbers := user_draw_numbers || ((score_record.score % 45) + 1);
    END LOOP;

    IF ARRAY_LENGTH(user_draw_numbers, 1) = 5 THEN
        SELECT ARRAY_AGG(x::INT) INTO winning_nums FROM JSONB_ARRAY_ELEMENTS(latest_draw_record.winning_numbers) x;
        match_count := 0;
        FOREACH win_number IN ARRAY winning_nums LOOP IF win_number = ANY(user_draw_numbers) THEN match_count := match_count + 1; END IF; END LOOP;
        IF match_count >= 3 THEN
            tier_amount := CASE WHEN match_count = 5 THEN 180000.00 WHEN match_count = 4 THEN 12500.00 WHEN match_count = 3 THEN 1240.50 ELSE 0 END;
            -- Collect actual raw scores for storage
            SELECT ARRAY_AGG(score) INTO user_scores FROM (
                SELECT score FROM golf_scores WHERE user_id = NEW.user_id AND status = 'verified' ORDER BY created_at DESC LIMIT 5
            ) s;

            INSERT INTO winners (user_id, draw_id, match_type, amount_won, user_scores, user_numbers, proof_url, payment_status, created_at)
            VALUES (NEW.user_id, latest_draw_record.id, match_count, tier_amount, user_scores, user_draw_numbers, NEW.proof_url, 'pending', NOW());
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trig_check_winner ON public.golf_scores;
CREATE TRIGGER trig_check_winner AFTER UPDATE ON public.golf_scores FOR EACH ROW WHEN (NEW.status = 'verified' AND (OLD.status IS DISTINCT FROM 'verified')) EXECUTE FUNCTION public.check_for_win_on_approval();

-- 7. Admin RLS Policies (Fix for Row Violates RLS)
ALTER TABLE public.draws ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.winners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins_draw_all" ON public.draws;
CREATE POLICY "admins_draw_all" ON public.draws FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "admins_winners_all" ON public.winners;
CREATE POLICY "admins_winners_all" ON public.winners FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "public_view_draws" ON public.draws;
CREATE POLICY "public_view_draws" ON public.draws FOR SELECT USING (true);

DROP POLICY IF EXISTS "owner_view_win" ON public.winners;
CREATE POLICY "owner_view_win" ON public.winners FOR SELECT USING (auth.uid() = user_id);

-- 7.1. Golf Scores RLS Policies
ALTER TABLE public.golf_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins_scores_all" ON public.golf_scores;
CREATE POLICY "admins_scores_all" ON public.golf_scores FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "owner_scores_all" ON public.golf_scores;
CREATE POLICY "owner_scores_all" ON public.golf_scores FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 8. Final Permissions
GRANT ALL ON public.draws TO authenticated;
GRANT ALL ON public.winners TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- 9. Storage Initialization (Proofs Bucket)
-- Ensure the storage bucket exists for scorecard screenshots
INSERT INTO storage.buckets (id, name, public)
VALUES ('proofs', 'proofs', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies: Internal helpers for bucket access
DROP POLICY IF EXISTS "public_view_proofs" ON storage.objects;
CREATE POLICY "public_view_proofs" ON storage.objects FOR SELECT USING (bucket_id = 'proofs');

DROP POLICY IF EXISTS "auth_upload_proofs" ON storage.objects;
CREATE POLICY "auth_upload_proofs" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'proofs' AND auth.role() = 'authenticated');

-- 10. Data Patch: Populate existing null proofs with a high-res placeholder for verification
-- Use a professional golf scorecard image from Unsplash as a sample
UPDATE public.golf_scores 
SET proof_url = 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?auto=format&fit=crop&q=80&w=800'
WHERE proof_url IS NULL OR proof_url = '';

UPDATE public.winners 
SET proof_url = 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?auto=format&fit=crop&q=80&w=800'
WHERE proof_url IS NULL OR proof_url = '';
