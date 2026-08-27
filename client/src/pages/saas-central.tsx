import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BarChart3,
  Bell,
  Building2,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardPenLine,
  Code2,
  CreditCard,
  Database,
  FileCheck,
  GraduationCap,
  KeyRound,
  Library,
  ListChecks,
  MessageSquare,
  Network,
  Palette,
  Rocket,
  Save,
  ShieldCheck,
  Sparkles,
  UsersRound,
  Waypoints,
  Workflow,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

const STORAGE_KEY = "neuroped:saas-console-v1";

type ModuleId =
  | "workspace"
  | "entitlements"
  | "onboarding"
  | "access"
  | "white-label"
  | "observability"
  | "continuity"
  | "privacy"
  | "messaging"
  | "documents"
  | "reminders"
  | "intake"
  | "network"
  | "school-family"
  | "tasks"
  | "analytics"
  | "catalog"
  | "playbooks"
  | "interoperability"
  | "developer";

type ModuleStatus = "fundação" | "piloto" | "escala";

type SaaSModule = {
  id: ModuleId;
  number: string;
  shortLabel: string;
  title: string;
  eyebrow: string;
  description: string;
  boundary: string;
  category: string;
  status: ModuleStatus;
  icon: LucideIcon;
  metric: string;
  metricLabel: string;
};

type ModuleState = {
  enabled: boolean;
  completed: number;
  lastAction: string;
};

type ConsoleState = {
  activeModule: ModuleId;
  organizationName: string;
  pilotMode: boolean;
  moduleStates: Record<ModuleId, ModuleState>;
  workspaceNote: string;
};

