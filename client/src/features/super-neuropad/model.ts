/**
 * Super NeuroPad Game — modelo, banco de itens e motor de resultado.
 *
 * Reúne, em uma única jornada de cinco fases, o que hoje está espalhado em
 * quatro abas que continuam existindo: Sonda 10, OBS-10 (Pré-Consulta por
 * faixa etária), Teste de Reconhecimento Visual e Testes Cognitivos por Faixa
 * Etária. O jogo é aplicado pela secretária, sem câmera, com resposta direta
 * da criança (toque na tela) ou registro imediato da aplicadora (fala/fazer).
 *
 * Contrato clínico (não negociável):
 *   • triagem autoral de déficits GROSSEIROS por faixa etária em anos;
 *   • todo item tem certo e errado explícitos — sem julgamento subjetivo;
 *   • contagens e faixas operacionais são autorais: não são norma, percentil,
 *     idade equivalente, escore psicométrico nem diagnóstico;
 *   • a criança nunca vê certo/errado; a leitura final é do médico;
 *   • nada é persistido no navegador nem enviado por rede; o resultado sai em
 *     PDF detalhado gerado localmente.
 */

export const SUPER_NEUROPAD_VERSION = "2026-09-26.1";
export const SUPER_NEUROPAD_TITLE = "Super NeuroPad Game";
export const SUPER_NEUROPAD_ROUTE = "/super-neuropad-game";
export const SUPER_NEUROPAD_NATURE =
  "Jogo de triagem autoral para déficits grosseiros, aplicado pela recepção na pré-consulta. Não é instrumento psicométrico, não gera escore normativo, percentil, idade equivalente nem diagnóstico. A leitura e a conclusão pertencem ao médico.";
export const SUPER_NEUROPAD_SOURCES = [
  "Sonda 10 · Avaliação Direta (memória, atenção, linguagem e regra)",
  "OBS-10 · Pré-Consulta por Faixa Etária (núcleo motor e comandos com critério)",
  "Teste de Reconhecimento Visual (reconhecer e nomear figuras por idade)",
  "Testes Cognitivos por Faixa Etária (leitura, escrita e aritmética graduadas)",
] as const;

export const MIN_AGE_YEARS = 2;
export const MAX_AGE_YEARS = 17;

// ─────────────────────────────── faixas etárias (anos) ───────────────────────────────
export type BandId = "2-3" | "4-5" | "6-7" | "8-9" | "10-12" | "13-17";

export interface AgeBand {
  id: BandId;
  label: string;
  min: number;
  max: number;
  icon: string;
  kit: string[];
}

export const AGE_BANDS: readonly AgeBand[] = [
  { id: "2-3", label: "2 a 3 anos", min: 2, max: 3, icon: "🌱", kit: ["Bola macia", "Lápis grosso e papel", "3 blocos grandes", "Pano e um brinquedo pequeno", "Caixa aberta"] },
  { id: "4-5", label: "4 a 5 anos", min: 4, max: 5, icon: "🌿", kit: ["Lápis e papel", "Caixa com tampa", "Espaço livre para pular"] },
  { id: "6-7", label: "6 a 7 anos", min: 6, max: 7, icon: "🚀", kit: ["Lápis e papel", "Mesa para bater a mão (regra SOL/LUA)"] },
  { id: "8-9", label: "8 a 9 anos", min: 8, max: 9, icon: "🧭", kit: ["Lápis e papel", "Linha reta no chão (fita ou rejunte)", "Mesa para a regra SOL/LUA"] },
  { id: "10-12", label: "10 a 12 anos", min: 10, max: 12, icon: "🧠", kit: ["Lápis e papel", "Espaço livre para equilíbrio"] },
  { id: "13-17", label: "13 a 17 anos", min: 13, max: 17, icon: "✨", kit: ["Lápis e papel", "Linha reta no chão (fita ou rejunte)"] },
] as const;

export function bandForYears(years: number): AgeBand | undefined {
  if (!Number.isInteger(years)) return undefined;
  return AGE_BANDS.find((band) => years >= band.min && years <= band.max);
}

// ─────────────────────────────── personagens (RPG) ───────────────────────────────
export interface Character {
  id: string;
  emoji: string;
  name: string;
  role: string;
  power: string;
}

export const CHARACTERS: readonly Character[] = [
  { id: "raposa", emoji: "🦊", name: "Raposa", role: "Ninja", power: "Olhos rápidos" },
  { id: "dragao", emoji: "🐉", name: "Dragão", role: "Mago", power: "Fogo das palavras" },
  { id: "unicornio", emoji: "🦄", name: "Unicórnio", role: "Cavaleiro", power: "Chifre dos números" },
  { id: "robo", emoji: "🤖", name: "Robô", role: "Guerreiro", power: "Memória de aço" },
  { id: "fada", emoji: "🧚", name: "Fada", role: "Arqueira", power: "Asas ligeiras" },
  { id: "panda", emoji: "🐼", name: "Panda", role: "Curandeiro", power: "Calma de mestre" },
] as const;

// ─────────────────────────────── fases (mundos) ───────────────────────────────
export type PhaseId = "olhos" | "palavras" | "numeros" | "memoria" | "corpo";

export interface Phase {
  id: PhaseId;
  order: number;
  name: string;
  emoji: string;
  domain: string;
  tagline: string;
  badge: string;
  operator: string;
  source: string;
  /** O que conferir na consulta quando a fase fica fora do esperado (roteiro autoral, não diagnóstico). */
  consult: string;
  /** Abas de origem que aprofundam a fase, com rota interna. */
  routes: readonly { label: string; href: string }[];
}

export const PHASES: readonly Phase[] = [
  {
    id: "olhos", order: 1, name: "Floresta dos Olhos", emoji: "🌳", domain: "Reconhecimento visual",
    tagline: "Encontre a figura certa entre as folhas.", badge: "Explorador da Floresta",
    operator: "Leia a pergunta em voz alta e deixe a criança tocar na tela. Se ela apontar sem tocar, toque na figura que ela apontou. Não dê pistas.",
    source: "Teste de Reconhecimento Visual · Testes Cognitivos (visual)",
    consult: "Conferir visão (óculos, consulta oftalmológica recente), nomeação e pareamento de figuras com mais itens, atenção visual durante a tarefa e se a criança entendeu o formato de tocar na tela.",
    routes: [{ label: "Reconhecimento Visual", href: "/testes-reconhecimento" }, { label: "Testes Cognitivos", href: "/testes-cognitivos" }],
  },
  {
    id: "palavras", order: 2, name: "Ilha das Palavras", emoji: "🏝️", domain: "Linguagem e leitura",
    tagline: "Sons, nomes e frases escondidos na areia.", badge: "Navegante das Palavras",
    operator: "Fale devagar, uma vez; pode repetir uma única vez. Nas tarefas de fala, marque acerto só quando a resposta bater com o critério.",
    source: "Sonda 10 (linguagem) · Testes Cognitivos (leitura e escrita)",
    consult: "Conferir história de linguagem e audição, compreensão de ordens em conversa livre, vocabulário e, na idade escolar, leitura e escrita conforme a série; separar timidez de dificuldade real.",
    routes: [{ label: "Sonda 10", href: "/testes-diretos" }, { label: "Testes Cognitivos", href: "/testes-cognitivos" }],
  },
  {
    id: "numeros", order: 3, name: "Montanha dos Números", emoji: "⛰️", domain: "Quantidade e aritmética",
    tagline: "Cada conta é um degrau até o topo.", badge: "Alpinista dos Números",
    operator: "Leia a pergunta; a criança responde tocando. Sem contar junto, sem dica com os dedos.",
    source: "Testes Cognitivos (aritmética) · Sonda 10 (conceitos)",
    consult: "Conferir contagem, comparação de quantidades e cálculo conforme a série, escolaridade e apoio pedagógico; checar se a dificuldade é só numérica ou acompanha leitura e atenção.",
    routes: [{ label: "Testes Cognitivos", href: "/testes-cognitivos" }, { label: "Sonda 10", href: "/testes-diretos" }],
  },
  {
    id: "memoria", order: 4, name: "Caverna da Memória", emoji: "🔦", domain: "Memória e atenção",
    tagline: "Guarde o que viu e ouviu para atravessar a caverna.", badge: "Guardião da Caverna",
    operator: "Diga a sequência uma vez, em ritmo de um item por segundo. Acerto só quando a repetição for exata conforme o critério.",
    source: "Sonda 10 (memória operacional e regra) · OBS-10 (regra SOL/LUA)",
    consult: "Conferir atenção sustentada e memória operacional com mais itens, sono, rotina e distratibilidade na consulta; repetir a regra com demonstração para separar não entender de não sustentar.",
    routes: [{ label: "Sonda 10", href: "/testes-diretos" }, { label: "OBS-10", href: "/avaliacao-pre-consulta-faixa-etaria" }],
  },
  {
    id: "corpo", order: 5, name: "Torre do Corpo", emoji: "🏰", domain: "Coordenação motora e grafismo",
    tagline: "Equilíbrio, mãos e traços para subir a torre.", badge: "Mestre da Torre",
    operator: "Demonstre uma vez quando o comando disser. Fique ao lado nas tarefas de equilíbrio. Marque acerto só quando o critério for cumprido inteiro.",
    source: "OBS-10 (núcleo motor) · Sonda 10 (visuoconstrução) · Testes Cognitivos (escrita)",
    consult: "Exame motor dirigido na consulta: tônus, equilíbrio, marcha, coordenação fina, preensão do lápis, grafismo e lateralidade; conferir se o kit estava disponível e se a demonstração foi feita.",
    routes: [{ label: "OBS-10", href: "/avaliacao-pre-consulta-faixa-etaria" }, { label: "Sonda 10", href: "/testes-diretos" }],
  },
] as const;

