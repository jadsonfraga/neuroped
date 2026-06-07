import { useState } from "react";
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

interface SaveToPatientProps {
  scaleName: string;
  totalScore: number;
  classification: string;
  answers: any;
  domainScores?: any;
  patientAge?: string;
}

export function SaveToPatient({
  scaleName,
  totalScore,
  classification,
  answers,
  domainScores,
  patientAge,
}: SaveToPatientProps) {
  const { toast } = useToast();
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [newPatientName, setNewPatientName] = useState("");
  const [savedPatientId, setSavedPatientId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    data: patients = [],
    isLoading: loadingPatients,
    isError: patientsError,
  } = useQuery<any[]>({
    queryKey: ["/api/patients"],
  });

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
      const res = await apiRequest("POST", "/api/results", {
        patientId,
        scaleName,
        answers,
        totalScore,
        classification,
        patientAge: patientAge || null,
        domainScores: domainScores || null,
      });
      return res.json();
    },
    onSuccess: (_data, patientId) => {
      setErrorMessage(null);
      setSavedPatientId(patientId);
      queryClient.invalidateQueries({
        queryKey: [`/api/patients/${patientId}/results`],
      });
      toast({
        title: "Salvo!",
        description: "Resultado vinculado ao paciente.",
      });
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
              Resultado salvo com sucesso!
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
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-chart-2/5 dark:from-primary/10 dark:to-chart-2/10">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-primary" />
          <p className="text-sm font-semibold text-foreground">
            Vincular a Paciente
          </p>
          <Badge variant="secondary" className="text-xs">
            Opcional
          </Badge>
        </div>

        <Select
          value={selectedPatientId}
          onValueChange={(value) => {
            setSelectedPatientId(value);
            setErrorMessage(null);
          }}
        >
          <SelectTrigger data-testid="select-patient">
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

        {selectedPatientId === "__new__" && (
          <Input
            placeholder="Nome do paciente"
            value={newPatientName}
            onChange={(e) => setNewPatientName(e.target.value)}
            data-testid="input-new-patient-name"
          />
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
          {isLoading ? "Salvando com segurança..." : "Salvar Resultado"}
        </Button>
      </CardContent>
    </Card>
  );
}
