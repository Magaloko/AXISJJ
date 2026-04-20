-- Prevent duplicate leads by email. Existing duplicates are kept (we only
-- dedupe future inserts). Uses a partial index to allow multiple rows with
-- status='converted' (rare, but ex-leads who convert shouldn't block new ones).

-- Remove older duplicates, keeping the most recent one per email
DELETE FROM leads a
USING leads b
WHERE a.email = b.email
  AND a.created_at < b.created_at;

-- Unique constraint on email for open (non-converted, non-lost) leads
CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_unique_open_email
  ON leads(LOWER(email))
  WHERE status IN ('new', 'contacted');
