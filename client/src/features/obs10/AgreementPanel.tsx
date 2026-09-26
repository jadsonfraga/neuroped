import { useState } from "react";
import { OUTCOMES, AGE_BANDS, type Outcome } from "./protocol";
import { PRACTICAL_TASKS } from "./practical";
import { parseRecordJSON } from "./importRecord";
import { parseTabletRecord } from "./tablet/engine";
import { tabletPlan } from "./tablet/protocol";
import { AgreementRefused, agreementText, classicCoding, compareCodings, tabletCoding, type AgreementReport, type Coding } from "./agreement";

const MAX_BYTES = 4 * 1024 * 1024;
async function readCoding(file: File): Promise<{ coding: Coding; taskIds: string[] }> {
  if (file.size > MAX_BYTES) throw new AgreementRefused("Arquivo acima de 4 MB.");
  const text = await file.text();
  try {
    const record = parseTabletRecord(text);
    return { coding: tabletCoding(record), taskIds: (tabletPlan(record.context.months)?.tasks ?? []).map((t) => t.id) };
  } catch {
    const result = parseRecordJSON(text);
    if (!result.ok) throw new AgreementRefused(result.error);
    const band = AGE_BANDS.find((b) => b.id === result.record.context.bandId);
    if (!band) throw new AgreementRefused("Ficha etária do registro não foi reconhecida.");
    return { coding: classicCoding(result.record), taskIds: (PRACTICAL_TASKS[band.id] ?? []).map((t) => t.id) };
  }
}
function download(name: string, text: string, mime: string) {
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const link = document.createElement("a");
  link.href = url; link.download = name; document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

/** Two independent codings of the same session, compared. No child data leaves this screen. */
export function AgreementPanel() {
  const [pairLabel, setPairLabel] = useState("");
  const [first, setFirst] = useState<{ coding: Coding; taskIds: string[] } | null>(null);
  const [second, setSecond] = useState<{ coding: Coding; taskIds: string[] } | null>(null);
  const [report, setReport] = useState<AgreementReport | null>(null);
  const [message, setMessage] = useState("");
  const label = (outcome: Outcome | null) => outcome ? OUTCOMES.find((o) => o.id === outcome)?.label ?? outcome : "não categorizada";
  async function load(file: File | undefined, place: "first" | "second") {
    setReport(null);
    if (!file) return;
    try {
      const loaded = await readCoding(file);
      if (place === "first") setFirst(loaded); else setSecond(loaded);
      setMessage(`Codificação ${place === "first" ? "do primeiro" : "do segundo"} observador carregada: ${loaded.coding.tasks.length} tarefa(s) com registro.`);
    } catch {
      setMessage("Não foi possível ler: use um JSON exportado pelo OBS-10, presencial ou tablet, de até 4 MB.");
    }
  }
  function compare() {
    if (!first || !second) return;
    try {
      // The sheet decides which tasks exist; a task neither observer coded still counts as an opportunity.
      const taskIds = first.taskIds.length ? first.taskIds : second.taskIds;
      setReport(compareCodings(first.coding, second.coding, pairLabel, taskIds));
      setMessage("");
    } catch (error) {
      setReport(null);
      setMessage(error instanceof AgreementRefused ? error.message : "Não foi possível comparar estes registros.");
    }
  }
  return <section className="obs10-no-print" data-testid="obs10-agreement">
    <h2>Concordância entre dois observadores</h2>
    <p>Para estudo de confiabilidade, fora do atendimento. Duas pessoas codificam a mesma sessão de forma independente e este painel compara as categorias declaradas. <strong>Mede a codificação, não a criança:</strong> não valida o roteiro, não produz escore e não autoriza diagnóstico.</p>
    <p className="obs10-muted">Nenhum arquivo é enviado. A exportação abaixo leva somente contagens, categorias e identificadores de tarefa: sem código institucional, identificador de sessão, descrições ou vídeo.</p>
    <label>Identificação do par, para sua planilha do estudo<input value={pairLabel} maxLength={40} placeholder="Ex.: par 01" onChange={(e) => setPairLabel(e.target.value)} /></label>
    <div className="obs10-fields">
      <label>Registro do primeiro observador<input type="file" accept="application/json,.json" onChange={(e) => { void load(e.target.files?.[0], "first"); e.target.value = ""; }} /></label>
      <label>Registro do segundo observador<input type="file" accept="application/json,.json" onChange={(e) => { void load(e.target.files?.[0], "second"); e.target.value = ""; }} /></label>
    </div>
    <div className="obs10-actions"><button type="button" className="obs10-primary" disabled={!first || !second} onClick={compare}>Comparar as duas codificações</button></div>
    {message && <p role="status" className="obs10-caution">{message}</p>}
    {report && <div data-testid="obs10-agreement-report">
      <p><strong>Concordância exata: {report.exactMatches} de {report.comparable}{report.percentAgreement === null ? "" : ` (${(report.percentAgreement * 100).toFixed(1)}%)`}.</strong></p>
      <p>Kappa: {report.kappa === null ? "não calculado" : report.kappa.toFixed(3)}. {report.kappaNote}</p>
      <p>Tarefas da ficha: {report.tasksInSheet}. Categorizadas só pelo primeiro: {report.codedOnlyByFirst}; só pelo segundo: {report.codedOnlyBySecond}; por nenhum: {report.codedByNeither}.{report.unpairableObservations > 0 && ` Registros livres não pareáveis: ${report.unpairableObservations}, fora do cálculo.`}</p>
      <h3>Divergências, para conferência humana</h3>
      {report.divergences.length ? <ul>{report.divergences.map((d) => <li key={d.taskId}>{d.taskId}: primeiro {label(d.first)}, segundo {label(d.second)}</li>)}</ul> : <p>Nenhuma divergência entre as tarefas que os dois categorizaram.</p>}
      <p className="obs10-caution">Divergência não prova erro de um observador: pode revelar instrução ambígua, enquadramento ou momento diferente. Leve ao médico antes de alterar o roteiro.</p>
      <div className="obs10-actions">
        <button type="button" onClick={() => download(`OBS10-CONCORDANCIA-${report.pairLabel || "par"}.json`, JSON.stringify(report, null, 2), "application/json")}>Exportar comparação (JSON)</button>
        <button type="button" onClick={() => download(`OBS10-CONCORDANCIA-${report.pairLabel || "par"}.txt`, agreementText(report), "text/plain;charset=utf-8")}>Exportar comparação (texto)</button>
      </div>
    </div>}
  </section>;
}
