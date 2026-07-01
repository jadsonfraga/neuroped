import { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Eye, BookOpen, PenTool, Calculator, ClipboardCheck,
  RotateCcw, Brain, CheckCircle2, XCircle, ChevronRight,
} from "lucide-react";

// ─────────────────────────────── types ───────────────────────────────
type Band = "A" | "B" | "C" | "D" | "E" | "F" | "G";
type Domain = "visual" | "leitura" | "escrita" | "aritmetica";

interface MCQ {
  kind: "mcq";
  prompt: string;
  options: string[];
  answer: string;
  big?: boolean; // large emoji buttons for toddlers
}
interface ObsItem {
  label: string;
}
interface ObsBlock {
  kind: "obs";
  intro: string;
  items: ObsItem[];
}
type Question = MCQ | ObsBlock;

interface AnswerRecord {
  prompt: string;          // enunciado da pergunta ou habilidade observada
  correct?: string;        // resposta correta (apenas MCQ)
  selected: string | null; // o que a criança escolheu / "Observado" no bloco de observação
  isCorrect: boolean;
}
interface DomainResult {
  domain: Domain;
  label: string;
  score: number;
  max: number;
  answers: AnswerRecord[]; // registro item-a-item de todas as perguntas e respostas
}

// ─────────────────────────────── helpers ───────────────────────────────
function getBand(age: number): Band {
  if (age <= 3) return "A";
  if (age <= 5) return "B";
  if (age <= 7) return "C";
  if (age <= 9) return "D";
  if (age <= 12) return "E";
  if (age <= 15) return "F";
  return "G";
}

const BAND_LABEL: Record<Band, string> = {
  A: "2–3 anos (Pré-escolar inicial)",
  B: "4–5 anos (Pré-escolar tardio)",
  C: "6–7 anos (Alfabetização)",
  D: "8–9 anos (EF Anos Iniciais)",
  E: "10–12 anos (EF Anos Finais)",
  F: "13–15 anos (EF II / Início EM)",
  G: "16–19 anos (Ensino Médio)",
};

function interpret(score: number, max: number): string {
  const pct = score / max;
  if (pct >= 0.85) return "Desempenho esperado para a faixa etária";
  if (pct >= 0.65) return "Desempenho levemente abaixo do esperado — monitorar";
  if (pct >= 0.45) return "Desempenho abaixo do esperado — avaliar com escala padronizada";
  return "Desempenho muito abaixo do esperado — encaminhamento especializado sugerido";
}

// ─────────────────────────────── CONTENT BANKS ───────────────────────────────

const VISUAL_BANK: Record<Band, MCQ[]> = {
  A: [
    { kind: "mcq", prompt: "Toque no CACHORRO", big: true, options: ["🐶", "🐱", "🐰", "🐸"], answer: "🐶" },
    { kind: "mcq", prompt: "Qual é a cor VERMELHA?", big: true, options: ["🔴", "🔵", "🟡", "🟢"], answer: "🔴" },
    { kind: "mcq", prompt: "Toque no CÍRCULO", big: true, options: ["⚫", "🔷", "🔺", "⭐"], answer: "⚫" },
    { kind: "mcq", prompt: "Toque na BANANA", big: true, options: ["🍌", "🍎", "🍇", "🍊"], answer: "🍌" },
    { kind: "mcq", prompt: "Qual é a cor AZUL?", big: true, options: ["🔴", "🔵", "🟡", "🟢"], answer: "🔵" },
    { kind: "mcq", prompt: "Toque no SOL", big: true, options: ["☀️", "🌙", "⭐", "❄️"], answer: "☀️" },
  ],
  B: [
    { kind: "mcq", prompt: "Qual dessas é a LETRA A?", options: ["A", "4", "🐱", "★"], answer: "A" },
    { kind: "mcq", prompt: "Qual NÃO é uma fruta?", big: true, options: ["🍎", "🍌", "🐶", "🍊"], answer: "🐶" },
    { kind: "mcq", prompt: "Qual figura REPETE o padrão? ⬛⬛⬜⬛⬛_", options: ["⬜", "⬛", "🔺", "⭐"], answer: "⬜" },
    { kind: "mcq", prompt: "Qual letra é IGUAL a esta? → M", options: ["M", "N", "W", "H"], answer: "M" },
    { kind: "mcq", prompt: "Qual dessas é um NÚMERO?", options: ["5", "B", "🐱", "★"], answer: "5" },
    { kind: "mcq", prompt: "Quantas estrelas há aqui? ★★★★", options: ["4", "3", "5", "2"], answer: "4" },
  ],
  C: [
    { kind: "mcq", prompt: "Qual letra está FALTANDO? GA_O", options: ["T", "D", "P", "L"], answer: "T" },
    { kind: "mcq", prompt: "Qual número vem depois? 2 4 6 8 __", options: ["10", "9", "12", "7"], answer: "10" },
    { kind: "mcq", prompt: "Quantas letras tem a palavra CASA?", options: ["4", "3", "5", "2"], answer: "4" },
    { kind: "mcq", prompt: "Qual das palavras está escrita CORRETAMENTE?", options: ["BOLA", "BBOLA", "ABOLA", "BOLAA"], answer: "BOLA" },
    { kind: "mcq", prompt: "Qual número é MAIOR?", options: ["15", "8", "São iguais", "Não sei"], answer: "15" },
    { kind: "mcq", prompt: "Qual figura completa a série? △○△○__", options: ["△", "○", "□", "★"], answer: "△" },
  ],
  D: [
    { kind: "mcq", prompt: "Qual completa o padrão? 🔴🔵🔴🔵🔴__", options: ["🔵", "🔴", "🟡", "🟢"], answer: "🔵" },
    { kind: "mcq", prompt: "Qual NÃO pertence ao grupo? 🍎 🍌 🍇 🐶", options: ["🐶", "🍎", "🍌", "🍇"], answer: "🐶" },
    { kind: "mcq", prompt: "Qual número vem depois? 5 10 15 20 __", options: ["25", "21", "30", "24"], answer: "25" },
    { kind: "mcq", prompt: "Qual palavra tem MAIS letras?", options: ["ELEFANTE", "GATO", "SOL", "BOLA"], answer: "ELEFANTE" },
    { kind: "mcq", prompt: "Qual figura completa: ⬛⬜⬛⬜⬛__", options: ["⬜", "⬛", "🔺", "⭐"], answer: "⬜" },
    { kind: "mcq", prompt: "Qual animal é o MAIOR?", options: ["🐘", "🐭", "🐜", "🐝"], answer: "🐘" },
  ],
  E: [
    { kind: "mcq", prompt: "Qual completa? △○△○△__", options: ["○", "△", "□", "★"], answer: "○" },
    { kind: "mcq", prompt: "Qual NÃO pertence ao grupo?", options: ["cadeira", "cachorro", "gato", "cavalo"], answer: "cadeira" },
    { kind: "mcq", prompt: "Qual número vem depois? 10 20 30 40 __", options: ["50", "45", "60", "55"], answer: "50" },
    { kind: "mcq", prompt: "Se hoje é TERÇA, amanhã é:", options: ["quarta", "segunda", "quinta", "domingo"], answer: "quarta" },
    { kind: "mcq", prompt: "Qual é o OPOSTO de CHEIO?", options: ["vazio", "grande", "pesado", "novo"], answer: "vazio" },
    { kind: "mcq", prompt: "Qual completa: 🟥🟧🟨🟥🟧__", options: ["🟨", "🟥", "🟧", "🟩"], answer: "🟨" },
  ],
  F: [
    { kind: "mcq", prompt: "Qual número vem depois? 3 6 9 12 __", options: ["15", "14", "18", "16"], answer: "15" },
    { kind: "mcq", prompt: "Qual NÃO pertence ao grupo?", options: ["cenoura", "maçã", "banana", "uva"], answer: "cenoura" },
    { kind: "mcq", prompt: "Qual letra completa? A B C D __", options: ["E", "F", "G", "H"], answer: "E" },
    { kind: "mcq", prompt: "Qual é o OPOSTO de SUBIR?", options: ["descer", "correr", "parar", "pular"], answer: "descer" },
    { kind: "mcq", prompt: "Todos os pássaros voam. O canário é um pássaro. Então o canário:", options: ["voa", "nada", "corre", "late"], answer: "voa" },
    { kind: "mcq", prompt: "DIA está para NOITE assim como SOL está para:", options: ["lua", "céu", "estrela", "nuvem"], answer: "lua" },
  ],
  G: [
    { kind: "mcq", prompt: "Qual número vem depois? 100 90 80 70 __", options: ["60", "65", "50", "75"], answer: "60" },
    { kind: "mcq", prompt: "Qual NÃO pertence ao grupo?", options: ["azul", "triângulo", "quadrado", "círculo"], answer: "azul" },
    { kind: "mcq", prompt: "Qual número vem depois? 2 4 8 16 __", options: ["32", "24", "20", "18"], answer: "32" },
    { kind: "mcq", prompt: "MÃO está para LUVA assim como PÉ está para:", options: ["sapato", "perna", "dedo", "chão"], answer: "sapato" },
    { kind: "mcq", prompt: "Qual é o OPOSTO de AUMENTAR?", options: ["diminuir", "crescer", "somar", "dobrar"], answer: "diminuir" },
    { kind: "mcq", prompt: "Se A é maior que B, e B é maior que C, então A é ___ que C:", options: ["maior", "menor", "igual", "não dá para saber"], answer: "maior" },
  ],
};

