/**
 * Banco dos Testes Cognitivos por Faixa Etária — 1 a 19 anos, um perfil por
 * idade, quatro domínios (reconhecimento visual, fala/leitura, letras/escrita
 * e números/aritmética), quatro itens por domínio.
 *
 * Regras de construção (travadas em tests/unit/cognitive-age-bank.test.ts):
 *   • tudo o que o item precisa está na tela: figura, letra, número, palavra
 *     ou texto. Nenhum passo pede lápis, papel, brinquedo ou objeto de fora;
 *   • cada item tem uma única resposta certa, conferível de relance:
 *     - `tap`: a criança toca em uma alternativa; a tela confere sozinha;
 *     - `say`: a criança fala (nomeia, lê em voz alta, conta); o adulto compara
 *       com a resposta esperada, que fica escrita ao lado;
 *     - `build`: a criança toca nas letras na ordem e monta a palavra; a tela
 *       confere sozinha (cópia quando a palavra fica visível, ditado quando não);
 *   • o nível sobe um degrau por idade e nunca exige vocabulário escolar sobre
 *     a própria tarefa (sem "tese", "estrutura", "regra abstrata").
 *
 * Verdade clínica: questionário interno autoral, registrado item a item. Não
 * produz escore, percentil, idade equivalente, ponto de corte nem equivalência
 * a instrumento licenciado. A leitura é do médico.
 */
export type CognitiveDomain = "visual" | "leitura" | "escrita" | "aritmetica";
export const COGNITIVE_DOMAINS: CognitiveDomain[] = ["visual", "leitura", "escrita", "aritmetica"];
export const COGNITIVE_MIN_AGE = 1;
export const COGNITIVE_MAX_AGE = 19;

interface ItemBase {
  id: string;
  /** Pergunta ou instrução, como fica no registro. */
  prompt: string;
  /** O que o adulto fala para a criança. */
  say: string;
  /** Estímulo mostrado grande à criança (figura, letra, número, palavra, texto). */
  stimulus?: string;
}
export interface TapItem extends ItemBase {
  kind: "tap";
  options: string[];
  answer: string;
  /** Alternativas curtas (figura, letra, número): botões gigantes. */
  big: boolean;
}
export interface SayItem extends ItemBase {
  kind: "say";
  stimulus: string;
  /** Resposta esperada, escrita para o adulto comparar. */
  expected: string;
}
export interface BuildItem extends ItemBase {
  kind: "build";
  /** Letras na ordem certa. */
  target: string[];
  /** Letras oferecidas (as da palavra, embaralhadas, mais distratores quando houver). */
  tiles: string[];
  /** true = a palavra fica visível (cópia); false = só o adulto fala (ditado). */
  show: boolean;
}
export type CognitiveItem = TapItem | SayItem | BuildItem;

/** Rótulo do domínio por idade: antes de 6 anos é fala, letras e quantidades. */
export function domainLabel(domain: CognitiveDomain, age: number): string {
  if (domain === "visual") return "Reconhecimento visual";
  if (domain === "leitura") return age < 6 ? "Fala e linguagem" : "Leitura";
  if (domain === "escrita") return age < 6 ? "Letras e formas" : "Escrita / Ortografia";
  return age < 6 ? "Números e quantidades" : "Aritmética";
}

export function ageProfileLabel(age: number): string {
  if (age === 1) return "1 ano · primeiras palavras e figuras";
  if (age <= 3) return `${age} anos · pré-escolar inicial`;
  if (age <= 5) return `${age} anos · pré-escolar`;
  if (age <= 7) return `${age} anos · alfabetização`;
  if (age <= 9) return `${age} anos · fundamental I`;
  if (age <= 13) return `${age} anos · fundamental II`;
  if (age <= 17) return `${age} anos · ensino médio`;
  return `${age} anos · jovem adulto`;
}

/** Embaralhamento determinístico (mesma palavra, mesmas peças). */
function scramble(letters: string[], seedText: string): string[] {
  const out = [...letters];
  let state = 0;
  for (const ch of seedText) state = (state * 31 + ch.codePointAt(0)!) >>> 0;
  const random = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  // Nunca entregar as peças já na ordem certa.
  if (out.join("") === letters.join("") && out.length > 1) [out[0], out[1]] = [out[1], out[0]];
  return out;
}

type DistributiveOmit<T, K extends keyof T> = T extends unknown ? Omit<T, K> : never;
type Draft = DistributiveOmit<CognitiveItem, "id">;
const codePoints = (value: string) => Array.from(value).length;
const tap = (prompt: string, options: string[], answer: string, extra: { stimulus?: string; say?: string } = {}): Draft => ({
  kind: "tap",
  prompt,
  say: extra.say ?? prompt,
  stimulus: extra.stimulus,
  options,
  answer,
  big: options.every((option) => codePoints(option) <= 6),
});
const say = (prompt: string, stimulus: string, expected: string): Draft => ({ kind: "say", prompt, say: prompt, stimulus, expected });
const READ_ALOUD = "Lê o texto inteiro sem trocar, pular ou inventar palavras";
const build = (word: string, extra = "", show = false): Draft => {
  const target = Array.from(word);
  return {
    kind: "build",
    prompt: show ? `Copie a palavra ${word}` : `Escreva a palavra ${word}`,
    say: show ? `Olhe a palavra ${word} e monte igual, tocando nas letras na ordem.` : `Escreva a palavra ${word}. Toque nas letras na ordem.`,
    stimulus: show ? word : undefined,
    target,
    tiles: scramble([...target, ...Array.from(extra)], word),
    show,
  };
};

