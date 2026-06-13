/**
 * RANKING CLÍNICO CURADO — OURO / PRATA / BRONZE por QUEIXA × FAIXA ETÁRIA
 *
 * Fonte ÚNICA de verdade para o pódio do Filtro Clínico. Substitui o antigo
 * score genérico + os "padrões-ouro" hardcoded (que coroavam instrumentos que
 * já não abrem, ex.: ADOS-2, Bayley-III).
 *
 * Regras de autoria (auditadas por scripts/guards/validate-clinical-ranking):
 *  1. Todo id referenciado ABRE como ferramenta usável no app (rota dedicada ou
 *     itens interativos) — nunca uma ficha técnica pura.
 *  2. Todo id está marcado com a queixa da regra (scale.queixas inclui a queixa).
 *  3. A faixa do instrumento sobrepõe a faixa [ageMin, ageMax] da regra.
 *
 * Semântica dos selos:
 *  - OURO   = primeira linha que ABRE para a idade+queixa (rastreio/avaliação
 *             inicial que responde à pergunta clínica principal).
 *  - PRATA  = complementa o ouro (outra modalidade, respondente ou domínio).
 *  - BRONZE = perspectiva adicional / aprofundamento / monitorização.
 *
 * NOTA CLÍNICA: instrumentos diagnósticos de referência que NÃO abrem no app
 * (ADOS-2, Bayley-III, Griffiths, MABC-2, AIMS, GMA…) seguem sendo o padrão de
 * confirmação diagnóstica e podem exigir encaminhamento; aqui coroamos a melhor
 * ferramenta OPERACIONAL disponível no app, não a substituímos clinicamente.
 *
 * Idades em MESES. A primeira regra de cada queixa é a "representativa"
 * (fallback quando a idade não é informada).
 */

export interface ClinicalTierRule {
  queixa: string;
  ageMin: number;
  ageMax: number;
  ouro: string;
  prata?: string;
  bronze?: string;
  /** Racional curto do porquê o OURO é primeira linha nesta idade+queixa. */
  reason: string;
}

