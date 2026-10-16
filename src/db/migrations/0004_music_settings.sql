-- Sound settings of the background music, chosen in the admin panel ("Música"). Additive only: safe to run on production.
ALTER TABLE settings ADD COLUMN IF NOT EXISTS music_volume real NOT NULL DEFAULT 0.7;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS music_fade_in real NOT NULL DEFAULT 0;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS music_crossfade real NOT NULL DEFAULT 6;
