/**
 * PDF detalhado do Super NeuroPad Game — especificação pura (sem DOM) para o
 * construtor clínico compartilhado (`buildDocumentPdf`). O documento traz:
 * metadados da sessão (data/hora local, idade, duração, pausas, mundos não
 * aplicados), o que foi testado por instrumento de origem (Sonda 10, OBS-10,
 * Reconhecimento Visual, Avaliação Cognitiva Infantil), desempenho por domínio
 * contra a referência autoral da idade, cada item com origem, resposta
 * esperada, resposta da criança, resultado, tempo, repetição e via, as
 * observações da aplicadora e um bloco estruturado (rótulos fixos + JSON por
 * linha) para leitura por máquina. Emoji e símbolos viram texto.
 */
import type { DocLine, DocSpec } from "@/lib/documentPdf";
import type { DocumentIssuer } from "@/lib/issuer";
import {
  cleanObservations,
  cutText,
  describeArt,
  estimateBandSeconds,
  formatDuration,
  interpret,
  KIND_LABELS,
  LEVEL_LABELS,
  ORIGIN_LABELS,
  phaseById,
  phaseStatusText,
  sessionWallSeconds,
  STATUS_LABELS,
  ANSWER_TONE,
  STRUCTURED_HEADER,
  SUPER_NEUROPAD_MILESTONE_SOURCES,
  SUPER_NEUROPAD_NATURE,
  SUPER_NEUROPAD_SOURCES,
  SUPER_NEUROPAD_TITLE,
  SUPER_NEUROPAD_VERSION,
  buildStructuredLines,
  summarize,
  type GameSession,
} from "./model";

export interface IssuerLines {
  doctorName: string;
  specialty: string;
  credentials: string;
  clinicName: string;
  motto: string;
}

export function issuerLines(issuer: DocumentIssuer, credentials: string): IssuerLines {
  return {
    doctorName: issuer.doctorName,
    specialty: issuer.specialty,
    credentials,
    clinicName: issuer.clinicName,
    motto: issuer.motto,
  };
}

