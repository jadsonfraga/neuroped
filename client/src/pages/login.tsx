import { ArrowLeft, ExternalLink, ShieldCheck } from "lucide-react";
import { PUBLIC_HOME } from "@/lib/publicRoutes";
import { MEDICAL_URL } from "@/lib/zone";

/**
 * Rota legada mantida para compatibilidade com links e favoritos antigos.
 *
 * A área clínica não solicita credenciais nesta instalação. Em vez de devolver
 * o visitante para `/`, que é uma rota clínica protegida e causava um ciclo de
 * redirecionamento, esta tela oferece uma saída estável para o conteúdo público
 * e, quando configurado, para o host médico protegido.
 */
export default function LoginPage() {
  return (
    <section className="mx-auto flex min-h-[70vh] w-full max-w-lg flex-col items-center justify-center px-4 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-md">
        <ShieldCheck className="h-7 w-7 text-primary-foreground" strokeWidth={1.75} />
      </div>
      <h1 className="text-xl font-bold text-foreground">Área clínica protegida</h1>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        Esta área é exclusiva para profissionais e deve ser aberta pelo endereço
        médico protegido. O conteúdo público para famílias continua disponível
        sem credenciais.
      </p>

      <div className="mt-6 flex w-full max-w-sm flex-col gap-3">
        <a
          href={`#${PUBLIC_HOME}`}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Ir para o conteúdo das famílias
        </a>
        {MEDICAL_URL && (
          <a
            href={MEDICAL_URL}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
            Abrir área médica protegida
          </a>
        )}
      </div>
    </section>
  );
}
