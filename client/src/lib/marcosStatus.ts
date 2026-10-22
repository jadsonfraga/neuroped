/**
 * Estado das respostas do checklist de marcos do desenvolvimento.
 *
 * Regras de verdade clínica (AGENTS.md):
 * - ausência de resposta é um estado próprio, nunca "atingido";
 * - não há pontuação, percentual, limiar nem classificação: apenas contagens;
 * - nada aqui é persistido ou enviado; o estado vive só na tela.
 */

export type MarcoAnswer = "sim" | "ainda-nao" | "nao-sei";

export type MarcosAnswers = Record<string, MarcoAnswer>;

export interface MarcosSummary {
  total: number;
  sim: number;
  aindaNao: number;
  naoSei: number;
  semResposta: number;
}

const MARCO_ANSWERS: readonly MarcoAnswer[] = ["sim", "ainda-nao", "nao-sei"];

export function isMarcoAnswer(value: unknown): value is MarcoAnswer {
  return typeof value === "string" && (MARCO_ANSWERS as readonly string[]).includes(value);
}

/**
 * Pressionar a opção já escolhida desfaz a resposta; pressionar outra troca.
 */
export function nextMarcoAnswer(
  current: MarcoAnswer | undefined,
  pressed: MarcoAnswer,
): MarcoAnswer | undefined {
  return current === pressed ? undefined : pressed;
}

export function summarizeMarcos(ids: readonly string[], answers: MarcosAnswers): MarcosSummary {
  const summary: MarcosSummary = { total: ids.length, sim: 0, aindaNao: 0, naoSei: 0, semResposta: 0 };
  for (const id of ids) {
    const answer = answers[id];
    if (answer === "sim") summary.sim += 1;
    else if (answer === "ainda-nao") summary.aindaNao += 1;
    else if (answer === "nao-sei") summary.naoSei += 1;
    else summary.semResposta += 1;
  }
  return summary;
}
