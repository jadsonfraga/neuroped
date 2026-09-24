import { useEffect, useRef, useState } from "react";
import { Film, Link2, Play, ShieldCheck, Stethoscope } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import type { SessionRecord } from "./session";
import { PRACTICAL_TASKS } from "./practical";
import { canAddMedicalReview, DECISIONS, emptyEvidence, MAX_CLIPS, MAX_MOMENTS, MAX_REVIEWS, MAX_VIDEO_BYTES, mediaClock, momentChanged, reviewChanged, snapshotObservation, validMoment, type EvidenceBundle, type EvidenceMoment } from "./evidence";

type LocalMedia = { url: string; sha256: string; bytes: number; mime: string; name: string; duration: number | null };
const key = () => crypto.randomUUID();
export function EvidencePanel({ record, onChange, onLocalClipConfirmed }: { record: SessionRecord; onChange: (e: EvidenceBundle) => void; onLocalClipConfirmed?: (clipId: string) => void }) {
  const { accessMode, user } = useAuth();
  const canReview = canAddMedicalReview(accessMode, user?.role);
  const e = record.evidence ?? emptyEvidence();
  const [targetClip, setTargetClip] = useState("");
  const [local, setLocal] = useState<LocalMedia | null>(null);
  const [confirmedId, setConfirmedId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [position, setPosition] = useState(0);
  const [playable, setPlayable] = useState(false);
  const [taskId, setTaskId] = useState(record.observations[0]?.id ?? "");
  const [start, setStart] = useState<{ second: number; taskId: string; clipId: string } | null>(null);
  const [activeMoment, setActiveMoment] = useState("");
  const [decision, setDecision] = useState<typeof DECISIONS[number] | "">("");
  const [comment, setComment] = useState("");
  const [watched, setWatched] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const generation = useRef(0);
  const url = useRef<string | null>(null);
  const mounted = useRef(true);
  const playEnd = useRef<number | null>(null);
  const currentObservation = record.observations.find((o) => o.id === taskId);
  const clip = e.clips.find((c) => c.id === confirmedId);
  const moment = e.moments.find((m) => m.id === activeMoment);
  const momentObservation = record.observations.find((o) => o.id === moment?.observationId);
  const matching = Boolean(clip && local && clip.sha256 === local.sha256 && clip.bytes === local.bytes);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; generation.current += 1; if (url.current) URL.revokeObjectURL(url.current); };
  }, []);
  useEffect(() => { setWatched(false); }, [activeMoment, momentObservation?.response, momentObservation?.task, momentObservation?.assistance, momentObservation?.outcome, momentObservation?.quality]);
  function clearLocal() {
    generation.current += 1; video.current?.pause();
    if (url.current) URL.revokeObjectURL(url.current);
    url.current = null; setLocal(null); setConfirmedId(""); setPlayable(false); setStart(null); setWatched(false); setBusy(false); playEnd.current = null;
  }
  async function selectFile(file?: File) {
    if (!file) return;
    clearLocal(); setError("");
    const ticket = ++generation.current;
    if (!file.size || file.size > MAX_VIDEO_BYTES) { setError("Selecione um vídeo de até 128 MiB. Arquivos maiores não são carregados; preserve o original no armazenamento institucional."); return; }
    if (!/^video\//.test(file.type) && !(file.type === "" && /\.(mp4|webm|mov)$/i.test(file.name))) { setError("Tipo de arquivo não aceito. Selecione um vídeo MP4, WebM ou MOV compatível com o navegador."); return; }
    setBusy(true);
    try {
      const bytes = await file.arrayBuffer();
      if (ticket !== generation.current || !mounted.current) return;
      const digest = await crypto.subtle.digest("SHA-256", bytes);
      if (ticket !== generation.current || !mounted.current) return;
      const sha256 = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
      const expected = e.clips.find((c) => c.id === targetClip);
      if (expected && (expected.sha256 !== sha256 || expected.bytes !== file.size)) { setError("Este arquivo não corresponde ao clipe selecionado. A referência anterior foi preservada; selecione o arquivo original correto."); return; }
      const next = URL.createObjectURL(file); url.current = next;
      setLocal({ url: next, sha256, bytes: file.size, mime: file.type, name: file.name, duration: null }); setPosition(0);
    } catch { if (ticket === generation.current && mounted.current) setError("Falha ao ler ou identificar o vídeo local. Nenhum envio foi realizado; use navegador compatível e tente novamente."); }
    finally { if (ticket === generation.current && mounted.current) setBusy(false); }
  }
  function metadata() {
    const v = video.current; if (!v) return;
    const d = Number.isFinite(v.duration) && v.duration > 0 && v.duration <= 3600 ? v.duration : null;
    setLocal((c) => c ? { ...c, duration: d } : c);
  }
  function confirmAssociation() {
    if (!local || !playable || !record.sessionId) return;
    const existing = e.clips.find((c) => c.sha256 === local.sha256 && c.bytes === local.bytes);
    if (existing) { setConfirmedId(existing.id); setTargetClip(existing.id); onLocalClipConfirmed?.(existing.id); return; }
    if (e.clips.length >= MAX_CLIPS) { setError("Limite de oito clipes por sessão atingido. Preserve e revise as referências existentes."); return; }
    const id = key();
    onChange({ ...e, clips: [...e.clips, { id, sessionId: record.sessionId, label: `Clipe ${e.clips.length + 1}`, sha256: local.sha256, bytes: local.bytes, mime: local.mime, durationSeconds: local.duration, associatedAt: new Date().toISOString() }] });
    setConfirmedId(id); setTargetClip(id); onLocalClipConfirmed?.(id);
  }
  function actualPosition(): number | null {
    const v = video.current;
    if (!v || v.readyState < 2 || v.seeking || v.error || !matching) return null;
    const n = Math.round(v.currentTime * 10) / 10;
    return Number.isFinite(n) && n >= 0 && n <= 3600 ? n : null;
  }
  function markStart() {
    const n = actualPosition(); if (n === null || !currentObservation) { setError("Aguarde um quadro do vídeo e selecione uma tarefa registrada."); return; }
    setError(""); setStart({ second: n, taskId, clipId: confirmedId });
  }
  function markEnd() {
    const n = actualPosition();
    if (!start || !currentObservation || start.taskId !== taskId || start.clipId !== confirmedId || n === null || !validMoment(start.second, n, local?.duration ?? null)) { setError("Marque o fim depois do início, no mesmo clipe e tarefa. Aguarde o vídeo concluir o deslocamento."); return; }
    if (e.moments.length >= MAX_MOMENTS) { setError("Limite de 200 trechos. Revise os já marcados."); return; }
    const m: EvidenceMoment = { id: key(), clipId: confirmedId, observationId: taskId, startSecond: start.second, endSecond: n, sourceSnapshot: snapshotObservation(currentObservation), createdAt: new Date().toISOString(), method: "player-position" };
    onChange({ ...e, moments: [...e.moments, m] }); setActiveMoment(m.id); setDecision(""); setComment(""); setWatched(false); setStart(null); setError("");
  }
  function openMoment(m: EvidenceMoment) {
    setActiveMoment(m.id); setDecision(""); setTaskId(m.observationId); setWatched(false); setComment(""); setStart(null); setError("");
    if (!matching || confirmedId !== m.clipId || !video.current) { clearLocal(); setTargetClip(m.clipId); setError("Reanexe e confirme o arquivo deste clipe antes de abrir o trecho. O JSON não contém vídeo."); return; }
    video.current.pause(); video.current.currentTime = m.startSecond; setPosition(m.startSecond); playEnd.current = m.endSecond;
  }
  function saveReview() {
    if (!canReview || !user || !moment || !momentObservation || !matching || !playable || confirmedId !== moment.clipId || !watched || !decision || !comment.trim()) return;
    if (e.reviews.length >= MAX_REVIEWS) { setError("Limite de comentários alcançado. Exporte e preserve este registro."); return; }
    // Append-only: a new opinion never overwrites another professional's earlier text.
    onChange({ ...e, reviews: [...e.reviews, { id: key(), momentId: moment.id, decision, comment: comment.trim(), sourceSnapshot: snapshotObservation(momentObservation), createdAt: new Date().toISOString(), role: user.role as "admin" | "professional", origin: "local-session" }] });
    setComment(""); setWatched(false);
  }
  const sourceTask = currentObservation?.id.startsWith("guided-") ? PRACTICAL_TASKS[record.context.bandId]?.find((t) => `guided-${t.id}` === taskId) : undefined;
  return <section className="obs10-panel obs13-evidence" data-testid="obs13-evidence">
    <h2><Film size={22} />Do registro ao trecho de vídeo</h2>
    <p><strong>Opcional.</strong> Use só se o vídeo existir como arquivo neste dispositivo: associe o arquivo local a esta sessão, marque o trecho na reprodução e mantenha a revisão profissional separada. Sem arquivo, pule este painel; o registro já informa que o vídeo está fora. <strong>Nenhum vídeo é enviado ou interpretado automaticamente.</strong></p>
    <div className="obs13-flow" aria-label="Etapas de evidência"><span>1 · Confirmar arquivo</span><span>2 · Marcar trecho</span><span>3 · Revisar evidência</span></div>
    <div className="obs13-columns">
      <div>
        <label>Clipe para carregar<select aria-label="Clipe para carregar" value={targetClip} disabled={busy} onChange={(ev) => { clearLocal(); setTargetClip(ev.target.value); setError(""); }}><option value="">Associar um novo clipe</option>{e.clips.map((c) => <option key={c.id} value={c.id}>{c.label} · {c.sha256.slice(0, 10)}</option>)}</select></label>
        <label>Vídeo local para esta sessão<input type="file" accept="video/*,.mp4,.webm,.mov" disabled={busy} onChange={(ev) => { void selectFile(ev.target.files?.[0]); ev.target.value = ""; }} /></label>
        <p className="obs10-muted">Até 128 MiB por arquivo; oito clipes por sessão. Rosto e voz identificam a criança. Selecione somente material autorizado no dispositivo institucional.</p>
        {busy && <p role="status">Conferindo os bytes do arquivo local… <button type="button" onClick={clearLocal}>Cancelar leitura do vídeo</button></p>}
        {error && <p className="obs10-error" role="alert">{error}</p>}
        {local && <>
          <video ref={video} src={local.url} controls playsInline preload="metadata" aria-label="Reprodutor de evidência local" onLoadedMetadata={metadata} onDurationChange={metadata} onLoadedData={() => setPlayable(true)} onSeeked={() => { setPosition(video.current?.currentTime ?? 0); setPlayable(Boolean(video.current && video.current.readyState >= 2)); }} onTimeUpdate={() => { const v = video.current; if (!v) return; setPosition(v.currentTime); if (playEnd.current !== null && v.currentTime >= playEnd.current) { v.pause(); playEnd.current = null; } }} onError={() => { setPlayable(false); setConfirmedId(""); setWatched(false); setError("O navegador não conseguiu reproduzir este vídeo. Não considere o trecho acessível; use formato compatível preservando o original."); }} />
          <p className="obs10-muted">Arquivo local: {local.name} · {(local.bytes / 1048576).toFixed(1)} MiB. Posição do vídeo: <strong>{mediaClock(position)}</strong>. A posição não é o cronômetro da aplicação.</p>
          {!matching ? <button type="button" className="obs10-primary obs10-wide" disabled={!playable || !record.sessionId} onClick={confirmAssociation}><Link2 size={17} />Conferi: este vídeo pertence a esta sessão</button> : <p className="obs10-notice"><ShieldCheck size={18} />{clip?.label} associado por declaração e bytes conferidos. Isso não autentica a criança nem o conteúdo.</p>}
          <button type="button" onClick={clearLocal}>Descarregar vídeo da memória</button>
        </>}
      </div>
      <div>
        <label>Tarefa registrada para vincular<select aria-label="Tarefa registrada para vincular" value={taskId} onChange={(ev) => { setTaskId(ev.target.value); setStart(null); setActiveMoment(""); setComment(""); setDecision(""); setWatched(false); }}><option value="">Selecione uma tarefa</option>{record.observations.map((o) => <option key={o.id} value={o.id}>{o.task || `Sem título · ${o.id}`}</option>)}</select></label>
        <div className="obs13-source"><h3>Comando e fonte da informação</h3><p><strong>Comando da ficha:</strong> {sourceTask?.say ?? "Registro livre; conferir a instrução descrita pela aplicadora."}</p><p><strong>Assistente registrou:</strong> {currentObservation?.response || "Sem descrição literal."}</p><p><strong>Ajuda registrada:</strong> {currentObservation?.assistance || "Não informada."}</p><details><summary>Relato familiar — fonte diferente</summary><p>{record.context.familyReport || "Não informado."}</p></details></div>
        <p>Localize o início e o fim com os controles do vídeo. Os botões capturam a posição atual; não afirmam que o conteúdo foi clinicamente validado.</p>
        <div className="obs10-actions"><button type="button" disabled={!matching || !playable || !currentObservation} onClick={markStart}>Marcar início do trecho</button><button type="button" disabled={!matching || !playable || !start} onClick={markEnd}>Marcar fim e vincular</button></div>
        {start && <p role="status">Início marcado em {mediaClock(start.second)}. Vá a uma posição posterior antes de marcar o fim.</p>}
        <p className="obs10-muted">Marcar outro trecho preserva os anteriores. Para corrigir uma interpretação, acrescente um comentário; não apague sua origem.</p>
      </div>
    </div>
    <h3>Trechos vinculados · {e.moments.length}</h3>
    {!e.moments.length && <p className="obs10-muted">Nenhum trecho vinculado. Isso não significa ausência de alterações.</p>}
    <div className="obs13-moments">{e.moments.map((m) => <article key={m.id} className={activeMoment === m.id ? "is-selected" : ""}>
      <strong>{record.observations.find((o) => o.id === m.observationId)?.task || m.observationId}</strong>
      <p>{e.clips.find((c) => c.id === m.clipId)?.label} · {mediaClock(m.startSecond)}–{mediaClock(m.endSecond)}</p>
      {momentChanged(m, record.observations) && <p className="obs10-caution">Anotação alterada desde a marcação. Reconferir o trecho.</p>}
      <button type="button" onClick={() => openMoment(m)}><Play size={16} />Abrir trecho {e.moments.indexOf(m) + 1}</button>
    </article>)}</div>
    <div className="obs13-professional"><h3><Stethoscope size={18} /> Revisão profissional da evidência</h3>
      <p>Comentário de apoio à consulta, sem assinatura ou diagnóstico automático. Acesso de escrita reservado à conta profissional autenticada.</p>
      {!canReview && <p className="obs10-caution">Perfil de assistente ou modo sem identificação profissional: pode organizar trechos, mas não registrar revisão médica.</p>}
      {moment && <><p><strong>Trecho selecionado:</strong> {momentObservation?.task} · {mediaClock(moment.startSecond)}–{mediaClock(moment.endSecond)}</p>
        <fieldset disabled={!canReview || !playable || !matching || confirmedId !== moment.clipId}>
          <label className="obs10-check"><input type="checkbox" checked={watched} onChange={(ev) => setWatched(ev.target.checked)} />Revisei este trecho e seus limites de imagem e áudio.</label>
          <label>Confronto com o registro<select aria-label="Confronto com o registro" value={decision} onChange={(ev) => setDecision(ev.target.value as typeof decision)}><option value="">Selecione após conferir o trecho</option>{DECISIONS.map((d) => <option key={d}>{d}</option>)}</select></label>
          <label>Comentário profissional sobre este trecho<textarea aria-label="Comentário profissional sobre este trecho" value={comment} maxLength={2000} onChange={(ev) => setComment(ev.target.value)} placeholder="Descreva o que foi visto, as divergências e o que precisa confirmar presencialmente." /></label>
          <button type="button" className="obs10-primary" disabled={!watched || !decision || !comment.trim()} onClick={saveReview}>Registrar comentário profissional</button>
        </fieldset></>}
      {!moment && <p>Abra um trecho para registrar a revisão.</p>}
      {e.reviews.map((r) => <article key={r.id} className="obs13-review-note"><strong>{r.decision}</strong><p>{r.comment}</p><p className="obs10-muted">{new Date(r.createdAt).toLocaleString("pt-BR")} · {r.origin === "imported-unverified" ? "Comentário importado; autoria não autenticada." : "Registrado nesta sessão, sem assinatura digital."}</p>{reviewChanged(r, e, record.observations) && <p className="obs10-caution">Registro alterado: este comentário precisa ser reconferido.</p>}</article>)}
    </div>
    <p className="obs10-caution">JSON guarda referências, cópias textuais e comentários, não o vídeo. Ao reabrir, selecione novamente o mesmo arquivo e confirme sua associação. Exporte antes de sair. O nome original do arquivo não é incluído nas referências exportadas.</p>
  </section>;
}
