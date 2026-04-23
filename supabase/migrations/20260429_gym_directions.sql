-- Add public transport + parking info fields to gym_settings for the directions section
ALTER TABLE gym_settings ADD COLUMN IF NOT EXISTS public_transport TEXT;
ALTER TABLE gym_settings ADD COLUMN IF NOT EXISTS parking_info TEXT;
ALTER TABLE gym_settings ADD COLUMN IF NOT EXISTS map_embed_url TEXT;

-- Seed defaults for AXISJJ (will be no-op if already customized)
UPDATE gym_settings
SET
  public_transport = COALESCE(public_transport, 'U-Bahn und Bus halten in der Nähe. Genaue Verbindung siehe Fahrplan.'),
  parking_info     = COALESCE(parking_info,     'Parkplätze in der Nähe verfügbar.')
WHERE id = 1;
