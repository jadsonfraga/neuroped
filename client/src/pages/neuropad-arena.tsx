import { useEffect, useState } from "react";
import { DESCRIPTIVE_NOTICE } from "@/lib/descriptiveNotice";
import { useSpeech } from "@/hooks/useSpeech";
import {
  ARENA_STORAGE_KEY,
  BANDS,
  BOLT_WINDOW_MS,
  CONSTELLATION_STARS,
  GAME_LABEL,
  GAME_ORDER,
  actBolt,
  advanceClock,
  beginRound,
  childPhrase,
  clearStoredFicha,
  clinicalNotes,
  completeCurrent,
  emptyFicha,
  familyPresentation,
  fichaJson,
  giveMemory,
  guessLetter,
  hearDictation,
  hideMemory,
  homeIdeas,
  lantern,
  loadFicha,
  openTab,
  pauseOnHide,
  pickFigure,
  pickSound,
  readingDocument,
  readingName,
  resumeRound,
  roundMap,
  saveFicha,
  showMemoryAgain,
  skyOf,
  submitLetters,
  submitMemory,
  submitPhrase,
  syllableLine,
  toggleLetter,
  undoLetter,
  undoMemory,
  writePhrase,
  type AgeBandId,
  type Ficha,
  type GameId,
  type GuessEffect,
  type MissionMode,
  type Play,
} from "@/features/arena/engine";
import "@/styles/arena.css";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const ACCENTS = ["Á", "Â", "Ã", "É", "Ê", "Í", "Ó", "Ô", "Õ", "Ú", "Ç"];

const EFFECT_TEXT: Record<GuessEffect, string> = {
  repetida: "Essa letra já foi. Nenhuma estrela se apagou.",
  acesa: "Uma letra acendeu.",
  apagou: "Uma estrela apagou.",
  completa: "A palavra apareceu.",
  "ceu-apagado": "O céu desta palavra apagou. As sílabas ficam aqui.",
  ignorada: "",
};

const GAME_CHOICES: readonly { id: GameId; label: string }[] = GAME_ORDER.map((id) => ({ id, label: GAME_LABEL[id] }));

function storage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** Aplica a mudança somente se a jogada aberta ainda for do tipo esperado; qualquer outra tela fica intacta. */
function updatePlay<G extends Play["game"]>(game: G, change: (play: Extract<Play, { game: G }>) => Play) {
  return (current: Ficha): Ficha => (current.play?.game === game
    ? { ...current, play: change(current.play as Extract<Play, { game: G }>) }
    : current);
}

