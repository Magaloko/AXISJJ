-- 003_seed.sql — Seed data: belt ranks, class types, skill categories
INSERT INTO belt_ranks (name, stripes, "order", min_time_months, min_sessions, color_hex) VALUES
  ('White',  0,  1,   0,    0, '#FFFFFF'),
  ('White',  1,  2,   2,   20, '#FFFFFF'),
  ('White',  2,  3,   4,   40, '#FFFFFF'),
  ('White',  3,  4,   6,   60, '#FFFFFF'),
  ('White',  4,  5,   8,   80, '#FFFFFF'),
  ('Blue',   0,  6,  12,  100, '#1D4ED8'),
  ('Blue',   1,  7,  18,  130, '#1D4ED8'),
  ('Blue',   2,  8,  24,  160, '#1D4ED8'),
  ('Blue',   3,  9,  30,  190, '#1D4ED8'),
  ('Blue',   4, 10,  36,  220, '#1D4ED8'),
  ('Purple', 0, 11,  48,  300, '#7C3AED'),
  ('Purple', 1, 12,  54,  340, '#7C3AED'),
  ('Purple', 2, 13,  60,  380, '#7C3AED'),
  ('Purple', 3, 14,  66,  420, '#7C3AED'),
  ('Purple', 4, 15,  72,  460, '#7C3AED'),
  ('Brown',  0, 16,  96,  600, '#78350F'),
  ('Brown',  1, 17, 102,  650, '#78350F'),
  ('Brown',  2, 18, 108,  700, '#78350F'),
  ('Brown',  3, 19, 114,  750, '#78350F'),
  ('Brown',  4, 20, 120,  800, '#78350F'),
  ('Black',  0, 21, 180, 1200, '#111111');

INSERT INTO class_types (name, description, level, gi) VALUES
  ('Fundamentals',           'Grundlagen für Weiße Gürtel und Anfänger',   'beginner', TRUE),
  ('All Levels Gi',          'Gi Training für alle Levels',                 'all',      TRUE),
  ('Advanced Gi',            'Gi für Blue Belt und höher',                  'advanced', TRUE),
  ('No-Gi All Levels',       'No-Gi für alle Levels',                       'all',      FALSE),
  ('No-Gi Advanced',         'No-Gi für Blue Belt und höher',               'advanced', FALSE),
  ('Kids BJJ',               'BJJ für Kinder (6–14 Jahre)',                 'kids',     TRUE),
  ('Open Mat',               'Freies Sparring, alle Levels',                'all',      TRUE),
  ('Strength & Conditioning','Konditionstraining',                          'all',      FALSE);

INSERT INTO skill_categories (name, "order") VALUES
  ('Guard',       1),
  ('Passing',     2),
  ('Submissions', 3),
  ('Takedowns',   4),
  ('Escapes',     5),
  ('Sweeps',      6);
