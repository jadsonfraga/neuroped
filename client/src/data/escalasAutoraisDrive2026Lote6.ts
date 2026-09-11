// ============================================================
// LOTE 6 — instrumentos autorais impressos integrados em 09/09/2026.
// Fontes canônicas verificadas no Google Drive e confrontadas item a item.
// Todos são de monitorização longitudinal, sem pontos de corte diagnósticos.
// ============================================================
import { type ScaleEntry } from "./scaleFilter";

export const escalasAutoraisDrive2026Lote6: ScaleEntry[] = [
  {
    id: "ritmo-18-sdg",
    name: "RITMO-18 SDG",
    fullName: "RITMO-18 SDG — Registro de Fadiga Neurofuncional, Participação e Recuperação",
    ageMin: 60,
    ageMax: 215,
    queixas: ["funcionalidade", "evolucao", "sono"],
    respondente: ["pais", "professor"],
    prioridade: "monitorizacao",
    tempo: "5–8 min",
    appRoute: "/generic-scale/ritmo-18-sdg",
    description:
      "Instrumento clínico autoral de 18 itens para acompanhar cansaço, queda de rendimento, necessidade de pausas, participação e tempo de recuperação em casa, escola, terapias e vida social. A fonte admite autorrelato assistido a partir de aproximadamente 12 anos quando houver compreensão adequada; esse modo não é oferecido automaticamente pelo filtro.",
    fonte:
      "RITMO-18_SDG_Fadiga_Neurofuncional_v1.0_2026-09-09.pdf · Google Drive fileId 1rs1GPtJpwcn-6ZH6F_EOk9Ojo2NmN9dR · SHA-256 99bc7a121c7fb668ec159908fd5dabeb34b845bc712da91cbee49b9e72ca8a91 · fonte integral verificada em 09/09/2026.",
    tipo: "Monitorização longitudinal de fadiga neurofuncional e participação",
    licencaUso: "autoral",
    validacaoBrasil:
      "Autoral — sem validação psicométrica publicada, normas populacionais ou ponto de corte diagnóstico.",    scoringCutoff:
      "18 itens, respostas 0–3; N/O não entra no denominador. A leitura é descritiva por média 0–3 em cada domínio e global. Quanto maior a média, maior a carga observada naquele período. Sem ponto de corte ou delta mínimo validado.",
    verbalRequirement: "indiferente",
    literacyRequirement: "indiferente",
    suicideRiskInstrument: false,
    psychosisRiskInstrument: false,
    assessmentUse: "monitorizacao",
    applicationMode: "questionario_pais",
    implementationStatus: "complete",
    signalTags: [
      "fadiga", "cansaco", "baixa energia", "sonolencia diurna", "queda de rendimento",
      "pausas", "esforco cognitivo", "participacao", "recuperacao prolongada",
      "variabilidade ao longo do dia", "pos escola", "impacto funcional",
    ],
    exemploPais:
      "Pense nos últimos 14 dias e compare com o funcionamento habitual. Marque N/O se realmente não teve oportunidade de observar a situação.",
    pendente_validacao_clinica: true,
    pendencia:
      "Instrumento autoral não validado psicometricamente. Deve ser interpretado junto a sono, saúde clínica, medicamentos, demandas escolares, humor e demais causas de fadiga quando pertinentes.",
  },
  {
    id: "trilha-20-sdg",
    name: "TRILHA-20 SDG",
    fullName: "TRILHA-20 SDG — Roteiro Clínico Autoral de Autogestão em Saúde e Transição do Cuidado",
    ageMin: 120,
    ageMax: 216,
    queixas: ["autonomia", "funcionalidade", "evolucao"],
    respondente: ["autoaplicavel", "pais", "clinico"],    prioridade: "monitorizacao",
    tempo: "Tempo clínico variável",
    appRoute: "/generic-scale/trilha-20-sdg",
    description:
      "Instrumento clínico autoral de 20 itens para monitorar participação do adolescente no próprio cuidado, compreensão de informações essenciais, organização da rotina de saúde e transferência gradual e segura de responsabilidades.",
    fonte:
      "TRILHA-20_SDG_Autogestao_Transicao_Cuidado_v1.0_2026-09-09.pdf · Google Drive fileId 1JBWGK19QmRy6GlySFrgjvX7TWGmzSLv_ · SHA-256 e7932a955ffeffe194e965671d4045ff3fcd00843bd8408d7d7bbc2ab1c7d1ab · fonte integral verificada em 09/09/2026.",
    tipo: "Monitorização longitudinal de autogestão em saúde e transição do cuidado",
    licencaUso: "autoral",
    validacaoBrasil:
      "Autoral — sem validação psicométrica publicada, normas populacionais ou ponto de corte diagnóstico; não determina capacidade jurídica.",
    scoringCutoff:
      "20 itens, respostas 0–3; N/O e N/A não recebem zero e não entram no denominador. Domínio: média 0–3 preferencialmente com pelo menos 3/5 itens válidos. Global: média 0–3 preferencialmente com pelo menos 14/20 itens válidos. Maior média = maior autonomia observada. Sem ponto de corte diagnóstico.",
    verbalRequirement: "indiferente",
    literacyRequirement: "indiferente",
    suicideRiskInstrument: false,
    psychosisRiskInstrument: false,
    assessmentUse: "monitorizacao",
    applicationMode: "autoquestionario_crianca_adolescente",
    implementationStatus: "complete",
    signalTags: [
      "autogestao em saude", "transicao do cuidado", "responsabilidade", "medicacao",
      "consultas", "organizacao da rotina", "contato de emergencia", "seguranca",
      "pedido de ajuda", "autonomia", "adolescente", "plano de cuidado",
    ],
    exemploPais:
      "Observe o que o adolescente realmente consegue fazer, não apenas o que sabe repetir em teoria. A responsabilidade deve crescer de forma gradual e segura.",    pendente_validacao_clinica: true,
    pendencia:
      "Instrumento autoral não validado psicometricamente. O escore não define capacidade para ficar sem supervisão, capacidade civil, alta de acompanhamento ou transferência automática de responsabilidades.",
  },
];
