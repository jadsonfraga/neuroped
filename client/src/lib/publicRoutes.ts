// Separação PÚBLICO × MÉDICO.
//
// SEGURO POR PADRÃO: só as rotas exatas listadas aqui ficam abertas (sem PIN) —
// para as famílias. QUALQUER outra rota, inclusive uma subrota nova sob um
// caminho público, é tratada como área médica e exige o PIN. Assim, nenhum
// conteúdo clínico (escalas, receitas, prontuário, doses…) vaza por esquecimento.
//
// ATENÇÃO DE SEGURANÇA: num site estático o PIN é apenas uma tranca de UI — o
// conteúdo já está no bundle. Isolamento REAL exige autenticação no servidor
// (ex.: Cloudflare Access num subdomínio médico). Ver docs/SEGURANCA-ACESSO.md.

export const PUBLIC_ROUTES = [
  "/login", // Entrada da autenticação remota
  "/sessao-expirada", // Recuperação de sessão remota
  "/familia", // Capa pública (home das famílias)
  "/brincando-e-aprendendo", // Experiência educativa infantil sem dados clínicos
  "/missao-saude", // Percurso educativo em três estações, sem dados nem avaliação clínica
  "/agendar", // Perfil e autoagendamento público com dados mínimos cifrados
  "/marcacao", // Encaminhamento público para a Secretaria IA de triagem administrativa
  "/eletroencefalograma", // Orientação institucional de Vídeo-EEG, sem conteúdo clínico individual
  "/pre-consulta", // Formulário pré-consulta para família/recepção
  "/pre-retorno", // Atualização familiar antes do retorno
  "/efeitos-colaterais", // Alias familiar seguro do pré-retorno
  "/verificar", // Validação pública de documento/QR; processamento somente local
  "/filtro", // Filtro Clínico de Escalas — recomenda escalas por queixa/idade;
  "/filtro-escalas", // não exibe/armazena dado de paciente (aberto por decisão do autor)
  "/orientacao-parental", // Orientação aos Pais
  "/glossario", // Glossário (linguagem acessível)
  "/portal-familia", // Portal da Família (home pública)
  "/portal-familia/novidades", // Conteúdo editorial público do portal
  "/portal-familia/acesso", // Orientação pública de acesso ao portal
  "/responder-escalas", // Shell público para links temporários de escalas
  "/marcos-desenvolvimento", // Marcos do Desenvolvimento
  "/curvas-crescimento", // Curvas de Crescimento (OMS)
  "/caa", // CAA · Vou Falar
  "/sobre", // Sobre
  "/servicos-clinica", // Serviços institucionais da Clínica Jadson Fraga
  "/termos", // Termos de uso e aviso legal público
  "/sobre-neuroped", // Sobre o NeuroPed
  "/ajuda", // Ajuda
  "/acessibilidade", // Acessibilidade
  "/consentimento-lgpd", // Consentimento LGPD
] as const;

const PUBLIC_ROUTE_SET = new Set<string>(PUBLIC_ROUTES);
const FAMILY_SCALE_LINK_ROUTE = /^\/responder-escalas\/[A-Za-z0-9_-]{20,256}$/;

/** Home pública para onde mandamos as famílias a partir da tela do PIN. */
export const PUBLIC_HOME = "/familia";

export function normalizePath(input: string | null | undefined): string {
  const raw = (input || "/").replace(/^#/, "");
  const path = raw.split("?")[0]?.split("#")[0] || "/";
  const withSlash = path.startsWith("/") ? path : `/${path}`;
  return withSlash !== "/" ? withSlash.replace(/\/+$/, "") : "/";
}

/** Rota pública? Somente igualdade após normalização; subrotas não herdam acesso. */
export function isPublicRoute(input: string | null | undefined): boolean {
  const normalized = normalizePath(input);
  return PUBLIC_ROUTE_SET.has(normalized) || FAMILY_SCALE_LINK_ROUTE.test(normalized);
}

/** Caminho da rota atual a partir do hash (roteamento por hash). */
export function currentHashPath(): string {
  if (typeof window === "undefined") return "/";
  return normalizePath(window.location.hash || "/");
}
