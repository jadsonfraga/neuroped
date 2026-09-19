import { useState } from "react";
import { Check, Copy, Download, Sparkles } from "lucide-react";

export const JOURNEY = [
  { key: "setup", title: "1 · Preparar", hint: "Idade, kit conferido, contexto e segurança. Fora do cronômetro." },
  { key: "running", title: "2 · Aplicar", hint: "Até dez minutos, seis blocos, uma tarefa por vez. Marque a categoria; detalhe depois." },
  { key: "review", title: "3 · Revisar", hint: "Complete os fatos, confira pendências, vincule trechos de vídeo." },
  { key: "deliver", title: "4 · Entregar", hint: "Exporte TXT/JSON, salve o vídeo e gere o dossiê para análise externa." },
] as const;
export type JourneyStage = typeof JOURNEY[number]["key"];
export function journeyStage(stage: "setup" | "running" | "finished", delivered: boolean): JourneyStage {
  return stage === "finished" ? (delivered ? "deliver" : "review") : stage;
}
export function JourneyMap({ stage, delivered }: { stage: "setup" | "running" | "finished"; delivered: boolean }) {
  const current = journeyStage(stage, delivered);
  const position = JOURNEY.findIndex((step) => step.key === current);
  return <ol className="obs10-journey obs10-no-print" aria-label="Etapas da aplicação" data-testid="obs10-journey">
    {JOURNEY.map((step, index) => <li key={step.key} className={index === position ? "is-active" : index < position ? "is-done" : ""} aria-current={index === position ? "step" : undefined}>
      <strong>{index < position && <Check size={14} aria-hidden="true" />} {step.title}</strong><small>{step.hint}</small>
    </li>)}
  </ol>;
}

export interface ReadinessItem { label: string; ok: boolean; detail?: string }
export function Readiness({ items }: { items: ReadinessItem[] }) {
  const pending = items.filter((item) => !item.ok).length;
  return <div className="obs10-readiness" data-testid="obs10-readiness">
    <p className="obs10-muted" role="status">{pending ? `${pending} item(ns) pendente(s) antes de iniciar.` : "Tudo conferido. O início está liberado."}</p>
    <ul className="obs10-ready">{items.map((item) => <li key={item.label} className={item.ok ? "is-ok" : ""}><span aria-hidden="true">{item.ok ? "✓" : "○"}</span><span><strong>{item.label}</strong>{item.detail && <small> · {item.detail}</small>}<span className="sr-only">{item.ok ? " conferido" : " pendente"}</span></span></li>)}</ul>
  </div>;
}

export function DossierPanel({ text, onCopy, onDownload }: { text: string; onCopy: () => void; onDownload: () => void }) {
  const [status, setStatus] = useState("");
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      onCopy();
      setStatus("Dossiê copiado. Cole após a lei PRÉ na sua ferramenta de redação, fora deste aplicativo.");
    } catch {
      setStatus("Não foi possível copiar automaticamente neste navegador. Use o download ou selecione o texto abaixo.");
    }
  }
  return <section className="obs10-panel obs10-dossier obs10-no-print" data-testid="obs10-dossier">
    <h2><Sparkles size={22} />Dossiê para análise por IA, fora deste aplicativo</h2>
    <p>Organiza o que foi proposto e o que a criança fez em um único texto, com idade, condições, relato familiar e pendências em seções separadas. <strong>Este aplicativo não envia nada nem analisa por IA:</strong> você cola o dossiê, junto da sua lei PRÉ, na ferramenta autorizada pela clínica.</p>
    <ol>
      <li>Complete os fatos nos blocos acima; o dossiê reflete a versão atual dos registros.</li>
      <li>Copie ou baixe o dossiê. Ele não contém vídeo, nome ou dados além dos digitados nesta tela.</li>
      <li>Na redação, cada proposta sem observação vira pendência, nunca achado. A referência etária calibra o grau e não é transcrita.</li>
    </ol>
    <div className="obs10-actions">
      <button type="button" className="obs10-primary" onClick={() => void copy()}><Copy size={17} />Copiar dossiê</button>
      <button type="button" onClick={onDownload}><Download size={17} />Baixar dossiê (.md)</button>
    </div>
    <p role="status">{status}</p>
    <details><summary>Ver o dossiê completo</summary><pre data-testid="obs10-dossier-text" tabIndex={0} aria-label="Texto do dossiê, rolável">{text}</pre></details>
  </section>;
}
