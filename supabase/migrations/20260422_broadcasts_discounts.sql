-- ============================================================
-- Broadcasts & Discount Codes
-- ============================================================

-- ── 1. Broadcasts ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS broadcasts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,                      -- internal label
  subject         TEXT NOT NULL,                      -- email subject / telegram header
  body            TEXT NOT NULL,                      -- message body (plain text / markdown)
  image_url       TEXT,                               -- optional image
  channels        TEXT[] NOT NULL DEFAULT '{}',       -- ['email','telegram']
  target_group    TEXT NOT NULL DEFAULT 'all',        -- 'all','active','inactive','leads','group:<uuid>'
  message_type    TEXT NOT NULL DEFAULT 'text'
    CHECK (message_type IN ('text', 'offer')),
  -- offer fields
  offer_discount_pct   INT  CHECK (offer_discount_pct BETWEEN 1 AND 100),
  offer_expires_days   INT  CHECK (offer_expires_days BETWEEN 1 AND 365),
  -- delivery tracking
  status          TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'sending', 'sent', 'failed')),
  sent_at         TIMESTAMPTZ,
  email_sent      INT  NOT NULL DEFAULT 0,
  email_failed    INT  NOT NULL DEFAULT 0,
  telegram_sent   INT  NOT NULL DEFAULT 0,
  telegram_failed INT  NOT NULL DEFAULT 0,
  recipient_count INT  NOT NULL DEFAULT 0,
  created_by      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 2. Discount Codes ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS discount_codes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code            TEXT NOT NULL UNIQUE,
  description     TEXT,
  discount_type   TEXT NOT NULL DEFAULT 'percent'
    CHECK (discount_type IN ('percent', 'fixed')),
  discount_value  NUMERIC(10,2) NOT NULL CHECK (discount_value > 0),
  expires_at      TIMESTAMPTZ,
  max_uses        INT,                               -- NULL = unlimited
  used_count      INT NOT NULL DEFAULT 0,
  -- personal codes: locked to one profile/email
  profile_id      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  recipient_email TEXT,
  broadcast_id    UUID REFERENCES broadcasts(id) ON DELETE SET NULL,
  created_by      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS discount_code_uses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id     UUID NOT NULL REFERENCES discount_codes(id) ON DELETE CASCADE,
  profile_id  UUID REFERENCES profiles(id) ON DELETE SET NULL,
  email       TEXT,
  context     TEXT,                                  -- 'membership', 'trial', etc.
  used_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 3. RLS ──────────────────────────────────────────────────

ALTER TABLE broadcasts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_codes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_code_uses  ENABLE ROW LEVEL SECURITY;

-- Broadcasts: owner/developer manage; staff read
CREATE POLICY "owner manage broadcasts"
  ON broadcasts FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner','developer'))
  );

CREATE POLICY "staff read broadcasts"
  ON broadcasts FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('coach','owner','developer'))
  );

-- Discount codes: owner/developer manage; public can validate (via service client)
CREATE POLICY "owner manage discount_codes"
  ON discount_codes FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner','developer'))
  );

-- Anyone can read their own personal code or public codes (for validation)
CREATE POLICY "read own or public discount_code"
  ON discount_codes FOR SELECT
  USING (
    profile_id IS NULL
    OR profile_id = auth.uid()
    OR recipient_email = (SELECT email FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "owner manage code_uses"
  ON discount_code_uses FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner','developer'))
  );

-- ── 4. Indexes ───────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_dc_code        ON discount_codes (code);
CREATE INDEX IF NOT EXISTS idx_dc_broadcast   ON discount_codes (broadcast_id);
CREATE INDEX IF NOT EXISTS idx_dc_profile     ON discount_codes (profile_id);
CREATE INDEX IF NOT EXISTS idx_dcu_code_id    ON discount_code_uses (code_id);
CREATE INDEX IF NOT EXISTS idx_broadcasts_status ON broadcasts (status, created_at DESC);
