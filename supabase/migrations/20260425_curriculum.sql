-- Curriculum / Lernpfad — Feature 1 (Schema + Seed)
--
-- Tabellen für strukturierten Monats-Lehrplan:
--   curricula           = ein Lehrplan (z.B. "Month 1: Foundations")
--   curriculum_tracks   = pro Programm (Gi Fund, No-Gi Fund, Kids, ...)
--   curriculum_sessions = einzelne Trainings (Woche × Session)
--   techniques          = Library der BJJ-Techniken
--   session_techniques  = Join: welche Technik in welcher Session-Phase
--
-- RLS: lesen für alle authenticated, schreiben nur owner.

-- ─── 1. curricula ────────────────────────────────────────────
CREATE TABLE curricula (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  slug            TEXT NOT NULL UNIQUE,
  description     TEXT,
  duration_weeks  INT NOT NULL DEFAULT 4 CHECK (duration_weeks > 0),
  age_group       TEXT NOT NULL DEFAULT 'adults'
                    CHECK (age_group IN ('adults', 'kids')),
  active          BOOLEAN NOT NULL DEFAULT TRUE,
  created_by      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX curricula_active_idx ON curricula(active, age_group);

-- ─── 2. curriculum_tracks ────────────────────────────────────
CREATE TABLE curriculum_tracks (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  curriculum_id       UUID NOT NULL REFERENCES curricula(id) ON DELETE CASCADE,
  class_type_id       UUID NOT NULL REFERENCES class_types(id) ON DELETE RESTRICT,
  name                TEXT NOT NULL,
  sessions_per_week   INT NOT NULL DEFAULT 1 CHECK (sessions_per_week BETWEEN 1 AND 7),
  sort_order          INT NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX curriculum_tracks_cur_idx ON curriculum_tracks(curriculum_id, sort_order);

-- ─── 3. techniques (library) ────────────────────────────────
CREATE TABLE techniques (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  slug            TEXT NOT NULL UNIQUE,
  category        TEXT NOT NULL CHECK (category IN (
                    'position', 'takedown', 'submission', 'sweep',
                    'guard-pass', 'escape', 'transition', 'drill')),
  position        TEXT,
  belt_level      TEXT NOT NULL DEFAULT 'white'
                    CHECK (belt_level IN ('white', 'blue', 'purple', 'brown', 'black')),
  gi              BOOLEAN NOT NULL DEFAULT TRUE,
  description     TEXT,
  key_details     TEXT[] NOT NULL DEFAULT '{}',
  common_mistakes TEXT[] NOT NULL DEFAULT '{}',
  video_url       TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX techniques_cat_idx ON techniques(category, belt_level);

-- ─── 4. curriculum_sessions ─────────────────────────────────
CREATE TABLE curriculum_sessions (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  track_id            UUID NOT NULL REFERENCES curriculum_tracks(id) ON DELETE CASCADE,
  week_number         INT NOT NULL CHECK (week_number > 0),
  session_number      INT NOT NULL CHECK (session_number > 0),
  title               TEXT NOT NULL,
  theme               TEXT,
  objectives          TEXT[] NOT NULL DEFAULT '{}',
  warmup              TEXT,
  drilling            TEXT,
  sparring_focus      TEXT,
  homework            TEXT,
  duration_minutes    INT NOT NULL DEFAULT 90,
  prerequisite_id     UUID REFERENCES curriculum_sessions(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (track_id, week_number, session_number)
);

CREATE INDEX curriculum_sessions_track_idx
  ON curriculum_sessions(track_id, week_number, session_number);

-- ─── 5. session_techniques (join) ───────────────────────────
CREATE TABLE session_techniques (
  session_id    UUID NOT NULL REFERENCES curriculum_sessions(id) ON DELETE CASCADE,
  technique_id  UUID NOT NULL REFERENCES techniques(id) ON DELETE CASCADE,
  phase         TEXT NOT NULL DEFAULT 'main'
                  CHECK (phase IN ('warmup', 'drilling', 'main', 'sparring', 'review')),
  sort_order    INT NOT NULL DEFAULT 0,
  PRIMARY KEY (session_id, technique_id, phase)
);

-- ─── updated_at trigger ─────────────────────────────────────
CREATE OR REPLACE FUNCTION touch_updated_at() RETURNS trigger AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER curricula_updated_at BEFORE UPDATE ON curricula
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER curriculum_sessions_updated_at BEFORE UPDATE ON curriculum_sessions
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- ─── RLS ────────────────────────────────────────────────────
ALTER TABLE curricula           ENABLE ROW LEVEL SECURITY;
ALTER TABLE curriculum_tracks   ENABLE ROW LEVEL SECURITY;
ALTER TABLE techniques          ENABLE ROW LEVEL SECURITY;
ALTER TABLE curriculum_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_techniques  ENABLE ROW LEVEL SECURITY;

-- Read: alle authenticated
CREATE POLICY curricula_read ON curricula
  FOR SELECT TO authenticated USING (true);
CREATE POLICY curriculum_tracks_read ON curriculum_tracks
  FOR SELECT TO authenticated USING (true);
CREATE POLICY techniques_read ON techniques
  FOR SELECT TO authenticated USING (true);
CREATE POLICY curriculum_sessions_read ON curriculum_sessions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY session_techniques_read ON session_techniques
  FOR SELECT TO authenticated USING (true);

-- Write: nur owner
CREATE POLICY curricula_write_owner ON curricula
  FOR ALL TO authenticated
  USING      (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'owner'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'owner'));
CREATE POLICY curriculum_tracks_write_owner ON curriculum_tracks
  FOR ALL TO authenticated
  USING      (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'owner'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'owner'));
CREATE POLICY techniques_write_owner ON techniques
  FOR ALL TO authenticated
  USING      (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'owner'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'owner'));
CREATE POLICY curriculum_sessions_write_owner ON curriculum_sessions
  FOR ALL TO authenticated
  USING      (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'owner'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'owner'));
