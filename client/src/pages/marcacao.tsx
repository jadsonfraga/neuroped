import {
  ArrowRight,
  CalendarCheck2,
  MessageCircleMore,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SECRETARIA_IA_URL } from "@/lib/manusLinks";

const journeySteps = [
  {
    number: "01",
    title: "Inicie a triagem administrativa",
    description:
      "Informe os dados essenciais para que a Secretaria IA compreenda a solicitação de atendimento.",
    icon: MessageCircleMore,
  },
  {
    number: "02",
    title: "Escolha o horário e conclua a reserva",
    description:
      "O módulo consulta a disponibilidade, cria a reserva temporária e orienta o pagamento da caução quando aplicável.",
    icon: ShieldCheck,
  },
  {
    number: "03",
    title: "Receba a confirmação da clínica",
    description:
      "Após a conferência do pagamento, a consulta é confirmada e fica disponível para acompanhamento pela equipe.",
    icon: UsersRound,
  },
];

export default function MarcacaoPage() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 pb-16 sm:px-6 lg:px-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-primary/20 bg-gradient-to-br from-primary/14 via-background to-emerald-500/10 p-6 shadow-sm sm:p-9">
        <div
          aria-hidden="true"
          className="absolute -right-16 -top-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl"
        />
        <div className="relative max-w-3xl">
          <Badge className="border-primary/20 bg-primary/10 text-primary hover:bg-primary/10">
            Clínica Dr. Jadson Fraga
          </Badge>
          <div className="mt-5 flex items-start gap-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <CalendarCheck2 className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                Marcação de consulta
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                O NeuroPed Connect reúne a Secretaria IA, a disponibilidade da agenda,
                a reserva temporária do horário e a conferência administrativa da
                caução em um único fluxo.
              </p>
            </div>
          </div>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button asChild size="lg" className="min-h-12 gap-2 px-5">
              <a href={SECRETARIA_IA_URL} data-testid="link-secretaria-ia-direto">
                Abrir agenda NeuroPed
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
            </Button>
            <p className="text-xs leading-5 text-muted-foreground">
              O acesso continua no módulo oficial de agendamento da clínica.
            </p>
          </div>
        </div>
      </section>

      <Card className="border-primary/15 bg-primary/[0.025]">
        <CardContent className="flex gap-3 p-5 text-sm leading-6 text-muted-foreground sm:p-6">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
          <p>
            <strong className="text-foreground">Privacidade e segurança:</strong> os
            dados administrativos da marcação permanecem separados do ambiente clínico,
            com acesso restrito à equipe autorizada e tratamento orientado pela LGPD.
          </p>
        </CardContent>
      </Card>

      <section aria-labelledby="marcacao-como-funciona">
        <div className="mb-4 flex items-center gap-3">
          <span className="h-px flex-1 bg-border" />
          <h2
            id="marcacao-como-funciona"
            className="text-sm font-bold uppercase tracking-[0.16em] text-primary"
          >
            Como funciona
          </h2>
          <span className="h-px flex-1 bg-border" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {journeySteps.map((step) => {
            const Icon = step.icon;
            return (
              <Card
                key={step.number}
                className="group border-border/80 transition-transform duration-200 hover:-translate-y-0.5"
              >
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black tracking-[0.18em] text-primary">
                      {step.number}
                    </span>
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                  </div>
                  <h3 className="mt-5 font-bold tracking-tight">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {step.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-[1.75rem] border bg-card p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <h2 className="font-bold tracking-tight">Pronto para iniciar a marcação?</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Consulte os horários disponíveis e prossiga pelo fluxo administrativo da
            clínica.
          </p>
        </div>
        <Button asChild variant="outline" className="min-h-11 shrink-0 gap-2">
          <a href={SECRETARIA_IA_URL}>
            Abrir NeuroPed Connect
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </Button>
      </section>
    </div>
  );
}
