import { useState, useCallback, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClinicalReport } from "@/components/ClinicalReport";
import { SaveToPatient } from "@/components/SaveToPatient";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Eye,
  BookOpen,
  PenTool,
  Calculator,
  RotateCcw,
  Brain,
  CheckCircle2,
  ChevronRight,
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
  prompt: string; // enunciado da pergunta ou habilidade observada
  correct?: string; // resposta correta (apenas MCQ)
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

// ─────────────────────────────── CONTENT BANKS ───────────────────────────────

// NOTA: por questão só há UMA resposta certa e, de propósito, a posição da
// alternativa correta VARIA de item para item (não fica sempre na 1ª opção),
// para não criar um gabarito previsível. Além disso, o QuizModule ainda
// embaralha as alternativas em tempo de execução. São 4 itens por área/faixa,
// escolhidos por serem os mais discriminativos.
const VISUAL_BANK: Record<Band, MCQ[]> = {
  A: [
    {
      kind: "mcq",
      prompt: "Toque no CACHORRO",
      big: true,
      options: ["🐱", "🐶", "🐰", "🐸"],
      answer: "🐶",
    },
    {
      kind: "mcq",
      prompt: "Qual é a cor VERMELHA?",
      big: true,
      options: ["🔵", "🟡", "🔴", "🟢"],
      answer: "🔴",
    },
    {
      kind: "mcq",
      prompt: "Toque no CÍRCULO",
      big: true,
      options: ["🔺", "🔷", "⭐", "⚫"],
      answer: "⚫",
    },
    {
      kind: "mcq",
      prompt: "Toque na BANANA",
      big: true,
      options: ["🍌", "🍎", "🍇", "🍊"],
      answer: "🍌",
    },
  ],
  B: [
    {
      kind: "mcq",
      prompt: "Qual dessas é a LETRA A?",
      options: ["4", "A", "🐱", "★"],
      answer: "A",
    },
    {
      kind: "mcq",
      prompt: "Qual NÃO é uma fruta?",
      big: true,
      options: ["🍎", "🍌", "🍊", "🐶"],
      answer: "🐶",
    },
    {
      kind: "mcq",
      prompt: "Qual letra é IGUAL a esta? → M",
      options: ["M", "N", "W", "H"],
      answer: "M",
    },
    {
      kind: "mcq",
      prompt: "Quantas estrelas há aqui? ★★★★",
      options: ["3", "5", "4", "2"],
      answer: "4",
    },
  ],
  C: [
    {
      kind: "mcq",
      prompt: "Qual letra está FALTANDO? GA_O",
      options: ["D", "P", "T", "L"],
      answer: "T",
    },
    {
      kind: "mcq",
      prompt: "Qual número vem depois? 2 4 6 8 __",
      options: ["10", "9", "12", "7"],
      answer: "10",
    },
    {
      kind: "mcq",
      prompt: "Qual das palavras está escrita CORRETAMENTE?",
      options: ["BBOLA", "ABOLA", "BOLAA", "BOLA"],
      answer: "BOLA",
    },
    {
      kind: "mcq",
      prompt: "Qual figura completa a série? △○△○__",
      options: ["○", "△", "□", "★"],
      answer: "△",
    },
  ],
  D: [
    {
      kind: "mcq",
      prompt: "Qual completa o padrão? 🔴🔵🔴🔵🔴__",
      options: ["🔴", "🔵", "🟡", "🟢"],
      answer: "🔵",
    },
    {
      kind: "mcq",
      prompt: "Qual NÃO pertence ao grupo? 🍎 🍌 🍇 🐶",
      options: ["🐶", "🍎", "🍌", "🍇"],
      answer: "🐶",
    },
    {
      kind: "mcq",
      prompt: "Qual número vem depois? 5 10 15 20 __",
      options: ["21", "30", "25", "24"],
      answer: "25",
    },
    {
      kind: "mcq",
      prompt: "Qual palavra tem MAIS letras?",
      options: ["GATO", "SOL", "BOLA", "ELEFANTE"],
      answer: "ELEFANTE",
    },
  ],
  E: [
    {
      kind: "mcq",
      prompt: "Qual NÃO pertence ao grupo?",
      options: ["cachorro", "cadeira", "gato", "cavalo"],
      answer: "cadeira",
    },
    {
      kind: "mcq",
      prompt: "Qual número vem depois? 10 20 30 40 __",
      options: ["45", "60", "50", "55"],
      answer: "50",
    },
    {
      kind: "mcq",
      prompt: "Se hoje é TERÇA, amanhã é:",
      options: ["quarta", "segunda", "quinta", "domingo"],
      answer: "quarta",
    },
    {
      kind: "mcq",
      prompt: "Qual é o OPOSTO de CHEIO?",
      options: ["grande", "pesado", "novo", "vazio"],
      answer: "vazio",
    },
  ],
  F: [
    {
      kind: "mcq",
      prompt: "Qual número vem depois? 3 6 9 12 __",
      options: ["14", "15", "18", "16"],
      answer: "15",
    },
    {
      kind: "mcq",
      prompt: "Qual NÃO pertence ao grupo?",
      options: ["maçã", "banana", "cenoura", "uva"],
      answer: "cenoura",
    },
    {
      kind: "mcq",
      prompt:
        "Todos os pássaros voam. O canário é um pássaro. Então o canário:",
      options: ["voa", "nada", "corre", "late"],
      answer: "voa",
    },
    {
      kind: "mcq",
      prompt: "DIA está para NOITE assim como SOL está para:",
      options: ["céu", "estrela", "nuvem", "lua"],
      answer: "lua",
    },
  ],
  G: [
    {
      kind: "mcq",
      prompt: "Qual número vem depois? 100 90 80 70 __",
      options: ["65", "60", "50", "75"],
      answer: "60",
    },
    {
      kind: "mcq",
      prompt: "Qual número vem depois? 2 4 8 16 __",
      options: ["32", "24", "20", "18"],
      answer: "32",
    },
    {
      kind: "mcq",
      prompt: "MÃO está para LUVA assim como PÉ está para:",
      options: ["perna", "dedo", "sapato", "chão"],
      answer: "sapato",
    },
    {
      kind: "mcq",
      prompt: "Se A é maior que B, e B é maior que C, então A é ___ que C:",
      options: ["menor", "igual", "não dá para saber", "maior"],
      answer: "maior",
    },
  ],
};