const LEITURA_BANK: Record<Band, MCQ[]> = {
  A: [
    { kind: "mcq", prompt: "Qual desses você usa para ESCREVER palavras?", big: true, options: ["A", "🐱", "★", "🚗"], answer: "A" },
    { kind: "mcq", prompt: "Em que direção lemos em português? →", options: ["Da esquerda para direita", "Da direita para esquerda", "De cima para baixo", "Tanto faz"], answer: "Da esquerda para direita" },
    { kind: "mcq", prompt: "Qual desses é um LIVRO?", big: true, options: ["📚", "🎵", "🚗", "🍎"], answer: "📚" },
    { kind: "mcq", prompt: "Quantas letras tem A-B-C?", options: ["3", "2", "4", "1"], answer: "3" },
    { kind: "mcq", prompt: "O que fica no COMEÇO de uma frase?", options: ["Letra maiúscula", "Ponto final", "Vírgula", "Nada"], answer: "Letra maiúscula" },
    { kind: "mcq", prompt: "Qual desses é um NÚMERO?", big: true, options: ["5", "B", "A", "🌙"], answer: "5" },
  ],
  B: [
    { kind: "mcq", prompt: "Qual palavra RIMA com PÃO?", options: ["MÃO", "CASA", "PEIXE", "BOLA"], answer: "MÃO" },
    { kind: "mcq", prompt: "Qual palavra começa com o mesmo som de SAPO?", options: ["SINO", "FACA", "RATO", "DEDO"], answer: "SINO" },
    { kind: "mcq", prompt: "Qual palavra começa com a letra B?", options: ["BOLA", "GATO", "PATO", "SAPO"], answer: "BOLA" },
    { kind: "mcq", prompt: "Quantas SÍLABAS tem a palavra MA-CA-CO?", options: ["3", "2", "4", "1"], answer: "3" },
    { kind: "mcq", prompt: "Qual é o PRIMEIRO som da palavra FADA?", options: ["F", "A", "D", "G"], answer: "F" },
    { kind: "mcq", prompt: "Qual palavra RIMA com BOLA?", options: ["SACOLA", "MESA", "CARRO", "PATO"], answer: "SACOLA" },
  ],
  C: [
    { kind: "mcq", prompt: "📖 'O gato Miau dorme no tapete cinza. Ele acorda ao ouvir um barulho.'\n\nComo se chama o gato?", options: ["Miau", "Cinza", "Tapete", "Barulho"], answer: "Miau" },
    { kind: "mcq", prompt: "📖 (mesmo texto)\n\nQual era a cor do gato?", options: ["Cinza", "Preta", "Branca", "Amarela"], answer: "Cinza" },
    { kind: "mcq", prompt: "📖 (mesmo texto)\n\nPor que o gato acordou?", options: ["Ouviu um barulho", "Estava com fome", "Viu um rato", "Alguém chamou"], answer: "Ouviu um barulho" },
    { kind: "mcq", prompt: "Qual sílaba completa a palavra? PA-__-TO", options: ["RA", "SA", "NA", "LA"], answer: "RA" },
    { kind: "mcq", prompt: "Que palavra está escrita? D-A-D-O", options: ["DADO", "LADO", "BADO", "DADA"], answer: "DADO" },
    { kind: "mcq", prompt: "Quantas palavras há na frase: 'O gato é cinza'?", options: ["4", "3", "5", "2"], answer: "4" },
  ],
  D: [
    { kind: "mcq", prompt: "📖 'Ana foi à biblioteca buscar um livro de astronomia. Ela leu sobre planetas e estrelas. Depois fez um resumo para a professora.'\n\nO que Ana foi buscar?", options: ["Um livro", "Uma revista", "Um notebook", "Um mapa"], answer: "Um livro" },
    { kind: "mcq", prompt: "📖 (mesmo texto)\n\nSobre o que era o livro?", options: ["Astronomia", "Animais", "Plantas", "História"], answer: "Astronomia" },
    { kind: "mcq", prompt: "📖 (mesmo texto)\n\nO que ela fez depois de ler?", options: ["Um resumo", "Uma prova", "Uma redação", "Uma apresentação"], answer: "Um resumo" },
    { kind: "mcq", prompt: "Qual palavra tem 3 sílabas?", options: ["BORBOLETA", "GATO", "SAPO", "PATO"], answer: "BORBOLETA" },
    { kind: "mcq", prompt: "Qual é o plural de LEÃO?", options: ["LEÕES", "LEÃOS", "LEONES", "LEAOS"], answer: "LEÕES" },
    { kind: "mcq", prompt: "Qual frase está CORRETA?", options: ["Eu gosto de estudar.", "Eu gosta de estudar.", "Eu gostei de estudar .", "eu gosto De estudar."], answer: "Eu gosto de estudar." },
  ],
  E: [
    { kind: "mcq", prompt: "📖 'O João tem um cachorro chamado Rex. Todo dia, depois da escola, ele leva o Rex para passear no parque.'\n\nComo se chama o cachorro?", options: ["Rex", "João", "Parque", "Bola"], answer: "Rex" },
    { kind: "mcq", prompt: "📖 (mesmo texto)\n\nQuando o João passeia com o Rex?", options: ["Depois da escola", "De manhã cedo", "À noite", "No fim de semana"], answer: "Depois da escola" },
    { kind: "mcq", prompt: "📖 (mesmo texto)\n\nOnde eles passeiam?", options: ["No parque", "Na praia", "Na escola", "Em casa"], answer: "No parque" },
    { kind: "mcq", prompt: "Qual palavra é SINÔNIMO de ALEGRE?", options: ["Feliz", "Triste", "Cansado", "Bravo"], answer: "Feliz" },
    { kind: "mcq", prompt: "Qual é a ideia principal? 'Escovar os dentes todos os dias evita cáries.'", options: ["Escovar os dentes faz bem à saúde", "Cáries são bonitas", "Dentes são brancos", "Escovar demora muito"], answer: "Escovar os dentes faz bem à saúde" },
    { kind: "mcq", prompt: "Complete: 'Não fui à escola ___ estava doente.'", options: ["porque", "mas", "então", "ou"], answer: "porque" },
  ],
  F: [
    { kind: "mcq", prompt: "📖 'Maria estudou muito para a prova. Quando recebeu a nota, sorriu e comemorou com os amigos.'\n\nComo Maria ficou com a nota?", options: ["Feliz", "Triste", "Com raiva", "Com medo"], answer: "Feliz" },
    { kind: "mcq", prompt: "📖 (mesmo texto)\n\nO que mostra que ela foi bem?", options: ["Sorriu e comemorou", "Chorou", "Ficou quieta", "Foi embora"], answer: "Sorriu e comemorou" },
    { kind: "mcq", prompt: "Qual é o OPOSTO de DIFÍCIL?", options: ["Fácil", "Grande", "Rápido", "Novo"], answer: "Fácil" },
    { kind: "mcq", prompt: "'Ele tem um coração de ouro.' Isso quer dizer que ele é:", options: ["Muito bom", "Muito rico", "Muito forte", "Muito alto"], answer: "Muito bom" },
    { kind: "mcq", prompt: "Qual conector indica OPOSIÇÃO? 'Queria sair, ___ estava chovendo.'", options: ["mas", "porque", "então", "e"], answer: "mas" },
    { kind: "mcq", prompt: "O que significa 'quebrar a cabeça'?", options: ["Pensar muito", "Se machucar", "Dormir", "Correr"], answer: "Pensar muito" },
  ],
  G: [
    { kind: "mcq", prompt: "📖 'Usar o celular antes de dormir pode atrapalhar o sono, porque a luz da tela deixa o cérebro mais alerta.'\n\nSegundo o texto, o celular à noite pode:", options: ["Atrapalhar o sono", "Melhorar o sono", "Cansar os olhos apenas", "Não mudar nada"], answer: "Atrapalhar o sono" },
    { kind: "mcq", prompt: "📖 (mesmo texto)\n\nPor que o celular atrapalha o sono?", options: ["A luz deixa o cérebro alerta", "Ele é pesado", "Faz muito barulho", "Fica sem bateria"], answer: "A luz deixa o cérebro alerta" },
    { kind: "mcq", prompt: "Qual palavra é SINÔNIMO de INICIAR?", options: ["Começar", "Terminar", "Parar", "Fechar"], answer: "Começar" },
    { kind: "mcq", prompt: "'Ele ficou de olho na situação.' Significa que ele:", options: ["Prestou atenção", "Foi embora", "Dormiu", "Ficou perdido"], answer: "Prestou atenção" },
    { kind: "mcq", prompt: "Qual frase está no sentido FIGURADO?", options: ["Ela tem um coração de ouro.", "O anel é de ouro.", "Comprei ouro na loja.", "O ouro é um metal."], answer: "Ela tem um coração de ouro." },
    { kind: "mcq", prompt: "Qual conector indica CONCLUSÃO? 'Estudou muito, ___ passou.'", options: ["portanto", "mas", "porque", "embora"], answer: "portanto" },
  ],
};

