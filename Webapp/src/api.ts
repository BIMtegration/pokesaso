// Utilidad para interactuar con la Pokémon TCG API
// https://pokemontcg.io/

const API_URL = '/api-tcg/v2/cards';
const API_KEY = import.meta.env.VITE_POKEMON_TCG_API_KEY;

// Obtiene el total de cartas y luego una carta aleatoria por id
// Carga rápida: primero 3 cartas aleatorias, luego reemplaza por una realmente aleatoria del total
export async function fetchRandomPokemonCard() {
  // Pide solo una carta de una página aleatoria para máxima velocidad
  const page = Math.floor(Math.random() * 100) + 1;
  const res = await fetch(`${API_URL}?page=${page}&pageSize=1`, {
    headers: {
      'X-Api-Key': API_KEY,
    },
  });
  const data = await res.json();
  if (data.data && data.data.length > 0) {
    return data.data[0];
  }
  throw new Error('No se pudo obtener una carta aleatoria');
}
