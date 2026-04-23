-- Landing page section visibility toggles (developer-controlled)

CREATE TABLE IF NOT EXISTS landing_sections (
  key         TEXT PRIMARY KEY,
  label       TEXT        NOT NULL,
  description TEXT,
  enabled     BOOLEAN     NOT NULL DEFAULT true,
  sort_order  INT         NOT NULL DEFAULT 0,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE landing_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "landing_sections readable by all"
  ON landing_sections FOR SELECT USING (true);

CREATE POLICY "landing_sections writable by owner or developer"
  ON landing_sections FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('owner', 'developer')
    )
  );

INSERT INTO landing_sections (key, label, description, sort_order, enabled) VALUES
  ('head_coach_spotlight', 'Head Coach Spotlight', 'Vollbild-Porträt des Head Coaches mit Bio, Belt-Leiste und Erfolgen', 1, true),
  ('contact_card',         'Kontakt-Sektion',      'Adresse, Telefon, E-Mail und Website als eigene Landing-Page-Sektion', 2, true)
ON CONFLICT (key) DO NOTHING;
