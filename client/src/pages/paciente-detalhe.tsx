import { useState, useMemo } from "react";
import { useRoute, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  ArrowLeft,
  Pencil,
  Trash2,
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  Copy,
  Download,
  ClipboardList,
  Users,
} from "lucide-react";
import { PinGate } from "@/components/PinGate";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { differenceInYears, parseISO, format } from "date-fns";
import html2canvas from "html2canvas";

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

function fmtDateShort(d: string | Date | null | undefined): string {
  if (!d) return "";
  try {
    const date = typeof d === "string" ? new Date(d) : d;
    return format(date, "dd/MM");
  } catch {
    return "";
  }
}

export default function PacienteDetalhePage() {
  // Todos os hooks são chamados de forma incondicional (regra rules-of-hooks).
  // O portão de PIN é um componente isolado (PinGate); enquanto não autenticado,
  // as queries ficam desabilitadas (enabled: internalAuth) para não buscar dados.
  const [internalAuth, setInternalAuth] = useState(false);
  const { toast } = useToast();
  const [, params] = useRoute("/paciente/:id");
  const patientId = params?.id || "";

  const [editOpen, setEditOpen] = useState(false);
  const [formName, setFormName] = useState("");
  const [formBirth, setFormBirth] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [selectedScale, setSelectedScale] = useState("");
  const [doctorName, setDoctorName] = useState("Dr. Jadson Fraga");
  const [specialty, setSpecialty] = useState("Neuropediatra");

  const { data: patient } = useQuery<any>({
    queryKey: [`/api/patients/${patientId}`],
    enabled: internalAuth && !!patientId,
  });

  const { data: results = [] } = useQuery<any[]>({
    queryKey: [`/api/patients/${patientId}/results`],
    enabled: internalAuth && !!patientId,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PATCH", `/api/patients/${patientId}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/patients/${patientId}`],
      });
      setEditOpen(false);
      toast({ title: "Paciente atualizado!" });
    },
  });

  const deleteResultMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/results/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/patients/${patientId}/results`],
      });
      toast({ title: "Avaliação removida." });
    },
  });

  // Scale groups for evolution tab
  const scaleGroups = useMemo(() => {
    const groups: Record<string, any[]> = {};
    results.forEach((r: any) => {
      if (!groups[r.scaleName]) groups[r.scaleName] = [];
      groups[r.scaleName].push(r);
    });
    return groups;
  }, [results]);

  const scalesWithMultiple = Object.keys(scaleGroups).filter(
    (k) => scaleGroups[k].length >= 2,
  );

  const chartData = useMemo(() => {
    if (!selectedScale || !scaleGroups[selectedScale]) return [];
    return scaleGroups[selectedScale].map((r: any) => ({
      date: fmtDateShort(r.createdAt),
      score: r.totalScore,
      classification: r.classification,
      fullDate: fmtDate(r.createdAt),
    }));
  }, [selectedScale, scaleGroups]);

  const evolutionSummary = useMemo(() => {
    if (chartData.length < 2) return null;
    const first = chartData[0].score;
    const last = chartData[chartData.length - 1].score;
    const delta = last - first;
    return { first, last, delta };
  }, [chartData]);

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
    const el = document.getElementById("report-content");
    if (!el) return;
    const canvas = await html2canvas(el, {
      scale: 2,
      backgroundColor: "#ffffff",
    });
    const link = document.createElement("a");
    link.download = `relatorio-${patient?.name || "paciente"}-${new Date().toISOString().slice(0, 10)}.png`;
    link.href = canvas.toDataURL();
    link.click();
    toast({ title: "Imagem exportada!" });
  }

  function copyReportText() {
    if (!patient) return;
    const age = calcAge(patient.birthDate);
    let text = `RELATÓRIO CLÍNICO\n${doctorName} — ${specialty}\n\n`;
    text += `Paciente: ${patient.name}\n`;
    if (age) text += `Idade: ${age}\n`;
    if (patient.notes) text += `Observações: ${patient.notes}\n`;
    text += `\nAVALIAÇÕES:\n`;

    const sorted = [...results].sort(
      (a: any, b: any) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    sorted.forEach((r: any) => {
      text += `- ${fmtDate(r.createdAt)} | ${r.scaleName} | Score: ${r.totalScore} | ${r.classification}\n`;
    });

    if (scalesWithMultiple.length > 0) {
      text += `\nEVOLUÇÃO:\n`;
      scalesWithMultiple.forEach((scale) => {
        const items = scaleGroups[scale];
        const first = items[0];
        const last = items[items.length - 1];
        const delta = last.totalScore - first.totalScore;
        text += `- ${scale}: ${first.totalScore} → ${last.totalScore} (${delta >= 0 ? "+" : ""}${delta})\n`;
      });
    }

    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: "Relatório copiado para a área de transferência.",
    });
  }

  if (!internalAuth) {
    return (
      <PinGate
        onUnlock={() => setInternalAuth(true)}
        inputTestId="input-pin-paciente-detalhe"
        buttonTestId="button-acessar-prontuarios-detalhe"
      />
    );
  }

  if (!patient) {
    return (
      <div className="text-center py-12 space-y-3">
        <Users className="w-10 h-10 mx-auto text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">Carregando paciente...</p>
      </div>
    );
  }

  const age = calcAge(patient.birthDate);
  const sortedResultsDesc = [...results].sort(
    (a: any, b: any) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link href="/pacientes">
        <Button variant="ghost" size="sm" className="gap-1.5 -ml-2">
          <ArrowLeft className="w-3.5 h-3.5" /> Pacientes
        </Button>
      </Link>

      {/* Patient header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-bold text-foreground">{patient.name}</h1>
          <div className="flex items-center gap-3 mt-1">
            {age && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" /> {age}
              </span>
            )}
            <Badge variant="secondary" className="text-xs">
              {results.length} avaliação{results.length !== 1 ? "ões" : ""}
            </Badge>
          </div>
          {patient.notes && (
            <p className="text-xs text-muted-foreground mt-2">
              {patient.notes}
            </p>
          )}
        </div>
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

      {/* Tabs */}
      <Tabs defaultValue="avaliacoes">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="avaliacoes">Avaliações</TabsTrigger>
          <TabsTrigger value="evolucao">Evolução</TabsTrigger>
          <TabsTrigger value="relatorio">Relatório</TabsTrigger>
        </TabsList>

        {/* Tab: Avaliações */}
        <TabsContent value="avaliacoes" className="space-y-4 mt-4">
          {sortedResultsDesc.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <ClipboardList className="w-8 h-8 mx-auto text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                Nenhuma avaliação registrada.
              </p>
              <p className="text-xs text-muted-foreground">
                Aplique uma escala e vincule o resultado a este paciente.
              </p>
            </div>
          ) : (
            sortedResultsDesc.map((r: any) => (
              <Card key={r.id} className="border-card-border">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-foreground">
                        {r.scaleName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {fmtDate(r.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {r.totalScore} pts
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {r.classification}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        onClick={() => deleteResultMutation.mutate(r.id)}
                        data-testid={`button-delete-result-${r.id}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Tab: Evolução */}
        <TabsContent value="evolucao" className="space-y-4 mt-4">
          {scalesWithMultiple.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <TrendingUp className="w-8 h-8 mx-auto text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                Dados insuficientes para evolução.
              </p>
              <p className="text-xs text-muted-foreground">
                São necessárias pelo menos 2 avaliações da mesma escala.
              </p>
            </div>
          ) : (
            <>
              <Select value={selectedScale} onValueChange={setSelectedScale}>
                <SelectTrigger data-testid="select-evolution-scale">
                  <SelectValue placeholder="Selecione a escala..." />
                </SelectTrigger>
                <SelectContent>
                  {scalesWithMultiple.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s} ({scaleGroups[s].length} avaliações)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedScale && chartData.length >= 2 && (
                <>
                  <Card className="border-card-border">
                    <CardContent className="p-4">
                      <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={chartData}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            className="stroke-muted"
                          />
                          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (!active || !payload?.length) return null;
                              const d = payload[0].payload;
                              return (
                                <div className="bg-card border border-border rounded-lg p-2 shadow-md text-xs">
                                  <p className="font-bold">{d.fullDate}</p>
                                  <p>Score: {d.score}</p>
                                  <p className="text-muted-foreground">
                                    {d.classification}
                                  </p>
                                </div>
                              );
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="score"
                            stroke="#7c3aed"
                            strokeWidth={2}
                            dot={{ fill: "#7c3aed", r: 4 }}
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {evolutionSummary && (
                    <div className="grid grid-cols-3 gap-3">
                      <Card className="border-card-border">
                        <CardContent className="p-3 text-center">
                          <p className="text-xs text-muted-foreground">
                            Primeira
                          </p>
                          <p className="text-lg font-bold">
                            {evolutionSummary.first}
                          </p>
                        </CardContent>
                      </Card>
                      <Card className="border-card-border">
                        <CardContent className="p-3 text-center">
                          <p className="text-xs text-muted-foreground">
                            Última
                          </p>
                          <p className="text-lg font-bold">
                            {evolutionSummary.last}
                          </p>
                        </CardContent>
                      </Card>
                      <Card
                        className={`border-card-border ${
                          evolutionSummary.delta < 0
                            ? "bg-emerald-50/50 dark:bg-emerald-950/20"
                            : evolutionSummary.delta > 0
                              ? "bg-red-50/50 dark:bg-red-950/20"
                              : ""
                        }`}
                      >
                        <CardContent className="p-3 text-center">
                          <p className="text-xs text-muted-foreground">
                            Variação
                          </p>
                          <div className="flex items-center justify-center gap-1">
                            {evolutionSummary.delta < 0 ? (
                              <TrendingDown className="w-4 h-4 text-emerald-600" />
                            ) : evolutionSummary.delta > 0 ? (
                              <TrendingUp className="w-4 h-4 text-red-600" />
                            ) : (
                              <Minus className="w-4 h-4 text-muted-foreground" />
                            )}
                            <p
                              className={`text-lg font-bold ${
                                evolutionSummary.delta < 0
                                  ? "text-emerald-600"
                                  : evolutionSummary.delta > 0
                                    ? "text-red-600"
                                    : ""
                              }`}
                            >
                              {evolutionSummary.delta >= 0 ? "+" : ""}
                              {evolutionSummary.delta}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </TabsContent>

        {/* Tab: Relatório */}
        <TabsContent value="relatorio" className="space-y-4 mt-4">
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

          {sortedResultsDesc.length === 0 ? (
            <div
              className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800/50 dark:bg-amber-950/20 dark:text-amber-200"
              role="alert"
            >
              Nenhum documento será gerado sem avaliações salvas. Aplique uma
              escala, salve no paciente e retorne para exportar.
            </div>
          ) : (
            <Card className="border-card-border overflow-hidden">
              <div
                id="report-content"
                className="bg-white p-6 space-y-4 text-black"
              >
                {/* Header */}
                <div className="border-b-2 border-purple-600 pb-3">
                  <h2 className="text-base font-bold text-purple-700">
                    {doctorName}
                  </h2>
                  <p className="text-xs text-gray-500">{specialty}</p>
                </div>

                {/* Patient info */}
                <div className="space-y-1">
                  <h3 className="text-sm font-bold">
                    Paciente: {patient.name}
                  </h3>
                  {age && <p className="text-xs text-gray-600">Idade: {age}</p>}
                  {patient.notes && (
                    <p className="text-xs text-gray-600">
                      Obs: {patient.notes}
                    </p>
                  )}
                  <p className="text-xs text-gray-400">
                    Data do relatório: {format(new Date(), "dd/MM/yyyy")}
                  </p>
                </div>

                {/* Evaluations table */}
                {sortedResultsDesc.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase text-gray-500 mb-2">
                      Avaliações Realizadas
                    </h4>
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-1 font-semibold text-gray-700">
                            Data
                          </th>
                          <th className="text-left py-1 font-semibold text-gray-700">
                            Escala
                          </th>
                          <th className="text-center py-1 font-semibold text-gray-700">
                            Score
                          </th>
                          <th className="text-left py-1 font-semibold text-gray-700">
                            Classificação
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedResultsDesc.map((r: any) => (
                          <tr key={r.id} className="border-b border-gray-100">
                            <td className="py-1 text-gray-600">
                              {fmtDate(r.createdAt)}
                            </td>
                            <td className="py-1 font-medium">{r.scaleName}</td>
                            <td className="py-1 text-center">{r.totalScore}</td>
                            <td className="py-1 text-gray-600">
                              {r.classification}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Evolution summary */}
                {scalesWithMultiple.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase text-gray-500 mb-2">
                      Evolução
                    </h4>
                    {scalesWithMultiple.map((scale) => {
                      const items = scaleGroups[scale];
                      const first = items[0];
                      const last = items[items.length - 1];
                      const delta = last.totalScore - first.totalScore;
                      return (
                        <p key={scale} className="text-xs text-gray-600">
                          {scale}: {first.totalScore} → {last.totalScore} (
                          {delta >= 0 ? "+" : ""}
                          {delta})
                        </p>
                      );
                    })}
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Export buttons */}
          {sortedResultsDesc.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={exportAsImage}
                variant="outline"
                className="gap-2"
                data-testid="button-export-image"
              >
                <Download className="w-4 h-4" /> Exportar Imagem
              </Button>
              <Button
                onClick={copyReportText}
                variant="outline"
                className="gap-2"
                data-testid="button-copy-text"
              >
                <Copy className="w-4 h-4" /> Copiar Texto
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
