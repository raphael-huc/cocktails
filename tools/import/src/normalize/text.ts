/**
 * Comparison form of a name: lower case, no accents, no punctuation, single
 * spaces. "Créme de Cassis" and "creme de cassis" become the same key.
 */
export function normalizeText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/['’`]/g, "")
    .replace(/[^a-z0-9/]+/g, " ")
    .trim();
}

export function slugify(text: string): string {
  return normalizeText(text).replace(/[ /]+/g, "-");
}

export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
