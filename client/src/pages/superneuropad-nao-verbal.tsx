import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Copy, Download, Ear, EyeOff, Flag, Hand, Pause, Play, RotateCcw, Sparkles, Volume2, VolumeX, X } from "lucide-react";
import { useSpeech } from "@/hooks/useSpeech";
import { celebrate, celebrateBurst } from "@/lib/confetti";
import { softTap } from "@/lib/softSounds";
import { play1Up, playCoin, playJump, playPowerUp } from "@/lib/sounds";
import { downloadTextDocument, safeTextFilename } from "@/lib/shareText";
import { formatClinicalDateTime, localIsoDate } from "@/lib/clinicalDate";
import { DESCRIPTIVE_NOTICE } from "@/lib/descriptiveNotice";
import { Stimulus as VrStimulus } from "@/features/visual-recognition/Stimulus";
import type { Option } from "@/features/super-neuropad/model";
import {
  NV_BREAK_EVERY,
  NV_IDLE_SECONDS,
  NV_PREVIEW_SECONDS,
  NV_STATUS_LABELS,
  NV_TITLE,
  NV_YEARS,
  nvChallengesFor,
  nvOptionOrders,
  nvRecord,
  nvReportText,
  nvSummary,
  type NvRecord,
  type NvYears,
} from "@/features/super-neuropad-nao-verbal/model";
import "@/styles/superneuropad-nao-verbal.css";

type Screen = "inicio" | "aquecimento" | "desafio" | "bolhas" | "fim" | "aplicadora";

const MASCOTS = [
  { emoji: "🦁", name: "Leo" },
  { emoji: "🐼", name: "Pipo" },
  { emoji: "🐸", name: "Tico" },
  { emoji: "🦄", name: "Lua" },
  { emoji: "🐶", name: "Bob" },
] as const;

const STICKERS = ["⭐", "🌈", "🎈", "🍭", "🚀", "🌻", "🦋", "🐠", "🍉", "🎁", "🐞", "🌟"];
const CARD_TINTS = ["bg-rose-100", "bg-sky-100", "bg-amber-100", "bg-lime-100"];
// Posições em % da largura; o tamanho é limitado para nenhuma bolha sair da tela no celular (390 px).
const BUBBLES = [
  { left: 4, top: 16, size: 96 },
  { left: 36, top: 4, size: 112 },
  { left: 66, top: 18, size: 100 },
  { left: 10, top: 54, size: 108 },
  { left: 42, top: 44, size: 92 },
  { left: 66, top: 60, size: 104 },
];

