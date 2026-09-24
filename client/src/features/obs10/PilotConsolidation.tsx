import { useEffect, useRef, useState } from "react";
import { Copy, Download, Layers } from "lucide-react";
import { MAX_METRICS_BYTES, MAX_METRICS_FILES, aggregateMetrics, aggregateText, parseMetricsJSON, type PilotAggregate } from "./pilotAggregate";
import type { PilotMetrics } from "./pilot";

type Row = { name: string; ok: boolean; note: string };
function save(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a"); a.href = url; a.download = name; document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
/** Reads several exported metrics files locally and shows one aggregate. Nothing leaves the browser. */
export function PilotConsolidation({ disabled }: { disabled: boolean }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [aggregate, setAggregate] = useState<PilotAggregate | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const generation = useRef(0);
  useEffect(() => () => { generation.current += 1; }, []);
  async function read(list: FileList | null) {
    if (!list || disabled || busy) return;
    const ticket = ++generation.current;
    setBusy(true); setStatus(""); setAggregate(null);
    const files = Array.from(list).slice(0, MAX_METRICS_FILES);
    const accepted: PilotMetrics[] = []; const next: Row[] = [];
    try {
      for (const file of files) {
        if (file.size > MAX_METRICS_BYTES) { next.push({ name: file.name, ok: false, note: "maior que 64 KB; ignorado" }); continue; }
        const parsed = parseMetricsJSON(await file.text());
        if (generation.current !== ticket) return;
        if (parsed.ok) { accepted.push(parsed.metrics); next.push({ name: file.name, ok: true, note: `${parsed.metrics.ageBand} · ${parsed.metrics.collectionSeconds} s` }); }
        else next.push({ name: file.name, ok: false, note: parsed.error });
      }
      if (generation.current !== ticket) return;
      setRows(next);
      if (accepted.length) setAggregate(aggregateMetrics(accepted));
      if (list.length > MAX_METRICS_FILES) setStatus(`Somente os primeiros ${MAX_METRICS_FILES} arquivos foram lidos.`);
    } catch {
      if (generation.current === ticket) setStatus("Não foi possível ler os arquivos. Nenhum dado foi enviado.");
    } finally { if (generation.current === ticket) setBusy(false); }
  }
  const text = aggregate ? aggregateText(aggregate) : "";
  async function copy() {
    try { await navigator.clipboard.writeText(text); setStatus("Consolidação copiada."); }
    catch { setStatus("Não foi possível copiar automaticamente. Use o download ou selecione o texto."); }
  }
  return <section className="obs13-consolidation" data-testid="obs13-consolidation">
    <h2 className="obs13-consolidation-title"><Layers size={18} /> Consolidar métricas de várias aplicações</h2>
    <p>Selecione os arquivos <strong>OBS10-metricas-operacionais-*.json</strong> exportados de cada aplicação. A leitura e o resumo acontecem só neste navegador; arquivos com texto clínico, código ou campos extras são recusados. Arquivos idênticos contam uma vez.</p>
    <label>Arquivos de métricas para consolidar<input type="file" accept=".json,application/json" multiple disabled={disabled || busy} onChange={(event) => { void read(event.target.files); event.target.value = ""; }} /></label>
    {busy && <p role="status">Lendo arquivos locais…</p>}
    {rows.length > 0 && <ul className="obs13-files">{rows.map((row, i) => <li key={`${row.name}-${i}`} className={row.ok ? "is-ok" : ""}>{row.ok ? "✓" : "✗"} {row.name} · {row.note}</li>)}</ul>}
    {aggregate && <>
      <div className="obs10-actions"><button type="button" onClick={() => void copy()}><Copy size={16} />Copiar consolidação</button><button type="button" onClick={() => save(`OBS10-piloto-consolidado-${aggregate.sessions}-aplicacoes.md`, text, "text/markdown;charset=utf-8")}><Download size={16} />Baixar resumo (.md)</button><button type="button" onClick={() => save(`OBS10-piloto-consolidado-${aggregate.sessions}-aplicacoes.json`, JSON.stringify(aggregate, null, 2), "application/json")}><Download size={16} />Baixar agregado (.json)</button></div>
      <pre tabIndex={0} aria-label="Resumo consolidado, rolável" data-testid="obs13-consolidation-text">{text}</pre>
    </>}
    <p role="status">{status}</p>
    <p className="obs10-caution">Indicadores de processo e opiniões declaradas. Não mede desempenho da criança, acurácia ou benefício. Contagens por faixa em grupos pequenos podem reidentificar: não publique microdados.</p>
  </section>;
}
