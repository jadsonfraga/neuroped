import { CF, CONTROL, DITADO, DITADO_PSEUDO, ICED_MAX, ICED_VERSION, PSEUDO, WORDS, scoreIced, type DomainScore, type IcedInput, type IcedResult } from "./model";
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
  ran: { seg: number; erros: number; norma: boolean };
  fam: { pai: string; mae: string; irmao: string; nome: string };
  pers: { a: string; b: string; c: string; d: string; nota: string };
  normas: { palavras: boolean; pseudo: boolean; flu: boolean; ditado: boolean; cf: boolean };
  fenomeno: string;
  done: Record<string, boolean>;
}

export const ICED_DISCLAIMER = "ICED-8: instrumento operacional interno, não validado, não diagnostica. Ausência de evidência não é normalidade; norma formal ≤ −1 DP prevalece sobre âncoras.";
export const ICED_FAMILY_DISCLAIMER = "Este resumo é um retrato operacional do dia da aplicação. Não é diagnóstico. A conclusão é do médico(a) na consulta, com o registro completo da equipe.";
export const ICED_OUT_OF_SCORE = "Fora da soma: compreensão isolada, TDAH, TDL, TEA, ansiedade, inteligência, matemática, motivação.";

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
    palavrasNorma: s.normas.palavras,
    pseudoAcertos: s.done.pseudo ? s.pseudo.filter((x) => x.ok).length : null,
    pseudoLex: s.done.pseudo ? s.pseudo.filter((x) => x.lex).length : null,
    pseudoNorma: s.normas.pseudo,
    pcpm: s.done.fluencia ? pcpmOf(s.flu.lidas, s.flu.erros, s.flu.tempo) : null,
    fluenciaNorma: s.normas.flu,
    ditadoF: s.done.ditado ? s.ditado.filter((x) => x.f).length : null,
    ditadoPseudoCertas: s.done.ditado ? s.ditadoP.filter((x) => x.ok).length : null,
    ditadoNorma: s.normas.ditado,
    cfAcertos: s.done.sons ? s.cf.filter((x) => x.ok).length : null,
    cfNorma: s.normas.cf,
    ranSeg: s.done.formas ? s.ran.seg : null,
    ranErros: s.done.formas ? s.ran.erros : null,
    ranNorma: s.ran.norma,
    familiar: s.done.familia ? (famSim ? "sim" : famNao ? "nao" : "nv") : "",
    persistencia4: s.done.ponte && persSeen ? four : null,
  };
}

