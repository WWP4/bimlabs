ALTER TABLE cafe_menu_ballots_round2 ADD COLUMN IF NOT EXISTS first_name text, ADD COLUMN IF NOT EXISTS last_name text;
CREATE UNIQUE INDEX IF NOT EXISTS cafe_poll_round2_named_voter ON cafe_menu_ballots_round2 (first_name,last_name,country);
