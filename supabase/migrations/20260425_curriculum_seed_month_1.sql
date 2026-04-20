-- Curriculum Seed — "Month 1: Foundations" (50 Sessions / 4 Wochen)
--
-- Baut auf 20260425_curriculum.sql auf (Tabellen + 33 Techniken).
-- Erzeugt 1 Curriculum, 7 Tracks, 50 Sessions, ~80 session_techniques links.
-- Tracks werden per class_types (level + gi) gematcht — flexibel gegenüber
-- AXIS's tatsächlichen class_type Namen.
--
-- Rollback: DELETE FROM curricula WHERE slug = 'seed-month-1-foundations';
-- (cascaded zu allen Tracks, Sessions, session_techniques)

DO $seed$
DECLARE
  v_curriculum_id uuid;

  -- Class-type IDs (flexibel per level+gi)
  v_ct_gi_beginner uuid;
  v_ct_gi_advanced uuid;
  v_ct_nogi_beginner uuid;
  v_ct_nogi_advanced uuid;
  v_ct_kids uuid;

  -- Track IDs
  v_track_gi_fund uuid;
  v_track_gi_adv uuid;
  v_track_nogi_fund uuid;
  v_track_nogi_adv uuid;
  v_track_kids uuid;
  v_track_open_mat uuid;

  -- Session IDs (for technique linking)
  v_session_gi_w1_s1 uuid; v_session_gi_w1_s2 uuid; v_session_gi_w1_s3 uuid;
  v_session_gi_w2_s1 uuid; v_session_gi_w2_s2 uuid; v_session_gi_w2_s3 uuid;
  v_session_gi_w3_s1 uuid; v_session_gi_w3_s2 uuid; v_session_gi_w3_s3 uuid;
  v_session_gi_w4_s1 uuid; v_session_gi_w4_s2 uuid; v_session_gi_w4_s3 uuid;

