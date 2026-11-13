CREATE TABLE IF NOT EXISTS cafe_menu_ballots (
 id uuid PRIMARY KEY,
 item text NOT NULL CHECK (item IN ('chicken','fries')),
 special text NOT NULL CHECK (special IN ('meal','dessert')),
 country char(2) NOT NULL,
 dish varchar(100) NOT NULL DEFAULT ''
);
