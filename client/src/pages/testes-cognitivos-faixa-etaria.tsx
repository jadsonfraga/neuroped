/**
 * Testes Cognitivos por Faixa Etária — bateria autoral enxuta (reconhecimento
 * visual, leitura, escrita e aritmética) com bandas 2–19 anos e perfis exatos
 * 6–13, apresentada como uma aventura em quatro mundos. Restaurada a partir da
 * antiga "Avaliação Cognitiva Infantil", que a consolidação f2d7f48 esvaziou e
 * b93a04b extinguiu. Superfície própria, separada da Sonda Dez, com rota
 * /testes-cognitivos.
 *
 * Verdade clínica: registra pergunta a pergunta e não produz escore, percentil,
 * idade equivalente nem interpretação diagnóstica. Estrelas e medalhas do jogo
 * medem participação e conclusão, nunca acerto — a criança não vê certo/errado.
 */
import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClinicalReport } from "@/components/ClinicalReport";
import { SaveToPatient } from "@/components/SaveToPatient";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { celebrate } from "@/lib/confetti";
import { softSuccess, softTap, softWhoosh } from "@/lib/softSounds";
import { DEFAULT_HERO, HeroGrid, NEUTRAL_CHEERS, type Hero } from "@/components/aventura";
import {
  ArrowLeft,
  Brain,
  ChevronRight,
  Flag,
  Map as MapIcon,
  Play,
  RotateCcw,
  ShieldCheck,
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

// ─────────────────────────────── PERFIS EXATOS 6–13 ───────────────────────────────
const ageMcq = (prompt: string, options: string[], answer: string): MCQ => ({
  kind: "mcq",
  prompt,
  options,
  answer,
});

// Perfis 6–13: cada item mostra o estímulo inteiro na própria pergunta (a
// sequência, o texto, a conta). Nada depende de item anterior nem de regra
// implícita. Uma única resposta certa, conferível de relance por quem aplica.
const COGNITIVE_AGE_BANKS: Partial<Record<number, Record<Domain, MCQ[]>>> = {
  6: {
    visual: [
      ageMcq("Qual figura é igual a esta? ⭐", ["⭐", "🔺", "🔵", "🟩"], "⭐"),
      ageMcq("O que vem depois? 🔴 🔵 🔴 🔵 🔴 __", ["🟡", "🔵", "🔴", "🟢"], "🔵"),
      ageMcq("Qual destes é comida?", ["🍎", "🚗", "👟", "✏️"], "🍎"),
      ageMcq("Qual é o menor animal?", ["🐘", "🐶", "🐭", "🦒"], "🐭"),
    ],
    leitura: [
      ageMcq("Qual palavra começa com a letra M?", ["mesa", "sapo", "foca", "rato"], "mesa"),
      ageMcq("Leia: 'A bola é azul.'\nDe que cor é a bola?", ["Verde", "Azul", "Amarela", "Vermelha"], "Azul"),
      ageMcq("Qual palavra rima com GATO?", ["pato", "mesa", "bola", "casa"], "pato"),
      ageMcq("Junte as letras: B-O-L-A. Que palavra é?", ["BALA", "BOLA", "BELA", "COLA"], "BOLA"),
    ],
    escrita: [
      ageMcq("Qual frase começa com letra maiúscula?", ["ana brinca.", "Ana brinca.", "ana Brinca.", "ana brinca"], "Ana brinca."),
      ageMcq("Qual palavra está escrita certa?", ["caza", "casa", "kasa", "cassa"], "casa"),
      ageMcq("Complete: 'Eu ___ uma história.'", ["leio", "leem", "ler", "leu"], "leio"),
      ageMcq("Qual sinal vai no fim de uma pergunta?", [".", ",", "?", "!"], "?"),
    ],
    aritmetica: [
      ageMcq("Qual número vem depois? 7, 8, 9, __", ["10", "11", "6", "12"], "10"),
      ageMcq("3 + 2 = ?", ["4", "5", "6", "3"], "5"),
      ageMcq("5 − 2 = ?", ["2", "3", "4", "1"], "3"),
      ageMcq("Qual número é maior?", ["8", "3", "5", "2"], "8"),
    ],
  },
  7: {
    visual: [
      ageMcq("O que vem depois? 🔺 🔵 🔺 🔵 __", ["🔵", "🔺", "🟢", "⭐"], "🔺"),
      ageMcq("Qual figura é igual a esta? 🔷", ["🔷", "🔶", "🔺", "⭐"], "🔷"),
      ageMcq("Qual NÃO é uma forma?", ["triângulo", "quadrado", "círculo", "banana"], "banana"),
      ageMcq("Qual figura está diferente? 🔴 🔴 🔴 🔵", ["1ª", "2ª", "3ª", "4ª"], "4ª"),
    ],
    leitura: [
      ageMcq(
        "Leia: 'Lia levou o guarda-chuva porque ia chover.'\nPor que Lia levou o guarda-chuva?",
        ["Porque estava calor", "Porque ia chover", "Porque ia dormir", "Porque perdeu a mochila"],
        "Porque ia chover",
      ),
      ageMcq("Quantas sílabas tem JA-NE-LA?", ["2", "3", "4", "5"], "3"),
      ageMcq(
        "Qual frase está na ordem certa?",
        ["Parque foi ao João", "João ao parque foi", "João foi ao parque", "Foi parque João ao"],
        "João foi ao parque",
      ),
      ageMcq(
        "Leia: 'O coelho correu rápido.'\nRápido quer dizer:",
        ["Devagar", "Depressa", "Com medo", "Em silêncio"],
        "Depressa",
      ),
    ],
    escrita: [
      ageMcq(
        "Qual frase termina com ponto final?",
        ["Hoje fomos ao parque.", "Hoje fomos ao parque", "Hoje fomos ao parque?", "Hoje fomos ao parque!"],
        "Hoje fomos ao parque.",
      ),
      ageMcq("Qual é o plural de FLOR?", ["flors", "flore", "flores", "floris"], "flores"),
      ageMcq("Complete: 'As meninas ___ no pátio.'", ["brinca", "brincam", "brinco", "brincou"], "brincam"),
      ageMcq("Qual palavra está escrita certa?", ["girafa", "jirafa", "girrafa", "girafá"], "girafa"),
    ],
    aritmetica: [
      ageMcq("10 + 5 = ?", ["14", "15", "16", "12"], "15"),
      ageMcq("12 − 4 = ?", ["6", "8", "9", "7"], "8"),
      ageMcq("Há 2 caixas com 3 lápis em cada uma. Quantos lápis?", ["5", "6", "4", "8"], "6"),
      ageMcq("Qual número vem depois? 10, 20, 30, __", ["35", "40", "50", "31"], "40"),
    ],
  },
  8: {
    visual: [
      ageMcq("O que vem depois? 🔴 🔵 🟢 🔴 🔵 __", ["🟢", "🔴", "🔵", "🟡"], "🟢"),
      ageMcq("O que vem depois? ⭐ ⭐ 🔵 ⭐ ⭐ __", ["🔵", "⭐", "🟢", "🔺"], "🔵"),
      ageMcq("Qual NÃO pertence ao grupo? 🐶 🐱 🐭 🚗", ["🚗", "🐶", "🐱", "🐭"], "🚗"),
      ageMcq("MÃO usa LUVA. PÉ usa:", ["meia", "chapéu", "camisa", "cinto"], "meia"),
    ],
    leitura: [
      ageMcq(
        "Leia: 'A horta da escola usa regadores pequenos para não gastar muita água.'\nO que a horta usa?",
        ["Regadores pequenos", "Mangueiras grandes", "Baldes", "Garrafas"],
        "Regadores pequenos",
      ),
      ageMcq(
        "Leia: 'A horta da escola usa regadores pequenos para não gastar muita água.'\nPor que usa regadores pequenos?",
        ["Para não gastar muita água", "Para enfeitar", "Para as plantas crescerem rápido", "Para fazer barulho"],
        "Para não gastar muita água",
      ),
      ageMcq(
        "Leia: 'A horta da escola usa regadores pequenos para não gastar muita água.'\n'Gastar' aqui quer dizer:",
        ["usar", "guardar", "esconder", "esquecer"],
        "usar",
      ),
      ageMcq(
        "Leia: 'A horta da escola usa regadores pequenos para não gastar muita água.'\nQual título combina com o texto?",
        ["Uma horta cuidadosa", "O passeio de bicicleta", "A chuva forte", "O brinquedo novo"],
        "Uma horta cuidadosa",
      ),
    ],
    escrita: [
      ageMcq(
        "Qual frase está certa?",
        ["As criança brinca.", "As crianças brincam.", "A crianças brincam.", "As crianças brincou."],
        "As crianças brincam.",
      ),
      ageMcq("Qual palavra precisa de acento?", ["cafe", "mesa", "bola", "gato"], "cafe"),
      ageMcq("Complete: 'Estava chovendo, ___ levei guarda-chuva.'", ["por isso", "mas", "ou", "nem"], "por isso"),
      ageMcq("Qual palavra está escrita certa?", ["escola", "iscola", "escóla", "esqola"], "escola"),
    ],
    aritmetica: [
      ageMcq("5 × 2 = ?", ["7", "10", "12", "8"], "10"),
      ageMcq("18 ÷ 2 = ?", ["8", "9", "10", "6"], "9"),
      ageMcq("Metade de 8 é:", ["2", "4", "6", "3"], "4"),
      ageMcq("Uma caixa tem 5 lápis. Quantos lápis há em 3 caixas?", ["8", "10", "15", "12"], "15"),
    ],
  },
  9: {
    visual: [
      ageMcq("O que vem depois? 2, 4, 6, 8, __", ["9", "10", "12", "11"], "10"),
      ageMcq("Qual NÃO pertence ao grupo? 🍎 🍌 🍇 🥕", ["🥕", "🍎", "🍌", "🍇"], "🥕"),
      ageMcq("O que vem depois? 🟩🟩🔵 / 🟩🔵🔵 / __", ["🔵🔵🔵", "🟩🟩🟩", "🔵🟩🟩", "🟩🔵🟩"], "🔵🔵🔵"),
      ageMcq("Qual é esta figura virada de cabeça para baixo? 🔺", ["🔻", "🔺", "🔵", "⬛"], "🔻"),
    ],
    leitura: [
      ageMcq(
        "Leia: 'As árvores fazem sombra e deixam a cidade mais fresca.'\nO que as árvores fazem?",
        ["Sombra", "Barulho", "Chuva", "Vento"],
        "Sombra",
      ),
      ageMcq(
        "Leia: 'As árvores fazem sombra e deixam a cidade mais fresca.'\nPor causa das árvores, a cidade fica:",
        ["mais fresca", "mais quente", "mais escura", "mais vazia"],
        "mais fresca",
      ),
      ageMcq(
        "Leia: 'As árvores fazem sombra e deixam a cidade mais fresca.'\n'Fresca' aqui quer dizer:",
        ["menos quente", "mais nova", "mais limpa", "mais alta"],
        "menos quente",
      ),
      ageMcq(
        "Leia: 'As árvores fazem sombra e deixam a cidade mais fresca.'\nQual título combina com o texto?",
        ["Árvores deixam a cidade mais fresca", "O carro novo", "A festa da escola", "O rio seco"],
        "Árvores deixam a cidade mais fresca",
      ),
    ],
    escrita: [
      ageMcq("Complete: 'Estudei bastante, ___ fui bem na prova.'", ["por isso", "mas", "ou", "nem"], "por isso"),
      ageMcq(
        "Qual frase está certa?",
        ["Nós foi ao cinema.", "Nós fomos ao cinema.", "Nós foram ao cinema.", "Nós vai ao cinema."],
        "Nós fomos ao cinema.",
      ),
      ageMcq("Qual palavra está escrita certa?", ["cabeça", "cabesa", "cabessa", "kabeça"], "cabeça"),
      ageMcq(
        "Qual frase está na ordem certa?",
        [
          "Com o binóculo, o menino viu o cachorro.",
          "Viu o cachorro menino binóculo.",
          "O cachorro com menino viu.",
          "Binóculo o viu menino cachorro.",
        ],
        "Com o binóculo, o menino viu o cachorro.",
      ),
    ],
    aritmetica: [
      ageMcq("Qual fração é a metade?", ["1/2", "1/3", "1/4", "2/3"], "1/2"),
      ageMcq("25 + 15 = ?", ["30", "40", "45", "35"], "40"),
      ageMcq("Ana tinha 20 figurinhas e ganhou 15. Com quantas ficou?", ["25", "30", "35", "5"], "35"),
      ageMcq("6 × 5 = ?", ["25", "30", "35", "11"], "30"),
    ],
  },
  10: {
    visual: [
      ageMcq("LIVRO é para LER. GARFO é para:", ["comer", "dormir", "correr", "cantar"], "comer"),
      ageMcq("O que vem depois? 1, 3, 5, 7, __", ["8", "9", "10", "11"], "9"),
      ageMcq("O triângulo ficou pintado: △ → ▲. Faça o mesmo com o círculo: ○ →", ["●", "□", "◇", "☆"], "●"),
      ageMcq("Qual NÃO pertence ao grupo?", ["quadrado", "círculo", "triângulo", "maçã"], "maçã"),
    ],
    leitura: [
      ageMcq(
        "Leia: 'A água precisa ser tratada antes de chegar às casas, para ficar boa para beber.'\nO que acontece com a água antes de chegar às casas?",
        ["Ela é tratada", "Ela é congelada", "Ela é vendida", "Ela é pintada"],
        "Ela é tratada",
      ),
      ageMcq(
        "Leia: 'A água precisa ser tratada antes de chegar às casas, para ficar boa para beber.'\nPor que a água é tratada?",
        ["Para ficar boa para beber", "Para mudar de cor", "Para ficar salgada", "Para fazer barulho"],
        "Para ficar boa para beber",
      ),
      ageMcq(
        "Leia: 'A água precisa ser tratada antes de chegar às casas, para ficar boa para beber.'\nAonde a água chega depois de tratada?",
        ["Às casas", "Ao mar", "Às nuvens", "Ao deserto"],
        "Às casas",
      ),
      ageMcq(
        "Leia: 'A água precisa ser tratada antes de chegar às casas, para ficar boa para beber.'\nQual título combina com o texto?",
        ["Água tratada para beber", "O jogo de futebol", "A viagem de avião", "O bolo de chocolate"],
        "Água tratada para beber",
      ),
    ],
    escrita: [
      ageMcq(
        "Qual frase tem a vírgula no lugar certo?",
        [
          "Quando chegou, Maria abriu o livro.",
          "Quando, chegou Maria abriu o livro.",
          "Quando chegou Maria abriu, o livro.",
          "Quando chegou Maria abriu o, livro.",
        ],
        "Quando chegou, Maria abriu o livro.",
      ),
      ageMcq("Complete: 'Ele estudou, ___ ainda ficou com dúvida.'", ["mas", "porque", "então", "ou"], "mas"),
      ageMcq(
        "Qual frase está certa?",
        ["Os aluno fizeram a tarefa.", "Os alunos fizeram a tarefa.", "O alunos fez a tarefa.", "Os alunos fez a tarefa."],
        "Os alunos fizeram a tarefa.",
      ),
      ageMcq("Qual palavra está escrita certa?", ["amanhã", "amanhan", "amanha", "amanhâ"], "amanhã"),
    ],
    aritmetica: [
      ageMcq("Metade de 50 é:", ["20", "25", "30", "15"], "25"),
      ageMcq("10% de 100 = ?", ["1", "10", "100", "50"], "10"),
      ageMcq("Uma receita para 2 pessoas usa 1 xícara. Para 4 pessoas, usa:", ["1", "2", "3", "4"], "2"),
      ageMcq("48 + 27 = ?", ["65", "75", "85", "74"], "75"),
    ],
  },
  11: {
    visual: [
      ageMcq("O que vem depois? 🔺 🔵 🔺 🔵 🔺 __", ["🔵", "🔺", "🟢", "⭐"], "🔵"),
      ageMcq("O que vem depois? 🔴 🔵 🟢 🔴 🔵 🟢 🔴 __", ["🔵", "🟢", "🔴", "🟡"], "🔵"),
      ageMcq("Qual seta aponta para o lado contrário de ➡️?", ["⬅️", "⬆️", "⬇️", "↗️"], "⬅️"),
      ageMcq("TERMÔMETRO serve para MEDIR. LÁPIS serve para:", ["escrever", "dormir", "comer", "correr"], "escrever"),
    ],
    leitura: [
      ageMcq(
        "Leia: 'A turma fez uma horta na escola e anotava quanta água usava, para não desperdiçar.'\nO que a turma fez?",
        ["Uma horta", "Um bolo", "Uma pintura", "Um passeio"],
        "Uma horta",
      ),
      ageMcq(
        "Leia: 'A turma fez uma horta na escola e anotava quanta água usava, para não desperdiçar.'\nPor que a turma anotava a água usada?",
        ["Para não desperdiçar", "Para escolher sementes", "Para medir a horta", "Para faltar à aula"],
        "Para não desperdiçar",
      ),
      ageMcq(
        "Leia: 'A turma fez uma horta na escola e anotava quanta água usava, para não desperdiçar.'\n'Desperdiçar' quer dizer:",
        ["gastar sem necessidade", "guardar bem", "beber", "plantar"],
        "gastar sem necessidade",
      ),
      ageMcq(
        "Leia: 'A turma fez uma horta na escola e anotava quanta água usava, para não desperdiçar.'\nQual título combina com o texto?",
        ["A horta e o cuidado com a água", "O jogo de vôlei", "A viagem de trem", "O dia de chuva"],
        "A horta e o cuidado com a água",
      ),
    ],
    escrita: [
      ageMcq(
        "Qual frase tem a vírgula no lugar certo?",
        [
          "Quando terminou a aula, Pedro guardou o material.",
          "Quando, terminou a aula Pedro guardou o material.",
          "Quando terminou a aula Pedro guardou, o material.",
          "Quando terminou a aula Pedro guardou o, material.",
        ],
        "Quando terminou a aula, Pedro guardou o material.",
      ),
      ageMcq("Complete: 'Os resultados ___ anotados no caderno.'", ["foi", "foram", "era", "será"], "foram"),
      ageMcq(
        "Qual frase está na ordem certa?",
        [
          "Lia revisou o texto e corrigiu duas palavras.",
          "Duas palavras corrigiu Lia texto o revisou.",
          "Corrigiu Lia texto revisou palavras.",
          "O texto duas Lia palavras revisou corrigiu.",
        ],
        "Lia revisou o texto e corrigiu duas palavras.",
      ),
      ageMcq("Qual palavra está escrita certa?", ["também", "tambem", "tanbém", "tambén"], "também"),
    ],
    aritmetica: [
      ageMcq("1/2 de 20 = ?", ["5", "10", "15", "40"], "10"),
      ageMcq("2,5 + 1,5 = ?", ["3", "4", "3,5", "4,5"], "4"),
      ageMcq("Um retângulo tem lados de 8 cm, 3 cm, 8 cm e 3 cm. Somando os quatro lados, dá:", ["11 cm", "22 cm", "24 cm", "16 cm"], "22 cm"),
      ageMcq("Uma receita usa 3 xícaras para 6 pessoas. Para 12 pessoas, usa:", ["4", "5", "6", "9"], "6"),
    ],
  },
  12: {
    visual: [
      ageMcq("O que vem depois? ↗️🔴 ↘️🔵 ↗️🔴 ↘️🔵 ↗️🔴 __", ["↗️🔴", "↘️🔵", "↗️🔵", "↘️🔴"], "↘️🔵"),
      ageMcq("MAPA serve para achar o CAMINHO. RECEITA serve para fazer:", ["o prato", "a janela", "a estante", "o esporte"], "o prato"),
      ageMcq("Qual seta aponta para o lado contrário de ↗️?", ["↙️", "↘️", "↖️", "⬆️"], "↙️"),
      ageMcq("Qual figura é azul E redonda?", ["🔵", "🟦", "🔴", "🟩"], "🔵"),
    ],
    leitura: [
      ageMcq(
        "Leia: 'Ler todos os dias ajuda a conhecer palavras novas e a entender melhor os textos.'\nSegundo o texto, ler todos os dias ajuda a:",
        ["conhecer palavras novas", "correr mais rápido", "dormir cedo", "desenhar melhor"],
        "conhecer palavras novas",
      ),
      ageMcq(
        "Leia: 'Ler todos os dias ajuda a conhecer palavras novas e a entender melhor os textos.'\nQuem escreveu o texto é a favor de:",
        ["ler com frequência", "não ler", "ler só imagens", "ler uma vez por ano"],
        "ler com frequência",
      ),
      ageMcq(
        "Leia: 'Ler todos os dias ajuda a conhecer palavras novas e a entender melhor os textos.'\n'Todos os dias' é o mesmo que:",
        ["com frequência", "uma vez só", "nunca", "devagar"],
        "com frequência",
      ),
      ageMcq(
        "Leia: 'Ler todos os dias ajuda a conhecer palavras novas e a entender melhor os textos.'\nQual resumo combina com o texto?",
        [
          "Ler todo dia ajuda no vocabulário e na compreensão.",
          "Ler é só decorar palavras.",
          "Textos não precisam ter sentido.",
          "Todo leitor aprende igual.",
        ],
        "Ler todo dia ajuda no vocabulário e na compreensão.",
      ),
    ],
    escrita: [
      ageMcq(
        "Qual frase dá uma opinião?",
        [
          "A biblioteca tem duas salas.",
          "A leitura diária deveria fazer parte da rotina da escola.",
          "Ontem fui à biblioteca.",
          "O livro tem 80 páginas.",
        ],
        "A leitura diária deveria fazer parte da rotina da escola.",
      ),
      ageMcq("Complete: 'Estudei muito, ___ ainda errei uma questão.'", ["portanto", "além disso", "porém", "porque"], "porém"),
      ageMcq(
        "Qual frase é a mais formal, para uma carta à direção da escola?",
        ["A gente acha que é muito legal.", "Consideramos a proposta boa.", "Tá tudo bem com a proposta.", "A proposta é tipo boa."],
        "Consideramos a proposta boa.",
      ),
      ageMcq("Qual palavra está escrita certa?", ["exceção", "escessão", "excessão", "eceção"], "exceção"),
    ],
    aritmetica: [
      ageMcq("Se 3 cadernos custam R$ 27, quanto custa 1 caderno?", ["R$ 7", "R$ 9", "R$ 8", "R$ 10"], "R$ 9"),
      ageMcq("10% de 150 = ?", ["10", "15", "25", "50"], "15"),
      ageMcq("Resolva: x + 6 = 16", ["x = 8", "x = 10", "x = 12", "x = 22"], "x = 10"),
      ageMcq("A média de 6 e 10 é:", ["7", "8", "9", "16"], "8"),
    ],
  },
  13: {
    visual: [
      ageMcq("O que vem depois? 2, 4, 8, 16, __", ["18", "24", "32", "20"], "32"),
      ageMcq("O que vem depois? 🔺 🔻 🔺 🔻 🔺 __", ["🔺", "🔻", "🔵", "⬛"], "🔻"),
      ageMcq("Qual grupo NÃO segue a regra 'dobrar o número'?", ["2, 4, 8", "3, 6, 12", "5, 10, 20", "4, 8, 14"], "4, 8, 14"),
      ageMcq("PERGUNTA leva a RESPOSTA. SEMENTE leva a:", ["planta", "estojo", "parede", "chão"], "planta"),
    ],
    leitura: [
      ageMcq(
        "Leia: 'Muitos alunos chegam atrasados. Por isso, a escola vai abrir o portão dez minutos mais cedo.'\nQual é o problema apontado no texto?",
        ["Alunos chegam atrasados", "Alunos faltam à prova", "A escola não tem portão", "O portão está quebrado"],
        "Alunos chegam atrasados",
      ),
      ageMcq(
        "Leia: 'Muitos alunos chegam atrasados. Por isso, a escola vai abrir o portão dez minutos mais cedo.'\nO que a escola vai fazer?",
        ["Abrir o portão mais cedo", "Fechar a escola", "Mudar de endereço", "Cancelar as aulas"],
        "Abrir o portão mais cedo",
      ),
      ageMcq(
        "Leia: 'Muitos alunos chegam atrasados. Por isso, a escola vai abrir o portão dez minutos mais cedo.'\n'Por isso' liga o problema a:",
        ["uma solução", "uma pergunta", "um nome", "um lugar"],
        "uma solução",
      ),
      ageMcq(
        "Leia: 'Muitos alunos chegam atrasados. Por isso, a escola vai abrir o portão dez minutos mais cedo.'\nQual resumo é o melhor?",
        [
          "Por causa dos atrasos, a escola abrirá o portão mais cedo.",
          "A escola tem um portão.",
          "Os alunos gostam de chegar cedo.",
          "O texto fala de provas.",
        ],
        "Por causa dos atrasos, a escola abrirá o portão mais cedo.",
      ),
    ],
    escrita: [
      ageMcq(
        "Qual frase junta as duas ideias sem repetir palavras?\n'A escola criou uma horta. A escola usa a horta nas aulas.'",
        ["A escola criou uma horta e a usa nas aulas.", "A escola criou horta escola aulas.", "A horta escola usa a escola.", "A escola. Aulas. Horta."],
        "A escola criou uma horta e a usa nas aulas.",
      ),
      ageMcq(
        "Qual frase mostra causa e consequência?",
        ["Como choveu, o jogo foi adiado.", "Choveu e jogo.", "O jogo, chuva, foi.", "Jogo ou chuva talvez."],
        "Como choveu, o jogo foi adiado.",
      ),
      ageMcq("Complete: 'Ela treinou bastante, ___ venceu a corrida.'", ["por isso", "porém", "embora", "ou"], "por isso"),
      ageMcq("Qual palavra está escrita certa?", ["através", "atravez", "atravéz", "atraveiz"], "através"),
    ],
    aritmetica: [
      ageMcq("Resolva: 2x = 14", ["x = 5", "x = 6", "x = 7", "x = 12"], "x = 7"),
      ageMcq("Uma receita usa 2 ovos para cada 3 pessoas. Para 9 pessoas, usa:", ["4", "6", "9", "12"], "6"),
      ageMcq("Um produto de R$ 200 tem desconto de 10%. O preço final é:", ["R$ 180", "R$ 190", "R$ 210", "R$ 20"], "R$ 180"),
      ageMcq("Uma viagem tem 90 km. Depois de andar 60 km, faltam:", ["20 km", "30 km", "40 km", "150 km"], "30 km"),
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

// ─────────────────────────────── AVENTURA (UI de jogo) ───────────────────────────────
//
// A bateria vira um jogo de exploração em quatro mundos, um por domínio. A
// filosofia clínica não muda com a roupagem:
//   • cada resposta é registrada pergunta a pergunta, exatamente como antes;
//   • a criança NUNCA vê certo/errado — o feedback é sempre neutro;
//   • estrelas contam PARTICIPAÇÃO (respostas registradas) e medalhas contam
//     CONCLUSÃO de mundo. Nenhuma das duas é escore, nota ou percentil;
//   • o profissional recebe o mesmo relatório qualitativo e o mesmo salvamento.

interface WorldMeta {
  name: string;
  emoji: string;
  tagline: string;
  badge: string;
  surface: string;
  accent: string;
}

const WORLDS: Record<Domain, WorldMeta> = {
  visual: {
    name: "Floresta dos Olhos",
    emoji: "🌳",
    tagline: "Encontre o que o guia pedir entre as figuras.",
    badge: "Explorador da Floresta",
    surface:
      "from-emerald-300/40 via-lime-100/60 to-background dark:from-emerald-900/40 dark:via-emerald-950/30",
    accent: "text-emerald-700 dark:text-emerald-300",
  },
  leitura: {
    name: "Ilha das Palavras",
    emoji: "🏝️",
    tagline: "Letras, sons e histórias escondidas na areia.",
    badge: "Navegante das Palavras",
    surface:
      "from-sky-300/40 via-cyan-100/60 to-background dark:from-sky-900/40 dark:via-sky-950/30",
    accent: "text-sky-700 dark:text-sky-300",
  },
  escrita: {
    name: "Castelo da Escrita",
    emoji: "🏰",
    tagline: "Traços, palavras e frases abrem as portas do castelo.",
    badge: "Guardião do Castelo",
    surface:
      "from-amber-300/40 via-orange-100/60 to-background dark:from-amber-900/40 dark:via-amber-950/30",
    accent: "text-amber-700 dark:text-amber-300",
  },
  aritmetica: {
    name: "Montanha dos Números",
    emoji: "⛰️",
    tagline: "Cada conta é um degrau até o topo.",
    badge: "Alpinista dos Números",
    surface:
      "from-violet-300/40 via-fuchsia-100/60 to-background dark:from-violet-900/40 dark:via-violet-950/30",
    accent: "text-violet-700 dark:text-violet-300",
  },
};

const WORLD_ORDER: Domain[] = ["visual", "leitura", "escrita", "aritmetica"];

const OPTION_TINTS = [
  "bg-rose-50 hover:bg-rose-100 border-rose-200 dark:bg-rose-950/30 dark:border-rose-900 dark:hover:bg-rose-950/50",
  "bg-sky-50 hover:bg-sky-100 border-sky-200 dark:bg-sky-950/30 dark:border-sky-900 dark:hover:bg-sky-950/50",
  "bg-amber-50 hover:bg-amber-100 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900 dark:hover:bg-amber-950/50",
  "bg-emerald-50 hover:bg-emerald-100 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900 dark:hover:bg-emerald-950/50",
];

// ─────────────────────────────── HUD ───────────────────────────────
function AdventureHud({
  hero,
  stars,
  badges,
  onChangeHero,
}: {
  hero: Hero;
  stars: number;
  badges: Domain[];
  onChangeHero: () => void;
}) {
  const reduce = useReducedMotion();
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border/60 bg-card/80 px-3 py-2 shadow-sm backdrop-blur sm:px-4">
      <button
        type="button"
        onClick={onChangeHero}
        className="flex items-center gap-2 rounded-xl px-2 py-1 transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`Herói atual: ${hero.name}. Trocar herói`}
      >
        <span className="text-3xl" aria-hidden="true">
          {hero.emoji}
        </span>
        <span className="text-sm font-bold">{hero.name}</span>
      </button>

      <div
        className="ml-auto flex items-center gap-1.5 rounded-xl bg-amber-100/70 px-3 py-1 dark:bg-amber-950/40"
        aria-live="polite"
        aria-label={`${stars} estrelas`}
      >
        <span className="text-xl" aria-hidden="true">
          ⭐
        </span>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={stars}
            initial={reduce ? false : { y: 8, opacity: 0, scale: 0.8 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={reduce ? undefined : { y: -8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="text-base font-black tabular-nums text-amber-900 dark:text-amber-100"
          >
            {stars}
          </motion.span>
        </AnimatePresence>
      </div>

      <ul className="flex gap-1" aria-label="Medalhas dos mundos">
        {WORLD_ORDER.map((domain) => {
          const earned = badges.includes(domain);
          return (
            <li
              key={domain}
              title={`${WORLDS[domain].badge}${earned ? " · conquistada" : " · ainda não"}`}
              className={`flex h-9 w-9 items-center justify-center rounded-full border text-xl transition ${earned ? "border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/40" : "border-border/60 bg-muted/40 opacity-40 grayscale"}`}
            >
              <span aria-hidden="true">{WORLDS[domain].emoji}</span>
              <span className="sr-only">
                {WORLDS[domain].badge}: {earned ? "conquistada" : "ainda não"}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ─────────────────────────────── Escolha do herói ───────────────────────────────
function HeroPicker({
  current,
  onPick,
}: {
  current: Hero | null;
  onPick: (hero: Hero) => void;
}) {
  return (
    <Card className="overflow-hidden rounded-3xl border-border/60">
      <CardContent className="p-5 sm:p-7">
        <p className="text-center text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Antes de partir
        </p>
        <h2 className="mt-1 text-center text-2xl font-black tracking-tight sm:text-3xl">
          Escolha seu herói
        </h2>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          Toque em quem vai viajar com você pelos quatro mundos.
        </p>
        <div className="mt-6">
          <HeroGrid current={current} onPick={onPick} />
        </div>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────── Mapa dos mundos ───────────────────────────────
function WorldMap({
  hero,
  age,
  band,
  results,
  onEnter,
}: {
  hero: Hero;
  age: number;
  band: Band;
  results: Partial<Record<Domain, DomainResult>>;
  onEnter: (domain: Domain) => void;
}) {
  const reduce = useReducedMotion();
  const doneCount = WORLD_ORDER.filter((d) => results[d]?.max).length;
  const allDone = doneCount === WORLD_ORDER.length;

  return (
    <div className="space-y-4">
      <AnimatePresence initial={false}>
        {allDone && (
          <motion.div
            key="finale"
            initial={reduce ? false : { opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-3xl border border-amber-300 bg-gradient-to-br from-amber-100 via-yellow-50 to-background p-5 text-center shadow-sm dark:border-amber-700 dark:from-amber-950/50 dark:via-amber-950/20"
            role="status"
          >
            <div className="text-5xl" aria-hidden="true">
              🏆
            </div>
            <h2 className="mt-2 text-xl font-black tracking-tight sm:text-2xl">
              Aventura completa!
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {hero.emoji} {hero.name} visitou os quatro mundos. As quatro medalhas
              são suas.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-wrap items-end justify-between gap-2 px-1">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Mapa da aventura
          </p>
          <h2 className="text-xl font-black tracking-tight sm:text-2xl">
            {allDone ? "Quer visitar um mundo de novo?" : "Para onde vamos agora?"}
          </h2>
        </div>
        <Badge variant="outline" className="text-[11px]">
          {doneCount}/{WORLD_ORDER.length} mundos · {ageProfileLabel(age, band)}
        </Badge>
      </div>

      <ol className="grid gap-3 sm:grid-cols-2">
        {WORLD_ORDER.map((domain, index) => {
          const world = WORLDS[domain];
          const done = Boolean(results[domain]?.max);
          const phases = getQuestionsForAge(domain, age, band);
          const phaseCount =
            domain === "escrita" && (band === "A" || band === "B")
              ? (ESCRITA_BANK[band][0] as ObsBlock).items.length
              : phases.length;
          return (
            <li key={domain}>
              <motion.button
                type="button"
                onClick={() => {
                  softWhoosh();
                  onEnter(domain);
                }}
                initial={reduce ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: reduce ? 0 : index * 0.07 }}
                whileHover={reduce ? undefined : { y: -3 }}
                whileTap={reduce ? undefined : { scale: 0.98 }}
                className={`relative flex w-full items-center gap-4 overflow-hidden rounded-3xl border bg-gradient-to-br p-4 text-left shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-5 ${world.surface} ${done ? "border-amber-300 dark:border-amber-700" : "border-border/60"}`}
              >
                <span
                  className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/70 text-4xl shadow-inner dark:bg-black/20"
                  aria-hidden="true"
                >
                  {world.emoji}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                    Mundo {index + 1}
                  </span>
                  <span className={`block text-lg font-black leading-tight ${world.accent}`}>
                    {world.name}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {world.tagline}
                  </span>
                  <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-background/80 px-2.5 py-1 text-[11px] font-bold">
                    {done ? (
                      <>
                        <span aria-hidden="true">🏅</span> {world.badge}
                      </>
                    ) : (
                      <>
                        <MapIcon className="h-3 w-3" aria-hidden="true" /> {phaseCount}{" "}
                        {domain === "escrita" && (band === "A" || band === "B")
                          ? "missões"
                          : "fases"}
                      </>
                    )}
                  </span>
                </span>
                <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
              </motion.button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ─────────────────────────────── Trilha de fases ───────────────────────────────
function PhaseTrail({ total, current }: { total: number; current: number }) {
  return (
    <ol
      className="flex flex-wrap items-center gap-1.5"
      aria-label={`Fase ${Math.min(current + 1, total)} de ${total}`}
    >
      {Array.from({ length: total }, (_, i) => {
        const state = i < current ? "done" : i === current ? "now" : "next";
        return (
          <li
            key={i}
            aria-hidden="true"
            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-black transition ${
              state === "done"
                ? "bg-amber-300 text-amber-950"
                : state === "now"
                  ? "bg-primary text-primary-foreground ring-4 ring-primary/25 motion-safe:animate-pulse"
                  : "bg-muted text-muted-foreground"
            }`}
          >
            {state === "done" ? "★" : i + 1}
          </li>
        );
      })}
    </ol>
  );
}

// ─────────────────────────────── Fases (perguntas) ───────────────────────────────
function QuestStage({
  questions,
  world,
  hero,
  onComplete,
  onStar,
}: {
  questions: MCQ[];
  world: WorldMeta;
  hero: Hero;
  onComplete: (score: number, max: number, answers: AnswerRecord[]) => void;
  onStar: () => void;
}) {
  const reduce = useReducedMotion();
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [phase, setPhase] = useState<"question" | "registered">("question");
  const nextRef = useRef<HTMLButtonElement>(null);
  // Um toque duplo em "Próxima fase" (comum em criança) chegava ao painel que
  // ainda estava saindo da tela e avançava duas fases de uma vez, podendo
  // estourar o índice e deixar o mundo em branco. Trava por fase.
  const advancing = useRef(false);
  useEffect(() => {
    advancing.current = false;
  }, [idx]);

  const q = questions[idx];
  // Embaralha a ordem das alternativas por fase para que a resposta correta
  // NÃO fique sempre na primeira posição. A ordem é estável durante a fase e é
  // sorteada de novo a cada nova fase / a cada nova partida (o mundo remonta
  // ao "Jogar de novo"). O registro compara o texto escolhido com q.answer.
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

  useEffect(() => {
    if (phase === "registered") nextRef.current?.focus();
  }, [phase]);

  if (!q) return null;
  const isLast = idx + 1 >= questions.length;

  function pick(opt: string) {
    if (phase !== "question") return;
    softTap();
    setSelected(opt);
    setPhase("registered");
    const ok = opt === q.answer;
    if (ok) setScore((s) => s + 1);
    setAnswers((a) => [
      ...a,
      { prompt: q.prompt, correct: q.answer, selected: opt, isCorrect: ok },
    ]);
    onStar();
  }

  function advance() {
    if (advancing.current || phase !== "registered") return;
    advancing.current = true;
    if (isLast) {
      softSuccess();
      onComplete(score, questions.length, answers);
      return;
    }
    softWhoosh();
    setIdx(Math.min(idx + 1, questions.length - 1));
    setSelected(null);
    setPhase("question");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <PhaseTrail total={questions.length} current={idx} />
        <Badge variant="outline" className="text-[11px]">
          Fase {idx + 1} de {questions.length}
        </Badge>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={idx}
          initial={reduce ? false : { opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduce ? undefined : { opacity: 0, x: -40 }}
          transition={{ duration: 0.25 }}
          className="space-y-4"
        >
          <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-background/80 p-5 shadow-sm sm:p-6">
            <span
              className="pointer-events-none absolute -right-3 -top-3 text-6xl opacity-15"
              aria-hidden="true"
            >
              {world.emoji}
            </span>
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              {hero.emoji} {hero.name} pergunta
            </p>
            <p
              className={`relative mt-1 whitespace-pre-line leading-relaxed text-foreground ${q.big ? "text-center text-2xl font-black sm:text-3xl" : "text-base font-semibold sm:text-lg"}`}
            >
              {q.prompt}
            </p>
          </div>

          <div
            className={`grid gap-3 ${q.big ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-2"}`}
            role="group"
            aria-label="Alternativas"
          >
            {displayOptions.map((opt, i) => {
              const chosen = phase === "registered" && opt === selected;
              const dimmed = phase === "registered" && !chosen;
              return (
                <motion.button
                  key={opt}
                  type="button"
                  onClick={() => pick(opt)}
                  disabled={phase === "registered"}
                  whileHover={reduce || phase !== "question" ? undefined : { scale: 1.02 }}
                  whileTap={reduce || phase !== "question" ? undefined : { scale: 0.96 }}
                  aria-pressed={chosen}
                  className={`relative rounded-3xl border-2 p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default ${OPTION_TINTS[i % OPTION_TINTS.length]} ${chosen ? "border-primary ring-4 ring-primary/20" : ""} ${dimmed ? "opacity-40" : ""} ${q.big ? "flex min-h-[96px] items-center justify-center text-5xl sm:min-h-[120px] sm:text-6xl" : "min-h-[64px] text-base font-semibold"}`}
                >
                  <span>{opt}</span>
                  {chosen && (
                    <span
                      className="absolute right-2 top-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-black text-primary-foreground"
                      aria-hidden="true"
                    >
                      ✓
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Sem animação de saída: um painel que "ainda está saindo" continuava
          recebendo o toque seguinte e sumia no meio do gesto. Entrada só por CSS. */}
      {phase === "registered" && (
          <div
            key={`registered-${idx}`}
            className="flex flex-wrap items-center gap-3 rounded-2xl border border-amber-300 bg-amber-50/80 p-3 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 dark:border-amber-700 dark:bg-amber-950/30"
            role="status"
          >
            <span
              className="text-3xl motion-safe:animate-in motion-safe:zoom-in-50"
              aria-hidden="true"
            >
              ⭐
            </span>
            <span className="text-sm font-bold text-amber-950 dark:text-amber-100">
              {NEUTRAL_CHEERS[idx % NEUTRAL_CHEERS.length]}
            </span>
            <Button
              ref={nextRef}
              size="lg"
              className="ml-auto gap-1.5 rounded-2xl font-black"
              onClick={advance}
            >
              {isLast ? (
                <>
                  Concluir mundo <Flag className="h-4 w-4" />
                </>
              ) : (
                <>
                  Próxima fase <ChevronRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        )}
    </div>
  );
}

// ─────────────────────────────── Missão de observação ───────────────────────────────
// Escrita nas bandas A e B (2–5 anos) não tem alternativa para a criança tocar:
// é uma lista do que o adulto observa. No jogo vira "missão do guia".
function ObsQuest({
  block,
  world,
  onComplete,
  onStar,
}: {
  block: ObsBlock;
  world: WorldMeta;
  onComplete: (score: number, max: number, answers: AnswerRecord[]) => void;
  onStar: () => void;
}) {
  const [marks, setMarks] = useState<boolean[]>(Array(block.items.length).fill(false));

  function toggle(i: number) {
    softTap();
    setMarks((prev) => {
      const n = [...prev];
      n[i] = !n[i];
      return n;
    });
  }

  function finish() {
    const score = marks.filter(Boolean).length;
    const records: AnswerRecord[] = block.items.map((it, i) => ({
      prompt: it.label,
      selected: marks[i] ? "Observado" : "Não observado",
      isCorrect: Boolean(marks[i]),
    }));
    softSuccess();
    // Uma estrela pela missão inteira: as estrelas medem participação, não
    // quantos itens foram marcados.
    onStar();
    onComplete(score, block.items.length, records);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-border/70 bg-background/80 p-5 shadow-sm">
        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          Missão do guia <span aria-hidden="true">🧭</span>
        </p>
        <p className="mt-1 text-sm leading-relaxed text-foreground">{block.intro}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          O adulto marca o que a criança mostrou durante a brincadeira no{" "}
          {world.name}.
        </p>
      </div>
      <ul className="space-y-2">
        {block.items.map((item, i) => (
          <li key={i}>
            <button
              type="button"
              onClick={() => toggle(i)}
              aria-pressed={marks[i]}
              className={`flex w-full items-center gap-3 rounded-2xl border-2 p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${marks[i] ? "border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/30" : "border-border bg-background hover:border-primary/40"}`}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-lg ${marks[i] ? "bg-amber-300" : "bg-muted"}`}
                aria-hidden="true"
              >
                {marks[i] ? "✨" : "·"}
              </span>
              <span className="text-sm font-medium text-foreground">{item.label}</span>
            </button>
          </li>
        ))}
      </ul>
      <Button size="lg" className="w-full gap-1.5 rounded-2xl font-black" onClick={finish}>
        Concluir missão <Flag className="h-4 w-4" />
      </Button>
    </div>
  );
}

// ─────────────────────────────── Um mundo ───────────────────────────────
const DOMAIN_LABELS: Record<Domain, string> = {
  visual: "Reconhecimento Visual",
  leitura: "Leitura",
  escrita: "Escrita / Ortografia",
  aritmetica: "Aritmética",
};

function WorldScreen({
  domain,
  age,
  band,
  hero,
  result,
  onComplete,
  onStar,
  onBackToMap,
  easy = false,
  onNext,
  nextLabel = "Próximo mundo",
}: {
  domain: Domain;
  age: number;
  band: Band;
  hero: Hero;
  result?: DomainResult;
  onComplete: (r: DomainResult) => void;
  onStar: () => void;
  onBackToMap: () => void;
  /** Modo Fácil: começa a jogar sem tela de introdução e avança com um só botão. */
  easy?: boolean;
  onNext?: () => void;
  nextLabel?: string;
}) {
  const reduce = useReducedMotion();
  const world = WORLDS[domain];
  const [playing, setPlaying] = useState(easy && !result);
  const [round, setRound] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const bank = getQuestionsForAge(domain, age, band);
  const isObs = domain === "escrita" && (band === "A" || band === "B");

  const handleComplete = useCallback(
    (score: number, max: number, answers: AnswerRecord[]) => {
      onComplete({ domain, label: DOMAIN_LABELS[domain], score, max, answers });
      setPlaying(false);
    },
    [domain, onComplete],
  );

  function playAgain() {
    onComplete({ domain, label: DOMAIN_LABELS[domain], score: 0, max: 0, answers: [] });
    setRound((r) => r + 1);
    setLeaving(false);
    setPlaying(true);
  }

  return (
    <motion.section
      initial={reduce ? false : { opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`rounded-3xl border border-border/60 bg-gradient-to-br p-4 shadow-sm sm:p-6 ${world.surface}`}
      aria-labelledby={`world-${domain}-title`}
    >
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-4xl" aria-hidden="true">
          {world.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            {DOMAIN_LABELS[domain]}
          </p>
          <h2 id={`world-${domain}-title`} className={`text-xl font-black leading-tight sm:text-2xl ${world.accent}`}>
            {world.name}
          </h2>
        </div>
        {easy ? null : playing ? (
          leaving ? (
            <div className="flex items-center gap-2 rounded-xl border border-border bg-background/90 p-1.5" role="alertdialog" aria-label="Sair do mundo apaga as respostas desta partida">
              <span className="px-1 text-xs text-muted-foreground">Sair apaga esta partida.</span>
              <Button size="sm" variant="destructive" onClick={onBackToMap}>
                Sair
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setLeaving(false)}>
                Ficar
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="ghost" className="gap-1" onClick={() => setLeaving(true)}>
              <ArrowLeft className="h-4 w-4" /> Mapa
            </Button>
          )
        ) : (
          <Button size="sm" variant="ghost" className="gap-1" onClick={onBackToMap}>
            <ArrowLeft className="h-4 w-4" /> Mapa
          </Button>
        )}
      </div>

      <div className="mt-4">
        {result && !playing ? (
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-amber-300 bg-background/85 p-5 text-center dark:border-amber-700"
            role="status"
          >
            <motion.div
              className="text-6xl"
              aria-hidden="true"
              initial={reduce ? false : { scale: 0.4, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 14 }}
            >
              🏅
            </motion.div>
            <p className="mt-2 text-lg font-black">Medalha conquistada: {world.badge}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {hero.emoji} {hero.name} explorou o {world.name} inteiro. Todas as
              respostas ficaram registradas para o profissional.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {easy && onNext ? (
                <Button size="lg" data-testid="cognitive-easy-next" className="min-h-16 w-full gap-1.5 rounded-2xl text-xl font-black" onClick={onNext}>
                  {nextLabel} <ChevronRight className="h-5 w-5" />
                </Button>
              ) : (
                <>
                  <Button className="gap-1.5 rounded-2xl font-black" onClick={onBackToMap}>
                    <MapIcon className="h-4 w-4" /> Voltar ao mapa
                  </Button>
                  <Button variant="outline" className="gap-1.5 rounded-2xl" onClick={playAgain}>
                    <RotateCcw className="h-4 w-4" /> Jogar de novo
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        ) : !playing ? (
          <div className="rounded-3xl border border-border/70 bg-background/85 p-5 text-center">
            <p className="text-base font-semibold">{world.tagline}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {isObs
                ? `${(ESCRITA_BANK[band][0] as ObsBlock).items.length} missões para o guia observar.`
                : `${bank.length} fases. Toque na resposta e siga para a próxima.`}
            </p>
            <Button
              size="lg"
              className="mt-4 gap-1.5 rounded-2xl font-black"
              onClick={() => {
                softWhoosh();
                setPlaying(true);
              }}
            >
              <Play className="h-4 w-4" /> Começar
            </Button>
          </div>
        ) : isObs ? (
          <ObsQuest
            key={round}
            block={ESCRITA_BANK[band][0] as ObsBlock}
            world={world}
            onComplete={handleComplete}
            onStar={onStar}
          />
        ) : (
          <QuestStage
            key={round}
            questions={bank as MCQ[]}
            world={world}
            hero={hero}
            onComplete={handleComplete}
            onStar={onStar}
          />
        )}
      </div>
    </motion.section>
  );
}

// ─────────────────────────────── Resultado do Modo Fácil ───────────────────────────────
/**
 * Contagem descritiva por mundo: quantas fases a criança respondeu e quantas
 * respostas coincidiram com a esperada. Não é escore, percentil, idade
 * equivalente nem diagnóstico; a leitura é do médico.
 */
export function buildEasyCognitiveReport(input: {
  ageLabel: string;
  results: Partial<Record<Domain, DomainResult>>;
  date?: string;
}): string {
  const worlds = WORLD_ORDER.map((d) => input.results[d]).filter((r): r is DomainResult => Boolean(r && r.max > 0));
  const answered = worlds.reduce((n, r) => n + r.answers.length, 0);
  const matched = worlds.reduce((n, r) => n + r.answers.filter((a) => a.isCorrect).length, 0);
  return [
    "Testes Cognitivos por Faixa Etária · Modo Fácil (joguinho)",
    `Idade: ${input.ageLabel} · Data: ${input.date ?? new Date().toISOString().slice(0, 10)}`,
    "REGISTRO DESCRITIVO — NÃO É ESCORE, PERCENTIL, IDADE EQUIVALENTE NEM DIAGNÓSTICO",
    "Contagem do que a criança respondeu e do que coincidiu com a resposta esperada nesta interação. Leitura e conclusão pertencem ao médico.",
    `Mundos concluídos: ${worlds.length} de ${WORLD_ORDER.length} · Fases respondidas: ${answered} · Respostas coincidentes: ${matched}`,
    "",
    ...worlds.flatMap((r) => [
      `${r.label}: ${r.answers.filter((a) => a.isCorrect).length} de ${r.answers.length} coincidentes`,
      ...r.answers.map((a, i) => `  ${i + 1}. ${a.prompt} — ${a.selected ?? "Não respondida"}${a.correct ? ` (esperada: ${a.correct})` : ""}`),
    ]),
    "",
    "Triagem educativa autoral; não substitui avaliação psicométrica formal.",
  ].join("\n");
}

function EasyCognitiveResults({
  hero,
  stars,
  age,
  band,
  results,
  onRestart,
}: {
  hero: Hero;
  stars: number;
  age: number;
  band: Band;
  results: Partial<Record<Domain, DomainResult>>;
  onRestart: () => void;
}) {
  const [status, setStatus] = useState("");
  const worlds = WORLD_ORDER.map((d) => results[d]).filter((r): r is DomainResult => Boolean(r && r.max > 0));
  const report = buildEasyCognitiveReport({ ageLabel: ageProfileLabel(age, band), results });
  async function copy() {
    try {
      await navigator.clipboard.writeText(report);
      setStatus("Resultado copiado.");
    } catch {
      setStatus("Não foi possível copiar. Selecione o texto abaixo.");
    }
  }
  return (
    <section data-testid="cognitive-easy-results" className="rounded-3xl border border-amber-300 bg-gradient-to-br from-amber-50 via-background to-background p-5 shadow-sm dark:border-amber-700 dark:from-amber-950/30 sm:p-7" aria-labelledby="cognitive-easy-results-title">
      <div className="text-center">
        <div className="text-6xl" aria-hidden="true">🏆</div>
        <h2 id="cognitive-easy-results-title" className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Aventura completa!</h2>
        <p className="mt-1 text-sm text-muted-foreground">{hero.emoji} {hero.name} ganhou {stars} estrelas por participar. Estrelas não são nota.</p>
      </div>
      <ul className="mt-5 grid gap-3 sm:grid-cols-2" aria-label="Resultado por mundo">
        {worlds.map((r) => (
          <li key={r.domain} className="rounded-2xl border bg-background/85 p-4">
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{WORLDS[r.domain].emoji} {r.label}</p>
            <p className="mt-1 text-2xl font-black tabular-nums" data-testid={`cognitive-easy-${r.domain}`}>{r.answers.filter((a) => a.isCorrect).length} <span className="text-base font-semibold text-muted-foreground">de {r.answers.length} coincidentes</span></p>
          </li>
        ))}
      </ul>
      <p className="mt-4 rounded-xl bg-muted p-3 text-xs leading-relaxed text-muted-foreground">
        Contagem descritiva do que coincidiu com a resposta esperada nesta interação. Não é escore, percentil, idade equivalente nem diagnóstico. Quem lê e conclui é o médico.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="lg" className="rounded-2xl font-black" onClick={() => void copy()}>Copiar resultado</Button>
        <Button size="lg" variant="outline" className="rounded-2xl" onClick={onRestart}><RotateCcw className="mr-2 h-4 w-4" /> Jogar de novo</Button>
      </div>
      {status && <p role="status" className="mt-2 text-sm">{status}</p>}
      <textarea aria-label="Resultado do Modo Fácil" readOnly value={report} className="mt-4 min-h-56 w-full rounded-xl border bg-background p-3 font-mono text-xs leading-relaxed" />
    </section>
  );
}

// ─────────────────────────────── MAIN PAGE ───────────────────────────────
export default function TestesCognitivosFaixaEtariaPage() {
  const [ageStr, setAgeStr] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [hero, setHero] = useState<Hero | null>(null);
  const [screen, setScreen] = useState<"hero" | "map" | "world" | "results">("hero");
  const [track, setTrack] = useState<"easy" | "guided" | "direct">("guided");
  const direct = track === "direct";
  const easy = track === "easy";
  const [activeWorld, setActiveWorld] = useState<Domain>("visual");
  const [results, setResults] = useState<Partial<Record<Domain, DomainResult>>>({});
  const [stars, setStars] = useState(0);
  const [proOpen, setProOpen] = useState(false);
  const celebratedRef = useRef(false);

  const age = parseInt(ageStr, 10);
  const validAge = !isNaN(age) && age >= 2 && age <= 19;
  const band: Band | null = validAge ? getBand(age) : null;

  const handleResult = useCallback((r: DomainResult) => {
    setResults((prev) => {
      const n = { ...prev };
      if (r.max === 0) delete n[r.domain];
      else n[r.domain] = r;
      return n;
    });
  }, []);
  const addStar = useCallback(() => setStars((s) => s + 1), []);

  const completedDomains = WORLD_ORDER.map((d) => results[d]).filter(
    (r): r is DomainResult => Boolean(r && r.max > 0),
  );
  const badges = completedDomains.map((r) => r.domain);
  const allDone = completedDomains.length === WORLD_ORDER.length;

  useEffect(() => {
    if (allDone && !celebratedRef.current) {
      celebratedRef.current = true;
      celebrate();
    }
    if (!allDone) celebratedRef.current = false;
  }, [allDone]);

  const reportItems = completedDomains.flatMap((result) =>
    result.answers.map((answer) => ({
      question: `[${result.label}] ${answer.prompt}`,
      answer: answer.selected ?? "Não respondida",
    })),
  );

  function resetAdventure() {
    setConfirmed(false);
    setResults({});
    setStars(0);
    setScreen("hero");
  }

  return (
    <div className="space-y-5 pb-8">
      {/* Header do profissional */}
      <header className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-violet-500/[0.08] via-card/70 to-blue-500/[0.07] p-5 shadow-sm backdrop-blur sm:p-6">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-gradient-to-br from-violet-400/25 to-fuchsia-400/10 blur-3xl"
        />
        <div className="relative flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-blue-600 text-white shadow-lg shadow-violet-600/25 ring-1 ring-white/20">
            <Brain className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <Badge className="mb-2 rounded-full bg-violet-100 text-violet-700 hover:bg-violet-100 dark:bg-violet-950 dark:text-violet-300">
              testes cognitivos por faixa etária · 2–19 anos
            </Badge>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Testes Cognitivos por Faixa Etária
            </h1>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Aventura em quatro mundos — reconhecimento visual, leitura, escrita e
              aritmética — com 4 fases por mundo, adaptadas à idade. A criança ganha
              estrelas por participar e medalhas por concluir; nada na tela mostra
              acerto ou erro. O profissional recebe o registro pergunta a pergunta.
              Triagem educativa — não substitui avaliação psicométrica formal.
            </p>
          </div>
        </div>

        <div className="relative mt-4 flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="idade-av" className="mb-1 block text-xs font-semibold text-muted-foreground">
              Idade da criança (anos)
            </label>
            <Input
              id="idade-av"
              inputMode="numeric"
              value={ageStr}
              onChange={(e) => {
                setAgeStr(e.target.value.replace(/\D/g, "").slice(0, 2));
                resetAdventure();
              }}
              placeholder="ex.: 7"
              className="h-9 w-24"
            />
          </div>
          <div
            role="tablist"
            aria-label="Modo de aplicação"
            data-testid="cognitive-track-tabs"
            className="flex gap-1.5 rounded-2xl border border-border/60 bg-background/70 p-1"
          >
            <button
              type="button"
              role="tab"
              aria-selected={easy}
              disabled={confirmed}
              data-testid="cognitive-easy-tab"
              onClick={() => setTrack("easy")}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${easy ? "bg-emerald-600 text-white shadow-sm" : "text-emerald-800 hover:bg-emerald-50 dark:text-emerald-200"}`}
            >
              🎮 Modo Fácil
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={track === "guided"}
              disabled={confirmed}
              onClick={() => setTrack("guided")}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${track === "guided" ? "bg-violet-600 text-white shadow-sm" : "text-muted-foreground hover:bg-muted"}`}
            >
              Guiado · escolher herói
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={direct}
              disabled={confirmed}
              data-testid="cognitive-direct-tab"
              onClick={() => setTrack("direct")}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${direct ? "bg-violet-600 text-white shadow-sm" : "text-muted-foreground hover:bg-muted"}`}
            >
              Direto ao teste
            </button>
          </div>
          {!confirmed ? (
            <Button
              size="sm"
              disabled={!validAge}
              className="gap-1.5"
              onClick={() => {
                setConfirmed(true);
                if (easy) {
                  setHero((current) => current ?? DEFAULT_HERO);
                  setActiveWorld(WORLD_ORDER[0]);
                  setScreen("world");
                } else if (direct) {
                  setHero((current) => current ?? DEFAULT_HERO);
                  setScreen("map");
                } else {
                  setScreen(hero ? "map" : "hero");
                }
              }}
            >
              <Play className="h-4 w-4" /> Iniciar aventura
            </Button>
          ) : (
            <Button size="sm" variant="outline" className="gap-1.5" onClick={resetAdventure}>
              <RotateCcw className="h-4 w-4" /> Reiniciar aventura
            </Button>
          )}
          {band && confirmed && (
            <Badge className="bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300">
              {ageProfileLabel(age, band)}
            </Badge>
          )}
        </div>
        {direct && (
          <p className="relative mt-2 text-xs leading-relaxed text-muted-foreground">
            Modo direto: pula a escolha de herói. Você entra direto no mapa e escolhe o mundo.
          </p>
        )}
        {easy && (
          <p className="relative mt-2 text-xs leading-relaxed text-muted-foreground">
            Modo Fácil: os quatro mundos em sequência, sem mapa nem escolha de herói. A criança toca na resposta e passa; no fim aparece o resultado.
          </p>
        )}
      </header>

      {/* Jogo */}
      {confirmed && band && (
        <>
          {hero && screen !== "hero" && (
            <AdventureHud
              hero={hero}
              stars={stars}
              badges={badges}
              onChangeHero={() => setScreen("hero")}
            />
          )}

          {screen === "hero" && (
            <HeroPicker
              current={hero}
              onPick={(picked) => {
                setHero(picked);
                setScreen(easy ? "world" : "map");
              }}
            />
          )}

          {screen === "map" && hero && (
            <WorldMap
              hero={hero}
              age={age}
              band={band}
              results={results}
              onEnter={(domain) => {
                setActiveWorld(domain);
                setScreen("world");
              }}
            />
          )}

          {screen === "world" && hero && (
            <WorldScreen
              key={`${activeWorld}-${age}-${band}`}
              domain={activeWorld}
              age={age}
              band={band}
              hero={hero}
              result={results[activeWorld]}
              onComplete={handleResult}
              onStar={addStar}
              onBackToMap={() => setScreen("map")}
              easy={easy}
              nextLabel={WORLD_ORDER.indexOf(activeWorld) + 1 < WORLD_ORDER.length ? "Próximo mundo" : "Ver resultado"}
              onNext={() => {
                const next = WORLD_ORDER[WORLD_ORDER.indexOf(activeWorld) + 1];
                if (next) setActiveWorld(next);
                else setScreen("results");
              }}
            />
          )}

          {screen === "results" && hero && (
            <EasyCognitiveResults
              hero={hero}
              stars={stars}
              age={age}
              band={band}
              results={results}
              onRestart={resetAdventure}
            />
          )}

          {/* Área do profissional */}
          <section className="rounded-3xl border border-border/60 bg-card/70" aria-labelledby="pro-area-title">
            <button
              type="button"
              className="flex w-full items-center gap-3 p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-5"
              aria-expanded={proOpen}
              aria-controls="pro-area"
              onClick={() => setProOpen((o) => !o)}
            >
              <ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span id="pro-area-title" className="block text-sm font-bold">
                  Área do profissional
                </span>
                <span className="block text-xs text-muted-foreground">
                  {completedDomains.length === 0
                    ? "O registro aparece aqui assim que um mundo for concluído."
                    : `${completedDomains.length} de ${WORLD_ORDER.length} mundos registrados · ${reportItems.length} itens`}
                </span>
              </span>
              <ChevronRight
                className={`h-4 w-4 text-muted-foreground transition-transform ${proOpen ? "rotate-90" : ""}`}
                aria-hidden="true"
              />
            </button>
            {proOpen && (
              <div id="pro-area" className="space-y-4 border-t border-border/60 p-4 sm:p-5">
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Estrelas contam respostas registradas e medalhas contam mundos
                  concluídos: são marcadores de participação, não escores. O registro
                  abaixo traz cada pergunta e a resposta escolhida pela criança
                  (ou o que o guia observou), sem pontuação, percentil ou
                  interpretação diagnóstica.
                </p>
                {completedDomains.length > 0 ? (
                  <>
                    <ClinicalReport
                      scaleName="Testes Cognitivos por Faixa Etária"
                      scaleFullName="Reconhecimento visual, leitura, escrita e aritmética"
                      items={reportItems}
                      patientAge={ageProfileLabel(age, band)}
                    />
                    <SaveToPatient
                      scaleName="Testes Cognitivos por Faixa Etária"
                      responses={reportItems}
                      patientAge={ageProfileLabel(age, band)}
                    />
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhum mundo concluído ainda.</p>
                )}
              </div>
            )}
          </section>
        </>
      )}

      {!confirmed && (
        <div className="space-y-2 rounded-3xl border border-dashed border-border p-8 text-center">
          <div className="text-4xl" aria-hidden="true">
            🗺️
          </div>
          <p className="text-sm text-muted-foreground">
            Digite a idade da criança (2–19 anos) e toque em{" "}
            <strong>Iniciar aventura</strong>. A criança escolhe um herói e explora os
            quatro mundos na ordem que quiser.
          </p>
        </div>
      )}
    </div>
  );
}
