CREATE TABLE IF NOT EXISTS ratings (
  user_id      TEXT NOT NULL,
  pokemon_id   TEXT NOT NULL,
  battle_ability REAL,
  appeal         REAL,
  iconicness     REAL,
  PRIMARY KEY (user_id, pokemon_id)
);
