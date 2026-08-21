import { Link } from "wouter";
import {
  Activity,
  ArrowRight,
  Baby,
  BookOpenCheck,
  Brain,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Info,
  ShieldCheck,
  Waves,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DiarioClinico, type DiarioConfig } from "@/components/DiarioClinico";

const developmentConfig: DiarioConfig = {
  id: "neuroped-desenvolvimento-brasil-v1",
  storageKey: "neuroped:diario-desenvolvimento-brasil:v1",
  title: "Linha do tempo do desenvolvimento",
  subtitle: "Registro longitudinal brasileiro para apoiar a consulta — sem pontuação diagnóstica automática",
  icon: Baby,
  gradient: "from-sky-500 to-cyan-600",
  trendLabel: "Idade aproximada (meses)",
  fields: [
    {
      key: "date",
      label: "Data da observação",
      type: "date",
      required: true,
    },
    {
      key: "ageMonths",
      label: "Idade aproximada (meses)",
      type: "number",
      required: true,
      min: 0,
      max: 240,
      placeholder: "Ex.: 24",
      trend: true,
    },
    {
      key: "context",
      label: "Contexto da observação",
      type: "select",
      required: true,
      options: ["Família", "Consulta", "Escola/creche", "Terapia", "Outro"],
    },
    {
      key: "motor",
      label: "Aspectos motores observados",
      type: "textarea",
      placeholder: "Descreva aquisições, dificuldades ou mudanças observadas.",
    },
    {
      key: "language",
      label: "Comunicação e linguagem",
      type: "textarea",
      placeholder: "Vocalizações, palavras, compreensão, comunicação alternativa ou regressão.",
    },
    {
      key: "social",
      label: "Interação social e comportamento",
      type: "textarea",
      placeholder: "Brincadeira, reciprocidade, regulação, interesses e participação.",
    },
    {
      key: "autonomy",
      label: "Autonomia e atividades diárias",
      type: "textarea",
      placeholder: "Alimentação, sono, higiene, vestir-se e participação em rotinas.",
    },
    {
      key: "regression",
      label: "Houve perda de habilidade percebida?",
      type: "select",
      required: true,
      options: ["Não observado", "Sim — requer avaliação clínica", "Não foi possível avaliar"],
    },
    {
      key: "notes",
      label: "Observações para a consulta",
      type: "textarea",
      placeholder: "Registre perguntas, vídeos autorizados a discutir ou pontos para revisar.",
    },
  ],
};

type ModuleCardProps = {
  href: string;
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
  tone: string;
};

