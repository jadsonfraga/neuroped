import { useEffect, useRef } from "react";
import type { PrintableScene } from "./framePlan";
import { TaskPicture } from "./PracticalVisuals";

export type StageContent = { kind: "scene"; scene: PrintableScene } | { kind: "reading"; text: string };
/** Child-facing full-screen surface. It can only render the allowlisted scene or reading text:
 * it never imports tasks, commands or session state, so no script can leak to the child. */
export function StimulusStage({ content, onClose }: { content: StageContent; onClose: () => void }) {
  const close = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const opener = document.activeElement;
    close.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      // The close control is the single focusable element of the modal surface.
      if (event.key === "Tab") { event.preventDefault(); close.current?.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      if (opener instanceof HTMLElement) opener.focus();
    };
  }, [onClose]);
  return <div className="obs10-stimulus-stage" role="dialog" aria-modal="true" aria-label="Estímulo em tela inteira para a criança" data-testid="obs10-stimulus-stage">
    <button ref={close} type="button" onClick={onClose}>Encerrar exibição</button>
    {content.kind === "scene"
      ? <TaskPicture scene={content.scene} label="Cena para observar e descrever" />
      : <p className="obs10-stimulus-text" data-testid="obs10-stimulus-text">{content.text}</p>}
  </div>;
}
