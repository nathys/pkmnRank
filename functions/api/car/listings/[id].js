// GET  /api/car/listings/:id — public listing data
// PUT  /api/car/listings/:id — update listing (requires x-edit-token header)

function rowToListing(row) {
  return {
    id:          row.id,
    createdAt:   row.created_at,
    updatedAt:   row.updated_at,
    year:        row.year,
    make:        row.make,
    model:       row.model,
    trim:        row.trim,
    mileage:     row.mileage,
    color:       row.color,
    condition:   row.condition,
    transmission: row.transmission,
    fuelType:    row.fuel_type,
    drivetrain:  row.drivetrain,
    vin:         row.vin,
    location:    row.location,
    price:       row.price,
    negotiable:  !!row.negotiable,
    description: row.description,
    contactName:  row.contact_name,
    contactPhone: row.contact_phone,
    contactEmail: row.contact_email,
    active:      !!row.active,
    photos:      JSON.parse(row.photos || '[]'),
  };
}

function s(v) { return v == null ? '' : String(v); }

export async function onRequestGet({ params, env }) {
  const row = await env.DB
    .prepare('SELECT * FROM car_listings WHERE id = ?')
    .bind(params.id)
    .first();

  if (!row) return Response.json({ error: 'Listing not found' }, { status: 404 });
  return Response.json(rowToListing(row));
}

export async function onRequestPut({ params, env, request }) {
  const token = request.headers.get('x-edit-token');
  const meta = await env.DB
    .prepare('SELECT edit_token FROM car_listings WHERE id = ?')
    .bind(params.id)
    .first();

  if (!meta) return Response.json({ error: 'Listing not found' }, { status: 404 });
  if (!token || token !== meta.edit_token)
    return Response.json({ error: 'Unauthorized' }, { status: 403 });

  const b = await request.json();
  const now = new Date().toISOString();

  await env.DB.prepare(`
    UPDATE car_listings SET
      year=?, make=?, model=?, trim=?, mileage=?, color=?, condition=?,
      transmission=?, fuel_type=?, drivetrain=?, vin=?, location=?,
      price=?, negotiable=?, description=?,
      contact_name=?, contact_phone=?, contact_email=?,
      active=?, updated_at=?
    WHERE id=?
  `).bind(
    s(b.year), s(b.make), s(b.model), s(b.trim),
    s(b.mileage), s(b.color), s(b.condition),
    s(b.transmission), s(b.fuelType), s(b.drivetrain),
    s(b.vin), s(b.location), s(b.price),
    b.negotiable ? 1 : 0, s(b.description),
    s(b.contactName), s(b.contactPhone), s(b.contactEmail),
    b.active !== false ? 1 : 0, now,
    params.id
  ).run();

  const updated = await env.DB
    .prepare('SELECT * FROM car_listings WHERE id = ?')
    .bind(params.id)
    .first();

  return Response.json(rowToListing(updated));
}
