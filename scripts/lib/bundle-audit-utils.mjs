/**
 * Funções puras do auditor de bundle. Mantê-las separadas permite testar o
 * parser sem depender de um build real ou executar o processo de auditoria.
 */

function readAttribute(tag, name) {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, "i"));
  return match?.[1] ?? match?.[2] ?? null;
}

export function normalizeLocalAssetHref(rawHref) {
  if (typeof rawHref !== "string") return null;
  const href = rawHref.trim();
  if (!href || /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(href)) return null;

  const encodedPath = href.split(/[?#]/, 1)[0].replaceAll("\\", "/");
  let decodedPath;
  try {
    decodedPath = decodeURIComponent(encodedPath);
  } catch {
    throw new Error(`URL de asset inválida: ${rawHref}`);
  }

  const relativePath = decodedPath.replace(/^\.?\//, "").replace(/^\/+/, "");
  const segments = relativePath.split("/");
  if (!relativePath || segments.some((segment) => !segment || segment === "." || segment === "..")) {
    throw new Error(`Caminho de asset inseguro ou inválido: ${rawHref}`);
  }
  return relativePath;
}

export function parseInitialJsAssets(html) {
  const entryFiles = Array.from(html.matchAll(/<script\b[^>]*>/gi))
    .map(([tag]) => ({ type: readAttribute(tag, "type"), src: readAttribute(tag, "src") }))
    .filter(({ type, src }) => type?.toLowerCase() === "module" && src)
    .map(({ src }) => normalizeLocalAssetHref(src))
    .filter(Boolean);

  const modulePreloadFiles = Array.from(html.matchAll(/<link\b[^>]*>/gi))
    .map(([tag]) => ({ rel: readAttribute(tag, "rel"), href: readAttribute(tag, "href") }))
    .filter(({ rel, href }) => rel?.toLowerCase().split(/\s+/).includes("modulepreload") && href)
    .map(({ href }) => normalizeLocalAssetHref(href))
    .filter(Boolean);

  return {
    entryFiles: Array.from(new Set(entryFiles)),
    modulePreloadFiles: Array.from(new Set(modulePreloadFiles)),
  };
}
