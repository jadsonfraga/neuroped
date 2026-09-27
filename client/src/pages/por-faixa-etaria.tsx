/**
 * Por Faixa Etária — ditado e leitura, 5 a 19 anos, com registro detalhado de
 * acertos e erros por item. Reaproveita o banco e as telas dos Testes
 * Cognitivos por Faixa Etária (features/cognitive-age): mesmos itens, mesma
 * conferência automática de toque e montagem, sem duplicar conteúdo clínico.
 * Superfície própria, restrita aos domínios de leitura e escrita/ditado.
 *
 * Verdade clínica: contagem descritiva de acertos e não-acertos por item —
 * nunca escore, percentil, idade equivalente, ponto de corte ou diagnóstico.
 * A criança não vê certo/errado na tela; a leitura e a conclusão pertencem
 * ao médico.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ClinicalReport } from "@/components/ClinicalReport";
import { SaveToPatient } from "@/components/SaveToPatient";
import { BrandMark } from "@/components/BrandAssets";
import { celebrate } from "@/lib/confetti";
import { softSuccess, softWhoosh } from "@/lib/softSounds";
import {
  ageProfileLabel,
  buildMatches,
  domainLabel,
  itemsFor,
  type CognitiveDomain,
} from "@/features/cognitive-age/bank";
import { BuildBody, SayBody, TapBody, expectedText } from "@/features/cognitive-age/screens";
import { Check, ChevronRight, Play, RotateCcw, ShieldCheck, X } from "lucide-react";

const MIN_AGE = 5;
const MAX_AGE = 19;

interface BlockMeta {
  domain: CognitiveDomain;
  title: string;
  emoji: string;
  blurb: string;
  surface: string;
  accent: string;
}

const BLOCKS: BlockMeta[] = [
  {
    domain: "leitura",
    title: "Leitura",
    emoji: "📖",
    blurb: "A criança lê em voz alta ou fala; você compara com a resposta esperada.",
    surface: "from-sky-300/40 via-cyan-100/60 to-background dark:from-sky-900/40 dark:via-sky-950/30",
    accent: "text-sky-700 dark:text-sky-300",
  },
  {
    domain: "escrita",
    title: "Ditado e escrita",
    emoji: "✏️",
    blurb: "A criança escreve a palavra ditada e revisa ortografia; a tela confere sozinha.",
    surface: "from-amber-300/40 via-orange-100/60 to-background dark:from-amber-900/40 dark:via-amber-950/30",
    accent: "text-amber-700 dark:text-amber-300",
  },
];

const NATURE =
  "REGISTRO DESCRITIVO — NÃO É ESCORE, PERCENTIL, IDADE EQUIVALENTE NEM DIAGNÓSTICO. Questionário interno autoral (mesmo banco dos Testes Cognitivos por Faixa Etária); não substitui avaliação psicométrica formal. Leitura e conclusão pertencem ao médico.";

function isValidAge(age: number): boolean {
  return Number.isInteger(age) && age >= MIN_AGE && age <= MAX_AGE;
}

interface AnswerRecord {
  prompt: string;
  correct: string;
  selected: string | null;
  isCorrect: boolean;
}
interface BlockResult {
  domain: CognitiveDomain;
  title: string;
  acertos: number;
  total: number;
  answers: AnswerRecord[];
}

// ─────────────────────────────── bloco em andamento ───────────────────────────────
function BlockRunner({
  block,
  age,
  onComplete,
}: {
  block: BlockMeta;
  age: number;
  onComplete: (result: BlockResult) => void;
}) {
  const questions = itemsFor(age, block.domain);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [phase, setPhase] = useState<"pergunta" | "registrado">("pergunta");
  const nextRef = useRef<HTMLButtonElement>(null);
  const advancing = useRef(false);
  useEffect(() => {
    advancing.current = false;
  }, [idx]);
  useEffect(() => {
    if (phase === "registrado") nextRef.current?.focus();
  }, [phase]);

  const q = questions[idx];
  if (!q) {
    return (
      <p className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
        Nenhum item disponível para esta idade neste bloco.
      </p>
    );
  }
  const isLast = idx + 1 >= questions.length;

  function register(chosen: string, ok: boolean) {
    if (phase !== "pergunta") return;
    setSelected(chosen);
    setPhase("registrado");
    setAnswers((a) => [...a, { prompt: q.prompt, correct: expectedText(q), selected: chosen, isCorrect: ok }]);
  }

  function advance() {
    if (advancing.current || phase !== "registrado") return;
    advancing.current = true;
    if (isLast) {
      softSuccess();
      const finalAnswers = answers;
      onComplete({
        domain: block.domain,
        title: block.title,
        acertos: finalAnswers.filter((a) => a.isCorrect).length,
        total: finalAnswers.length,
        answers: finalAnswers,
      });
      return;
    }
    softWhoosh();
    setIdx((i) => Math.min(i + 1, questions.length - 1));
    setSelected(null);
    setPhase("pergunta");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <ol className="flex flex-wrap items-center gap-1.5" aria-label={`Item ${Math.min(idx + 1, questions.length)} de ${questions.length}`}>
          {questions.map((_, i) => {
            const state = i < idx ? "done" : i === idx ? "now" : "next";
            return (
              <li
                key={i}
                aria-hidden="true"
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-black transition ${
                  state === "done" ? "bg-amber-300 text-amber-950" : state === "now" ? "bg-primary text-primary-foreground ring-4 ring-primary/25" : "bg-muted text-muted-foreground"
                }`}
              >
                {state === "done" ? "✓" : i + 1}
              </li>
            );
          })}
        </ol>
        <Badge variant="outline" className="text-[11px]">
          Item {idx + 1} de {questions.length}
        </Badge>
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-background/80 p-5 shadow-sm sm:p-6">
        <span className="pointer-events-none absolute -right-3 -top-3 text-6xl opacity-15" aria-hidden="true">
          {block.emoji}
        </span>
        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          {domainLabel(block.domain, age)} · {q.kind === "say" ? "a criança responde falando" : q.kind === "build" ? "a criança monta com as letras" : "a criança toca na resposta"}
        </p>
        <p className="relative mt-1 whitespace-pre-line text-base font-semibold leading-relaxed text-foreground sm:text-lg">{q.say}</p>
      </div>

      {q.kind === "tap" && <TapBody item={q} selected={selected} onPick={(option) => register(option, option === q.answer)} />}
      {q.kind === "build" && <BuildBody key={q.id} item={q} onDone={(placed) => register(placed.join(""), buildMatches(q, placed))} />}
      {q.kind === "build" && !q.show && (
        <details className="text-sm text-muted-foreground" data-testid="idade-dictation-word">
          <summary className="cursor-pointer font-semibold">Palavra ditada (só o aplicador lê)</summary>
          <p className="mt-1">
            Fale a palavra <strong>{q.target.join("")}</strong> e deixe a criança montar. A tela confere sozinha.
          </p>
        </details>
      )}
      {q.kind === "say" && (
        <div className="space-y-3">
          <SayBody item={q} />
          <details className="text-sm text-muted-foreground" data-testid="idade-say-expected">
            <summary className="cursor-pointer font-semibold">Resposta esperada (só o aplicador lê)</summary>
            <p className="mt-1">
              <strong>{q.expected}</strong>
            </p>
          </details>
          <div className="grid gap-3 sm:grid-cols-2" role="group" aria-label="Registro da resposta falada">
            <button
              type="button"
              disabled={phase === "registrado"}
              aria-pressed={selected === "Respondeu certo"}
              onClick={() => register("Respondeu certo", true)}
              className="flex min-h-16 items-center justify-center gap-2 rounded-3xl border-4 border-emerald-400 bg-emerald-50 text-lg font-black text-emerald-900 disabled:opacity-60 dark:bg-emerald-950/40 dark:text-emerald-100"
            >
              <Check className="h-6 w-6" aria-hidden="true" /> Respondeu certo
            </button>
            <button
              type="button"
              disabled={phase === "registrado"}
              aria-pressed={selected === "Respondeu errado"}
              onClick={() => register("Respondeu errado", false)}
              className="flex min-h-16 items-center justify-center gap-2 rounded-3xl border-4 border-rose-300 bg-rose-50 text-lg font-black text-rose-900 disabled:opacity-60 dark:bg-rose-950/40 dark:text-rose-100"
            >
              <X className="h-6 w-6" aria-hidden="true" /> Respondeu errado
            </button>
          </div>
        </div>
      )}

      {phase === "registrado" && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-amber-300 bg-amber-50/80 p-3 dark:border-amber-700 dark:bg-amber-950/30" role="status">
          <span className="text-3xl" aria-hidden="true">
            {answers[answers.length - 1]?.isCorrect ? "✅" : "📝"}
          </span>
          <span className="text-sm font-bold text-amber-950 dark:text-amber-100">Resposta registrada.</span>
          <Button ref={nextRef} size="lg" className="ml-auto gap-1.5 rounded-2xl font-black" onClick={advance}>
            {isLast ? (
              <>
                Ver resultado do bloco <ChevronRight className="h-4 w-4" />
              </>
            ) : (
              <>
                Próximo item <ChevronRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────── resumo de um bloco concluído ───────────────────────────────
function BlockSummary({ block, result, onNext, nextLabel }: { block: BlockMeta; result: BlockResult; onNext?: () => void; nextLabel?: string }) {
  const erros = result.total - result.acertos;
  return (
    <div className={`rounded-3xl border border-border/60 bg-gradient-to-br p-5 text-center shadow-sm sm:p-6 ${block.surface}`}>
      <div className="text-5xl" aria-hidden="true">
        {block.emoji}
      </div>
      <p className={`mt-2 text-lg font-black ${block.accent}`}>{block.title} concluído</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-emerald-300 bg-emerald-50/90 p-4 dark:bg-emerald-950/40">
          <div className="text-3xl font-black tabular-nums text-emerald-900 dark:text-emerald-100">{result.acertos}</div>
          <div className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">acertos</div>
        </div>
        <div className="rounded-2xl border border-rose-300 bg-rose-50/90 p-4 dark:bg-rose-950/40">
          <div className="text-3xl font-black tabular-nums text-rose-900 dark:text-rose-100">{erros}</div>
          <div className="text-sm font-semibold text-rose-900 dark:text-rose-100">não acertos</div>
        </div>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">de {result.total} itens · registro descritivo, não é escore</p>
      {onNext && (
        <Button size="lg" className="mt-4 gap-1.5 rounded-2xl font-black" onClick={onNext}>
          {nextLabel} <ChevronRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

// ─────────────────────────────── página principal ───────────────────────────────
export default function PorFaixaEtariaPage() {
  const [ageStr, setAgeStr] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [blockIndex, setBlockIndex] = useState(0);
  const [results, setResults] = useState<Partial<Record<CognitiveDomain, BlockResult>>>({});
  const [proOpen, setProOpen] = useState(false);
  const celebratedRef = useRef(false);

  const age = parseInt(ageStr, 10);
  const validAge = isValidAge(age);
  const activeBlock = BLOCKS[blockIndex];
  const activeResult = activeBlock ? results[activeBlock.domain] : undefined;
  const allDone = BLOCKS.every((b) => results[b.domain]);

  const handleComplete = useCallback((result: BlockResult) => {
    setResults((prev) => ({ ...prev, [result.domain]: result }));
  }, []);

  useEffect(() => {
    if (allDone && !celebratedRef.current) {
      celebratedRef.current = true;
      celebrate();
    }
    if (!allDone) celebratedRef.current = false;
  }, [allDone]);

  function reset() {
    setConfirmed(false);
    setBlockIndex(0);
    setResults({});
  }

  const completedBlocks = BLOCKS.map((b) => results[b.domain]).filter((r): r is BlockResult => Boolean(r));
  const totalAcertos = completedBlocks.reduce((sum, r) => sum + r.acertos, 0);
  const totalItens = completedBlocks.reduce((sum, r) => sum + r.total, 0);
  const totalErros = totalItens - totalAcertos;
  const reportItems = completedBlocks.flatMap((result) =>
    result.answers.map((answer) => ({
      question: `[${result.title}] ${answer.prompt}`,
      answer: `${answer.selected ?? "Não respondida"} (esperado: ${answer.correct})`,
    })),
  );

  return (
    <div className="space-y-5 pb-8">
      <header className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-sky-500/[0.08] via-card/70 to-amber-500/[0.07] p-5 shadow-sm backdrop-blur sm:p-6">
        <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-gradient-to-br from-sky-400/25 to-amber-400/10 blur-3xl" />
        <div className="relative flex items-start gap-3">
          <BrandMark size="md" />
          <div className="min-w-0 flex-1">
            <Badge className="mb-2 rounded-full bg-sky-100 text-sky-700 hover:bg-sky-100 dark:bg-sky-950 dark:text-sky-300">
              por faixa etária · {MIN_AGE}–{MAX_AGE} anos
            </Badge>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Por Faixa Etária</h1>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Ditado e leitura no padrão de cada idade, de {MIN_AGE} a {MAX_AGE} anos: a criança lê em voz alta, responde sobre o texto e escreve a palavra ditada. Cada item é registrado como acerto ou não acerto, para que o desempenho seja avaliado em detalhe pelo profissional. Nada na tela mostra certo ou errado à criança. Triagem educativa — não substitui avaliação psicométrica formal.
            </p>
          </div>
        </div>

        <div className="relative mt-4 flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="idade-faixa" className="mb-1 block text-xs font-semibold text-muted-foreground">
              Idade da criança (anos)
            </label>
            <Input
              id="idade-faixa"
              inputMode="numeric"
              value={ageStr}
              onChange={(e) => {
                reset();
                setAgeStr(e.target.value.match(/^\d{0,2}/)?.[0] ?? "");
              }}
              placeholder="ex.: 8"
              className="h-9 w-24"
            />
          </div>
          {!confirmed ? (
            <Button size="sm" disabled={!validAge} className="gap-1.5" onClick={() => setConfirmed(true)}>
              <Play className="h-4 w-4" /> Começar
            </Button>
          ) : (
            <Button size="sm" variant="outline" className="gap-1.5" onClick={reset}>
              <RotateCcw className="h-4 w-4" /> Reiniciar
            </Button>
          )}
          {validAge && confirmed && <Badge className="bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300">{ageProfileLabel(age)}</Badge>}
        </div>
      </header>

      {!confirmed && (
        <div className="space-y-2 rounded-3xl border border-dashed border-border p-8 text-center">
          <div className="text-4xl" aria-hidden="true">
            📖✏️
          </div>
          <p className="text-sm text-muted-foreground">
            Digite a idade ({MIN_AGE}–{MAX_AGE} anos) e toque em <strong>Começar</strong>. Primeiro o bloco de leitura, depois o de ditado e escrita.
          </p>
        </div>
      )}

      {confirmed && validAge && activeBlock && (
        <section className={`rounded-3xl border border-border/60 bg-gradient-to-br p-4 shadow-sm sm:p-6 ${activeBlock.surface}`} aria-labelledby="active-block-title">
          <div className="mb-4 flex items-center gap-3">
            <span className="text-4xl" aria-hidden="true">
              {activeBlock.emoji}
            </span>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Bloco {blockIndex + 1} de {BLOCKS.length}
              </p>
              <h2 id="active-block-title" className={`text-xl font-black leading-tight sm:text-2xl ${activeBlock.accent}`}>
                {activeBlock.title}
              </h2>
              <p className="text-xs text-muted-foreground">{activeBlock.blurb}</p>
            </div>
          </div>

          {activeResult ? (
            <BlockSummary
              block={activeBlock}
              result={activeResult}
              {...(blockIndex + 1 < BLOCKS.length
                ? {
                    nextLabel: `Ir para ${BLOCKS[blockIndex + 1].title}`,
                    onNext: () => setBlockIndex((i) => Math.min(i + 1, BLOCKS.length - 1)),
                  }
                : {})}
            />
          ) : (
            <BlockRunner block={activeBlock} age={age} onComplete={handleComplete} />
          )}
        </section>
      )}

      {confirmed && validAge && allDone && (
        <section className="rounded-3xl border border-amber-300 bg-gradient-to-br from-amber-100 via-yellow-50 to-background p-5 text-center shadow-sm dark:border-amber-700 dark:from-amber-950/50 dark:via-amber-950/20" role="status">
          <div className="text-5xl" aria-hidden="true">
            🏆
          </div>
          <h2 className="mt-2 text-xl font-black tracking-tight sm:text-2xl">Avaliação completa</h2>
          <p className="mt-1 text-sm text-muted-foreground">Leitura e ditado/escrita concluídos para {ageProfileLabel(age)}.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-emerald-300 bg-emerald-50/90 p-4 dark:bg-emerald-950/40">
              <div className="text-3xl font-black tabular-nums text-emerald-900 dark:text-emerald-100">{totalAcertos}</div>
              <div className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">acertos</div>
            </div>
            <div className="rounded-2xl border border-rose-300 bg-rose-50/90 p-4 dark:bg-rose-950/40">
              <div className="text-3xl font-black tabular-nums text-rose-900 dark:text-rose-100">{totalErros}</div>
              <div className="text-sm font-semibold text-rose-900 dark:text-rose-100">não acertos</div>
            </div>
            <div className="rounded-2xl border border-border bg-background/90 p-4">
              <div className="text-3xl font-black tabular-nums">{totalItens}</div>
              <div className="text-sm font-semibold text-muted-foreground">itens no total</div>
            </div>
          </div>
        </section>
      )}

      {confirmed && validAge && (
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
                {completedBlocks.length === 0
                  ? "O registro aparece aqui assim que um bloco for concluído."
                  : `${completedBlocks.length} de ${BLOCKS.length} blocos registrados · ${reportItems.length} itens · ${totalAcertos} acertos · ${totalErros} não acertos`}
              </span>
            </span>
            <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${proOpen ? "rotate-90" : ""}`} aria-hidden="true" />
          </button>
          {proOpen && (
            <div id="pro-area" className="space-y-4 border-t border-border/60 p-4 sm:p-5">
              <p className="text-xs leading-relaxed text-muted-foreground">{NATURE}</p>
              {completedBlocks.length > 0 ? (
                <>
                  <ClinicalReport
                    scaleName="Por Faixa Etária · Ditado e Leitura"
                    scaleFullName="Leitura em voz alta, compreensão de texto e ditado/escrita por faixa etária"
                    items={reportItems}
                    patientAge={ageProfileLabel(age)}
                  />
                  <SaveToPatient scaleName="Por Faixa Etária · Ditado e Leitura" responses={reportItems} patientAge={ageProfileLabel(age)} />
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum bloco concluído ainda.</p>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

export { MIN_AGE as PFE_MIN_AGE, MAX_AGE as PFE_MAX_AGE, isValidAge as isPorFaixaEtariaAge };
