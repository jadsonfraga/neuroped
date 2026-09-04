import { useMemo } from "react";
import { CheckCircle2, Clock3, CreditCard, XCircle } from "lucide-react";

function statusFromLocation(): "success" | "cancel" | "expired" | "unknown" {
  if (typeof window === "undefined") return "unknown";
  const raw = window.location.hash.replace(/^#/, "");
  const query = raw.includes("?") ? raw.slice(raw.indexOf("?") + 1) : "";
  const status = new URLSearchParams(query).get("status") ?? "";
  return status === "success" || status === "cancel" || status === "expired" ? status : "unknown";
}

const CONTENT = {
  success: {
    icon: CheckCircle2,
    tone: "text-emerald-600 dark:text-emerald-400",
    title: "Pagamento em processamento",
    body: "Recebemos o retorno do provedor de pagamento. A ativação é confirmada pelo servidor assim que o pagamento compensar — o estado real aparece em Configurações → Plano.",
  },
  cancel: {
    icon: XCircle,
    tone: "text-destructive",
    title: "Checkout cancelado",
    body: "Nenhuma cobrança foi feita. Você pode reiniciar a assinatura quando quiser em Configurações → Plano.",
  },
  expired: {
    icon: Clock3,
    tone: "text-amber-600 dark:text-amber-400",
    title: "Checkout expirado",
    body: "O link de pagamento venceu sem conclusão. Gere um novo checkout em Configurações → Plano.",
  },
  unknown: {
    icon: CreditCard,
    tone: "text-muted-foreground",
    title: "Retorno de pagamento",
    body: "Não foi possível identificar o resultado do checkout. Confira o estado da assinatura em Configurações → Plano.",
  },
} as const;

export default function BillingRetornoPage() {
  const status = useMemo(statusFromLocation, []);
  const { icon: Icon, tone, title, body } = CONTENT[status];

  return (
    <section className="mx-auto flex min-h-[60vh] w-full max-w-lg flex-col items-center justify-center px-4 text-center">
      <Icon className={`h-12 w-12 ${tone}`} aria-hidden="true" strokeWidth={1.5} />
      <h1 className="mt-4 text-xl font-bold text-foreground">{title}</h1>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{body}</p>
      <a href="#/configuracoes" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-chart-2 px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25">
        <CreditCard className="h-4 w-4" aria-hidden="true" /> Ver plano e assinatura
      </a>
    </section>
  );
}
