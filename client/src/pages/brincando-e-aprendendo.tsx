import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Home,
  RotateCcw,
  Star,
  Trophy,
} from "lucide-react";
import { Link } from "wouter";
import "@/styles/brincando.css";
import logoHero from "@assets/images/dr-fraga-kids/logo-heroi.png";
import mascot from "@assets/images/dr-fraga-kids/mascote.png";
import intellectualArt from "@assets/images/dr-fraga-kids/categoria-intelectual.webp";
import attentionArt from "@assets/images/dr-fraga-kids/categoria-atencional.webp";
import pedagogicalArt from "@assets/images/dr-fraga-kids/categoria-pedagogico.webp";
import generalArt from "@assets/images/dr-fraga-kids/categoria-gerais.webp";
import errorsArt from "@assets/images/dr-fraga-kids/categoria-erros.webp";

type PhaseId = "3-5" | "6-8" | "9-12";
type ArenaId = "intelectual" | "atencional" | "pedagogico" | "gerais" | "erros";
type ActivityView = "home" | "activity" | "complete";

type Question = {
  question: string;
  visual: string[];
  options: string[];
  answer: number;
  explain: string;
};

type Phase = {
  id: PhaseId;
  label: string;
  emoji: string;
  title: string;
  subtitle: string;
  tone: string;
};

type Arena = {
  id: ArenaId;
  title: string;
  tagline: string;
  description: string;
  color: string;
  softColor: string;
  icon: string;
  art: string;
  mascotLine: string;
  actions: { id: string; label: string; difficulty?: string }[];
};

const phases: Phase[] = [
  {
    id: "3-5",
    label: "3 a 5 anos",
    emoji: "🌱",
    title: "Descobrindo o mundo!",
    subtitle: "Letras, números, formas e cores.",
    tone: "var(--kids-soft-blue)",
  },
  {
    id: "6-8",
    label: "6 a 8 anos",
    emoji: "🚀",
    title: "Exploradores em ação!",
    subtitle: "Leitura, contas e mistérios.",
    tone: "var(--kids-soft-blue)",
  },
  {
    id: "9-12",
    label: "9 a 12 anos",
    emoji: "⚡",
    title: "Super-heróis da mente!",
    subtitle: "Desafios de lógica de verdade.",
    tone: "var(--kids-peach)",
  },
];

const arenas: Arena[] = [
  {
    id: "intelectual",
    title: "Cérebro de Herói",
    tagline: "Raciocínio lógico e padrões",
    description: "Treine seu cérebro como um superpoder!",
    color: "var(--kids-sun)",
    softColor: "var(--kids-cream)",
    icon: "🦸",
    art: intellectualArt,
    mascotLine: "Vamos treinar seu cérebro!",
    actions: [{ id: "treinar", label: "Treinar" }],
  },
  {
    id: "atencional",
    title: "Olhos de Águia",
    tagline: "Atenção, memória e detalhes",
    description: "Observe tudo com olhos de super-herói!",
    color: "var(--kids-blue)",
    softColor: "var(--kids-soft-blue)",
    icon: "🦅",
    art: attentionArt,
    mascotLine: "Abra bem os olhos!",
    actions: [
      { id: "memoria", label: "Jogo da memória" },
      { id: "detetive", label: "Encontre o diferente" },
    ],
  },
  {
    id: "pedagogico",
    title: "Escolinha Divertida",
    tagline: "Letras, números e formas",
    description: "Letras e números são seus amigos!",
    color: "var(--kids-green)",
    softColor: "var(--kids-soft-green)",
    icon: "📚",
    art: pedagogicalArt,
    mascotLine: "Hora de aprender brincando!",
    actions: [{ id: "aprender", label: "Aprender" }],
  },
  {
    id: "gerais",
    title: "Mundo Incrível",
    tagline: "Animais, natureza e corpo humano",
    description: "O mundo é cheio de mistérios!",
    color: "var(--kids-orange)",
    softColor: "var(--kids-soft-orange)",
    icon: "🌍",
    art: generalArt,
    mascotLine: "Vamos explorar juntos!",
    actions: [{ id: "explorar", label: "Explorar" }],
  },
  {
    id: "erros",
    title: "Caça aos 7 Erros",
    tagline: "Encontre as 7 diferenças",
    description: "Sua atenção é o seu superpoder!",
    color: "var(--kids-purple)",
    softColor: "var(--kids-soft-purple)",
    icon: "🕵️",
    art: errorsArt,
    mascotLine: "Você consegue encontrar todos?",
    actions: [
      { id: "cena-1", label: "O quarto do herói", difficulty: "Fácil" },
      { id: "cena-2", label: "Diversão no parque", difficulty: "Fácil" },
    ],
  },
];