CREATE POLICY session_techniques_write_owner ON session_techniques
  FOR ALL TO authenticated
  USING      (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'owner'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'owner'));

-- ─── SEED: canonical BJJ techniques (aus Gregoriades + Antunes) ─
-- Positionen (8)
INSERT INTO techniques (name, slug, category, position, belt_level, description, key_details, common_mistakes) VALUES
('Closed Guard',          'closed-guard',        'position', 'closed-guard',  'white', 'Untere Position mit geschlossenen Beinen um Torso des Gegners.',
  ARRAY['Hüfte angewinkelt halten','Grip & Kragen kontrollieren','Posture des Gegners brechen'],
  ARRAY['Flach auf Rücken liegen','Arme überstrecken','Ohne Plan Guard öffnen']),
('Open Guard',            'open-guard',          'position', 'open-guard',    'white', 'Untere Position mit offenen Beinen, dynamischer als Closed.',
  ARRAY['Füße immer aktiv auf Körper/Knien','Druck durch Beine','Grips zuerst, dann Angriff'],
  ARRAY['Beine auf dem Boden lassen','Zwei Beine greifen lassen']),
('Half Guard',            'half-guard',          'position', 'half-guard',    'white', 'Eines der Beine des Gegners zwischen den eigenen.',
  ARRAY['Nie flach auf Rücken','Frames mit Unterarmen','Kontrolle über Knie+Hüfte'],
  ARRAY['Kopf kontrollieren lassen','Zu flach liegen']),
('Side Mount',            'side-mount',          'position', 'side-mount',    'white', 'Obere dominante Kontrollposition, Torso quer zum Gegner.',
  ARRAY['Low center of gravity','Beide Schultern pinnen','Beine weg vom Gegner'],
  ARRAY['Zu hoher Schwerpunkt','Beine zu nah am Gegner']),
('Knee on Chest',         'knee-on-chest',       'position', 'knee-on-chest', 'white', 'Knie auf Brust/Torso, höchst mobile Kontrollposition.',
  ARRAY['Knie quer über Brust','Zehen vom Boden','Tiefer Schwerpunkt'],
  ARRAY['Knie nur auf Bauch','Auf Knie abstützen mit Händen']),
('Full Mount',            'full-mount',          'position', 'full-mount',    'white', 'Auf Torso sitzen, volle Gewichtskontrolle.',
  ARRAY['Füße an Körper','Kopf über Hüfte zentriert','Knie weit, Hüfte tief'],
  ARRAY['Zu hoch auf Bauch sitzen','Hände weit vorne abstützen']),
('Back Mount',            'back-mount',          'position', 'back-mount',    'white', 'Hinter dem Gegner mit Haken um dessen Taille.',
  ARRAY['Seatbelt (over-/underhook)','Kopf an Kopf','Hooks aktiv'],
  ARRAY['Füße kreuzen (footlock!)','Control verlieren vor Submission']),
('Turtle',                'turtle',              'position', 'turtle',        'white', 'Bauchlage mit Knien/Ellbogen — Übergangsposition.',
  ARRAY['Nacken schützen','Ellbogen eng an Schenkeln'],
  ARRAY['Hooks reinlassen','Nacken freigeben']);

-- Drills (3)
INSERT INTO techniques (name, slug, category, position, belt_level, description, key_details, common_mistakes) VALUES
('Bridge (Upa)',          'bridge',              'drill',    NULL,            'white', 'Fundamentale Hüft-Explosiv-Bewegung — Basis aller Escapes.',
  ARRAY['Füße flach + nah am Po','Durch Fersen pushen','Schulter rollt rein'],
  ARRAY['Zu flach bleiben','Mit Armen pushen']),
