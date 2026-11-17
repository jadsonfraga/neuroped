import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AGE_BANDS, MAX_SECONDS, OBS10_VERSION, PHASES, bandForMonths, clock, phaseForSeconds } from "../protocol";
import { KITS, MATERIALS } from "../practical";
import { amendObservation, emptyHandoff, exportFilename, makeReport, parseAge, validCorrectedAge, type Observation, type SessionContext, type SessionRecord } from "../session";
import { sessionElapsed } from "../safety";
import { MaterialPicture, TaskPicture } from "../PracticalVisuals";
import { TaskResources } from "../FrameResources";
import { GUIDED_STYLE } from "../guidedStyle";
import { reviewText } from "../review";
import { printPlainTextDocument } from "@/lib/printDocument";
import {
  APPLICATOR_RECORDING, FASES_END, FASES_HELP, FASES_LABEL, FASES_SKIP, buildFasesPlan, cardId, entryCardOf, fasesSummary,
  flattenPlan, isMarked, markObservation, materialsFor, noteOf, phaseProgress, NOTE_MAX, RESPONSE_MAX, type FasesMark,
} from "./model";
import { applicatorResult, cardLine, phaseLine } from "./result";
import "./fases.css";

export interface FasesState { dirty: boolean; locked: boolean }
interface Props { signature: string; onState: (state: FasesState) => void }
type Stage = "start" | "play" | "end";
interface Interlude { done: number; final: boolean }
/** Toque duplo acidental não pode marcar o cartão seguinte. */
const TAP_GAP_MS = 350;

