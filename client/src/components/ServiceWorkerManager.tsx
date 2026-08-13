import { useEffect, useState } from "react";
import { RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const VERSION_KEY = "neuroped:sw-version";

interface UpdateInfo {
  version: string;
}

/**
 * Libera apenas travas de scroll ÓRFÃS.
 *
 * Radix/react-remove-scroll pode bloquear o body ou o scroller raiz por
 * atributo `data-scroll-locked` + CSS injetado, sem depender apenas de
 * body.style.overflow. O shell já limpava overflow inline, mas isso não
 * alcançava todas as formas de lock — sintoma observado em tablet: a página
 * fica visualmente normal, porém swipe/touch não move absolutamente nada.
 *
 * Nunca interfere enquanto houver um drawer/modal/menu legítimo aberto.
 */
function releaseOrphanedScrollLock() {
  if (typeof document === "undefined") return;

  const body = document.body;
  const scrollRoot = document.documentElement;
  const lockTargets = [scrollRoot, body];
  // Uma classe sozinha não prova ownership: se o componente desmontar antes do
  // cleanup, ela própria vira a trava órfã. Exige o overlay vivo no DOM e limpa
  // a classe residual antes de decidir se a recuperação deve ser bloqueada.
  const appOwners = [
    {
      className: "np-mobile-drawer-open",
      open:
        document.querySelector(
          'aside[aria-label="Menu de navegação"][role="dialog"][aria-modal="true"]',
        ) !== null,
    },
    {
      className: "np-legal-gate-open",
      open:
        document.querySelector(
          '[role="dialog"][aria-modal="true"][aria-labelledby="aviso-legal-title"]',
        ) !== null,
    },
  ];

  for (const owner of appOwners) {
    if (owner.open) continue;
    for (const target of lockTargets) target.classList.remove(owner.className);
  }

  // Radix pode não refletir aria-modal no Content; data-state="open" é o
  // contrato real. Elementos fechados/invisíveis ainda montados não podem
  // preservar uma trava órfã indefinidamente.
  const hasActiveOverlay = (selector: string) =>
    [...document.querySelectorAll<HTMLElement>(selector)].some((element) => {
      if (element.dataset.state === "closed" || element.getAttribute("aria-hidden") === "true") {
        return false;
      }
      const style = getComputedStyle(element);
      return (
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        element.getClientRects().length > 0
      );
    });

  const legitimateOverlayOpen =
    appOwners.some((owner) => owner.open) ||
    hasActiveOverlay(
      '[role="dialog"][aria-modal="true"], [role="dialog"][data-state="open"], ' +
        '[role="alertdialog"][aria-modal="true"], [role="alertdialog"][data-state="open"], ' +
        '[role="menu"], [role="listbox"], [data-vaul-drawer][data-state="open"]',
    );

  if (legitimateOverlayOpen) return;

  const hasOrphanedLock = lockTargets.some(
    (target) =>
      target.style.overflow === "hidden" ||
      target.style.overflowY === "hidden" ||
      target.style.pointerEvents === "none" ||
      target.hasAttribute("data-scroll-locked"),
  );

  if (!hasOrphanedLock) return;

  for (const target of lockTargets) {
    target.style.removeProperty("overflow");
    target.style.removeProperty("overflow-y");
    target.style.removeProperty("pointer-events");
    target.removeAttribute("data-scroll-locked");
  }
}

/**
 * Aplica a atualização de verdade, não só recarrega.
 *
 * O sw.js chama skipWaiting() no install, então normalmente não há worker em
 * "waiting" — mas quando há (instalação concluída enquanto a aba estava em
 * segundo plano, ou um install antigo interrompido), um reload simples é
 * servido pelo worker ANTIGO com o precache antigo, e o banner volta em loop.
 * Aqui destravamos explicitamente o worker em espera antes de recarregar.
 */
async function applyPendingUpdate(): Promise<void> {
  try {
    const registration = await navigator.serviceWorker?.getRegistration();
    const waiting = registration?.waiting;
    if (waiting) {
      const activated = new Promise<void>((resolve) => {
        const timer = globalThis.setTimeout(resolve, 1500);
        navigator.serviceWorker.addEventListener(
          "controllerchange",
          () => {
            globalThis.clearTimeout(timer);
            resolve();
          },
          { once: true },
        );
      });
      waiting.postMessage({ type: "SKIP_WAITING" });
      await activated;
    }
  } catch {
    // O reload abaixo ainda busca o HTML novo (network-first + no-cache).
  }
  window.location.reload();
}

export function ServiceWorkerManager() {
  const [update, setUpdate] = useState<UpdateInfo | null>(null);

  useEffect(() => {
    // P0 de produção: autocura uma trava órfã ao voltar para a aba/PWA e,
    // principalmente, no primeiro novo gesto do usuário. O listener em capture
    // roda antes do conteúdo e não exige troca de rota nem recarregamento.
    const recoverScroll = () => releaseOrphanedScrollLock();
    const recoverWhenVisible = () => {
      if (document.visibilityState === "visible") recoverScroll();
    };

    const initialRecovery = globalThis.setTimeout(recoverScroll, 0);
    window.addEventListener("pageshow", recoverScroll);
    window.addEventListener("pointerdown", recoverScroll, { capture: true });
    window.addEventListener("touchstart", recoverScroll, { capture: true, passive: true });
    document.addEventListener("visibilitychange", recoverWhenVisible);

    return () => {
      globalThis.clearTimeout(initialRecovery);
      window.removeEventListener("pageshow", recoverScroll);
      window.removeEventListener("pointerdown", recoverScroll, { capture: true });
      window.removeEventListener("touchstart", recoverScroll, { capture: true });
      document.removeEventListener("visibilitychange", recoverWhenVisible);
    };
  }, []);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    let cancelled = false;
    let idleId: number | undefined;
    let fallbackTimer: ReturnType<typeof setTimeout> | undefined;
    let pollTimer: ReturnType<typeof setInterval> | undefined;
    let registrationRef: ServiceWorkerRegistration | null = null;

    const rememberVersion = (version: string) => {
      let previous: string | null = null;
      try {
        previous = localStorage.getItem(VERSION_KEY);
        localStorage.setItem(VERSION_KEY, version);
      } catch {
        // Sem persistência, a atualização ainda pode ser aplicada normalmente.
      }
      if (previous && previous !== version) setUpdate({ version });
    };

    const handleMessage = (event: MessageEvent) => {
      const version = typeof event.data?.version === "string" ? event.data.version : "";
      if (!version) return;
      if (event.data?.type === "SW_UPDATED" || event.data?.type === "SW_VERSION") {
        rememberVersion(version);
      }
    };

    const askCurrentVersion = () => {
      navigator.serviceWorker.controller?.postMessage({ type: "GET_VERSION" });
    };

    // Reconsulta o navegador por uma versão nova do sw.js. Sozinho, o registro
    // inicial só verifica UMA vez no carregamento — uma aba/PWA que fica aberta
    // em segundo plano por horas (comum em tablet de consultório) nunca mais
    // descobre um deploy novo até fechar e reabrir. Isso deixava o app preso
    // numa build antiga mesmo com o deploy já publicado e verde no CI.
    const checkForUpdate = () => {
      if (cancelled || !registrationRef) return;
      registrationRef.update().catch(() => undefined);
    };

    const register = () => {
      if (cancelled) return;
      navigator.serviceWorker
        .register("./sw.js")
        .then(async (registration) => {
          registrationRef = registration;
          askCurrentVersion();
          await registration.update().catch(() => undefined);
          // Poll de baixa frequência enquanto o app fica aberto, mais um
          // recheck sempre que a aba volta ao primeiro plano ou a conexão
          // retorna — cobre o cenário real de tablet de consultório.
          pollTimer = globalThis.setInterval(checkForUpdate, 15 * 60 * 1000);
        })
        .catch(() => undefined);
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") checkForUpdate();
    };

    const scheduleRegistration = () => {
      // O precache offline inclui os atalhos clínicos e compete com os chunks da
      // tela ativa. Damos prioridade absoluta à primeira interação; depois do
      // intervalo, o navegador escolhe uma janela ociosa para instalar o PWA.
      fallbackTimer = globalThis.setTimeout(() => {
        if ("requestIdleCallback" in window) {
          idleId = window.requestIdleCallback(register, { timeout: 8_000 });
        } else {
          register();
        }
      }, 10_000);
    };

    if (document.readyState === "complete") scheduleRegistration();
    else window.addEventListener("load", scheduleRegistration, { once: true });

    navigator.serviceWorker.addEventListener("message", handleMessage);
    navigator.serviceWorker.addEventListener("controllerchange", askCurrentVersion);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", checkForUpdate);

    return () => {
      cancelled = true;
      window.removeEventListener("load", scheduleRegistration);
      if (idleId !== undefined && "cancelIdleCallback" in window) window.cancelIdleCallback(idleId);
      if (fallbackTimer !== undefined) globalThis.clearTimeout(fallbackTimer);
      if (pollTimer !== undefined) globalThis.clearInterval(pollTimer);
      navigator.serviceWorker.removeEventListener("message", handleMessage);
      navigator.serviceWorker.removeEventListener("controllerchange", askCurrentVersion);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", checkForUpdate);
    };
  }, []);

  if (!update) return null;

  return (
    <aside className="fixed inset-x-3 bottom-3 z-[260] mx-auto flex max-w-xl items-center gap-3 rounded-2xl border border-primary/30 bg-card/95 p-3 shadow-2xl backdrop-blur" role="status" aria-live="polite">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <RefreshCw className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">Nova versão disponível</p>
        <p className="text-xs text-muted-foreground">Atualize para usar as correções mais recentes.</p>
      </div>
      <Button size="sm" onClick={() => { void applyPendingUpdate(); }} className="shrink-0">Atualizar</Button>
      <Button variant="ghost" size="icon" onClick={() => setUpdate(null)} aria-label="Fechar aviso de atualização" className="h-8 w-8 shrink-0">
        <X className="h-4 w-4" />
      </Button>
    </aside>
  );
}
