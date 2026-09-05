import type { ScaleEntry, Respondente } from "./scaleFilter";
import type { InteractiveScaleDef } from "./interactiveScaleItems";

/** Fonte única dos instrumentos autorais entregues em PDF. Não é validação psicométrica. */
export interface SdgAuthorialInstrument {
  id: string;
  name: string;
  fullName: string;
  version: string;
  releasedOn: string;
  sourceFile: string;
  sourceSha256: string;
  ageMin: number;
  ageMax: number;
  ageDescription: string;
  queixas: string[];
  respondente: Respondente[];
  signalTags: string[];
  description: string;
  respondentNote: string;
  domains: { name: string; items: string[] }[];
  /** Advertências clínicas independentes do total; não são itens pontuáveis. */
  alerts: string[];
}

export const SDG_RESPONSE_LABELS = [
  "0 — Não ocorreu / sem dificuldade",
  "1 — Leve ou ocasional",
  "2 — Frequente ou com impacto",
  "3 — Muito frequente / intenso ou difícil de contornar",
];
export const SDG_MONITORING_NOTE =
  "Instrumento clínico autoral de monitorização, sem validação psicométrica publicada. Não há ponto de corte diagnóstico, norma etária ou diferença mínima clinicamente importante validada. Não usar isoladamente para diagnóstico, indicação terapêutica ou perícia.";
export const SDG_FOLLOWUP_NOTE =
  "Compare basal, semana 4, semana 8 e semana 12, mantendo o mesmo respondente e contexto. Escore maior representa mais dificuldades relatadas; uma queda pode sugerir melhora e uma elevação pode sugerir piora, sempre confrontadas com o funcionamento real. Não estabelece causalidade do tratamento.";

