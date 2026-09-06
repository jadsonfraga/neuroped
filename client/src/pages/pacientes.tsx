import { useEffect, useState, useRef } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
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
import { useAuth } from "@/contexts/AuthContext";
import { useClinic } from "@/contexts/ClinicContext";
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
  const { accessMode, isAuthenticated } = useAuth();
  const { activeClinicId } = useClinic();
  const isRemoteClinical = accessMode === "remote" && isAuthenticated;
  const liveContextReady = isRemoteClinical && Boolean(activeClinicId);
  const [search, setSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [patientPage, setPatientPage] = useState(1);
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

  useEffect(() => {
    const timer = window.setTimeout(() => setSearchQuery(search.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPatientPage(1);
  }, [searchQuery]);

  const PATIENT_PAGE_SIZE = 50;
  const patientQueryKey = isRemoteClinical
    ? `/api/live/patients?clinicId=${encodeURIComponent(activeClinicId ?? "")}`
    : `/api/patients?q=${encodeURIComponent(searchQuery)}&page=${patientPage}&limit=${PATIENT_PAGE_SIZE}`;
  const {
    data: patientsRaw,
    isLoading,
    isFetching,
    isError,
    refetch: refetchPatients,
  } = useQuery<any>({
    queryKey: [patientQueryKey],
    enabled: !isRemoteClinical || liveContextReady,
    placeholderData: (previousData: any) => previousData,
  });
  // A API retorna { data, total, page, limit }; aceita array puro por robustez.
  const patientPayload: any = patientsRaw;
  const rawPatients: any[] = Array.isArray(patientPayload)
    ? patientPayload
    : (patientPayload?.data ?? []);
  const patients: any[] = isRemoteClinical
    ? rawPatients
        .map((patient) => ({
          ...patient,
          name: patient.profile?.name ?? "Paciente sem nome",
          birthDate: patient.profile?.birthDate ?? null,
          notes: patient.profile?.notes ?? null,
        }))
        .filter((patient) => {
          const needle = searchQuery.toLocaleLowerCase("pt-BR");
          return !needle || String(patient.name ?? "").toLocaleLowerCase("pt-BR").includes(needle);
        })
    : rawPatients;
  const patientTotal = isRemoteClinical
    ? patients.length
    : Array.isArray(patientPayload)
      ? patientPayload.length
      : typeof patientPayload?.total === "number" && Number.isFinite(patientPayload.total)
        ? Math.max(0, patientPayload.total)
        : patients.length;
  const totalPatientPages = Math.max(1, Math.ceil(patientTotal / PATIENT_PAGE_SIZE));

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest(
        "POST",
        isRemoteClinical ? "/api/live/patients" : "/api/patients",
        isRemoteClinical ? { ...data, clinicId: activeClinicId } : data,
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [patientQueryKey] });
      setPatientPage(1);
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
      const res = await apiRequest(
        "PATCH",
        isRemoteClinical ? `/api/live/patients/${encodeURIComponent(id)}` : `/api/patients/${id}`,
        isRemoteClinical ? { ...data, clinicId: activeClinicId } : data,
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [patientQueryKey] });
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
      const url = isRemoteClinical
        ? `/api/live/patients/${encodeURIComponent(id)}?clinicId=${encodeURIComponent(activeClinicId ?? "")}`
        : `/api/patients/${id}`;
      await apiRequest("DELETE", url);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [patientQueryKey] });
      setPatientPage((current) => (current > 1 && patients.length === 1 ? current - 1 : current));
      softSuccess();
      haptic.success();
      toast({ title: isRemoteClinical ? "Paciente arquivado." : "Paciente removido." });
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
    if (isRemoteClinical) {
      if (!activeClinicId) {
        toast({ title: "Selecione uma clínica ativa antes de exportar.", variant: "destructive" });
        return;
      }
      setBackupLoading(true);
      try {
        await apiRequest("POST", "/api/live/governance", {
          clinicId: activeClinicId,
          requestType: "export",
          scope: "clinic",
        });
        toast({
          title: "Solicitação de exportação registrada.",
          description: "A exportação LIVE seguirá o workflow auditável da clínica.",
        });
      } catch {
        toast({ title: "Não foi possível solicitar a exportação LIVE.", variant: "destructive" });
      } finally {
        setBackupLoading(false);
      }
      return;
    }
    if (patientTotal === 0) {
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
    if (isRemoteClinical) {
      e.target.value = "";
      toast({
        title: "Importação LIVE indisponível nesta etapa.",
        description: "Use o fluxo controlado de migração para não contornar a fronteira tenant-aware.",
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
    if (isRemoteClinical && !activeClinicId) {
      toast({ title: "Selecione uma clínica ativa antes de salvar.", variant: "destructive" });
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

  const filtered = patients;

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

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="border-primary/15 bg-primary/5 sm:col-span-2">
          <CardContent className="p-3 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-bold text-foreground">
                Dados clínicos sob responsabilidade profissional
              </p>
              {/* O aviso precisa descrever o modo em que a tela está de fato.
                  O texto único falava em "modo sem senha" e em "Apagar dados
                  locais" mesmo dentro de uma sessão profissional autenticada —
                  onde há senha e onde nada clínico é gravado no navegador. */}
              <p className="text-xs text-muted-foreground leading-relaxed">
                {isRemoteClinical ? (
                  <>
                    Sessão profissional autenticada: os registros vivem no
                    backend da clínica ativa e não são gravados neste navegador.
                    A API de pacientes não é cacheada pelo service worker.
                    Confirme consentimento e encerre a sessão ao terminar em
                    dispositivo compartilhado.
                  </>
                ) : (
                  <>
                    A API de pacientes não é cacheada pelo service worker. Neste
                    modo sem senha, qualquer pessoa no mesmo perfil do navegador
                    pode ver os registros. Confirme consentimento, exporte
                    backup e use “Apagar dados locais” ao terminar em
                    dispositivo compartilhado.
                  </>
                )}
              </p>
            </div>
          </CardContent>
        </Card>
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
            disabled={backupLoading || patientTotal === 0}
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
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar paciente..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPatientPage(1);
          }}
          className="pl-10 pr-10 h-10 rounded-xl"
          data-testid="input-search-patients"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            aria-label="Limpar busca de pacientes"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" aria-hidden="true" />
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
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-9 w-9 p-0"
                          onClick={() => {
                            softTick();
                            haptic.tap();
                            openEdit(p);
                          }}
                          aria-label={`Editar cadastro de ${p.name}`}
                          title="Editar cadastro"
                          data-testid={`button-edit-${p.id}`}
                        >
                          <Pencil className="w-4 h-4" aria-hidden="true" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-9 w-9 p-0 text-destructive hover:text-destructive"
                          onClick={() => {
                            softTap();
                            haptic.warning();
                            setConfirmingDelete({ id: p.id, name: p.name });
                          }}
                          aria-label={`Excluir cadastro de ${p.name}`}
                          title="Excluir cadastro"
                          data-testid={`button-delete-${p.id}`}
                        >
                          <Trash2 className="w-4 h-4" aria-hidden="true" />
                        </Button>
                      </div>
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

      {patientTotal > PATIENT_PAGE_SIZE && (
        <div className="flex flex-col gap-2 rounded-xl border bg-card p-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>
            Página {patientPage} de {totalPatientPages} · {patientTotal} paciente(s)
            {isFetching ? " · atualizando…" : ""}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={patientPage <= 1 || isFetching}
              onClick={() => setPatientPage((page) => Math.max(1, page - 1))}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={patientPage >= totalPatientPages || isFetching}
              onClick={() => setPatientPage((page) => Math.min(totalPatientPages, page + 1))}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}

      {/* Confirm delete dialog */}
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
    </div>
  );
}
