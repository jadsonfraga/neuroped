import { useMemo, useState } from "react";
import { ChevronLeft, Images, Maximize2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import SondaDezBasePage from "@/pages/testes-diretos";

type BandId = "12-23m" | "24-35m" | "3-4a" | "5-7a" | "8-11a" | "12-17a";
type StimulusKind =
  | "objects"
  | "concepts"
  | "story"
  | "social"
  | "dogs15"
  | "dogs20"
  | "sunmoon"
  | "blocks"
  | "dotgrid"
  | "daynight"
  | "routine"
  | "message"
  | "symbolgrid"
  | "leftright"
  | "rapid"
  | "numberline"
  | "reading"
  | "evening";

type Stimulus = {
  id: string;
  band: BandId;
  title: string;
  subtitle: string;
  instruction: string;
  kind: StimulusKind;
};

const BAND_LABELS: Record<BandId, string> = {
  "12-23m": "12–23 meses",
  "24-35m": "24–35 meses",
  "3-4a": "3–4 anos",
  "5-7a": "5–7 anos",
  "8-11a": "8–11 anos",
  "12-17a": "12–17 anos",
};

/**
 * Banco visual autoral da Sonda Dez.
 *
 * - Todos os estímulos são vetoriais/HTML e ficam no próprio bundle.
 * - Não há URL externa, imagem remota, CDN ou dependência de rede.
 * - O conteúdo é deliberadamente sintético/autoral para evitar divergência,
 *   indisponibilidade e problemas de licenciamento no uso diário.
 * - Não produz escore normativo nem interpretação diagnóstica.
 */
const STIMULI: Stimulus[] = [
  {
    id: "a1-objetos",
    band: "12-23m",
    title: "Objetos de apoio visual",
    subtitle: "Bola · carrinho · bebê",
    instruction: "Use apenas como apoio se o objeto físico não puder ser apresentado.",
    kind: "objects",
  },
  {
    id: "a2-nomeacao",
    band: "24-35m",
    title: "Nomeação de objetos",
    subtitle: "Bola · carrinho · banana",
    instruction: "Mostre um item de cada vez e pergunte: “O que é isso?”.",
    kind: "objects",
  },
  {
    id: "b-conceitos",
    band: "3-4a",
    title: "Conceitos e relações",
    subtitle: "Grande/pequeno · dentro · em cima",
    instruction: "Use para acompanhar as ordens receptivas sem dar pista pela posição.",
    kind: "concepts",
  },
  {
    id: "b-historia",
    band: "3-4a",
    title: "Cena narrativa",
    subtitle: "O suco caiu",
    instruction: "Pergunte apenas: “O que está acontecendo?”.",
    kind: "story",
  },
  {
    id: "b-atencao",
    band: "3-4a",
    title: "Atenção sustentada",
    subtitle: "15 figuras · 5 cachorros",
    instruction: "Toda vez que aparecer um cachorro, coloque uma ficha.",
    kind: "dogs15",
  },
  {
    id: "b-inibicao",
    band: "3-4a",
    title: "SOL / LUA",
    subtitle: "Regra inicial e troca",
    instruction: "SOL = palma; LUA = ficar parado. Depois use a regra invertida.",
    kind: "sunmoon",
  },
  {
    id: "c-historia",
    band: "5-7a",
    title: "Narrativa e inferência",
    subtitle: "Chuva inesperada",
    instruction: "Pergunte: “O que aconteceu?”, “Por quê?” e “O que acontece depois?”.",
    kind: "story",
  },
  {
    id: "c-atencao",
    band: "5-7a",
    title: "Atenção sustentada",
    subtitle: "20 estímulos · 6 cachorros",
    instruction: "Responda apenas quando aparecer o cachorro.",
    kind: "dogs20",
  },
  {
    id: "c-inibicao",
    band: "5-7a",
    title: "Controle inibitório",
    subtitle: "SOL / LUA em sequência",
    instruction: "SOL = uma palma; LUA = ficar parado. Não corrija durante a sequência.",
    kind: "sunmoon",
  },
  {
    id: "c-blocos",
    band: "5-7a",
    title: "Modelo visuoconstrutivo",
    subtitle: "Construção de 6 blocos",
    instruction: "Mostre por 5 segundos, esconda a tela e peça para fazer igual.",
    kind: "blocks",
  },
  {
    id: "d-social",
    band: "8-11a",
    title: "Cena social ambígua",
    subtitle: "Chegada ao grupo",
    instruction: "Pergunte o que acontece, como cada pessoa pode estar se sentindo e quais pistas sustentam a resposta.",
    kind: "social",
  },
  {
    id: "d-cancelamento",
    band: "8-11a",
    title: "Grade de cancelamento",
    subtitle: "Marque apenas círculos com ponto",
    instruction: "Dê 60 segundos. Não indique erros durante a tarefa.",
    kind: "dotgrid",
  },
  {
    id: "d-dia-noite",
    band: "8-11a",
    title: "Inibição verbal",
    subtitle: "DIA / NOITE",
    instruction: "Quando eu disser DIA, responda NOITE; quando disser NOITE, responda DIA.",
    kind: "daynight",
  },
  {
    id: "d-rotina",
    band: "8-11a",
    title: "Planejamento de rotina",
    subtitle: "Antes de sair às 7h30",
    instruction: "Peça para ordenar. Depois diga: “O material ainda não está pronto. O que muda?”.",
    kind: "routine",
  },
  {
    id: "e-mensagem",
    band: "12-17a",
    title: "Cognição social",
    subtitle: "Mensagem visualizada sem resposta",
    instruction: "Pergunte quais explicações existem, qual seria a pior reação e qual resposta seria mais adequada.",
    kind: "message",
  },
  {
    id: "e-grade",
    band: "12-17a",
    title: "Atenção seletiva",
    subtitle: "Grade de símbolos e letras",
    instruction: "Em 60 segundos, marque apenas os alvos definidos no topo.",
    kind: "symbolgrid",
  },
  {
    id: "e-direita-esquerda",
    band: "12-17a",
    title: "Inibição e troca de regra",
    subtitle: "DIREITA / ESQUERDA",
    instruction: "Primeiro responda o oposto. Depois mude para responder o mesmo lado.",
    kind: "leftright",
  },
  {
    id: "e-nomeacao-rapida",
    band: "12-17a",
    title: "Nomeação seriada rápida",
    subtitle: "Cores e letras",
    instruction: "Leia/nomeie da esquerda para a direita, linha por linha, o mais corretamente possível.",
    kind: "rapid",
  },
  {
    id: "e-reta",
    band: "12-17a",
    title: "Reta numérica",
    subtitle: "0 a 100",
    instruction: "Peça para indicar onde ficaria o número solicitado sem sugerir a posição.",
    kind: "numberline",
  },
  {
    id: "e-leitura",
    band: "12-17a",
    title: "Leitura de 1 minuto",
    subtitle: "Texto autoral curto",
    instruction: "Peça para ler em voz alta durante 60 segundos. Não complete palavras.",
    kind: "reading",
  },
  {
    id: "e-planejamento",
    band: "12-17a",
    title: "Planejamento executivo",
    subtitle: "Noite com prova e trabalho",
    instruction: "Peça para organizar a noite. Depois acrescente uma hora ao trabalho e peça novo plano.",
    kind: "evening",
  },
];

function Person({ x, y, facing = 1 }: { x: number; y: number; facing?: 1 | -1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${facing} 1)`}>
      <circle cx="0" cy="0" r="18" fill="currentColor" opacity="0.9" />
      <rect x="-16" y="20" width="32" height="55" rx="14" fill="currentColor" opacity="0.72" />
      <path d="M-10 75 L-18 122 M10 75 L18 122" stroke="currentColor" strokeWidth="12" strokeLinecap="round" opacity="0.72" />
      <path d="M-15 36 L-42 66 M15 36 L42 58" stroke="currentColor" strokeWidth="10" strokeLinecap="round" opacity="0.72" />
    </g>
  );
}

function VectorScene({ kind }: { kind: StimulusKind }) {
  if (kind === "objects") {
    return (
      <div className="grid w-full max-w-4xl grid-cols-3 gap-5">
        <div className="flex aspect-square items-center justify-center rounded-[30px] border-4 border-slate-200 bg-white">
          <svg viewBox="0 0 160 160" className="h-4/5 w-4/5" aria-label="bola">
            <circle cx="80" cy="80" r="55" fill="#f8fafc" stroke="#0f172a" strokeWidth="8" />
            <path d="M80 25 110 52 99 91 61 91 50 52Z" fill="#0f172a" />
            <path d="M50 52 25 72M110 52 135 72M61 91 46 130M99 91 114 130" stroke="#0f172a" strokeWidth="7" />
          </svg>
        </div>
        <div className="flex aspect-square items-center justify-center rounded-[30px] border-4 border-slate-200 bg-white">
          <svg viewBox="0 0 180 140" className="h-4/5 w-4/5" aria-label="carrinho">
            <rect x="25" y="55" width="125" height="45" rx="14" fill="#2563eb" />
            <path d="M55 55 75 25h45l22 30" fill="#93c5fd" stroke="#1e3a8a" strokeWidth="6" />
            <circle cx="58" cy="108" r="16" fill="#0f172a" /><circle cx="126" cy="108" r="16" fill="#0f172a" />
          </svg>
        </div>
        <div className="flex aspect-square items-center justify-center rounded-[30px] border-4 border-slate-200 bg-white">
          <svg viewBox="0 0 160 180" className="h-4/5 w-4/5" aria-label="banana">
            <path d="M35 35c8 88 55 118 100 72-44 10-72-17-75-82Z" fill="#facc15" stroke="#854d0e" strokeWidth="7" />
            <path d="M39 32 57 24" stroke="#854d0e" strokeWidth="9" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    );
  }

  if (kind === "concepts") {
    return (
      <div className="grid w-full max-w-4xl grid-cols-2 gap-5 text-slate-900">
        <div className="rounded-[28px] border-4 border-slate-200 bg-white p-6 text-center">
          <div className="flex items-end justify-center gap-8"><div className="h-28 w-28 rounded-full bg-blue-500" /><div className="h-14 w-14 rounded-full bg-blue-500" /></div>
          <p className="mt-4 text-xl font-black">GRANDE · PEQUENO</p>
        </div>
        <div className="rounded-[28px] border-4 border-slate-200 bg-white p-6 text-center">
          <div className="relative mx-auto h-36 w-52 rounded-2xl border-[8px] border-slate-700"><div className="absolute bottom-4 left-16 h-12 w-20 rounded-xl bg-red-500" /></div>
          <p className="mt-4 text-xl font-black">DENTRO</p>
        </div>
        <div className="col-span-2 rounded-[28px] border-4 border-slate-200 bg-white p-6 text-center">
          <div className="relative mx-auto h-40 w-60"><div className="absolute bottom-0 left-10 h-16 w-40 rounded-xl bg-slate-300" /><div className="absolute bottom-16 left-24 h-20 w-14 rounded-t-full bg-amber-400" /></div>
          <p className="mt-3 text-xl font-black">EM CIMA</p>
        </div>
      </div>
    );
  }

  if (kind === "story") {
    return (
      <svg viewBox="0 0 900 520" className="w-full max-w-5xl rounded-[32px] bg-sky-50 text-slate-800" role="img" aria-label="cena narrativa autoral">
        <rect width="900" height="520" fill="#eef6ff" />
        <rect y="375" width="900" height="145" fill="#d8e7c8" />
        <rect x="570" y="95" width="250" height="260" rx="12" fill="#f8fafc" stroke="#334155" strokeWidth="8" />
        <polygon points="545,105 695,18 845,105" fill="#b45309" />
        <rect x="660" y="230" width="70" height="125" fill="#94a3b8" />
        <path d="M80 60 130 95M170 55 205 90M250 62 280 98" stroke="#60a5fa" strokeWidth="8" strokeLinecap="round" />
        <path d="M320 80 360 120M410 65 450 105M500 75 540 115" stroke="#60a5fa" strokeWidth="8" strokeLinecap="round" />
        <g transform="translate(350 245)" className="text-indigo-700"><Person x={0} y={0} /></g>
        <path d="M300 330 Q365 270 430 330" fill="none" stroke="#7c3aed" strokeWidth="12" />
        <path d="M300 330 282 365M430 330 447 365" stroke="#7c3aed" strokeWidth="10" />
        <ellipse cx="370" cy="410" rx="120" ry="28" fill="#93c5fd" opacity="0.75" />
        <circle cx="505" cy="342" r="30" fill="#f59e0b" /><path d="M500 370 470 410" stroke="#92400e" strokeWidth="10" />
      </svg>
    );
  }

  if (kind === "social") {
    return (
      <svg viewBox="0 0 900 520" className="w-full max-w-5xl rounded-[32px] bg-slate-50 text-slate-800" role="img" aria-label="cena social ambígua autoral">
        <rect width="900" height="520" fill="#f8fafc" />
        <rect y="390" width="900" height="130" fill="#e2e8f0" />
        <rect x="70" y="70" width="200" height="150" rx="20" fill="#dbeafe" /><rect x="630" y="80" width="180" height="140" rx="20" fill="#fef3c7" />
        <g className="text-blue-700"><Person x={365} y={215} /><Person x={515} y={215} facing={-1} /></g>
        <g className="text-rose-700"><Person x={165} y={250} /></g>
        <path d="M382 170 Q440 125 500 170" fill="none" stroke="#64748b" strokeWidth="7" strokeDasharray="12 12" />
        <rect x="390" y="115" width="110" height="58" rx="20" fill="#fff" stroke="#94a3b8" strokeWidth="4" />
        <circle cx="420" cy="143" r="7" fill="#64748b" /><circle cx="447" cy="143" r="7" fill="#64748b" /><circle cx="474" cy="143" r="7" fill="#64748b" />
      </svg>
    );
  }

  if (kind === "blocks") {
    const cells = [
      [1, 0, "#2563eb"], [2, 0, "#eab308"], [0, 1, "#ef4444"],
      [1, 1, "#22c55e"], [2, 1, "#8b5cf6"], [1, 2, "#f97316"],
    ] as const;
    return (
      <svg viewBox="0 0 480 420" className="w-full max-w-xl rounded-[30px] bg-white" aria-label="modelo de seis blocos">
        {cells.map(([x, y, fill], i) => <rect key={i} x={70 + x * 110} y={45 + y * 110} width="96" height="96" rx="12" fill={fill} stroke="#0f172a" strokeWidth="5" />)}
      </svg>
    );
  }

  return null;
}

const DOGS15 = ["DOG", "CAT", "RAB", "DOG", "FOX", "BEAR", "DOG", "PANDA", "TIG", "FROG", "DOG", "MONK", "LION", "DOG", "COW"];
const DOGS20 = ["DOG", "CAT", "FOX", "DOG", "BEAR", "RAB", "DOG", "PANDA", "TIG", "FROG", "DOG", "MONK", "LION", "COW", "DOG", "PIG", "HEN", "PENG", "DOG", "DUCK"];
const ANIMAL_GLYPH: Record<string, string> = { DOG: "🐶", CAT: "🐱", RAB: "🐰", FOX: "🦊", BEAR: "🐻", PANDA: "🐼", TIG: "🐯", FROG: "🐸", MONK: "🐵", LION: "🦁", COW: "🐮", PIG: "🐷", HEN: "🐔", PENG: "🐧", DUCK: "🦆" };

function SequenceGrid({ values }: { values: string[] }) {
  return <div className="grid w-full max-w-5xl grid-cols-5 gap-3">{values.map((v, i) => <div key={`${v}-${i}`} className="flex aspect-square items-center justify-center rounded-2xl border-4 border-slate-200 bg-white text-5xl shadow-sm">{ANIMAL_GLYPH[v] ?? v}</div>)}</div>;
}

function DotGrid() {
  const values = Array.from({ length: 72 }, (_, i) => ((i * 7 + i * i) % 11 < 3 ? "⊙" : ["○", "□", "△", "◇"][i % 4]));
  return <div className="grid w-full max-w-5xl grid-cols-9 gap-2 rounded-[28px] bg-white p-5 text-slate-950">{values.map((v, i) => <div key={i} className="flex aspect-square items-center justify-center rounded-lg border border-slate-200 text-3xl font-black">{v}</div>)}</div>;
}

function SymbolGrid() {
  const chars = ["A", "△", "M", "○", "R", "◇", "A", "□", "K", "△", "P", "○", "A", "◇", "T", "□"];
  const values = Array.from({ length: 80 }, (_, i) => chars[(i * 5 + Math.floor(i / 3)) % chars.length]);
  return (
    <div className="w-full max-w-5xl">
      <div className="mb-4 rounded-2xl bg-amber-100 p-4 text-center text-xl font-black text-amber-950">ALVOS: A e △</div>
      <div className="grid grid-cols-10 gap-2 rounded-[28px] bg-white p-5 text-slate-950">{values.map((v, i) => <div key={i} className="flex aspect-square items-center justify-center rounded-lg border border-slate-200 text-2xl font-black">{v}</div>)}</div>
    </div>
  );
}

function SunMoon() {
  const items = ["☀️", "🌙", "☀️", "☀️", "🌙", "☀️", "🌙", "🌙", "☀️", "🌙", "☀️", "🌙", "☀️", "🌙", "🌙", "☀️"];
  return <div className="grid w-full max-w-5xl grid-cols-4 gap-4">{items.map((item, i) => <div key={i} className="flex aspect-[4/3] items-center justify-center rounded-3xl border-4 border-slate-200 bg-white text-6xl">{item}</div>)}</div>;
}

function DayNight() {
  const items = ["DIA", "NOITE", "DIA", "DIA", "NOITE", "NOITE", "DIA", "NOITE", "DIA", "NOITE", "NOITE", "DIA"];
  return <div className="grid w-full max-w-5xl grid-cols-3 gap-4">{items.map((item, i) => <div key={i} className="rounded-3xl border-4 border-slate-200 bg-white px-5 py-8 text-center text-4xl font-black text-slate-950">{item}</div>)}</div>;
}

function Routine() {
  const cards = ["06:45 · acordar", "06:55 · higiene", "07:05 · café", "07:15 · mochila/material", "07:22 · calçar", "07:30 · sair"];
  return <div className="grid w-full max-w-4xl gap-3 sm:grid-cols-2">{cards.map((item) => <div key={item} className="rounded-2xl border-4 border-slate-200 bg-white p-5 text-xl font-black text-slate-950">{item}</div>)}</div>;
}

function MessageSeen() {
  return (
    <div className="w-full max-w-md rounded-[38px] border-[10px] border-slate-900 bg-white p-5 text-slate-950 shadow-2xl">
      <div className="mb-5 border-b pb-4 text-center text-lg font-black">Colega</div>
      <div className="ml-auto max-w-[82%] rounded-2xl rounded-br-md bg-blue-500 p-4 text-lg font-semibold text-white">Você consegue me mandar aquela parte do trabalho hoje?</div>
      <p className="mt-2 text-right text-xs font-semibold text-slate-500">Visualizada · 18:42</p>
      <div className="mt-20 rounded-full border-2 border-slate-200 px-4 py-3 text-slate-400">Mensagem...</div>
    </div>
  );
}

function LeftRight() {
  const items = ["DIREITA", "ESQUERDA", "DIREITA", "DIREITA", "ESQUERDA", "ESQUERDA", "DIREITA", "ESQUERDA", "DIREITA", "ESQUERDA", "ESQUERDA", "DIREITA"];
  return <div className="grid w-full max-w-5xl grid-cols-3 gap-4">{items.map((item, i) => <div key={i} className="rounded-3xl border-4 border-slate-200 bg-white px-5 py-8 text-center text-3xl font-black text-slate-950">{item}</div>)}</div>;
}

function RapidNaming() {
  const items = ["A", "●", "M", "■", "S", "▲", "R", "●", "A", "■", "M", "▲", "S", "●", "R", "■", "M", "▲", "A", "●", "S", "■", "R", "▲", "A", "●", "M", "■", "S", "▲"];
  return <div className="grid w-full max-w-5xl grid-cols-6 gap-3 rounded-[28px] bg-white p-5 text-slate-950">{items.map((v, i) => <div key={i} className="flex aspect-square items-center justify-center rounded-xl border-2 border-slate-200 text-3xl font-black">{v}</div>)}</div>;
}

function NumberLine() {
  return (
    <svg viewBox="0 0 1000 260" className="w-full max-w-5xl rounded-[30px] bg-white" aria-label="reta numérica de zero a cem">
      <line x1="90" y1="120" x2="910" y2="120" stroke="#0f172a" strokeWidth="10" strokeLinecap="round" />
      {Array.from({ length: 11 }, (_, i) => <g key={i}><line x1={90 + i * 82} y1="92" x2={90 + i * 82} y2="148" stroke="#0f172a" strokeWidth="5" />{(i === 0 || i === 10) && <text x={90 + i * 82} y="205" textAnchor="middle" fontSize="44" fontWeight="800" fill="#0f172a">{i * 10}</text>}</g>)}
    </svg>
  );
}

function ReadingCard() {
  return (
    <div className="w-full max-w-4xl rounded-[30px] bg-white p-8 text-slate-950 shadow-lg">
      <p className="text-2xl font-semibold leading-[1.75]">Naquela tarde, a escola estava mais silenciosa do que de costume. Lucas guardou os livros, percebeu que começava a chover e decidiu esperar alguns minutos antes de sair. Enquanto aguardava, viu uma colega procurando algo perto da porta. Ele perguntou se precisava de ajuda. Os dois encontraram um caderno que havia caído atrás de uma cadeira. Quando a chuva diminuiu, cada um seguiu seu caminho.</p>
    </div>
  );
}

function EveningPlan() {
  const cards = ["prova amanhã", "trabalho para entregar", "banho", "jantar", "30 min livres"];
  return <div className="grid w-full max-w-4xl gap-4 sm:grid-cols-2">{cards.map((item, i) => <div key={item} className={`rounded-3xl border-4 bg-white p-6 text-center text-2xl font-black text-slate-950 ${i < 2 ? "border-amber-300" : "border-slate-200"}`}>{item}</div>)}<div className="rounded-3xl border-4 border-rose-300 bg-rose-50 p-6 text-center text-2xl font-black text-rose-950 sm:col-span-2">IMPREVISTO: o trabalho vai levar +1 hora</div></div>;
}

function StimulusContent({ kind }: { kind: StimulusKind }) {
  if (["objects", "concepts", "story", "social", "blocks"].includes(kind)) return <VectorScene kind={kind} />;
  if (kind === "dogs15") return <SequenceGrid values={DOGS15} />;
  if (kind === "dogs20") return <SequenceGrid values={DOGS20} />;
  if (kind === "sunmoon") return <SunMoon />;
  if (kind === "dotgrid") return <DotGrid />;
  if (kind === "daynight") return <DayNight />;
  if (kind === "routine") return <Routine />;
  if (kind === "message") return <MessageSeen />;
  if (kind === "symbolgrid") return <SymbolGrid />;
  if (kind === "leftright") return <LeftRight />;
  if (kind === "rapid") return <RapidNaming />;
  if (kind === "numberline") return <NumberLine />;
  if (kind === "reading") return <ReadingCard />;
  if (kind === "evening") return <EveningPlan />;
  return null;
}

function StimulusLibrary({ onClose }: { onClose: () => void }) {
  const [band, setBand] = useState<BandId>("3-4a");
  const [active, setActive] = useState<Stimulus | null>(null);
  const items = useMemo(() => STIMULI.filter((item) => item.band === band), [band]);

  if (active) {
    return (
      <div className="fixed inset-0 z-[120] flex min-h-dvh flex-col bg-slate-950 text-white">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 p-4">
          <Button variant="secondary" onClick={() => setActive(null)}><ChevronLeft className="mr-1 h-4 w-4" /> Voltar</Button>
          <div className="min-w-0 text-center"><p className="truncate text-sm font-black">{active.title}</p><p className="truncate text-xs text-white/60">{BAND_LABELS[active.band]}</p></div>
          <Button variant="secondary" onClick={onClose}><X className="mr-1 h-4 w-4" /> Fechar</Button>
        </div>
        <main className="flex flex-1 flex-col items-center justify-center overflow-auto p-5 sm:p-8">
          <div className="mb-5 max-w-3xl text-center"><p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">Tela da criança</p><h1 className="mt-2 text-2xl font-black sm:text-4xl">{active.subtitle}</h1></div>
          <StimulusContent kind={active.kind} />
        </main>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[110] overflow-y-auto bg-slate-950/95 p-4 text-white backdrop-blur-sm sm:p-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-start justify-between gap-4">
          <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">Sonda Dez</p><h1 className="mt-1 text-3xl font-black">Banco visual integrado</h1><p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/65">Cenas, grades e cartões ficam dentro do próprio aplicativo. Funcionam offline e não dependem de fotos, links externos ou impressão.</p></div>
          <Button variant="secondary" onClick={onClose}><X className="mr-1 h-4 w-4" /> Fechar</Button>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">{(Object.keys(BAND_LABELS) as BandId[]).map((id) => <button key={id} type="button" onClick={() => setBand(id)} className={`min-h-12 rounded-xl border px-3 py-2 text-sm font-black ${band === id ? "border-cyan-300 bg-cyan-300 text-slate-950" : "border-white/15 bg-white/5 text-white"}`}>{BAND_LABELS[id]}</button>)}</div>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{items.map((item) => <button key={item.id} type="button" onClick={() => setActive(item)} className="rounded-[26px] border border-white/10 bg-white/5 p-5 text-left transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-300"><div className="flex items-start justify-between gap-3"><div><p className="text-lg font-black">{item.title}</p><p className="mt-1 text-sm font-semibold text-cyan-200">{item.subtitle}</p></div><Maximize2 className="h-5 w-5 shrink-0 text-white/50" /></div><p className="mt-4 text-sm leading-relaxed text-white/65">{item.instruction}</p></button>)}</div>
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs leading-relaxed text-white/60">Estímulos autorais e sintéticos. Registro observacional piloto; nenhuma tela gera diagnóstico, percentil ou escore normativo.</div>
      </div>
    </div>
  );
}

export default function SondaDezDailyPage() {
  const [libraryOpen, setLibraryOpen] = useState(false);
  return (
    <>
      <div className="mx-auto mb-4 flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 rounded-2xl border border-cyan-200 bg-cyan-50 p-3 text-cyan-950 shadow-sm dark:border-cyan-900 dark:bg-cyan-950/20 dark:text-cyan-100">
        <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-100 dark:bg-cyan-900/40"><Images className="h-5 w-5" /></div><div><p className="text-sm font-black">Estímulos visuais incorporados</p><p className="text-xs opacity-75">Cenas, grades e cartões funcionam offline dentro da Sonda.</p></div></div>
        <Button onClick={() => setLibraryOpen(true)} className="rounded-xl">Abrir banco visual</Button>
      </div>
      <SondaDezBasePage />
      {libraryOpen && <StimulusLibrary onClose={() => setLibraryOpen(false)} />}
    </>
  );
}
