CREATE TABLE IF NOT EXISTS ratings (
  user_id      TEXT NOT NULL,
  pokemon_id   TEXT NOT NULL,
  battle_ability REAL,
  appeal         REAL,
  iconicness     REAL,
  PRIMARY KEY (user_id, pokemon_id)
);

CREATE TABLE IF NOT EXISTS car_listings (
  id           TEXT PRIMARY KEY,
  edit_token   TEXT NOT NULL,
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL,
  year         TEXT DEFAULT '',
  make         TEXT DEFAULT '',
  model        TEXT DEFAULT '',
  trim         TEXT DEFAULT '',
  mileage      TEXT DEFAULT '',
  color        TEXT DEFAULT '',
  condition    TEXT DEFAULT '',
  transmission TEXT DEFAULT '',
  fuel_type    TEXT DEFAULT '',
  drivetrain   TEXT DEFAULT '',
  vin          TEXT DEFAULT '',
  location     TEXT DEFAULT '',
  price        TEXT DEFAULT '',
  negotiable   INTEGER DEFAULT 0,
  description  TEXT DEFAULT '',
  contact_name  TEXT DEFAULT '',
  contact_phone TEXT DEFAULT '',
  contact_email TEXT DEFAULT '',
  active       INTEGER DEFAULT 1,
  photos       TEXT DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS car_photos (
  listing_id TEXT NOT NULL,
  filename   TEXT NOT NULL,
  data       TEXT NOT NULL,
  mime_type  TEXT DEFAULT 'image/jpeg',
  sort_order INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  PRIMARY KEY (listing_id, filename)
);
