/**
 * Auditoria e explicação do pódio do Filtro Clínico.
 *
 * Função PURA: não decide o pódio; apenas descreve o trio já escolhido pelo motor
 * (selectPodiumDetailed) para a UI e a exportação. Explica, em linguagem concisa:
 * o papel de cada medalha, o que ela acrescenta, quem responde, o tempo, o encaixe
 * etário e se abre no app; e registra as LACUNAS honestas (queixa ou sinal sem
 * instrumento no trio, redundância resolvida, faixa só parcialmente coberta).
 *
 * Não define norma, ponto de corte, diagnóstico nem aplicabilidade: apenas relata
 * o que o motor já validou.
 */
import {
  getApplicationMode,
  getImplementationStatus,
  scaleCoversSelectedSignalExactly,
  type RefinedScaleMatch,
} from "./advancedFilterLogic";
import type { RedundancyDecision } from "./filterPodiumComplementarity";
import { scaleAgeFit, scaleAgeFitLabel, type AgeSelection, type ScaleAgeFit } from "./scaleAgeFit";
import type { DetailedPodiumSelection, PodiumSelection } from "./filterPodium";
import { PODIUM_QUESTION_CAP, estimatedQuestionCount, getPodiumQuestionCountInfo, type PodiumQuestionCountSource } from "./filterPodium";

export type MedalRole = "principal" | "complementar" | "terceira_perspectiva" | "teste_direto" | "escola";
export type PodiumMedalKey = keyof PodiumSelection;

const ROLE_LABEL: Record<MedalRole, string> = {
  principal: "Escala principal",
  complementar: "Complementar",
  terceira_perspectiva: "Terceira perspectiva",
  teste_direto: "Teste direto (categoria separada)",
  escola: "Escola (categoria separada)",
};

const RESPONDENT_LABEL: Record<string, string> = {
  pais: "Pais/cuidadores",
  professor: "Escola (professor)",
  clinico: "Clínico",
  autoaplicavel: "Autorrelato (criança/adolescente)",
  teste_direto_crianca: "Tarefa direta com a criança",
};

const MODE_LABEL: Record<string, string> = {
  questionario_pais: "questionário de pais",
  questionario_professor: "questionário de professor",
  autoquestionario_crianca_adolescente: "autorrelato",
  teste_direto_crianca: "teste direto",
  observacional_clinico: "observação clínica",
  registro_clinico: "registro clínico",
};

export interface MedalAudit {
  slot: PodiumMedalKey;
  id: string;
  name: string;
  role: MedalRole;
  roleLabel: string;
  /** O que esta medalha acrescenta em relação às outras do trio (ou "ganho limitado"). */
  addsLabel: string;
  respondentLabel: string;
  timeLabel: string;
  questions: number;
  questionCountSource: PodiumQuestionCountSource;
  ageFit: ScaleAgeFit;
  ageFitLabel: string;
  /** true quando a escala abre e pode ser aplicada no app. */
  opensInApp: boolean;
  coversComplaints: string[];
  coversSignals: string[];
}

export interface PodiumGap {
  kind: "queixa" | "sinal" | "faixa" | "redundancia" | "vaga" | "teto";
  message: string;
  alternativeId?: string; // opção segura fora do trio, sujeita a recomposição clínica
}

export interface PodiumAudit {
  medals: MedalAudit[];
  totalQuestions: number;
  questionCap: number;
  withinCap: boolean;
  gaps: PodiumGap[];
}

export interface PodiumAuditInput {
  podium: DetailedPodiumSelection;
  /** Todas as candidatas seguras do motor (para diagnosticar a lacuna). */
  candidates: RefinedScaleMatch[];
  selectedQueixas: string[];
  selectedSignals: string[];
  selection: AgeSelection;
  /** Rótulo legível de queixas e sinais, para as mensagens. */
  queixaLabel?: (id: string) => string;
  signalLabel?: (id: string) => string;
}

const TRIO: Array<Extract<PodiumMedalKey, "ouro" | "prata" | "bronze">> = ["ouro", "prata", "bronze"];

function respondentText(match: RefinedScaleMatch): string {
  const labels = match.scale.respondente.map((r) => RESPONDENT_LABEL[r] ?? r);
  return labels.length ? labels.join(" · ") : "Não informado";
}

function modeOf(match: RefinedScaleMatch): string {
  return MODE_LABEL[getApplicationMode(match.scale)] ?? getApplicationMode(match.scale);
}

/** A principal não "acrescenta": responde primeiro à pergunta clínica central. */
function primaryLabel(match: RefinedScaleMatch, selectedQueixas: string[], queixaLabel: (id: string) => string): string {
  const covered = selectedQueixas.filter((q) => match.scale.queixas.includes(q)).map(queixaLabel);
  return covered.length
    ? `Responde primeiro à pergunta clínica principal: ${covered.join(", ")}`
    : "Responde primeiro à pergunta clínica principal";
}

