/**
 * Camada anticópia / anti-rehost (dissuasão).
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
const DEFAULT_ALLOWED_HOSTS: ReadonlySet<string> = new Set([
  "neuroped.pages.dev",
  "superneuroped.vercel.app",
]);

/** Hosts de desenvolvimento local — sempre liberados. */
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1", ""]);

/**
 * Acesso via IP privado é útil quando o Vite é exposto com `--host 0.0.0.0`
 * e o navegador abre o WebUI por outro dispositivo da rede local. Isso só é
 * aceito quando o bundle é de desenvolvimento; builds de produção continuam
 * restritos aos hosts oficiais ou ao allowlist explícito.
 */
function isPrivateNetworkHost(host: string): boolean {
  const ipv4 = host.split(".");
  if (ipv4.length === 4 && ipv4.every((part) => /^(?:0|[1-9]\d{0,2})$/.test(part))) {
    const octets = ipv4.map(Number);
    if (octets.every((octet) => octet >= 0 && octet <= 255)) {
      const [a, b] = octets;
      return (
        a === 10 ||
        (a === 172 && b >= 16 && b <= 31) ||
        (a === 192 && b === 168) ||
        (a === 169 && b === 254)
      );
    }
  }

  const ipv6 = host.replace(/^\[/, "").replace(/\]$/, "");
  return ipv6 === "::1" || ipv6.startsWith("fc") || ipv6.startsWith("fd") || ipv6.startsWith("fe80:");
}

function normalizeHost(hostname: string | undefined | null): string {
  return (hostname ?? "")
    .trim()
    .toLowerCase()
    .replace(/^\[/, "")
    .replace(/\]$/, "")
    .replace(/\.$/, "");
}

function fromEnv(): string[] {
  try {
    const raw = (import.meta as { env?: Record<string, string | undefined> })
      .env?.VITE_ALLOWED_HOSTS;
    if (!raw) return [];
    return raw
      .split(",")
      .map((h) => normalizeHost(h))
      .filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * Retorna true se o hostname atual é um domínio oficial autorizado.
 * - hostname vazio (SSR/testes) → true (não bloqueia ambientes sem window).
 * - localhost e afins → true (desenvolvimento).
 * - IP privado → true somente quando `allowPrivateNetwork` é explicitamente
 *   habilitado pelo entrypoint de desenvolvimento.
 * - domínios do env VITE_ALLOWED_HOSTS → true (allowlist explícito).
 * Previews de plataforma e GitHub Pages permanecem bloqueados: somente hosts
 * estáveis com origem exclusiva recebem autenticação remota e dados clínicos.
 */
export function isAuthorizedHost(
  hostname: string | undefined | null,
  options: { allowPrivateNetwork?: boolean } = {},
): boolean {
  const host = normalizeHost(hostname);
  if (LOCAL_HOSTS.has(host)) return true;
  if (options.allowPrivateNetwork && isPrivateNetworkHost(host)) return true;

  const envHosts = fromEnv();
  if (envHosts.includes(host)) return true;

  return DEFAULT_ALLOWED_HOSTS.has(host);
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
