import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { useClinic } from "@/contexts/ClinicContext";
import { authFetch } from "@/lib/authClient";
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

function storageKey(scope: string): string {
  const normalizedScope = scope.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80) || "demo";
  return `${STORAGE_KEY}:${normalizedScope}`;
}

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

type RemoteModuleState = {
  moduleId: ModuleId;
  enabled: boolean;
  version: number;
  updatedAt: string | null;
};

type ReadinessState = {
  readyForProduction: boolean;
  eligibleForClinicalEnablement?: boolean;
  preEnablementMissing?: string[];
  missing: string[];
  correctiveActions?: string[];
  checks: Record<string, { ok: boolean; label: string; action?: string }>;
  enabledModules: number;
  requiredModules: number;
  latestBackup: { status: string; restoreVerifiedAt: string | null; createdAt: string } | null;
};

type KeyringState = {
  ready: boolean;
  encryptionVersion: string | null;
  keyMaterialExposed: false;
  missing: string[];
  controls: Record<string, boolean>;
};

type ObservabilityState = {
  requestId: string;
  window: string;
  redacted: true;
  payloadsExposed: false;
  phiExposed: false;
  secretValuesExposed: false;
  totalEvents: number;
  actions: Array<{ action: string; count: number; lastAt: string | null }>;
  schemaReady: boolean;
  crossTenantScope: string;
};

type ProductionDiagnosticsState = {
  failClosed: true;
  environment: string;
  schema: { missingTables: string[]; missingTriggers: string[] };
  secrets: { clinicalKeyringReady: boolean; operationalKeyReady: boolean; valuesExposed: false };
  appBaseUrl: { configured: boolean; https: boolean; valueExposed: false };
  entitlement: { valid: boolean; scope: string };
  clinicalLive: { enabled: boolean; canBeEnabledOnlyAfterSchemaAndKeys: true };
  correctiveActions: string[];
};

type PrivacyRequest = {
  id: string;
  requestType: string;
  subjectType: string;
  subjectReferenceHash: string;
  status: string;
  dueAt: string | null;
  createdAt: string;
};

type PrivacySnapshot = {
  requests: PrivacyRequest[];
  retention: Array<{ dataClass: string; retentionDays: number; purgeMode: string; legalHold: boolean; enabled: boolean; version: number }>;
};

type InviteRow = {
  id: string;
  emailHashPrefix: string;
  role: string;
  status: "pending" | "accepted" | "expired" | "revoked";
  expiresAt: string;
  acceptedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
};

type WebhookDelivery = {
  clinicId: string;
  integrationId: "webhooks";
  deliveryId: string;
  eventType: string;
  environment: "sandbox" | "production";
  status: string;
  responseCode: number | null;
  attemptCount: number;
  createdAt: string;
  payloadStored: false;
  replayed?: boolean;
};

