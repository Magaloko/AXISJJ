-- Feature 3 — Quizzes, Learning Tasks, BJJ Rules
--
-- Baut auf 20260425_curriculum.sql auf.
--   quizzes              = Quiz pro Session (oder standalone)
--   quiz_questions       = Fragen, aktuell nur 'multiple_choice'
--   quiz_answers         = Antwortoptionen mit is_correct
--   quiz_attempts        = Member-Versuche (score, passed)
--   learning_tasks       = Homework / Reflection pro Session
--   task_completions     = Member × Task (mit notes)
--   rule_cards           = Standalone BJJ/IBJJF-Regel-Quiz (nicht Session-gebunden)
--
-- RLS:
--   Admin-Content (quizzes, questions, answers, tasks, rule_cards): lesen
--     für alle authenticated, schreiben nur owner.
--   Member-Daten (attempts, completions): jeder sieht/schreibt nur eigene;
--     owner sieht alles.

-- ─── quizzes ─────────────────────────────────────────────────
CREATE TABLE quizzes (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id     UUID REFERENCES curriculum_sessions(id) ON DELETE CASCADE,
  title          TEXT NOT NULL,
  description    TEXT,
  quiz_type      TEXT NOT NULL DEFAULT 'multiple_choice'
                   CHECK (quiz_type IN ('multiple_choice', 'flashcard', 'drag_match', 'sequence')),
  passing_score  INT NOT NULL DEFAULT 70 CHECK (passing_score BETWEEN 0 AND 100),
  xp_reward      INT NOT NULL DEFAULT 10 CHECK (xp_reward >= 0),
  active         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX quizzes_session_idx ON quizzes(session_id);
CREATE TRIGGER quizzes_updated_at BEFORE UPDATE ON quizzes
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- ─── quiz_questions ─────────────────────────────────────────
CREATE TABLE quiz_questions (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id        UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  question       TEXT NOT NULL,
  question_type  TEXT NOT NULL DEFAULT 'multiple_choice'
                   CHECK (question_type IN ('multiple_choice', 'true_false')),
  explanation    TEXT,
  sort_order     INT NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX quiz_questions_quiz_idx ON quiz_questions(quiz_id, sort_order);

-- ─── quiz_answers ───────────────────────────────────────────
CREATE TABLE quiz_answers (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id   UUID NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
  answer_text   TEXT NOT NULL,
  is_correct    BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order    INT NOT NULL DEFAULT 0
);

CREATE INDEX quiz_answers_question_idx ON quiz_answers(question_id, sort_order);

-- ─── quiz_attempts ──────────────────────────────────────────
CREATE TABLE quiz_attempts (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  quiz_id        UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  score          INT NOT NULL CHECK (score BETWEEN 0 AND 100),
  passed         BOOLEAN NOT NULL,
  answers        JSONB NOT NULL DEFAULT '{}'::jsonb,
  completed_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX quiz_attempts_profile_idx ON quiz_attempts(profile_id, completed_at DESC);
CREATE INDEX quiz_attempts_quiz_idx    ON quiz_attempts(quiz_id);

-- ─── learning_tasks ─────────────────────────────────────────
CREATE TABLE learning_tasks (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id     UUID REFERENCES curriculum_sessions(id) ON DELETE CASCADE,
  title          TEXT NOT NULL,
  description    TEXT,
  task_type      TEXT NOT NULL DEFAULT 'reflection'
                   CHECK (task_type IN ('reflection', 'drill', 'journal', 'video', 'reading')),
  xp_reward      INT NOT NULL DEFAULT 5 CHECK (xp_reward >= 0),
  active         BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order     INT NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX learning_tasks_session_idx ON learning_tasks(session_id, sort_order);

-- ─── task_completions ──────────────────────────────────────
CREATE TABLE task_completions (
  profile_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  task_id        UUID NOT NULL REFERENCES learning_tasks(id) ON DELETE CASCADE,
  notes          TEXT,
  completed_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (profile_id, task_id)
);

-- ─── rule_cards (IBJJF / BJJ Regeln) ───────────────────────
CREATE TABLE rule_cards (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category       TEXT NOT NULL CHECK (category IN ('scoring', 'illegal', 'time', 'belt', 'etiquette')),
  question       TEXT NOT NULL,
  options        TEXT[] NOT NULL,
  correct_index  INT NOT NULL CHECK (correct_index >= 0),
  explanation    TEXT NOT NULL,
  difficulty     TEXT NOT NULL DEFAULT 'white'
                   CHECK (difficulty IN ('white', 'blue', 'purple', 'brown', 'black')),
  xp_reward      INT NOT NULL DEFAULT 2,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX rule_cards_cat_idx ON rule_cards(category, difficulty);

-- ─── RLS ────────────────────────────────────────────────────
ALTER TABLE quizzes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_answers      ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_tasks    ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_completions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE rule_cards        ENABLE ROW LEVEL SECURITY;

-- Read: authenticated (quiz answers sichtbar — wir setzen auf Zeit-basiertes Show im Client)
CREATE POLICY quizzes_read           ON quizzes           FOR SELECT TO authenticated USING (true);
CREATE POLICY quiz_questions_read    ON quiz_questions    FOR SELECT TO authenticated USING (true);
CREATE POLICY quiz_answers_read      ON quiz_answers      FOR SELECT TO authenticated USING (true);
CREATE POLICY learning_tasks_read    ON learning_tasks    FOR SELECT TO authenticated USING (true);
CREATE POLICY rule_cards_read        ON rule_cards        FOR SELECT TO authenticated USING (true);

-- Write: owner only
CREATE POLICY quizzes_write_owner ON quizzes FOR ALL TO authenticated
  USING      (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner'));
CREATE POLICY quiz_questions_write_owner ON quiz_questions FOR ALL TO authenticated
  USING      (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner'));
CREATE POLICY quiz_answers_write_owner ON quiz_answers FOR ALL TO authenticated
  USING      (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner'));
CREATE POLICY learning_tasks_write_owner ON learning_tasks FOR ALL TO authenticated
  USING      (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner'));
CREATE POLICY rule_cards_write_owner ON rule_cards FOR ALL TO authenticated
  USING      (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner'));

-- Member data: eigene + owner sieht alles
CREATE POLICY quiz_attempts_read ON quiz_attempts FOR SELECT TO authenticated
  USING (profile_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner'));
CREATE POLICY quiz_attempts_insert_self ON quiz_attempts FOR INSERT TO authenticated
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY task_completions_read ON task_completions FOR SELECT TO authenticated
  USING (profile_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner'));
CREATE POLICY task_completions_insert_self ON task_completions FOR INSERT TO authenticated
  WITH CHECK (profile_id = auth.uid());
CREATE POLICY task_completions_delete_self ON task_completions FOR DELETE TO authenticated
  USING (profile_id = auth.uid());

-- ─── SEED rule_cards (25× IBJJF-Basics) ─────────────────────
INSERT INTO rule_cards (category, question, options, correct_index, explanation, difficulty) VALUES
-- scoring
('scoring', 'Wie viele Punkte gibt ein Takedown in IBJJF-Regeln?',
  ARRAY['1','2','3','4'], 1,
  'Takedown = 2 Punkte. Muss 3 Sekunden auf dem Gegner kontrollieren.', 'white'),
('scoring', 'Wie viele Punkte gibt Mount?',
  ARRAY['2','3','4','5'], 2,
  'Mount = 4 Punkte. Muss 3 Sekunden gehalten werden um zu scoren.', 'white'),
('scoring', 'Wie viele Punkte gibt Back Control (mit Hooks)?',
  ARRAY['2','3','4','5'], 2,
  'Back Control mit beiden Hooks = 4 Punkte. Ohne Hooks = 0.', 'white'),
('scoring', 'Wie viele Punkte gibt Guard Pass?',
  ARRAY['2','3','4','5'], 1,
  'Guard Pass = 3 Punkte. Muss stabil 3 Sekunden Side Mount halten.', 'white'),
('scoring', 'Wie viele Punkte gibt Knee on Belly?',
  ARRAY['1','2','3','4'], 1,
  'Knee on Belly = 2 Punkte. Zehen müssen vom Boden sein.', 'blue'),
('scoring', 'Wie viele Punkte gibt ein Sweep?',
  ARRAY['1','2','3','4'], 1,
  'Sweep = 2 Punkte. Muss aus Guard kommen + 3 Sekunden oben gehalten werden.', 'white'),
('scoring', 'Was ist der Wert einer Submission-Attempt ohne Finish?',
  ARRAY['0','1 Advantage','2 Punkte','1 Punkt'], 1,
  'Eine Submission-Attempt gibt 1 Advantage. Kein Scoring.', 'blue'),

-- illegal
('illegal', 'Ist ein Heel Hook im Gi-Wettkampf bei White Belt erlaubt?',
  ARRAY['Ja, immer','Nur mit Zustimmung','Nein, illegal','Nur bei Sub-Only'], 2,
  'Heel Hooks sind bei White und Blue Belt IBJJF GI illegal. Im No-Gi ab Brown Belt erlaubt.', 'white'),
('illegal', 'Ist Slamming (Sprung-Passing) aus Guard legal?',
  ARRAY['Ja','Nein','Nur ohne Takedown-Punkte','Mit Warnung'], 1,
  'Slamming = sofortige Disqualifikation. Immer.', 'white'),
('illegal', 'Sind Bizeps-Slicer auf Blue Belt Level erlaubt?',
  ARRAY['Ja','Nein','Nur in No-Gi','Mit Warnung'], 1,
  'Bizeps-Slicer + Calf-Slicer = Brown Belt aufwärts. Bei Blue Belt illegal.', 'blue'),
('illegal', 'Ist Slamming beim Triangle-Escape erlaubt?',
  ARRAY['Ja, wenn in der Guard','Nein, immer illegal','Nur wenn Partner steht','Nur im No-Gi'], 1,
  'Slamming ist immer illegal — Disqualifikation. Triangle-Escape ohne Slamming lösen.', 'blue'),
('illegal', 'Sind Fingergrips (einzelne Finger greifen) erlaubt?',
  ARRAY['Ja, 1 Finger ok','Nein, immer illegal','Ja, 2 Finger minimum','Nur im Gi'], 1,
  'Einzelne Finger greifen ist verboten. Mindestens 4 Finger zusammen.', 'blue'),

-- time
('time', 'Wie lang ist ein White Belt Match bei IBJJF-Turnieren?',
  ARRAY['5 Min','6 Min','7 Min','10 Min'], 0,
  'White Belt = 5 Minuten. Blue = 6, Purple = 7, Brown = 8, Black = 10.', 'white'),
('time', 'Wie lang ist ein Black Belt Match?',
  ARRAY['7 Min','8 Min','10 Min','15 Min'], 2,
  'Black Belt = 10 Minuten Matches bei IBJJF.', 'purple'),
('time', 'Was ist Overtime bei ADCC-Regeln?',
  ARRAY['Sudden-Death Submission','Point-Match','Score-Match','Gibt es nicht'], 0,
  'ADCC Overtime: erste Submission oder höchster Advantage gewinnt.', 'purple'),

-- belt
('belt', 'Minimum-Zeit im White Belt bevor Blue möglich ist?',
  ARRAY['6 Monate','1 Jahr','2 Jahre','Keine'], 1,
  'IBJJF setzt bei Erwachsenen ≥16 keine harte Mindestzeit für Blue. Viele Schulen praktizieren ~1 Jahr.', 'white'),
('belt', 'Minimum-Zeit im Blue Belt (IBJJF) bevor Purple möglich ist?',
  ARRAY['1 Jahr','2 Jahre','3 Jahre','Keine'], 1,
  'IBJJF: 2 Jahre Blue Belt erforderlich für Purple Belt.', 'blue'),
('belt', 'Minimum-Zeit im Purple Belt bevor Brown?',
  ARRAY['6 Monate','1 Jahr','1.5 Jahre','2 Jahre'], 2,
  'IBJJF: 1.5 Jahre Purple erforderlich für Brown.', 'blue'),
('belt', 'Wann bekommen Kinder in BJJ ihren ersten Jugend-Gurt?',
  ARRAY['Mit 4','Mit 6','Mit 7','Mit 10'], 2,
  'Kids-Gurt-System startet bei 4-15 mit Weiß, Grau (ab 4), Gelb (ab 7), Orange (ab 10), Grün (ab 13).', 'white'),

-- etiquette
('etiquette', 'Was tust du vor dem Rollen mit einem neuen Partner?',
  ARRAY['Sofort angreifen','Fist-Bump und Handschlag','Warten bis er startet','Nichts'], 1,
  'Immer Fist-Bump / Handschlag vor + nach dem Rollen. Respekt ist essentiell.', 'white'),
('etiquette', 'Was bedeutet „Oss" in der BJJ-Kultur?',
  ARRAY['Greeting / Respekt-Ausdruck','Ein Move','Ein Gürtel','Nichts'], 0,
  'Oss (Osu) ist ein Greeting und Ausdruck von Respekt / Verständnis. In Brasilien eher weniger, in Japan/USA häufig.', 'white'),
('etiquette', 'Darfst du mit schmutzigem Gi trainieren?',
  ARRAY['Ja, einmal ok','Nein, niemals','Nur ohne Sparring','Nur unter 1h'], 1,
  'Hygiene ist nicht verhandelbar — schmutziger Gi verbreitet Staph/Ringworm. Gewaschen + trocken, immer.', 'white'),
('etiquette', 'Was ist das erste was du nach Tap machst?',
  ARRAY['Weiter rollen','Aufstehen und neu starten','Stoppen + Partner loslassen','Protest'], 2,
  'Tap = sofort stoppen + Partner loslassen. Danach kurz verschnaufen und neu starten.', 'white'),
('etiquette', 'Wenn du auf eine Verletzung zubewegst, was tust du?',
  ARRAY['Durchtrainieren','Pause + Coach informieren','Im Stillen rausgehen','Weiterrollen mit Gegenseite'], 1,
  'Sofort pausieren, Coach informieren. Verletzungen werden schlimmer wenn ignoriert.', 'white'),
('etiquette', 'Wie lange warten wir typischerweise vor einer Beförderung?',
  ARRAY['Nie feiern','Gauntlet (Spießruten-Lauf)','Einfach weitermachen','Nur Foto'], 1,
  'Gauntlet = alle Gürtel-Farben schlagen dich spielerisch auf den Rücken als Tradition. Optional in manchen Schulen.', 'blue');