const modules: SaaSModule[] = [
  {
    id: "workspace",
    number: "01",
    shortLabel: "Workspace",
    title: "Workspace multi-tenant",
    eyebrow: "Fundação · isolamento",
    description: "Organize clínicas, unidades e configurações em um contexto de tenant explícito.",
    boundary: "Não implementa prontuário, agenda, escalas ou decisões clínicas.",
    category: "Fundação",
    status: "fundação",
    icon: Building2,
    metric: "1",
    metricLabel: "workspace piloto",
  },
  {
    id: "entitlements",
    number: "02",
    shortLabel: "Planos",
    title: "Planos e entitlements",
    eyebrow: "Fundação · monetização",
    description: "Modele planos, quotas e consumo sem misturar autorização com cobrança.",
    boundary: "Não processa cartão, gateway, nota fiscal ou conciliação financeira.",
    category: "Fundação",
    status: "fundação",
    icon: CreditCard,
    metric: "3",
    metricLabel: "planos desenhados",
  },
  {
    id: "onboarding",
    number: "03",
    shortLabel: "Onboarding",
    title: "Onboarding e migração",
    eyebrow: "Fundação · ativação",
    description: "Leve uma nova clínica do convite ao primeiro uso com checklist e importação validada.",
    boundary: "Não cria prontuário paralelo, agenda nova ou conduta clínica.",
    category: "Fundação",
    status: "piloto",
    icon: Rocket,
    metric: "6",
    metricLabel: "etapas de go-live",
  },
  {
    id: "access",
    number: "04",
    shortLabel: "Acessos",
    title: "Equipe e políticas de acesso",
    eyebrow: "Fundação · segurança",
    description: "Controle membros, unidades, relações e privilégios com menor acesso necessário.",
    boundary: "Não substitui a autenticação existente nem cadastra pacientes.",
    category: "Fundação",
    status: "fundação",
    icon: UsersRound,
    metric: "4",
    metricLabel: "papéis atuais",
  },
  {
    id: "white-label",
    number: "05",
    shortLabel: "Marca branca",
    title: "Marca branca e domínio",
    eyebrow: "Escala · identidade",
    description: "Personalize a presença comercial de cada clínica sem apagar a autoria NeuroPed.",
    boundary: "Não altera conteúdo clínico, prontuário, assinatura ou agenda.",
    category: "Escala",
    status: "escala",
    icon: Palette,
    metric: "1",
    metricLabel: "tema configurável",
  },
  {
    id: "observability",
    number: "06",
    shortLabel: "SLA",
    title: "Observabilidade e SLA",
    eyebrow: "Fundação · operação",
    description: "Meça latência, erros, disponibilidade e incidentes por tenant sem logar conteúdo clínico.",
    boundary: "Não é auditoria clínica nem painel de dados identificáveis.",
    category: "Fundação",
    status: "fundação",
    icon: Activity,
    metric: "99,9%",
    metricLabel: "meta de disponibilidade",
  },
  {
    id: "continuity",
    number: "07",
    shortLabel: "Continuidade",
    title: "Backup e continuidade",
    eyebrow: "Fundação · resiliência",
    description: "Prove backup, restore, RPO, RTO e exportação de emergência por organização.",
    boundary: "Não substitui o histórico append-only nem versiona documento individual.",
    category: "Fundação",
    status: "fundação",
    icon: Database,
    metric: "4h",
    metricLabel: "RPO de referência",
  },
  {
    id: "privacy",
    number: "08",
    shortLabel: "LGPD",
    title: "Governança LGPD e direitos",
    eyebrow: "Piloto · privacidade",
    description: "Opere consentimentos, solicitações de titulares, retenção e evidências por tenant.",
    boundary: "Não presta parecer jurídico nem toma decisão clínica.",
    category: "Piloto",
    status: "piloto",
    icon: ShieldCheck,
    metric: "5",
    metricLabel: "direitos operáveis",
  },
  {
    id: "messaging",
    number: "09",
    shortLabel: "Mensageria",
    title: "Mensageria segura",
    eyebrow: "Piloto · relacionamento",
    description: "Entregue comunicações transacionais com consentimento, templates e trilha auditável.",
    boundary: "Não cria laudos, diagnósticos ou calendário de consultas.",
    category: "Piloto",
    status: "piloto",
    icon: MessageSquare,
    metric: "4",
    metricLabel: "canais planejados",
  },
  {
    id: "documents",
    number: "10",
    shortLabel: "Documentos",
    title: "Fluxo de documentos e ciência",
    eyebrow: "Piloto · entrega",
    description: "Orquestre solicitação, revisão, entrega, ciência e vencimento dos documentos existentes.",
    boundary: "Não recria PDF, assinatura digital ou prontuário.",
    category: "Piloto",
    status: "piloto",
    icon: FileCheck,
    metric: "6",
    metricLabel: "estados de fluxo",
  },
  {
    id: "reminders",
    number: "11",
    shortLabel: "Lembretes",
    title: "Lembretes e faltas",
    eyebrow: "Piloto · agenda",
    description: "Reduza no-show e recupere faltas consultando a disponibilidade real da agenda.",
    boundary: "Não substitui a agenda nem reserva horário fora do contrato existente.",
    category: "Piloto",
    status: "piloto",
    icon: Bell,
    metric: "3",
    metricLabel: "réguas iniciais",
  },
  {
    id: "intake",
    number: "12",
    shortLabel: "Intake",
    title: "Intake pré-consulta",
    eyebrow: "Piloto · preparação",
    description: "Colete dados mínimos e anexos antes da consulta para revisão do profissional.",
    boundary: "Não faz triagem, diagnóstico, prescrição ou agendamento direto.",
    category: "Piloto",
    status: "piloto",
    icon: ClipboardPenLine,
    metric: "8",
    metricLabel: "campos mínimos",
  },
  {
    id: "network",
    number: "13",
    shortLabel: "Rede",
    title: "Rede multiprofissional",
    eyebrow: "Escala · colaboração",
    description: "Facilite encaminhamentos e compartilhamentos consentidos, revogáveis e temporários.",
    boundary: "Não libera prontuário completo nem presta o atendimento de terceiros.",
    category: "Escala",
    status: "escala",
    icon: Network,
    metric: "2",
    metricLabel: "níveis de compartilhamento",
  },
  {
    id: "school-family",
    number: "14",
    shortLabel: "Escola-família",
    title: "Portal escola-família",
    eyebrow: "Escala · contexto",
    description: "Capture observações educacionais em uma visão segregada e consentida.",
    boundary: "Não expõe prontuário, laudo, receita ou decisão clínica.",
    category: "Escala",
    status: "escala",
    icon: GraduationCap,
    metric: "3",
    metricLabel: "visões segregadas",
  },
  {
    id: "tasks",
    number: "15",
    shortLabel: "Tarefas",
    title: "Coordenação de planos",
    eyebrow: "Piloto · execução",
    description: "Transforme planos já registrados em tarefas, responsáveis, prazos e pendências.",
    boundary: "Não define conduta clínica nem cria plano terapêutico autônomo.",
    category: "Piloto",
    status: "piloto",
    icon: ListChecks,
    metric: "12",
    metricLabel: "tarefas no piloto",
  },
  {
    id: "analytics",
    number: "16",
    shortLabel: "Analytics",
    title: "Desfechos e qualidade",
    eyebrow: "Piloto · gestão",
    description: "Meça processos e coortes agregadas com desidentificação e revisão humana.",
    boundary: "Não diagnostica, prescreve ou substitui a avaliação profissional.",
    category: "Piloto",
    status: "piloto",
    icon: BarChart3,
    metric: "8",
    metricLabel: "indicadores de gestão",
  },
  {
    id: "catalog",
    number: "17",
    shortLabel: "Catálogo",
    title: "Governança do catálogo",
    eyebrow: "Escala · editorial",
    description: "Versione fontes, licenças, traduções e aprovações dos instrumentos.",
    boundary: "Não aplica escalas, calcula scores nem guarda respostas individuais.",
    category: "Escala",
    status: "escala",
    icon: Library,
    metric: "253",
    metricLabel: "instrumentos no núcleo",
  },
  {
    id: "playbooks",
    number: "18",
    shortLabel: "Playbooks",
    title: "Templates e playbooks",
    eyebrow: "Escala · padronização",
    description: "Padronize fluxos locais, formulários e checklists sem alterar a fonte clínica.",
    boundary: "Não armazena dado clínico nem cria lógica clínica paralela.",
    category: "Escala",
    status: "escala",
    icon: Workflow,
    metric: "5",
    metricLabel: "playbooks iniciais",
  },
  {
    id: "interoperability",
    number: "19",
    shortLabel: "FHIR / CSV",
    title: "Interoperabilidade",
    eyebrow: "Escala · integração",
    description: "Transporte dados estruturados com mapeamento, consentimento e rastreabilidade.",
    boundary: "Não vira prontuário externo nem cria decisão clínica a partir do transporte.",
    category: "Escala",
    status: "escala",
    icon: Waypoints,
    metric: "6",
    metricLabel: "recursos mapeáveis",
  },
  {
    id: "developer",
    number: "20",
    shortLabel: "Developer API",
    title: "API, webhooks e portal",
    eyebrow: "Escala · ecossistema",
    description: "Ofereça integrações B2B com scopes, sandbox, quotas, assinaturas e revogação.",
    boundary: "Não expõe lógica clínica autônoma nem acesso irrestrito ao prontuário.",
    category: "Escala",
    status: "escala",
    icon: Code2,
    metric: "7",
    metricLabel: "controles de integração",
  },
];

