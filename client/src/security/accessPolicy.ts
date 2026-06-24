export type AccessLevel = "public" | "family" | "family-pass" | "clinical";

const PUBLIC_PREFIXES = [
  "/",
  "/login",
  "/sessao-expirada",
  "/portal-familia",
  "/psicoeducacao",
  "/orientacao-parental",
  "/novidades-familia",
  "/politica-acesso",
  "/portal-familia/novidades",
  "/portal-familia/acesso",
  "/caa",
  "/vou-falar",
  "/pre-consulta",
  "/pre-retorno",
  "/efeitos-colaterais",
  "/ajuda",
  "/sobre",
  "/sobre-neuroped",
  "/acessibilidade",
  "/glossario",
  "/qualidade",
  "/marcos-desenvolvimento",
  "/valores-referencia",
  "/curvas-crescimento",
];

const CLINICAL_PREFIXES = [
  "/pacientes",
  "/paciente",
  "/prontuario",
  "/historico",
  "/documentos",
  "/pant",
  "/pantc1",
  "/receitas",
  "/farmacologia",
  "/medicamentos",
  "/medicacoes",
  "/calculadora-dose",
  "/assinatura-digital",
  "/backup",
  "/exportacao",
  "/configuracoes-institucionais",
  "/satisfacao-medicacao",
  "/avaliacao-multiprofissional",
  "/plano-terapeutico",
  "/plano-intervencao",
  "/fichas-registro",
];

function normalizePath(pathname: string): string {
  const raw = pathname || "/";
  const withoutHash = raw.replace(/^#/, "");
  const withoutQuery = withoutHash.split("?")[0]?.split("#")[0] || "/";
  if (!withoutQuery.startsWith("/")) return `/${withoutQuery}`;
  return withoutQuery;
}

function matchesPrefix(pathname: string, prefix: string): boolean {
  if (prefix === "/") return pathname === "/";
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function getAccessLevel(pathname: string): AccessLevel {
  const path = normalizePath(pathname);

  if (CLINICAL_PREFIXES.some((prefix) => matchesPrefix(path, prefix))) {
    return "clinical";
  }

  if (PUBLIC_PREFIXES.some((prefix) => matchesPrefix(path, prefix))) {
    return "public";
  }

  return "public";
}

export function isClinicalRoute(pathname: string): boolean {
  return getAccessLevel(pathname) === "clinical";
}

export function isPublicRoute(pathname: string): boolean {
  return getAccessLevel(pathname) === "public";
}
