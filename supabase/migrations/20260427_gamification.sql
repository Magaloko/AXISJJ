-- Feature 4 — Gamification
--
-- xp_events          = append-only log of earned XP (source-tagged for audit)
-- badges             = badge catalog (seeded)
-- member_badges      = earned badges per member
-- rule_card_attempts = member tries of IBJJF rule cards

-- ─── xp_events ─────────────────────────────────────────────
CREATE TABLE xp_events (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  source       TEXT NOT NULL CHECK (source IN (
                 'quiz_pass', 'quiz_attempt',
                 'task_complete',
                 'rule_correct',
                 'attendance',
                 'streak_bonus',
                 'badge_earned',
                 'manual')),
  source_id    UUID,
  amount       INT NOT NULL CHECK (amount >= 0),
  description  TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX xp_events_profile_idx ON xp_events(profile_id, created_at DESC);
CREATE INDEX xp_events_source_idx  ON xp_events(source, profile_id);

-- ─── badges ────────────────────────────────────────────────
CREATE TABLE badges (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code          TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  description   TEXT NOT NULL,
  icon          TEXT NOT NULL DEFAULT '🏅',
  rarity        TEXT NOT NULL DEFAULT 'common'
                  CHECK (rarity IN ('common', 'uncommon', 'rare', 'legendary')),
  xp_reward     INT NOT NULL DEFAULT 20,
  sort_order    INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── member_badges ─────────────────────────────────────────
CREATE TABLE member_badges (
  profile_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id     UUID NOT NULL REFERENCES badges(id)   ON DELETE CASCADE,
  earned_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (profile_id, badge_id)
);

CREATE INDEX member_badges_profile_idx ON member_badges(profile_id, earned_at DESC);

-- ─── rule_card_attempts ───────────────────────────────────
CREATE TABLE rule_card_attempts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id      UUID NOT NULL REFERENCES profiles(id)    ON DELETE CASCADE,
  rule_card_id    UUID NOT NULL REFERENCES rule_cards(id)  ON DELETE CASCADE,
  selected_index  INT NOT NULL,
  is_correct      BOOLEAN NOT NULL,
  answered_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX rule_card_attempts_profile_idx ON rule_card_attempts(profile_id, answered_at DESC);
CREATE INDEX rule_card_attempts_card_idx    ON rule_card_attempts(rule_card_id);

-- ─── RLS ───────────────────────────────────────────────────
ALTER TABLE xp_events          ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges             ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_badges      ENABLE ROW LEVEL SECURITY;
ALTER TABLE rule_card_attempts ENABLE ROW LEVEL SECURITY;

-- badges catalog: read all authenticated, write owner
CREATE POLICY badges_read ON badges FOR SELECT TO authenticated USING (true);
CREATE POLICY badges_write_owner ON badges FOR ALL TO authenticated
  USING      (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner'));

-- xp_events: own read + owner read (for leaderboard we use an RPC with bypass)
CREATE POLICY xp_events_read ON xp_events FOR SELECT TO authenticated
  USING (profile_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner'));
-- Inserts only via server actions using service role — still add member policy for safety
CREATE POLICY xp_events_insert_self ON xp_events FOR INSERT TO authenticated
  WITH CHECK (profile_id = auth.uid());

-- member_badges: own read + owner read
CREATE POLICY member_badges_read ON member_badges FOR SELECT TO authenticated
  USING (profile_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner'));
CREATE POLICY member_badges_insert_self ON member_badges FOR INSERT TO authenticated
  WITH CHECK (profile_id = auth.uid());

-- rule_card_attempts: own read + insert + owner read
CREATE POLICY rule_card_attempts_read ON rule_card_attempts FOR SELECT TO authenticated
  USING (profile_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner'));
CREATE POLICY rule_card_attempts_insert_self ON rule_card_attempts FOR INSERT TO authenticated
  WITH CHECK (profile_id = auth.uid());

-- ─── Leaderboard RPC (aggregated, visible to all authenticated) ──
-- Avoids exposing individual xp_events to non-owners while still allowing
-- a leaderboard UI.
CREATE OR REPLACE FUNCTION leaderboard_top(n INT DEFAULT 20)
RETURNS TABLE (
  profile_id UUID,
  full_name  TEXT,
  total_xp   BIGINT,
  badge_count BIGINT
) AS $$
  SELECT
    p.id,
    COALESCE(p.full_name, 'Anonymous'),
    COALESCE(SUM(x.amount), 0)::BIGINT AS total_xp,
    COALESCE(COUNT(DISTINCT mb.badge_id), 0)::BIGINT AS badge_count
  FROM profiles p
  LEFT JOIN xp_events x      ON x.profile_id  = p.id
  LEFT JOIN member_badges mb ON mb.profile_id = p.id
  WHERE p.role = 'member'
  GROUP BY p.id, p.full_name
  HAVING COALESCE(SUM(x.amount), 0) > 0
  ORDER BY total_xp DESC, badge_count DESC
  LIMIT n;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION leaderboard_top(INT) TO authenticated;

-- ─── SEED badges ───────────────────────────────────────────
INSERT INTO badges (code, name, description, icon, rarity, xp_reward, sort_order) VALUES
  ('first_quiz',       'Erster Versuch',       'Dein erster Quiz-Versuch — unabhängig vom Score.', '🎯', 'common',    10, 1),
  ('first_pass',       'Erste Note',           'Ersten Quiz bestanden.',                           '✅', 'common',    20, 2),
  ('quiz_master',      'Quiz-Meister',         '10 Quizzes mit Note bestanden.',                   '🏆', 'uncommon',  50, 3),
  ('task_starter',     'Fleißig',              'Erste Lernaufgabe abgeschlossen.',                  '📝', 'common',    10, 4),
  ('task_grinder',     'Disziplin',            '20 Lernaufgaben abgeschlossen.',                    '💪', 'uncommon',  50, 5),
  ('rule_scholar',     'Regel-Schüler',        '10 IBJJF-Regelkarten richtig beantwortet.',        '📚', 'common',    25, 6),
  ('rule_expert',      'Regel-Experte',        '50 Regelkarten richtig — du kennst das Regelbuch.', '🧠', 'rare',     100, 7),
  ('centurion',        'Centurion',            '100 XP gesammelt — du bist dabei.',                 '⭐', 'common',    20, 8);