const LEITURA_BANK: Record<Band, MCQ[]> = {
  A: [
    {
      kind: "mcq",
      prompt: "Qual desses você usa para ESCREVER palavras?",
      big: true,
      options: ["🐱", "A", "★", "🚗"],
      answer: "A",
    },
    {
      kind: "mcq",
      prompt: "Em que direção lemos em português? →",
      options: [
        "Da direita para esquerda",
        "De cima para baixo",
        "Da esquerda para direita",
        "Tanto faz",
      ],
      answer: "Da esquerda para direita",
    },
    {
      kind: "mcq",
      prompt: "Qual desses é um LIVRO?",
      big: true,
      options: ["📚", "🎵", "🚗", "🍎"],
      answer: "📚",
    },
    {
      kind: "mcq",
      prompt: "O que fica no COMEÇO de uma frase?",
      options: ["Ponto final", "Vírgula", "Nada", "Letra maiúscula"],
      answer: "Letra maiúscula",
    },
  ],
  B: [
    {
      kind: "mcq",
      prompt: "Qual palavra RIMA com PÃO?",
      options: ["CASA", "MÃO", "PEIXE", "BOLA"],
      answer: "MÃO",
    },
    {
      kind: "mcq",
      prompt: "Qual palavra começa com o mesmo som de SAPO?",
      options: ["FACA", "RATO", "SINO", "DEDO"],
      answer: "SINO",
    },
    {
      kind: "mcq",
      prompt: "Quantas SÍLABAS tem a palavra MA-CA-CO?",
      options: ["3", "2", "4", "1"],
      answer: "3",
    },
    {
      kind: "mcq",
      prompt: "Qual é o PRIMEIRO som da palavra FADA?",
      options: ["A", "D", "G", "F"],
      answer: "F",
    },
  ],
  C: [
    {
      kind: "mcq",
      prompt:
        "📖 'O gato Miau dorme no tapete cinza. Ele acorda ao ouvir um barulho.'\n\nComo se chama o gato?",
      options: ["Cinza", "Miau", "Tapete", "Barulho"],
      answer: "Miau",
    },
    {
      kind: "mcq",
      prompt: "📖 (mesmo texto)\n\nQual era a cor do gato?",
      options: ["Preta", "Branca", "Cinza", "Amarela"],
      answer: "Cinza",
    },
    {
      kind: "mcq",
      prompt: "📖 (mesmo texto)\n\nPor que o gato acordou?",
      options: [
        "Ouviu um barulho",
        "Estava com fome",
        "Viu um rato",
        "Alguém chamou",
      ],
      answer: "Ouviu um barulho",
    },
    {
      kind: "mcq",
      prompt: "Que palavra está escrita? D-A-D-O",
      options: ["LADO", "BADO", "DADA", "DADO"],
      answer: "DADO",
    },
  ],
  D: [
    {
      kind: "mcq",
      prompt:
        "📖 'Ana foi à biblioteca buscar um livro de astronomia. Ela leu sobre planetas e estrelas. Depois fez um resumo para a professora.'\n\nO que Ana foi buscar?",
      options: ["Uma revista", "Um livro", "Um notebook", "Um mapa"],
      answer: "Um livro",
    },
    {
      kind: "mcq",
      prompt: "📖 (mesmo texto)\n\nSobre o que era o livro?",
      options: ["Animais", "Plantas", "Astronomia", "História"],
      answer: "Astronomia",
    },
    {
      kind: "mcq",
      prompt: "📖 (mesmo texto)\n\nO que ela fez depois de ler?",
      options: ["Um resumo", "Uma prova", "Uma redação", "Uma apresentação"],
      answer: "Um resumo",
    },
    {
      kind: "mcq",
      prompt: "Qual é o plural de LEÃO?",
      options: ["LEÃOS", "LEONES", "LEAOS", "LEÕES"],
      answer: "LEÕES",
    },
  ],
  E: [
    {
      kind: "mcq",
      prompt:
        "📖 'O João tem um cachorro chamado Rex. Todo dia, depois da escola, ele leva o Rex para passear no parque.'\n\nComo se chama o cachorro?",
      options: ["João", "Rex", "Parque", "Bola"],
      answer: "Rex",
    },
    {
      kind: "mcq",
      prompt: "📖 (mesmo texto)\n\nQuando o João passeia com o Rex?",
      options: [
        "De manhã cedo",
        "À noite",
        "Depois da escola",
        "No fim de semana",
      ],
      answer: "Depois da escola",
    },
    {
      kind: "mcq",
      prompt: "Qual palavra é SINÔNIMO de ALEGRE?",
      options: ["Feliz", "Triste", "Cansado", "Bravo"],
      answer: "Feliz",
    },
    {
      kind: "mcq",
      prompt: "Complete: 'Não fui à escola ___ estava doente.'",
      options: ["mas", "então", "ou", "porque"],
      answer: "porque",
    },
  ],
  F: [
    {
      kind: "mcq",
      prompt:
        "📖 'Maria estudou muito para a prova. Quando recebeu a nota, sorriu e comemorou com os amigos.'\n\nComo Maria ficou com a nota?",
      options: ["Triste", "Feliz", "Com raiva", "Com medo"],
      answer: "Feliz",
    },
    {
      kind: "mcq",
      prompt: "📖 (mesmo texto)\n\nO que mostra que ela foi bem?",
      options: ["Chorou", "Ficou quieta", "Sorriu e comemorou", "Foi embora"],
      answer: "Sorriu e comemorou",
    },
    {
      kind: "mcq",
      prompt: "'Ele tem um coração de ouro.' Isso quer dizer que ele é:",
      options: ["Muito bom", "Muito rico", "Muito forte", "Muito alto"],
      answer: "Muito bom",
    },
    {
      kind: "mcq",
      prompt: "O que significa 'quebrar a cabeça'?",
      options: ["Se machucar", "Dormir", "Correr", "Pensar muito"],
      answer: "Pensar muito",
    },
  ],
  G: [
    {
      kind: "mcq",
      prompt:
        "📖 'Usar o celular antes de dormir pode atrapalhar o sono, porque a luz da tela deixa o cérebro mais alerta.'\n\nSegundo o texto, o celular à noite pode:",
      options: [
        "Melhorar o sono",
        "Atrapalhar o sono",
        "Cansar os olhos apenas",
        "Não mudar nada",
      ],
      answer: "Atrapalhar o sono",
    },
    {
      kind: "mcq",
      prompt: "📖 (mesmo texto)\n\nPor que o celular atrapalha o sono?",
      options: [
        "Ele é pesado",
        "Faz muito barulho",
        "A luz deixa o cérebro alerta",
        "Fica sem bateria",
      ],
      answer: "A luz deixa o cérebro alerta",
    },
    {
      kind: "mcq",
      prompt: "'Ele ficou de olho na situação.' Significa que ele:",
      options: ["Prestou atenção", "Foi embora", "Dormiu", "Ficou perdido"],
      answer: "Prestou atenção",
    },
    {
      kind: "mcq",
      prompt: "Qual frase está no sentido FIGURADO?",
      options: [
        "O anel é de ouro.",
        "Comprei ouro na loja.",
        "O ouro é um metal.",
        "Ela tem um coração de ouro.",
      ],
      answer: "Ela tem um coração de ouro.",
    },
  ],
};