const moduleById = Object.fromEntries(modules.map((module) => [module.id, module])) as Record<ModuleId, SaaSModule>;

function createInitialModuleStates(): Record<ModuleId, ModuleState> {
  return Object.fromEntries(
    modules.map((module) => [
      module.id,
      {
        enabled: module.status !== "escala",
        completed: module.status === "fundação" ? 2 : module.status === "piloto" ? 1 : 0,
        lastAction: "Ainda não configurado",
      },
    ]),
  ) as Record<ModuleId, ModuleState>;
}

function createInitialState(): ConsoleState {
  return {
    activeModule: "workspace",
    organizationName: "Clínica piloto NeuroPed",
    pilotMode: true,
    moduleStates: createInitialModuleStates(),
    workspaceNote: "Ambiente de demonstração sem dados clínicos identificáveis.",
  };
}

function loadState(): ConsoleState {
  if (typeof window === "undefined") return createInitialState();
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return createInitialState();
    const parsed = JSON.parse(saved) as Partial<ConsoleState>;
    return {
      ...createInitialState(),
      ...parsed,
      moduleStates: { ...createInitialModuleStates(), ...(parsed.moduleStates ?? {}) },
    };
  } catch {
    return createInitialState();
  }
}

function StatusBadge({ status }: { status: ModuleStatus }) {
  const label = status === "fundação" ? "Fundação" : status === "piloto" ? "Piloto" : "Escala";
  return <Badge variant={status === "fundação" ? "default" : "outline"}>{label}</Badge>;
}

function FieldLabel({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
      {children}
    </label>
  );
}

function ModuleMetric({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "success" | "warning" }) {
  return (
    <div className="rounded-2xl border bg-card/80 p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className={`mt-1 text-xl font-bold ${tone === "success" ? "text-emerald-700 dark:text-emerald-300" : tone === "warning" ? "text-amber-700 dark:text-amber-300" : "text-foreground"}`}>
        {value}
      </p>
    </div>
  );
}

function ActionCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <Card className="border-border/75 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription className="text-xs leading-5">{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full border bg-muted/45 px-2.5 py-1 text-xs font-medium text-muted-foreground">{children}</span>;
}

