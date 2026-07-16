/** Monta uma URL hash do app preservando o subdiretório do deploy (GitHub Pages). */
export function buildAppHashUrl(
  path: string,
  query: Record<string, string> = {},
  baseUri?: string,
): string {
  const fallback = "https://neuroped.pages.dev/";
  const runtimeBase =
    baseUri ??
    (typeof document !== "undefined" ? document.baseURI : fallback);
  const base = new URL("./", runtimeBase);
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const search = new URLSearchParams(query).toString();
  base.hash = `${normalizedPath}${search ? `?${search}` : ""}`;
  return base.toString();
}