function systemPrefersCalm(): boolean {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

function OptionArt({ option }: { option: Option }) {
  if (option.vr) {
    // `child` evita que o texto alternativo da figura entregue a resposta.
    return (
      <span className="block h-28 w-28 sm:h-36 sm:w-36">
        <VrStimulus id={option.vr} child />
      </span>
    );
  }
  const long = [...option.art].length > 3;
  return (
    <span aria-hidden="true" className={`leading-none ${long ? "text-4xl sm:text-5xl" : "text-7xl sm:text-8xl"}`}>
      {option.art}
    </span>
  );
}

function Toggle({ on, onClick, labelOn, labelOff, iconOn, iconOff }: { on: boolean; onClick: () => void; labelOn: string; labelOff: string; iconOn: React.ReactNode; iconOff: React.ReactNode }) {
  return (
    <button type="button" aria-pressed={on} onClick={onClick} className={`flex items-center gap-2 rounded-full border-2 border-slate-800 px-4 py-2 text-sm font-bold ${on ? "bg-emerald-200" : "bg-white"}`}>
      {on ? iconOn : iconOff} {on ? labelOn : labelOff}
    </button>
  );
}

export default function SuperNeuroPadNaoVerbalPage() {
  const { supported: voiceSupported, speak, cancel } = useSpeech();
  const [screen, setScreen] = useState<Screen>("inicio");
  const [years, setYears] = useState<NvYears | null>(null);
  const [mascotIndex, setMascotIndex] = useState(0);
  const [soundOn, setSoundOn] = useState(true);
  const [voiceOn, setVoiceOn] = useState(true);
  const [calm, setCalm] = useState(false);
  const [seed, setSeed] = useState(() => Date.now() % 100000);
  const [index, setIndex] = useState(0);
  const [records, setRecords] = useState<NvRecord[]>([]);
  const [revealed, setRevealed] = useState(true);
  const [previewLeft, setPreviewLeft] = useState(NV_PREVIEW_SECONDS);
  const [chosen, setChosen] = useState<number | null>(null);
  const [wiggle, setWiggle] = useState(false);
  const [paused, setPaused] = useState(false);
  const [popped, setPopped] = useState<boolean[]>(() => BUBBLES.map(() => false));
  const [copied, setCopied] = useState(false);
  const [generatedAt, setGeneratedAt] = useState("");

  const shownAt = useRef(0);
  const pausedAt = useRef<number | null>(null);
  const pausedTotal = useRef(0);
  const repeats = useRef(0);
  const attentionCalls = useRef(0);

  useEffect(() => setCalm(systemPrefersCalm()), []);
  useEffect(() => () => cancel(), [cancel]);
  // Cada tela nova começa no topo: o mascote e o desafio precisam estar à vista da criança.
  useEffect(() => {
    try { window.scrollTo({ top: 0, behavior: "auto" }); } catch { /* sem janela */ }
  }, [screen, index]);

  const mascot = MASCOTS[mascotIndex];
  const challenges = useMemo(() => (years ? nvChallengesFor(years) : []), [years]);
  const orders = useMemo(() => nvOptionOrders(challenges, seed), [challenges, seed]);
  const current = challenges[index];
  const order = orders[index] ?? [];

  const say = useCallback((text: string) => { if (voiceOn) speak(text, 0.82); }, [voiceOn, speak]);
  const sound = useCallback((fn: () => void) => { if (soundOn) { try { fn(); } catch { /* áudio indisponível */ } } }, [soundOn]);
  const party = useCallback((big = false) => { if (!calm) (big ? celebrateBurst : celebrate)(); }, [calm]);

  // Início de cada desafio: zera contadores, mostra a prévia (memória) ou as opções, e lê o enunciado.
  useEffect(() => {
    if (screen !== "desafio" || !current) return;
    repeats.current = 0;
    attentionCalls.current = 0;
    pausedTotal.current = 0;
    setChosen(null);
    setWiggle(false);
    if (current.item.preview) {
      setRevealed(false);
      setPreviewLeft(NV_PREVIEW_SECONDS);
      say("Olha bem!");
    } else {
      setRevealed(true);
      shownAt.current = Date.now();
      say(current.item.prompt);
    }
  }, [screen, index, current, say]);

  // Contagem da prévia de memória: esconde sozinha e mostra as opções.
  useEffect(() => {
    if (screen !== "desafio" || revealed || paused) return;
    if (previewLeft <= 0) {
      setRevealed(true);
      shownAt.current = Date.now();
      if (current) say(current.item.prompt);
      return;
    }
    const timer = window.setTimeout(() => setPreviewLeft((left) => left - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [screen, revealed, previewLeft, paused, current, say]);

  // Chamada de atenção: sem toque por um tempo, as figuras balançam e o mascote chama (até 2 vezes).
  useEffect(() => {
    if (screen !== "desafio" || !revealed || paused || chosen !== null) return;
    if (attentionCalls.current >= 2) return;
    const timer = window.setTimeout(() => {
      attentionCalls.current += 1;
      setWiggle(true);
      sound(playJump);
      say("Olha aqui! Toque em um!");
      window.setTimeout(() => setWiggle(false), 1800);
    }, NV_IDLE_SECONDS * 1000);
    return () => window.clearTimeout(timer);
  }, [screen, revealed, paused, chosen, index, wiggle, say, sound]);

  const elapsed = () => (Date.now() - shownAt.current - pausedTotal.current) / 1000;

  const advance = useCallback(() => {
    const next = index + 1;
    if (next >= challenges.length) {
      setGeneratedAt(formatClinicalDateTime());
      setScreen("fim");
      sound(play1Up);
      party(true);
      say("Você conseguiu! Muito bem!");
      return;
    }
    setIndex(next);
    if (next % NV_BREAK_EVERY === 0) {
      setPopped(BUBBLES.map(() => false));
      setScreen("bolhas");
      say("Hora das bolhas! Estoura!");
    }
  }, [index, challenges.length, sound, party, say]);

  const answer = (option: Option | null, refusal = false, position: number | null = null) => {
    if (!current || chosen !== null) return;
    cancel();
    const record = nvRecord(current, order, option, { seconds: elapsed(), repeats: repeats.current, attentionCalls: attentionCalls.current, refusal });
    const nextRecords = [...records, record];
    setRecords(nextRecords);
    if (option && position !== null) {
      // Mesma comemoração para qualquer toque: a criança não recebe pista de certo ou errado.
      setChosen(position);
      sound(playCoin);
      party();
      window.setTimeout(advance, 1300);
    } else {
      advance();
    }
  };

  const repeatPrompt = () => {
    if (!current) return;
    repeats.current += 1;
    softTap();
    if (voiceOn) speak(current.item.prompt, 0.78);
  };

  const togglePause = () => {
    if (paused) {
      if (pausedAt.current) pausedTotal.current += Date.now() - pausedAt.current;
      pausedAt.current = null;
      setPaused(false);
    } else {
      cancel();
      pausedAt.current = Date.now();
      setPaused(true);
    }
  };

  const finishNow = () => {
    cancel();
    setGeneratedAt(formatClinicalDateTime());
    setScreen(records.length ? "fim" : "inicio");
  };

  const restart = () => {
    cancel();
    setRecords([]);
    setIndex(0);
    setSeed(Date.now() % 100000);
    setPaused(false);
    setCopied(false);
    setScreen("inicio");
  };

  const start = () => {
    if (!years) return;
    setRecords([]);
    setIndex(0);
    setScreen("aquecimento");
    sound(playPowerUp);
    say(`Oi! Eu sou o ${mascot.name}! Toque na estrela!`);
  };

  const report = useMemo(() => (years ? nvReportText(records, years, DESCRIPTIVE_NOTICE, generatedAt) : ""), [records, years, generatedAt]);
  const summary = useMemo(() => nvSummary(records), [records]);

  const stickerShelf = (
    <div role="img" className="flex min-h-12 flex-wrap items-center justify-center gap-1 text-3xl" aria-label={`Figurinhas ganhas: ${records.filter((r) => r.status === "acerto" || r.status === "erro").length}`}>
      {records.map((record, i) => (record.status === "acerto" || record.status === "erro" ? <span key={i} className="nv-pop-in" aria-hidden="true">{STICKERS[i % STICKERS.length]}</span> : null))}
    </div>
  );

  // ─────────────────────────────── telas ───────────────────────────────
  if (screen === "inicio") {
    return (
      <div data-testid="superneuropad-nao-verbal" className="nv-stage min-h-screen px-4 py-6 sm:px-8">
        <div className="mx-auto max-w-3xl space-y-6">
          <header className="text-center">
            <div className="text-7xl nv-float" aria-hidden="true">{mascot.emoji}</div>
            <h1 className="mt-2 text-3xl font-black sm:text-4xl">{NV_TITLE}</h1>
            <p className="mt-2 text-base font-semibold text-slate-700">
              Brincadeira de tocar em figuras para crianças pequenas que ainda não respondem falando. Até 12 desafios curtos, com voz, sons, animações, figurinhas e pausa das bolhas.
            </p>
          </header>

          <section className="rounded-3xl border-4 border-slate-800 bg-white p-5" aria-labelledby="nv-idade">
            <h2 id="nv-idade" className="text-lg font-black">1. Idade da criança</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {NV_YEARS.map((y) => (
                <button key={y} type="button" aria-pressed={years === y} onClick={() => { softTap(); setYears(y); }} className={`rounded-2xl border-4 border-slate-800 px-5 py-3 text-xl font-black ${years === y ? "bg-amber-300" : "bg-white"}`}>
                  {y} anos
                </button>
              ))}
            </div>
            {years && <p className="mt-2 text-sm font-semibold text-slate-600">{challenges.length} desafios do banco do Super NeuroPad Game de {years} anos, só de tocar ou apontar.</p>}
          </section>

          <section className="rounded-3xl border-4 border-slate-800 bg-white p-5" aria-labelledby="nv-amigo">
            <h2 id="nv-amigo" className="text-lg font-black">2. Amigo da brincadeira</h2>
            <div className="mt-3 flex flex-wrap gap-3">
              {MASCOTS.map((m, i) => (
                <button key={m.name} type="button" aria-pressed={mascotIndex === i} aria-label={m.name} onClick={() => { softTap(); setMascotIndex(i); }} className={`flex h-20 w-20 items-center justify-center rounded-full border-4 border-slate-800 text-5xl ${mascotIndex === i ? "bg-sky-200" : "bg-white"}`}>
                  <span aria-hidden="true">{m.emoji}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border-4 border-slate-800 bg-white p-5" aria-labelledby="nv-sensorial">
            <h2 id="nv-sensorial" className="text-lg font-black">3. Conforto sensorial</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <Toggle on={voiceOn} onClick={() => setVoiceOn((v) => !v)} labelOn="Voz lê o desafio" labelOff="Voz desligada" iconOn={<Volume2 className="h-4 w-4" />} iconOff={<VolumeX className="h-4 w-4" />} />
              <Toggle on={soundOn} onClick={() => setSoundOn((v) => !v)} labelOn="Sons ligados" labelOff="Sons desligados" iconOn={<Volume2 className="h-4 w-4" />} iconOff={<VolumeX className="h-4 w-4" />} />
              <Toggle on={calm} onClick={() => setCalm((v) => !v)} labelOn="Movimento reduzido" labelOff="Animações ligadas" iconOn={<EyeOff className="h-4 w-4" />} iconOff={<Sparkles className="h-4 w-4" />} />
            </div>
            {!voiceSupported && <p className="mt-2 text-sm font-semibold text-amber-800">Este aparelho não tem voz sintetizada: leia o desafio em voz alta.</p>}
          </section>

          <section className="rounded-3xl border-4 border-dashed border-slate-500 bg-white/80 p-5 text-sm font-semibold text-slate-700">
            <p><strong>Aplicadora:</strong> sente ao lado da criança. A voz lê cada desafio; o botão do ouvido repete. Se a criança apontar sem tocar, toque você na figura que ela apontou.</p>
            <p className="mt-2">Toda resposta ganha a mesma festa: o jogo não mostra certo nem errado. Sem toque por {NV_IDLE_SECONDS} s, as figuras balançam e o amigo chama de novo (até 2 vezes). Use “Sem resposta” ou “Recusou” quando for o caso.</p>
            <p className="mt-2">Nada é salvo no aparelho. O registro aparece no fim, para copiar.</p>
          </section>

          <button type="button" disabled={!years} onClick={start} className="nv-card mx-auto flex w-full max-w-sm items-center justify-center gap-3 bg-emerald-300 px-6 py-5 text-2xl font-black disabled:opacity-40">
            <Play className="h-7 w-7" /> Começar
          </button>
        </div>
      </div>
    );
  }

  if (screen === "aquecimento") {
    return (
      <div data-testid="superneuropad-nao-verbal" className={`nv-stage flex min-h-screen flex-col items-center justify-center gap-6 px-4 ${calm ? "nv-calm" : ""}`}>
        <div className="text-8xl nv-float" aria-hidden="true">{mascot.emoji}</div>
        <p className="text-center text-3xl font-black">Toque na estrela!</p>
        <button
          type="button"
          aria-label="Estrela de treino"
          onClick={() => { sound(playCoin); party(); window.setTimeout(() => { setScreen("desafio"); }, 900); }}
          className="nv-card nv-pop-in nv-float flex h-48 w-48 items-center justify-center bg-amber-200 text-9xl"
        >
          <span aria-hidden="true">⭐</span>
        </button>
        <p className="text-sm font-semibold text-slate-600">Treino: não conta no registro.</p>
      </div>
    );
  }

  if (screen === "bolhas") {
    const allPopped = popped.every(Boolean);
    return (
      <div data-testid="superneuropad-nao-verbal" className={`nv-stage relative min-h-screen overflow-hidden px-4 py-6 ${calm ? "nv-calm" : ""}`}>
        <p className="relative z-10 text-center text-3xl font-black">Estoura as bolhas! 🫧</p>
        <div className="relative mx-auto mt-4 h-[60vh] max-w-3xl">
          {BUBBLES.map((bubble, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Bolha ${i + 1}`}
              disabled={popped[i]}
              onClick={() => { sound(softTap); setPopped((p) => p.map((v, j) => (j === i ? true : v))); }}
              className={`nv-bubble absolute ${popped[i] ? "nv-bubble--popped" : ""}`}
              style={{ left: `${bubble.left}%`, top: `${bubble.top}%`, width: `min(${bubble.size}px, 30vw)`, height: `min(${bubble.size}px, 30vw)`, animationDelay: `${i * 0.3}s` }}
            />
          ))}
        </div>
        <div className="relative z-10 flex justify-center">
          <button type="button" onClick={() => { softTap(); setScreen("desafio"); }} className={`nv-card flex items-center gap-2 px-6 py-4 text-xl font-black ${allPopped ? "bg-emerald-300 nv-pop-in" : "bg-white"}`}>
            <Play className="h-6 w-6" /> {allPopped ? "Vamos continuar!" : "Continuar"}
          </button>
        </div>
        <p className="mt-3 text-center text-xs font-semibold text-slate-600">Pausa de brincadeira: não conta no registro.</p>
      </div>
    );
  }

  if (screen === "fim") {
    return (
      <div data-testid="superneuropad-nao-verbal" className={`nv-stage flex min-h-screen flex-col items-center justify-center gap-5 px-4 py-8 ${calm ? "nv-calm" : ""}`}>
        <div className="text-8xl nv-dance" aria-hidden="true">{mascot.emoji}</div>
        <h1 className="text-center text-4xl font-black">Você conseguiu! 🎉</h1>
        <div className="max-w-xl rounded-3xl border-4 border-slate-800 bg-white p-4">{stickerShelf}</div>
        <button type="button" onClick={() => { softTap(); cancel(); setScreen("aplicadora"); }} className="nv-card flex items-center gap-2 bg-sky-200 px-6 py-4 text-lg font-black">
          <Hand className="h-6 w-6" /> Área da aplicadora
        </button>
      </div>
    );
  }

  if (screen === "aplicadora" && years) {
    return (
      <div data-testid="superneuropad-nao-verbal" className="min-h-screen bg-white px-4 py-6 sm:px-8">
        <div className="mx-auto max-w-4xl space-y-5">
          <h1 className="text-2xl font-black">{NV_TITLE} · registro da aplicação</h1>
          <p className="text-sm font-semibold text-slate-600">{years} anos · {generatedAt} · {DESCRIPTIVE_NOTICE}</p>
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(["acerto", "erro", "sem_resposta", "recusa"] as const).map((status) => (
              <div key={status} className="rounded-2xl border-2 border-slate-300 p-3">
                <dt className="text-xs font-bold text-slate-600">{NV_STATUS_LABELS[status]}</dt>
                <dd className="text-3xl font-black">{summary.counts[status]}</dd>
              </div>
            ))}
          </dl>
          <p className="text-sm font-semibold">
            Mediana do tempo até o toque: {summary.medianSeconds === null ? "—" : `${summary.medianSeconds} s`} · Enunciados repetidos: {summary.repeats} · Chamadas de atenção: {summary.attentionCalls} · Toques por posição: {summary.touchesByPosition.length ? summary.touchesByPosition.map((c, i) => `${i + 1}ª ${c}`).join(", ") : "—"}
          </p>
          <div className="overflow-x-auto rounded-2xl border-2 border-slate-300" tabIndex={0} role="region" aria-label="Desafios aplicados">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-slate-100">
                <tr><th scope="col" className="p-2">#</th><th scope="col" className="p-2">Desafio</th><th scope="col" className="p-2">Esperado</th><th scope="col" className="p-2">Tocou</th><th scope="col" className="p-2">Registro</th><th scope="col" className="p-2">Tempo</th></tr>
              </thead>
              <tbody>
                {records.map((record, i) => (
                  <tr key={`${record.id}-${i}`} className="border-t border-slate-200 align-top">
                    <td className="p-2">{i + 1}</td>
                    <td className="p-2"><span className="font-semibold">{record.prompt}</span><br /><span className="text-xs text-slate-500">{record.phase} · {record.ref}</span></td>
                    <td className="p-2">{record.expected}</td>
                    <td className="p-2">{record.given}</td>
                    <td className="p-2">{NV_STATUS_LABELS[record.status]}{record.repeats ? ` · repetido ${record.repeats}×` : ""}</td>
                    <td className="p-2">{record.seconds} s</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={async () => { try { await navigator.clipboard.writeText(report); setCopied(true); } catch { setCopied(false); } }} className="flex items-center gap-2 rounded-full border-2 border-slate-800 bg-amber-200 px-4 py-2 font-bold">
              <Copy className="h-4 w-4" /> {copied ? "Copiado" : "Copiar registro"}
            </button>
            <button type="button" onClick={() => downloadTextDocument(report, safeTextFilename(`superneuropad-nao-verbal-${localIsoDate()}`))} className="flex items-center gap-2 rounded-full border-2 border-slate-800 bg-white px-4 py-2 font-bold">
              <Download className="h-4 w-4" /> Baixar .txt
            </button>
            <button type="button" onClick={restart} className="flex items-center gap-2 rounded-full border-2 border-slate-800 bg-white px-4 py-2 font-bold">
              <RotateCcw className="h-4 w-4" /> Nova sessão
            </button>
          </div>
          <p className="text-xs font-semibold text-slate-500">Os desafios vêm do banco do Super NeuroPad Game da idade (enunciado, resposta esperada e origem preservados). A mesma comemoração foi dada a cada toque. O registro não classifica nem sugere diagnóstico; a interpretação é do profissional.</p>
        </div>
      </div>
    );
  }

  // ─────────────────────────────── desafio ───────────────────────────────
  if (!current) return null;
  const { item } = current;
  return (
    <div data-testid="superneuropad-nao-verbal" className={`nv-stage relative flex min-h-screen flex-col px-3 py-3 sm:px-6 ${calm ? "nv-calm" : ""}`}>
      <nav aria-label="Controles da aplicadora" className="flex flex-wrap items-center justify-between gap-1.5 text-xs font-bold">
        <span className="rounded-full bg-white/80 px-3 py-1">{index + 1} de {challenges.length}</span>
        <div className="flex flex-wrap justify-end gap-1.5">
          <button type="button" onClick={() => answer(null)} disabled={chosen !== null || !revealed} className="rounded-full border-2 border-slate-700 bg-white px-2.5 py-1 disabled:opacity-40">Sem resposta</button>
          <button type="button" onClick={() => answer(null, true)} disabled={chosen !== null || !revealed} className="rounded-full border-2 border-slate-700 bg-white px-2.5 py-1 disabled:opacity-40">Recusou</button>
          <button type="button" onClick={togglePause} className="flex items-center gap-1 rounded-full border-2 border-slate-700 bg-white px-2.5 py-1">{paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />} {paused ? "Voltar" : "Pausar"}</button>
          <button type="button" onClick={finishNow} className="flex items-center gap-1 rounded-full border-2 border-slate-700 bg-white px-2.5 py-1"><Flag className="h-3.5 w-3.5" /> Encerrar</button>
        </div>
      </nav>

      <div className="mt-3 flex items-center justify-center gap-3">
        <div className={`text-5xl sm:text-7xl ${chosen !== null ? "nv-dance" : "nv-float"}`} aria-hidden="true">{mascot.emoji}</div>
        <div className="max-w-xl rounded-3xl border-4 border-slate-800 bg-white px-3 py-2 text-center text-xl font-black sm:px-4 sm:py-3 sm:text-3xl">
          {revealed ? item.prompt : "Olha bem!"}
        </div>
        <button type="button" onClick={repeatPrompt} aria-label="Ouvir o desafio de novo" className="nv-card flex h-16 w-16 shrink-0 items-center justify-center bg-amber-200">
          <Ear className="h-8 w-8" />
        </button>
      </div>

      {!revealed && item.preview && (
        <div className="mt-8 flex flex-col items-center gap-4">
          <div className="nv-pop-in text-8xl" aria-label={`Figuras mostradas: ${item.preview}`}>{item.preview}</div>
          <div role="timer" aria-label={`Some em ${previewLeft} segundos`} className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-slate-800 bg-amber-300 text-2xl font-black">{previewLeft}</div>
        </div>
      )}

      {revealed && (
        <>
          {item.stimulusVr && (
            <div className="mt-4 flex justify-center"><span className="nv-pop-in block h-32 w-32 rounded-3xl border-4 border-slate-800 bg-white p-2"><VrStimulus id={item.stimulusVr} child /></span></div>
          )}
          {item.stimulus && <p className="nv-pop-in mt-4 text-center text-5xl font-black sm:text-6xl" aria-label={`Modelo: ${item.stimulus}`}>{item.stimulus}</p>}
          <div role="group" aria-label="Figuras para tocar" className={`mx-auto mt-6 grid w-full max-w-4xl flex-1 content-center gap-4 ${order.length <= 2 ? "grid-cols-2" : order.length === 3 ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-4"}`}>
            {order.map((option, position) => (
              <button
                key={`${index}-${option.label}-${position}`}
                type="button"
                aria-label={option.vr ? `Figura ${position + 1}` : `Figura ${position + 1}: ${option.art}`}
                disabled={chosen !== null || paused}
                onClick={() => answer(option, false, position)}
                style={{ animationDelay: `${position * 0.18}s` }}
                className={`nv-card nv-pop-in flex min-h-40 items-center justify-center p-3 ${option.vr ? "bg-white" : CARD_TINTS[position % CARD_TINTS.length]} ${wiggle ? "nv-wiggle" : ""} ${chosen === position ? "nv-chosen bg-amber-300" : ""} ${chosen !== null && chosen !== position ? "grayscale" : ""}`}
              >
                <OptionArt option={option} />
              </button>
            ))}
          </div>
        </>
      )}

      <div className="mt-4 rounded-3xl bg-white/70 p-2">{stickerShelf}</div>

      {paused && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-white/90">
          <div className="text-7xl" aria-hidden="true">😴</div>
          <p className="text-2xl font-black">Pausa</p>
          <button type="button" onClick={togglePause} className="nv-card flex items-center gap-2 bg-emerald-300 px-6 py-4 text-xl font-black"><Play className="h-6 w-6" /> Voltar</button>
          <button type="button" onClick={finishNow} className="flex items-center gap-1 text-sm font-bold underline"><X className="h-4 w-4" /> Encerrar a sessão</button>
        </div>
      )}
    </div>
  );
}
