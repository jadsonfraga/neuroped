import { useEffect, useMemo, useState } from "react";
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
  ShieldAlert,
  ShieldCheck,
  School,
  Waves,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DiarioClinico, type DiarioConfig, type DiarioEntry } from "@/components/DiarioClinico";
import { useAuth } from "@/contexts/AuthContext";
import { secureGet } from "@/lib/secureStorage";

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

function dateKey(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.slice(0, 10);
}

function dateLabel(value: unknown): string {
  const key = dateKey(value);
  if (!key) return "Data não informada";
  const parsed = new Date(`${key}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? key : parsed.toLocaleDateString("pt-BR");
}

function scoreLabel(value: unknown): string {
  const number = Number(value);
  return Number.isFinite(number) ? `${number}/5` : "—";
}

function ClinicalSchoolCorrelation({ localDraftsEnabled }: { localDraftsEnabled: boolean }) {
  const [schoolEntries, setSchoolEntries] = useState<DiarioEntry[]>([]);
  const [developmentEntries, setDevelopmentEntries] = useState<DiarioEntry[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    if (!localDraftsEnabled) {
      setSchoolEntries([]);
      setDevelopmentEntries([]);
      setReady(true);
      return () => { active = false; };
    }

    setReady(false);
    void Promise.all([
      secureGet<DiarioEntry[]>("diario:diario-escola"),
      secureGet<DiarioEntry[]>("diario:neuroped-desenvolvimento-brasil-v1"),
    ]).then(([school, development]) => {
      if (!active) return;
      setSchoolEntries(Array.isArray(school) ? school : []);
      setDevelopmentEntries(Array.isArray(development) ? development : []);
      setReady(true);
    });
    return () => { active = false; };
  }, [localDraftsEnabled]);

  const school = useMemo(
    () => [...schoolEntries].sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0)),
    [schoolEntries],
  );
  const development = useMemo(
    () => [...developmentEntries].sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0)),
    [developmentEntries],
  );

  const sameDayCount = useMemo(() => {
    const developmentDates = new Set(development.map((entry) => dateKey(entry.date)));
    return school.filter((entry) => developmentDates.has(dateKey(entry.date))).length;
  }, [development, school]);

  const attentionAlerts = school.filter((entry) => Number(entry.atencao) <= 2).length;
  const behaviorAlerts = school.filter((entry) => Number(entry.comportamento) <= 2).length;
  const regressionNotes = development.filter((entry) => entry.regression === "Sim — requer avaliação clínica").length;

  if (!localDraftsEnabled) {
    return (
      <Card
        className="border-amber-300 bg-amber-50/80 dark:border-amber-900/60 dark:bg-amber-950/20"
        data-testid="clinical-school-correlation-live-blocked"
      >
        <CardContent className="flex items-start gap-3 p-5 text-sm leading-6 text-amber-950 dark:text-amber-100">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-semibold">Correlação com rascunhos locais desativada em LIVE.</p>
            <p className="mt-1">
              A sessão remota não lê históricos clínicos armazenados apenas neste dispositivo. A correlação deve usar dados tenant-aware vinculados ao paciente quando esse fluxo estiver disponível.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!ready) {
    return (
      <Card role="status" aria-live="polite">
        <CardContent className="p-5 text-sm text-muted-foreground">Lendo rascunhos locais protegidos para preparar o resumo descritivo…</CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-sky-200/80 dark:border-sky-900/50" data-testid="clinical-school-correlation">
      <CardHeader className="gap-3 pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base"><Activity className="h-4 w-4 text-sky-600" /> Relação clínica–escola</CardTitle>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
              Resumo descritivo dos rascunhos locais já salvos. A coincidência de datas organiza a revisão; não prova relação causal entre eventos.
            </p>
          </div>
          <Button asChild variant="outline" size="sm" className="gap-2"><Link href="/diario-escola"><School className="h-4 w-4" /> Abrir diário escolar</Link></Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl bg-sky-50 p-3 dark:bg-sky-950/30"><p className="text-xs text-muted-foreground">Observações escolares</p><p className="mt-1 text-2xl font-bold">{school.length}</p></div>
          <div className="rounded-xl bg-cyan-50 p-3 dark:bg-cyan-950/30"><p className="text-xs text-muted-foreground">Registros de desenvolvimento</p><p className="mt-1 text-2xl font-bold">{development.length}</p></div>
          <div className="rounded-xl bg-violet-50 p-3 dark:bg-violet-950/30"><p className="text-xs text-muted-foreground">Mesma data</p><p className="mt-1 text-2xl font-bold">{sameDayCount}</p></div>
          <div className="rounded-xl bg-amber-50 p-3 dark:bg-amber-950/30"><p className="text-xs text-muted-foreground">Pontos para revisar</p><p className="mt-1 text-2xl font-bold">{attentionAlerts + behaviorAlerts + regressionNotes}</p></div>
        </div>

        {school.length === 0 && development.length === 0 ? (
          <div className="rounded-xl border border-dashed p-4 text-sm leading-6 text-muted-foreground">
            Ainda não há rascunhos locais suficientes para relacionar. Comece pelo diário escolar ou pela linha do tempo do desenvolvimento.
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border p-4">
              <div className="mb-3 flex items-center justify-between gap-2"><h3 className="text-sm font-semibold">Últimas observações escolares</h3><Badge variant="outline">{school.length}</Badge></div>
              {school.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma observação escolar registrada.</p> : (
                <div className="space-y-3">
                  {school.slice(0, 3).map((entry) => (
                    <div key={entry.id} className="rounded-lg bg-muted/40 p-3 text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2"><span className="font-semibold">{dateLabel(entry.date)}</span><span className="text-xs text-muted-foreground">Atenção {scoreLabel(entry.atencao)} · comportamento {scoreLabel(entry.comportamento)}</span></div>
                      <p className="mt-1 text-muted-foreground">{entry.humor ? `Humor: ${entry.humor}. ` : ""}{entry.ocorrencias || entry.notes || "Sem descrição textual."}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="rounded-xl border p-4">
              <div className="mb-3 flex items-center justify-between gap-2"><h3 className="text-sm font-semibold">Últimas observações do desenvolvimento</h3><Badge variant="outline">{development.length}</Badge></div>
              {development.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma observação do desenvolvimento registrada.</p> : (
                <div className="space-y-3">
                  {development.slice(0, 3).map((entry) => (
                    <div key={entry.id} className="rounded-lg bg-muted/40 p-3 text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2"><span className="font-semibold">{dateLabel(entry.date)}</span><span className="text-xs text-muted-foreground">{entry.context || "Contexto não informado"} · {entry.ageMonths || "—"} meses</span></div>
                      <p className="mt-1 text-muted-foreground">{entry.language || entry.motor || entry.social || entry.notes || "Sem descrição textual."}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-sm leading-6 text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-100">
          <p className="font-semibold">Como interpretar este painel</p>
          <p className="mt-1">Ele mostra coocorrência de registros, não “conclusões” automáticas. Antes de qualquer decisão, revise antecedente, contexto, sono, medicações, intervenções escolares, qualidade do relato e evolução temporal.</p>
          {(attentionAlerts > 0 || behaviorAlerts > 0 || regressionNotes > 0) && <p className="mt-2">Há {attentionAlerts + behaviorAlerts + regressionNotes} ponto(s) marcado(s) para revisão clínica: {attentionAlerts} de atenção, {behaviorAlerts} de comportamento e {regressionNotes} de perda de habilidade relatada.</p>}
        </div>
      </CardContent>
    </Card>
  );
}

export default function NeuropedAcompanhamentoPage() {
  const { accessMode, isAuthenticated } = useAuth();
  const isRemoteClinical = accessMode === "remote" && isAuthenticated;

  return (
    <div className="space-y-7 pb-12" data-testid="neuroacompanhamento-page">
      <header className="relative overflow-hidden rounded-3xl border border-sky-200/70 bg-gradient-to-br from-sky-50 via-background to-cyan-50 p-6 shadow-sm dark:border-sky-900/50 dark:from-sky-950/30 dark:via-background dark:to-cyan-950/20 md:p-8">
        <div className="absolute -right-16 -top-20 h-52 w-52 rounded-full bg-sky-200/30 blur-3xl dark:bg-sky-700/10" />
        <div className="relative max-w-3xl space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-sky-600 text-white hover:bg-sky-600">Neuroped · versão brasileira</Badge>
            <Badge variant="outline" className="border-sky-300 text-sky-800 dark:border-sky-800 dark:text-sky-200">Acompanhamento longitudinal</Badge>
            {isRemoteClinical && <Badge variant="outline" className="border-amber-400 text-amber-800 dark:border-amber-700 dark:text-amber-200">LIVE · sem prontuário local paralelo</Badge>}
          </div>
          <div className="flex items-start gap-4">
            <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-600 text-white shadow-sm sm:flex">
              <Brain className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">NeuroAcompanhamento</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
                {isRemoteClinical
                  ? "Centro de controle clínico com persistência local de diários bloqueada durante a sessão LIVE."
                  : "Um centro de controle para registrar desenvolvimento, crises e evolução clínica com linguagem brasileira, rascunhos locais protegidos e próximos passos claros."}
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
            {isRemoteClinical && (
              <p className="font-medium">
                Em LIVE, diários locais são bloqueados para evitar divergência entre o dispositivo e o prontuário tenant-aware.
              </p>
            )}
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

      <ClinicalSchoolCorrelation localDraftsEnabled={!isRemoteClinical} />

      <section className="space-y-4" aria-labelledby="development-title">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-700 dark:text-sky-300">Módulo próprio</p>
            <h2 id="development-title" className="mt-1 text-xl font-bold text-foreground">Linha do tempo brasileira do desenvolvimento</h2>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
              {isRemoteClinical
                ? "No modo LIVE, a persistência local deste diário permanece bloqueada até existir um fluxo tenant-aware próprio. Nenhum dado local é lido, apagado ou migrado automaticamente."
                : "Rascunho longitudinal protegido neste dispositivo. Use uma entrada por observação relevante e leve o histórico exportado para a consulta quando necessário."}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {isRemoteClinical ? <ShieldAlert className="h-4 w-4 text-amber-600" aria-hidden="true" /> : <ShieldCheck className="h-4 w-4 text-emerald-600" aria-hidden="true" />}
            {isRemoteClinical ? "Persistência local desativada" : "Cofre local cifrado · rascunho"}
          </div>
        </div>
        <DiarioClinico config={developmentConfig} />
      </section>

      <section className="grid gap-4 md:grid-cols-3" aria-label="Próximos passos">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Separação de dados</CardTitle></CardHeader>
          <CardContent className="text-sm leading-6 text-muted-foreground">
            {isRemoteClinical
              ? "A sessão LIVE não lê nem cria diários clínicos no cofre local; dados persistidos devem seguir os fluxos tenant-aware."
              : "Os diários são rascunhos locais cifrados, restritos a este dispositivo, e não equivalem ao prontuário LIVE."}
          </CardContent>
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