/** The ingredients a user has at home, as ingredient ids. */
export type Pantry = readonly string[];

export function withIngredient(pantry: Pantry, ingredientId: string): Pantry {
  return pantry.includes(ingredientId) ? pantry : [...pantry, ingredientId];
}

export function withoutIngredient(pantry: Pantry, ingredientId: string): Pantry {
  return pantry.filter((id) => id !== ingredientId);
}
