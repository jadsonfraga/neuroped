import { useState } from "react";
import { Activity } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { ClinicalReport } from "@/components/ClinicalReport";
import { SaveToPatient } from "@/components/SaveToPatient";

const MUSCLE_GROUPS = [
  "Flexores de cotovelo",
  "Flexores de punho",
  "Adutores de quadril",
  "Flexores de joelho",
  "Flexores plantares",
];

const ASHWORTH_GRADES = ["0", "1", "1+", "2", "3", "4"];
const TARDIEU_QUALITY = ["0", "1", "2", "3", "4", "5"];

interface AshworthRow {
  msd: string;
  mse: string;
  mid: string;
  mie: string;
}

interface TardieuRow {
  r2: string;
  r1: string;
  quality: string;
}

interface PatientInfo {
  nome: string;
  nascimento: string;
  data: string;
  examinador: string;
}

// ── Patient header ────────────────────────────────────────────────────────

function PatientHeaderForm({
  value,
  onChange,
}: {
  value: PatientInfo;
  onChange: (v: PatientInfo) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 mb-4">
      <div className="space-y-1">
        <Label className="text-xs">Nome do Paciente</Label>
        <Input
          className="h-8 text-xs"
          value={value.nome}
          onChange={(e) => onChange({ ...value, nome: e.target.value })}
          placeholder="Nome completo"
          data-testid="input-patient-name-esp"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Data de Nascimento</Label>
        <Input
          type="date"
          className="h-8 text-xs"
          value={value.nascimento}
          onChange={(e) => onChange({ ...value, nascimento: e.target.value })}
          data-testid="input-dob-esp"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Data da Avaliação</Label>
        <Input
          type="date"
          className="h-8 text-xs"
          value={value.data}
          onChange={(e) => onChange({ ...value, data: e.target.value })}
          data-testid="input-date-esp"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Examinador(a)</Label>
        <Input
          className="h-8 text-xs"
          value={value.examinador}
          onChange={(e) => onChange({ ...value, examinador: e.target.value })}
          placeholder="Nome do profissional"
          data-testid="input-examiner-esp"
        />
      </div>
    </div>
  );
}

// ── Ashworth Tab ─────────────────────────────────────────────────────────