function ModuleCard({ href, icon: Icon, eyebrow, title, description, tone }: ModuleCardProps) {
  return (
    <Card className="h-full border-border/80 transition-shadow hover:shadow-md">
      <CardContent className="flex h-full flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${tone} shadow-sm`}>
            <Icon className="h-5 w-5 text-white" aria-hidden="true" />
          </div>
          <Badge variant="secondary" className="text-[10px]">Disponível</Badge>
        </div>
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{eyebrow}</p>
          <h2 className="text-base font-bold text-foreground">{title}</h2>
          <p className="text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
        <Button asChild variant="outline" size="sm" className="mt-auto w-fit gap-2">
          <Link href={href}>
            Abrir módulo <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export default function NeuropedAcompanhamentoPage() {
  return (
    <div className="space-y-7 pb-12" data-testid="neuroacompanhamento-page">
      <header className="relative overflow-hidden rounded-3xl border border-sky-200/70 bg-gradient-to-br from-sky-50 via-background to-cyan-50 p-6 shadow-sm dark:border-sky-900/50 dark:from-sky-950/30 dark:via-background dark:to-cyan-950/20 md:p-8">
        <div className="absolute -right-16 -top-20 h-52 w-52 rounded-full bg-sky-200/30 blur-3xl dark:bg-sky-700/10" />
        <div className="relative max-w-3xl space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-sky-600 text-white hover:bg-sky-600">Neuroped · versão brasileira</Badge>
            <Badge variant="outline" className="border-sky-300 text-sky-800 dark:border-sky-800 dark:text-sky-200">Acompanhamento longitudinal</Badge>
          </div>
          <div className="flex items-start gap-4">
            <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-600 text-white shadow-sm sm:flex">
              <Brain className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">NeuroAcompanhamento</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
                Um centro de controle para registrar desenvolvimento, crises e evolução clínica com linguagem brasileira, histórico protegido e próximos passos claros.
              </p>
            </div>
          </div>
        </div>
      </header>

      <section className="grid gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 dark:border-amber-900/60 dark:bg-amber-950/20" aria-label="Limites clínicos">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-300" aria-hidden="true" />
          <div className="space-y-1 text-sm leading-6 text-amber-950 dark:text-amber-100">
            <p className="font-semibold">Apoio à consulta, não diagnóstico automático.</p>
            <p>
              Os registros organizam informações relatadas por família, escola ou equipe. Eles não substituem exame clínico, EEG, avaliação neuropsicológica, escalas licenciadas ou julgamento profissional.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" aria-label="Módulos do NeuroAcompanhamento">
        <ModuleCard
          href="/epilepsia"
          icon={Activity}
          eyebrow="Epilepsia"
          title="Diário de crises"
          description="Registre eventos, duração, consciência, gatilhos, pós-ictal, medicação e observações para a próxima consulta."
          tone="from-violet-500 to-purple-600"
        />
        <ModuleCard
          href="/cefaleia"
          icon={Waves}
          eyebrow="Sintomas"
          title="Cefaleia e sintomas"
          description="Acompanhe frequência, intensidade e contexto de sintomas para observar padrões ao longo do tempo."
          tone="from-indigo-500 to-blue-600"
        />
        <ModuleCard
          href="/filtro"
          icon={ClipboardCheck}
          eyebrow="Avaliação"
          title="Escalas e triagem"
          description="Encontre instrumentos por queixa e faixa etária, com a ressalva de que triagem não equivale a diagnóstico."
          tone="from-emerald-500 to-teal-600"
        />
        <ModuleCard
          href="/marcos-desenvolvimento"
          icon={BookOpenCheck}
          eyebrow="Referência"
          title="Marcos do desenvolvimento"
          description="Consulte marcos por idade e use a linha do tempo abaixo para registrar observações reais."
          tone="from-amber-500 to-orange-600"
        />
      </section>

      <section className="space-y-4" aria-labelledby="development-title">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-700 dark:text-sky-300">Módulo próprio</p>
            <h2 id="development-title" className="mt-1 text-xl font-bold text-foreground">Linha do tempo brasileira do desenvolvimento</h2>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
              Registro longitudinal protegido neste dispositivo. Use uma entrada por observação relevante e leve o histórico exportado para a consulta quando necessário.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-emerald-600" aria-hidden="true" />
            Cofre local cifrado
          </div>
        </div>
        <DiarioClinico config={developmentConfig} />
      </section>

      <section className="grid gap-4 md:grid-cols-3" aria-label="Próximos passos">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Registro seguro</CardTitle></CardHeader>
          <CardContent className="text-sm leading-6 text-muted-foreground">Os registros longitudinais usam o cofre local protegido do Neuroped e permanecem neste dispositivo.</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm"><CalendarDays className="h-4 w-4 text-sky-600" /> Próxima consulta</CardTitle></CardHeader>
          <CardContent className="text-sm leading-6 text-muted-foreground">Use a linha do tempo para preparar perguntas e organizar mudanças percebidas entre consultas.</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm"><ShieldCheck className="h-4 w-4 text-violet-600" /> Uso responsável</CardTitle></CardHeader>
          <CardContent className="text-sm leading-6 text-muted-foreground">Não compartilhe dados identificáveis fora dos fluxos autorizados e revise os registros antes de exportar.</CardContent>
        </Card>
      </section>
    </div>
  );
}
