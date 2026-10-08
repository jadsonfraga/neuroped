import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useSpeech } from "@/hooks/useSpeech";
import { useIssuer, issuerCredentials } from "@/lib/issuer";
import { issuerLines } from "@/features/super-neuropad/pdf";
import { formatClinicalDateTime } from "@/lib/clinicalDate";
import { safeTextFilename } from "@/lib/shareText";
import { MAX_GAME_AGE, MIN_GAME_AGE, bandForAge, fluencyWords, type ArithItem, type BandBank, type ComprehensionQuestion, type DecodeItem, type DitadoItem } from "./bank";
import {
  FLUENCY_SECONDS, GAME_STORAGE_KEY, GAME_VERSION, LEVEL_LABEL, SESSION_CAP_SECONDS, WORLDS,
  classifyDitado, encouragementFor, newGame, nextItemFor, recordFluency, recordResponse, skipWorld, starsFor, summarizeGame, tick, worldTarget,
  type GameState, type ItemResponse, type WorldId,
} from "./engine";
import { GAME_DISCLAIMER, OP_LABEL, decimalBr, fluencyText, buildGameDocSpec, buildGameRecord, gameResponseItems, outcomeLabel, tallyText } from "./report";

const LazySaveToPatient = lazy(() =>
  import("@/components/SaveToPatient").then(({ SaveToPatient: Component }) => ({ default: Component })),
);

const AVATARS = [["🦊", "Raposa"], ["🐼", "Panda"], ["🦖", "Dino"], ["🚀", "Foguete"]] as const;
type Screen = "inicio" | "mapa" | "jogo" | "fim" | "painel";

