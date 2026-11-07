/**
 * Telas que dependem de rascunho/histórico no dispositivo e ainda não têm
 * armazenamento vinculado à clínica. Numa sessão LIVE autenticada elas só
 * exibem o aviso de bloqueio (política LGPD de persistência no navegador),
 * então não são oferecidas no menu, no dock nem na paleta de comandos: a rota
 * continua acessível por URL e mostra o aviso explicativo.
 * Fonte: diagnóstico de 07/11/2026, achado 4.
 *
 * Módulo separado de routeGuardPolicy de propósito: as listas de papéis
 * (SENSITIVE/READER) daquele arquivo são auditadas por texto, e esta lista não
 * concede nem remove acesso a papel algum.
 *
 * "/conecta" fica fora: ele também é a âncora da política de conexões do menu
 * (atalho do app externo DrJadsoneye) e já exibe o próprio aviso em LIVE.
 */
export const LIVE_UNAVAILABLE_NAV_ROUTES = [
  "/diario-sono",
  "/diario-alimentar",
  "/diario-aderencia",
  "/diario-desregulacao",
  "/diario-dieta-sensorial",
  "/diario-escola",
  "/epilepsia",
  "/cefaleia",
  "/pre-consulta",
  "/pre-retorno",
  "/efeitos-colaterais",
  "/recepcao",
  "/assinatura-digital",
  "/memoria-clinica",
] as const;

export function isLiveUnavailableNavRoute(path: string): boolean {
  const normalized = String(path || "/").split(/[?#]/, 1)[0].replace(/\/+$/, "") || "/";
  return (LIVE_UNAVAILABLE_NAV_ROUTES as readonly string[]).includes(normalized);
}
