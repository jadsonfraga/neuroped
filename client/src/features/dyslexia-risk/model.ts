/**
 * ICED-8 — Dyslexia Risk. Instrumento operacional interno.
 * Não validado. Não diagnostica. Ausente ≠ normal. Norma ≤ −1 DP prevalece.
 */
import { DITADO_PSEUDO_LEGACY_TOTAL, DITADO_REFERENCE, FLUENCY_ANCHORS, SCORE_ELEVATED_FRACTION, SCORE_REFERENCE, ranReferenceFor } from "./icedConfig";
export const ICED_VERSION = "ICED-8";
export const ICED_MAX = 15;

export const WORDS = [
  ["casa", "A"], ["menino", "A"], ["escola", "A"], ["janela", "A"], ["bonito", "A"],
  ["cachorro", "A"], ["comida", "A"], ["família", "A"], ["brinquedo", "A"], ["domingo", "A"],
  ["floresta", "B"], ["surpresa", "B"], ["problema", "B"], ["diferente", "B"], ["aniversário", "B"],
  ["biblioteca", "B"], ["importante", "B"], ["experiência", "B"], ["impossível", "B"], ["desconhecido", "B"],
] as const;

export const PSEUDO = ["mepa", "tulo", "feno", "bira", "lape", "nuto", "vima", "potev", "duneca", "falito", "murepa", "tavino", "bratelo", "fruneta", "pladivo", "crenuto"] as const;

export const DITADO = [
  ["janela", "A casa tem uma janela."],
  ["cachorro", "O cachorro latiu."],
  ["brinquedo", "Guardou o brinquedo."],
  ["escola", "Ela foi à escola."],
  ["surpresa", "Foi uma surpresa."],
  ["floresta", "A floresta é grande."],
  ["importante", "Isso é importante."],
  ["aniversário", "Hoje é o aniversário."],
  ["experiência", "Foi uma experiência."],
  ["impossível", "Parecia impossível."],
  ["desconhecido", "O caminho era desconhecido."],
  ["responsabilidade", "Isso é responsabilidade."],
] as const;

/** As 5 primeiras são as da versão anterior (rascunhos antigos seguem avaliados sobre elas); as 5 seguintes ampliam o ditado. Pseudopalavras autorais, sem fonte. */
export const DITADO_PSEUDO = ["mepa", "tulo", "falito", "bruneca", "crenuto", "bifa", "dumeno", "salteca", "frobita", "venhulo"] as const;

export const CF = [
  { bloco: "A. Segmentação", exemplo: "FATO → /f/ /a/ /t/ /o/", cmd: "gato", esp: "/g/ /a/ /t/ /o/" },
  { bloco: "A. Segmentação", cmd: "mesa", esp: "/m/ /e/ /z/ /a/" },
  { bloco: "A. Segmentação", cmd: "prato", esp: "/p/ /r/ /a/ /t/ /o/" },
  { bloco: "A. Segmentação", cmd: "flor", esp: "/f/ /l/ /o/ /r/" },
  { bloco: "B. Exclusão", exemplo: "PATO sem /p/ → ato", cmd: "gato sem /g/", esp: "ato" },
  { bloco: "B. Exclusão", cmd: "prato sem /p/", esp: "rato" },
  { bloco: "B. Exclusão", cmd: "bola sem /b/", esp: "ola" },
  { bloco: "C. Manipulação", exemplo: "MALA, troque /m/ por /s/ → sala", cmd: "faca: troque /f/ por /v/", esp: "vaca" },
  { bloco: "C. Manipulação", cmd: "gato: troque /g/ por /r/", esp: "rato" },
  { bloco: "C. Manipulação", cmd: "mala: troque /l/ por /p/", esp: "mapa" },
  { bloco: "D. Síntese", exemplo: "/s/ /o/ /l/ → sol", cmd: "/f/ /l/ /o/ /r/", esp: "flor" },
  { bloco: "D. Síntese", cmd: "/b/ /o/ /l/ /a/", esp: "bola" },
] as const;

