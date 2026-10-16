import { DESCRIPTIVE_NOTICE } from "@/lib/descriptiveNotice";
import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pause } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSpeech } from "@/hooks/useSpeech";
import { useIssuer, issuerCredentials } from "@/lib/issuer";
import { issuerLines } from "@/features/super-neuropad/pdf";
import { formatClinicalDateTime } from "@/lib/clinicalDate";
import { safeTextFilename } from "@/lib/shareText";
import { BANK_PROVENANCE, MAX_GAME_AGE, MIN_GAME_AGE, bandForAge, fluencyProbe, fluencyWords, withTextForm, type ArithItem, type FluencyForm, type BandBank, type ComprehensionQuestion, type DecodeItem, type DitadoItem } from "./bank";
import {
  FLUENCY_SECONDS, GAME_STORAGE_KEY, GAME_VERSION, SESSION_CAP_SECONDS, WORLDS,
  OBSERVACOES_MAX, OBSERVATION_CHIPS, classifyDitado, encouragementFor, newGame, nextItemFor, recordFluency, recordResponse, setObservacoes, skipWorld, starsFor, summarizeGame, tick, worldTarget,
  type FluencyInput, type GameState, type ItemResponse, type WorldId,
} from "./engine";
import { clearDraft, readDraft, writeDraft } from "../localDraft";
import { GAME_DISCLAIMER, OP_LABEL, decimalBr, fluencyText, timingLines, buildGameDocSpec, buildGameRecord, gameResponseItems, outcomeLabel, tallyText } from "./report";

const LazySaveToPatient = lazy(() =>
  import("@/components/SaveToPatient").then(({ SaveToPatient: Component }) => ({ default: Component })),
);

const AVATARS = [["🦊", "Raposa"], ["🐼", "Panda"], ["🦖", "Dino"], ["🚀", "Foguete"]] as const;
type Screen = "inicio" | "mapa" | "jogo" | "fim" | "painel";

