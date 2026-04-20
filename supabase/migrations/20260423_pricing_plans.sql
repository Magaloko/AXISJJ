-- Editable pricing plans. Previously hardcoded in lib/pricing.ts.
-- Landing page and /preise read from this table.

CREATE TABLE IF NOT EXISTS pricing_plans (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category        TEXT NOT NULL CHECK (category IN ('students', 'adults', 'kids')),
  duration_months INT NOT NULL CHECK (duration_months IN (1, 3, 6, 12)),
  price_per_month NUMERIC(10, 2) NOT NULL,
  total_price     NUMERIC(10, 2),
  highlighted     BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(category, duration_months)
);

ALTER TABLE pricing_plans ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "pricing_public_read" ON pricing_plans FOR SELECT USING (TRUE);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "pricing_owner_write" ON pricing_plans FOR ALL
    USING (get_my_role() = 'owner')
    WITH CHECK (get_my_role() = 'owner');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Seed with the existing hardcoded values
INSERT INTO pricing_plans (category, duration_months, price_per_month, total_price, highlighted) VALUES
  ('students', 12, 70,  840,  TRUE),
  ('students', 6,  80,  480,  FALSE),
  ('students', 3,  90,  270,  FALSE),
  ('students', 1,  100, NULL, FALSE),
  ('adults',   12, 80,  960,  TRUE),
  ('adults',   6,  90,  540,  FALSE),
  ('adults',   3,  100, 300,  FALSE),
  ('adults',   1,  110, NULL, FALSE),
  ('kids',     12, 60,  720,  TRUE),
  ('kids',     6,  70,  420,  FALSE),
  ('kids',     3,  80,  240,  FALSE),
  ('kids',     1,  90,  NULL, FALSE)
ON CONFLICT (category, duration_months) DO NOTHING;