export const RAN = ["circulo", "estrela", "quadrado", "triangulo", "estrela", "circulo", "triangulo", "quadrado", "quadrado", "triangulo", "circulo", "estrela", "circulo", "quadrado", "estrela", "triangulo", "estrela", "quadrado", "triangulo", "circulo", "triangulo", "estrela", "quadrado", "circulo", "triangulo", "circulo", "estrela", "quadrado", "quadrado", "estrela", "circulo", "triangulo", "circulo", "triangulo", "quadrado", "estrela", "estrela", "quadrado", "triangulo", "circulo"] as const;

export const FLUENCY_TEXT = "No fim da aula, Pedro e Ana foram ao parque com a avó. O dia estava quente e o céu azul. Eles levaram uma bola vermelha e um lanche simples. Pedro chutou a bola para longe e Ana correu para buscar. Perto do lago havia patos e uma ponte de madeira. A avó sentou no banco e abriu o suco. Uma menina pediu para brincar junto. Os três fizeram uma fila e contaram até três antes de correr. Pedro chegou primeiro, mas esperou os amigos. Depois comeram pão e fruta à sombra da árvore. Quando o sol baixou, a avó chamou. Era hora de voltar para casa, lavar as mãos e guardar a bola. Pedro ainda queria mais uma partida, mas obedeceu. No caminho, Ana contou que o parque era o seu lugar favorito da semana.";

export const CONTROL = [
  ["esc", "≥ 2 anos de escolarização formal"],
  ["alf", "Alfabetização / instrução sistemática adequada"],
  ["freq", "Frequência escolar razoável"],
  ["aud", "Audição previamente adequada, ou corrigida"],
  ["vis", "Visão previamente adequada, ou corrigida"],
  ["di", "Deficiência intelectual não explica o conjunto"],
  ["pers", "Dificuldade persiste apesar de intervenção, se já houve"],
] as const;

export type Tri = "sim" | "nao" | "nv" | "";
export type DomainId = "fluencia" | "ortografia" | "pseudo" | "palavras" | "cf" | "ran" | "familiar" | "persistencia";

export interface DomainScore {
  id: DomainId;
  nome: string;
  peso: number;
  pontos: number;
  examinado: boolean;
  detalhe: string;
  limítrofe: boolean;
}

export interface IcedInput {
  ano: "2" | "3" | "outro" | "";
  controle: Record<string, Tri>;
  palavrasAcertos: number | null;
  palavrasF: number | null;
  palavrasNorma: boolean;
  pseudoAcertos: number | null;
  pseudoLex: number | null;
  pseudoNorma: boolean;
  pcpm: number | null;
  fluenciaNorma: boolean;
  ditadoF: number | null;
  ditadoPseudoCertas: number | null;
  /** Pseudopalavras aplicadas no ditado. Ausente = 5 (versão anterior); o corte é proporcional (2/5). */
  ditadoPseudoTotal?: number;
  ditadoNorma: boolean;
  cfAcertos: number | null;
  cfNorma: boolean;
  ranSeg: number | null;
  ranErros: number | null;
  ranNorma: boolean;
  familiar: "sim" | "nao" | "nv" | "";
  persistencia4: boolean | null;
}

export interface IcedResult {
  trava: boolean;
  travaMotivo: string;
  /** Controles de exclusão sem resposta "sim"/"não" (vazio ou "não verificado"). Ausente ≠ normal: deixa o escore descritivo. */
  controlesPendentes: string[];
  /** Soma dos pesos dos domínios examinados (o máximo alcançável nesta aplicação). */
  pontosExaminaveis: number;
  /** total / pontosExaminaveis em %, só descritivo (não altera a faixa). */
  proporcaoPct: number | null;
  /** Avisos de leitura: ano sem âncora de fluência, domínios não examinados etc. */
  avisos: string[];
  dominios: DomainScore[];
  total: number;
  naoExaminados: string[];
  faixa: "limitada" | "intermediaria" | "elevada" | "descritiva";
  nucleo: "presente" | "ausente";
  leitura: string;
  frase: string;
}

