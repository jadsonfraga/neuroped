/**
 * Testes Cognitivos por Faixa Etária — bateria autoral enxuta (reconhecimento
 * visual, fala/leitura, letras/escrita e números/aritmética), um perfil por
 * idade de 1 a 19 anos, apresentada como uma aventura em quatro mundos.
 * Superfície própria, separada da Sonda Dez, com rota /testes-cognitivos.
 *
 * O banco de itens vive em features/cognitive-age/bank.ts: tudo o que o item
 * precisa está na tela (nenhum passo pede lápis, papel ou objeto de fora) e
 * cada item tem uma única resposta certa, conferida pela tela (toque, montagem
 * de letras) ou comparada pelo adulto com a resposta esperada (fala).
 *
 * Verdade clínica: registra pergunta a pergunta e não produz escore, percentil,
 * idade equivalente nem interpretação diagnóstica. Estrelas e medalhas do jogo
 * medem participação e conclusão, nunca acerto — a criança não vê certo/errado.
 */
import { useState, useCallback, useEffect, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClinicalReport } from "@/components/ClinicalReport";
import { SaveToPatient } from "@/components/SaveToPatient";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { celebrate } from "@/lib/confetti";
import { softSuccess, softWhoosh } from "@/lib/softSounds";
import { DEFAULT_HERO, HeroGrid, NEUTRAL_CHEERS, type Hero } from "@/components/aventura";
import EasyGame, { type EasyStep } from "@/components/jogo-facil/EasyGame";
import { useSondaExitGuard } from "@/hooks/useSondaExitGuard";
import { useAuth } from "@/contexts/AuthContext";
import {
  COGNITIVE_MAX_AGE,
  COGNITIVE_MIN_AGE,
  ageProfileLabel,
  buildMatches,
  domainLabel,
  isCognitiveAge,
  itemsFor,
  type CognitiveDomain,
  type CognitiveItem,
} from "@/features/cognitive-age/bank";
import { BuildBody, ChildScreen, SayBody, TapBody, adultHint, expectedText } from "@/features/cognitive-age/screens";
import {
  ArrowLeft,
  Brain,
  Check,
  ChevronRight,
  Flag,
  Map as MapIcon,
  Play,
  RotateCcw,
  ShieldCheck,
  X,
} from "lucide-react";

// ─────────────────────────────── types ───────────────────────────────
type Domain = CognitiveDomain;

interface AnswerRecord {
  prompt: string; // enunciado da pergunta
  correct: string; // resposta esperada
  selected: string | null; // o que a criança tocou / montou, ou o que o adulto marcou na fala
  isCorrect: boolean;
}
interface DomainResult {
  domain: Domain;
  label: string;
  score: number;
  max: number;
  answers: AnswerRecord[]; // registro item-a-item de todas as perguntas e respostas
}