// ─────────────────────────────── textos das leituras ───────────────────────────────
const T = {
  horta: "A horta da escola usa regadores pequenos para não gastar muita água.",
  ana: "Ana foi à biblioteca buscar um livro de astronomia. Ela leu sobre planetas e estrelas. Depois fez um resumo para a professora.",
  rex: "O João tem um cachorro chamado Rex. Todo dia, depois da escola, ele leva o Rex para passear no parque.",
  maria: "Maria estudou muito para a prova. Quando recebeu a nota, sorriu e comemorou com os amigos.",
  celular: "Usar o celular antes de dormir pode atrapalhar o sono, porque a luz da tela deixa o cérebro mais alerta.",
  abelhas: "As abelhas visitam as flores para coletar néctar. Sem esse trabalho, muitas frutas não existiriam.",
  reciclar: "Reciclar reduz o lixo nos aterros e economiza matéria-prima. Mesmo assim, só uma pequena parte do lixo das cidades é reciclada.",
  sono: "Adolescentes precisam de cerca de nove horas de sono por noite. Dormir pouco prejudica a memória e a atenção nas aulas.",
  vacina: "Vacinas treinam o sistema de defesa do corpo sem causar a doença. Por isso, quando o vírus real aparece, o organismo já sabe como reagir.",
  solar: "A energia solar cresce no Brasil porque o custo dos painéis caiu muito na última década. Ainda assim, a maior parte da eletricidade do país vem das hidrelétricas.",
  ia: "Ferramentas de inteligência artificial ajudam a resumir textos, mas podem inventar informações. Por isso, conferir as fontes continua indispensável.",
  casa: "Trabalhar de casa reduz o tempo de deslocamento, mas exige disciplina para separar horário de trabalho e descanso. Empresas que combinam os dois formatos relatam menos rotatividade.",
};

