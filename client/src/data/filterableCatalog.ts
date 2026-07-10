import type { ScaleEntry } from "@/data/scaleFilter";

/**
 * Itens aplicaveis que existem como paginas/ferramentas do app, mas nao estavam
 * necessariamente dentro de `allScales`. Mantem tudo filtravel sem apagar o
 * catalogo clinico principal.
 */
export const supplementalFilterableInstruments: ScaleEntry[] = [
  {
    id: "testes-diretos",
    name: "Testes Diretos",
    fullName: "Mini-testes diretos com a crianca",
    ageMin: 36,
    ageMax: 168,
    queixas: ["atraso", "linguagem", "cognicao", "aprendizagem", "tdah"],
    respondente: ["teste_direto_crianca"],
    prioridade: "triagem",
    tempo: "10-20 min",
    appRoute: "/testes-diretos",
    description: "Conjunto de mini-testes observacionais e interativos para aplicar diretamente com a crianca durante a consulta.",
    licencaUso: "autoral",
    applicationMode: "teste_direto_crianca",
    assessmentUse: "triagem",
    implementationStatus: "complete",
  },
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
    // EUSM-10 canônico (fonte única). Substitui a antiga 'escala-satisfacao-medicacao'
    // (que duplicava e usava a queixa inexistente "medicacao").
    id: "eusm10",
    name: "EUSM-10",
    fullName: "Escala Universal de Satisfação com Medicação",
    ageMin: 0,
    ageMax: 216,
    queixas: ["efeitos", "evolucao"],
    respondente: ["pais", "autoaplicavel", "clinico"],
    prioridade: "monitorizacao",
    tempo: "3–5 min",
    appRoute: "/eusm10",
    description:
      "Instrumento breve de 10 itens para acompanhar benefício percebido, tolerabilidade, adesão, segurança familiar e viabilidade prática de qualquer medicação nos últimos 7 a 14 dias.",
    fonte: "Dr. Jadson Fraga, NeuroPed — EUSM-10 (2026)",
    licencaUso: "autoral",
    validacaoBrasil: "Autoral — uso clínico local",
    scoringCutoff: "0–10 muito baixa; 11–20 baixa; 21–28 intermediária; 29–35 boa; 36–40 excelente",
    assessmentUse: "monitorizacao",
    implementationStatus: "complete",
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

  // ── Testes DIRETOS INTERATIVOS (a criança executa na tela; aplicação completa) ──
  // Aparecem no filtro ao selecionar o respondente "Direto" (teste_direto_crianca).
  {
    id: "academico-interativo", name: "Acadêmico Interativo", fullName: "Cálculo, problemas e sequências lógicas (interativo)",
    ageMin: 72, ageMax: 168, queixas: ["aprendizagem", "cognicao", "tdah"], respondente: ["teste_direto_crianca"],
    prioridade: "triagem", applicationMode: "teste_direto_crianca", assessmentUse: "triagem", implementationStatus: "complete",
    tempo: "10–15 min", appRoute: "/testes-diretos", description: "Teste direto e interativo de matemática (cálculo, problemas, sequências) por faixa etária.", licencaUso: "autoral",
  },
  {
    id: "conhecimentos-gerais", name: "Conhecimentos Gerais", fullName: "Conhecimento factual, raciocínio e cultura (interativo)",
    ageMin: 60, ageMax: 168, queixas: ["cognicao", "aprendizagem"], respondente: ["teste_direto_crianca"],
    prioridade: "triagem", applicationMode: "teste_direto_crianca", assessmentUse: "triagem", implementationStatus: "complete",
    tempo: "10 min", appRoute: "/testes-diretos", description: "Teste direto interativo de conhecimentos gerais, raciocínio e cultura.", licencaUso: "autoral",
  },
  {
    id: "conhecimento-visual", name: "Conhecimento Visual", fullName: "Discriminação visual, figura-fundo, simetria e padrões (interativo)",
    ageMin: 36, ageMax: 120, queixas: ["cognicao", "aprendizagem"], respondente: ["teste_direto_crianca"],
    prioridade: "triagem", applicationMode: "teste_direto_crianca", assessmentUse: "triagem", implementationStatus: "complete",
    tempo: "10 min", appRoute: "/testes-diretos", description: "Teste direto interativo de habilidades visuais (discriminação, figura-fundo, simetria, sequências).", licencaUso: "autoral",
  },
  {
    id: "escrita-desenho", name: "Escrita e Desenho", fullName: "Grafomotricidade: cópia de traços e formas (interativo)",
    ageMin: 48, ageMax: 144, queixas: ["aprendizagem", "motor", "cognicao"], respondente: ["teste_direto_crianca"],
    prioridade: "triagem", applicationMode: "teste_direto_crianca", assessmentUse: "triagem", implementationStatus: "complete",
    tempo: "10–15 min", appRoute: "/testes-diretos", description: "Teste direto interativo de escrita e desenho (traçado, cópia de formas).", licencaUso: "autoral",
  },
  {
    id: "motricidade-teste", name: "Motricidade", fullName: "Coordenação motora grossa e fina (observação direta)",
    ageMin: 48, ageMax: 144, queixas: ["motor", "atraso", "pc"], respondente: ["teste_direto_crianca"],
    prioridade: "triagem", applicationMode: "teste_direto_crianca", assessmentUse: "triagem", implementationStatus: "complete",
    tempo: "10–15 min", appRoute: "/testes-diretos", description: "Teste direto de motricidade grossa e fina, por faixa etária.", licencaUso: "autoral",
  },
  {
    id: "funcoes-executivas", name: "Funções Executivas", fullName: "Planejamento, inibição, memória de trabalho e flexibilidade (interativo)",
    ageMin: 72, ageMax: 168, queixas: ["tdah", "cognicao"], respondente: ["teste_direto_crianca"],
    prioridade: "triagem", applicationMode: "teste_direto_crianca", assessmentUse: "triagem", implementationStatus: "complete",
    tempo: "10–15 min", appRoute: "/testes-diretos", description: "Teste direto interativo de funções executivas (planejamento, inibição, memória de trabalho, flexibilidade).", licencaUso: "autoral",
  },
  {
    id: "atencao-concentracao", name: "Atenção e Concentração", fullName: "Atenção sustentada, seletiva e dividida (interativo)",
    ageMin: 72, ageMax: 168, queixas: ["tdah", "cognicao"], respondente: ["teste_direto_crianca"],
    prioridade: "triagem", applicationMode: "teste_direto_crianca", assessmentUse: "triagem", implementationStatus: "complete",
    tempo: "10 min", appRoute: "/testes-diretos", description: "Teste direto interativo de atenção (sustentada, seletiva, dividida).", licencaUso: "autoral",
  },
  {
    id: "linguagem-fonologia", name: "Linguagem e Fonologia", fullName: "Consciência fonológica, vocabulário, compreensão e expressão (interativo)",
    ageMin: 36, ageMax: 144, queixas: ["linguagem", "aprendizagem"], respondente: ["teste_direto_crianca"],
    prioridade: "triagem", applicationMode: "teste_direto_crianca", assessmentUse: "triagem", verbalRequirement: "verbal", implementationStatus: "complete",
    tempo: "10–15 min", appRoute: "/testes-diretos", description: "Teste direto interativo de linguagem e fonologia (consciência fonológica, vocabulário, compreensão, expressão).", licencaUso: "autoral",
  },
  {
    id: "memoria-teste", name: "Memória", fullName: "Memória de curto prazo, trabalho, episódica e aprendizagem verbal (interativo)",
    ageMin: 60, ageMax: 168, queixas: ["cognicao", "tdah"], respondente: ["teste_direto_crianca"],
    prioridade: "triagem", applicationMode: "teste_direto_crianca", assessmentUse: "triagem", implementationStatus: "complete",
    tempo: "10–15 min", appRoute: "/testes-diretos", description: "Teste direto interativo de memória (curto prazo, trabalho, episódica, aprendizagem verbal).", licencaUso: "autoral",
  },
  {
    id: "processamento-visuoauditivo", name: "Processamento Visual-Auditivo", fullName: "Processamento auditivo, visual e integração (interativo)",
    ageMin: 60, ageMax: 144, queixas: ["cognicao", "linguagem", "aprendizagem"], respondente: ["teste_direto_crianca"],
    prioridade: "triagem", applicationMode: "teste_direto_crianca", assessmentUse: "triagem", implementationStatus: "complete",
    tempo: "10 min", appRoute: "/testes-diretos", description: "Teste direto interativo de processamento visual-auditivo e integração.", licencaUso: "autoral",
  },
  {
    // AQ-10 — aplicação interativa real (autorrelato), distinta do card mundial
    // "AQ-10 Child" que só abre o catálogo. Aponta para a página /aq10.
    id: "aq10", name: "AQ-10", fullName: "Autism Quotient — Triagem de TEA (autorrelato)",
    ageMin: 192, ageMax: 216, queixas: ["tea", "social"], respondente: ["autoaplicavel"],
    prioridade: "triagem", applicationMode: "autoquestionario_crianca_adolescente", assessmentUse: "triagem",
    implementationStatus: "complete", literacyRequirement: "alfabetizado",
    tempo: "~2 min", appRoute: "/aq10",
    description: "10 itens de triagem de TEA; ponto de corte ≥6 indica avaliação diagnóstica. Domínio público (Baron-Cohen et al.).",
    fonte: "Allison C, Auyeung B, Baron-Cohen S, 2012", licencaUso: "livre", scoringCutoff: "≥6 = encaminhar para avaliação diagnóstica",
  },
  {
    id: "aq", name: "AQ-50", fullName: "Autism-Spectrum Quotient (50 itens) — traços de TEA em adultos/adolescentes",
    ageMin: 192, ageMax: 216, queixas: ["tea", "social"], respondente: ["autoaplicavel"],
    prioridade: "diagnostica", applicationMode: "autoquestionario_crianca_adolescente", assessmentUse: "triagem",
    implementationStatus: "complete", literacyRequirement: "alfabetizado",
    tempo: "~10 min", appRoute: "/aq50",
    description: "50 itens de autorrelato de traços do espectro (QI normal), com 5 subdomínios e chave de pontuação oficial; corte sugerido ≥32. Uso livre (Baron-Cohen et al., 2001).",
    fonte: "Baron-Cohen S et al., J Autism Dev Disord 2001;31(1):5-17", licencaUso: "livre", scoringCutoff: "≥32 = traços elevados (rastreio, não diagnóstico)",
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
