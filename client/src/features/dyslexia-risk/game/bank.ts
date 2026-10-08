/**
 * Jogo das Letras e Números (5–18 anos) — banco autoral de itens.
 *
 * Conteúdo original em português do Brasil, escrito para esta triagem. Nada
 * aqui foi copiado de instrumento comercial (DIBELS, GraphoGame, Prodigy etc.
 * serviram só como inspiração de formato). Os níveis 1–2–3 são graduações
 * internas por faixa (abaixo / esperado / acima), NÃO normas brasileiras.
 */
export type BandId = "5-6" | "7-8" | "9-10" | "11-12" | "13-14" | "15-18";
export type Level = 1 | 2 | 3;
export type ArithOp =
  | "contagem" | "comparacao" | "sequencia" | "adicao" | "subtracao" | "multiplicacao" | "divisao"
  | "fracao" | "decimal" | "porcentagem" | "inteiros" | "potencia" | "equacao" | "problema" | "geometria";

export interface DitadoItem { id: string; level: Level; target: string; sentence: string; pseudo: boolean; feature: string }
export interface DecodeItem { id: string; level: Level; text: string; kind: "silaba" | "palavra" | "pseudo"; feature: string }
export interface ArithItem { id: string; level: Level; prompt: string; visual?: string; answer: string; options: string[]; op: ArithOp }
export interface ComprehensionQuestion { id: string; question: string; answer: string; options: string[]; kind: "literal" | "inferencial" }
export interface ComprehensionSet { id: string; title: string; text: string; listening: boolean; questions: ComprehensionQuestion[] }
export interface FluencyProbe { id: string; kind: "silabas" | "texto"; title: string; text: string }

export interface BandBank {
  band: BandId;
  label: string;
  minAge: number;
  maxAge: number;
  ditado: DitadoItem[];
  decodificacao: DecodeItem[];
  aritmetica: ArithItem[];
  compreensao: ComprehensionSet;
  fluencia: FluencyProbe;
}

const d = (id: string, level: Level, target: string, sentence: string, feature: string, pseudo = false): DitadoItem => ({ id, level, target, sentence, pseudo, feature });
const r = (id: string, level: Level, text: string, kind: DecodeItem["kind"], feature: string): DecodeItem => ({ id, level, text, kind, feature });
const a = (id: string, level: Level, op: ArithOp, prompt: string, answer: string, options: string[], visual?: string): ArithItem => ({ id, level, op, prompt, answer, options, visual });

