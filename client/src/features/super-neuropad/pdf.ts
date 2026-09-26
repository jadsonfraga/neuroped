/**
 * PDF detalhado do Super NeuroPad Game — especificação pura (sem DOM) para o
 * construtor clínico compartilhado (`buildDocumentPdf`). O documento traz
 * identificação, resultado objetivo por fase, cada pergunta com resposta
 * esperada, resposta registrada, certo/errado e tempo, além dos critérios de
 * leitura e da proveniência. Emoji e símbolos são convertidos em texto: o
 * registro usa sempre o rótulo textual de cada opção.
 */
import type { DocSpec } from "@/lib/documentPdf";
import type { DocumentIssuer } from "@/lib/issuer";
import {
  describeArt,
  formatDuration,
  interpret,
  KIND_LABELS,
  LEVEL_LABELS,
  STATUS_LABELS,
  SUPER_NEUROPAD_NATURE,
  SUPER_NEUROPAD_SOURCES,
  SUPER_NEUROPAD_TITLE,
  SUPER_NEUROPAD_VERSION,
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
  const identification = [
    `Idade informada: ${session.ageYears} anos (faixa ${summary.band.label})`,
    `Personagem escolhido: ${summary.character.name} ${summary.character.role} (${summary.character.power})`,
    `Data e hora da aplicação: ${appliedAt}`,
    `Aplicação: recepção/secretária na pré-consulta, sem câmera, resposta direta da criança`,
    `Tempo somado nas tarefas: ${formatDuration(summary.durationSeconds)}`,
    `Situação: ${summary.complete ? "jogo completo (5 fases)" : `jogo incompleto (${session.answers.length} de ${summary.total} itens registrados)`}`,
  ].join("\n");

  const objective = [
    `TOTAL: ${summary.hits} acertos em ${summary.total} itens - ${LEVEL_LABELS[summary.level]}`,
    "",
    ...summary.phases.map((phase) =>
      `Fase ${phase.phase.order} - ${phase.phase.name} (${phase.phase.domain}): ${phase.applied ? `${phase.hits}/${phase.total} acertos, ${phase.errors} erros, ${phase.noResponse} sem resposta - ${LEVEL_LABELS[phase.level]} - ${formatDuration(phase.seconds)}` : "não aplicada"}`,
    ),
  ].join("\n");

  const consultation = [
    "Leitura descritiva e autoral do registro, para orientar a consulta. Comparações internas à partida; nenhuma norma, percentil, idade equivalente ou diagnóstico.",
    "",
    ...reading.notes.map((note) => `- ${describeArt(note)}`),
    "",
    reading.missed.length === 0
      ? "Nenhum item perdido."
      : `Itens para checar na consulta (${reading.missed.length}):\n` + reading.missed
          .map((answer) => `  - ${describeArt(answer.prompt)} | esperado: ${describeArt(answer.expected)} | registrado: ${describeArt(answer.given)} | ${STATUS_LABELS[answer.status]} | ${answer.seconds} s${answer.repeated ? " | comando repetido 1x" : ""}`)
          .join("\n"),
  ].join("\n");

  const phaseSections = summary.phases.map((phase) => ({
    heading: `Fase ${phase.phase.order} - ${phase.phase.name} (${phase.phase.domain}) - ${phase.hits}/${phase.total}`,
    body: phase.answers.length === 0
      ? "Fase não aplicada."
      : phase.answers
          .map((answer, index) => [
            `${index + 1}. ${describeArt(answer.prompt)}`,
            `   Tipo: ${KIND_LABELS[answer.kind]}`,
            `   Resposta esperada: ${describeArt(answer.expected)}`,
            `   Resposta registrada: ${describeArt(answer.given)}`,
            `   Resultado: ${STATUS_LABELS[answer.status]} - tempo: ${answer.seconds} s${answer.repeated ? " - comando repetido 1x" : ""}`,
          ].join("\n"))
          .join("\n\n"),
  }));

  const criteria = [
    "Cada item tem uma única resposta certa. Itens de toque são conferidos pelo próprio jogo; itens de fala e de ação são conferidos pela aplicadora contra o critério explícito exibido na tela.",
    "Faixas operacionais autorais para leitura rápida da equipe (não normativas):",
    "  Por fase (4 itens): 3-4 acertos = dentro do esperado; 2 = observar; 0-1 = sinal de alerta.",
    "  Total (20 itens): 16 ou mais = dentro do esperado; 12-15 = observar; 11 ou menos = sinal de alerta.",
    "Itens sem resposta contam como não acertados. Dificuldade propositalmente abaixo do esperado para a faixa: o jogo rastreia déficit grosseiro, não mede talento nem potencial.",
    "Ritmo: item lento é o que leva 2 vezes a mediana da própria partida (mínimo 12 s); é comparação interna, não tempo normativo. Comando repetido é anotado quando a aplicadora precisou repetir a instrução uma vez.",
  ].join("\n");

  const provenance = [
    `${SUPER_NEUROPAD_TITLE} - versão ${SUPER_NEUROPAD_VERSION}`,
    "Natureza: " + SUPER_NEUROPAD_NATURE,
    "Reúne e reconcilia, em cinco fases, o conteúdo de quatro abas do NeuroPed que continuam disponíveis:",
    ...SUPER_NEUROPAD_SOURCES.map((source) => `  - ${source}`),
    "Registro gerado localmente no dispositivo; nada foi persistido no navegador nem enviado por rede.",
  ].join("\n");

  return {
    title: `${SUPER_NEUROPAD_TITLE} - resultado detalhado`,
    subtitle: `Triagem de pré-consulta por faixa etária - ${summary.band.label}`,
    credentials: [
      [issuer.doctorName, issuer.specialty].filter(Boolean).join(" - "),
      issuer.credentials,
    ].filter(Boolean),
    clinicName: issuer.clinicName || undefined,
    motto: issuer.motto || undefined,
    sections: [
      { heading: "Identificação da aplicação", body: identification },
      { heading: "Resultado objetivo", body: objective },
      { heading: "Leitura para a consulta", body: consultation },
      ...phaseSections,
      { heading: "Critérios de leitura", body: criteria },
      { heading: "Proveniência e natureza", body: provenance },
    ],
    footer: "Triagem autoral de pré-consulta. Não substitui avaliação médica, psicométrica ou diagnóstica. Leitura e conclusão pertencem ao médico.",
  };
}