// ─────────────────────────────── perfis por idade ───────────────────────────────
const DRAFTS: Record<number, Record<CognitiveDomain, Draft[]>> = {
  1: {
    visual: [
      tap("Cadê o cachorro? Toque nele.", ["🐶", "🍌"], "🐶"),
      tap("Cadê a bola?", ["🐱", "⚽"], "⚽"),
      tap("Cadê o carro?", ["🚗", "🍎"], "🚗"),
      tap("Cadê o bebê?", ["👟", "👶"], "👶"),
    ],
    leitura: [
      say("O que é isto?", "🐶", "cachorro (aceitar au-au, cão, totó)"),
      say("O que é isto?", "🐱", "gato (aceitar miau)"),
      say("O que é isto?", "⚽", "bola"),
      say("O que é isto?", "🚗", "carro (aceitar bibi, vrum)"),
    ],
    escrita: [
      tap("Toque na estrela.", ["⭐", "🔵"], "⭐"),
      tap("Toque no coração.", ["🟩", "❤️"], "❤️"),
      tap("Toque na bolinha vermelha.", ["🔴", "⬛"], "🔴"),
      tap("Toque na estrela igual a esta.", ["🟩", "⭐"], "⭐", { stimulus: "⭐" }),
    ],
    aritmetica: [
      tap("Onde tem MAIS maçãs?", ["🍎", "🍎🍎🍎"], "🍎🍎🍎"),
      tap("Onde tem MAIS bolas?", ["⚽⚽⚽⚽", "⚽"], "⚽⚽⚽⚽"),
      tap("Onde tem só UM cachorro?", ["🐶🐶🐶", "🐶"], "🐶"),
      tap("Onde tem MUITAS bananas?", ["🍌", "🍌🍌🍌🍌"], "🍌🍌🍌🍌"),
    ],
  },
  2: {
    visual: [
      tap("Toque no cachorro.", ["🐱", "🐶", "🐟"], "🐶"),
      tap("Toque no olho.", ["👁️", "👃", "👂"], "👁️"),
      tap("Toque no sapato.", ["👟", "🎩", "🧤"], "👟"),
      tap("Toque na colher.", ["🚗", "🥄", "🐸"], "🥄"),
    ],
    leitura: [
      say("O que é isto?", "🍌", "banana"),
      say("O que é isto?", "🍎", "maçã"),
      say("Que bicho é este? Como ele faz?", "🐮", "vaca (aceitar muu)"),
      say("O que é isto?", "✈️", "avião"),
    ],
    escrita: [
      tap("Toque no círculo.", ["⚫", "🔺", "🟥"], "⚫"),
      tap("Toque na figura igual a esta.", ["🟥", "🔺", "⚫"], "🔺", { stimulus: "🔺" }),
      tap("Toque na LETRA.", ["🐶", "A", "⭐"], "A"),
      tap("Toque no quadrado.", ["🔵", "🟥", "🔺"], "🟥"),
    ],
    aritmetica: [
      tap("Onde tem MAIS maçãs?", ["🍎🍎", "🍎🍎🍎🍎"], "🍎🍎🍎🍎"),
      tap("Onde tem DOIS cachorros?", ["🐶", "🐶🐶", "🐶🐶🐶🐶"], "🐶🐶"),
      tap("Onde tem só UMA maçã?", ["🍎🍎🍎", "🍎", "🍎🍎"], "🍎"),
      tap("Onde tem MENOS bolas?", ["⚽", "⚽⚽⚽⚽"], "⚽"),
    ],
  },
  3: {
    visual: [
      tap("Toque na cor VERMELHA.", ["🔵", "🔴", "🟡"], "🔴"),
      tap("Toque na cor AZUL.", ["🟢", "🟡", "🔵"], "🔵"),
      tap("Qual é igual a este?", ["🐢", "🐸", "🐛"], "🐸", { stimulus: "🐸" }),
      tap("Qual NÃO é bicho?", ["🐶", "🐱", "🚗"], "🚗"),
    ],
    leitura: [
      say("Que cor é esta?", "🔴", "vermelho (aceitar vermelha)"),
      say("O que é isto?", "🐘", "elefante"),
      say("O que é isto?", "🪑", "cadeira"),
      say("O que é isto?", "☂️", "guarda-chuva (aceitar sombrinha)"),
    ],
    escrita: [
      tap("Toque na letra A.", ["A", "B", "O"], "A"),
      tap("Toque na letra O.", ["E", "O", "A"], "O"),
      tap("Toque na letra igual a esta.", ["N", "M", "W"], "M", { stimulus: "M" }),
      tap("Toque no NÚMERO, não na letra.", ["A", "2", "B"], "2"),
    ],
    aritmetica: [
      tap("Quantas maçãs? Toque no número.", ["1", "2", "3"], "2", { stimulus: "🍎🍎" }),
      tap("Quantos cachorros? Toque no número.", ["3", "1", "2"], "3", { stimulus: "🐶🐶🐶" }),
      tap("Onde tem UMA bola?", ["⚽⚽", "⚽", "⚽⚽⚽"], "⚽"),
      say("Conte as estrelas em voz alta.", "⭐⭐⭐", "um, dois, três (chega a três)"),
    ],
  },
  4: {
    visual: [
      tap("Qual é a forma igual a esta?", ["🔷", "🔶", "🔺", "⭐"], "🔷", { stimulus: "🔷" }),
      tap("Qual NÃO é fruta?", ["🍎", "🍌", "🚗", "🍇"], "🚗"),
      tap("Toque na cor VERDE.", ["🟢", "🟡", "🔵", "🔴"], "🟢"),
      tap("O que vem depois?", ["🔴", "🔵", "🟢", "🟡"], "🔴", { stimulus: "🔴 🔵 🔴 🔵 __" }),
    ],
    leitura: [
      say("O que é isto?", "🔑", "chave"),
      say("O que é isto?", "🦒", "girafa"),
      say("Que cor é esta?", "🟡", "amarelo (aceitar amarela)"),
      say("O que é isto?", "🥕", "cenoura"),
    ],
    escrita: [
      tap("Toque na letra B.", ["B", "D", "P", "R"], "B"),
      tap("Qual é a letra igual a esta?", ["F", "E", "L", "T"], "E", { stimulus: "E" }),
      say("Que letra é esta?", "A", "A (aceitar o som 'a')"),
      say("Que letra é esta?", "O", "O (aceitar o som 'o')"),
    ],
    aritmetica: [
      tap("Quantas maçãs? Toque no número.", ["3", "4", "5", "2"], "4", { stimulus: "🍎🍎🍎🍎" }),
      tap("Toque no número 3.", ["8", "3", "5", "1"], "3"),
      tap("Onde tem MAIS cachorros?", ["🐶🐶🐶", "🐶🐶🐶🐶🐶"], "🐶🐶🐶🐶🐶"),
      say("Conte as estrelas em voz alta.", "⭐⭐⭐⭐⭐", "um a cinco, na ordem (chega a cinco)"),
    ],
  },
  5: {
    visual: [
      tap("O que vem depois?", ["🔺", "🔵", "🟢", "⭐"], "🔺", { stimulus: "🔺 🔵 🔺 🔵 __" }),
      tap("Qual NÃO pertence ao grupo?", ["🐶", "🐱", "🐭", "🌳"], "🌳"),
      tap("Qual é igual a este?", ["🚜", "🚗", "🚌", "🚲"], "🚜", { stimulus: "🚜" }),
      tap("Qual cor está faltando na segunda fila?", ["🔵", "🔴", "🟡", "🟢"], "🔵", { stimulus: "🔴 🟡 🔵 🟢\n🔴 🟡 __ 🟢" }),
    ],
    leitura: [
      tap("Qual palavra rima com PÃO? Leia as opções em voz alta para a criança.", ["MÃO", "CASA", "BOLA", "GATO"], "MÃO", { stimulus: "PÃO" }),
      tap("Quantas partes tem MA-CA-CO? Fale batendo palmas.", ["3", "2", "4", "1"], "3", { stimulus: "MA-CA-CO" }),
      say("Com que som começa FACA?", "FACA", "F (som 'fê' ou 'f')"),
      tap("Qual palavra começa com S? Leia as opções em voz alta para a criança.", ["BOLA", "SAPO", "GATO", "MESA"], "SAPO"),
    ],
    escrita: [
      tap("Toque na letra minúscula a.", ["a", "b", "d", "o"], "a"),
      say("Que letra é esta?", "B", "B (aceitar o som 'bê')"),
      build("SOL", "", true),
      tap("Qual é a letra igual a esta?", ["S", "Z", "C", "G"], "S", { stimulus: "S" }),
    ],
    aritmetica: [
      tap("Quantas bolas? Toque no número.", ["5", "6", "7", "4"], "6", { stimulus: "⚽⚽⚽⚽⚽⚽" }),
      tap("Qual número vem depois do 4?", ["5", "3", "6", "2"], "5", { stimulus: "1 2 3 4 __" }),
      tap("2 + 1 = ?", ["3", "2", "4", "1"], "3", { stimulus: "🍎🍎 + 🍎" }),
      tap("Qual número é MAIOR?", ["7", "3", "5", "1"], "7"),
    ],
  },
  6: {
    visual: [
      tap("O que vem depois?", ["🟢", "🔴", "🔵", "🟡"], "🟢", { stimulus: "🔴 🔵 🟢 🔴 🔵 __" }),
      tap("Qual é igual a esta letra?", ["d", "b", "p", "q"], "b", { stimulus: "b" }),
      tap("Qual NÃO é fruta?", ["🍎", "🍌", "🥕", "🍇"], "🥕"),
      tap("Quantos triângulos?", ["4", "5", "6", "3"], "5", { stimulus: "🔺🔺🔺🔺🔺" }),
    ],
    leitura: [
      say("Leia em voz alta.", "BOLA", "bola"),
      tap("Qual palavra é GATO?", ["GOTA", "GATO", "PATO", "GALO"], "GATO"),
      tap("Leia a frase. O sol é…", ["frio", "quente", "azul", "mole"], "quente", { stimulus: "O sol é quente." }),
      say("Leia em voz alta.", "PATO", "pato"),
    ],
    escrita: [
      build("CASA", "", true),
      build("BOLA", "", true),
      tap("Qual está escrita certa?", ["caza", "casa", "kasa", "cassa"], "casa"),
      tap("Que letra falta em GA_O?", ["T", "D", "P", "L"], "T", { stimulus: "GA_O" }),
    ],
    aritmetica: [
      tap("3 + 2 = ?", ["4", "5", "6", "3"], "5"),
      tap("5 − 2 = ?", ["2", "3", "4", "1"], "3"),
      tap("Qual número vem depois?", ["10", "11", "6", "12"], "10", { stimulus: "7, 8, 9, __" }),
      tap("Qual número é MAIOR?", ["8", "3", "5", "2"], "8"),
    ],
  },
  7: {
    visual: [
      tap("O que vem depois?", ["🔵", "⭐", "🟢", "🔺"], "🔵", { stimulus: "⭐ ⭐ 🔵 ⭐ ⭐ __" }),
      tap("Qual é igual a esta?", ["🔷", "🔶", "🔺", "⭐"], "🔷", { stimulus: "🔷" }),
      tap("Qual NÃO é uma forma?", ["triângulo", "quadrado", "círculo", "banana"], "banana"),
      tap("Quantos quadrados?", ["6", "7", "8", "5"], "7", { stimulus: "🟦🟦🟦🟦🟦🟦🟦" }),
    ],
    leitura: [
      say("Leia em voz alta.", "JANELA", "janela"),
      say("Leia a frase em voz alta.", "O gato dorme no sofá.", "o gato dorme no sofá"),
      tap("Por que Lia levou o guarda-chuva?", ["Porque estava calor", "Porque ia chover", "Porque ia dormir", "Porque perdeu a mochila"], "Porque ia chover", { stimulus: "Lia levou o guarda-chuva porque ia chover." }),
      tap("Quantas sílabas tem JA-NE-LA?", ["2", "3", "4", "5"], "3", { stimulus: "JA-NE-LA" }),
    ],
    escrita: [
      build("GATO", "U"),
      build("PATO", "B"),
      tap("Qual está escrita certa?", ["girafa", "jirafa", "girrafa", "girafá"], "girafa"),
      tap("Qual frase começa com letra maiúscula?", ["ana brinca.", "Ana brinca.", "ana Brinca.", "ana brinca"], "Ana brinca."),
    ],
    aritmetica: [
      tap("10 + 5 = ?", ["14", "15", "16", "12"], "15"),
      tap("12 − 4 = ?", ["6", "8", "9", "7"], "8"),
      tap("Há 2 caixas com 3 lápis em cada uma. Quantos lápis?", ["5", "6", "4", "8"], "6", { stimulus: "📦 ✏️✏️✏️   📦 ✏️✏️✏️" }),
      tap("Qual número vem depois?", ["35", "40", "50", "31"], "40", { stimulus: "10, 20, 30, __" }),
    ],
  },
  8: {
    visual: [
      tap("O que vem depois?", ["🔺", "🔵", "🟢", "⭐"], "🔺", { stimulus: "🔺 🔺 🔵 🔺 🔺 🔵 🔺 __" }),
      tap("Qual NÃO pertence ao grupo?", ["🚗", "🐶", "🐱", "🐭"], "🚗", { stimulus: "🐶 🐱 🐭 🚗" }),
      tap("Qual é igual a esta letra?", ["q", "d", "b", "p"], "p", { stimulus: "p" }),
      tap("MÃO usa LUVA. PÉ usa:", ["meia", "chapéu", "camisa", "cinto"], "meia"),
    ],
    leitura: [
      say("Leia o texto em voz alta.", T.horta, READ_ALOUD),
      tap("O que a horta usa?", ["Regadores pequenos", "Mangueiras grandes", "Baldes", "Garrafas"], "Regadores pequenos", { stimulus: T.horta }),
      tap("Por que usa regadores pequenos?", ["Para não gastar muita água", "Para enfeitar", "Para as plantas crescerem rápido", "Para fazer barulho"], "Para não gastar muita água", { stimulus: T.horta }),
      tap("Nesse texto, 'gastar' quer dizer:", ["usar", "guardar", "esconder", "esquecer"], "usar", { stimulus: T.horta }),
    ],
    escrita: [
      build("ESCOLA", "X"),
      tap("Qual está escrita certa?", ["cavalo", "cavallo", "kavalo", "cavalu"], "cavalo"),
      tap("Qual palavra usa acento corretamente?", ["cafe", "cafê", "café", "cáfe"], "café"),
      tap("Complete: 'Ontem eu ___ à escola.'", ["vou", "vai", "irei", "fui"], "fui"),
    ],
    aritmetica: [
      tap("6 + 7 = ?", ["12", "13", "14", "15"], "13"),
      tap("15 − 8 = ?", ["8", "6", "7", "9"], "7"),
      tap("3 × 4 = ?", ["12", "7", "9", "14"], "12"),
      tap("Qual número é MAIOR?", ["34", "43", "33", "44"], "44"),
    ],
  },
  9: {
    visual: [
      tap("O que vem depois?", ["🔴", "🔵", "🟢", "🟡"], "🔵", { stimulus: "🔴 🔵 🔵 🔴 🔵 🔵 🔴 __" }),
      tap("Qual número continua a sequência?", ["9", "10", "11", "12"], "11", { stimulus: "2, 5, 8, __" }),
      tap("Qual NÃO pertence ao grupo?", ["cadeira", "cachorro", "gato", "cavalo"], "cadeira"),
      tap("Qual palavra tem MAIS letras?", ["GATO", "SOL", "BOLA", "ELEFANTE"], "ELEFANTE"),
    ],
    leitura: [
      say("Leia o texto em voz alta.", T.ana, READ_ALOUD),
      tap("O que Ana foi buscar?", ["Uma revista", "Um livro", "Um notebook", "Um mapa"], "Um livro", { stimulus: T.ana }),
      tap("Sobre o que era o livro?", ["Animais", "Plantas", "Astronomia", "História"], "Astronomia", { stimulus: T.ana }),
      tap("O que ela fez depois de ler?", ["Um resumo", "Uma prova", "Uma redação", "Uma apresentação"], "Um resumo", { stimulus: T.ana }),
    ],
    escrita: [
      build("BICICLETA", "S"),
      tap("Qual é o plural de LEÃO?", ["LEÃOS", "LEONES", "LEAOS", "LEÕES"], "LEÕES"),
      tap("Qual frase está certa?", ["Os meninos brincou no parque.", "Os meninos brincaram no parque.", "Os menino brincou no parque.", "O meninos brincaram."], "Os meninos brincaram no parque."),
      tap("Qual palavra está escrita ERRADA?", ["caza", "escola", "amigo", "bola"], "caza"),
    ],
    aritmetica: [
      tap("25 + 17 = ?", ["42", "32", "41", "43"], "42"),
      tap("40 − 15 = ?", ["25", "35", "15", "20"], "25"),
      tap("6 × 7 = ?", ["42", "36", "48", "41"], "42"),
      tap("Tenho 24 figurinhas em 3 pacotes iguais. Cada pacote tem:", ["6", "9", "12", "8"], "8"),
    ],
  },
  10: {
    visual: [
      tap("Qual número continua a sequência?", ["24", "20", "18", "22"], "24", { stimulus: "3, 6, 12, __" }),
      tap("O que vem depois?", ["🔺", "🔵", "⭐", "🟢"], "⭐", { stimulus: "🔺 🔵 ⭐ 🔺 🔵 __" }),
      tap("Se hoje é TERÇA, amanhã é:", ["quarta", "segunda", "quinta", "domingo"], "quarta"),
      tap("Qual é o OPOSTO de CHEIO?", ["grande", "pesado", "novo", "vazio"], "vazio"),
    ],
    leitura: [
      say("Leia o texto em voz alta.", T.rex, READ_ALOUD),
      tap("Como se chama o cachorro?", ["João", "Rex", "Parque", "Bola"], "Rex", { stimulus: T.rex }),
      tap("Quando o João passeia com o Rex?", ["De manhã cedo", "À noite", "Depois da escola", "No fim de semana"], "Depois da escola", { stimulus: T.rex }),
      tap("Qual palavra é SINÔNIMO de ALEGRE?", ["Feliz", "Triste", "Cansado", "Bravo"], "Feliz"),
    ],
    escrita: [
      build("PRINCESA", "Z"),
      tap("Qual é o plural de 'animal'?", ["animals", "animales", "animais", "animauis"], "animais"),
      tap("Complete: 'Nós ___ felizes.'", ["estamos", "está", "estou", "estão"], "estamos"),
      tap("Qual frase usa a letra maiúscula corretamente?", ["meu nome é ana.", "Meu Nome É Ana.", "meu nome É ana.", "Meu nome é Ana."], "Meu nome é Ana."),
    ],
    aritmetica: [
      tap("25 + 48 = ?", ["63", "73", "83", "72"], "73"),
      tap("9 × 6 = ?", ["56", "45", "54", "63"], "54"),
      tap("Qual é a metade de 50?", ["25", "20", "30", "15"], "25"),
      tap("Um lápis custa R$ 2. Quanto custam 6 lápis?", ["R$ 8", "R$ 10", "R$ 14", "R$ 12"], "R$ 12"),
    ],
  },
  11: {
    visual: [
      tap("Qual número continua a sequência?", ["30", "25", "24", "26"], "25", { stimulus: "5, 10, 15, 20, __" }),
      tap("Qual letra continua a sequência?", ["G", "F", "H", "E"], "G", { stimulus: "A, C, E, __" }),
      tap("DIA está para NOITE assim como SOL está para:", ["céu", "estrela", "nuvem", "lua"], "lua"),
      tap("Qual NÃO pertence ao grupo?", ["maçã", "banana", "cenoura", "uva"], "cenoura"),
    ],
    leitura: [
      say("Leia o texto em voz alta.", T.maria, READ_ALOUD),
      tap("Como Maria ficou com a nota?", ["Triste", "Feliz", "Com raiva", "Com medo"], "Feliz", { stimulus: T.maria }),
      tap("O que mostra que ela foi bem?", ["Chorou", "Ficou quieta", "Sorriu e comemorou", "Foi embora"], "Sorriu e comemorou", { stimulus: T.maria }),
      tap("Complete: 'Não fui à escola ___ estava doente.'", ["mas", "então", "ou", "porque"], "porque"),
    ],
    escrita: [
      build("EXERCÍCIO", "S"),
      tap("Qual frase está CORRETA?", ["Ela foram bem na prova.", "Ela foi bem na prova.", "Ela fui bem na prova.", "Ela vai bem na prova ontem."], "Ela foi bem na prova."),
      tap("Qual é o OPOSTO de 'começar'?", ["Iniciar", "Abrir", "Terminar", "Andar"], "Terminar"),
      tap("Qual frase está no PASSADO?", ["Amanhã eu estudo.", "Eu estudo agora.", "Eu vou estudar.", "Ontem eu estudei."], "Ontem eu estudei."),
    ],
    aritmetica: [
      tap("100 − 37 = ?", ["67", "63", "73", "57"], "63"),
      tap("12 × 5 = ?", ["50", "55", "60", "65"], "60"),
      tap("50% de 40 = ?", ["20", "10", "40", "30"], "20"),
      tap("48 ÷ 6 = ?", ["8", "6", "7", "9"], "8"),
    ],
  },
  12: {
    visual: [
      tap("Qual número continua a sequência?", ["32", "24", "20", "18"], "32", { stimulus: "2, 4, 8, 16, __" }),
      tap("O que vem depois?", ["🔵", "🔴", "🟢", "🟡"], "🔴", { stimulus: "🔴 🟢 🟢 🔴 🟢 🟢 __" }),
      tap("MÃO está para LUVA assim como PÉ está para:", ["perna", "dedo", "sapato", "chão"], "sapato"),
      tap("Qual número continua a sequência?", ["60", "65", "50", "75"], "60", { stimulus: "100, 90, 80, 70, __" }),
    ],
    leitura: [
      say("Leia o texto em voz alta.", T.celular, READ_ALOUD),
      tap("Segundo o texto, o celular à noite pode:", ["Melhorar o sono", "Atrapalhar o sono", "Cansar os olhos apenas", "Não mudar nada"], "Atrapalhar o sono", { stimulus: T.celular }),
      tap("Por que o celular atrapalha o sono?", ["Ele é pesado", "Faz muito barulho", "A luz deixa o cérebro alerta", "Fica sem bateria"], "A luz deixa o cérebro alerta", { stimulus: T.celular }),
      tap("'Ele tem um coração de ouro.' Isso quer dizer que ele é:", ["Muito bom", "Muito rico", "Muito forte", "Muito alto"], "Muito bom"),
    ],
    escrita: [
      build("ATRAVÉS", "Z"),
      tap("Qual frase está mais bem escrita?", ["Precisa economizar nós água.", "Precisamos economizar água.", "Nós precisa economizar água.", "Água economizar precisamos."], "Precisamos economizar água."),
      tap("Complete: 'Ela treinou bastante, ___ venceu a corrida.'", ["por isso", "porém", "embora", "ou"], "por isso"),
      tap("Qual palavra está escrita certa?", ["exceção", "excessão", "esceção", "exeção"], "exceção"),
    ],
    aritmetica: [
      tap("Resolva: 2x = 14", ["x = 5", "x = 6", "x = 7", "x = 12"], "x = 7"),
      tap("10% de 200 = ?", ["20", "10", "200", "2"], "20"),
      tap("Qual é a MÉDIA de 4, 6 e 8?", ["5", "7", "6", "9"], "6"),
      tap("Uma viagem tem 90 km. Depois de andar 60 km, faltam:", ["20 km", "30 km", "40 km", "150 km"], "30 km"),
    ],
  },
  13: {
    visual: [
      tap("Qual número continua a sequência?", ["21", "20", "22", "19"], "21", { stimulus: "1, 3, 6, 10, 15, __" }),
      tap("Qual letra continua a sequência?", ["J", "K", "I", "L"], "J", { stimulus: "B, D, F, H, __" }),
      tap("Todos os pássaros têm penas. O canário é um pássaro. Então o canário:", ["tem penas", "nada", "late", "tem escamas"], "tem penas"),
      tap("Qual NÃO pertence ao grupo?", ["triângulo", "quadrado", "círculo", "vermelho"], "vermelho"),
    ],
    leitura: [
      say("Leia o texto em voz alta.", T.abelhas, READ_ALOUD),
      tap("O que as abelhas coletam?", ["Néctar", "Água", "Folhas", "Terra"], "Néctar", { stimulus: T.abelhas }),
      tap("O que aconteceria sem o trabalho das abelhas?", ["Muitas frutas não existiriam", "As flores ficariam maiores", "Choveria menos", "Nada mudaria"], "Muitas frutas não existiriam", { stimulus: T.abelhas }),
      tap("'Ele ficou de olho na situação.' Significa que ele:", ["Prestou atenção", "Foi embora", "Dormiu", "Ficou perdido"], "Prestou atenção"),
    ],
    escrita: [
      build("PRIVILÉGIO", "J"),
      tap("Qual frase é uma OPINIÃO (não um fato)?", ["O filme dura duas horas.", "O filme é colorido.", "O filme foi lançado ontem.", "Este é o melhor filme do ano."], "Este é o melhor filme do ano."),
      tap("Qual frase é uma PERGUNTA?", ["Você vem hoje?", "Você vem hoje.", "Você vem hoje!", "Venha hoje."], "Você vem hoje?"),
      tap("Qual é o OPOSTO de 'vantagem'?", ["Benefício", "Lucro", "Desvantagem", "Ganho"], "Desvantagem"),
    ],
    aritmetica: [
      tap("Uma receita usa 2 ovos para cada 3 pessoas. Para 9 pessoas, usa:", ["4", "6", "9", "12"], "6"),
      tap("Um produto de R$ 200 tem desconto de 10%. O preço final é:", ["R$ 180", "R$ 190", "R$ 210", "R$ 20"], "R$ 180"),
      tap("Resolva: 3x + 2 = 11", ["x = 2", "x = 3", "x = 4", "x = 5"], "x = 3"),
      tap("Quanto é 15% de 100?", ["10", "20", "150", "15"], "15"),
    ],
  },
  14: {
    visual: [
      tap("Qual número continua a sequência?", ["36", "30", "32", "34"], "36", { stimulus: "1, 4, 9, 16, 25, __" }),
      tap("O que vem depois?", ["🔵", "🔴", "🟢", "⭐"], "🟢", { stimulus: "🔴 🔵 🟢 🟢 🔵 🔴 🔴 🔵 __" }),
      tap("FACA está para CORTAR assim como CANETA está para:", ["escrever", "apagar", "pintar", "medir"], "escrever"),
      tap("Se A é maior que B, e B é maior que C, então A é ___ que C:", ["menor", "igual", "não dá para saber", "maior"], "maior"),
    ],
    leitura: [
      say("Leia o texto em voz alta.", T.reciclar, READ_ALOUD),
      tap("Segundo o texto, reciclar:", ["Reduz o lixo e economiza matéria-prima", "Aumenta o lixo nos aterros", "Não muda nada", "Só serve para papel"], "Reduz o lixo e economiza matéria-prima", { stimulus: T.reciclar }),
      tap("O que o texto diz sobre o lixo das cidades?", ["Só uma pequena parte é reciclada", "Todo ele é reciclado", "Ele é queimado", "Ele vai para o mar"], "Só uma pequena parte é reciclada", { stimulus: T.reciclar }),
      tap("'Mesmo assim', no texto, indica:", ["contraste", "causa", "tempo", "lugar"], "contraste", { stimulus: T.reciclar }),
    ],
    escrita: [
      build("CONSCIÊNCIA", "S"),
      tap("Qual frase está CORRETA?", ["Houveram muitos problemas.", "Houve muitos problemas.", "Houveram muito problema.", "Houve muitos problema."], "Houve muitos problemas."),
      tap("Qual palavra está escrita certa?", ["beneficente", "beneficiente", "benefissente", "benefisciente"], "beneficente"),
      tap("Complete: 'Ele saiu cedo ___ chegar a tempo.'", ["para", "mas", "porque", "embora"], "para"),
    ],
    aritmetica: [
      tap("Um produto custa R$ 80 e tem 25% de desconto. Preço final:", ["R$ 55", "R$ 60", "R$ 20", "R$ 75"], "R$ 60"),
      tap("Se 3 canetas custam R$ 9, uma caneta custa:", ["R$ 3", "R$ 6", "R$ 9", "R$ 2"], "R$ 3"),
      tap("Resolva: x ÷ 2 = 8", ["x = 4", "x = 16", "x = 6", "x = 10"], "x = 16"),
      tap("2,5 + 1,75 = ?", ["4,25", "3,25", "4,5", "3,75"], "4,25"),
    ],
  },
  15: {
    visual: [
      tap("Qual número continua a sequência?", ["13", "12", "11", "14"], "13", { stimulus: "1, 1, 2, 3, 5, 8, __" }),
      tap("Qual letra continua a sequência?", ["Q", "P", "R", "N"], "Q", { stimulus: "A, E, I, M, __" }),
      tap("Qual NÃO pertence ao grupo?", ["Marte", "Vênus", "Sol", "Júpiter"], "Sol"),
      tap("Um relógio marca 3 horas em ponto. Qual é o ângulo entre os ponteiros?", ["45°", "60°", "90°", "120°"], "90°", { stimulus: "🕒" }),
    ],
    leitura: [
      say("Leia o texto em voz alta.", T.sono, READ_ALOUD),
      tap("Quantas horas de sono o texto indica?", ["Cerca de nove", "Cerca de seis", "Cerca de doze", "Cerca de quatro"], "Cerca de nove", { stimulus: T.sono }),
      tap("Segundo o texto, dormir pouco prejudica:", ["A memória e a atenção", "O apetite", "A visão", "A altura"], "A memória e a atenção", { stimulus: T.sono }),
      tap("'Prejudica' pode ser substituído por:", ["atrapalha", "melhora", "organiza", "aumenta"], "atrapalha", { stimulus: T.sono }),
    ],
    escrita: [
      build("ANSIEDADE", "C"),
      tap("Qual frase está CORRETA?", ["Fazem dois anos que não viajo.", "Faz dois anos que não viajo.", "Fazem dois ano que não viajo.", "Faz dois ano que não viajo."], "Faz dois anos que não viajo."),
      tap("Qual palavra está escrita certa?", ["cabeleireiro", "cabelereiro", "cabeleleiro", "cabelerreiro"], "cabeleireiro"),
      tap("Qual frase usa a vírgula corretamente?", ["Maria, chegou cedo.", "Maria chegou, cedo.", "Maria chegou cedo, e.", "Maria chegou cedo, mas saiu logo."], "Maria chegou cedo, mas saiu logo."),
    ],
    aritmetica: [
      tap("30% de 150 = ?", ["45", "50", "35", "30"], "45"),
      tap("Resolva: 4x − 3 = 13", ["x = 3", "x = 4", "x = 5", "x = 2"], "x = 4"),
      tap("Um carro percorre 240 km em 3 horas. Velocidade média:", ["60 km/h", "70 km/h", "80 km/h", "90 km/h"], "80 km/h"),
      tap("Qual fração é igual a 0,5?", ["1/4", "1/2", "2/3", "3/4"], "1/2"),
    ],
  },
  16: {
    visual: [
      tap("Qual número continua a sequência?", ["64", "48", "56", "60"], "64", { stimulus: "4, 8, 16, 32, __" }),
      tap("O que vem depois?", ["🔺", "🔵", "🟢", "⭐"], "🔵", { stimulus: "🔺 🔵 🔵 🟢 🟢 🟢 🔺 🔵 __" }),
      tap("ÁGUA está para SEDE assim como COMIDA está para:", ["fome", "prato", "cozinha", "sabor"], "fome"),
      tap("Qual afirmação é FALSA?", ["Todo quadrado é um retângulo.", "Todo retângulo é um quadrado.", "Todo quadrado tem 4 lados.", "Todo retângulo tem 4 ângulos retos."], "Todo retângulo é um quadrado."),
    ],
    leitura: [
      say("Leia o texto em voz alta.", T.vacina, READ_ALOUD),
      tap("Segundo o texto, as vacinas:", ["Treinam a defesa do corpo sem causar a doença", "Causam a doença de propósito", "Substituem o sistema de defesa", "Só funcionam em crianças"], "Treinam a defesa do corpo sem causar a doença", { stimulus: T.vacina }),
      tap("O que acontece quando o vírus real aparece?", ["O organismo já sabe como reagir", "O organismo esquece a vacina", "A vacina para de funcionar", "Nada acontece"], "O organismo já sabe como reagir", { stimulus: T.vacina }),
      tap("'Por isso', no texto, indica:", ["consequência", "oposição", "dúvida", "tempo"], "consequência", { stimulus: T.vacina }),
    ],
    escrita: [
      build("ASCENSÃO", "C"),
      tap("Qual frase está CORRETA?", ["Haviam poucas vagas.", "Havia poucas vagas.", "Haviam pouca vaga.", "Havia poucas vaga."], "Havia poucas vagas."),
      tap("Qual frase está na voz PASSIVA?", ["O aluno leu o livro.", "O livro foi lido pelo aluno.", "O aluno vai ler o livro.", "O aluno lia o livro."], "O livro foi lido pelo aluno."),
      tap("Qual palavra está escrita certa?", ["quiseram", "quizeram", "quiserão", "quizerão"], "quiseram"),
    ],
    aritmetica: [
      tap("Resolva: 2(x + 3) = 14", ["x = 4", "x = 5", "x = 7", "x = 3"], "x = 4"),
      tap("Um produto de R$ 120 aumentou 15%. Novo preço:", ["R$ 135", "R$ 138", "R$ 140", "R$ 132"], "R$ 138"),
      tap("Média de 7, 9, 11 e 13:", ["9", "10", "11", "12"], "10"),
      tap("2³ + 5 = ?", ["11", "13", "16", "30"], "13"),
    ],
  },
  17: {
    visual: [
      tap("Qual número continua a sequência?", ["17", "19", "15", "21"], "17", { stimulus: "2, 3, 5, 7, 11, 13, __" }),
      tap("Qual letra continua a sequência?", ["J", "K", "H", "L"], "J", { stimulus: "Z, X, V, T, R, P, N, L, __" }),
      tap("Qual NÃO pertence ao grupo?", ["fêmur", "tíbia", "pulmão", "úmero"], "pulmão"),
      tap("Se todo A é B e nenhum B é C, então:", ["nenhum A é C", "todo A é C", "algum A é C", "todo C é A"], "nenhum A é C"),
    ],
    leitura: [
      say("Leia o texto em voz alta.", T.solar, READ_ALOUD),
      tap("Por que a energia solar cresce no Brasil?", ["O custo dos painéis caiu", "O sol ficou mais forte", "As hidrelétricas fecharam", "O governo proibiu outras fontes"], "O custo dos painéis caiu", { stimulus: T.solar }),
      tap("De onde vem a maior parte da eletricidade do país?", ["Das hidrelétricas", "Dos painéis solares", "Do vento", "Do carvão"], "Das hidrelétricas", { stimulus: T.solar }),
      tap("'Ainda assim', no texto, introduz:", ["uma ressalva", "uma causa", "um exemplo", "uma conclusão"], "uma ressalva", { stimulus: T.solar }),
    ],
    escrita: [
      build("SUSCETÍVEL", "S"),
      tap("Qual frase está CORRETA?", ["Prefiro café do que chá.", "Prefiro café a chá.", "Prefiro mais café que chá.", "Prefiro café de que chá."], "Prefiro café a chá."),
      tap("Qual palavra está escrita certa?", ["pretensão", "pretenção", "pretenssão", "pretenzão"], "pretensão"),
      tap("Qual frase está no sentido FIGURADO?", ["O anel é de ouro.", "Comprei ouro na loja.", "O ouro é um metal.", "Ela tem um coração de ouro."], "Ela tem um coração de ouro."),
    ],
    aritmetica: [
      tap("Resolva: x² = 49, com x positivo", ["x = 6", "x = 7", "x = 8", "x = 24"], "x = 7"),
      tap("Juros simples: R$ 1.000 a 2% ao mês, por 3 meses. Juros:", ["R$ 20", "R$ 40", "R$ 60", "R$ 600"], "R$ 60"),
      tap("5 máquinas fazem 100 peças em 1 hora. 10 máquinas fazem, em 1 hora:", ["50", "100", "200", "500"], "200"),
      tap("Quanto é 3/4 de 80?", ["40", "50", "60", "70"], "60"),
    ],
  },
  18: {
    visual: [
      tap("Qual número continua a sequência?", ["37", "36", "38", "35"], "37", { stimulus: "1, 2, 4, 7, 11, 16, 22, 29, __" }),
      tap("O que vem depois?", ["🔴", "🔵", "🟢", "🟡"], "🟡", { stimulus: "🔴 🔵 🟢 🟡  🔵 🟢 🟡 🔴  🟢 🟡 🔴 🔵  __" }),
      tap("MÉDICO está para HOSPITAL assim como PROFESSOR está para:", ["escola", "livro", "aluno", "prova"], "escola"),
      tap("'Se chove, a rua molha. A rua está seca.' Conclusão válida:", ["Não choveu", "Choveu", "A rua vai molhar", "Não dá para saber"], "Não choveu"),
    ],
    leitura: [
      say("Leia o texto em voz alta.", T.ia, READ_ALOUD),
      tap("Qual risco o texto cita?", ["Inventar informações", "Demorar demais", "Gastar energia", "Apagar arquivos"], "Inventar informações", { stimulus: T.ia }),
      tap("O que o texto diz que continua indispensável?", ["Conferir as fontes", "Resumir textos", "Usar mais ferramentas", "Ler menos"], "Conferir as fontes", { stimulus: T.ia }),
      tap("'Indispensável' significa:", ["necessário", "opcional", "raro", "caro"], "necessário", { stimulus: T.ia }),
    ],
    escrita: [
      build("REIVINDICAR", "E"),
      tap("Qual frase está CORRETA?", ["Assisti o filme ontem.", "Assisti ao filme ontem.", "Assisti no filme ontem.", "Assisti do filme ontem."], "Assisti ao filme ontem."),
      tap("Qual frase tem DUPLO sentido?", ["O menino viu a menina com o binóculo.", "O menino comeu a maçã.", "A menina correu rápido.", "O cão latiu alto."], "O menino viu a menina com o binóculo."),
      tap("Qual palavra está escrita certa?", ["impecilho", "empecilho", "impessilho", "empessilho"], "empecilho"),
    ],
    aritmetica: [
      tap("x + y = 10 e x − y = 2. Quanto vale x?", ["4", "5", "6", "8"], "6"),
      tap("R$ 2.000 rendem 5% ao ano. Após 1 ano, o total é:", ["R$ 2.050", "R$ 2.100", "R$ 2.500", "R$ 2.010"], "R$ 2.100"),
      tap("Probabilidade de sair 6 em um dado comum:", ["1/2", "1/3", "1/6", "1/12"], "1/6"),
      tap("Área de um retângulo de 8 m por 5 m:", ["13 m²", "26 m²", "40 m²", "45 m²"], "40 m²"),
    ],
  },
  19: {
    visual: [
      tap("Qual número continua a sequência?", ["121", "111", "100", "132"], "121", { stimulus: "1, 4, 9, 16, 25, 36, 49, 64, 81, 100, __" }),
      tap("Qual letra continua a sequência?", ["U", "T", "V", "S"], "U", { stimulus: "C, F, I, L, O, R, __" }),
      tap("Qual NÃO pertence ao grupo?", ["Português", "Espanhol", "Italiano", "Alemão"], "Alemão"),
      tap("'Todo estudante da turma passou. Pedro é da turma.' Conclusão válida:", ["Pedro passou", "Pedro não passou", "Pedro não é estudante", "Não dá para saber"], "Pedro passou"),
    ],
    leitura: [
      say("Leia o texto em voz alta.", T.casa, READ_ALOUD),
      tap("Qual vantagem do trabalho em casa o texto cita?", ["Reduz o tempo de deslocamento", "Aumenta o salário", "Dispensa disciplina", "Elimina o descanso"], "Reduz o tempo de deslocamento", { stimulus: T.casa }),
      tap("O que relatam as empresas que combinam os dois formatos?", ["Menos rotatividade", "Mais deslocamento", "Menos disciplina", "Mais descanso"], "Menos rotatividade", { stimulus: T.casa }),
      tap("'Rotatividade', aqui, se refere a:", ["troca frequente de funcionários", "giro das cadeiras", "horário rotativo", "viagens de trabalho"], "troca frequente de funcionários", { stimulus: T.casa }),
    ],
    escrita: [
      build("CONSEQUÊNCIA", "S"),
      tap("Qual frase está CORRETA?", ["Fui na reunião ontem.", "Fui à reunião ontem.", "Fui a reunião ontem.", "Fui em a reunião ontem."], "Fui à reunião ontem."),
      tap("Qual frase é um FATO (não opinião)?", ["A água ferve a 100 °C ao nível do mar.", "Chá é melhor que café.", "Esse filme é chato.", "Verão é a melhor estação."], "A água ferve a 100 °C ao nível do mar."),
      tap("Qual palavra está escrita certa?", ["salsicha", "salcicha", "salchicha", "sausicha"], "salsicha"),
    ],
    aritmetica: [
      tap("Resolva: 3x − 7 = 2x + 5", ["x = 2", "x = 12", "x = −2", "x = 5"], "x = 12"),
      tap("Um produto custa R$ 250 e é vendido com 12% de desconto. Preço final:", ["R$ 220", "R$ 225", "R$ 230", "R$ 238"], "R$ 220"),
      tap("Média ponderada: nota 8 (peso 2) e nota 5 (peso 1):", ["6", "6,5", "7", "7,5"], "7"),
      tap("Quantos minutos há em 2,5 horas?", ["120", "130", "150", "180"], "150"),
    ],
  },
};

export const COGNITIVE_BANK: Record<number, Record<CognitiveDomain, CognitiveItem[]>> = Object.fromEntries(
  Object.entries(DRAFTS).map(([age, domains]) => [
    Number(age),
    Object.fromEntries(
      COGNITIVE_DOMAINS.map((domain) => [
        domain,
        domains[domain].map((draft, index): CognitiveItem => ({ ...draft, id: `c${age}-${domain}-${index + 1}` }) as CognitiveItem),
      ]),
    ) as Record<CognitiveDomain, CognitiveItem[]>,
  ]),
);

export function isCognitiveAge(age: number): boolean {
  return Number.isInteger(age) && age >= COGNITIVE_MIN_AGE && age <= COGNITIVE_MAX_AGE;
}

export function itemsFor(age: number, domain: CognitiveDomain): CognitiveItem[] {
  return COGNITIVE_BANK[age]?.[domain] ?? [];
}

/** Confere uma montagem de letras contra o alvo (mesma ordem, mesmas letras). */
export function buildMatches(item: BuildItem, placed: string[]): boolean {
  return placed.length === item.target.length && placed.every((letter, index) => letter === item.target[index]);
}
