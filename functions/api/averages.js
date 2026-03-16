export async function onRequestGet({ env }) {
  const { results } = await env.DB.prepare(`
    SELECT
      pokemon_id,
      ROUND(AVG(battle_ability), 2) AS battleAbility,
      ROUND(AVG(appeal), 2)         AS appeal,
      ROUND(AVG(iconicness), 2)     AS iconicness,
      COUNT(*)                      AS count
    FROM ratings
    GROUP BY pokemon_id
  `).all();

  const averages = {};
  for (const row of results) {
    averages[row.pokemon_id] = {
      battleAbility: row.battleAbility,
      appeal: row.appeal,
      iconicness: row.iconicness,
      count: row.count,
    };
  }
  return Response.json(averages);
}