function loadSaved(): GameState | null {
  try {
    const raw = localStorage.getItem(GAME_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GameState;
    return parsed && parsed.version === 1 && parsed.worlds ? parsed : null;
  } catch {
    return null;
  }
}

function Stars({ n }: { n: number }) {
  return (
    <span className="drx-stars" aria-label={`${n} de 3 estrelas`}>
      <span aria-hidden="true">{"★".repeat(n)}{"☆".repeat(3 - n)}</span>
    </span>
  );
}

export default function DyslexiaGame() {
  const [game, setGame] = useState<GameState | null>(loadSaved);
  const [screen, setScreen] = useState<Screen>(() => {
    const saved = loadSaved();
    if (!saved) return "inicio";
    return saved.endedReason ? "fim" : "mapa";
  });
  const [world, setWorld] = useState<WorldId | null>(null);
  const [paused, setPaused] = useState(false);
  const [cheer, setCheer] = useState("");
  const [savedPatient, setSavedPatient] = useState(false);
  // Formulário de início
  const [age, setAge] = useState<number | null>(null);
  const [nome, setNome] = useState("");
  const [examinador, setExaminador] = useState("");
  const [avatar, setAvatar] = useState<string>(AVATARS[0][0]);

  const rootRef = useRef<HTMLElement | null>(null);
  const firstScreen = useRef(true);
  const { toast } = useToast();
  const { issuer } = useIssuer();
  const speech = useSpeech();
  const bank: BandBank | null = useMemo(() => bandForAge(game?.idade ?? null), [game?.idade]);

  useEffect(() => {
    if (game) localStorage.setItem(GAME_STORAGE_KEY, JSON.stringify(game));
  }, [game]);

  // Relógio ativo da sessão: corre só no mapa/jogo e fora da pausa.
  const running = !!game && !game.endedReason && !paused && (screen === "mapa" || screen === "jogo");
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setGame((g) => (g ? tick(g, 1000) : g)), 1000);
    return () => window.clearInterval(id);
  }, [running]);
  useEffect(() => {
    const onHide = () => { if (document.visibilityState === "hidden") setPaused(true); };
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, []);
  // Cada troca de tela (mapa, mundo, fim, painel) volta ao topo do jogo, para a
  // criança nunca começar um mundo no meio da página.
  useEffect(() => {
    if (firstScreen.current) { firstScreen.current = false; return; }
    const el = rootRef.current;
    if (!el || typeof el.scrollIntoView !== "function") return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" });
  }, [screen, world]);
  const { cancel: cancelSpeech } = speech;
  const ended = game?.endedReason;
  useEffect(() => {
    if (ended && (screen === "mapa" || screen === "jogo")) {
      cancelSpeech();
      setWorld(null);
      setScreen("fim");
    }
  }, [ended, screen, cancelSpeech]);

  /** Aplica uma transição do motor preservando o relógio que o tick já avançou. */
  function apply(next: GameState, finishedWorld: boolean) {
    setGame((cur) => (cur && cur.endedReason === "tempo" ? cur : { ...next, activeMs: Math.max(cur?.activeMs ?? 0, next.activeMs) }));
    if (finishedWorld) {
      speech.cancel();
      setWorld(null);
      setScreen(next.endedReason ? "fim" : "mapa");
    }
  }

  function commit(response: ItemResponse) {
    if (!game || !bank) return;
    const next = recordResponse(game, response, bank);
    const count = WORLDS.reduce((s, w) => s + next.worlds[w.id].responses.length, 0);
    setCheer(response.outcome === "nao_respondeu" ? "Tudo bem! Vamos para a próxima." : `${encouragementFor(count)} +10 XP`);
    apply(next, next.worlds[response.world].status !== "pendente");
  }

  function start() {
    if (age == null) return;
    const g = newGame({ nome: nome.trim(), idade: age, examinador: examinador.trim(), avatar });
    setGame(g);
    setSavedPatient(false);
    setCheer("");
    setScreen("mapa");
  }

  function reset() {
    if (game && !savedPatient && !window.confirm("Nova partida apaga o resultado atual (salve ou baixe o PDF antes). Continuar?")) return;
    speech.cancel();
    localStorage.removeItem(GAME_STORAGE_KEY);
    setGame(null);
    setWorld(null);
    setPaused(false);
    setScreen("inicio");
  }

  async function exportPdf() {
    if (!game) return;
    try {
      const { buildDocumentPdf } = await import("@/lib/documentPdf");
      const bytes = await buildDocumentPdf(buildGameDocSpec(game, issuerLines(issuer, issuerCredentials(issuer)), formatClinicalDateTime(new Date())));
      const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${safeTextFilename(`jogo-letras-numeros-${game.nome || "registro"}`)}.pdf`;
      anchor.rel = "noopener";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast({ title: "PDF gerado", description: "Triagem do Jogo das Letras e Números baixada." });
    } catch {
      toast({ title: "PDF", description: "Não foi possível gerar o PDF agora; use \u201cCopiar registro\u201d.", variant: "destructive" });
    }
  }

  async function copyRecord() {
    if (!game) return;
    try {
      await navigator.clipboard.writeText(buildGameRecord(game, formatClinicalDateTime(new Date())));
      toast({ title: "Registro", description: "Texto copiado." });
    } catch {
      toast({ title: "Registro", description: "Não foi possível copiar; baixe o PDF.", variant: "destructive" });
    }
  }

  const remaining = game ? Math.max(0, SESSION_CAP_SECONDS - Math.floor(game.activeMs / 1000)) : SESSION_CAP_SECONDS;
  const xpCells = game ? Math.min(10, Math.floor((game.xp % 100) / 10)) : 0;
  const level = game ? Math.floor(game.xp / 100) + 1 : 1;

  const hud = game && (screen === "mapa" || screen === "jogo") && (
    <div className="snp-panel flex flex-wrap items-center gap-3 p-3" data-testid="drx-game-hud">
      <span className="text-3xl" role="img" aria-label="Avatar">{game.avatar}</span>
      <div className="min-w-[8rem] flex-1">
        <p className="snp-pixel text-[11px]">Nível {level} · {game.xp} XP</p>
        <div className="snp-xp mt-1" aria-hidden="true">{Array.from({ length: 10 }, (_, i) => <i key={i} className={i < xpCells ? "on" : ""} />)}</div>
      </div>
      <span className="snp-chip" aria-label={`Sequência de ${game.streak} respostas`}>🔥 {game.streak}</span>
      <span className="snp-chip" aria-label={`Faltam ${Math.ceil(remaining / 60)} minutos`}>⏱ {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, "0")}</span>
      <button type="button" className="snp-btn snp-btn--paper drx-tap px-3 py-2 text-xs" aria-pressed={paused} aria-label="Pausar" onClick={() => { speech.cancel(); setPaused((p) => !p); }}><span aria-hidden="true">{paused ? "⏸ Pausado" : "⏸ Pausar"}</span></button>
    </div>
  );

  if (screen === "inicio" || !game || !bank) {
    const preview = bandForAge(age);
    return (
      <section ref={(el) => { rootRef.current = el; }} className="drx-game-root snp-panel snp-scanlines space-y-4 p-4" data-testid="drx-game" data-screen="inicio">
        <div className="text-center">
          <div className="drx-bob text-6xl" aria-hidden="true">🗺️</div>
          <h2 className="snp-pixel text-xl">Jogo das Letras e Números</h2>
          <p className="text-sm font-bold">5 mundos curtos: ditado, leitura e matemática. Até 15 minutos, com pausa.</p>
        </div>
        <fieldset>
          <legend className="snp-pixel text-xs">Quantos anos você tem?</legend>
          <div className="mt-2 grid grid-cols-5 gap-2 sm:grid-cols-7">
            {Array.from({ length: MAX_GAME_AGE - MIN_GAME_AGE + 1 }, (_, i) => MIN_GAME_AGE + i).map((n) => (
              <button key={n} type="button" aria-pressed={age === n} aria-label={`${n} anos`} className={`snp-btn drx-tap text-base ${age === n ? "snp-btn--sun" : "snp-btn--paper"}`} onClick={() => setAge(n)}>{n}</button>
            ))}
          </div>
          {preview && <p className="mt-2 text-sm font-bold" role="status">Faixa {preview.label}: itens e dificuldade ajustados para essa idade.</p>}
        </fieldset>
        <fieldset>
          <legend className="snp-pixel text-xs">Escolha seu personagem</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {AVATARS.map(([emoji, label]) => (
              <button key={emoji} type="button" aria-pressed={avatar === emoji} aria-label={label} className={`snp-btn drx-tap px-4 text-2xl ${avatar === emoji ? "snp-btn--sky" : "snp-btn--paper"}`} onClick={() => setAvatar(emoji)}>{emoji}</button>
            ))}
          </div>
        </fieldset>
        <details className="rounded-xl border-[3px] border-[var(--snp-ink-fixed)] p-2">
          <summary className="snp-pixel cursor-pointer text-xs">Aplicador (opcional)</summary>
          <label className="mt-2 grid text-sm font-bold">Nome da criança<input className="drx-input mt-1" value={nome} onChange={(e) => setNome(e.target.value)} /></label>
          <label className="mt-2 grid text-sm font-bold">Aplicador<input className="drx-input mt-1" value={examinador} onChange={(e) => setExaminador(e.target.value)} /></label>
        </details>
        <button type="button" className="snp-btn snp-btn--sun drx-tap w-full text-base" disabled={age == null} onClick={start}>Começar aventura</button>
        <p className="text-xs font-bold">{GAME_DISCLAIMER}</p>
      </section>
    );
  }

  const summary = summarizeGame(game);

  return (
    <div ref={(el) => { rootRef.current = el; }} className="drx-game-root space-y-3" data-testid="drx-game" data-screen={screen} data-band={bank.band}>
      {hud}
      {paused && (screen === "mapa" || screen === "jogo") && (
        <section className="snp-panel snp-panel--lilac p-6 text-center" role="dialog" aria-modal="false" aria-label="Jogo pausado">
          <div className="text-5xl" aria-hidden="true">⏸</div>
          <h2 className="snp-pixel text-xl">Pausa</h2>
          <p className="font-bold">O relógio parou. Respire, beba água e volte quando quiser.</p>
          <button type="button" className="snp-btn snp-btn--sun drx-tap mt-3 px-6" onClick={() => setPaused(false)}>▶ Continuar</button>
        </section>
      )}
      {cheer && !paused && (screen === "mapa" || screen === "jogo") && <p className="drx-cheer snp-chip" role="status" aria-live="polite">{cheer}</p>}

      {screen === "mapa" && !paused && (
        <section className="space-y-2" aria-label="Mapa de mundos">
          <h2 className="snp-pixel text-base">Mapa · faixa {bank.label}</h2>
          <ol className="drx-map grid gap-2">
            {WORLDS.map((w, i) => {
              const progress = game.worlds[w.id];
              const stars = starsFor(progress, worldTarget(w.id, bank));
              const nextIndex = WORLDS.findIndex((x) => game.worlds[x.id].status === "pendente");
              const isNext = i === nextIndex;
              const done = progress.status !== "pendente";
              return (
                <li key={w.id}>
                  <button
                    type="button"
                    disabled={done}
                    aria-current={isNext ? "step" : undefined}
                    className={`snp-option drx-tap flex w-full items-center gap-3 p-3 text-left ${isNext ? "bg-[var(--snp-sun)] drx-pulse" : done ? "bg-[var(--snp-grass-tint)]" : "bg-[var(--snp-paper-fixed)]"}`}
                    onClick={() => { setCheer(""); setWorld(w.id); setScreen("jogo"); }}
                  >
                    <span className="text-3xl" aria-hidden="true">{w.emoji}</span>
                    <span className="min-w-0 flex-1">
                      <strong className="snp-pixel text-xs">{i + 1}. {w.nome}</strong><br />
                      <small className="font-bold">{done ? (progress.status === "pulado" ? "Pulado" : "Concluído") : isNext ? "Próximo mundo!" : w.fala}</small>
                    </span>
                    <Stars n={stars} />
                  </button>
                </li>
              );
            })}
          </ol>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="snp-btn snp-btn--paper drx-tap px-3 text-xs" onClick={() => { if (window.confirm("Encerrar a partida agora? Mundos não jogados ficam como não aplicados.")) setGame((g) => (g ? { ...g, endedReason: "encerrado" } : g)); }}>Encerrar partida</button>
          </div>
        </section>
      )}

      {screen === "jogo" && world && (
        <div hidden={paused}>
        <WorldScreen
          key={world}
          world={world}
          game={game}
          bank={bank}
          speech={speech}
          paused={paused}
          onAnswer={commit}
          onFluency={(r) => { setCheer("Corrida concluída! +30 XP"); apply(recordFluency(game, r), true); }}
          onSkip={() => { setCheer(""); apply(skipWorld(game, world), true); }}
          onMap={() => { speech.cancel(); setWorld(null); setScreen("mapa"); }}
        />
        </div>
      )}

      {screen === "fim" && (
        <section className="snp-panel snp-scanlines snp-panel--sun p-6 text-center">
          <div className="drx-bob text-6xl" aria-hidden="true">🏆</div>
          <h2 className="snp-pixel text-xl">{game.endedReason === "tempo" ? "Tempo de jogo completo!" : "Aventura concluída!"}</h2>
          <p className="font-bold">{game.avatar} Você juntou {game.xp} XP e a maior sequência foi {game.bestStreak}. Obrigado pelo esforço!</p>
          <button type="button" className="snp-btn snp-btn--sky drx-tap mt-4 px-6" onClick={() => setScreen("painel")}>Painel do aplicador</button>
        </section>
      )}

      {screen === "painel" && (
        <section className="snp-panel space-y-3 p-4" data-testid="drx-game-results" aria-label="Resultado para o aplicador">
          <h2 className="snp-pixel text-base">Resultado · {game.nome || "criança"} · {game.idade} anos ({bank.label})</h2>
          <p className="rounded-xl border-[3px] border-[var(--snp-ink-fixed)] bg-[var(--snp-sun-tint)] p-2 text-xs font-black">NÃO DIAGNÓSTICA · triagem sem validação normativa brasileira. Níveis são graduações internas da faixa.</p>
          <div className="grid gap-2 sm:grid-cols-3">
            <DomainCard title="✏️ Ditado" pct={summary.ditado.pct} lines={[
              `Acertos ${tallyText(summary.ditado)}`,
              `Erros ortográficos: ${summary.ditado.ortograficos}`,
              `Erros fonológicos: ${summary.ditado.fonologicos}`,
              `Sem resposta: ${summary.ditado.naoRespondidos}`,
              LEVEL_LABEL[summary.ditado.finalLevel],
            ]} />
            <DomainCard title="📖 Leitura" pct={summary.leitura.decodificacao.pct} lines={[
              `Palavras reais ${tallyText(summary.leitura.decodificacao.palavras)} · pseudopalavras ${tallyText(summary.leitura.decodificacao.pseudo)}`,
              `Tempo médio por palavra: ${decimalBr(summary.leitura.decodificacao.mediaSegundos)} s`,
              `Fluência: ${fluencyText(summary)}`,
              `Compreensão ${tallyText(summary.leitura.compreensao)} · inferencial ${tallyText(summary.leitura.compreensao.inferencial)}`,
              LEVEL_LABEL[summary.leitura.decodificacao.finalLevel],
            ]} />
            <DomainCard title="🔢 Aritmética" pct={summary.aritmetica.pct} lines={[
              `Acertos ${tallyText(summary.aritmetica)}`,
              ...Object.entries(summary.aritmetica.porOperacao).map(([op, t]) => `${OP_LABEL[op as keyof typeof OP_LABEL]}: ${tallyText(t)}`),
              LEVEL_LABEL[summary.aritmetica.finalLevel],
            ]} />
          </div>
          <div>
            <h3 className="snp-pixel text-xs">Sinais para investigar (não diagnóstico)</h3>
            {summary.sinais.length ? (
              <ul className="list-disc pl-5 text-sm font-bold">{summary.sinais.map((s) => <li key={s}>{s}</li>)}</ul>
            ) : <p className="text-sm">Nenhum sinal automático nesta aplicação. Ausência de sinal não é normalidade.</p>}
          </div>
          {WORLDS.filter((w) => w.id !== "fluencia").map((w) => (
            <details key={w.id} className="rounded-xl border-[3px] border-[var(--snp-ink-fixed)] p-2" open={w.id === "ditado"}>
              <summary className="snp-pixel cursor-pointer text-xs">{w.emoji} {w.nome} · item a item</summary>
              {game.worlds[w.id].responses.length === 0 ? <p className="text-sm">Não aplicado.</p> : (
                <ol className="mt-2 space-y-1 text-sm">
                  {game.worlds[w.id].responses.map((r) => (
                    <li key={r.itemId} className="flex flex-wrap items-baseline gap-x-2">
                      <b className={r.outcome === "correto" ? "snp-answer--correct" : r.outcome === "erro" ? "snp-answer--wrong" : ""}>{r.outcome === "correto" ? "✓" : r.outcome === "erro" ? "✗" : "–"} {outcomeLabel(r)}</b>
                      <span>{r.prompt}</span>
                      {r.world !== "decodificacao" && <span>resposta “{r.given || "—"}”</span>}
                      <span className="opacity-80">esperado “{r.expected}” · nível {r.level}{r.op ? ` · ${OP_LABEL[r.op]}` : ""}</span>
                    </li>
                  ))}
                </ol>
              )}
            </details>
          ))}
          <div className="flex flex-wrap gap-2">
            <button type="button" className="snp-btn snp-btn--sun drx-tap px-4" onClick={() => void exportPdf()}>Baixar PDF</button>
            <button type="button" className="snp-btn snp-btn--sky drx-tap px-4" onClick={() => void copyRecord()}>Copiar registro</button>
            <button type="button" className="snp-btn snp-btn--paper drx-tap px-4" onClick={reset}>Nova partida</button>
          </div>
          <div data-testid="drx-save-to-patient">
          <Suspense fallback={<p className="text-xs font-bold" role="status">Carregando salvar no prontuário…</p>}>
            <LazySaveToPatient
              scaleName="Jogo das Letras e Números · 5–18 anos (dyslexia risk)"
              responses={gameResponseItems(game)}
              patientAge={game.idade != null ? `${game.idade} anos` : undefined}
              applicationDate={new Date(game.startedAt)}
              instrumentVersion={GAME_VERSION}
              onSaved={() => setSavedPatient(true)}
            />
          </Suspense>
          </div>
          <p className="text-xs font-bold">{GAME_DISCLAIMER}</p>
        </section>
      )}
    </div>
  );
}

function DomainCard({ title, pct, lines }: { title: string; pct: number | null; lines: string[] }) {
  return (
    <div className="rounded-xl border-[3px] border-[var(--snp-ink-fixed)] bg-[var(--snp-paper-fixed)] p-3 text-[var(--snp-ink-fixed)]">
      <h3 className="snp-pixel text-xs">{title}</h3>
      <p className="text-2xl font-black">{pct == null ? "—" : `${pct}%`}<span className="sr-only"> de acerto</span></p>
      <ul className="text-xs font-semibold">{lines.map((l) => <li key={l}>{l}</li>)}</ul>
    </div>
  );
}

type Speech = ReturnType<typeof useSpeech>;

interface WorldScreenProps {
  world: WorldId;
  game: GameState;
  bank: BandBank;
  speech: Speech;
  paused: boolean;
  onAnswer: (r: ItemResponse) => void;
  onFluency: (r: { probeId: string; totalWords: number; lidas: number; erros: number; segundos: number }) => void;
  onSkip: () => void;
  onMap: () => void;
}

function WorldScreen({ world, game, bank, speech, paused, onAnswer, onFluency, onSkip, onMap }: WorldScreenProps) {
  const meta = WORLDS.find((w) => w.id === world)!;
  const progress = game.worlds[world];
  const target = worldTarget(world, bank);
  const item = nextItemFor(game, world, bank);
  return (
    <section className="snp-panel snp-scanlines space-y-3 p-4" data-testid={`drx-world-${world}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-3xl" aria-hidden="true">{meta.emoji}</span>
        <h2 className="snp-pixel min-w-0 flex-1 text-base">{meta.nome}</h2>
        {world !== "fluencia" && <span className="snp-chip">{Math.min(progress.responses.length + 1, target)} de {target}</span>}
      </div>
      <div className="snp-meter" aria-hidden="true">{Array.from({ length: target }, (_, i) => <i key={i} className={i < progress.responses.length ? "hit" : ""} />)}</div>
      {world === "ditado" && item && <DitadoView key={(item as DitadoItem).id} item={item as DitadoItem} speech={speech} onAnswer={onAnswer} />}
      {world === "decodificacao" && item && <DecodeView key={(item as DecodeItem).id} item={item as DecodeItem} onAnswer={onAnswer} />}
      {world === "compreensao" && item && <ComprehensionView key={(item as ComprehensionQuestion).id} bank={bank} question={item as ComprehensionQuestion} speech={speech} onAnswer={onAnswer} />}
      {world === "aritmetica" && item && <ArithView key={(item as ArithItem).id} item={item as ArithItem} young={bank.band === "5-6" || bank.band === "7-8"} speech={speech} onAnswer={onAnswer} />}
      {world === "fluencia" && <FluencyView bank={bank} onDone={onFluency} paused={paused} />}
      <div className="flex flex-wrap gap-2 border-t-[3px] border-dashed border-[var(--snp-ink-fixed)] pt-2">
        <button type="button" className="snp-btn snp-btn--paper drx-tap px-3 text-xs" onClick={onMap}>Mapa</button>
        <button type="button" className="snp-btn snp-btn--slate drx-tap px-3 text-xs" onClick={() => { if (window.confirm("Pular este mundo? Ele fica como não aplicado.")) onSkip(); }}>Aplicador: pular mundo</button>
      </div>
    </section>
  );
}

function useItemClock() {
  const shownAt = useRef(Date.now());
  return () => Date.now() - shownAt.current;
}

function DitadoView({ item, speech, onAnswer }: { item: DitadoItem; speech: Speech; onAnswer: (r: ItemResponse) => void }) {
  const [value, setValue] = useState("");
  const [reveal, setReveal] = useState(false);
  const elapsed = useItemClock();
  const { speak } = speech;
  const say = useCallback(() => speak(`${item.target}. ${item.sentence} ${item.target}.`, 0.8), [item, speak]);
  useEffect(() => { say(); }, [say]);
  function submit(given: string) {
    const c = classifyDitado(item.target, given, item.pseudo);
    onAnswer({ world: "ditado", itemId: item.id, level: item.level, prompt: item.pseudo ? `${item.target} (inventada)` : item.target, expected: item.target, given: given.trim(), outcome: c.outcome, errorType: c.errorType, kind: item.pseudo ? "pseudo" : "palavra", ms: elapsed() });
  }
  return (
    <form className="space-y-3 text-center" onSubmit={(e) => { e.preventDefault(); if (value.trim()) submit(value); }}>
      <p className="font-bold">{item.pseudo ? "Palavra inventada! Escreva do jeito que você ouviu." : "Ouça e escreva a palavra."}</p>
      <button type="button" className="snp-btn snp-btn--sky drx-tap mx-auto flex items-center gap-2 px-6 text-lg" onClick={say}>🔊 Ouvir</button>
      {!speech.supported && <p className="text-xs font-bold" role="note">Este aparelho não tem voz: o aplicador lê a palavra, a frase e a palavra de novo.</p>}
      <label className="grid text-left text-sm font-bold">Escreva aqui
        <input className="drx-input drx-input--big mt-1" value={value} onChange={(e) => setValue(e.target.value)} autoComplete="off" autoCapitalize="off" autoCorrect="off" spellCheck={false} aria-describedby={`help-${item.id}`} />
      </label>
      <p id={`help-${item.id}`} className="text-xs">Se a criança escreveu no papel, o aplicador digita exatamente o que ela escreveu.</p>
      <div className="flex flex-wrap justify-center gap-2">
        <button type="submit" className="snp-btn snp-btn--grass drx-tap px-6 text-base" disabled={!value.trim()}>Pronto ✓</button>
        <button type="button" className="snp-btn snp-btn--paper drx-tap px-4" onClick={() => submit("")}>Não sei · pular</button>
      </div>
      <button type="button" aria-pressed={reveal} className="snp-chip" onClick={() => setReveal((r) => !r)}>Aplicador: {reveal ? "esconder" : "mostrar"} palavra</button>
      {reveal && <p className="text-sm font-bold" data-testid="drx-ditado-reveal">“{item.target}” — {item.sentence}</p>}
    </form>
  );
}

function DecodeView({ item, onAnswer }: { item: DecodeItem; onAnswer: (r: ItemResponse) => void }) {
  const elapsed = useItemClock();
  function mark(outcome: ItemResponse["outcome"]) {
    onAnswer({ world: "decodificacao", itemId: item.id, level: item.level, prompt: item.kind === "pseudo" ? `${item.text} (inventada)` : item.text, expected: item.text, given: "", outcome, kind: item.kind, ms: elapsed() });
  }
  return (
    <div className="space-y-3 text-center">
      <p className="font-bold">Leia em voz alta{item.kind === "pseudo" ? " — esta palavra é inventada!" : "!"}</p>
      <p className="drx-card my-2 break-words text-5xl font-black" lang="pt-BR" data-testid="drx-decode-word">{item.text}</p>
      <p className="text-xs font-bold">Aplicador: marque como a criança leu.</p>
      <div className="flex flex-wrap justify-center gap-2">
        <button type="button" className="snp-btn snp-btn--sky drx-tap px-5" onClick={() => mark("correto")}>✓ Leu certo</button>
        <button type="button" className="snp-btn snp-btn--berry drx-tap px-5" onClick={() => mark("erro")}>✗ Errou</button>
        <button type="button" className="snp-btn snp-btn--paper drx-tap px-4" onClick={() => mark("nao_respondeu")}>Não leu</button>
      </div>
    </div>
  );
}

function OptionGrid({ options, onPick, label }: { options: string[]; onPick: (o: string) => void; label: string }) {
  return (
    <div role="group" aria-label={label} className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {options.map((o) => <button key={o} type="button" className="snp-option drx-tap bg-[var(--snp-paper-fixed)] p-3 text-lg font-black" onClick={() => onPick(o)}>{o}</button>)}
    </div>
  );
}

function ComprehensionView({ bank, question, speech, onAnswer }: { bank: BandBank; question: ComprehensionQuestion; speech: Speech; onAnswer: (r: ItemResponse) => void }) {
  const set = bank.compreensao;
  const [showText, setShowText] = useState(!set.listening);
  const elapsed = useItemClock();
  return (
    <div className="space-y-3">
      <h3 className="snp-pixel text-xs">{set.title}</h3>
      {set.listening && (
        <div className="flex flex-wrap gap-2">
          <button type="button" className="snp-btn snp-btn--sky drx-tap px-4" onClick={() => speech.speak(set.text, 0.85)}>🔊 Ouvir a história</button>
          <button type="button" className="snp-btn snp-btn--paper drx-tap px-4" onClick={() => speech.speak(question.question, 0.85)}>🔊 Ouvir a pergunta</button>
          <button type="button" aria-pressed={showText} className="snp-chip" onClick={() => setShowText((v) => !v)}>Aplicador: {showText ? "esconder" : "mostrar"} texto</button>
        </div>
      )}
      {showText && <p className="drx-reading rounded-xl border-[3px] border-[var(--snp-ink-fixed)] bg-[var(--snp-paper-fixed)] p-3 text-[var(--snp-ink-fixed)]">{set.text}</p>}
      <p className="text-lg font-black">{question.question}</p>
      <OptionGrid label="Opções" options={question.options} onPick={(o) => onAnswer({ world: "compreensao", itemId: question.id, level: 2, prompt: question.question, expected: question.answer, given: o, outcome: o === question.answer ? "correto" : "erro", kind: question.kind, ms: elapsed() })} />
    </div>
  );
}

function ArithView({ item, young, speech, onAnswer }: { item: ArithItem; young: boolean; speech: Speech; onAnswer: (r: ItemResponse) => void }) {
  const elapsed = useItemClock();
  return (
    <div className="space-y-3 text-center">
      <p className="text-2xl font-black">{item.prompt}</p>
      {item.visual && <p className="text-4xl" role="img" aria-label={`Figura: ${item.visual}`}>{item.visual}</p>}
      {young && <button type="button" className="snp-btn snp-btn--sky drx-tap px-4" onClick={() => speech.speak(item.prompt, 0.85)}>🔊 Ouvir a pergunta</button>}
      <OptionGrid label="Opções" options={item.options} onPick={(o) => onAnswer({ world: "aritmetica", itemId: item.id, level: item.level, prompt: item.prompt, expected: item.answer, given: o, outcome: o === item.answer ? "correto" : "erro", op: item.op, ms: elapsed() })} />
      <button type="button" className="snp-btn snp-btn--paper drx-tap px-4" onClick={() => onAnswer({ world: "aritmetica", itemId: item.id, level: item.level, prompt: item.prompt, expected: item.answer, given: "", outcome: "nao_respondeu", op: item.op, ms: elapsed() })}>Não sei · pular</button>
    </div>
  );
}

function FluencyView({ bank, onDone, paused }: { bank: BandBank; onDone: WorldScreenProps["onFluency"]; paused: boolean }) {
  const probe = bank.fluencia;
  const words = useMemo(() => fluencyWords(probe), [probe]);
  const [secs, setSecs] = useState(0);
  const [running, setRunning] = useState(false);
  const [lidas, setLidas] = useState(0);
  const [erros, setErros] = useState(0);
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setSecs((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, [running]);
  useEffect(() => {
    if (running && (secs >= FLUENCY_SECONDS || paused)) setRunning(false);
  }, [running, secs, paused]);
  const started = secs > 0 || running;
  return (
    <div className="space-y-3">
      <p className="font-bold">{probe.kind === "silabas" ? "Leia as sílabas em voz alta, uma por uma." : "Leia o texto em voz alta, do começo, no seu ritmo."}</p>
      <p className="text-xs font-bold">Aplicador: inicie o cronômetro, marque os erros e, ao final, toque na última {probe.kind === "silabas" ? "sílaba" : "palavra"} lida.</p>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="snp-btn snp-btn--sun drx-tap px-4" disabled={running || secs >= FLUENCY_SECONDS} onClick={() => setRunning(true)}>{secs ? "▶ Retomar" : "▶ Iniciar 60 s"}</button>
        <button type="button" className="snp-btn snp-btn--paper drx-tap px-4" disabled={!running} onClick={() => setRunning(false)}>⏸ Parar</button>
        <span className="snp-chip" role="timer" aria-live="off">⏱ {secs} s / {FLUENCY_SECONDS}</span>
      </div>
      <p className={`drx-reading leading-9 ${probe.kind === "silabas" ? "drx-syllables" : ""}`} lang="pt-BR">
        {words.map((w, i) => (
          <button type="button" key={i} aria-label={`Última lida: ${w} (${i + 1})`} aria-pressed={lidas === i + 1} className={`drx-word ${i < lidas ? "read" : ""}`} onClick={() => setLidas(i + 1)}>{w}</button>
        ))}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-bold">Erros:</span>
        <button type="button" className="snp-btn snp-btn--paper drx-tap px-4" aria-label="Menos um erro" onClick={() => setErros((e) => Math.max(0, e - 1))}>−</button>
        <span className="snp-chip text-base" aria-live="polite">{erros}</span>
        <button type="button" className="snp-btn snp-btn--berry drx-tap px-4" aria-label="Mais um erro" onClick={() => setErros((e) => e + 1)}>+</button>
        <span className="text-sm font-bold">Lidas: {lidas}</span>
      </div>
      <button type="button" className="snp-btn snp-btn--grass drx-tap w-full" disabled={!started || running || lidas === 0} onClick={() => onDone({ probeId: probe.id, totalWords: words.length, lidas, erros: Math.min(erros, lidas), segundos: Math.max(1, Math.min(secs, FLUENCY_SECONDS)) })}>Terminar corrida ✓</button>
    </div>
  );
}