export const PHASE_ORDER: readonly PhaseId[] = ["olhos", "palavras", "numeros", "memoria", "corpo"];
export const ITEMS_PER_PHASE = 4;

export function phaseById(id: PhaseId): Phase {
  const phase = PHASES.find((entry) => entry.id === id);
  if (!phase) throw new Error(`Fase desconhecida: ${id}`);
  return phase;
}

// ─────────────────────────────── itens ───────────────────────────────
export type ShapeId = "circulo" | "cruz" | "quadrado" | "triangulo" | "losango" | "pentagono";

export interface Option {
  /** O que a criança vê no botão (emoji, número ou palavra). */
  art: string;
  /** Nome textual da opção, usado no registro e no PDF. */
  label: string;
  size?: "sm" | "lg";
}

/** A criança responde tocando na tela; o jogo confere sozinho. */
export interface TouchItem {
  kind: "toque";
  id: string;
  prompt: string;
  options: Option[];
  answer: string;
  /** Estímulo mostrado antes das opções e escondido pela aplicadora (memória visual). */
  preview?: string;
  big?: boolean;
}

/** A aplicadora faz a pergunta e confere a resposta falada contra o critério. */
export interface SpeakItem {
  kind: "fala";
  id: string;
  prompt: string;
  expected: string;
  stimulus?: string;
}

/** A criança executa uma ação; a aplicadora confere contra o critério. */
export interface DoItem {
  kind: "fazer";
  id: string;
  prompt: string;
  expected: string;
  stimulus?: string;
  shape?: ShapeId;
}

export type Item = TouchItem | SpeakItem | DoItem;

export const KIND_LABELS: Record<Item["kind"], string> = {
  toque: "Toque na tela (conferido pelo jogo)",
  fala: "Resposta falada (conferida pela aplicadora)",
  fazer: "Ação executada (conferida pela aplicadora)",
};

const o = (art: string, label: string, size?: Option["size"]): Option => (size ? { art, label, size } : { art, label });
const toque = (id: string, prompt: string, options: Option[], answer: string, extra: Partial<Pick<TouchItem, "preview" | "big">> = {}): TouchItem => ({ kind: "toque", id, prompt, options, answer, ...extra });
const fala = (id: string, prompt: string, expected: string, stimulus?: string): SpeakItem => (stimulus ? { kind: "fala", id, prompt, expected, stimulus } : { kind: "fala", id, prompt, expected });
const fazer = (id: string, prompt: string, expected: string, extra: Partial<Pick<DoItem, "stimulus" | "shape">> = {}): DoItem => ({ kind: "fazer", id, prompt, expected, ...extra });

const COLORS4 = [o("🟡", "Amarelo"), o("🔴", "Vermelho"), o("🔵", "Azul"), o("🟢", "Verde")];

/**
 * Banco: 6 faixas × 5 fases × 4 itens. Cada item é resolvível sozinho, com o
 * estímulo inteiro visível. Dificuldade propositalmente abaixo do esperado
 * para a faixa: o objetivo é flagrar déficit grosseiro, não medir talento.
 * A posição da alternativa correta varia; a UI ainda embaralha em tempo real.
 */