const questions: Record<PhaseId, Record<ArenaId, Question[]>> = {
  "3-5": {
    intelectual: [
      { question: "Qual destes voa?", visual: ["🐟", "🦋", "🐢"], options: ["🐟", "🦋", "🐢"], answer: 1, explain: "A borboleta voa com suas asas coloridas!" },
      { question: "Qual é o maior?", visual: ["🐘", "🐭"], options: ["🐘", "🐭"], answer: 0, explain: "O elefante é bem maior que o ratinho." },
      { question: "O que vem depois do 2?", visual: ["1", "2", "3"], options: ["1", "2", "3"], answer: 2, explain: "Depois do 2 vem o número 3!" },
      { question: "Qual forma tem três lados?", visual: ["🔵", "🔺", "⬛"], options: ["🔵", "🔺", "⬛"], answer: 1, explain: "O triângulo tem três lados." },
      { question: "Qual combina com a chuva?", visual: ["☂️", "☀️", "🍦"], options: ["☂️", "☀️", "🍦"], answer: 0, explain: "Usamos o guarda-chuva quando chove." },
    ],
    atencional: [
      { question: "Qual figura apareceu duas vezes?", visual: ["⭐", "🌙", "⭐"], options: ["⭐", "🌙", "☀️"], answer: 0, explain: "A estrela apareceu duas vezes!" },
      { question: "Qual é diferente dos animais?", visual: ["🐶", "🐱", "🚗"], options: ["🐶", "🐱", "🚗"], answer: 2, explain: "O carro não é um animal." },
      { question: "Qual cor estava no cartão?", visual: ["🔴", "🟡", "🔵"], options: ["🔴", "🟡", "🔵"], answer: 1, explain: "A cor amarela estava no cartão." },
      { question: "Qual símbolo está repetido?", visual: ["💚", "💛", "💚"], options: ["💚", "💛", "💙"], answer: 0, explain: "O coração verde se repetiu." },
      { question: "Qual objeto não pertence à cozinha?", visual: ["🍽️", "🥄", "⚽"], options: ["🍽️", "🥄", "⚽"], answer: 2, explain: "A bola é usada para brincar." },
    ],
    pedagogico: [
      { question: "Com qual letra começa a palavra BOLA?", visual: ["B", "C", "D"], options: ["B", "C", "D"], answer: 0, explain: "BOLA começa com a letra B." },
      { question: "Quanto é 1 + 1?", visual: ["1", "2", "3"], options: ["1", "2", "3"], answer: 1, explain: "Uma coisa mais uma coisa são duas!" },
      { question: "Qual é a forma redonda?", visual: ["🔺", "🔵", "⬛"], options: ["🔺", "🔵", "⬛"], answer: 1, explain: "O círculo é redondo." },
      { question: "Qual número vem antes do 3?", visual: ["1", "2", "4"], options: ["1", "2", "4"], answer: 1, explain: "O número 2 vem antes do 3." },
      { question: "Qual palavra rima com GATO?", visual: ["RATO", "BOLA", "MESA"], options: ["RATO", "BOLA", "MESA"], answer: 0, explain: "GATO e RATO terminam com o mesmo som." },
    ],
    gerais: [
      { question: "Qual animal vive na água?", visual: ["🐟", "🐱", "🐶"], options: ["🐟", "🐱", "🐶"], answer: 0, explain: "O peixe vive na água." },
      { question: "O que usamos para ouvir?", visual: ["👂", "👁️", "👃"], options: ["👂", "👁️", "👃"], answer: 0, explain: "O ouvido ajuda a escutar os sons." },
      { question: "Qual estação é mais quente?", visual: ["❄️", "☀️", "🍂"], options: ["❄️", "☀️", "🍂"], answer: 1, explain: "O verão costuma ser a estação mais quente." },
      { question: "Qual parte da planta fica no chão?", visual: ["🌸", "🌿", "🌱"], options: ["🌸", "🌿", "🌱"], answer: 2, explain: "A raiz fica no solo e ajuda a planta." },
      { question: "Qual destes é um inseto?", visual: ["🦋", "🐘", "🐳"], options: ["🦋", "🐘", "🐳"], answer: 0, explain: "A borboleta é um inseto." },
    ],
    erros: [
      { question: "Na cena, qual objeto mudou de lugar?", visual: ["🧸", "🚂", "📚"], options: ["🧸", "🚂", "📚"], answer: 1, explain: "O trenzinho é a diferença desta rodada." },
      { question: "Qual cor apareceu diferente?", visual: ["🔴", "🔵", "🟢"], options: ["🔴", "🔵", "🟢"], answer: 2, explain: "O verde mudou na cena." },
      { question: "Qual item não estava no quarto?", visual: ["🛏️", "🪥", "🚲"], options: ["🛏️", "🪥", "🚲"], answer: 2, explain: "A bicicleta apareceu por engano." },
      { question: "Qual estrela é diferente?", visual: ["⭐", "⭐", "🌟"], options: ["⭐", "⭐", "🌟"], answer: 2, explain: "A estrela brilhante tem outro formato." },
      { question: "Qual detalhe você encontrou?", visual: ["🧢", "👟", "🎈"], options: ["🧢", "👟", "🎈"], answer: 0, explain: "O boné é o detalhe escondido." },
    ],
  },
  "6-8": {
    intelectual: [
      { question: "Qual número completa a sequência 2, 4, 6, ...?", visual: ["7", "8", "9"], options: ["7", "8", "9"], answer: 1, explain: "A sequência aumenta de dois em dois." },
      { question: "Qual figura continua o padrão?", visual: ["🔵🔺", "🔺🔵", "🔵🔺"], options: ["🔵🔺", "🔺🔵", "🟡🟡"], answer: 1, explain: "O próximo cartão alterna para triângulo e círculo." },
      { question: "Qual é o intruso na sequência?", visual: ["2", "4", "7", "8"], options: ["2", "4", "7", "8"], answer: 2, explain: "O 7 quebra a sequência de números pares." },
      { question: "Se hoje é terça, que dia será amanhã?", visual: ["segunda", "quarta", "sexta"], options: ["segunda", "quarta", "sexta"], answer: 1, explain: "Depois de terça vem quarta-feira." },
      { question: "Qual objeto tem simetria?", visual: ["🦋", "🍌", "⚡"], options: ["🦋", "🍌", "⚡"], answer: 0, explain: "As asas da borboleta formam um par simétrico." },
    ],
    atencional: [
      { question: "Qual símbolo mudou na sequência?", visual: ["🔺", "🔺", "🔵", "🔺"], options: ["🔺", "🔵", "🟢"], answer: 1, explain: "O círculo azul é o símbolo diferente." },
      { question: "Qual palavra estava escrita duas vezes?", visual: ["SOL", "LUA", "SOL"], options: ["SOL", "LUA", "MAR"], answer: 0, explain: "SOL apareceu nas duas pontas." },
      { question: "Qual animal não combina com a floresta?", visual: ["🦊", "🦉", "🐙"], options: ["🦊", "🦉", "🐙"], answer: 2, explain: "O polvo vive na água, não na floresta." },
      { question: "Qual seta aponta para o lado oposto?", visual: ["➡️", "➡️", "⬅️"], options: ["➡️", "⬅️", "⬆️"], answer: 1, explain: "A seta para a esquerda é a diferente." },
      { question: "Qual cor não aparece no arco-íris?", visual: ["🟣", "🟢", "⚫"], options: ["🟣", "🟢", "⚫"], answer: 2, explain: "Preto não é uma cor do arco-íris." },
    ],
    pedagogico: [
      { question: "Quanto é 7 + 5?", visual: ["10", "12", "14"], options: ["10", "12", "14"], answer: 1, explain: "Sete mais cinco é igual a doze." },
      { question: "Qual palavra é um verbo?", visual: ["CORRER", "AZUL", "CASA"], options: ["CORRER", "AZUL", "CASA"], answer: 0, explain: "Correr indica uma ação." },
      { question: "Quantos lados tem um pentágono?", visual: ["4", "5", "6"], options: ["4", "5", "6"], answer: 1, explain: "Penta significa cinco." },
      { question: "Qual fração representa metade?", visual: ["1/2", "1/3", "1/4"], options: ["1/2", "1/3", "1/4"], answer: 0, explain: "Uma de duas partes iguais é metade." },
      { question: "Qual palavra está no plural?", visual: ["LIVRO", "LIVROS", "LIVRARIA"], options: ["LIVRO", "LIVROS", "LIVRARIA"], answer: 1, explain: "LIVROS indica mais de um livro." },
    ],
    gerais: [
      { question: "Qual planeta é conhecido como planeta vermelho?", visual: ["🌍", "🔴", "🪐"], options: ["🌍", "🔴", "🪐"], answer: 1, explain: "Marte é conhecido como planeta vermelho." },
      { question: "Qual órgão bombeia o sangue?", visual: ["🫀", "🫁", "🧠"], options: ["🫀", "🫁", "🧠"], answer: 0, explain: "O coração bombeia o sangue pelo corpo." },
      { question: "O que as plantas precisam para fazer fotossíntese?", visual: ["☀️", "🌙", "⭐"], options: ["☀️", "🌙", "⭐"], answer: 0, explain: "A luz do Sol participa da fotossíntese." },
      { question: "Qual animal é mamífero?", visual: ["🐬", "🐊", "🦎"], options: ["🐬", "🐊", "🦎"], answer: 0, explain: "O golfinho é um mamífero." },
      { question: "Qual material é reciclável?", visual: ["🧴", "🍌", "🪨"], options: ["🧴", "🍌", "🪨"], answer: 0, explain: "A garrafa plástica pode ser encaminhada para reciclagem." },
    ],
    erros: [
      { question: "Qual detalhe não combina com a sala de aula?", visual: ["📚", "✏️", "🏄"], options: ["📚", "✏️", "🏄"], answer: 2, explain: "A prancha é o detalhe diferente." },
      { question: "Qual objeto mudou de cor?", visual: ["🟡", "🔵", "🟡"], options: ["🟡", "🔵", "🟢"], answer: 1, explain: "O azul é o detalhe que mudou." },
      { question: "Qual item apareceu a mais?", visual: ["🪑", "📐", "🛸"], options: ["🪑", "📐", "🛸"], answer: 2, explain: "A nave não pertence à sala de aula." },
      { question: "Qual caminho é diferente?", visual: ["⬆️➡️", "⬆️➡️", "⬅️⬇️"], options: ["⬆️➡️", "⬅️⬇️", "➡️⬆️"], answer: 1, explain: "A terceira rota muda de direção." },
      { question: "Qual desenho não se repete?", visual: ["🌴", "🌴", "🌵"], options: ["🌴", "🌵", "🌻"], answer: 1, explain: "O cacto aparece apenas uma vez." },
    ],
  },
  "9-12": {
    intelectual: [
      { question: "Qual número completa a sequência 3, 6, 12, ...?", visual: ["15", "18", "24"], options: ["15", "18", "24"], answer: 2, explain: "Cada número é o dobro do anterior." },
      { question: "Se A é maior que B e B é maior que C, quem é o menor?", visual: ["A", "B", "C"], options: ["A", "B", "C"], answer: 2, explain: "C está abaixo de B e A na comparação." },
      { question: "Qual forma completa a matriz?", visual: ["🔴🔵", "🔵🔴", "🔴🔵"], options: ["🔴🔵", "🔵🔴", "🟢🟢"], answer: 1, explain: "A alternância indica azul e vermelho na ordem inversa." },
      { question: "Qual palavra não pertence ao grupo?", visual: ["QUADRADO", "CÍRCULO", "AZUL"], options: ["QUADRADO", "CÍRCULO", "AZUL"], answer: 2, explain: "Azul é uma cor, os outros são formas." },
      { question: "Se 4 máquinas fazem 4 peças em 4 minutos, quanto fazem 8 máquinas em 4 minutos?", visual: ["4", "8", "16"], options: ["4", "8", "16"], answer: 1, explain: "Dobrar as máquinas dobra a produção no mesmo tempo." },
    ],
    atencional: [
      { question: "Qual sequência é exatamente igual à primeira?", visual: ["◆ ● ▲", "◆ ● ▲", "◆ ▲ ●"], options: ["◆ ● ▲", "◆ ▲ ●", "● ◆ ▲"], answer: 0, explain: "A primeira opção preserva a ordem original." },
      { question: "Qual detalhe está fora do padrão?", visual: ["101", "101", "110"], options: ["101", "110", "111"], answer: 1, explain: "110 é a sequência que muda o padrão." },
      { question: "Qual palavra tem uma letra a mais?", visual: ["MENTE", "MENTES", "MENTE"], options: ["MENTE", "MENTES", "SUPER"], answer: 1, explain: "MENTES tem a letra S adicional." },
      { question: "Qual seta aponta na direção contrária?", visual: ["↗️", "↗️", "↙️"], options: ["↗️", "↙️", "➡️"], answer: 1, explain: "A seta diagonal para baixo é a oposta." },
      { question: "Qual símbolo aparece três vezes?", visual: ["◈", "○", "◈", "◈"], options: ["◈", "○", "△"], answer: 0, explain: "O losango aparece três vezes." },
    ],
    pedagogico: [
      { question: "Qual é o resultado de 15 × 3?", visual: ["30", "45", "60"], options: ["30", "45", "60"], answer: 1, explain: "Quinze vezes três é quarenta e cinco." },
      { question: "Qual é o sinônimo de rápido?", visual: ["LENTO", "VELOZ", "FRIO"], options: ["LENTO", "VELOZ", "FRIO"], answer: 1, explain: "Veloz significa rápido." },
      { question: "Qual ângulo tem 90 graus?", visual: ["reto", "agudo", "raso"], options: ["reto", "agudo", "raso"], answer: 0, explain: "O ângulo reto mede exatamente 90 graus." },
      { question: "Qual fração é maior?", visual: ["1/2", "3/4", "1/4"], options: ["1/2", "3/4", "1/4"], answer: 1, explain: "Três quartos representam mais que metade." },
      { question: "Qual frase está no futuro?", visual: ["Eu estudo", "Eu estudei", "Eu estudarei"], options: ["Eu estudo", "Eu estudei", "Eu estudarei"], answer: 2, explain: "Estudarei indica uma ação que ainda vai acontecer." },
    ],
    gerais: [
      { question: "Qual é o maior planeta do Sistema Solar?", visual: ["🌍", "🪐", "🔴"], options: ["🌍", "🪐", "🔴"], answer: 1, explain: "Júpiter é o maior planeta do Sistema Solar." },
      { question: "Qual sistema permite a respiração?", visual: ["🫁", "🦴", "💪"], options: ["🫁", "🦴", "💪"], answer: 0, explain: "O sistema respiratório permite a entrada e saída de ar." },
      { question: "O que causa as estações do ano?", visual: ["🌎", "☀️", "🌙"], options: ["A inclinação da Terra", "As nuvens", "A Lua"], answer: 0, explain: "A inclinação do eixo da Terra participa das estações." },
      { question: "Qual fonte é renovável?", visual: ["☀️", "🛢️", "⛏️"], options: ["☀️", "🛢️", "⛏️"], answer: 0, explain: "A energia solar é uma fonte renovável." },
      { question: "Qual bioma tem pouca chuva?", visual: ["🏜️", "🌳", "🌊"], options: ["🏜️", "🌳", "🌊"], answer: 0, explain: "O deserto é um ambiente com pouca chuva." },
    ],
    erros: [
      { question: "Qual elemento não pertence à base espacial?", visual: ["🚀", "🛰️", "🏰"], options: ["🚀", "🛰️", "🏰"], answer: 2, explain: "O castelo é o detalhe diferente." },
      { question: "Qual sequência de estrelas está invertida?", visual: ["⭐🔷", "🔷⭐", "⭐🔷"], options: ["⭐🔷", "🔷⭐", "🌙⭐"], answer: 1, explain: "A segunda opção inverte a ordem." },
      { question: "Qual sombra não combina com o objeto?", visual: ["🚀", "🌲", "🛸"], options: ["🚀", "🌲", "🛸"], answer: 2, explain: "O disco voador não aparece na cena original." },
      { question: "Qual item está duplicado?", visual: ["🧭", "🧭", "🔭"], options: ["🧭", "🔭", "🪐"], answer: 0, explain: "A bússola é o item que se repete." },
      { question: "Qual detalhe mudou de posição?", visual: ["🌲", "🌌", "🪨"], options: ["🌲", "🌌", "🪨"], answer: 2, explain: "A pedra é o detalhe deslocado." },
    ],
  },
};

