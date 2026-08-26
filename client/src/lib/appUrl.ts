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

interface AppLocationLike {
  hash?: string;
  search?: string;
}

/**
 * Retorna a query da rota real do app. Como o NeuroPed usa hash routing, links
 * internos como #/receita-c1?patientId=... não aparecem em location.search.
 */
export function currentAppSearchParams(
  locationLike?: AppLocationLike,
): URLSearchParams {
  const runtimeLocation =
    locationLike ??
    (typeof window !== "undefined" ? window.location : { hash: "", search: "" });
  const hash = String(runtimeLocation.hash ?? "").replace(/^#/, "");
  const queryIndex = hash.indexOf("?");
  if (queryIndex >= 0) {
    return new URLSearchParams(hash.slice(queryIndex + 1).split("#", 1)[0]);
  }
  return new URLSearchParams(String(runtimeLocation.search ?? ""));
}
