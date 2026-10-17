-- Members invited without a name (only how many adults and children): the family may write it on their
-- invitation, and correct it later. Additive only: safe to run on production.
ALTER TABLE guests ADD COLUMN IF NOT EXISTS name_from_guest boolean NOT NULL DEFAULT false;