export const ITEM_BANK: Record<BandId, Record<PhaseId, Item[]>> = {
  "2-3": {
    olhos: [
      toque("2-3.olhos.1", "Toque no CACHORRO", [o("🐱", "Gato"), o("🐶", "Cachorro"), o("🐟", "Peixe")], "Cachorro", { big: true }),
      toque("2-3.olhos.2", "Toque na BOLA", [o("🍎", "Maçã"), o("⚽", "Bola"), o("🚗", "Carro")], "Bola", { big: true }),
      toque("2-3.olhos.3", "Toque na BANANA", [o("🍌", "Banana"), o("🍎", "Maçã"), o("🥕", "Cenoura")], "Banana", { big: true }),
      toque("2-3.olhos.4", "Toque no CARRO", [o("🐱", "Gato"), o("👟", "Sapato"), o("🚗", "Carro")], "Carro", { big: true }),
    ],
    palavras: [
      fala("2-3.palavras.1", "Mostre a figura e pergunte: “O que é isto?”", "Diz “gato” (aceita “gatinho” ou “miau”)", "🐱"),
      fala("2-3.palavras.2", "Mostre a figura e pergunte: “O que é isto?”", "Diz “banana”", "🍌"),
      fala("2-3.palavras.3", "Diga: “Mostre o seu nariz.”", "Aponta ou toca o próprio nariz", "👃"),
      fala("2-3.palavras.4", "Pergunte: “Que barulho o cachorro faz?”", "Diz “au-au” ou “late”", "🐶"),
    ],
    numeros: [
      toque("2-3.numeros.1", "Toque onde tem MUITAS bolinhas", [o("⚫", "Uma bolinha"), o("⚫⚫⚫⚫⚫", "Muitas bolinhas")], "Muitas bolinhas", { big: true }),
      toque("2-3.numeros.2", "Toque no elefante GRANDE", [o("🐘", "Elefante pequeno", "sm"), o("🐘", "Elefante grande", "lg")], "Elefante grande", { big: true }),
      fala("2-3.numeros.3", "Coloque 3 blocos na mesa e peça: “Me dá só UM.”", "Entrega exatamente um bloco", "🧱🧱🧱"),
      toque("2-3.numeros.4", "Toque onde tem DOIS gatinhos", [o("🐱", "Um gato"), o("🐱🐱🐱", "Três gatos"), o("🐱🐱", "Dois gatos")], "Dois gatos", { big: true }),
    ],
    memoria: [
      fala("2-3.memoria.1", "Diga: “Repita: BOLA.”", "Repete a palavra “bola”", "🗣️"),
      fala("2-3.memoria.2", "Diga: “Repita: 2 – 5.”", "Repete os dois números na ordem", "2 · 5"),
      fazer("2-3.memoria.3", "Esconda o brinquedo embaixo do pano na frente da criança e pergunte: “Cadê?”", "Levanta o pano e encontra o brinquedo", { stimulus: "🧸" }),
      fala("2-3.memoria.4", "Diga: “Pegue o lápis e coloque na caixa.” (comando de 2 partes)", "Faz as duas ações na ordem", "✏️ ➜ 📦"),
    ],
    corpo: [
      fazer("2-3.corpo.1", "Peça: “Corra até a porta e volte.”", "Corre ou anda rápido sem cair", { stimulus: "🏃" }),
      fazer("2-3.corpo.2", "Coloque a bola no chão e peça: “Chute a bola.”", "Chuta a bola sem se apoiar", { stimulus: "⚽" }),
      fazer("2-3.corpo.3", "Dê o lápis e peça: “Faça um risco no papel.”", "Faz um traço ou rabisco no papel", { stimulus: "✏️" }),
      fazer("2-3.corpo.4", "Peça: “Empilhe os blocos.” (3 blocos)", "Empilha 3 blocos sem derrubar", { stimulus: "🧱" }),
    ],
  },
  "4-5": {
    olhos: [
      toque("4-5.olhos.1", "Toque no TRIÂNGULO", [o("🟦", "Quadrado"), o("🔺", "Triângulo"), o("⚫", "Círculo"), o("⭐", "Estrela")], "Triângulo", { big: true }),
      toque("4-5.olhos.2", "Toque na cor AZUL", COLORS4, "Azul", { big: true }),
      toque("4-5.olhos.3", "Toque na figura IGUAL a esta: 🦋", [o("🐝", "Abelha"), o("🐞", "Joaninha"), o("🦋", "Borboleta"), o("🐛", "Lagarta")], "Borboleta", { big: true }),
      toque("4-5.olhos.4", "Toque no que a gente usa para BEBER", [o("🥤", "Copo"), o("🍴", "Garfo"), o("👟", "Sapato"), o("📚", "Livro")], "Copo", { big: true }),
    ],
    palavras: [
      fala("4-5.palavras.1", "Pergunte: “Qual é o seu nome?”", "Diz o próprio primeiro nome", "🙋"),
      fala("4-5.palavras.2", "Pergunte: “O que a gente faz com uma colher?”", "Responde “comer” (ou “tomar sopa”)", "🥄"),
      toque("4-5.palavras.3", "Toque no animal que MIA", [o("🐶", "Cachorro"), o("🐮", "Vaca"), o("🐱", "Gato"), o("🐸", "Sapo")], "Gato", { big: true }),
      fala("4-5.palavras.4", "Mostre a cor e pergunte: “Que cor é esta?”", "Diz “vermelho”", "🔴"),
    ],
    numeros: [
      toque("4-5.numeros.1", "Toque onde tem TRÊS maçãs", [o("🍎🍎", "Duas maçãs"), o("🍎🍎🍎", "Três maçãs"), o("🍎", "Uma maçã"), o("🍎🍎🍎🍎", "Quatro maçãs")], "Três maçãs", { big: true }),
      fala("4-5.numeros.2", "Diga: “Conte em voz alta até 5.”", "Conta 1, 2, 3, 4, 5 na ordem", "1 2 3 4 5"),
      toque("4-5.numeros.3", "Toque no número 2", [o("3", "Três"), o("5", "Cinco"), o("2", "Dois"), o("1", "Um")], "Dois", { big: true }),
      toque("4-5.numeros.4", "Toque no grupo que tem MAIS peixes", [o("🐟🐟🐟🐟🐟", "Cinco peixes"), o("🐟🐟", "Dois peixes")], "Cinco peixes", { big: true }),
    ],
    memoria: [
      fala("4-5.memoria.1", "Diga: “Repita: 4 – 9 – 2.”", "Repete os três números na ordem", "4 · 9 · 2"),
      fala("4-5.memoria.2", "Diga: “Repita: gato, bola, casa.”", "Repete as três palavras (qualquer ordem)", "🐱 ⚽ 🏠"),
      fala("4-5.memoria.3", "Diga: “Pegue o lápis, coloque na caixa e feche a caixa.” (3 partes)", "Faz as três ações", "✏️ ➜ 📦 ➜ 🔒"),
      toque("4-5.memoria.4", "Toque na figura que você VIU", [o("🐶", "Cachorro"), o("🐱", "Gato"), o("🍎", "Maçã"), o("🚗", "Carro")], "Cachorro", { preview: "🐶 🍌", big: true }),
    ],
    corpo: [
      fazer("4-5.corpo.1", "Peça: “Fique em um pé só.” Conte até 3 em voz alta.", "Fica 3 segundos em um pé sem apoiar", { stimulus: "🦩" }),
      fazer("4-5.corpo.2", "Peça: “Pule com os dois pés juntos.”", "Salta com os dois pés saindo do chão ao mesmo tempo", { stimulus: "🐸" }),
      fazer("4-5.corpo.3", "Mostre o círculo e peça: “Copie no papel.”", "Desenha uma forma fechada e arredondada", { shape: "circulo" }),
      fazer("4-5.corpo.4", "Mostre a cruz e peça: “Copie no papel.”", "Desenha duas linhas que se cruzam", { shape: "cruz" }),
    ],
  },
  "6-7": {
    olhos: [
      toque("6-7.olhos.1", "Qual figura é IGUAL a esta? 🔷", [o("🔶", "Losango laranja"), o("🔷", "Losango azul"), o("🔺", "Triângulo"), o("🟦", "Quadrado")], "Losango azul", { big: true }),
      toque("6-7.olhos.2", "O que vem depois? 🔴 🔵 🔴 🔵 🔴 __", [o("🔵", "Azul"), o("🔴", "Vermelho"), o("🟢", "Verde"), o("🟡", "Amarelo")], "Azul", { big: true }),
      toque("6-7.olhos.3", "Toque na figura DIFERENTE", [o("🍎", "Maçã"), o("🍎", "Maçã"), o("🍐", "Pera"), o("🍎", "Maçã")], "Pera", { big: true }),
      toque("6-7.olhos.4", "Toque na LETRA", [o("7", "Número sete"), o("★", "Estrela"), o("B", "Letra B"), o("♥", "Coração")], "Letra B", { big: true }),
    ],
    palavras: [
      toque("6-7.palavras.1", "Qual palavra começa com a letra M?", [o("mesa", "mesa"), o("sapo", "sapo"), o("foca", "foca"), o("rato", "rato")], "mesa"),
      toque("6-7.palavras.2", "Leia: “A bola é azul.” De que cor é a bola?", [o("Verde", "Verde"), o("Amarela", "Amarela"), o("Azul", "Azul"), o("Vermelha", "Vermelha")], "Azul"),
      toque("6-7.palavras.3", "Qual palavra rima com GATO?", [o("mesa", "mesa"), o("pato", "pato"), o("bola", "bola"), o("casa", "casa")], "pato"),
      fala("6-7.palavras.4", "Peça: “Leia em voz alta.”", "Lê “bola” corretamente", "BOLA"),
    ],
    numeros: [
      toque("6-7.numeros.1", "3 + 2 = ?", [o("4", "4"), o("5", "5"), o("6", "6"), o("3", "3")], "5", { big: true }),
      toque("6-7.numeros.2", "Qual número vem depois? 7, 8, 9, __", [o("11", "11"), o("6", "6"), o("10", "10"), o("12", "12")], "10", { big: true }),
      toque("6-7.numeros.3", "Qual número é MAIOR?", [o("3", "3"), o("8", "8"), o("5", "5"), o("2", "2")], "8", { big: true }),
      toque("6-7.numeros.4", "5 − 2 = ?", [o("2", "2"), o("4", "4"), o("1", "1"), o("3", "3")], "3", { big: true }),
    ],
    memoria: [
      fala("6-7.memoria.1", "Diga: “Repita: 6 – 1 – 8 – 3.”", "Repete os quatro números na ordem", "6 · 1 · 8 · 3"),
      fala("6-7.memoria.2", "Diga: “Repita ao contrário: 2 – 7.”", "Diz “7 – 2”", "2 · 7 ↩"),
      toque("6-7.memoria.3", "Qual figura NÃO apareceu?", [o("🍎", "Maçã"), o("🚗", "Carro"), o("🐸", "Sapo"), o("🐱", "Gato")], "Sapo", { preview: "🍎 🚗 🐱", big: true }),
      fala("6-7.memoria.4", "Regra: “Quando eu disser SOL, bata na mesa; quando disser LUA, mãos paradas.” Uma prática de cada. Sequência: SOL – LUA – SOL – SOL – LUA", "Acerta as 5 (bate só no SOL)", "☀️ 🌙"),
    ],
    corpo: [
      fazer("6-7.corpo.1", "Peça: “Fique em um pé só.” Conte até 5 em voz alta.", "Mantém 5 segundos sem apoiar", { stimulus: "🦩" }),
      fazer("6-7.corpo.2", "Peça: “Toque o seu nariz com o dedo e depois o meu dedo.” 3 vezes.", "Acerta o alvo nas 3 vezes", { stimulus: "👉👃" }),
      fazer("6-7.corpo.3", "Mostre o quadrado e peça: “Copie no papel.”", "Desenha quatro lados com cantos", { shape: "quadrado" }),
      fazer("6-7.corpo.4", "Peça: “Escreva o seu nome.”", "Escreve o primeiro nome legível", { stimulus: "✏️" }),
    ],
  },
  "8-9": {
    olhos: [
      toque("8-9.olhos.1", "O que vem depois? 🔺 🔵 🔺 🔵 🔺 __", [o("🔺", "Triângulo"), o("🔵", "Azul"), o("🟢", "Verde"), o("⭐", "Estrela")], "Azul", { big: true }),
      toque("8-9.olhos.2", "Qual figura é IGUAL a esta? ♠", [o("♣", "Paus"), o("♠", "Espadas"), o("♥", "Copas"), o("♦", "Ouros")], "Espadas", { big: true }),
      toque("8-9.olhos.3", "Quantos triângulos há? 🔺🔺🔺🔺", [o("3", "3"), o("5", "5"), o("4", "4"), o("2", "2")], "4", { big: true }),
      toque("8-9.olhos.4", "Qual NÃO é uma fruta?", [o("🍎", "Maçã"), o("🍇", "Uva"), o("🍌", "Banana"), o("🥕", "Cenoura")], "Cenoura", { big: true }),
    ],
    palavras: [
      toque("8-9.palavras.1", "Leia: “Ana foi ao mercado comprar pão.” O que Ana foi comprar?", [o("Leite", "Leite"), o("Pão", "Pão"), o("Bolo", "Bolo"), o("Suco", "Suco")], "Pão"),
      toque("8-9.palavras.2", "Qual palavra está escrita CERTA?", [o("caza", "caza"), o("kasa", "kasa"), o("casa", "casa"), o("cassa", "cassa")], "casa"),
      toque("8-9.palavras.3", "Qual é o CONTRÁRIO de ALTO?", [o("Grande", "Grande"), o("Largo", "Largo"), o("Longe", "Longe"), o("Baixo", "Baixo")], "Baixo"),
      fala("8-9.palavras.4", "Peça: “Leia em voz alta.”", "Lê a frase inteira sem trocar palavras", "O gato subiu no telhado."),
    ],
    numeros: [
      toque("8-9.numeros.1", "12 + 15 = ?", [o("26", "26"), o("27", "27"), o("25", "25"), o("28", "28")], "27", { big: true }),
      toque("8-9.numeros.2", "20 − 8 = ?", [o("11", "11"), o("13", "13"), o("12", "12"), o("14", "14")], "12", { big: true }),
      toque("8-9.numeros.3", "3 × 4 = ?", [o("7", "7"), o("9", "9"), o("14", "14"), o("12", "12")], "12", { big: true }),
      toque("8-9.numeros.4", "Qual número vem depois? 5, 10, 15, __", [o("20", "20"), o("18", "18"), o("25", "25"), o("16", "16")], "20", { big: true }),
    ],
    memoria: [
      fala("8-9.memoria.1", "Diga: “Repita: 3 – 8 – 1 – 6 – 4.”", "Repete os cinco números na ordem", "3 · 8 · 1 · 6 · 4"),
      fala("8-9.memoria.2", "Diga: “Repita ao contrário: 5 – 1 – 9.”", "Diz “9 – 1 – 5”", "5 · 1 · 9 ↩"),
      toque("8-9.memoria.3", "Qual figura NÃO apareceu?", [o("🍌", "Banana"), o("🏠", "Casa"), o("🚲", "Bicicleta"), o("🐶", "Cachorro")], "Casa", { preview: "🍌 🚲 🐶 ⭐", big: true }),
      fala("8-9.memoria.4", "Regra SOL/LUA (bate no SOL, para na LUA). Uma prática de cada. Sequência: SOL – SOL – LUA – SOL – LUA – LUA – SOL – LUA", "Acerta as 8 (bate só no SOL)", "☀️ 🌙"),
    ],
    corpo: [
      fazer("8-9.corpo.1", "Peça: “Fique em um pé só.” Conte até 8 em voz alta.", "Mantém 8 segundos sem apoiar", { stimulus: "🦩" }),
      fazer("8-9.corpo.2", "Peça: “Ande na linha com um pé na frente do outro, calcanhar encostando na ponta.” 6 passos.", "Dá 6 passos sem sair da linha", { stimulus: "👣" }),
      fazer("8-9.corpo.3", "Mostre o triângulo e peça: “Copie no papel.”", "Desenha três lados com cantos fechados", { shape: "triangulo" }),
      fazer("8-9.corpo.4", "Dite: “O sol é quente.” e peça para escrever.", "Escreve as quatro palavras legíveis", { stimulus: "✏️" }),
    ],
  },
  "10-12": {
    olhos: [
      toque("10-12.olhos.1", "O que vem depois? 🔴 🔴 🔵 🔴 🔴 🔵 🔴 __", [o("🔵", "Azul"), o("🔴", "Vermelho"), o("🟢", "Verde"), o("🟡", "Amarelo")], "Vermelho", { big: true }),
      toque("10-12.olhos.2", "Qual figura é IGUAL a esta? ♞", [o("♘", "Cavalo branco"), o("♝", "Bispo"), o("♞", "Cavalo preto"), o("♜", "Torre")], "Cavalo preto", { big: true }),
      toque("10-12.olhos.3", "Qual NÃO é um meio de transporte?", [o("🚗", "Carro"), o("✈️", "Avião"), o("🛏️", "Cama"), o("🚲", "Bicicleta")], "Cama", { big: true }),
      toque("10-12.olhos.4", "Quantas estrelas há? ⭐⭐⭐⭐⭐⭐", [o("5", "5"), o("7", "7"), o("6", "6"), o("8", "8")], "6", { big: true }),
    ],
    palavras: [
      toque("10-12.palavras.1", "Leia: “Pedro esqueceu o guarda-chuva e chegou molhado.” Por que Pedro chegou molhado?", [o("Caiu na piscina", "Caiu na piscina"), o("Estava chovendo", "Estava chovendo"), o("Tomou banho", "Tomou banho"), o("Lavou o carro", "Lavou o carro")], "Estava chovendo"),
      toque("10-12.palavras.2", "Qual palavra está escrita CERTA?", [o("jirafa", "jirafa"), o("gyrafa", "gyrafa"), o("girrafa", "girrafa"), o("girafa", "girafa")], "girafa"),
      toque("10-12.palavras.3", "Qual é o SINÔNIMO de FELIZ?", [o("Triste", "Triste"), o("Cansado", "Cansado"), o("Alegre", "Alegre"), o("Bravo", "Bravo")], "Alegre"),
      fala("10-12.palavras.4", "Peça: “Leia em voz alta.”", "Lê sem trocar nem omitir palavras", "A menina guardou os livros na estante depois da aula."),
    ],
    numeros: [
      toque("10-12.numeros.1", "48 + 27 = ?", [o("65", "65"), o("75", "75"), o("74", "74"), o("85", "85")], "75", { big: true }),
      toque("10-12.numeros.2", "7 × 8 = ?", [o("54", "54"), o("48", "48"), o("63", "63"), o("56", "56")], "56", { big: true }),
      toque("10-12.numeros.3", "36 ÷ 4 = ?", [o("9", "9"), o("8", "8"), o("6", "6"), o("7", "7")], "9", { big: true }),
      toque("10-12.numeros.4", "A METADE de 50 é?", [o("20", "20"), o("30", "30"), o("25", "25"), o("15", "15")], "25", { big: true }),
    ],
    memoria: [
      fala("10-12.memoria.1", "Diga: “Repita: 7 – 2 – 9 – 4 – 1 – 6.”", "Repete os seis números na ordem", "7 · 2 · 9 · 4 · 1 · 6"),
      fala("10-12.memoria.2", "Diga: “Repita ao contrário: 8 – 3 – 5 – 1.”", "Diz “1 – 5 – 3 – 8”", "8 · 3 · 5 · 1 ↩"),
      toque("10-12.memoria.3", "Qual figura NÃO apareceu?", [o("🍎", "Maçã"), o("🔑", "Chave"), o("🐱", "Gato"), o("🎈", "Balão")], "Chave", { preview: "🍎 🚗 🐱 ⭐ 🎈", big: true }),
      fala("10-12.memoria.4", "Diga: “Repita: mesa, lua, pão, rio, sapo.”", "Repete as cinco palavras (qualquer ordem)", "🗣️ ×5"),
    ],
    corpo: [
      fazer("10-12.corpo.1", "Peça: “Fique em um pé só, olhos abertos.” Conte até 10 em voz alta.", "Mantém 10 segundos sem apoiar", { stimulus: "🦩" }),
      fazer("10-12.corpo.2", "Demonstre e peça: “Toque cada dedo no polegar, do indicador ao mindinho, e volte.” 2 vezes.", "Faz a sequência completa 2 vezes sem pular dedo", { stimulus: "🖐️" }),
      fazer("10-12.corpo.3", "Mostre o losango e peça: “Copie no papel.”", "Desenha quatro lados com as pontas em cima e embaixo", { shape: "losango" }),
      fazer("10-12.corpo.4", "Dite: “O cachorro correu no parque.” e peça para escrever.", "Escreve as cinco palavras legíveis, sem omissão", { stimulus: "✏️" }),
    ],
  },
  "13-17": {
    olhos: [
      toque("13-17.olhos.1", "O que vem depois? ▲ ▶ ▼ ◀ ▲ ▶ __", [o("◀", "Seta para a esquerda"), o("▲", "Seta para cima"), o("▼", "Seta para baixo"), o("▶", "Seta para a direita")], "Seta para baixo", { big: true }),
      toque("13-17.olhos.2", "Qual figura é IGUAL a esta? ♛", [o("♕", "Rainha branca"), o("♚", "Rei preto"), o("♝", "Bispo"), o("♛", "Rainha preta")], "Rainha preta", { big: true }),
      toque("13-17.olhos.3", "Quantos quadrados há? 🟦🟦🟦🟦🟦🟦🟦", [o("6", "6"), o("7", "7"), o("8", "8"), o("9", "9")], "7", { big: true }),
      toque("13-17.olhos.4", "Qual ícone representa TEMPO?", [o("🍎", "Maçã"), o("🎒", "Mochila"), o("⏰", "Relógio"), o("🎧", "Fone")], "Relógio", { big: true }),
    ],
    palavras: [
      toque("13-17.palavras.1", "Leia: “Apesar da chuva, o jogo não foi cancelado.” O jogo aconteceu?", [o("Não", "Não"), o("Sim", "Sim"), o("Foi adiado", "Foi adiado"), o("Não dá para saber", "Não dá para saber")], "Sim"),
      toque("13-17.palavras.2", "Qual palavra está escrita CERTA?", [o("excessão", "excessão"), o("esceção", "esceção"), o("exceção", "exceção"), o("exceçao", "exceçao")], "exceção"),
      toque("13-17.palavras.3", "Qual é o ANTÔNIMO de GENEROSO?", [o("Bondoso", "Bondoso"), o("Egoísta", "Egoísta"), o("Alegre", "Alegre"), o("Rápido", "Rápido")], "Egoísta"),
      fala("13-17.palavras.4", "Peça: “Leia em voz alta.”", "Lê sem trocar, omitir ou inventar palavras", "O laboratório publicou os resultados da pesquisa na sexta-feira."),
    ],
    numeros: [
      toque("13-17.numeros.1", "125 + 87 = ?", [o("202", "202"), o("222", "222"), o("212", "212"), o("211", "211")], "212", { big: true }),
      toque("13-17.numeros.2", "9 × 7 = ?", [o("63", "63"), o("56", "56"), o("72", "72"), o("64", "64")], "63", { big: true }),
      toque("13-17.numeros.3", "144 ÷ 12 = ?", [o("11", "11"), o("13", "13"), o("12", "12"), o("14", "14")], "12", { big: true }),
      toque("13-17.numeros.4", "25% de 80 é?", [o("15", "15"), o("25", "25"), o("40", "40"), o("20", "20")], "20", { big: true }),
    ],
    memoria: [
      fala("13-17.memoria.1", "Diga: “Repita: 5 – 2 – 8 – 1 – 9 – 4.”", "Repete os seis números na ordem", "5 · 2 · 8 · 1 · 9 · 4"),
      fala("13-17.memoria.2", "Diga: “Repita ao contrário: 6 – 2 – 9 – 4.”", "Diz “4 – 9 – 2 – 6”", "6 · 2 · 9 · 4 ↩"),
      toque("13-17.memoria.3", "Qual figura NÃO apareceu?", [o("🔑", "Chave"), o("📚", "Livros"), o("🧢", "Boné"), o("⭐", "Estrela")], "Boné", { preview: "🔑 🎈 🚲 📚 🍇 ⭐", big: true }),
      fala("13-17.memoria.4", "Diga: “Repita: janela, cavalo, ponte, verde, relógio, pedra.”", "Repete pelo menos 5 das 6 palavras", "🗣️ ×6"),
    ],
    corpo: [
      fazer("13-17.corpo.1", "Peça: “Fique em um pé só, de olhos FECHADOS.” Conte até 5. Fique ao lado.", "Mantém 5 segundos sem abrir os olhos nem apoiar", { stimulus: "🦩" }),
      fazer("13-17.corpo.2", "Peça: “Ande na linha calcanhar-ponta, 8 passos, e volte.”", "Ida e volta sem sair da linha", { stimulus: "👣" }),
      fazer("13-17.corpo.3", "Mostre o pentágono e peça: “Copie no papel.”", "Desenha cinco lados fechados", { shape: "pentagono" }),
      fazer("13-17.corpo.4", "Dite: “Amanhã teremos prova de matemática na escola.” e peça para escrever.", "Escreve todas as palavras legíveis, sem omissão", { stimulus: "✏️" }),
    ],
  },
};