export default function NeuroPadArenaPage() {
  const [ficha, setFicha] = useState<Ficha>(() => emptyFicha());
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState("");
  const [armedClear, setArmedClear] = useState(false);
  const { speak } = useSpeech();

  useEffect(() => {
    setFicha(loadFicha(storage()));
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const box = storage();
    if (!box) return;
    try {
      saveFicha(box, ficha);
    } catch {
      setStatus("A ficha continua nesta tela. O aparelho não guardou a cópia.");
    }
  }, [ficha, ready]);

  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") setFicha((current) => pauseOnHide(current));
    };
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, []);

  const clockOn = ready && !ficha.paused && ficha.tab === "missao" && Boolean(ficha.play) && !ficha.play?.settled;
  const clockKey = `${ficha.play?.game ?? ""}:${ficha.play?.itemId ?? ""}:${ficha.cursor}`;
  useEffect(() => {
    if (!clockOn) return;
    const timer = window.setInterval(() => setFicha((current) => advanceClock(current, 250)), 250);
    return () => window.clearInterval(timer);
  }, [clockOn, clockKey]);

  const ditadoId = ficha.play?.game === "ditado" ? ficha.play.itemId : "";
  const ditadoListens = ficha.play?.game === "ditado" ? ficha.play.listens : 0;
  const ditadoSpoken = ficha.play?.game === "ditado" ? ficha.play.spoken : "";
  useEffect(() => {
    if (ficha.paused || ficha.tab !== "missao" || !ditadoId || ditadoListens > 0) return;
    speak(ditadoSpoken);
    setFicha((current) => {
      if (current.play?.game !== "ditado" || current.play.listens > 0) return current;
      return { ...current, play: hearDictation(current.play) };
    });
  }, [ficha.paused, ficha.tab, ditadoId, ditadoListens, ditadoSpoken, speak]);

  const play = ficha.play;
  const nome = readingName(ficha.trials);
  const familia = familyPresentation(nome);
  const ideias = homeIdeas();
  const mapa = roundMap(ficha.queue, ficha.trials);
  const estrelas = skyOf(ficha.queue.length ? ficha.queue : GAME_ORDER, ficha.trials);
  const finished = ficha.queue.length > 0 && !play && ficha.cursor >= ficha.queue.length;

  function start(mode: MissionMode) {
    setStatus("");
    setFicha(beginRound(ficha.band, mode, new Date().toISOString()));
  }

  function setBand(band: AgeBandId) {
    if (play) return;
    setFicha((current) => ({ ...current, band }));
  }

  function guess(letter: string) {
    if (ficha.paused || play?.game !== "constelacao" || play.settled) return;
    setStatus(EFFECT_TEXT[guessLetter(play, letter, ficha.band).effect]);
    setFicha((current) => (current.paused ? current : updatePlay("constelacao", (constelacao) => guessLetter(constelacao, letter, current.band).play)(current)));
  }

  async function copyReading() {
    const text = readingDocument(ficha);
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
      else throw new Error("sem clipboard");
      setStatus("Leitura copiada.");
    } catch {
      setStatus("Não foi possível copiar. A leitura continua nesta tela.");
    }
  }

  function downloadReading() {
    const blob = new Blob([fichaJson(ficha)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "arena-rodada.json";
    anchor.rel = "noopener";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setStatus("JSON desta rodada baixado neste aparelho.");
  }

  function erase() {
    if (!armedClear) {
      setArmedClear(true);
      setStatus("Toque de novo para apagar a ficha deste aparelho.");
      return;
    }
    const box = storage();
    if (box) {
      try {
        clearStoredFicha(box);
      } catch {
        /* a tela ainda zera */
      }
    }
    setFicha(emptyFicha());
    setArmedClear(false);
    setStatus("Ficha apagada deste aparelho.");
  }

  return (
    <div className="arena" data-testid="neuropad-arena" data-storage-key={ARENA_STORAGE_KEY}>
      <p className="arena-kicker">NeuroPad</p>
      <h1>Arena</h1>
      <p className="arena-lead">Um céu de cinco brincadeiras curtas. No fim, a leitura descreve esta rodada para a família e para o consultório.</p>
      <p className="arena-note">{DESCRIPTIVE_NOTICE}</p>
      <div role="tablist" aria-label="Arena" className="arena-tabs">
        <button type="button" role="tab" className="arena-tab" aria-selected={ficha.tab === "missao"} data-testid="tab-missao" onClick={() => setFicha((current) => openTab(current, "missao"))}>Missão</button>
        <button type="button" role="tab" className="arena-tab" aria-selected={ficha.tab === "leitura"} data-testid="tab-leitura" onClick={() => setFicha((current) => openTab(current, "leitura"))}>Leitura</button>
      </div>
      <p className="arena-status" role="status">{status}</p>

      {ficha.tab === "missao" ? (
        <section aria-label="Missão">
          {ficha.paused && play ? (
            <div className="arena-panel arena-pause" data-testid="missao-pausada">
              <p>A missão pausou. A jogada continua aqui.</p>
              <button type="button" className="arena-primary" onClick={() => setFicha((current) => resumeRound(current))}>Continuar</button>
            </div>
          ) : null}

          {!play && !finished ? (
            <Lobby band={ficha.band} onBand={setBand} onStart={start} />
          ) : null}

          {finished ? (
            <div className="arena-panel">
              <p>O céu desta rodada fechou.</p>
              <div className="arena-actions">
                <button type="button" className="arena-primary" onClick={() => setFicha((current) => openTab(current, "leitura"))}>Ver a leitura</button>
                <button type="button" className="arena-quiet" onClick={() => setFicha(emptyFicha(ficha.band))}>Nova rodada</button>
              </div>
            </div>
          ) : null}

          {play ? (
            <div className="arena-panel" data-testid="missao-jogo">
              <p className="arena-label">{GAME_LABEL[play.game]} · {Math.min(ficha.cursor + 1, ficha.queue.length)} de {ficha.queue.length}</p>
              {play.settled ? (
                <Closing play={play} onNext={() => setFicha((current) => completeCurrent(current))} />
              ) : (
                <PlayField
                  ficha={ficha}
                  paused={ficha.paused}
                  onGuess={guess}
                  onLantern={() => setFicha(lantern)}
                  onHear={() => {
                    if (ficha.play?.game !== "ditado") return;
                    speak(ficha.play.spoken);
                    setFicha(updatePlay("ditado", hearDictation));
                  }}
                  onFigure={(id) => setFicha(updatePlay("ditado", (dictation) => pickFigure(dictation, id)))}
                  onLetter={(letter) => setFicha(updatePlay("ditado", (dictation) => toggleLetter(dictation, letter)))}
                  onUndoLetter={() => setFicha(updatePlay("ditado", undoLetter))}
                  onSubmitLetters={() => setFicha((current) => updatePlay("ditado", (dictation) => submitLetters(dictation, current.band))(current))}
                  onWrite={(written) => setFicha(updatePlay("ditado", (dictation) => writePhrase(dictation, written)))}
                  onSubmitPhrase={() => setFicha((current) => updatePlay("ditado", (dictation) => submitPhrase(dictation, current.band))(current))}
                  onSound={(id) => setFicha(updatePlay("trilha", (trail) => pickSound(trail, id)))}
                  onHideMemory={() => setFicha(updatePlay("bau", hideMemory))}
                  onShowMemory={() => setFicha(updatePlay("bau", showMemoryAgain))}
                  onGive={(id) => setFicha(updatePlay("bau", (memory) => giveMemory(memory, id)))}
                  onUndoMemory={() => setFicha(updatePlay("bau", undoMemory))}
                  onSubmitMemory={() => setFicha(updatePlay("bau", submitMemory))}
                  onBolt={(action) => setFicha(updatePlay("relampago", (bolt) => actBolt(bolt, action)))}
                />
              )}
            </div>
          ) : null}
        </section>
      ) : (
        <section aria-label="Leitura" data-testid="leitura">
          <div className="arena-stars" data-testid="leitura-estrelas" aria-label={`${estrelas.filter((star) => star.acesa).length} estrelas acesas de ${estrelas.length}`}>
            {estrelas.map((star) => <span key={star.id} data-acesa={star.acesa ? "true" : "false"}>{star.acesa ? "★" : "☆"}</span>)}
          </div>
          <p data-testid="leitura-crianca">{childPhrase(nome)}</p>
          <p className="arena-rotulo" data-testid="leitura-rotulo">{familia.rotulo}</p>
          <p data-testid="leitura-frase">{familia.frase}</p>
          <h2>Mapa da rodada</h2>
          <div className="arena-map">
            {mapa.length === 0 ? <p>A rodada ainda não começou.</p> : mapa.map((row) => (
              <article key={row.game}>
                <h3>{GAME_LABEL[row.game]}</h3>
                <p>{row.nome}</p>
                <p>{row.linha}</p>
                {row.detalhe ? <p>{row.detalhe}</p> : null}
              </article>
            ))}
          </div>
          <h2>Em casa</h2>
          <ol>
            {ideias.map((ideia) => <li key={ideia}>{ideia}</li>)}
          </ol>
          <h2>Notas para o consultório</h2>
          <ul className="arena-limits">
            {clinicalNotes(ficha).map((note) => <li key={note}>{note}</li>)}
          </ul>
          <div className="arena-actions">
            <button type="button" className="arena-primary" data-testid="leitura-copiar" onClick={() => void copyReading()}>Copiar a leitura</button>
            <button type="button" className="arena-quiet" data-testid="leitura-json" onClick={downloadReading}>Baixar JSON</button>
            <button type="button" className="arena-danger" data-testid="leitura-apagar" onClick={erase}>{armedClear ? "Apagar agora" : "Apagar a ficha"}</button>
          </div>
        </section>
      )}
    </div>
  );
}

function Lobby({ band, onBand, onStart }: { band: AgeBandId; onBand: (band: AgeBandId) => void; onStart: (mode: MissionMode) => void }) {
  return (
    <div className="arena-panel" data-testid="arena-lobby">
      <p className="arena-label">Faixa da criança</p>
      <div className="arena-bands">
        {BANDS.map((item) => (
          <button key={item.id} type="button" className="arena-band" aria-pressed={band === item.id} data-testid={`faixa-${item.id}`} onClick={() => onBand(item.id)}>{item.label}</button>
        ))}
      </div>
      <div className="arena-actions">
        <button type="button" className="arena-primary" data-testid="comecar-missao" onClick={() => onStart("missao")}>Missão completa</button>
      </div>
      <p className="arena-label">Ou uma brincadeira</p>
      <div className="arena-games">
        {GAME_CHOICES.map((game) => (
          <button key={game.id} type="button" className="arena-choice" data-testid={`jogar-${game.id}`} onClick={() => onStart(game.id)}>{game.label}</button>
        ))}
      </div>
    </div>
  );
}

function Closing({ play, onNext }: { play: Play; onNext: () => void }) {
  return (
    <div data-testid="jogada-fechada">
      {play.game === "constelacao" ? <p className="arena-syllables" data-testid="silabas">{syllableLine(play.syllables)}</p> : <p>A jogada ficou anotada.</p>}
      <button type="button" className="arena-primary" onClick={onNext}>Seguir</button>
    </div>
  );
}

function PlayField(props: {
  ficha: Ficha;
  paused: boolean;
  onGuess: (letter: string) => void;
  onLantern: () => void;
  onHear: () => void;
  onFigure: (id: string) => void;
  onLetter: (letter: string) => void;
  onUndoLetter: () => void;
  onSubmitLetters: () => void;
  onWrite: (written: string) => void;
  onSubmitPhrase: () => void;
  onSound: (id: string) => void;
  onHideMemory: () => void;
  onShowMemory: () => void;
  onGive: (id: string) => void;
  onUndoMemory: () => void;
  onSubmitMemory: () => void;
  onBolt: (action: "pegar" | "deixar") => void;
}) {
  const play = props.ficha.play;
  if (!play) return null;
  const disabled = props.paused;
  if (play.game === "constelacao") {
    const letters = props.ficha.band === "9-11" ? [...ALPHABET, ...ACCENTS] : ALPHABET;
    return (
      <div>
        <div className="arena-stars" data-testid="constelacao-estrelas" aria-label={`${play.stars} estrelas no céu`}>{"★".repeat(play.stars)}{"☆".repeat(Math.max(0, CONSTELLATION_STARS - play.stars))}</div>
        <div className="arena-word" aria-label="Palavra">
          {[...play.word].map((char, index) => <span key={`${char}-${index}`} className="arena-slot" data-testid={`slot-${index}`}>{play.revealed[index] ? char : "·"}</span>)}
        </div>
        <div className="arena-keys">
          {letters.map((letter) => <button key={letter} type="button" className="arena-key" data-testid={`letra-${letter}`} disabled={disabled} onClick={() => props.onGuess(letter)}>{letter}</button>)}
        </div>
        <div className="arena-actions">
          <button type="button" className="arena-quiet" disabled={disabled} onClick={props.onLantern}>Lanterna</button>
        </div>
      </div>
    );
  }
  if (play.game === "ditado") {
    return (
      <div>
        <p>Ouça a palavra e responda do jeito desta faixa.</p>
        {play.promptVisible ? <p data-testid="palavra-a-mostra">{play.spoken}</p> : null}
        <div className="arena-actions">
          <button type="button" className="arena-quiet" disabled={disabled} data-testid="ouvir-de-novo" onClick={props.onHear}>Ouvir de novo</button>
          <button type="button" className="arena-quiet" disabled={disabled} onClick={props.onLantern}>Lanterna</button>
        </div>
        {play.mode === "figura" ? (
          <div className="arena-figures">
            {play.options.map((option) => (
              <button key={option.id} type="button" className="arena-figure" disabled={disabled} aria-label={option.label} data-testid={`figura-${option.id}`} onClick={() => props.onFigure(option.id)}>{option.glyph}</button>
            ))}
          </div>
        ) : null}
        {play.mode === "letras" ? (
          <div>
            <p data-testid="letras-montadas">{play.assembled.join("") || "·"}</p>
            <div className="arena-keys">
              {play.letters.map((letter, index) => <button key={`${letter}-${index}`} type="button" className="arena-key" disabled={disabled} onClick={() => props.onLetter(letter)}>{letter}</button>)}
            </div>
            <div className="arena-actions">
              <button type="button" className="arena-quiet" disabled={disabled} onClick={props.onUndoLetter}>Tirar</button>
              <button type="button" className="arena-primary" disabled={disabled} onClick={props.onSubmitLetters}>Pronto</button>
            </div>
          </div>
        ) : null}
        {play.mode === "frase" ? (
          <div>
            <input className="arena-phrase" aria-label="Escrever a frase" value={play.written} disabled={disabled} onChange={(event) => props.onWrite(event.target.value)} />
            <div className="arena-actions">
              <button type="button" className="arena-primary" disabled={disabled} onClick={props.onSubmitPhrase}>Pronto</button>
            </div>
          </div>
        ) : null}
      </div>
    );
  }
  if (play.game === "trilha") {
    const step = play.steps[play.step];
    if (!step) return null;
    return (
      <div>
        <p className="arena-label">{step.clue}</p>
        <p className="arena-syllables">{step.prompt}</p>
        <div className="arena-games">
          {step.options.map((option) => (
            <button key={option.id} type="button" className="arena-choice" disabled={disabled} data-hint={play.hint && option.id === step.answer ? "true" : "false"} data-testid={`som-${option.id}`} onClick={() => props.onSound(option.id)}>{option.label}</button>
          ))}
        </div>
        <button type="button" className="arena-quiet" disabled={disabled} onClick={props.onLantern}>Lanterna</button>
      </div>
    );
  }
  if (play.game === "bau") {
    return (
      <div>
        {play.phase === "mostra" ? (
          <div>
            <p>Guarde esta ordem.</p>
            <div className="arena-pieces" data-testid="bau-ordem">
              {play.sequence.map((piece) => <span key={piece.id} className="arena-piece">{piece.glyph}</span>)}
            </div>
            <div className="arena-actions">
              <button type="button" className="arena-primary" disabled={disabled} onClick={props.onHideMemory}>Já guardei</button>
              <button type="button" className="arena-quiet" disabled={disabled} onClick={props.onShowMemory}>Ver de novo</button>
            </div>
          </div>
        ) : (
          <div>
            <p>Devolva na mesma ordem.</p>
            <p data-testid="bau-devolvido">{play.given.join(" · ") || "·"}</p>
            <div className="arena-pieces">
              {play.sequence.map((piece) => (
                <button key={piece.id} type="button" className="arena-piece" disabled={disabled || play.given.includes(piece.id)} data-testid={`bau-${piece.id}`} onClick={() => props.onGive(piece.id)}>{piece.glyph}</button>
              ))}
            </div>
            <div className="arena-actions">
              <button type="button" className="arena-quiet" disabled={disabled} onClick={props.onUndoMemory}>Tirar</button>
              <button type="button" className="arena-quiet" disabled={disabled} onClick={props.onShowMemory}>Ver de novo</button>
              <button type="button" className="arena-primary" disabled={disabled} onClick={props.onSubmitMemory}>Pronto</button>
            </div>
          </div>
        )}
      </div>
    );
  }
  const kind = play.sequence[play.index];
  const expected = kind === "estrela" ? "pegar" : "deixar passar";
  return (
    <div>
      <p className="arena-bolt" data-testid="relampago-alvo">{kind === "estrela" ? "⭐" : "☄️"}</p>
      <div className="arena-meter" aria-hidden="true"><i style={{ width: `${Math.max(0, (play.remainingMs / BOLT_WINDOW_MS) * 100)}%` }} /></div>
      {play.hint ? <p data-testid="relampago-lanterna">A lanterna aponta: {expected}.</p> : null}
      <div className="arena-actions">
        <button type="button" className="arena-primary" disabled={disabled} data-testid="relampago-pegar" onClick={() => props.onBolt("pegar")}>Pegar</button>
        <button type="button" className="arena-quiet" disabled={disabled} data-testid="relampago-deixar" onClick={() => props.onBolt("deixar")}>Deixar passar</button>
        <button type="button" className="arena-quiet" disabled={disabled} onClick={props.onLantern}>Lanterna</button>
      </div>
    </div>
  );
}
