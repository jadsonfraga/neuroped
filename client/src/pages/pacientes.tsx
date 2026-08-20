import { useEffect, useMemo, useState, useRef } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  fetchClinicalRuntime,
  isClinicalLive,
  isClinicalReadinessBlocked,
  isLegacyClinicalRetired,
} from "@/lib/clinicalRuntime";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  Plus,
  Search,
  X,
  Pencil,
  Trash2,
  ArrowRight,
  Calendar,
  ShieldCheck,
  Download,
  Upload,
  Loader2,
} from "lucide-react";
import { differenceInYears, parseISO } from "date-fns";
import { softTap, softTick, softSuccess, softError } from "@/lib/softSounds";
import { haptic } from "@/lib/haptic";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/ui/VisualStates";
import { easing, duration } from "@/lib/motion";
import {
  getWithRateLimitBackoff,
  loadAllPatientResults,
} from "@/lib/patientResultsPagination";

function calcAge(birthDate: string | null | undefined): string | null {
  if (!birthDate) return null;
  try {
    const years = differenceInYears(new Date(), parseISO(birthDate));
    return `${years} ano${years !== 1 ? "s" : ""}`;
  } catch {
    return null;
  }
}

const BACKUP_PAGE_SIZE = 50;
const MAX_BACKUP_PAGES = 10_000;

interface PatientPage {
  rows: any[];
  total: number | null;
  hasMore: boolean | null;
}

function normalizePatientRecord(patient: any): any {
  const profile = patient?.profile && typeof patient.profile === "object"
    ? patient.profile
    : patient;
  return {
    ...patient,
    name: patient?.name ?? profile?.name ?? "Paciente sem nome",
    birthDate: patient?.birthDate ?? profile?.birthDate ?? null,
    notes: patient?.notes ?? profile?.notes ?? null,
  };
}

function parsePatientPage(payload: any): PatientPage {
  if (Array.isArray(payload)) {
    return { rows: payload, total: payload.length, hasMore: false };
  }

  if (!payload || !Array.isArray(payload.data)) {
    throw new Error("Resposta inválida ao listar pacientes para backup.");
  }

  const rawTotal = payload.total ?? payload.pagination?.total;
  const total =
    typeof rawTotal === "number" &&
    Number.isSafeInteger(rawTotal) &&
    rawTotal >= 0
      ? rawTotal
      : null;
  const hasMore =
    typeof payload.pagination?.hasMore === "boolean"
      ? payload.pagination.hasMore
      : null;

  if (total === null && hasMore === null) {
    throw new Error("A API não informou como concluir a lista de pacientes.");
  }

  return { rows: payload.data, total, hasMore };
}

async function loadAllPatientsForBackup(): Promise<any[]> {
  const all: any[] = [];
  const seenIds = new Set<string>();
  let expectedTotal: number | null = null;
  let page = 1;
  let offset = 0;

  while (page <= MAX_BACKUP_PAGES) {
    // Cloudflare Pages pagina por `page`; o servidor Node pagina por `offset`.
    // Enviar ambos mantém o backup completo nos dois runtimes oficiais.
    const response = await getWithRateLimitBackoff(
      `/api/patients?page=${page}&limit=${BACKUP_PAGE_SIZE}&offset=${offset}`,
    );
    const current = parsePatientPage(await response.json());

    if (current.total !== null) {
      if (expectedTotal !== null && current.total !== expectedTotal) {
        throw new Error("A lista de pacientes mudou durante o backup.");
      }
      expectedTotal = current.total;
    }

    for (const patient of current.rows) {
      const rawId = patient?.id;
      const id = typeof rawId === "string" ? rawId.trim() : "";
      if (!id || seenIds.has(id)) {
        throw new Error("A paginação de pacientes ficou inconsistente.");
      }
      seenIds.add(id);
      all.push(patient);
    }

    if (expectedTotal !== null && all.length > expectedTotal) {
      throw new Error(
        "A API retornou mais pacientes do que o total informado.",
      );
    }

    const reachedTotal = expectedTotal !== null && all.length === expectedTotal;
    if (reachedTotal && current.hasMore === true) {
      throw new Error(
        "A API informou páginas extras após o total de pacientes.",
      );
    }
    if (reachedTotal || current.hasMore === false) {
      if (expectedTotal !== null && all.length !== expectedTotal) {
        throw new Error(
          "A API encerrou a paginação antes de carregar todos os pacientes.",
        );
      }
      return all;
    }

    if (current.rows.length === 0) {
      throw new Error(
        "A API retornou uma página vazia antes de concluir o backup.",
      );
    }

    offset += current.rows.length;
    page += 1;
  }

  throw new Error("O backup excedeu o limite seguro de paginação.");
}

