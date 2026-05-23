// POST /api/car/listings — create a new car listing

export async function onRequestPost({ env }) {
  const id = crypto.randomUUID();
  const editToken = crypto.randomUUID();
  const now = new Date().toISOString();

  await env.DB.prepare(`
    INSERT INTO car_listings
      (id, edit_token, created_at, updated_at, photos)
    VALUES (?, ?, ?, ?, '[]')
  `).bind(id, editToken, now, now).run();

  return Response.json({ id, editToken }, { status: 201 });
}