export default function SaasCentralPage() {
  const [state, setState] = useState<ConsoleState>(loadState);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [messageTemplate, setMessageTemplate] = useState("Olá, {{responsavel}}. Temos uma atualização segura da clínica NeuroPed para você.");
  const [inviteEmail, setInviteEmail] = useState("");
  const [privacyEmail, setPrivacyEmail] = useState("");
  const [apiKeyCreated, setApiKeyCreated] = useState(false);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Preferências não sensíveis não devem interromper a operação da tela.
    }
  }, [state]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3_500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const active = moduleById[state.activeModule];
  const enabledCount = Object.values(state.moduleStates).filter((moduleState) => moduleState.enabled).length;
  const completedCount = Object.values(state.moduleStates).reduce((total, moduleState) => total + moduleState.completed, 0);
  const visibleModules = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return modules;
    return modules.filter((module) => `${module.title} ${module.shortLabel} ${module.category}`.toLowerCase().includes(query));
  }, [search]);

  const updateModule = (id: ModuleId, patch: Partial<ModuleState>) => {
    setState((current) => ({
      ...current,
      moduleStates: {
        ...current.moduleStates,
        [id]: { ...current.moduleStates[id], ...patch },
      },
    }));
  };

  const announce = (message: string) => setToast(message);

  const recordAction = (message: string, completed = 1) => {
    updateModule(state.activeModule, {
      completed: Math.max(state.moduleStates[state.activeModule].completed, completed),
      lastAction: message,
    });
    announce(message);
  };

  const exportAggregate = () => {
    const payload = {
      product: "NeuroPed OS",
      generatedAt: new Date().toISOString(),
      tenant: "tenant-demo",
      note: "Exportação agregada de demonstração; nenhum dado clínico identificável.",
      modules: modules.map((module) => ({ id: module.id, status: module.status, enabled: state.moduleStates[module.id].enabled })),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "neuroped-os-indicadores-agregados.json";
    anchor.click();
    URL.revokeObjectURL(url);
    recordAction("Exportação agregada preparada sem dados clínicos.", 3);
  };

  const renderWorkspace = () => {
    switch (active.id) {
      case "workspace":
        return (
          <div className="grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
            <ActionCard title="Identidade do workspace" description="Configuração local do tenant piloto. Não contém pacientes nem conteúdo clínico.">
              <div className="space-y-3">
                <FieldLabel htmlFor="workspace-name">Nome comercial</FieldLabel>
                <Input id="workspace-name" value={state.organizationName} onChange={(event) => setState((current) => ({ ...current, organizationName: event.target.value }))} />
                <FieldLabel htmlFor="workspace-note">Nota operacional</FieldLabel>
                <Textarea id="workspace-note" value={state.workspaceNote} onChange={(event) => setState((current) => ({ ...current, workspaceNote: event.target.value }))} />
                <Button className="gap-2" onClick={() => recordAction("Workspace piloto salvo com isolamento lógico.", 3)}><Save className="h-4 w-4" />Salvar workspace</Button>
              </div>
            </ActionCard>
            <ActionCard title="Guardas do tenant" description="Checklist visual para orientar a fundação multi-tenant antes do backend definitivo.">
              <div className="space-y-3 text-sm">
                {["Contexto derivado da sessão", "Prefixo de storage por tenant", "Deny-by-default", "Teste cross-tenant"].map((item, index) => (
                  <label key={item} className="flex items-center gap-3 rounded-xl border p-3">
                    <input type="checkbox" aria-label={item} defaultChecked={index < 2} className="h-4 w-4 accent-primary" />
                    <span>{item}</span>
                  </label>
                ))}
              </div>
            </ActionCard>
          </div>
        );
      case "entitlements":
        return (
          <ActionCard title="Catálogo de planos" description="Os limites abaixo são uma configuração de demonstração e não processam cobranças.">
            <div className="grid gap-3 md:grid-cols-3">
              {["Essencial", "Clínica", "Rede"].map((plan, index) => (
                <button key={plan} type="button" onClick={() => recordAction(`Plano ${plan} selecionado para simulação.`, 2)} className="rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-sm">
                  <div className="flex items-center justify-between"><span className="font-semibold">{plan}</span><Badge variant={index === 1 ? "default" : "outline"}>{index === 0 ? "Piloto" : index === 1 ? "Recomendado" : "Rede"}</Badge></div>
                  <p className="mt-3 text-2xl font-bold">{index === 0 ? "5" : index === 1 ? "25" : "100"}</p>
                  <p className="text-xs text-muted-foreground">profissionais incluídos</p>
                  <p className="mt-3 text-xs text-muted-foreground">Storage, mensagens e integrações por quota.</p>
                </button>
              ))}
            </div>
          </ActionCard>
        );
      case "onboarding":
        return (
          <ActionCard title="Checklist de go-live" description="Cada etapa é reversível e deve ser concluída antes de importar dados reais.">
            <div className="space-y-2">
              {["Confirmar organização e unidade", "Convidar equipe nominal", "Validar domínio e remetente", "Testar backup e restore", "Revisar consentimentos", "Executar smoke de produção"].map((item, index) => (
                <button key={item} type="button" onClick={() => recordAction(`Etapa registrada: ${item}.`, Math.min(6, index + 1))} className="flex w-full items-center gap-3 rounded-xl border p-3 text-left transition hover:bg-muted/35"><span className={`flex h-6 w-6 items-center justify-center rounded-full ${index < 2 ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}`}>{index < 2 ? <Check className="h-3.5 w-3.5" /> : index + 1}</span><span className="text-sm">{item}</span><ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" /></button>
              ))}
            </div>
          </ActionCard>
        );
      case "access":
        return (
          <ActionCard title="Matriz de acesso" description="A tabela é somente administrativa; decisões clínicas continuam no núcleo protegido.">
            <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-left text-sm"><thead><tr className="border-b text-xs uppercase tracking-wide text-muted-foreground"><th className="pb-3">Perfil</th><th className="pb-3">Workspace</th><th className="pb-3">Pacientes</th><th className="pb-3">Documentos</th><th className="pb-3">Admin</th></tr></thead><tbody>{[["Admin", "Total", "Escopo", "Total", "Sim"], ["Profissional", "Leitura", "Vínculo", "Vínculo", "Não"], ["Operador", "Leitura", "Agenda", "Fluxo", "Não"], ["Reader", "Leitura", "Somente leitura", "Não", "Não"]].map((row) => <tr key={row[0]} className="border-b last:border-0"><td className="py-3 font-semibold">{row[0]}</td>{row.slice(1).map((cell) => <td key={cell} className="py-3 text-muted-foreground">{cell}</td>)}</tr>)}</tbody></table></div>
            <Button className="mt-4 gap-2" variant="outline" onClick={() => recordAction("Revisão de privilégios registrada.", 3)}><ShieldCheck className="h-4 w-4" />Registrar revisão</Button>
          </ActionCard>
        );
      case "white-label":
        return (
          <ActionCard title="Identidade da clínica" description="A autoria NeuroPed permanece visível e o tema usa variáveis seguras, sem HTML arbitrário.">
            <div className="grid gap-4 sm:grid-cols-2"><div><FieldLabel htmlFor="brand-name">Nome exibido</FieldLabel><Input id="brand-name" defaultValue={state.organizationName} /></div><div><FieldLabel htmlFor="brand-domain">Domínio customizado</FieldLabel><Input id="brand-domain" placeholder="portal.suaclinica.com.br" /></div></div>
            <div className="mt-4 flex items-center gap-3 rounded-2xl border bg-muted/20 p-4"><div className="h-10 w-10 rounded-xl bg-primary" /><div><p className="font-semibold">Prévia do portal</p><p className="text-xs text-muted-foreground">Powered by NeuroPed · identidade da clínica</p></div></div>
            <Button className="mt-4 gap-2" onClick={() => recordAction("Tema salvo em modo de demonstração.", 2)}><Palette className="h-4 w-4" />Salvar tema</Button>
          </ActionCard>
        );
      case "observability":
        return (
          <ActionCard title="Painel operacional" description="Indicadores sem PII: latência, disponibilidade e erro por serviço.">
            <div className="grid gap-3 sm:grid-cols-3"><ModuleMetric label="Disponibilidade" value="99,94%" tone="success" /><ModuleMetric label="Latência p95" value="420 ms" /><ModuleMetric label="Incidentes" value="0" tone="success" /></div>
            <div className="mt-4 flex flex-wrap gap-2"><Pill>API saudável</Pill><Pill>Storage saudável</Pill><Pill>Agenda em observação</Pill></div>
            <Button className="mt-4 gap-2" variant="outline" onClick={() => recordAction("Incidente sintético resolvido e auditado.", 3)}><Activity className="h-4 w-4" />Simular health check</Button>
          </ActionCard>
        );
      case "continuity":
        return (
          <ActionCard title="Política de continuidade" description="A demonstração registra intenção operacional; o backup real deve ser conectado ao provedor aprovado.">
            <div className="grid gap-4 sm:grid-cols-2"><div><FieldLabel htmlFor="backup-frequency">Frequência</FieldLabel><select id="backup-frequency" className="mt-2 h-10 w-full rounded-xl border bg-background px-3 text-sm"><option>A cada 4 horas</option><option>Diário</option><option>Semanal</option></select></div><div><FieldLabel htmlFor="backup-retention">Retenção</FieldLabel><select id="backup-retention" className="mt-2 h-10 w-full rounded-xl border bg-background px-3 text-sm"><option>90 dias</option><option>1 ano</option><option>Política permanente</option></select></div></div>
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-sm text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-100"><p className="font-semibold">Último teste de restore</p><p className="mt-1 text-xs opacity-80">Simulado · integridade prevista · sem dados clínicos nesta tela</p></div>
            <Button className="mt-4 gap-2" onClick={() => recordAction("Teste de restore agendado para staging.", 3)}><Database className="h-4 w-4" />Agendar teste</Button>
          </ActionCard>
        );
      case "privacy":
        return (
          <ActionCard title="Fila de direitos do titular" description="Use dados mínimos. A execução real deve passar pelo módulo LGPD e por revisão autorizada.">
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]"><Input aria-label="E-mail do titular" value={privacyEmail} onChange={(event) => setPrivacyEmail(event.target.value)} placeholder="titular@exemplo.com" type="email" /><Button onClick={() => { setPrivacyEmail(""); recordAction("Solicitação de acesso registrada para revisão.", 2); }}>Registrar solicitação</Button></div>
            <div className="mt-4 space-y-2 text-sm"><div className="flex items-center justify-between rounded-xl border p-3"><span>Acesso aos dados</span><Badge variant="outline">Em revisão</Badge></div><div className="flex items-center justify-between rounded-xl border p-3"><span>Correção</span><Badge variant="outline">Disponível</Badge></div><div className="flex items-center justify-between rounded-xl border p-3"><span>Revogação</span><Badge variant="outline">Disponível</Badge></div></div>
          </ActionCard>
        );
      case "messaging":
        return (
          <ActionCard title="Template transacional" description="Mensagens externas devem ser neutras, consentidas e livres de texto clínico sensível.">
            <FieldLabel htmlFor="message-template">Mensagem</FieldLabel><Textarea id="message-template" value={messageTemplate} onChange={(event) => setMessageTemplate(event.target.value)} className="mt-2 min-h-28" /><div className="mt-3 flex flex-wrap gap-2"><Pill>opt-in obrigatório</Pill><Pill>redaction</Pill><Pill>retry idempotente</Pill></div><Button className="mt-4 gap-2" onClick={() => recordAction("Template transacional salvo sem conteúdo clínico.", 2)}><MessageSquare className="h-4 w-4" />Salvar template</Button>
          </ActionCard>
        );
      case "documents":
        return (
          <ActionCard title="Fluxo de ciência" description="Orquestre documentos existentes; não gere ou sobrescreva PDFs nesta área.">
            <div className="grid gap-2 sm:grid-cols-5">{["Solicitado", "Em revisão", "Liberado", "Entregue", "Ciente"].map((status, index) => <button key={status} type="button" onClick={() => recordAction(`Fluxo documental avançou para ${status}.`, index + 1)} className={`rounded-xl border p-3 text-left text-xs font-semibold ${index === 0 ? "border-primary/50 bg-primary/5" : ""}`}><span className="text-muted-foreground">0{index + 1}</span><span className="mt-2 block">{status}</span></button>)}</div><p className="mt-4 text-xs text-muted-foreground">Toda entrega deve usar URL assinada, prazo de expiração e auditoria do destinatário.</p>
          </ActionCard>
        );
      case "reminders":
        return (
          <ActionCard title="Régua de lembretes" description="A régua consulta a agenda canônica e respeita consentimento, fuso e horário silencioso.">
            <div className="space-y-3">{["48 horas antes", "24 horas antes", "Recuperação de falta"].map((item, index) => <label key={item} className="flex items-center justify-between rounded-xl border p-3"><span className="text-sm font-medium">{item}</span><input type="checkbox" aria-label={item} defaultChecked={index < 2} className="h-4 w-4 accent-primary" /></label>)}</div><Button className="mt-4 gap-2" onClick={() => recordAction("Régua simulada sem envio externo.", 2)}><Bell className="h-4 w-4" />Simular régua</Button>
          </ActionCard>
        );
      case "intake":
        return (
          <ActionCard title="Formulário de pré-consulta" description="Rascunhos aguardam revisão profissional antes de qualquer gravação clínica.">
            <div className="flex flex-wrap gap-2"><Pill>Queixa principal</Pill><Pill>Histórico básico</Pill><Pill>Contato</Pill><Pill>Anexos</Pill><Pill>Consentimento</Pill></div><div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-xs leading-5 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-100">Links de intake devem expirar, não enumerar pacientes e não expor o prontuário completo.</div><Button className="mt-4 gap-2" onClick={() => recordAction("Formulário pré-consulta criado em modo de revisão.", 2)}><ClipboardPenLine className="h-4 w-4" />Criar formulário</Button>
          </ActionCard>
        );
      case "network":
        return (
          <ActionCard title="Convite multiprofissional" description="O convite deve carregar somente escopo, finalidade, prazo e consentimento — nunca acesso herdado.">
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]"><Input aria-label="E-mail do profissional" value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} placeholder="profissional@rede.com" type="email" /><Button onClick={() => { setInviteEmail(""); recordAction("Convite criado com acesso temporal.", 2); }}>Criar convite</Button></div><div className="mt-4 flex flex-wrap gap-2"><Pill>Somente resumo</Pill><Pill>Documentos selecionados</Pill><Pill>Expiração obrigatória</Pill></div>
          </ActionCard>
        );
      case "school-family":
        return (
          <ActionCard title="Consentimento escola-família" description="A escola recebe uma visão mínima; o prontuário e a decisão clínica permanecem protegidos.">
            <div className="grid gap-3 sm:grid-cols-2"><div><FieldLabel htmlFor="school-name">Instituição</FieldLabel><Input id="school-name" placeholder="Escola parceira" /></div><div><FieldLabel htmlFor="school-scope">Escopo</FieldLabel><select id="school-scope" className="mt-2 h-10 w-full rounded-xl border bg-background px-3 text-sm"><option>Observações educacionais</option><option>Rotina e participação</option><option>Comunicação com família</option></select></div></div><Button className="mt-4 gap-2" onClick={() => recordAction("Pedido de consentimento escola-família criado.", 2)}><GraduationCap className="h-4 w-4" />Solicitar consentimento</Button>
          </ActionCard>
        );
      case "tasks":
        return (
          <ActionCard title="Pendências da equipe" description="Tarefas executam planos já definidos; não criam conduta clínica autônoma.">
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]"><Input aria-label="Título da tarefa" value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} placeholder="Ex.: revisar documento recebido" /><Button onClick={() => { setTaskTitle(""); recordAction("Tarefa operacional adicionada ao quadro.", 2); }}>Adicionar tarefa</Button></div><div className="mt-4 space-y-2"><div className="flex items-center gap-3 rounded-xl border p-3 text-sm"><span className="h-2 w-2 rounded-full bg-amber-500" />Revisar pendências do intake<span className="ml-auto text-xs text-muted-foreground">Hoje</span></div><div className="flex items-center gap-3 rounded-xl border p-3 text-sm"><span className="h-2 w-2 rounded-full bg-emerald-500" />Confirmar recebimento de documento<span className="ml-auto text-xs text-muted-foreground">Amanhã</span></div></div>
          </ActionCard>
        );
      case "analytics":
        return (
          <ActionCard title="Indicadores agregados" description="Amostras demonstrativas; analytics real deve aplicar limiar de coorte, desidentificação e revisão humana.">
            <div className="grid gap-3 sm:grid-cols-3"><ModuleMetric label="Follow-up no prazo" value="78%" tone="success" /><ModuleMetric label="Intakes concluídos" value="64%" /><ModuleMetric label="Coorte mínima" value="10" /></div><Button className="mt-4 gap-2" variant="outline" onClick={exportAggregate}><BarChart3 className="h-4 w-4" />Exportar agregado</Button>
          </ActionCard>
        );
      case "catalog":
        return (
          <ActionCard title="Fila editorial" description="Metadados, fontes e licenças pertencem à governança; aplicação e score continuam no núcleo.">
            <div className="space-y-2">{[["M-CHAT-R/F", "Aprovado"], ["CARS", "Revisão editorial"], ["Vanderbilt", "Aprovado"]].map(([name, status]) => <div key={name} className="flex items-center justify-between rounded-xl border p-3 text-sm"><span className="font-medium">{name}</span><Badge variant={status === "Aprovado" ? "default" : "outline"}>{status}</Badge></div>)}</div><Button className="mt-4 gap-2" onClick={() => recordAction("Revisão editorial registrada sem alterar instrumento.", 2)}><Library className="h-4 w-4" />Abrir revisão</Button>
          </ActionCard>
        );
      case "playbooks":
        return (
          <ActionCard title="Biblioteca de playbooks" description="Modelos estruturais são versionados; o preenchimento acontece nos módulos canônicos.">
            <div className="grid gap-3 md:grid-cols-3">{["Primeiro atendimento", "Retorno", "Entrega documental"].map((name) => <button key={name} type="button" onClick={() => recordAction(`Playbook ${name} selecionado.`, 2)} className="rounded-2xl border p-4 text-left hover:border-primary/50"><Workflow className="h-5 w-5 text-primary" /><p className="mt-3 font-semibold">{name}</p><p className="mt-1 text-xs text-muted-foreground">Versão 0.1 · revisão necessária</p></button>)}</div>
          </ActionCard>
        );
      case "interoperability":
        return (
          <ActionCard title="Mapa de interoperabilidade" description="O transporte precisa de consentimento, validação de schema, provenance e relatório de rejeições.">
            <div className="grid gap-2 sm:grid-cols-3">{["Patient", "Observation", "CarePlan"].map((resource) => <div key={resource} className="rounded-xl border p-3"><p className="font-semibold">FHIR {resource}</p><p className="mt-1 text-xs text-muted-foreground">Mapeamento em revisão</p></div>)}</div><div className="mt-4 flex flex-wrap gap-2"><Pill>FHIR R4</Pill><Pill>CSV validado</Pill><Pill>Consentimento</Pill><Pill>Checksum</Pill></div><Button className="mt-4 gap-2" onClick={() => recordAction("Mapa de campos salvo para sandbox.", 2)}><Waypoints className="h-4 w-4" />Salvar mapeamento</Button>
          </ActionCard>
        );
      case "developer":
        return (
          <ActionCard title="Developer portal" description="A chave abaixo é apenas de sandbox. Produção exige KMS, scopes, quotas e rotação.">
            <div className="rounded-2xl border bg-muted/20 p-4"><div className="flex items-center gap-3"><KeyRound className="h-5 w-5 text-primary" /><div><p className="font-semibold">Credencial de sandbox</p><p className="text-xs text-muted-foreground">Sem acesso a dados clínicos identificáveis</p></div></div>{apiKeyCreated && <code className="mt-4 block break-all rounded-xl bg-background p-3 text-xs">np_sandbox_demo_7b3c_••••••••••••</code>}</div><Button className="mt-4 gap-2" onClick={() => { setApiKeyCreated(true); recordAction("Chave de sandbox criada e auditada.", 2); }}><Code2 className="h-4 w-4" />{apiKeyCreated ? "Rotacionar chave" : "Gerar chave de sandbox"}</Button>
          </ActionCard>
        );
      default:
        return null;
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-6 px-4 py-6 sm:px-6 lg:px-8" data-testid="saas-console-page">
      <header className="relative overflow-hidden rounded-[2rem] border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-cyan-50/60 p-6 shadow-sm dark:to-cyan-950/20 md:p-8">
        <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-4xl">
            <div className="mb-3 flex flex-wrap items-center gap-2"><Badge className="gap-1.5"><Sparkles className="h-3.5 w-3.5" />NeuroPed OS</Badge><Badge variant="outline">20 áreas em abas</Badge><Badge variant="outline">MVP seguro</Badge></div>
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Central SaaS complementar</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground md:text-base">Uma central administrativa para organizar as 20 expansões sem duplicar pacientes, escalas, Clinical Core, documentos, agenda, Conecta ou portais existentes.</p>
          </div>
          <div className="flex flex-wrap gap-2"><Button asChild variant="outline" className="gap-2"><Link href="/">Abrir núcleo NeuroPed<ChevronRight className="h-4 w-4" /></Link></Button><Button variant="outline" className="gap-2" onClick={() => { setState(createInitialState()); setApiKeyCreated(false); announce("Preferências da central restauradas."); }}><ShieldCheck className="h-4 w-4" />Restaurar demo</Button></div>
        </div>
      </header>

      <Card className="border-amber-200/70 bg-amber-50/60 dark:border-amber-900/50 dark:bg-amber-950/15"><CardContent className="flex gap-3 py-4 text-sm"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-300" /><p className="leading-6 text-amber-950 dark:text-amber-100"><strong>Escopo desta entrega:</strong> as 20 abas e seus fluxos de demonstração estão implementados sem gravar dados clínicos identificáveis. As integrações de produção devem entrar por APIs tenant-aware, feature flags, auditoria, consentimento e testes próprios de cada módulo.</p></CardContent></Card>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><ModuleMetric label="Abas disponíveis" value="20" /><ModuleMetric label="Módulos habilitados" value={`${enabledCount}/20`} tone="success" /><ModuleMetric label="Marcos registrados" value={`${completedCount}`} /><ModuleMetric label="Workspace" value={state.organizationName} /></div>

      <Tabs value={state.activeModule} onValueChange={(value) => setState((current) => ({ ...current, activeModule: value as ModuleId }))} orientation="vertical" className="grid gap-5 lg:grid-cols-[250px_minmax(0,1fr)]">
        <div className="space-y-3 lg:sticky lg:top-4 lg:self-start"><div className="rounded-2xl border bg-card p-3"><FieldLabel htmlFor="module-search">Filtrar abas</FieldLabel><Input id="module-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Ex.: acesso, agenda, API" className="mt-2" /></div><TabsList className="grid h-auto w-full grid-cols-2 gap-1.5 bg-muted/35 p-2 lg:grid-cols-1 lg:items-stretch lg:justify-start">{visibleModules.map((module) => <TabsTrigger key={module.id} value={module.id} className="justify-start gap-2 px-2.5 py-2 text-left text-xs data-[state=active]:bg-card"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-[10px] font-bold text-primary">{module.number}</span><span className="min-w-0 truncate">{module.shortLabel}</span></TabsTrigger>)}</TabsList>{visibleModules.length === 0 && <p className="rounded-xl border border-dashed p-3 text-xs text-muted-foreground">Nenhuma aba encontrada.</p>}</div>
        <TabsContent value={state.activeModule} className="mt-0 min-w-0">
          <div className="space-y-5">
            <div className="flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-sm md:flex-row md:items-start md:justify-between"><div className="flex gap-4"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"><active.icon className="h-6 w-6" /></div><div><div className="mb-2 flex flex-wrap items-center gap-2"><span className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Aba {active.number} · {active.eyebrow}</span><StatusBadge status={active.status} /></div><h2 className="text-2xl font-semibold tracking-tight">{active.title}</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{active.description}</p></div></div><label className="flex shrink-0 items-center gap-3 rounded-xl border px-3 py-2 text-xs font-semibold"><input type="checkbox" aria-label="Habilitar no piloto" checked={state.moduleStates[active.id].enabled} onChange={(event) => updateModule(active.id, { enabled: event.target.checked, lastAction: event.target.checked ? "Módulo habilitado no piloto" : "Módulo pausado" })} className="h-4 w-4 accent-primary" />Habilitar no piloto</label></div>
            <div className="grid gap-3 sm:grid-cols-3"><ModuleMetric label="Indicador do módulo" value={active.metric} /><ModuleMetric label="Unidade" value={active.metricLabel} /><ModuleMetric label="Última ação" value={state.moduleStates[active.id].lastAction} tone={state.moduleStates[active.id].lastAction === "Ainda não configurado" ? "warning" : "success"} /></div>
            {renderWorkspace()}
            <div className="rounded-2xl border border-dashed bg-muted/20 p-4 text-xs leading-5 text-muted-foreground"><strong className="text-foreground">Fronteira desta aba:</strong> {active.boundary} <span className="mx-1">·</span> <strong className="text-foreground">Fonte canônica:</strong> Clinical Core, pacientes, documentos, agenda, Conecta ou autenticação existentes, conforme o contrato do módulo.</div>
          </div>
        </TabsContent>
      </Tabs>

      {toast && <div role="status" aria-live="polite" className="fixed bottom-5 right-5 z-50 flex max-w-sm items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-950 shadow-lg dark:border-emerald-900/60 dark:bg-emerald-950/80 dark:text-emerald-100"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />{toast}</div>}
    </div>
  );
}