function loadSaved(): GameState | null {
  // Rascunho com validade de 72 h (dados de criança não ficam no aparelho indefinidamente).
  const parsed = readDraft<GameState>(GAME_STORAGE_KEY);
  return parsed && parsed.version === 1 && parsed.worlds ? parsed : null;
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
  const [forma, setForma] = useState<FluencyForm>("A");

  const rootRef = useRef<HTMLElement | null>(null);
  const firstScreen = useRef(true);
  const { toast } = useToast();
  const { issuer } = useIssuer();
  const speech = useSpeech();
  const bank: BandBank | null = useMemo(() => { const base = bandForAge(game?.idade ?? null); return base ? withTextForm(base, game?.forma) : null; }, [game?.idade, game?.forma]);

  useEffect(() => {
    if (game) writeDraft(GAME_STORAGE_KEY, game);
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
    const g = newGame({ nome: nome.trim(), idade: age, examinador: examinador.trim(), avatar, forma });
    setGame(g);
    setSavedPatient(false);
    setCheer("");
    setScreen("mapa");
  }

  function reset() {
    if (game && !savedPatient && !window.confirm("Nova partida apaga o resultado atual (salve ou baixe o PDF antes). Continuar?")) return;
    speech.cancel();
    clearDraft(GAME_STORAGE_KEY);
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
      toast({ title: "PDF gerado", description: "Registro do Jogo das Letras e Números baixado." });
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

  const hud = game && (screen === "mapa" || screen === "jogo") && (
    <div className="snp-panel flex flex-nowrap items-center gap-2 px-3 py-2 sm:flex-wrap" data-testid="drx-game-hud">
      <span className="text-2xl" role="img" aria-label="Avatar">{game.avatar}</span>
      <div className="min-w-0 flex-1">
        <p className="snp-pixel truncate text-[11px]">{game.xp} XP</p>
        <div className="snp-xp mt-1" aria-hidden="true">{Array.from({ length: 10 }, (_, i) => <i key={i} className={i < xpCells ? "on" : ""} />)}</div>
      </div>
      <span className="snp-chip shrink-0" aria-label={`Sequência de ${game.streak} respostas`}>🔥 {game.streak}</span>
      <span className="snp-chip shrink-0" aria-label={`Faltam ${Math.ceil(remaining / 60)} minutos`}>⏱ {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, "0")}</span>
      <button type="button" className="snp-btn snp-btn--paper drx-tap inline-flex shrink-0 items-center justify-center gap-1 px-3 py-2 text-xs" aria-pressed={paused} aria-label="Pausar" onClick={() => { speech.cancel(); setPaused((p) => !p); }}>
        {/* No celular só o ícone: o HUD cabe numa linha e o mapa não desce até o balão de ajuda (alvo de toque segue ≥ 48 px). */}
        <Pause className="h-4 w-4" aria-hidden="true" /><span aria-hidden="true" className="hidden sm:inline">{paused ? " Pausado" : " Pausar"}</span>
      </button>
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
        <fieldset>
          <legend className="snp-pixel text-xs">Forma dos textos (aplicador)</legend>
          <div className="mt-2 flex flex-wrap items-center gap-2" role="group" aria-label="Forma dos textos">
            <button type="button" aria-pressed={forma === "A"} className={`snp-btn drx-tap px-4 ${forma === "A" ? "snp-btn--sky" : "snp-btn--paper"}`} onClick={() => setForma("A")}>A · padrão</button>
            <button type="button" aria-pressed={forma === "B"} className={`snp-btn drx-tap px-4 ${forma === "B" ? "snp-btn--sky" : "snp-btn--paper"}`} onClick={() => setForma("B")}>B · reteste</button>
          </div>
          <p className="mt-1 text-xs font-bold">Use B ao repetir com a mesma criança (compreensão e fluência). As formas não têm equivalência psicométrica comprovada.</p>
        </fieldset>
        <button type="button" className="snp-btn snp-btn--sun drx-tap w-full text-base" disabled={age == null} onClick={start}>Começar aventura</button>
        <p className="text-xs font-bold">{GAME_DISCLAIMER}</p>
        <p className="text-xs font-bold" data-testid="drx-provenance">{BANK_PROVENANCE}</p>
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
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="snp-pixel min-w-0 flex-1 text-base">Mapa · faixa {bank.label}</h2>
            <button type="button" className="snp-btn snp-btn--paper drx-tap px-3 text-[11px]" onClick={() => { if (window.confirm("Encerrar a partida agora? Mundos não jogados ficam como não aplicados.")) setGame((g) => (g ? { ...g, endedReason: "encerrado" } : g)); }}>Encerrar partida</button>
          </div>
          <ol className="drx-map grid gap-1.5">
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
                    className={`snp-option drx-tap drx-map-row flex w-full items-center gap-3 px-3 py-2 text-left ${isNext ? "bg-[var(--snp-sun)] drx-pulse" : done ? "bg-[var(--snp-grass-tint)]" : "bg-[var(--snp-paper-fixed)]"}`}
                    onClick={() => { setCheer(""); setWorld(w.id); setScreen("jogo"); }}
                  >
                    <span className="text-2xl" aria-hidden="true">{w.emoji}</span>
                    <span className="min-w-0 flex-1 leading-tight">
                      <span className="flex flex-wrap items-center gap-x-2"><strong className="snp-pixel text-xs">{i + 1}. {w.nome}</strong><Stars n={stars} /></span>
                      <small className="text-xs font-bold">{done ? (progress.status === "pulado" ? "Pulado" : "Concluído") : isNext ? "Próximo mundo!" : w.fala}</small>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
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
          <p className="rounded-xl border-[3px] border-[var(--snp-ink-fixed)] bg-[var(--snp-sun-tint)] p-2 text-xs font-black">{DESCRIPTIVE_NOTICE}</p>
          <div className="grid gap-2 sm:grid-cols-3">
            <DomainCard title="✏️ Ditado" lines={[
              `Acertos ${tallyText(summary.ditado)}`,
              `Erros ortográficos: ${summary.ditado.ortograficos}`,
              `Erros fonológicos: ${summary.ditado.fonologicos}`,
              `Sem resposta: ${summary.ditado.naoRespondidos}`]} />
            <DomainCard title="📖 Leitura" lines={[
              `Palavras reais ${tallyText(summary.leitura.decodificacao.palavras)} · pseudopalavras ${tallyText(summary.leitura.decodificacao.pseudo)}`,
              `Tempo médio por palavra: ${decimalBr(summary.leitura.decodificacao.mediaSegundos)} s`,
              `Fluência: ${fluencyText(summary)}`,
              `Compreensão ${tallyText(summary.leitura.compreensao)} · inferencial ${tallyText(summary.leitura.compreensao.inferencial)}`]} />
            <DomainCard title="🔢 Aritmética" lines={[
              `Acertos ${tallyText(summary.aritmetica)}`,
              ...Object.entries(summary.aritmetica.porOperacao).map(([op, t]) => `${OP_LABEL[op as keyof typeof OP_LABEL]}: ${tallyText(t)}`)]} />
          </div>
          {summary.condicoes.length > 0 && (
            <div>
              <h3 className="snp-pixel text-xs">Condições da aplicação</h3>
              <ul className="list-disc pl-5 text-sm font-bold">{summary.condicoes.map((s) => <li key={s}>{s}</li>)}</ul>
            </div>
          )}
          <div data-testid="drx-game-timing">
            <h3 className="snp-pixel text-xs">Tempos medidos</h3>
            <ul className="list-disc pl-5 text-sm font-bold">{timingLines(summary, game).map((l) => <li key={l}>{l}</li>)}</ul>
          </div>
          <div data-testid="drx-game-observations">
            <label htmlFor="drx-observacoes" className="snp-pixel text-xs">Observações do aplicador (reação da criança, mediação, condições; vão para o PDF, o registro e o prontuário)</label>
            <div className="mt-1 flex flex-wrap gap-1" role="group" aria-label="Atalhos de observação">
              {OBSERVATION_CHIPS.map((chip) => (
                <button key={chip} type="button" className="snp-chip" onClick={() => setGame((g) => (g ? setObservacoes(g, g.observacoes?.includes(chip) ? g.observacoes : [g.observacoes?.trim(), chip].filter(Boolean).join(". ")) : g))}>+ {chip}</button>
              ))}
            </div>
            <textarea id="drx-observacoes" className="mt-1 w-full rounded-xl border-[3px] border-[var(--snp-ink-fixed)] p-2 text-sm" rows={3} maxLength={OBSERVACOES_MAX} value={game.observacoes ?? ""} onChange={(e) => setGame((g) => (g ? { ...g, observacoes: e.target.value.slice(0, OBSERVACOES_MAX) } : g))} />
            <p className="text-[11px] font-bold">{(game.observacoes ?? "").length}/{OBSERVACOES_MAX} · escreva só fatos observados.</p>
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
                      <span className="opacity-80">resposta prevista “{r.expected}” · dificuldade do item {r.level} (1–3){r.ms > 0 ? ` · ${decimalBr(Math.round(r.ms / 100) / 10)} s` : ""}{r.op ? ` · ${OP_LABEL[r.op]}` : ""}</span>
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

function DomainCard({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div className="rounded-xl border-[3px] border-[var(--snp-ink-fixed)] bg-[var(--snp-paper-fixed)] p-3 text-[var(--snp-ink-fixed)]">
      <h3 className="snp-pixel text-xs">{title}</h3>
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
  onFluency: (r: FluencyInput) => void;
  onSkip: () => void;
  onMap: () => void;
}

function WorldScreen({ world, game, bank, speech, paused, onAnswer, onFluency, onSkip, onMap }: WorldScreenProps) {
  const meta = WORLDS.find((w) => w.id === world)!;
  const progress = game.worlds[world];
  const target = worldTarget(world, bank);
  const item = nextItemFor(game, world, bank);
  // Corrida em andamento vive só na tela: sair pelo mapa sem terminar perderia o registro.
  const fluencyDirty = useRef(false);
  const goMap = () => {
    if (world === "fluencia" && fluencyDirty.current && !window.confirm("Sair sem terminar a corrida? O que foi marcado nesta leitura será perdido.")) return;
    onMap();
  };
  return (
    <section className="snp-panel snp-scanlines space-y-3 p-4" data-testid={`drx-world-${world}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-3xl" aria-hidden="true">{meta.emoji}</span>
        <h2 className="snp-pixel min-w-0 flex-1 text-base">{meta.nome}</h2>
        {world !== "fluencia" && <span className="snp-chip">{Math.min(progress.responses.length + 1, target)} de {target}</span>}
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="snp-btn snp-btn--paper drx-tap px-3 text-[11px]" onClick={goMap}>Mapa</button>
        <button type="button" className="snp-btn snp-btn--slate drx-tap px-3 text-[11px]" onClick={() => { if (window.confirm("Pular este mundo? Ele fica como não aplicado.")) onSkip(); }}>Aplicador: pular mundo</button>
      </div>
      <div className="snp-meter" aria-hidden="true">{Array.from({ length: target }, (_, i) => <i key={i} className={i < progress.responses.length ? "hit" : ""} />)}</div>
      {world === "ditado" && item && <DitadoView key={(item as DitadoItem).id} item={item as DitadoItem} speech={speech} onAnswer={onAnswer} />}
      {world === "decodificacao" && item && <DecodeView key={(item as DecodeItem).id} item={item as DecodeItem} onAnswer={onAnswer} />}
      {world === "compreensao" && item && <ComprehensionView key={(item as ComprehensionQuestion).id} bank={bank} question={item as ComprehensionQuestion} speech={speech} onAnswer={onAnswer} />}
      {world === "aritmetica" && item && <ArithView key={(item as ArithItem).id} item={item as ArithItem} young={bank.band === "5-6" || bank.band === "7-8"} speech={speech} onAnswer={onAnswer} />}
      {world === "fluencia" && <FluencyView bank={bank} onDone={onFluency} paused={paused} initialForm={game?.forma} onDirtyChange={(d) => { fluencyDirty.current = d; }} />}
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

type MarkMode = "erro" | "ultima";

/** Token sem pontuação nas pontas, para a lista de palavras com erro do registro. */
const bareWord = (w: string) => w.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "") || w;

/**
 * Corrida da Leitura. O toque no texto tem dois modos: com o cronômetro correndo marca
 * erro de leitura na palavra; parado, marca a última palavra lida (🏁). "Terminar" nunca
 * fica bloqueado: sem última palavra marcada, pergunta quanto foi lido em vez de falhar calado.
 */
function FluencyView({ bank, onDone, paused, initialForm, onDirtyChange }: { bank: BandBank; onDone: WorldScreenProps["onFluency"]; paused: boolean; initialForm?: FluencyForm; onDirtyChange?: (dirty: boolean) => void }) {
  const [form, setForm] = useState<FluencyForm>(initialForm ?? "A");
  const probe = fluencyProbe(bank, form);
  const words = useMemo(() => fluencyWords(probe), [probe]);
  const unidade = probe.kind === "silabas" ? "sílaba" : "palavra";
  const unidades = probe.kind === "silabas" ? "sílabas" : "palavras";
  const [secs, setSecs] = useState(0);
  const [running, setRunning] = useState(false);
  const [mode, setMode] = useState<MarkMode>("erro");
  const [lidas, setLidas] = useState(0);
  const [marcados, setMarcados] = useState<ReadonlySet<number>>(() => new Set());
  const [avulsos, setAvulsos] = useState(0);
  const [asking, setAsking] = useState(false);
  const [picking, setPicking] = useState(false);
  const askRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setSecs((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, [running]);
  useEffect(() => {
    if (running && (secs >= FLUENCY_SECONDS || paused)) { setRunning(false); setMode("ultima"); }
  }, [running, secs, paused]);
  const dirty = secs > 0 || running || lidas > 0 || marcados.size > 0 || avulsos > 0;
  useEffect(() => { onDirtyChange?.(dirty); }, [dirty, onDirtyChange]);
  useEffect(() => { if (asking) askRef.current?.focus(); }, [asking]);

  const started = secs > 0 || running;
  // Erros tocados depois da última palavra lida não foram lidos: ficam de fora da contagem.
  const errosNoTrecho = lidas > 0 ? [...marcados].filter((i) => i < lidas).length : marcados.size;
  const foraDoTrecho = marcados.size - errosNoTrecho;
  const erros = errosNoTrecho + avulsos;

  function changeForm(next: FluencyForm) {
    setForm(next); setLidas(0); setMarcados(new Set()); setAvulsos(0); setAsking(false); setPicking(false);
  }
  function start() { setRunning(true); setMode("erro"); setAsking(false); setPicking(false); }
  function stop() { setRunning(false); setMode("ultima"); }
  function setLast(n: number) {
    setLidas(Math.max(0, Math.min(words.length, n)));
    setAsking(false); setPicking(false);
  }
  function tapWord(i: number) {
    if (mode === "ultima") { setLast(i + 1); return; }
    setMarcados((cur) => {
      const next = new Set(cur);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  }
  function finish(n: number) {
    const noTrecho = [...marcados].filter((i) => i < n).sort((a, b) => a - b);
    onDone({
      probeId: probe.id,
      totalWords: words.length,
      lidas: n,
      erros: Math.min(noTrecho.length + avulsos, n),
      segundos: Math.min(secs, FLUENCY_SECONDS),
      formaAplicada: form,
      palavrasComErro: noTrecho.map((i) => bareWord(words[i])),
    });
  }
  function terminar() {
    if (running) stop();
    if (lidas === 0) { setAsking(true); setMode("ultima"); return; }
    finish(lidas);
  }
  function pickInText() {
    setAsking(false); setMode("ultima"); setPicking(true);
    textRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }

  const instrucao = asking
    ? `Nenhuma última ${unidade} marcada.`
    : picking
      ? `Toque na última ${unidade} lida (🏁) e depois em Terminar corrida.`
      : mode === "erro"
        ? `Toque na ${unidade} lida com erro para marcar; toque de novo para desmarcar.`
        : `Toque na última ${unidade} lida (🏁).`;

  return (
    <div className="space-y-3">
      <p className="font-bold">{probe.kind === "silabas" ? "Leia as sílabas em voz alta, uma por uma." : "Leia o texto em voz alta, do começo, no seu ritmo."}</p>
      {!started && (
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Forma do texto">
          <span className="text-xs font-bold">Forma:</span>
          <button type="button" className={`snp-btn ${form === "A" ? "snp-btn--sky" : "snp-btn--paper"} drx-tap px-4`} aria-pressed={form === "A"} onClick={() => changeForm("A")}>A · 1ª aplicação</button>
          <button type="button" className={`snp-btn ${form === "B" ? "snp-btn--sky" : "snp-btn--paper"} drx-tap px-4`} aria-pressed={form === "B"} onClick={() => changeForm("B")}>B · reteste</button>
        </div>
      )}
      <p className="text-xs font-bold">Aplicador: inicie o cronômetro e toque nas {unidades} lidas com erro; ao parar, toque na última {unidade} lida. Cronômetro externo: marque direto e termine.</p>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="snp-btn snp-btn--sun drx-tap px-4" disabled={running || secs >= FLUENCY_SECONDS} onClick={start}>{secs ? "▶ Retomar" : "▶ Iniciar 60 s"}</button>
        <button type="button" className="snp-btn snp-btn--paper drx-tap px-4" disabled={!running} onClick={stop}>⏸ Parar</button>
        <span className="snp-chip" role="timer" aria-live="off">⏱ {secs} s / {FLUENCY_SECONDS}</span>
      </div>
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="O toque no texto marca">
        <span className="text-xs font-bold">Toque no texto marca:</span>
        <button type="button" className={`snp-btn ${mode === "erro" ? "snp-btn--berry" : "snp-btn--paper"} drx-tap px-3 text-xs`} aria-pressed={mode === "erro"} onClick={() => { setMode("erro"); setPicking(false); }}>✗ Erro</button>
        <button type="button" className={`snp-btn ${mode === "ultima" ? "snp-btn--sky" : "snp-btn--paper"} drx-tap px-3 text-xs`} aria-pressed={mode === "ultima"} onClick={() => setMode("ultima")}>🏁 Última lida</button>
      </div>
      <p className="text-xs font-bold" aria-live="polite" data-testid="drx-fluencia-instrucao">{instrucao}</p>
      <p ref={textRef} className={`drx-reading leading-9 ${probe.kind === "silabas" ? "drx-syllables" : ""} ${picking ? "drx-reading--pick" : ""}`} lang="pt-BR">
        {words.map((w, i) => {
          const last = lidas === i + 1;
          return (
            <button
              type="button"
              key={i}
              aria-label={mode === "erro" ? `Erro em: ${w} (${i + 1})` : `Última lida: ${w} (${i + 1})`}
              aria-pressed={mode === "erro" ? marcados.has(i) : last}
              className={`drx-word ${i < lidas ? "read" : ""} ${marcados.has(i) ? "erro" : ""} ${last ? "last" : ""}`}
              onClick={() => tapWord(i)}
            >
              {w}{last && <span aria-hidden="true"> 🏁</span>}
            </button>
          );
        })}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-bold">Erros:</span>
        <button type="button" className="snp-btn snp-btn--paper drx-tap px-4" aria-label="Menos um erro" disabled={avulsos === 0} onClick={() => setAvulsos((e) => Math.max(0, e - 1))}>−</button>
        <span className="snp-chip text-base" aria-live="polite" data-testid="drx-fluencia-erros">{erros}</span>
        <button type="button" className="snp-btn snp-btn--berry drx-tap px-4" aria-label="Mais um erro" onClick={() => setAvulsos((e) => e + 1)}>+</button>
        {marcados.size > 0 && <span className="text-xs font-bold">{errosNoTrecho} tocado{errosNoTrecho === 1 ? "" : "s"} no texto</span>}
      </div>
      {foraDoTrecho > 0 && <p className="text-xs font-bold">{foraDoTrecho} erro{foraDoTrecho === 1 ? "" : "s"} tocado{foraDoTrecho === 1 ? "" : "s"} depois da última {unidade} lida não entra{foraDoTrecho === 1 ? "" : "m"} na contagem.</p>}
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-bold">Lidas:</span>
        <button type="button" className="snp-btn snp-btn--paper drx-tap px-4" aria-label={`Menos uma ${unidade} lida`} disabled={lidas === 0} onClick={() => setLast(lidas - 1)}>−</button>
        <span className="snp-chip text-base" aria-live="polite" data-testid="drx-fluencia-lidas">{lidas} / {words.length}</span>
        <button type="button" className="snp-btn snp-btn--paper drx-tap px-4" aria-label={`Mais uma ${unidade} lida`} disabled={lidas >= words.length} onClick={() => setLast(lidas + 1)}>+</button>
        <button type="button" className="snp-btn snp-btn--sky drx-tap px-3 text-xs" disabled={lidas === words.length} onClick={() => setLast(words.length)}>Texto todo</button>
      </div>
      {asking && (
        <div ref={askRef} tabIndex={-1} role="alertdialog" aria-label={`Quantas ${unidades} foram lidas?`} className="snp-panel space-y-2 p-3" data-testid="drx-fluencia-pergunta">
          <p className="font-bold">Quantas {unidades} foram lidas?</p>
          <button type="button" className="snp-btn snp-btn--grass drx-tap w-full" onClick={() => finish(words.length)}>✓ Leu o texto completo ({words.length} {unidades})</button>
          <button type="button" className="snp-btn snp-btn--sky drx-tap w-full" onClick={pickInText}>👆 Selecionar última {unidade} no texto</button>
          <button type="button" className="snp-btn snp-btn--paper drx-tap w-full text-xs" onClick={() => finish(0)}>Não leu nenhuma {unidade}</button>
        </div>
      )}
      <button type="button" className="snp-btn snp-btn--grass drx-tap w-full" onClick={terminar}>Terminar corrida ✓</button>
      {!started && <p className="text-xs">Sem o cronômetro do aplicativo, o tempo registrado será de {FLUENCY_SECONDS} s (cronômetro externo).</p>}
    </div>
  );
}