export function itemsFor(bandId: BandId, phaseId: PhaseId): Item[] {
  return ITEM_BANK[bandId][phaseId];
}

// ─────────────────────────────── glossário de figuras (PDF) ───────────────────────────────
// O construtor de PDF desenha em Latin-1 e descarta emoji. Para o registro
// não perder o estímulo ("O que vem depois? 🔴 🔵 …"), cada figura vira o seu
// nome textual entre colchetes. O glossário nasce dos rótulos das opções e é
// complementado pelos estímulos que só aparecem em enunciados.
const ART_EXTRA: Record<string, string> = {
  "👃": "nariz", "🧱": "bloco", "🗣️": "fala", "🧸": "brinquedo", "✏️": "lápis", "📦": "caixa", "🔒": "fechar",
  "🏃": "correr", "🦩": "um pé só", "👉": "dedo", "👣": "passos", "🖐️": "mão", "☀️": "SOL", "🌙": "LUA",
  "🙋": "criança", "🥄": "colher", "➜": "depois", "↩": "ao contrário",
};

function stripVariation(text: string): string {
  return text.replace(/\uFE0F/g, "");
}

function hasNonLatin(text: string): boolean {
  return /[^\t\n\r\x20-\x7E\xA0-\xFF–—‘’“”…≥≤→⇒←×]/u.test(text);
}

