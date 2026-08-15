import { useEffect, useRef, useState, type MouseEvent } from "react";

const ACK_KEY = "neuroped:aviso-educativo-aceito-v1";

export function hasAcceptedLegalNotice(): boolean {
  try {
    return !!localStorage.getItem(ACK_KEY);
  } catch {
    return false;
  }
}

/**
 * Aceite único de ciência na PRIMEIRA visita: registra que o usuário viu e
 * entendeu que o app tem finalidade exclusivamente educativa. Guarda a ciência
 * (com data) no navegador. Não é imunidade legal — é uma camada de comunicação
 * e registro de ciência do usuário.
 */
interface AvisoLegalGateProps {
  onAccepted?: () => void;
}

export function AvisoLegalGate({ onAccepted }: AvisoLegalGateProps) {
  const [accepted, setAccepted] = useState<boolean>(() =>
    hasAcceptedLegalNotice(),
  );
  const dialogRef = useRef<HTMLDivElement>(null);
  const acceptButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (accepted) return;
    // Owner próprio no scroller real e no body: nunca salva/restaura a trava
    // de outro overlay e funciona de forma consistente entre engines.
    document.documentElement.classList.add("np-legal-gate-open");
    document.body.classList.add("np-legal-gate-open");
    return () => {
      document.documentElement.classList.remove("np-legal-gate-open");
      document.body.classList.remove("np-legal-gate-open");
    };
  }, [accepted]);

  useEffect(() => {
    if (accepted) return;
    const previouslyFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    acceptButtonRef.current?.focus();

    const keepFocusInside = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", keepFocusInside);
    return () => {
      document.removeEventListener("keydown", keepFocusInside);
      previouslyFocused?.focus();
    };
  }, [accepted]);

  if (accepted) return null;

  function aceitar() {
    try {
      localStorage.setItem(
        ACK_KEY,
        JSON.stringify({ accepted: true, at: new Date().toISOString(), v: 1 }),
      );
    } catch {
      /* storage indisponível — segue liberando a sessão */
    }
    setAccepted(true);
    onAccepted?.();
  }

  function abrirTermos(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    // Navegar antes de liberar o shell impede que o onboarding da home cubra
    // a página de termos durante o mesmo clique.
    window.location.hash = "#/termos";
    aceitar();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="aviso-legal-title"
      className="fixed inset-0 z-[400] flex items-start justify-center overflow-y-auto bg-slate-950/70 p-4 backdrop-blur-sm sm:items-center"
    >
      <div
        ref={dialogRef}
        className="my-auto max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-3xl border border-border bg-card p-6 shadow-2xl sm:p-7"
      >
        <div
          className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-2xl dark:bg-amber-950/40"
          aria-hidden="true"
        >
          ⚕️
        </div>
        <h1
          id="aviso-legal-title"
          className="text-center text-lg font-bold text-foreground"
        >
          Aviso importante
        </h1>
        <p className="mt-2 text-center text-[13px] leading-relaxed text-muted-foreground">
          O <strong className="font-semibold text-foreground">NeuroPed</strong>{" "}
          tem finalidade
          <strong className="font-semibold text-foreground">
            {" "}
            exclusivamente educativa
          </strong>
          . Não é dispositivo médico e{" "}
          <strong className="font-semibold text-foreground">
            não substitui
          </strong>{" "}
          a avaliação, o diagnóstico ou a conduta de um profissional de saúde.
          Parte do conteúdo é educativa e pode não ter validação clínica formal.
          Em caso de dúvida ou urgência, procure um médico.
        </p>

        <button
          ref={acceptButtonRef}
          type="button"
          onClick={aceitar}
          className="mt-5 w-full rounded-xl bg-gradient-to-r from-primary to-chart-2 px-4 py-3 text-sm font-bold text-primary-foreground shadow-sm transition hover:opacity-95 active:scale-[0.99]"
          data-testid="button-aviso-aceitar"
        >
          Li e entendi — continuar
        </button>
        <a
          href="#/termos"
          onClick={abrirTermos}
          className="mt-3 block text-center text-xs font-semibold text-primary underline underline-offset-4 hover:opacity-80"
        >
          Ler os Termos de Uso e Aviso Legal completos
        </a>
      </div>
    </div>
  );
}
