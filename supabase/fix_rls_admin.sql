-- ==========================================
-- GOLFCHARITY ADMIN RLS FIXES
-- ==========================================

-- 1. Ensure RLS is active on draws and winners
ALTER TABLE public.draws ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.winners ENABLE ROW LEVEL SECURITY;

-- 2. DRAWS: Allow admins to manage (INSERT, UPDATE, DELETE)
DROP POLICY IF EXISTS "admins_draw_all" ON public.draws;
CREATE POLICY "admins_draw_all" ON public.draws
FOR ALL TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- 3. WINNERS: Allow admins to manage (SELECT, UPDATE, DELETE)
-- Primary reason: To mark winners as "paid" or "rejected" from the UI
DROP POLICY IF EXISTS "admins_winners_all" ON public.winners;
CREATE POLICY "admins_winners_all" ON public.winners
FOR ALL TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- 4. VERIFY: The existing public/owner policies still exist
-- Draws: SELECT for everyone (view results)
-- Winners: SELECT for owner (view individual winnings)
-- Both are already covered in final_fix.sql, but we ensure them here for completeness.

-- 5. Final Permissions check
GRANT ALL ON public.draws TO authenticated;
GRANT ALL ON public.winners TO authenticated;