export function buildGameDocSpec(session: GameSession, issuer: IssuerLines, appliedAt: string): DocSpec {
  const summary = summarize(session);
  const reading = interpret(session);
  const wall = sessionWallSeconds(session);
  const estimate = estimateBandSeconds(summary.band.min);
  const observations = cleanObservations(session.observations ?? "");
  const skipped = summary.phases.filter((phase) => phase.skipReason);
  const incomplete = `Partida incompleta: ${session.answers.length} de ${summary.total} itens registrados. Sem classificação ou interpretação (regra da partida incompleta); cada mundo mostra o que foi registrado ou "não aplicado".`;
  const identification = [
    `Idade informada: ${session.ageYears} anos (faixa anual de ${summary.band.label}; itens calibrados para esta idade)`,
    `Data e hora da aplicação (horário local, America/Sao_Paulo): ${appliedAt}`,
    `Personagem escolhido: ${summary.character.name} ${summary.character.role} (${summary.character.power})`,
    `Aplicação: aplicadora junto com a criança, no próprio aplicativo; sem câmera e sem instrumento externo`,
    `Duração da sessão (relógio): ${wall !== null ? formatDuration(wall) : "não disponível"} - tempo somado nas tarefas: ${formatDuration(summary.durationSeconds)} - tempo estimado para a idade: ${formatDuration(estimate.totalSeconds)} (máximo 20 min)`,
    `Pausas: ${session.pauseCount ?? 0} (${formatDuration(session.pausedSeconds ?? 0)} em pausa) - registros desfeitos e refeitos: ${session.undoCount ?? 0} - comandos repetidos: ${session.answers.filter((answer) => answer.repeated).length} - acertos por gesto/apontar: ${session.answers.filter((answer) => answer.via === "gesto").length}`,
    `Situação: ${summary.complete ? `jogo completo (${summary.phases.length} mundos, ${summary.total} itens)` : `jogo incompleto (${session.answers.length} de ${summary.total} itens registrados)`}`,
    `Mundos não aplicados: ${skipped.length === 0 ? "nenhum" : skipped.map((phase) => `${phase.phase.name} (${phase.skipReason})`).join("; ")}`,
  ].join("\n");

  const origins = [
    "Cada item do jogo vem de uma das quatro abas de origem, que continuam disponíveis para aprofundar:",
    "",
    ...summary.origins.map((origin) => [
      `${origin.label} (${origin.route}): ${origin.planned} item(ns) previstos para ${summary.band.label}; registrados ${origin.applied}; acertos ${origin.hits}.`,
      `  Mundos: ${origin.phases.map((id) => phaseById(id).name).join(", ") || "nenhum nesta idade"}`,
      `  Referências: ${origin.refs.join(" | ") || "-"}`,
    ].join("\n")),
  ].join("\n");

  const objective = [
    summary.level === null ? incomplete : `TOTAL: ${summary.hits} acertos em ${summary.total} itens (esperado para a idade: ${summary.expectedMin} ou mais) - ${LEVEL_LABELS[summary.level]}`,
    "",
    ...summary.phases.map((phase) =>
      `Mundo ${phase.phase.order} - ${phase.phase.name} (${phase.phase.domain}): ${phase.level === null
        ? phaseStatusText(phase, false)
        : `${phase.hits}/${phase.total} acertos (esperado: ${phase.expectedMin} ou mais), ${phase.errors} erros, ${phase.noResponse} sem resposta, ${phase.refused} recusa(s) - ${LEVEL_LABELS[phase.level]} - ${formatDuration(phase.seconds)}`}`,
    ),
    "",
    "Esperado para a idade = referência operacional autoral do jogo (proporção de acertos), não norma populacional nem ponto de corte validado.",
  ].join("\n");

  const consultation = reading ? [
    "Leitura descritiva e autoral do registro, para orientar a consulta. Comparações internas à partida; nenhuma norma, percentil, idade equivalente ou diagnóstico.",
    "",
    ...reading.notes.map((note) => `- ${describeArt(note)}`),
    "",
    reading.missed.length === 0
      ? "Nenhum item perdido."
      : `Itens para checar na consulta (${reading.missed.length}):\n` + reading.missed
          .map((answer) => `  - ${describeArt(answer.prompt)} | esperado: ${describeArt(answer.expected)} | registrado: ${describeArt(answer.given)} | ${STATUS_LABELS[answer.status]} | ${answer.seconds} s${answer.repeated ? " | comando repetido 1x" : ""}`)
          .join("\n"),
  ].join("\n") : incomplete;

  const phaseSections = summary.phases.map((phase) => {
    const notApplied = phase.skipReason ? `Não aplicado - motivo: ${phase.skipReason}.` : "Não aplicado.";
    // Mesmo texto em `body` (texto corrido) e em `rich` (desenho com destaque):
    // enunciado em negrito; resposta da criança em negrito e na cor da situação
    // (azul acertou, vermelho errou, cinza não respondeu/recusou/não aplicado).
    const items = phase.answers.map((answer, index) => [
      { text: `${index + 1}. ${describeArt(answer.prompt)}`, bold: true },
      { text: `   Origem: ${ORIGIN_LABELS[answer.origin]} - ${describeArt(answer.ref)}` },
      { text: `   Tipo: ${KIND_LABELS[answer.kind]}` },
      { text: `   Resposta esperada: ${describeArt(answer.expected)}` },
      { text: `   Resposta da criança: ${describeArt(answer.given)}`, bold: true, tone: ANSWER_TONE[answer.status] },
      { text: `   Resultado: ${STATUS_LABELS[answer.status]} - tempo: ${answer.seconds} s - repetições do comando: ${answer.repeated ? 1 : 0}${answer.via === "gesto" ? " - via: gesto/apontar" : ""}` },
    ] satisfies DocLine[]);
    const rich: DocLine[] = phase.answers.length === 0
      ? [{ text: notApplied, tone: "neutral" }]
      : items.flatMap((lines, index) => (index === 0 ? lines : [{ text: "" }, ...lines]));
    return {
      heading: `Mundo ${phase.phase.order} - ${phase.phase.name} (${phase.phase.domain}) - ${phaseStatusText(phase, summary.complete)}`,
      body: phase.answers.length === 0 ? notApplied : items.map((lines) => lines.map((line) => line.text).join("\n")).join("\n\n"),
      rich,
    };
  });

  const perPhase = summary.phases[0]?.total ?? 0;
  const criteria = [
    "Cada item tem uma única resposta certa. Itens de toque e de montar palavra são conferidos pelo próprio jogo; itens de fala e de ação são conferidos pela aplicadora contra o critério explícito exibido na tela.",
    "Faixas operacionais autorais para leitura rápida da equipe (não normativas), as mesmas proporções desde a primeira versão do jogo:",
    `  Por mundo (${perPhase} itens): ${cutText(perPhase)}.`,
    `  Total (${summary.total} itens): ${cutText(summary.total, "total")}.`,
    "\"Não respondeu\" e \"Recusou\" contam como não acertados e ficam registrados à parte de \"Errou\". Nas faixas de 2 e 3 anos, alguns itens de fala aceitam apontar/gesto como alternativa prevista (registrado como via gesto).",
    `Calibração: itens escolhidos por ano de idade a partir dos bancos de origem, para que uma criança com desenvolvimento típico acerte a maior parte, mas não necessariamente todos. Referência descritiva de marcos: ${SUPER_NEUROPAD_MILESTONE_SOURCES.join("; ")}. Não há validação normativa deste conjunto.`,
    "Ritmo: item lento é o que leva 2 vezes a mediana da própria partida (mínimo 12 s); é comparação interna, não tempo normativo.",
  ].join("\n");

  const structured = [
    "Rótulos fixos: SESSAO, DOMINIO, ORIGEM, ITEM, OBSERVACOES. Valor em JSON de uma linha após o rótulo. Figuras aparecem como [nome]. Níveis ficam null em partida incompleta.",
    "",
    ...buildStructuredLines(session),
  ].join("\n");

  const provenance = [
    `${SUPER_NEUROPAD_TITLE} - versão ${SUPER_NEUROPAD_VERSION}`,
    "Natureza: " + SUPER_NEUROPAD_NATURE,
    `Integra, em ${summary.phases.length} mundos, os elementos de quatro abas do NeuroPed que continuam disponíveis:`,
    ...SUPER_NEUROPAD_SOURCES.map((source) => `  - ${source}`),
    "Durante o jogo nada foi persistido no navegador nem enviado por rede. O registro só vai ao prontuário pelo botão explícito \"Salvar no prontuário\".",
  ].join("\n");

  return {
    title: `${SUPER_NEUROPAD_TITLE} - resultado detalhado`,
    subtitle: `Avaliação de pré-consulta - ${summary.band.label}`,
    credentials: [
      [issuer.doctorName, issuer.specialty].filter(Boolean).join(" - "),
      issuer.credentials,
    ].filter(Boolean),
    clinicName: issuer.clinicName || undefined,
    motto: issuer.motto || undefined,
    sections: [
      { heading: "Identificação da sessão", body: identification },
      { heading: "O que foi testado por instrumento de origem", body: origins },
      { heading: "Desempenho por domínio x esperado para a idade", body: objective },
      ...(reading ? [{ heading: "Leitura para a consulta", body: consultation }] : []),
      ...phaseSections,
      { heading: "Observações da aplicadora", body: observations ? describeArt(observations) : "Sem observações registradas." },
      ...(reading ? [{ heading: "Critérios de leitura", body: criteria }] : []),
      { heading: STRUCTURED_HEADER, body: structured },
      { heading: "Proveniência e natureza", body: provenance },
    ],
    footer: "Avaliação autoral de pré-consulta. Não substitui avaliação médica, psicométrica ou diagnóstica. Leitura e conclusão pertencem ao médico.",
  };
}
