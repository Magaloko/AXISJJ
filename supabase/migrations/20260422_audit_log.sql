-- Audit log for admin/owner actions (compliance, accountability).

CREATE TABLE IF NOT EXISTS audit_log (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  actor_name    TEXT,
  action        TEXT NOT NULL,
  target_type   TEXT,
  target_id     TEXT,
  target_name   TEXT,
  meta          JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON audit_log(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_target ON audit_log(target_type, target_id);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Only owner can read; service-role inserts bypass RLS
DO $$ BEGIN
  CREATE POLICY "audit_log_owner_read" ON audit_log FOR SELECT
    USING (get_my_role() = 'owner');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