const arenaById = Object.fromEntries(arenas.map((arena) => [arena.id, arena])) as Record<ArenaId, Arena>;
const phaseById = Object.fromEntries(phases.map((phase) => [phase.id, phase])) as Record<PhaseId, Phase>;

function Stars({ active = 0, total = 5 }: { active?: number; total?: number }) {
  return (
    <div className="flex items-center gap-1" aria-label={`${active} de ${total} estrelas`}>
      {Array.from({ length: total }).map((_, index) => (
        <Star
          key={index}
          className="h-5 w-5"
          fill={index < active ? "var(--kids-sun)" : "transparent"}
          color={index < active ? "var(--kids-sun)" : "var(--kids-border-muted)"}
          strokeWidth={2.5}
        />
      ))}
    </div>
  );
}

function KidsButton({
  children,
  color,
  onClick,
  variant = "solid",
  type = "button",
  disabled = false,
}: {
  children: React.ReactNode;
  color: string;
  onClick?: () => void;
  variant?: "solid" | "soft";
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="kids-button inline-flex items-center justify-center gap-2 rounded-full border-[3px] px-4 py-2 text-sm font-extrabold tracking-tight shadow-[3px_3px_0_var(--kids-ink)] transition-transform hover:-translate-y-0.5 active:translate-y-0 active:shadow-[1px_1px_0_var(--kids-ink)]"
      style={{
        backgroundColor: variant === "solid" ? color : "var(--kids-white)",
        borderColor: "var(--kids-ink)",
        color:
          variant === "solid" &&
          (color === "var(--kids-blue)" || color === "var(--kids-purple)")
            ? "var(--kids-white)"
            : "var(--kids-ink)",
      }}
    >
      {children}
    </button>
  );
}