export const clinicalRanking: ClinicalTierRule[] = [
  // ============================ TEA / AUTISMO ============================
  {
    queixa: "tea", ageMin: 16, ageMax: 30,
    ouro: "mchat", prata: "j26-021", bronze: "tea-checklists",
    reason: "M-CHAT-R/F é o rastreio de primeira linha para TEA entre 16–30 meses (alta sensibilidade na primeira infância).",
  },
  { queixa: "tea", ageMin: 0, ageMax: 16,
    ouro: "j26-009", prata: "j26-007", bronze: "j26-021",
    reason: "Antes dos 16 meses, atenção conjunta e marcos socioemocionais precoces são os melhores sinais de alerta para TEA." },
  { queixa: "tea", ageMin: 30, ageMax: 72,
    ouro: "cars", prata: "j26-020", bronze: "tea-checklists",
    reason: "CARS-2 estrutura a observação clínica do espectro no pré-escolar; pragmática e checklists detalham o perfil." },
  { queixa: "tea", ageMin: 72, ageMax: 216,
    ouro: "cars", prata: "ecsm", bronze: "j26-205",
    reason: "CARS-2 quantifica a gravidade do espectro em escolares/adolescentes; ECSM e cognição social aprofundam." },

  // ================================ TDAH ================================
  { queixa: "tdah", ageMin: 72, ageMax: 144,
    ouro: "snap", prata: "vanderbilt", bronze: "brief2",
    reason: "SNAP-IV é o rastreio DSM de primeira linha para TDAH no escolar; Vanderbilt amplia ao professor, BRIEF-2 cobre funções executivas." },
  { queixa: "tdah", ageMin: 144, ageMax: 216,
    ouro: "snap", prata: "conners", bronze: "brief2",
    reason: "No adolescente, SNAP-IV mantém o núcleo DSM; Conners 3 cobre comorbidade disruptiva e BRIEF-2 a função executiva." },
  { queixa: "tdah", ageMin: 0, ageMax: 72,
    ouro: "sdq", prata: "cbcl", bronze: "j26-051",
    reason: "Antes dos 6 anos as escalas específicas de TDAH não estão validadas; SDQ/CBCL rastreiam amplamente e flexibilidade comportamental detalha." },

  // ============================ COMPORTAMENTO ============================
  { queixa: "comportamento", ageMin: 24, ageMax: 72,
    ouro: "cbcl", prata: "sdq", bronze: "abc",
    reason: "CBCL é o padrão de perfil comportamental (internalizante/externalizante); SDQ acrescenta forças e ABC o componente aberrante." },
  { queixa: "comportamento", ageMin: 72, ageMax: 216,
    ouro: "cbcl", prata: "conners", bronze: "sdq",
    reason: "CBCL perfila a psicopatologia no escolar/adolescente; Conners 3 foca o comportamento disruptivo e SDQ rastreia rápido." },
  { queixa: "comportamento", ageMin: 0, ageMax: 24,
    ouro: "cbcl", prata: "tea-comportamentos", bronze: "orientacao-parental",
    reason: "No início da infância, CBCL (a partir de 18m) e checklist de comportamentos atípicos guiam; orientação parental ancora o manejo." },

  // ============================= ANSIEDADE ==============================
  { queixa: "ansiedade", ageMin: 96, ageMax: 144,
    ouro: "scared", prata: "eai", bronze: "sdq",
    reason: "SCARED é o rastreio de primeira linha para ansiedade a partir dos 8 anos; EAI aprofunda e SDQ contextualiza." },
  { queixa: "ansiedade", ageMin: 144, ageMax: 216,
    ouro: "scared", prata: "gad7ped", bronze: "eai",
    reason: "No adolescente, SCARED mapeia os domínios de ansiedade e o GAD-7 pediátrico quantifica a ansiedade generalizada." },
  { queixa: "ansiedade", ageMin: 48, ageMax: 96,
    ouro: "eai", prata: "cbcl", bronze: "easi",
    reason: "Abaixo dos 8 anos usa-se heteroavaliação: EAI/EASI (clínico) e CBCL (pais), pois o autorrelato ainda não é confiável." },
  { queixa: "ansiedade", ageMin: 24, ageMax: 48,
    ouro: "cbcl", prata: "sdq", bronze: "ems",
    reason: "No pré-escolar, CBCL e SDQ rastreiam sintomas internalizantes observados pelos pais." },

  // ============================= DEPRESSÃO ==============================
  { queixa: "depressao", ageMin: 132, ageMax: 216,
    ouro: "phqa", prata: "cdi2", bronze: "cssrs",
    reason: "PHQ-A é o rastreio de primeira linha de depressão no adolescente; CDI-2 complementa e C-SSRS avalia risco de suicídio (obrigatório)." },
  { queixa: "depressao", ageMin: 84, ageMax: 132,
    ouro: "cdi2", prata: "cssrs", bronze: "cbcl",
    reason: "CDI-2 é o autorrelato validado de depressão na criança escolar; sempre pareado ao rastreio de risco C-SSRS." },
  { queixa: "depressao", ageMin: 48, ageMax: 84,
    ouro: "edi", prata: "cbcl", bronze: "orientacao-parental",
    reason: "Em pré-escolares, a avaliação de humor é heteroaplicada (EDI clínico, CBCL pais), pois falta autorrelato confiável." },

  // ========================== RISCO DE SUICÍDIO =========================
  { queixa: "suicidio", ageMin: 72, ageMax: 216,
    ouro: "cssrs", prata: "ecar-si", bronze: "eaah",
    reason: "C-SSRS é o padrão de rastreio de ideação/comportamento suicida; ECAR-SI e EAAH aprofundam risco e autolesão." },
  { queixa: "suicidio", ageMin: 36, ageMax: 72,
    ouro: "eaah", prata: "cssrs",
    reason: "Abaixo da idade escolar a avaliação de autolesão é clínica (EAAH), com C-SSRS quando aplicável." },

  // ============================= SUICÍDIO/HUMOR contínuo já acima =======

  // =============================== LINGUAGEM ============================
  { queixa: "linguagem", ageMin: 24, ageMax: 60,
    ouro: "ems", prata: "linguagem-fonologia", bronze: "j26-091",
    reason: "EMS avalia marcos de linguagem; fonologia e triagem de linguagem detalham atraso expressivo/receptivo no pré-escolar." },
  { queixa: "linguagem", ageMin: 0, ageMax: 24,
    ouro: "j26-003", prata: "j26-091", bronze: "j26-009",
    reason: "Marcos de linguagem 0–24m são o rastreio precoce; atenção conjunta sinaliza pré-requisitos comunicativos." },
  { queixa: "linguagem", ageMin: 60, ageMax: 144,
    ouro: "linguagem-fonologia", prata: "j26-085", bronze: "j26-090",
    reason: "No escolar, fonologia, vocabulário e compreensão oral complexa caracterizam o perfil linguístico." },
  { queixa: "linguagem", ageMin: 144, ageMax: 216,
    ouro: "j26-086", prata: "j26-020", bronze: "j26-089",
    reason: "No adolescente, fluência verbal e pragmática guiam; CAA cobre necessidades de comunicação alternativa." },

  // =============================== ATRASO ===============================
  { queixa: "atraso", ageMin: 12, ageMax: 48,
    ouro: "denver", prata: "asq3", bronze: "j26-010",
    reason: "Denver II rastreia marcos nos 4 domínios; ASQ-3 traz o olhar dos pais e a triagem global complementa." },
  { queixa: "atraso", ageMin: 0, ageMax: 6,
    ouro: "j26-001", prata: "j26-003", bronze: "j26-004",
    reason: "Triagem motora 0–6m com marcos de linguagem e cognição precoce é a porta de entrada no lactente." },
  { queixa: "atraso", ageMin: 6, ageMax: 12,
    ouro: "j26-002", prata: "j26-003", bronze: "denver",
    reason: "Triagem motora 6–12m, marcos de linguagem e Denver II detectam atraso global no primeiro ano." },
  { queixa: "atraso", ageMin: 48, ageMax: 72,
    ouro: "denver", prata: "asq3", bronze: "emdi",
    reason: "Denver II e ASQ-3 cobrem marcos pré-escolares; EMDI detalha o desenvolvimento infantil." },
  { queixa: "atraso", ageMin: 72, ageMax: 216,
    ouro: "vineland", prata: "pant", bronze: "ips",
    reason: "Após os 6 anos o foco é funcionamento adaptativo (Vineland-3) e perfil neuropsicológico (PANT)." },

  // ============================ APRENDIZAGEM ============================
  { queixa: "aprendizagem", ageMin: 72, ageMax: 168,
    ouro: "tde2-adaptado", prata: "j26-094", bronze: "j26-101",
    reason: "TDE-2 é o teste de desempenho escolar de referência; fluência de leitura e triagem de discalculia especificam o transtorno." },
  { queixa: "aprendizagem", ageMin: 48, ageMax: 72,
    ouro: "j26-084", prata: "linguagem-fonologia", bronze: "conhecimento-visual",
    reason: "Na pré-alfabetização, consciência fonológica é o melhor preditor de leitura; fonologia e percepção visual complementam." },
  { queixa: "aprendizagem", ageMin: 168, ageMax: 216,
    ouro: "j26-098", prata: "j26-104", bronze: "portal-familia-psicoeducacao",
    reason: "No adolescente, habilidades de estudo e suporte de inclusão escolar orientam o acompanhamento acadêmico." },

  // ============================== COGNIÇÃO ==============================
  { queixa: "cognicao", ageMin: 72, ageMax: 216,
    ouro: "brief2", prata: "funcoes-executivas", bronze: "memoria-teste",
    reason: "BRIEF-2 mapeia funções executivas no cotidiano; testes diretos de função executiva e memória confirmam." },
  { queixa: "cognicao", ageMin: 36, ageMax: 72,
    ouro: "conhecimento-visual", prata: "j26-022", bronze: "ecsm",
    reason: "No pré-escolar, percepção visual e teoria da mente avaliam pré-requisitos cognitivos." },
  { queixa: "cognicao", ageMin: 0, ageMax: 36,
    ouro: "j26-004", prata: "testes-reconhecimento", bronze: "j26-011",
    reason: "Cognição precoce 0–18m e tarefas de reconhecimento são a base da avaliação no lactente/toddler." },

  // ================================ MOTOR ===============================
  { queixa: "motor", ageMin: 48, ageMax: 144,
    ouro: "motricidade-teste", prata: "j26-108", bronze: "escrita-desenho",
    reason: "Teste de motricidade rastreia coordenação; integração visomotora e escrita/desenho avaliam o motor fino." },
  { queixa: "motor", ageMin: 0, ageMax: 12,
    ouro: "j26-001", prata: "j26-117", bronze: "j26-002",
    reason: "Triagem motora 0–6/6–12m e follow-up do prematuro detectam desvios motores precoces." },
  { queixa: "motor", ageMin: 12, ageMax: 48,
    ouro: "j26-107", prata: "j26-008", bronze: "j26-112",
    reason: "Marcos de motor grosso 1–5a, motor fino e equilíbrio/marcha cobrem a coordenação no toddler/pré-escolar." },
  { queixa: "motor", ageMin: 144, ageMax: 216,
    ouro: "j26-115", prata: "j26-111", bronze: "j26-240",
    reason: "No adolescente, habilidades esportivas e funcionalidade motora orientam; função manual (MACS) acompanha a destreza." },

  // ======================= PARALISIA CEREBRAL ===========================
  { queixa: "pc", ageMin: 0, ageMax: 216,
    ouro: "gmfcs", prata: "j26-111", bronze: "ashworth",
    reason: "GMFCS é o padrão de classificação da função motora grossa na PC; funcionalidade e Ashworth (tônus) complementam." },

  // ================================ SONO ================================
  { queixa: "sono", ageMin: 48, ageMax: 120,
    ouro: "cshq", prata: "j26-130", bronze: "j26-137",
    reason: "CSHQ é o questionário de hábitos de sono validado; higiene do sono e rotina noturna guiam a intervenção." },
  { queixa: "sono", ageMin: 12, ageMax: 48,
    ouro: "j26-130", prata: "j26-137", bronze: "j26-136",
    reason: "No toddler, higiene do sono e rotina noturna são primeira linha; resposta à melatonina monitoriza quando indicada." },
  { queixa: "sono", ageMin: 120, ageMax: 216,
    ouro: "j26-136", prata: "inventarios-auto", bronze: "j26-130",
    reason: "No adolescente, monitorização da resposta à melatonina e autoavaliação do sono orientam o manejo." },

  // ============================ ALIMENTAÇÃO =============================
  { queixa: "alimentacao", ageMin: 24, ageMax: 216,
    ouro: "etare", prata: "j26-146", bronze: "inventarios-auto",
    reason: "ETARE avalia o comportamento alimentar restritivo/seletivo; autonomia alimentar detalha a refeição." },
  { queixa: "alimentacao", ageMin: 0, ageMax: 24,
    ouro: "j26-146", prata: "j26-191", bronze: "etare",
    reason: "No lactente, autonomia alimentar e prontidão alimentar do prematuro são a avaliação inicial." },

  // ============================= EPILEPSIA ==============================
  { queixa: "epilepsia", ageMin: 0, ageMax: 216,
    ouro: "epilepsia-diario", prata: "orientacao-parental", bronze: "portal-familia-psicoeducacao",
    reason: "O diário de crises é o instrumento central de monitorização da epilepsia; orientação parental sustenta o manejo." },

  // =============================== TIQUES ===============================
  { queixa: "tiques", ageMin: 36, ageMax: 216,
    ouro: "ygtss",
    reason: "YGTSS é o padrão-ouro de gravidade de tiques (Tourette) aplicável em toda a faixa pediátrica." },

  // ================================ DOR =================================
  { queixa: "dor", ageMin: 36, ageMax: 216,
    ouro: "cefaleia-calendario",
    reason: "O calendário de cefaleia registra frequência/intensidade e é a base do manejo da dor de cabeça pediátrica." },

  // =============================== SOCIAL ===============================
  { queixa: "social", ageMin: 36, ageMax: 72,
    ouro: "j26-203", prata: "j26-022", bronze: "j26-026",
    reason: "Comunicação social 3–7a é o rastreio chave; teoria da mente e habilidades de brincar detalham a cognição social." },
  { queixa: "social", ageMin: 0, ageMax: 36,
    ouro: "j26-007", prata: "j26-021", bronze: "j26-009",
    reason: "Desenvolvimento socioemocional 0–3a e atenção conjunta são os melhores marcadores sociais precoces." },
  { queixa: "social", ageMin: 72, ageMax: 216,
    ouro: "j26-022", prata: "j26-181", bronze: "j26-176",
    reason: "No escolar/adolescente, teoria da mente, participação social e resiliência caracterizam o funcionamento social." },

  // ============================= SENSORIAL ==============================
  { queixa: "sensorial", ageMin: 0, ageMax: 24,
    ouro: "j26-013", prata: "j26-014", bronze: "j26-005",
    reason: "Triagem auditiva e visual funcional e regulação sensorial neonatal são a avaliação sensorial inicial." },
  { queixa: "sensorial", ageMin: 24, ageMax: 144,
    ouro: "j26-126", prata: "j26-013",
    reason: "Eficácia da dieta sensorial monitoriza a integração sensorial na criança em terapia." },

  // ============================== NEONATAL ==============================
  { queixa: "neonatal", ageMin: 0, ageMax: 6,
    ouro: "j26-001", prata: "j26-005", bronze: "j26-192",
    reason: "Triagem motora 0–6m, regulação sensorial neonatal e follow-up do método canguru cobrem o recém-nascido de risco." },
  { queixa: "neonatal", ageMin: 6, ageMax: 30,
    ouro: "j26-195", prata: "j26-117", bronze: "j26-014",
    reason: "Follow-up do prematuro até 2 anos e acompanhamento motor detectam sequelas da prematuridade." },

  // ============================= AUTONOMIA ==============================
  { queixa: "autonomia", ageMin: 24, ageMax: 144,
    ouro: "j26-180", prata: "j26-015", bronze: "j26-146",
    reason: "AVDs infantis é o rastreio de autonomia; autocuidado 2–5a e autonomia alimentar detalham." },
  { queixa: "autonomia", ageMin: 144, ageMax: 216,
    ouro: "j26-208", prata: "j26-187", bronze: "j26-180",
    reason: "No adolescente, habilidades de vida independente e autonomia em necessidades especiais orientam a transição." },

  // ========================== FUNCIONALIDADE ============================
  { queixa: "funcionalidade", ageMin: 24, ageMax: 216,
    ouro: "vineland", prata: "pedsql", bronze: "eaf",
    reason: "Vineland-3 é o padrão de comportamento adaptativo; PedsQL mede qualidade de vida e EAF a funcionalidade." },
  { queixa: "funcionalidade", ageMin: 0, ageMax: 24,
    ouro: "vineland", prata: "denver", bronze: "pant",
    reason: "No lactente, Vineland-3 (adaptativo) com Denver II e PANT cobrem funcionalidade e marcos." },

  // ============================== EFEITOS ===============================
  { queixa: "efeitos", ageMin: 0, ageMax: 216,
    ouro: "eusm10", prata: "j26-260", bronze: "j26-201",
    reason: "EUSM-10 monitoriza efeitos colaterais de medicação; rotina laboratorial e adesão completam a farmacovigilância." },

  // ============================== EVOLUÇÃO ==============================
  { queixa: "evolucao", ageMin: 0, ageMax: 216,
    ouro: "eusm10",
    reason: "Reavaliação evolutiva apoia-se em medidas seriadas; EUSM-10 ancora a monitorização e os protocolos de evolução por domínio (TEA, TDAH, motor, leitura) complementam conforme a queixa associada." },

  // ============================ SUBSTÂNCIAS =============================
  { queixa: "substancias", ageMin: 144, ageMax: 216,
    ouro: "crafft",
    reason: "CRAFFT é o rastreio validado de uso de álcool/substâncias no adolescente." },
];

/**
 * Retorna o trio OURO/PRATA/BRONZE curado para a queixa + idade (meses).
 * Sem idade, devolve a regra representativa (primeira) da queixa.
 */
export function getClinicalTiers(
  queixa: string,
  ageMonths: number | null
): ClinicalTierRule | undefined {
  const rules = clinicalRanking.filter((r) => r.queixa === queixa);
  if (rules.length === 0) return undefined;
  if (ageMonths == null) return rules[0];
  return rules.find((r) => ageMonths >= r.ageMin && ageMonths <= r.ageMax) ?? rules[0];
}
