import type { DocLine, DocSpec } from "@/lib/documentPdf";
import type { IssuerLines } from "@/features/super-neuropad/pdf";
import { GAME_VERSION, LEVEL_LABEL, WORLDS, summarizeGame, type GameState, type GameSummary, type ItemResponse, type Tally } from "./engine";
import type { ArithOp } from "./bank";

export const GAME_TITLE = "Jogo das Letras e Números · 5–18 anos";
export const GAME_DISCLAIMER =
  "Triagem lúdica interna. NÃO DIAGNÓSTICA. Sem validação normativa brasileira: níveis 1–3 são graduações internas por faixa etária, não percentis nem normas. Inspirado no formato de modelos internacionais (DIBELS/CBM, GraphoGame, Duolingo, Khan Academy Kids, Prodigy) sem usar seus itens. O diagnóstico permanece com o médico.";

export const OP_LABEL: Record<ArithOp, string> = {
  contagem: "contagem", comparacao: "comparação", sequencia: "sequência numérica", adicao: "adição", subtracao: "subtração",
  multiplicacao: "multiplicação", divisao: "divisão", fracao: "frações", decimal: "decimais", porcentagem: "porcentagem",
  inteiros: "números inteiros", potencia: "potência e raiz", equacao: "equações", problema: "problema", geometria: "geometria",
};

const STATUS_LABEL = { pendente: "não aplicado", concluido: "concluído", pulado: "pulado (não aplicado)" } as const;
function statusText(status: keyof typeof STATUS_LABEL, answered: number): string {
  return status === "pendente" && answered > 0 ? "incompleto" : STATUS_LABEL[status];
}

export function tallyText(t: Tally): string {
  return t.total ? `${t.corretos}/${t.total}` : "—";
}

export function outcomeLabel(r: ItemResponse): string {
  if (r.outcome === "correto") return "Acertou";
  if (r.outcome === "nao_respondeu") return "Não respondeu";
  if (r.errorType === "ortografico") return "Errou · ortográfico";
  if (r.errorType === "fonologico") return "Errou · fonológico";
  return "Errou";
}

function itemLine(r: ItemResponse): DocLine {
  const given = r.world === "decodificacao" ? "" : ` · resposta: "${r.given || "—"}"`;
  return {
    text: `${outcomeLabel(r)} — ${r.prompt}${given} · esperado: "${r.expected}" · nível ${r.level}`,
    tone: r.outcome === "correto" ? "correct" : r.outcome === "erro" ? "wrong" : "neutral",
    bold: r.outcome === "erro",
  };
}

export const decimalBr = (n: number | null) => (n == null ? "—" : String(n).replace(".", ","));

export function fluencyText(s: GameSummary): string {
  const flu = s.leitura.fluencia;
  if (!flu) return "não aplicada";
  const unidade = s.band?.fluencia.kind === "silabas" ? "sílabas" : "palavras";
  const curta = flu.segundos < 30 ? " (leitura com menos de 30 s: taxa extrapolada, pouco confiável)" : "";
  return `${flu.lidas} ${unidade} lidas · ${flu.erros} erros · ${flu.segundos} s · ${flu.wcpm ?? "—"} ${unidade} corretas por minuto${curta}`;
}

export function domainLines(s: GameSummary): string[] {
  const d = s.ditado;
  const dec = s.leitura.decodificacao;
  const comp = s.leitura.compreensao;
  const ops = Object.entries(s.aritmetica.porOperacao).map(([op, t]) => `${OP_LABEL[op as ArithOp]} ${tallyText(t as Tally)}`).join(" · ");
  return [
    `Ditado (${statusText(d.status, d.total)}): ${tallyText(d)}${d.pct != null ? ` (${d.pct}%)` : ""} · erros ortográficos ${d.ortograficos} · erros fonológicos ${d.fonologicos} · sem resposta ${d.naoRespondidos} · pseudopalavras ${tallyText(d.pseudo)} · ${LEVEL_LABEL[d.finalLevel]}`,
    `Leitura de palavras (${statusText(dec.status, dec.total)}): ${tallyText(dec)}${dec.pct != null ? ` (${dec.pct}%)` : ""} · reais ${tallyText(dec.palavras)} · pseudopalavras ${tallyText(dec.pseudo)} · tempo médio ${decimalBr(dec.mediaSegundos)} s/item · ${LEVEL_LABEL[dec.finalLevel]}`,
    `Fluência (60 s): ${fluencyText(s)}`,
    `Compreensão (${statusText(comp.status, comp.total)}): ${tallyText(comp)} · literal ${tallyText(comp.literal)} · inferencial ${tallyText(comp.inferencial)}`,
    `Aritmética (${statusText(s.aritmetica.status, s.aritmetica.total)}): ${tallyText(s.aritmetica)}${s.aritmetica.pct != null ? ` (${s.aritmetica.pct}%)` : ""} · ${ops || "sem itens"} · ${LEVEL_LABEL[s.aritmetica.finalLevel]}`,
  ];
}