export const authorialSdgRegistry: SdgAuthorialInstrument[] = [
  {
    id: "afi-12-sdg",
    name: "AFI-12 SDG",
    fullName: "Escala de Atenção, Freio e Impacto Funcional",
    version: "1.0",
    releasedOn: "2026-09-05",
    sourceFile: "01_AFI12_Atencao_Freio_Impacto_NeuroPed_SDG.pdf",
    sourceSha256: "f2123c61e7f03c52e20a24348b444f5c66293457c76b87756c0800435221b74d",
    ageMin: 60,
    ageMax: 215,
    ageDescription: "5 a 17 anos completos; faixa sugerida, não normativa",
    queixas: ["tdah", "comportamento", "aprendizagem", "evolucao"],
    respondente: ["pais", "professor"],
    signalTags: ["desatencao", "organizacao", "impulsividade", "autorregulacao", "supervisao", "impacto_funcional", "evolucao_serial"],
    description: "Monitorar atenção cotidiana, organização, impulsividade e autorregulação funcional em casa ou na escola, sem confirmar ou excluir TDAH.",
    respondentNote: "Pais ou professor: registre apenas o contexto observado. Não some nem trate respostas de casa e escola como a mesma linha de base.",
    domains: [
      {
        name: "Atenção/organização",
        items: [
          "Perde o fio da atividade e precisa ser chamado de volta para continuar.",
          "Deixa etapas pela metade, mesmo quando sabe o que deveria fazer.",
          "Começa outra coisa antes de concluir a tarefa que estava fazendo.",
          "Esquece orientações dadas há poucos minutos ou precisa ouvi-las de novo.",
          "Demora a iniciar uma tarefa mesmo depois de compreender o pedido.",
          "Perde materiais ou se atrapalha por agir sem organizar o que precisa.",
        ],
      },
      {
        name: "Freio/autorregulação",
        items: [
          "Fala ou age antes de ouvir a orientação até o fim.",
          "Interrompe, invade a vez ou tem dificuldade de esperar em situações comuns.",
          "Levanta, corre ou se movimenta quando a situação pede permanência ou calma.",
          "Diante de frustração, reage rápido e demora a conseguir se frear.",
          "Faz escolhas sem pensar suficientemente no risco ou na consequência.",
          "Precisa de supervisão muito maior que o esperado para manter ritmo e controle.",
        ],
      },
    ],
    alerts: [],
  },
  {
    id: "sdrd-12-sdg",
    name: "SDRD-12 SDG",
    fullName: "Escala de Sono, Despertares e Repercussão Diurna",
    version: "1.0",
    releasedOn: "2026-09-05",
    sourceFile: "02_SDRD12_Sono_Despertares_Repercussao_Diurna_NeuroPed_SDG.pdf",
    sourceSha256: "df63139cd65e52c46f99c772362b6ba36fcaad57794ab9616dbae7dce1c26225",
    ageMin: 36,
    ageMax: 215,
    ageDescription: "3 a 17 anos completos; faixa sugerida, não normativa",
    queixas: ["sono", "evolucao"],
    respondente: ["pais"],
    signalTags: ["sono", "insonia", "despertares", "rotina", "sonolencia", "cansaco", "repercussao_diurna", "evolucao_serial"],
    description: "Monitorar rotina de sono, continuidade da noite e impacto do sono no funcionamento durante o dia, sem diagnosticar um transtorno do sono.",
    respondentNote: "Responsável que acompanha a rotina noturna e o dia. O professor pode complementar o relato diurno, mas não responder sozinho sobre a noite.",
    domains: [
      {
        name: "Início/rotina",
        items: [
          "A rotina para dormir se prolonga ou vira negociação repetida com o adulto.",
          "Depois de deitar, demora muito para relaxar e realmente pegar no sono.",
          "Precisa de presença ou ajuda intensa do adulto para conseguir adormecer.",
          "Tela, brincadeira ou atividade estimulante costuma empurrar o horário de dormir.",
        ],
      },
      {
        name: "Continuidade/qualidade",
        items: [
          "Acorda durante a noite e precisa de ajuda para voltar a dormir.",
          "O sono parece inquieto, com muitos movimentos, chamados ou agitação.",
          "Acorda cedo demais para a rotina e não consegue retomar o sono.",
          "A quantidade ou a qualidade do sono parece insuficiente para recuperar bem.",
        ],
      },
      {
        name: "Impacto diurno",
        items: [
          "Acorda com grande dificuldade ou demora muito para ficar plenamente desperto.",
          "Apresenta sonolência, cansaço ou baixa energia durante o dia.",
          "Fica mais irritado, desorganizado ou emocionalmente instável após noite ruim.",
          "Atenção, aprendizagem ou participação pioram nos dias em que dorme mal.",
        ],
      },
    ],
    alerts: ["pausas respiratórias/engasgos no sono", "cianose", "eventos noturnos com risco de crise", "sonolência diurna incapacitante"],
  },
  {
    id: "sarf-12-sdg",
    name: "SARF-12 SDG",
    fullName: "Escala de Seletividade Alimentar e Repertório Funcional",
    version: "1.0",
    releasedOn: "2026-09-05",
    sourceFile: "03_SARF12_Seletividade_Alimentar_Repertorio_Funcional_NeuroPed_SDG.pdf",
    sourceSha256: "d0c55e5b29718bdf7b0ccfdb869914ce4f81d69b9dc5c38586c8ffb60194d8e9",
    ageMin: 24,
    ageMax: 179,
    ageDescription: "2 a 14 anos completos; faixa sugerida, não normativa",
    queixas: ["alimentacao", "evolucao"],
    respondente: ["pais"],
    signalTags: ["alimentacao", "seletividade", "repertorio", "textura", "rigidez", "mastigacao", "refeicao", "impacto_familiar", "evolucao_serial"],
    description: "Monitorar variedade alimentar, rigidez/sensibilidade e impacto das refeições na rotina da criança e da família; não diagnostica disfagia nem transtorno alimentar.",
    respondentNote: "Responsável que observa as refeições. Dificuldade de mastigação ou sinais de engasgo precisam de avaliação própria e não devem ser reduzidos a seletividade.",
    domains: [
      {
        name: "Repertório/rigidez",
        items: [
          "Aceita um repertório de alimentos muito estreito para a rotina da família.",
          "Recusa alimentos novos antes de provar ou tolerar pequena aproximação.",
          "Deixou de aceitar alimentos que antes comia e não os substituiu por equivalentes.",
          "Exige marca, formato, preparo ou apresentação muito específica para aceitar comer.",
        ],
      },
      {
        name: "Sensorial/oral",
        items: [
          "Rejeita alimentos principalmente por textura ou sensação na boca.",
          "Cheiro, temperatura, cor ou aparência do alimento desencadeiam recusa importante.",
          "Tem dificuldade para mastigar, organizar o alimento na boca ou avançar consistências.",
          "Mostra ânsia, aversão ou desconforto marcante quando o alimento chega perto da boca.",
        ],
      },
      {
        name: "Refeição/impacto",
        items: [
          "A refeição frequentemente vira negociação intensa, conflito ou longa insistência.",
          "Precisa de distração intensa, tela ou estratégia constante para conseguir comer.",
          "Come pouco ou recusa refeições a ponto de preocupar o cuidador com ingestão adequada.",
          "A alimentação limita escola, passeios, viagens, restaurantes ou a rotina familiar.",
        ],
      },
    ],
    alerts: ["engasgos/tosse ao comer", "perda ponderal ou desaceleração do crescimento", "vômitos/dor persistente", "sinais de desidratação ou baixa ingestão importante"],
  },
];

