import { lazy, Suspense, useState } from "react";
const Obs60Panel = lazy(() => import("./Obs60Panel"));
/** Separate workspace: no changes to the existing ten-minute protocol or its manual records. */
export function Obs60Launcher() {
  const [open, setOpen] = useState(false);
  return <section className="obs10-first-time obs10-no-print" aria-label="Observação por vídeo em 60 segundos" data-testid="obs60-launcher">
    <h2>Vídeo 60 segundos · 2, 3 e 4 anos</h2>
    <p>Guia de consultório por idade. A IA extrai os seis registros do vídeo; você não preenche classificações. Protótipo não validado, com revisão clínica obrigatória.</p>
    <button type="button" onClick={() => setOpen(true)}>Abrir guia e análise por vídeo</button>
    {open && <Suspense fallback={<p role="status">Abrindo o guia…</p>}><Obs60Panel onClose={() => setOpen(false)} /></Suspense>}
  </section>;
}
