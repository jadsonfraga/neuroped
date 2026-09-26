import { useEffect } from "react";
import { leavesSondaRoute } from "@/lib/sondaDezQuality";

/** Only this memory-only workspace is guarded; the shared router and auth stay untouched. */
export function useSondaExitGuard(dirty: boolean, sessionInvalid = true) {
  useEffect(() => {
    if (!dirty) return;
    const heldUrl = window.location.href;
    const heldState = window.history.state;
    let leaving = false;
    const prompt = "Sair apaga os registros desta Sonda. Copie ou baixe o resultado antes de sair. Deseja sair mesmo assim?";
    const warn = (event: BeforeUnloadEvent) => {
      if (leaving) return;
      event.preventDefault(); event.returnValue = "";
    };
    const invalid = sessionInvalid;
    const click = (event: MouseEvent) => {
      if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || !(event.target instanceof Element)) return;
      const anchor = event.target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement) || (anchor.target && anchor.target !== "_self") || anchor.hasAttribute("download")) return;
      if (!leavesSondaRoute(anchor.href, heldUrl, invalid)) return;
      if (window.confirm(prompt)) { leaving = true; return; }
      event.preventDefault(); event.stopPropagation();
    };
    const change = (event: Event) => {
      if (leaving || !leavesSondaRoute(window.location.href, heldUrl, invalid)) return;
      if (window.confirm(prompt)) { leaving = true; return; }
      event.stopImmediatePropagation();
      window.history.replaceState(heldState, "", heldUrl);
    };
    document.addEventListener("click", click, true);
    window.addEventListener("hashchange", change, true);
    window.addEventListener("popstate", change, true);
    window.addEventListener("beforeunload", warn);
    return () => {
      document.removeEventListener("click", click, true);
      window.removeEventListener("hashchange", change, true);
      window.removeEventListener("popstate", change, true);
      window.removeEventListener("beforeunload", warn);
    };
  }, [dirty, sessionInvalid]);
}
