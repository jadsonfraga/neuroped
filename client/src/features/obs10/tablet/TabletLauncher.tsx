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
        if (preview?.srcObject instanceof MediaStream && preview.srcObject.getTracks().some((t) => t.readyState === "live")) { setMessage("Encerre a prévia da câmera do modo presencial antes de mudar para tablet."); return; }
        if (typeof HTMLDialogElement === "undefined" || !HTMLDialogElement.prototype.showModal) { setMessage("Este navegador não suporta o modo guiado em tela protegida. Use um navegador institucional atualizado; o modo presencial permanece disponível."); return; }
        setOpen(true);
      }}>Abrir modo tablet · experimental</button><p role="status">{message}</p></div>
    </section>
    {open && createPortal(<dialog className="ot-dialog" ref={dialog} aria-label="OBS-10 Tablet: aplicação guiada" onCancel={(e) => { e.preventDefault(); setMessage("Use os botões do modo tablet para encerrar sem perder o registro."); }}><style>{TABLET_STYLE}</style><Suspense fallback={<div className="obs10 ot-root"><p role="status">Abrindo o modo tablet…</p><button type="button" onClick={close}>Voltar sem iniciar</button></div>}><TabletWorkspace onClose={close} /></Suspense></dialog>, document.body)}
  </>;
}
