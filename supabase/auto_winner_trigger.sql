-- ==========================================
-- GOLFCHARITY AUTOMATIC WINNER DETECTION
-- ==========================================

-- 1. Create the winner detection function
CREATE OR REPLACE FUNCTION public.check_for_win_on_approval()
RETURNS TRIGGER AS $$
DECLARE
    user_record RECORD;
    score_record RECORD;
    latest_draw_record RECORD;
    match_count INTEGER;
    user_draw_numbers INTEGER[];
    win_number INTEGER;
    winning_nums INTEGER[];
    tier_amount DECIMAL(12, 2);
BEGIN
    -- Only proceed if the user is an active subscriber
    SELECT id, email INTO user_record FROM profiles WHERE id = NEW.user_id AND subscription_status = 'active';
    IF NOT FOUND THEN
        RETURN NEW;
    END IF;

    -- Find the LATEST completed draw to compare against
    SELECT id, winning_numbers INTO latest_draw_record FROM draws ORDER BY draw_date DESC LIMIT 1;
    IF NOT FOUND THEN
        RETURN NEW;
    END IF;

    -- PREVENT DUPLICATE WINS: Check if the user has already won for THIS draw
    -- This ensures a user doesn't win multiple times in the same month
    IF EXISTS (SELECT 1 FROM winners WHERE user_id = NEW.user_id AND draw_id = latest_draw_record.id) THEN
        RETURN NEW;
    END IF;

    -- Fetch the 5 most recent VERIFIED scores for this user (including the one just approved)
    user_draw_numbers := ARRAY[]::INTEGER[];
    FOR score_record IN 
        SELECT score FROM golf_scores 
        WHERE user_id = NEW.user_id AND status = 'verified'
        ORDER BY created_at DESC LIMIT 5
    LOOP
        -- Mapping logic: Convert golf score (60-100) to draw number (1-45)
        user_draw_numbers := user_draw_numbers || ((score_record.score % 45) + 1);
    END LOOP;

    -- Participant is ELIGIBLE only if they have exactly 5 verified scores
    IF ARRAY_LENGTH(user_draw_numbers, 1) = 5 THEN
        -- Convert JSONB winning numbers to INTEGER array
        SELECT ARRAY_AGG(x::INT) INTO winning_nums FROM JSONB_ARRAY_ELEMENTS(latest_draw_record.winning_numbers) x;

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
            VALUES (NEW.user_id, latest_draw_record.id, match_count, tier_amount, 'pending', NOW());
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Create the trigger on golf_scores table
DROP TRIGGER IF EXISTS trig_check_winner ON public.golf_scores;
CREATE TRIGGER trig_check_winner
AFTER UPDATE ON public.golf_scores
FOR EACH ROW
WHEN (NEW.status = 'verified' AND (OLD.status IS DISTINCT FROM 'verified'))
EXECUTE FUNCTION public.check_for_win_on_approval();