const EASY_EXIT_PROMPT = "Sair ou reiniciar apaga os passos do Modo Fácil registrados nesta tela. Copie ou baixe o resultado antes. Deseja continuar mesmo assim?";
const NATURE =
  "REGISTRO DESCRITIVO — NÃO É ESCORE, PERCENTIL, IDADE EQUIVALENTE NEM DIAGNÓSTICO. Questionário interno autoral; não substitui avaliação psicométrica formal. Leitura e conclusão pertencem ao médico.";

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
  results,
  onEnter,
}: {
  hero: Hero;
  age: number;
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
          {doneCount}/{WORLD_ORDER.length} mundos · {ageProfileLabel(age)}
        </Badge>
      </div>

      <ol className="grid gap-3 sm:grid-cols-2">
        {WORLD_ORDER.map((domain, index) => {
          const world = WORLDS[domain];
          const done = Boolean(results[domain]?.max);
          const phaseCount = itemsFor(age, domain).length;
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
                    {domainLabel(domain, age)} · {world.tagline}
                  </span>
                  <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-background/80 px-2.5 py-1 text-[11px] font-bold">
                    {done ? (
                      <>
                        <span aria-hidden="true">🏅</span> {world.badge}
                      </>
                    ) : (
                      <>
                        <MapIcon className="h-3 w-3" aria-hidden="true" /> {phaseCount} fases
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
  questions: CognitiveItem[];
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

  useEffect(() => {
    if (phase === "registered") nextRef.current?.focus();
  }, [phase]);

  if (!q) return null;
  const isLast = idx + 1 >= questions.length;

  function register(chosen: string, ok: boolean) {
    if (phase !== "question" || !q) return;
    setSelected(chosen);
    setPhase("registered");
    if (ok) setScore((s) => s + 1);
    setAnswers((a) => [...a, { prompt: q.prompt, correct: expectedText(q), selected: chosen, isCorrect: ok }]);
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
            <span className="pointer-events-none absolute -right-3 -top-3 text-6xl opacity-15" aria-hidden="true">
              {world.emoji}
            </span>
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              {hero.emoji} {hero.name} pergunta · {q.kind === "say" ? "a criança responde falando" : q.kind === "build" ? "a criança monta com as letras" : "a criança toca na resposta"}
            </p>
            <p className="relative mt-1 whitespace-pre-line text-base font-semibold leading-relaxed text-foreground sm:text-lg">{q.say}</p>
          </div>

          {q.kind === "tap" && <TapBody item={q} selected={selected} onPick={(option) => register(option, option === q.answer)} />}
          {q.kind === "build" && <BuildBody key={q.id} item={q} onDone={(placed) => register(placed.join(""), buildMatches(q, placed))} />}
          {q.kind === "build" && !q.show && (
            <details className="text-sm text-muted-foreground" data-testid="cognitive-dictation-word">
              <summary className="cursor-pointer font-semibold">Palavra ditada (só o aplicador lê)</summary>
              <p className="mt-1">
                Fale a palavra <strong>{q.target.join("")}</strong> e deixe a criança montar. A tela confere sozinha.
              </p>
            </details>
          )}
          {q.kind === "say" && (
            <div className="space-y-3">
              <SayBody item={q} />
              <details className="text-sm text-muted-foreground" data-testid="cognitive-say-expected">
                <summary className="cursor-pointer font-semibold">Resposta esperada (só o aplicador lê)</summary>
                <p className="mt-1">
                  <strong>{q.expected}</strong>
                </p>
              </details>
              <div className="grid gap-3 sm:grid-cols-2" role="group" aria-label="Registro da resposta falada">
                <button
                  type="button"
                  disabled={phase === "registered"}
                  aria-pressed={selected === "Respondeu certo"}
                  onClick={() => register("Respondeu certo", true)}
                  className="flex min-h-16 items-center justify-center gap-2 rounded-3xl border-4 border-emerald-400 bg-emerald-50 text-lg font-black text-emerald-900 disabled:opacity-60 dark:bg-emerald-950/40 dark:text-emerald-100"
                >
                  <Check className="h-6 w-6" aria-hidden="true" /> Respondeu certo
                </button>
                <button
                  type="button"
                  disabled={phase === "registered"}
                  aria-pressed={selected === "Respondeu errado"}
                  onClick={() => register("Respondeu errado", false)}
                  className="flex min-h-16 items-center justify-center gap-2 rounded-3xl border-4 border-rose-300 bg-rose-50 text-lg font-black text-rose-900 disabled:opacity-60 dark:bg-rose-950/40 dark:text-rose-100"
                >
                  <X className="h-6 w-6" aria-hidden="true" /> Respondeu errado
                </button>
              </div>
            </div>
          )}
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
          <span className="text-3xl motion-safe:animate-in motion-safe:zoom-in-50" aria-hidden="true">
            ⭐
          </span>
          <span className="text-sm font-bold text-amber-950 dark:text-amber-100">{NEUTRAL_CHEERS[idx % NEUTRAL_CHEERS.length]}</span>
          <Button ref={nextRef} size="lg" className="ml-auto gap-1.5 rounded-2xl font-black" onClick={advance}>
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

// ─────────────────────────────── Um mundo ───────────────────────────────
function WorldScreen({
  domain,
  age,
  hero,
  result,
  onComplete,
  onStar,
  onBackToMap,
}: {
  domain: Domain;
  age: number;
  hero: Hero;
  result?: DomainResult;
  onComplete: (r: DomainResult) => void;
  onStar: () => void;
  onBackToMap: () => void;
}) {
  const reduce = useReducedMotion();
  const world = WORLDS[domain];
  const [playing, setPlaying] = useState(false);
  const [round, setRound] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const bank = itemsFor(age, domain);
  const label = domainLabel(domain, age);

  const handleComplete = useCallback(
    (score: number, max: number, answers: AnswerRecord[]) => {
      onComplete({ domain, label, score, max, answers });
      setPlaying(false);
    },
    [domain, label, onComplete],
  );

  function playAgain() {
    onComplete({ domain, label, score: 0, max: 0, answers: [] });
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
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
          <h2 id={`world-${domain}-title`} className={`text-xl font-black leading-tight sm:text-2xl ${world.accent}`}>
            {world.name}
          </h2>
        </div>
        {playing ? (
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
              {hero.emoji} {hero.name} explorou o {world.name} inteiro. Todas as respostas ficaram registradas para o profissional.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Button className="gap-1.5 rounded-2xl font-black" onClick={onBackToMap}>
                <MapIcon className="h-4 w-4" /> Voltar ao mapa
              </Button>
              <Button variant="outline" className="gap-1.5 rounded-2xl" onClick={playAgain}>
                <RotateCcw className="h-4 w-4" /> Jogar de novo
              </Button>
            </div>
          </motion.div>
        ) : !playing ? (
          <div className="rounded-3xl border border-border/70 bg-background/85 p-5 text-center">
            <p className="text-base font-semibold">{world.tagline}</p>
            <p className="mt-1 text-sm text-muted-foreground">{bank.length} fases. A criança toca, monta ou fala; a tela ou o adulto registra e segue para a próxima.</p>
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
        ) : (
          <QuestStage key={round} questions={bank} world={world} hero={hero} onComplete={handleComplete} onStar={onStar} />
        )}
      </div>
    </motion.section>
  );
}

// ─────────────────────────────── Modo Fácil ───────────────────────────────
/** Os 16 itens da idade viram passos lineares do motor compartilhado (EasyGame). */
function stimulusTag(stimulus: string): string {
  const words = stimulus.trim().split(/\s+/);
  return words.length <= 4 ? words.join(" ") : `${words.slice(0, 4).join(" ")}…`;
}
function easyStepsFor(age: number): EasyStep[] {
  return WORLD_ORDER.flatMap((domain) =>
    itemsFor(age, domain).map((item): EasyStep => ({
      id: item.id,
      group: `${WORLDS[domain].emoji} ${WORLDS[domain].name} · ${domainLabel(domain, age)}`,
      // Itens de fala compartilham o enunciado ("O que é isto?"): o título leva o
      // estímulo para o registro identificar qual figura/letra/palavra foi.
      title: item.kind === "say" ? `${item.prompt} · ${stimulusTag(item.stimulus)}` : item.prompt,
      say: item.say,
      hint: adultHint(item),
      visual:
        item.stimulus && item.kind !== "build" ? (
          <p className="whitespace-pre-line rounded-xl bg-muted px-3 py-2 text-sm leading-relaxed text-muted-foreground">
            <span className="font-bold">Na tela da criança:</span> {item.stimulus}
          </p>
        ) : item.kind === "build" && item.show ? (
          <p className="rounded-xl bg-muted px-3 py-2 text-sm leading-relaxed text-muted-foreground">
            <span className="font-bold">Na tela da criança:</span> a palavra {item.stimulus} e as letras embaralhadas
          </p>
        ) : undefined,
      childLabel: item.kind === "say" ? "Mostrar para a criança" : item.kind === "build" ? "Mostrar as letras" : "Mostrar as opções",
      child: ({ onDone }) => <ChildScreen item={item} onDone={onDone} />,
    })),
  );
}

// ─────────────────────────────── MAIN PAGE ───────────────────────────────
export default function TestesCognitivosFaixaEtariaPage() {
  const [ageStr, setAgeStr] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [hero, setHero] = useState<Hero | null>(null);
  const [screen, setScreen] = useState<"hero" | "map" | "world">("hero");
  const [track, setTrack] = useState<"easy" | "guided" | "direct">("guided");
  const direct = track === "direct";
  const easy = track === "easy";
  const [activeWorld, setActiveWorld] = useState<Domain>("visual");
  const [results, setResults] = useState<Partial<Record<Domain, DomainResult>>>({});
  const [stars, setStars] = useState(0);
  const [proOpen, setProOpen] = useState(false);
  const celebratedRef = useRef(false);
  // Modo Fácil: passos já registrados só existem na memória desta tela.
  const [easyProgress, setEasyProgress] = useState(0);
  const { isAuthenticated } = useAuth();
  useSondaExitGuard(easyProgress > 0, !isAuthenticated, EASY_EXIT_PROMPT);

  const age = parseInt(ageStr, 10);
  const validAge = isCognitiveAge(age);

  const handleResult = useCallback((r: DomainResult) => {
    setResults((prev) => {
      const n = { ...prev };
      if (r.max === 0) delete n[r.domain];
      else n[r.domain] = r;
      return n;
    });
  }, []);
  const addStar = useCallback(() => setStars((s) => s + 1), []);

  const completedDomains = WORLD_ORDER.map((d) => results[d]).filter((r): r is DomainResult => Boolean(r && r.max > 0));
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
      answer: `${answer.selected ?? "Não respondida"} (esperado: ${answer.correct})`,
    })),
  );

  function resetAdventure() {
    if (easyProgress > 0 && !window.confirm(EASY_EXIT_PROMPT)) return;
    setEasyProgress(0);
    setConfirmed(false);
    setResults({});
    setStars(0);
    setScreen("hero");
  }

  const easySteps = easy && confirmed && validAge ? easyStepsFor(age) : [];

  return (
    <div className="space-y-5 pb-8">
      {/* Header do profissional */}
      <header className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-violet-500/[0.08] via-card/70 to-blue-500/[0.07] p-5 shadow-sm backdrop-blur sm:p-6">
        <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-gradient-to-br from-violet-400/25 to-fuchsia-400/10 blur-3xl" />
        <div className="relative flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-blue-600 text-white shadow-lg shadow-violet-600/25 ring-1 ring-white/20">
            <Brain className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <Badge className="mb-2 rounded-full bg-violet-100 text-violet-700 hover:bg-violet-100 dark:bg-violet-950 dark:text-violet-300">
              testes cognitivos por faixa etária · {COGNITIVE_MIN_AGE}–{COGNITIVE_MAX_AGE} anos
            </Badge>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Testes Cognitivos por Faixa Etária</h1>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Aventura em quatro mundos — reconhecimento visual, fala/leitura, letras/escrita e números/aritmética — com 4 fases por mundo e um perfil para cada idade de 1 a 19 anos. Tudo o que a fase precisa está na tela: a criança toca na resposta, monta a palavra com as letras ou fala, e o adulto compara com a resposta esperada. Estrelas por participar, medalhas por concluir; nada na tela mostra acerto ou erro à criança. O profissional recebe o registro pergunta a pergunta. Triagem educativa — não substitui avaliação psicométrica formal.
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
                if (easyProgress > 0 && !window.confirm(EASY_EXIT_PROMPT)) return;
                // Só os dígitos iniciais: "1.5", "1,5" ou "-3" não viram 15 nem 3.
                setAgeStr(e.target.value.match(/^\d{0,2}/)?.[0] ?? "");
                resetAdventure();
              }}
              placeholder="ex.: 7"
              className="h-9 w-24"
            />
          </div>
          <div role="tablist" aria-label="Modo de aplicação" data-testid="cognitive-track-tabs" className="flex gap-1.5 rounded-2xl border border-border/60 bg-background/70 p-1">
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
                } else if (direct) {
                  setHero((current) => current ?? DEFAULT_HERO);
                  setScreen("map");
                } else {
                  setScreen(hero ? "map" : "hero");
                }
              }}
            >
              <Play className="h-4 w-4" /> {easy ? "Começar o jogo" : "Iniciar aventura"}
            </Button>
          ) : (
            <Button size="sm" variant="outline" className="gap-1.5" onClick={resetAdventure}>
              <RotateCcw className="h-4 w-4" /> {easy ? "Reiniciar jogo" : "Reiniciar aventura"}
            </Button>
          )}
          {validAge && confirmed && <Badge className="bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300">{ageProfileLabel(age)}</Badge>}
        </div>
        {direct && <p className="relative mt-2 text-xs leading-relaxed text-muted-foreground">Modo direto: pula a escolha de herói. Você entra direto no mapa e escolhe o mundo.</p>}
        {easy && (
          <p className="relative mt-2 text-xs leading-relaxed text-muted-foreground">
            Modo Fácil: informe a idade e toque em Começar. Um passo por vez, nos quatro mundos em sequência: leia a fala, toque em Mostrar, a criança toca, monta ou fala. Toque e montagem conferem sozinhos; na fala, você marca Acertou ou Não acertou. Resultado no fim.
          </p>
        )}
      </header>

      {/* Modo Fácil: motor compartilhado com Sonda Dez, OBS-10 e Reconhecimento Visual */}
      {confirmed && validAge && easy && (
        <EasyGame
          key={`easy-${age}`}
          testid="cognitive-easy"
          title="Testes Cognitivos por Faixa Etária"
          ageLabel={ageProfileLabel(age)}
          nature={NATURE}
          footer="Modo Fácil: toque e montagem de letras conferidos pela tela; fala comparada pelo adulto com a resposta esperada. Sem mapa, herói escolhido ou medalhas por mundo."
          steps={easySteps}
          onProgress={setEasyProgress}
        />
      )}

      {/* Aventura (guiado e direto) */}
      {confirmed && validAge && !easy && (
        <>
          {hero && screen !== "hero" && <AdventureHud hero={hero} stars={stars} badges={badges} onChangeHero={() => setScreen("hero")} />}

          {screen === "hero" && (
            <HeroPicker
              current={hero}
              onPick={(picked) => {
                setHero(picked);
                setScreen("map");
              }}
            />
          )}

          {screen === "map" && hero && (
            <WorldMap
              hero={hero}
              age={age}
              results={results}
              onEnter={(domain) => {
                setActiveWorld(domain);
                setScreen("world");
              }}
            />
          )}

          {screen === "world" && hero && (
            <WorldScreen
              key={`${activeWorld}-${age}`}
              domain={activeWorld}
              age={age}
              hero={hero}
              result={results[activeWorld]}
              onComplete={handleResult}
              onStar={addStar}
              onBackToMap={() => setScreen("map")}
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
              <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${proOpen ? "rotate-90" : ""}`} aria-hidden="true" />
            </button>
            {proOpen && (
              <div id="pro-area" className="space-y-4 border-t border-border/60 p-4 sm:p-5">
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Estrelas contam respostas registradas e medalhas contam mundos concluídos: são marcadores de participação, não escores. O registro abaixo traz cada pergunta, o que a criança tocou, montou ou falou e a resposta esperada, sem pontuação, percentil ou interpretação diagnóstica.
                </p>
                {completedDomains.length > 0 ? (
                  <>
                    <ClinicalReport
                      scaleName="Testes Cognitivos por Faixa Etária"
                      scaleFullName="Reconhecimento visual, fala/leitura, letras/escrita e números/aritmética"
                      items={reportItems}
                      patientAge={ageProfileLabel(age)}
                    />
                    <SaveToPatient scaleName="Testes Cognitivos por Faixa Etária" responses={reportItems} patientAge={ageProfileLabel(age)} />
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
            Digite a idade ({COGNITIVE_MIN_AGE}–{COGNITIVE_MAX_AGE} anos) e toque em <strong>{easy ? "Começar o jogo" : "Iniciar aventura"}</strong>.{" "}
            {easy ? "O jogo passa pelos quatro mundos, um passo por vez." : "A criança escolhe um herói e explora os quatro mundos na ordem que quiser."}
          </p>
        </div>
      )}
    </div>
  );
}
