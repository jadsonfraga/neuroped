import { useEffect } from "react";
import { leavesObsRoute } from "./safety";

/** Protect this memory-only workspace without patching the shared router or permissions. */
export function useExitGuard(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const heldUrl = window.location.href;
    const heldState = window.history.state;
    let leaving = false;
    const prompt = "Sair elimina os registros e o vídeo ainda não exportados. Deseja sair mesmo assim?";
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    const click = (event: MouseEvent) => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || !(event.target instanceof Element)) return;
      const anchor = event.target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement) || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      if (!leavesObsRoute(anchor.href, heldUrl)) return;
      if (window.confirm(prompt)) { leaving = true; return; }
      event.preventDefault(); event.stopPropagation();
    };
    const routeChange = (event: Event) => {
      if (leaving || !leavesObsRoute(window.location.href, heldUrl)) return;
      if (window.confirm(prompt)) { leaving = true; return; }
      // Wouter emits hashchange after pushState; restore before its bubble subscribers run.
      event.stopImmediatePropagation();
      window.history.replaceState(heldState, "", heldUrl);
    };
    document.addEventListener("click", click, true);
    window.addEventListener("hashchange", routeChange, true);
    window.addEventListener("popstate", routeChange, true);
    window.addEventListener("beforeunload", warn);
    return () => {
      document.removeEventListener("click", click, true);
      window.removeEventListener("hashchange", routeChange, true);
      window.removeEventListener("popstate", routeChange, true);
      window.removeEventListener("beforeunload", warn);
    };
  }, [dirty]);
}