export const ART_GLOSSARY: ReadonlyArray<readonly [string, string]> = (() => {
  const map = new Map<string, string>();
  for (const band of Object.values(ITEM_BANK)) {
    for (const items of Object.values(band)) {
      for (const item of items) {
        if (item.kind !== "toque") continue;
        for (const option of item.options) {
          const art = stripVariation(option.art);
          if (hasNonLatin(art) && !map.has(art)) map.set(art, option.label.toLowerCase());
        }
      }
    }
  }
  for (const [art, label] of Object.entries(ART_EXTRA)) map.set(stripVariation(art), label);
  return [...map.entries()].sort((a, b) => b[0].length - a[0].length);
})();

/** Substitui figuras por nomes textuais entre colchetes, preservando o resto. */
export function describeArt(text: string): string {
  let out = stripVariation(text ?? "").replace(/−/g, "-");
  for (const [art, label] of ART_GLOSSARY) {
    if (out.includes(art)) out = out.split(art).join(`[${label}]`);
  }
  return out.replace(/\]\[/g, "] [");
}

/** Verdadeiro quando o texto sobrevive inteiro à normalização Latin-1 do PDF. */
export function pdfLossless(text: string): boolean {
  return !hasNonLatin(describeArt(text));
}

// ─────────────────────────────── embaralhamento determinístico ───────────────────────────────
export function shuffle<T>(values: readonly T[], seed: number): T[] {
  const out = [...values];
  let state = seed >>> 0;
  const random = () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// ─────────────────────────────── registro e resultado ───────────────────────────────
export type AnswerStatus = "acerto" | "erro" | "sem_resposta";

export const STATUS_LABELS: Record<AnswerStatus, string> = {
  acerto: "Acertou",
  erro: "Errou",
  sem_resposta: "Não respondeu",
};

export interface AnswerRecord {
  phaseId: PhaseId;
  itemId: string;
  kind: Item["kind"];
  prompt: string;
  expected: string;
  given: string;
  status: AnswerStatus;
  seconds: number;
  /** A aplicadora precisou repetir o comando uma vez (permitido uma única repetição). */
  repeated?: boolean;
}

export interface GameSession {
  version: string;
  ageYears: number;
  bandId: BandId;
  characterId: string;
  startedAt: string;
  finishedAt: string | null;
  answers: AnswerRecord[];
  /** Pausas feitas pela aplicadora durante a partida (proveniência do registro). */
  pauseCount?: number;
  /** Registros desfeitos e refeitos durante a partida (proveniência do registro). */
  undoCount?: number;
}

export function itemExpected(item: Item): string {
  return item.kind === "toque" ? item.answer : item.expected;
}

/** Registro a partir de um toque da criança: o jogo confere sozinho. */
export function recordTouch(item: TouchItem, phaseId: PhaseId, chosen: Option | null, seconds: number, repeated = false): AnswerRecord {
  const status: AnswerStatus = chosen === null ? "sem_resposta" : chosen.label === item.answer ? "acerto" : "erro";
  const record: AnswerRecord = { phaseId, itemId: item.id, kind: "toque", prompt: item.prompt, expected: item.answer, given: chosen ? chosen.label : "—", status, seconds: round1(seconds) };
  return repeated ? { ...record, repeated: true } : record;
}

/** Registro a partir da conferência da aplicadora contra o critério explícito. */
export function recordJudged(item: SpeakItem | DoItem, phaseId: PhaseId, status: AnswerStatus, seconds: number, repeated = false): AnswerRecord {
  const given = status === "acerto" ? "Cumpriu o critério" : status === "erro" ? "Não cumpriu o critério" : "—";
  // Estímulo textual (frase lida, sequência ditada) entra no registro; ícones ilustrativos não.
  const textual = item.stimulus && !/\p{Extended_Pictographic}/u.test(item.stimulus);
  const prompt = textual ? `${item.prompt} (estímulo: ${item.stimulus})` : item.prompt;
  const record: AnswerRecord = { phaseId, itemId: item.id, kind: item.kind, prompt, expected: item.expected, given, status, seconds: round1(seconds) };
  return repeated ? { ...record, repeated: true } : record;
}

/**
 * Desfaz o último registro (toque errado da aplicadora, criança que mudou de
 * ideia antes do próximo item). Devolve a lista sem o último item e a posição
 * exata (fase e índice) para o jogo reapresentar o mesmo desafio.
 */
export function undoLastAnswer(answers: readonly AnswerRecord[]): { answers: AnswerRecord[]; phaseId: PhaseId; itemIndex: number } | null {
  if (answers.length === 0) return null;
  const last = answers[answers.length - 1];
  const rest = answers.slice(0, -1);
  return { answers: rest, phaseId: last.phaseId, itemIndex: rest.filter((answer) => answer.phaseId === last.phaseId).length };
}

function round1(value: number): number {
  return Number.isFinite(value) && value >= 0 ? Math.round(value * 10) / 10 : 0;
}

export type Level = "esperado" | "observar" | "alerta";

export const LEVEL_LABELS: Record<Level, string> = {
  esperado: "Dentro do esperado para a faixa",
  observar: "Observar na consulta",
  alerta: "Sinal de alerta — priorizar na consulta",
};

/**
 * Faixas operacionais AUTORAIS (não normativas) para leitura rápida pela
 * equipe: por fase, 3–4 acertos = esperado, 2 = observar, 0–1 = alerta.
 * No total de 20, 16+ = esperado, 12–15 = observar, 0–11 = alerta.
 */
export function phaseLevel(hits: number, total: number): Level {
  if (total <= 0) return "alerta";
  const ratio = hits / total;
  if (ratio >= 0.75) return "esperado";
  if (ratio >= 0.5) return "observar";
  return "alerta";
}

export function overallLevel(hits: number, total: number): Level {
  if (total <= 0) return "alerta";
  const ratio = hits / total;
  if (ratio >= 0.8) return "esperado";
  if (ratio >= 0.6) return "observar";
  return "alerta";
}

export interface PhaseSummary {
  phase: Phase;
  hits: number;
  errors: number;
  noResponse: number;
  total: number;
  level: Level | null;
  /** Falso quando nenhum item da fase foi registrado (partida interrompida). */
  applied: boolean;
  /** Tempo somado dos itens registrados na fase, em segundos. */
  seconds: number;
  answers: AnswerRecord[];
}

export interface GameSummary {
  band: AgeBand;
  character: Character;
  phases: PhaseSummary[];
  hits: number;
  total: number;
  level: Level | null;
  durationSeconds: number;
  complete: boolean;
}

export function summarize(session: GameSession): GameSummary {
  const band = bandForYears(session.ageYears) ?? AGE_BANDS[0];
  const character = CHARACTERS.find((entry) => entry.id === session.characterId) ?? CHARACTERS[0];
  const expected = PHASE_ORDER.flatMap((phaseId) => itemsFor(band.id, phaseId).map((item) => ({ item, phaseId })));
  const complete = bandForYears(session.ageYears)?.id === session.bandId
    && session.answers.length === expected.length
    && expected.every(({ item, phaseId }) => session.answers.filter((answer) => answer.itemId === item.id && answer.phaseId === phaseId).length === 1);
  const phases: PhaseSummary[] = PHASE_ORDER.map((phaseId) => {
    const phase = phaseById(phaseId);
    const answers = session.answers.filter((answer) => answer.phaseId === phaseId);
    const total = itemsFor(band.id, phaseId).length;
    const hits = answers.filter((answer) => answer.status === "acerto").length;
    const errors = answers.filter((answer) => answer.status === "erro").length;
    const noResponse = answers.filter((answer) => answer.status === "sem_resposta").length;
    const seconds = Math.round(answers.reduce((sum, answer) => sum + answer.seconds, 0));
    return { phase, hits, errors, noResponse, total, level: complete ? phaseLevel(hits, total) : null, applied: answers.length > 0, seconds, answers };
  });
  const hits = phases.reduce((sum, phase) => sum + phase.hits, 0);
  const total = phases.reduce((sum, phase) => sum + phase.total, 0);
  const durationSeconds = session.answers.reduce((sum, answer) => sum + answer.seconds, 0);
  return { band, character, phases, hits, total, level: complete ? overallLevel(hits, total) : null, durationSeconds: Math.round(durationSeconds), complete };
}

export function formatDuration(seconds: number): string {
  const safe = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(safe / 60);
  const rest = safe % 60;
  return minutes > 0 ? `${minutes} min ${rest.toString().padStart(2, "0")} s` : `${rest} s`;
}


// ─────────────────────────────── leitura para a consulta ───────────────────────────────
/**
 * Leitura AUTORAL e descritiva do registro, pensada para o médico bater o
 * olho antes da consulta: o que priorizar, que padrão de resposta apareceu
 * (erro ativo × não resposta), lentidão relativa ao ritmo da própria criança,
 * dependência do julgamento da aplicadora e qual aba de origem aprofunda cada
 * fase. Toda comparação é interna à partida. Nada aqui é norma, percentil,
 * idade equivalente ou diagnóstico.
 */
export type ResponsePattern = "nenhum" | "erro_ativo" | "nao_resposta" | "misto";

export const RESPONSE_PATTERN_LABELS: Record<ResponsePattern, string> = {
  nenhum: "Sem itens perdidos",
  erro_ativo: "Predomínio de erro ativo",
  nao_resposta: "Predomínio de não resposta",
  misto: "Erros e não respostas em proporção parecida",
};

export interface KindProfile {
  hits: number;
  total: number;
}

export interface GameReading {
  headline: string;
  complete: boolean;
  /** Fases aplicadas fora do esperado, da mais crítica para a menos. */
  priorities: PhaseSummary[];
  /** Fases sem nenhum item registrado. */
  notApplied: PhaseSummary[];
  /** Itens perdidos (erro ou não resposta), na ordem da partida. */
  missed: AnswerRecord[];
  errors: number;
  noResponse: number;
  pattern: ResponsePattern;
  medianSeconds: number;
  /** Itens com tempo >= 2x a mediana da própria partida (mínimo 12 s). */
  slow: AnswerRecord[];
  touch: KindProfile;
  judged: KindProfile;
  repeated: number;
  /** Toques em menos de 1 s que não acertaram: impulsividade ou toque acidental a considerar. */
  fastMisses: AnswerRecord[];
  /** Não respostas por tipo de tarefa. */
  noResponseByKind: Record<Item["kind"], number>;
  /** Acertos na primeira e na segunda metade da partida (ordem de aplicação). */
  halves: { first: KindProfile; second: KindProfile; drop: boolean };
  /** Mediana de tempo nos cinco primeiros e nos cinco últimos itens; slowdown quando o fim leva 2x mais. */
  pace: { start: number; end: number; slowdown: boolean };
  /** Posição da idade dentro da faixa etária. */
  bandPosition: "inferior" | "meio" | "superior";
  /** Roteiro autoral para a consulta, uma entrada por fase priorizada. */
  plan: { phase: Phase; text: string }[];
  /** Abas de origem que aprofundam as fases priorizadas. */
  deepen: string[];
  /** Rotas internas das abas de origem das fases priorizadas, sem repetição. */
  routes: { label: string; href: string }[];
  /** Frases descritivas prontas para leitura rápida. */
  notes: string[];
}

export const FAST_TAP_SECONDS = 1;
export const PACE_WINDOW = 5;

export const SLOW_MIN_SECONDS = 12;
export const SLOW_FACTOR = 2;

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
}

