-- ==========================================
-- GOLFCHARITY DEMO SETUP SCRIPT
-- ==========================================

-- 1. Enable pgcrypto for password hashing if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Define standard UUIDs for our demo accounts to ensure consistency
DO $$
DECLARE
    admin_id uuid := '84ba3ba1-20e3-4a34-966f-048f426e0f05';
    demo_user_id uuid := 'e6697cee-d058-4197-97fc-b9d75c2b1a12';
    charity_1_id uuid := '11111111-1111-1111-1111-111111111111';
    charity_2_id uuid := '22222222-2222-2222-2222-222222222222';
    draw_id uuid := '33333333-3333-3333-3333-333333333333';
BEGIN
    -- INSERT ADMIN ACCOUNT
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@golfcharity.com') THEN
        INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, role)
        VALUES (
            admin_id,
            '84ba3ba1-20e3-4a34-966f-048f426e0f05',
            'admin@golfcharity.com',
            crypt('Demo1234', gen_salt('bf')),
            now(),
            now(),
            now(),
            '{"provider":"email","providers":["email"]}',
            '{"full_name":"Admin User"}',
            false,
            'authenticated'
        );
    END IF;

    -- INSERT DEMO USER ACCOUNT
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'demo@golfcharity.com') THEN
        INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, role)
        VALUES (
            demo_user_id,
            'e6697cee-d058-4197-97fc-b9d75c2b1a12',
            'demo@golfcharity.com',
            crypt('Demo1234', gen_salt('bf')),
            now(),
            now(),
            now(),
            '{"provider":"email","providers":["email"]}',
            '{"full_name":"Demo Golfer"}',
            false,
            'authenticated'
        );
    END IF;

    -- ENSURE PROFILES EXIST (In case no trigger exists)
    INSERT INTO public.profiles (id, email, is_admin, subscription_status, charity_percentage)
    VALUES (admin_id, 'admin@golfcharity.com', true, 'active', 20)
    ON CONFLICT (id) DO UPDATE SET is_admin = true, subscription_status = 'active';

    INSERT INTO public.profiles (id, email, is_admin, subscription_status, charity_percentage, current_charity_id)
    VALUES (demo_user_id, 'demo@golfcharity.com', false, 'active', 15, charity_1_id)
    ON CONFLICT (id) DO UPDATE SET is_admin = false, subscription_status = 'active';

    -- INSERT SAMPLE CHARITIES
    INSERT INTO public.charities (id, name, description, total_raised)
    VALUES 
        (charity_1_id, 'Golf for Good', 'Supporting youth sports programs and community health initiatives through the game of golf.', 1250500),
        (charity_2_id, 'Fairway Futures', 'Environmental conservation and sustainable management of local wildlife corridors.', 840200)
    ON CONFLICT (id) DO NOTHING;

    -- INSERT ROLLING 5 SCORES FOR DEMO USER (To make them "Qualified")
    -- This makes the demo dashboard look active
    INSERT INTO public.golf_scores (user_id, score, date, status)
    VALUES 
        (demo_user_id, 72, CURRENT_DATE - INTERVAL '10 days', 'verified'),
        (demo_user_id, 74, CURRENT_DATE - INTERVAL '7 days', 'verified'),
        (demo_user_id, 71, CURRENT_DATE - INTERVAL '5 days', 'verified'),
        (demo_user_id, 75, CURRENT_DATE - INTERVAL '3 days', 'verified'),
        (demo_user_id, 73, CURRENT_DATE - INTERVAL '1 day', 'verified')
    ON CONFLICT DO NOTHING;

    -- INSERT A SAMPLE DRAW (April 2026)
    INSERT INTO public.draws (id, winning_numbers, draw_date)
    VALUES (draw_id, '[12, 24, 33, 45, 52]', '2026-04-01')
    ON CONFLICT (id) DO NOTHING;

    -- INSERT WINNINGS FOR DEMO USER (Total 2,500)
    INSERT INTO public.winners (user_id, draw_id, match_type, amount_won, payment_status, created_at)
    VALUES 
        (demo_user_id, draw_id, 4, 1250.00, 'paid', CURRENT_DATE - INTERVAL '30 days'),
        (demo_user_id, draw_id, 3, 1250.00, 'paid', CURRENT_DATE - INTERVAL '60 days')
    ON CONFLICT DO NOTHING;

END $$;
