const APP_ORIGIN = "https://neuroped.invalid";

function parseAppUrl(href: string): URL | null {
  try {
    return new URL(href, APP_ORIGIN);
  } catch {
    return null;
  }
}

function hashSearchParams(url: URL): URLSearchParams {
  const hash = url.hash.replace(/^#/, "");
  const queryIndex = hash.indexOf("?");
  return new URLSearchParams(queryIndex >= 0 ? hash.slice(queryIndex + 1) : "");
}

function hasControlCharacters(value: string): boolean {
  return Array.from(value).some((character) => {
    const code = character.charCodeAt(0);
    return code <= 31 || code === 127;
  });
}

export function safeLoginDestination(candidate: string | null | undefined): string {
  const value = candidate?.trim() ?? "";
  if (
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    value.includes("#") ||
    hasControlCharacters(value)
  ) {
    return "/";
  }

  const parsed = parseAppUrl(value);
  if (!parsed || parsed.origin !== APP_ORIGIN) return "/";

  const normalizedPath =
    parsed.pathname !== "/" ? parsed.pathname.replace(/\/+$/, "") : "/";
  if (normalizedPath === "/login" || normalizedPath === "/sessao-expirada") {
    return "/";
  }

  return `${parsed.pathname}${parsed.search}`;
}

/**
 * Wouter em modo hash mantém o parâmetro `next` antes do hash em alguns
 * navegadores e dentro do hash em outros. Aceitamos ambos, sempre restritos a
 * caminhos internos, para voltar à aba clínica originalmente solicitada.
 */
export function resolveLoginDestination(href: string): string {
  const url = parseAppUrl(href);
  if (!url) return "/";
  const candidate =
    url.searchParams.get("next") ?? hashSearchParams(url).get("next");
  return safeLoginDestination(candidate);
}

/** Remove o parâmetro transitório sem apagar outros parâmetros do deploy. */
export function stripLoginNextParameter(href: string): string {
  const url = parseAppUrl(href);
  if (!url) return href;

  url.searchParams.delete("next");

  const hash = url.hash.replace(/^#/, "");
  const queryIndex = hash.indexOf("?");
  if (queryIndex >= 0) {
    const hashPath = hash.slice(0, queryIndex);
    const params = new URLSearchParams(hash.slice(queryIndex + 1));
    params.delete("next");
    const query = params.toString();
    url.hash = `#${hashPath}${query ? `?${query}` : ""}`;
  }

  return url.toString();
}
