// ============================================================
// LOTE 5 — instrumentos autorais impressos integrados em 09/09/2026.
// Fontes canônicas verificadas no Google Drive e confrontadas com os PDFs.
//
// Todos os instrumentos deste lote são de MONITORIZAÇÃO LONGITUDINAL.
// Não possuem normas populacionais, percentis ou pontos de corte diagnósticos.
// ============================================================
import { type ScaleEntry } from "./scaleFilter";

export const escalasAutoraisDrive2026Lote5: ScaleEntry[] = [
  {
    id: "vigia-med-24",
    name: "VIGIA-MED 24",
    fullName:
      "VIGIA-MED 24 — Mapa Autoral de Tolerabilidade e Segurança Medicamentosa",
    ageMin: 36,
    ageMax: 215,
    queixas: ["efeitos", "evolucao"],
    respondente: ["pais"],
    prioridade: "monitorizacao",
    tempo: "Tempo clínico variável",
    appRoute: "/generic-scale/vigia-med-24",
    description:
      "Instrumento clínico autoral de 24 itens para monitorização longitudinal de sintomas possivelmente associados a medicamentos em neuropediatria e neurodesenvolvimento. Organiza tolerabilidade, segurança e impacto funcional em seis domínios, comparando basal e seguimentos sem atribuir causalidade medicamentosa de forma isolada.",
    fonte:
      "VIGIA_MED_24_NeuroPed_SDG.pdf · v1.0 · 07/09/2026 · Google Drive fileId 165X23pVefUkvflIHOHLESMZ0y9XmQukK · SHA-256 154d7e0a0eacc4a37dde4ce4084455a6dcaf28edc09a83264cd2c3e087d22b4b.",
    tipo: "Monitorização longitudinal de tolerabilidade e segurança medicamentosa",
    licencaUso: "autoral",
    validacaoBrasil:
      "Autoral — instrumento clínico de monitorização sem validação psicométrica publicada, sem normas populacionais e sem ponto de corte diagnóstico.",
    scoringCutoff:
      "24 itens, respostas 0–3; N/O não recebe zero automaticamente e não entra na apuração. Se os 4 itens de um domínio forem válidos, domínio 0–12. Total descritivo opcional 0–72 somente com os 24 itens válidos. Sem ponto de corte, percentil, categoria de gravidade ou mudança mínima clinicamente importante validada. Red flags são analisadas separadamente do total.",
    verbalRequirement: "indiferente",
    literacyRequirement: "indiferente",
    suicideRiskInstrument: false,
    psychosisRiskInstrument: false,
    assessmentUse: "monitorizacao",
    applicationMode: "questionario_pais",
    implementationStatus: "complete",
    signalTags: [
      "tolerabilidade",
      "efeitos adversos",
      "sonolencia",
      "insonia",
      "apetite",
      "gastrointestinal",
      "irritabilidade",
      "ativacao",
      "tremor",
      "movimentos involuntarios",
      "tiques",
      "tontura",
      "sincope",
      "cefaleia",
      "peso",
      "alteracoes endocrinas",
      "rash",
      "impacto funcional",
      "seguranca medicamentosa",
    ],
    exemploPais:
      "Pense apenas nos últimos 7 dias e compare com o padrão habitual da criança. Se um efeito já existia antes, registre como ele se comportou nesta janela; não atribua automaticamente ao medicamento.",
    pendente_validacao_clinica: true,
    pendencia:
      "Instrumento autoral não validado psicometricamente. Responsividade, propriedades de medida, normas e diferença mínima clinicamente importante ainda requerem estudo formal. O marcador auxiliar R do formulário impresso registra apenas relação temporal percebida e não prova causalidade.",
  },
  {
    id: "nexo-fam-24",
    name: "NEXO-FAM 24",
    fullName:
      "NEXO-FAM 24 — Mapa Clínico Autoral de Sustentabilidade Familiar do Cuidado",
    ageMin: 0,
    ageMax: 215,
    queixas: ["funcionalidade", "autonomia", "evolucao"],
    respondente: ["pais"],
    prioridade: "monitorizacao",
    tempo: "7–10 min",
    appRoute: "/generic-scale/nexo-fam-24",
    description:
      "Instrumento clínico autoral de 24 itens para acompanhar o impacto funcional do cuidado no cotidiano familiar de crianças e adolescentes. Organiza rotina, energia do cuidador, relações, trabalho/custos, rede de apoio e sustentabilidade do cuidado, com leitura exclusivamente descritiva e longitudinal.",
    fonte:
      "NEXO_FAM_24_NeuroPed_SDG.pdf · v1.0 · 2026 · Google Drive fileId 16Oji1nMFCgc7VDXcqjNZs83PAfRSVxTD · SHA-256 3eb4e4f460fa7d5c6bb9accc5424f0db71a0d158b2730f028e2aa48825ed773c.",
    tipo: "Monitorização longitudinal de sustentabilidade familiar do cuidado",
    licencaUso: "autoral",
    validacaoBrasil:
      "Autoral — instrumento clínico de monitorização sem validação psicométrica publicada, sem normas populacionais e sem ponto de corte diagnóstico.",
    scoringCutoff:
      "24 itens, respostas 0–4; N/O não entra na soma nem na média. Cada domínio completo soma 0–16 e pode ser descrito também pela média 0–4. Total bruto 0–96 apenas quando os 24 itens forem respondidos; com N/O usar média geral dos itens efetivamente respondidos. Sem ponto de corte diagnóstico, percentil, categoria normativa ou delta mínimo validado.",
    verbalRequirement: "indiferente",
    literacyRequirement: "indiferente",
    suicideRiskInstrument: false,
    psychosisRiskInstrument: false,
    assessmentUse: "monitorizacao",
    applicationMode: "questionario_pais",
    implementationStatus: "complete",
    signalTags: [
      "sobrecarga familiar",
      "rotina familiar",
      "energia do cuidador",
      "sono do cuidador",
      "rede de apoio",
      "custos do cuidado",
      "trabalho do cuidador",
      "continuidade do cuidado",
      "participacao familiar",
      "sustentabilidade",
      "qualidade de vida familiar",
    ],
    exemploPais:
      "Considere as últimas duas semanas e marque o impacto real na rotina da família. A pontuação não mede competência parental nem qualidade do vínculo; serve para organizar prioridades práticas do cuidado.",
    pendente_validacao_clinica: true,
    pendencia:
      "Instrumento autoral não validado psicometricamente. Propriedades de medida, responsividade, normas e diferença mínima clinicamente importante ainda requerem estudo formal.",
  },
];
