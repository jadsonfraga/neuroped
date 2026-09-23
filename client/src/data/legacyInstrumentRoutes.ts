/**
 * Redirects de rotas nominais LEGADAS de instrumentos para a superfície
 * canônica única.
 *
 * Por que existe: até 09/2026 cada uma destas URLs renderizava uma segunda
 * ficha técnica (ScaleFichaPage) paralela à ficha canônica de
 * /generic-scale/:id — duas superfícies para o mesmo instrumento, uma delas
 * sem o banner de disponibilidade. No caso do RCADS a rota nominal chegava a
 * ESCONDER a aplicação interativa real que já existia em /generic-scale/rcads.
 *
 * Estas entradas preservam bookmarks/URLs externas antigas. O destino é sempre
 * uma rota canônica existente (nunca outro redirect) — invariante travada por
 * scripts/guards/audit-instruments.mjs.
 */
export const LEGACY_INSTRUMENT_REDIRECTS: Record<string, string> = {
  "/wisc5": "/generic-scale/wisc5",
  "/bayley": "/generic-scale/bayley",
  "/vineland": "/generic-scale/vineland",
  "/leiter3": "/generic-scale/leiter3",
  "/raven": "/generic-scale/raven",
  "/wppsi": "/generic-scale/wppsi",
  "/nepsy2": "/generic-scale/nepsy2",
  "/griffiths": "/generic-scale/griffiths",
  "/masc2": "/generic-scale/masc2",
  "/rcads": "/generic-scale/rcads",
  "/tde": "/generic-scale/tde",
  "/confias": "/generic-scale/confias",
  "/pedicat": "/generic-scale/pedicat",
  "/portage": "/generic-scale/portage",
  "/vineland-completo": "/generic-scale/vineland",
  // A "versão interativa" nominal do CBCL nunca existiu como aplicação própria;
  // a aplicação real e completa do CBCL vive em /cbcl.
  "/cbcl-interativo": "/cbcl",
};

/**
 * Redirects das rotas legadas restantes de teste direto para a Sonda Dez.
 * /testes-reconhecimento voltou a ter superfície própria e não pertence mais a este mapa.
 *
 * Por que existe: a consolidação "os testes diretos convergem para a Sonda
 * Dez" (commit f2d7f48) esvaziou 15 páginas em shims de duas linhas que
 * reexportavam /testes-diretos — 16 rotas e 15 lazy chunks para renderizar a
 * MESMA página, cada rota com política de acesso própria divergindo da
 * canônica. Estas entradas preservam bookmarks antigos e fazem a política de
 * acesso do destino valer também na origem (ver CLINICAL_ROLE_OVERRIDES em
 * routeGuardPolicy.ts). Sanidade travada por audit-instruments.mjs.
 */
export const LEGACY_DIRECT_TEST_REDIRECTS: Record<string, string> = {
  "/testes-academicos": "/testes-diretos",
  "/cognitive-lab": "/testes-diretos",
  "/cognitive-lab/:taskId": "/testes-diretos",
  "/avaliacao-cognitiva-infantil": "/testes-diretos",
  "/academico-interativo": "/testes-diretos",
  "/escrita-desenho": "/testes-diretos",
  "/conhecimento-visual": "/testes-diretos",
  "/motricidade-teste": "/testes-diretos",
  "/conhecimentos-gerais": "/testes-diretos",
  "/funcoes-executivas": "/testes-diretos",
  "/atencao-concentracao": "/testes-diretos",
  "/linguagem-fonologia": "/testes-diretos",
  "/memoria-teste": "/testes-diretos",
  "/processamento-visuoauditivo": "/testes-diretos",
};