export function buildGameRecord(state: GameState, appliedAt: string): string {
  const s = summarizeGame(state);
  const responses = WORLDS.flatMap((w) => state.worlds[w.id].responses);
  return [
    `${GAME_TITLE} · registro`,
    `Criança: ${state.nome || "não informado"} · Idade: ${state.idade ?? "—"} anos · Faixa: ${s.band?.label ?? "—"}`,
    `Aplicador: ${state.examinador || "não informado"} · Emissão: ${appliedAt} · Tempo ativo: ${decimalBr(s.minutos)} min · ${state.endedReason === "tempo" ? "encerrada pelo limite de 15 min" : state.endedReason ? "sessão encerrada" : "sessão em andamento"}`,
    "",
    ...domainLines(s),
    "",
    s.sinais.length ? "Sinais para investigar (não diagnóstico):" : "Sinais para investigar: nenhum nesta aplicação.",
    ...s.sinais.map((x) => `- ${x}`),
    "",
    "Itens:",
    ...responses.map((r) => `- [${WORLDS.find((w) => w.id === r.world)?.nome}] ${itemLine(r).text}`),
    "",
    GAME_DISCLAIMER,
  ].join("\n");
}

export function buildGameDocSpec(state: GameState, issuer: IssuerLines, appliedAt: string): DocSpec {
  const s = summarizeGame(state);
  const sections = [
    {
      heading: "Identificação",
      body: [
        `Criança: ${state.nome || "não informado"} · Idade: ${state.idade ?? "—"} anos · Faixa: ${s.band?.label ?? "—"}`,
        `Aplicador: ${state.examinador || "não informado"} · Tempo ativo: ${decimalBr(s.minutos)} min (teto 15 min) · XP ${state.xp} · maior sequência ${state.bestStreak}`,
      ].join("\n"),
    },
    { heading: "Resultado por domínio", body: domainLines(s).join("\n") },
    {
      heading: "Sinais para investigar (não diagnóstico)",
      body: s.sinais.length ? s.sinais.join("\n") : "Nenhum sinal automático nesta aplicação. Ausência de sinal não é normalidade.",
      rich: s.sinais.length ? s.sinais.map((text) => ({ text, tone: "wrong" as const, bold: true })) : undefined,
    },
    ...WORLDS.filter((w) => w.id !== "fluencia").map((w) => {
      const lines = state.worlds[w.id].responses.map(itemLine);
      return {
        heading: `${w.nome} · item a item (azul = acertou, vermelho = errou)`,
        body: lines.length ? lines.map((l) => l.text).join("\n") : "Não aplicado.",
        rich: lines.length ? lines : undefined,
      };
    }),
    { heading: "Limites da triagem", body: GAME_DISCLAIMER },
  ];
  return {
    title: `${GAME_TITLE} · triagem`,
    subtitle: `${state.nome || "Criança"} · ${s.band?.label ?? "faixa não definida"} · ${appliedAt}`,
    credentials: [issuer.doctorName, issuer.specialty, issuer.credentials, issuer.clinicName].filter(Boolean),
    sections,
    footer: `${GAME_DISCLAIMER} Documento gerado pelo NeuroPed (${GAME_VERSION}). Uso clínico interno; LGPD: dados pessoais somente com base legal.`,
    motto: issuer.motto,
  };
}

/** Contrato ScaleResponseItem do SaveToPatient. */
export function gameResponseItems(state: GameState): { question: string; answer: string }[] {
  const s = summarizeGame(state);
  const lines = domainLines(s);
  return [
    { question: "Criança", answer: state.nome || "Não respondida" },
    { question: "Idade (anos)", answer: state.idade != null ? String(state.idade) : "Não respondida" },
    { question: "Faixa", answer: s.band?.label ?? "Não respondida" },
    { question: "Aplicador", answer: state.examinador || "Não respondida" },
    { question: "Ditado", answer: lines[0] },
    { question: "Leitura de palavras", answer: lines[1] },
    { question: "Fluência", answer: lines[2] },
    { question: "Compreensão", answer: lines[3] },
    { question: "Aritmética", answer: lines[4] },
    { question: "Sinais para investigar", answer: s.sinais.join(" ") || "Nenhum nesta aplicação" },
    { question: "Tempo ativo (min)", answer: decimalBr(s.minutos) },
    { question: "Natureza", answer: "Triagem interna, não diagnóstica, sem validação normativa brasileira" },
  ];
}