export const BANDS: BandBank[] = [
  {
    band: "5-6", label: "5 a 6 anos", minAge: 5, maxAge: 6,
    ditado: [
      d("d56-1", 1, "bola", "A bola é azul.", "CV-CV regular"),
      d("d56-2", 1, "pato", "O pato nada no lago.", "CV-CV regular"),
      d("d56-3", 1, "dedo", "Machuquei o dedo.", "CV-CV regular"),
      d("d56-4", 1, "mala", "A mala está pronta.", "CV-CV regular"),
      d("d56-5", 2, "sapo", "O sapo pulou.", "CV-CV com fricativa"),
      d("d56-6", 2, "fita", "A fita é vermelha.", "CV-CV com fricativa"),
      d("d56-7", 2, "suco", "Bebi suco de uva.", "CV-CV com fricativa"),
      d("d56-8", 2, "vela", "Apaguei a vela.", "CV-CV com fricativa"),
      d("d56-9", 3, "boneca", "A boneca caiu.", "trissílaba CV"),
      d("d56-10", 3, "macaco", "O macaco come banana.", "trissílaba CV"),
      d("d56-11", 3, "tomate", "O tomate é vermelho.", "trissílaba CV"),
      d("d56-12", 3, "janela", "Abra a janela.", "trissílaba CV"),
    ],
    decodificacao: [
      r("r56-1", 1, "pa", "silaba", "sílaba CV"),
      r("r56-2", 1, "bo", "silaba", "sílaba CV"),
      r("r56-3", 1, "lu", "silaba", "sílaba CV"),
      r("r56-4", 1, "mi", "silaba", "sílaba CV"),
      r("r56-5", 2, "uva", "palavra", "dissílaba"),
      r("r56-6", 2, "dado", "palavra", "dissílaba CV"),
      r("r56-7", 2, "lata", "palavra", "dissílaba CV"),
      r("r56-8", 2, "pipa", "palavra", "dissílaba CV"),
      r("r56-9", 3, "sapato", "palavra", "trissílaba CV"),
      r("r56-10", 3, "cavalo", "palavra", "trissílaba CV"),
      r("r56-11", 3, "tabo", "pseudo", "pseudopalavra CV"),
      r("r56-12", 3, "nupa", "pseudo", "pseudopalavra CV"),
    ],
    aritmetica: [
      a("m56-1", 1, "contagem", "Quantas estrelas?", "3", ["2", "3", "4", "5"], "⭐⭐⭐"),
      a("m56-2", 1, "contagem", "Quantas maçãs?", "4", ["3", "4", "5", "6"], "🍎🍎🍎🍎"),
      a("m56-3", 1, "comparacao", "Qual grupo tem mais peixes?", "4 peixes", ["2 peixes", "4 peixes"], "🐟🐟 · 🐟🐟🐟🐟"),
      a("m56-4", 1, "sequencia", "Que número vem depois do 2?", "3", ["1", "3", "4", "5"]),
      a("m56-5", 2, "contagem", "Quantas bolas?", "7", ["5", "6", "7", "8"], "⚽⚽⚽⚽⚽⚽⚽"),
      a("m56-6", 2, "adicao", "1 banana e mais 1 banana. Quantas bananas?", "2", ["1", "2", "3", "4"], "🍌 + 🍌"),
      a("m56-7", 2, "sequencia", "Que número vem depois do 6?", "7", ["5", "7", "8", "9"]),
      a("m56-8", 2, "comparacao", "Qual é o maior número?", "8", ["3", "8", "5", "1"]),
      a("m56-9", 3, "adicao", "Quanto é 2 + 3?", "5", ["4", "5", "6", "7"], "🐥🐥 + 🐥🐥🐥"),
      a("m56-10", 3, "subtracao", "Tinha 5 balões e 1 voou. Quantos ficaram?", "4", ["3", "4", "5", "6"], "🎈🎈🎈🎈🎈"),
      a("m56-11", 3, "sequencia", "Qual número falta? 6, 7, __, 9", "8", ["5", "8", "10", "11"]),
      a("m56-12", 3, "adicao", "Quanto é 3 + 3?", "6", ["5", "6", "7", "9"]),
    ],
    compreensao: {
      id: "c56", title: "Histórias para ouvir", listening: true,
      text: "A Lia pegou o guarda-chuva porque estava chovendo. O cachorro do Téo é pequeno e tem manchas pretas. O Davi comeu toda a sopa e ainda pediu mais.",
      questions: [
        { id: "c56-1", kind: "literal", question: "Por que a Lia pegou o guarda-chuva?", answer: "☔ Porque estava chovendo", options: ["☀️ Porque fazia sol", "☔ Porque estava chovendo", "🎂 Porque era aniversário"] },
        { id: "c56-2", kind: "literal", question: "Como é o cachorro do Téo?", answer: "🐶 Pequeno, com manchas pretas", options: ["🐶 Pequeno, com manchas pretas", "🐕 Grande e todo branco", "🐱 É um gato"] },
        { id: "c56-3", kind: "inferencial", question: "O Davi gostou da sopa?", answer: "😋 Sim, gostou", options: ["😋 Sim, gostou", "🤢 Não gostou", "🤷 Ele não comeu"] },
      ],
    },
    fluencia: {
      id: "f56", kind: "silabas", title: "Corrida das sílabas",
      text: "pa bo li mu te da fi ne lo su va ca pe ti mo ba lu di fe na ro si to me ja bu le go ri sa ze nu po fa de ve ma lo ta bi",
    },
  },
  {
    band: "7-8", label: "7 a 8 anos", minAge: 7, maxAge: 8,
    ditado: [
      d("d78-1", 1, "panela", "A panela está quente.", "regular"),
      d("d78-2", 1, "tatu", "O tatu cavou um buraco.", "regular"),
      d("d78-3", 1, "sacola", "Leve a sacola.", "regular"),
      d("d78-4", 1, "fabo", "Uma palavra inventada: fabo.", "pseudopalavra regular", true),
      d("d78-5", 2, "chuva", "A chuva molhou o quintal.", "dígrafo ch"),
      d("d78-6", 2, "ninho", "O ninho tem três ovos.", "dígrafo nh"),
      d("d78-7", 2, "carro", "O carro é novo.", "dígrafo rr"),
      d("d78-8", 2, "lunha", "Uma palavra inventada: lunha.", "pseudopalavra com nh", true),
      d("d78-9", 3, "prato", "O prato quebrou.", "encontro consonantal"),
      d("d78-10", 3, "blusa", "A blusa é amarela.", "encontro consonantal"),
      d("d78-11", 3, "campo", "O cavalo corre no campo.", "nasal antes de p"),
      d("d78-12", 3, "trebo", "Uma palavra inventada: trebo.", "pseudopalavra com encontro", true),
    ],
    decodificacao: [
      r("r78-1", 1, "menino", "palavra", "trissílaba regular"),
      r("r78-2", 1, "tapete", "palavra", "trissílaba regular"),
      r("r78-3", 1, "mupa", "pseudo", "pseudopalavra CV"),
      r("r78-4", 1, "bifa", "pseudo", "pseudopalavra CV"),
      r("r78-5", 2, "chinelo", "palavra", "dígrafo"),
      r("r78-6", 2, "cachorro", "palavra", "dígrafos"),
      r("r78-7", 2, "nalho", "pseudo", "pseudopalavra com lh"),
      r("r78-8", 2, "chepa", "pseudo", "pseudopalavra com ch"),
      r("r78-9", 3, "bicicleta", "palavra", "encontro consonantal"),
      r("r78-10", 3, "travesseiro", "palavra", "encontro + dígrafo"),
      r("r78-11", 3, "plamo", "pseudo", "pseudopalavra com encontro"),
      r("r78-12", 3, "drufe", "pseudo", "pseudopalavra com encontro"),
    ],
    aritmetica: [
      a("m78-1", 1, "adicao", "Quanto é 4 + 3?", "7", ["6", "7", "8", "9"]),
      a("m78-2", 1, "subtracao", "Quanto é 8 − 3?", "5", ["4", "5", "6", "11"]),
      a("m78-3", 1, "adicao", "Quanto é 10 + 5?", "15", ["14", "15", "16", "105"]),
      a("m78-4", 1, "subtracao", "Quanto é 9 − 2?", "7", ["6", "7", "8", "11"]),
      a("m78-5", 2, "adicao", "Quanto é 12 + 7?", "19", ["17", "18", "19", "20"]),
      a("m78-6", 2, "subtracao", "Quanto é 15 − 6?", "9", ["8", "9", "11", "21"]),
      a("m78-7", 2, "sequencia", "Que número fica entre 38 e 40?", "39", ["37", "39", "41", "48"]),
      a("m78-8", 2, "multiplicacao", "2 pacotes com 3 balas cada. Quantas balas?", "6", ["5", "6", "8", "9"], "🍬🍬🍬 · 🍬🍬🍬"),
      a("m78-9", 3, "adicao", "Quanto é 25 + 18?", "43", ["33", "42", "43", "53"]),
      a("m78-10", 3, "subtracao", "Quanto é 40 − 13?", "27", ["23", "27", "33", "37"]),
      a("m78-11", 3, "multiplicacao", "Quanto é 3 × 4?", "12", ["7", "10", "12", "16"]),
      a("m78-12", 3, "divisao", "Qual é a metade de 10?", "5", ["2", "5", "8", "20"]),
    ],
    compreensao: {
      id: "c78", title: "O feijão da Bia", listening: false,
      text: "A Bia plantou uma semente de feijão num copo com algodão. Todo dia ela colocava um pouco de água. Depois de uma semana, apareceu um broto verde. A Bia ficou tão feliz que mostrou o copo para a turma toda.",
      questions: [
        { id: "c78-1", kind: "literal", question: "Onde a Bia plantou a semente?", answer: "Num copo com algodão", options: ["Num copo com algodão", "Na terra do quintal", "Num vaso de flores"] },
        { id: "c78-2", kind: "literal", question: "Quanto tempo levou para aparecer o broto?", answer: "Uma semana", options: ["Um dia", "Uma semana", "Um ano"] },
        { id: "c78-3", kind: "inferencial", question: "Por que o broto apareceu?", answer: "Porque a Bia cuidou e molhou todo dia", options: ["Porque a Bia cuidou e molhou todo dia", "Porque choveu muito", "Porque a semente era de plástico"] },
      ],
    },
    fluencia: {
      id: "f78", kind: "texto", title: "O gato da vizinha",
      text: "A vizinha da Duda tem um gato cinza chamado Bolinha. Todo dia de manhã, o gato pula o muro e vem tomar sol na varanda. A Duda deixa um pote de água perto da porta. O Bolinha bebe, se espreguiça e dorme em cima do tapete. Um dia, choveu muito e o gato não apareceu. A Duda ficou preocupada e foi perguntar à vizinha. O Bolinha estava seco e quentinho, dormindo dentro de uma caixa de sapatos. No dia seguinte, o sol voltou e o gato também.",
    },
  },
  {
    band: "9-10", label: "9 a 10 anos", minAge: 9, maxAge: 10,
    ditado: [
      d("d910-1", 1, "caderno", "Esqueci o caderno em casa.", "polissílaba regular"),
      d("d910-2", 1, "borboleta", "A borboleta pousou na flor.", "polissílaba regular"),
      d("d910-3", 1, "formiga", "A formiga carrega uma folha.", "polissílaba regular"),
      d("d910-4", 1, "telafo", "Uma palavra inventada: telafo.", "pseudopalavra regular", true),
      d("d910-5", 2, "pássaro", "O pássaro cantou cedo.", "ss e acento"),
      d("d910-6", 2, "guerreiro", "O guerreiro é corajoso.", "gu e rr"),
      d("d910-7", 2, "coração", "Meu coração bateu forte.", "ç e til"),
      d("d910-8", 2, "garrumo", "Uma palavra inventada: garrumo.", "pseudopalavra com rr", true),
      d("d910-9", 3, "exceção", "Toda regra tem exceção.", "xc e ç (arbitrária)"),
      d("d910-10", 3, "cozinha", "A cozinha está limpa.", "z entre vogais (arbitrária)"),
      d("d910-11", 3, "xícara", "A xícara caiu no chão.", "x inicial (arbitrária)"),
      d("d910-12", 3, "prendalo", "Uma palavra inventada: prendalo.", "pseudopalavra com encontro e nasal", true),
    ],
    decodificacao: [
      r("r910-1", 1, "televisão", "palavra", "polissílaba"),
      r("r910-2", 1, "pescaria", "palavra", "polissílaba"),
      r("r910-3", 1, "lomifa", "pseudo", "pseudopalavra trissílaba"),
      r("r910-4", 1, "dranco", "pseudo", "pseudopalavra com encontro"),
      r("r910-5", 2, "guitarra", "palavra", "gu e rr"),
      r("r910-6", 2, "quintal", "palavra", "qu e coda l"),
      r("r910-7", 2, "guelpa", "pseudo", "pseudopalavra com gu"),
      r("r910-8", 2, "chirlamo", "pseudo", "pseudopalavra com ch e coda r"),
      r("r910-9", 3, "excursão", "palavra", "xc e til"),
      r("r910-10", 3, "estrangeiro", "palavra", "str e ge"),
      r("r910-11", 3, "frastelim", "pseudo", "pseudopalavra longa"),
      r("r910-12", 3, "blimporte", "pseudo", "pseudopalavra longa"),
    ],
    aritmetica: [
      a("m910-1", 1, "adicao", "Quanto é 48 + 36?", "84", ["74", "84", "82", "712"]),
      a("m910-2", 1, "subtracao", "Quanto é 72 − 29?", "43", ["43", "53", "57", "47"]),
      a("m910-3", 1, "multiplicacao", "Quanto é 6 × 7?", "42", ["36", "42", "48", "13"]),
      a("m910-4", 1, "divisao", "Quanto é 56 ÷ 8?", "7", ["6", "7", "8", "9"]),
      a("m910-5", 2, "adicao", "Quanto é 125 + 238?", "363", ["353", "363", "373", "313"]),
      a("m910-6", 2, "multiplicacao", "Quanto é 7 × 8?", "56", ["54", "56", "63", "48"]),
      a("m910-7", 2, "fracao", "Quanto é a metade de 30?", "15", ["10", "15", "20", "60"]),
      a("m910-8", 2, "fracao", "Qual fração é maior?", "1/2", ["1/2", "1/4", "1/8", "1/10"], "🍕"),
      a("m910-9", 3, "multiplicacao", "Quanto é 23 × 4?", "92", ["82", "92", "96", "27"]),
      a("m910-10", 3, "divisao", "Quanto é 144 ÷ 12?", "12", ["11", "12", "14", "132"]),
      a("m910-11", 3, "problema", "Pedro tinha 50 reais e gastou 18. Quanto sobrou?", "32", ["32", "38", "42", "68"]),
      a("m910-12", 3, "decimal", "Quanto é 0,5 + 0,25?", "0,75", ["0,30", "0,75", "0,7", "7,5"]),
    ],
    compreensao: {
      id: "c910", title: "A horta da escola", listening: false,
      text: "A turma do quarto ano decidiu criar uma horta no fundo da escola. Primeiro, os alunos tiraram as pedras e afofaram a terra. Depois, plantaram alface, cenoura e tomate em fileiras. Cada grupo ficou responsável por regar um canteiro em um dia da semana. Em junho, as alfaces estavam tão grandes que a cozinha da escola usou as folhas na salada do almoço. Os alunos comeram com orgulho, porque sabiam quanto trabalho aquela salada tinha dado.",
      questions: [
        { id: "c910-1", kind: "literal", question: "O que os alunos fizeram antes de plantar?", answer: "Tiraram as pedras e afofaram a terra", options: ["Compraram verduras na feira", "Tiraram as pedras e afofaram a terra", "Pintaram o muro da escola"] },
        { id: "c910-2", kind: "literal", question: "Como a rega foi organizada?", answer: "Cada grupo regava em um dia da semana", options: ["A professora regava sozinha", "Ninguém regava", "Cada grupo regava em um dia da semana"] },
        { id: "c910-3", kind: "inferencial", question: "Por que os alunos comeram a salada com orgulho?", answer: "Porque eles mesmos cultivaram as alfaces", options: ["Porque a salada era de graça", "Porque eles mesmos cultivaram as alfaces", "Porque não gostavam de salada"] },
      ],
    },
    fluencia: {
      id: "f910", kind: "texto", title: "O mapa do avô",
      text: "No sótão da casa do avô, Lucas encontrou um mapa antigo dentro de uma lata enferrujada. O papel estava amarelado e cheio de setas desenhadas a lápis. No canto, havia um X vermelho perto de uma árvore torta. Lucas desceu a escada correndo e mostrou o achado para a irmã. Os dois seguiram as setas pelo quintal, contando passos e procurando a árvore. Encontraram uma goiabeira inclinada perto do muro. Cavaram com uma colher velha até ouvir um som de metal. Era uma caixinha com bolinhas de gude coloridas e um bilhete: para quem gosta de aventura. O avô, da janela, ria baixinho.",
    },
  },
  {
    band: "11-12", label: "11 a 12 anos", minAge: 11, maxAge: 12,
    ditado: [
      d("d1112-1", 1, "almoço", "O almoço ficou pronto cedo.", "ç e coda l"),
      d("d1112-2", 1, "mochila", "A mochila está pesada.", "ch"),
      d("d1112-3", 1, "cenoura", "O coelho roeu a cenoura.", "ce e ou"),
      d("d1112-4", 1, "drapelo", "Uma palavra inventada: drapelo.", "pseudopalavra com encontro", true),
      d("d1112-5", 2, "exercício", "Fiz o exercício de matemática.", "xc e acento"),
      d("d1112-6", 2, "cansaço", "Senti cansaço depois do jogo.", "ns e ç"),
      d("d1112-7", 2, "nascer", "Vimos o sol nascer.", "sc"),
      d("d1112-8", 2, "chosquela", "Uma palavra inventada: chosquela.", "pseudopalavra com ch e qu", true),
      d("d1112-9", 3, "excesso", "O excesso de açúcar faz mal.", "xc e ss"),
      d("d1112-10", 3, "beleza", "A beleza da praia impressiona.", "sufixo -eza"),
      d("d1112-11", 3, "majestade", "O rei falou com majestade.", "j antes de e"),
      d("d1112-12", 3, "transpelido", "Uma palavra inventada: transpelido.", "pseudopalavra longa", true),
    ],
    decodificacao: [
      r("r1112-1", 1, "computador", "palavra", "polissílaba"),
      r("r1112-2", 1, "brigadeiro", "palavra", "encontro e ditongo"),
      r("r1112-3", 1, "tranfeco", "pseudo", "pseudopalavra com encontro"),
      r("r1112-4", 1, "lermosa", "pseudo", "pseudopalavra com coda r"),
      r("r1112-5", 2, "advogado", "palavra", "consoante muda (dv)"),
      r("r1112-6", 2, "ritmo", "palavra", "consoante muda (tm)"),
      r("r1112-7", 2, "digmolar", "pseudo", "pseudopalavra com gm"),
      r("r1112-8", 2, "estrubaço", "pseudo", "pseudopalavra com str e ç"),
      r("r1112-9", 3, "psicologia", "palavra", "ps inicial"),
      r("r1112-10", 3, "excepcional", "palavra", "xc e pc"),
      r("r1112-11", 3, "trapsolente", "pseudo", "pseudopalavra longa"),
      r("r1112-12", 3, "complirvado", "pseudo", "pseudopalavra longa"),
    ],
    aritmetica: [
      a("m1112-1", 1, "fracao", "Quanto é 3/4 de 20?", "15", ["5", "12", "15", "16"]),
      a("m1112-2", 1, "decimal", "Quanto é 0,7 + 0,6?", "1,3", ["0,13", "1,3", "1,03", "13"]),
      a("m1112-3", 1, "multiplicacao", "Quanto é 15 × 12?", "180", ["170", "180", "190", "27"]),
      a("m1112-4", 1, "divisao", "Quanto é 252 ÷ 6?", "42", ["32", "42", "41", "46"]),
      a("m1112-5", 2, "fracao", "Quanto é 2/5 + 1/5?", "3/5", ["3/10", "3/5", "2/5", "1/5"]),
      a("m1112-6", 2, "porcentagem", "Quanto é 10% de 250?", "25", ["2,5", "25", "10", "240"]),
      a("m1112-7", 2, "decimal", "Quanto é 3,5 × 4?", "14", ["12", "14", "15", "7,5"]),
      a("m1112-8", 2, "multiplicacao", "Qual é o menor múltiplo comum de 4 e 6?", "12", ["2", "10", "12", "24"]),
      a("m1112-9", 3, "inteiros", "Quanto é −3 + 8?", "5", ["−11", "−5", "5", "11"]),
      a("m1112-10", 3, "equacao", "Se x + 7 = 15, quanto vale x?", "8", ["7", "8", "22", "15"]),
      a("m1112-11", 3, "geometria", "Área de um retângulo de 6 cm por 4 cm?", "24 cm²", ["10 cm²", "20 cm²", "24 cm²", "48 cm²"]),
      a("m1112-12", 3, "fracao", "Quanto é 2/3 de 27?", "18", ["9", "18", "20", "25"]),
    ],
    compreensao: {
      id: "c1112", title: "As abelhas e as flores", listening: false,
      text: "Quando uma abelha pousa numa flor para buscar néctar, grãos de pólen grudam nos pelos do seu corpo. Ao voar para a flor seguinte, ela deixa parte desse pólen pelo caminho. Esse transporte, chamado polinização, permite que muitas plantas formem frutos e sementes. Por isso, agricultores que cultivam maçã, café ou melão costumam se preocupar quando as abelhas desaparecem da região. Sem elas, a colheita pode diminuir bastante, mesmo que haja chuva e adubo de sobra.",
      questions: [
        { id: "c1112-1", kind: "literal", question: "Onde o pólen gruda na abelha?", answer: "Nos pelos do corpo", options: ["Nas asas molhadas", "Nos pelos do corpo", "Dentro do ferrão"] },
        { id: "c1112-2", kind: "literal", question: "O que a polinização permite?", answer: "Que as plantas formem frutos e sementes", options: ["Que as plantas formem frutos e sementes", "Que as abelhas fiquem maiores", "Que chova mais na região"] },
        { id: "c1112-3", kind: "inferencial", question: "Por que chuva e adubo não bastam para uma boa colheita de maçã?", answer: "Porque sem abelhas falta polinização", options: ["Porque a maçã não precisa de água", "Porque sem abelhas falta polinização", "Porque o adubo espanta as abelhas"] },
      ],
    },
    fluencia: {
      id: "f1112", kind: "texto", title: "A feira de ciências",
      text: "Faltavam duas semanas para a feira de ciências, e o grupo da Marina ainda não tinha um projeto. Depois de muita discussão, decidiram construir um pequeno filtro de água com garrafa plástica, areia, carvão e pedras. Na primeira tentativa, a água saiu mais suja do que entrou, e todo mundo riu do fracasso. Marina sugeriu lavar a areia antes e trocar a ordem das camadas. Na segunda tentativa, a água ficou bem mais clara, embora ainda não fosse própria para beber. No dia da feira, o grupo explicou cada etapa, inclusive o erro inicial. A professora elogiou justamente essa parte, porque mostrava como a ciência avança: testando, errando e corrigindo.",
    },
  },
  {
    band: "13-14", label: "13 a 14 anos", minAge: 13, maxAge: 14,
    ditado: [
      d("d1314-1", 1, "ansiedade", "A ansiedade antes da prova passou.", "ns"),
      d("d1314-2", 1, "previsão", "A previsão anunciou chuva.", "s entre vogais e til"),
      d("d1314-3", 1, "tecnologia", "A tecnologia muda rápido.", "cn e gi"),
      d("d1314-4", 1, "crostemia", "Uma palavra inventada: crostemia.", "pseudopalavra com encontro", true),
      d("d1314-5", 2, "hesitação", "Respondeu sem hesitação.", "h inicial e ç"),
      d("d1314-6", 2, "obsessão", "Ele tem obsessão por futebol.", "bs, ss e ss"),
      d("d1314-7", 2, "privilégio", "Estudar é um privilégio.", "gi e acento"),
      d("d1314-8", 2, "ensiprota", "Uma palavra inventada: ensiprota.", "pseudopalavra com encontro", true),
      d("d1314-9", 3, "excessivo", "O barulho era excessivo.", "xc e ss"),
      d("d1314-10", 3, "ascensão", "A ascensão do time foi rápida.", "sc e ns"),
      d("d1314-11", 3, "beneficente", "A festa beneficente arrecadou alimentos.", "forma frequentemente trocada"),
      d("d1314-12", 3, "subtrafelo", "Uma palavra inventada: subtrafelo.", "pseudopalavra longa", true),
    ],
    decodificacao: [
      r("r1314-1", 1, "responsabilidade", "palavra", "polissílaba longa"),
      r("r1314-2", 1, "intercâmbio", "palavra", "nasal e acento"),
      r("r1314-3", 1, "plestomia", "pseudo", "pseudopalavra com encontro"),
      r("r1314-4", 1, "dranfolete", "pseudo", "pseudopalavra longa"),
      r("r1314-5", 2, "ineficiência", "palavra", "polissílaba com ditongo"),
      r("r1314-6", 2, "imprescindível", "palavra", "sc e encontro"),
      r("r1314-7", 2, "exbrontido", "pseudo", "pseudopalavra com xb"),
      r("r1314-8", 2, "trisgoleta", "pseudo", "pseudopalavra longa"),
      r("r1314-9", 3, "idiossincrasia", "palavra", "polissílaba rara"),
      r("r1314-10", 3, "paralelepípedo", "palavra", "polissílaba proparoxítona"),
      r("r1314-11", 3, "obstrafênico", "pseudo", "pseudopalavra com bstr"),
      r("r1314-12", 3, "desprinclamento", "pseudo", "pseudopalavra longa"),
    ],
    aritmetica: [
      a("m1314-1", 1, "inteiros", "Quanto é −7 + 12?", "5", ["−19", "−5", "5", "19"]),
      a("m1314-2", 1, "inteiros", "Quanto é (−4) × 3?", "−12", ["−12", "12", "−7", "−1"]),
      a("m1314-3", 1, "potencia", "Quanto é 3² + 4²?", "25", ["14", "25", "49", "7"]),
      a("m1314-4", 1, "porcentagem", "Quanto é 20% de 150?", "30", ["20", "30", "75", "130"]),
      a("m1314-5", 2, "equacao", "Se 2x − 5 = 11, quanto vale x?", "8", ["3", "6", "8", "16"]),
      a("m1314-6", 2, "fracao", "Quanto é 3/4 − 1/2?", "1/4", ["1/4", "2/2", "1/2", "2/4"]),
      a("m1314-7", 2, "potencia", "Quanto é √144?", "12", ["11", "12", "14", "72"]),
      a("m1314-8", 2, "decimal", "Quanto é 0,25 × 80?", "20", ["2", "20", "25", "200"]),
      a("m1314-9", 3, "problema", "3 cadernos custam R$ 27. Quanto custam 5?", "R$ 45", ["R$ 35", "R$ 40", "R$ 45", "R$ 54"]),
      a("m1314-10", 3, "potencia", "Quanto é 2³ × 2²?", "32", ["10", "16", "32", "64"]),
      a("m1314-11", 3, "equacao", "Se 5(x − 2) = 15, quanto vale x?", "5", ["1", "3", "5", "7"]),
      a("m1314-12", 3, "fracao", "Num dado comum, qual a chance de sair número par?", "1/2", ["1/6", "1/3", "1/2", "2/3"]),
    ],
    compreensao: {
      id: "c1314", title: "O sono na adolescência", listening: false,
      text: "Durante a adolescência, o relógio biológico costuma se deslocar: o corpo passa a liberar melatonina, o hormônio que facilita o sono, mais tarde da noite. Assim, muitos jovens sentem sono só depois da meia-noite, mas precisam acordar cedo para a escola. O resultado é uma dívida de sono que se acumula ao longo da semana. Pesquisadores observaram que, em algumas cidades onde as aulas passaram a começar mais tarde, os estudantes faltaram menos e relataram mais disposição. Ainda assim, especialistas lembram que o uso de telas à noite pode atrasar ainda mais o sono, anulando parte desse benefício.",
      questions: [
        { id: "c1314-1", kind: "literal", question: "O que a melatonina faz, segundo o texto?", answer: "Facilita o sono", options: ["Deixa o corpo mais agitado", "Facilita o sono", "Aumenta a fome à noite"] },
        { id: "c1314-2", kind: "inferencial", question: "Por que se forma uma dívida de sono?", answer: "Porque o jovem dorme tarde e acorda cedo", options: ["Porque o jovem dorme tarde e acorda cedo", "Porque a escola dá muita tarefa", "Porque a melatonina acaba"] },
        { id: "c1314-3", kind: "inferencial", question: "Qual conclusão o último período sugere?", answer: "Mudar o horário da aula ajuda, mas não resolve tudo", options: ["Telas melhoram o sono", "Mudar o horário da aula ajuda, mas não resolve tudo", "As aulas devem começar à meia-noite"] },
      ],
    },
    fluencia: {
      id: "f1314", kind: "texto", title: "O primeiro emprego",
      text: "Aos quinze anos, Rafael conseguiu um trabalho de fim de semana numa livraria pequena do bairro. Nas primeiras semanas, ele achava que bastava organizar as prateleiras e passar o cartão no caixa. Logo percebeu que os clientes faziam perguntas difíceis: queriam um livro de capa azul cujo título não lembravam, ou um presente para uma tia que gostava de histórias tristes. Rafael começou a anotar os pedidos num caderno e a ler as orelhas dos livros nos intervalos. Em poucos meses, já sabia indicar autores, comparar edições e reconhecer os clientes pelo nome. O dono da livraria, um senhor desconfiado, passou a deixar a loja inteira sob a responsabilidade dele aos sábados de manhã. Rafael descobriu que gostava menos de vender e mais de conversar sobre histórias.",
    },
  },
  {
    band: "15-18", label: "15 a 18 anos", minAge: 15, maxAge: 18,
    ditado: [
      d("d1518-1", 1, "paralisação", "A paralisação durou três dias.", "s entre vogais e ç"),
      d("d1518-2", 1, "hipótese", "Testamos a hipótese no laboratório.", "h inicial e acento"),
      d("d1518-3", 1, "discussão", "A discussão terminou em acordo.", "ss e til"),
      d("d1518-4", 1, "fraspeludo", "Uma palavra inventada: fraspeludo.", "pseudopalavra com encontro", true),
      d("d1518-5", 2, "sucessão", "Houve uma sucessão de erros.", "c e ss"),
      d("d1518-6", 2, "excêntrico", "Era um artista excêntrico.", "xc e acento"),
      d("d1518-7", 2, "hesitante", "Ela respondeu com voz hesitante.", "h inicial e s"),
      d("d1518-8", 2, "brascendoso", "Uma palavra inventada: brascendoso.", "pseudopalavra com sc", true),
      d("d1518-9", 3, "idiossincrasia", "Cada pessoa tem sua idiossincrasia.", "ss e s entre vogais"),
      d("d1518-10", 3, "prescindível", "Esse detalhe é prescindível.", "sc e acento"),
      d("d1518-11", 3, "obsolescência", "A obsolescência dos aparelhos gera lixo.", "bs, sc e acento"),
      d("d1518-12", 3, "inscorvessível", "Uma palavra inventada: inscorvessível.", "pseudopalavra longa", true),
    ],
    decodificacao: [
      r("r1518-1", 1, "imprevisibilidade", "palavra", "polissílaba longa"),
      r("r1518-2", 1, "subsequente", "palavra", "bs e qu"),
      r("r1518-3", 1, "plosmentário", "pseudo", "pseudopalavra longa"),
      r("r1518-4", 1, "dresquivante", "pseudo", "pseudopalavra longa"),
      r("r1518-5", 2, "inconstitucional", "palavra", "nst e polissílaba"),
      r("r1518-6", 2, "psicopedagogia", "palavra", "ps inicial"),
      r("r1518-7", 2, "clandofrasia", "pseudo", "pseudopalavra longa"),
      r("r1518-8", 2, "transbirloso", "pseudo", "pseudopalavra com nsb"),
      r("r1518-9", 3, "desoxirribonucleico", "palavra", "polissílaba técnica"),
      r("r1518-10", 3, "eletroencefalograma", "palavra", "polissílaba técnica"),
      r("r1518-11", 3, "desplindamento", "pseudo", "pseudopalavra longa"),
      r("r1518-12", 3, "interflascimento", "pseudo", "pseudopalavra longa"),
    ],
    aritmetica: [
      a("m1518-1", 1, "equacao", "Se 3x + 5 = 20, quanto vale x?", "5", ["3", "5", "8", "15"]),
      a("m1518-2", 1, "porcentagem", "Quanto é 25% de 80?", "20", ["20", "25", "40", "55"]),
      a("m1518-3", 1, "inteiros", "Quanto é (−3) × (−4)?", "12", ["−12", "−7", "7", "12"]),
      a("m1518-4", 1, "fracao", "Quanto é 2/3 + 1/6?", "5/6", ["3/9", "1/2", "5/6", "3/6"]),
      a("m1518-5", 2, "potencia", "Quanto é 2⁵?", "32", ["10", "25", "32", "64"]),
      a("m1518-6", 2, "potencia", "Quanto é √81 + √16?", "13", ["10", "13", "√97", "97"]),
      a("m1518-7", 2, "equacao", "Se x/4 + 3 = 7, quanto vale x?", "16", ["1", "4", "16", "40"]),
      a("m1518-8", 2, "porcentagem", "Um produto de R$ 200 teve 15% de desconto. Qual o preço final?", "R$ 170", ["R$ 150", "R$ 170", "R$ 185", "R$ 230"]),
      a("m1518-9", 3, "equacao", "Se x² = 49 e x é positivo, quanto vale x?", "7", ["7", "24,5", "49", "98"]),
      a("m1518-10", 3, "equacao", "Se x + y = 10 e x − y = 4, quanto vale x?", "7", ["3", "6", "7", "14"]),
      a("m1518-11", 3, "potencia", "Quanto é log₁₀ 1000?", "3", ["2", "3", "10", "100"]),
      a("m1518-12", 3, "problema", "Qual é a média de 6, 8 e 10?", "8", ["6", "8", "9", "24"]),
    ],
    compreensao: {
      id: "c1518", title: "Notícias falsas", listening: false,
      text: "Estudos sobre redes sociais indicam que notícias falsas tendem a circular mais depressa do que as verdadeiras. Uma explicação provável é que conteúdos falsos costumam ser mais surpreendentes e provocar emoções fortes, como medo ou indignação, o que estimula o compartilhamento imediato. Checar a informação exige tempo e esforço, enquanto apertar um botão leva menos de um segundo. Por isso, educadores defendem que a escola ensine estratégias simples: desconfiar de títulos alarmantes, procurar a mesma notícia em outras fontes e verificar a data da publicação. Essas atitudes não eliminam o problema, mas reduzem a chance de alguém se tornar, sem querer, um multiplicador de boatos.",
      questions: [
        { id: "c1518-1", kind: "literal", question: "Segundo o texto, por que notícias falsas se espalham mais rápido?", answer: "Porque surpreendem e provocam emoções fortes", options: ["Porque são escritas por jornalistas", "Porque surpreendem e provocam emoções fortes", "Porque são sempre mais curtas"] },
        { id: "c1518-2", kind: "inferencial", question: "Qual contraste o texto faz entre checar e compartilhar?", answer: "Checar exige esforço; compartilhar é quase instantâneo", options: ["Checar é mais rápido que compartilhar", "Checar exige esforço; compartilhar é quase instantâneo", "Os dois levam o mesmo tempo"] },
        { id: "c1518-3", kind: "inferencial", question: "O que a expressão \"multiplicador de boatos\" quer dizer?", answer: "Alguém que espalha boatos sem perceber", options: ["Alguém que cria notícias falsas de propósito", "Alguém que espalha boatos sem perceber", "Um aplicativo que bloqueia notícias"] },
      ],
    },
    fluencia: {
      id: "f1518", kind: "texto", title: "A decisão",
      text: "Faltando poucos meses para o vestibular, Helena ainda não sabia se escolheria engenharia ou música. Os pais insistiam que a engenharia garantiria estabilidade, enquanto o professor de violão dizia que talento raro não deveria ser desperdiçado. Durante semanas, ela fez listas de vantagens e desvantagens, conversou com profissionais das duas áreas e assistiu a aulas abertas na universidade. Percebeu que gostava de resolver problemas com números, mas que só perdia a noção do tempo quando estava tocando. Também descobriu que existiam cursos de engenharia acústica, que combinavam física, tecnologia e som. A descoberta não encerrou a dúvida, mas mudou a pergunta: em vez de escolher entre duas vidas, Helena passou a procurar um caminho que aproveitasse o que havia de melhor em cada uma. Na véspera da inscrição, preencheu o formulário com calma, sabendo que poderia ajustar a rota mais tarde.",
    },
  },
];

export const MIN_GAME_AGE = 5;
export const MAX_GAME_AGE = 18;

export function bandForAge(age: number | null | undefined): BandBank | null {
  if (age == null || !Number.isInteger(age) || age < MIN_GAME_AGE || age > MAX_GAME_AGE) return null;
  return BANDS.find((b) => age >= b.minAge && age <= b.maxAge) ?? null;
}

export function fluencyWords(probe: FluencyProbe): string[] {
  return probe.text.split(/\s+/).filter(Boolean);
}
