-- Site Theme: developer-editable colors, live on all pages (public + admin)
-- Stored in a JSONB column on gym_settings so it's one row, fast to load

ALTER TABLE gym_settings
  ADD COLUMN IF NOT EXISTS theme JSONB;

-- Default theme for existing rows
UPDATE gym_settings
SET theme = COALESCE(theme, jsonb_build_object(
  'primary',           '#e63946',
  'primaryForeground', '#ffffff',
  'secondary',         '#1a1a2e',
  'secondaryForeground','#ffffff',
  'accent',            '#e63946',
  'accentForeground',  '#ffffff',
  'background',        '#fafaf8',
  'foreground',        '#1a1a1a',
  'card',              '#f4f2ef',
  'border',            '#d9d6d1'
))
WHERE id = 1;
