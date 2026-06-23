import { Link } from "wouter";
import { AlertTriangle, Calculator, ClipboardCheck, Pill, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { appMetrics } from "@/data/appMetrics";

const medicationHubs = [
  {
    href: "/farmacologia",
    title: "Farmacologia",
    description: "Lista de medicações, categorias clínicas, doses de referência e observações de segurança.",
    icon: Pill,
  },
  {
    href: "/calculadora-dose",
    title: "Calculadora de dose",
    description: "Apoio para cálculo por peso com conferência clínica obrigatória antes de prescrever.",
    icon: Calculator,
  },
  {
    href: "/satisfacao-medicacao",
    title: "Monitorização medicamentosa",
    description: "Registro estruturado de resposta terapêutica, adesão, satisfação e efeitos percebidos.",
    icon: ClipboardCheck,
  },
  {
    href: "/efeitos-colaterais",
    title: "Efeitos percebidos",
    description: "Orientação familiar para relatar sintomas percebidos, sem definir causalidade ou ajuste de dose.",
    icon: AlertTriangle,
  },
];

export default function MedicamentosPage() {
  return (
    <div className="page-enter space-y-5 pb-8">
      <header className="rounded-[2rem] border border-border/70 bg-card/90 p-5 shadow-sm backdrop-blur">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-chart-2 text-white shadow-md">
            <Pill className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <Badge className="mb-2 rounded-full bg-primary/10 text-primary hover:bg-primary/10">
              {appMetrics.medicationCount} medicações · {appMetrics.medicationCategoryCount} categorias
            </Badge>
            <h1 className="text-2xl font-black tracking-tight text-foreground">Medicamentos</h1>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Hub clínico para farmacologia, cálculo de dose e monitorização do tratamento no NeuroPed.
            </p>
          </div>
        </div>
      </header>

      <section className="grid gap-3 md:grid-cols-2">
        {medicationHubs.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.href} className="border-card-border">
              <CardContent className="flex h-full flex-col gap-4 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-base font-black text-foreground">{item.title}</h2>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                  </div>
                </div>
                <Button asChild className="mt-auto w-full">
                  <Link href={item.href}>Abrir {item.title}</Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <Card className="border-amber-200/60 bg-amber-50/70 dark:border-amber-900/40 dark:bg-amber-950/20">
        <CardContent className="flex items-start gap-3 p-4">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-200" aria-hidden="true" />
          <p className="text-sm leading-relaxed text-amber-900 dark:text-amber-100">
            <strong>Uso responsável:</strong> informações farmacológicas e cálculos são apoio clínico. Prescrição exige avaliação individual, conferência de bula/fonte vigente, peso atualizado, comorbidades, interações e julgamento médico.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
