// Separação PÚBLICO × MÉDICO.
//
// SEGURO POR PADRÃO: só as rotas listadas aqui ficam abertas (sem PIN) — para as
// famílias. QUALQUER outra rota é tratada como área médica e exige o PIN. Assim,
// nenhum conteúdo clínico (escalas, receitas, prontuário, doses…) vaza por
// esquecimento — o padrão é fechado.
//
// ATENÇÃO DE SEGURANÇA: num site estático o PIN é apenas uma tranca de UI — o
// conteúdo já está no bundle. Isolamento REAL exige autenticação no servidor
// (ex.: Cloudflare Access num subdomínio médico). Ver docs/SEGURANCA-ACESSO.md.

export const PUBLIC_ROUTE_PREFIXES: string[] = [
  "/login", // Entrada da autenticação remota
  "/sessao-expirada", // Recuperação de sessão remota
  "/familia", // Capa pública (home das famílias)
  "/pre-consulta", // Formulário pré-consulta para família/recepção
  "/pre-retorno", // Atualização familiar antes do retorno
  "/efeitos-colaterais", // Alias familiar seguro do pré-retorno
  "/verificar", // Validação pública de documento/QR; processamento somente local
  "/orientacao-parental", // Orientação aos Pais
  "/glossario", // Glossário (linguagem acessível)
  "/portal-familia", // Portal da Família (home pública)
  "/marcos-desenvolvimento", // Marcos do Desenvolvimento
  "/curvas-crescimento", // Curvas de Crescimento (OMS)
  "/caa", // CAA · Vou Falar
  "/sobre", // Sobre
  "/sobre-neuroped", // Sobre o NeuroPed
  "/ajuda", // Ajuda
  "/acessibilidade", // Acessibilidade
  "/consentimento-lgpd", // Consentimento LGPD
];

/** Home pública para onde mandamos as famílias a partir da tela do PIN. */
export const PUBLIC_HOME = "/familia";

export function normalizePath(input: string | null | undefined): string {
  const raw = (input || "/").replace(/^#/, "");
  const path = raw.split("?")[0]?.split("#")[0] || "/";
  const withSlash = path.startsWith("/") ? path : `/${path}`;
  return withSlash !== "/" ? withSlash.replace(/\/+$/, "") : "/";
}

/** Rota pública? Casa por igualdade OU por prefixo de segmento (…/algo). */
export function isPublicRoute(input: string | null | undefined): boolean {
  const path = normalizePath(input);
  return PUBLIC_ROUTE_PREFIXES.some(
    (p) => path === p || path.startsWith(`${p}/`),
  );
}

/** Caminho da rota atual a partir do hash (roteamento por hash). */
export function currentHashPath(): string {
  if (typeof window === "undefined") return "/";
  return normalizePath(window.location.hash || "/");
}
