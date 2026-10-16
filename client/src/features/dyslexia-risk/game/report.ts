import type { DocLine, DocSpec } from "@/lib/documentPdf";
import type { IssuerLines } from "@/features/super-neuropad/pdf";
import { DESCRIPTIVE_NOTICE } from "@/lib/descriptiveNotice";
import { formatClinicalDateTime } from "@/lib/clinicalDate";
import { GAME_VERSION, WORLDS, cleanObservacoes, estimateSessionSeconds, summarizeGame, type GameState, type GameSummary, type ItemResponse, type Tally } from "./engine";
import { BANK_PROVENANCE, fluencyFormOf, type ArithOp } from "./bank";

export const GAME_TITLE = "Jogo das Letras e Números · 5–18 anos";
/** Nota descritiva sobre faixa etária larga: informa a amplitude da faixa e a idade registrada. */
export function bandSpanNote(s: { band: { label: string; minAge: number; maxAge: number } | null; idade: number | null }): string | null {
  if (!s.band) return null;
  const span = s.band.maxAge - s.band.minAge + 1;
  return span >= 4 ? `Faixa de ${span} anos (${s.band.label}); idade registrada: ${s.idade ?? "—"} anos.` : null;
}

export const GAME_DISCLAIMER = DESCRIPTIVE_NOTICE;

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
    text: `${outcomeLabel(r)} — ${r.prompt}${given} · resposta prevista: "${r.expected}" · dificuldade do item ${r.level} (1–3)${r.ms > 0 ? ` · ${decimalBr(Math.round(r.ms / 100) / 10)} s` : ""}`,
    tone: r.outcome === "correto" ? "correct" : r.outcome === "erro" ? "wrong" : "neutral",
    bold: r.outcome === "erro",
  };
}

export const decimalBr = (n: number | null) => (n == null ? "—" : String(n).replace(".", ","));

export function fluencyText(s: GameSummary): string {
  const flu = s.leitura.fluencia;
  if (!flu) return "não aplicada";
  const unidade = s.band?.fluencia.kind === "silabas" ? "sílabas" : "palavras";
  const form = fluencyFormOf(s.band, flu.probeId);
  const forma = form ? `forma ${form}${form === "B" ? " (reteste)" : ""} · ` : "";
  const notas = s.leitura.fluenciaNotas;
  return `${forma}${flu.lidas} ${unidade} lidas · ${flu.erros} erros · ${flu.segundos} s · ${flu.wcpm ?? "—"} ${unidade} corretas por minuto${notas.length ? ` · ${notas.join(" ")}` : ""}`;
}

export function domainLines(s: GameSummary): string[] {
  const d = s.ditado;
  const dec = s.leitura.decodificacao;
  const comp = s.leitura.compreensao;
  const ops = Object.entries(s.aritmetica.porOperacao).map(([op, t]) => `${OP_LABEL[op as ArithOp]} ${tallyText(t as Tally)}`).join(" · ");
  return [
    `Ditado (${statusText(d.status, d.total)}): ${tallyText(d)} · erros ortográficos ${d.ortograficos} · erros fonológicos ${d.fonologicos} · sem resposta ${d.naoRespondidos} · pseudopalavras ${tallyText(d.pseudo)}`,
    `Leitura de palavras (${statusText(dec.status, dec.total)}): ${tallyText(dec)} · reais ${tallyText(dec.palavras)} · pseudopalavras ${tallyText(dec.pseudo)} · tempo médio ${decimalBr(dec.mediaSegundos)} s/item`,
    `Fluência (60 s): ${fluencyText(s)}`,
    `Compreensão (${statusText(comp.status, comp.total)}): ${tallyText(comp)} · literal ${tallyText(comp.literal)} · inferencial ${tallyText(comp.inferencial)}`,
    `Aritmética (${statusText(s.aritmetica.status, s.aritmetica.total)}): ${tallyText(s.aritmetica)} · ${ops || "sem itens"}`,
  ];
}