const ESCRITA_BANK: Record<Band, Question[]> = {
  A: [{
    kind: "obs",
    intro: "Observe a criança tentando fazer as atividades abaixo (com lápis/caneta). Marque o que ela consegue realizar:",
    items: [
      { label: "Segura o lápis/caneta com a mão (mesmo que de forma irregular)" },
      { label: "Faz marcas intencionais no papel (rabiscos)" },
      { label: "Imita traços horizontais quando demonstrado" },
      { label: "Imita traços verticais quando demonstrado" },
      { label: "Tenta copiar um círculo quando demonstrado" },
      { label: "Diferencia texto de desenho (sabe que letras são símbolos)" },
    ],
  }],
  B: [{
    kind: "obs",
    intro: "Observe e marque as habilidades de pré-escrita que a criança demonstra:",
    items: [
      { label: "Escreve (ou tenta escrever) o próprio nome" },
      { label: "Reconhece o próprio nome escrito entre outros nomes" },
      { label: "Copia letras simples isoladas (A, O, L, I)" },
      { label: "Diferencia letras de números ao olhar" },
      { label: "Copia o nome de objetos familiares com ajuda" },
      { label: "Mostra preferência por uma das mãos para escrever" },
    ],
  }],
  C: [
    { kind: "mcq", prompt: "Como se escreve o som 'bê-o-lê-a'?", options: ["BOLA", "BÔLA", "VOLA", "BOLLA"], answer: "BOLA" },
    { kind: "mcq", prompt: "Qual é a grafia CORRETA?", options: ["GATO", "GATTO", "GATU", "GÁTO"], answer: "GATO" },
    { kind: "mcq", prompt: "Complete: O menino ___ para a escola.", options: ["foi", "fo", "foio", "foy"], answer: "foi" },
    { kind: "mcq", prompt: "Qual palavra está ESCRITA ERRADA?", options: ["PAÇOCA", "CASA", "DATO", "BOLA"], answer: "DATO" },
    { kind: "mcq", prompt: "Qual frase está CORRETA para uma criança escrever?", options: ["Eu gosto de brincar.", "Eu gosta de brincá.", "Eu goste de brinca.", "eu Gosto de Brincar."], answer: "Eu gosto de brincar." },
    { kind: "mcq", prompt: "Qual é o plural correto de FLOR?", options: ["FLORES", "FLORS", "FLORÊS", "FLORE"], answer: "FLORES" },
  ],
  D: [
    { kind: "mcq", prompt: "Qual palavra está escrita CORRETAMENTE?", options: ["casa", "kaza", "caza", "cassa"], answer: "casa" },
    { kind: "mcq", prompt: "Qual palavra usa ACENTO corretamente?", options: ["café", "cafe", "cafê", "cáfe"], answer: "café" },
    { kind: "mcq", prompt: "Qual frase tem PONTUAÇÃO correta?", options: ["Que dia lindo!", "que dia lindo", "Que dia lindo,", "QUE dia lindo"], answer: "Que dia lindo!" },
    { kind: "mcq", prompt: "Qual palavra está ESCRITA ERRADA?", options: ["caza", "escola", "amigo", "bola"], answer: "caza" },
    { kind: "mcq", prompt: "Qual palavra é SINÔNIMO de 'bonito'?", options: ["Belo", "Feio", "Triste", "Grande"], answer: "Belo" },
    { kind: "mcq", prompt: "Complete: 'Ontem eu ___ à escola.'", options: ["fui", "vou", "vai", "irei"], answer: "fui" },
  ],
  E: [
    { kind: "mcq", prompt: "Qual frase está CORRETA?", options: ["Os meninos brincaram no parque.", "Os meninos brincou no parque.", "Os menino brincou no parque.", "O meninos brincaram."], answer: "Os meninos brincaram no parque." },
    { kind: "mcq", prompt: "Qual é o plural de 'animal'?", options: ["animais", "animals", "animales", "animauis"], answer: "animais" },
    { kind: "mcq", prompt: "Complete: 'Nós ___ felizes.'", options: ["estamos", "está", "estou", "estão"], answer: "estamos" },
    { kind: "mcq", prompt: "Qual palavra está escrita CERTA?", options: ["hoje", "oje", "hoji", "ogi"], answer: "hoje" },
    { kind: "mcq", prompt: "Qual palavra é SINÔNIMO de 'rápido'?", options: ["Veloz", "Lento", "Pesado", "Alto"], answer: "Veloz" },
    { kind: "mcq", prompt: "Qual frase usa a letra maiúscula corretamente?", options: ["Meu nome é Ana.", "meu nome é ana.", "Meu Nome É Ana.", "meu nome É ana."], answer: "Meu nome é Ana." },
  ],
  F: [
    { kind: "mcq", prompt: "Qual frase está CORRETA?", options: ["Ela foi bem na prova.", "Ela foram bem na prova.", "Ela fui bem na prova.", "Ela vai bem na prova ontem."], answer: "Ela foi bem na prova." },
    { kind: "mcq", prompt: "Qual é o SINÔNIMO de 'inteligente'?", options: ["Esperto", "Bobo", "Cansado", "Alto"], answer: "Esperto" },
    { kind: "mcq", prompt: "Qual é o OPOSTO de 'começar'?", options: ["Terminar", "Iniciar", "Abrir", "Andar"], answer: "Terminar" },
    { kind: "mcq", prompt: "Qual palavra está escrita CERTA?", options: ["exercício", "exercicio", "ezercício", "exersício"], answer: "exercício" },
    { kind: "mcq", prompt: "Qual frase está no PASSADO?", options: ["Ontem eu estudei.", "Amanhã eu estudo.", "Eu estudo agora.", "Eu vou estudar."], answer: "Ontem eu estudei." },
    { kind: "mcq", prompt: "Complete: 'Ele ___ muito feliz com a notícia.'", options: ["ficou", "ficaram", "ficamos", "ficastes"], answer: "ficou" },
  ],
  G: [
    { kind: "mcq", prompt: "Qual frase está mais bem escrita?", options: ["Precisamos economizar água.", "Precisa economizar nós água.", "Nós precisa economizar água.", "Água economizar precisamos."], answer: "Precisamos economizar água." },
    { kind: "mcq", prompt: "Qual é o SINÔNIMO de 'objetivo'?", options: ["Meta", "Dúvida", "Erro", "Fim ruim"], answer: "Meta" },
    { kind: "mcq", prompt: "Qual é o OPOSTO de 'vantagem'?", options: ["Desvantagem", "Benefício", "Lucro", "Ganho"], answer: "Desvantagem" },
    { kind: "mcq", prompt: "Qual palavra está escrita CORRETA?", options: ["através", "atravez", "atravéz", "atraveiz"], answer: "através" },
    { kind: "mcq", prompt: "Qual frase é uma OPINIÃO (não um fato)?", options: ["Este é o melhor filme do ano.", "O filme dura duas horas.", "O filme é colorido.", "O filme foi lançado ontem."], answer: "Este é o melhor filme do ano." },
    { kind: "mcq", prompt: "Complete formalmente: 'Ele agiu de forma ___.'", options: ["adequada", "adequado", "adequadas", "adequa"], answer: "adequada" },
  ],
};

