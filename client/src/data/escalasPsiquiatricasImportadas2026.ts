// ============================================================
// Escalas psiquiátricas importadas (PDFs Dr. Jadson, 2026-06)
// Inseridas no catálogo/filtro e abrindo como ficha técnica
// (/generic-scale/:id). Pontos de corte e fontes extraídos dos
// documentos enviados + referências canônicas.
//
// Obs.: a "Escala de Transtornos Disruptivos (pais/professores)" enviada já está
// contemplada no catálogo como DBD-RS (Disruptive Behavior Disorders Rating
// Scale, 45 itens). O arquivo enviado como "HAM-A" continha, na verdade, o
// HAM-D (escala de DEPRESSÃO de Hamilton); por isso entra aqui como HAM-D.
// ============================================================
import { type ScaleEntry } from "./scaleFilter";

export const escalasPsiquiatricasImportadas2026: ScaleEntry[] = [
  {
    id: "phq9",
    name: "PHQ-9",
    fullName: "Questionário de Saúde do Paciente-9 — Triagem de Depressão",
    ageMin: 132, // ~11 anos
    ageMax: 216, // 18 anos
    queixas: ["depressao", "suicidio", "evolucao"],
    respondente: ["autoaplicavel"],
    prioridade: "triagem",
    tempo: "2–5 min",
    description:
      "Triagem de depressão com 9 itens referentes às últimas 2 semanas, autoaplicável. O item 9 avalia ideação de morte/autolesão — investigar sempre que positivo. Útil também para monitorar evolução.",
    fonte:
      "Kroenke K, Spitzer RL, Williams JBW. J Gen Intern Med. 2001. Validação brasileira: Santos IS et al., Cad. Saúde Pública 2013; Osório FL et al.",
    scoringCutoff:
      "Total 0–27 (9 itens, 0–3). 0–4 mínimo; 5–9 leve; 10–14 moderado; 15–19 moderado-grave; 20–27 grave. ≥10 sugere depressão maior provável.",
    validacaoBrasil: "Validado no Brasil (Santos et al., 2013).",
    licencaUso: "livre",
    assessmentUse: "triagem",
    applicationMode: "autoquestionario_crianca_adolescente",
    verbalRequirement: "verbal",
    literacyRequirement: "alfabetizado",
  },
  {
    id: "hads",
    name: "HADS",
    fullName: "Escala Hospitalar de Ansiedade e Depressão",
    ageMin: 156, // ~13 anos
    ageMax: 216,
    queixas: ["ansiedade", "depressao", "evolucao"],
    respondente: ["autoaplicavel"],
    prioridade: "triagem",
    tempo: "3–5 min",
    description:
      "14 itens autoaplicáveis (7 de ansiedade + 7 de depressão), sem sintomas somáticos. Triagem e acompanhamento de ansiedade e depressão.",
    fonte:
      "Zigmond AS, Snaith RP. Acta Psychiatr Scand. 1983. Validação brasileira: Botega NJ et al., Rev. Saúde Pública 1995.",
    scoringCutoff:
      "Duas subescalas (HADS-A e HADS-D), 0–21 cada (itens 0–3). Por subescala: 0–7 improvável; 8–10 possível/duvidoso; ≥11 provável caso.",
    validacaoBrasil: "Validado no Brasil (Botega et al., 1995).",
    licencaUso: "livre",
    assessmentUse: "triagem",
    applicationMode: "autoquestionario_crianca_adolescente",
    verbalRequirement: "verbal",
    literacyRequirement: "alfabetizado",
  },
  {
    id: "bprs",
    name: "BPRS",
    fullName: "Escala Breve de Avaliação Psiquiátrica — versão ancorada (BPRS-A)",
    ageMin: 144, // ~12 anos
    ageMax: 216,
    queixas: ["psicose", "comportamento", "evolucao"],
    respondente: ["clinico"],
    prioridade: "monitorizacao",
    tempo: "15–30 min",
    description:
      "18 itens avaliados pelo clínico (relato do paciente + observação na entrevista) para medir a gravidade de sintomas psiquiátricos, sobretudo psicóticos e afetivos. Útil para acompanhar a evolução.",
    fonte:
      "Overall JE, Gorham DR. Psychol Rep. 1962. Versão ancorada BPRS-A: Woerner, 1998; tradução Romano F, Elkis H, 1996.",
    scoringCutoff:
      "18 itens (1–7 cada na versão ancorada). Escore total maior = maior gravidade. Sem ponto de corte diagnóstico fixo; usar para gravidade e acompanhamento.",
    validacaoBrasil: "Versão ancorada traduzida no Brasil (Romano & Elkis, 1996).",
    licencaUso: "livre",
    assessmentUse: "monitorizacao",
    applicationMode: "entrevista_clinica",
    verbalRequirement: "indiferente",
    literacyRequirement: "indiferente",
  },
  {
    id: "hamd",
    name: "HAM-D",
    fullName: "Escala de Hamilton para Avaliação da Depressão (HDRS)",
    ageMin: 144,
    ageMax: 216,
    queixas: ["depressao", "evolucao"],
    respondente: ["clinico"],
    prioridade: "monitorizacao",
    tempo: "15–25 min",
    description:
      "Escala heteroaplicada (entrevista clínica) para medir a gravidade da depressão. Versão de 21 itens (pontuados 0–4 ou 0–2). Amplamente usada para acompanhar a resposta ao tratamento. (O arquivo enviado como 'HAM-A' continha, na verdade, esta escala de depressão.)",
    fonte: "Hamilton M. J Neurol Neurosurg Psychiatry. 1960 (HDRS/HAM-D).",
    scoringCutoff:
      "Soma dos 17 primeiros itens (referência clássica): 0–7 sem depressão; 8–13 leve; 14–18 moderada; 19–22 grave; ≥23 muito grave.",
    licencaUso: "livre",
    assessmentUse: "monitorizacao",
    applicationMode: "entrevista_clinica",
    verbalRequirement: "indiferente",
    literacyRequirement: "indiferente",
  },
  {
    id: "bai",
    name: "BAI",
    fullName: "Inventário de Ansiedade de Beck",
    ageMin: 156, // ~13 anos
    ageMax: 216,
    queixas: ["ansiedade", "evolucao"],
    respondente: ["autoaplicavel"],
    prioridade: "triagem",
    tempo: "5–10 min",
    description:
      "21 itens autoaplicáveis sobre sintomas de ansiedade (predominantemente somáticos) na última semana, 0–3 cada. Triagem e acompanhamento da gravidade. Instrumento autoral (uso conforme licenciamento; aqui como ficha de referência).",
    fonte: "Beck AT, Epstein N, Brown G, Steer RA. J Consult Clin Psychol. 1988. Adaptação brasileira: Cunha JA, 2001.",
    scoringCutoff: "Total 0–63 (21 itens, 0–3). 0–7 mínima; 8–15 leve; 16–25 moderada; 26–63 grave.",
    validacaoBrasil: "Adaptado no Brasil (Cunha, 2001).",
    licencaUso: "autoral",
    assessmentUse: "triagem",
    applicationMode: "autoquestionario_crianca_adolescente",
    verbalRequirement: "verbal",
    literacyRequirement: "alfabetizado",
  },
  {
    id: "bhs",
    name: "BHS",
    fullName: "Escala de Desesperança de Beck",
    ageMin: 156,
    ageMax: 216,
    queixas: ["suicidio", "depressao", "evolucao"],
    respondente: ["autoaplicavel"],
    prioridade: "triagem",
    tempo: "5–10 min",
    description:
      "20 afirmações verdadeiro/falso sobre expectativas negativas quanto ao futuro (desesperança), na última semana. A desesperança é preditora de risco de suicídio — avaliar junto com a clínica. Instrumento autoral (uso conforme licenciamento).",
    fonte: "Beck AT, Weissman A, Lester D, Trexler L. J Consult Clin Psychol. 1974. Adaptação brasileira: Cunha JA, 2001.",
    scoringCutoff: "Total 0–20. 0–3 mínima; 4–8 leve; 9–14 moderada; 15–20 grave. Escores mais altos associam-se a maior risco de suicídio.",
    validacaoBrasil: "Adaptado no Brasil (Cunha, 2001).",
    licencaUso: "autoral",
    assessmentUse: "triagem",
    applicationMode: "autoquestionario_crianca_adolescente",
    verbalRequirement: "verbal",
    literacyRequirement: "alfabetizado",
  },
  {
    id: "ead-das",
    name: "EAD (DAS)",
    fullName: "Escala de Atitudes Disfuncionais",
    ageMin: 156,
    ageMax: 216,
    queixas: ["depressao", "cognicao", "evolucao"],
    respondente: ["autoaplicavel"],
    prioridade: "monitorizacao",
    tempo: "10–15 min",
    description:
      "Avalia crenças e atitudes disfuncionais (vulnerabilidade cognitiva à depressão), itens em escala 1–7 (concordância). Útil em TCC para identificar e acompanhar padrões de pensamento. Instrumento autoral.",
    fonte: "Weissman AN, Beck AT. (Dysfunctional Attitudes Scale — DAS), 1978.",
    scoringCutoff: "Escore total contínuo (itens 1–7). Maior pontuação = mais atitudes disfuncionais / maior vulnerabilidade cognitiva. Sem ponto de corte diagnóstico fixo.",
    licencaUso: "autoral",
    assessmentUse: "monitorizacao",
    applicationMode: "autoquestionario_crianca_adolescente",
    verbalRequirement: "verbal",
    literacyRequirement: "alfabetizado",
  },
  {
    id: "risco-suicidio-familias",
    name: "Risco de Suicídio (Famílias)",
    fullName: "Escala de Avaliação de Risco de Suicídio para Famílias",
    ageMin: 144, // ~12 anos
    ageMax: 216,
    queixas: ["suicidio", "depressao"],
    respondente: ["clinico"],
    prioridade: "triagem",
    tempo: "10–20 min",
    description:
      "Roteiro para apoiar a avaliação de comportamentos e sinais de risco de suicídio, preenchido com o auxílio de um profissional de saúde mental (de preferência psiquiatra). NÃO é diagnóstico: uma pessoa pode estar em risco mesmo sem sinais de alerta. Cada item é graduado (0–10).",
    fonte: "Roteiro de avaliação de risco de suicídio para uso com famílias e profissionais de saúde mental (material de apoio).",
    scoringCutoff: "Itens graduados 0–10 (maior = maior risco). Instrumento de apoio ao julgamento clínico, sem ponto de corte diagnóstico. Encaminhar ao especialista quando houver sinais de risco.",
    licencaUso: "livre",
    assessmentUse: "triagem",
    applicationMode: "entrevista_clinica",
    verbalRequirement: "indiferente",
    literacyRequirement: "indiferente",
    pendente_validacao_clinica: true,
    pendencia: "Fonte/autoria primária a confirmar (material de apoio enviado pelo médico).",
  },
];
