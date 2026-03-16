import pokemonData from '../../data/pokemon.json';

export function onRequestGet() {
  return Response.json(pokemonData);
}