function MissionCard({
  arena,
  phase,
  onStart,
}: {
  arena: Arena;
  phase: Phase;
  onStart: (arenaId: ArenaId, actionId: string) => void;
}) {
  return (
    <article
      className="kids-mission-card relative overflow-hidden rounded-[24px] border-[3px] border-[var(--kids-ink)] bg-white p-4 shadow-[4px_4px_0_var(--kids-ink)] transition-transform hover:-translate-y-1"
      style={{ backgroundColor: arena.softColor }}
    >
      <div className="flex items-start gap-3">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border-[3px] border-[var(--kids-ink)] bg-white shadow-[2px_2px_0_var(--kids-ink)]">
          <img src={arena.art} alt="" className="h-full w-full object-cover" />
        </div>
        <div className="min-w-0 pt-1">
          <p className="font-[Nunito,sans-serif] text-base font-extrabold text-[var(--kids-ink)]">{arena.title}</p>
          <p className="text-xs font-bold leading-tight text-[var(--kids-muted)]">{arena.tagline}</p>
        </div>
      </div>
      <p className="mt-4 text-sm font-semibold text-[var(--kids-ink)]">{arena.description}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {arena.actions.map((action) => (
          <KidsButton key={action.id} color={arena.color} onClick={() => onStart(arena.id, action.id)}>
            {action.label}
            {action.difficulty ? <span className="text-xs">({action.difficulty})</span> : <ArrowRight className="h-4 w-4" />}
          </KidsButton>
        ))}
      </div>
      <span className="pointer-events-none absolute -bottom-5 -right-4 text-6xl opacity-10">{arena.icon}</span>
      <span className="sr-only">Faixa selecionada: {phase.label}</span>
    </article>
  );
}

