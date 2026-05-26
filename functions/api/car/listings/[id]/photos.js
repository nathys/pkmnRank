// POST /api/car/listings/:id/photos?token=xxx
// Body: { photos: [{ data: "<base64>", mimeType: "image/jpeg" }] }

export async function onRequestPost({ params, env, request }) {
  try {
    const token = new URL(request.url).searchParams.get('token');

    const listing = await env.DB
      .prepare('SELECT id, edit_token, photos FROM car_listings WHERE id = ?')
      .bind(params.id)
      .first();

    if (!listing) return Response.json({ error: 'Listing not found' }, { status: 404 });
    if (!token || token !== listing.edit_token)
      return Response.json({ error: 'Unauthorized' }, { status: 403 });

    const photos = JSON.parse(listing.photos || '[]');
    if (photos.length >= 20)
      return Response.json({ error: 'Maximum 20 photos per listing' }, { status: 400 });

    const body     = await request.json();
    const incoming = (body.photos || []).slice(0, 20 - photos.length);
    if (!incoming.length)
      return Response.json({ error: 'No photos provided' }, { status: 400 });

    const now   = new Date().toISOString();
    const added = [];

    for (let i = 0; i < incoming.length; i++) {
      const photo = incoming[i];
      if (!photo.data) continue;
      const ext      = photo.mimeType === 'image/png' ? '.png' : '.jpg';
      const filename = `${Date.now()}${i}-${Math.random().toString(36).slice(2)}${ext}`;

      await env.DB.prepare(`
        INSERT INTO car_photos (listing_id, filename, data, mime_type, sort_order, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        params.id, filename, photo.data,
        photo.mimeType || 'image/jpeg',
        photos.length + added.length, now
      ).run();

      added.push(filename);
    }

    const newPhotos = [...photos, ...added];
    await env.DB
      .prepare('UPDATE car_listings SET photos=?, updated_at=? WHERE id=?')
      .bind(JSON.stringify(newPhotos), now, params.id)
      .run();

    return Response.json({ photos: newPhotos });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