/** Diferenças concretas de uma medalha em relação às demais do trio. */
function addsOver(
  match: RefinedScaleMatch,
  others: RefinedScaleMatch[],
  selectedQueixas: string[],
  selectedSignals: string[],
  queixaLabel: (id: string) => string,
  signalLabel: (id: string) => string,
): string {
  if (others.length === 0) return "Escala de referência do perfil";
  const parts: string[] = [];
  const mode = getApplicationMode(match.scale);
  if (others.every((o) => getApplicationMode(o.scale) !== mode)) {
    parts.push(`outra modalidade: ${modeOf(match)}`);
  }
  const informants = new Set(match.scale.respondente);
  const sharesInformant = others.every((o) => o.scale.respondente.some((r) => informants.has(r)));
  if (!sharesInformant) parts.push(`outro informante: ${respondentText(match)}`);
  const otherDomains = new Set(others.map((o) => o.scale.primaryDomain).filter(Boolean));
  if (match.scale.primaryDomain && !otherDomains.has(match.scale.primaryDomain)) {
    parts.push(`outro domínio: ${match.scale.primaryDomain}`);
  }
  const uncoveredByOthers = selectedQueixas.filter(
    (q) => match.scale.queixas.includes(q) && others.every((o) => !o.scale.queixas.includes(q)),
  );
  for (const q of uncoveredByOthers) parts.push(`cobre a queixa ${queixaLabel(q)}`);
  const signalsByOthers = (sig: string) =>
    others.some((o) => scaleCoversSelectedSignalExactly(o.scale, { queixas: selectedQueixas, selectedSignals: [sig] }));
  for (const sig of selectedSignals) {
    if (scaleCoversSelectedSignalExactly(match.scale, { queixas: selectedQueixas, selectedSignals: [sig] }) && !signalsByOthers(sig)) {
      parts.push(`cobre o sinal ${signalLabel(sig)}`);
    }
  }
  return parts.length ? parts.join(" · ") : "Mesmo método e informante das demais: ganho complementar limitado";
}

