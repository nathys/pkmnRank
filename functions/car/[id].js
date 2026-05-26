// Serve car-view.html for /car/:id without any redirect.
// Using env.ASSETS keeps the original URL in the browser so car.js
// can read the listing ID from window.location.pathname.
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  url.pathname = '/car-view.html';
  return env.ASSETS.fetch(url);
}
