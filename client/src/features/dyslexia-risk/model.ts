/**
 * ICED-8 — Dyslexia Risk. Registro descritivo da aplicação.
 * O app registra COMO a avaliação foi feita e COMO a criança respondeu (contagens brutas, tempos,
 * produções). Não soma pontos nem classifica e não compara com referência: a interpretação é do profissional.
 */
import { DESCRIPTIVE_NOTICE } from "../../lib/descriptiveNotice";

export const ICED_VERSION = "ICED-8";

/** Quantidade de pseudopalavras que existia antes da ampliação do ditado (5); rascunhos antigos têm esse total. */
export const DITADO_PSEUDO_LEGACY_TOTAL = 5;

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

/** Medida bruta de um domínio, como registrada. Sem pontuação nem rótulo. */
export interface DomainRecord {
  id: DomainId;
  nome: string;
  examinado: boolean;
  /** Texto descritivo com as contagens e tempos registrados; "não examinado" quando a fase não foi aplicada. */
  medida: string;
}

export interface IcedInput {
  ano: "2" | "3" | "outro" | "";
  controle: Record<string, Tri>;
  palavrasAcertos: number | null;
  palavrasF: number | null;
  pseudoAcertos: number | null;
  pseudoLex: number | null;
  pcpm: number | null;
  /** Palavras lidas, erros e tempo (s) da fluência, quando registrados. */
  fluLidas?: number | null;
  fluErros?: number | null;
  fluTempo?: number | null;
  ditadoF: number | null;
  ditadoPseudoCertas: number | null;
  /** Pseudopalavras aplicadas no ditado. Ausente = 5 (versão anterior). */
  ditadoPseudoTotal?: number;
  cfAcertos: number | null;
  ranSeg: number | null;
  ranErros: number | null;
  familiar: "sim" | "nao" | "nv" | "";
  persistencia4: boolean | null;
}

export interface IcedRecord {
  /** Itens do Bloco 0 com a resposta registrada ("sim", "não", "não verificado" ou "não informado"). */
  controles: { chave: string; rotulo: string; resposta: string }[];
  /** Itens do Bloco 0 sem resposta "sim"/"não" (só informa o que falta registrar). */
  controlesSemResposta: string[];
  dominios: DomainRecord[];
  naoExaminados: string[];
  /** Texto de devolução puramente descritivo (o que foi aplicado e as medidas brutas). */
  frase: string;
}

const TRI_TEXT: Record<string, string> = { sim: "sim", nao: "não", nv: "não verificado", "": "não informado" };

/** Chaves do Bloco 0 (condições de aplicação). */
export const BLOCO0_KEYS = ["esc", "alf", "aud", "vis", "di"] as const;

const dash = (value: number | null | undefined) => (value == null ? "—" : String(value));

export function describeIced(input: IcedInput): IcedRecord {
  const controles = CONTROL.map(([chave, rotulo]) => ({ chave, rotulo, resposta: TRI_TEXT[input.controle[chave] ?? ""] ?? String(input.controle[chave]) }));
  const controlesSemResposta = CONTROL
    .filter(([chave]) => (BLOCO0_KEYS as readonly string[]).includes(chave) && input.controle[chave] !== "sim" && input.controle[chave] !== "nao")
    .map(([, rotulo]) => rotulo);

  const dominios: DomainRecord[] = [];
  const fluExam = input.pcpm != null;
  dominios.push({
    id: "fluencia", nome: "Fluência", examinado: fluExam,
    medida: fluExam
      ? `${input.fluLidas != null ? `${input.fluLidas} palavras lidas · ` : ""}${input.fluErros != null ? `${input.fluErros} erros · ` : ""}${input.fluTempo != null ? `${input.fluTempo} s · ` : ""}palavras corretas por minuto: ${input.pcpm} · ano escolar informado: ${input.ano || "não informado"}`
      : "não examinado",
  });
  const ortExam = input.ditadoF != null || input.ditadoPseudoCertas != null;
  dominios.push({
    id: "ortografia", nome: "Ortografia / ditado", examinado: ortExam,
    medida: ortExam ? `erros fonológicos ${dash(input.ditadoF)} · pseudopalavras certas ${dash(input.ditadoPseudoCertas)}/${input.ditadoPseudoTotal ?? DITADO_PSEUDO_LEGACY_TOTAL}` : "não examinado",
  });
  const psExam = input.pseudoAcertos != null;
  dominios.push({ id: "pseudo", nome: "Pseudopalavras", examinado: psExam, medida: psExam ? `${input.pseudoAcertos}/16 certas · lexicalizações ${dash(input.pseudoLex)}` : "não examinado" });
  const pwExam = input.palavrasAcertos != null;
  dominios.push({ id: "palavras", nome: "Precisão de palavras", examinado: pwExam, medida: pwExam ? `${input.palavrasAcertos}/20 certas · erros fonológicos ${dash(input.palavrasF)}` : "não examinado" });
  const cfExam = input.cfAcertos != null;
  dominios.push({ id: "cf", nome: "Consciência fonológica", examinado: cfExam, medida: cfExam ? `${input.cfAcertos}/12 certas` : "não examinado" });
  const ranExam = input.ranSeg != null;
  dominios.push({ id: "ran", nome: "Nomeação rápida", examinado: ranExam, medida: ranExam ? `${input.ranSeg} s · ${dash(input.ranErros)} erros (40 estímulos)` : "não examinado" });
  const famExam = input.familiar === "sim" || input.familiar === "nao";
  dominios.push({ id: "familiar", nome: "Familiar de 1º grau", examinado: famExam, medida: famExam ? `registro em pai, mãe ou irmão: ${input.familiar === "sim" ? "sim" : "não"}` : "não verificado / não examinado" });
  const persExam = input.persistencia4 != null;
  dominios.push({ id: "persistencia", nome: "Persistência", examinado: persExam, medida: persExam ? `quatro respostas "sim" no bloco de intervenção: ${input.persistencia4 ? "sim" : "não"}` : "não examinada" });

  const naoExaminados = dominios.filter((d) => !d.examinado).map((d) => d.nome);
  const frase = [
    "ICED-8 — registro descritivo da aplicação.",
    ...dominios.map((d) => `${d.nome}: ${d.medida}.`),
    `Ano escolar informado: ${input.ano || "não informado"}.`,
    controlesSemResposta.length ? `Bloco 0 sem resposta "sim"/"não": ${controlesSemResposta.join("; ")}.` : "Bloco 0 respondido.",
    DESCRIPTIVE_NOTICE,
  ].join(" ");
  return { controles, controlesSemResposta, dominios, naoExaminados, frase };
}
