import { useEffect, useRef, useState } from "react";
import { ClipboardList, FileCheck2, FolderOpen } from "lucide-react";
import { AGE_BANDS, clock } from "./protocol";
import { MAX_RECORD_BYTES, parseRecordJSON } from "./importRecord";
import { reviewSession } from "./review";
import type { HandoffReview, SessionRecord } from "./session";

export function ImportReview({ disabled, onImport, onBusy }: {
  disabled: boolean; onImport: (record: SessionRecord) => void; onBusy: (busy: boolean) => void;
}) {
  const [candidate, setCandidate] = useState<SessionRecord | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const generation = useRef(0);
  useEffect(() => () => { generation.current += 1; }, []);
  async function read(file?: File) {
    if (!file || disabled || busy) return;
    const ticket = ++generation.current;
    setCandidate(null); setError("");
    if (file.size > MAX_RECORD_BYTES) { setError("Escolha apenas o JSON da aplicação, até 4 MB. Não selecione o vídeo."); return; }
    setBusy(true); onBusy(true);
    try {
      const raw = await file.text();
      if (generation.current !== ticket) return;
      const parsed = parseRecordJSON(raw);
      if (parsed.ok) setCandidate(parsed.record); else setError(parsed.error);
    } catch {
      if (generation.current === ticket) setError("Não foi possível ler o arquivo. Nenhum dado da sessão foi alterado.");
    } finally {
      if (generation.current === ticket) { setBusy(false); onBusy(false); }
    }
  }
  return <section className="obs10-panel obs10-import obs10-no-print" data-testid="obs10-import">
    <h2><FolderOpen size={21} />Reabrir um registro exportado</h2>
    <p>Escolha um JSON OBS-10 do dispositivo institucional. Ele abre <strong>somente para revisão</strong>, sem reiniciar a coleta ou recuperar o vídeo. Nada é enviado a servidor.</p>
    <label>Arquivo JSON para revisão<input type="file" accept=".json,application/json" disabled={disabled || busy} onChange={(event) => { void read(event.target.files?.[0]); event.target.value = ""; }} /></label>
    {busy && <p role="status">Lendo o arquivo local…</p>}
    {error && <p role="alert" className="obs10-error">{error}</p>}
    {candidate && <div className="obs10-preview">
      <h3>Confira antes de abrir</h3>
      <p><strong>Código:</strong> {candidate.context.code || "não informado"} · <strong>Ficha:</strong> {AGE_BANDS.find((b) => b.id === candidate.context.bandId)?.label} · <strong>Versão de origem:</strong> {candidate.version}</p>
      <p>Coleta registrada: {clock(candidate.durationSeconds)} · {candidate.observations.length} registro(s). Esta conferência não autentica a origem nem a veracidade dos achados.</p>
      <button type="button" className="obs10-secondary" disabled={disabled || busy} onClick={() => {
        if (window.confirm("Abrir este JSON apenas para revisão substitui a preparação desta tela. Não recupera vídeos e não reinicia a aplicação. Confirmar?")) onImport(candidate);
      }}>Abrir somente para revisão</button>
    </div>}
  </section>;
}

export function SessionReview({ record, finalizing, onOpenPhase, onChange }: {
  record: SessionRecord; finalizing: boolean; onOpenPhase: (phase: number) => void; onChange: (value: HandoffReview) => void;
}) {
  const { blocks, warnings, hasObservations } = reviewSession(record);
  const h = record.handoff ?? { recordsReviewed: false, mediaReviewed: false, filesChecked: false, declaredAt: null };
  const ready = hasObservations && !warnings.length && !finalizing && h.recordsReviewed && h.mediaReviewed && h.filesChecked;
  return <section className="obs10-panel obs10-review-board" data-testid="obs10-review-board">
    <h2><ClipboardList size={22} />Revisão por bloco antes da entrega</h2>
    <p>Conferência da documentação, <strong>não da capacidade da criança</strong>. Revise o que já ocorreu; não faça novas tarefas. Os cartões sem marcação continuam explícitos.</p>
    <div className="obs10-review-grid">{blocks.map((block) => <article key={block.index} className="obs10-review-card">
      <h3><span aria-hidden="true">{block.icon}</span> {block.title}</h3>
      <p>{block.recorded} registro(s) · {block.pending} a completar · {block.freeRecords} livre(s)</p>
      <details><summary>{block.unmarked.length} cartões sem marcação guiada</summary><p>{block.unmarked.map((task) => task.title).join("; ") || "Todos têm marcação guiada."}</p><p>Confira também os registros livres. Sem marcação não significa incapacidade nem prova não aplicação.</p></details>
      <button type="button" onClick={() => onOpenPhase(block.index)}>Revisar bloco {block.index + 1}</button>
    </article>)}</div>
    <div className="obs10-review-warnings" role="status">
      {!hasObservations && <p className="obs10-caution">Nenhum registro de tarefa. A exportação parcial continua disponível, mas não declare conferência concluída.</p>}
      {warnings.length > 0 ? <details open><summary>{warnings.length} pendência(s) de documentação</summary>{warnings.map((w) => <p key={w.id}><strong>{w.task}:</strong> {w.message} {w.phase >= 0 && <button type="button" onClick={() => onOpenPhase(w.phase)}>Abrir bloco {w.phase + 1}</button>}</p>)}</details> : <p>Sem pendências automáticas nos registros preenchidos. Isso não comprova exame completo, validade dos achados ou revisão médica.</p>}
    </div>
    <h3><FileCheck2 size={18} /> Conferência declarada pela aplicadora</h3>
    {([
      ["recordsReviewed", "Revisei os seis blocos, os fatos descritos e os cartões sem marcação; não completei lacunas por suposição."],
      ["mediaReviewed", "Conferi áudio, enquadramento e referência dos clipes, ou documentei a indisponibilidade do vídeo."],
      ["filesChecked", "Exportei e conferi os arquivos no destino institucional; o vídeo é separado do JSON."],
    ] as const).map(([key, label]) => <label key={key} className="obs10-check"><input type="checkbox" checked={h[key]} disabled={finalizing} onChange={(event) => onChange({ ...h, [key]: event.target.checked, declaredAt: null })} />{label}</label>)}
    <label className="obs10-check"><input type="checkbox" checked={Boolean(h.declaredAt)} disabled={!ready && !h.declaredAt} onChange={(event) => onChange({ ...h, declaredAt: event.target.checked ? new Date().toISOString() : null })} />Conferi o arquivo exportado, identifiquei tarefas omitidas e encaminhei ao médico pelo fluxo institucional.</label>
    <p className="obs10-muted">{h.declaredAt ? "Encaminhamento declarado pela aplicadora. Reexporte o JSON para registrar esta declaração. Não é recibo de envio, recebimento ou arquivamento." : "Complete as conferências e resolva as pendências antes de declarar o encaminhamento. Você pode exportar um registro parcial a qualquer momento."}</p>
    <p className="obs10-muted">Alterar um registro desfaz estas confirmações. A importação também exige nova conferência, sem herdar aceite anterior.</p>
  </section>;
}
