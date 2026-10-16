import { DESCRIPTIVE_NOTICE } from "@/lib/descriptiveNotice";
import { CF, DITADO, DITADO_PSEUDO, ICED_VERSION, PSEUDO, WORDS, describeIced, type IcedInput, type IcedRecord } from "./model";
import type { DocLine, DocSpec } from "@/lib/documentPdf";
import type { IssuerLines } from "@/features/super-neuropad/pdf";

/**
 * Estado persistido da página (espelha o `blank()` de dyslexia-risk.tsx).
 * Manter aqui permite derivar os relatórios sem acoplar o model à UI.
 */
export interface IcedState {
  nome: string;
  data: string;
  nasc: string;
  idade: string;
  ano: "" | "2" | "3" | "outro";
  escola: string;
  anosEsc: string;
  examinador: string;
  controle: Record<string, string>;
  palavras: { ok: boolean; err: boolean; prod: string }[];
  pseudo: { ok: boolean; err: boolean; lex: boolean; prod: string }[];
  flu: { tempo: number; lidas: number; erros: number };
  ditado: { grafia: string; f: boolean; o: boolean }[];
  ditadoP: { grafia: string; ok: boolean }[];
  cf: { ok: boolean; err: boolean }[];
  ran: { seg: number; erros: number };
  fam: { pai: string; mae: string; irmao: string; nome: string };
  pers: { a: string; b: string; c: string; d: string; nota: string };
  fenomeno: string;
  done: Record<string, boolean>;
}

export const ICED_DISCLAIMER = DESCRIPTIVE_NOTICE;
export const ICED_FAMILY_DISCLAIMER = `Este resumo descreve como a aplicação foi feita e como a criança respondeu. ${DESCRIPTIVE_NOTICE} A conversa sobre o registro é com o médico(a) na consulta.`;

const TRI_LABEL: Record<string, string> = { sim: "sim", nao: "não", nv: "não verificado", "": "não informado" };

function pcpmOf(lidas: number, erros: number, tempo: number) {
  if (!tempo) return null;
  if (tempo >= 60) return Math.max(0, lidas - erros);
  return Math.round(((136 - erros) * 60) / tempo);
}

/** Constrói o IcedInput a partir do estado persistido, com os mesmos gates da página. */
export function icedInputOf(s: IcedState): IcedInput {
  const famSim = [s.fam.pai, s.fam.mae, s.fam.irmao].includes("sim");
  const famNao = [s.fam.pai, s.fam.mae, s.fam.irmao].includes("nao");
  const four = s.pers.a === "sim" && s.pers.b === "sim" && s.pers.c === "sim" && s.pers.d === "sim";
  const persSeen = [s.pers.a, s.pers.b, s.pers.c, s.pers.d].some(Boolean);
  return {
    ano: s.ano,
    controle: s.controle as IcedInput["controle"],
    palavrasAcertos: s.done.palavras ? s.palavras.filter((x) => x.ok).length : null,
    palavrasF: s.done.palavras ? s.palavras.filter((x) => x.err).length : null,
    pseudoAcertos: s.done.pseudo ? s.pseudo.filter((x) => x.ok).length : null,
    pseudoLex: s.done.pseudo ? s.pseudo.filter((x) => x.lex).length : null,
    pcpm: s.done.fluencia ? pcpmOf(s.flu.lidas, s.flu.erros, s.flu.tempo) : null,
    fluLidas: s.done.fluencia ? s.flu.lidas : null,
    fluErros: s.done.fluencia ? s.flu.erros : null,
    fluTempo: s.done.fluencia ? s.flu.tempo : null,
    ditadoF: s.done.ditado ? s.ditado.filter((x) => x.f).length : null,
    ditadoPseudoCertas: s.done.ditado ? s.ditadoP.filter((x) => x.ok).length : null,
    ditadoPseudoTotal: s.ditadoP.length,
    cfAcertos: s.done.sons ? s.cf.filter((x) => x.ok).length : null,
    ranSeg: s.done.formas ? s.ran.seg : null,
    ranErros: s.done.formas ? s.ran.erros : null,
    familiar: s.done.familia ? (famSim ? "sim" : famNao ? "nao" : "nv") : "",
    persistencia4: s.done.ponte && persSeen ? four : null,
  };
}

function controlLines(result: IcedRecord): string[] {
  return result.controles.map((c) => `- ${c.rotulo}: ${c.resposta}`);
}

