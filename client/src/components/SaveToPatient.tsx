import { useState, useId } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
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
}

export function SaveToPatient(rawProps: SaveToPatientProps) {
  const scaleName = rawProps.scaleName ?? rawProps.testName ?? "Teste";
  const patientAge = rawProps.patientAge;
  const applicationDate = (() => {
    if (!rawProps.applicationDate) return new Date();
    const value =
      typeof rawProps.applicationDate === "string"
        ? new Date(rawProps.applicationDate)
        : rawProps.applicationDate;
    return Number.isNaN(value.getTime()) ? new Date() : value;
  })();
  const { toast } = useToast();
  const selectId = useId();
  const newPatientId = useId();
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [newPatientName, setNewPatientName] = useState("");
  const [savedPatientId, setSavedPatientId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    data: patientsRaw,
    isLoading: loadingPatients,
    isError: patientsError,
  } = useQuery<any>({
    queryKey: ["/api/patients"],
  });
  // A API retorna { data: [...] }; aceita também array puro por robustez.
  const patients: any[] = Array.isArray(patientsRaw)
    ? patientsRaw
    : (patientsRaw?.data ?? []);

  const createPatientMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await apiRequest("POST", "/api/patients", { name });
      return res.json();
    },
    onSuccess: () => {
      setErrorMessage(null);
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
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
      setSavedPatientId(patientId);
      queryClient.invalidateQueries({
        queryKey: [`/api/patients/${patientId}/results`],
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
          description: "Resultado e PDF premium vinculados ao paciente.",
        });
      }
    },
    onError: () => {
      setErrorMessage(
        "Não foi possível salvar o resultado. Nada foi descartado; tente novamente.",
      );
      toast({
        title: "Falha ao salvar",
        description: "O resultado permanece na tela para nova tentativa.",
        variant: "destructive",
      });
    },
  });

  async function handleSave() {
    setErrorMessage(null);
    let patientId = selectedPatientId;

    if (patientId === "__new__") {
      if (!newPatientName.trim()) {
        setErrorMessage("Informe o nome do paciente para criar o cadastro.");
        return;
      }
      try {
        const patient = await createPatientMutation.mutateAsync(
          newPatientName.trim(),
        );
        patientId = patient.id;
      } catch {
        return;
      }
    }

    if (!patientId) {
      setErrorMessage("Selecione um paciente antes de salvar o resultado.");
      return;
    }
    saveResultMutation.mutate(patientId);
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

        <div className="space-y-1">
          <label
            htmlFor={selectId}
            className="text-xs font-semibold text-muted-foreground"
          >
            Paciente
          </label>
          <Select
            value={selectedPatientId}
            onValueChange={(value) => {
              setSelectedPatientId(value);
              setErrorMessage(null);
            }}
          >
            <SelectTrigger id={selectId} data-testid="select-patient">
              <SelectValue
                placeholder={
                  loadingPatients
                    ? "Carregando pacientes..."
                    : "Selecionar paciente..."
                }
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__new__">+ Criar novo paciente</SelectItem>
              {patients.length === 0 && !loadingPatients && (
                <SelectItem value="__empty__" disabled>
                  Nenhum paciente cadastrado
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
            possível carregar pacientes. Você ainda pode tentar novamente ou
            criar o cadastro após restabelecer a conexão.
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
            !selectedPatientId ||
            (selectedPatientId === "__new__" && !newPatientName.trim())
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
          {isLoading ? "Salvando com segurança..." : "Salvar Respostas"}
        </Button>
      </CardContent>
    </Card>
  );
}
