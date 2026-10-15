-- Background music managed from the admin panel ("Música"). Additive only: safe to run on production.
CREATE TABLE IF NOT EXISTS songs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  artist text,
  url text NOT NULL,
  alt_url text,
  gain real NOT NULL DEFAULT 1,
  start_at real NOT NULL DEFAULT 0,
  end_at real,
  duration real,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE settings ADD COLUMN IF NOT EXISTS show_song_title boolean NOT NULL DEFAULT false;

-- The first song, bundled with the site (public/musica/fondo-1.*), already trimmed and levelled.
INSERT INTO songs (title, artist, url, alt_url, gain, start_at, end_at, duration, sort_order)
SELECT 'Tattoo', 'Brendan Ross (sax)', '/musica/fondo-1.m4a', '/musica/fondo-1.webm', 1, 0, NULL, 181.48, 0
WHERE NOT EXISTS (SELECT 1 FROM songs);