('Shrimp (Hip Escape)',   'shrimp',              'drill',    NULL,            'white', 'Seitliche Hüftbewegung zum Platz schaffen.',
  ARRAY['Fuß → Hüfte wegdrücken','Schulter zuerst','Stabiler Frame'],
  ARRAY['Mit Rücken pushen','Ohne Frame']),
('Technical Standup',     'technical-standup',   'drill',    'standing',      'white', 'Aufstehen ohne Balance zu verlieren — Basis Self-Defense.',
  ARRAY['Eine Hand postet','Bein nach hinten','Hüfte zuerst raus'],
  ARRAY['Mit Rücken zum Gegner','Balance verlieren']);

-- Takedowns (4)
INSERT INTO techniques (name, slug, category, position, belt_level, description, key_details, common_mistakes) VALUES
('Double Leg Takedown',   'double-leg',          'takedown', 'standing',      'white', 'Beide Beine greifen, Gegner auf Rücken fahren.',
  ARRAY['Level change zuerst','Kopf auf Brust/Seite','Drive mit Hüfte, nicht Armen'],
  ARRAY['Kopf runter','Ohne Level Change schießen']),
('Single Leg Takedown',   'single-leg',          'takedown', 'standing',      'blue',  'Ein Bein greifen und hochheben.',
  ARRAY['Bein fest an Brust','Kopf außen','Hip-in, nicht rückwärts'],
  ARRAY['Kopf innen','Bein loslassen']),
('Ippon Seoi Nage',       'ippon-seoi-nage',     'takedown', 'standing',      'white', 'Klassischer Judo-Schulterwurf über die Hüfte.',
  ARRAY['Unter Schwerpunkt kommen','Arm unter Achsel','Rück-Hüft-Streckung'],
  ARRAY['Zu hoch stehen','Griff vor Hüftkontakt']),
('O Soto Gari',           'o-soto-gari',         'takedown', 'standing',      'brown', 'Außensichel — Bein des Gegners wegfegen.',
  ARRAY['Kuzushi (Gleichgewichtsbruch) zuerst','Körper eng','Fegen mit Wadenansatz'],
  ARRAY['Ohne Kuzushi fegen','Zu weit vom Gegner']);

-- Submissions (8)
INSERT INTO techniques (name, slug, category, position, belt_level, description, key_details, common_mistakes) VALUES
('Straight Armlock from Guard', 'straight-armlock-guard', 'submission', 'closed-guard', 'white', 'Gregoriades Tipp Nr. 7 — erste Submission die jeder Anfänger lernen sollte.',
  ARRAY['Arm über Centerline ziehen','Angle creation mit Hüfte','Hip/Core/Glute-Drive'],
  ARRAY['Armlock geradeaus versuchen','Ohne Angle']),
('Americana from Side Control', 'americana-side', 'submission', 'side-mount', 'white', 'Figure-4 Armlock aus Side Mount.',
  ARRAY['Handgelenk fixieren','Ellbogen auf Boden schleifen','Figure-4 Grip'],
  ARRAY['Ellbogen zu hoch lassen','Eigene Arme nicht koppeln']),
('Triangle Choke',        'triangle-choke',      'submission', 'closed-guard', 'blue',  'Choke mit Beinen um Hals + ein Arm des Gegners.',
  ARRAY['Einen Arm rausziehen','Winkel 45°','Bein über Nacken'],
  ARRAY['Zu weit aufmachen','Ohne Winkel abschließen']),
('Kimura from Half Guard','kimura-half-guard',   'submission', 'half-guard',   'white', 'Figure-4 Schulterlock — funktioniert aus vielen Positionen.',
  ARRAY['Handgelenk zuerst','Figure-4','Hüfte nach hinten'],
  ARRAY['Im Half Guard unten Kimura suchen']),
('Rear Naked Choke',      'rear-naked-choke',    'submission', 'back-mount',   'blue',  'Blutchoke ohne Gi aus Back Mount.',
  ARRAY['Unterarm unter Kinn','Andere Hand an Bizeps','Ellbogen eng'],
  ARRAY['An Hals greifen statt Arm','Wenn Kopf raus, zu früh finishen']),
('Cross Collar Choke Mount','cross-collar-mount','submission', 'full-mount',   'white', 'Klassischer Gi-Choke aus Mount.',
  ARRAY['Tiefe Kragen-Grips','Ellbogen zusammen','Körper leicht senken'],
  ARRAY['Zu flacher Grip','Arme nicht kreuzen']),
('Straight Foot Lock',    'straight-footlock',   'submission', 'open-guard',   'blue',  'Ankle lock aus offener Guard.',
  ARRAY['Fuß unter Achsel','Hüfte drücken','Klein Finger oben'],
  ARRAY['Ohne Hüftdruck','Zehe greifen']),
