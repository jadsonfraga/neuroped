import { useEffect, useState, useId, useRef } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, invalidateApiQueries, queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useClinic } from "@/contexts/ClinicContext";
import {
  UserPlus,
  Save,
  CheckCircle2,
  ArrowRight,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import {
  normalizeScaleResponseItems,
  type ScaleResponseItem,
} from "@/lib/scaleResponseReport";
import { archiveClinicalPdf } from "@/lib/clinicalDocumentsClient";
import { formatClinicalDateTime } from "@/lib/clinicalDate";

interface SaveToPatientProps {
  scaleName?: string;
  patientAge?: string;
  responses: ScaleResponseItem[];
  applicationDate?: string | Date;
  testName?: string;
  /**
   * Identifica a versão do CONTRATO de resposta do instrumento (não do motor
   * cliente). Default "client-v1" para o acervo inteiro. Uma escala cujo
   * formato de resposta muda de um jeito que não é diretamente comparável ao
   * anterior (ex.: 4 opções de intensidade -> 3 respostas diretas) deve
   * passar um valor próprio, para que registros antigos e novos fiquem
   * distinguíveis em `assessment.instrumentVersion` (ver paciente-detalhe.tsx).
   */
  instrumentVersion?: string;
  /** Chamado depois que as respostas foram salvas no paciente (ex.: liberar "Nova partida" sem aviso). */
  onSaved?: (patientId: string) => void;
}

class LiveScaleDocumentHistoryLimitError extends Error {}

type LiveScaleSaveCheckpoint = {
  clinicId: string;
  patientId: string;
  assessmentId: string;
  issuedAt: string;
  snapshot: string;
};

function validApplicationDate(value: string | Date | undefined, fallback: Date): Date {
  if (!value) return fallback;
  const date = typeof value === "string" ? new Date(value) : value;
  return Number.isFinite(date.getTime()) ? date : fallback;
}

export function SaveToPatient(rawProps: SaveToPatientProps) {
  const scaleName = rawProps.scaleName ?? rawProps.testName ?? "Teste";
  const instrumentVersion = rawProps.instrumentVersion ?? "client-v1";
  const patientAge = rawProps.patientAge;
  const { toast } = useToast();
  const { accessMode, isAuthenticated } = useAuth();
  const { activeClinicId } = useClinic();
  const isRemoteClinical = accessMode === "remote" && isAuthenticated;
  const selectId = useId();
  const newPatientId = useId();
  const searchId = useId();
  const [fallbackApplicationDate] = useState(() => new Date());
  const applicationDate = validApplicationDate(
    rawProps.applicationDate,
    fallbackApplicationDate,
  );
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [newPatientName, setNewPatientName] = useState("");
  const [savedPatientId, setSavedPatientId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const liveCheckpoint = useRef<LiveScaleSaveCheckpoint | null>(null);
  const submitting = useRef(false);
  const [pendingLiveDocument, setPendingLiveDocument] = useState(false);

  const [patientSearch, setPatientSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchPage, setSearchPage] = useState<{ scope: string; cursors: string[] }>({ scope: "", cursors: [] });
  const searchScope = JSON.stringify([activeClinicId, searchQuery]);
  const cursors = searchPage.scope === searchScope ? searchPage.cursors : [];
  const cursor = cursors.at(-1) ?? null;
  const searchPending = isRemoteClinical && patientSearch.trim() !== searchQuery;
  const livePatientEndpoint = "/api/live/patients";

  useEffect(() => {
    const timer = window.setTimeout(() => setSearchQuery(patientSearch.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [patientSearch]);

  const {
    data: patientsRaw,
    isLoading: loadingPatients,
    isError: patientsError,
    refetch: refetchPatients,
  } = useQuery<any>({
    queryKey: isRemoteClinical
      ? [livePatientEndpoint, "scale-picker", activeClinicId, searchQuery, cursor]
      : ["/api/patients"],
    enabled: !isRemoteClinical || (Boolean(activeClinicId) && !searchPending),
    queryFn: isRemoteClinical ? async () => {
      const response = searchQuery
        ? await apiRequest("POST", `${livePatientEndpoint}/search`, { clinicId: activeClinicId, q: searchQuery, cursor })
        : await apiRequest("GET", `${livePatientEndpoint}?clinicId=${encodeURIComponent(activeClinicId ?? "")}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`);
      return response.json();
    } : undefined,
  });
  const nextCursor = isRemoteClinical && typeof patientsRaw?.nextCursor === "string"
    ? patientsRaw.nextCursor
    : null;
  const pickerUnavailable = isRemoteClinical && (!activeClinicId || searchPending || loadingPatients || patientsError);
  function changeSearchPage(nextCursors: string[]) {
    setSearchPage({ scope: searchScope, cursors: nextCursors });
    setSelectedPatientId("");
    setErrorMessage(null);
  }
  // A API retorna { data: [...] }; aceita também array puro por robustez.
  const patients: any[] = (Array.isArray(patientsRaw)
    ? patientsRaw
    : (patientsRaw?.data ?? [])
  ).map((patient: any) =>
    isRemoteClinical
      ? {
          ...patient,
          name: patient.profile?.name ?? "Paciente sem nome",
          birthDate: patient.profile?.birthDate ?? null,
        }
      : patient,
  );

  const selectedPatientMissing = isRemoteClinical && selectedPatientId !== "" && selectedPatientId !== "__new__"
    && !patients.some((patient) => patient.id === selectedPatientId);

  const createPatientMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await apiRequest(
        "POST",
        isRemoteClinical ? "/api/live/patients" : "/api/patients",
        isRemoteClinical ? { clinicId: activeClinicId, name } : { name },
      );
      return res.json();
    },
    onSuccess: () => {
      setErrorMessage(null);
      // Atualiza este seletor e também a lista paginada de /pacientes.
      invalidateApiQueries(isRemoteClinical ? "/api/live/patients" : "/api/patients");
    },
    onError: () => {
      setErrorMessage(
        "Não foi possível criar o paciente. Confira os dados e tente novamente.",
      );
      toast({
        title: "Falha ao criar paciente",
        description: "O resultado ainda não foi salvo.",
        variant: "destructive",
      });
    },
  });

  const saveResultMutation = useMutation({
    mutationFn: async (patientId: string) => {
      const responses = normalizeScaleResponseItems(rawProps.responses);
      if (responses.length === 0) {
        throw new Error(
          "A escala precisa fornecer perguntas e respostas por extenso antes de ser salva.",
        );
      }
      if (isRemoteClinical) {
        if (!activeClinicId) {
          throw new Error(
            "Selecione uma clínica ativa antes de salvar a avaliação.",
          );
        }
        const instrumentId =
          scaleName
            .toLocaleLowerCase("pt-BR")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "")
            .slice(0, 120) || "instrumento";
        const responseRows = responses.map((item, index) => ({
          itemId: `item-${index + 1}`,
          itemPosition: index,
          value: { question: item.question, answer: item.answer },
        }));
        const appliedAt = applicationDate.toISOString();
        const snapshot = JSON.stringify({
          scaleName, instrumentId, instrumentVersion, patientAge: patientAge || null, appliedAt, responseRows,
        });
        const checkpoint = liveCheckpoint.current;
        if (checkpoint && (checkpoint.clinicId !== activeClinicId ||
            checkpoint.patientId !== patientId || checkpoint.snapshot !== snapshot)) {
          throw new Error("A avaliação pendente não corresponde ao paciente e às respostas atuais.");
        }
        let assessmentId: string;
        let issuedAt: string;
        if (checkpoint) {
          ({ assessmentId, issuedAt } = checkpoint);
          // A resposta do POST pode ter sido perdida depois do commit. Não
          // repita a escrita sem antes conferir os documentos do paciente.
          const query = new URLSearchParams({ clinicId: activeClinicId, patientId });
          const existing = await apiRequest("GET", `/api/live/documents?${query}`);
          const payload = await existing.json();
          if (!Array.isArray(payload?.data)) {
            throw new Error("Não foi possível confirmar o estado do documento.");
          }
          const document = payload.data.find((row: any) =>
            row.patientId === patientId && row.clinicId === activeClinicId &&
            row.documentType === "scale" && row.origin === "instrument" &&
            row.status === "published" && row.familyVisibility === false &&
            row.version?.content?.assessmentId === assessmentId,
          );
          if (document) {
            return { result: { id: assessmentId }, archivedDocumentId: document.id, archiveError: null };
          }
          // GET lista até 200 documentos. Uma lista cheia não comprova
          // ausência; não faça outro POST com estado ainda indeterminado.
          if (payload.data.length >= 200) throw new LiveScaleDocumentHistoryLimitError();
        } else {
          const response = await apiRequest("POST", "/api/live/assessments", {
            clinicId: activeClinicId,
            patientId,
            instrumentId,
            instrumentVersion,
            appliedAt,
            provenanceSource: "instrument",
            payload: {
              title: scaleName,
              patientAge: patientAge || null,
              responseCount: responseRows.length,
            },
            responses: responseRows,
          });
          const assessment = await response.json();
          if (typeof assessment?.id !== "string" || !assessment.id ||
              assessment.clinicId !== activeClinicId || assessment.patientId !== patientId) {
            throw new Error("Não foi possível confirmar a avaliação salva.");
          }
          assessmentId = assessment.id;
          issuedAt = new Date().toISOString();
          liveCheckpoint.current = { clinicId: activeClinicId, patientId, assessmentId, issuedAt, snapshot };
        }
        const documentResponse = await apiRequest(
          "POST",
          "/api/live/documents",
          {
            clinicId: activeClinicId,
            patientId,
            documentType: "scale",
            origin: "instrument",
            status: "published",
            familyVisibility: false,
            issuedAt,
            content: {
              title: `Resultado da escala — ${scaleName}`,
              assessmentId,
              instrumentId,
              instrumentVersion,
              patientAge: patientAge || null,
              appliedAt,
              responses: responseRows,
            },
          },
        );
        const document = await documentResponse.json();
        if (typeof document?.id !== "string" || !document.id ||
            document.clinicId !== activeClinicId || document.patientId !== patientId ||
            document.version?.content?.assessmentId !== assessmentId) {
          throw new Error("Não foi possível confirmar o documento salvo.");
        }
        return {
          result: { id: assessmentId },
          archivedDocumentId: document.id,
          archiveError: null,
        };
      }
      const res = await apiRequest("POST", "/api/results", {
        patientId,
        scaleName,
        responses,
        answers: responses,
        patientAge: patientAge || null,
        applicationDate: applicationDate.toISOString(),
      });
      const result = await res.json();
      let archivedDocumentId: string | null = null;
      let archiveError: string | null = null;
      try {
        const { buildDocumentPdf } = await import("@/lib/documentPdf");
        const patient = patients.find((item: any) => item.id === patientId);
        const answerBody = responses
          .map(
            (item, index) =>
              `${index + 1}. ${item.question}\nResposta: ${item.answer || "Não respondida"}`,
          )
          .join("\n\n");
        const pdfBytes = await buildDocumentPdf({
          title: `Resultado da escala — ${scaleName}`,
          subtitle: "Relatório clínico premium exportável",
          credentials: [
            "NeuroPed EDJ — documento gerado eletronicamente",
            "Resultado integral com perguntas, respostas e metadados do atendimento",
          ],
          sections: [
            {
              heading: "Identificação",
              body: [
                `Paciente: ${patient?.name || "Paciente vinculado"}`,
                `Idade informada: ${patientAge || "Não informada"}`,
                `Escala: ${scaleName}`,
                `Data da aplicação: ${formatClinicalDateTime(applicationDate)}`,
              ].join("\n"),
            },
            {
              heading: "Perguntas e respostas",
              body: answerBody || "Nenhuma resposta registrada.",
            },
          ],
          footer:
            "Documento clínico exportável. O PDF arquivado permanece vinculado ao resultado e ao paciente conforme a política de retenção permanente do NeuroPed.",
        });
        const archived = await archiveClinicalPdf({
          bytes: pdfBytes,
          filename: `escala-${scaleName.toLowerCase().replace(/[^a-z0-9]+/gi, "-")}-${result.id}`,
          documentType: "escala",
          title: `Resultado da escala — ${scaleName}`,
          patientId,
          sourceId: result.id,
          sourceVersion: "premium-v1",
          signatureStatus: "unsigned",
          metadata: {
            source: "scale-result",
            resultId: result.id,
            scaleName,
            patientAge: patientAge || null,
            applicationDate: applicationDate.toISOString(),
            answerCount: responses.length,
            appliedAt: applicationDate.toISOString(),
          },
        });
        archivedDocumentId = archived.document.id;
      } catch (error) {
        archiveError =
          error instanceof Error
            ? error.message
            : "Não foi possível arquivar o PDF premium.";
      }
      return { result, archivedDocumentId, archiveError };
    },
    onSuccess: (data, patientId) => {
      liveCheckpoint.current = null;
      setPendingLiveDocument(false);
      setSavedPatientId(patientId);
      rawProps.onSaved?.(patientId);
      queryClient.invalidateQueries({
        queryKey: [
          isRemoteClinical
            ? `/api/live/assessments?clinicId=${encodeURIComponent(activeClinicId ?? "")}&patientId=${encodeURIComponent(patientId)}`
            : `/api/patients/${patientId}/results`,
        ],
      });
      if (data.archiveError) {
        setErrorMessage(
          `Resultado salvo, mas o PDF premium não foi arquivado: ${data.archiveError}`,
        );
        toast({
          title: "Resultado salvo com alerta",
          description:
            "O PDF premium não foi persistido; verifique o storage e tente exportar novamente.",
          variant: "destructive",
        });
      } else {
        setErrorMessage(null);
        toast({
          title: "Salvo e arquivado!",
          description: isRemoteClinical
            ? "Avaliação e documento interno vinculados ao paciente."
            : "Resultado e PDF premium vinculados ao paciente.",
        });
      }
    },
    onError: (error) => {
      const checkpoint = liveCheckpoint.current;
      if (isRemoteClinical && checkpoint) {
        setPendingLiveDocument(true);
        queryClient.invalidateQueries({
          queryKey: [`/api/live/assessments?clinicId=${encodeURIComponent(checkpoint.clinicId)}&patientId=${encodeURIComponent(checkpoint.patientId)}`],
        });
        setErrorMessage(
          error instanceof LiveScaleDocumentHistoryLimitError
            ? "Avaliação já salva. O histórico é muito extenso para confirmar o documento sem risco de duplicação. Confira os documentos do paciente antes de iniciar outro salvamento."
            : "Avaliação já salva. Não foi possível confirmar o documento interno. Mantenha esta tela aberta e tente concluir o vínculo.",
        );
        return;
      }
      setErrorMessage(
        "Não foi possível confirmar o salvamento. O resultado permanece na tela.",
      );
      toast({
        title: "Falha ao salvar",
        description: "O resultado permanece na tela para nova tentativa.",
        variant: "destructive",
      });
    },
  });

  async function handleSave() {
    if (submitting.current) return;
    submitting.current = true;
    setErrorMessage(null);
    try {
      const checkpoint = liveCheckpoint.current;
      if (!checkpoint && (pickerUnavailable || selectedPatientMissing)) return;
      let patientId = checkpoint?.patientId ?? selectedPatientId;

      if (patientId === "__new__") {
        if (!newPatientName.trim()) {
          setErrorMessage("Informe o nome do paciente para criar o cadastro.");
          return;
        }
        try {
          const patient = await createPatientMutation.mutateAsync(newPatientName.trim());
          patientId = patient.id;
        } catch {
          return;
        }
      }

      if (!patientId) {
        setErrorMessage("Selecione um paciente antes de salvar o resultado.");
        return;
      }
      await saveResultMutation.mutateAsync(patientId).catch(() => {
        // A mutação apresenta o erro correspondente; não descarte o checkpoint.
      });
    } finally {
      submitting.current = false;
    }
  }

  if (savedPatientId) {
    return (
      <Card className="border-emerald-300/40 dark:border-emerald-700/40 bg-gradient-to-br from-emerald-50/60 to-teal-50/60 dark:from-emerald-950/20 dark:to-teal-950/20">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <p className="text-sm font-medium text-foreground">
              Respostas salvas com sucesso!
            </p>
          </div>
          <Link href={`/paciente/${savedPatientId}`}>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              data-testid="button-view-patient"
            >
              Ver paciente <ArrowRight className="w-3 h-3" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const isLoading =
    createPatientMutation.isPending || saveResultMutation.isPending;

  return (
    <Card
      data-scale-response-action
      className="border-primary/20 bg-gradient-to-br from-primary/5 to-chart-2/5 dark:from-primary/10 dark:to-chart-2/10"
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-primary" />
          <p className="text-sm font-semibold text-foreground">
            Vincular Respostas a Paciente
          </p>
          <Badge variant="secondary" className="text-xs">
            Opcional
          </Badge>
        </div>

        {isRemoteClinical && (
          <div className="space-y-1">
            <label htmlFor={searchId} className="text-xs font-semibold text-muted-foreground">
              Buscar paciente por nome
            </label>
            <Input
              id={searchId}
              data-testid="input-scale-patient-search"
              value={patientSearch}
              autoComplete="off"
              disabled={isLoading || !activeClinicId || pendingLiveDocument}
              onChange={(e) => {
                setPatientSearch(e.target.value);
                setSearchPage({ scope: "", cursors: [] });
                setSelectedPatientId("");
                setErrorMessage(null);
              }}
            />
          </div>
        )}

        <div className="space-y-1">
          <label
            htmlFor={selectId}
            className="text-xs font-semibold text-muted-foreground"
          >
            Paciente
          </label>
          <Select
            value={selectedPatientId}
            disabled={pickerUnavailable || isLoading || pendingLiveDocument}
            onValueChange={(value) => {
              setSelectedPatientId(value);
              setErrorMessage(null);
            }}
          >
            <SelectTrigger id={selectId} data-testid="select-patient">
              <SelectValue
                placeholder={
                  loadingPatients || searchPending
                    ? "Carregando pacientes..."
                    : "Selecionar paciente..."
                }
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__new__" disabled={Boolean(searchQuery && nextCursor)}>
                + Criar novo paciente
              </SelectItem>
              {patients.length === 0 && !loadingPatients && (
                <SelectItem value="__empty__" disabled>
                  {isRemoteClinical
                    ? nextCursor ? "Nenhum resultado nesta página" : "Nenhum paciente encontrado"
                    : "Nenhum paciente cadastrado"}
                </SelectItem>
              )}
              {patients.map((p: any) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isRemoteClinical && (cursors.length > 0 || nextCursor) && (
          <div className="flex flex-wrap gap-2">
            {cursors.length > 0 && (
              <Button type="button" variant="outline" size="sm" disabled={searchPending || isLoading || pendingLiveDocument}
                onClick={() => changeSearchPage(cursors.slice(0, -1))}>
                Anterior
              </Button>
            )}
            {nextCursor && (
              <Button type="button" variant="outline" size="sm" disabled={pickerUnavailable || isLoading || pendingLiveDocument}
                onClick={() => changeSearchPage([...cursors, nextCursor])}>
                {searchQuery ? "Continuar busca" : "Próxima página"}
              </Button>
            )}
          </div>
        )}

        {selectedPatientId === "__new__" && (
          <div className="space-y-1">
            <label
              htmlFor={newPatientId}
              className="text-xs font-semibold text-muted-foreground"
            >
              Nome do paciente
            </label>
            <Input
              id={newPatientId}
              placeholder="Nome do paciente"
              value={newPatientName}
              disabled={pendingLiveDocument}
              onChange={(e) => setNewPatientName(e.target.value)}
              data-testid="input-new-patient-name"
            />
          </div>
        )}

        {patientsError && (
          <div
            className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-800/50 dark:bg-amber-950/20 dark:text-amber-200"
            role="alert"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" /> Não foi
            possível carregar pacientes.
            <Button type="button" variant="outline" size="sm" onClick={() => void refetchPatients()}>
              Tentar novamente
            </Button>
          </div>
        )}

        {errorMessage && (
          <div
            className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive"
            role="alert"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />{" "}
            {errorMessage}
          </div>
        )}

        <Button
          onClick={handleSave}
          disabled={
            isLoading ||
            (pendingLiveDocument
              ? !activeClinicId
              : pickerUnavailable ||
                selectedPatientMissing ||
                !selectedPatientId ||
                (selectedPatientId === "__new__" && !newPatientName.trim()))
          }
          size="sm"
          className="w-full gap-2"
          data-testid="button-save-to-patient"
        >
          {isLoading ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Save className="w-3 h-3" />
          )}
          {isLoading
            ? "Salvando com segurança..."
            : pendingLiveDocument ? "Concluir vínculo" : "Salvar Respostas"}
        </Button>
      </CardContent>
    </Card>
  );
}
