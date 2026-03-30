-- Drop old functions if they exist
DROP FUNCTION IF EXISTS get_all_winners();
DROP FUNCTION IF EXISTS get_all_scores_with_user_info();

-- RPC: Fetch all pending scores with user details (Admin Only)
CREATE FUNCTION get_all_scores_with_user_info()
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

-- RPC: Fetch all winners with user and draw details (Admin Only)
CREATE FUNCTION get_all_winners()
RETURNS TABLE (
  id UUID,
  match_type INTEGER,
  amount_won DECIMAL(12, 2),
  payment_status TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  email TEXT,
  winning_numbers JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (SELECT is_admin()) THEN
    RETURN QUERY
    SELECT 
      w.id, w.match_type, w.amount_won, w.payment_status, w.created_at, p.email, d.winning_numbers
    FROM winners w
    JOIN profiles p ON w.user_id = p.id
    JOIN draws d ON w.draw_id = d.id
    ORDER BY w.created_at DESC;
  ELSE
    RAISE EXCEPTION 'Access denied';
  END IF;
END;
$$;