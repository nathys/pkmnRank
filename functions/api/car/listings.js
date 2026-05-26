// POST /api/car/listings — create a new car listing
//
// Runs CREATE TABLE IF NOT EXISTS before inserting so the schema
// bootstraps itself on first use without a manual wrangler migration.

async function ensureSchema(db) {
  await db.exec(`
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
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS car_photos (
      listing_id TEXT NOT NULL,
      filename   TEXT NOT NULL,
      data       TEXT NOT NULL,
      mime_type  TEXT DEFAULT 'image/jpeg',
      sort_order INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      PRIMARY KEY (listing_id, filename)
    )
  `);
}

export async function onRequestPost({ env }) {
  try {
    await ensureSchema(env.DB);

    const id        = crypto.randomUUID();
    const editToken = crypto.randomUUID();
    const now       = new Date().toISOString();

    await env.DB.prepare(`
      INSERT INTO car_listings
        (id, edit_token, created_at, updated_at, photos)
      VALUES (?, ?, ?, ?, '[]')
    `).bind(id, editToken, now, now).run();

    return Response.json({ id, editToken }, { status: 201 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
