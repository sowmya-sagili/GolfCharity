-- ==========================================
-- GOLFCHARITY DRAW ENGINE & RPC
-- ==========================================

-- 1. Ensure table schema consistency for the draw engine
ALTER TABLE public.draws ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'finished';
ALTER TABLE public.draws ADD COLUMN IF NOT EXISTS total_pool DECIMAL(12, 2) DEFAULT 0;
ALTER TABLE public.draws ADD COLUMN IF NOT EXISTS jackpot_rollover DECIMAL(12, 2) DEFAULT 0;

ALTER TABLE public.winners ADD COLUMN IF NOT EXISTS amount_won DECIMAL(12, 2) DEFAULT 0;

-- 2. Create the draw results generation function
-- This identifies winners based on their rolling 5 verified scores.
CREATE OR REPLACE FUNCTION public.generate_draw_results(p_draw_id UUID, p_winning_numbers JSONB)
RETURNS VOID AS $$
DECLARE
    user_record RECORD;
    score_record RECORD;
    match_count INTEGER;
    user_draw_numbers INTEGER[];
    win_number INTEGER;
    winning_nums INTEGER[];
    tier_amount DECIMAL(12, 2);
BEGIN
    -- Admin permission check using non-recursive helper
    IF NOT (SELECT is_admin()) THEN
        RAISE EXCEPTION 'Access denied: Admin role required.';
    END IF;

    -- Convert JSONB array to PostgreSQL integer array for matching
    SELECT ARRAY_AGG(x::INT) INTO winning_nums FROM JSONB_ARRAY_ELEMENTS(p_winning_numbers) x;

    -- Iterate through all active subscribers
    -- We join profiles and score counts to identify eligible participants
    FOR user_record IN 
        SELECT p.id, p.email 
        FROM profiles p
        WHERE p.subscription_status = 'active'
    LOOP
        -- Fetch the 5 most recent VERIFIED scores for this user
        user_draw_numbers := ARRAY[]::INTEGER[];
        FOR score_record IN 
            SELECT score FROM golf_scores 
            WHERE user_id = user_record.id AND status = 'verified'
            ORDER BY created_at DESC LIMIT 5
        LOOP
            -- Mapping logic: Convert golf score (60-100) to draw number (1-45)
            -- Using MOD(score, 45) + 1 ensures a uniform distribution within the range.
            user_draw_numbers := user_draw_numbers || ((score_record.score % 45) + 1);
        END LOOP;

        -- Participant is ELIGIBLE only if they have exactly 5 verified scores
        IF ARRAY_LENGTH(user_draw_numbers, 1) = 5 THEN
            match_count := 0;
            -- Count how many of their mapped numbers match the winning numbers
            FOREACH win_number IN ARRAY winning_nums LOOP
                IF win_number = ANY(user_draw_numbers) THEN
                    match_count := match_count + 1;
                END IF;
            END LOOP;

            -- Reward winners based on match tier (3, 4, or 5 matches)
            IF match_count >= 3 THEN
                tier_amount := CASE 
                    WHEN match_count = 5 THEN 180000.00 -- Jackpot
                    WHEN match_count = 4 THEN 12500.00   -- Mid tier
                    WHEN match_count = 3 THEN 1240.50    -- Mini tier
                    ELSE 0
                END;

                -- Record the win
                INSERT INTO winners (user_id, draw_id, match_type, amount_won, payment_status, created_at)
                VALUES (user_record.id, p_draw_id, match_count, tier_amount, 'pending', NOW());
            END IF;
        END IF;
    END LOOP;

    -- Update the draw status to finalize the record
    UPDATE draws SET status = 'finished' WHERE id = p_draw_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Grant permissions to authenticated users to call the RPC
GRANT EXECUTE ON FUNCTION public.generate_draw_results(UUID, JSONB) TO authenticated;
