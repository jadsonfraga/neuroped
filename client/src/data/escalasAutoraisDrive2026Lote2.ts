// ============================================================
// LOTE 2 — Escalas autorais de neuropediatria importadas do Google
// Drive do Dr. Jadson Fraga (varredura completa 2026-07). Conteúdo
// AUTORAL e EXPERIMENTAL — instrumentos de organização clínica, sem
// validação psicométrica publicada. Servem a triagem/monitorização e
// apoio a laudo, NUNCA a diagnóstico isolado.
//
// Todas entram como FICHA TÉCNICA (implementationStatus "metadata_only",
// rota /generic-scale/:id): os documentos de origem trazem estrutura,
// domínios, faixas de escore e interpretação, mas o enunciado item-a-item
// nem sempre está completo e o escore é composto por domínio — por
// honestidade clínica não fingimos aplicação interativa completa.
//
// NOTA DE CURADORIA: a maioria (EINPI-360, NEXUS-PED 52, SINAPSE-FI 60,
// PONTE-PED 72, NAVI-PED 84, EINPI v1, EIDAF, IDAFENI, NEFI-PED 96,
// INTEGRA-90) são ITERAÇÕES da mesma família broadband multi-domínio
// (jun–jul/2026). Foram inseridas a pedido do autor (varredura "toda e
// qualquer escala"); mantê-las juntas evidencia a evolução do projeto.
// Cada uma é um instrumento AUTORAL distinto por nome, nº de itens e
// arranjo de domínios. NENHUMA é um rastreador DEDICADO de risco suicida
// ou psicose — são matrizes amplas do desenvolvimento que apenas incluem
// item(ns) sentinela. Os overrides abaixo evitam que a presença da queixa
// "suicidio", de um item sobre psicose ou da palavra "matriz" transforme
// silenciosamente todo o instrumento em uma escala dedicada de risco ou
// em um teste não verbal.
// ============================================================
import { type ScaleEntry } from "./scaleFilter";

const DOC = (id: string) => `https://docs.google.com/document/d/${id}/edit`;

const NON_DEDICATED_RISK_METADATA = {
  suicideRiskInstrument: false,
  psychosisRiskInstrument: false,
  verbalRequirement: "indiferente",
  literacyRequirement: "indiferente",
} as const;

