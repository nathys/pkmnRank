CREATE TABLE IF NOT EXISTS ratings (
  user_id      TEXT NOT NULL,
  pokemon_id   TEXT NOT NULL,
  battle_ability REAL NOT NULL,
  appeal         REAL NOT NULL,
  iconicness     REAL NOT NULL,
  PRIMARY KEY (user_id, pokemon_id)
);