function domainLines(result: IcedRecord): string[] {
  return ["Medidas registradas por domínio:"].concat(result.dominios.map((d) => `- ${d.nome}: ${d.medida}`));
}

/** Registro completo: transcrição literal para prontuário (todas as respostas e produções). */
export function buildIcedFullRecord(s: IcedState, result: IcedRecord, appliedAt: string): string {
  const lines: string[] = [
    `ICED-8 — Dyslexia Risk · registro completo`,
    `Examinador: ${s.examinador || "não informado"} · Emissão: ${appliedAt}`,
    `Criança: ${s.nome || "não informado"} · Nascimento: ${s.nasc || "não informado"} · Idade: ${s.idade || "não informado"}`,
    `Escola: ${s.escola || "não informado"} · Escolarização formal: ${s.anosEsc || "não informado"} anos · Ano: ${TRI_LABEL[s.ano] ?? s.ano}`,
    "",
    "Bloco 0 (condições de aplicação, como respondidas):",
    ...controlLines(result),
    "",
    "Vila das Palavras (20):",
    ...WORDS.map(([alvo], i) => `- ${alvo}: ${s.done.palavras ? (s.palavras[i].ok ? "certo" : s.palavras[i].err ? "erro fonológico" : "sem registro") : "fase não aplicada"}${s.palavras[i].prod ? ` · produção: ${s.palavras[i].prod}` : ""}`),
    "",
    "Floresta Inventada — pseudopalavras (16):",
    ...PSEUDO.map((alvo, i) => `- ${alvo}: ${s.done.pseudo ? (s.pseudo[i].ok ? "certo" : s.pseudo[i].err ? `erro${s.pseudo[i].lex ? " com lexicalização" : ""}` : "sem registro") : "fase não aplicada"}`),
    "",
    `Corrida do Parque — fluência: ${s.done.fluencia ? `${s.flu.lidas} lidas · ${s.flu.erros} erros · ${s.flu.tempo} s · palavras corretas por minuto ${pcpmOf(s.flu.lidas, s.flu.erros, s.flu.tempo) ?? "—"}` : "fase não aplicada"}`,
    "",
    `Caverna do Ditado (12 + ${s.ditadoP.length}):`,
    ...DITADO.map(([alvo, frase], i) => `- ${alvo}: grafia "${s.ditado[i].grafia || "—"}" · ${s.ditado[i].f ? "erro fonológico" : s.ditado[i].o ? "erro de regra" : "sem marcação"} · frase: ${frase}`),
    ...DITADO_PSEUDO.slice(0, s.ditadoP.length).map((alvo, i) => `- ${alvo}: grafia "${s.ditadoP[i].grafia || "—"}" · ${s.ditadoP[i].ok ? "certa" : "errada"}`),
    "",
    "Templo dos Sons — CF (12):",
    ...CF.map((item, i) => `- ${item.cmd} → resposta prevista ${item.esp}: ${s.done.sons ? (s.cf[i].ok ? "certo" : s.cf[i].err ? "erro" : "sem registro") : "fase não aplicada"}`),
    "",
    `Arena das Formas — nomeação rápida (40): ${s.done.formas ? `${s.ran.seg} s · ${s.ran.erros} erros` : "fase não aplicada"}`,
    "",
    `Árvore — familiar de 1º grau: ${s.done.familia ? `pai ${TRI_LABEL[s.fam.pai]} · mãe ${TRI_LABEL[s.fam.mae]} · irmão ${TRI_LABEL[s.fam.irmao]}` : "fase não aplicada"}`,
    "",
    `Ponte — persistência: ${s.done.ponte ? `a=${TRI_LABEL[s.pers.a]} · b=${TRI_LABEL[s.pers.b]} · c=${TRI_LABEL[s.pers.c]} · d=${TRI_LABEL[s.pers.d]}${s.pers.nota ? ` · nota: ${s.pers.nota}` : ""}` : "fase não aplicada"}`,
    "",
    s.fenomeno ? `Fenômeno observado: ${s.fenomeno}` : "Fenômeno observado: nenhum registro.",
    "",
    ...domainLines(result),
    "",
    result.frase,
    "",
    ICED_DISCLAIMER,
  ];
  return lines.join("\n");
}

