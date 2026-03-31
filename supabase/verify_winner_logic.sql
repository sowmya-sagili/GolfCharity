-- ==========================================
-- GOLFCHARITY WINNER VERIFICATION TEST
-- ==========================================
-- This script guarantees a win for 'demo@golfcharity.com'
-- Run this in your Supabase SQL Editor AFTER consolidated_sync.sql

DO $$
DECLARE
    v_user_id UUID;
    v_draw_id UUID;
    v_scores INTEGER[];
    v_winning_numbers JSONB;
BEGIN
    -- 1. Find the Demo User
    SELECT id INTO v_user_id FROM profiles WHERE email = 'demo@golfcharity.com';
    
    IF v_user_id IS NULL THEN
        RAISE NOTICE 'Demo user not found. Please run demo_setup.sql first.';
        RETURN;
    END IF;

    -- 2. Get their last 5 verified scores and map to draw numbers
    -- Logic: (score % 45) + 1
    SELECT ARRAY_AGG((score % 45) + 1) INTO v_scores
    FROM (
        SELECT score FROM golf_scores 
        WHERE user_id = v_user_id AND status = 'verified'
        ORDER BY created_at DESC LIMIT 5
    ) s;

    IF ARRAY_LENGTH(v_scores, 1) < 5 THEN
        RAISE NOTICE 'Demo user does not have 5 verified scores. Adding scores now...';
        INSERT INTO golf_scores (user_id, score, date, status)
        VALUES 
            (v_user_id, 72, CURRENT_DATE, 'verified'),
            (v_user_id, 74, CURRENT_DATE, 'verified'),
            (v_user_id, 71, CURRENT_DATE, 'verified'),
            (v_user_id, 75, CURRENT_DATE, 'verified'),
            (v_user_id, 73, CURRENT_DATE, 'verified');
            
        v_scores := ARRAY[28, 30, 27, 31, 29]; -- Mapped from [72,74,71,75,73]
    END IF;

    -- 3. Create a Perfect Draw (5-Match) for these scores
    v_winning_numbers := to_jsonb(v_scores);
    v_draw_id := gen_random_uuid();

    -- 4. Insert the draw (This triggers on_draw_inserted)
    INSERT INTO draws (id, winning_numbers, draw_date, status, total_pool, jackpot_rollover)
    VALUES (v_draw_id, v_winning_numbers, NOW(), 'finished', 500000.00, 150000.00);

    RAISE NOTICE 'Test Draw Published! ID: %, Winning Numbers: %', v_draw_id, v_winning_numbers;
    RAISE NOTICE 'The Winner Payouts page should now show demo@golfcharity.com as a 5-match winner.';

END $$;
