import {
  LEGACY_DIRECT_TEST_REDIRECTS,
  LEGACY_INSTRUMENT_REDIRECTS,
} from "@/data/legacyInstrumentRoutes";

/**
 * Rotas que o roteador de App.tsx reconhece. Serve para uma única finalidade:
 * um endereço que NÃO existe deve mostrar a página 404 de imediato, em vez de
 * ficar preso em "Verificando acesso seguro…" (rotas desconhecidas são tratadas
 * como área clínica pela política de acesso, que falha fechada).
 *
 * Não concede acesso a nada: rotas conhecidas continuam passando pelo
 * RouteGuard/PrivateGate. O teste tests/unit/known-routes-sync.test.mjs falha
 * se App.tsx ganhar uma rota que não esteja nesta lista.
 *
 * "/documentos" e "/especialidades" são resolvidas dentro de not-found.tsx
 * (com guarda própria) e por isso constam aqui.
 */
export const KNOWN_ROUTE_PATTERNS: readonly string[] = [
  "/",
  "/abc",
  "/acessibilidade",
  "/agenda",
  "/agendar",
  "/ahsd-tea",
  "/ajuda",
  "/aq10",
  "/aq50",
  "/asq3",
  "/assinatura-digital",
  "/avaliacao-multiprofissional",
  "/avaliacao-pre-consulta-faixa-etaria",
  "/ballard",
  "/bateria-jadson",
  "/biblioteca-instrumentos",
  "/billing/retorno",
  "/brief2",
  "/brincando-e-aprendendo",
  "/caa",
  "/cadastro",
  "/calculadora-dose",
  "/cars",
  "/cbcl",
  "/cdi2",
  "/cefaleia",
  "/classificacao/:id",
  "/classificacoes",
  "/conecta",
  "/configuracoes",
  "/conners",
  "/consentimento-lgpd",
  "/crafft",
  "/cshq",
  "/cssrs",
  "/curvas-crescimento",
  "/denver",
  "/diario-aderencia",
  "/diario-alimentar",
  "/diario-desregulacao",
  "/diario-dieta-sensorial",
  "/diario-escola",
  "/diario-sono",
  "/documentos",
  "/dyslexia-risk",
  "/eaah",
  "/eaf",
  "/eai",
  "/easi",
  "/ecar-si",
  "/ecsm",
  "/edi",
  "/efeitos-colaterais",
  "/eletroencefalograma",
  "/emdi",
  "/ems",
  "/epilepsia",
  "/escalas-neuropsiquiatria",
  "/escuta-clinica",
  "/espasticidade",
  "/especialidades",
  "/esqueci-senha",
  "/etare",
  "/eusm10",
  "/familia",
  "/farmacologia",
  "/fichas-registro",
  "/filtro",
  "/filtro-escalas",
  "/fluxograma",
  "/fluxogramas",
  "/gad7",
  "/generic-scale/:id",
  "/glossario",
  "/gmfcs",
  "/instrumentos-padronizados",
  "/inventarios-auto",
  "/inventarios-escola",
  "/invite",
  "/ips",
  "/laudo-neuroped",
  "/laudo-super",
  "/laudo-um-clique",
  "/evolucao-escalas",
  "/resumo-pre-consulta",
  "/checagem-dose",
  "/login",
  "/marcacao",
  "/marcos-desenvolvimento",
  "/mchat",
  "/medicamentos",
  "/memoria-clinica",
  "/missao-saude",
  "/neuroacompanhamento",
  "/neuropad-arena",
  "/neuropsicologia",
  "/onboarding",
  "/orientacao-parental",
  "/pac",
  "/paciente/:id",
  "/pacientes",
  "/pant",
  "/pdae",
  "/pedsql",
  "/phqa",
  "/plano-intervencao",
  "/plano-terapeutico",
  "/planos",
  "/por-faixa-etaria",
  "/portal-familia",
  "/portal-familia/acesso",
  "/portal-familia/novidades",
  "/pre-consulta",
  "/pre-retorno",
  "/privacidade",
  "/prontuario",
  "/psc17",
  "/psiquiatria",
  "/qualidade",
  "/receita-c1",
  "/receita-c1-express",
  "/recepcao",
  "/redefinir-senha",
  "/satisfacao-medicacao",
  "/scared",
  "/sdq",
  "/servicos-clinica",
  "/sessao-expirada",
  "/snap",
  "/sobre",
  "/sobre-neuroped",
  "/super-neuropad-game",
  "/tde2",
  "/tea",
  "/tea-comportamentos",
  "/termos",
  "/termos-de-uso",
  "/testes-cognitivos",
  "/testes-diretos",
  "/testes-reconhecimento",
  "/valores-referencia",
  "/vanderbilt",
  "/verificar",
  "/verificar-email",
  "/ygtss",
];

function segments(path: string): string[] {
  return path.split("/").filter(Boolean);
}

function normalize(path: string): string {
  const pathname = path.split(/[?#]/, 1)[0] || "/";
  return pathname !== "/" ? pathname.replace(/\/+$/, "") : "/";
}

function matches(pathname: string, pattern: string): boolean {
  const a = segments(pathname);
  const b = segments(pattern);
  return a.length === b.length && b.every((seg, i) => seg.startsWith(":") || seg === a[i]);
}

export function isKnownRoute(path: string): boolean {
  const pathname = normalize(path);
  if (pathname in LEGACY_INSTRUMENT_REDIRECTS || pathname in LEGACY_DIRECT_TEST_REDIRECTS) {
    return true;
  }
  return KNOWN_ROUTE_PATTERNS.some((pattern) => matches(pathname, pattern));
}