/** Registro completo: transcrição literal para prontuário (todas as respostas e produções). */
export function buildIcedFullRecord(s: IcedState, result: IcedResult, appliedAt: string): string {
  const lines: string[] = [
    `ICED-8 — Dyslexia Risk · registro completo`,
    `Examinador: ${s.examinador || "não informado"} · Emissão: ${appliedAt}`,
    `Criança: ${s.nome || "não informado"} · Nascimento: ${s.nasc || "não informado"} · Idade: ${s.idade || "não informado"}`,
    `Escola: ${s.escola || "não informado"} · Escolarização formal: ${s.anosEsc || "não informado"} anos · Ano: ${TRI_LABEL[s.ano] ?? s.ano}`,
    `Trava de controle: ${result.trava ? `ativa — ${result.travaMotivo}` : "liberada"}`,
    "",
    "Bloco 0 (controle):",
    ...CONTROL.map(([k, lab]) => `- ${lab}: ${TRI_LABEL[s.controle[k]] ?? s.controle[k]}`),
    "",
    "Vila das Palavras (20):",
    ...WORDS.map(([alvo], i) => `- ${alvo}: ${s.done.palavras ? (s.palavras[i].ok ? "certo" : s.palavras[i].err ? "erro fonológico" : "sem registro") : "fase não aplicada"}${s.palavras[i].prod ? ` · produção: ${s.palavras[i].prod}` : ""}`),
    `Norma ≤ −1 DP prevalece: ${s.normas.palavras ? "sim" : "não"}`,
    "",
    "Floresta Inventada — pseudopalavras (16):",
    ...PSEUDO.map((alvo, i) => `- ${alvo}: ${s.done.pseudo ? (s.pseudo[i].ok ? "certo" : s.pseudo[i].err ? `erro${s.pseudo[i].lex ? " com lexicalização" : ""}` : "sem registro") : "fase não aplicada"}`),
    `Norma ≤ −1 DP prevalece: ${s.normas.pseudo ? "sim" : "não"}`,
    "",
    `Corrida do Parque — fluência: ${s.done.fluencia ? `${s.flu.lidas} lidas · ${s.flu.erros} erros · ${s.flu.tempo} s · PCPM ${pcpmOf(s.flu.lidas, s.flu.erros, s.flu.tempo) ?? "—"}` : "fase não aplicada"}`,
    `Norma formal prevalece: ${s.normas.flu ? "sim" : "não"}`,
    "",
    "Caverna do Ditado (12 + 5):",
    ...DITADO.map(([alvo, frase], i) => `- ${alvo}: grafia "${s.ditado[i].grafia || "—"}" · ${s.ditado[i].f ? "erro fonológico" : s.ditado[i].o ? "erro de regra (não pontua)" : "sem marcação"} · frase: ${frase}`),
    ...DITADO_PSEUDO.map((alvo, i) => `- ${alvo}: grafia "${s.ditadoP[i].grafia || "—"}" · ${s.ditadoP[i].ok ? "certa" : "errada"}`),
    `Norma ≤ −1 DP prevalece: ${s.normas.ditado ? "sim" : "não"}`,
    "",
    "Templo dos Sons — CF (12):",
    ...CF.map((item, i) => `- ${item.cmd} → esperado ${item.esp}: ${s.done.sons ? (s.cf[i].ok ? "certo" : s.cf[i].err ? "erro" : "sem registro") : "fase não aplicada"}`),
    `Norma ≤ −1 DP prevalece: ${s.normas.cf ? "sim" : "não"}`,
    "",
    `Arena das Formas — RAN (40): ${s.done.formas ? `${s.ran.seg} s · ${s.ran.erros} erros` : "fase não aplicada"} · RAN normatizado prevalece: ${s.ran.norma ? "sim" : "não"}`,
    "",
    `Árvore — familiar de 1º grau: ${s.done.familia ? `pai ${TRI_LABEL[s.fam.pai]} · mãe ${TRI_LABEL[s.fam.mae]} · irmão ${TRI_LABEL[s.fam.irmao]}` : "fase não aplicada"}`,
    "",
    `Ponte — persistência: ${s.done.ponte ? `a=${TRI_LABEL[s.pers.a]} · b=${TRI_LABEL[s.pers.b]} · c=${TRI_LABEL[s.pers.c]} · d=${TRI_LABEL[s.pers.d]}${s.pers.nota ? ` · nota: ${s.pers.nota}` : ""}` : "fase não aplicada"}`,
    "",
    s.fenomeno ? `Fenômeno observado: ${s.fenomeno}` : "Fenômeno observado: nenhum registro.",
    "",
    ...domainLines(result),
    "",
    `Escore ICED-8: ${result.total}/${ICED_MAX} · Leitura operacional: ${result.faixa} · Núcleo funcional: ${result.nucleo}.`,
    result.frase,
    "",
    ICED_DISCLAIMER,
    ICED_OUT_OF_SCORE,
  ];
  return lines.join("\n");
}

function domainLines(result: IcedResult): string[] {
  return ["Domínios:"].concat(
    result.dominios.map((d) => `- ${d.nome}: ${d.examinado ? `${d.pontos}/${d.peso}` : "não examinado"} — ${d.detalhe}${d.limítrofe ? " (limítrofe)" : ""}`),
  );
}