const ESCRITA_BANK: Record<Band, Question[]> = {
  A: [
    {
      kind: "obs",
      intro:
        "Observe a criança tentando fazer as atividades abaixo (com lápis/caneta). Marque o que ela consegue realizar:",
      items: [
        {
          label:
            "Segura o lápis/caneta com a mão (mesmo que de forma irregular)",
        },
        { label: "Faz marcas intencionais no papel (rabiscos)" },
        { label: "Imita traços simples (linhas) quando demonstrado" },
        { label: "Diferencia texto de desenho (sabe que letras são símbolos)" },
      ],
    },
  ],
  B: [
    {
      kind: "obs",
      intro:
        "Observe e marque as habilidades de pré-escrita que a criança demonstra:",
      items: [
        { label: "Escreve (ou tenta escrever) o próprio nome" },
        { label: "Reconhece o próprio nome escrito entre outros nomes" },
        { label: "Copia letras simples isoladas (A, O, L, I)" },
        { label: "Diferencia letras de números ao olhar" },
      ],
    },
  ],
  C: [
    {
      kind: "mcq",
      prompt: "Como se escreve o som 'bê-o-lê-a'?",
      options: ["BÔLA", "BOLA", "VOLA", "BOLLA"],
      answer: "BOLA",
    },
    {
      kind: "mcq",
      prompt: "Qual é a grafia CORRETA?",
      options: ["GATTO", "GATU", "GATO", "GÁTO"],
      answer: "GATO",
    },
    {
      kind: "mcq",
      prompt: "Qual palavra está ESCRITA ERRADA?",
      options: ["DATO", "CASA", "PAÇOCA", "BOLA"],
      answer: "DATO",
    },
    {
      kind: "mcq",
      prompt: "Qual é o plural correto de FLOR?",
      options: ["FLORS", "FLORÊS", "FLORE", "FLORES"],
      answer: "FLORES",
    },
  ],
  D: [
    {
      kind: "mcq",
      prompt: "Qual palavra está escrita CORRETAMENTE?",
      options: ["kaza", "casa", "caza", "cassa"],
      answer: "casa",
    },
    {
      kind: "mcq",
      prompt: "Qual palavra usa ACENTO corretamente?",
      options: ["cafe", "cafê", "café", "cáfe"],
      answer: "café",
    },
    {
      kind: "mcq",
      prompt: "Qual palavra está ESCRITA ERRADA?",
      options: ["caza", "escola", "amigo", "bola"],
      answer: "caza",
    },
    {
      kind: "mcq",
      prompt: "Complete: 'Ontem eu ___ à escola.'",
      options: ["vou", "vai", "irei", "fui"],
      answer: "fui",
    },
  ],
  E: [
    {
      kind: "mcq",
      prompt: "Qual frase está CORRETA?",
      options: [
        "Os meninos brincou no parque.",
        "Os meninos brincaram no parque.",
        "Os menino brincou no parque.",
        "O meninos brincaram.",
      ],
      answer: "Os meninos brincaram no parque.",
    },
    {
      kind: "mcq",
      prompt: "Qual é o plural de 'animal'?",
      options: ["animals", "animales", "animais", "animauis"],
      answer: "animais",
    },
    {
      kind: "mcq",
      prompt: "Complete: 'Nós ___ felizes.'",
      options: ["estamos", "está", "estou", "estão"],
      answer: "estamos",
    },
    {
      kind: "mcq",
      prompt: "Qual frase usa a letra maiúscula corretamente?",
      options: [
        "meu nome é ana.",
        "Meu Nome É Ana.",
        "meu nome É ana.",
        "Meu nome é Ana.",
      ],
      answer: "Meu nome é Ana.",
    },
  ],
  F: [
    {
      kind: "mcq",
      prompt: "Qual frase está CORRETA?",
      options: [
        "Ela foram bem na prova.",
        "Ela foi bem na prova.",
        "Ela fui bem na prova.",
        "Ela vai bem na prova ontem.",
      ],
      answer: "Ela foi bem na prova.",
    },
    {
      kind: "mcq",
      prompt: "Qual é o OPOSTO de 'começar'?",
      options: ["Iniciar", "Abrir", "Terminar", "Andar"],
      answer: "Terminar",
    },
    {
      kind: "mcq",
      prompt: "Qual palavra está escrita CERTA?",
      options: ["exercício", "exercicio", "ezercício", "exersício"],
      answer: "exercício",
    },
    {
      kind: "mcq",
      prompt: "Qual frase está no PASSADO?",
      options: [
        "Amanhã eu estudo.",
        "Eu estudo agora.",
        "Eu vou estudar.",
        "Ontem eu estudei.",
      ],
      answer: "Ontem eu estudei.",
    },
  ],
  G: [
    {
      kind: "mcq",
      prompt: "Qual frase está mais bem escrita?",
      options: [
        "Precisa economizar nós água.",
        "Precisamos economizar água.",
        "Nós precisa economizar água.",
        "Água economizar precisamos.",
      ],
      answer: "Precisamos economizar água.",
    },
    {
      kind: "mcq",
      prompt: "Qual é o OPOSTO de 'vantagem'?",
      options: ["Benefício", "Lucro", "Desvantagem", "Ganho"],
      answer: "Desvantagem",
    },
    {
      kind: "mcq",
      prompt: "Qual palavra está escrita CORRETA?",
      options: ["através", "atravez", "atravéz", "atraveiz"],
      answer: "através",
    },
    {
      kind: "mcq",
      prompt: "Qual frase é uma OPINIÃO (não um fato)?",
      options: [
        "O filme dura duas horas.",
        "O filme é colorido.",
        "O filme foi lançado ontem.",
        "Este é o melhor filme do ano.",
      ],
      answer: "Este é o melhor filme do ano.",
    },
  ],
};

