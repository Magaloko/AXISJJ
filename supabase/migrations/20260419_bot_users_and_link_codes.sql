-- Telegram Bot Phase 1: bot_users + bot_link_codes
--
-- bot_users links a Telegram chat_id to a gym profile with a bot-role.
--   UNIQUE(profile_id) enforces one Telegram account per gym profile.
--   bot_role is independent of the site role (profiles.role) so gym staff can
--   have elevated bot privileges without elevating their web-app role.
--
-- bot_link_codes holds short-lived (15 min) one-time codes a signed-in user
-- generates from /konto and then types into the bot via `/link CODE`.

CREATE TABLE bot_users (
  chat_id            BIGINT PRIMARY KEY,
  profile_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  bot_role           TEXT NOT NULL DEFAULT 'member'
                       CHECK (bot_role IN ('admin', 'moderator', 'coach', 'member')),
  telegram_username  TEXT,
  first_name         TEXT,
  linked_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (profile_id)
);

CREATE INDEX idx_bot_users_profile_id ON bot_users(profile_id);

CREATE TABLE bot_link_codes (
  code              TEXT PRIMARY KEY,
  profile_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at        TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '15 minutes'),
  used_at           TIMESTAMPTZ,
  used_by_chat_id   BIGINT
);

CREATE INDEX idx_bot_link_codes_profile_id ON bot_link_codes(profile_id);

ALTER TABLE bot_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_link_codes ENABLE ROW LEVEL SECURITY;

-- bot_users: owner of profile can read own entry; gym owner can read all.
CREATE POLICY "bot_users self-read"
  ON bot_users FOR SELECT
  USING (profile_id = auth.uid()
         OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner'));

-- All writes to bot_users happen through server actions / webhook handler
-- with the service-role key OR through authenticated users manipulating their own row.
CREATE POLICY "bot_users self-delete (unlink)"
  ON bot_users FOR DELETE
  USING (profile_id = auth.uid());

-- bot_link_codes: users read their own codes.
CREATE POLICY "bot_link_codes self-read"
  ON bot_link_codes FOR SELECT
  USING (profile_id = auth.uid());
