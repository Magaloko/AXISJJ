-- Real subscription tracking. Owner assigns a plan to a member;
-- member dashboard shows own subscription; revenue analytics use real data.

CREATE TABLE IF NOT EXISTS subscriptions (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category         TEXT NOT NULL CHECK (category IN ('students', 'adults', 'kids')),
  duration_months  INT NOT NULL CHECK (duration_months IN (1, 3, 6, 12)),
  price_per_month  NUMERIC(10, 2) NOT NULL,
  start_date       DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date         DATE,
  status           TEXT NOT NULL DEFAULT 'active'
                     CHECK (status IN ('active', 'paused', 'cancelled', 'expired')),
  payment_method   TEXT CHECK (payment_method IN ('sepa', 'bar', 'ueberweisung', 'karte')),
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_profile ON subscriptions(profile_id, status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_active ON subscriptions(status) WHERE status = 'active';

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "subs_select_own" ON subscriptions FOR SELECT
    USING (profile_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "subs_owner_all" ON subscriptions FOR ALL
    USING (get_my_role() = 'owner')
    WITH CHECK (get_my_role() = 'owner');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "subs_coach_read" ON subscriptions FOR SELECT
    USING (get_my_role() IN ('coach', 'owner'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