export default function BrincandoAprendendoPage() {
  const [phaseId, setPhaseId] = useState<PhaseId>("3-5");
  const [view, setView] = useState<ActivityView>("home");
  const [selectedArena, setSelectedArena] = useState<ArenaId>("intelectual");
  const [selectedAction, setSelectedAction] = useState("treinar");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  const phase = phaseById[phaseId];
  const arena = arenaById[selectedArena];
  const bank = questions[phaseId][selectedArena];
  const currentQuestion = bank[questionIndex];
  const answeredCorrectly = selectedAnswer === currentQuestion?.answer;

  const startActivity = (arenaId: ArenaId, actionId: string) => {
    setSelectedArena(arenaId);
    setSelectedAction(actionId);
    setQuestionIndex(0);
    setScore(0);
    setSelectedAnswer(null);
    setView("activity");
    window.setTimeout(() => document.getElementById("kids-activity")?.scrollIntoView({ behavior: "smooth", block: "start" }), 20);
  };

  const choosePhase = (nextPhase: PhaseId) => {
    setPhaseId(nextPhase);
    setView("home");
    setQuestionIndex(0);
    setScore(0);
    setSelectedAnswer(null);
    window.setTimeout(() => document.getElementById("kids-missions")?.scrollIntoView({ behavior: "smooth", block: "start" }), 20);
  };

  const chooseAnswer = (index: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(index);
    if (index === currentQuestion.answer) setScore((value) => value + 1);
  };

  const nextQuestion = () => {
    if (questionIndex >= bank.length - 1) {
      setView("complete");
      return;
    }
    setQuestionIndex((value) => value + 1);
    setSelectedAnswer(null);
  };

  const restart = () => {
    setView("home");
    setSelectedAnswer(null);
    setScore(0);
    window.setTimeout(() => document.getElementById("kids-missions")?.scrollIntoView({ behavior: "smooth", block: "start" }), 20);
  };

  const currentActionLabel = useMemo(
    () => arena.actions.find((action) => action.id === selectedAction)?.label ?? arena.actions[0]?.label,
    [arena.actions, selectedAction],
  );

  if (view === "activity" || view === "complete") {
    return (
      <div className="np-kids min-h-screen overflow-hidden bg-[var(--kids-background)] text-[var(--kids-ink)]" style={{ fontFamily: "Nunito, Avenir Next, sans-serif" }}>
        <header className="border-b-[4px] border-[var(--kids-ink)] bg-[var(--kids-sun)] px-4 py-3 shadow-[0_3px_0_var(--kids-ink)]">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
            <button
              type="button"
              onClick={restart}
              className="inline-flex items-center gap-2 rounded-full border-[3px] border-[var(--kids-ink)] bg-white px-4 py-2 text-sm font-extrabold shadow-[3px_3px_0_var(--kids-ink)] transition-transform hover:-translate-y-0.5"
            >
              <ArrowLeft className="h-4 w-4" /> Sair
            </button>
            <div className="hidden items-center gap-2 sm:flex">
              <img src={logoHero} alt="Dr. Jadson Fraga" className="h-10 w-14 object-contain" />
              <span className="rounded-full border-[2px] border-[var(--kids-ink)] bg-white px-3 py-1 text-xs font-extrabold">{phase.label}</span>
              <span className="rounded-full border-[2px] border-[var(--kids-ink)] bg-white px-3 py-1 text-xs font-extrabold">{arena.title}</span>
            </div>
            <div className="flex items-center gap-2 text-right">
              <span className="hidden text-xs font-extrabold sm:block">{arena.mascotLine}</span>
              <img src={mascot} alt="Dr. Jadson" className="h-12 w-8 object-contain object-top" />
            </div>
          </div>
        </header>

        <main id="kids-activity" className="mx-auto max-w-5xl px-4 py-10 md:py-14">
          {view === "complete" ? (
            <section className="mx-auto max-w-2xl rounded-[32px] border-[4px] border-[var(--kids-ink)] bg-white p-6 text-center shadow-[7px_7px_0_var(--kids-ink)] md:p-10">
              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full border-[4px] border-[var(--kids-ink)] bg-[var(--kids-cream-strong)] shadow-[4px_4px_0_var(--kids-ink)]">
                <Trophy className="h-10 w-10 text-[var(--kids-orange)]" />
              </div>
              <p className="mb-2 text-sm font-extrabold uppercase tracking-[0.16em] text-[var(--kids-orange-strong)]">Missão concluída</p>
              <h1 className="font-[Fredoka,sans-serif] text-3xl font-extrabold md:text-5xl">Você foi incrível!</h1>
              <p className="mx-auto mt-3 max-w-md text-base font-semibold text-[var(--kids-muted)]">Seu cérebro treinou como um verdadeiro superpoder em {currentActionLabel?.toLowerCase()}.</p>
              <div className="my-7 flex justify-center"><Stars active={score} /></div>
              <p className="text-lg font-extrabold">Você acertou {score} de {bank.length} desafios.</p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <KidsButton color="var(--kids-sun)" onClick={() => startActivity(selectedArena, selectedAction)}><RotateCcw className="h-4 w-4" /> Jogar novamente</KidsButton>
                <KidsButton color="var(--kids-green)" variant="soft" onClick={restart}><Home className="h-4 w-4" /> Escolher missão</KidsButton>
              </div>
            </section>
          ) : (
            <section className="kids-activity-card mx-auto max-w-3xl">
              <div className="mb-5 text-center">
                <div className="mx-auto inline-flex items-center gap-2 rounded-full border-[3px] border-[var(--kids-ink)] bg-white px-5 py-2 shadow-[3px_3px_0_var(--kids-ink)]">
                  <span className="text-lg">{arena.icon}</span>
                  <h1 className="font-[Fredoka,sans-serif] text-2xl font-extrabold md:text-3xl">{arena.title}</h1>
                </div>
                <p className="mt-3 text-sm font-bold text-[var(--kids-muted)]">{arena.tagline} · Pergunta {questionIndex + 1} de {bank.length}</p>
                <div className="mt-3 flex justify-center"><Stars active={questionIndex} /></div>
              </div>

              <div className="relative rounded-[28px] border-[4px] border-[var(--kids-ink)] bg-white p-5 shadow-[7px_7px_0_var(--kids-ink)] md:p-8">
                <div className="mb-6 flex items-end gap-3">
                  <img src={mascot} alt="Dr. Jadson Fraga" className="h-28 w-20 object-contain object-top md:h-36 md:w-24" />
                  <div className="rounded-2xl border-[3px] border-[var(--kids-ink)] bg-[var(--kids-soft-blue)] px-4 py-3 text-sm font-extrabold shadow-[3px_3px_0_var(--kids-ink)]">{arena.mascotLine}</div>
                </div>
                <div className="rounded-2xl border-[3px] border-[var(--kids-ink)] bg-[var(--kids-cream)] p-5 text-center md:p-7">
                  <h2 className="font-[Fredoka,sans-serif] text-2xl font-extrabold md:text-3xl">{currentQuestion.question}</h2>
                  <div className="mt-6 flex flex-wrap justify-center gap-3">
                    {currentQuestion.options.map((option, index) => {
                      const isSelected = selectedAnswer === index;
                      const isCorrect = selectedAnswer !== null && index === currentQuestion.answer;
                      return (
                        <button
                          key={`${option}-${index}`}
                          type="button"
                          onClick={() => chooseAnswer(index)}
                          className="kids-answer-option flex min-h-20 min-w-24 flex-col items-center justify-center rounded-2xl border-[3px] border-[var(--kids-ink)] bg-white px-5 py-3 text-3xl font-extrabold shadow-[3px_3px_0_var(--kids-ink)] transition-all hover:-translate-y-1 disabled:cursor-default"
                          style={{ backgroundColor: isCorrect ? "var(--kids-success)" : isSelected ? "var(--kids-soft-red)" : "var(--kids-white)" }}
                          disabled={selectedAnswer !== null}
                          aria-label={`Opção ${index + 1}: ${option}`}
                        >
                          <span>{currentQuestion.visual[index] ?? option}</span>
                          <span className="mt-1 text-xs font-extrabold text-[var(--kids-muted)]">{option}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                {selectedAnswer !== null && (
                  <div className={`kids-feedback mt-5 flex items-start gap-3 rounded-2xl border-[3px] p-4 text-sm font-extrabold ${answeredCorrectly ? "border-[var(--kids-green-deep)] bg-[var(--kids-soft-green)]" : "border-[var(--kids-red)] bg-[var(--kids-soft-red)]"}`} aria-live="polite">
                    <span className="text-xl">{answeredCorrectly ? "🌟" : "💡"}</span>
                    <p>{answeredCorrectly ? "Muito bem! " : "Quase! "}{currentQuestion.explain}</p>
                  </div>
                )}
                <div className="mt-6 flex justify-end">
                  <KidsButton color={selectedAnswer === null ? "var(--kids-soft-blue)" : arena.color} onClick={nextQuestion} disabled={selectedAnswer === null}>
                    {questionIndex === bank.length - 1 ? "Ver resultado" : "Próxima missão"} <ArrowRight className="h-4 w-4" />
                  </KidsButton>
                </div>
              </div>
            </section>
          )}
        </main>

        <footer className="border-t-[4px] border-[var(--kids-ink)] bg-[var(--kids-ink)] px-4 py-6 text-center text-sm font-bold text-white">
          Dr. Jadson Fraga · Neuropediatra · Toda mente é um superpoder! 🦸
        </footer>
      </div>
    );
  }

  return (
    <div className="np-kids min-h-screen overflow-hidden bg-[var(--kids-background)] text-[var(--kids-ink)]" style={{ fontFamily: "Nunito, Avenir Next, sans-serif" }}>
      <header className="kids-hero relative border-b-[4px] border-[var(--kids-ink)]" style={{ backgroundColor: phase.tone }}>
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <span className="absolute left-[10%] top-8 text-2xl text-[var(--kids-coral)]">✦</span>
          <span className="absolute right-[12%] top-16 text-2xl text-[var(--kids-green)]">✦</span>
          <span className="absolute bottom-5 right-[30%] text-xl text-[var(--kids-blue)]">✦</span>
          <span className="absolute bottom-16 left-[38%] text-lg text-[var(--kids-sun)]">✦</span>
        </div>
        <div className="kids-hero-content mx-auto flex max-w-6xl flex-col gap-7 px-5 pb-8 pt-7 md:flex-row md:items-center md:px-8 md:pb-10 md:pt-8">
          <div className="flex justify-center md:w-44 md:justify-start">
            <img src={mascot} alt="Dr. Jadson Fraga, guia das missões" className="kids-mascot-float h-52 w-32 object-contain object-top md:h-64 md:w-40" />
          </div>
          <div className="relative flex-1 text-center md:text-left">
            <div className="mb-3 flex items-center justify-center gap-3 md:justify-start">
              <img src={logoHero} alt="Dr. Jadson Fraga" className="h-12 w-16 object-contain" />
              <span className="rounded-full border-[3px] border-[var(--kids-ink)] bg-white px-3 py-1 text-xs font-extrabold shadow-[2px_2px_0_var(--kids-ink)]">Brincando e Aprendendo</span>
            </div>
            <p className="text-sm font-extrabold text-[var(--kids-green)]">Fase de herói: {phase.emoji} {phase.label}</p>
            <h1 className="mt-2 font-[Fredoka,sans-serif] text-4xl font-extrabold leading-tight tracking-tight md:text-6xl">Escolha sua missão de hoje!</h1>
            <p className="mt-2 text-base font-bold text-[var(--kids-muted)] md:text-lg">{phase.title} {phase.subtitle}</p>
            <div className="mt-5 flex flex-wrap justify-center gap-2 md:justify-start">
              {phases.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => choosePhase(option.id)}
                  className={`kids-button rounded-full border-[3px] border-[var(--kids-ink)] px-4 py-2 text-sm font-extrabold shadow-[2px_2px_0_var(--kids-ink)] transition-transform hover:-translate-y-0.5 ${option.id === phaseId ? "bg-[var(--kids-sun)]" : "bg-white"}`}
                  aria-pressed={option.id === phaseId}
                  aria-label={`Selecionar faixa etária ${option.label}`}
                >
                  {option.emoji} {option.label}
                </button>
              ))}
            </div>
          </div>
          <Link href="/" className="self-center md:self-start">
            <span className="inline-flex items-center gap-2 rounded-full border-[3px] border-[var(--kids-ink)] bg-white px-4 py-2 text-sm font-extrabold shadow-[3px_3px_0_var(--kids-ink)] transition-transform hover:-translate-y-0.5">
              <Home className="h-4 w-4" /> Início
            </span>
          </Link>
        </div>
      </header>

      <main id="kids-missions" className="mx-auto max-w-6xl px-5 py-9 md:px-8 md:py-12">
        <div className="kids-section-heading mb-7 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-[var(--kids-orange-strong)]">Escolha uma arena</p>
            <h2 className="mt-1 font-[Fredoka,sans-serif] text-3xl font-extrabold md:text-4xl">Toda mente é um superpoder</h2>
          </div>
          <p className="max-w-sm text-sm font-semibold text-[var(--kids-muted)]">Missões curtas, coloridas e pensadas para aprender brincando.</p>
        </div>

        <div className="kids-missions-grid grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {arenas.map((arena) => (
            <MissionCard key={arena.id} arena={arena} phase={phase} onStart={startActivity} />
          ))}
        </div>

        <section className="relative mt-9 overflow-hidden rounded-[28px] border-[4px] border-[var(--kids-ink)] bg-[var(--kids-white)] px-6 py-8 text-center shadow-[6px_6px_0_var(--kids-ink)] md:px-10">
          <span className="absolute left-8 top-5 text-xl text-[var(--kids-green)]">✦</span>
          <span className="absolute right-8 top-8 text-xl text-[var(--kids-coral)]">✦</span>
          <img src={mascot} alt="Dr. Jadson Fraga" className="mx-auto h-24 w-16 object-contain object-top" />
          <p className="mt-3 font-[Fredoka,sans-serif] text-xl font-extrabold md:text-2xl">“Você escolheu muito bem! Que comece o treino, herói!”</p>
          <div className="mt-5 flex flex-wrap justify-center gap-3 text-xs font-extrabold text-[var(--kids-muted)]">
            <span className="rounded-full bg-[var(--kids-cream)] px-3 py-1">🌟 Missões lúdicas</span>
            <span className="rounded-full bg-[var(--kids-soft-blue)] px-3 py-1">🧠 Raciocínio</span>
            <span className="rounded-full bg-[var(--kids-soft-green)] px-3 py-1">🎯 Atenção</span>
          </div>
        </section>
      </main>

      <footer className="border-t-[4px] border-[var(--kids-ink)] bg-[var(--kids-ink)] px-5 py-7 text-center text-sm font-bold text-white">
        Dr. Jadson Fraga · Neuropediatra · Brincando e Aprendendo 🧠✨
      </footer>
    </div>
  );
}
