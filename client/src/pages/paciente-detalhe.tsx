import { useState } from "react";
import { useLocation, useRoute, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { PatientCockpit } from "@/components/clinical/PatientCockpit";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { loadAllPatientResults } from "@/lib/patientResultsPagination";
import {
  savedScaleAppliedAt as resultCreatedAt,
  savedScaleName as resultScaleName,
  savedScaleResponses as storedResponses,
} from "@/lib/savedScaleResult";
import { safeTextFilename } from "@/lib/shareText";
import { formatClinicalDateTime } from "@/lib/clinicalDate";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/ui/VisualStates";
import {
  Activity,
  ArrowLeft,
  Pencil,
  Trash2,
  Calendar,
  Copy,
  Download,
  ClipboardList,
  FileText,
  Pill,
  Users,
} from "lucide-react";
import { differenceInYears, parseISO, format } from "date-fns";
import html2canvas from "html2canvas";
import { useAuth } from "@/contexts/AuthContext";
import { useClinic } from "@/contexts/ClinicContext";

function calcAge(birthDate: string | null | undefined): string | null {
  if (!birthDate) return null;
  try {
    const years = differenceInYears(new Date(), parseISO(birthDate));
    return `${years} ano${years !== 1 ? "s" : ""}`;
  } catch {
    return null;
  }
}

function fmtDate(d: string | Date | null | undefined): string {
  if (!d) return "—";
  try {
    const date = typeof d === "string" ? new Date(d) : d;
    return format(date, "dd/MM/yyyy");
  } catch {
    return "—";
  }
}

function isNotFoundError(error: unknown): boolean {
  if (error && typeof error === "object" && "status" in error) {
    const status = Number((error as { status?: unknown }).status);
    if (status === 404) return true;
  }

  const message = error instanceof Error ? error.message : String(error ?? "");
  return /^404(?:\s|:|$)/.test(message);
}

export default function PacienteDetalhePage() {
  const { toast } = useToast();
  const { accessMode, isAuthenticated } = useAuth();
  const { activeClinicId } = useClinic();
  const isRemoteClinical = accessMode === "remote" && isAuthenticated;
  const liveContextReady = isRemoteClinical && Boolean(activeClinicId);
  const [, navigate] = useLocation();
  const [, params] = useRoute("/paciente/:id");
  const patientId = params?.id || "";

  const [editOpen, setEditOpen] = useState(false);
  const [formName, setFormName] = useState("");
  const [formBirth, setFormBirth] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [doctorName, setDoctorName] = useState("Dr. Jadson Fraga");
  const [specialty, setSpecialty] = useState("Neuropediatra");
  const [imageExporting, setImageExporting] = useState(false);
  const [reportCopying, setReportCopying] = useState(false);
  const [pdfExportingId, setPdfExportingId] = useState<string | null>(null);
  const [resultPendingDeletion, setResultPendingDeletion] = useState<{
    id: string;
    scaleName: string;
  } | null>(null);

  const patientQueryKey = isRemoteClinical
    ? `/api/live/patients/${encodeURIComponent(patientId)}?clinicId=${encodeURIComponent(activeClinicId ?? "")}`
    : `/api/patients/${patientId}`;
  const {
    data: patientPayload,
    isLoading: patientLoading,
    isError: patientIsError,
    error: patientError,
    refetch: refetchPatient,
  } = useQuery<any>({
    queryKey: [patientQueryKey],
    enabled: !!patientId && (!isRemoteClinical || liveContextReady),
  });
  const patient = isRemoteClinical && patientPayload?.profile
    ? { ...patientPayload.profile, ...patientPayload }
    : patientPayload;

  const resultsQueryKey = isRemoteClinical
    ? `/api/live/assessments?clinicId=${encodeURIComponent(activeClinicId ?? "")}&patientId=${encodeURIComponent(patientId)}`
    : `/api/patients/${patientId}/results`;
  const {
    data: resultsPayload,
    isLoading: resultsLoading,
    isError: resultsIsError,
    refetch: refetchResults,
  } = useQuery<any>({
    queryKey: [resultsQueryKey],
    ...(isRemoteClinical ? {} : { queryFn: () => loadAllPatientResults(patientId) }),
    enabled: !!patientId && Boolean(patient) && (!isRemoteClinical || liveContextReady),
  });
  const resultsRaw = isRemoteClinical ? resultsPayload?.data : resultsPayload;
  const results = isRemoteClinical
    ? (Array.isArray(resultsRaw) ? resultsRaw : []).map((assessment: any) => ({
        id: assessment.id,
        payload: assessment.payload,
        scaleName: assessment.payload?.title ?? assessment.instrumentId,
        instrumentId: assessment.instrumentId,
        scaleVersion: assessment.instrumentVersion,
        responses: assessment.responses,
        answers: assessment.responses,
        classification: "Resultado registrado",
        totalScore: null,
        appliedAt: assessment.appliedAt,
        createdAt: assessment.appliedAt,
        status: assessment.status,
      }))
    : (Array.isArray(resultsRaw) ? resultsRaw : []);
  const resultsShapeIsInvalid =
    !isRemoteClinical && resultsRaw !== undefined && !Array.isArray(resultsRaw);
  const resultsUnavailable = resultsIsError || resultsShapeIsInvalid;

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest(
        "PATCH",
        isRemoteClinical ? `/api/live/patients/${encodeURIComponent(patientId)}` : `/api/patients/${patientId}`,
        isRemoteClinical ? { ...data, clinicId: activeClinicId } : data,
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [patientQueryKey] });
      setEditOpen(false);
      toast({ title: "Paciente atualizado!" });
    },
  });

  const deleteResultMutation = useMutation({
    mutationFn: async (id: string) => {
      if (isRemoteClinical) {
        throw new Error("Avaliações LIVE são append-only e não podem ser apagadas.");
      }
      await apiRequest("DELETE", `/api/results/${encodeURIComponent(id)}`);
    },
    onSuccess: () => {
      setResultPendingDeletion(null);
      toast({ title: "Avaliação removida." });
    },
    onError: () => {
      toast({
        title: "Não foi possível excluir a avaliação.",
        description:
          "Não foi possível confirmar o estado do registro. A lista será atualizada para conferir.",
        variant: "destructive",
      });
    },
    onSettled: async () => {
      if (isRemoteClinical) {
        await queryClient.invalidateQueries({ queryKey: [resultsQueryKey] });
      } else {
        await queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/results`] });
      }
    },
  });

  function openEditDialog() {
    if (!patient) return;
    setFormName(patient.name);
    setFormBirth(patient.birthDate || "");
    setFormNotes(patient.notes || "");
    setEditOpen(true);
  }

  function handleUpdate() {
    const data: any = { name: formName.trim() };
    if (formBirth) data.birthDate = formBirth;
    else data.birthDate = null;
    data.notes = formNotes.trim() || null;
    updateMutation.mutate(data);
  }

  async function exportAsImage() {
    if (imageExporting) return;
    setImageExporting(true);
    try {
      const el = document.getElementById("report-content");
      if (!el) throw new Error("Conteúdo do relatório indisponível.");
      const canvas = await html2canvas(el, {
        scale: 2,
        backgroundColor: "#ffffff",
      });
      const link = document.createElement("a");
      link.download = `relatorio-${patient?.name || "paciente"}-${new Date().toISOString().slice(0, 10)}.png`;
      link.href = canvas.toDataURL();
      link.click();
      toast({ title: "Imagem exportada!" });
    } catch {
      toast({
        title: "Não foi possível exportar a imagem.",
        description: "Tente novamente ou use a opção de copiar o relatório.",
        variant: "destructive",
      });
    } finally {
      setImageExporting(false);
    }
  }

  async function downloadResultPdf(result: any) {
    const resultId = String(result?.id ?? "resultado");
    if (pdfExportingId) return;
    setPdfExportingId(resultId);
    try {
      const responses = storedResponses(result);
      if (responses.length === 0) {
        throw new Error("Este registro não possui respostas integrais para gerar o PDF.");
      }
      const scaleName = resultScaleName(result);
      const appliedAt = resultCreatedAt(result);
      const appliedAtLabel = appliedAt
        ? formatClinicalDateTime(
            typeof appliedAt === "string" ? new Date(appliedAt) : appliedAt,
          )
        : "Não informada";
      const answerBody = responses
        .map(
          (item, index) =>
            `${index + 1}. ${item.question}\nResposta: ${item.answer}`,
        )
        .join("\n\n");
      const { buildDocumentPdf } = await import("@/lib/documentPdf");
      const bytes = await buildDocumentPdf({
        title: `Resultado da escala — ${scaleName}`,
        subtitle: "Registro clínico reemitido a partir do resultado salvo",
        credentials: [
          `${doctorName} — ${specialty}`,
          "NeuroPed SDG — registro vinculado ao paciente",
        ],
        sections: [
          {
            heading: "Identificação da aplicação",
            body: [
              `Paciente: ${patient?.name || "Paciente vinculado"}`,
              `Idade atual: ${calcAge(patient?.birthDate) || "Não informada"}`,
              `Escala: ${scaleName}`,
              `Data da aplicação: ${appliedAtLabel}`,
              `Itens registrados: ${responses.length}`,
            ].join("\n"),
          },
          {
            heading: "Perguntas e respostas completas",
            body: answerBody,
          },
        ],
        footer:
          "PDF reconstruído exclusivamente a partir do snapshot clínico já salvo. As respostas acima correspondem ao registro persistido do paciente.",
      });
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      try {
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `${safeTextFilename(scaleName)}-resultado-salvo.pdf`;
        anchor.click();
      } finally {
        URL.revokeObjectURL(url);
      }
      toast({
        title: "PDF conferido e exportado",
        description:
          "O PDF foi gerado do registro salvo, com as mesmas perguntas e respostas exibidas no paciente.",
      });
    } catch (error) {
      toast({
        title: "Não foi possível gerar o PDF",
        description:
          error instanceof Error ? error.message : "Falha inesperada na exportação.",
        variant: "destructive",
      });
    } finally {
      setPdfExportingId(null);
    }
  }

  async function copyReportText() {
    if (!patient || reportCopying) return;
    setReportCopying(true);
    try {
      const age = calcAge(patient.birthDate);
      let text = `RELATÓRIO CLÍNICO\n${doctorName} — ${specialty}\n\n`;
      text += `Paciente: ${patient.name}\n`;
      if (age) text += `Idade: ${age}\n`;
      if (patient.notes) text += `Observações: ${patient.notes}\n`;
      text += `\nREGISTROS DE RESPOSTAS:\n`;

      const sorted = [...results].sort(
        (a: any, b: any) =>
          new Date(resultCreatedAt(b) ?? 0).getTime() -
          new Date(resultCreatedAt(a) ?? 0).getTime(),
      );
      sorted.forEach((r: any) => {
        text += `\n${fmtDate(resultCreatedAt(r))} | ${resultScaleName(r)}\n`;
        const responses = storedResponses(r);
        if (responses.length === 0) {
          text += "Aplicação antiga sem transcrição integral disponível.\n";
        } else {
          responses.forEach((item, index) => {
            text += `${index + 1}. ${item.question}\n   Resposta: ${item.answer}\n`;
          });
        }
      });

      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard API indisponível.");
      }
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copiado!",
        description: "Relatório copiado para a área de transferência.",
      });
    } catch {
      toast({
        title: "Não foi possível copiar o relatório.",
        description:
          "Autorize o acesso à área de transferência e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setReportCopying(false);
    }
  }

  if (patientLoading) {
    return <LoadingState rows={4} label="Carregando paciente..." />;
  }

  if (patientIsError && !isNotFoundError(patientError)) {
    return (
      <ErrorState
        message="Não foi possível carregar este paciente. Verifique a conexão e tente novamente."
        onRetry={() => {
          void refetchPatient();
        }}
      />
    );
  }

  if (!patient || isNotFoundError(patientError)) {
    return (
      <EmptyState
        icon={<Users className="w-7 h-7 text-muted-foreground" />}
        title="Paciente não encontrado"
        description="Este cadastro não existe ou não está mais disponível."
        action={{
          label: "Voltar aos pacientes",
          onClick: () => navigate("/pacientes"),
        }}
      />
    );
  }

  const age = calcAge(patient.birthDate);
  const sortedResultsDesc = [...results].sort(
    (a: any, b: any) =>
      new Date(resultCreatedAt(b) ?? 0).getTime() -
      new Date(resultCreatedAt(a) ?? 0).getTime(),
  );

  return (
    <div className="space-y-6">
      <Link href="/pacientes">
        <Button variant="ghost" size="sm" className="gap-1.5 -ml-2">
          <ArrowLeft className="w-3.5 h-3.5" /> Pacientes
        </Button>
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-lg font-bold text-foreground">{patient.name}</h1>
          <div className="flex items-center gap-3 mt-1">
            {age && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" /> {age}
              </span>
            )}
            <Badge variant="secondary" className="text-xs">
              {resultsLoading
                ? "Carregando avaliações..."
                : resultsUnavailable
                  ? "Avaliações indisponíveis"
                  : `${results.length} avaliação${results.length !== 1 ? "ões" : ""}`}
            </Badge>
          </div>
          {patient.notes && (
            <p className="text-xs text-muted-foreground mt-2">
              {patient.notes}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/conecta?patient=${encodeURIComponent(patientId)}`}>
            <Button
              size="sm"
              className="gap-1.5"
              data-testid="button-open-conecta"
            >
              <Activity className="w-3.5 h-3.5" /> Abrir jornada
            </Button>
          </Link>
          <Link href={`/prontuario?patientId=${encodeURIComponent(patientId)}`}>
            <Button size="sm" variant="outline" className="gap-1.5 border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100" data-testid="button-open-prontuario">
              <ClipboardList className="w-3.5 h-3.5" /> Prontuário
            </Button>
          </Link>
          <Link href={`/laudo-neuroped?patientId=${encodeURIComponent(patientId)}`}>
            <Button size="sm" variant="outline" className="gap-1.5 border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100" data-testid="button-open-laudo">
              <FileText className="w-3.5 h-3.5" /> Laudo
            </Button>
          </Link>
          <Link href={`/receita-c1?patientId=${encodeURIComponent(patientId)}`}>
            <Button size="sm" variant="outline" className="gap-1.5 border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100" data-testid="button-open-receita-c1">
              <Pill className="w-3.5 h-3.5" /> Receita C1
            </Button>
          </Link>
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={openEditDialog}
                data-testid="button-edit-patient"
              >
                <Pencil className="w-3 h-3" /> Editar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Editar Paciente</DialogTitle>
                <DialogDescription>
                  Atualize os dados do paciente.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <Input
                  placeholder="Nome *"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">
                    Data de nascimento
                  </label>
                  <Input
                    type="date"
                    value={formBirth}
                    onChange={(e) => setFormBirth(e.target.value)}
                  />
                </div>
                <Textarea
                  placeholder="Observações"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  rows={3}
                />
              </div>
              <DialogFooter>
                <Button
                  onClick={handleUpdate}
                  disabled={!formName.trim() || updateMutation.isPending}
                  className="w-full"
                >
                  {updateMutation.isPending ? "Salvando..." : "Atualizar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <PatientCockpit
        patientId={patientId}
        scaleCount={
          resultsLoading || resultsUnavailable ? null : results.length
        }
      />

      <Tabs defaultValue="avaliacoes">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="avaliacoes">Respostas</TabsTrigger>
          <TabsTrigger value="relatorio">Registro completo</TabsTrigger>
        </TabsList>

        <TabsContent value="avaliacoes" className="space-y-4 mt-4">
          {resultsLoading ? (
            <LoadingState rows={3} label="Carregando avaliações..." />
          ) : resultsUnavailable ? (
            <ErrorState
              compact
              message="Não foi possível carregar as avaliações deste paciente."
              onRetry={() => {
                void refetchResults();
              }}
            />
          ) : sortedResultsDesc.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <ClipboardList className="w-8 h-8 mx-auto text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                Nenhuma avaliação registrada.
              </p>
              <p className="text-xs text-muted-foreground">
                Aplique uma escala e vincule as respostas a este paciente.
              </p>
            </div>
          ) : (
            sortedResultsDesc.map((r: any) => {
              const responses = storedResponses(r);
              return (
                <Card key={r.id} className="border-card-border">
                  <CardContent className="space-y-4 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-foreground">
                          {resultScaleName(r)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {fmtDate(resultCreatedAt(r))}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {responses.length}{" "}
                          {responses.length === 1 ? "resposta" : "respostas"}
                        </Badge>
                        {responses.length > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 gap-1 px-2 text-xs"
                            disabled={pdfExportingId !== null}
                            onClick={() => void downloadResultPdf(r)}
                            data-testid={`button-pdf-saved-result-${r.id}`}
                          >
                            <Download className="h-3 w-3" />
                            {pdfExportingId === String(r.id) ? "Gerando…" : "PDF"}
                          </Button>
                        )}
                        {!isRemoteClinical && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                            aria-label={`Excluir avaliação ${resultScaleName(r)} de ${fmtDate(resultCreatedAt(r))}`}
                            disabled={deleteResultMutation.isPending}
                            onClick={() =>
                              setResultPendingDeletion({
                                id: String(r.id),
                                scaleName: resultScaleName(r),
                              })
                            }
                            data-testid={`button-delete-result-${r.id}`}
                          >
                            <Trash2 className="w-3 h-3" aria-hidden="true" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {responses.length === 0 ? (
                      <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-800/50 dark:bg-amber-950/20 dark:text-amber-200">
                        Aplicação antiga sem transcrição integral disponível.
                      </p>
                    ) : (
                      <ol className="space-y-2">
                        {responses.map((item, index) => (
                          <li
                            key={`${r.id}-${index}`}
                            className="border-b border-border/50 pb-2 last:border-0"
                          >
                            <p className="text-sm leading-relaxed text-foreground">
                              <span className="mr-1 font-mono text-xs text-muted-foreground">
                                {index + 1}.
                              </span>
                              {item.question}
                            </p>
                            <p className="mt-0.5 text-sm font-semibold text-primary">
                              → {item.answer}
                            </p>
                          </li>
                        ))}
                      </ol>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="relatorio" className="space-y-4 mt-4">
          {resultsLoading ? (
            <LoadingState rows={4} label="Carregando dados do relatório..." />
          ) : resultsUnavailable ? (
            <ErrorState
              compact
              message="O relatório não pode ser montado porque as avaliações não foram carregadas."
              onRetry={() => {
                void refetchResults();
              }}
            />
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  placeholder="Nome do profissional"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                />
                <Input
                  placeholder="Especialidade"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                />
              </div>

              <Card className="border-card-border overflow-hidden">
                <div
                  id="report-content"
                  className="bg-white p-6 space-y-4 text-black"
                >
                  <div className="border-b-2 border-purple-600 pb-3">
                    <h2 className="text-base font-bold text-purple-700">
                      {doctorName}
                    </h2>
                    <p className="text-xs text-gray-500">{specialty}</p>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-sm font-bold">
                      Paciente: {patient.name}
                    </h3>
                    {age && (
                      <p className="text-xs text-gray-600">Idade: {age}</p>
                    )}
                    {patient.notes && (
                      <p className="text-xs text-gray-600">
                        Obs: {patient.notes}
                      </p>
                    )}
                    <p className="text-xs text-gray-400">
                      Data do relatório: {format(new Date(), "dd/MM/yyyy")}
                    </p>
                  </div>

                  {sortedResultsDesc.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold uppercase text-gray-500">
                        Perguntas e respostas registradas
                      </h4>
                      {sortedResultsDesc.map((r: any) => {
                        const responses = storedResponses(r);
                        return (
                          <section
                            key={r.id}
                            className="break-inside-avoid space-y-2 border-t border-gray-200 pt-3 first:border-t-0 first:pt-0"
                          >
                            <div className="flex items-baseline justify-between gap-3">
                              <h5 className="text-xs font-bold text-gray-800">
                                {resultScaleName(r)}
                              </h5>
                              <span className="text-[10px] text-gray-500">
                                {fmtDate(resultCreatedAt(r))}
                              </span>
                            </div>
                            {responses.length === 0 ? (
                              <p className="text-xs text-gray-500">
                                Aplicação antiga sem transcrição integral
                                disponível.
                              </p>
                            ) : (
                              <ol className="space-y-1.5">
                                {responses.map((item, index) => (
                                  <li
                                    key={`${r.id}-report-${index}`}
                                    className="text-xs text-gray-700"
                                  >
                                    <p>
                                      <span className="font-mono text-gray-400">
                                        {index + 1}.
                                      </span>{" "}
                                      {item.question}
                                    </p>
                                    <p className="pl-4 font-semibold text-purple-800">
                                      Resposta: {item.answer}
                                    </p>
                                  </li>
                                ))}
                              </ol>
                            )}
                          </section>
                        );
                      })}
                    </div>
                  )}
                </div>
              </Card>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={exportAsImage}
                  disabled={imageExporting || reportCopying}
                  variant="outline"
                  className="gap-2"
                  data-testid="button-export-image"
                >
                  <Download className="w-4 h-4" />
                  {imageExporting ? "Exportando..." : "Exportar Imagem"}
                </Button>
                <Button
                  onClick={copyReportText}
                  disabled={imageExporting || reportCopying}
                  variant="outline"
                  className="gap-2"
                  data-testid="button-copy-text"
                >
                  <Copy className="w-4 h-4" />
                  {reportCopying ? "Copiando..." : "Copiar Texto"}
                </Button>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={Boolean(resultPendingDeletion)}
        onClose={() => {
          if (!deleteResultMutation.isPending) setResultPendingDeletion(null);
        }}
        onConfirm={() => {
          if (resultPendingDeletion) {
            deleteResultMutation.mutate(resultPendingDeletion.id);
          }
        }}
        title="Excluir avaliação?"
        description={
          resultPendingDeletion
            ? `A avaliação “${resultPendingDeletion.scaleName}” será removida permanentemente. Esta ação não pode ser desfeita.`
            : undefined
        }
        confirmLabel="Excluir avaliação"
        cancelLabel="Cancelar"
        variant="destructive"
        loading={deleteResultMutation.isPending}
      />
    </div>
  );
}