/** Resumo curto para o prontuário / WhatsApp quando o registro completo não é necessário. */
export function buildIcedSummary(s: IcedState, result: IcedResult, appliedAt: string): string {
  return [
    `ICED-8 — Dyslexia Risk · resumo`,
    `Criança: ${s.nome || "não informado"} · ${appliedAt}`,
    `Escore: ${result.total}/${ICED_MAX} · ${result.faixa} · núcleo ${result.nucleo}.`,
    result.trava ? `Trava ativa: ${result.travaMotivo}.` : "Trava liberada.",
    ...domainLines(result),
    "",
    ICED_DISCLAIMER,
  ].join("\n");
}

/** Resumo para a família: linguagem acessível, sem jargão normativo, ≤ 1800 chars codificados (wa.me). */
export function buildIcedFamilySummary(s: IcedState, result: IcedResult, appliedAt: string): string {
  const FAIXA_FAMILIA: Record<IcedResult["faixa"], string> = {
    limitada: "poucas áreas sinalizaram atenção nesta aplicação",
    intermediaria: "algumas áreas sinalizaram atenção e merecem acompanhamento",
    elevada: "várias áreas sinalizaram atenção de forma persistente",
    descritiva: "não foi possível interpretar a soma porque o Bloco 0 indicou outra prioridade (escolarização, audição, visão ou desenvolvimento)",
  };
  const dominioNome: Record<DomainScore["id"], string> = {
    fluencia: "leitura fluida",
    ortografia: "escrita",
    pseudo: "ler palavras inventadas",
    palavras: "ler palavras de verdade",
    cf: "brincar com sons",
    ran: "nomear rápido",
    familiar: "história familiar",
    persistencia: "resposta à estimulação",
  };
  const pontos: string[] = [];
  const atencao: string[] = [];
  for (const d of result.dominios) {
    if (!d.examinado) continue;
    if (d.pontos > 0) atencao.push(dominioNome[d.id]);
    else pontos.push(dominioNome[d.id]);
  }
  const lines = [
    `ICED-8 — resumo para a família`,
    `Criança: ${s.nome || "não informado"} · ${appliedAt}`,
    "",
    `Nesta aplicação, ${FAIXA_FAMILIA[result.faixa]}.`,
    atencao.length > 0 ? `Áreas que pedem atenção: ${atencao.join(", ")}.` : "",
    pontos.length > 0 ? `Áreas registradas sem sinalização hoje: ${pontos.join(", ")}.` : "",
    result.naoExaminados.length > 0 ? `Não aplicado: ${result.naoExaminados.join(", ")}.` : "",
    "",
    ICED_FAMILY_DISCLAIMER,
    `Versão: ${ICED_VERSION}`,
  ];
  return lines.filter(Boolean).join("\n");
}

