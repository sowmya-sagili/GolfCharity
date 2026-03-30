-- Define is_admin helper function for RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT role = 'admin'
    FROM profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix RLS policies to use auth.uid() = user_id pattern
-- Ensure all tables exist in the public schema
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.golf_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.winners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.charities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.draws ENABLE ROW LEVEL SECURITY;

-- 1. Profiles: Users can view their own profile, Admins view all
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles
FOR SELECT USING (auth.uid() = id OR is_admin());

-- 2. Golf Scores: Users view their own, Admins view all
DROP POLICY IF EXISTS "Users can view their own scores" ON public.golf_scores;
CREATE POLICY "Users can view their own scores" ON public.golf_scores
FOR SELECT USING (auth.uid() = user_id OR is_admin());

-- 3. Winners: Users view their own winnings, Admins view all
DROP POLICY IF EXISTS "Users can view their own winnings" ON public.winners;
CREATE POLICY "Users can view their own winnings" ON public.winners
FOR SELECT USING (auth.uid() = user_id OR is_admin());

-- 4. Charities: Anyone can view, Admins can manage
DROP POLICY IF EXISTS "Anyone can view charities" ON public.charities;
CREATE POLICY "Anyone can view charities" ON public.charities
FOR SELECT USING (true);

-- 5. Draws: Anyone can view draws
DROP POLICY IF EXISTS "Anyone can view draws" ON public.draws;
CREATE POLICY "Anyone can view draws" ON public.draws
FOR SELECT USING (true);

-- Ensure authenticated role has usage on the schema
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
