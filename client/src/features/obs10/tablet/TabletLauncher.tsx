import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { TABLET_STYLE } from "./style";
const TabletWorkspace = lazy(() => import("./TabletWorkspace"));

/** Existing route remains the only entry; native modal makes its background inert. */
export function TabletLauncher({ locked }: { locked: boolean }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (open && dialog.current && !dialog.current.open) dialog.current.showModal();
  }, [open]);
  function close() { dialog.current?.close(); setOpen(false); setMessage(""); requestAnimationFrame(() => trigger.current?.focus()); }
  return <>
    <section className="obs10-kind" data-testid="tablet-launcher">
      <div><h2>Aplicar somente com tablet e câmera</h2><p>Jornada guiada sem papel, lápis ou brinquedos. Modo digital experimental, com cobertura diferente do presencial. Não transforma manipulação real em teste de tela.</p><button ref={trigger} type="button" disabled={locked} onClick={() => {
        const preview = document.querySelector<HTMLVideoElement>(".obs10-camera-test video");
        if (typeof MediaStream !== "undefined" && preview?.srcObject instanceof MediaStream && preview.srcObject.getTracks().some((t) => t.readyState === "live")) { setMessage("Encerre a prévia da câmera do modo presencial antes de mudar para tablet."); return; }
        if (typeof HTMLDialogElement === "undefined" || !HTMLDialogElement.prototype.showModal) { setMessage("Este navegador não suporta o modo guiado em tela protegida. Use um navegador institucional atualizado; o modo presencial permanece disponível."); return; }
        setMessage(""); setOpen(true);
      }}>Abrir modo tablet · experimental</button>{!open && <p role="status">{message}</p>}</div>
    </section>
    {open && createPortal(<dialog className="ot-dialog" ref={dialog} aria-modal="true" aria-label="OBS-10 Tablet: aplicação guiada" onCancel={(e) => { e.preventDefault(); setMessage("Para sair sem perder o registro, use Voltar na preparação ou Encerrar coleta e guarde os arquivos."); }}>
      <style>{TABLET_STYLE}</style>
      <section aria-label="Área de trabalho do modo tablet">
        {message && <div className="obs10 ot-root"><p role="status" className="ot-info">{message}</p></div>}
        <Suspense fallback={<div className="obs10 ot-root"><p role="status">Abrindo o modo tablet…</p><button type="button" onClick={close}>Voltar sem iniciar</button></div>}><TabletWorkspace onClose={close} /></Suspense>
      </section>
    </dialog>, document.body)}
  </>;
}