const LEVEL_RANK: Record<Level, number> = { alerta: 0, observar: 1, esperado: 2 };

function shortPhase(phase: PhaseSummary): string {
  return `${phase.phase.name} ${phase.hits}/${phase.total}`;
}

export function interpret(session: GameSession): GameReading | null {
  const summary = summarize(session);
  // Uma partida parcial conserva os registros, mas nunca produz classificação ou interpretação.
  if (!summary.complete || summary.level === null) return null;
  const applied = summary.phases.filter((phase) => phase.applied);
  const notApplied = summary.phases.filter((phase) => !phase.applied);
  const priorities = applied
    .filter((phase): phase is PhaseSummary & { level: Level } => phase.level !== null && phase.level !== "esperado")
    .sort((a, b) => LEVEL_RANK[a.level] - LEVEL_RANK[b.level] || a.hits - b.hits || a.phase.order - b.phase.order);
  const missed = session.answers.filter((answer) => answer.status !== "acerto");
  const errors = missed.filter((answer) => answer.status === "erro").length;
  const noResponse = missed.filter((answer) => answer.status === "sem_resposta").length;
  const pattern: ResponsePattern = missed.length === 0
    ? "nenhum"
    : errors >= noResponse * 2 ? "erro_ativo" : noResponse >= errors * 2 ? "nao_resposta" : "misto";
  const timed = session.answers.filter((answer) => answer.seconds > 0);
  const medianSeconds = Math.round(median(timed.map((answer) => answer.seconds)) * 10) / 10;
  const slowCut = Math.max(SLOW_MIN_SECONDS, medianSeconds * SLOW_FACTOR);
  const slow = medianSeconds > 0 ? timed.filter((answer) => answer.seconds >= slowCut) : [];
  const profile = (kinds: Item["kind"][]): KindProfile => {
    const subset = session.answers.filter((answer) => kinds.includes(answer.kind));
    return { hits: subset.filter((answer) => answer.status === "acerto").length, total: subset.length };
  };
  const touch = profile(["toque"]);
  const judged = profile(["fala", "fazer"]);
  const repeated = session.answers.filter((answer) => answer.repeated).length;
  const deepen = [...new Set(priorities.map((phase) => phase.phase.source))];
  const routes: { label: string; href: string }[] = [];
  for (const phase of priorities) for (const route of phase.phase.routes) if (!routes.some((entry) => entry.href === route.href)) routes.push(route);
  const plan = priorities.map((phase) => ({ phase: phase.phase, text: phase.phase.consult }));
  const fastMisses = session.answers.filter((answer) => answer.kind === "toque" && answer.status !== "acerto" && answer.status !== "sem_resposta" && answer.seconds > 0 && answer.seconds < FAST_TAP_SECONDS);
  const noResponseByKind: Record<Item["kind"], number> = { toque: 0, fala: 0, fazer: 0 };
  for (const answer of session.answers) if (answer.status === "sem_resposta") noResponseByKind[answer.kind] += 1;
  const halfAt = Math.ceil(session.answers.length / 2);
  const halfProfile = (subset: AnswerRecord[]): KindProfile => ({ hits: subset.filter((answer) => answer.status === "acerto").length, total: subset.length });
  const first = halfProfile(session.answers.slice(0, halfAt));
  const second = halfProfile(session.answers.slice(halfAt));
  const drop = summary.complete && first.total > 0 && second.total > 0 && first.hits / first.total >= 0.75 && second.hits / second.total <= 0.5;
  const paceStart = timed.length >= PACE_WINDOW * 2 ? Math.round(median(timed.slice(0, PACE_WINDOW).map((answer) => answer.seconds)) * 10) / 10 : 0;
  const paceEnd = timed.length >= PACE_WINDOW * 2 ? Math.round(median(timed.slice(-PACE_WINDOW).map((answer) => answer.seconds)) * 10) / 10 : 0;
  const slowdown = paceStart > 0 && paceEnd >= 4 && paceEnd >= paceStart * 2;
  const bandPosition: GameReading["bandPosition"] = summary.band.min === summary.band.max ? "meio" : session.ageYears <= summary.band.min ? "inferior" : session.ageYears >= summary.band.max ? "superior" : "meio";

  const notes: string[] = [];
  if (!summary.complete) {
    notes.push(`Partida incompleta: ${session.answers.length} de ${summary.total} itens registrados. ${notApplied.length > 0 ? `Fase(s) não aplicada(s): ${notApplied.map((phase) => phase.phase.name).join(", ")}. ` : ""}A contagem total só vale para comparação quando a partida é completa.`);
  }
  if (applied.length > 0 && priorities.length === 0) {
    notes.push("Todas as fases aplicadas ficaram dentro do esperado para a faixa nesta triagem de déficits grosseiros. Isso não exclui dificuldades sutis; a consulta segue o roteiro habitual.");
  }
  if (priorities.length > 0) {
    notes.push(`Prioridade para a consulta: ${priorities.map((phase) => `${shortPhase(phase)} (${phase.level})`).join("; ")}.`);
  }
  if (pattern === "nao_resposta") {
    notes.push(`Predomínio de não resposta (${noResponse} de ${missed.length} itens perdidos). Antes de ler como déficit, considerar recusa, timidez, cansaço ou não compreensão do comando; vale reapresentar esses itens na consulta.`);
  } else if (pattern === "erro_ativo") {
    notes.push(`Predomínio de erro ativo (${errors} de ${missed.length} itens perdidos): a criança respondeu, mas fora do critério. Aponta mais para lacuna no domínio do que para recusa.`);
  } else if (pattern === "misto") {
    notes.push(`Erros (${errors}) e não respostas (${noResponse}) em proporção parecida: separar na consulta o que foi lacuna do que foi recusa ou desatenção.`);
  }
  if (touch.total > 0 && judged.total > 0) {
    const touchRatio = touch.hits / touch.total;
    const judgedRatio = judged.hits / judged.total;
    if (touchRatio - judgedRatio >= 0.4) {
      notes.push(`Melhor nos itens conferidos pelo jogo (toque ${touch.hits}/${touch.total}) do que nos conferidos pela aplicadora (fala e ação ${judged.hits}/${judged.total}). Conferir na consulta os itens de fala e de ação e o rigor do critério aplicado.`);
    } else if (judgedRatio - touchRatio >= 0.4) {
      notes.push(`Melhor nos itens de fala e ação (${judged.hits}/${judged.total}) do que nos de toque na tela (${touch.hits}/${touch.total}). Observar atenção visual, impulsividade no toque e compreensão da pergunta lida.`);
    }
  }
  if (slow.length > 0) {
    notes.push(`Ritmo: mediana de ${medianSeconds} s por item; ${slow.length} item(ns) bem acima do ritmo da própria criança (${slow.map((answer) => `${answer.seconds} s`).join(", ")}). Comparação interna à partida, não normativa.`);
  } else if (medianSeconds > 0) {
    notes.push(`Ritmo regular: mediana de ${medianSeconds} s por item, sem item muito acima do ritmo da própria criança.`);
  }
  if (repeated > 0) {
    notes.push(`Comando repetido em ${repeated} item(ns): considerar atenção auditiva e compreensão de instrução.`);
  }
  if (fastMisses.length >= 2) {
    notes.push(`${fastMisses.length} toques errados em menos de 1 s: considerar impulsividade ou toque acidental; reapresentar esses itens antes de ler como lacuna.`);
  }
  if (noResponse >= 2) {
    const dominant = (Object.keys(noResponseByKind) as Item["kind"][]).find((kind) => noResponseByKind[kind] === noResponse);
    if (dominant === "fala") notes.push("Não resposta concentrada nas tarefas de fala: considerar timidez, ansiedade com estranhos ou linguagem expressiva; checar em conversa livre com a família presente.");
    else if (dominant === "fazer") notes.push("Não resposta concentrada nas tarefas de ação: considerar recusa a comandos motores, timidez corporal ou kit indisponível; refazer com demonstração.");
    else if (dominant === "toque") notes.push("Não resposta concentrada nas tarefas de toque: considerar desinteresse pela tela ou não compreensão do formato; testar com objetos concretos.");
  }
  if (drop) {
    notes.push(`Queda na segunda metade da partida (${first.hits}/${first.total} acertos no início, ${second.hits}/${second.total} no fim): considerar fadiga ou desatenção crescente; a ordem das fases é fixa, então as últimas fases podem estar subestimadas.`);
  }
  if (slowdown) {
    notes.push(`Ritmo desacelerou ao longo da partida (mediana ${paceStart} s nos primeiros itens, ${paceEnd} s nos últimos): sinal de cansaço ou de dificuldade crescente nas fases finais.`);
  }
  if (bandPosition === "inferior" && priorities.length > 0) {
    notes.push(`Idade no limite inferior da faixa (${session.ageYears} anos em ${summary.band.label}): os itens são calibrados para a faixa inteira, então erro isolado pesa menos; alerta em fase inteira continua valendo.`);
  } else if (bandPosition === "superior" && priorities.length > 0) {
    notes.push(`Idade no limite superior da faixa (${session.ageYears} anos em ${summary.band.label}): os itens ficam bem abaixo do esperado, então cada fase fora do esperado pesa mais.`);
  }
  const events = [session.pauseCount ? `${session.pauseCount} pausa(s)` : "", session.undoCount ? `${session.undoCount} registro(s) desfeito(s) e refeito(s)` : ""].filter(Boolean);
  if (events.length > 0) notes.push(`Proveniência do registro: ${events.join(", ")} durante a partida.`);
  if (plan.length > 0) {
    for (const entry of plan) notes.push(`Roteiro para ${entry.phase.name}: ${entry.text}`);
  }
  if (deepen.length > 0) {
    notes.push(`Aprofundar com as abas de origem: ${deepen.join(" · ")}.`);
  }

  const headline = summary.complete
    ? `${LEVEL_LABELS[summary.level]} · ${summary.hits} de ${summary.total} acertos`
    : `Partida incompleta · ${summary.hits} acertos em ${session.answers.length} itens registrados`;

  return {
    headline, complete: summary.complete, priorities, notApplied, missed, errors, noResponse, pattern, medianSeconds, slow, touch, judged, repeated,
    fastMisses, noResponseByKind, halves: { first, second, drop }, pace: { start: paceStart, end: paceEnd, slowdown }, bandPosition, plan, deepen, routes, notes,
  };
}