/** PDF clínico completo (DocSpec) — mesma tubulação de buildDocumentPdf das demais páginas. */
export function buildIcedDocSpec(s: IcedState, result: IcedResult, issuer: IssuerLines, appliedAt: string): DocSpec {
  const domainsRich: DocLine[] = result.dominios.map((d) => ({
    text: `${d.nome}: ${d.examinado ? `${d.pontos}/${d.peso}` : "não examinado"} — ${d.detalhe}${d.limítrofe ? " (limítrofe)" : ""}`,
    bold: d.examinado && d.pontos > 0,
    tone: d.examinado && d.pontos > 0 ? "wrong" : "neutral",
  }));
  const bloco0Rich: DocLine[] = CONTROL.map(([k, lab]) => ({
    text: `${lab}: ${TRI_LABEL[s.controle[k]] ?? s.controle[k]}${s.controle[k] === "nao" ? " — trava" : ""}`,
    tone: s.controle[k] === "nao" ? "wrong" : "neutral",
  }));
  return {
    title: "ICED-8 — Dyslexia Risk · registro clínico",
    subtitle: `Escore ${result.total}/${ICED_MAX} · ${result.faixa} · núcleo ${result.nucleo} · ${appliedAt}`,
    credentials: [issuer.doctorName, issuer.specialty, issuer.credentials, issuer.clinicName].filter(Boolean),
    sections: [
      {
        heading: "Identificação e controle",
        body: [
          `Criança: ${s.nome || "não informado"} · Nascimento: ${s.nasc || "não informado"} · Idade: ${s.idade || "não informado"}`,
          `Escola: ${s.escola || "não informado"} · Escolarização formal: ${s.anosEsc || "não informado"} anos · Ano: ${s.ano || "não informado"}`,
          `Examinador: ${s.examinador || "não informado"} · Data: ${s.data || appliedAt}`,
          `Trava de controle: ${result.trava ? `ativa — ${result.travaMotivo}` : "liberada"}`,
        ].join("\n"),
        rich: bloco0Rich.length > 0 ? [
          { text: `Criança: ${s.nome || "não informado"} · Nascimento: ${s.nasc || "não informado"} · Idade: ${s.idade || "não informado"}` },
          { text: `Escola: ${s.escola || "não informado"} · Escolarização formal: ${s.anosEsc || "não informado"} anos · Ano: ${s.ano || "não informado"}` },
          { text: `Examinador: ${s.examinador || "não informado"} · Data: ${s.data || appliedAt}` },
          { text: `Trava de controle: ${result.trava ? `ativa — ${result.travaMotivo}` : "liberada"}`, bold: result.trava, tone: result.trava ? "wrong" : "neutral" },
          { text: "Bloco 0:" },
          ...bloco0Rich,
        ] : undefined,
      },
      {
        heading: "Domínios pontuados",
        body: domainsRich.map((line) => line.text).join("\n"),
        rich: domainsRich,
      },
      {
        heading: "Produções registradas",
        body: buildIcedFullRecord(s, result, appliedAt).split("\n").slice(0, 200).join("\n"),
      },
      {
        heading: "Fenômeno observado",
        body: s.fenomeno || "Nenhum registro.",
      },
      {
        heading: "Leitura operacional",
        body: [result.leitura, `Núcleo funcional (fluência ou ortografia): ${result.nucleo}.`, result.frase].join("\n"),
      },
      {
        heading: "Limites do instrumento",
        body: [ICED_DISCLAIMER, ICED_OUT_OF_SCORE, "Diagnóstico permanece com o médico."].join("\n"),
      },
    ],
    footer: `${ICED_DISCLAIMER} Documento gerado pelo NeuroPed (${ICED_VERSION}). Uso clínico interno; LGPD: dados pessoais somente com base legal.`,
    motto: issuer.motto,
  };
}

/** Exporta o resultado como itens de escala para o SaveToPatient (contrato ScaleResponseItem). */
export function icedResponseItems(s: IcedState, result: IcedResult): { question: string; answer: string }[] {
  const items: { question: string; answer: string }[] = [
    { question: "Criança", answer: s.nome || "Não respondida" },
    { question: "Nascimento", answer: s.nasc || "Não respondida" },
    { question: "Ano escolar", answer: s.ano || "Não respondida" },
    { question: "Examinador", answer: s.examinador || "Não respondida" },
    ...CONTROL.map(([k, lab]) => ({ question: `Bloco 0 — ${lab}`, answer: TRI_LABEL[s.controle[k]] ?? "Não respondida" })),
    ...result.dominios.map((d) => ({ question: d.nome, answer: d.examinado ? `${d.pontos}/${d.peso} — ${d.detalhe}` : "Não examinado" })),
    { question: "Escore ICED-8", answer: `${result.total}/${ICED_MAX}` },
    { question: "Leitura operacional", answer: result.faixa },
    { question: "Núcleo funcional", answer: result.nucleo },
    { question: "Trava de controle", answer: result.trava ? `ativa — ${result.travaMotivo}` : "liberada" },
  ];
  if (s.fenomeno) items.push({ question: "Fenômeno observado", answer: s.fenomeno });
  return items;
}

export { scoreIced };