const ARITMETICA_BANK: Record<Band, MCQ[]> = {
  A: [
    { kind: "mcq", prompt: "Qual grupo tem MAIS?", big: true, options: ["🍎🍎🍎 (3)", "🍎🍎 (2)", "🍎 (1)", "São iguais"], answer: "🍎🍎🍎 (3)" },
    { kind: "mcq", prompt: "Quantos há aqui? 🐶🐶", options: ["2", "1", "3", "4"], answer: "2" },
    { kind: "mcq", prompt: "Qual número vem DEPOIS do 2?", options: ["3", "1", "4", "2"], answer: "3" },
    { kind: "mcq", prompt: "Quantos dedos tem UMA mão?", options: ["5", "4", "6", "3"], answer: "5" },
    { kind: "mcq", prompt: "Qual grupo tem MENOS?", big: true, options: ["⭐ (1)", "⭐⭐⭐ (3)", "⭐⭐ (2)", "São iguais"], answer: "⭐ (1)" },
    { kind: "mcq", prompt: "1 + 1 = ?", options: ["2", "3", "1", "4"], answer: "2" },
  ],
  B: [
    { kind: "mcq", prompt: "Qual número vem depois de 9?", options: ["10", "8", "11", "7"], answer: "10" },
    { kind: "mcq", prompt: "2 + 3 = ?", options: ["5", "4", "6", "3"], answer: "5" },
    { kind: "mcq", prompt: "Tenho 5 balas e como 2. Quantas restam?", options: ["3", "2", "4", "7"], answer: "3" },
    { kind: "mcq", prompt: "Qual número é MAIOR: 7 ou 4?", options: ["7", "4", "São iguais", "Não sei"], answer: "7" },
    { kind: "mcq", prompt: "4 + 4 = ?", options: ["8", "6", "9", "7"], answer: "8" },
    { kind: "mcq", prompt: "Qual vem depois? 1, 2, 3, 4, ___", options: ["5", "6", "3", "10"], answer: "5" },
  ],
  C: [
    { kind: "mcq", prompt: "8 + 7 = ?", options: ["15", "14", "16", "13"], answer: "15" },
    { kind: "mcq", prompt: "20 − 6 = ?", options: ["14", "15", "13", "12"], answer: "14" },
    { kind: "mcq", prompt: "Qual é a metade de 10?", options: ["5", "4", "6", "3"], answer: "5" },
    { kind: "mcq", prompt: "Tenho 3 grupos de 4 maçãs. Quantas maçãs no total?", options: ["12", "7", "10", "9"], answer: "12" },
    { kind: "mcq", prompt: "Qual número está entre 15 e 19?", options: ["17", "14", "20", "12"], answer: "17" },
    { kind: "mcq", prompt: "45 + 30 = ?", options: ["75", "70", "80", "65"], answer: "75" },
  ],
  D: [
    { kind: "mcq", prompt: "6 + 7 = ?", options: ["13", "12", "14", "15"], answer: "13" },
    { kind: "mcq", prompt: "15 − 8 = ?", options: ["7", "8", "6", "9"], answer: "7" },
    { kind: "mcq", prompt: "3 × 4 = ?", options: ["12", "7", "9", "14"], answer: "12" },
    { kind: "mcq", prompt: "Tenho 10 balas para dividir igualmente com 1 amigo. Cada um fica com:", options: ["5", "10", "2", "8"], answer: "5" },
    { kind: "mcq", prompt: "Qual é a metade de 20?", options: ["10", "5", "15", "20"], answer: "10" },
    { kind: "mcq", prompt: "Qual número é MAIOR: 34 ou 43?", options: ["43", "34", "São iguais", "Não sei"], answer: "43" },
  ],
  E: [
    { kind: "mcq", prompt: "25 + 48 = ?", options: ["73", "63", "83", "72"], answer: "73" },
    { kind: "mcq", prompt: "9 × 6 = ?", options: ["54", "56", "45", "63"], answer: "54" },
    { kind: "mcq", prompt: "50% de 40 = ?", options: ["20", "10", "40", "30"], answer: "20" },
    { kind: "mcq", prompt: "Tenho 24 figurinhas em 3 pacotes iguais. Cada pacote tem:", options: ["8", "6", "9", "12"], answer: "8" },
    { kind: "mcq", prompt: "Qual é a metade de 50?", options: ["25", "20", "30", "50"], answer: "25" },
    { kind: "mcq", prompt: "Qual número vem depois? 5 10 15 20 __", options: ["25", "24", "30", "21"], answer: "25" },
  ],
  F: [
    { kind: "mcq", prompt: "100 − 37 = ?", options: ["63", "67", "73", "57"], answer: "63" },
    { kind: "mcq", prompt: "12 × 5 = ?", options: ["60", "50", "55", "65"], answer: "60" },
    { kind: "mcq", prompt: "10% de 200 = ?", options: ["20", "10", "200", "2"], answer: "20" },
    { kind: "mcq", prompt: "Um lápis custa R$ 2. Quanto custam 6 lápis?", options: ["R$ 12", "R$ 8", "R$ 10", "R$ 14"], answer: "R$ 12" },
    { kind: "mcq", prompt: "Qual é o dobro de 15?", options: ["30", "25", "45", "15"], answer: "30" },
    { kind: "mcq", prompt: "Uma pizza tem 8 fatias. Se você come 3, sobram:", options: ["5", "4", "6", "3"], answer: "5" },
  ],
  G: [
    { kind: "mcq", prompt: "Um produto custa R$ 80 e tem 25% de desconto. Preço final:", options: ["R$ 60", "R$ 55", "R$ 20", "R$ 75"], answer: "R$ 60" },
    { kind: "mcq", prompt: "Qual é a MÉDIA de 4, 6 e 8?", options: ["6", "5", "7", "9"], answer: "6" },
    { kind: "mcq", prompt: "Se 3 canetas custam R$ 9, uma caneta custa:", options: ["R$ 3", "R$ 6", "R$ 9", "R$ 2"], answer: "R$ 3" },
    { kind: "mcq", prompt: "Quanto é 15% de 100?", options: ["15", "10", "20", "150"], answer: "15" },
    { kind: "mcq", prompt: "Uma viagem de 120 km a 60 km/h leva quanto tempo?", options: ["2 horas", "1 hora", "3 horas", "4 horas"], answer: "2 horas" },
    { kind: "mcq", prompt: "Qual é o triplo de 20?", options: ["60", "40", "50", "23"], answer: "60" },
  ],
};

