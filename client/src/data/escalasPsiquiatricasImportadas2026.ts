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
];