/** Resumo curto para o prontuário / WhatsApp quando o registro completo não é necessário. */
export function buildIcedSummary(s: IcedState, result: IcedRecord, appliedAt: string): string {
  return [
    `ICED-8 — Dyslexia Risk · resumo`,
    `Criança: ${s.nome || "não informado"} · ${appliedAt}`,
    ...domainLines(result),
    result.controlesSemResposta.length ? `Bloco 0 sem resposta "sim"/"não": ${result.controlesSemResposta.join("; ")}.` : "Bloco 0 respondido.",
    "",
    ICED_DISCLAIMER,
  ].join("\n");
}

/** Resumo para a família: só o que foi aplicado e registrado, ≤ 1800 chars codificados (wa.me). */
export function buildIcedFamilySummary(s: IcedState, result: IcedRecord, appliedAt: string): string {
  const aplicados = result.dominios.filter((d) => d.examinado).map((d) => d.nome);
  const lines = [
    `ICED-8 — resumo para a família`,
    `Criança: ${s.nome || "não informado"} · ${appliedAt}`,
    "",
    aplicados.length > 0 ? `Atividades aplicadas: ${aplicados.join(", ")}.` : "Nenhuma atividade foi registrada.",
    result.naoExaminados.length > 0 ? `Não aplicado: ${result.naoExaminados.join(", ")}.` : "",
    "",
    ICED_FAMILY_DISCLAIMER,
    `Versão: ${ICED_VERSION}`,
  ];
  return lines.filter(Boolean).join("\n");
}

/** PDF clínico completo (DocSpec) — mesma tubulação de buildDocumentPdf das demais páginas. */
export function buildIcedDocSpec(s: IcedState, result: IcedRecord, issuer: IssuerLines, appliedAt: string): DocSpec {
  const domainsRich: DocLine[] = result.dominios.map((d) => ({ text: `${d.nome}: ${d.medida}`, tone: "neutral" }));
  const identificacao = [
    `Criança: ${s.nome || "não informado"} · Nascimento: ${s.nasc || "não informado"} · Idade: ${s.idade || "não informado"}`,
    `Escola: ${s.escola || "não informado"} · Escolarização formal: ${s.anosEsc || "não informado"} anos · Ano: ${s.ano || "não informado"}`,
    `Examinador: ${s.examinador || "não informado"} · Data: ${s.data || appliedAt}`,
    "Bloco 0 (condições de aplicação, como respondidas):",
    ...controlLines(result),
  ].join("\n");
  return {
    title: "ICED-8 — Dyslexia Risk · registro clínico",
    subtitle: `Registro descritivo · ${appliedAt}`,
    credentials: [issuer.doctorName, issuer.specialty, issuer.credentials, issuer.clinicName].filter(Boolean),
    sections: [
      { heading: "Identificação e condições de aplicação", body: identificacao },
      { heading: "Medidas registradas por domínio", body: domainsRich.map((line) => line.text).join("\n"), rich: domainsRich },
      { heading: "Produções registradas", body: buildIcedFullRecord(s, result, appliedAt).split("\n").slice(0, 200).join("\n") },
      { heading: "Fenômeno observado", body: s.fenomeno || "Nenhum registro." },
      { heading: "Natureza do registro", body: [ICED_DISCLAIMER, "Fora do registro: compreensão isolada, TDAH, TDL, TEA, ansiedade, inteligência, matemática, motivação."].join("\n") },
    ],
    footer: `${ICED_DISCLAIMER} Documento gerado pelo NeuroPed (${ICED_VERSION}). Uso clínico interno; LGPD: dados pessoais somente com base legal.`,
    motto: issuer.motto,
  };
}

/** Exporta o registro como itens de escala para o SaveToPatient (contrato ScaleResponseItem). */
export function icedResponseItems(s: IcedState, result: IcedRecord): { question: string; answer: string }[] {
  const items: { question: string; answer: string }[] = [
    { question: "Criança", answer: s.nome || "Não respondida" },
    { question: "Nascimento", answer: s.nasc || "Não respondida" },
    { question: "Ano escolar", answer: s.ano || "Não respondida" },
    { question: "Examinador", answer: s.examinador || "Não respondida" },
    ...result.controles.map((c) => ({ question: `Bloco 0 — ${c.rotulo}`, answer: c.resposta })),
    ...result.dominios.map((d) => ({ question: d.nome, answer: d.medida })),
    { question: "Natureza do registro", answer: DESCRIPTIVE_NOTICE },
  ];
  if (s.fenomeno) items.push({ question: "Fenômeno observado", answer: s.fenomeno });
  return items;
}

export { describeIced };