// ─────────────────────────────── ObsModule ───────────────────────────────
function ObsModule({ block, onComplete }: {
  block: ObsBlock;
  onComplete: (score: number, max: number, answers: AnswerRecord[]) => void;
}) {
  const [answers, setAnswers] = useState<boolean[]>(Array(block.items.length).fill(false));
  const [done, setDone] = useState(false);

  function toggle(i: number) {
    if (done) return;
    setAnswers((prev) => { const n = [...prev]; n[i] = !n[i]; return n; });
  }

  function finish() {
    const score = answers.filter(Boolean).length;
    const records: AnswerRecord[] = block.items.map((it, i) => ({
      prompt: it.label,
      selected: answers[i] ? "Observado" : "Não observado",
      isCorrect: Boolean(answers[i]),
    }));
    setDone(true);
    onComplete(score, block.items.length, records);
  }

  const score = answers.filter(Boolean).length;

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">{block.intro}</p>
      <div className="space-y-2">
        {block.items.map((item, i) => (
          <button
            key={i}
            type="button"
            onClick={() => toggle(i)}
            className={`w-full text-left flex items-center gap-3 rounded-xl border p-3 transition ${answers[i] ? "border-emerald-400 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/30" : "border-border bg-background hover:border-primary/40"}`}
            aria-pressed={answers[i]}
          >
            <span className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border text-sm ${answers[i] ? "border-emerald-500 bg-emerald-500 text-white" : "border-border"}`}>
              {answers[i] ? "✓" : ""}
            </span>
            <span className="text-sm text-foreground">{item.label}</span>
          </button>
        ))}
      </div>
      {!done
        ? <Button onClick={finish} className="w-full mt-2">Finalizar observação ({score}/{block.items.length} marcados)</Button>
        : (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-4 text-center">
              <div className="text-3xl mb-1">✅</div>
              <p className="text-sm font-bold">{score}/{block.items.length} habilidades observadas</p>
            </CardContent>
          </Card>
        )}
    </div>
  );
}

// ─────────────────────────────── QuizModule ───────────────────────────────
function QuizModule({ questions, onComplete }: {
  questions: MCQ[];
  onComplete: (score: number, max: number, answers: AnswerRecord[]) => void;
}) {
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [phase, setPhase] = useState<"question" | "feedback" | "done">("question");

  const q = questions[idx];
  const isCorrect = selected === q?.answer;

  function pick(opt: string) {
    if (phase !== "question") return;
    setSelected(opt);
    setPhase("feedback");
    const ok = opt === q.answer;
    if (ok) setScore((s) => s + 1);
    setAnswers((a) => [...a, { prompt: q.prompt, correct: q.answer, selected: opt, isCorrect: ok }]);
  }

  function handleComplete() {
    onComplete(score, questions.length, answers);
  }

  if (phase === "done" || idx >= questions.length) {
    return (
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-5 text-center space-y-2">
          <div className="text-4xl">🏆</div>
          <p className="text-sm font-bold text-foreground">{score} / {questions.length} corretas</p>
          <p className="text-xs text-muted-foreground">({Math.round((score / questions.length) * 100)}%)</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Badge variant="outline">Questão {idx + 1} / {questions.length}</Badge>
        <Badge variant="outline" className="gap-1"><span className="text-emerald-500">●</span> Acertos: {score}</Badge>
      </div>

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-blue-500 transition-all duration-500 ease-out" style={{ width: `${((idx) / questions.length) * 100}%` }} />
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-br from-muted/50 to-transparent p-4 sm:p-5 shadow-sm">
        <p className={`relative text-foreground leading-relaxed whitespace-pre-line ${q.big ? "text-xl font-bold text-center" : "text-sm font-semibold"}`}>{q.prompt}</p>
      </div>

      <div className={`grid gap-2 ${q.big ? "grid-cols-2" : "grid-cols-1"}`}>
        {q.options.map((opt) => {
          let cls = "rounded-2xl border p-3 text-left transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]";
          if (phase === "feedback") {
            if (opt === q.answer) cls += " border-emerald-500 bg-emerald-50 shadow-sm shadow-emerald-500/10 dark:border-emerald-600 dark:bg-emerald-950/40";
            else if (opt === selected) cls += " border-red-400 bg-red-50 dark:border-red-700 dark:bg-red-950/30";
            else cls += " border-border bg-background opacity-50";
          } else {
            cls += " border-border bg-background hover:-translate-y-0.5 hover:border-primary/60 hover:bg-primary/5 hover:shadow-sm cursor-pointer";
          }

          return (
            <button
              key={opt}
              type="button"
              onClick={() => pick(opt)}
              disabled={phase === "feedback"}
              className={`${cls} ${q.big ? "min-h-[64px] text-2xl text-center flex items-center justify-center" : "text-sm"}`}
            >
              {q.big ? <span>{opt}</span> : <span className="font-medium">{opt}</span>}
            </button>
          );
        })}
      </div>

      {phase === "feedback" && (
        <div className={`rounded-xl p-3 flex items-center gap-2 ${isCorrect ? "bg-emerald-50 border border-emerald-300 dark:bg-emerald-950/30 dark:border-emerald-700" : "bg-red-50 border border-red-300 dark:bg-red-950/30 dark:border-red-700"}`}>
          {isCorrect
            ? <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
            : <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />}
          <span className={`text-xs font-semibold ${isCorrect ? "text-emerald-800 dark:text-emerald-200" : "text-red-800 dark:text-red-200"}`}>
            {isCorrect ? "Correto!" : `Resposta: ${q.answer}`}
          </span>
          <Button
            size="sm"
            variant="ghost"
            className="ml-auto h-7 text-xs gap-1"
            onClick={() => {
              if (idx + 1 >= questions.length) {
                setPhase("done");
                handleComplete();
              } else {
                setIdx((i) => i + 1);
                setSelected(null);
                setPhase("question");
              }
            }}
          >
            Próxima <ChevronRight className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────── DOMAIN WRAPPER ───────────────────────────────
const DOMAIN_LABELS: Record<Domain, string> = {
  visual: "Reconhecimento Visual",
  leitura: "Leitura",
  escrita: "Escrita / Ortografia",
  aritmetica: "Aritmética",
};

function DomainModule({ domain, band, onComplete, result }: {
  domain: Domain;
  band: Band;
  onComplete: (r: DomainResult) => void;
  result?: DomainResult;
}) {
  const [started, setStarted] = useState(false);
  const [reset, setReset] = useState(0);

  const bank = {
    visual: VISUAL_BANK[band],
    leitura: LEITURA_BANK[band],
    escrita: ESCRITA_BANK[band],
    aritmetica: ARITMETICA_BANK[band],
  }[domain];

  const handleComplete = useCallback((score: number, max: number, answers: AnswerRecord[]) => {
    onComplete({ domain, label: DOMAIN_LABELS[domain], score, max, answers });
  }, [domain, onComplete]);

  if (result && !started) {
    return (
      <div className="space-y-3">
        <Card className="border-emerald-300 bg-emerald-50/60 dark:border-emerald-800 dark:bg-emerald-950/20">
          <CardContent className="p-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-emerald-800 dark:text-emerald-200 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" /> {result.label} — concluído
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {result.score}/{result.max} corretas ({Math.round((result.score / result.max) * 100)}%) · {interpret(result.score, result.max)}
              </p>
            </div>
            <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => { setStarted(false); setReset((r) => r + 1); onComplete({ domain, label: DOMAIN_LABELS[domain], score: 0, max: 0, answers: [] }); }}>
              <RotateCcw className="h-3.5 w-3.5" /> Refazer
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!started) {
    const descriptions: Record<Domain, string> = {
      visual: "Tarefas de reconhecimento de objetos, padrões, letras e raciocínio visual adaptadas à faixa etária.",
      leitura: "Avaliação de habilidades de leitura — consciência fonológica, decodificação e compreensão de texto.",
      escrita: band <= "B" ? "Lista de observação das habilidades de pré-escrita. Marque o que a criança demonstra." : "Tarefas de ortografia, gramática e estrutura textual adequadas à série.",
      aritmetica: "Operações matemáticas, raciocínio numérico e resolução de problemas por nível de escolaridade.",
    };
    return (
      <div className="space-y-3 text-center py-4">
        <p className="text-sm text-muted-foreground">{descriptions[domain]}</p>
        <Button onClick={() => setStarted(true)} className="gap-2">
          Iniciar módulo <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  // escrita Band A or B → observation checklist
  if (domain === "escrita" && (band === "A" || band === "B")) {
    const block = ESCRITA_BANK[band][0] as ObsBlock;
    return <ObsModule key={reset} block={block} onComplete={handleComplete} />;
  }

  return <QuizModule key={reset} questions={bank as MCQ[]} onComplete={handleComplete} />;
}

// ─────────────────────────────── MAIN PAGE ───────────────────────────────
const DOMAINS: { id: Domain; label: string; icon: typeof Eye; color: string }[] = [
  { id: "visual", label: "Visual", icon: Eye, color: "text-violet-600" },
  { id: "leitura", label: "Leitura", icon: BookOpen, color: "text-blue-600" },
  { id: "escrita", label: "Escrita", icon: PenTool, color: "text-amber-600" },
  { id: "aritmetica", label: "Aritmética", icon: Calculator, color: "text-emerald-600" },
];

export default function AvaliacaoCognitivaInfantilPage() {
  const [ageStr, setAgeStr] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [activeDomain, setActiveDomain] = useState<Domain>("visual");
  const [results, setResults] = useState<Partial<Record<Domain, DomainResult>>>({});

  const age = parseInt(ageStr, 10);
  const validAge = !isNaN(age) && age >= 2 && age <= 19;
  const band: Band | null = validAge ? getBand(age) : null;

  function handleResult(r: DomainResult) {
    if (r.max === 0) {
      setResults((prev) => { const n = { ...prev }; delete n[r.domain]; return n; });
    } else {
      setResults((prev) => ({ ...prev, [r.domain]: r }));
    }
  }

  const completedDomains = Object.values(results).filter((r) => r && r.max > 0);
  const allDone = completedDomains.length === 4;

  const answerLine = (a: AnswerRecord): string =>
    a.correct !== undefined
      ? (a.isCorrect ? `respondeu ${a.selected}` : `respondeu ${a.selected ?? "—"} | correto: ${a.correct}`)
      : `${a.selected}`;

  const reportText = allDone && band
    ? [
      `Avaliação Cognitiva Infantil — Faixa etária: ${BAND_LABEL[band]}`,
      "",
      ...completedDomains.flatMap((r) => [
        `• ${r!.label}: ${r!.score}/${r!.max} (${Math.round((r!.score / r!.max) * 100)}%) — ${interpret(r!.score, r!.max)}`,
        ...r!.answers.map((a, i) => `   ${i + 1}. [${a.isCorrect ? "✓" : "✗"}] ${a.prompt} → ${answerLine(a)}`),
        "",
      ]),
    ].join("\n").trimEnd()
    : "";

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <header className="relative overflow-hidden rounded-[2rem] border border-border/60 bg-gradient-to-br from-violet-500/[0.08] via-card/70 to-blue-500/[0.07] p-5 sm:p-6 shadow-sm backdrop-blur">
        <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-gradient-to-br from-violet-400/25 to-fuchsia-400/10 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-gradient-to-tr from-blue-400/20 to-transparent blur-3xl" />
        <div className="relative flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-blue-600 text-white shadow-lg shadow-violet-600/25 ring-1 ring-white/20">
            <Brain className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <Badge className="mb-2 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300 hover:bg-violet-100">
              avaliação cognitiva · 2–19 anos
            </Badge>
            <h1 className="text-2xl font-black tracking-tight text-foreground">Avaliação Cognitiva Infantil</h1>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Bateria única adaptada por faixa etária: reconhecimento visual, leitura, escrita e aritmética.
              Triagem observacional — não substitui avaliação psicométrica formal.
            </p>
          </div>
        </div>

        {/* Age input */}
        <div className="mt-4 flex items-end gap-3 flex-wrap">
          <div>
            <label htmlFor="idade-av" className="text-xs font-semibold text-muted-foreground block mb-1">
              Idade da criança (anos)
            </label>
            <Input
              id="idade-av"
              inputMode="numeric"
              value={ageStr}
              onChange={(e) => { setAgeStr(e.target.value.replace(/\D/g, "").slice(0, 2)); setConfirmed(false); setResults({}); }}
              placeholder="ex.: 7"
              className="h-9 w-24"
            />
          </div>
          <Button
            size="sm"
            disabled={!validAge}
            onClick={() => { setConfirmed(true); setActiveDomain("visual"); }}
          >
            Iniciar avaliação
          </Button>
          {band && confirmed && (
            <Badge className="bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300">
              {BAND_LABEL[band]}
            </Badge>
          )}
        </div>
      </header>

      {/* Assessment */}
      {confirmed && band && (
        <>
          {/* Domain tabs */}
          <nav className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Módulos de avaliação">
            {DOMAINS.map((d) => {
              const Icon = d.icon;
              const isActive = activeDomain === d.id;
              const done = Boolean(results[d.id]?.max);
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setActiveDomain(d.id)}
                  aria-pressed={isActive}
                  className={`group flex min-h-[76px] flex-col items-center justify-center gap-1.5 rounded-2xl border p-3 text-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98] ${isActive ? "border-primary bg-gradient-to-br from-primary/15 to-primary/[0.04] shadow-sm" : "border-border bg-background hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm"}`}
                >
                  <Icon className={`h-5 w-5 transition-transform duration-200 group-hover:scale-110 ${isActive ? "text-primary" : d.color}`} />
                  <span className="text-[12px] font-bold text-foreground">{d.label}</span>
                  {done && <span className="inline-flex items-center rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">✓ feito</span>}
                </button>
              );
            })}
          </nav>

          {/* Active domain */}
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                {(() => { const d = DOMAINS.find((x) => x.id === activeDomain)!; const Icon = d.icon; return <Icon className={`h-5 w-5 ${d.color}`} />; })()}
                <h2 className="text-base font-black text-foreground">
                  {DOMAINS.find((x) => x.id === activeDomain)?.label}
                </h2>
                <Badge variant="outline" className="ml-auto text-[11px]">{BAND_LABEL[band]}</Badge>
              </div>
              <DomainModule
                key={`${activeDomain}-${band}`}
                domain={activeDomain}
                band={band}
                onComplete={handleResult}
                result={results[activeDomain]}
              />
            </CardContent>
          </Card>

          {/* Progress indicator */}
          <div className="flex gap-2 flex-wrap">
            {DOMAINS.map((d) => {
              const r = results[d.id];
              const pct = r?.max ? Math.round((r.score / r.max) * 100) : null;
              return (
                <div key={d.id} className={`rounded-xl border px-3 py-2 text-xs ${r?.max ? "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/20" : "border-border bg-background"}`}>
                  <span className="font-semibold text-foreground">{d.label}</span>
                  {pct !== null && <span className="ml-1.5 text-muted-foreground">{pct}%</span>}
                </div>
              );
            })}
          </div>

          {/* Results summary */}
          {completedDomains.length > 0 && (
            <Card className="overflow-hidden border-border/70 bg-gradient-to-br from-primary/[0.05] via-card to-transparent shadow-sm">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-primary/10 text-primary"><ClipboardCheck className="h-4 w-4" /></span>
                  <h2 className="text-sm font-black text-foreground">
                    Resultado parcial {completedDomains.length < 4 ? `(${completedDomains.length}/4 módulos)` : "— Completo"}
                  </h2>
                </div>

                <div className="space-y-2">
                  {completedDomains.map((r) => {
                    if (!r) return null;
                    const pct = Math.round((r.score / r.max) * 100);
                    const color = pct >= 85 ? "bg-emerald-500" : pct >= 65 ? "bg-yellow-500" : pct >= 45 ? "bg-orange-500" : "bg-red-500";
                    return (
                      <div key={r.domain} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-foreground">{r.label}</span>
                          <span className="text-muted-foreground">{r.score}/{r.max} ({pct}%)</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
                        </div>
                        <p className="text-[10px] text-muted-foreground">{interpret(r.score, r.max)}</p>
                        {r.answers.length > 0 && (
                          <details className="mt-1 rounded-lg border border-border/60 bg-background/60 px-2.5 py-1.5">
                            <summary className="cursor-pointer select-none text-[11px] font-semibold text-primary">
                              Ver todas as {r.answers.length} perguntas e respostas
                            </summary>
                            <ol className="mt-1.5 space-y-1">
                              {r.answers.map((a, i) => (
                                <li key={i} className="flex items-start gap-1.5 text-[11px] leading-snug">
                                  <span className={`mt-px shrink-0 font-bold ${a.isCorrect ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>{a.isCorrect ? "✓" : "✗"}</span>
                                  <span className="min-w-0">
                                    <span className="font-medium text-foreground">{i + 1}. {a.prompt}</span>{" "}
                                    <span className="text-muted-foreground">
                                      → {a.correct !== undefined
                                        ? (a.isCorrect ? <>respondeu <strong className="text-foreground">{a.selected}</strong></> : <>respondeu <strong className="text-red-600 dark:text-red-400">{a.selected ?? "—"}</strong> · correto: <strong className="text-emerald-700 dark:text-emerald-300">{a.correct}</strong></>)
                                        : <strong className="text-foreground">{a.selected}</strong>}
                                    </span>
                                  </span>
                                </li>
                              ))}
                            </ol>
                          </details>
                        )}
                      </div>
                    );
                  })}
                </div>

                {allDone && (
                  <div className="pt-2 border-t border-border">
                    <pre className="whitespace-pre-wrap rounded-xl bg-background p-3 text-xs leading-relaxed text-foreground border border-border">
                      {reportText}
                    </pre>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 gap-1.5"
                      onClick={() => navigator.clipboard?.writeText(reportText)}
                    >
                      <ClipboardCheck className="h-3.5 w-3.5" /> Copiar para o laudo
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}

      {!confirmed && (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center space-y-2">
          <Brain className="h-8 w-8 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">Digite a idade da criança (2–19 anos) e clique em <strong>Iniciar avaliação</strong> para ver a bateria adaptada.</p>
        </div>
      )}
    </div>
  );
}