BEGIN
  -- ── Prevent double-seed ──
  IF EXISTS (SELECT 1 FROM curricula WHERE slug = 'seed-month-1-foundations') THEN
    RAISE NOTICE 'Curriculum "seed-month-1-foundations" bereits vorhanden — Seed übersprungen.';
    RETURN;
  END IF;

  -- ── Lookup class_types (flexibel) ──
  SELECT id INTO v_ct_gi_beginner
    FROM class_types WHERE gi = true  AND level IN ('beginner','all') ORDER BY name LIMIT 1;
  SELECT id INTO v_ct_gi_advanced
    FROM class_types WHERE gi = true  AND level = 'advanced' ORDER BY name LIMIT 1;
  SELECT id INTO v_ct_nogi_beginner
    FROM class_types WHERE gi = false AND level IN ('beginner','all') ORDER BY name LIMIT 1;
  SELECT id INTO v_ct_nogi_advanced
    FROM class_types WHERE gi = false AND level = 'advanced' ORDER BY name LIMIT 1;
  SELECT id INTO v_ct_kids
    FROM class_types WHERE level = 'kids' ORDER BY name LIMIT 1;

  -- Fallbacks: wenn z.B. kein advanced existiert, nimm beginner
  v_ct_gi_advanced   := COALESCE(v_ct_gi_advanced,   v_ct_gi_beginner);
  v_ct_nogi_advanced := COALESCE(v_ct_nogi_advanced, v_ct_nogi_beginner);
  v_ct_nogi_beginner := COALESCE(v_ct_nogi_beginner, v_ct_gi_beginner);
  v_ct_kids          := COALESCE(v_ct_kids,          v_ct_gi_beginner);

  IF v_ct_gi_beginner IS NULL THEN
    RAISE EXCEPTION 'Kein class_type gefunden. Bitte zuerst class_types anlegen.';
  END IF;

  -- ── Curriculum ──
  INSERT INTO curricula (name, slug, description, duration_weeks, age_group, active)
  VALUES (
    'Month 1: Foundations',
    'seed-month-1-foundations',
    'Fundamentals-Lehrplan für Erwachsene — 4 Wochen, 50 Sessions. Gi, No-Gi, Kids und Open Mat. Basiert auf Gregoriades und Antunes (Beginner BJJ Canon).',
    4,
    'adults',
    true
  ) RETURNING id INTO v_curriculum_id;

  -- ── Tracks ──
  INSERT INTO curriculum_tracks (curriculum_id, class_type_id, name, sessions_per_week, sort_order) VALUES
    (v_curriculum_id, v_ct_gi_beginner,   'Gi Fundamentals',    3, 0) RETURNING id INTO v_track_gi_fund;
  INSERT INTO curriculum_tracks (curriculum_id, class_type_id, name, sessions_per_week, sort_order) VALUES
    (v_curriculum_id, v_ct_gi_advanced,   'Gi Advanced',        2, 1) RETURNING id INTO v_track_gi_adv;
  INSERT INTO curriculum_tracks (curriculum_id, class_type_id, name, sessions_per_week, sort_order) VALUES
    (v_curriculum_id, v_ct_nogi_beginner, 'No-Gi Fundamentals', 2, 2) RETURNING id INTO v_track_nogi_fund;
  INSERT INTO curriculum_tracks (curriculum_id, class_type_id, name, sessions_per_week, sort_order) VALUES
    (v_curriculum_id, v_ct_nogi_advanced, 'No-Gi Advanced',     1, 3) RETURNING id INTO v_track_nogi_adv;
  INSERT INTO curriculum_tracks (curriculum_id, class_type_id, name, sessions_per_week, sort_order) VALUES
    (v_curriculum_id, v_ct_kids,          'Kids',               3, 4) RETURNING id INTO v_track_kids;
  INSERT INTO curriculum_tracks (curriculum_id, class_type_id, name, sessions_per_week, sort_order) VALUES
    (v_curriculum_id, v_ct_gi_beginner,   'Open Mat / Sparring',1, 5) RETURNING id INTO v_track_open_mat;

  -- ─────────────────────────────────────────────────────────────
  -- TRACK 1: GI FUNDAMENTALS (12 Sessions, mit vollem Detail)
  -- ─────────────────────────────────────────────────────────────
  -- Week 1: Closed Guard Basics
  INSERT INTO curriculum_sessions (track_id, week_number, session_number, title, theme, objectives, warmup, drilling, sparring_focus, homework, duration_minutes)
  VALUES (v_track_gi_fund, 1, 1,
    'Closed Guard — Posture & Control',
    'Grundhaltung unten in Closed Guard: wie kontrolliere ich den Gegner, ohne Energie zu verlieren.',
    ARRAY['Hüft-Winkel statt flach auf Rücken','Grip + Kragen kontrollieren','Posture des Gegners brechen'],
    'Bridge ×20, Shrimp ×20 (jede Seite), Technical Standup ×5.',
    'Partner setzt Closed Guard — 3 min Posture halten ohne zu öffnen. Dann 3 min Posture brechen + Arm rüberziehen.',
    '2 min Rounds: unten darf nur Closed Guard halten, oben versucht zu öffnen oder Arm zu befreien.',
    '50× Shrimps + 50× Bridges als Tages-Ziel. Video: "Rickson Breathing 101".',
    90
  ) RETURNING id INTO v_session_gi_w1_s1;

  INSERT INTO curriculum_sessions (track_id, week_number, session_number, title, theme, objectives, warmup, drilling, sparring_focus, homework, prerequisite_id, duration_minutes)
  VALUES (v_track_gi_fund, 1, 2,
    'Scissor Sweep',
    'Rickson''s angeblich wichtigster Sweep — Hüft-Power + Arm-Kontrolle, kein Arm-Power.',
    ARRAY['Wrist + Arm der Sweep-Seite kontrollieren','Power aus Hüfte/Core, nicht Armen','COG des Partners heben'],
    'Hip-up Drill (Sweep ohne Partner) ×15 pro Seite.',
    'Partner in Closed Guard — 10× Scissor Sweep langsam. Dann 10× mit Widerstand 40%.',
    'Positional Sparring: unten startet in Closed Guard, muss mit Scissor sweepen und in Mount kommen.',
    'Schreibe: Welche 3 Checkpunkte hast du dir beim Sweep gemerkt?',
    v_session_gi_w1_s1,
    90
  ) RETURNING id INTO v_session_gi_w1_s2;

  INSERT INTO curriculum_sessions (track_id, week_number, session_number, title, theme, objectives, warmup, drilling, sparring_focus, homework, prerequisite_id, duration_minutes)
  VALUES (v_track_gi_fund, 1, 3,
    'Side Mount Escape — Guard Replacement',
    'Gregoriades Tipp #5 — ohne Escapes aus Side Mount kein Fortschritt bis Purple Belt.',
    ARRAY['Nacken zuerst schützen','Bridge + Shrimp Combo, nicht einzeln','Timing über Kraft'],
    'Shrimp-Rolls ×20, Seitwärts-Brücke ×10 pro Seite.',
    'Partner in Side Mount — 20× Guard Replacement in Zeitlupe. Dann 10× mit Widerstand.',
    'Positional: Du startest unter Side Mount, 30 sec. Escape oder Tap.',
    'Rolle 3 Runden. Notiere: wie oft warst du in Side Mount gefangen?',
    v_session_gi_w1_s1,
    90
  ) RETURNING id INTO v_session_gi_w1_s3;

  -- Week 2: Mount Offense + Defense
  INSERT INTO curriculum_sessions (track_id, week_number, session_number, title, theme, objectives, warmup, drilling, sparring_focus, homework, duration_minutes)
  VALUES (v_track_gi_fund, 2, 1,
    'Americana from Side Control',
    'Erste klassische Submission aus oberer Position — Figure-4 Hebel.',
    ARRAY['Handgelenk zuerst fixieren','Ellbogen auf Boden schleifen, dann Figure-4','Eigene Ellbogen tief'],
    'Hip-in Movement ×10 pro Seite, Chest-pressure Drill mit Partner.',
    '15× Americana langsam. Dann: Partner gibt Widerstand nur mit Arm.',
    'Start: Du in Side Mount. Finish mit Americana oder Transition zu Mount.',
    'Lies: Gregoriades Kapitel "Side Mount". Welche 3 Fehler macht er?',
    90
  ) RETURNING id INTO v_session_gi_w2_s1;

  INSERT INTO curriculum_sessions (track_id, week_number, session_number, title, theme, objectives, warmup, drilling, sparring_focus, homework, duration_minutes)
  VALUES (v_track_gi_fund, 2, 2,
    'Cross Collar Choke from Mount',
    'Der Choke, an dem man weiß dass man BJJ macht — tiefer Gi-Grip aus Mount.',
    ARRAY['Tiefe Kragen-Grips ziehen','Ellbogen zusammen (Dreieck)','Körper leicht senken, nicht nach vorn fallen'],
    'Mount-Balance Drill ×2 min, Knee-pressure ×10.',
    'Tiefer Grip-Practice 20×, dann Full Choke 10× im Zeitlupe.',
    '90 sec aus Mount — finish mit Cross Collar oder halte Mount.',
    'Probiere zuhause: Wie tief kriegst du den ersten Grip in 2 Sekunden?',
    90
  ) RETURNING id INTO v_session_gi_w2_s2;

  INSERT INTO curriculum_sessions (track_id, week_number, session_number, title, theme, objectives, warmup, drilling, sparring_focus, homework, duration_minutes)
  VALUES (v_track_gi_fund, 2, 3,
    'Mount Escape — Bridge & Roll (Upa)',
    'Die Gegen-Seite zu Session 2 — wie raus aus Mount.',
    ARRAY['Arm fangen (Ellbogen an eigenen Körper)','Fuß hinter Fuß','Explosive Bridge zur Seite mit Arm'],
    'Bridge-Explosivität Drill ×15, einseitig pro Seite.',
    '20× Escape in Slow-Mo, dann mit Widerstand 40%.',
    'Start in Mount — Escape oder Tap. 60 sec Rounds.',
    'Versuche heute Abend: 30-sec Plank + 15 explosive Bridges.',
    90
  ) RETURNING id INTO v_session_gi_w2_s3;

  -- Week 3: Takedowns + Back
  INSERT INTO curriculum_sessions (track_id, week_number, session_number, title, theme, objectives, warmup, drilling, sparring_focus, homework, duration_minutes)
  VALUES (v_track_gi_fund, 3, 1,
    'Double Leg Takedown',
    'Antunes White Belt Must-Have — Wrestling-basierter Takedown.',
    ARRAY['Level change mit Knie, nicht Rücken','Kopf auf Brust oder Seite, nie nach unten','Drive aus Hüfte'],
    'Penetration-Step ×20, Sprawl ×15.',
    'Double Leg ohne Widerstand 15×. Dann Partner wehrt sich leicht.',
    'Start: Standup, 30-sec. Takedown = Punkt, abgeprallt = andere Seite.',
    'Schaue 5 Min Double-Leg-Highlights, identifiziere den Level-Change-Moment.',
    90
  ) RETURNING id INTO v_session_gi_w3_s1;

  INSERT INTO curriculum_sessions (track_id, week_number, session_number, title, theme, objectives, warmup, drilling, sparring_focus, homework, duration_minutes)
  VALUES (v_track_gi_fund, 3, 2,
    'Standing Guard Break + Pass',
    'Gregoriades Tipp #4 — Closed Guard öffnen durch Aufstehen.',
    ARRAY['Posture halten beim Aufstehen','Hand auf Bauch','Pass erst wenn Beine wirklich offen'],
    'Standing Transitions ×10, Posture Drill in Guard 2 min.',
    'In Closed Guard, stehe auf → breche → passe zu Side Mount. 10×.',
    'Positional: Unten = Closed Guard halten, Oben = Stand + Pass. 90 sec.',
    'Suche ein Video von Roger Gracie''s Standing Pass. Was macht er anders?',
    90
  ) RETURNING id INTO v_session_gi_w3_s2;

  INSERT INTO curriculum_sessions (track_id, week_number, session_number, title, theme, objectives, warmup, drilling, sparring_focus, homework, duration_minutes)
  VALUES (v_track_gi_fund, 3, 3,
    'Back Mount — Seatbelt Control',
    'Kontrolle wichtiger als Finish — Seatbelt-Grip + Hooks aktiv.',
    ARRAY['Seatbelt: over + under','Kopf an Kopf','Füße NIE kreuzen (Foot-lock!)'],
    'Back-take Drill aus Mount ×10, Seatbelt-Setup ×15.',
    'Partner in Back, du in Back Mount — 60 sec halten ohne Control zu verlieren.',
    'Aus Back Mount halten — nicht mal versuchen zu chokeln. Focus: Control.',
    'Merke dir: Über-/Unterhook Seite. Schreib auf welche für dich natürlicher ist.',
    90
  ) RETURNING id INTO v_session_gi_w3_s3;

  -- Week 4: Integration
  INSERT INTO curriculum_sessions (track_id, week_number, session_number, title, theme, objectives, warmup, drilling, sparring_focus, homework, duration_minutes)
  VALUES (v_track_gi_fund, 4, 1,
    'Half Guard — Frames & Knee Shield',
    'Zwischenposition meistern — nicht flach liegen.',
    ARRAY['Niemals flach, immer auf Seite','Unterarm-Frame gegen Kopf','Knee Shield hoch'],
    'Technical-standup from bottom ×10, Frame-Building Drill.',
    'Partner in Half Guard — 20× Knee-Shield setzen in Slow-Mo.',
    'Start unten in Half Guard — sweepe oder mache es zu Single-Leg Takedown.',
    'Journal: Welche 3 Gemeinsamkeiten hat Half Guard mit Closed Guard?',
    90
  ) RETURNING id INTO v_session_gi_w4_s1;

  INSERT INTO curriculum_sessions (track_id, week_number, session_number, title, theme, objectives, warmup, drilling, sparring_focus, homework, duration_minutes)
  VALUES (v_track_gi_fund, 4, 2,
    'Triangle Choke from Guard',
    'Die ikonische Jiu-Jitsu Submission — Bein-Choke aus Closed/Open Guard.',
    ARRAY['Einen Arm durchlassen, einen nicht','Winkel 45° vom Partner','Bein hinter Kopf ziehen, nicht über'],
    'Leg-Throw Drill ×15, Angle-Creation Drill ×10.',
    '15× Triangle-Setup langsam. Dann Finish.',
    'Start: Partner in deiner Guard. Finde Triangle oder Straight Armlock.',
    'Stretche deine Hip-Mobility — 10 min Pigeon Pose.',
    90
  ) RETURNING id INTO v_session_gi_w4_s2;

  INSERT INTO curriculum_sessions (track_id, week_number, session_number, title, theme, objectives, warmup, drilling, sparring_focus, homework, duration_minutes)
  VALUES (v_track_gi_fund, 4, 3,
    'Full Round Flow — Review',
    'Alles aus den 4 Wochen in 6 min Flow-Runden integrieren.',
    ARRAY['Kein Widerstand — Flow','Alle Positionen berühren','Bewusst atmen'],
    '5 min langer Warmup mit allen Bewegungen der 4 Wochen.',
    'Partner-Rotation: 3 min Flow-Rolls, dann Partner wechseln. 4 Runden.',
    '5 min richtiges Sparring zum Abschluss — teste was hängen geblieben ist.',
    'Month-1-Quiz wartet im Admin. Schaffst du 10/10?',
    90
  ) RETURNING id INTO v_session_gi_w4_s3;

  -- ─────────────────────────────────────────────────────────────
  -- TRACK 2: GI ADVANCED (8 Sessions, kürzer)
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO curriculum_sessions (track_id, week_number, session_number, title, theme, objectives, duration_minutes) VALUES
  (v_track_gi_adv, 1, 1, 'Butterfly Guard — Hook Control',     'Aktive Guard mit Butterfly-Hooks — Sweep-heavy.',              ARRAY['Underhook','Kopf unter Arm','Hook elevation'], 90),
  (v_track_gi_adv, 1, 2, 'Leg Drag Pass',                       'Moderner IBJJF-Pass — Bein quer ziehen, Shoulder pressure.',    ARRAY['Bein am Knie greifen','Drag über','Shoulder Druck'], 90),
  (v_track_gi_adv, 2, 1, 'Balloon Sweep (Flower)',              'Spektakulärer Sweep aus Closed Guard.',                        ARRAY['Grip hoch','Heben','Rollen'], 90),
  (v_track_gi_adv, 2, 2, 'Knee Squeeze Pass',                   'Aggressive Pass-Technik durch Knie-Squeeze.',                  ARRAY['Knie tief','Squeeze','Step over'], 90),
  (v_track_gi_adv, 3, 1, 'Bow & Arrow Choke',                   'Finishing-Choke aus Back Mount mit Gi.',                        ARRAY['Tiefer Kragen','Bein über Schulter','Zieh + dreh'], 90),
  (v_track_gi_adv, 3, 2, 'Back Escapes — Elbow Escape',         'Aus Back Mount rauskommen — Ellbogen + Schulter zur Seite.',   ARRAY['Hand am Nacken','Schulter runter','Ellbogen durchschieben'], 90),
  (v_track_gi_adv, 4, 1, 'Kimura Trap System Intro',            'Kimura-Grip als Control — nicht nur als Finish.',              ARRAY['Kimura-Grip halten','Transition zu Back','Transition zu Sweep'], 90),
  (v_track_gi_adv, 4, 2, 'Spider Guard — Grips & Sweeps',       'Offene Guard mit Ärmel-Grips + Füße an Bizeps.',              ARRAY['Ärmel-Grips','Fuß in Bizeps','De La Spider Sweep'], 90);

  -- ─────────────────────────────────────────────────────────────
  -- TRACK 3: NO-GI FUNDAMENTALS (8 Sessions)
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO curriculum_sessions (track_id, week_number, session_number, title, theme, objectives, duration_minutes) VALUES
  (v_track_nogi_fund, 1, 1, 'Underhooks & Over-Unders',         'Gripfighting ohne Gi — Underhook ist Gold.',                    ARRAY['Underhook tiefer als Gegner','Kopf gegen Kopf','Hip control'], 90),
  (v_track_nogi_fund, 1, 2, 'Sprawl + Front Headlock',          'Verteidige dich gegen Takedowns + Attack der Wrestler.',       ARRAY['Sprawl hart + flach','Front Headlock tief','Offense vor Defense'], 90),
  (v_track_nogi_fund, 2, 1, 'Guillotine Choke',                 'Der eine Submission die jeder No-Gi Grappler lernen muss.',    ARRAY['Hand unter Kinn','Ellbogen eng','Gewicht nach hinten'], 90),
  (v_track_nogi_fund, 2, 2, 'Guillotine Defense',               'Guillotine Verteidigung von unten und oben.',                   ARRAY['Stack, nicht nach hinten','Shoulder rein','Hand zwischen Kinn'], 90),
  (v_track_nogi_fund, 3, 1, 'Single Leg Takedown',              'No-Gi Klassiker — Bein greifen und hochheben.',                ARRAY['Kopf außen','Bein fest','Run the pipe'], 90),
  (v_track_nogi_fund, 3, 2, 'Double Leg Takedown — No-Gi',      'Double Leg ohne Gi-Grips — muss aggressiver sein.',            ARRAY['Penetration Step','Clinch zuerst','Drive hard'], 90),
  (v_track_nogi_fund, 4, 1, 'Heel Hook Defense Only',           'Reine Defense-Session — noch KEIN Heel Hook Offense.',          ARRAY['Immer True Foot nach außen','Hip zu Druck','Verbal Tap bei Pain'], 90),
  (v_track_nogi_fund, 4, 2, 'Knee on Belly — Grips & Sub',      'Transition aus Side Mount zu Knee-on-Belly.',                   ARRAY['Knie quer','Toes off mat','Kragen-Grip für Choke oder Armlock'], 90);

  -- ─────────────────────────────────────────────────────────────
  -- TRACK 4: NO-GI ADVANCED (4 Sessions)
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO curriculum_sessions (track_id, week_number, session_number, title, theme, objectives, duration_minutes) VALUES
  (v_track_nogi_adv, 1, 1, 'Leg Lock Intro — Straight Ankle',   'Straight Foot Lock aus 50/50 — nur safe submissions.',          ARRAY['Fuß unter Achsel','Hüft-Druck','Klein Finger oben'], 90),
  (v_track_nogi_adv, 2, 1, 'Wrestling Pummeling',                 'Clinch-Wars — Underhook wechseln.',                             ARRAY['Tiefer Underhook','Kopf rein','Level change möglich'], 90),
  (v_track_nogi_adv, 3, 1, 'Scramble Situations',                 'Aus halbfertigen Positionen Initiative ergreifen.',             ARRAY['Hände zuerst','Base wiederfinden','Hip switch'], 90),
  (v_track_nogi_adv, 4, 1, 'Guard Retention — No-Gi',             'Guard halten ohne Grips — Bein-Frames + Hip movement.',        ARRAY['Hip in der Luft','Knee Shield','Hände auf Hüften'], 90);

  -- ─────────────────────────────────────────────────────────────
  -- TRACK 5: KIDS (12 Sessions — Spiele > Technik)
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO curriculum_sessions (track_id, week_number, session_number, title, theme, objectives, duration_minutes) VALUES
  (v_track_kids, 1, 1, 'Shark & Fish — Fall Safely',              'Fallen lernen als Spiel.',                                    ARRAY['Kopf einziehen','Auf die Hüfte rollen','Nicht Hände aufstützen'], 60),
  (v_track_kids, 1, 2, 'Bridge Game — „Bau eine Brücke"',         'Bridge-Bewegung spielerisch.',                                ARRAY['Hüfte hoch','Fersen drücken','Halten zählen'], 60),
  (v_track_kids, 1, 3, 'Shrimp Races',                            'Shrimp von einer Matten-Seite zur anderen.',                   ARRAY['Schulter zuerst','Füße wegdrücken','Stabile Haltung'], 60),
  (v_track_kids, 2, 1, 'Turtle to Guard',                         'Aus Turtle zur Guard rollen.',                                  ARRAY['Klein machen','Rollen auf Schulter','Beine wickeln'], 60),
  (v_track_kids, 2, 2, 'Respekt & Grüßen',                        'Werte-Session — warum grüßen wir Sensei.',                     ARRAY['Verbeugen','Händeschütteln','Dank aussprechen'], 60),
  (v_track_kids, 2, 3, 'Safety Landings',                         'Break-falls — auf Rücken + Seite ohne Hände.',                 ARRAY['Hand schlägt vor Hüfte','Kopf einziehen','Exhale beim Fall'], 60),
  (v_track_kids, 3, 1, 'Knee-on-Belly Game',                      'Wer kann Knee-on-Belly am längsten halten?',                   ARRAY['Knie quer','Balance','Atmen'], 60),
  (v_track_kids, 3, 2, 'Basic Sweep — Hip Bump',                  'Erster Sweep als Challenge.',                                   ARRAY['Auf Ellbogen','Hüfte hochstoßen','Partner zur Seite'], 60),
  (v_track_kids, 3, 3, 'Partner Trust Exercises',                 'Mit Partner arbeiten, nicht gegen ihn.',                       ARRAY['Langsam','Kommunikation','Tap = Stop sofort'], 60),
  (v_track_kids, 4, 1, 'Mini Tournament — Round Robin',           'Spielerischer Wettkampf in 3er-Gruppen.',                      ARRAY['Fair','Partner gratulieren','Verlieren ist ok'], 60),
  (v_track_kids, 4, 2, 'Games Review Day',                         'Alle Spiele der 4 Wochen.',                                     ARRAY['Zusammenarbeit','Spaß','Was haben wir gelernt'], 60),
  (v_track_kids, 4, 3, 'Belt Ceremony & Reflection',              'Streifen vergeben, über Fortschritt sprechen.',                ARRAY['Stolz sein','Ziele setzen','Brotherhood Gefühl'], 60);

  -- ─────────────────────────────────────────────────────────────
  -- TRACK 6: OPEN MAT / SPARRING (4 Sessions)
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO curriculum_sessions (track_id, week_number, session_number, title, theme, objectives, duration_minutes) VALUES
  (v_track_open_mat, 1, 1, 'Positional — Guard Top vs Bottom',   'Startposition nur Guard — wer kommt weiter?',                   ARRAY['Unten: sweep oder submit','Oben: pass oder submit','4 min Runden'], 90),
  (v_track_open_mat, 2, 1, 'Specific — Escape Side Mount',       'Jeder startet unter Side Mount — Escape oder Tap.',             ARRAY['Escape oder Tap','3 Partner wechseln','Bewusstsein für eigenes Spiel'], 90),
  (v_track_open_mat, 3, 1, 'Flow Rolling',                       'Null Widerstand — Positions-Wechsel fließen lassen.',           ARRAY['Atmen','Keine Submission erzwingen','Erkennen lernen'], 90),
  (v_track_open_mat, 4, 1, 'Live Sparring — 5 Rounds',           'Volle Runden — Anwenden was du gelernt hast.',                  ARRAY['Ruhig bleiben','Atmen','Aus Runden lernen'], 90);

  -- ─────────────────────────────────────────────────────────────
  -- 2 SPECIALS (addiert im Gi Fundamentals Track, jenseits der 3/Woche)
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO curriculum_sessions (track_id, week_number, session_number, title, theme, objectives, duration_minutes) VALUES
  (v_track_gi_fund, 2, 4, 'SPECIAL — Women Self-Defense Workshop', 'Praxis-orientiert: häufige Bedrohungen, safe release, loud + clear.',
    ARRAY['Distance management','Guillotine + Arm Drags','Self-defense mindset'], 120),
  (v_track_gi_fund, 4, 4, 'SPECIAL — Competition Prep',           'IBJJF Ruleset, Warmup-Routine, Match-Strategie.',
    ARRAY['IBJJF Scoring','Warmup 15 min','Mental prep'], 120);

  -- ─────────────────────────────────────────────────────────────
  -- SESSION_TECHNIQUES: Gi Fundamentals Sessions → Techniken verlinken
  -- ─────────────────────────────────────────────────────────────

  -- Week 1
  INSERT INTO session_techniques (session_id, technique_id, phase, sort_order)
    SELECT v_session_gi_w1_s1, id, 'warmup', 0 FROM techniques WHERE slug = 'bridge';
  INSERT INTO session_techniques (session_id, technique_id, phase, sort_order)
    SELECT v_session_gi_w1_s1, id, 'warmup', 1 FROM techniques WHERE slug = 'shrimp';
  INSERT INTO session_techniques (session_id, technique_id, phase, sort_order)
    SELECT v_session_gi_w1_s1, id, 'main', 0   FROM techniques WHERE slug = 'closed-guard';
  INSERT INTO session_techniques (session_id, technique_id, phase, sort_order)
    SELECT v_session_gi_w1_s1, id, 'main', 1   FROM techniques WHERE slug = 'straight-armlock-guard';

  INSERT INTO session_techniques (session_id, technique_id, phase, sort_order)
    SELECT v_session_gi_w1_s2, id, 'main', 0 FROM techniques WHERE slug = 'scissor-sweep';
  INSERT INTO session_techniques (session_id, technique_id, phase, sort_order)
    SELECT v_session_gi_w1_s2, id, 'review', 0 FROM techniques WHERE slug = 'closed-guard';

  INSERT INTO session_techniques (session_id, technique_id, phase, sort_order)
    SELECT v_session_gi_w1_s3, id, 'warmup', 0 FROM techniques WHERE slug = 'shrimp';
  INSERT INTO session_techniques (session_id, technique_id, phase, sort_order)
    SELECT v_session_gi_w1_s3, id, 'main', 0 FROM techniques WHERE slug = 'side-mount-escape-guard';

  -- Week 2
  INSERT INTO session_techniques (session_id, technique_id, phase, sort_order)
    SELECT v_session_gi_w2_s1, id, 'main', 0 FROM techniques WHERE slug = 'side-mount';
  INSERT INTO session_techniques (session_id, technique_id, phase, sort_order)
    SELECT v_session_gi_w2_s1, id, 'main', 1 FROM techniques WHERE slug = 'americana-side';

  INSERT INTO session_techniques (session_id, technique_id, phase, sort_order)
    SELECT v_session_gi_w2_s2, id, 'main', 0 FROM techniques WHERE slug = 'full-mount';
  INSERT INTO session_techniques (session_id, technique_id, phase, sort_order)
    SELECT v_session_gi_w2_s2, id, 'main', 1 FROM techniques WHERE slug = 'cross-collar-mount';

  INSERT INTO session_techniques (session_id, technique_id, phase, sort_order)
    SELECT v_session_gi_w2_s3, id, 'warmup', 0 FROM techniques WHERE slug = 'bridge';
  INSERT INTO session_techniques (session_id, technique_id, phase, sort_order)
    SELECT v_session_gi_w2_s3, id, 'main', 0 FROM techniques WHERE slug = 'mount-escape-bridge-roll';

  -- Week 3
  INSERT INTO session_techniques (session_id, technique_id, phase, sort_order)
    SELECT v_session_gi_w3_s1, id, 'main', 0 FROM techniques WHERE slug = 'double-leg';

  INSERT INTO session_techniques (session_id, technique_id, phase, sort_order)
    SELECT v_session_gi_w3_s2, id, 'main', 0 FROM techniques WHERE slug = 'standing-guard-break';
  INSERT INTO session_techniques (session_id, technique_id, phase, sort_order)
    SELECT v_session_gi_w3_s2, id, 'review', 0 FROM techniques WHERE slug = 'closed-guard';

  INSERT INTO session_techniques (session_id, technique_id, phase, sort_order)
    SELECT v_session_gi_w3_s3, id, 'main', 0 FROM techniques WHERE slug = 'back-mount';
  INSERT INTO session_techniques (session_id, technique_id, phase, sort_order)
    SELECT v_session_gi_w3_s3, id, 'main', 1 FROM techniques WHERE slug = 'rear-naked-choke';

  -- Week 4
  INSERT INTO session_techniques (session_id, technique_id, phase, sort_order)
    SELECT v_session_gi_w4_s1, id, 'main', 0 FROM techniques WHERE slug = 'half-guard';
  INSERT INTO session_techniques (session_id, technique_id, phase, sort_order)
    SELECT v_session_gi_w4_s1, id, 'main', 1 FROM techniques WHERE slug = 'kimura-half-guard';

  INSERT INTO session_techniques (session_id, technique_id, phase, sort_order)
    SELECT v_session_gi_w4_s2, id, 'main', 0 FROM techniques WHERE slug = 'triangle-choke';
  INSERT INTO session_techniques (session_id, technique_id, phase, sort_order)
    SELECT v_session_gi_w4_s2, id, 'review', 0 FROM techniques WHERE slug = 'straight-armlock-guard';

  INSERT INTO session_techniques (session_id, technique_id, phase, sort_order)
    SELECT v_session_gi_w4_s3, id, 'review', 0 FROM techniques WHERE slug IN
      ('closed-guard','scissor-sweep','side-mount-escape-guard','americana-side',
       'cross-collar-mount','mount-escape-bridge-roll','double-leg',
       'standing-guard-break','back-mount','triangle-choke');

  RAISE NOTICE 'Month 1 Foundations seeded: curriculum_id=%', v_curriculum_id;
END $seed$;
