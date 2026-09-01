import { useEffect, useState } from "react";
import {
  CalendarClock,
  ExternalLink,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const BOACONSULTA_PROFILE_SLUG = "61e1abfa9730aa005f000743";
export const BOACONSULTA_PROFILE_URL =
  "https://www.boaconsulta.com/especialista/jadson-fraga-araujo-junior-61e1abfa9730aa005f000743";
export const BOACONSULTA_WIDGET_SRC =
  "https://boaconsulta-widgets.s3.sa-east-1.amazonaws.com/bc-widget-schedules.min.js";

const WIDGET_SCRIPT_ID = "boaconsulta-schedules-widget-script";
const WIDGET_TAG = "bc-widget-schedules";

type WidgetState = "loading" | "ready" | "error";

function widgetIsRegistered() {
  return Boolean(window.customElements?.get(WIDGET_TAG));
}

/** Agenda oficial do BoaConsulta, carregada apenas quando a rota pública é aberta. */
export function BoaConsultaScheduleWidget() {
  const [state, setState] = useState<WidgetState>(() =>
    typeof window !== "undefined" && widgetIsRegistered() ? "ready" : "loading",
  );

  useEffect(() => {
    if (widgetIsRegistered()) {
      setState("ready");
      return;
    }

    let active = true;
    let timeoutId: number | undefined;
    const markReady = () => {
      void window.customElements.whenDefined(WIDGET_TAG).then(() => {
        if (active) setState("ready");
      });
    };
    const markError = () => {
      if (active) setState("error");
    };

    let script = document.getElementById(
      WIDGET_SCRIPT_ID,
    ) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = WIDGET_SCRIPT_ID;
      script.src = BOACONSULTA_WIDGET_SRC;
      script.async = true;
      script.referrerPolicy = "no-referrer";
      script.addEventListener("load", markReady, { once: true });
      script.addEventListener("error", markError, { once: true });
      document.head.appendChild(script);
    } else {
      script.addEventListener("load", markReady, { once: true });
      script.addEventListener("error", markError, { once: true });
      markReady();
    }

    timeoutId = window.setTimeout(() => {
      if (!widgetIsRegistered()) markError();
    }, 12_000);

    return () => {
      active = false;
      if (timeoutId) window.clearTimeout(timeoutId);
      script?.removeEventListener("load", markReady);
      script?.removeEventListener("error", markError);
    };
  }, []);

  if (state === "loading") {
    return (
      <div className="flex min-h-72 items-center justify-center rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div
          aria-live="polite"
          className="space-y-3 text-slate-600 dark:text-slate-300"
        >
          <LoaderCircle className="mx-auto h-8 w-8 animate-spin text-rose-900 dark:text-amber-300" />
          <p className="font-semibold">
            Carregando horários oficiais do BoaConsulta…
          </p>
        </div>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="rounded-3xl border border-amber-300/80 bg-amber-50 p-6 text-center shadow-sm dark:border-amber-700/60 dark:bg-amber-950/30">
        <CalendarClock className="mx-auto h-9 w-9 text-amber-700 dark:text-amber-300" />
        <h3 className="mt-3 text-lg font-black text-slate-950 dark:text-white">
          A agenda não carregou aqui.
        </h3>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-700 dark:text-slate-300">
          Abra o perfil oficial para consultar os mesmos horários diretamente no
          BoaConsulta.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Button
            asChild
            className="gap-2 bg-rose-900 text-white hover:bg-rose-950"
          >
            <a href={BOACONSULTA_PROFILE_URL} rel="noreferrer" target="_blank">
              Abrir BoaConsulta <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
          <Button
            className="gap-2"
            onClick={() => window.location.reload()}
            variant="outline"
          >
            Tentar novamente <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-2 shadow-xl sm:p-4 dark:border-slate-800 dark:bg-slate-950">
      <bc-widget-schedules
        className="block min-h-72 w-full"
        layout="medium"
        profile-slug={BOACONSULTA_PROFILE_SLUG}
      />
    </div>
  );
}