export function auditPodium(input: PodiumAuditInput): PodiumAudit {
  const { podium, candidates, selectedQueixas, selectedSignals, selection } = input;
  const queixaLabel = input.queixaLabel ?? ((id: string) => id);
  const signalLabel = input.signalLabel ?? ((id: string) => id);
  const trioMatches = TRIO.map((slot) => podium.podium[slot]).filter((m): m is RefinedScaleMatch => Boolean(m));
  const gaps: PodiumGap[] = [];

  const medal = (slot: PodiumMedalKey, match: RefinedScaleMatch, role: MedalRole, others: RefinedScaleMatch[]): MedalAudit => {
    const fit = scaleAgeFit(match.scale, selection);
    return {
      slot,
      id: match.scale.id,
      name: match.scale.name,
      role,
      roleLabel: ROLE_LABEL[role],
      addsLabel: role === "teste_direto" || role === "escola"
        ? "Categoria separada: fora do teto de 100 perguntas do trio"
        : role === "principal"
          ? primaryLabel(match, selectedQueixas, queixaLabel)
          : addsOver(match, others, selectedQueixas, selectedSignals, queixaLabel, signalLabel),
      respondentLabel: respondentText(match),
      timeLabel: match.scale.tempo || "Tempo não informado",
      questions: estimatedQuestionCount(match.scale),
      questionCountSource: getPodiumQuestionCountInfo(match.scale).source,
      ageFit: fit,
      ageFitLabel: scaleAgeFitLabel(fit),
      opensInApp: getImplementationStatus(match.scale) === "complete",
      coversComplaints: selectedQueixas.filter((q) => match.scale.queixas.includes(q)),
      coversSignals: selectedSignals.filter((sig) =>
        scaleCoversSelectedSignalExactly(match.scale, { queixas: selectedQueixas, selectedSignals: [sig] })),
    };
  };

  const roles: Record<(typeof TRIO)[number], MedalRole> = { ouro: "principal", prata: "complementar", bronze: "terceira_perspectiva" };
  const medals: MedalAudit[] = [];
  for (const slot of TRIO) {
    const match = podium.podium[slot];
    if (!match) continue;
    const others = trioMatches.filter((m) => m !== match);
    medals.push(medal(slot, match, roles[slot], others));
  }
  for (const [slot, role] of [["direct", "teste_direto"], ["school", "escola"]] as const) {
    const match = podium.podium[slot];
    if (match) medals.push(medal(slot, match, role, []));
  }

  const trioQuestions = TRIO.reduce((sum, slot) => {
    const match = podium.podium[slot];
    return sum + (match ? estimatedQuestionCount(match.scale) : 0);
  }, 0);

  // No total de 100, texto com itens declarados e o fallback de 20 não provam
  // uma carga verificada. Tornar explícito, sem inventar contagens.
  const provisional = medals.filter(
    (m) => TRIO.includes(m.slot as (typeof TRIO)[number]) &&
      (m.questionCountSource === "estimated" || m.questionCountSource === "declared"),
  );
  if (provisional.length > 0) {
    gaps.push({
      kind: "teto",
      message: "Carga de itens sem conferência automática em " +
        provisional.map((m) => m.name).join(", ") +
        ". Confira o número real de itens antes da aplicação: o teto de 100 perguntas é provisório para essas escalas.",
    });
  }

  // Lacunas: queixas sem instrumento no trio (com diagnóstico do motivo).
  const trioCovers = (q: string) => trioMatches.some((m) => m.scale.queixas.includes(q));
  for (const q of selectedQueixas) {
    if (trioCovers(q)) continue;
    const anySafe = candidates.some((m) => m.scale.queixas.includes(q));
    gaps.push({
      kind: "queixa",
      message: anySafe
        ? `Queixa ${queixaLabel(q)} sem instrumento no trio: há opções seguras, mas fora das vagas de maior prioridade.`
        : `Queixa ${queixaLabel(q)} sem instrumento seguro para este perfil. Avalie por outro caminho.`,
    });
  }

  // Lacunas: sinais marcados sem cobertura no trio. O resgate por sinal preserva Ouro e
  // Prata; o motivo de orçamento compara com o teto que sobra ao lado delas.
  const topTwoBurden = ["ouro", "prata"].reduce((sum, slot) => {
    const match = podium.podium[slot as "ouro" | "prata"];
    return match ? sum + estimatedQuestionCount(match.scale) : sum;
  }, 0);
  for (const sig of selectedSignals) {
    const covered = trioMatches.some((m) =>
      scaleCoversSelectedSignalExactly(m.scale, { queixas: selectedQueixas, selectedSignals: [sig] }));
    if (covered) continue;
    const covering = candidates.filter((m) =>
      scaleCoversSelectedSignalExactly(m.scale, { queixas: selectedQueixas, selectedSignals: [sig] }) &&
      getImplementationStatus(m.scale) === "complete" &&
      fitsWithSelection(m, selection));
    if (covering.length === 0) {
      gaps.push({ kind: "sinal", message: `Sinal ${signalLabel(sig)} sem instrumento aplicável seguro para este perfil.` });
      continue;
    }
    const alternative = covering.reduce((best, candidate) =>
      estimatedQuestionCount(candidate.scale) < estimatedQuestionCount(best.scale) ? candidate : best);
    const cheapest = estimatedQuestionCount(alternative.scale);
    const budget = PODIUM_QUESTION_CAP - topTwoBurden;
    const alternativeLabel = alternative.scale.name + " (" + cheapest + " itens)";
    gaps.push({
      kind: "sinal",
      alternativeId: alternative.scale.id,
      message: cheapest > budget
        ? "Sinal " + signalLabel(sig) + " não coberto: " + alternativeLabel +
          " não cabe no teto de 100 perguntas ao lado do Ouro e da Prata. Uma recomposição do trio exige escolha clínica; o limite não é ampliado."
        : "Sinal " + signalLabel(sig) +
          " não coberto no trio por prioridade clínica. Alternativa segura para reavaliar: " + alternativeLabel + ".",
    });
  }

  // Redundância resolvida pelo motor: transparente para a pessoa que avalia.
  for (const decision of podium.redundancy as RedundancyDecision[]) {
    if (decision.action === "kept_justified") {
      const parts = [
        ...decision.uniqueComplaints.map((q) => `queixa ${queixaLabel(q)}`),
        ...decision.uniqueSignals.map((s) => `sinal ${signalLabel(s)}`),
      ];
      gaps.push({
        kind: "redundancia",
        message: `Mesmo grupo de redundância mantido com justificativa: a segunda escala cobre ${parts.join(" e ")} que a outra não cobre.`,
      });
    } else if (decision.action === "dropped") {
      gaps.push({
        kind: "redundancia",
        message: "Uma escala do mesmo grupo de redundância foi removida do trio: uma forma basta. Confirme a idade exata para escolher a forma adequada.",
      });
    }
  }

  // Faixa: medalha com cobertura apenas parcial exige confirmação da idade exata.
  if (selection.ageBand) {
    for (const m of medals) {
      if (m.ageFit === "partial") {
        gaps.push({ kind: "faixa", message: `${m.name} cobre parte da faixa selecionada: confirme a idade exata antes de aplicar.` });
      }
    }
  }

  // Vagas vazias: o trio pode ter 1 ou 2 medalhas quando não há opção segura e útil.
  const filled = TRIO.filter((slot) => podium.podium[slot]).length;
  if (filled < 3 && candidates.length > 0) {
    gaps.push({
      kind: "vaga",
      message: `Trio com ${filled} de 3 escalas: não há opção complementar segura e útil para as vagas restantes neste perfil.`,
    });
  }

  return {
    medals,
    totalQuestions: trioQuestions,
    questionCap: PODIUM_QUESTION_CAP,
    withinCap: trioQuestions <= PODIUM_QUESTION_CAP,
    gaps,
  };
}

function fitsWithSelection(match: RefinedScaleMatch, selection: AgeSelection): boolean {
  const fit = scaleAgeFit(match.scale, selection);
  return fit === "exact" || fit === "full" || fit === "unknown";
}