type IntegrationConnection = {
  id: string;
  clinicId: string;
  integrationId: string;
  environment: "sandbox" | "production";
  status: "draft" | "connected" | "paused" | "revoked";
  scopes: string[];
  credentialConfigured: boolean;
  endpointConfigured: boolean;
  lastVerifiedAt: string | null;
  version: number;
  updatedAt: string;
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

function loadState(scope = "demo"): ConsoleState {
  if (typeof window === "undefined") return createInitialState();
  try {
    const saved = window.localStorage.getItem(storageKey(scope));
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
  const { activeClinic, activeClinicId, error: clinicError, isLoading: clinicLoading } = useClinic();
  const tenantScope = activeClinicId ?? "demo";
  const [state, setState] = useState<ConsoleState>(() => loadState(tenantScope));
  const [remoteModuleStates, setRemoteModuleStates] = useState<Record<ModuleId, RemoteModuleState> | null>(null);
  const [readiness, setReadiness] = useState<ReadinessState | null>(null);
  const [keyring, setKeyring] = useState<KeyringState | null>(null);
  const [productionDiagnostics, setProductionDiagnostics] = useState<ProductionDiagnosticsState | null>(null);
  const [observability, setObservability] = useState<ObservabilityState | null>(null);
  const [privacySnapshot, setPrivacySnapshot] = useState<PrivacySnapshot | null>(null);
  const [retentionDrafts, setRetentionDrafts] = useState<Record<string, { retentionDays: number; purgeMode: string; legalHold: boolean; enabled: boolean }>>({});
  const [inviteRows, setInviteRows] = useState<InviteRow[]>([]);
  const [integrationConnections, setIntegrationConnections] = useState<IntegrationConnection[]>([]);
  const [webhookDeliveries, setWebhookDeliveries] = useState<WebhookDelivery[]>([]);
  const [webhookDeliveryId, setWebhookDeliveryId] = useState("");
  const [webhookEventType, setWebhookEventType] = useState("saas.module.updated");
  const [webhookDigest, setWebhookDigest] = useState("");
  const [webhookEnvironment, setWebhookEnvironment] = useState<"sandbox" | "production">("sandbox");
  const [remoteStatus, setRemoteStatus] = useState<"demo" | "loading" | "synced" | "error">("demo");
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [messageTemplate, setMessageTemplate] = useState("Olá, {{responsavel}}. Temos uma atualização segura da clínica NeuroPed para você.");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("professional");
  const [inviteExpirationDays, setInviteExpirationDays] = useState("7");
  const [lastInviteUrl, setLastInviteUrl] = useState<string | null>(null);
  const [privacyEmail, setPrivacyEmail] = useState("");
  const [backupProvider, setBackupProvider] = useState("");
  const [backupDigest, setBackupDigest] = useState("");
  const [backupRpo, setBackupRpo] = useState("240");
  const [backupRto, setBackupRto] = useState("240");
  const [backupStatus, setBackupStatus] = useState<"recorded" | "verified" | "failed">("verified");
  const [apiKeyCreated, setApiKeyCreated] = useState(false);
  const [integrationId, setIntegrationId] = useState("webhooks");
  const [integrationEnvironment, setIntegrationEnvironment] = useState<"sandbox" | "production">("sandbox");
  const [integrationStatus, setIntegrationStatus] = useState<"draft" | "connected" | "paused" | "revoked">("draft");
  const [integrationScopes, setIntegrationScopes] = useState("module.read");
  const [integrationCredentialRef, setIntegrationCredentialRef] = useState("");
  const [integrationEndpoint, setIntegrationEndpoint] = useState("");

  useEffect(() => {
    setState(loadState(tenantScope));
    setRemoteModuleStates(null);
    setReadiness(null);
    setKeyring(null);
    setProductionDiagnostics(null);
    setObservability(null);
    setPrivacySnapshot(null);
    setRetentionDrafts({});
    setInviteRows([]);
    setLastInviteUrl(null);
    setIntegrationConnections([]);
    setWebhookDeliveries([]);
    setWebhookDeliveryId("");
    setWebhookDigest("");
    setRemoteStatus(activeClinicId ? "loading" : "demo");
    setPendingAction(null);
  }, [activeClinicId, tenantScope]);

  useEffect(() => {
    if (!activeClinicId) return;
    let cancelled = false;
    void authFetch(`/api/saas/modules?clinicId=${encodeURIComponent(activeClinicId)}`)
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(typeof body?.error === "string" ? body.error : "Não foi possível sincronizar os módulos.");
        const records = Array.isArray(body?.data) ? body.data : [];
        const next = Object.fromEntries(
          records.filter((item: RemoteModuleState) => moduleById[item.moduleId]).map((item: RemoteModuleState) => [item.moduleId, item]),
        ) as Record<ModuleId, RemoteModuleState>;
        if (cancelled) return;
        setRemoteModuleStates(next);
        setState((current) => ({
          ...current,
          moduleStates: Object.fromEntries(
            modules.map((module) => {
              const updatedAt = next[module.id]?.updatedAt;
              return [module.id, {
                ...current.moduleStates[module.id],
                enabled: next[module.id]?.enabled ?? current.moduleStates[module.id].enabled,
                lastAction: updatedAt ? `Sincronizado em ${new Date(updatedAt).toLocaleString()}` : current.moduleStates[module.id].lastAction,
              }];
            }),
          ) as Record<ModuleId, ModuleState>,
        }));
        setRemoteStatus("synced");
      })
      .catch((cause) => {
        if (cancelled) return;
        setRemoteStatus("error");
        setToast(cause instanceof Error ? cause.message : "Não foi possível sincronizar o control plane.");
      });
    return () => { cancelled = true; };
  }, [activeClinicId]);

  useEffect(() => {
    if (!activeClinicId) return;
    let cancelled = false;
    void authFetch(`/api/saas/readiness?clinicId=${encodeURIComponent(activeClinicId)}`)
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(typeof body?.error === "string" ? body.error : "Readiness indisponível.");
        if (!cancelled) setReadiness(body as ReadinessState);
      })
      .catch((cause) => {
        if (!cancelled) setToast(cause instanceof Error ? cause.message : "Readiness indisponível.");
      });
    return () => { cancelled = true; };
  }, [activeClinicId]);

  useEffect(() => {
    if (!activeClinicId) return;
    let cancelled = false;
    void authFetch(`/api/saas/keyring?clinicId=${encodeURIComponent(activeClinicId)}`)
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(typeof body?.error === "string" ? body.error : "Keyring indisponível.");
        if (!cancelled) setKeyring(body as KeyringState);
      })
      .catch((cause) => { if (!cancelled) setToast(cause instanceof Error ? cause.message : "Keyring indisponível."); });
    return () => { cancelled = true; };
  }, [activeClinicId]);

  useEffect(() => {
    if (!activeClinicId) return;
    let cancelled = false;
    void authFetch(`/api/saas/production-diagnostics?clinicId=${encodeURIComponent(activeClinicId)}`)
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(typeof body?.error === "string" ? body.error : "Diagnóstico de produção indisponível.");
        if (!cancelled) setProductionDiagnostics(body as ProductionDiagnosticsState);
      })
      .catch((cause) => { if (!cancelled) setToast(cause instanceof Error ? cause.message : "Diagnóstico de produção indisponível."); });
    return () => { cancelled = true; };
  }, [activeClinicId]);

  useEffect(() => {
    if (!activeClinicId) return;
    let cancelled = false;
    void authFetch(`/api/saas/observability?clinicId=${encodeURIComponent(activeClinicId)}`)
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(typeof body?.error === "string" ? body.error : "Observabilidade indisponível.");
        if (!cancelled) setObservability(body as ObservabilityState);
      })
      .catch((cause) => { if (!cancelled) setToast(cause instanceof Error ? cause.message : "Observabilidade indisponível."); });
    return () => { cancelled = true; };
  }, [activeClinicId]);

  useEffect(() => {
    if (!activeClinicId) return;
    let cancelled = false;
    void authFetch(`/api/saas/webhooks?clinicId=${encodeURIComponent(activeClinicId)}`)
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(typeof body?.error === "string" ? body.error : "Webhooks indisponíveis.");
        if (!cancelled) setWebhookDeliveries(Array.isArray(body?.data) ? body.data : []);
      })
      .catch((cause) => { if (!cancelled) setToast(cause instanceof Error ? cause.message : "Webhooks indisponíveis."); });
    return () => { cancelled = true; };
  }, [activeClinicId]);

  useEffect(() => {
    if (!activeClinicId) return;
    let cancelled = false;
    void authFetch(`/api/tenants/${encodeURIComponent(activeClinicId)}/invites`)
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(typeof body?.error === "string" ? body.error : "Convites indisponíveis.");
        if (!cancelled) setInviteRows(Array.isArray(body?.data) ? body.data : []);
      })
      .catch((cause) => { if (!cancelled) setToast(cause instanceof Error ? cause.message : "Convites indisponíveis."); });
    return () => { cancelled = true; };
  }, [activeClinicId]);

  useEffect(() => {
    if (!activeClinicId) return;
    let cancelled = false;
    void authFetch(`/api/saas/integrations?clinicId=${encodeURIComponent(activeClinicId)}`)
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(typeof body?.error === "string" ? body.error : "Integrações indisponíveis.");
        if (!cancelled) setIntegrationConnections(Array.isArray(body?.data) ? body.data : []);
      })
      .catch((cause) => { if (!cancelled) setToast(cause instanceof Error ? cause.message : "Integrações indisponíveis."); });
    return () => { cancelled = true; };
  }, [activeClinicId]);

  useEffect(() => {
    if (!activeClinicId) return;
    let cancelled = false;
    void authFetch(`/api/saas/privacy?clinicId=${encodeURIComponent(activeClinicId)}&mode=all`)
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(typeof body?.error === "string" ? body.error : "Governança LGPD indisponível.");
        if (!cancelled) {
          const retention = (Array.isArray(body?.retention) ? body.retention : []) as PrivacySnapshot["retention"];
          setPrivacySnapshot({ requests: Array.isArray(body?.requests) ? body.requests : [], retention });
          setRetentionDrafts(Object.fromEntries(retention.map((policy) => [policy.dataClass, { retentionDays: policy.retentionDays, purgeMode: policy.purgeMode, legalHold: policy.legalHold, enabled: policy.enabled }])));
        }
      })
      .catch((cause) => {
        if (!cancelled) setToast(cause instanceof Error ? cause.message : "Governança LGPD indisponível.");
      });
    return () => { cancelled = true; };
  }, [activeClinicId]);

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey(tenantScope), JSON.stringify(state));
    } catch {
      // Preferências não sensíveis não devem interromper a operação da tela.
    }
  }, [state, tenantScope]);

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

  const toggleModule = (id: ModuleId, enabled: boolean) => {
    if (activeClinicId && !remoteModuleStates) {
      setToast("Aguarde a sincronização do tenant antes de alterar um módulo.");
      return;
    }
    const previous = state.moduleStates[id].enabled;
    updateModule(id, { enabled, lastAction: enabled ? "Habilitação enviada ao tenant" : "Pausa enviada ao tenant" });
    if (!activeClinicId || !remoteModuleStates) {
      setToast(enabled ? "Módulo habilitado apenas na demonstração local." : "Módulo pausado apenas na demonstração local.");
      return;
    }
    const expectedVersion = remoteModuleStates[id]?.version ?? 0;
    setPendingAction(`module:${id}`);
    void authFetch("/api/saas/modules", {
      method: "PATCH",
      body: JSON.stringify({ clinicId: activeClinicId, moduleId: id, enabled, expectedVersion }),
    })
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(typeof body?.error === "string" ? body.error : "Não foi possível salvar o módulo.");
        const saved = body?.data as RemoteModuleState;
                  setRemoteModuleStates((current) => current ? { ...current, [id]: saved } : current);

        updateModule(id, { enabled: saved.enabled, lastAction: `Sincronizado em ${new Date(saved.updatedAt ?? Date.now()).toLocaleString()}` });
        setToast(`Aba ${moduleById[id].number} sincronizada com o tenant.`);
      })
      .catch((cause) => {
        updateModule(id, { enabled: previous, lastAction: "Falha ao sincronizar — rollback aplicado" });
        setToast(cause instanceof Error ? cause.message : "Não foi possível salvar o módulo.");
      })
      .finally(() => setPendingAction(null));
  };

  const announce = (message: string) => setToast(message);

  const recordBackupEvidence = () => {
    if (!activeClinicId) {
      setToast("Evidência de backup exige um tenant ativo; nada foi registrado localmente.");
      return;
    }
    if (!backupProvider.trim() || !/^[a-f0-9]{64}$/i.test(backupDigest.trim())) {
      setToast("Informe o provedor e o digest SHA-256 de 64 caracteres hexadecimais.");
      return;
    }
    setPendingAction("backup-evidence");
    void authFetch("/api/saas/backup-evidence", {
      method: "POST",
      body: JSON.stringify({ clinicId: activeClinicId, provider: backupProvider.trim(), snapshotDigestSha256: backupDigest.trim(), status: backupStatus, rpoMinutes: Number(backupRpo), rtoMinutes: Number(backupRto), restoreVerifiedAt: backupStatus === "verified" ? new Date().toISOString() : null }),
    })
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(typeof body?.error === "string" ? body.error : "Não foi possível registrar a evidência.");
        setBackupDigest("");
        setReadiness((current) => {
          if (!current) return current;
          const checks = { ...current.checks, restore: { ok: backupStatus === "verified", label: "Restore verificado" } };
          const missing = Object.values(checks).filter((check) => !check.ok).map((check) => check.label);
          return { ...current, latestBackup: body.data, checks, missing, readyForProduction: missing.length === 0 };
        });
        setToast("Evidência de backup/restore registrada e auditada.");
      })
      .catch((cause) => setToast(cause instanceof Error ? cause.message : "Não foi possível registrar a evidência."))
      .finally(() => setPendingAction(null));
  };

  const createPrivacyRequest = () => {
    if (!activeClinicId) {
      recordAction("Pedido de acesso preparado apenas na demonstração local.", 2);
      setPrivacyEmail("");
      return;
    }
    const subjectReference = privacyEmail.trim();
    if (!subjectReference || !subjectReference.includes("@")) {
      setToast("Informe um e-mail válido do titular; ele será transformado em hash no servidor.");
      return;
    }
    setPendingAction("privacy-create");
    void authFetch("/api/saas/privacy", {
      method: "POST",
      body: JSON.stringify({ clinicId: activeClinicId, requestType: "access", subjectType: "account", subjectReference }),
    })
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(typeof body?.error === "string" ? body.error : "Não foi possível registrar o pedido.");
        setPrivacyEmail("");
        setPrivacySnapshot((current) => current ? { ...current, requests: [body.data as PrivacyRequest, ...current.requests] } : current);
        recordAction("Pedido do titular registrado no tenant e auditado.", 2);
      })
      .catch((cause) => setToast(cause instanceof Error ? cause.message : "Não foi possível registrar o pedido."))
      .finally(() => setPendingAction(null));
  };

  const createInvite = () => {
    if (!activeClinicId) {
      setToast("Convites exigem um tenant ativo; nada foi enviado no modo demo.");
      return;
    }
    const email = inviteEmail.trim();
    const expirationDays = Number(inviteExpirationDays);
    if (!email.includes("@") || !Number.isInteger(expirationDays) || expirationDays < 1 || expirationDays > 30) {
      setToast("Informe e-mail e expiração válidos para o convite.");
      return;
    }
    setPendingAction("invite-create");
    void authFetch(`/api/tenants/${encodeURIComponent(activeClinicId)}/invites`, {
      method: "POST",
      body: JSON.stringify({ email, role: inviteRole, expirationDays }),
    })
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(typeof body?.error === "string" ? body.error : "Não foi possível criar o convite.");
        setInviteEmail("");
        setLastInviteUrl(typeof body.data?.inviteUrl === "string" ? body.data.inviteUrl : null);
        setInviteRows((current) => [{ id: body.data.id, emailHashPrefix: "token exibido uma vez", role: body.data.role, status: "pending", expiresAt: body.data.expiresAt, acceptedAt: null, revokedAt: null, createdAt: new Date().toISOString() }, ...current]);
        setToast("Convite criado. Copie a URL segura agora; ela não será recuperada depois.");
      })
      .catch((cause) => setToast(cause instanceof Error ? cause.message : "Não foi possível criar o convite."))
      .finally(() => setPendingAction(null));
  };

  const resendInvite = (inviteId: string) => {
    if (!activeClinicId) return;
    setPendingAction(`invite-resend:${inviteId}`);
    void authFetch(`/api/tenants/${encodeURIComponent(activeClinicId)}/invites`, {
      method: "PATCH",
      body: JSON.stringify({ inviteId, expirationDays: Number(inviteExpirationDays) }),
    })
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(typeof body?.error === "string" ? body.error : "Não foi possível reenviar o convite.");
        setLastInviteUrl(typeof body.data?.inviteUrl === "string" ? body.data.inviteUrl : null);
        setInviteRows((current) => [{ id: body.data.id, emailHashPrefix: "token exibido uma vez", role: body.data.role, status: "pending", expiresAt: body.data.expiresAt, acceptedAt: null, revokedAt: null, createdAt: new Date().toISOString() }, ...current.map((invite) => invite.id === inviteId ? { ...invite, status: "revoked" as const, revokedAt: new Date().toISOString() } : invite)]);
        setToast("Convite reenviado com token novo. Copie a URL agora.");
      })
      .catch((cause) => setToast(cause instanceof Error ? cause.message : "Não foi possível reenviar o convite."))
      .finally(() => setPendingAction(null));
  };

  const revokeInvite = (inviteId: string) => {
    if (!activeClinicId) return;
    setPendingAction(`invite-revoke:${inviteId}`);
    void authFetch(`/api/tenants/${encodeURIComponent(activeClinicId)}/invites?inviteId=${encodeURIComponent(inviteId)}`, { method: "DELETE" })
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(typeof body?.error === "string" ? body.error : "Não foi possível revogar o convite.");
        setInviteRows((current) => current.map((invite) => invite.id === inviteId ? { ...invite, status: "revoked", revokedAt: body.data.revokedAt } : invite));
        setToast("Convite revogado e auditado.");
      })
      .catch((cause) => setToast(cause instanceof Error ? cause.message : "Não foi possível revogar o convite."))
      .finally(() => setPendingAction(null));
  };

  const transitionPrivacyRequest = (request: PrivacyRequest, nextStatus: string) => {
    if (!activeClinicId) return;
    const resolutionCode = nextStatus === "completed" ? "operator_review_completed" : null;
    setPendingAction(`privacy:${request.id}`);
    void authFetch("/api/saas/privacy", {
      method: "PATCH",
      body: JSON.stringify({ clinicId: activeClinicId, requestId: request.id, status: nextStatus, resolutionCode }),
    })
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(typeof body?.error === "string" ? body.error : "Não foi possível avançar o pedido.");
        setPrivacySnapshot((current) => current ? { ...current, requests: current.requests.map((item) => item.id === request.id ? { ...item, status: body.data.status } : item) } : current);
        setToast(`Pedido ${request.requestType} avançado para ${body.data.status}.`);
      })
      .catch((cause) => setToast(cause instanceof Error ? cause.message : "Não foi possível avançar o pedido."))
      .finally(() => setPendingAction(null));
  };

  const saveRetentionPolicy = (policy: PrivacySnapshot["retention"][number], patch: { legalHold?: boolean; enabled?: boolean; purgeMode?: string }) => {
    if (!activeClinicId) return;
    const draft = retentionDrafts[policy.dataClass] ?? { retentionDays: policy.retentionDays, purgeMode: policy.purgeMode, legalHold: policy.legalHold, enabled: policy.enabled };
    const next = { ...draft, ...patch };
    setRetentionDrafts((current) => ({ ...current, [policy.dataClass]: next }));
    setPendingAction(`retention:${policy.dataClass}`);
    void authFetch("/api/saas/privacy", {
      method: "PUT",
      body: JSON.stringify({ clinicId: activeClinicId, dataClass: policy.dataClass, retentionDays: next.retentionDays, purgeMode: next.purgeMode, legalHold: next.legalHold, enabled: next.enabled, expectedVersion: policy.version }),
    })
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(typeof body?.error === "string" ? body.error : "Não foi possível salvar a retenção.");
        const saved = body.data;
        setPrivacySnapshot((current) => current ? { ...current, retention: current.retention.map((item) => item.dataClass === policy.dataClass ? { ...item, ...saved } : item) } : current);
        setRetentionDrafts((current) => ({ ...current, [policy.dataClass]: { retentionDays: saved.retentionDays, purgeMode: saved.purgeMode, legalHold: saved.legalHold, enabled: saved.enabled } }));
        setToast(`Política ${policy.dataClass} atualizada e auditada.`);
      })
      .catch((cause) => { setRetentionDrafts((current) => ({ ...current, [policy.dataClass]: { retentionDays: policy.retentionDays, purgeMode: policy.purgeMode, legalHold: policy.legalHold, enabled: policy.enabled } })); setToast(cause instanceof Error ? cause.message : "Não foi possível salvar a retenção."); })
      .finally(() => setPendingAction(null));
  };

  const saveIntegration = () => {
    if (!activeClinicId) {
      setToast("Integrações exigem um tenant ativo; nada foi salvo no modo demo.");
      return;
    }
    const existing = integrationConnections.find((connection) => connection.integrationId === integrationId && connection.environment === integrationEnvironment);
    const scopes = integrationScopes.split(",").map((scope) => scope.trim()).filter(Boolean);
    setPendingAction("integration-save");
    void authFetch("/api/saas/integrations", {
      method: "PUT",
      headers: { "X-Idempotency-Key": crypto.randomUUID() },
      body: JSON.stringify({ clinicId: activeClinicId, integrationId, environment: integrationEnvironment, status: integrationStatus, scopes, credentialRef: integrationCredentialRef.trim() || null, endpoint: integrationEndpoint.trim() || null, lastVerifiedAt: integrationStatus === "connected" ? new Date().toISOString() : null, expectedVersion: existing?.version ?? 0 }),
    })
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(typeof body?.error === "string" ? body.error : "Não foi possível salvar a integração.");
        setIntegrationConnections((current) => {
          const saved = body.data as IntegrationConnection;
          const next: IntegrationConnection = { ...saved, id: existing?.id ?? `${integrationId}:${integrationEnvironment}`, clinicId: activeClinicId, credentialConfigured: Boolean(saved.credentialConfigured), endpointConfigured: Boolean(integrationEndpoint.trim()), version: saved.version, updatedAt: saved.updatedAt };
          return [...current.filter((item) => !(item.integrationId === integrationId && item.environment === integrationEnvironment)), next];
        });
        setIntegrationCredentialRef("");
        setIntegrationEndpoint("");
        setToast("Conexão de integração salva com escopo e auditoria.");
      })
      .catch((cause) => setToast(cause instanceof Error ? cause.message : "Não foi possível salvar a integração."))
      .finally(() => setPendingAction(null));
  };

  const queueWebhook = () => {
    if (!activeClinicId) {
      setToast("Webhooks exigem um tenant ativo; nada foi registrado no modo demo.");
      return;
    }
    if (webhookDeliveryId.trim().length < 16 || !/^[a-f0-9]{64}$/i.test(webhookDigest.trim())) {
      setToast("Informe delivery ID com pelo menos 16 caracteres e digest SHA-256 válido.");
      return;
    }
    setPendingAction("webhook-queue");
    void authFetch("/api/saas/webhooks", {
      method: "POST",
      headers: { "X-Webhook-Delivery-Id": webhookDeliveryId.trim() },
      body: JSON.stringify({ clinicId: activeClinicId, deliveryId: webhookDeliveryId.trim(), eventType: webhookEventType, environment: webhookEnvironment, payloadDigestSha256: webhookDigest.trim().toLowerCase() }),
    })
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(typeof body?.error === "string" ? body.error : "Não foi possível registrar o webhook.");
        const delivery = body.data as WebhookDelivery;
        setWebhookDeliveries((current) => [delivery, ...current.filter((item) => item.deliveryId !== delivery.deliveryId)]);
        setWebhookDigest("");
        setToast(delivery.replayed ? "Replay idempotente confirmado." : "Webhook metadata-only enfileirado e assinado.");
      })
      .catch((cause) => setToast(cause instanceof Error ? cause.message : "Não foi possível registrar o webhook."))
      .finally(() => setPendingAction(null));
  };

  const recalculateReadiness = () => {
    if (!activeClinicId) return;
    setPendingAction("readiness");
    void authFetch(`/api/saas/readiness?clinicId=${encodeURIComponent(activeClinicId)}`)
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(typeof body?.error === "string" ? body.error : "Readiness indisponível.");
        setReadiness(body as ReadinessState);
        setToast("Readiness recalculado no servidor.");
      })
      .catch((cause) => setToast(cause instanceof Error ? cause.message : "Readiness indisponível."))
      .finally(() => setPendingAction(null));
  };

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
          <div className="space-y-4">
            <ActionCard title="Matriz de acesso" description="A tabela é somente administrativa; decisões clínicas continuam no núcleo protegido.">
              <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-left text-sm"><thead><tr className="border-b text-xs uppercase tracking-wide text-muted-foreground"><th className="pb-3">Perfil</th><th className="pb-3">Workspace</th><th className="pb-3">Pacientes</th><th className="pb-3">Documentos</th><th className="pb-3">Admin</th></tr></thead><tbody>{[["Admin", "Total", "Escopo", "Total", "Sim"], ["Profissional", "Leitura", "Vínculo", "Vínculo", "Não"], ["Operador", "Leitura", "Agenda", "Fluxo", "Não"], ["Reader", "Leitura", "Somente leitura", "Não", "Não"]].map((row) => <tr key={row[0]} className="border-b last:border-0"><td className="py-3 font-semibold">{row[0]}</td>{row.slice(1).map((cell, cellIndex) => <td key={`${row[0]}-${cellIndex}`} className="py-3 text-muted-foreground">{cell}</td>)}</tr>)}</tbody></table></div>
              <Button className="mt-4 gap-2" variant="outline" onClick={() => recordAction("Revisão de privilégios registrada.", 3)}><ShieldCheck className="h-4 w-4" />Registrar revisão</Button>
            </ActionCard>
            <ActionCard title="Convites de equipe" description="A URL aparece somente na criação ou reenvio. A lista usa prefixo de hash e permite revogação e reenvio controlados por clínica.">
              <div className="grid gap-3 sm:grid-cols-[1fr_160px_120px_auto]"><Input aria-label="E-mail do convite" value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} placeholder="profissional@clinica.com" type="email" /><select aria-label="Papel do convite" value={inviteRole} onChange={(event) => setInviteRole(event.target.value)} className="h-10 rounded-xl border bg-background px-3 text-sm"><option value="professional">Profissional</option><option value="assistant">Assistente</option><option value="financial">Financeiro</option><option value="clinic_admin">Admin da clínica</option></select><Input aria-label="Expiração em dias" value={inviteExpirationDays} onChange={(event) => setInviteExpirationDays(event.target.value)} type="number" min="1" max="30" /><Button disabled={pendingAction === "invite-create"} onClick={createInvite}>{pendingAction === "invite-create" ? "Criando…" : "Criar convite"}</Button></div>
              {lastInviteUrl && <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-xs dark:border-emerald-900/50 dark:bg-emerald-950/20"><p className="font-semibold">URL segura do último convite — copie agora</p><div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center"><code className="min-w-0 flex-1 break-all rounded-lg bg-background p-2 font-mono">{lastInviteUrl}</code><Button size="sm" variant="outline" onClick={() => { void navigator.clipboard?.writeText(lastInviteUrl); setToast("URL copiada para a área de transferência."); }}>Copiar URL</Button></div></div>}
              <div className="mt-4 space-y-2">{inviteRows.slice(0, 8).map((invite) => <div key={invite.id} className="flex flex-wrap items-center gap-3 rounded-xl border p-3 text-sm"><span className="font-mono text-xs">{invite.emailHashPrefix}…</span><Badge variant="outline">{invite.role}</Badge><Badge variant={invite.status === "pending" ? "default" : "outline"}>{invite.status}</Badge><span className="text-xs text-muted-foreground">expira {new Date(invite.expiresAt).toLocaleDateString()}</span>{activeClinicId && (invite.status === "pending" || invite.status === "expired") && <div className="ml-auto flex gap-2"><Button size="sm" variant="ghost" disabled={pendingAction === `invite-resend:${invite.id}`} onClick={() => resendInvite(invite.id)}>{pendingAction === `invite-resend:${invite.id}` ? "Reenviando…" : "Reenviar"}</Button>{invite.status === "pending" && <Button size="sm" variant="ghost" disabled={pendingAction === `invite-revoke:${invite.id}`} onClick={() => revokeInvite(invite.id)}>{pendingAction === `invite-revoke:${invite.id}` ? "Revogando…" : "Revogar"}</Button>}</div>}</div>)}{activeClinicId && inviteRows.length === 0 && <p className="rounded-xl border border-dashed p-3 text-xs text-muted-foreground">Nenhum convite registrado para este tenant.</p>}{!activeClinicId && <p className="rounded-xl border border-dashed p-3 text-xs text-muted-foreground">Ative uma clínica para consultar convites reais.</p>}</div>
            </ActionCard>
          </div>
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
          <ActionCard title="Painel operacional" description="Eventos agregados e redigidos do tenant. A Central não exibe PHI, payloads, tokens ou valores de segredo.">
            <div className="grid gap-3 sm:grid-cols-3"><ModuleMetric label="Eventos 24h" value={observability ? String(observability.totalEvents) : "—"} tone="success" /><ModuleMetric label="Schema" value={observability?.schemaReady ? "pronto" : "bloqueado"} /><ModuleMetric label="Escopo" value={observability ? "tenant" : "—"} /></div>
            <div className="mt-4 flex flex-wrap gap-2"><Pill>{observability?.redacted ? "redaction ativo" : "aguardando"}</Pill><Pill>{observability?.phiExposed === false ? "zero PHI" : "bloqueado"}</Pill><Pill>{observability?.crossTenantScope ?? "membership obrigatório"}</Pill></div>
            <div className="mt-4 space-y-2">{observability?.actions.slice(0, 8).map((item) => <div key={item.action} className="flex items-center justify-between rounded-xl border p-3 text-xs"><span className="font-medium">{item.action}</span><span className="text-muted-foreground">{item.count} · {item.lastAt ? new Date(item.lastAt).toLocaleString() : "sem timestamp"}</span></div>)}{!observability && <p className="rounded-xl border border-dashed p-3 text-xs text-muted-foreground">Ative uma clínica para consultar observabilidade redigida.</p>}</div>
            <Button className="mt-4 gap-2" variant="outline" onClick={() => recordAction("Health check registrado sem payload clínico.", 3)}><Activity className="h-4 w-4" />Registrar health check</Button>
          </ActionCard>
        );
      case "continuity":
        return (
          <ActionCard title="Política de continuidade" description="Registre somente evidências fornecidas pelo provedor. O digest é validado no servidor e a prova fica vinculada ao tenant.">
            <div className="grid gap-4 sm:grid-cols-2"><div><FieldLabel htmlFor="backup-frequency">Frequência</FieldLabel><select id="backup-frequency" className="mt-2 h-10 w-full rounded-xl border bg-background px-3 text-sm"><option>A cada 4 horas</option><option>Diário</option><option>Semanal</option></select></div><div><FieldLabel htmlFor="backup-retention">Retenção</FieldLabel><select id="backup-retention" className="mt-2 h-10 w-full rounded-xl border bg-background px-3 text-sm"><option>90 dias</option><option>1 ano</option><option>Política permanente</option></select></div></div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2"><div><FieldLabel htmlFor="backup-provider">Provedor</FieldLabel><Input id="backup-provider" value={backupProvider} onChange={(event) => setBackupProvider(event.target.value)} placeholder="Cloudflare R2 / S3" /></div><div><FieldLabel htmlFor="backup-digest">SHA-256 do snapshot</FieldLabel><Input id="backup-digest" value={backupDigest} onChange={(event) => setBackupDigest(event.target.value)} placeholder="64 caracteres hexadecimais" className="font-mono text-xs" /></div><div><FieldLabel htmlFor="backup-rpo">RPO (minutos)</FieldLabel><Input id="backup-rpo" type="number" min="0" max="10080" value={backupRpo} onChange={(event) => setBackupRpo(event.target.value)} /></div><div><FieldLabel htmlFor="backup-rto">RTO (minutos)</FieldLabel><Input id="backup-rto" type="number" min="0" max="10080" value={backupRto} onChange={(event) => setBackupRto(event.target.value)} /></div></div>
            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-100"><Database className="h-5 w-5 shrink-0" /><div><p className="font-semibold">Último readiness</p><p className="mt-1 text-xs opacity-80">{readiness?.latestBackup ? `${readiness.latestBackup.status} · ${new Date(readiness.latestBackup.createdAt).toLocaleString()}` : "Nenhuma evidência registrada para este tenant."}</p></div></div>
            <div className="mt-4 flex flex-wrap gap-3"><select aria-label="Status da evidência" value={backupStatus} onChange={(event) => setBackupStatus(event.target.value as typeof backupStatus)} className="h-10 rounded-xl border bg-background px-3 text-sm"><option value="verified">Restore verificado</option><option value="recorded">Snapshot registrado</option><option value="failed">Falha no restore</option></select><Button className="gap-2" disabled={pendingAction === "backup-evidence"} onClick={recordBackupEvidence}><Database className="h-4 w-4" />{pendingAction === "backup-evidence" ? "Registrando…" : "Registrar evidência"}</Button></div>
          </ActionCard>
        );
      case "privacy":
        return (
          <ActionCard title="Fila de direitos do titular" description="Use dados mínimos. O e-mail é transformado em hash no servidor; a execução real exige verificação de identidade e revisão autorizada.">
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]"><Input aria-label="E-mail do titular" value={privacyEmail} onChange={(event) => setPrivacyEmail(event.target.value)} placeholder="titular@exemplo.com" type="email" /><Button disabled={pendingAction === "privacy-create"} onClick={createPrivacyRequest}>{pendingAction === "privacy-create" ? "Registrando…" : "Registrar solicitação"}</Button></div>
            <div className="mt-4 space-y-2 text-sm">
              {privacySnapshot?.requests.slice(0, 8).map((request) => (
                <div key={request.id} className="flex flex-wrap items-center gap-3 rounded-xl border p-3">
                  <span className="min-w-[180px]"><strong>{request.requestType}</strong><span className="ml-2 text-xs text-muted-foreground">{request.subjectReferenceHash.slice(0, 10)}…</span></span>
                  <Badge variant={request.status === "completed" ? "default" : "outline"}>{request.status}</Badge>
                  {activeClinicId && request.status === "open" && <Button size="sm" variant="ghost" className="ml-auto" disabled={pendingAction === `privacy:${request.id}`} onClick={() => transitionPrivacyRequest(request, "verified")}>{pendingAction === `privacy:${request.id}` ? "Salvando…" : "Verificar"}</Button>}
                  {activeClinicId && request.status === "verified" && <Button size="sm" variant="ghost" className="ml-auto" disabled={pendingAction === `privacy:${request.id}`} onClick={() => transitionPrivacyRequest(request, "in_progress")}>{pendingAction === `privacy:${request.id}` ? "Salvando…" : "Iniciar"}</Button>}
                  {activeClinicId && request.status === "in_progress" && <Button size="sm" variant="ghost" className="ml-auto" disabled={pendingAction === `privacy:${request.id}`} onClick={() => transitionPrivacyRequest(request, "completed")}>{pendingAction === `privacy:${request.id}` ? "Salvando…" : "Concluir"}</Button>}
                </div>
              ))}
              {(!privacySnapshot || privacySnapshot.requests.length === 0) && (
                <>
                  <div className="flex items-center justify-between rounded-xl border p-3"><span>Acesso aos dados</span><Badge variant="outline">Em revisão</Badge></div>
                  <div className="flex items-center justify-between rounded-xl border p-3"><span>Acessibilidade da fila</span><Badge variant="outline">Disponível</Badge></div>
                  <div className="flex items-center justify-between rounded-xl border p-3"><span>Execução</span><Badge variant="outline">Requer verificação</Badge></div>
                </>
              )}
            </div>
            {privacySnapshot?.retention.length ? <div className="mt-4 rounded-xl border bg-muted/20 p-3 text-xs"><p className="font-semibold">Políticas carregadas do tenant</p><div className="mt-2 space-y-3">{privacySnapshot.retention.map((policy) => { const draft = retentionDrafts[policy.dataClass] ?? { retentionDays: policy.retentionDays, purgeMode: policy.purgeMode, legalHold: policy.legalHold, enabled: policy.enabled }; const busy = pendingAction === `retention:${policy.dataClass}`; return <div key={policy.dataClass} className="rounded-lg border bg-background p-3"><div className="flex flex-wrap items-center gap-2"><Pill>{policy.dataClass} · v{policy.version}</Pill><Badge variant={draft.legalHold ? "default" : "outline"}>{draft.legalHold ? "legal hold" : "sem hold"}</Badge></div><div className="mt-3 grid gap-2 sm:grid-cols-3"><Input aria-label={`Dias de retenção ${policy.dataClass}`} type="number" min="0" max="36500" value={draft.retentionDays} onChange={(event) => setRetentionDrafts((current) => ({ ...current, [policy.dataClass]: { ...draft, retentionDays: Number(event.target.value) } }))} /><select aria-label={`Modo de purge ${policy.dataClass}`} value={draft.purgeMode} onChange={(event) => setRetentionDrafts((current) => ({ ...current, [policy.dataClass]: { ...draft, purgeMode: event.target.value } }))} className="h-10 rounded-xl border bg-background px-3 text-sm"><option value="archive">Arquivar</option><option value="anonymize">Anonimizar</option><option value="delete">Excluir após revisão</option></select><label className="flex items-center gap-2 rounded-xl border px-3 text-xs"><input type="checkbox" aria-label={`Ativar política ${policy.dataClass}`} checked={draft.enabled} onChange={(event) => setRetentionDrafts((current) => ({ ...current, [policy.dataClass]: { ...draft, enabled: event.target.checked } }))} className="h-4 w-4 accent-primary" />Ativa</label></div><div className="mt-3 flex flex-wrap gap-2"><Button size="sm" disabled={busy || !activeClinicId} onClick={() => saveRetentionPolicy(policy, draft)}>{busy ? "Salvando…" : "Salvar política"}</Button><Button size="sm" variant="outline" disabled={busy || !activeClinicId} onClick={() => saveRetentionPolicy(policy, { legalHold: !draft.legalHold })}>{draft.legalHold ? "Liberar hold" : "Aplicar hold"}</Button></div></div>; })}</div></div> : null}
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
          <div className="space-y-4">
            <ActionCard title="Integrações tenant-aware" description="Nenhum segredo, endpoint ou PHI é devolvido nesta tela. Produção exige secret manager, sandbox verificado, escopo mínimo, idempotência, redaction e auditoria.">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><select aria-label="Integração" value={integrationId} onChange={(event) => setIntegrationId(event.target.value)} className="h-10 rounded-xl border bg-background px-3 text-sm"><option value="email">Mensageria transacional</option><option value="webhooks">Webhooks assinados</option><option value="fhir">Interoperabilidade FHIR</option><option value="object-storage">Object storage</option><option value="observability">Observabilidade</option></select><select aria-label="Ambiente da integração" value={integrationEnvironment} onChange={(event) => setIntegrationEnvironment(event.target.value as typeof integrationEnvironment)} className="h-10 rounded-xl border bg-background px-3 text-sm"><option value="sandbox">Sandbox</option><option value="production">Produção</option></select><select aria-label="Status da integração" value={integrationStatus} onChange={(event) => setIntegrationStatus(event.target.value as typeof integrationStatus)} className="h-10 rounded-xl border bg-background px-3 text-sm"><option value="draft">Rascunho</option><option value="connected">Conectada</option><option value="paused">Pausada</option><option value="revoked">Revogada</option></select><Input aria-label="Escopos separados por vírgula" value={integrationScopes} onChange={(event) => setIntegrationScopes(event.target.value)} placeholder="module.read" /></div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2"><Input aria-label="Referência no secret manager" value={integrationCredentialRef} onChange={(event) => setIntegrationCredentialRef(event.target.value)} placeholder="vault://neuro/tenant/integration" /><Input aria-label="Endpoint da integração" value={integrationEndpoint} onChange={(event) => setIntegrationEndpoint(event.target.value)} placeholder="https://sandbox.exemplo.com/webhook" /></div>
              <Button className="mt-4 gap-2" disabled={pendingAction === "integration-save"} onClick={saveIntegration}><KeyRound className="h-4 w-4" />{pendingAction === "integration-save" ? "Salvando…" : "Salvar conexão"}</Button>
              <div className="mt-4 space-y-2">{integrationConnections.map((connection) => <div key={`${connection.integrationId}:${connection.environment}`} className="flex flex-wrap items-center gap-3 rounded-xl border p-3 text-sm"><span className="font-semibold">{connection.integrationId}</span><Badge variant="outline">{connection.environment}</Badge><Badge variant={connection.status === "connected" ? "default" : "outline"}>{connection.status}</Badge><span className="text-xs text-muted-foreground">{connection.scopes.join(", ")}</span><span className="ml-auto text-xs text-muted-foreground">{connection.credentialConfigured ? "secret ref" : "sem credencial"} · v{connection.version}</span></div>)}{activeClinicId && integrationConnections.length === 0 && <p className="rounded-xl border border-dashed p-3 text-xs text-muted-foreground">Nenhuma integração configurada para este tenant.</p>}{!activeClinicId && <p className="rounded-xl border border-dashed p-3 text-xs text-muted-foreground">Ative uma clínica para consultar integrações reais.</p>}</div>
            </ActionCard>
            <ActionCard title="Webhooks assinados" description="Registre somente o envelope redigido. O payload não entra no navegador, no D1 ou na auditoria; a entrega é idempotente e tenant-aware.">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Input aria-label="Delivery ID" value={webhookDeliveryId} onChange={(event) => setWebhookDeliveryId(event.target.value)} placeholder="delivery-00000001" /><select aria-label="Evento do webhook" value={webhookEventType} onChange={(event) => setWebhookEventType(event.target.value)} className="h-10 rounded-xl border bg-background px-3 text-sm"><option value="saas.module.updated">Módulo atualizado</option><option value="saas.invite.updated">Convite atualizado</option><option value="saas.privacy.updated">LGPD atualizada</option><option value="saas.integration.updated">Integração atualizada</option></select><select aria-label="Ambiente do webhook" value={webhookEnvironment} onChange={(event) => setWebhookEnvironment(event.target.value as "sandbox" | "production")} className="h-10 rounded-xl border bg-background px-3 text-sm"><option value="sandbox">Sandbox</option><option value="production">Produção</option></select><Input aria-label="Digest SHA-256 do payload" value={webhookDigest} onChange={(event) => setWebhookDigest(event.target.value)} placeholder="64 caracteres hexadecimais" className="font-mono text-xs" /></div>
              <Button className="mt-4 gap-2" disabled={pendingAction === "webhook-queue"} onClick={queueWebhook}><Activity className="h-4 w-4" />{pendingAction === "webhook-queue" ? "Registrando…" : "Registrar envelope"}</Button>
              <div className="mt-4 space-y-2">{webhookDeliveries.slice(0, 8).map((delivery) => <div key={delivery.deliveryId} className="flex flex-wrap items-center gap-3 rounded-xl border p-3 text-xs"><span className="font-mono">{delivery.deliveryId}</span><Badge variant="outline">{delivery.environment}</Badge><Badge variant={delivery.status === "queued" ? "default" : "outline"}>{delivery.status}</Badge><span>{delivery.eventType}</span><span className="ml-auto text-muted-foreground">tentativas {delivery.attemptCount} · payload armazenado: não</span></div>)}{activeClinicId && webhookDeliveries.length === 0 && <p className="rounded-xl border border-dashed p-3 text-xs text-muted-foreground">Nenhuma entrega registrada para este tenant.</p>}{!activeClinicId && <p className="rounded-xl border border-dashed p-3 text-xs text-muted-foreground">Ative uma clínica para registrar envelopes de webhook.</p>}</div>
            </ActionCard>
            <ActionCard title="Credencial de sandbox legada" description="Mantida somente como demonstração local; não concede acesso a dados clínicos identificáveis.">
              <div className="rounded-2xl border bg-muted/20 p-4"><div className="flex items-center gap-3"><Code2 className="h-5 w-5 text-primary" /><div><p className="font-semibold">Chave local de teste</p><p className="text-xs text-muted-foreground">Não é uma credencial de produção</p></div></div>{apiKeyCreated && <code className="mt-4 block break-all rounded-xl bg-background p-3 text-xs">np_sandbox_demo_7b3c_••••••••••••</code>}</div><Button className="mt-4 gap-2" variant="outline" onClick={() => { setApiKeyCreated(true); recordAction("Chave de sandbox criada apenas localmente.", 2); }}><KeyRound className="h-4 w-4" />{apiKeyCreated ? "Rotacionar demo" : "Gerar demo"}</Button>
            </ActionCard>
          </div>
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
            <div className="mb-3 flex flex-wrap items-center gap-2"><Badge className="gap-1.5"><Sparkles className="h-3.5 w-3.5" />NeuroPed OS</Badge><Badge variant="outline">20 áreas em abas</Badge><Badge variant="outline">MVP seguro</Badge><Badge variant={remoteStatus === "synced" ? "default" : "outline"}>{clinicLoading ? "Carregando tenant…" : activeClinic ? `Tenant: ${activeClinic.name}` : "Demo local"}</Badge></div>
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Central SaaS complementar</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground md:text-base">Uma central administrativa para organizar as 20 expansões sem duplicar pacientes, escalas, Clinical Core, documentos, agenda, Conecta ou portais existentes.</p>
          <p className="mt-3 text-xs font-medium text-muted-foreground">{remoteStatus === "synced" ? "Configuração sincronizada no servidor para o tenant ativo." : remoteStatus === "loading" ? "Sincronizando configuração tenant-aware…" : remoteStatus === "error" ? (clinicError ?? "Control plane indisponível; nenhum toggle de produção foi alterado.") : "Nenhum tenant ativo: preferências ficam restritas à demonstração local."}</p>
          </div>
          <div className="flex flex-wrap gap-2"><Button asChild variant="outline" className="gap-2"><Link href="/">Abrir núcleo NeuroPed<ChevronRight className="h-4 w-4" /></Link></Button><Button variant="outline" className="gap-2" onClick={() => { setState(createInitialState()); setApiKeyCreated(false); announce("Preferências da central restauradas."); }}><ShieldCheck className="h-4 w-4" />Restaurar demo</Button></div>
        </div>
      </header>

      <Card className="border-amber-200/70 bg-amber-50/60 dark:border-amber-900/50 dark:bg-amber-950/15"><CardContent className="flex gap-3 py-4 text-sm"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-300" /><p className="leading-6 text-amber-950 dark:text-amber-100"><strong>Guardrail:</strong> a central separa configuração de tenant, habilitação de módulo e fonte clínica canônica. Nenhum toggle local concede acesso a PHI; produção exige membership, entitlement, keyring, auditoria, consentimento e evidência de restore.</p></CardContent></Card>

      {activeClinicId && readiness && <Card className={readiness.readyForProduction ? "border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/50 dark:bg-emerald-950/20" : "border-amber-200 bg-amber-50/60 dark:border-amber-900/50 dark:bg-amber-950/20"}><CardContent className="flex gap-3 py-4 text-sm"><ShieldCheck className={readiness.readyForProduction ? "mt-0.5 h-5 w-5 shrink-0 text-emerald-700 dark:text-emerald-300" : "mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-300"} /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-3"><p className="font-semibold">{readiness.readyForProduction ? "Tenant pronto para liberação controlada" : "Readiness bloqueado antes da produção"}<span className="ml-2 text-xs font-normal text-muted-foreground">{readiness.enabledModules}/{readiness.requiredModules} módulos habilitados</span></p><Button size="sm" variant="outline" className="ml-auto" disabled={pendingAction === "readiness"} onClick={recalculateReadiness}>{pendingAction === "readiness" ? "Recalculando…" : "Recalcular"}</Button></div><p className="mt-1 text-xs leading-5 text-muted-foreground">{readiness.readyForProduction ? "Todos os gates mínimos de infraestrutura, acesso e continuidade foram comprovados." : readiness.eligibleForClinicalEnablement ? "Os gates prévios estão prontos; habilite Clinical LIVE somente no procedimento aprovado." : `Pendências: ${readiness.missing.join(" · ")}`}</p><div className="mt-3 flex flex-wrap gap-2">{Object.values(readiness.checks).map((check) => <Pill key={check.label}>{check.ok ? "✓" : "○"} {check.label}</Pill>)}</div>{readiness.correctiveActions?.length ? <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-100"><p className="font-semibold">Ações corretivas antes do go-live</p><ul className="mt-1 list-disc space-y-1 pl-4">{readiness.correctiveActions.map((action) => <li key={action}>{action}</li>)}</ul></div> : null}</div></CardContent></Card>}

      {activeClinicId && keyring && <Card className={keyring.ready ? "border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/50 dark:bg-emerald-950/20" : "border-amber-200 bg-amber-50/60 dark:border-amber-900/50 dark:bg-amber-950/20"}><CardContent className="flex items-start gap-3 py-4 text-sm"><KeyRound className={keyring.ready ? "mt-0.5 h-5 w-5 shrink-0 text-emerald-700 dark:text-emerald-300" : "mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-300"} /><div><p className="font-semibold">Postura criptográfica {keyring.ready ? "aprovada" : "bloqueada"}</p><p className="mt-1 text-xs text-muted-foreground">{keyring.encryptionVersion ? `Versão identificável: ${keyring.encryptionVersion}` : "Versão clínica indisponível"} · material exposto: não</p>{keyring.missing.length ? <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-amber-950 dark:text-amber-100">{keyring.missing.map((item) => <li key={item}>{item}</li>)}</ul> : null}</div></CardContent></Card>}

      {activeClinicId && productionDiagnostics && <Card className={productionDiagnostics.correctiveActions.length ? "border-amber-200 bg-amber-50/60 dark:border-amber-900/50 dark:bg-amber-950/20" : "border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/50 dark:bg-emerald-950/20"}><CardContent className="flex items-start gap-3 py-4 text-sm"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="font-semibold">Diagnóstico de produção · {productionDiagnostics.environment}</p><Badge variant="outline">fail-closed</Badge><Badge variant={productionDiagnostics.secrets.valuesExposed ? "destructive" : "default"}>valores redigidos</Badge></div><p className="mt-1 text-xs text-muted-foreground">Schema: {productionDiagnostics.schema.missingTables.length === 0 && productionDiagnostics.schema.missingTriggers.length === 0 ? "completo" : `${productionDiagnostics.schema.missingTables.length} tabelas e ${productionDiagnostics.schema.missingTriggers.length} triggers ausentes`} · keyring clínico: {productionDiagnostics.secrets.clinicalKeyringReady ? "ok" : "bloqueado"} · chave operacional: {productionDiagnostics.secrets.operationalKeyReady ? "ok" : "bloqueada"} · entitlement: {productionDiagnostics.entitlement.valid ? "ok" : "bloqueado"}</p>{productionDiagnostics.correctiveActions.length ? <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-amber-950 dark:text-amber-100">{productionDiagnostics.correctiveActions.map((action) => <li key={action}>{action}</li>)}</ul> : <p className="mt-2 text-xs text-emerald-800 dark:text-emerald-200">Nenhuma ação corretiva de ambiente foi detectada.</p>}</div></CardContent></Card>}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><ModuleMetric label="Abas disponíveis" value="20" /><ModuleMetric label="Módulos habilitados" value={`${enabledCount}/20`} tone="success" /><ModuleMetric label="Marcos registrados" value={`${completedCount}`} /><ModuleMetric label="Workspace" value={activeClinic?.name ?? state.organizationName} /></div>

      <Tabs value={state.activeModule} onValueChange={(value) => setState((current) => ({ ...current, activeModule: value as ModuleId }))} orientation="vertical" className="grid gap-5 lg:grid-cols-[250px_minmax(0,1fr)]">
        <div className="space-y-3 lg:sticky lg:top-4 lg:self-start"><div className="rounded-2xl border bg-card p-3"><FieldLabel htmlFor="module-search">Filtrar abas</FieldLabel><Input id="module-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Ex.: acesso, agenda, API" className="mt-2" /></div><TabsList className="grid h-auto w-full grid-cols-2 gap-1.5 bg-muted/35 p-2 lg:grid-cols-1 lg:items-stretch lg:justify-start">{visibleModules.map((module) => <TabsTrigger key={module.id} value={module.id} className="justify-start gap-2 px-2.5 py-2 text-left text-xs data-[state=active]:bg-card"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-[10px] font-bold text-primary">{module.number}</span><span className="min-w-0 truncate">{module.shortLabel}</span></TabsTrigger>)}</TabsList>{visibleModules.length === 0 && <p className="rounded-xl border border-dashed p-3 text-xs text-muted-foreground">Nenhuma aba encontrada.</p>}</div>
        <TabsContent value={state.activeModule} className="mt-0 min-w-0">
          <div className="space-y-5">
            <div className="flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-sm md:flex-row md:items-start md:justify-between"><div className="flex gap-4"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"><active.icon className="h-6 w-6" /></div><div><div className="mb-2 flex flex-wrap items-center gap-2"><span className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Aba {active.number} · {active.eyebrow}</span><StatusBadge status={active.status} /></div><h2 className="text-2xl font-semibold tracking-tight">{active.title}</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{active.description}</p></div></div><label className="flex shrink-0 items-center gap-3 rounded-xl border px-3 py-2 text-xs font-semibold"><input type="checkbox" aria-label={`Habilitar ${active.title} no piloto`} checked={state.moduleStates[active.id].enabled} disabled={pendingAction === `module:${active.id}`} onChange={(event) => toggleModule(active.id, event.target.checked)} className="h-4 w-4 accent-primary" />Habilitar no piloto</label></div>
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
