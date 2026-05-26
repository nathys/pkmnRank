// GET /api/car/photos/:listingId/:file — serve a stored photo from D1

export async function onRequestGet({ params, env }) {
  try {
    const row = await env.DB
      .prepare('SELECT data, mime_type FROM car_photos WHERE listing_id=? AND filename=?')
      .bind(params.listingId, params.file)
      .first();

    if (!row) return new Response('Not found', { status: 404 });

    const bytes = Uint8Array.from(atob(row.data), c => c.charCodeAt(0));

    return new Response(bytes, {
      headers: {
        'Content-Type': row.mime_type || 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (err) {
    return new Response(err.message, { status: 500 });
  }
}
