-- Gym Settings: singleton row for gym-level configuration.
-- The CHECK constraint enforces id = 1 so only one row ever exists.
-- RLS: readable by everyone (anon included), writable only by owner role.

CREATE TABLE gym_settings (
  id                   INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  name                 TEXT NOT NULL DEFAULT 'AXIS Jiu-Jitsu',
  address_line1        TEXT,
  address_line2        TEXT,
  postal_code          TEXT,
  city                 TEXT,
  country              TEXT DEFAULT 'Österreich',
  phone                TEXT,
  email                TEXT,
  website              TEXT,
  opening_hours        JSONB NOT NULL DEFAULT '{
    "mon": {"open": "16:00", "close": "22:00", "closed": false},
    "tue": {"open": "16:00", "close": "22:00", "closed": false},
    "wed": {"open": "16:00", "close": "22:00", "closed": false},
    "thu": {"open": "16:00", "close": "22:00", "closed": false},
    "fri": {"open": "16:00", "close": "22:00", "closed": false},
    "sat": {"open": "10:00", "close": "14:00", "closed": false},
    "sun": {"open": null, "close": null, "closed": true}
  }'::jsonb,
  house_rules          TEXT,
  cancellation_policy  TEXT,
  pricing_info         TEXT,
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO gym_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

ALTER TABLE gym_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gym_settings readable by all"
  ON gym_settings FOR SELECT USING (true);

CREATE POLICY "gym_settings writable by owner"
  ON gym_settings FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner'));
