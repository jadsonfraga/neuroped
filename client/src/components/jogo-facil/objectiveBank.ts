/**
 * Banco objetivo do Modo Fácil (Sonda 10 e OBS-10), de 1 a 19 anos.
 *
 * Cada item cabe inteiro na tela: a fala do adulto (ou o enunciado que a
 * criança lê) e de duas a quatro opções tocáveis, com uma única resposta certa.
 * O toque decide certo/errado; nada depende de objeto, papel ou pessoa fora do
 * aplicativo, e nenhum item pede interpretação de quem aplica.
 *
 * Cada faixa tem 20 itens em pares por assunto: Sonda 10 usa os pares (índice
 * par) e OBS-10 usa os ímpares, então cada aplicação tem 10 itens com a mesma
 * cobertura e sem repetição entre as duas. O nível fica um degrau abaixo da
 * exigência escolar da idade, de propósito: mede execução, não desempenho.
 *
 * Verdade clínica: contagem de certo/errado por item, sem escore, percentil,
 * ponto de corte ou equivalência a instrumento licenciado.
 */
export type ObjectiveDomain = "figuras" | "letras" | "leitura" | "escrita" | "numeros";
export const OBJECTIVE_DOMAIN_LABEL: Record<ObjectiveDomain, string> = {
  figuras: "Figuras e compreensão",
  letras: "Letras e sons",
  leitura: "Leitura",
  escrita: "Escrita",
  numeros: "Números",
};
export interface ObjectiveItem {
  domain: ObjectiveDomain;
  /** O que o adulto fala ou a criança lê. */
  say: string;
  options: string[];
  answer: string;
}
export interface ObjectiveBand {
  id: string;
  label: string;
  minYears: number;
  maxYears: number;
  items: ObjectiveItem[];
}
export type ObjectiveTool = "sonda" | "obs10";

const q = (domain: ObjectiveDomain, say: string, options: string[], answer: string): ObjectiveItem => ({ domain, say, options, answer });
const f = (say: string, options: string[], answer: string) => q("figuras", say, options, answer);
const l = (say: string, options: string[], answer: string) => q("letras", say, options, answer);
const r = (say: string, options: string[], answer: string) => q("leitura", say, options, answer);
const w = (say: string, options: string[], answer: string) => q("escrita", say, options, answer);
const n = (say: string, options: string[], answer: string) => q("numeros", say, options, answer);