export function fluencyAnchor(ano: IcedInput["ano"], pcpm: number | null) {
  if (ano === "outro" || !ano) return { pontua: false, examinado: false, detalhe: "Sem âncora de 8 anos. Só norma do ano, ou não pontuar." };
  if (pcpm == null) return { pontua: false, examinado: false, detalhe: "PCPM não registrado." };
  const row = FLUENCY_ANCHORS[ano === "2" ? "2" : "3"];
  if (pcpm <= row.pontuaAte) return { pontua: true, examinado: true, detalhe: `PCPM ${pcpm} ≤ ${row.pontuaAte} (${row.rotulo}).` };
  if (pcpm <= row.descreveAte) return { pontua: false, examinado: true, detalhe: `PCPM ${pcpm} na faixa ${row.pontuaAte + 1}–${row.descreveAte}. Descreve, não pontua.` };
  return { pontua: false, examinado: true, detalhe: `PCPM ${pcpm} acima da âncora do ${row.rotulo}.` };
}

/** Controles que, respondidos "não", travam a leitura (e, sem resposta, a deixam descritiva). */
export const TRAVA_CONTROLS = ["esc", "alf", "aud", "vis", "di"] as const;

/** Texto único da situação da trava, usado em tela, PDF, prontuário e devolução. */
export function travaStatusText(result: Pick<IcedResult, "trava" | "travaMotivo" | "controlesPendentes">): string {
  if (result.trava) return `ativa — ${result.travaMotivo}`;
  if (result.controlesPendentes.length) return `pendente — controles não confirmados: ${result.controlesPendentes.join("; ")}`;
  return "liberada";
}

