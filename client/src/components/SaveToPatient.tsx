import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Save, CheckCircle2, ArrowRight } from "lucide-react";

interface SaveToPatientProps {
  scaleName: string;
  totalScore: number;
  classification: string;
  answers: any;
  domainScores?: any;
  patientAge?: string;
}

export function SaveToPatient({ scaleName, totalScore, classification, answers, domainScores, patientAge }: SaveToPatientProps) {
  const { toast } = useToast();
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [newPatientName, setNewPatientName] = useState("");
  const [savedPatientId, setSavedPatientId] = useState<string | null>(null);

  const { data: patients = [] } = useQuery<any[]>({
    queryKey: ["/api/patients"],
  });

  const createPatientMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await apiRequest("POST", "/api/patients", { name });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
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
      setSavedPatientId(patientId);
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/results`] });
      toast({ title: "Salvo!", description: "Resultado vinculado ao paciente." });
    },
  });

  async function handleSave() {
    let patientId = selectedPatientId;

    if (patientId === "__new__") {
      if (!newPatientName.trim()) return;
      const patient = await createPatientMutation.mutateAsync(newPatientName.trim());
      patientId = patient.id;
    }

    if (!patientId) return;
    saveResultMutation.mutate(patientId);
  }

  if (savedPatientId) {
    return (
      <Card className="border-emerald-300/40 dark:border-emerald-700/40 bg-gradient-to-br from-emerald-50/60 to-teal-50/60 dark:from-emerald-950/20 dark:to-teal-950/20">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <p className="text-sm font-medium text-foreground">Resultado salvo com sucesso!</p>
          </div>
          <Link href={`/paciente/${savedPatientId}`}>
            <Button variant="outline" size="sm" className="gap-2" data-testid="button-view-patient">
              Ver paciente <ArrowRight className="w-3 h-3" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const isLoading = createPatientMutation.isPending || saveResultMutation.isPending;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-chart-2/5 dark:from-primary/10 dark:to-chart-2/10">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-primary" />
          <p className="text-sm font-semibold text-foreground">Vincular a Paciente</p>
          <Badge variant="secondary" className="text-xs">Opcional</Badge>
        </div>

        <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
          <SelectTrigger data-testid="select-patient">
            <SelectValue placeholder="Selecionar paciente..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__new__">+ Criar novo paciente</SelectItem>
            {patients.map((p: any) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
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

        <Button
          onClick={handleSave}
          disabled={isLoading || (!selectedPatientId || (selectedPatientId === "__new__" && !newPatientName.trim()))}
          size="sm"
          className="w-full gap-2"
          data-testid="button-save-to-patient"
        >
          <Save className="w-3 h-3" />
          {isLoading ? "Salvando..." : "Salvar Resultado"}
        </Button>
      </CardContent>
    </Card>
  );
}
