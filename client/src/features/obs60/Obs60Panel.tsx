import { useCallback, useEffect, useRef, useState } from "react";
import { useClinic } from "@/contexts/ClinicContext";
import { useAuth } from "@/contexts/AuthContext";
import { authFetch, getAuthSessionEpoch } from "@/lib/authClient";
import { useLocalRecorder } from "@/features/obs10/useLocalRecorder";
import { useExitGuard } from "@/features/obs10/useExitGuard";
import { AGE_BANDS, API_PATH, FIELDS, HELP_LABELS, ITEM_LABELS, LIMITATION, MAX_BYTES, MAX_SECONDS, PREPARATION, STATUS_LABELS, VERSION, parseAge, stepsForAge, validateAnalysis, type Result } from "@shared/obs60";
import "./obs60.css";
interface Clip { file: File; url: string; seconds: number }
interface Capability { configured: boolean; message: string; model?: string | null }
interface Envelope { result: Result; sourceSha256: string; model: string; analysedAt: string; reviewRequired: true }
const sizeLabel = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;
function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob); const a = document.createElement("a");
  a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
async function readDuration(file: File): Promise<number> {
  const url = URL.createObjectURL(file); const video = document.createElement("video"); video.preload = "metadata";
  try {
    return await new Promise((resolve, reject) => {
      const fail = () => { clearTimeout(timer); reject(new Error("Não foi possível ler a duração. Use MP4/WebM reproduzível ou a câmera integrada.")); };
      const timer = setTimeout(fail, 8000);
      video.onloadedmetadata = () => {
        clearTimeout(timer);
        if (Number.isFinite(video.duration) && video.duration > 0) resolve(video.duration);
        else fail();
      };
      video.onerror = fail; video.src = url;
    });
  } finally { video.onloadedmetadata = null; video.onerror = null; video.removeAttribute("src"); video.load(); URL.revokeObjectURL(url); }
}
function base64File(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result.slice(reader.result.indexOf(",") + 1)) : reject(new Error("Falha ao ler vídeo."));
    reader.onerror = () => reject(new Error("Falha ao ler vídeo.")); reader.readAsDataURL(file);
  });
}
async function hashFile(file: File) {
  const bytes = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return [...new Uint8Array(bytes)].map(n => n.toString(16).padStart(2, "0")).join("");
}
export default function Obs60Panel({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null); const preview = useRef<HTMLVideoElement>(null); const playback = useRef<HTMLVideoElement>(null);
  const { activeClinicId } = useClinic(); const { user } = useAuth();
  const recorder = useLocalRecorder();
  const { reset: resetRecorder, stop: stopRecorder } = recorder;
  const [age, setAge] = useState(""); const months = parseAge(age);
  const [captureConsent, setCaptureConsent] = useState(false); const [sendConsent, setSendConsent] = useState(false);
  const [clip, setClip] = useState<Clip | null>(null); const [output, setOutput] = useState<Envelope | null>(null);
  const [busy, setBusy] = useState(false); const [starting, setStarting] = useState(false); const [converting, setConverting] = useState(false);
  const [error, setError] = useState(""); const [notice, setNotice] = useState(""); const [elapsed, setElapsed] = useState(0);
  const [capability, setCapability] = useState<Capability>({ configured: false, message: "Verificando disponibilidade do serviço autenticado…" });
  const generation = useRef(0); const request = useRef<AbortController | null>(null); const startedAt = useRef<number | null>(null); const recordedSeconds = useRef(0);
  const recording = recorder.status === "recording"; const locked = busy || starting || converting || recorder.pending || recording || recorder.status === "finalizing";
  const dirty = Boolean(clip || output || locked);
  useExitGuard(dirty);
  const clear = useCallback(() => {
    generation.current++; request.current?.abort(); request.current = null;
    resetRecorder(); setClip(null); setOutput(null); setBusy(false); setStarting(false); setConverting(false); setSendConsent(false); setElapsed(0); startedAt.current = null; recordedSeconds.current = 0; setError(""); setNotice("");
  }, [resetRecorder]);
  useEffect(() => { dialog.current?.showModal(); }, []);
  useEffect(() => () => { generation.current++; request.current?.abort(); }, []);
  useEffect(() => { if (preview.current) preview.current.srcObject = recorder.stream; }, [recorder.stream]);
  useEffect(() => () => { if (clip) URL.revokeObjectURL(clip.url); }, [clip]);
  useEffect(() => {
    clear(); setCaptureConsent(false);
    const controller = new AbortController(); const epoch = getAuthSessionEpoch();
    setCapability({ configured: false, message: "Verificando disponibilidade do serviço autenticado…" });
    const timer = setTimeout(() => { controller.abort(); setCapability({ configured: false, message: "Não foi possível verificar a IA. O guia está disponível, mas o envio permanece bloqueado." }); }, 8000);
    void authFetch(API_PATH, { cache: "no-store", signal: controller.signal }).then(async response => {
      const body = await response.json();
      if (controller.signal.aborted || epoch !== getAuthSessionEpoch()) return;
      setCapability(response.ok && body.version === VERSION && typeof body.configured === "boolean" ? { configured: body.configured, message: String(body.message), model: body.model } : { configured: false, message: "IA indisponível nesta sessão. Verifique login, clínica ativa e configuração do servidor. O guia pode ser utilizado sem envio." });
    }).catch(() => { if (!controller.signal.aborted) setCapability({ configured: false, message: "Não foi possível verificar a IA. Nenhum vídeo foi enviado. O guia continua disponível." }); }).finally(() => clearTimeout(timer));
    return () => { controller.abort(); clearTimeout(timer); };
  }, [activeClinicId, user?.id, clear]);
  const stop = useCallback(() => {
    if (startedAt.current !== null) recordedSeconds.current = Math.max(0.1, Math.min(MAX_SECONDS, (performance.now() - startedAt.current) / 1000));
    stopRecorder();
  }, [stopRecorder]);
  useEffect(() => {
    if (!recording) return;
    const tick = () => { const now = Math.min(MAX_SECONDS, (performance.now() - (startedAt.current ?? performance.now())) / 1000); setElapsed(now); if (now >= MAX_SECONDS) stop(); };
    const hidden = () => { if (document.hidden) { stop(); setNotice("Gravação interrompida ao sair da aba. O vídeo pode estar parcial; não presuma tarefa concluída."); } };
    const timer = setInterval(tick, 100); document.addEventListener("visibilitychange", hidden);
    return () => { clearInterval(timer); document.removeEventListener("visibilitychange", hidden); };
  }, [recording, stop]);
  useEffect(() => {
    if (recorder.status !== "ready" || !recorder.url) return;
    const ticket = generation.current;
    // Covers the gap between the recorder finishing and this async blob read landing: without
    // it, "Gravar 60 segundos" stays enabled and a second recording can start mid-conversion.
    setConverting(true);
    void fetch(recorder.url).then(r => r.blob()).then(blob => {
      if (ticket !== generation.current) return;
      if (blob.size > MAX_BYTES) throw new Error("Vídeo maior que 12 MB. Preserve o arquivo local; não houve envio à IA.");
      const mime = blob.type.split(";")[0];
      const seconds = recordedSeconds.current || Math.min(MAX_SECONDS, (performance.now() - (startedAt.current ?? performance.now())) / 1000);
      if (seconds <= 0) throw new Error("Duração de gravação não confirmada.");
      const file = new File([blob], `obs60.${mime === "video/mp4" ? "mp4" : "webm"}`, { type: mime });
      setClip({ file, url: URL.createObjectURL(file), seconds }); setOutput(null); setSendConsent(false);
    }).catch(() => { if (ticket === generation.current) setError("Não foi possível preparar o vídeo para análise. Preserve a gravação abaixo; nenhum resultado foi gerado."); })
      .finally(() => { if (ticket === generation.current) setConverting(false); });
  }, [recorder.status, recorder.url]);
  async function start() {
    if (months === null || !captureConsent || locked || clip) return;
    const ticket = generation.current; setStarting(true); setError(""); setNotice("");
    const ok = await recorder.start();
    if (ticket !== generation.current) return;
    if (ok) { startedAt.current = performance.now(); recordedSeconds.current = 0; setElapsed(0); }
    setStarting(false);
  }
  async function attach(file: File | undefined) {
    if (!file || locked || !captureConsent || months === null) return;
    clear(); const ticket = generation.current; setBusy(true);
    try {
      if (!file.size || file.size > MAX_BYTES) throw new Error("Selecione vídeo MP4/WebM de até 12 MB.");
      const mime = file.type.split(";")[0];
      if (!["video/mp4", "video/webm"].includes(mime)) throw new Error("Formato não aceito. Use MP4/WebM ou a câmera integrada.");
      const seconds = await readDuration(file);
      if (seconds > 62) throw new Error("Este fluxo aceita gravações de até 60 segundos, com pequena tolerância de finalização. Não recorte uma tarefa para produzir um resultado favorável.");
      if (ticket !== generation.current) return;
      setClip({ file: new File([file], "obs60-video", { type: mime }), url: URL.createObjectURL(file), seconds: Math.min(MAX_SECONDS, seconds) });
    } catch (cause) { if (ticket === generation.current) setError(cause instanceof Error ? cause.message : "Falha ao abrir o arquivo."); }
    finally { if (ticket === generation.current) setBusy(false); }
  }
  async function analyse() {
    if (!clip || months === null || !sendConsent || !capability.configured || busy || !activeClinicId) return;
    const ticket = ++generation.current; const epoch = getAuthSessionEpoch(); const controller = new AbortController(); request.current = controller;
    setBusy(true); setOutput(null); setError(""); setNotice("");
    const timer = setTimeout(() => controller.abort(), 110_000);
    try {
      const [data, sha] = await Promise.all([base64File(clip.file), hashFile(clip.file)]);
      if (ticket !== generation.current || controller.signal.aborted || epoch !== getAuthSessionEpoch()) return;
      const response = await authFetch(API_PATH, { method: "POST", signal: controller.signal, cache: "no-store", headers: { "Content-Type": "application/json", "X-Tenant-Id": activeClinicId }, body: JSON.stringify({ ageMonths: months, windowSeconds: clip.seconds, consent: true, mime: clip.file.type, data }) });
      const body = await response.json();
      if (ticket !== generation.current || controller.signal.aborted || epoch !== getAuthSessionEpoch()) return;
      if (!response.ok) throw new Error(typeof body.error === "string" ? body.error : "A análise não foi concluída.");
      if (body.sourceSha256 !== sha || body.result?.version !== VERSION || body.result?.ageMonths !== months || body.result?.windowSeconds !== clip.seconds || body.reviewRequired !== true || !Array.isArray(body.result?.observations)) throw new Error("Resposta não corresponde a este vídeo e contexto.");
      const rows = body.result.observations.map((row: Record<string, unknown>) => Object.fromEntries(FIELDS.map(key => [key, row[key]])));
      const result = validateAnalysis({ observations: rows }, months, clip.seconds);
      setOutput({ result, sourceSha256: sha, model: String(body.model), analysedAt: String(body.analysedAt), reviewRequired: true });
    } catch (cause) { if (ticket === generation.current) setError(controller.signal.aborted ? "Processamento interrompido. Nenhum resultado concluído foi recebido. Cancelar não garante interromper o processamento já recebido pelo provedor." : cause instanceof Error ? cause.message : "Falha na análise. Nenhum resultado foi gerado."); }
    finally { clearTimeout(timer); if (ticket === generation.current) { setBusy(false); request.current = null; } }
  }
  function close() {
    if (recording || starting || recorder.status === "finalizing") { setNotice("Encerre a gravação antes de sair, para preservar o arquivo."); return; }
    if (dirty && !window.confirm("Esta tela não salva automaticamente. Sair descarta vídeo e resultados locais e cancela a espera por análises. Confirma?")) return;
    clear(); onClose();
  }
  function exportResult() {
    if (!output) return;
    download(new Blob([JSON.stringify(output, null, 2)], { type: "application/json" }), "obs60-rascunho.json");
    setNotice("Download do JSON solicitado. Isso não confirma armazenamento institucional; o vídeo deve ser salvo separadamente.");
  }
  const steps = months === null ? [] : stepsForAge(months);
  return <dialog ref={dialog} className="obs60-dialog" aria-labelledby="obs60-title" onCancel={event => { event.preventDefault(); close(); }} data-testid="obs60-panel">
    <div className="obs60-shell">
      <header><div><p className="obs60-eyebrow">NeuroPed · vídeo dirigido · protótipo não validado</p><h2 id="obs60-title">Observação em 60 segundos</h2></div><button type="button" onClick={close} aria-label="Fechar observação de 60 segundos">Fechar</button></header>
      <p>Você conduz as quatro propostas e grava. <strong>A IA preenche os seis registros a partir do vídeo</strong>, sem marcação clínica manual. O resultado é um rascunho, não diagnóstico.</p>
      <section className="obs60-card"><h3>1. Idade e preparo</h3>
        <label>Idade exata em meses completos<select aria-label="Idade exata em meses completos" value={age} disabled={locked || Boolean(clip)} onChange={event => { clear(); setAge(event.target.value); }}>
          <option value="">Selecione a idade</option>{AGE_BANDS.map(band => <optgroup label={`${band.label} · ${band.min}–${band.max} meses`} key={band.id}>{Array.from({ length: 12 }, (_, i) => <option key={band.min + i} value={band.min + i}>{band.label} e {i} mês(es) · {band.min + i} meses</option>)}</optgroup>)}
        </select></label>
        <ul>{PREPARATION.map(text => <li key={text}>{text}</li>)}</ul>
        <p>Interrompa diante de sofrimento, dor, mal-estar ou risco de queda e acione a equipe. A câmera não substitui supervisão presencial. Não inclua documentos identificáveis no enquadramento.</p>
        <label className="obs60-check"><input type="checkbox" checked={captureConsent} disabled={locked || Boolean(clip)} onChange={event => setCaptureConsent(event.target.checked)} />A gravação está autorizada pelo responsável e será tratada segundo o fluxo institucional.</label>
      </section>
      <section className="obs60-card"><h3>2. Guia por faixa etária</h3>
        {months === null ? <p>Selecione a idade para mostrar as frases exatas.</p> : <div className="obs60-steps">{steps.map(step => <article key={step.id} className={recording && elapsed >= step.from && elapsed < step.to ? "obs60-step active" : "obs60-step"}><small>{step.from}–{step.to} s · janela sugerida</small><h4>{step.title}</h4><blockquote>{step.say}</blockquote><p>{step.instruction}</p></article>)}</div>}
        <p className="obs60-muted">A mudança de destaque não exige interromper a tentativa em curso. Aos 60 segundos a gravação termina; tarefas não completadas podem ficar não avaliáveis.</p>
      </section>
      <section className="obs60-card"><h3>3. Gravar ou anexar vídeo</h3>
        {!clip && <><video ref={preview} autoPlay playsInline muted className="obs60-video" aria-label="Prévia local da câmera" /><div className="obs60-actions">
          <button type="button" disabled={months === null || !captureConsent || locked} onClick={() => void recorder.prepare()}>Preparar câmera</button>
          <button type="button" disabled={months === null || !captureConsent || locked} onClick={() => void start()}>Gravar 60 segundos</button>
          <button type="button" disabled={!recording} onClick={stop}>Encerrar antes</button>
          <label className="obs60-upload">Anexar MP4 / WebM até 12 MB<input type="file" accept="video/mp4,video/webm" disabled={months === null || !captureConsent || locked} onChange={event => { void attach(event.target.files?.[0]); event.target.value = ""; }} /></label>
        </div></>}
        <p role="timer" aria-label="Tempo gravado">{Math.floor(elapsed).toString().padStart(2, "0")} / 60 segundos{recording ? " · gravando localmente" : ""}</p>
        {clip && <><video ref={playback} src={clip.url} controls playsInline className="obs60-video" aria-label="Vídeo anexado para análise" /><p>Vídeo local · {sizeLabel(clip.file.size)} · janela de {clip.seconds.toFixed(1)} s. Nada foi enviado só por anexar.</p><button type="button" onClick={() => download(clip.file, `obs60-video.${clip.file.type === "video/mp4" ? "mp4" : "webm"}`)}>Baixar vídeo separado</button></>}
        {!clip && recorder.url && <p><a href={recorder.url} download="obs60-gravacao">Preservar gravação local não preparada para análise</a></p>}
        {recorder.error && <p role="alert">{recorder.error}</p>}
      </section>
      <section className="obs60-card"><h3>4. Análise automática do vídeo</h3><p role="status">{capability.message}</p>
        <p>Ao analisar, o vídeo e a idade são enviados pelo servidor autenticado ao <strong>Google Gemini</strong>. Não ficam salvos neste módulo. Isso não é garantia de retenção zero no provedor; a instituição deve aprovar o serviço e suas condições antes de ativá-lo.</p>
        <label className="obs60-check"><input type="checkbox" checked={sendConsent} disabled={!clip || busy || !capability.configured} onChange={event => setSendConsent(event.target.checked)} />O envio deste vídeo à IA externa está autorizado pelo responsável e pela instituição.</label>
        <div className="obs60-actions"><button type="button" disabled={!clip || busy || !sendConsent || !capability.configured || !activeClinicId} onClick={() => void analyse()}>{busy ? "Processando…" : "Analisar vídeo e preencher registros"}</button>{busy && <button type="button" onClick={() => { request.current?.abort(); }}>Cancelar espera</button>}</div>
        <p className="obs60-muted">Vídeo ausente, serviço indisponível ou resposta inválida não geram análise simulada. A IA usa amostragem; eventos rápidos e intervalos entre quadros podem não ser caracterizáveis.</p>
      </section>
      {error && <p role="alert" className="obs60-message">{error}</p>}{notice && <p role="status" className="obs60-message">{notice}</p>}
      {output && <section className="obs60-card" data-testid="obs60-results"><p role="status" className="sr-only">Análise concluída: seis registros disponíveis para revisão.</p><h3>5. Registros extraídos pela IA · revisão pendente</h3><p>{output.result.limitation}</p>
        <div className="obs60-results">{output.result.observations.map(row => <article key={row.id}><h4>{ITEM_LABELS[row.id]}</h4><strong>{STATUS_LABELS[row.status]}</strong><p>{row.fact}</p>{row.transcript && <blockquote>Fala atribuída à criança: “{row.transcript}”</blockquote>}<p>{row.status !== "not_assessable" ? HELP_LABELS[row.help] : row.limitation}</p>{row.start !== null && row.end !== null && <button type="button" onClick={() => { if (playback.current && row.start !== null) { playback.current.currentTime = row.start; playback.current.focus(); playback.current.scrollIntoView({ block: "center" }); } }}>Rever trecho apontado pela IA · ~{row.start.toFixed(1)}–{row.end.toFixed(1)} s</button>}</article>)}</div>
        <h4>Síntese limitada às tarefas</h4>{output.result.synthesis.length ? output.result.synthesis.map(text => <p key={text}>{text}</p>) : <p>Evidência insuficiente para síntese adicional. Não completar por suposição.</p>}
        <h4>Próxima observação prioritária</h4><p>{output.result.nextStep}</p><p className="obs60-muted">Modelo informado: {output.model}. Trechos e transcrições são propostos pela IA, não confirmados por revisão humana.</p>
        <button type="button" onClick={exportResult}>Exportar rascunho JSON</button>
      </section>}
      <details className="obs60-card"><summary>Como o aplicativo interpreta e limita os resultados</summary><p>{LIMITATION}</p><p>Demonstrado: evento identificado com evidência suficiente. Parcial: parte da sequência identificada. Não demonstrado: resposta não identificada em oportunidade clara. Não avaliável: faltou evidência, oportunidade, tempo, áudio ou enquadramento.</p><p>Oportunidade incerta ou qualidade contraditória bloqueiam a classificação. Resposta solicitada não vira espontaneidade; ajuda oferecida não prova ajuda necessária; palavra isolada não prova atraso. Não há escore, percentual de risco ou conclusão de TEA/TDAH.</p><p>O chamado exige áudio e direção observável; o comando exige instrução e etapas; gesto exige contexto; fala exige voz atribuível à criança; movimento exige corpo, pés, apoios e sequência suficientemente visíveis.</p></details>
      <footer><p>Conteúdo mantido apenas na memória desta tela. Fechar ou recarregar pode perder os arquivos. Downloads precisam ser conferidos no destino institucional.</p><button type="button" disabled={locked} onClick={() => { if (!dirty || window.confirm("Descartar vídeo e resultado atuais? Confirme antes os arquivos no destino institucional.")) clear(); }}>Nova gravação / limpar</button></footer>
    </div>
  </dialog>;
}
