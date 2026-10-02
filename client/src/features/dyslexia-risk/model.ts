/**
 * ICED-8 — Dyslexia Risk. Instrumento operacional interno.
 * Não validado. Não diagnostica. Ausente ≠ normal. Norma ≤ −1 DP prevalece.
 */
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

export const DITADO_PSEUDO = ["mepa", "tulo", "falito", "bruneca", "crenuto"] as const;

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
  if (ano === "2") {
    if (pcpm <= 42) return { pontua: true, examinado: true, detalhe: `PCPM ${pcpm} ≤ 42 (2º ano).` };
    if (pcpm <= 55) return { pontua: false, examinado: true, detalhe: `PCPM ${pcpm} na faixa 43–55. Descreve, não pontua.` };
    return { pontua: false, examinado: true, detalhe: `PCPM ${pcpm} acima da âncora do 2º ano.` };
  }
  if (pcpm <= 70) return { pontua: true, examinado: true, detalhe: `PCPM ${pcpm} ≤ 70 (3º ano).` };
  if (pcpm <= 80) return { pontua: false, examinado: true, detalhe: `PCPM ${pcpm} na faixa 71–80. Descreve, não pontua.` };
  return { pontua: false, examinado: true, detalhe: `PCPM ${pcpm} acima da âncora do 3º ano.` };
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

  const dominios: DomainScore[] = [];

  const flu = input.fluenciaNorma
    ? { pontua: true, examinado: true, detalhe: "Norma formal ≤ −1 DP prevalece." }
    : fluencyAnchor(input.ano, input.pcpm);
  dominios.push({ id: "fluencia", nome: "Fluência", peso: 3, pontos: flu.examinado && flu.pontua ? 3 : 0, examinado: flu.examinado, detalhe: flu.detalhe, limítrofe: flu.examinado && !flu.pontua && /Descreve/.test(flu.detalhe) });

  const ortExam = input.ditadoNorma || input.ditadoF != null || input.ditadoPseudoCertas != null;
  const ortPontua = input.ditadoNorma || (input.ditadoF != null && input.ditadoF >= 4) || (input.ditadoPseudoCertas != null && input.ditadoPseudoCertas <= 2);
  dominios.push({
    id: "ortografia", nome: "Ortografia / ditado", peso: 3,
    pontos: ortExam && ortPontua ? 3 : 0, examinado: ortExam,
    detalhe: input.ditadoNorma ? "Norma formal ≤ −1 DP prevalece." : `Erros fonológicos ${input.ditadoF ?? "—"} · pseudopalavras ${input.ditadoPseudoCertas ?? "—"}/5. Erro só de regra não pontua.`,
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
  const ranPontua = input.ranNorma || (input.ranSeg != null && input.ranSeg > 45) || (input.ranErros != null && input.ranErros >= 4);
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
  const nucleo = dominios.some((d) => (d.id === "fluencia" || d.id === "ortografia") && d.pontos > 0) ? "presente" : "ausente";

  let faixa: IcedResult["faixa"] = "limitada";
  let leitura = "Evidência atual limitada.";
  if (trava) {
    faixa = "descritiva";
    leitura = "Escore descritivo. Não interpretado como evidência de dislexia.";
  } else if (total >= 9 && nucleo === "presente") {
    faixa = "elevada";
    leitura = "Evidência elevada de dificuldade persistente de leitura/escrita.";
  } else if (total >= 9 && nucleo === "ausente") {
    faixa = "intermediaria";
    leitura = "9–15 sem núcleo (fluência ou ortografia). Reclassificado como intermediário.";
  } else if (total >= 5) {
    faixa = "intermediaria";
    leitura = "Evidência intermediária. Investigar, intervir e rever.";
  }

  const frase = [
    `ICED-8 = ${total}/15.`,
    `Fluência ${dominios[0].examinado ? dominios[0].pontos : "não examinada"}.`,
    `Ortografia ${dominios[1].examinado ? dominios[1].pontos : "não examinada"}.`,
    `Pseudopalavras ${dominios[2].examinado ? dominios[2].pontos : "não examinado"}.`,
    `Precisão ${dominios[3].examinado ? dominios[3].pontos : "não examinada"}.`,
    `Consciência fonológica ${dominios[4].examinado ? dominios[4].pontos : "não examinada"}.`,
    `RAN ${dominios[5].examinado ? dominios[5].pontos : "não examinado"}.`,
    `Familiar ${dominios[6].examinado ? dominios[6].pontos : "não examinado"}.`,
    `Intervenção ${dominios[7].examinado ? dominios[7].pontos : "não examinada"}.`,
    `Ano escolar usado na fluência: ${input.ano || "não informado"}.`,
    `Trava de controle: ${trava ? "ativa" : "liberada"}.`,
    `Leitura operacional: ${faixa}.`,
    `Núcleo funcional (fluência ou ortografia): ${nucleo}.`,
    "Resultado não constitui diagnóstico. Integrar escolarização, linguagem, desenvolvimento e diferencial.",
  ].join(" ");

  return { trava, travaMotivo, dominios, total, naoExaminados, faixa, nucleo, leitura, frase };
}