/** Resumo curto, em prosa, para colar na evolução ou no prontuário. */
export function buildGameBrief(session: GameSession, date = new Date()): string {
  const summary = summarize(session);
  const reading = interpret(session);
  const day = date.toISOString().slice(0, 10).split("-").reverse().join("/");
  if (!reading || summary.level === null) {
    return `Registro lúdico de pré-consulta (${SUPER_NEUROPAD_TITLE}, faixa ${summary.band.label}) em ${day}: partida incompleta, ${session.answers.length} de ${summary.total} itens registrados. Sem classificação ou interpretação. `
      + session.answers.map((answer) => `${answer.prompt}: ${answer.given} (${STATUS_LABELS[answer.status].toLowerCase()}; ${answer.seconds} s).`).join(" ");
  }
  const parts: string[] = [
    `Triagem lúdica de pré-consulta (${SUPER_NEUROPAD_TITLE}, faixa ${summary.band.label}) aplicada pela recepção em ${day}: ${summary.complete ? `${summary.hits} de ${summary.total} acertos, ${LEVEL_LABELS[summary.level].toLowerCase()}` : `partida incompleta, ${summary.hits} acertos em ${session.answers.length} itens registrados`}.`,
    `Por fase: ${summary.phases.map((phase) => `${phase.phase.name} ${phase.applied ? `${phase.hits}/${phase.total}` : "não aplicada"}`).join(", ")}.`,
  ];
  if (reading.missed.length > 0) {
    parts.push(`Itens perdidos: ${reading.missed.map((answer) => `${answer.prompt} (${STATUS_LABELS[answer.status].toLowerCase()})`).join("; ")}.`);
  }
  parts.push(...reading.notes.filter((note) => !note.startsWith("Aprofundar") && !note.startsWith("Roteiro para") && !note.startsWith("Proveniência")));
  parts.push("Contagem autoral, não normativa; a leitura e a conclusão são do médico.");
  return parts.join(" ");
}

