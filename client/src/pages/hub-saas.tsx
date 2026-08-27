import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2, Circle, Megaphone, MessageSquareText, Network, RefreshCw, Send, UsersRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { authFetch } from "@/lib/authClient";
import { queryClient } from "@/lib/queryClient";
import { useClinic } from "@/contexts/ClinicContext";

interface HubStep { id: string; key: string; label: string; required: boolean; completed: boolean; completedAt: string | null }
interface OnboardingData { steps: HubStep[]; progress: { percentage: number; requiredCompleted: number; requiredTotal: number } }
interface Partner { id: string; name: string; type: string; contactName: string | null; email: string | null; phone: string | null; specialty: string | null; status: string }
interface Referral { id: string; partnerId: string; partnerName: string; direction: string; patientName: string | null; status: string }
interface PartnersData { partners: Partner[]; referrals: Referral[]; metrics: { total: number; open: number; completed: number; inbound: number; outbound: number } }
interface Template { id: string; key: string; name: string; channels: string[]; system: boolean }
interface Campaign { id: string; name: string; templateName: string; status: string }
interface CommunicationData { templates: Template[]; campaigns: Campaign[]; metrics: { total: number; pending: number; sent: number; failed: number } }
interface FeedbackData { metrics: { nps: number | null; invited: number; answered: number; responseRate: number; promoters: number; passives: number; detractors: number }; surveys: Array<{ id: string; score: number | null; comment: string | null; status: string; createdAt: string }> }

async function hubGet<T>(path: string, clinicId: string): Promise<T> {
  const response = await authFetch(path, { headers: { "X-Clinic-Id": clinicId } });
  if (!response.ok) throw new Error((await response.json().catch(() => ({})) as { error?: string }).error ?? "Não foi possível carregar o Hub SaaS.");
  return response.json() as Promise<T>;
}

async function hubPost(path: string, clinicId: string, payload: Record<string, unknown>): Promise<void> {
  const response = await authFetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Clinic-Id": clinicId },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error((await response.json().catch(() => ({})) as { error?: string }).error ?? "Não foi possível salvar no Hub SaaS.");
}

const typeLabels: Record<string, string> = {
  school: "Escola", therapist: "Terapeuta", psychologist: "Psicólogo", psychiatrist: "Psiquiatra",
  hospital: "Hospital", laboratory: "Laboratório", social_service: "Serviço social", other: "Outro",
};

