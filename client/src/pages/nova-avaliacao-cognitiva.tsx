import { useEffect, useState, useCallback, useMemo } from "react";
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
  Clock3,
  Info,
  LockKeyhole,
  TimerReset,
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

type ResponseType = "respondida" | "nao_informada" | "observada";

interface AnswerRecord {
  prompt: string; // enunciado da pergunta ou habilidade observada
  correct?: string; // resposta correta (apenas MCQ)
  selected: string | null; // o que a criança escolheu / "Observado" no bloco de observação
  isCorrect: boolean;
  responseType?: ResponseType;
}
interface DomainResult {
  domain: Domain;
  label: string;
  score: number;
  max: number;
  notInformed: number;
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
      prompt: "Qual figura combina com o som 'miau'?",
      big: true,
      options: ["🐱", "🐶", "🚗", "🍎"],
      answer: "🐱",
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
      prompt: "Depois de ouvir uma história, o que podemos fazer com o livro?",
      options: [
        "Virar a página",
        "Colocar no sapato",
        "Jogar na água",
        "Esconder a mesa",
      ],
      answer: "Virar a página",
    },
    {
      kind: "mcq",
      prompt: "Qual figura mostra uma BOLA?",
      big: true,
      options: ["⚽", "🧦", "🍌", "🚲"],
      answer: "⚽",
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
      prompt: "Qual grupo tem MENOS?",
      big: true,
      options: ["🍓🍓🍓", "🍓", "🍓🍓", "São iguais"],
      answer: "🍓",
    },
    {
      kind: "mcq",
      prompt: "Qual grupo tem DOIS?",
      big: true,
      options: ["🟡", "🟡🟡", "🟡🟡🟡", "Nenhum"],
      answer: "🟡🟡",
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
      selected: answers[i] ? "Observado" : "Não informado / não observado",
      isCorrect: Boolean(answers[i]),
      responseType: answers[i] ? "observada" : "nao_informada",
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
      {
        prompt: q.prompt,
        correct: q.answer,
        selected: opt,
        isCorrect: ok,
        responseType: "respondida",
      },
    ]);
  }

  function markNotInformed() {
    if (phase !== "question") return;
    setSelected(null);
    setPhase("feedback");
    setAnswers((a) => [
      ...a,
      {
        prompt: q.prompt,
        correct: q.answer,
        selected: null,
        isCorrect: false,
        responseType: "nao_informada",
      },
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
          style={{ width: `${((idx + 1) / questions.length) * 100}%` }}
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
            if (selected !== null && opt === selected)
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

      {phase === "question" && (
        <button
          type="button"
          onClick={markNotInformed}
          className="mx-auto block rounded-xl border border-dashed border-border px-3 py-2 text-xs font-semibold text-muted-foreground transition hover:border-primary/50 hover:bg-primary/[0.04] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Não sei / prefiro não responder
        </button>
      )}

      {phase === "feedback" && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 flex items-center gap-2">
          {selected === null ? (
            <Info
              className="h-4 w-4 text-primary flex-shrink-0"
              aria-hidden="true"
            />
          ) : (
            <CheckCircle2
              className="h-4 w-4 text-primary flex-shrink-0"
              aria-hidden="true"
            />
          )}
          <span className="text-xs font-semibold text-foreground">
            {selected === null
              ? "Resposta não informada — não será interpretada como erro"
              : "Resposta registrada"}
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

// ─────────────────────────────── PERFIS EXATOS 6–13 ───────────────────────────────
const ageMcq = (prompt: string, options: string[], answer: string): MCQ => ({
  kind: "mcq",
  prompt,
  options,
  answer,
});

const COGNITIVE_AGE_BANKS: Partial<Record<number, Record<Domain, MCQ[]>>> = {
  6: {
    visual: [
      ageMcq(
        "Qual figura é igual à primeira? ⭐",
        ["⭐", "🔺", "🔵", "🟩"],
        "⭐",
      ),
      ageMcq("Qual vem depois? 🔴 🔵 🔴 __", ["🟡", "🔵", "🔴", "🟢"], "🔵"),
      ageMcq(
        "Qual objeto pertence ao grupo de alimentos?",
        ["🍎", "🚗", "👟", "✏️"],
        "🍎",
      ),
      ageMcq("Qual é o menor?", ["🐘", "🐶", "🐭", "🦒"], "🐭"),
    ],
    leitura: [
      ageMcq(
        "Qual palavra começa com o som /m/?",
        ["mesa", "sapo", "foca", "rato"],
        "mesa",
      ),
      ageMcq(
        "Leia: 'A bola é azul.' Qual é a cor da bola?",
        ["Verde", "Azul", "Amarela", "Vermelha"],
        "Azul",
      ),
      ageMcq(
        "Qual palavra rima com GATO?",
        ["pato", "mesa", "bola", "casa"],
        "pato",
      ),
      ageMcq(
        "Qual palavra está escrita? B-O-L-A",
        ["BALA", "BOLA", "BELA", "COLA"],
        "BOLA",
      ),
    ],
    escrita: [
      ageMcq(
        "Qual frase começa do jeito correto?",
        ["ana brinca.", "Ana brinca.", "ANA brinca", "ana Brinca."],
        "Ana brinca.",
      ),
      ageMcq(
        "Qual palavra está escrita corretamente?",
        ["caza", "casa", "kasa", "cassa"],
        "casa",
      ),
      ageMcq(
        "Complete: 'Eu ___ uma história.'",
        ["leio", "leem", "ler", "leu"],
        "leio",
      ),
      ageMcq("Qual sinal termina uma pergunta?", [".", ",", "?", "!"], "?"),
    ],
    aritmetica: [
      ageMcq(
        "Qual número vem depois? 7, 8, 9, __",
        ["10", "11", "6", "12"],
        "10",
      ),
      ageMcq("6 + 7 = ?", ["12", "13", "14", "11"], "13"),
      ageMcq("15 − 8 = ?", ["6", "7", "8", "9"], "7"),
      ageMcq("Qual é maior?", ["28", "18", "8", "2"], "28"),
    ],
  },
  7: {
    visual: [
      ageMcq(
        "Qual figura completa o padrão? 🔺 🔵 🔺 🔵 __",
        ["🔵", "🔺", "🟢", "⭐"],
        "🔺",
      ),
      ageMcq(
        "Qual par tem a mesma relação de parte e todo?",
        ["roda–carro", "sol–lua", "gato–cão", "mesa–cadeira"],
        "roda–carro",
      ),
      ageMcq(
        "Qual NÃO pertence ao grupo?",
        ["triângulo", "quadrado", "círculo", "banana"],
        "banana",
      ),
      ageMcq(
        "Qual detalhe está diferente? 🔴🔵🔴🟡",
        ["1º", "2º", "3º", "4º"],
        "4º",
      ),
    ],
    leitura: [
      ageMcq(
        "Leia: 'Lia levou o guarda-chuva porque o céu estava escuro.' Por que Lia levou o guarda-chuva?",
        [
          "Porque estava calor",
          "Porque poderia chover",
          "Porque ia dormir",
          "Porque perdeu a mochila",
        ],
        "Porque poderia chover",
      ),
      ageMcq("Quantas sílabas tem JA-NE-LA?", ["2", "3", "4", "5"], "3"),
      ageMcq(
        "Qual frase está na ordem correta?",
        [
          "Parque foi ao João",
          "João ao parque foi",
          "João foi ao parque",
          "Foi parque João ao",
        ],
        "João foi ao parque",
      ),
      ageMcq(
        "O que significa 'rápido' em 'O coelho correu rápido'?",
        ["Devagar", "Com velocidade", "Com medo", "Em silêncio"],
        "Com velocidade",
      ),
    ],
    escrita: [
      ageMcq(
        "Qual frase tem pontuação adequada?",
        [
          "Hoje, fomos ao parque.",
          "Hoje fomos ao parque",
          "hoje, Fomos ao parque.",
          "Hoje fomos ao parque?",
        ],
        "Hoje, fomos ao parque.",
      ),
      ageMcq(
        "Qual é o plural de 'flor'?",
        ["flors", "flore", "flores", "floris"],
        "flores",
      ),
      ageMcq(
        "Complete: 'As meninas ___ no pátio.'",
        ["brinca", "brincam", "brinco", "brincou"],
        "brincam",
      ),
      ageMcq(
        "Qual palavra está escrita corretamente?",
        ["girafa", "jirafa", "girrafa", "jirafa"],
        "girafa",
      ),
    ],
    aritmetica: [
      ageMcq("34 + 28 = ?", ["52", "62", "72", "60"], "62"),
      ageMcq("70 − 36 = ?", ["34", "44", "36", "24"], "34"),
      ageMcq(
        "Há 4 caixas com 3 lápis em cada. Quantos lápis?",
        ["7", "12", "9", "16"],
        "12",
      ),
      ageMcq(
        "Qual é o valor do algarismo 5 em 50?",
        ["5 unidades", "5 dezenas", "5 centenas", "50 centenas"],
        "5 dezenas",
      ),
    ],
  },
  8: {
    visual: [
      ageMcq(
        "Observe a figura ↗️. Se ela girar 90° no sentido horário, qual resultado aparece?",
        ["↘️", "↖️", "↙️", "↗️"],
        "↘️",
      ),
      ageMcq(
        "Qual figura completa a matriz? 🔴🔵 / 🔵🔴 / 🔴__",
        ["🔴", "🔵", "🟡", "🟢"],
        "🔵",
      ),
      ageMcq(
        "Observe o desenho: 🔷🔷🔷 / 🔷🔷⬜ / 🔷⬜⬜. Qual forma está sendo desenhada?",
        ["triângulo", "círculo", "quadrado", "estrela"],
        "triângulo",
      ),
      ageMcq(
        "MÃO está para LUVA assim como PÉ está para:",
        ["meia", "chapéu", "camisa", "cinto"],
        "meia",
      ),
    ],
    leitura: [
      ageMcq(
        "Leia: 'A horta da escola economiza água usando regadores pequenos.' Qual é a ideia principal?",
        [
          "A escola pintou a horta",
          "A horta usa água de forma cuidadosa",
          "Os regadores são grandes",
          "A escola não tem horta",
        ],
        "A horta usa água de forma cuidadosa",
      ),
      ageMcq(
        "O que podemos inferir sobre o uso de regadores pequenos?",
        [
          "Ajuda a controlar a quantidade de água",
          "Impede o crescimento das plantas",
          "Serve apenas para decorar",
          "Faz a água desaparecer",
        ],
        "Ajuda a controlar a quantidade de água",
      ),
      ageMcq(
        "No texto, 'economiza' significa:",
        ["gasta mais", "usa com cuidado", "joga fora", "esquece"],
        "usa com cuidado",
      ),
      ageMcq(
        "Qual título combina melhor com o texto?",
        [
          "Uma horta cuidadosa",
          "O passeio de bicicleta",
          "A chuva forte",
          "O brinquedo novo",
        ],
        "Uma horta cuidadosa",
      ),
    ],
    escrita: [
      ageMcq(
        "Qual sequência forma um pequeno parágrafo?",
        [
          "Conclusão–título–início",
          "Início–desenvolvimento–final",
          "Final–início–título",
          "Título–final–início",
        ],
        "Início–desenvolvimento–final",
      ),
      ageMcq(
        "Qual frase tem concordância correta?",
        [
          "As criança brinca.",
          "As crianças brincam.",
          "A crianças brincam.",
          "As crianças brincou.",
        ],
        "As crianças brincam.",
      ),
      ageMcq(
        "Qual palavra precisa de acento?",
        ["cafe", "mesa", "bola", "gato"],
        "cafe",
      ),
      ageMcq(
        "Complete: 'Estava chovendo, ___ levei guarda-chuva.'",
        ["por isso", "mas", "ou", "embora"],
        "por isso",
      ),
    ],
    aritmetica: [
      ageMcq("7 × 4 = ?", ["21", "24", "28", "32"], "28"),
      ageMcq("36 ÷ 6 = ?", ["5", "6", "7", "8"], "6"),
      ageMcq(
        "Qual fração representa uma de quatro partes iguais?",
        ["1/2", "1/3", "1/4", "4/1"],
        "1/4",
      ),
      ageMcq(
        "Uma caixa tem 8 lápis. Quantos lápis há em 3 caixas?",
        ["11", "16", "24", "32"],
        "24",
      ),
    ],
  },
  9: {
    visual: [
      ageMcq(
        "Qual regra organiza a sequência? 2, 4, 8, 16, __",
        ["somar 2", "dobrar", "subtrair 2", "somar 4"],
        "dobrar",
      ),
      ageMcq("Qual figura é simétrica?", ["◐", "★", "◒", "◩"], "★"),
      ageMcq(
        "Qual item não pertence por dois critérios: é animal e voa?",
        ["pássaro", "borboleta", "avião", "abelha"],
        "avião",
      ),
      ageMcq(
        "Qual sequência visual vem depois? 🟩🟩🔵 / 🟩🔵🔵 / __",
        ["🔵🔵🔵", "🟩🟩🟩", "🔵🟩🟩", "🟩🔵🟩"],
        "🔵🔵🔵",
      ),
    ],
    leitura: [
      ageMcq(
        "Leia: 'As árvores ajudam a diminuir o calor nas cidades.' Qual é a ideia principal?",
        [
          "Árvores aumentam o calor",
          "Árvores podem tornar a cidade mais fresca",
          "Cidades não têm árvores",
          "O calor só existe no campo",
        ],
        "Árvores podem tornar a cidade mais fresca",
      ),
      ageMcq(
        "Qual informação apoia a ideia principal?",
        [
          "As árvores fazem sombra",
          "As árvores são sempre pequenas",
          "As cidades ficam vazias",
          "O calor não incomoda ninguém",
        ],
        "As árvores fazem sombra",
      ),
      ageMcq(
        "No texto, 'diminuir' é o mesmo que:",
        ["aumentar", "reduzir", "esconder", "criar"],
        "reduzir",
      ),
      ageMcq(
        "Qual resumo é melhor?",
        [
          "Árvores ajudam a reduzir o calor urbano.",
          "Árvores são objetos de decoração.",
          "Cidades devem retirar plantas.",
          "O calor só depende da chuva.",
        ],
        "Árvores ajudam a reduzir o calor urbano.",
      ),
    ],
    escrita: [
      ageMcq(
        "Qual conectivo completa melhor? 'Estudei bastante, ___ consegui resolver.'",
        ["porém", "por isso", "ou", "embora"],
        "por isso",
      ),
      ageMcq(
        "Qual frase está correta?",
        [
          "Nós foi ao cinema.",
          "Nós fomos ao cinema.",
          "Nós foram ao cinema.",
          "Nós vai ao cinema.",
        ],
        "Nós fomos ao cinema.",
      ),
      ageMcq(
        "Qual grafia está correta?",
        ["excessão", "exceção", "esceção", "exeção"],
        "exceção",
      ),
      ageMcq(
        "Qual frase tem melhor clareza?",
        [
          "O menino viu o cachorro com o binóculo.",
          "Com o binóculo, o menino viu o cachorro.",
          "Viu o cachorro menino binóculo.",
          "O cachorro com menino viu.",
        ],
        "Com o binóculo, o menino viu o cachorro.",
      ),
    ],
    aritmetica: [
      ageMcq(
        "Qual fração é equivalente a 1/2?",
        ["2/4", "1/3", "3/5", "4/6"],
        "2/4",
      ),
      ageMcq(
        "Um retângulo mede 5 cm por 3 cm. Qual é o perímetro?",
        ["8 cm", "15 cm", "16 cm", "20 cm"],
        "16 cm",
      ),
      ageMcq(
        "Ana tinha 48 figurinhas, ganhou 17 e deu 25. Com quantas ficou?",
        ["30", "40", "50", "90"],
        "40",
      ),
      ageMcq("2,5 + 1,3 = ?", ["3,8", "3,5", "2,8", "4,8"], "3,8"),
    ],
  },
  10: {
    visual: [
      ageMcq(
        "Qual relação é semelhante a LIVRO:LER?",
        ["garfo:comer", "janela:parede", "sapato:meia", "mesa:casa"],
        "garfo:comer",
      ),
      ageMcq(
        "Qual regra completa? 1, 3, 6, 10, __",
        ["12", "14", "15", "16"],
        "15",
      ),
      ageMcq(
        "Qual figura mantém a mesma transformação? △ → ▲; ○ →",
        ["●", "□", "◇", "☆"],
        "●",
      ),
      ageMcq(
        "Qual item é diferente por não ter eixo de simetria?",
        ["quadrado", "retângulo", "círculo", "triângulo escaleno"],
        "triângulo escaleno",
      ),
    ],
    leitura: [
      ageMcq(
        "Leia: 'A água potável precisa ser tratada antes de chegar às casas.' Qual relação está explícita?",
        [
          "Tratamento e segurança para consumo",
          "Chuva e trânsito",
          "Casa e escola",
          "Plantas e animais",
        ],
        "Tratamento e segurança para consumo",
      ),
      ageMcq(
        "Por que o tratamento é importante?",
        [
          "Para tornar a água própria para beber",
          "Para mudar sua cor sempre",
          "Para impedir seu uso",
          "Para aumentar a poeira",
        ],
        "Para tornar a água própria para beber",
      ),
      ageMcq(
        "Qual palavra pode substituir 'potável'?",
        ["própria para beber", "muito salgada", "congelada", "barulhenta"],
        "própria para beber",
      ),
      ageMcq(
        "Qual conclusão é sustentada pelo texto?",
        [
          "A água deve ser cuidada antes do consumo.",
          "Toda água é automaticamente segura.",
          "O tratamento é desnecessário.",
          "A água potável não chega às casas.",
        ],
        "A água deve ser cuidada antes do consumo.",
      ),
    ],
    escrita: [
      ageMcq(
        "Qual parágrafo apresenta melhor estrutura?",
        [
          "Ideia sem explicação",
          "Ideia, explicação e fechamento",
          "Apenas uma lista de palavras",
          "Frases sem relação",
        ],
        "Ideia, explicação e fechamento",
      ),
      ageMcq(
        "Qual frase usa pontuação correta?",
        [
          "Quando chegou, Maria abriu o livro.",
          "Quando chegou Maria abriu o livro",
          "Quando, chegou Maria abriu o livro.",
          "Quando chegou Maria, abriu o livro.",
        ],
        "Quando chegou, Maria abriu o livro.",
      ),
      ageMcq(
        "Complete: 'Ele estudou, ___ ainda ficou com dúvida.'",
        ["portanto", "porém", "porque", "assim"],
        "porém",
      ),
      ageMcq(
        "Qual revisão melhora a frase 'Os aluno fez a tarefa'?",
        [
          "Os aluno fizeram a tarefa.",
          "Os alunos fizeram a tarefa.",
          "O alunos fez a tarefa.",
          "Os alunos fez tarefas.",
        ],
        "Os alunos fizeram a tarefa.",
      ),
    ],
    aritmetica: [
      ageMcq("0,75 é igual a:", ["3/4", "1/4", "7/5", "75/10"], "3/4"),
      ageMcq("25% de 80 = ?", ["10", "20", "25", "40"], "20"),
      ageMcq(
        "Uma receita para 4 pessoas usa 2 xícaras. Para 8 pessoas, usa:",
        ["2", "3", "4", "6"],
        "4",
      ),
      ageMcq(
        "Em uma escola, 3 de cada 5 alunos foram de ônibus. Em 20 alunos, quantos aproximadamente?",
        ["8", "10", "12", "15"],
        "12",
      ),
    ],
  },
  11: {
    visual: [
      ageMcq(
        "Observe a sequência: 🔺🔵🔺🔵🔺 __. Qual símbolo continua o padrão?",
        ["🔵", "🔺", "🟢", "⭐"],
        "🔵",
      ),
      ageMcq(
        "Observe a matriz: 🔴🔵 / 🔵🟢 / 🔴__. Qual cor completa a regra?",
        ["🟢", "🔵", "🔴", "🟡"],
        "🟢",
      ),
      ageMcq(
        "A seta ↗️ gira 180°. Qual é a nova direção?",
        ["↖️", "↘️", "↙️", "⬆️"],
        "↙️",
      ),
      ageMcq(
        "Qual par mantém a mesma relação de objeto e função?",
        ["termômetro–medir", "janela–correr", "lápis–dormir", "sapato–beber"],
        "termômetro–medir",
      ),
    ],
    leitura: [
      ageMcq(
        "Leia: 'A turma criou uma horta na escola. Além de colher verduras, os alunos passaram a registrar a quantidade de água usada.' Qual é a ideia principal?",
        [
          "A turma deixou de estudar",
          "A horta uniu cultivo e acompanhamento do uso de água",
          "Os alunos só queriam colher verduras",
          "A escola proibiu o uso de água",
        ],
        "A horta uniu cultivo e acompanhamento do uso de água",
      ),
      ageMcq(
        "No texto, por que os alunos registravam a água usada?",
        [
          "Para controlar e evitar desperdício",
          "Para escolher novas sementes",
          "Para medir o tamanho da horta",
          "Para substituir as aulas",
        ],
        "Para controlar e evitar desperdício",
      ),
      ageMcq(
        "Qual palavra tem sentido mais próximo de 'acompanhar' no contexto?",
        ["observar", "esconder", "interromper", "apagar"],
        "observar",
      ),
      ageMcq(
        "Qual conclusão é apoiada pelo texto?",
        [
          "Registrar dados pode ajudar a cuidar melhor da horta",
          "Toda horta precisa de pouca água",
          "A turma não aprendeu nada",
          "Colher verduras dispensa planejamento",
        ],
        "Registrar dados pode ajudar a cuidar melhor da horta",
      ),
    ],
    escrita: [
      ageMcq(
        "Qual frase está pontuada corretamente?",
        [
          "Quando terminou a aula, Pedro guardou o material.",
          "Quando terminou a aula Pedro, guardou o material.",
          "Quando, terminou a aula Pedro guardou o material.",
          "quando terminou a aula, Pedro guardou o material",
        ],
        "Quando terminou a aula, Pedro guardou o material.",
      ),
      ageMcq(
        "Complete: 'Os resultados da experiência ___ registrados no caderno.'",
        ["foi", "foram", "era", "será"],
        "foram",
      ),
      ageMcq(
        "Qual opção organiza melhor as ideias?",
        [
          "Lia revisou o texto. Depois, corrigiu duas palavras.",
          "Depois, duas palavras corrigiu Lia texto o revisou.",
          "Corrigiu Lia. Texto depois revisou palavras.",
          "O texto duas Lia depois palavras revisou corrigiu.",
        ],
        "Lia revisou o texto. Depois, corrigiu duas palavras.",
      ),
      ageMcq(
        "Qual palavra está escrita corretamente?",
        ["exceção", "escessão", "excessão", "eceção"],
        "exceção",
      ),
    ],
    aritmetica: [
      ageMcq("3/4 de 20 = ?", ["12", "15", "16", "18"], "15"),
      ageMcq("2,5 + 1,75 = ?", ["3,25", "4,25", "4,15", "5,25"], "4,25"),
      ageMcq(
        "Um retângulo tem 8 cm de comprimento e 3 cm de largura. Qual é o perímetro?",
        ["11 cm", "22 cm", "24 cm", "16 cm"],
        "22 cm",
      ),
      ageMcq(
        "Uma receita usa 3 xícaras para 6 pessoas. Quantas xícaras são necessárias para 10 pessoas, mantendo a proporção?",
        ["4", "5", "6", "8"],
        "5",
      ),
    ],
  },
  12: {
    visual: [
      ageMcq(
        "Se a regra é alternar direção e cor, qual é o próximo símbolo?",
        ["↗️🔴", "↘️🔵", "↗️🔵", "↘️🔴"],
        "↘️🔵",
      ),
      ageMcq(
        "Qual analogia é mais próxima de MAPA:CAMINHO?",
        ["receita:prato", "janela:parede", "livro:estante", "tênis:esporte"],
        "receita:prato",
      ),
      ageMcq(
        "Qual figura representa uma rotação de 180°?",
        ["↗️ para ↙️", "↗️ para ↘️", "↗️ para ↖️", "↗️ para ⬆️"],
        "↗️ para ↙️",
      ),
      ageMcq(
        "Qual classificação depende de duas regras simultâneas?",
        ["objetos azuis e redondos", "objetos grandes", "animais", "frutas"],
        "objetos azuis e redondos",
      ),
    ],
    leitura: [
      ageMcq(
        "Em um texto que defende leitura diária, qual evidência apoia melhor a tese?",
        [
          "Ler amplia contato com vocabulário e ideias",
          "Livros têm capas coloridas",
          "Toda leitura precisa ser longa",
          "Ler substitui conversar",
        ],
        "Ler amplia contato com vocabulário e ideias",
      ),
      ageMcq(
        "O ponto de vista do autor é provavelmente:",
        [
          "favorável à leitura frequente",
          "contrário a livros",
          "indiferente a qualquer texto",
          "favorável apenas a imagens",
        ],
        "favorável à leitura frequente",
      ),
      ageMcq(
        "Qual informação seria necessária para avaliar a força do argumento?",
        [
          "a fonte ou evidência apresentada",
          "a cor do papel",
          "o tamanho da sala",
          "o nome do leitor",
        ],
        "a fonte ou evidência apresentada",
      ),
      ageMcq(
        "Qual é a melhor síntese?",
        [
          "A leitura diária pode apoiar vocabulário e compreensão quando há prática significativa.",
          "Ler é apenas decorar palavras.",
          "Textos não precisam de sentido.",
          "Todo leitor aprende no mesmo ritmo.",
        ],
        "A leitura diária pode apoiar vocabulário e compreensão quando há prática significativa.",
      ),
    ],
    escrita: [
      ageMcq(
        "Qual frase apresenta uma tese?",
        [
          "A biblioteca tem duas salas.",
          "A leitura diária deve fazer parte da rotina escolar.",
          "Ontem fui à biblioteca.",
          "O livro tem 80 páginas.",
        ],
        "A leitura diária deve fazer parte da rotina escolar.",
      ),
      ageMcq(
        "Qual argumento sustenta essa tese?",
        [
          "A prática frequente favorece fluência e compreensão.",
          "A biblioteca tem janelas.",
          "O livro é azul.",
          "A escola fica perto.",
        ],
        "A prática frequente favorece fluência e compreensão.",
      ),
      ageMcq(
        "Qual conectivo introduz oposição?",
        ["portanto", "além disso", "porém", "porque"],
        "porém",
      ),
      ageMcq(
        "Qual frase é mais adequada ao registro formal?",
        [
          "A gente acha que é muito legal.",
          "Consideramos a proposta relevante.",
          "Tá tudo bem com a proposta.",
          "A proposta é tipo boa.",
        ],
        "Consideramos a proposta relevante.",
      ),
    ],
    aritmetica: [
      ageMcq(
        "Se 3 cadernos custam R$ 27, quanto custam 5 pelo mesmo preço unitário?",
        ["R$ 35", "R$ 45", "R$ 54", "R$ 60"],
        "R$ 45",
      ),
      ageMcq("30% de 150 = ?", ["30", "45", "50", "60"], "45"),
      ageMcq(
        "Resolva: 2x + 6 = 16",
        ["x = 4", "x = 5", "x = 6", "x = 11"],
        "x = 5",
      ),
      ageMcq("A média de 6, 8 e 10 é:", ["7", "8", "9", "10"], "8"),
    ],
  },
  13: {
    visual: [
      ageMcq(
        "Qual regra composta continua a sequência? 2A, 4C, 8E, 16G, __",
        ["32H", "32I", "18I", "24J"],
        "32I",
      ),
      ageMcq(
        "Qual analogia mantém a relação função–resultado?",
        ["hipótese:conclusão", "caneta:estojo", "janela:parede", "sapato:chão"],
        "hipótese:conclusão",
      ),
      ageMcq(
        "Qual transformação ocorre em cada passo? 🔺→🔻→🔺→__",
        ["🔺", "🔻", "🔵", "⬛"],
        "🔻",
      ),
      ageMcq(
        "Qual item não pertence ao grupo por uma regra abstrata?",
        ["2, 4, 8", "3, 6, 12", "5, 10, 20", "4, 8, 14"],
        "4, 8, 14",
      ),
    ],
    leitura: [
      ageMcq(
        "Um texto apresenta dados e depois afirma que uma política é necessária. O que deve ser verificado primeiro?",
        [
          "Se os dados realmente sustentam a conclusão",
          "Se o texto tem título curto",
          "Se há muitas cores",
          "Se o autor usa letra grande",
        ],
        "Se os dados realmente sustentam a conclusão",
      ),
      ageMcq(
        "Qual elemento indica possível viés do autor?",
        [
          "selecionar apenas evidências favoráveis e ignorar contrapontos",
          "apresentar fonte verificável",
          "definir os termos",
          "admitir limites",
        ],
        "selecionar apenas evidências favoráveis e ignorar contrapontos",
      ),
      ageMcq(
        "Uma inferência válida deve:",
        [
          "ser compatível com as evidências do texto",
          "contradizer todos os dados",
          "depender apenas de opinião",
          "ignorar o contexto",
        ],
        "ser compatível com as evidências do texto",
      ),
      ageMcq(
        "Qual síntese é mais completa?",
        [
          "apresenta ideia central, evidências e limite do argumento",
          "repete uma frase do título",
          "lista palavras isoladas",
          "resume só o primeiro exemplo",
        ],
        "apresenta ideia central, evidências e limite do argumento",
      ),
    ],
    escrita: [
      ageMcq(
        "Qual estrutura argumentativa é mais consistente?",
        [
          "tese–evidência–explicação–conclusão",
          "conclusão–palavras soltas–tese",
          "exemplo sem ideia central",
          "título–título–título",
        ],
        "tese–evidência–explicação–conclusão",
      ),
      ageMcq(
        "Qual revisão melhora a coesão? 'A escola criou uma horta. A escola usa a horta nas aulas.'",
        [
          "A escola criou uma horta e a utiliza nas aulas.",
          "A escola criou horta escola aulas.",
          "A horta escola usa a escola.",
          "A escola. Aulas. Horta.",
        ],
        "A escola criou uma horta e a utiliza nas aulas.",
      ),
      ageMcq(
        "Qual frase apresenta relação causal clara?",
        [
          "Como choveu, o jogo foi adiado.",
          "Choveu e jogo.",
          "O jogo, chuva, foi.",
          "Jogo ou chuva talvez.",
        ],
        "Como choveu, o jogo foi adiado.",
      ),
      ageMcq(
        "Qual opção é uma revisão de clareza, não apenas de ortografia?",
        [
          "substituir pronome ambíguo por um nome claro",
          "trocar uma letra",
          "colocar acento",
          "corrigir uma vírgula",
        ],
        "substituir pronome ambíguo por um nome claro",
      ),
    ],
    aritmetica: [
      ageMcq(
        "Resolva: 3x − 4 = 17",
        ["x = 5", "x = 6", "x = 7", "x = 8"],
        "x = 7",
      ),
      ageMcq(
        "Uma razão 2:3 mantém a proporção. Se a primeira parte é 10, a segunda é:",
        ["12", "15", "18", "20"],
        "15",
      ),
      ageMcq(
        "Um produto de R$ 240 tem desconto de 15%. O preço final é:",
        ["R$ 204", "R$ 210", "R$ 225", "R$ 276"],
        "R$ 204",
      ),
      ageMcq(
        "Uma viagem tem 180 km. Após 2/3 do percurso, faltam:",
        ["60 km", "90 km", "120 km", "150 km"],
        "60 km",
      ),
    ],
  },
};

function getQuestionsForAge(
  domain: Domain,
  age: number,
  band: Band,
): Question[] {
  return (
    COGNITIVE_AGE_BANKS[age]?.[domain] ??
    (domain === "visual"
      ? VISUAL_BANK[band]
      : domain === "leitura"
        ? LEITURA_BANK[band]
        : domain === "escrita"
          ? ESCRITA_BANK[band]
          : ARITMETICA_BANK[band])
  );
}

function ageProfileLabel(age: number, band: Band): string {
  if (age >= 6 && age <= 13) return `${age} anos · perfil graduado`;
  return BAND_LABEL[band];
}

// ─────────────────────────────── DOMAIN WRAPPER ───────────────────────────────
const SCHOOL_STAGE_OPTIONS = [
  "Educação infantil",
  "1º–2º ano do Ensino Fundamental",
  "3º–5º ano do Ensino Fundamental",
  "6º–9º ano do Ensino Fundamental",
  "Ensino Médio",
  "Não frequenta / não informado",
] as const;

const INFORMANT_OPTIONS = [
  "Criança respondeu com autonomia",
  "Adulto leu ou mediou parte das instruções",
  "Adulto respondeu por observação",
  "Não informado",
] as const;

const DOMAIN_LABELS: Record<Domain, string> = {
  visual: "Reconhecimento Visual",
  leitura: "Leitura",
  escrita: "Escrita / Ortografia",
  aritmetica: "Aritmética",
};

function DomainModule({
  domain,
  age,
  band,
  onComplete,
  result,
}: {
  domain: Domain;
  age: number;
  band: Band;
  onComplete: (r: DomainResult) => void;
  result?: DomainResult;
}) {
  const [started, setStarted] = useState(false);
  const [reset, setReset] = useState(0);

  const bank = getQuestionsForAge(domain, age, band);

  const handleComplete = useCallback(
    (score: number, max: number, answers: AnswerRecord[]) => {
      onComplete({
        domain,
        label: DOMAIN_LABELS[domain],
        score,
        max,
        notInformed: answers.filter(
          (answer) => answer.responseType === "nao_informada",
        ).length,
        answers,
      });
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
                  notInformed: 0,
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
          : "Tarefas de ortografia, gramática e estrutura textual adequadas à idade e à escolarização.",
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
  const [schoolStage, setSchoolStage] = useState("");
  const [informant, setInformant] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [assessmentFinished, setAssessmentFinished] = useState(false);
  const [startedAtMs, setStartedAtMs] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [activeDomain, setActiveDomain] = useState<Domain>("visual");
  const [results, setResults] = useState<Partial<Record<Domain, DomainResult>>>(
    {},
  );

  const age = parseInt(ageStr, 10);
  const validAge = !isNaN(age) && age >= 2 && age <= 19;
  const band: Band | null = validAge ? getBand(age) : null;
  const canStart = validAge && Boolean(schoolStage) && Boolean(informant);
  const maxAssessmentSeconds = 15 * 60;

  useEffect(() => {
    if (!confirmed || !startedAtMs || assessmentFinished) return;
    const updateClock = () => {
      const next = Math.min(
        maxAssessmentSeconds,
        Math.max(0, Math.floor((Date.now() - startedAtMs) / 1000)),
      );
      setElapsedSeconds(next);
      if (next >= maxAssessmentSeconds) setAssessmentFinished(true);
    };
    updateClock();
    const timer = window.setInterval(updateClock, 1000);
    return () => window.clearInterval(timer);
  }, [assessmentFinished, confirmed, maxAssessmentSeconds, startedAtMs]);

  function resetAssessment() {
    setAgeStr("");
    setSchoolStage("");
    setInformant("");
    setConfirmed(false);
    setAssessmentFinished(false);
    setStartedAtMs(null);
    setElapsedSeconds(0);
    setActiveDomain("visual");
    setResults({});
  }

  function handleResult(r: DomainResult) {
    if (r.max === 0) {
      setAssessmentFinished(false);
      setResults((prev) => {
        const n = { ...prev };
        delete n[r.domain];
        return n;
      });
    } else {
      setResults((prev) => {
        const next = { ...prev, [r.domain]: r };
        if (Object.keys(next).length === DOMAINS.length) {
          setAssessmentFinished(true);
        }
        return next;
      });
    }
  }

  const completedDomains = Object.values(results).filter((r) => r && r.max > 0);
  const completedCount = completedDomains.length;
  const notInformedCount = completedDomains.reduce(
    (total, result) => total + (result?.notInformed ?? 0),
    0,
  );
  const descriptiveResults = completedDomains.map((result) => ({
    label: result!.label,
    score: result!.score,
    attempted: Math.max(0, result!.max - result!.notInformed),
    notInformed: result!.notInformed,
  }));
  const reportItems = [
    { question: "[Contexto] Etapa escolar", answer: schoolStage },
    { question: "[Contexto] Quem acompanhou", answer: informant },
    ...completedDomains.flatMap((result) =>
      result!.answers.map((answer) => ({
        question: `[${result!.label}] ${answer.prompt}`,
        answer:
          answer.responseType === "nao_informada"
            ? "Não informado / não observado"
            : (answer.selected ?? "Não respondida"),
      })),
    ),
  ];
  const remainingSeconds = Math.max(0, maxAssessmentSeconds - elapsedSeconds);
  const elapsedLabel = `${String(Math.floor(elapsedSeconds / 60)).padStart(2, "0")}:${String(elapsedSeconds % 60).padStart(2, "0")}`;
  const remainingLabel = `${String(Math.floor(remainingSeconds / 60)).padStart(2, "0")}:${String(remainingSeconds % 60).padStart(2, "0")}`;

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <header className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-violet-500/[0.08] via-card/70 to-blue-500/[0.07] p-5 sm:p-6 shadow-sm backdrop-blur">
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
              nova bateria · 2–19 anos
            </Badge>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Nova avaliação cognitiva
            </h1>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Bateria pedagógica guiada para a pré-consulta: contexto escolar,
              reconhecimento visual, leitura, escrita e aritmética em até 15
              minutos. O resultado descreve habilidades observadas e pontos para
              conversar na consulta — não produz QI, percentil ou diagnóstico.
            </p>
          </div>
        </div>

        {/* Contexto mínimo antes da bateria */}
        <div className="relative mt-4 grid gap-3 sm:grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)] sm:items-end">
          <div>
            <label
              htmlFor="idade-av"
              className="mb-1 block text-xs font-semibold text-muted-foreground"
            >
              Idade (anos)
            </label>
            <Input
              id="idade-av"
              inputMode="numeric"
              value={ageStr}
              onChange={(e) => {
                setAgeStr(e.target.value.replace(/\D/g, "").slice(0, 2));
                setConfirmed(false);
                setAssessmentFinished(false);
                setStartedAtMs(null);
                setElapsedSeconds(0);
                setResults({});
              }}
              placeholder="ex.: 7"
              className="h-10 w-full sm:w-24"
            />
          </div>
          <label className="block min-w-0">
            <span className="mb-1 block text-xs font-semibold text-muted-foreground">
              Etapa escolar
            </span>
            <select
              value={schoolStage}
              onChange={(e) => {
                setSchoolStage(e.target.value);
                setConfirmed(false);
                setResults({});
              }}
              className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Selecione a etapa</option>
              {SCHOOL_STAGE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="block min-w-0">
            <span className="mb-1 block text-xs font-semibold text-muted-foreground">
              Quem acompanha a resposta
            </span>
            <select
              value={informant}
              onChange={(e) => {
                setInformant(e.target.value);
                setConfirmed(false);
                setResults({});
              }}
              className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Selecione o contexto</option>
              {INFORMANT_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <div className="flex flex-wrap items-center gap-2 sm:col-span-3">
            <Button
              size="sm"
              disabled={!canStart}
              onClick={() => {
                setConfirmed(true);
                setAssessmentFinished(false);
                setStartedAtMs(Date.now());
                setElapsedSeconds(0);
                setActiveDomain("visual");
              }}
            >
              Iniciar amostra de 15 min
            </Button>
            {band && confirmed && (
              <Badge className="bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                {ageProfileLabel(age, band)}
              </Badge>
            )}
            {!canStart && (
              <span className="text-xs text-muted-foreground">
                Informe idade, etapa e contexto para interpretar melhor a
                amostra.
              </span>
            )}
          </div>
        </div>

        <div className="relative mt-4 flex items-start gap-2 rounded-2xl border border-violet-200/70 bg-violet-50/70 px-3 py-2.5 text-xs leading-relaxed text-violet-950 dark:border-violet-900/60 dark:bg-violet-950/20 dark:text-violet-100">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>
            <strong>Uso pedagógico.</strong> Esta é uma amostra breve de
            aprendizagem escolar. Não é teste de QI, não gera diagnóstico e não
            deve ser comparada com outra criança sem considerar escolarização,
            idioma, atenção, fadiga, visão, audição e ajuda recebida.
          </p>
        </div>
      </header>

      {confirmed && band && (
        <section
          className="sticky top-2 z-20 flex flex-wrap items-center gap-3 rounded-2xl border border-border/70 bg-background/95 px-3 py-2.5 shadow-sm backdrop-blur"
          aria-label="Tempo da amostra pedagógica"
          aria-live="polite"
        >
          <Clock3 className="h-4 w-4 text-primary" aria-hidden="true" />
          <div className="min-w-[150px] flex-1">
            <div className="flex items-center justify-between gap-2 text-xs font-semibold">
              <span>
                {assessmentFinished ? "Sessão encerrada" : "Tempo da amostra"}
              </span>
              <span
                className={
                  remainingSeconds <= 120 && !assessmentFinished
                    ? "text-amber-700 dark:text-amber-300"
                    : "text-muted-foreground"
                }
              >
                {assessmentFinished
                  ? `Realizado ${elapsedLabel}`
                  : `${elapsedLabel} · restam ${remainingLabel}`}
              </span>
            </div>
            <div
              className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted"
              aria-hidden="true"
            >
              <div
                className={`h-full rounded-full transition-all duration-500 ${remainingSeconds <= 120 && !assessmentFinished ? "bg-amber-500" : "bg-primary"}`}
                style={{
                  width: `${Math.min(100, (elapsedSeconds / maxAssessmentSeconds) * 100)}%`,
                }}
              />
            </div>
          </div>
          {!assessmentFinished && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 text-xs"
              onClick={() => setAssessmentFinished(true)}
            >
              <TimerReset className="h-3.5 w-3.5" aria-hidden="true" />
              Encerrar e gerar resumo
            </Button>
          )}
        </section>
      )}

      {/* Assessment */}
      {confirmed && band && !assessmentFinished && (
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
          <Card id="cognitive-active-domain" className="scroll-mt-24">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                {(() => {
                  const d = DOMAINS.find((x) => x.id === activeDomain)!;
                  const Icon = d.icon;
                  return <Icon className={`h-5 w-5 ${d.color}`} />;
                })()}
                <h2 className="text-base font-bold text-foreground">
                  {DOMAINS.find((x) => x.id === activeDomain)?.label}
                </h2>
                <Badge variant="outline" className="ml-auto text-[11px]">
                  {ageProfileLabel(age, band)}
                </Badge>
              </div>
              <DomainModule
                key={`${activeDomain}-${age}-${band}`}
                domain={activeDomain}
                age={age}
                band={band}
                onComplete={handleResult}
                result={results[activeDomain]}
              />
            </CardContent>
          </Card>
        </>
      )}

      {confirmed && band && assessmentFinished && (
        <section
          className="space-y-4 rounded-3xl border border-primary/20 bg-primary/[0.04] p-4 sm:p-5"
          aria-labelledby="resumo-pedagogico-title"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <LockKeyhole className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2
                id="resumo-pedagogico-title"
                className="font-bold text-foreground"
              >
                Resumo para a consulta
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {completedCount === DOMAINS.length
                  ? "Os quatro domínios foram concluídos dentro da sessão. Este é um mapa pedagógico breve, não um diagnóstico."
                  : `Sessão encerrada com ${completedCount} de ${DOMAINS.length} domínios concluídos. Este resumo pedagógico não é um diagnóstico; o que não foi aplicado permanece não informado.`}
              </p>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-2xl border border-border/70 bg-background/70 p-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                Tempo
              </p>
              <p className="mt-1 text-sm font-bold">{elapsedLabel} de 15:00</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/70 p-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                Domínios
              </p>
              <p className="mt-1 text-sm font-bold">
                {completedCount} de {DOMAINS.length} concluídos
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/70 p-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                Sem informação
              </p>
              <p className="mt-1 text-sm font-bold">
                {notInformedCount} itens não interpretados
              </p>
            </div>
          </div>
          {descriptiveResults.length > 0 && (
            <div className="rounded-2xl border border-border/70 bg-background/70 p-3.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                Leitura descritiva da amostra
              </p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {descriptiveResults.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-background px-3 py-2"
                  >
                    <span className="text-xs font-semibold text-foreground">
                      {item.label}
                    </span>
                    <span className="text-right text-xs text-muted-foreground">
                      {item.attempted > 0
                        ? `${item.score}/${item.attempted} respondidos corretamente`
                        : "sem resposta interpretável"}
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Estes números descrevem somente esta amostra e não são
                comparação normativa. Itens “não informados” ficaram fora da
                leitura de acerto/erro.
              </p>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={resetAssessment}
              className="gap-2"
            >
              <TimerReset className="h-4 w-4" aria-hidden="true" /> Nova amostra
            </Button>
            <span className="text-xs leading-relaxed text-muted-foreground">
              Leve este resumo e as observações do contexto para o profissional
              responsável.
            </span>
          </div>
          {completedDomains.length > 0 && (
            <div className="space-y-4">
              <ClinicalReport
                scaleName="Nova avaliação cognitiva"
                scaleFullName="Bateria pedagógica guiada de reconhecimento visual, leitura, escrita e aritmética"
                items={reportItems}
                patientAge={band ? ageProfileLabel(age, band) : undefined}
              />
              <SaveToPatient
                scaleName="Nova avaliação cognitiva"
                responses={reportItems}
                patientAge={band ? ageProfileLabel(age, band) : undefined}
              />
            </div>
          )}
        </section>
      )}

      {!confirmed && (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center space-y-2">
          <Brain className="h-8 w-8 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">
            Informe idade, etapa escolar e contexto de resposta para iniciar uma
            amostra pedagógica adaptada. O fluxo é interrompível e tem limite de
            15 minutos.
          </p>
        </div>
      )}
    </div>
  );
}
