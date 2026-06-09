import type { ScaleEntry } from "@/data/scaleFilter";

export const firstLineByQueixa: Record<string, string[]> = {
  tea: ["/mchat", "/ips", "/cars", "/tea", "/vineland", "/testes-diretos"],
  tdah: ["/snap", "/vanderbilt", "/conners", "/brief2", "/sdq", "/testes-diretos", "/testes-reconhecimento"],
  ansiedade: ["/scared", "/sdq", "/cbcl", "/testes-diretos"],
  depressao: ["/cdi2", "/phqa", "/cssrs", "/sdq"],
  suicidio: ["/cssrs", "/phqa"],
  aprendizagem: ["/pdae", "/tde2", "/testes-academicos", "/testes-diretos", "/testes-reconhecimento", "/inventarios-escola"],
  linguagem: ["/asq3", "/denver", "/testes-diretos", "/testes-reconhecimento"],
  atraso: ["/denver", "/asq3", "/vineland", "/pant"],
  comportamento: ["/sdq", "/cbcl", "/conners", "/vanderbilt", "/eaah"],
  sono: ["/cshq"],
  tiques: ["/ygtss", "/conners"],
  cognicao: ["/testes-diretos", "/testes-reconhecimento", "/testes-academicos", "/pant"],
  funcionalidade: ["/vineland", "/gmfcs"],
  motor: ["/testes-diretos", "/gmfcs"],
  pc: ["/gmfcs", "/testes-diretos"],
};

export const firstLineByCrossed: Record<string, string[]> = {
  "tdah+tea": ["/mchat", "/snap", "/conners", "/vineland", "/sdq", "/testes-diretos"],
  "ansiedade+tdah": ["/snap", "/scared", "/sdq", "/cbcl", "/testes-diretos"],
  "aprendizagem+tdah": ["/snap", "/pdae", "/testes-academicos", "/testes-diretos", "/tde2"],
  "ansiedade+depressao": ["/scared", "/cdi2", "/phqa", "/cssrs"],
  "depressao+suicidio": ["/cssrs", "/phqa", "/cdi2"],
  "linguagem+tea": ["/mchat", "/asq3", "/testes-diretos", "/testes-reconhecimento"],
  "atraso+tea": ["/mchat", "/denver", "/asq3", "/vineland"],
  "comportamento+tdah": ["/snap", "/conners", "/sdq", "/eaah"],
  "aprendizagem+tea": ["/testes-academicos", "/pdae", "/vineland", "/testes-diretos"],
  "ansiedade+tea": ["/scared", "/sdq", "/cars"],
};

export const protectedLicenseKinds = new Set<ScaleEntry["licencaUso"]>([
  "restrita",
  "comercial",
  "contato_autor",
]);

export const psicoeducacaoRoutes = new Set(["/orientacao-parental", "/portal-familia"]);
export const postConsultComplaints = new Set(["efeitos", "evolucao"]);

export function crossedKey(queixas: string[]): string {
  return [...queixas].sort().join("+");
}

export function isPreConsulta(scale: ScaleEntry): boolean {
  if (scale.prioridade === "monitorizacao") return false;
  if (scale.appRoute && psicoeducacaoRoutes.has(scale.appRoute)) return false;
  return true;
}

export function unique(scales: ScaleEntry[]): ScaleEntry[] {
  const seenId = new Set<string>();
  const seenFullName = new Set<string>();
  return scales.filter((scale) => {
    const fullNameKey = (scale.fullName || "").toLowerCase().trim();
    if (seenId.has(scale.id) || (fullNameKey && seenFullName.has(fullNameKey))) return false;
    seenId.add(scale.id);
    if (fullNameKey) seenFullName.add(fullNameKey);
    return true;
  });
}

export function curatedBoost(route: string | undefined, selectedQueixas: string[]): number {
  if (!route || selectedQueixas.length === 0) return 0;
  let boost = 0;

  if (selectedQueixas.length >= 2) {
    const combo = firstLineByCrossed[crossedKey(selectedQueixas)];
    const index = combo?.indexOf(route) ?? -1;
    if (index >= 0) boost = Math.max(boost, 35 - index * 4);
  }

  for (const queixa of selectedQueixas) {
    const list = firstLineByQueixa[queixa];
    const index = list?.indexOf(route) ?? -1;
    if (index >= 0) boost = Math.max(boost, 24 - index * 3);
  }

  return boost;
}

export function clinicianOnlyPenalty(
  appRoute: string | undefined,
  respondente: ScaleEntry["respondente"],
  prioridade: ScaleEntry["prioridade"] | undefined,
): number {
  if (appRoute) return 0;
  const onlyClinico = respondente.length > 0 && respondente.every((r) => r === "clinico");
  return onlyClinico && prioridade === "diagnostica" ? -18 : 0;
}
