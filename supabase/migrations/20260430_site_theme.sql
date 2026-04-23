-- Site Theme: developer-editable colors, live on all pages (public + admin)

ALTER TABLE gym_settings
  ADD COLUMN IF NOT EXISTS theme JSONB;

-- Default theme: dark mode (red/black brand)
UPDATE gym_settings
SET theme = COALESCE(theme, jsonb_build_object(
  'primary',           '#e8000f',
  'primaryForeground', '#ffffff',
  'secondary',         '#1a1a1a',
  'secondaryForeground','#ffffff',
  'accent',            '#e8000f',
  'accentForeground',  '#ffffff',
  'background',        '#0a0a0a',
  'foreground',        '#f5f5f5',
  'card',              '#141414',
  'border',            '#2a2a2a'
))
WHERE id = 1;