// ─────────────────────────────── relatório em texto ───────────────────────────────
export function buildGameReport(session: GameSession, date = new Date()): string {
  const summary = summarize(session);
  const reading = interpret(session);
  const lines: string[] = [
    `${SUPER_NEUROPAD_TITLE} · versão ${SUPER_NEUROPAD_VERSION}`,
    `Idade informada: ${session.ageYears} anos · Faixa: ${summary.band.label} · Personagem: ${summary.character.emoji} ${summary.character.name} ${summary.character.role}`,
    `Data: ${date.toISOString().slice(0, 10)} · Tempo somado nas tarefas: ${formatDuration(summary.durationSeconds)} · ${summary.complete ? "Jogo completo" : "Jogo incompleto"}`,
    "",
    "RESULTADO OBJETIVO — CONTAGEM DE ACERTOS (NÃO É ESCORE NORMATIVO, PERCENTIL NEM DIAGNÓSTICO)",
    summary.level === null ? `Partida incompleta: ${session.answers.length} de ${summary.total} itens registrados. Sem classificação ou interpretação.` : `Total: ${summary.hits} de ${summary.total} acertos · ${LEVEL_LABELS[summary.level]}`,
    ...summary.phases.map((phase) => `Fase ${phase.phase.order} · ${phase.phase.name} (${phase.phase.domain}): ${phase.level === null ? `${phase.answers.length} de ${phase.total} itens registrados` : `${phase.hits}/${phase.total} acertos, ${phase.errors} erros, ${phase.noResponse} sem resposta · ${LEVEL_LABELS[phase.level]} · ${formatDuration(phase.seconds)}`}`),
    "",
    ...(reading ? ["LEITURA PARA A CONSULTA (DESCRITIVA, AUTORAL, NÃO NORMATIVA)", ...reading.notes.map((note) => `- ${note}`)] : []),
    "",
    "DETALHAMENTO ITEM A ITEM",
  ];
  for (const phase of summary.phases) {
    lines.push(`Fase ${phase.phase.order} · ${phase.phase.name}`);
    if (phase.answers.length === 0) lines.push("  (fase não aplicada)");
    phase.answers.forEach((answer, index) => {
      lines.push(`  ${index + 1}. [${KIND_LABELS[answer.kind]}] ${answer.prompt}`);
      lines.push(`     Esperado: ${answer.expected} · Registrado: ${answer.given} · ${STATUS_LABELS[answer.status]} · ${answer.seconds}s${answer.repeated ? " · comando repetido 1x" : ""}`);
    });
  }
  lines.push("", SUPER_NEUROPAD_NATURE);
  return lines.join("\n");
}