/** Linhas de tempo medido (tempos de resposta registrados pelo app). */
export function timingLines(s: GameSummary, state: GameState): string[] {
  const nomes = Object.fromEntries(WORLDS.map((w) => [w.id, w.nome]));
  const porMundo = s.tempos.porMundo.filter((m) => m.itens > 0).map((m) => `${nomes[m.world]} ${decimalBr(m.segundos)} s em ${m.itens} item(ns)`).join(" · ");
  const item = s.tempos.item ? `mínimo ${decimalBr(s.tempos.item.min)} s · mediana ${decimalBr(s.tempos.item.mediana)} s · máximo ${decimalBr(s.tempos.item.max)} s` : "sem tempos registrados";
  return [
    `Início da sessão: ${state.startedAt ? formatClinicalDateTime(new Date(state.startedAt)) : "—"} · tempo ativo ${decimalBr(s.minutos)} min · estimativa do app ${s.band ? decimalBr(Math.round(estimateSessionSeconds(s.band.band, state.forma ?? "A") / 6) / 10) : "—"} min`,
    `Tempo de resposta por mundo: ${porMundo || "sem registros"}`,
    `Tempo de resposta por item: ${item}`,
  ];
}

export function observationLines(state: GameState): string[] {
  const text = cleanObservacoes(state.observacoes ?? "");
  return [`Observações do aplicador (reação da criança, mediação, condições): ${text || "sem observações registradas"}`];
}

export function buildGameRecord(state: GameState, appliedAt: string): string {
  const s = summarizeGame(state);
  const responses = WORLDS.flatMap((w) => state.worlds[w.id].responses);
  return [
    `${GAME_TITLE} · registro`,
    `Criança: ${state.nome || "não informado"} · Idade: ${state.idade ?? "—"} anos · Faixa: ${s.band?.label ?? "—"}`,
    `Forma dos textos de compreensão: ${state.forma ?? "A"}`,
    ...(bandSpanNote({ band: s.band, idade: state.idade }) ? [bandSpanNote({ band: s.band, idade: state.idade }) as string] : []),
    `Aplicador: ${state.examinador || "não informado"} · Emissão: ${appliedAt} · Tempo ativo: ${decimalBr(s.minutos)} min · ${state.endedReason === "tempo" ? "encerrada pelo limite de 15 min" : state.endedReason ? "sessão encerrada" : "sessão em andamento"}`,
    "",
    ...domainLines(s),
    ...timingLines(s, state),
    ...observationLines(state),
    "",
    ...(s.condicoes.length ? ["Condições da aplicação:", ...s.condicoes.map((x) => `- ${x}`), ""] : []),
    "Itens:",
    ...responses.map((r) => `- [${WORLDS.find((w) => w.id === r.world)?.nome}] ${itemLine(r).text}`),
    "",
    GAME_DISCLAIMER,
    BANK_PROVENANCE,
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
    { heading: "Contagem bruta por domínio", body: domainLines(s).join("\n") },
    { heading: "Tempos medidos", body: timingLines(s, state).join("\n") },
    { heading: "Observações do aplicador", body: observationLines(state).join("\n") },
    ...(s.condicoes.length ? [{ heading: "Condições da aplicação", body: s.condicoes.join("\n") }] : []),
    ...WORLDS.filter((w) => w.id !== "fluencia").map((w) => {
      const lines = state.worlds[w.id].responses.map(itemLine);
      return {
        heading: `${w.nome} · item a item`,
        body: lines.length ? lines.map((l) => l.text).join("\n") : "Não aplicado.",
        rich: lines.length ? lines : undefined,
      };
    }),
    { heading: "Natureza do registro", body: [GAME_DISCLAIMER, BANK_PROVENANCE, bandSpanNote({ band: s.band, idade: state.idade }) ?? ""].filter(Boolean).join("\n") },
  ];
  return {
    title: `${GAME_TITLE} · registro`,
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
    ...(s.condicoes.length ? [{ question: "Condições da aplicação", answer: s.condicoes.join(" ") }] : []),
    { question: "Tempo ativo (min)", answer: decimalBr(s.minutos) },
    { question: "Tempos de resposta", answer: timingLines(s, state).slice(1).join(" · ") },
    { question: "Observações do aplicador", answer: cleanObservacoes(state.observacoes ?? "") || "Sem observações registradas." },
    { question: "Natureza", answer: DESCRIPTIVE_NOTICE },
  ];
}
