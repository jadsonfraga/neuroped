// ============================================================
// LOTE 4 — EJIA-15, incorporada ao NeuroPed em 05/09/2026.
// Integração solicitada expressamente pelo autor ao banco e ao filtro.
//
// Instrumento clínico autoral para MONITORIZAÇÃO LONGITUDINAL.
// Não validado para diagnóstico, classificação normativa populacional
// ou definição de gravidade por um escore transversal isolado.
// ============================================================
import { type ScaleEntry } from "./scaleFilter";

export const escalasAutoraisDrive2026Lote4: ScaleEntry[] = [
  {
    id: "ejia-15",
    name: "EJIA-15",
    fullName:
      "EJIA-15 — Escala Jadson de Irritabilidade, Agressividade e Desregulação Infantil",
    // Faixa operacional provisória exigida pelo filtro. O instrumento ainda não
    // possui estudo psicométrico que defina limites etários normativos.
    ageMin: 36,
    ageMax: 216,
    queixas: [
      "comportamento",
      "tea",
      "tdah",
      "ansiedade",
      "social",
      "evolucao",
    ],
    respondente: ["pais"],
    prioridade: "monitorizacao",
    tempo: "3–5 min",
    appRoute: "/generic-scale/ejia-15",
    description:
      "Instrumento clínico autoral de 15 itens para acompanhar, em janelas de 7 dias, irritabilidade e frustração, agressividade e segurança, desregulação e recuperação, repetitividade associada à desregulação e impacto funcional. Preferir o mesmo cuidador nas reaplicações basal, semana 4, semana 8 e semana 12.",
    fonte:
      "EJIA-15 v1.0 — Dr. Jadson Fraga, 05/09/2026. Instrumento clínico autoral aprovado pelo autor para incorporação ao NeuroPed.",
    tipo: "Monitorização comportamental longitudinal",
    licencaUso: "autoral",
    validacaoBrasil:
      "Autoral — instrumento clínico experimental, sem validação psicométrica publicada e sem normas populacionais.",
    scoringCutoff:
      "15 itens, 0–3 pontos por item, total 0–45. Não há cutoff transversal validado de diagnóstico ou gravidade. Domínios: irritabilidade/frustração 0–18; agressividade/segurança 0–12; desregulação/recuperação 0–6; repetitividade associada à desregulação 0–6; impacto funcional 0–3. Para seguimento, % de melhora = (basal − atual) ÷ basal × 100. Leitura operacional, não validada: <10% sem mudança convincente; 10–24% mudança pequena/possível sinal; 25–49% resposta clinicamente relevante; ≥50% resposta importante; ≥75% resposta muito expressiva. Resposta 3 nos itens 7, 8 ou 10 exige revisão clínica prioritária independentemente do total.",
    verbalRequirement: "indiferente",
    literacyRequirement: "indiferente",
    suicideRiskInstrument: false,
    psychosisRiskInstrument: false,
    assessmentUse: "monitorizacao",
    applicationMode: "questionario_pais",
    implementationStatus: "complete",
    signalTags: [
      "irritabilidade",
      "agressividade",
      "autoagressao",
      "desregulacao",
      "frustracao",
      "rigidez",
      "estereotipias",
      "impacto_funcional",
      "evolucao_serial",
      "resposta_intervencao",
    ],
    exemploPais:
      "Pense somente nos últimos 7 dias e marque o que realmente aconteceu. Nas próximas aplicações, tente manter o mesmo responsável respondendo para tornar a comparação mais consistente.",
    pendente_validacao_clinica: true,
    pendencia:
      "Faixa etária 3–18 anos é operacional/provisória no filtro; propriedades psicométricas, responsividade, diferença mínima clinicamente importante e normas etárias ainda requerem validação formal.",
  },
];