function safetyNote(instrument: SdgAuthorialInstrument): string {
  return instrument.alerts.length
    ? `Alertas para avaliação clínica prioritária, fora do escore e independentemente do total: ${instrument.alerts.join("; ")}.`
    : "";
}

/** O mesmo cadastro alimenta filtro e aplicação; adicionar uma escala não exige dois cadastros. */
export const escalasAutoraisSdg: ScaleEntry[] = authorialSdgRegistry.map((instrument) => ({
  id: instrument.id,
  name: instrument.name,
  fullName: `${instrument.name} — ${instrument.fullName}`,
  ageMin: instrument.ageMin,
  ageMax: instrument.ageMax,
  queixas: [...instrument.queixas],
  respondente: [...instrument.respondente],
  prioridade: "monitorizacao",
  tempo: "Tempo não aferido",
  appRoute: `/generic-scale/${instrument.id}`,
  description: `${instrument.description} ${instrument.respondentNote} ${SDG_FOLLOWUP_NOTE}`,
  fonte: `Dr. Jadson Fraga. ${instrument.name} v${instrument.version}, ${instrument.releasedOn}. PDF-fonte: ${instrument.sourceFile}. SHA-256: ${instrument.sourceSha256}.`,
  tipo: "Instrumento autoral de monitorização longitudinal",
  licencaUso: "autoral",
  validacaoBrasil: "Autoral — sem validação psicométrica publicada; sem normas populacionais.",
  scoringCutoff: `${instrument.domains.reduce((sum, domain) => sum + domain.items.length, 0)} itens, 0–3 por item. ${SDG_MONITORING_NOTE} ${safetyNote(instrument)}`,
  verbalRequirement: "indiferente",
  literacyRequirement: "indiferente",
  suicideRiskInstrument: false,
  psychosisRiskInstrument: false,
  assessmentUse: "monitorizacao",
  implementationStatus: "complete",
  signalTags: [...instrument.signalTags],
  exemploPais: "Pense nos últimos 7 dias. Marque apenas o que observou e mantenha o mesmo respondente e contexto no seguimento.",
  pendente_validacao_clinica: true,
  pendencia: `${instrument.ageDescription}. Respondentes definidos operacionalmente para o app; validade, confiabilidade, responsividade e interpretação da mudança exigem estudo formal.`,
}));

export const sdgOperationalItems: Record<string, InteractiveScaleDef> = Object.fromEntries(
  authorialSdgRegistry.map((instrument) => {
    const maximum = instrument.domains.reduce((sum, domain) => sum + domain.items.length * 3, 0);
    const definition: InteractiveScaleDef = {
      instruction: `Responda pensando somente nos últimos 7 dias. Escolha uma opção por item; responda todos os itens. ${instrument.respondentNote}`,
      infoBox: `${instrument.name} · v${instrument.version} · ${instrument.releasedOn}. ${instrument.ageDescription}. ${SDG_MONITORING_NOTE} ${SDG_FOLLOWUP_NOTE} ${safetyNote(instrument)}`,
      labels: [...SDG_RESPONSE_LABELS],
      optionPoints: [0, 1, 2, 3],
      scoreDirection: "higher_worse",
      totalLabel: `${instrument.name} — escore total de 0 a ${maximum}`,
      domains: instrument.domains.map((domain) => ({ name: domain.name, items: [...domain.items] })),
      bands: [{
        minPct: 0,
        classification: "Monitorização longitudinal — sem ponto de corte validado",
        color: "amber",
        description: `${SDG_MONITORING_NOTE} ${SDG_FOLLOWUP_NOTE} ${safetyNote(instrument)}`,
      }],
    };
    return [instrument.id, definition];
  }),
);

export function buildSdgPublicManifest() {
  return {
    schemaVersion: 1,
    brand: "NeuroPed SDG",
    instruments: authorialSdgRegistry.map((instrument) => ({
      id: instrument.id,
      version: instrument.version,
      sourceSha256: instrument.sourceSha256,
      ageMin: instrument.ageMin,
      ageMax: instrument.ageMax,
      itemCount: instrument.domains.reduce((sum, domain) => sum + domain.items.length, 0),
      validationStatus: "autoral_nao_validado",
    })).sort((left, right) => left.id.localeCompare(right.id)),
  };
}