function AshworthTab() {
  const [patient, setPatient] = useState<PatientInfo>({
    nome: "",
    nascimento: "",
    data: new Date().toISOString().slice(0, 10),
    examinador: "",
  });
  const [rows, setRows] = useState<Record<string, AshworthRow>>(
    Object.fromEntries(
      MUSCLE_GROUPS.map((group) => [
        group,
        { msd: "", mse: "", mid: "", mie: "" },
      ]),
    ),
  );
  const [showResponses, setShowResponses] = useState(false);

  function setCell(group: string, column: keyof AshworthRow, value: string) {
    setRows((previous) => ({
      ...previous,
      [group]: { ...previous[group], [column]: value },
    }));
  }

  const limbLabels: Record<keyof AshworthRow, string> = {
    msd: "Membro superior direito",
    mse: "Membro superior esquerdo",
    mid: "Membro inferior direito",
    mie: "Membro inferior esquerdo",
  };
  const reportItems = MUSCLE_GROUPS.flatMap((group) =>
    (Object.keys(limbLabels) as Array<keyof AshworthRow>).map((column) => ({
      question: `${group} — ${limbLabels[column]}`,
      answer: rows[group]?.[column] || "Não respondida",
    })),
  );
  const allAnswered = MUSCLE_GROUPS.every((group) =>
    (Object.keys(limbLabels) as Array<keyof AshworthRow>).every((column) =>
      Boolean(rows[group]?.[column]),
    ),
  );

  if (showResponses) {
    return (
      <div className="space-y-4">
        <ClinicalReport
          scaleName="Escala de Ashworth Modificada"
          items={reportItems}
        />
        <SaveToPatient
          scaleName="Escala de Ashworth Modificada"
          responses={reportItems}
        />
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setShowResponses(false)}
        >
          Editar Respostas
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PatientHeaderForm value={patient} onChange={setPatient} />

      <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40 p-3">
        <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
          Selecione o grau observado em cada grupo muscular e membro. O registro
          final reproduzirá exatamente as opções escolhidas.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-muted/60">
              <th className="text-left p-2 border border-border font-semibold">
                Grupo Muscular
              </th>
              {["MSD", "MSE", "MID", "MIE"].map((column) => (
                <th
                  key={column}
                  className="text-center p-2 border border-border font-semibold w-[18%]"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MUSCLE_GROUPS.map((group) => (
              <tr key={group} className="hover:bg-muted/20">
                <td className="p-2 border border-border font-medium">
                  {group}
                </td>
                {(["msd", "mse", "mid", "mie"] as const).map((column) => (
                  <td
                    key={column}
                    className="p-1 border border-border text-center"
                  >
                    <Select
                      value={rows[group]?.[column] || ""}
                      onValueChange={(value) => setCell(group, column, value)}
                    >
                      <SelectTrigger
                        className="h-7 text-xs"
                        data-testid={`sel-ash-${group}-${column}`}
                      >
                        <SelectValue placeholder="—" />
                      </SelectTrigger>
                      <SelectContent>
                        {ASHWORTH_GRADES.map((grade) => (
                          <SelectItem key={grade} value={grade}>
                            {grade}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Button
        onClick={() => setShowResponses(true)}
        disabled={!allAnswered}
        className="w-full"
        data-testid="button-review-ashworth"
      >
        Ver todas as perguntas e respostas
      </Button>
    </div>
  );
}

// ── Tardieu Tab ────────────────────────────────────────────────────────────

function TardieuTab() {
  const [patient, setPatient] = useState<PatientInfo>({
    nome: "",
    nascimento: "",
    data: new Date().toISOString().slice(0, 10),
    examinador: "",
  });
  const [rows, setRows] = useState<Record<string, TardieuRow>>(
    Object.fromEntries(
      MUSCLE_GROUPS.map((group) => [group, { r2: "", r1: "", quality: "" }]),
    ),
  );
  const [showResponses, setShowResponses] = useState(false);

  function setCell(group: string, column: keyof TardieuRow, value: string) {
    setRows((previous) => ({
      ...previous,
      [group]: { ...previous[group], [column]: value },
    }));
  }

  const reportItems = MUSCLE_GROUPS.flatMap((group) => [
    {
      question: `${group} — R2 passivo`,
      answer: rows[group]?.r2 ? `${rows[group].r2}°` : "Não respondida",
    },
    {
      question: `${group} — R1 catch`,
      answer: rows[group]?.r1 ? `${rows[group].r1}°` : "Não respondida",
    },
    {
      question: `${group} — Qualidade observada`,
      answer: rows[group]?.quality || "Não respondida",
    },
  ]);
  const allAnswered = MUSCLE_GROUPS.every(
    (group) =>
      Boolean(rows[group]?.r2) &&
      Boolean(rows[group]?.r1) &&
      Boolean(rows[group]?.quality),
  );

  if (showResponses) {
    return (
      <div className="space-y-4">
        <ClinicalReport
          scaleName="Escala de Tardieu Modificada"
          items={reportItems}
        />
        <SaveToPatient
          scaleName="Escala de Tardieu Modificada"
          responses={reportItems}
        />
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setShowResponses(false)}
        >
          Editar Respostas
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PatientHeaderForm value={patient} onChange={setPatient} />

      <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 p-3">
        <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
          Registre R2, R1 e a qualidade observada. O relatório não calculará
          diferenças nem apresentará interpretação.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-muted/60">
              <th className="text-left p-2 border border-border font-semibold">
                Grupo Muscular
              </th>
              <th className="text-center p-2 border border-border font-semibold w-[22%]">
                R2 (°)
              </th>
              <th className="text-center p-2 border border-border font-semibold w-[22%]">
                R1 (°)
              </th>
              <th className="text-center p-2 border border-border font-semibold w-[24%]">
                Qualidade
              </th>
            </tr>
          </thead>
          <tbody>
            {MUSCLE_GROUPS.map((group) => (
              <tr key={group} className="hover:bg-muted/20">
                <td className="p-2 border border-border font-medium">
                  {group}
                </td>
                <td className="p-1 border border-border text-center">
                  <Input
                    type="number"
                    className="h-7 text-xs text-center"
                    value={rows[group]?.r2 || ""}
                    onChange={(event) =>
                      setCell(group, "r2", event.target.value)
                    }
                    placeholder="—"
                    data-testid={`input-r2-${group}`}
                  />
                </td>
                <td className="p-1 border border-border text-center">
                  <Input
                    type="number"
                    className="h-7 text-xs text-center"
                    value={rows[group]?.r1 || ""}
                    onChange={(event) =>
                      setCell(group, "r1", event.target.value)
                    }
                    placeholder="—"
                    data-testid={`input-r1-${group}`}
                  />
                </td>
                <td className="p-1 border border-border text-center">
                  <Select
                    value={rows[group]?.quality || ""}
                    onValueChange={(value) => setCell(group, "quality", value)}
                  >
                    <SelectTrigger
                      className="h-7 text-xs"
                      data-testid={`sel-tq-${group}`}
                    >
                      <SelectValue placeholder="—" />
                    </SelectTrigger>
                    <SelectContent>
                      {TARDIEU_QUALITY.map((quality) => (
                        <SelectItem key={quality} value={quality}>
                          {quality}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Button
        onClick={() => setShowResponses(true)}
        disabled={!allAnswered}
        className="w-full"
        data-testid="button-review-tardieu"
      >
        Ver todas as perguntas e respostas
      </Button>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────

export default function EspasticidadePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
          <Activity className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold">Avaliação de Espasticidade</h1>
          <p className="text-xs text-muted-foreground">
            Escala de Ashworth Modificada e Escala de Tardieu Modificada
          </p>
        </div>
      </div>

      <Card className="border-card-border">
        <CardContent className="p-4">
          <Tabs defaultValue="ashworth">
            <TabsList className="w-full mb-4">
              <TabsTrigger
                value="ashworth"
                className="flex-1 text-xs"
                data-testid="tab-ashworth"
              >
                Ashworth Modificada
              </TabsTrigger>
              <TabsTrigger
                value="tardieu"
                className="flex-1 text-xs"
                data-testid="tab-tardieu"
              >
                Tardieu Modificada
              </TabsTrigger>
            </TabsList>
            <TabsContent value="ashworth">
              <AshworthTab />
            </TabsContent>
            <TabsContent value="tardieu">
              <TardieuTab />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
