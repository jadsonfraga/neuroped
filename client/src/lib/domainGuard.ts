/**
 * Camada anticópia / antipirataria (dissuasão).
 *
 * IMPORTANTE — honestidade técnica: um app estático servido ao navegador
 * NÃO pode ser tornado tecnicamente impossível de copiar. O código-fonte do
 * cliente é sempre entregue ao dispositivo do usuário. Isto aqui é uma camada
 * de DISSUASÃO (não de prevenção absoluta):
 *   1. Trava de domínio (anti-rehost): se alguém baixar o build e re-hospedar
 *      num domínio não autorizado, o app se recusa a rodar e mostra um aviso
 *      de "cópia não autorizada".
 *   2. Aviso de propriedade/console.
 * Proteção real de conteúdo exige backend (autenticação/autorização no edge).
 */

/** Domínios oficiais onde o NeuroPed pode rodar. */
const DEFAULT_ALLOWED_HOSTS: string[] = [
  "jadsonfraga.github.io",
  "neuroped.pages.dev",
  "neuroped.vercel.app",
  "superneuroped.vercel.app",
];

/** Sufixos de domínio permitidos (previews oficiais das plataformas). */
const DEFAULT_ALLOWED_SUFFIXES: string[] = [
  ".neuroped.pages.dev", // previews de branch do Cloudflare Pages
];

/** Hosts de desenvolvimento local — sempre liberados. */
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1", ""]);

function fromEnv(): string[] {
  try {
    const raw = (import.meta as { env?: Record<string, string | undefined> })
      .env?.VITE_ALLOWED_HOSTS;
    if (!raw) return [];
    return raw
      .split(",")
      .map((h) => h.trim().toLowerCase())
      .filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * Retorna true se o hostname atual é um domínio oficial autorizado.
 * - hostname vazio (SSR/testes) → true (não bloqueia ambientes sem window).
 * - localhost e afins → true (desenvolvimento).
 * - domínios do env VITE_ALLOWED_HOSTS → true (override configurável).
 * - qualquer *.vercel.app do projeto (previews) → true.
 */
export function isAuthorizedHost(hostname: string | undefined | null): boolean {
  const host = (hostname ?? "").trim().toLowerCase();
  if (LOCAL_HOSTS.has(host)) return true;

  const envHosts = fromEnv();
  if (envHosts.includes(host)) return true;

  const exact = new Set([...DEFAULT_ALLOWED_HOSTS, ...envHosts]);
  if (exact.has(host)) return true;

  for (const suffix of DEFAULT_ALLOWED_SUFFIXES) {
    if (host.endsWith(suffix)) return true;
  }

  // Deploys e previews oficiais dos dois projetos Vercel.
  if (/^(?:neuroped|superneuroped)[a-z0-9-]*\.vercel\.app$/.test(host))
    return true;

  return false;
}

/** Aviso de propriedade impresso no console (dissuasão + rastro autoral). */
export function printProprietaryNotice(): void {
  try {
    console.log(
      "%cNeuroPed © 2026 · Dr. Jadson Fraga",
      "font-weight:bold;font-size:13px",
    );
    console.log(
      "Conteúdo proprietário e educativo. Cópia, redistribuição ou re-hospedagem " +
        "não autorizada é proibida e pode violar direitos autorais.",
    );
  } catch {
    /* console indisponível — ignora */
  }
}