('Bow & Arrow Choke',     'bow-and-arrow-choke', 'submission', 'back-mount',   'blue',  'Gi-Choke aus Back Mount.',
  ARRAY['Tiefer Kragen-Grip','Anderes Bein über Schulter','Zieh + dreh'],
  ARRAY['Bein verliert Kontakt zur Schulter']);

-- Sweeps (4)
INSERT INTO techniques (name, slug, category, position, belt_level, description, key_details, common_mistakes) VALUES
('Scissor Sweep',         'scissor-sweep',       'sweep',    'closed-guard', 'white', 'Gregoriades Tipp Nr. 8 — Rickson sagt: der wichtigste Sweep.',
  ARRAY['Wrist & Arm Control der Sweep-Seite','Power aus Hüfte+Core (nicht Arme)','Partners COG hoch heben'],
  ARRAY['Arm nicht kontrollieren','Mit Armen pushen','COG unten lassen']),
('Hip Bump Sweep',        'hip-bump-sweep',      'sweep',    'closed-guard', 'white', 'Setup zum Kimura — simpelster Sweep.',
  ARRAY['Setup sit-up','Hand am Boden','Hüft-Bump'],
  ARRAY['Nicht aufsetzen','Falsche Seite']),
('Balloon Sweep (Flower)','balloon-sweep',       'sweep',    'closed-guard', 'blue',  'Sweep über Nacken/Kopf — spektakulär aus closed.',
  ARRAY['Hand im Kragen/Arm','Unter Pobacken heben','Drehen'],
  ARRAY['Zu schwach heben','Ohne Kontrolle']),
('Butterfly Sweep',       'butterfly-sweep',     'sweep',    'open-guard',   'blue',  'Hook-Sweep mit Butterfly Guard.',
  ARRAY['Underhook','Kopf unter Arm','Elevation mit Hook + Rollen'],
  ARRAY['Ohne Underhook','Flat auf Rücken']);

-- Guard Passes (4)
INSERT INTO techniques (name, slug, category, position, belt_level, description, key_details, common_mistakes) VALUES
('Standing Guard Break',  'standing-guard-break','guard-pass','closed-guard','white', 'Gregoriades Tipp Nr. 4 — stand up to break closed guard.',
  ARRAY['Posture','Hand auf Bauch','Hüfte rausstrecken, aufstehen'],
  ARRAY['Auf Knien bleiben','Posture verlieren']),
('Hand-to-Hand Pass',     'h2h-pass',            'guard-pass','open-guard',  'blue',  'Ken Primola H2H — Grundform für stack/smash.',
  ARRAY['Knie zum Kopf stapeln','Hände an Mat','Druck nach vorne'],
  ARRAY['Zu schnell seitlich','Druck verlieren']),
('Knee Squeeze Pass',     'knee-squeeze-pass',   'guard-pass','open-guard',  'blue',  'Knie zwischen Beine + squeeze.',
  ARRAY['Knie tief innen','Andere Hand frame','Squeeze + step over'],
  ARRAY['Knie zu hoch','Kein Frame']),
('Leg Drag Pass',         'leg-drag-pass',       'guard-pass','open-guard',  'blue',  'Modern IBJJF-Pass — Bein quer ziehen.',
  ARRAY['Bein am Knie greifen','Drag über andere Seite','Shoulder pressure'],
  ARRAY['Bein loslassen','Ohne Druck']);

-- Escapes (3)
INSERT INTO techniques (name, slug, category, position, belt_level, description, key_details, common_mistakes) VALUES
('Side Mount Escape — Guard Replacement', 'side-mount-escape-guard', 'escape', 'side-mount', 'white', 'Gregoriades Tipp Nr. 5 — Top-Prio für Anfänger.',
  ARRAY['Nacken schützen (1 Hand am Kragen)','Bridge → Shrimp Combo','Timing'],
  ARRAY['Frame verlieren','Nur drücken ohne Shrimp']),
('Side Mount Escape — Go to Knees', 'side-mount-escape-knees', 'escape', 'side-mount', 'white', 'Zweite Escape-Option — Richtung Turtle / Take-down.',
  ARRAY['Unter den Arm kommen','Hüfte raus','Aufsetzen auf Knie'],
  ARRAY['Kopf kontrollieren lassen','Zu lange flach']),
('Mount Escape — Bridge & Roll', 'mount-escape-bridge-roll', 'escape', 'full-mount', 'white', 'Klassisch: Arm fangen, Bein fangen, bridge-und-roll.',
  ARRAY['Arm fangen (Ellbogen)','Fuß hinter Fuß','Explosive Bridge zur Seite'],
  ARRAY['Ohne Arm/Fuß zu trappen bridgen']);