function saveFile(filename: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url; link.download = filename;
  document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** OBS-10 em fases: preparo em uma tela, um cartão por vez, um toque por resposta e entrega em um minuto.
 * Mesmos cartões, omissões, limite de 10 minutos e registro do Guia da assistente; nada de pontos ou acerto/erro. */
export default function FasesMode({ signature, onState }: Props) {
  const [years, setYears] = useState("");
  const [months, setMonths] = useState("");
  const [useCorrected, setUseCorrected] = useState(false);
  const [corrected, setCorrected] = useState("");
  const [prone, setProne] = useState(false);
  const [childOk, setChildOk] = useState(false);
  const [roomOk, setRoomOk] = useState(false);
  const [stage, setStage] = useState<Stage>("start");
  const [context, setContext] = useState<SessionContext | null>(null);
  const [cursor, setCursor] = useState(0);
  const [interlude, setInterlude] = useState<Interlude | null>(null);
  const [sub, setSub] = useState<null | "help" | "skip">(null);
  const [note, setNote] = useState("");
  const [observations, setObservations] = useState<Observation[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [endReason, setEndReason] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [code, setCode] = useState("");
  const [urgent, setUrgent] = useState(false);
  const [status, setStatus] = useState("");
  const [saved, setSaved] = useState<{ txt: string | null; json: string | null }>({ txt: null, json: null });
  const wall = useRef<number | null>(null);
  const mono = useRef<number | null>(null);
  const last = useRef(0);
  const ended = useRef(false);
  const lastTap = useRef(0);
  const focusNext = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const subPrompt = useRef<HTMLParagraphElement>(null);

  // Preparação: campo vazio vale zero quando o outro foi preenchido (bebês só em meses, crianças só em anos).
  const chrono = years === "" && months === "" ? null : parseAge(years === "" ? "0" : years, months === "" ? "0" : months);
  const correctedOn = useCorrected && chrono !== null && chrono < 24;
  const correctedValid = validCorrectedAge(chrono, corrected, correctedOn);
  const effective = chrono === null || !correctedValid ? null : correctedOn ? Number(corrected) : chrono;
  const band = effective === null ? undefined : bandForMonths(effective);
  const preview = useMemo(() => band && effective !== null ? flattenPlan(buildFasesPlan(band, effective, prone && band.min < 9)) : [], [band, effective, prone]);
  const ready = Boolean(band && childOk && roomOk);
  const missing = [!band && "idade", !childOk && "criança bem", !roomOk && "sala e kit"].filter(Boolean) as string[];

  const playBand = context ? AGE_BANDS.find((item) => item.id === context.bandId) : undefined;
  const plan = useMemo(() => context && playBand ? buildFasesPlan(playBand, context.correctedMonths ?? context.chronologicalMonths, context.proneAllowed) : [], [context, playBand]);
  const cards = useMemo(() => flattenPlan(plan), [plan]);
  const current = cards[cursor];
  const currentEntry = current ? observations.find((entry) => entry.id === cardId(current.task)) : undefined;
  const summary = fasesSummary(plan, observations);

  const dirty = stage !== "start" || years !== "" || months !== "";
  const locked = stage !== "start";
  // Antes da pintura: as abas de modo somem no mesmo quadro em que a coleta começa.
  useLayoutEffect(() => { onState({ dirty, locked }); }, [dirty, locked, onState]);
  useEffect(() => () => onState({ dirty: false, locked: false }), [onState]);

  const nowSecond = useCallback(() => {
    if (wall.current === null || mono.current === null) return 0;
    const value = sessionElapsed(wall.current, mono.current, Date.now(), performance.now(), last.current);
    last.current = value;
    return value;
  }, []);
  const finish = useCallback((reason: string) => {
    if (ended.current || wall.current === null) return;
    ended.current = true;
    setElapsed(nowSecond());
    setEndReason(reason);
    setInterlude(null); setSub(null); setStatus("");
    focusNext.current = true;
    setStage("end");
  }, [nowSecond]);
  useEffect(() => {
    if (stage !== "play") return;
    const tick = () => {
      const seconds = nowSecond();
      setElapsed(seconds);
      if (seconds >= MAX_SECONDS) finish(FASES_END.time);
    };
    const timer = setInterval(tick, 250);
    const hidden = () => { if (document.hidden) finish(FASES_END.hidden); };
    document.addEventListener("visibilitychange", hidden);
    return () => { clearInterval(timer); document.removeEventListener("visibilitychange", hidden); };
  }, [stage, nowSecond, finish]);
  useLayoutEffect(() => {
    if (!focusNext.current) return;
    focusNext.current = false;
    heading.current?.focus({ preventScroll: true });
    heading.current?.scrollIntoView({ block: "start", behavior: "auto" });
  }, [cursor, interlude, stage]);
  useEffect(() => { if (sub) subPrompt.current?.focus(); }, [sub]);

  function start() {
    if (!ready || !band || chrono === null || document.hidden) return;
    setContext({
      code: "", chronologicalMonths: chrono, correctedMonths: correctedOn ? Number(corrected) : null, bandId: band.id,
      schooling: "", language: "", adaptations: "", conditions: "", familyReport: "",
      proneAllowed: band.min < 9 && prone, preparation: "fases",
    });
    const suffix = typeof crypto.randomUUID === "function" ? crypto.randomUUID().slice(0, 8) : String(Math.floor(performance.now()));
    setSessionId(`${new Date().toISOString().replace(/[:.]/g, "-")}-${suffix}`);
    wall.current = Date.now(); mono.current = performance.now(); last.current = 0; ended.current = false;
    setObservations([]); setElapsed(0); setCursor(0); setNote(""); setSub(null); setInterlude(null); setStatus("");
    focusNext.current = true;
    setStage("play");
  }
  function goTo(index: number) {
    const target = Math.max(0, Math.min(cards.length - 1, index));
    setNote(noteOf(observations.find((entry) => entry.id === cardId(cards[target].task))));
    setSub(null); setInterlude(null);
    focusNext.current = true;
    setCursor(target);
  }
  function advance() {
    if (!current) return;
    const next = cards[cursor + 1];
    if (!next) { focusNext.current = true; setSub(null); setInterlude({ done: current.phase, final: true }); return; }
    goTo(cursor + 1);
    if (next.phase !== current.phase) setInterlude({ done: current.phase, final: false });
  }
  function record(mark: Omit<FasesMark, "note">) {
    if (stage !== "play" || !current) return;
    const now = performance.now();
    if (now - lastTap.current < TAP_GAP_MS) return;
    lastTap.current = now;
    const second = nowSecond();
    const task = current.task;
    setObservations((list) => {
      const existing = list.find((entry) => entry.id === cardId(task));
      const entry = markObservation(task, { ...mark, note }, second, existing, false);
      return existing ? list.map((item) => item.id === entry.id ? entry : item) : [...list, entry];
    });
    setStatus(`✓ ${task.title}: ${FASES_LABEL[mark.outcome]}`);
    advance();
  }
  function endEarly() {
    if (window.confirm("Encerrar a coleta agora? Depois não será possível aplicar novas tarefas.")) finish(FASES_END.early);
  }
  function emergency() {
    if (stage === "play") finish(FASES_END.emergency);
    setUrgent(true);
  }
  function editNote(id: string, response: string) {
    setObservations((list) => list.map((entry) => entry.id === id ? amendObservation(entry, { response }, true) : entry));
  }
  function reset() {
    if (!window.confirm("Baixou o resumo? Uma nova avaliação apaga os dados desta tela. Continuar?")) return;
    wall.current = null; mono.current = null; last.current = 0; ended.current = false;
    setYears(""); setMonths(""); setUseCorrected(false); setCorrected(""); setProne(false); setChildOk(false); setRoomOk(false);
    setContext(null); setObservations([]); setCursor(0); setInterlude(null); setSub(null); setNote(""); setElapsed(0); setEndReason("");
    setSessionId(""); setCode(""); setUrgent(false); setStatus(""); setSaved({ txt: null, json: null });
    setStage("start");
  }

  const sessionRecord: SessionRecord | null = context ? {
    version: OBS10_VERSION, sessionId, context: { ...context, code: code.trim() }, observations, handoff: emptyHandoff(),
    durationSeconds: elapsed, endReason: endReason || "em andamento", encodingSecond: null, recallSecond: null,
    recording: APPLICATOR_RECORDING,
  } : null;
  const result = stage === "end" && sessionRecord ? applicatorResult(sessionRecord) : null;
  const report = stage === "end" && sessionRecord ? `${makeReport(sessionRecord, signature)}\n\n${reviewText(sessionRecord)}` : "";
  const json = stage === "end" && sessionRecord ? JSON.stringify(sessionRecord, null, 2) : "";
  const stale = (saved.txt !== null && saved.txt !== report) || (saved.json !== null && saved.json !== json);

  const emergencyPanel = urgent && <section className="obs10-emergency" role="alert" aria-labelledby="fases-emergency-title">
    <h2 id="fases-emergency-title">Pare a avaliação. Chame o médico agora.</h2>
    <p>Alteração de consciência, crise, dificuldade respiratória, fraqueza súbita, instabilidade nova, dor intensa ou risco imediato: acione o fluxo presencial da clínica. Em emergência, <a href="tel:192">SAMU 192</a>. Não espere vídeo ou IA.</p>
    <p>Em crise: proteja de lesões, não contenha à força e não coloque nada na boca. Relato de autoagressão/abuso: pare a gravação sensível, acolha sem perguntas sugestivas e acione o médico; diante de risco imediato, não deixe sozinho.</p>
    <button type="button" onClick={() => setUrgent(false)}>Entendido · manter a coleta encerrada</button>
  </section>;

  if (stage === "start") {
    return <section className="fases" data-testid="obs10-fases-start" aria-labelledby="fases-start-title">
      <div className="fases-intro">
        <span className="fases-badge" aria-hidden="true">🎮</span>
        <div>
          <h2 id="fases-start-title">Avaliação em 6 fases</h2>
          <p>Sem câmera. Você lê o cartão, a criança faz, você toca no que aconteceu. O seu registro vira o resultado para o médico.</p>
        </div>
      </div>
      <ol className="fases-howto" aria-label="Em cada cartão">
        <li><span aria-hidden="true">1</span>Diga o pedido do cartão</li>
        <li><span aria-hidden="true">2</span>Espere uns 5 segundos; repita uma vez se precisar</li>
        <li><span aria-hidden="true">3</span>Toque no que aconteceu e siga</li>
      </ol>
      <div className="fases-setup">
        <fieldset className="fases-step">
          <legend><span aria-hidden="true">1</span>Idade da criança</legend>
          <div className="obs10-fields">
            <label>Anos completos<input type="number" inputMode="numeric" min="0" max="17" value={years} onChange={(e) => setYears(e.target.value)} /></label>
            <label>Meses adicionais<input type="number" inputMode="numeric" min="0" max="11" value={months} onChange={(e) => setMonths(e.target.value)} /></label>
          </div>
          {(years !== "" || months !== "") && chrono === null && <p className="obs10-error">Informe anos de 0 a 17 e meses de 0 a 11.</p>}
          {chrono !== null && chrono < 24 && <label className="obs10-check"><input type="checkbox" checked={useCorrected} onChange={(e) => setUseCorrected(e.target.checked)} />Prematuro: usar a idade corrigida informada pelo médico</label>}
          {correctedOn && <label>Idade corrigida em meses completos<input type="number" inputMode="numeric" min="0" max="23" value={corrected} onChange={(e) => setCorrected(e.target.value)} /></label>}
          {correctedOn && !correctedValid && <p role="alert" className="obs10-error">A idade corrigida não pode ser maior que a cronológica. Confirme com o médico.</p>}
          {band && <div className="obs10-band-selected" aria-live="polite"><span aria-hidden="true">{band.icon}</span><div><strong>Ficha: {band.label}</strong><p>{preview.length} cartões em 6 fases · até 10 minutos</p></div></div>}
          {band && band.min < 9 && <label className="obs10-check"><input type="checkbox" checked={prone} onChange={(e) => setProne(e.target.checked)} />O médico autorizou colocar de bruços (prono)</label>}
        </fieldset>
        <fieldset className="fases-step">
          <legend><span aria-hidden="true">2</span>Checklist de largada</legend>
          <button type="button" className="fases-toggle" aria-pressed={childOk} onClick={() => setChildOk((v) => !v)}><span aria-hidden="true">🧒</span><span><strong>Criança bem</strong><small>Acordada, confortável, sem mudança aguda; responsável por perto.</small></span></button>
          <button type="button" className="fases-toggle" aria-pressed={roomOk} onClick={() => setRoomOk((v) => !v)}><span aria-hidden="true">🛟</span><span><strong>Sala segura e kit separado</strong><small>Piso livre, sem peças pequenas ou comida; médico disponível.</small></span></button>
        </fieldset>
      </div>
      {band && <section className="fases-kit" aria-labelledby="fases-kit-title">
        <h3 id="fases-kit-title">Separe antes de começar</h3>
        <ul>{KITS[band.id].filter((item) => item.id !== "device").map((item) => <li key={item.id}><MaterialPicture id={item.id} label={MATERIALS[item.id].label} /><span>{MATERIALS[item.id].label}</span><small>{item.quantity ?? MATERIALS[item.id].quantity}</small></li>)}</ul>
        <p className="obs10-muted">Sem peças pequenas, comida ou vidro. Faltou algo? Na hora, toque em “Pular” e escolha “Falta material seguro”.</p>
      </section>}
      <button type="button" className="obs10-primary fases-go" disabled={!ready} onClick={start}><span aria-hidden="true">▶</span> Começar · 10 minutos</button>
      {!ready && <p className="fases-missing">Falta: {missing.join(" · ")}</p>}
      <p className="obs10-muted">Tela só para você. Não troque de aba: sair da tela encerra o cronômetro. Nada é enviado ao servidor; você aplica e registra, o médico interpreta.</p>
    </section>;
  }

  const currentPhase = current?.phase ?? 0;
  const expected = phaseForSeconds(elapsed);
  const phaseCards = current ? plan[current.phase].cards : [];
  const pick = current && !current.omission ? materialsFor({ ...plan[current.phase], cards: [current] }) : [];
  const path = <nav className="fases-path" aria-label="Fases da avaliação" data-testid="obs10-fases-path">
    <ol>{plan.map((phase) => {
      const progress = phaseProgress(phase, observations);
      const here = stage === "play" && phase.index === currentPhase;
      const label = <><span className="fases-node" aria-hidden="true">{progress.done ? "✓" : phase.icon}</span><span className="fases-node-label">Fase {phase.index + 1}</span><small>{progress.marked}/{progress.total}</small></>;
      return <li key={phase.index} className={`${here ? "is-current" : ""} ${progress.done ? "is-done" : ""}`}>
        {stage === "play"
          ? <button type="button" aria-current={here ? "step" : undefined} aria-label={`Fase ${phase.index + 1}, ${phase.title}: ${progress.marked} de ${progress.total} cartões marcados`} onClick={() => goTo(entryCardOf(phase, observations))}>{label}</button>
          : <div aria-label={`Fase ${phase.index + 1}, ${phase.title}: ${progress.marked} de ${progress.total} cartões marcados`} role="img">{label}</div>}
      </li>;
    })}</ol>
  </nav>;

  if (stage === "end") {
    const notes = plan.flatMap((phase) => phase.cards.map((card) => ({ card, entry: observations.find((item) => item.id === cardId(card.task) && item.outcome && item.outcome !== "NA") }))).filter((item) => item.entry);
    return <section className="fases" data-testid="obs10-fases-end" aria-labelledby="fases-end-title">
      <style>{GUIDED_STYLE}</style>
      <div className="fases-finish">
        <span className="fases-badge" aria-hidden="true">🏁</span>
        <div><h2 id="fases-end-title" ref={heading} tabIndex={-1}>Coleta encerrada</h2><p>{endReason} Não aplique novas tarefas.</p></div>
      </div>
      <dl className="fases-stats">
        <div><dt>Cartões marcados</dt><dd>{summary.marked}/{summary.total}</dd></div>
        <div><dt>Pulados</dt><dd>{summary.skipped}</dd></div>
        <div><dt>Sem marca</dt><dd>{summary.unmarked}</dd></div>
        <div><dt>Tempo de coleta</dt><dd>{clock(elapsed)}</dd></div>
      </dl>
      {path}
      {result && <section className="fases-result" aria-labelledby="fases-result-title" data-testid="obs10-fases-result">
        <h3 id="fases-result-title">Resultado pelo seu registro</h3>
        <p className="obs10-muted">Organizado a partir do que você marcou, sem vídeo. É descrição para o médico, não nota nem diagnóstico: “não fez agora” e “não quis” não indicam incapacidade.</p>
        <ul className="fases-result-phases">{result.phases.map((phase) => <li key={phase.index}><strong>{phase.icon} Fase {phase.index + 1} · {phase.title}</strong><span>{phaseLine(phase)}</span></li>)}</ul>
        <h4>Para o médico conferir na consulta</h4>
        {result.toReview.length ? <ul className="fases-result-list">{result.toReview.map((card) => <li key={`${card.phase}-${card.title}`}>{cardLine(card)}</li>)}</ul> : <p>Nenhum cartão marcado com ajuda, “não fez agora” ou “não quis”.</p>}
        {result.skipped.length > 0 && <><h4>Não aplicados</h4><ul className="fases-result-list">{result.skipped.map((card) => <li key={`${card.phase}-${card.title}`}>Fase {card.phase + 1} · {card.title}: {card.reason || "motivo não informado"}</li>)}</ul></>}
      </section>}
      <section className="fases-deliver" aria-labelledby="fases-deliver-title">
        <h3 id="fases-deliver-title">Entregar ao médico</h3>
        <label>Código do registro, sem nome (opcional)<input value={code} maxLength={32} placeholder="Ex.: OBS-001" onChange={(e) => setCode(e.target.value)} /></label>
        <div className="fases-actions">
          <button type="button" className="obs10-primary" onClick={() => { saveFile(exportFilename(code, "txt", sessionId), report, "text/plain;charset=utf-8"); setSaved((s) => ({ ...s, txt: report })); setStatus("Resumo baixado. Confira o arquivo antes de sair."); }}><span aria-hidden="true">⬇</span> Baixar resumo (TXT)</button>
          <button type="button" onClick={() => { saveFile(exportFilename(code, "json", sessionId), json, "application/json;charset=utf-8"); setSaved((s) => ({ ...s, json })); setStatus("Arquivo para reabrir baixado."); }}><span aria-hidden="true">⬇</span> Baixar arquivo para reabrir (JSON)</button>
          <button type="button" onClick={() => { if (!printPlainTextDocument({ title: "OBS-10 — resumo da coleta em fases", text: report })) setStatus("Impressão bloqueada pelo navegador. Use o download do resumo."); }}><span aria-hidden="true">🖨</span> Imprimir resumo</button>
        </div>
        {stale && <p className="obs10-caution" role="status">Você mudou algo depois do último download. Baixe de novo para levar a versão atual.</p>}
        {status && <p role="status" className="fases-status">{status}</p>}
        <p className="obs10-muted">Tudo fica só nesta tela. Baixe antes de sair ou começar outra avaliação. O JSON também reabre no “Guia da assistente”.</p>
      </section>
      {notes.length > 0 && <details className="fases-notes" open={summary.withoutNote > 0}>
        <summary>Notas para o médico (opcional) · {summary.withoutNote} cartão(ões) sem nota</summary>
        <p className="obs10-muted">Opcional. Escreva só o que viu ou ouviu, com as palavras da criança. Não escreva “normal”. Sem nota, vale a categoria que você marcou.</p>
        {notes.map(({ card, entry }) => entry && <label key={entry.id}>{plan[card.phase].icon} {card.task.title} · {FASES_LABEL[entry.outcome as keyof typeof FASES_LABEL]}
          <textarea value={entry.response} maxLength={RESPONSE_MAX} placeholder="O que a criança fez ou falou?" onChange={(e) => editNote(entry.id, e.target.value)} />
        </label>)}
      </details>}
      <details className="fases-report"><summary>Ver o resumo completo</summary><pre>{report}</pre></details>
      <button type="button" className="obs10-secondary fases-restart" onClick={reset}><span aria-hidden="true">↺</span> Nova avaliação</button>
      {emergencyPanel}
    </section>;
  }

  return <section className="fases" data-testid="obs10-fases-play" aria-label="Coleta em fases">
    <style>{GUIDED_STYLE}</style>
    <div className="fases-hud" data-testid="obs10-fases-hud">
      <div className={`fases-clock ${elapsed >= 510 ? "is-ending" : ""}`}><span aria-label="Tempo de aplicação" data-testid="obs10-fases-clock">{clock(elapsed)}</span><small>/ 10:00</small></div>
      <progress className="obs10-progress" max={MAX_SECONDS} value={elapsed} aria-label="Tempo utilizado da coleta" />
      <span className="fases-band">{playBand?.icon} {playBand?.label}</span>
      <button type="button" onClick={endEarly}><span aria-hidden="true">■</span> Encerrar</button>
      <button type="button" className="obs10-danger" onClick={emergency}><span aria-hidden="true">🆘</span> Parar e chamar médico</button>
    </div>
    {path}
    {!interlude && expected > currentPhase && <div className="fases-hint" role="status">
      <span>⏱ O relógio já está na fase {expected + 1}: {PHASES[expected].title}. Não prolongue.</span>
      <button type="button" onClick={() => goTo(entryCardOf(plan[expected], observations))}>Ir para a fase {expected + 1}</button>
    </div>}
    {interlude ? <section className="fases-interlude" data-testid="obs10-fases-interlude" aria-labelledby="fases-interlude-title">
      <div className="fases-burst" aria-hidden="true">{interlude.final ? "🏆" : "🎉"}</div>
      <h2 id="fases-interlude-title" ref={heading} tabIndex={-1}>{interlude.final ? "Todas as fases percorridas!" : `Fase ${interlude.done + 1} concluída!`}</h2>
      <p>{phaseProgress(plan[interlude.done], observations).marked} de {plan[interlude.done].cards.length} {plan[interlude.done].cards.length === 1 ? "cartão marcado" : "cartões marcados"} nesta fase.</p>
      {interlude.final ? <>
        <p>Encerre para ver o resumo e baixar o registro. Não repita tarefas para completar os dez minutos.</p>
        <button type="button" className="obs10-primary fases-go" onClick={() => finish(FASES_END.done)}><span aria-hidden="true">🏁</span> Encerrar e ver resumo</button>
        <button type="button" onClick={() => { focusNext.current = true; setInterlude(null); }}><span aria-hidden="true">◀</span> Rever um cartão</button>
      </> : <>
        <div className="fases-next">
          <strong>Próxima: {PHASES[interlude.done + 1].icon} Fase {interlude.done + 2} · {PHASES[interlude.done + 1].title}</strong>
          {materialsFor(plan[interlude.done + 1]).length > 0 ? <p>Pegue: {materialsFor(plan[interlude.done + 1]).join(", ")}.</p> : <p>Nenhum objeto novo para pegar.</p>}
        </div>
        <button type="button" className="obs10-primary fases-go" onClick={() => { focusNext.current = true; setInterlude(null); }}><span aria-hidden="true">▶</span> Começar a fase {interlude.done + 2}</button>
      </>}
    </section> : current && <article key={current.task.id} className="fases-card" data-testid="obs10-fases-card" data-task-id={current.task.id}>
      <div className="fases-card-top"><span className="fases-chip">{PHASES[current.phase].icon} Fase {current.phase + 1} · {PHASES[current.phase].title}</span><span>Cartão {phaseCards.indexOf(current) + 1} de {phaseCards.length}</span></div>
      <h2 ref={heading} tabIndex={-1}>{current.task.title}</h2>
      <TaskPicture scene={current.task.scene} label={`Guia visual: ${current.task.title}`} />
      {current.omission ? <div className="fases-omit" role="note">
        <strong>Esta tarefa não se aplica agora.</strong>
        <p>{current.omission}</p>
        <button type="button" className="obs10-primary fases-go" onClick={() => record({ outcome: "NA", assistance: current.omission ?? "" })}>Registrar e seguir <span aria-hidden="true">➜</span></button>
      </div> : <>
        {pick.length > 0 && <p className="fases-pick"><strong>Pegue:</strong> {pick.join(", ")}</p>}
        <div className="obs10-say fases-say"><span>DIGA / FAÇA</span><p>{current.say}</p></div>
        <ol className="fases-steps">{current.steps.map((step, n) => <li key={`${current.task.id}-${n}`}>{step}</li>)}</ol>
        <p className="fases-observe"><strong>Observe:</strong> {current.observe}</p>
        {current.task.model && <p className="fases-flag">👀 Esta tarefa já inclui uma demonstração. “Mostrei como fazer” é só para ajuda extra.</p>}
        {current.task.walking && <p className="fases-flag">Só com marcha estável, sem dor e com proteção por perto. Se não, toque em “Pular”.</p>}
        <label className="fases-note">Nota rápida (opcional): o que fez ou falou<input value={note} maxLength={NOTE_MAX} placeholder="Ex.: disse “bola” e apontou" onChange={(e) => setNote(e.target.value)} /></label>
        <div className="fases-choices" role="group" aria-label="O que aconteceu?" data-testid="obs10-fases-choices">
          {sub === null && <>
            <button type="button" onClick={() => record({ outcome: "E" })}><span aria-hidden="true">✅</span>Fez sem ajuda extra</button>
            <button type="button" onClick={() => setSub("help")}><span aria-hidden="true">🤝</span>Fez com ajuda…</button>
            <button type="button" onClick={() => record({ outcome: "ND" })}><span aria-hidden="true">⏳</span>Não fez agora</button>
            <button type="button" onClick={() => record({ outcome: "R" })}><span aria-hidden="true">✋</span>Não quis</button>
            <button type="button" onClick={() => setSub("skip")}><span aria-hidden="true">⏭</span>Pular…</button>
          </>}
          {sub === "help" && <>
            <p ref={subPrompt} tabIndex={-1} className="fases-sub-title">Que ajuda você deu?</p>
            {FASES_HELP.map((help) => <button type="button" key={help.outcome} onClick={() => record({ outcome: help.outcome, assistance: help.assistance })}><span aria-hidden="true">{help.icon}</span>{help.label}</button>)}
            <button type="button" className="fases-back" onClick={() => setSub(null)}><span aria-hidden="true">◀</span> Voltar às opções</button>
          </>}
          {sub === "skip" && <>
            <p ref={subPrompt} tabIndex={-1} className="fases-sub-title">Por que pular?</p>
            {FASES_SKIP.map((reason) => <button type="button" key={reason} onClick={() => record({ outcome: "NA", assistance: reason })}>{reason}</button>)}
            <button type="button" className="fases-back" onClick={() => setSub(null)}><span aria-hidden="true">◀</span> Voltar às opções</button>
          </>}
        </div>
        <p className="obs10-muted">Nenhuma opção vale ponto. “Não fez agora” e “Não quis” não provam incapacidade.</p>
        <details className="fases-more"><summary>Material e recurso na tela</summary><TaskResources task={current.task} bandId={playBand?.id ?? ""} kit={{}} screenAllowed showCamera={false} /></details>
      </>}
      {currentEntry?.outcome && <p className="fases-saved">Já marcado: {FASES_LABEL[currentEntry.outcome]}. Toque em outra opção para trocar.</p>}
      <div className="fases-nav">
        <button type="button" disabled={cursor === 0} onClick={() => goTo(cursor - 1)}><span aria-hidden="true">◀</span> Cartão anterior</button>
        {isMarked(current, observations) && <button type="button" onClick={advance}>Próximo cartão <span aria-hidden="true">▶</span></button>}
      </div>
    </article>}
    <p className="fases-status" role="status">{status}</p>
    {emergencyPanel}
  </section>;
}
