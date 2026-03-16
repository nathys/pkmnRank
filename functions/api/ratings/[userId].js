const clamp = v => Math.min(10, Math.max(0, Math.round(Number(v) * 2) / 2));

export async function onRequestGet({ params, env }) {
  const { results } = await env.DB.prepare(
    'SELECT pokemon_id, battle_ability, appeal, iconicness FROM ratings WHERE user_id = ?'
  ).bind(params.userId).all();

  const ratings = {};
  for (const row of results) {
    ratings[row.pokemon_id] = {
      battleAbility: row.battle_ability,
      appeal: row.appeal,
      iconicness: row.iconicness,
    };
  }
  return Response.json(ratings);
}

export async function onRequestPost({ params, env, request }) {
  const { pokemonId, battleAbility, appeal, iconicness } = await request.json();

  if (!pokemonId || [battleAbility, appeal, iconicness].some(v => v === undefined)) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const rating = {
    battleAbility: clamp(battleAbility),
    appeal: clamp(appeal),
    iconicness: clamp(iconicness),
  };

  await env.DB.prepare(
    'INSERT OR REPLACE INTO ratings (user_id, pokemon_id, battle_ability, appeal, iconicness) VALUES (?, ?, ?, ?, ?)'
  ).bind(params.userId, String(pokemonId), rating.battleAbility, rating.appeal, rating.iconicness).run();

  return Response.json({ success: true, rating });
}