export function scoreIced(input: IcedInput): IcedResult {
  const travaInstr = input.controle.alf === "nao" || input.controle.esc === "nao";
  const travaSensor = input.controle.aud === "nao" || input.controle.vis === "nao";
  const travaDi = input.controle.di === "nao";
  const trava = travaInstr || travaSensor || travaDi;
  const travaMotivo = [
    travaInstr ? "instrução ou escolarização insuficiente" : "",
    travaSensor ? "alteração sensorial não corrigida" : "",
    travaDi ? "deficiência intelectual como explicação suficiente" : "",
  ].filter(Boolean).join("; ");
  const controlLabel = new Map<string, string>(CONTROL.map(([key, label]) => [key, label]));
  const controlesPendentes = trava ? [] : TRAVA_CONTROLS
    .filter((key) => input.controle[key] !== "sim" && input.controle[key] !== "nao")
    .map((key) => controlLabel.get(key) ?? key);

  const dominios: DomainScore[] = [];

  const flu = input.fluenciaNorma
    ? { pontua: true, examinado: true, detalhe: "Norma formal ≤ −1 DP prevalece." }
    : fluencyAnchor(input.ano, input.pcpm);
  dominios.push({ id: "fluencia", nome: "Fluência", peso: 3, pontos: flu.examinado && flu.pontua ? 3 : 0, examinado: flu.examinado, detalhe: flu.detalhe, limítrofe: flu.examinado && !flu.pontua && /Descreve/.test(flu.detalhe) });

  const ortExam = input.ditadoNorma || input.ditadoF != null || input.ditadoPseudoCertas != null;
  const ortPontua = input.ditadoNorma || (input.ditadoF != null && input.ditadoF >= DITADO_REFERENCE.errosFonologicosMinimo) || (input.ditadoPseudoCertas != null && input.ditadoPseudoCertas * DITADO_REFERENCE.pseudoFracaoMaxima.den <= DITADO_REFERENCE.pseudoFracaoMaxima.num * (input.ditadoPseudoTotal ?? DITADO_PSEUDO_LEGACY_TOTAL));
  dominios.push({
    id: "ortografia", nome: "Ortografia / ditado", peso: 3,
    pontos: ortExam && ortPontua ? 3 : 0, examinado: ortExam,
    detalhe: input.ditadoNorma ? "Norma formal ≤ −1 DP prevalece." : `Erros fonológicos ${input.ditadoF ?? "—"} · pseudopalavras ${input.ditadoPseudoCertas ?? "—"}/${input.ditadoPseudoTotal ?? DITADO_PSEUDO_LEGACY_TOTAL}. Erro só de regra não pontua.`,
    limítrofe: false,
  });

  const psExam = input.pseudoNorma || input.pseudoAcertos != null;
  const psPontua = input.pseudoNorma || (input.pseudoAcertos != null && input.pseudoAcertos <= 10) || (input.pseudoLex != null && input.pseudoLex >= 4);
  dominios.push({
    id: "pseudo", nome: "Pseudopalavras", peso: 2,
    pontos: psExam && psPontua ? 2 : 0, examinado: psExam,
    detalhe: input.pseudoNorma ? "Norma formal ≤ −1 DP prevalece." : `${input.pseudoAcertos ?? "—"}/16 · lexicalizações ${input.pseudoLex ?? "—"}.`,
    limítrofe: false,
  });

  const pwExam = input.palavrasNorma || input.palavrasAcertos != null;
  const pwBorder = !input.palavrasNorma && input.palavrasAcertos === 16 && input.palavrasF != null && input.palavrasF >= 3 && input.palavrasF <= 4;
  const pwPontua = input.palavrasNorma || (!pwBorder && ((input.palavrasAcertos != null && input.palavrasAcertos <= 15) || (input.palavrasF != null && input.palavrasF >= 5)));
  dominios.push({
    id: "palavras", nome: "Precisão de palavras", peso: 1,
    pontos: pwExam && pwPontua ? 1 : 0, examinado: pwExam,
    detalhe: input.palavrasNorma ? "Norma formal ≤ −1 DP prevalece." : `${input.palavrasAcertos ?? "—"}/20 · erros fonológicos ${input.palavrasF ?? "—"}${pwBorder ? ". Limítrofe: não pontua." : "."}`,
    limítrofe: pwBorder,
  });

  const cfExam = input.cfNorma || input.cfAcertos != null;
  const cfPontua = input.cfNorma || (input.cfAcertos != null && input.cfAcertos <= 6);
  dominios.push({
    id: "cf", nome: "Consciência fonológica", peso: 2,
    pontos: cfExam && cfPontua ? 2 : 0, examinado: cfExam,
    detalhe: input.cfNorma ? "Norma formal ≤ −1 DP prevalece." : `${input.cfAcertos ?? "—"}/12. 7–9 descreve, não pontua.`,
    limítrofe: input.cfAcertos != null && input.cfAcertos >= 7 && input.cfAcertos <= 9,
  });

  const ranExam = input.ranNorma || input.ranSeg != null;
  const ranRef = ranReferenceFor(input.ano);
  const ranPontua = input.ranNorma || (input.ranSeg != null && input.ranSeg > ranRef.segundosAcima) || (input.ranErros != null && input.ranErros >= ranRef.errosMinimo);
  dominios.push({
    id: "ran", nome: "Nomeação rápida", peso: 1,
    pontos: ranExam && ranPontua ? 1 : 0, examinado: ranExam,
    detalhe: input.ranNorma ? "RAN normatizado ≤ −1 DP prevalece." : `${input.ranSeg ?? "—"} s · erros ${input.ranErros ?? "—"}.`,
    limítrofe: false,
  });

  dominios.push({
    id: "familiar", nome: "Familiar de 1º grau", peso: 1,
    pontos: input.familiar === "sim" ? 1 : 0,
    examinado: input.familiar === "sim" || input.familiar === "nao",
    detalhe: input.familiar === "nv" || input.familiar === "" ? "Não sei / não examinado. Não zera." : input.familiar === "sim" ? "Sim documentado em pai, mãe ou irmão." : "Sem sim documentado.",
    limítrofe: false,
  });

  dominios.push({
    id: "persistencia", nome: "Persistência", peso: 2,
    pontos: input.persistencia4 ? 2 : 0,
    examinado: input.persistencia4 != null,
    detalhe: input.persistencia4 == null ? "Não examinada." : input.persistencia4 ? "Quatro sim. Intervenção adequada e dificuldade mantida." : "Intervenção ausente ou insuficiente. Zero não significa ausência de transtorno.",
    limítrofe: false,
  });

  const total = dominios.reduce((s, d) => s + (d.examinado ? d.pontos : 0), 0);
  const naoExaminados = dominios.filter((d) => !d.examinado).map((d) => d.nome);
  const pontosExaminaveis = dominios.reduce((s, d) => s + (d.examinado ? d.peso : 0), 0);
  const avisos: string[] = [];
  if (!input.fluenciaNorma && (input.ano === "outro" || !input.ano)) {
    avisos.push("Ano escolar sem âncora de fluência: a fluência não pontua (3 pontos fora do alcance), então o limiar de 9/15 não é equivalente ao do 2º e 3º ano. Use norma formal do ano, se houver.");
  }
  if (naoExaminados.length) {
    avisos.push(`Escore sobre ${pontosExaminaveis} pontos possíveis (domínios examinados), não sobre 15. Não examinados: ${naoExaminados.join(", ")}. Ausente não é normal.`);
  }
  const proporcaoPct = pontosExaminaveis > 0 ? Math.round((total / pontosExaminaveis) * 100) : null;
  if (pontosExaminaveis > 0 && pontosExaminaveis < SCORE_REFERENCE.maximo) {
    const limiarPct = Math.round((SCORE_ELEVATED_FRACTION.num / SCORE_ELEVATED_FRACTION.den) * 100);
    avisos.push(`Leitura proporcional (descritiva, NÃO altera a faixa): ${total} de ${pontosExaminaveis} pontos possíveis = ${proporcaoPct}%; o limiar de ${SCORE_REFERENCE.elevada}/${SCORE_REFERENCE.maximo} equivale a ${limiarPct}% do escore completo. Não há regra validada para converter o limiar quando domínios ficam fora do alcance: decisão clínica do médico.`);
  }
  const nucleo = dominios.some((d) => (d.id === "fluencia" || d.id === "ortografia") && d.pontos > 0) ? "presente" : "ausente";

  let faixa: IcedResult["faixa"] = "limitada";
  let leitura = "Evidência atual limitada.";
  if (trava) {
    faixa = "descritiva";
    leitura = "Escore descritivo. Não interpretado como evidência de dislexia.";
  } else if (controlesPendentes.length) {
    faixa = "descritiva";
    leitura = "Escore descritivo: controles de exclusão não confirmados (escolarização, alfabetização, audição, visão ou deficiência intelectual). Confirmar antes de interpretar.";
  } else if (total >= SCORE_REFERENCE.elevada && nucleo === "presente") {
    faixa = "elevada";
    leitura = "Evidência elevada de dificuldade persistente de leitura/escrita.";
  } else if (total >= SCORE_REFERENCE.elevada && nucleo === "ausente") {
    faixa = "intermediaria";
    leitura = "9–15 sem núcleo (fluência ou ortografia). Reclassificado como intermediário.";
  } else if (total >= SCORE_REFERENCE.intermediaria) {
    faixa = "intermediaria";
    leitura = "Evidência intermediária. Investigar, intervir e rever.";
  }
  if (faixa === "limitada" && naoExaminados.length) {
    leitura = "Evidência limitada nos domínios examinados; há domínios não examinados, o que não equivale a resultado normal.";
  }

  const frase = [
    `ICED-8 = ${total}/15 (pontos possíveis nos domínios examinados: ${pontosExaminaveis}).`,
    `Fluência ${dominios[0].examinado ? dominios[0].pontos : "não examinada"}.`,
    `Ortografia ${dominios[1].examinado ? dominios[1].pontos : "não examinada"}.`,
    `Pseudopalavras ${dominios[2].examinado ? dominios[2].pontos : "não examinado"}.`,
    `Precisão ${dominios[3].examinado ? dominios[3].pontos : "não examinada"}.`,
    `Consciência fonológica ${dominios[4].examinado ? dominios[4].pontos : "não examinada"}.`,
    `RAN ${dominios[5].examinado ? dominios[5].pontos : "não examinado"}.`,
    `Familiar ${dominios[6].examinado ? dominios[6].pontos : "não examinado"}.`,
    `Intervenção ${dominios[7].examinado ? dominios[7].pontos : "não examinada"}.`,
    `Ano escolar usado na fluência: ${input.ano || "não informado"}.`,
    `Trava de controle: ${trava ? "ativa" : controlesPendentes.length ? "pendente (controles não confirmados)" : "liberada"}.`,
    `Leitura operacional: ${faixa}.`,
    `Núcleo funcional (fluência ou ortografia): ${nucleo}.`,
    "Resultado não constitui diagnóstico. Integrar escolarização, linguagem, desenvolvimento e diferencial.",
  ].join(" ");

  return { trava, travaMotivo, controlesPendentes, pontosExaminaveis, proporcaoPct, avisos, dominios, total, naoExaminados, faixa, nucleo, leitura, frase };
}
