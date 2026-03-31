-- ==========================================
-- GOLFCHARITY AUTOMATIC WINNER DETECTION ON DRAW
-- ==========================================

-- 1. Create the winner detection function for the trigger
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
BEGIN
    -- Only proceed if the draw has winning numbers
    IF NEW.winning_numbers IS NULL THEN
        RETURN NEW;
    END IF;

    -- Convert JSONB winning numbers to INTEGER array for faster matching
    SELECT ARRAY_AGG(x::INT) INTO winning_nums FROM JSONB_ARRAY_ELEMENTS(NEW.winning_numbers) x;

    -- Iterate through all active subscribers
    FOR user_record IN 
        SELECT id, email FROM profiles WHERE subscription_status = 'active'
    LOOP
        -- Fetch the 5 most recent VERIFIED scores for this user
        user_draw_numbers := ARRAY[]::INTEGER[];
        FOR score_record IN 
            SELECT score FROM golf_scores 
            WHERE user_id = user_record.id AND status = 'verified'
            ORDER BY created_at DESC LIMIT 5
        LOOP
            -- Mapping logic: Convert golf score (60-100) to draw number (1-45)
            user_draw_numbers := user_draw_numbers || ((score_record.score % 45) + 1);
        END LOOP;

        -- Participant is ELIGIBLE only if they have exactly 5 verified scores
        IF ARRAY_LENGTH(user_draw_numbers, 1) = 5 THEN
            match_count := 0;
            -- Count matches
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

                -- Record the win automatically
                INSERT INTO winners (user_id, draw_id, match_type, amount_won, payment_status, created_at)
                VALUES (user_record.id, NEW.id, match_count, tier_amount, 'pending', NOW());
            END IF;
        END IF;
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Create the trigger on draws table
DROP TRIGGER IF EXISTS trig_auto_check_winners_on_draw ON public.draws;
CREATE TRIGGER trig_auto_check_winners_on_draw
AFTER INSERT ON public.draws
FOR EACH ROW
EXECUTE FUNCTION public.on_draw_inserted();
