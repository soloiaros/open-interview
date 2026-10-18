/** Keep post-login redirects inside the app. */
export function safeNext(next?: string) {
  if (next && next.startsWith("/") && !next.startsWith("//") && !next.includes("\\")) return next;
  return "/app";
}