export default function HubSaasPage() {
  const { activeClinic, activeClinicId } = useClinic();
  const { toast } = useToast();
  const [partnerName, setPartnerName] = useState("");
  const [partnerType, setPartnerType] = useState("other");
  const [partnerEmail, setPartnerEmail] = useState("");
  const [partnerContact, setPartnerContact] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [templateKey, setTemplateKey] = useState("");
  const [templateBody, setTemplateBody] = useState("");
  const [deliveryRecipient, setDeliveryRecipient] = useState("");
  const [deliveryTemplateId, setDeliveryTemplateId] = useState("");
  const [deliveryChannel, setDeliveryChannel] = useState("email");

  const enabled = Boolean(activeClinicId);
  const onboarding = useQuery<OnboardingData>({
    queryKey: ["hub-onboarding", activeClinicId],
    enabled,
    queryFn: () => hubGet<OnboardingData>("/api/onboarding", activeClinicId!),
  });
  const partners = useQuery<PartnersData>({
    queryKey: ["hub-partners", activeClinicId],
    enabled,
    queryFn: () => hubGet<PartnersData>("/api/partners", activeClinicId!),
  });
  const communication = useQuery<CommunicationData>({
    queryKey: ["hub-communication", activeClinicId],
    enabled,
    queryFn: () => hubGet<CommunicationData>("/api/communication", activeClinicId!),
  });
  const feedback = useQuery<FeedbackData>({
    queryKey: ["hub-feedback", activeClinicId],
    enabled,
    queryFn: () => hubGet<FeedbackData>("/api/feedback/summary", activeClinicId!),
  });

  const refresh = () => {
    void Promise.all([
      onboarding.refetch(), partners.refetch(), communication.refetch(), feedback.refetch(),
    ]);
  };
  const mutation = useMutation({
    mutationFn: ({ path, payload }: { path: string; payload: Record<string, unknown> }) => hubPost(path, activeClinicId!, payload),
    onSuccess: () => {
      toast({ title: "Atualizado", description: "A alteração foi registrada no Hub SaaS." });
      void queryClient.invalidateQueries({ queryKey: ["hub-onboarding"] });
      void queryClient.invalidateQueries({ queryKey: ["hub-partners"] });
      void queryClient.invalidateQueries({ queryKey: ["hub-communication"] });
      void queryClient.invalidateQueries({ queryKey: ["hub-feedback"] });
    },
    onError: (error) => toast({ title: "Não foi possível concluir", description: error instanceof Error ? error.message : "Tente novamente.", variant: "destructive" }),
  });
  const currentData = useMemo(() => ({ onboarding: onboarding.data, partners: partners.data, communication: communication.data, feedback: feedback.data }), [onboarding.data, partners.data, communication.data, feedback.data]);

  if (!activeClinic) {
    return <div className="mx-auto max-w-5xl px-4 py-10"><Card><CardContent className="p-8"><h1 className="text-2xl font-semibold">Hub SaaS</h1><p className="mt-2 text-muted-foreground">Selecione uma clínica ativa para operar onboarding, parceiros, comunicação e NPS.</p></CardContent></Card></div>;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Network className="h-4 w-4" /> Hub SaaS · {activeClinic.name}</div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Operação, relacionamento e crescimento</h1>
          <p className="mt-2 max-w-3xl text-muted-foreground">Uma visão única para concluir a ativação da clínica, manter a rede de cuidado, coordenar comunicações e acompanhar a experiência das famílias.</p>
        </div>
        <Button variant="outline" onClick={refresh}><RefreshCw className="mr-2 h-4 w-4" /> Atualizar</Button>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Onboarding" value={`${onboarding.data?.progress.percentage ?? 0}%`} detail="etapas obrigatórias" icon={<CheckCircle2 className="h-5 w-5" />} />
        <Metric label="Parceiros" value={String(partners.data?.partners.length ?? 0)} detail={`${partners.data?.metrics.open ?? 0} encaminhamentos em aberto`} icon={<UsersRound className="h-5 w-5" />} />
        <Metric label="Comunicação" value={String(communication.data?.metrics.pending ?? 0)} detail="entregas aguardando envio" icon={<Megaphone className="h-5 w-5" />} />
        <Metric label="NPS" value={feedback.data?.metrics.nps === null || feedback.data?.metrics.nps === undefined ? "—" : String(feedback.data.metrics.nps)} detail={`${feedback.data?.metrics.answered ?? 0} respostas`} icon={<MessageSquareText className="h-5 w-5" />} />
      </div>

      <Tabs defaultValue="onboarding" className="space-y-4">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 md:grid-cols-4">
          <TabsTrigger value="onboarding">Ativação</TabsTrigger>
          <TabsTrigger value="partners">Parceiros</TabsTrigger>
          <TabsTrigger value="communication">Comunicação</TabsTrigger>
          <TabsTrigger value="feedback">NPS</TabsTrigger>
        </TabsList>

        <TabsContent value="onboarding">
          <Card>
            <CardHeader><CardTitle>Checklist persistente de ativação</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {(currentData.onboarding?.steps ?? []).map((step) => (
                <div key={step.id} className="flex items-center justify-between rounded-xl border p-4">
                  <div className="flex items-center gap-3">{step.completed ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <Circle className="h-5 w-5 text-muted-foreground" />}<div><p className="font-medium">{step.label}</p><p className="text-xs text-muted-foreground">{step.required ? "Obrigatória" : "Recomendada"}</p></div></div>
                  <Button size="sm" variant={step.completed ? "outline" : "default"} disabled={mutation.isPending} onClick={() => mutation.mutate({ path: "/api/onboarding", payload: { action: step.completed ? "reset_step" : "complete_step", stepKey: step.key } })}>{step.completed ? "Reabrir" : "Concluir"}</Button>
                </div>
              ))}
              {!onboarding.data && <p className="text-sm text-muted-foreground">Carregando checklist…</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="partners" className="space-y-4">
          <Card><CardHeader><CardTitle>Novo parceiro de cuidado</CardTitle></CardHeader><CardContent><div className="grid gap-4 md:grid-cols-4"><Field label="Nome" htmlFor="partner-name"><Input id="partner-name" value={partnerName} onChange={(event) => setPartnerName(event.target.value)} placeholder="Clínica, escola ou profissional" /></Field><Field label="Tipo" htmlFor="partner-type"><select id="partner-type" className="h-10 rounded-md border bg-background px-3 text-sm" value={partnerType} onChange={(event) => setPartnerType(event.target.value)}>{Object.entries(typeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field><Field label="Contato" htmlFor="partner-contact"><Input id="partner-contact" value={partnerContact} onChange={(event) => setPartnerContact(event.target.value)} placeholder="Nome do contato" /></Field><Field label="E-mail" htmlFor="partner-email"><Input id="partner-email" type="email" value={partnerEmail} onChange={(event) => setPartnerEmail(event.target.value)} placeholder="contato@exemplo.com" /></Field></div><Button className="mt-4" disabled={!partnerName.trim() || mutation.isPending} onClick={() => mutation.mutate({ path: "/api/partners", payload: { action: "create_partner", name: partnerName, type: partnerType, contactName: partnerContact, email: partnerEmail } })}>Adicionar parceiro</Button></CardContent></Card>
          <Card><CardHeader><CardTitle>Diretório da rede</CardTitle></CardHeader><CardContent className="space-y-3">{(partners.data?.partners ?? []).map((partner) => <div key={partner.id} className="flex flex-col gap-2 rounded-xl border p-4 md:flex-row md:items-center md:justify-between"><div><p className="font-medium">{partner.name}</p><p className="text-sm text-muted-foreground">{typeLabels[partner.type] ?? partner.type}{partner.contactName ? ` · ${partner.contactName}` : ""}{partner.email ? ` · ${partner.email}` : ""}</p></div><Badge variant={partner.status === "active" ? "secondary" : "outline"}>{partner.status === "active" ? "Ativo" : partner.status}</Badge></div>)}{!partners.data?.partners.length && <p className="text-sm text-muted-foreground">Nenhum parceiro cadastrado ainda.</p>}</CardContent></Card>
          <Card><CardHeader><CardTitle>Encaminhamentos recentes</CardTitle></CardHeader><CardContent className="space-y-3">{(partners.data?.referrals ?? []).map((referral) => <div key={referral.id} className="flex items-center justify-between rounded-xl border p-4"><div><p className="font-medium">{referral.partnerName}</p><p className="text-sm text-muted-foreground">{referral.direction === "inbound" ? "Recebido" : "Enviado"}{referral.patientName ? ` · ${referral.patientName}` : ""}</p></div><Badge>{referral.status}</Badge></div>)}{!partners.data?.referrals.length && <p className="text-sm text-muted-foreground">Os encaminhamentos aparecerão aqui.</p>}</CardContent></Card>
        </TabsContent>

        <TabsContent value="communication" className="space-y-4">
          <Card><CardHeader><CardTitle>Criar template reutilizável</CardTitle></CardHeader><CardContent><div className="grid gap-4 md:grid-cols-3"><Field label="Nome" htmlFor="template-name"><Input id="template-name" value={templateName} onChange={(event) => setTemplateName(event.target.value)} placeholder="Lembrete de retorno" /></Field><Field label="Chave" htmlFor="template-key"><Input id="template-key" value={templateKey} onChange={(event) => setTemplateKey(event.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))} placeholder="retorno_lembrete" /></Field><Field label="Corpo" htmlFor="template-body"><Input id="template-body" value={templateBody} onChange={(event) => setTemplateBody(event.target.value)} placeholder="Olá, {{recipient_name}}…" /></Field></div><Button className="mt-4" disabled={!templateName || !templateKey || !templateBody || mutation.isPending} onClick={() => mutation.mutate({ path: "/api/communication", payload: { action: "create_template", name: templateName, templateKey, body: templateBody, channels: ["email", "whatsapp"] } })}>Salvar template</Button></CardContent></Card>
          <Card><CardHeader><CardTitle>Enfileirar comunicação</CardTitle></CardHeader><CardContent><div className="grid gap-4 md:grid-cols-3"><Field label="Template" htmlFor="delivery-template"><select id="delivery-template" className="h-10 rounded-md border bg-background px-3 text-sm" value={deliveryTemplateId} onChange={(event) => setDeliveryTemplateId(event.target.value)}><option value="">Selecione</option>{(communication.data?.templates ?? []).map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}</select></Field><Field label="Canal" htmlFor="delivery-channel"><select id="delivery-channel" className="h-10 rounded-md border bg-background px-3 text-sm" value={deliveryChannel} onChange={(event) => setDeliveryChannel(event.target.value)}><option value="email">E-mail</option><option value="whatsapp">WhatsApp</option><option value="sms">SMS</option></select></Field><Field label="Destinatário" htmlFor="delivery-recipient"><Input id="delivery-recipient" value={deliveryRecipient} onChange={(event) => setDeliveryRecipient(event.target.value)} placeholder="E-mail ou telefone" /></Field></div><Button className="mt-4" disabled={!deliveryTemplateId || !deliveryRecipient || mutation.isPending} onClick={() => mutation.mutate({ path: "/api/communication", payload: { action: "queue_delivery", templateId: deliveryTemplateId, channel: deliveryChannel, recipient: deliveryRecipient } })}><Send className="mr-2 h-4 w-4" /> Enfileirar</Button></CardContent></Card>
          <Card><CardHeader><CardTitle>Campanhas</CardTitle></CardHeader><CardContent className="space-y-3">{(communication.data?.campaigns ?? []).map((campaign) => <div key={campaign.id} className="flex items-center justify-between rounded-xl border p-4"><div><p className="font-medium">{campaign.name}</p><p className="text-sm text-muted-foreground">{campaign.templateName}</p></div><Badge>{campaign.status}</Badge></div>)}{!communication.data?.campaigns.length && <p className="text-sm text-muted-foreground">Nenhuma campanha criada ainda.</p>}</CardContent></Card>
        </TabsContent>

        <TabsContent value="feedback">
          <Card><CardHeader><CardTitle>Experiência das famílias</CardTitle></CardHeader><CardContent className="space-y-6"><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5"><Metric label="NPS" value={feedback.data?.metrics.nps === null || feedback.data?.metrics.nps === undefined ? "—" : String(feedback.data.metrics.nps)} detail="índice atual" /><Metric label="Convites" value={String(feedback.data?.metrics.invited ?? 0)} detail="pesquisas criadas" /><Metric label="Respostas" value={String(feedback.data?.metrics.answered ?? 0)} detail={`${feedback.data?.metrics.responseRate ?? 0}% de resposta`} /><Metric label="Promotores" value={String(feedback.data?.metrics.promoters ?? 0)} detail="notas 9–10" /><Metric label="Detratores" value={String(feedback.data?.metrics.detractors ?? 0)} detail="notas 0–6" /></div><div className="space-y-3">{(feedback.data?.surveys ?? []).filter((survey) => survey.status === "answered").slice(0, 12).map((survey) => <div key={survey.id} className="rounded-xl border p-4"><div className="flex items-center justify-between"><Badge variant="secondary">Nota {survey.score}</Badge><span className="text-xs text-muted-foreground">{new Date(survey.createdAt).toLocaleDateString("pt-BR")}</span></div>{survey.comment && <p className="mt-3 text-sm text-muted-foreground">“{survey.comment}”</p>}</div>)}{!feedback.data?.surveys.some((survey) => survey.status === "answered") && <p className="text-sm text-muted-foreground">As respostas de NPS aparecerão aqui após a primeira consulta concluída.</p>}</div></CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) { return <div className="space-y-2"><Label htmlFor={htmlFor}>{label}</Label>{children}</div>; }
function Metric({ label, value, detail, icon }: { label: string; value: string; detail: string; icon?: React.ReactNode }) { return <Card><CardContent className="p-5"><div className="flex items-center justify-between text-muted-foreground"><span className="text-sm">{label}</span>{icon}</div><p className="mt-2 text-2xl font-semibold">{value}</p><p className="text-xs text-muted-foreground">{detail}</p></CardContent></Card>; }