const ARITMETICA_BANK: Record<Band, MCQ[]> = {
  A: [
    {
      kind: "mcq",
      prompt: "Qual grupo tem MAIS?",
      big: true,
      options: ["🍎🍎 (2)", "🍎🍎🍎 (3)", "🍎 (1)", "São iguais"],
      answer: "🍎🍎🍎 (3)",
    },
    {
      kind: "mcq",
      prompt: "Quantos há aqui? 🐶🐶",
      options: ["1", "3", "2", "4"],
      answer: "2",
    },
    {
      kind: "mcq",
      prompt: "Quantos dedos tem UMA mão?",
      options: ["5", "4", "6", "3"],
      answer: "5",
    },
    {
      kind: "mcq",
      prompt: "1 + 1 = ?",
      options: ["3", "1", "4", "2"],
      answer: "2",
    },
  ],
  B: [
    {
      kind: "mcq",
      prompt: "Qual número vem depois de 9?",
      options: ["8", "10", "11", "7"],
      answer: "10",
    },
    {
      kind: "mcq",
      prompt: "2 + 3 = ?",
      options: ["4", "6", "5", "3"],
      answer: "5",
    },
    {
      kind: "mcq",
      prompt: "Tenho 5 balas e como 2. Quantas restam?",
      options: ["3", "2", "4", "7"],
      answer: "3",
    },
    {
      kind: "mcq",
      prompt: "4 + 4 = ?",
      options: ["6", "9", "7", "8"],
      answer: "8",
    },
  ],
  C: [
    {
      kind: "mcq",
      prompt: "8 + 7 = ?",
      options: ["14", "15", "16", "13"],
      answer: "15",
    },
    {
      kind: "mcq",
      prompt: "20 − 6 = ?",
      options: ["15", "13", "14", "12"],
      answer: "14",
    },
    {
      kind: "mcq",
      prompt: "Qual é a metade de 10?",
      options: ["5", "4", "6", "3"],
      answer: "5",
    },
    {
      kind: "mcq",
      prompt: "Tenho 3 grupos de 4 maçãs. Quantas maçãs no total?",
      options: ["7", "10", "9", "12"],
      answer: "12",
    },
  ],
  D: [
    {
      kind: "mcq",
      prompt: "6 + 7 = ?",
      options: ["12", "13", "14", "15"],
      answer: "13",
    },
    {
      kind: "mcq",
      prompt: "15 − 8 = ?",
      options: ["8", "6", "7", "9"],
      answer: "7",
    },
    {
      kind: "mcq",
      prompt: "3 × 4 = ?",
      options: ["12", "7", "9", "14"],
      answer: "12",
    },
    {
      kind: "mcq",
      prompt: "Qual número é MAIOR: 34 ou 43?",
      options: ["34", "São iguais", "Não sei", "43"],
      answer: "43",
    },
  ],
  E: [
    {
      kind: "mcq",
      prompt: "25 + 48 = ?",
      options: ["63", "73", "83", "72"],
      answer: "73",
    },
    {
      kind: "mcq",
      prompt: "9 × 6 = ?",
      options: ["56", "45", "54", "63"],
      answer: "54",
    },
    {
      kind: "mcq",
      prompt: "50% de 40 = ?",
      options: ["20", "10", "40", "30"],
      answer: "20",
    },
    {
      kind: "mcq",
      prompt: "Tenho 24 figurinhas em 3 pacotes iguais. Cada pacote tem:",
      options: ["6", "9", "12", "8"],
      answer: "8",
    },
  ],
  F: [
    {
      kind: "mcq",
      prompt: "100 − 37 = ?",
      options: ["67", "63", "73", "57"],
      answer: "63",
    },
    {
      kind: "mcq",
      prompt: "12 × 5 = ?",
      options: ["50", "55", "60", "65"],
      answer: "60",
    },
    {
      kind: "mcq",
      prompt: "10% de 200 = ?",
      options: ["20", "10", "200", "2"],
      answer: "20",
    },
    {
      kind: "mcq",
      prompt: "Um lápis custa R$ 2. Quanto custam 6 lápis?",
      options: ["R$ 8", "R$ 10", "R$ 14", "R$ 12"],
      answer: "R$ 12",
    },
  ],
  G: [
    {
      kind: "mcq",
      prompt: "Um produto custa R$ 80 e tem 25% de desconto. Preço final:",
      options: ["R$ 55", "R$ 60", "R$ 20", "R$ 75"],
      answer: "R$ 60",
    },
    {
      kind: "mcq",
      prompt: "Qual é a MÉDIA de 4, 6 e 8?",
      options: ["5", "7", "6", "9"],
      answer: "6",
    },
    {
      kind: "mcq",
      prompt: "Se 3 canetas custam R$ 9, uma caneta custa:",
      options: ["R$ 3", "R$ 6", "R$ 9", "R$ 2"],
      answer: "R$ 3",
    },
    {
      kind: "mcq",
      prompt: "Quanto é 15% de 100?",
      options: ["10", "20", "150", "15"],
      answer: "15",
    },
  ],
};

