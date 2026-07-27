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
  "/filtro", // Filtro Clínico de Escalas — recomenda escalas por queixa/idade;
  "/filtro-escalas", // não exibe/armazena dado de paciente (aberto por decisão do autor)
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

// ESCALAS/INSTRUMENTOS abertos ao Filtro (decisão do autor): as escalas que o
// Filtro Clínico recomenda às famílias abrem SEM login. São instrumentos de
// avaliação (formulários em branco) — NÃO exibem nem gravam prontuário. As áreas
// de dado de paciente (prontuário, pacientes, receitas, laudo, documentos,
// fichas, /pant, testes diretos que capturam a resposta da criança) permanecem
// FECHADas atrás do login/PIN. Reversível: basta esvaziar esta lista.
//
// Prefixos cobrem os catch-alls dos acervos (ex.: /generic-scale/:id renderiza
// centenas de escalas; /classificacao/:id; /instrumentos-importados/:id).
export const SCALE_ROUTE_PREFIXES: string[] = [
  "/generic-scale", // Runner canônico de escalas (ficha/aplicação por id)
  "/classificacao", // Sistemas de classificação (MACS/CFCS/EDACS…) por id
  "/classificacoes", // Índice de classificações
  "/instrumentos-importados", // Instrumentos de referência importados por id
  // Páginas dedicadas de escalas/instrumentos recomendados pelo Filtro:
  "/mchat", "/cars", "/snap", "/denver", "/sdq", "/scared", "/conners",
  "/vineland", "/vineland-completo", "/cdi2", "/phqa", "/cssrs", "/crafft",
  "/cbcl", "/cbcl-interativo", "/vanderbilt", "/brief2", "/abc", "/asq3",
  "/pedsql", "/gmfcs", "/cshq", "/ygtss", "/tea", "/tea-comportamentos",
  "/psiquiatria", "/neuropsicologia", "/bateria-jadson", "/pac", "/ahsd-tea",
  "/emdi", "/eaf", "/ecsm", "/ips", "/ecar-si", "/edi", "/eai", "/easi",
  "/ems", "/etare", "/eaah", "/eusm10", "/epilepsia", "/cefaleia",
  "/psc17", "/gad7", "/aq10", "/aq50", "/tde", "/tde2", "/confias", "/portage",
  "/ballard", "/espasticidade", "/bayley", "/griffiths", "/rcads", "/masc2",
  "/leiter3", "/nepsy2", "/raven", "/wisc5", "/wppsi", "/pedicat",
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
  const matches = (p: string) => path === p || path.startsWith(`${p}/`);
  return PUBLIC_ROUTE_PREFIXES.some(matches) || SCALE_ROUTE_PREFIXES.some(matches);
}

/** Caminho da rota atual a partir do hash (roteamento por hash). */
export function currentHashPath(): string {
  if (typeof window === "undefined") return "/";
  return normalizePath(window.location.hash || "/");
}
