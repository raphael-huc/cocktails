/**
 * Where to go after signing in. Only paths inside the application are
 * accepted, so a crafted link cannot send the user to another site.
 */
export function safeRedirect(target: string | undefined): string {
  return target?.startsWith("/") && !target.startsWith("//") ? target : "/";
}