// ─────────────────────────────── ObsModule ───────────────────────────────
function ObsModule({
  block,
  onComplete,
}: {
  block: ObsBlock;
  onComplete: (score: number, max: number, answers: AnswerRecord[]) => void;
}) {
  const [answers, setAnswers] = useState<boolean[]>(
    Array(block.items.length).fill(false),
  );
  const [done, setDone] = useState(false);

  function toggle(i: number) {
    if (done) return;
    setAnswers((prev) => {
      const n = [...prev];
      n[i] = !n[i];
      return n;
    });
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
            <span
              className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border text-sm ${answers[i] ? "border-emerald-500 bg-emerald-500 text-white" : "border-border"}`}
            >
              {answers[i] ? "✓" : ""}
            </span>
            <span className="text-sm text-foreground">{item.label}</span>
          </button>
        ))}
      </div>
      {!done ? (
        <Button onClick={finish} className="w-full mt-2">
          Finalizar observação ({score}/{block.items.length} marcados)
        </Button>
      ) : (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4 text-center">
            <p className="text-sm font-bold">
              Respostas de observação registradas
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─────────────────────────────── QuizModule ───────────────────────────────
function QuizModule({
  questions,
  onComplete,
}: {
  questions: MCQ[];
  onComplete: (score: number, max: number, answers: AnswerRecord[]) => void;
}) {
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [phase, setPhase] = useState<"question" | "feedback" | "done">(
    "question",
  );

  const q = questions[idx];
  // Embaralha a ordem das alternativas por questão para que a resposta correta
  // NÃO fique sempre na primeira posição. A ordem é estável durante a questão
  // (não re-embaralha no feedback) e é sorteada de novo a cada nova questão /
  // a cada nova tentativa (o módulo remonta ao "Refazer"). A pontuação continua
  // comparando o texto escolhido com q.answer, então baralhar não afeta o placar.
  const displayOptions = useMemo(() => {
    const cur = questions[idx];
    if (!cur) return [];
    const a = [...cur.options];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }, [idx, questions]);

  function pick(opt: string) {
    if (phase !== "question") return;
    setSelected(opt);
    setPhase("feedback");
    const ok = opt === q.answer;
    if (ok) setScore((s) => s + 1);
    setAnswers((a) => [
      ...a,
      { prompt: q.prompt, correct: q.answer, selected: opt, isCorrect: ok },
    ]);
  }

  function handleComplete() {
    onComplete(score, questions.length, answers);
  }

  if (phase === "done" || idx >= questions.length) {
    return (
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-5 text-center space-y-2">
          <p className="text-sm font-bold text-foreground">
            Todas as respostas deste módulo foram registradas
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Badge variant="outline">
          Questão {idx + 1} / {questions.length}
        </Badge>
        <Badge variant="outline">Resposta por resposta</Badge>
      </div>

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-blue-500 transition-all duration-500 ease-out"
          style={{ width: `${(idx / questions.length) * 100}%` }}
        />
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-br from-muted/50 to-transparent p-4 sm:p-5 shadow-sm">
        <p
          className={`relative text-foreground leading-relaxed whitespace-pre-line ${q.big ? "text-xl font-bold text-center" : "text-sm font-semibold"}`}
        >
          {q.prompt}
        </p>
      </div>

      <div className={`grid gap-2 ${q.big ? "grid-cols-2" : "grid-cols-1"}`}>
        {displayOptions.map((opt) => {
          let cls =
            "rounded-2xl border p-3 text-left transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]";
          if (phase === "feedback") {
            if (opt === selected)
              cls +=
                " border-primary bg-primary/10 shadow-sm shadow-primary/10";
            else cls += " border-border bg-background opacity-50";
          } else {
            cls +=
              " border-border bg-background hover:-translate-y-0.5 hover:border-primary/60 hover:bg-primary/5 hover:shadow-sm cursor-pointer";
          }

          return (
            <button
              key={opt}
              type="button"
              onClick={() => pick(opt)}
              disabled={phase === "feedback"}
              className={`${cls} ${q.big ? "min-h-[64px] text-2xl text-center flex items-center justify-center" : "text-sm"}`}
            >
              {q.big ? (
                <span>{opt}</span>
              ) : (
                <span className="font-medium">{opt}</span>
              )}
            </button>
          );
        })}
      </div>

      {phase === "feedback" && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
          <span className="text-xs font-semibold text-foreground">
            Resposta registrada
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

function DomainModule({
  domain,
  band,
  onComplete,
  result,
}: {
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

  const handleComplete = useCallback(
    (score: number, max: number, answers: AnswerRecord[]) => {
      onComplete({ domain, label: DOMAIN_LABELS[domain], score, max, answers });
    },
    [domain, onComplete],
  );

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
                Todas as perguntas e respostas deste módulo foram registradas.
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-xs"
              onClick={() => {
                setStarted(false);
                setReset((r) => r + 1);
                onComplete({
                  domain,
                  label: DOMAIN_LABELS[domain],
                  score: 0,
                  max: 0,
                  answers: [],
                });
              }}
            >
              <RotateCcw className="h-3.5 w-3.5" /> Refazer
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!started) {
    const descriptions: Record<Domain, string> = {
      visual:
        "Tarefas de reconhecimento de objetos, padrões, letras e raciocínio visual adaptadas à faixa etária.",
      leitura:
        "Avaliação de habilidades de leitura — consciência fonológica, decodificação e compreensão de texto.",
      escrita:
        band <= "B"
          ? "Lista de observação das habilidades de pré-escrita. Marque o que a criança demonstra."
          : "Tarefas de ortografia, gramática e estrutura textual adequadas à série.",
      aritmetica:
        "Operações matemáticas, raciocínio numérico e resolução de problemas por nível de escolaridade.",
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

  return (
    <QuizModule
      key={reset}
      questions={bank as MCQ[]}
      onComplete={handleComplete}
    />
  );
}

// ─────────────────────────────── MAIN PAGE ───────────────────────────────
const DOMAINS: {
  id: Domain;
  label: string;
  icon: typeof Eye;
  color: string;
}[] = [
  { id: "visual", label: "Visual", icon: Eye, color: "text-violet-600" },
  { id: "leitura", label: "Leitura", icon: BookOpen, color: "text-blue-600" },
  { id: "escrita", label: "Escrita", icon: PenTool, color: "text-amber-600" },
  {
    id: "aritmetica",
    label: "Aritmética",
    icon: Calculator,
    color: "text-emerald-600",
  },
];

export default function AvaliacaoCognitivaInfantilPage() {
  const [ageStr, setAgeStr] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [activeDomain, setActiveDomain] = useState<Domain>("visual");
  const [results, setResults] = useState<Partial<Record<Domain, DomainResult>>>(
    {},
  );

  const age = parseInt(ageStr, 10);
  const validAge = !isNaN(age) && age >= 2 && age <= 19;
  const band: Band | null = validAge ? getBand(age) : null;

  function handleResult(r: DomainResult) {
    if (r.max === 0) {
      setResults((prev) => {
        const n = { ...prev };
        delete n[r.domain];
        return n;
      });
    } else {
      setResults((prev) => ({ ...prev, [r.domain]: r }));
    }
  }

  const completedDomains = Object.values(results).filter((r) => r && r.max > 0);
  const reportItems = completedDomains.flatMap((result) =>
    result!.answers.map((answer) => ({
      question: `[${result!.label}] ${answer.prompt}`,
      answer: answer.selected ?? "Não respondida",
    })),
  );

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <header className="relative overflow-hidden rounded-[2rem] border border-border/60 bg-gradient-to-br from-violet-500/[0.08] via-card/70 to-blue-500/[0.07] p-5 sm:p-6 shadow-sm backdrop-blur">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-gradient-to-br from-violet-400/25 to-fuchsia-400/10 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-gradient-to-tr from-blue-400/20 to-transparent blur-3xl"
        />
        <div className="relative flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-blue-600 text-white shadow-lg shadow-violet-600/25 ring-1 ring-white/20">
            <Brain className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <Badge className="mb-2 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300 hover:bg-violet-100">
              avaliação cognitiva · 2–19 anos
            </Badge>
            <h1 className="text-2xl font-black tracking-tight text-foreground">
              Avaliação Cognitiva Infantil
            </h1>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Bateria enxuta adaptada por faixa etária: 4 itens em cada área —
              reconhecimento visual, leitura, escrita e aritmética — com
              relatório qualitativo ao final. Triagem educativa — não substitui
              avaliação psicométrica formal.
            </p>
          </div>
        </div>

        {/* Age input */}
        <div className="mt-4 flex items-end gap-3 flex-wrap">
          <div>
            <label
              htmlFor="idade-av"
              className="text-xs font-semibold text-muted-foreground block mb-1"
            >
              Idade da criança (anos)
            </label>
            <Input
              id="idade-av"
              inputMode="numeric"
              value={ageStr}
              onChange={(e) => {
                setAgeStr(e.target.value.replace(/\D/g, "").slice(0, 2));
                setConfirmed(false);
                setResults({});
              }}
              placeholder="ex.: 7"
              className="h-9 w-24"
            />
          </div>
          <Button
            size="sm"
            disabled={!validAge}
            onClick={() => {
              setConfirmed(true);
              setActiveDomain("visual");
            }}
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
          <nav
            className="grid grid-cols-2 gap-2 sm:grid-cols-4"
            aria-label="Módulos de avaliação"
          >
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
                  <Icon
                    className={`h-5 w-5 transition-transform duration-200 group-hover:scale-110 ${isActive ? "text-primary" : d.color}`}
                  />
                  <span className="text-[12px] font-bold text-foreground">
                    {d.label}
                  </span>
                  {done && (
                    <span className="inline-flex items-center rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                      ✓ feito
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Active domain */}
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                {(() => {
                  const d = DOMAINS.find((x) => x.id === activeDomain)!;
                  const Icon = d.icon;
                  return <Icon className={`h-5 w-5 ${d.color}`} />;
                })()}
                <h2 className="text-base font-black text-foreground">
                  {DOMAINS.find((x) => x.id === activeDomain)?.label}
                </h2>
                <Badge variant="outline" className="ml-auto text-[11px]">
                  {BAND_LABEL[band]}
                </Badge>
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

          {completedDomains.length > 0 && (
            <div className="space-y-4">
              <ClinicalReport
                scaleName="Avaliação Cognitiva Infantil"
                scaleFullName="Reconhecimento visual, leitura, escrita e aritmética"
                items={reportItems}
                patientAge={band ? BAND_LABEL[band] : undefined}
              />
              <SaveToPatient
                scaleName="Avaliação Cognitiva Infantil"
                responses={reportItems}
                patientAge={band ? BAND_LABEL[band] : undefined}
              />
            </div>
          )}
        </>
      )}

      {!confirmed && (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center space-y-2">
          <Brain className="h-8 w-8 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">
            Digite a idade da criança (2–19 anos) e clique em{" "}
            <strong>Iniciar avaliação</strong> para ver a bateria adaptada.
          </p>
        </div>
      )}
    </div>
  );
}