export const OBJECTIVE_BANDS: readonly ObjectiveBand[] = [
  {
    id: "y01", label: "1 ano", minYears: 1, maxYears: 1,
    items: [
      f("Onde está o cachorro?", ["🐶", "🚗"], "🐶"),
      f("Onde está a bola?", ["🍌", "⚽"], "⚽"),
      f("Onde está o gato?", ["🐱", "🏠"], "🐱"),
      f("Onde está o sapato?", ["🥤", "👟"], "👟"),
      f("Onde está a banana?", ["🍌", "🐟"], "🍌"),
      f("Onde está o carro?", ["🧸", "🚗"], "🚗"),
      f("Onde está o bebê?", ["👶", "🌸"], "👶"),
      f("Onde está a maçã?", ["🐦", "🍎"], "🍎"),
      f("Onde está o peixe?", ["🐟", "☀️"], "🐟"),
      f("Onde está a casa?", ["🐱", "🏠"], "🏠"),
      f("Onde está o urso?", ["🧸", "🥄"], "🧸"),
      f("Onde está a mamadeira?", ["⚽", "🍼"], "🍼"),
      f("Onde está o pato?", ["🦆", "🍎"], "🦆"),
      f("Onde está a flor?", ["🚗", "🌸"], "🌸"),
      f("Onde está o sol?", ["☀️", "👟"], "☀️"),
      f("Onde está a vaca?", ["🐶", "🐄"], "🐄"),
      f("Onde está o nariz?", ["👃", "🦶"], "👃"),
      f("Onde está a mão?", ["👁️", "✋"], "✋"),
      f("Onde está o pé?", ["🦶", "👄"], "🦶"),
      f("Onde está o olho?", ["✋", "👁️"], "👁️"),
    ],
  },
  {
    id: "y02", label: "2 anos", minYears: 2, maxYears: 2,
    items: [
      f("Onde está o cavalo?", ["🐴", "🐶", "🐱"], "🐴"),
      f("Onde está o macaco?", ["🐷", "🐵", "🐰"], "🐵"),
      f("Onde está o avião?", ["🚗", "🚲", "✈️"], "✈️"),
      f("Onde está o ônibus?", ["🚌", "🚂", "⚽"], "🚌"),
      f("Onde está a uva?", ["🍊", "🍇", "🍞"], "🍇"),
      f("Onde está o leite?", ["🥛", "🍎", "🍰"], "🥛"),
      f("Onde está a cama?", ["🪑", "🚪", "🛏️"], "🛏️"),
      f("Onde está a cadeira?", ["🛏️", "🪑", "🏠"], "🪑"),
      f("Onde está a boca?", ["👃", "👄", "👂"], "👄"),
      f("Onde está a orelha?", ["👂", "👁️", "✋"], "👂"),
      f("Quem está dormindo?", ["😄", "😴", "😢"], "😴"),
      f("Quem está chorando?", ["😢", "😴", "😄"], "😢"),
      f("Quem está rindo?", ["😴", "😢", "😄"], "😄"),
      f("Onde está a chuva?", ["☀️", "🌧️", "🌙"], "🌧️"),
      f("Onde está a lua?", ["🌙", "⭐", "☀️"], "🌙"),
      f("Onde está o sapo?", ["🐟", "🐸", "🐦"], "🐸"),
      n("Onde tem mais maçãs?", ["🍎", "🍎🍎🍎"], "🍎🍎🍎"),
      n("Onde tem só uma bola?", ["⚽⚽⚽", "⚽"], "⚽"),
      n("Onde tem mais gatos?", ["🐱🐱🐱", "🐱"], "🐱🐱🐱"),
      n("Onde tem só um carro?", ["🚗", "🚗🚗🚗"], "🚗"),
    ],
  },
  {
    id: "y03", label: "3 anos", minYears: 3, maxYears: 3,
    items: [
      f("Toque no vermelho.", ["🔵", "🔴", "🟢", "🟡"], "🔴"),
      f("Toque no azul.", ["🟡", "🟢", "🔵", "🔴"], "🔵"),
      f("Toque no círculo.", ["⚫", "🔺", "🟥", "⭐"], "⚫"),
      f("Toque na estrela.", ["🟥", "⭐", "⚫", "🔺"], "⭐"),
      f("Qual é de comer?", ["🚗", "👟", "🍎", "🧸"], "🍎"),
      f("Qual é um animal?", ["🍌", "🐶", "🏠", "⚽"], "🐶"),
      f("Qual é igual a este? 🐱", ["🐶", "🐱", "🐭", "🐰"], "🐱"),
      f("Qual é igual a este? 🚂", ["🚂", "🚌", "🚗", "✈️"], "🚂"),
      l("Toque na letra A.", ["B", "O", "A", "M"], "A"),
      l("Toque na letra O.", ["O", "A", "E", "T"], "O"),
      l("Qual é igual a esta? M", ["N", "W", "M", "H"], "M"),
      l("Qual é igual a esta? B", ["B", "D", "P", "R"], "B"),
      n("Quantas maçãs? 🍎🍎", ["1", "2", "3"], "2"),
      n("Quantos gatos? 🐱", ["3", "1", "2"], "1"),
      n("Quantas bolas? ⚽⚽⚽", ["2", "1", "3"], "3"),
      n("Quantos carros? 🚗🚗", ["1", "2", "3"], "2"),
      n("Toque onde tem 2 flores.", ["🌸", "🌸🌸🌸", "🌸🌸"], "🌸🌸"),
      n("Toque onde tem 3 estrelas.", ["⭐⭐⭐", "⭐", "⭐⭐"], "⭐⭐⭐"),
      n("Onde tem menos peixes?", ["🐟🐟🐟", "🐟", "🐟🐟"], "🐟"),
      n("Onde tem mais patos?", ["🦆", "🦆🦆", "🦆🦆🦆"], "🦆🦆🦆"),
    ],
  },
  {
    id: "y04", label: "4 anos", minYears: 4, maxYears: 4,
    items: [
      f("Toque no triângulo.", ["🟥", "⚫", "🔺", "⭐"], "🔺"),
      f("Toque no quadrado.", ["🟥", "🔺", "⚫", "⭐"], "🟥"),
      f("De que cor é a banana? 🍌", ["🔴", "🟡", "🔵", "🟢"], "🟡"),
      f("De que cor é a folha? 🍃", ["🟢", "🟡", "🔴", "🔵"], "🟢"),
      l("Toque na letra E.", ["A", "E", "O", "U"], "E"),
      l("Toque na letra I.", ["U", "O", "A", "I"], "I"),
      l("Toque na letra U.", ["U", "A", "E", "I"], "U"),
      l("Toque na letra M.", ["B", "M", "P", "T"], "M"),
      l("Qual é igual a esta? P", ["B", "R", "P", "D"], "P"),
      l("Qual é igual a esta? S", ["S", "Z", "C", "G"], "S"),
      l("Qual é igual a esta? T", ["L", "F", "I", "T"], "T"),
      l("Qual é igual a esta? R", ["R", "P", "B", "K"], "R"),
      n("Quantas estrelas? ⭐⭐⭐⭐", ["3", "5", "4", "2"], "4"),
      n("Quantos sapos? 🐸🐸🐸🐸🐸", ["4", "5", "3", "6"], "5"),
      n("Toque no número 3.", ["1", "2", "3", "4"], "3"),
      n("Toque no número 5.", ["5", "2", "3", "4"], "5"),
      n("Toque onde tem 4 bolas.", ["⚽⚽", "⚽⚽⚽⚽", "⚽⚽⚽", "⚽"], "⚽⚽⚽⚽"),
      n("Toque onde tem 5 patos.", ["🦆🦆🦆🦆🦆", "🦆🦆🦆", "🦆🦆", "🦆🦆🦆🦆"], "🦆🦆🦆🦆🦆"),
      n("Qual número vem depois do 2?", ["1", "4", "3", "5"], "3"),
      n("Qual número vem depois do 4?", ["5", "3", "2", "1"], "5"),
    ],
  },
  {
    id: "y05", label: "5 anos", minYears: 5, maxYears: 5,
    items: [
      l("Com que letra começa SAPO?", ["P", "S", "A", "O"], "S"),
      l("Com que letra começa BOLA?", ["L", "A", "O", "B"], "B"),
      l("Com que letra começa MESA?", ["M", "S", "E", "A"], "M"),
      l("Toque na letra a minúscula.", ["e", "a", "o", "u"], "a"),
      l("Qual rima com PÃO?", ["GATO", "MÃO", "BOLA", "CASA"], "MÃO"),
      l("Qual rima com GATO?", ["PATO", "MESA", "SOL", "UVA"], "PATO"),
      r("Toque onde está escrito BOLA.", ["BOLA", "BOTA", "BALA", "BELA"], "BOLA"),
      r("Toque onde está escrito SOL.", ["SAL", "SIL", "SOL", "SUL"], "SOL"),
      w("Qual letra falta? BO_A (bola)", ["L", "T", "M", "R"], "L"),
      w("Qual letra falta? GA_O (gato)", ["D", "T", "P", "L"], "T"),
      w("Qual letra falta? _ATO (pato)", ["P", "B", "M", "S"], "P"),
      w("Qual letra falta? CAS_ (casa)", ["O", "E", "A", "I"], "A"),
      n("Quantos peixes? 🐟🐟🐟🐟🐟🐟", ["5", "7", "6", "4"], "6"),
      n("Quantas flores? 🌸🌸🌸🌸🌸🌸🌸🌸", ["7", "9", "6", "8"], "8"),
      n("Toque no número 7.", ["1", "7", "4", "9"], "7"),
      n("Toque no número 10.", ["10", "1", "0", "6"], "10"),
      n("2 + 1 = ?", ["2", "3", "4", "1"], "3"),
      n("3 + 2 = ?", ["4", "6", "5", "3"], "5"),
      n("Qual número é maior?", ["4", "7", "2", "5"], "7"),
      n("Qual número vem depois? 1, 2, 3, __", ["5", "4", "6", "2"], "4"),
    ],
  },
  {
    id: "y06", label: "6 anos", minYears: 6, maxYears: 6,
    items: [
      l("Quantas sílabas tem GA-TO?", ["1", "2", "3", "4"], "2"),
      l("Quantas sílabas tem BA-NA-NA?", ["2", "4", "3", "1"], "3"),
      l("Com que sílaba começa CASA?", ["SA", "CA", "MA", "PA"], "CA"),
      l("Com que sílaba termina BOLA?", ["BO", "LO", "LA", "BA"], "LA"),
      r("Leia e toque: GATO", ["🐶", "🐱", "🐭", "🐰"], "🐱"),
      r("Leia e toque: BOLA", ["🍎", "🚗", "⚽", "🧸"], "⚽"),
      r("Leia: O SOL É AMARELO. De que cor é o sol?", ["🔵", "🔴", "🟢", "🟡"], "🟡"),
      r("Leia: A MAÇÃ É VERMELHA. De que cor é a maçã?", ["🔴", "🟡", "🔵", "🟢"], "🔴"),
      w("Qual está escrita certa?", ["BOLLA", "BOLA", "BOAL", "BLOA"], "BOLA"),
      w("Qual está escrita certa?", ["CAZA", "CASSA", "CASA", "KASA"], "CASA"),
      w("Qual letra falta? PEI_E (peixe)", ["X", "C", "S", "Z"], "X"),
      w("Qual letra falta? _OLHER (colher)", ["K", "Q", "C", "G"], "C"),
      n("Toque no número 15.", ["51", "15", "5", "11"], "15"),
      n("Toque no número 20.", ["12", "2", "20", "10"], "20"),
      n("4 + 3 = ?", ["6", "8", "7", "5"], "7"),
      n("5 + 5 = ?", ["10", "9", "11", "8"], "10"),
      n("6 − 2 = ?", ["3", "4", "5", "2"], "4"),
      n("9 − 4 = ?", ["6", "4", "5", "3"], "5"),
      n("Qual número vem depois? 5, 6, 7, __", ["9", "8", "6", "10"], "8"),
      n("Qual número é menor?", ["9", "12", "3", "7"], "3"),
    ],
  },
  {
    id: "y07", label: "7 anos", minYears: 7, maxYears: 7,
    items: [
      r("Leia: Ana tem um cachorro preto. De que cor é o cachorro?", ["branco", "preto", "marrom", "cinza"], "preto"),
      r("Leia: Lucas comeu uma banana. O que Lucas comeu?", ["maçã", "pão", "banana", "uva"], "banana"),
      r("Leia: O gato dorme na cama. Onde o gato dorme?", ["na cama", "no chão", "na cadeira", "no carro"], "na cama"),
      r("Leia: Bia foi à escola de ônibus. Como Bia foi?", ["a pé", "de carro", "de bicicleta", "de ônibus"], "de ônibus"),
      r("Leia e toque: CAVALO", ["🐴", "🐄", "🐷", "🐶"], "🐴"),
      r("Leia e toque: AVIÃO", ["🚌", "✈️", "🚂", "🚗"], "✈️"),
      w("Qual está escrita certa?", ["escola", "iscola", "escóla", "esqola"], "escola"),
      w("Qual está escrita certa?", ["janéla", "jenela", "janela", "ganela"], "janela"),
      w("Qual é o plural de GATO?", ["gatos", "gatas", "gatoss", "gato"], "gatos"),
      w("Qual é o plural de FLOR?", ["flors", "flores", "flore", "floris"], "flores"),
      w("Qual frase começa com letra maiúscula?", ["o sol brilha.", "O sol brilha.", "o Sol brilha.", "o sol Brilha."], "O sol brilha."),
      w("Qual frase termina com ponto final?", ["Eu gosto de pão", "Eu gosto de pão?", "Eu gosto de pão.", "Eu gosto de pão!"], "Eu gosto de pão."),
      n("12 + 5 = ?", ["16", "17", "18", "15"], "17"),
      n("20 + 30 = ?", ["40", "60", "50", "30"], "50"),
      n("15 − 5 = ?", ["10", "5", "20", "15"], "10"),
      n("18 − 6 = ?", ["11", "13", "12", "10"], "12"),
      n("O dobro de 4 é:", ["6", "8", "2", "10"], "8"),
      n("A metade de 10 é:", ["2", "20", "4", "5"], "5"),
      n("Toque no número 48.", ["84", "48", "44", "18"], "48"),
      n("Qual número vem depois? 10, 20, 30, __", ["31", "50", "40", "35"], "40"),
    ],
  },
  {
    id: "y08", label: "8 anos", minYears: 8, maxYears: 8,
    items: [
      r("Leia: Pedro plantou uma flor. Todo dia ele coloca água. O que Pedro plantou?", ["uma árvore", "uma flor", "um pé de feijão", "uma cenoura"], "uma flor"),
      r("Leia: Pedro plantou uma flor. Todo dia ele coloca água. O que Pedro faz todo dia?", ["coloca água", "corta a flor", "tira foto", "compra flor"], "coloca água"),
      r("Leia: Marina perdeu o guarda-chuva e chegou molhada. Por que ela chegou molhada?", ["estava calor", "choveu e ela não tinha guarda-chuva", "ela nadou", "ela tomou banho"], "choveu e ela não tinha guarda-chuva"),
      r("Leia: O carro parou porque acabou a gasolina. Por que o carro parou?", ["pneu furou", "acabou a gasolina", "bateu", "o motorista dormiu"], "acabou a gasolina"),
      r("Leia: 'O menino correu depressa.' Depressa quer dizer:", ["devagar", "rápido", "com medo", "cansado"], "rápido"),
      r("Leia: 'A sala estava enorme.' Enorme quer dizer:", ["pequena", "escura", "muito grande", "suja"], "muito grande"),
      w("Qual está escrita certa?", ["pássaro", "passaro", "pásaro", "paçaro"], "pássaro"),
      w("Qual está escrita certa?", ["cabesa", "cabeça", "cabessa", "cabeza"], "cabeça"),
      w("Qual frase está certa?", ["As meninas brinca.", "As meninas brincam.", "As menina brincam.", "A meninas brinca."], "As meninas brincam."),
      w("Qual frase está certa?", ["Os cachorros late.", "Os cachorro latem.", "Os cachorros latem.", "O cachorros latem."], "Os cachorros latem."),
      w("Qual frase faz uma pergunta?", ["Você vem hoje.", "Você vem hoje?", "Você vem hoje!", "Venha hoje."], "Você vem hoje?"),
      w("Complete: 'Hoje ___ frio.'", ["está", "estão", "estou", "estamos"], "está"),
      n("2 × 5 = ?", ["7", "10", "12", "8"], "10"),
      n("3 × 3 = ?", ["6", "9", "12", "8"], "9"),
      n("10 ÷ 2 = ?", ["4", "6", "5", "8"], "5"),
      n("12 ÷ 3 = ?", ["3", "4", "5", "6"], "4"),
      n("25 + 17 = ?", ["32", "41", "42", "43"], "42"),
      n("50 − 23 = ?", ["27", "33", "37", "23"], "27"),
      n("Toque no número 305.", ["350", "305", "35", "503"], "305"),
      n("Uma caixa tem 5 bolachas. Quantas há em 3 caixas?", ["8", "10", "15", "12"], "15"),
    ],
  },
  {
    id: "y09", label: "9 anos", minYears: 9, maxYears: 9,
    items: [
      r("Leia: As abelhas fazem mel e ajudam as flores a crescer. O que as abelhas fazem?", ["mel", "pão", "leite", "ninhos de barro"], "mel"),
      r("Leia: As abelhas fazem mel e ajudam as flores a crescer. Quem as abelhas ajudam?", ["os peixes", "as flores", "os pássaros", "as nuvens"], "as flores"),
      r("Leia: 'João guardou o brinquedo antes de dormir.' O que ele fez primeiro?", ["dormiu", "guardou o brinquedo", "comeu", "escovou os dentes"], "guardou o brinquedo"),
      r("Leia: 'Depois do almoço, Lia foi ao parque.' Quando Lia foi ao parque?", ["antes do almoço", "de manhã cedo", "depois do almoço", "à noite"], "depois do almoço"),
      r("Leia: 'O menino ficou contente com o presente.' Contente quer dizer:", ["triste", "feliz", "bravo", "cansado"], "feliz"),
      r("Qual título combina? 'Os pinguins vivem no frio e nadam muito bem.'", ["A vida dos pinguins", "O deserto quente", "O jogo de futebol", "A festa da escola"], "A vida dos pinguins"),
      w("Qual palavra precisa de acento?", ["cafe", "mesa", "bola", "gato"], "cafe"),
      w("Qual está escrita certa?", ["exercicio", "exercício", "ezercício", "exersício"], "exercício"),
      w("Qual é o plural de PÃO?", ["pãos", "pães", "pões", "pans"], "pães"),
      w("Qual é o plural de ANIMAL?", ["animals", "animales", "animais", "animaus"], "animais"),
      w("Qual frase está certa?", ["Nós fomos ao cinema.", "Nós foi ao cinema.", "Nós foram ao cinema.", "Nós vai ao cinema."], "Nós fomos ao cinema."),
      w("Complete: 'Choveu, ___ levei guarda-chuva.'", ["mas", "por isso", "ou", "nem"], "por isso"),
      n("6 × 4 = ?", ["20", "24", "28", "18"], "24"),
      n("7 × 5 = ?", ["30", "40", "35", "45"], "35"),
      n("36 ÷ 6 = ?", ["5", "7", "6", "8"], "6"),
      n("45 ÷ 9 = ?", ["4", "5", "6", "9"], "5"),
      n("Qual fração é a metade?", ["1/3", "1/4", "1/2", "2/3"], "1/2"),
      n("Qual fração é um quarto?", ["1/4", "1/2", "1/3", "4/1"], "1/4"),
      n("Ana tinha 30 figurinhas e ganhou 15. Com quantas ficou?", ["35", "40", "45", "50"], "45"),
      n("Um pacote tem 8 balas. Quantas balas há em 4 pacotes?", ["24", "32", "28", "36"], "32"),
    ],
  },
  {
    id: "y10", label: "10 anos", minYears: 10, maxYears: 10,
    items: [
      r("Leia: A água precisa ser tratada antes de chegar às casas, para ficar boa para beber. Por que a água é tratada?", ["para ficar boa para beber", "para mudar de cor", "para ficar salgada", "para gelar"], "para ficar boa para beber"),
      r("Leia: A água precisa ser tratada antes de chegar às casas, para ficar boa para beber. Aonde a água chega depois?", ["ao mar", "às casas", "às nuvens", "ao rio"], "às casas"),
      r("Leia: 'Apesar do cansaço, Rafael terminou a corrida.' O que aconteceu?", ["Rafael desistiu", "Rafael terminou a corrida", "Rafael não correu", "Rafael dormiu"], "Rafael terminou a corrida"),
      r("Leia: 'Se chover, o passeio será adiado.' O passeio será adiado se:", ["fizer sol", "chover", "ventar", "nevar"], "chover"),
      r("Qual palavra é sinônimo de RÁPIDO?", ["lento", "veloz", "fraco", "alto"], "veloz"),
      r("Qual palavra é o contrário de CHEIO?", ["grande", "pesado", "vazio", "novo"], "vazio"),
      w("Qual frase tem a vírgula no lugar certo?", ["Quando chegou, Maria abriu o livro.", "Quando, chegou Maria abriu o livro.", "Quando chegou Maria abriu, o livro.", "Quando chegou Maria abriu o, livro."], "Quando chegou, Maria abriu o livro."),
      w("Complete: 'Ele estudou, ___ ainda ficou com dúvida.'", ["porque", "mas", "então", "ou"], "mas"),
      w("Qual está escrita certa?", ["amanhã", "amanhan", "amanha", "amanhâ"], "amanhã"),
      w("Qual está escrita certa?", ["exceção", "escessão", "excessão", "eceção"], "exceção"),
      w("Qual frase está certa?", ["Os alunos fizeram a tarefa.", "Os aluno fizeram a tarefa.", "Os alunos fez a tarefa.", "O alunos fizeram a tarefa."], "Os alunos fizeram a tarefa."),
      w("Complete: 'Nós ___ felizes.'", ["está", "estamos", "estou", "estão"], "estamos"),
      n("0,5 é o mesmo que:", ["1/4", "1/2", "5/1", "1/5"], "1/2"),
      n("2,5 + 1,5 = ?", ["3", "4", "3,5", "4,5"], "4"),
      n("Qual fração é igual a 1/2?", ["2/4", "1/3", "3/5", "1/4"], "2/4"),
      n("Metade de 50 é:", ["20", "25", "30", "15"], "25"),
      n("Um quadrado tem lados de 3 cm. Somando os quatro lados, dá:", ["9 cm", "6 cm", "12 cm", "7 cm"], "12 cm"),
      n("Uma receita para 2 pessoas usa 1 xícara. Para 4 pessoas, usa:", ["1", "2", "3", "4"], "2"),
      n("48 + 27 = ?", ["65", "75", "85", "74"], "75"),
      n("100 − 37 = ?", ["73", "67", "63", "57"], "63"),
    ],
  },
  {
    id: "y11", label: "11 a 12 anos", minYears: 11, maxYears: 12,
    items: [
      r("Leia: A turma fez uma horta e anotava quanta água usava, para não desperdiçar. Por que anotava a água?", ["para não desperdiçar", "para escolher sementes", "para medir a horta", "para faltar à aula"], "para não desperdiçar"),
      r("Leia: A turma fez uma horta e anotava quanta água usava, para não desperdiçar. 'Desperdiçar' quer dizer:", ["guardar", "gastar sem necessidade", "beber", "plantar"], "gastar sem necessidade"),
      r("Leia: 'Embora estivesse cansada, Júlia ajudou a mãe.' Júlia:", ["não ajudou", "ajudou mesmo cansada", "dormiu", "ficou brava"], "ajudou mesmo cansada"),
      r("Leia: 'Ler todos os dias ajuda a conhecer palavras novas.' Quem escreveu é a favor de:", ["não ler", "ler com frequência", "ler uma vez por ano", "ler só figuras"], "ler com frequência"),
      r("Qual frase é uma opinião?", ["O filme dura duas horas.", "Este é o melhor filme do ano.", "O filme estreou ontem.", "O filme tem legenda."], "Este é o melhor filme do ano."),
      r("Qual resumo combina? 'Muitos alunos chegam atrasados. Por isso, a escola abrirá o portão mais cedo.'", ["A escola vai abrir mais cedo por causa dos atrasos.", "A escola vai fechar.", "Os alunos gostam de chegar cedo.", "O texto fala de provas."], "A escola vai abrir mais cedo por causa dos atrasos."),
      w("Qual conectivo indica oposição?", ["portanto", "porém", "porque", "além disso"], "porém"),
      w("Complete: 'Estudei muito, ___ ainda errei uma questão.'", ["portanto", "além disso", "porém", "porque"], "porém"),
      w("Qual frase tem a vírgula no lugar certo?", ["Quando terminou a aula, Pedro guardou o material.", "Quando, terminou a aula Pedro guardou o material.", "Quando terminou a aula Pedro guardou, o material.", "Quando terminou a aula Pedro guardou o, material."], "Quando terminou a aula, Pedro guardou o material."),
      w("Complete: 'Os resultados ___ anotados no caderno.'", ["foi", "foram", "era", "será"], "foram"),
      w("Qual está escrita certa?", ["também", "tambem", "tanbém", "tambén"], "também"),
      w("Qual é a forma mais formal para uma carta à direção?", ["A gente acha que é muito legal.", "Consideramos a proposta boa.", "Tá tudo bem com a proposta.", "A proposta é tipo boa."], "Consideramos a proposta boa."),
      n("10% de 100 = ?", ["1", "10", "100", "50"], "10"),
      n("50% de 80 = ?", ["20", "30", "40", "60"], "40"),
      n("Resolva: x + 5 = 12", ["x = 5", "x = 6", "x = 7", "x = 17"], "x = 7"),
      n("Resolva: 2x = 14", ["x = 5", "x = 6", "x = 7", "x = 12"], "x = 7"),
      n("A média de 6 e 10 é:", ["7", "8", "9", "16"], "8"),
      n("Uma receita usa 3 xícaras para 6 pessoas. Para 12 pessoas, usa:", ["4", "5", "6", "9"], "6"),
      n("3/4 de 20 = ?", ["10", "12", "15", "18"], "15"),
      n("Se 3 cadernos custam R$ 27, um caderno custa:", ["R$ 7", "R$ 9", "R$ 8", "R$ 10"], "R$ 9"),
    ],
  },
  {
    id: "y13", label: "13 a 15 anos", minYears: 13, maxYears: 15,
    items: [
      r("Leia: 'O uso de celular antes de dormir atrapalha o sono, porque a luz da tela deixa o cérebro alerta.' Por que atrapalha?", ["o celular é pesado", "a luz deixa o cérebro alerta", "faz barulho", "fica sem bateria"], "a luz deixa o cérebro alerta"),
      r("Leia: 'O uso de celular antes de dormir atrapalha o sono, porque a luz da tela deixa o cérebro alerta.' Qual é a ideia principal?", ["celular à noite prejudica o sono", "celular é caro", "todos devem dormir cedo", "telas são coloridas"], "celular à noite prejudica o sono"),
      r("Leia: 'Ela ficou de olho na situação.' Isso quer dizer que ela:", ["prestou atenção", "foi embora", "dormiu", "se perdeu"], "prestou atenção"),
      r("Qual frase está no sentido figurado?", ["O anel é de ouro.", "Ela tem um coração de ouro.", "O ouro é um metal.", "Comprei ouro na loja."], "Ela tem um coração de ouro."),
      r("Um texto diz: 'Ler amplia o vocabulário.' Qual frase apoia essa ideia?", ["Livros têm capas coloridas.", "Quem lê conhece mais palavras.", "Ler substitui conversar.", "Toda leitura é longa."], "Quem lê conhece mais palavras."),
      r("Qual frase é um fato, não uma opinião?", ["Futebol é o esporte mais bonito.", "O jogo terminou 2 a 1.", "O time devia ter vencido.", "O juiz foi injusto."], "O jogo terminou 2 a 1."),
      w("Qual frase mostra causa e consequência?", ["Como choveu, o jogo foi adiado.", "Choveu e jogo.", "O jogo, chuva, foi.", "Jogo ou chuva talvez."], "Como choveu, o jogo foi adiado."),
      w("Qual frase junta as ideias sem repetir? 'A escola criou uma horta. A escola usa a horta nas aulas.'", ["A escola criou uma horta e a usa nas aulas.", "A escola criou horta escola aulas.", "A horta escola usa a escola.", "A escola. Aulas. Horta."], "A escola criou uma horta e a usa nas aulas."),
      w("Complete: 'Ela treinou bastante, ___ venceu a corrida.'", ["porém", "por isso", "embora", "ou"], "por isso"),
      w("Complete: '___ muitos anos, moro nesta cidade.'", ["A", "Há", "Á", "Ah"], "Há"),
      w("Qual está escrita certa?", ["através", "atravez", "atravéz", "atraveiz"], "através"),
      w("Qual frase está certa?", ["Fazem dois anos que viajei.", "Faz dois anos que viajei.", "Fazem dois ano que viajei.", "Faz dois anos que viajaram eu."], "Faz dois anos que viajei."),
      n("Resolva: 2x + 3 = 11", ["x = 3", "x = 4", "x = 5", "x = 7"], "x = 4"),
      n("Resolva: 3x − 4 = 17", ["x = 5", "x = 6", "x = 7", "x = 8"], "x = 7"),
      n("15% de 200 = ?", ["15", "20", "30", "40"], "30"),
      n("Um produto de R$ 200 tem desconto de 10%. O preço final é:", ["R$ 180", "R$ 190", "R$ 210", "R$ 20"], "R$ 180"),
      n("Se 2 kg custam R$ 10, quanto custam 6 kg?", ["R$ 20", "R$ 30", "R$ 40", "R$ 60"], "R$ 30"),
      n("A média de 6, 8 e 10 é:", ["7", "8", "9", "24"], "8"),
      n("2³ = ?", ["6", "8", "9", "5"], "8"),
      n("(−3) + 5 = ?", ["−8", "−2", "2", "8"], "2"),
    ],
  },
  {
    id: "y16", label: "16 a 19 anos", minYears: 16, maxYears: 19,
    items: [
      r("Leia: 'Reciclar reduz o lixo nos aterros e economiza matéria-prima.' Quais são os dois benefícios citados?", ["menos lixo e economia de matéria-prima", "mais empregos e menos impostos", "água limpa e ar puro", "menos trânsito e mais parques"], "menos lixo e economia de matéria-prima"),
      r("Leia: 'Reciclar reduz o lixo nos aterros e economiza matéria-prima.' O autor é:", ["contra reciclar", "a favor de reciclar", "indiferente", "contra aterros apenas"], "a favor de reciclar"),
      r("Leia: 'A empresa adiou o lançamento em razão de falhas nos testes.' O lançamento foi adiado porque:", ["faltou dinheiro", "houve falhas nos testes", "choveu", "o produto vendeu muito"], "houve falhas nos testes"),
      r("Leia: 'Nem todo esforço garante sucesso, mas nenhum sucesso vem sem esforço.' O texto defende que o esforço é:", ["inútil", "necessário, mas não suficiente", "suficiente sozinho", "raro"], "necessário, mas não suficiente"),
      r("Qual informação é necessária para avaliar a força de um argumento?", ["a cor do papel", "a fonte ou evidência apresentada", "o tamanho da letra", "o nome do leitor"], "a fonte ou evidência apresentada"),
      r("'Ele bateu as botas' quer dizer que ele:", ["comprou botas", "morreu", "dançou", "correu"], "morreu"),
      w("Complete: 'Quero ___ do que você.'", ["mas", "mais", "más", "mays"], "mais"),
      w("Complete: 'Fui ___ escola de manhã.'", ["a", "à", "há", "ah"], "à"),
      w("Qual frase está de acordo com a norma culta?", ["Houve muitos problemas.", "Houveram muitos problemas.", "Houve muitos problema.", "Houveram muito problemas."], "Houve muitos problemas."),
      w("Qual frase está de acordo com a norma culta?", ["Faz dez anos que não o vejo.", "Fazem dez anos que não o vejo.", "Faz dez anos que não vejo ele.", "Fazem dez anos que não vejo ele."], "Faz dez anos que não o vejo."),
      w("Qual frase tem a vírgula no lugar certo?", ["Se puder, venha cedo.", "Se, puder venha cedo.", "Se puder venha, cedo.", "Se puder venha cedo,."], "Se puder, venha cedo."),
      w("Qual está escrita certa?", ["privilégio", "previlégio", "privilegio", "privilégeo"], "privilégio"),
      n("Se f(x) = 2x + 1, quanto é f(3)?", ["5", "6", "7", "8"], "7"),
      n("Resolva: 4x − 8 = 12", ["x = 3", "x = 4", "x = 5", "x = 6"], "x = 5"),
      n("Um produto de R$ 100 subiu 10% e depois caiu 10%. Preço final:", ["R$ 100", "R$ 99", "R$ 101", "R$ 90"], "R$ 99"),
      n("Ao lançar um dado comum, a chance de sair 6 é:", ["1/2", "1/3", "1/6", "6/1"], "1/6"),
      n("Juros simples de 5% ao mês sobre R$ 200, em 2 meses:", ["R$ 10", "R$ 20", "R$ 40", "R$ 210"], "R$ 20"),
      n("A média de 4, 8 e 12 é:", ["6", "8", "10", "24"], "8"),
      n("√81 = ?", ["7", "8", "9", "10"], "9"),
      n("Uma viagem de 180 km foi feita a 60 km/h. Quanto tempo levou?", ["2 h", "3 h", "4 h", "6 h"], "3 h"),
    ],
  },
];

export const OBJECTIVE_MIN_YEARS = 1;
export const OBJECTIVE_MAX_YEARS = 19;

export function objectiveBandForYears(years: number): ObjectiveBand | undefined {
  if (!Number.isInteger(years)) return undefined;
  return OBJECTIVE_BANDS.find((band) => years >= band.minYears && years <= band.maxYears);
}

/** Sonda 10 recebe os itens de índice par; OBS-10, os de índice ímpar. */
export function objectiveItems(tool: ObjectiveTool, years: number): ObjectiveItem[] {
  const band = objectiveBandForYears(years);
  if (!band) return [];
  const parity = tool === "sonda" ? 0 : 1;
  return band.items.filter((_, index) => index % 2 === parity);
}

export const OBJECTIVE_TOOL_TITLE: Record<ObjectiveTool, string> = { sonda: "Sonda 10", obs10: "OBS-10" };