export default function PacientesPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formBirth, setFormBirth] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [confirmingDelete, setConfirmingDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [backupLoading, setBackupLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeClinicId, setActiveClinicId] = useState(() => {
    try {
      return sessionStorage.getItem("neuroped:active-clinic") ?? "";
    } catch {
      return "";
    }
  });

  const runtimeQuery = useQuery({
    queryKey: ["clinical-runtime"],
    queryFn: fetchClinicalRuntime,
    staleTime: 30_000,
  });
  const runtime = runtimeQuery.data;
  const liveEnabled = isClinicalLive(runtime);
  const legacyRetired = isLegacyClinicalRetired(runtime);
  const readinessBlocked = isClinicalReadinessBlocked(runtime);

  const tenantsQuery = useQuery<any>({
    queryKey: ["/api/tenants"],
    enabled: liveEnabled,
  });
  const clinics: any[] = useMemo(
    () => (Array.isArray(tenantsQuery.data?.data) ? tenantsQuery.data.data : []),
    [tenantsQuery.data],
  );

  useEffect(() => {
    if (!liveEnabled) return;
    if (activeClinicId && clinics.some((clinic) => clinic.id === activeClinicId)) return;
    setActiveClinicId(clinics[0]?.id ?? "");
  }, [activeClinicId, clinics, liveEnabled]);

  useEffect(() => {
    if (!activeClinicId) return;
    try {
      sessionStorage.setItem("neuroped:active-clinic", activeClinicId);
    } catch {
      // A seleção de tenant não impede o fluxo quando storage está indisponível.
    }
  }, [activeClinicId]);

  const patientsQuery = useQuery<any>({
    queryKey: [liveEnabled ? "/api/live/patients" : "/api/patients", liveEnabled ? activeClinicId : "demo"],
    enabled: !runtimeQuery.isLoading && (!liveEnabled || Boolean(activeClinicId)) && !readinessBlocked,
    queryFn: async () => {
      const path = liveEnabled
        ? `/api/live/patients?clinicId=${encodeURIComponent(activeClinicId)}`
        : "/api/patients";
      const response = await apiRequest("GET", path);
      return response.json();
    },
  });
  const patientsRaw = patientsQuery.data;
  const isLoading = runtimeQuery.isLoading || tenantsQuery.isLoading || patientsQuery.isLoading;
  const isError = runtimeQuery.isError || tenantsQuery.isError || patientsQuery.isError;
  const refetchPatients = () => { void patientsQuery.refetch(); };
  const rawPatients: any[] = Array.isArray(patientsRaw)
    ? patientsRaw
    : (patientsRaw?.data ?? []);
  const patients: any[] = rawPatients.map(normalizePatientRecord);

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const path = liveEnabled ? "/api/live/patients" : "/api/patients";
      const payload = liveEnabled ? { ...data, clinicId: activeClinicId } : data;
      const res = await apiRequest("POST", path, payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [liveEnabled ? "/api/live/patients" : "/api/patients"] });
      resetForm();
      softSuccess();
      haptic.success();
      toast({ title: "Paciente criado!" });
    },
    onError: () => {
      softError();
      haptic.error();
      toast({ title: "Erro ao criar paciente.", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      if (liveEnabled) throw new Error("Edição de pacientes LIVE ainda depende do contrato de correção auditável.");
      const res = await apiRequest("PATCH", `/api/patients/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [liveEnabled ? "/api/live/patients" : "/api/patients"] });
      resetForm();
      softSuccess();
      haptic.success();
      toast({ title: "Paciente atualizado!" });
    },
    onError: () => {
      softError();
      haptic.error();
      toast({ title: "Erro ao atualizar paciente.", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (liveEnabled) throw new Error("Exclusão de pacientes LIVE ainda depende do contrato de arquivamento auditável.");
      await apiRequest("DELETE", `/api/patients/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [liveEnabled ? "/api/live/patients" : "/api/patients"] });
      softSuccess();
      haptic.success();
      toast({ title: "Paciente removido." });
      setConfirmingDelete(null);
    },
    onError: () => {
      softError();
      haptic.error();
      toast({ title: "Erro ao remover paciente.", variant: "destructive" });
    },
  });

  function resetForm() {
    setFormName("");
    setFormBirth("");
    setFormNotes("");
    setEditId(null);
    setDialogOpen(false);
  }

  function openEdit(p: any) {
    setEditId(p.id);
    setFormName(p.name);
    setFormBirth(p.birthDate || "");
    setFormNotes(p.notes || "");
    setDialogOpen(true);
  }

  async function handleBackup() {
    if (liveEnabled) {
      toast({
        title: "Backup LIVE ainda não habilitado",
        description: "A exportação clínica precisa do contrato de portabilidade, criptografia e auditoria antes do piloto.",
        variant: "destructive",
      });
      return;
    }
    if (patients.length === 0) {
      toast({
        title: "Nenhum paciente para exportar.",
        variant: "destructive",
      });
      return;
    }
    setBackupLoading(true);
    try {
      const backupPatients = await loadAllPatientsForBackup();
      const results: Record<string, any[]> = {};
      for (const patient of backupPatients) {
        const patientId = String(patient.id);
        results[patientId] = await loadAllPatientResults(patientId);
      }
      const backup = {
        version: "1.0",
        app: "NeuroPed",
        exportedAt: new Date().toISOString(),
        patients: backupPatients,
        results,
      };
      const blob = new Blob([JSON.stringify(backup, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `neuroped-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 2_000);
      softSuccess();
      haptic.success();
      toast({
        title: `Backup completo de ${backupPatients.length} paciente(s) exportado.`,
        description:
          "Todos os pacientes e resultados foram carregados antes de salvar o arquivo.",
      });
    } catch {
      softError();
      haptic.error();
      toast({
        title: "Backup não gerado.",
        description:
          "Não foi possível carregar todos os pacientes e resultados. Nenhum arquivo parcial foi salvo.",
        variant: "destructive",
      });
    } finally {
      setBackupLoading(false);
    }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (liveEnabled) {
      if (e.target) e.target.value = "";
      toast({
        title: "Importação LIVE ainda não habilitada",
        description: "A importação clínica precisa passar pela normalização do Clinical Core e trilha de auditoria.",
        variant: "destructive",
      });
      return;
    }
    if (!file) return;
    e.target.value = "";
    setImportLoading(true);
    try {
      const backup = JSON.parse(await file.text());
      if (
        !backup.version ||
        !Array.isArray(backup.patients) ||
        !backup.results ||
        typeof backup.results !== "object" ||
        Array.isArray(backup.results) ||
        backup.patients.some(
          (patient: unknown) =>
            !patient ||
            typeof patient !== "object" ||
            typeof (patient as { id?: unknown }).id !== "string" ||
            typeof (patient as { name?: unknown }).name !== "string" ||
            !Array.isArray(backup.results[(patient as { id: string }).id]),
        )
      ) {
        toast({
          title: "Backup incompleto ou inválido.",
          description:
            "O arquivo precisa conter todos os pacientes e suas listas de resultados.",
          variant: "destructive",
        });
        return;
      }
      let imported = 0;
      let partial = 0;
      let skipped = 0;
      let failedResults = 0;
      for (const p of backup.patients) {
        try {
          const pd: any = { name: p.name };
          if (p.birthDate) pd.birthDate = p.birthDate;
          if (p.notes) pd.notes = p.notes;
          const res = await apiRequest("POST", "/api/patients", pd);
          const newPatient = await res.json();
          let patientComplete = true;
          for (const r of backup.results[p.id]) {
            try {
              const responses = Array.isArray(r.responses)
                ? r.responses
                : Array.isArray(r.answers)
                  ? r.answers
                  : [];
              if (responses.length === 0) {
                throw new Error("Resultado sem respostas importáveis.");
              }
              await apiRequest("POST", "/api/results", {
                patientId: newPatient.id,
                scaleName: r.scaleName,
                responses,
                answers: responses,
                patientAge: r.patientAge,
              });
            } catch {
              failedResults++;
              patientComplete = false;
            }
          }
          if (patientComplete) imported++;
          else partial++;
        } catch {
          skipped++;
        }
      }
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      if (partial > 0 || skipped > 0 || failedResults > 0) {
        softError();
        haptic.error();
        toast({
          title: "Importação concluída com pendências.",
          description: `${imported} paciente(s) integralmente importado(s); ${partial} criado(s) com resultados incompletos; ${skipped} não criado(s). ${failedResults} resultado(s) falharam.`,
          variant: "destructive",
        });
      } else {
        softSuccess();
        haptic.success();
        toast({ title: `${imported} paciente(s) integralmente importado(s).` });
      }
    } catch {
      softError();
      haptic.error();
      toast({
        title: "Backup corrompido ou formato inválido.",
        variant: "destructive",
      });
    } finally {
      setImportLoading(false);
    }
  }

  function handleSubmit() {
    if (liveEnabled && !activeClinicId) {
      toast({
        title: "Selecione uma clínica",
        description: "O paciente LIVE precisa pertencer a um tenant clínico explícito.",
        variant: "destructive",
      });
      return;
    }
    const data: any = { name: formName.trim() };
    if (formBirth) data.birthDate = formBirth;
    if (formNotes.trim()) data.notes = formNotes.trim();

    if (editId) {
      updateMutation.mutate({ id: editId, data });
    } else {
      createMutation.mutate(data);
    }
  }

  const q = search
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  const filtered = q
    ? patients.filter((p: any) =>
        (p.name || "")
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .includes(q),
      )
    : patients;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: duration.normal, ease: easing.smooth }}
        className="flex items-center gap-3"
      >
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center shadow-md">
          <Users className="w-5 h-5 text-white" strokeWidth={1.75} />
        </div>
        <div className="flex-1">
          <h1
            className="text-xl text-foreground leading-tight"
            style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
          >
            Meus Pacientes
          </h1>
          <p className="text-xs text-muted-foreground italic">
            Cadastro, histórico e exportação com aviso de privacidade visível
          </p>
        </div>
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            if (!open) resetForm();
            setDialogOpen(open);
          }}
        >
          <DialogTrigger asChild>
            <Button
              size="sm"
              onClick={() => {
                softTap();
                haptic.tap();
              }}
              className="gap-1.5 btn-glow"
              disabled={readinessBlocked || (liveEnabled && !activeClinicId)}
              data-testid="button-new-patient"
            >
              <Plus className="w-3.5 h-3.5" /> Novo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editId ? "Editar Paciente" : "Novo Paciente"}
              </DialogTitle>
              <DialogDescription>
                {editId
                  ? "Atualize os dados do paciente."
                  : "Preencha os dados para cadastrar."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="space-y-1">
                <label
                  htmlFor="patient-name"
                  className="text-xs text-muted-foreground"
                >
                  Nome completo *
                </label>
                <Input
                  id="patient-name"
                  placeholder="Nome completo *"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  data-testid="input-patient-name"
                />
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="patient-birth"
                  className="text-xs text-muted-foreground"
                >
                  Data de nascimento
                </label>
                <Input
                  id="patient-birth"
                  type="date"
                  value={formBirth}
                  onChange={(e) => setFormBirth(e.target.value)}
                  data-testid="input-patient-birth"
                />
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="patient-notes"
                  className="text-xs text-muted-foreground"
                >
                  Observações
                </label>
                <Textarea
                  id="patient-notes"
                  placeholder="Observações (opcional)"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  rows={3}
                  data-testid="input-patient-notes"
                />
              </div>
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] leading-relaxed text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">
                <strong>Consentimento e dados:</strong> registre apenas dados
                necessários, confirme autorização do responsável e exporte
                backup antes de excluir informações clínicas.
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={() => {
                  softTap();
                  haptic.tap();
                  handleSubmit();
                }}
                disabled={
                  !formName.trim() ||
                  createMutation.isPending ||
                  updateMutation.isPending
                }
                className="w-full"
                data-testid="button-save-patient"
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "Salvando..."
                  : editId
                    ? "Atualizar"
                    : "Cadastrar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>

      {liveEnabled && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div className="space-y-1 flex-1">
                <p className="text-sm font-bold text-foreground">Clínica ativa do Clinical Core LIVE</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  O tenant é obrigatório para separar dados clínicos. A seleção fica somente nesta sessão e não contém dados do paciente.
                </p>
              </div>
            </div>
            {clinics.length > 0 ? (
              <select
                aria-label="Clínica ativa"
                value={activeClinicId}
                onChange={(event) => setActiveClinicId(event.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="">Selecione uma clínica</option>
                {clinics.map((clinic) => (
                  <option key={clinic.id} value={clinic.id}>
                    {clinic.name} — {clinic.role}
                  </option>
                ))}
              </select>
            ) : (
              <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">
                Nenhuma clínica ativa foi encontrada para esta conta.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {readinessBlocked && (
        <Card className="border-amber-300 bg-amber-50/70 dark:border-amber-900/50 dark:bg-amber-950/20">
          <CardContent className="p-4 space-y-2">
            <p className="text-sm font-bold text-amber-900 dark:text-amber-100">Clinical Core LIVE ainda bloqueado</p>
            <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-200">
              As rotas clínicas legadas foram aposentadas porque o backend persistente está ativo. Nenhum paciente real será lido ou gravado neste modo. Habilite o LIVE somente após concluir keyring, tenant, LGPD, migração e restore.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="border-primary/15 bg-primary/5 sm:col-span-2">
          <CardContent className="p-3 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-bold text-foreground">
                Dados clínicos sob responsabilidade profissional
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {legacyRetired
                  ? "As rotas demo foram aposentadas neste backend persistente. O acesso clínico depende do Clinical Core LIVE, tenant explícito, autorização e criptografia dedicada."
                  : "A API de pacientes não é cacheada pelo service worker. Em homologação sem backend persistente, use apenas dados fictícios e apague o armazenamento ao terminar em dispositivo compartilhado."}
              </p>
            </div>
          </CardContent>
        </Card>
        {liveEnabled ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] leading-relaxed text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">
            Backup e importação LIVE permanecem bloqueados até o contrato de portabilidade cifrada e auditoria ser concluído.
          </div>
        ) : (
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-full min-h-[52px] flex-col gap-1"
            onClick={() => {
              softTap();
              haptic.tap();
              handleBackup();
            }}
            disabled={backupLoading || patients.length === 0}
            title="Exportar todos os pacientes e resultados como JSON"
          >
            {backupLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Backup
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-full min-h-[52px] flex-col gap-1"
            onClick={() => {
              softTap();
              haptic.tap();
              fileInputRef.current?.click();
            }}
            disabled={importLoading}
            title="Importar pacientes de um backup NeuroPed (.json)"
          >
            {importLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            Importar
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            aria-label="Importar pacientes de um backup NeuroPed (.json)"
            className="hidden"
            onChange={handleImport}
          />
        </div>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar paciente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 pr-10 h-10 rounded-xl"
          data-testid="input-search-patients"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Patient list */}
      {isLoading ? (
        <LoadingState rows={4} label="Carregando pacientes..." />
      ) : isError ? (
        <ErrorState
          message="Não foi possível carregar os pacientes. Verifique a conexão e tente novamente."
          onRetry={() => {
            void refetchPatients();
          }}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Users className="w-7 h-7 text-muted-foreground" />}
          title={
            patients.length === 0
              ? "Nenhum paciente cadastrado"
              : "Nenhum resultado encontrado"
          }
          description={
            patients.length === 0
              ? "Cadastre o primeiro paciente para começar o acompanhamento."
              : "Tente outro termo de busca."
          }
          action={
            patients.length === 0
              ? {
                  label: "Cadastrar paciente",
                  onClick: () => {
                    softTap();
                    haptic.tap();
                    setDialogOpen(true);
                  },
                }
              : undefined
          }
        />
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
          }}
          className="grid gap-3 sm:grid-cols-2"
        >
          {filtered.map((p: any) => {
            const age = calcAge(p.birthDate);
            return (
              <motion.div
                key={p.id}
                variants={{
                  hidden: { opacity: 0, y: 10 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: {
                      duration: duration.normal,
                      ease: easing.smooth,
                    },
                  },
                }}
              >
                <Card className="card-premium group">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <Link href={`/paciente/${p.id}`}>
                        <div
                          className="cursor-pointer flex-1"
                          onClick={() => {
                            softTap();
                            haptic.tap();
                          }}
                        >
                          <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                            {p.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            {age && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="w-3 h-3" /> {age}
                              </span>
                            )}
                          </div>
                          {p.notes && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {p.notes}
                            </p>
                          )}
                        </div>
                      </Link>
                      {!liveEnabled && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => {
                            softTick();
                            haptic.tap();
                            openEdit(p);
                          }}
                          data-testid={`button-edit-${p.id}`}
                        >
                          <Pencil className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          onClick={() => {
                            softTap();
                            haptic.warning();
                            setConfirmingDelete({ id: p.id, name: p.name });
                          }}
                          data-testid={`button-delete-${p.id}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                      )}
                    </div>
                    <Link href={`/paciente/${p.id}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          softTap();
                          haptic.tap();
                        }}
                        className="w-full gap-1.5 text-xs mt-1"
                      >
                        Ver detalhes <ArrowRight className="w-3 h-3" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Confirm delete dialog */}
      {!liveEnabled && (
      <ConfirmDialog
        open={!!confirmingDelete}
        onClose={() => setConfirmingDelete(null)}
        onConfirm={() => {
          if (confirmingDelete) deleteMutation.mutate(confirmingDelete.id);
        }}
        title={`Remover ${confirmingDelete?.name ?? "paciente"}?`}
        description="Esta ação remove o paciente e todos os resultados associados. Não pode ser desfeita."
        confirmLabel="Remover"
        variant="destructive"
        loading={deleteMutation.isPending}
      />
      )}
    </div>
  );
}