const escalasAutoraisDrive2026Lote2Base: ScaleEntry[] = [
  {
    id: "nef-360",
    name: "NEF-360 — Neuro-Escola Funcional 360",
    fullName: "NEF-360 — Neuro-Escola Funcional 360 (Escala Integrada de Neuropediatria e Psiquiatria Infantil para Consultório, Família e Escola)",
    ageMin: 24,
    ageMax: 215,
    queixas: ["atraso", "tea", "tdah", "comportamento", "ansiedade", "depressao", "epilepsia", "linguagem", "sono", "cognicao", "aprendizagem", "funcionalidade", "motor", "social", "autonomia", "sensorial", "suicidio", "evolucao"],
    respondente: ["pais", "professor", "clinico", "autoaplicavel"],
    prioridade: "triagem",
    tempo: "15–20 min",
    description:
      "Instrumento autoral experimental do Dr. Jadson Fraga. Matriz clínica única (60 itens, 0–3) que organiza sinais funcionais de neurodesenvolvimento, comportamento, aprendizagem, epilepsia, sono e sofrimento emocional, integrando dados de pais, escola e consulta e sinalizando prioridades e red flags. Ficha técnica — sem validação psicométrica publicada.",
    fonte: "ESCALA AUTORAL NEF360 V1 (2026-07-06) — instrumento autoral Dr. Jadson Fraga (Google Drive) · Documento original: " + DOC("12_m2Tb8dZWN2pUgKTt5FhU1KBxWyc9TKWTBDUg2rkWA"),
    licencaUso: "autoral",
    validacaoBrasil: "Autoral — experimental, sem validação psicométrica publicada",
    scoringCutoff:
      "60 itens, cada 0–3 (NA quando não se aplica). Escore por domínio convertido em percentual: 0–20% sem prejuízo relevante; 21–40% leve; 41–60% moderado; 61–80% importante; 81–100% crítico. Índice Global = média percentual dos domínios aplicáveis, sempre lido junto aos domínios críticos.",
    assessmentUse: "triagem",
    applicationMode: "questionario_pais",
    implementationStatus: "metadata_only",
    appRoute: "/generic-scale/nef-360",
  },
  {
    id: "neurofunc-360",
    name: "NEUROFUNC-360",
    fullName: "NEUROFUNC-360 V1 — Escala Integrada de Funcionamento Neuropsiquiátrico, Desenvolvimento e Vida Real da Criança e do Adolescente",
    ageMin: 24,
    ageMax: 215,
    queixas: ["atraso", "tea", "tdah", "comportamento", "ansiedade", "depressao", "epilepsia", "linguagem", "sono", "cognicao", "aprendizagem", "funcionalidade", "motor", "social", "autonomia", "sensorial", "suicidio", "evolucao"],
    respondente: ["pais", "professor", "clinico", "autoaplicavel"],
    prioridade: "triagem",
    tempo: "10–15 min",
    description:
      "Instrumento autoral experimental do Dr. Jadson Fraga. 40 itens (0–3) que integram desenvolvimento, comportamento, cognição, linguagem, sono, epilepsia, aprendizagem, autorregulação, funções executivas, sofrimento emocional e funcionalidade, identificando as áreas de maior impacto para anamnese, laudo e plano. Ficha técnica — sem validação publicada.",
    fonte: "2026-07-05_ESCALA_AUTORAL_NEUROFUNC-360_V1 — instrumento autoral Dr. Jadson Fraga (Google Drive) · Documento original: " + DOC("1Ss2fQeYp7LrbAQ63nTdSiCCld_FyTjUrACEMtyBh6yE"),
    licencaUso: "autoral",
    validacaoBrasil: "Autoral — experimental, sem validação psicométrica publicada",
    scoringCutoff:
      "40 itens (0–3). Escore bruto por domínio: 0–2 sem sinal; 3–5 leve; 6–8 moderado; 9–12 alto. Total: 0–20 baixa carga; 21–40 vulnerabilidade leve/moderada; 41–70 moderado; 71–100 importante; >100 alta complexidade. Índices auxiliares (Escola, Neurodesenvolvimento, Risco Clínico).",
    assessmentUse: "triagem",
    applicationMode: "questionario_pais",
    implementationStatus: "metadata_only",
    appRoute: "/generic-scale/neurofunc-360",
  },
  {
    id: "integra-kids-360",
    name: "INTEGRA-KIDS 360",
    fullName: "INTEGRA-KIDS 360 — Índice Neurofuncional Integrado para Crianças e Adolescentes",
    ageMin: 24,
    ageMax: 215,
    queixas: ["atraso", "tea", "tdah", "comportamento", "ansiedade", "depressao", "epilepsia", "linguagem", "sono", "cognicao", "aprendizagem", "funcionalidade", "motor", "social", "autonomia", "suicidio", "evolucao"],
    respondente: ["pais", "professor", "clinico"],
    prioridade: "triagem",
    tempo: "10–35 min",
    description:
      "Instrumento autoral experimental do Dr. Jadson Fraga. 45 itens (0–3) para uma visão integrada, rápida e funcional do paciente: onde está o maior prejuízo, qual o perfil predominante, quais sinais exigem prioridade e o que colocar em laudo/PEI. Ficha técnica — sem validação psicométrica publicada.",
    fonte: "2026-07-04_ESCALA_AUTORAL_INTEGRA-KIDS-360_V1 — instrumento autoral Dr. Jadson Fraga (Google Drive) · Documento original: " + DOC("1KutJviv17T4aRJ7vurU_-xdUPhA14sEhFrWbMqPpNk4"),
    licencaUso: "autoral",
    validacaoBrasil: "Autoral — experimental, sem validação psicométrica publicada",
    scoringCutoff:
      "45 itens, 0–3, total 0–135. Domínio (0–15): 0–2 adequado; 3–5 leve; 6–9 moderado; 10–12 importante; 13–15 grave. Global: 0–15 baixo; 16–35 leve/moderado; 36–60 relevante; 61–90 amplo; 91–135 grave multissistêmico. Itens marcados R = red flag.",
    assessmentUse: "triagem",
    applicationMode: "questionario_pais",
    implementationStatus: "metadata_only",
    appRoute: "/generic-scale/integra-kids-360",
  },
  {
    id: "mapa-360",
    name: "MAPA-360 NeuroPed",
    fullName: "MAPA-360 NeuroPed v1 — Matriz Ampliada Pediátrica de Autorregulação, Aprendizagem e Neurodesenvolvimento",
    ageMin: 36,
    ageMax: 215,
    queixas: ["atraso", "tea", "tdah", "comportamento", "ansiedade", "depressao", "epilepsia", "linguagem", "sono", "cognicao", "aprendizagem", "funcionalidade", "motor", "social", "autonomia", "sensorial", "alimentacao", "dor", "suicidio", "evolucao"],
    respondente: ["pais", "professor", "clinico", "autoaplicavel"],
    prioridade: "triagem",
    tempo: "15–20 min",
    description:
      "Instrumento autoral experimental do Dr. Jadson Fraga. 60 itens (0–3) que reúnem, em matriz única, dados de família, escola e observação clínica sobre neurodesenvolvimento, comportamento, cognição, linguagem, aprendizagem, sono, epilepsia, autorregulação, sofrimento emocional e funcionalidade, documentando prejuízo funcional. Ficha técnica — sem validação publicada.",
    fonte: "2026-07-03_ESCALA_AUTORAL_MAPA-360_NEUROPED_V1 — instrumento autoral Dr. Jadson Fraga (Google Drive) · Documento original: " + DOC("1NwNXTRm2HNC1v1J_kiYRVaVY3_Uy-26dyInqHbC27tI"),
    licencaUso: "autoral",
    validacaoBrasil: "Autoral — experimental, sem validação psicométrica publicada",
    scoringCutoff:
      "60 itens, 0–3, máximo 180. Domínio (0–15): 0–2 funcional; 3–5 leve; 6–9 moderado; 10–15 grave. Percentual ajustado = obtido/máximo respondido ×100: 0–14% preservado; 15–29% leve; 30–49% moderado; 50–69% alto; ≥70% muito alto. Faixa 3–17a (adaptável 2–3a).",
    assessmentUse: "triagem",
    applicationMode: "questionario_pais",
    implementationStatus: "metadata_only",
    appRoute: "/generic-scale/mapa-360",
  },
  {
    id: "sinaf-neuroped",
    name: "SINAF-NeuroPed",
    fullName: "SINAF-NeuroPed V1 — Sistema Integrado Neurofuncional Afetivo-Familiar para Crianças e Adolescentes",
    ageMin: 24,
    ageMax: 215,
    queixas: ["atraso", "tea", "tdah", "comportamento", "ansiedade", "depressao", "epilepsia", "linguagem", "sono", "cognicao", "aprendizagem", "funcionalidade", "motor", "social", "autonomia", "suicidio", "evolucao"],
    respondente: ["pais", "professor", "clinico", "autoaplicavel"],
    prioridade: "triagem",
    tempo: "10–15 min",
    description:
      "Instrumento autoral experimental do Dr. Jadson Fraga. 50 itens (0–3) em 10 domínios que organizam sinais de desenvolvimento, comportamento, cognição, linguagem, sono, epilepsia, aprendizagem, autorregulação, funções executivas, sofrimento emocional e funcionalidade — para triagem, priorização, comparação evolutiva e apoio ao laudo. Ficha técnica — sem validação publicada.",
    fonte: "2026-07-02_ESCALA_AUTORAL_SINAF-NEUROPED_V1 — instrumento autoral Dr. Jadson Fraga (Google Drive) · Documento original: " + DOC("1ohp0tqe_NfLBB32XLXRgE0NxpyHtxe5X6xhY8rRrjWc"),
    licencaUso: "autoral",
    validacaoBrasil: "Autoral — experimental, sem validação psicométrica publicada",
    scoringCutoff:
      "10 domínios × 5 itens (0–3), total 0–150. Domínio (0–15): 0–2 sem sinal; 3–5 leve; 6–9 moderado; 10–15 importante. Total: 0–19 baixa; 20–39 leve; 40–69 moderado; 70–99 importante; 100–150 grave/multifatorial. Interpretar por padrão de domínios, não só pelo total.",
    assessmentUse: "triagem",
    applicationMode: "questionario_pais",
    implementationStatus: "metadata_only",
    appRoute: "/generic-scale/sinaf-neuroped",
  },
  {
    id: "integra-neuroped-90",
    name: "INTEGRA-NEUROPED 90",
    fullName: "INTEGRA-NEUROPED 90 — Escala Clínica Experimental Integrada de Neuropediatria, Psiquiatria Infantil, Escola, Sono, Epilepsia, Autorregulação e Funcionalidade",
    ageMin: 36,
    ageMax: 216,
    queixas: ["atraso", "tea", "tdah", "comportamento", "ansiedade", "depressao", "epilepsia", "linguagem", "sono", "cognicao", "aprendizagem", "funcionalidade", "motor", "social", "autonomia", "toc", "suicidio", "evolucao"],
    respondente: ["pais", "professor", "clinico", "autoaplicavel"],
    prioridade: "triagem",
    tempo: "20–30 min",
    description:
      "Instrumento autoral experimental do Dr. Jadson Fraga. Roteiro prático de 90 itens (9 domínios × 10, 0–3) que mapeia os principais sinais que interferem no funcionamento neuropsiquiátrico infantil, apoiando devolutivas, laudos e acompanhamento da resposta a intervenções. Ficha técnica — sem validação psicométrica publicada.",
    fonte: "2026-06-28_ESCALA_AUTORAL_INTEGRA_NEUROPED_90_V1 — instrumento autoral Dr. Jadson Fraga (Google Drive) · Documento original: " + DOC("1o7N7z9WfHQSxNnUYSgdNBplKZL3Fw57tGVEzSwKl8_g"),
    licencaUso: "autoral",
    validacaoBrasil: "Autoral — experimental, sem validação psicométrica publicada",
    scoringCutoff:
      "9 domínios × 10 itens (0–3), total 0–270. Por domínio em percentual do máximo: 0–20% sem prejuízo; 21–40% atenção leve; 41–60% moderado; 61–80% importante; 81–100% grave. O total nunca é usado isoladamente; a leitura por domínio prevalece. Alerta vermelho para red flags.",
    assessmentUse: "triagem",
    applicationMode: "questionario_pais",
    implementationStatus: "metadata_only",
    appRoute: "/generic-scale/integra-neuroped-90",
  },
  {
    id: "einpi-360",
    name: "EINPI-360",
    fullName: "EINPI-360 — Escala Integrada Neuropsiquiátrica Pediátrica 360",
    ageMin: 24,
    ageMax: 216,
    queixas: ["atraso", "tea", "tdah", "comportamento", "ansiedade", "depressao", "epilepsia", "linguagem", "sono", "cognicao", "aprendizagem", "funcionalidade", "motor", "social", "autonomia", "sensorial", "suicidio", "evolucao"],
    respondente: ["pais", "professor", "clinico"],
    prioridade: "triagem",
    tempo: "10–15 min",
    description:
      "Instrumento autoral experimental do Dr. Jadson Fraga. 48 itens (12 domínios × 4, 0–3) para uma visão 360° do funcionamento neuropsiquiátrico pediátrico: desenvolvimento, linguagem, sociabilidade, atenção, funções executivas, aprendizagem, sono, epilepsia, autorregulação, comportamento, sofrimento emocional e funcionalidade. Ficha técnica — sem validação publicada.",
    fonte: "2026-06-19_ESCALA_AUTORAL_EINPI-360_V1 — instrumento autoral Dr. Jadson Fraga (Google Drive) · Documento original: " + DOC("13ExdP3OgfE7wi7WdXseawmihZ8jflUQSLxiePqUlmGo"),
    licencaUso: "autoral",
    validacaoBrasil: "Autoral — experimental, sem validação psicométrica publicada",
    scoringCutoff:
      "12 domínios × 4 itens (0–3), máximo 144. Global: 0–25 baixo impacto; 26–55 leve; 56–85 moderado; 86–115 grave; 116–144 muito grave. Índices derivados: Neurodesenvolvimental (A+B+C), Atencional-executivo (D+E+F), Neurobiológico (G+H), Regulação-comportamento (I+K), Emocional-funcional (J+L).",
    assessmentUse: "triagem",
    applicationMode: "questionario_pais",
    implementationStatus: "metadata_only",
    appRoute: "/generic-scale/einpi-360",
  },
  {
    id: "ponte-ped-72",
    name: "PONTE-PED 72",
    fullName: "PONTE-PED 72 — Escala Clínica Experimental Integrada de Neurodesenvolvimento, Escola, Sono, Epilepsia e Sofrimento Infantil",
    ageMin: 24,
    ageMax: 216,
    queixas: ["atraso", "tea", "tdah", "comportamento", "ansiedade", "depressao", "epilepsia", "linguagem", "sono", "cognicao", "aprendizagem", "funcionalidade", "motor", "social", "autonomia", "sensorial", "alimentacao", "suicidio", "evolucao"],
    respondente: ["pais", "professor", "clinico"],
    prioridade: "triagem",
    tempo: "15–20 min",
    description:
      "Instrumento autoral experimental do Dr. Jadson Fraga. 72 itens (12 domínios × 6, 0–3) pensado como ponte entre família, escola e consultório, integrando desenvolvimento, linguagem, cognição, aprendizagem, atenção, funções executivas, sono, epilepsia, autorregulação, comportamento, sofrimento emocional e funcionalidade. Ficha técnica — sem validação publicada.",
    fonte: "2026-06-20_ESCALA_AUTORAL_PONTE-PED_72_V1 — instrumento autoral Dr. Jadson Fraga (Google Drive) · Documento original: " + DOC("14YSFjE2cvgAnyM_H9J_BzqHcu6v_eYiIDflZ82-Ab8U"),
    licencaUso: "autoral",
    validacaoBrasil: "Autoral — experimental, sem validação psicométrica publicada",
    scoringCutoff:
      "12 domínios × 6 itens (0–3), máximo 216. Domínio: 0–4 mínimo; 5–8 leve; 9–13 moderado; 14–18 grave. Global: 0–35 baixo; 36–75 leve; 76–120 moderado; 121–165 grave; 166–216 muito grave. Índices derivados por agrupamento de domínios.",
    assessmentUse: "triagem",
    applicationMode: "questionario_pais",
    implementationStatus: "metadata_only",
    appRoute: "/generic-scale/ponte-ped-72",
  },
  {
    id: "sinapse-fi-60",
    name: "SINAPSE-FI 60",
    fullName: "SINAPSE-FI 60 — Escala Clínica Experimental Integrada de Neuropediatria, Psiquiatria Infantil, Funcionalidade e Escola",
    ageMin: 36,
    ageMax: 216,
    queixas: ["atraso", "tea", "tdah", "comportamento", "ansiedade", "depressao", "epilepsia", "linguagem", "sono", "cognicao", "aprendizagem", "funcionalidade", "motor", "social", "autonomia", "sensorial", "alimentacao", "suicidio", "evolucao"],
    respondente: ["pais", "professor", "clinico"],
    prioridade: "triagem",
    tempo: "15–20 min",
    description:
      "Instrumento autoral experimental do Dr. Jadson Fraga. 60 itens (12 domínios × 5, 0–3) que integram desenvolvimento, linguagem, sociabilidade, atenção, funções executivas, cognição, aprendizagem, sono, epilepsia, autorregulação sensorial, sofrimento emocional e funcionalidade, em matriz prática para consultório, laudo, escola e família. Ficha técnica — sem validação publicada.",
    fonte: "2026-06-20_ESCALA_AUTORAL_SINAPSE-FI_60_V1 — instrumento autoral Dr. Jadson Fraga (Google Drive) · Documento original: " + DOC("13F-krAjNvAUAtrGNoEibhuFt_2_f9l7kuM2PrMIuoXk"),
    licencaUso: "autoral",
    validacaoBrasil: "Autoral — experimental, sem validação psicométrica publicada",
    scoringCutoff:
      "12 domínios × 5 itens (0–3), máximo 180. Domínio: 0–4 mínimo; 5–8 leve; 9–11 moderado; 12–15 grave. Global: 0–40 baixo; 41–80 leve; 81–120 moderado; 121–155 grave; 156–180 muito grave. Índices derivados (Neurodesenvolvimental, Atencional-executivo, etc.).",
    assessmentUse: "triagem",
    applicationMode: "questionario_pais",
    implementationStatus: "metadata_only",
    appRoute: "/generic-scale/sinapse-fi-60",
  },
  {
    id: "nexus-ped-52",
    name: "NEXUS-PED 52",
    fullName: "NEXUS-PED 52 — Escala Clínica Experimental Integrada de Neurodesenvolvimento, Epilepsia, Execução, Sono e Sofrimento Infantil",
    ageMin: 24,
    ageMax: 216,
    queixas: ["atraso", "tea", "tdah", "comportamento", "ansiedade", "depressao", "epilepsia", "linguagem", "sono", "cognicao", "aprendizagem", "funcionalidade", "motor", "social", "autonomia", "sensorial", "alimentacao", "suicidio", "evolucao"],
    respondente: ["pais", "professor", "clinico"],
    prioridade: "triagem",
    tempo: "15–20 min",
    description:
      "Instrumento autoral experimental do Dr. Jadson Fraga. 52 itens (13 domínios × 4, 0–3) que organizam, em matriz única, dados de família, escola e consulta sobre desenvolvimento, linguagem, interação social, atenção, funções executivas, cognição, aprendizagem, sono, epilepsia, autorregulação, comportamento, sofrimento emocional e funcionalidade. Ficha técnica — sem validação publicada.",
    fonte: "2026-06-19_ESCALA_AUTORAL_NEXUS-PED_52_V1 — instrumento autoral Dr. Jadson Fraga (Google Drive) · Documento original: " + DOC("1SdrxKveoDOH8YwwwEptTlqCaoRFGWQQjh4swqPHimO8"),
    licencaUso: "autoral",
    validacaoBrasil: "Autoral — experimental, sem validação psicométrica publicada",
    scoringCutoff:
      "13 domínios × 4 itens (0–3), máximo 156. Domínio: 0–3 mínimo; 4–6 leve; 7–9 moderado; 10–12 grave. Global: 0–30 baixo; 31–65 leve; 66–100 moderado; 101–130 grave; 131–156 muito grave.",
    assessmentUse: "triagem",
    applicationMode: "questionario_pais",
    implementationStatus: "metadata_only",
    appRoute: "/generic-scale/nexus-ped-52",
  },
  {
    id: "nefi-ped-96",
    name: "NEFI-PED 96",
    fullName: "NEFI-PED 96 — Escala Neuropsiquiátrica Funcional Integrada Pediátrica",
    ageMin: 36,
    ageMax: 215,
    queixas: ["atraso", "tea", "tdah", "comportamento", "ansiedade", "depressao", "epilepsia", "linguagem", "sono", "cognicao", "aprendizagem", "funcionalidade", "motor", "social", "autonomia", "sensorial", "alimentacao", "suicidio", "evolucao"],
    respondente: ["pais", "professor", "clinico"],
    prioridade: "triagem",
    tempo: "15–25 min",
    description:
      "Instrumento autoral experimental do Dr. Jadson Fraga. 96 itens (12 domínios × 8, 0–3) para rastreio e organização semiológica integrada: desenvolvimento, comportamento, linguagem, cognição, aprendizagem, sono, epilepsia, autorregulação, funções executivas, sofrimento emocional e funcionalidade cotidiana, com marcações por ambiente (Escola/Casa/Ambos). Ficha técnica — sem validação publicada.",
    fonte: "2026-06-27_ESCALA_AUTORAL_NEFI-PED_96_V1 — instrumento autoral Dr. Jadson Fraga (Google Drive) · Documento original: " + DOC("1w_T-YQmk6gdCsRpYscsHbtRURNuoQlzwj2aQ8pFT6YI"),
    licencaUso: "autoral",
    validacaoBrasil: "Autoral — experimental, sem validação psicométrica publicada",
    scoringCutoff:
      "12 domínios × 8 itens (0–3), máximo 288. Domínio (0–24): 0–4 baixa; 5–8 leve; 9–14 moderado; 15–19 importante; 20–24 grave. Global: 0–32 baixo; 33–72 leve/moderado; 73–120 moderado; 121–180 importante; ≥181 grave. Marcações E/C/A por ambiente.",
    assessmentUse: "triagem",
    applicationMode: "questionario_pais",
    implementationStatus: "metadata_only",
    appRoute: "/generic-scale/nefi-ped-96",
  },
  {
    id: "idafeni",
    name: "IDAFENI",
    fullName: "IDAFENI-V1 — Índice Dr. Jadson de Desenvolvimento, Autorregulação, Funcionalidade e Eixos Neuropsiquiátricos Infantis",
    ageMin: 24,
    ageMax: 215,
    queixas: ["atraso", "tea", "tdah", "comportamento", "ansiedade", "depressao", "epilepsia", "linguagem", "sono", "cognicao", "aprendizagem", "funcionalidade", "motor", "social", "autonomia", "sensorial", "suicidio", "efeitos", "trauma", "evolucao"],
    respondente: ["pais", "professor", "clinico"],
    prioridade: "triagem",
    tempo: "15–20 min",
    description:
      "Instrumento autoral experimental do Dr. Jadson Fraga. 52 itens (9 domínios, 0–3) + 8 itens sentinela de gravidade, que organizam em linguagem prática a observação integrada de desenvolvimento, comportamento, cognição, linguagem, sono, epilepsia, aprendizagem, autorregulação, funções executivas, sofrimento emocional e funcionalidade. Ficha técnica — sem validação publicada.",
    fonte: "2026-06-26_ESCALA_AUTORAL_IDAFENI_V1 — instrumento autoral Dr. Jadson Fraga (Google Drive) · Documento original: " + DOC("1vkSSue7AB35jDmnn3cXmwHoBLT3sZpOBo8_RrjmVs5c"),
    licencaUso: "autoral",
    validacaoBrasil: "Autoral — experimental, sem validação psicométrica publicada",
    scoringCutoff:
      "9 domínios, 52 itens (0–3) + 8 itens sentinela. Média por domínio e Índice Global (média dos domínios): 0,00–0,49 sem alteração; 0,50–1,24 leve; 1,25–2,09 moderado; 2,10–3,00 elevado. Sentinelas: 1 = risco aumentado; ≥2 = risco alto; ideação/regressão/crise = prioridade máxima.",
    assessmentUse: "triagem",
    applicationMode: "questionario_pais",
    implementationStatus: "metadata_only",
    appRoute: "/generic-scale/idafeni",
  },
  {
    id: "eidaf-neuroinfantil",
    name: "EIDAF-Neuroinfantil",
    fullName: "EIDAF-Neuroinfantil V1 — Escala Integrada de Desenvolvimento, Autorregulação e Funcionalidade Neuroinfantil",
    ageMin: 24,
    ageMax: 215,
    queixas: ["atraso", "tea", "tdah", "comportamento", "ansiedade", "depressao", "epilepsia", "linguagem", "sono", "cognicao", "aprendizagem", "funcionalidade", "motor", "social", "autonomia", "sensorial", "suicidio", "evolucao"],
    respondente: ["pais", "professor", "clinico"],
    prioridade: "triagem",
    tempo: "10–15 min",
    description:
      "Instrumento autoral experimental do Dr. Jadson Fraga. 50 itens (10 domínios × 5, 0–3) que organizam sinais de desenvolvimento, comportamento, cognição, linguagem, sono, epilepsia, aprendizagem, autorregulação, funções executivas, sofrimento emocional e funcionalidade diária, identificando áreas comprometidas e prioridades. Ficha técnica — sem validação publicada.",
    fonte: "2026-06-25_ESCALA_AUTORAL_EIDAF_NEUROINFANTIL_V1 — instrumento autoral Dr. Jadson Fraga (Google Drive) · Documento original: " + DOC("1gwcgHzyTCEVlIREiEY1ERzt951w89TOl0YhaWFIySFM"),
    licencaUso: "autoral",
    validacaoBrasil: "Autoral — experimental, sem validação psicométrica publicada",
    scoringCutoff:
      "10 domínios × 5 itens (0–3), máximo 150. Domínio (0–15): 0–2 mínimo; 3–5 leve; 6–9 moderado; 10–12 importante; 13–15 grave. Índice Global EIDAF = obtido/máximo aplicável ×100: 0–14% baixo; 15–29% leve; 30–49% moderado; 50–69% importante; ≥70% grave.",
    assessmentUse: "triagem",
    applicationMode: "questionario_pais",
    implementationStatus: "metadata_only",
    appRoute: "/generic-scale/eidaf-neuroinfantil",
  },
  {
    id: "einpi-drj-v1",
    name: "EINPI-DrJ v1",
    fullName: "EINPI-DrJ v1 — Escala Integrada Neuropsiquiátrica Pediátrica Infantil",
    ageMin: 36,
    ageMax: 215,
    queixas: ["atraso", "tea", "tdah", "comportamento", "ansiedade", "depressao", "epilepsia", "linguagem", "sono", "cognicao", "aprendizagem", "funcionalidade", "motor", "social", "autonomia", "sensorial", "alimentacao", "suicidio", "psicose", "tiques", "evolucao"],
    respondente: ["pais", "professor", "clinico", "autoaplicavel"],
    prioridade: "triagem",
    tempo: "10–15 min",
    description:
      "Instrumento autoral experimental do Dr. Jadson Fraga. 48 itens (9 domínios, 0–3, NA possível) para triagem, laudo, comunicação e acompanhamento longitudinal do funcionamento neuropsiquiátrico infantil. Inclui item sentinela (F6) de rastreio de experiências psicóticas. Ficha técnica — sem validação psicométrica publicada.",
    fonte: "2026-06-24_ESCALA_AUTORAL_EINPI_V1 — instrumento autoral Dr. Jadson Fraga (Google Drive) · Documento original: " + DOC("1cjErnbJMJNxBxmFrK-EEPdzYOPXVQmiExolCTnSfgcM"),
    licencaUso: "autoral",
    validacaoBrasil: "Autoral — experimental, sem validação psicométrica publicada",
    scoringCutoff:
      "9 domínios (0–3 por item, NA possível). Escore total bruto, médio por domínio e médio global: 0,0–0,49 sem evidência; 0,5–1,19 leve/situacional; 1,2–1,99 moderado; 2,0–3,0 importante. Domínios com média ≥2 são prioritários. Item F6 rastreia experiências psicóticas (vozes/visões/pensamento desorganizado).",
    assessmentUse: "triagem",
    applicationMode: "questionario_pais",
    implementationStatus: "metadata_only",
    appRoute: "/generic-scale/einpi-drj-v1",
  },
  {
    id: "navi-ped-84",
    name: "NAVI-PED 84",
    fullName: "NAVI-PED 84 — Escala Clínica Experimental Integrada de Neurodesenvolvimento, Autorregulação, Vida Escolar e Neurobiologia Infantil",
    ageMin: 24,
    ageMax: 216,
    queixas: ["atraso", "tea", "tdah", "comportamento", "ansiedade", "depressao", "epilepsia", "linguagem", "sono", "cognicao", "aprendizagem", "funcionalidade", "motor", "social", "autonomia", "sensorial", "alimentacao", "suicidio", "evolucao"],
    respondente: ["pais", "professor", "clinico"],
    prioridade: "triagem",
    tempo: "20–30 min",
    description:
      "Instrumento autoral experimental do Dr. Jadson Fraga. 84 itens (14 domínios × 6, 0–3) que navegam pelos eixos que interferem na vida real da criança/adolescente — desenvolvimento, comportamento, cognição, linguagem, sono, epilepsia, aprendizagem, autorregulação, funções executivas, sofrimento emocional e funcionalidade — transformando dados dispersos em mapa clínico. Ficha técnica — sem validação publicada.",
    fonte: "2026-06-23_ESCALA_AUTORAL_NAVI-PED_84 — instrumento autoral Dr. Jadson Fraga (Google Drive) · Documento original: " + DOC("165Y_M33XQ7wOclJ_oO47mkGHre9KUsdxo7LC6BgWyqo"),
    licencaUso: "autoral",
    validacaoBrasil: "Autoral — experimental, sem validação psicométrica publicada",
    scoringCutoff:
      "14 domínios × 6 itens (0–3), máximo 252. Domínio (0–18): 0–4 mínimo; 5–8 leve; 9–13 moderado; 14–18 grave. Global: 0–40 baixo; 41–85 leve; 86–135 moderado; 136–195 grave; 196–252 muito grave. Índices derivados e alertas vermelho/amarelo.",
    assessmentUse: "triagem",
    applicationMode: "questionario_pais",
    implementationStatus: "metadata_only",
    appRoute: "/generic-scale/navi-ped-84",
  },
  {
    id: "escala-maria-clara-ansiedade",
    name: "Escala Maria Clara — Ansiedade",
    fullName: "Escala Autoral Maria Clara — Ansiedade Infantojuvenil (Protocolo Dr. Jadson Fraga)",
    ageMin: 96,
    ageMax: 215,
    queixas: ["ansiedade"],
    respondente: ["autoaplicavel", "clinico"],
    prioridade: "monitorizacao",
    tempo: "10–15 min",
    description:
      "Instrumento autoral do Dr. Jadson Fraga para avaliar a ansiedade infantojuvenil nas últimas 2 semanas em três dimensões — ansiedade global e somática, ansiedade generalizada cognitiva e ansiedade de desempenho/avaliação —, classificando gravidade e impacto funcional. 25 itens (0–3). Ficha técnica — sem validação psicométrica publicada.",
    fonte: "Escala Autoral Maria Clara (PDF) — instrumento autoral Dr. Jadson Fraga (Google Drive) · Documento original: https://drive.google.com/file/d/1i7LPeeg1CsJX7qnmtCxMAHheOrQ1m6sB/view",
    licencaUso: "autoral",
    validacaoBrasil: "Autoral — inspirada em SCARED/GAD-7/RCADS; sem validação psicométrica própria publicada",
    scoringCutoff:
      "25 itens (0 = nunca a 3 = quase todos os dias). Dimensão A — ansiedade global/somática: 8 itens, 0–24; dimensão B — preocupação/ansiedade generalizada: 8 itens, 0–24; dimensão C — desempenho e impacto funcional: 9 itens, 0–27. Total 0–75. Interpretação operacional pelo percentual do máximo: 0–19% baixa carga; 20–39% leve; 40–59% moderada; 60–79% importante; 80–100% muito elevada. Interpretação qualitativa obrigatória pelo médico.",
    assessmentUse: "monitorizacao",
    applicationMode: "autoquestionario_crianca_adolescente",
    literacyRequirement: "alfabetizado",
    implementationStatus: "metadata_only",
    appRoute: "/generic-scale/escala-maria-clara-ansiedade",
  },
];

export const escalasAutoraisDrive2026Lote2: ScaleEntry[] =
  escalasAutoraisDrive2026Lote2Base.map((scale) => ({
    ...NON_DEDICATED_RISK_METADATA,
    ...scale,
  }));
