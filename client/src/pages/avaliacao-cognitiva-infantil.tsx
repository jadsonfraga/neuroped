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
    { kind: "mcq", prompt: "Qual figura espelha a letra 'b'?", options: ["d", "p", "q", "ꓸ"], answer: "d" },
    { kind: "mcq", prompt: "Próximo item: J F M A M J J A __", options: ["S", "O", "T", "N"], answer: "S" },
    { kind: "mcq", prompt: "Qual grupo de letras forma uma palavra?", options: ["PATO", "TRPO", "LBCR", "XMQZ"], answer: "PATO" },
    { kind: "mcq", prompt: "Palavra com significado OPOSTO de 'QUENTE':", options: ["FRIO", "MORNO", "CALOR", "QUENTE"], answer: "FRIO" },
    { kind: "mcq", prompt: "Qual figura completa: △□△□△□__", options: ["△", "□", "○", "★"], answer: "△" },
    { kind: "mcq", prompt: "Número de arestas de um CUBO:", options: ["12", "8", "6", "10"], answer: "12" },
  ],
  E: [
    { kind: "mcq", prompt: "Série de Fibonacci: 1 1 2 3 5 8 __", options: ["13", "11", "10", "16"], answer: "13" },
    { kind: "mcq", prompt: "Código: A=1 B=2 C=3. Que número representa CAB?", options: ["312", "123", "321", "213"], answer: "312" },
    { kind: "mcq", prompt: "Todos gatos são animais. Mimi é gato. Logo Mimi é:", options: ["Um animal", "Um cachorro", "Uma planta", "Nada disso"], answer: "Um animal" },
    { kind: "mcq", prompt: "Qual letra tem simetria bilateral?", options: ["A", "F", "G", "P"], answer: "A" },
    { kind: "mcq", prompt: "Relógio: 3h45min. Quanto falta para 5h?", options: ["1h15min", "1h45min", "45min", "2h15min"], answer: "1h15min" },
    { kind: "mcq", prompt: "Padrão: 2 6 12 20 30 __", options: ["42", "40", "44", "36"], answer: "42" },
  ],
  F: [
    { kind: "mcq", prompt: "100 pessoas: 60% inglês, 50% espanhol, 20% ambos. Só espanhol:", options: ["30%", "50%", "40%", "20%"], answer: "30%" },
    { kind: "mcq", prompt: "Se X > Y e Y > Z, então:", options: ["X > Z", "Z > X", "X = Z", "Indeterminado"], answer: "X > Z" },
    { kind: "mcq", prompt: "Espelho vertical em 'bd' resulta em:", options: ["db", "bd", "pq", "qp"], answer: "db" },
    { kind: "mcq", prompt: "Próximo: 1 4 9 16 25 __", options: ["36", "30", "35", "49"], answer: "36" },
    { kind: "mcq", prompt: "Qual par tem MESMA relação que mapa:território?", options: ["foto:paisagem", "palavra:letra", "livro:página", "som:ouvido"], answer: "foto:paisagem" },
    { kind: "mcq", prompt: "Qual NÃO pertence ao grupo? △ ▲ ◯ ▽", options: ["◯", "△", "▲", "▽"], answer: "◯" },
  ],
  G: [
    { kind: "mcq", prompt: "Paradoxo: 'Esta frase é falsa.' O que ela é?", options: ["Indeterminada", "Verdadeira", "Falsa", "Nonsense"], answer: "Indeterminada" },
    { kind: "mcq", prompt: "Padrão: 3 7 15 31 63 __", options: ["127", "125", "126", "128"], answer: "127" },
    { kind: "mcq", prompt: "Sol:energia = raiz:?", options: ["nutriente", "terra", "planta", "água"], answer: "nutriente" },
    { kind: "mcq", prompt: "Qual afirmação é SEMPRE verdadeira?", options: ["Se A→B, então não-A→não-B é falso", "Se A→B, então B→A", "Se A→B e B→A, então A=B", "A→B é igual a B→A"], answer: "Se A→B, então não-A→não-B é falso" },
    { kind: "mcq", prompt: "3 caixas com média 12 e 2 outras com média 8. Média geral:", options: ["10,4", "10", "11", "9,6"], answer: "10,4" },
    { kind: "mcq", prompt: "Qual figura é a 5ª rotação de 90° de 'L' no sentido horário?", options: ["L", "⌐", "J", "Γ"], answer: "L" },
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
    { kind: "mcq", prompt: "Qual é o plural de LEÃO?", options: ["LEÕES", "LEÃOS", "LEÕES", "LEAOS"], answer: "LEÕES" },
    { kind: "mcq", prompt: "Qual frase está CORRETA?", options: ["Eu gosto de estudar.", "Eu gosta de estudar.", "Eu gostei de estudar .", "eu gosto De estudar."], answer: "Eu gosto de estudar." },
  ],
  E: [
    { kind: "mcq", prompt: "📖 'A fotossíntese é o processo pelo qual as plantas convertem luz solar, água e CO₂ em glicose e oxigênio. Sem ela, a vida na Terra seria impossível.'\n\nO que a planta PRODUZ na fotossíntese?", options: ["Glicose e oxigênio", "Água e luz", "CO₂ e glicose", "Açúcar e CO₂"], answer: "Glicose e oxigênio" },
    { kind: "mcq", prompt: "📖 (mesmo texto)\n\nSem fotossíntese, a vida na Terra seria:", options: ["Impossível", "Diferente", "Mais simples", "Melhor"], answer: "Impossível" },
    { kind: "mcq", prompt: "📖 (mesmo texto)\n\nQual recurso NÃO é usado na fotossíntese?", options: ["Vento", "Luz solar", "Água", "CO₂"], answer: "Vento" },
    { kind: "mcq", prompt: "A palavra 'INADVERTIDAMENTE' significa:", options: ["Sem perceber", "Com cuidado", "Rapidamente", "Com intenção"], answer: "Sem perceber" },
    { kind: "mcq", prompt: "Qual é a ideia PRINCIPAL do parágrafo?\n'Dormir bem melhora a memória, o humor e a imunidade. Adultos precisam de 7–9h por noite.'", options: ["Dormir bem traz benefícios à saúde", "Adultos dormem pouco", "A memória depende do humor", "O sono tem estágios"], answer: "Dormir bem traz benefícios à saúde" },
    { kind: "mcq", prompt: "Qual conector indica CAUSA?\n'Chegou atrasado ___ havia trânsito.'", options: ["porque", "portanto", "mas", "entretanto"], answer: "porque" },
  ],
  F: [
    { kind: "mcq", prompt: "📖 'A ironia é uma figura de linguagem em que se diz o oposto do que se quer dizer, geralmente com tom crítico. Ex: 'Que belo dia!' dito num dia chuvoso.'\n\nA ironia afirma o CONTRÁRIO de:", options: ["O que realmente se quer expressar", "O que o texto diz", "O que o leitor pensa", "O que o autor escreve"], answer: "O que realmente se quer expressar" },
    { kind: "mcq", prompt: "📖 (mesmo texto)\n\n'Que inteligente!' dito sarcasticamente é um exemplo de:", options: ["Ironia", "Metáfora", "Hipérbole", "Personificação"], answer: "Ironia" },
    { kind: "mcq", prompt: "Qual é a inferência correta?\n'João chegou com as mãos sujas e um sorriso de satisfação após o jogo.'", options: ["João provavelmente jogou bem", "João perdeu o jogo", "João não gostou do jogo", "João estava com fome"], answer: "João provavelmente jogou bem" },
    { kind: "mcq", prompt: "'Minha vida é um mar de problemas.' O recurso usado é:", options: ["Metáfora", "Comparação", "Ironia", "Personificação"], answer: "Metáfora" },
    { kind: "mcq", prompt: "Qual palavra tem o mesmo PREFIXO de 'infeliz' indicando negação?", options: ["Inútil", "Início", "Incêndio", "Índio"], answer: "Inútil" },
    { kind: "mcq", prompt: "Texto argumentativo: a conclusão deve:", options: ["Retomar a tese e reforçar os argumentos", "Apresentar novos argumentos", "Contradizer o desenvolvimento", "Definir os termos do texto"], answer: "Retomar a tese e reforçar os argumentos" },
  ],
  G: [
    { kind: "mcq", prompt: "📖 'A linguagem é, ao mesmo tempo, produto e produtora da realidade social. Ela não apenas descreve o mundo — ela o constitui, ao nomear, classificar e atribuir significados.'\n\nSegundo o texto, a linguagem:", options: ["Constrói a realidade ao nomeá-la", "Descreve a realidade objetivamente", "É neutra e imparcial", "Reflete apenas os fatos"], answer: "Constrói a realidade ao nomeá-la" },
    { kind: "mcq", prompt: "📖 (mesmo texto)\n\n'Ao nomear, classificar e atribuir significados' são exemplos de:", options: ["Funções constitutivas da linguagem", "Funções descritivas", "Funções ornamentais", "Funções gramaticais"], answer: "Funções constitutivas da linguagem" },
    { kind: "mcq", prompt: "Qual é a relação lógica em: 'Embora estivesse chovendo, saiu sem guarda-chuva'?", options: ["Concessão", "Causa", "Consequência", "Finalidade"], answer: "Concessão" },
    { kind: "mcq", prompt: "'O texto literário pode ser verdadeiro sem ser factual.' Isso significa:", options: ["Expressa verdades humanas além dos fatos", "Todo texto literário é baseado em fatos", "Literatura e realidade são a mesma coisa", "Textos literários mentem"], answer: "Expressa verdades humanas além dos fatos" },
    { kind: "mcq", prompt: "Qual recurso é usado em: 'O coração pediu silêncio'?", options: ["Personificação", "Metáfora", "Ironia", "Hipérbole"], answer: "Personificação" },
    { kind: "mcq", prompt: "Qual premissa INVALIDA o argumento: 'Todos os políticos mentem. Logo, X mente'?", options: ["X não é político", "X é honesto", "Nem todos políticos mentem", "X nunca foi político"], answer: "Nem todos políticos mentem" },
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
    { kind: "mcq", prompt: "Como se escreve o som 'bê-o-lê-a'?", options: ["BOLA", "BÔLA", "BOLA", "VOLA"], answer: "BOLA" },
    { kind: "mcq", prompt: "Qual é a grafia CORRETA?", options: ["GATO", "GATTO", "GATU", "GÁTO"], answer: "GATO" },
    { kind: "mcq", prompt: "Complete: O menino ___ para a escola.", options: ["foi", "fo", "foio", "foy"], answer: "foi" },
    { kind: "mcq", prompt: "Qual palavra está ESCRITA ERRADA?", options: ["PAÇOCA", "CASA", "DATO", "BOLA"], answer: "DATO" },
    { kind: "mcq", prompt: "Qual frase está CORRETA para uma criança escrever?", options: ["Eu gosto de brincar.", "Eu gosta de brincá.", "Eu goste de brinca.", "eu Gosto de Brincar."], answer: "Eu gosto de brincar." },
    { kind: "mcq", prompt: "Qual é o plural correto de FLOR?", options: ["FLORES", "FLORS", "FLORÊS", "FLORE"], answer: "FLORES" },
  ],
  D: [
    { kind: "mcq", prompt: "Qual palavra está ESCRITA CORRETAMENTE?", options: ["exceção", "excessão", "eceção", "ecepção"], answer: "exceção" },
    { kind: "mcq", prompt: "Qual usa ACENTO correto?", options: ["médico", "medico", "médïco", "mêdico"], answer: "médico" },
    { kind: "mcq", prompt: "Frase com PONTUAÇÃO correta:", options: ["Que dia lindo!", "Que dia lindo?", "Que dia lindo,", "Que dia lindo"], answer: "Que dia lindo!" },
    { kind: "mcq", prompt: "Onde vai a VÍRGULA? — 'Comprei pão leite e ovos.'", options: ["pão, leite e ovos", "pão leite, e ovos", "pão, leite, e ovos,", "pão, leite e, ovos"], answer: "pão, leite e ovos" },
    { kind: "mcq", prompt: "Qual palavra é SINÔNIMO de 'bonito'?", options: ["Belo", "Feio", "Triste", "Grande"], answer: "Belo" },
    { kind: "mcq", prompt: "Que palavra completa corretamente? 'Preciso ___ água.'", options: ["de", "di", "da", "do"], answer: "de" },
  ],
  E: [
    { kind: "mcq", prompt: "Qual frase NÃO tem erro?", options: ["Fizemos a tarefa nós mesmos.", "Fizemos a tarefa nós mesmo.", "Fizemos a tarefa a gente.", "Fizemos as tarefas nós mesmo."], answer: "Fizemos a tarefa nós mesmos." },
    { kind: "mcq", prompt: "Qual é o uso CORRETO do porquê?", options: ["Não sei por que ele sumiu.", "Não sei porque ele sumiu.", "Não sei porquê ele sumiu.", "Não sei por quê ele sumiu."], answer: "Não sei por que ele sumiu." },
    { kind: "mcq", prompt: "Qual frase tem ERRO de concordância?", options: ["Os meninos saíram cedo.", "Os meninos saiu cedo.", "As meninas saíram cedo.", "O menino saiu cedo."], answer: "Os meninos saiu cedo." },
    { kind: "mcq", prompt: "Qual SUBSTITUIÇÃO é correta? 'Eu ___ com meus pais.'", options: ["moro", "mora", "moram", "moramos"], answer: "moro" },
    { kind: "mcq", prompt: "Qual parágrafo tem melhor COESÃO?", options: ["Chovia forte. Por isso, ficamos em casa.", "Chovia forte. Ficamos. Em casa.", "Chovia. Forte. Ficamos em casa.", "Em casa ficamos. Forte chovia."], answer: "Chovia forte. Por isso, ficamos em casa." },
    { kind: "mcq", prompt: "Qual é o passado de 'VIR'?", options: ["vim", "venho", "vinha", "virei"], answer: "vim" },
  ],
  F: [
    { kind: "mcq", prompt: "Qual uso de HÍFEN está correto?", options: ["ex-presidente", "exprezidente", "ex presidente", "ex'presidente"], answer: "ex-presidente" },
    { kind: "mcq", prompt: "Qual frase está na VOZ PASSIVA?", options: ["O texto foi escrito pelo aluno.", "O aluno escreveu o texto.", "O aluno está escrevendo o texto.", "O aluno escreverá o texto."], answer: "O texto foi escrito pelo aluno." },
    { kind: "mcq", prompt: "Qual uso de MAL/MAU está correto?", options: ["Ele está mal-humorado.", "Ele está mau-humorado.", "Ele está mal humorado.", "Ele está mau humorado."], answer: "Ele está mal-humorado." },
    { kind: "mcq", prompt: "O texto argumentativo deve ter:", options: ["Tese, argumentos e conclusão", "Introdução, nó e desfecho", "Narrador, personagens e tempo", "Tema, rima e ritmo"], answer: "Tese, argumentos e conclusão" },
    { kind: "mcq", prompt: "Qual conector indica CONCLUSÃO?", options: ["Portanto", "Embora", "Porque", "Enquanto"], answer: "Portanto" },
    { kind: "mcq", prompt: "Qual frase tem CRASE obrigatória?", options: ["Fui à escola.", "Fui a escola.", "Fui à João.", "Fui a ela."], answer: "Fui à escola." },
  ],
  G: [
    { kind: "mcq", prompt: "Qual período é COMPOSTO por subordinação?", options: ["Ela disse que viria.", "Ela foi ao mercado.", "Ela foi e comprou pão.", "Ela foi, mas voltou logo."], answer: "Ela disse que viria." },
    { kind: "mcq", prompt: "Análise sintática: 'O aluno leu o livro.' O sujeito é:", options: ["O aluno", "leu", "o livro", "O aluno leu"], answer: "O aluno" },
    { kind: "mcq", prompt: "Qual uso de ONDE está correto?", options: ["A cidade onde nasci é bonita.", "A cidade aonde nasci é bonita.", "A cidade que nasci é bonita.", "A cidade em que nasci é bonita."], answer: "A cidade onde nasci é bonita." },
    { kind: "mcq", prompt: "Redação dissertativa: o que NÃO deve constar na introdução?", options: ["A conclusão do argumento", "O tema problematizado", "A tese do autor", "A contextualização"], answer: "A conclusão do argumento" },
    { kind: "mcq", prompt: "Qual é a regência CORRETA do verbo ASSISTIR (ver)?", options: ["Assisti ao filme.", "Assisti o filme.", "Assisti com o filme.", "Assisti para o filme."], answer: "Assisti ao filme." },
    { kind: "mcq", prompt: "Qual frase expressa HIPÓTESE?", options: ["Se estudarmos, passaremos.", "Estudamos e passamos.", "Estudamos para passar.", "Passamos porque estudamos."], answer: "Se estudarmos, passaremos." },
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
    { kind: "mcq", prompt: "7 × 8 = ?", options: ["56", "54", "63", "48"], answer: "56" },
    { kind: "mcq", prompt: "72 ÷ 9 = ?", options: ["8", "7", "9", "6"], answer: "8" },
    { kind: "mcq", prompt: "Qual é 25% de 80?", options: ["20", "25", "40", "15"], answer: "20" },
    { kind: "mcq", prompt: "Uma caixa tem 36 laranjas. São 4 fileiras iguais. Quantas por fileira?", options: ["9", "8", "12", "6"], answer: "9" },
    { kind: "mcq", prompt: "0,5 + 0,75 = ?", options: ["1,25", "1,5", "1,0", "0,25"], answer: "1,25" },
    { kind: "mcq", prompt: "Qual fração é MAIOR: 3/4 ou 2/3?", options: ["3/4", "2/3", "São iguais", "Impossível comparar"], answer: "3/4" },
  ],
  E: [
    { kind: "mcq", prompt: "3x + 6 = 21. Qual é o valor de x?", options: ["5", "6", "7", "4"], answer: "5" },
    { kind: "mcq", prompt: "Área de retângulo 8 × 6 cm²:", options: ["48 cm²", "28 cm²", "36 cm²", "56 cm²"], answer: "48 cm²" },
    { kind: "mcq", prompt: "30% de 150 =", options: ["45", "30", "50", "60"], answer: "45" },
    { kind: "mcq", prompt: "Sequência: 2, 4, 8, 16, ___", options: ["32", "24", "20", "18"], answer: "32" },
    { kind: "mcq", prompt: "Média de 5, 7, 9, 10, 4 =", options: ["7", "8", "6", "9"], answer: "7" },
    { kind: "mcq", prompt: "Razão de 15:25 simplificada:", options: ["3:5", "5:3", "1:2", "2:3"], answer: "3:5" },
  ],
  F: [
    { kind: "mcq", prompt: "x² − 5x + 6 = 0. Raízes:", options: ["x=2 e x=3", "x=1 e x=6", "x=−2 e x=−3", "x=2 e x=−3"], answer: "x=2 e x=3" },
    { kind: "mcq", prompt: "seno de 30° =", options: ["0,5", "0,866", "1", "0"], answer: "0,5" },
    { kind: "mcq", prompt: "Progressão aritmética: 3, 7, 11, 15, ___ (razão = 4)", options: ["19", "18", "20", "17"], answer: "19" },
    { kind: "mcq", prompt: "Volume de cubo de lado 3 cm:", options: ["27 cm³", "9 cm³", "18 cm³", "12 cm³"], answer: "27 cm³" },
    { kind: "mcq", prompt: "log₁₀(1000) =", options: ["3", "2", "4", "10"], answer: "3" },
    { kind: "mcq", prompt: "f(x) = 2x + 3. f(4) =", options: ["11", "10", "12", "9"], answer: "11" },
  ],
  G: [
    { kind: "mcq", prompt: "Derivada de f(x) = x³ + 2x:", options: ["3x² + 2", "3x² + 2x", "x² + 2", "3x² − 2"], answer: "3x² + 2" },
    { kind: "mcq", prompt: "P(A∪B) = P(A) + P(B) − P(A∩B). P(A)=0,4; P(B)=0,5; P(A∩B)=0,2 → P(A∪B)=", options: ["0,7", "0,9", "0,6", "0,8"], answer: "0,7" },
    { kind: "mcq", prompt: "∫2x dx =", options: ["x² + C", "2x² + C", "x + C", "2 + C"], answer: "x² + C" },
    { kind: "mcq", prompt: "Matriz 2×2: det([1 2; 3 4]) =", options: ["−2", "2", "10", "−10"], answer: "−2" },
    { kind: "mcq", prompt: "Limite: lim(x→2) (x²−4)/(x−2) =", options: ["4", "0", "2", "Indefinido"], answer: "4" },
    { kind: "mcq", prompt: "PA geométrica com a₁=2 e razão=3: 5° termo =", options: ["162", "81", "54", "243"], answer: "162" },
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
