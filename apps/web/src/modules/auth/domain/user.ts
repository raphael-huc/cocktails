export type User = {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  /**
   * Language chosen for the account, as a Directus code such as "fr-FR".
   * `null` until the user picks one.
   */
  language: string | null;
};

export function displayName(user: User): string {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");
  return fullName || user.email || "";
}
