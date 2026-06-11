import type { ScaleEntry } from "@/data/scaleFilter";

/**
 * Itens aplicaveis que existem como paginas/ferramentas do app, mas nao estavam
 * necessariamente dentro de `allScales`. Mantem tudo filtravel sem apagar o
 * catalogo clinico principal.
 */
export const supplementalFilterableInstruments: ScaleEntry[] = [
  {
    id: "testes-reconhecimento",
    name: "Testes de Reconhecimento",
    fullName: "Cores, letras, animais e partes do corpo por faixa etária",
    ageMin: 24,
    ageMax: 84,
    queixas: ["atraso", "linguagem", "cognicao", "aprendizagem"],
    respondente: ["clinico", "crianca"],
    prioridade: "triagem",
    tempo: "5–10 min",
    appRoute: "/testes-reconhecimento",
    description: "Testes diretos e lúdicos de reconhecimento infantil para rastreio rápido durante a consulta.",
    licencaUso: "autoral",
    applicationMode: "teste_direto_crianca",
    assessmentUse: "triagem",
    implementationStatus: "complete",
  },
  {
    id: "testes-academicos",
    name: "Testes Acadêmicos",
    fullName: "Leitura, escrita e aritmética por faixa etária",
    ageMin: 60,
    ageMax: 168,
    queixas: ["aprendizagem", "tdah", "cognicao"],
    respondente: ["clinico", "crianca"],
    prioridade: "triagem",
    tempo: "10–20 min",
    appRoute: "/testes-academicos",
    description: "Aplicação direta de tarefas acadêmicas para rastreio de dificuldades escolares.",
    licencaUso: "autoral",
    applicationMode: "teste_direto_crianca",
    assessmentUse: "triagem",
    implementationStatus: "complete",
  },
  {
    id: "inventarios-auto",
    name: "Inventários de Autoavaliação",
    fullName: "Humor, ansiedade, atenção, sono, alimentação, social, escola e comportamento",
    ageMin: 96,
    ageMax: 216,
    queixas: ["ansiedade", "depressao", "tdah", "sono", "alimentacao", "social", "comportamento"],
    respondente: ["crianca", "autoaplicavel"],
    prioridade: "triagem",
    tempo: "10–15 min",
    appRoute: "/inventarios-auto",
    description: "Autoavaliações para crianças maiores e adolescentes, úteis em triagem e seguimento.",
    licencaUso: "autoral",
    applicationMode: "autoquestionario_crianca_adolescente",
    literacyRequirement: "alfabetizado",
    implementationStatus: "complete",
  },
  {
    id: "tde2-adaptado",
    name: "TDE-2 Adaptado",
    fullName: "Teste de desempenho escolar — leitura, escrita e aritmética",
    ageMin: 48,
    ageMax: 168,
    queixas: ["aprendizagem", "cognicao", "tdah"],
    respondente: ["clinico"],
    prioridade: "triagem",
    tempo: "15–25 min",
    appRoute: "/tde2",
    description: "Rastreio estruturado de desempenho escolar no app.",
    licencaUso: "autoral",
    applicationMode: "teste_direto_crianca",
    assessmentUse: "triagem",
    implementationStatus: "complete",
  },
  {
    id: "ahsd-tea-triagem",
    name: "Triagem AH/SD × TEA",
    fullName: "Altas habilidades/superdotação com diferencial para perfil autista",
    ageMin: 72,
    ageMax: 216,
    queixas: ["cognicao", "tea", "social", "aprendizagem"],
    respondente: ["clinico"],
    prioridade: "triagem",
    tempo: "10–20 min",
    appRoute: "/ahsd-tea",
    description: "Questionário de triagem para perfis de altas habilidades com sobreposição de TEA.",
    licencaUso: "autoral",
  },
  {
    id: "escala-satisfacao-medicacao",
    name: "Escala Satisfação Medicação",
    fullName: "EUSM-10 — Escala Universal de Satisfação com Medicação",
    ageMin: 0,
    ageMax: 216,
    queixas: ["efeitos", "medicacao", "tdah", "tea", "epilepsia", "ansiedade", "depressao", "sono"],
    respondente: ["pais", "autoaplicavel", "clinico"],
    prioridade: "monitorizacao",
    tempo: "3–5 min",
    appRoute: "/eusm10",
    description: "Escala breve de 10 itens para monitorar benefício percebido, tolerabilidade, adesão, segurança familiar e continuidade da medicação.",
    licencaUso: "autoral",
  },
  {
    id: "orientacao-parental",
    name: "Orientação Parental",
    fullName: "Psicoeducação não sensível para famílias por diagnóstico e queixa",
    ageMin: 0,
    ageMax: 216,
    queixas: ["tdah", "tea", "ansiedade", "depressao", "epilepsia", "linguagem", "sono", "comportamento"],
    respondente: ["pais"],
    prioridade: "monitorizacao",
    applicationMode: "psicoeducacao",
    assessmentUse: "psicoeducacao",
    tempo: "Leitura guiada",
    appRoute: "/orientacao-parental",
    description: "Conteúdo educativo para pais, sem dados individualizados de prontuário.",
    licencaUso: "autoral",
  },
  {
    id: "portal-familia-psicoeducacao",
    name: "Portal da Família / Psicoeducação",
    fullName: "Área dos pais com informações não sensíveis e documentos liberados",
    ageMin: 0,
    ageMax: 216,
    queixas: ["funcionalidade", "tdah", "tea", "ansiedade", "depressao", "epilepsia", "aprendizagem", "sono"],
    respondente: ["pais"],
    prioridade: "monitorizacao",
    applicationMode: "psicoeducacao",
    assessmentUse: "psicoeducacao",
    tempo: "Leitura guiada",
    appRoute: "/portal-familia",
    description: "Aba familiar para conteúdo educativo geral, política de acesso e documentos expressamente liberados.",
    licencaUso: "autoral",
  },
];

function uniqueById(items: ScaleEntry[]): ScaleEntry[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

export function mergeFilterableCatalog(primary: ScaleEntry[]): ScaleEntry[] {
  return uniqueById([...primary, ...supplementalFilterableInstruments]);
}
