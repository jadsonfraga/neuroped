import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Copy,
  ExternalLink,
  Link2,
  Loader2,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { copyText } from "@/lib/shareText";

export interface ParentShareScale {
  id: string;
  name: string;
  fullName: string;
  respondentLabel: string;
}

interface ParentScaleSharePanelProps {
  scales: ParentShareScale[];
}

interface ShareResponse {
  token: string;
  expiresAt: string;
  scales: ParentShareScale[];
}

function formatExpiry(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "em 7 dias"
    : `até ${date.toLocaleDateString("pt-BR")}`;
}

function buildShareLink(token: string): string {
  if (typeof window === "undefined")
    return `/responder-escalas/${encodeURIComponent(token)}`;
  const origin = window.location.href.split("#", 1)[0];
  return `${origin}#/responder-escalas/${encodeURIComponent(token)}`;
}

export function ParentScaleSharePanel({ scales }: ParentScaleSharePanelProps) {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [patientId, setPatientId] = useState("");
  const [newLink, setNewLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [newPatientName, setNewPatientName] = useState("");

  const { data: patientsRaw, isLoading: loadingPatients } = useQuery<any>({
    queryKey: ["/api/patients"],
    enabled: isAuthenticated,
  });
  const patients: Array<{ id: string; name: string }> = useMemo(() => {
    const data = Array.isArray(patientsRaw)
      ? patientsRaw
      : (patientsRaw?.data ?? []);
    return data.filter(
      (patient: any) =>
        typeof patient?.id === "string" && typeof patient?.name === "string",
    );
  }, [patientsRaw]);

  const createPatientMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await apiRequest("POST", "/api/patients", { name });
      return response.json() as Promise<{ id: string }>;
    },
    onError: () =>
      toast({
        title: "Não foi possível criar o paciente",
        description: "O link não foi criado.",
        variant: "destructive",
      }),
  });

  const createShareMutation = useMutation({
    mutationFn: async () => {
      let resolvedPatientId = patientId;
      if (patientId === "__new__") {
        if (!newPatientName.trim())
          throw new Error("Informe o nome do paciente.");
        const created = await createPatientMutation.mutateAsync(
          newPatientName.trim(),
        );
        resolvedPatientId = created.id;
      }
      if (!resolvedPatientId || resolvedPatientId === "__empty__")
        throw new Error("Selecione um paciente.");
      const selectedScales = scales.filter((scale) =>
        selectedIds.includes(scale.id),
      );
      if (selectedScales.length === 0)
        throw new Error("Selecione ao menos uma escala.");
      const response = await apiRequest("POST", "/api/scale-shares", {
        patientId: resolvedPatientId,
        scales: selectedScales.map(({ id, name, fullName }) => ({
          id,
          name,
          fullName,
        })),
      });
      return response.json() as Promise<ShareResponse>;
    },
    onSuccess: (data) => {
      const link = buildShareLink(data.token);
      setNewLink(link);
      setCopied(false);
      toast({
        title: "Link seguro criado",
        description: `Envie aos pais; o acesso expira ${formatExpiry(data.expiresAt)}.`,
      });
    },
    onError: (error) =>
      toast({
        title: "Não foi possível criar o link",
        description:
          error instanceof Error
            ? error.message
            : "Confira o paciente e tente novamente.",
        variant: "destructive",
      }),
  });

  function toggleScale(id: string) {
    setNewLink(null);
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  function selectAll() {
    setNewLink(null);
    setSelectedIds((current) =>
      current.length === scales.length ? [] : scales.map((scale) => scale.id),
    );
  }

  async function copyLink() {
    if (!newLink) return;
    const ok = await copyText(newLink);
    if (!ok) {
      toast({
        title: "Não foi possível copiar",
        description: "Selecione e copie o link manualmente.",
        variant: "destructive",
      });
      return;
    }
    setCopied(true);
    toast({
      title: "Link copiado",
      description: "Agora cole no WhatsApp, e-mail ou canal seguro da família.",
    });
  }

  const busy = createShareMutation.isPending || createPatientMutation.isPending;
  const canCreate =
    isAuthenticated && Boolean(patientId) && selectedIds.length > 0 && !busy;

  return (
    <Card
      className="overflow-hidden border-emerald-300/50 bg-gradient-to-br from-emerald-50/70 via-card to-blue-50/60 dark:border-emerald-800/50 dark:from-emerald-950/20 dark:via-card dark:to-blue-950/20"
      data-testid="parent-scale-share-panel"
    >
      <CardHeader className="gap-2 border-b border-emerald-200/60 p-4 dark:border-emerald-900/50">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm">
            <Link2 className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <CardTitle className="text-base text-foreground">
              Enviar escalas selecionadas aos pais
            </CardTitle>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Crie um único link temporário. A família responde remotamente e
              cada resultado fica guardado no paciente escolhido.
            </p>
          </div>
          <Badge className="shrink-0 bg-emerald-100 text-[10px] text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
            7 dias
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-4">
        {scales.length === 0 ? (
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-800/50 dark:bg-amber-950/20 dark:text-amber-200">
            Nenhuma escala preenchível por pais apareceu neste perfil.
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <Users className="h-4 w-4 text-emerald-600" /> Escalas para este
                envio
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={selectAll}
                className="h-8 text-xs text-primary"
              >
                {selectedIds.length === scales.length
                  ? "Limpar"
                  : "Selecionar todas"}
              </Button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {scales.map((scale) => {
                const selected = selectedIds.includes(scale.id);
                return (
                  <button
                    key={scale.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleScale(scale.id)}
                    className={`rounded-xl border p-3 text-left transition active:scale-[0.99] ${selected ? "border-emerald-500 bg-emerald-500/10 shadow-sm" : "border-border bg-background hover:border-emerald-400/60 hover:bg-muted/40"}`}
                    data-testid={`parent-share-scale-${scale.id}`}
                  >
                    <div className="flex items-start gap-2">
                      <span
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-xs font-bold ${selected ? "border-emerald-600 bg-emerald-600 text-white" : "border-border text-transparent"}`}
                      >
                        ✓
                      </span>
                      <span className="min-w-0">
                        <strong className="block text-sm text-foreground">
                          {scale.name}
                        </strong>
                        <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">
                          {scale.fullName}
                        </span>
                        <span className="mt-1 block text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                          {scale.respondentLabel}
                        </span>
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {!isAuthenticated ? (
              <div className="rounded-xl border border-blue-300 bg-blue-50 p-3 text-xs leading-relaxed text-blue-900 dark:border-blue-800/50 dark:bg-blue-950/20 dark:text-blue-200">
                Entre na área profissional para escolher o paciente e gerar um
                link com persistência.
              </div>
            ) : (
              <>
                <div className="space-y-1">
                  <label
                    className="text-xs font-semibold text-muted-foreground"
                    htmlFor="parent-share-patient"
                  >
                    Paciente que receberá os resultados
                  </label>
                  <Select
                    value={patientId}
                    onValueChange={(value) => {
                      setPatientId(value);
                      setNewLink(null);
                    }}
                  >
                    <SelectTrigger
                      id="parent-share-patient"
                      data-testid="parent-share-patient"
                    >
                      <SelectValue
                        placeholder={
                          loadingPatients
                            ? "Carregando pacientes…"
                            : "Selecionar paciente…"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__new__">
                        + Criar novo paciente
                      </SelectItem>
                      {patients.length === 0 && !loadingPatients && (
                        <SelectItem value="__empty__" disabled>
                          Nenhum paciente cadastrado
                        </SelectItem>
                      )}
                      {patients.map((patient) => (
                        <SelectItem key={patient.id} value={patient.id}>
                          {patient.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {patientId === "__new__" && (
                  <div className="space-y-1">
                    <label
                      className="text-xs font-semibold text-muted-foreground"
                      htmlFor="parent-share-new-patient"
                    >
                      Nome do paciente
                    </label>
                    <Input
                      id="parent-share-new-patient"
                      value={newPatientName}
                      onChange={(event) =>
                        setNewPatientName(event.target.value)
                      }
                      placeholder="Nome do paciente"
                    />
                  </div>
                )}
                <Button
                  type="button"
                  onClick={() => createShareMutation.mutate()}
                  disabled={
                    !canCreate ||
                    (patientId === "__new__" && !newPatientName.trim())
                  }
                  className="h-11 w-full gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
                  data-testid="button-create-parent-share"
                >
                  {busy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Link2 className="h-4 w-4" />
                  )}
                  {busy
                    ? "Guardando e criando link…"
                    : `Criar link para ${selectedIds.length || 0} escala${selectedIds.length === 1 ? "" : "s"}`}
                </Button>
              </>
            )}

            {newLink && (
              <div className="space-y-3 rounded-xl border border-emerald-300 bg-white/80 p-3 dark:border-emerald-800/60 dark:bg-emerald-950/20">
                <div className="flex items-start gap-2 text-xs leading-relaxed text-emerald-900 dark:text-emerald-100">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <span>
                    <strong>Link pronto e associado ao paciente.</strong> O
                    token é temporário; o resultado será guardado depois que a
                    família enviar.
                  </span>
                </div>
                <Input
                  readOnly
                  value={newLink}
                  aria-label="Link seguro para os pais"
                  data-testid="input-parent-share-link"
                />
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={copyLink}
                    className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
                    data-testid="button-copy-parent-share-link"
                  >
                    <Copy className="h-4 w-4" />
                    {copied ? "Copiado" : "Copiar link"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      window.open(newLink, "_blank", "noopener,noreferrer")
                    }
                    className="gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Abrir prévia
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
