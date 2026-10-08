// O SPA roteia por hash (`/#/agendar`). Um link por caminho
// (`neuroped.pages.dev/agendar?provider=x`), digitado ou compartilhado, cai no
// fallback do Cloudflare/Vercel e recebe o index.html — mas o roteador lia o
// hash vazio como "/" e mandava a família para o login com `next=/`, perdendo
// a rota e a query. Esta função converte esse caminho, uma única vez, no hash
// equivalente, sem tocar em microsites estáticos nem em callbacks externos.

/** Diretórios servidos como arquivos estáticos (client/public), nunca pelo SPA. */
const STATIC_PREFIXES = [
  "api",
  "assets",
  "audio",
  "data",
  "integracoes",
  "nesplora",
  "obs10-global",
  "recognition-v2",
] as const;

const SAFE_PATH = /^\/[a-z0-9][a-z0-9\-/]*$/i;
const MAX_PATH_LENGTH = 120;

export interface LocationLike {
  pathname: string;
  search: string;
  hash: string;
}

/**
 * Retorna a URL relativa (`/#/rota?query`) que deve substituir a atual, ou
 * `null` quando nada precisa mudar.
 */
export function pathDeepLinkToHash(location: LocationLike): string | null {
  // Já roteado por hash (inclusive `/#/`): o hash é a fonte da verdade.
  if (location.hash && location.hash !== "#") return null;

  const path = location.pathname.replace(/\/+$/, "");
  if (!path || path === "/index.html") return null;
  if (path.length > MAX_PATH_LENGTH || !SAFE_PATH.test(path)) return null;

  const firstSegment = path.split("/")[1]?.toLowerCase() ?? "";
  if ((STATIC_PREFIXES as readonly string[]).includes(firstSegment)) return null;

  // Callback do Gov.br/SNCR volta com `session_id` na query do caminho; ele
  // é consumido por completeSncrCallbackIfPresent e não pode ir para o hash.
  const params = new URLSearchParams(location.search);
  if (params.has("session_id")) return null;

  return `/#${path}${location.search}`;
}
