import { CalendarClock, ExternalLink, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export const BOACONSULTA_PROFILE_SLUG = "61e1abfa9730aa005f000743";
export const BOACONSULTA_PROFILE_URL =
  "https://www.boaconsulta.com/especialista/jadson-fraga-araujo-junior-61e1abfa9730aa005f000743";

interface BoaConsultaScheduleGatewayProps {
  onOpen?: () => void;
}

/**
 * Porta isolada para a agenda oficial. O BoaConsulta abre em outro origin e
 * nunca executa JavaScript dentro da sessão autenticada do NeuroPed.
 */
export function BoaConsultaScheduleGateway({
  onOpen,
}: BoaConsultaScheduleGatewayProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-xl sm:p-8 dark:border-slate-800 dark:bg-slate-950">
      <CalendarClock className="mx-auto h-10 w-10 text-rose-900 dark:text-amber-300" />
      <h3 className="mt-4 text-xl font-black text-slate-950 dark:text-white">
        Consulte a agenda no BoaConsulta
      </h3>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-300">
        A disponibilidade oficial abrirá em uma nova guia, separada da sua
        sessão NeuroPed. Conclua a solicitação lá e volte para avisar a
        secretaria.
      </p>
      <div className="mx-auto mt-4 flex max-w-xl items-start gap-2 rounded-2xl bg-emerald-50 p-3 text-left text-xs leading-5 text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <span>
          O BoaConsulta não recebe acesso aos tokens, ao prontuário ou ao
          armazenamento desta sessão.
        </span>
      </div>
      <Button
        asChild
        className="mt-5 h-12 gap-2 bg-rose-900 px-5 font-black text-white hover:bg-rose-950"
      >
        <a
          href={BOACONSULTA_PROFILE_URL}
          onClick={onOpen}
          rel="noopener noreferrer"
          target="_blank"
        >
          Abrir agenda oficial <ExternalLink className="h-4 w-4" />
        </a>
      </Button>
    </div>
  );
}
