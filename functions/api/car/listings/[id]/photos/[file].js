// DELETE /api/car/listings/:id/photos/:file — remove a photo

export async function onRequestDelete({ params, env, request }) {
  try {
    const token = request.headers.get('x-edit-token');

    const listing = await env.DB
      .prepare('SELECT id, edit_token, photos FROM car_listings WHERE id = ?')
      .bind(params.id)
      .first();

    if (!listing) return Response.json({ error: 'Listing not found' }, { status: 404 });
    if (!token || token !== listing.edit_token)
      return Response.json({ error: 'Unauthorized' }, { status: 403 });

    const filename = params.file;
    const photos   = JSON.parse(listing.photos || '[]').filter(p => p !== filename);

    await env.DB
      .prepare('DELETE FROM car_photos WHERE listing_id=? AND filename=?')
      .bind(params.id, filename)
      .run();

    await env.DB
      .prepare('UPDATE car_listings SET photos=?, updated_at=? WHERE id=?')
      .bind(JSON.stringify(photos), new Date().toISOString(), params.id)
      .run();

    return Response.json({ photos });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
