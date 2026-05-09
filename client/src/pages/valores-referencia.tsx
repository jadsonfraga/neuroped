import { useState } from "react";
import { Activity, AlertTriangle, Calculator } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

// ─── SINAIS VITAIS ──────────────────────────────────────────────────────────
interface VitalRow {
  age: string;
  fc: [number, number];
  fr: [number, number];
  pas: [number, number];
  pad: [number, number];
}

const VITALS: VitalRow[] = [
  { age: "RN (0–28 dias)",    fc: [120, 160], fr: [30, 60], pas: [60, 90],   pad: [20, 60] },
  { age: "1–12 meses",        fc: [100, 160], fr: [25, 40], pas: [70, 100],  pad: [50, 70] },
  { age: "1–3 anos",          fc: [90,  150], fr: [20, 30], pas: [80, 110],  pad: [50, 80] },
  { age: "3–6 anos",          fc: [80,  140], fr: [20, 25], pas: [80, 110],  pad: [50, 80] },
  { age: "6–12 anos",         fc: [70,  120], fr: [15, 20], pas: [90, 120],  pad: [60, 80] },
  { age: "12–18 anos",        fc: [60,  100], fr: [12, 18], pas: [100, 130], pad: [65, 85] },
];

function VitalsTable() {
  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Valores de referência por faixa etária. Taquicardia = FC acima do valor máximo para a idade.
      </p>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-foreground">Idade</th>
              <th className="text-center px-3 py-3 text-xs font-semibold text-blue-700 dark:text-blue-400">FC (bpm)</th>
              <th className="text-center px-3 py-3 text-xs font-semibold text-emerald-700 dark:text-emerald-400">FR (irpm)</th>
              <th className="text-center px-3 py-3 text-xs font-semibold text-violet-700 dark:text-violet-400">PAS (mmHg)</th>
              <th className="text-center px-3 py-3 text-xs font-semibold text-orange-700 dark:text-orange-400">PAD (mmHg)</th>
            </tr>
          </thead>
          <tbody>
            {VITALS.map((row, i) => (
              <tr key={i} className={`border-b border-border last:border-0 ${i % 2 === 0 ? "" : "bg-muted/20"}`}>
                <td className="px-4 py-3 text-xs font-medium text-foreground">{row.age}</td>
                <td className="px-3 py-3 text-center text-xs text-foreground">
                  {row.fc[0]}–{row.fc[1]}
                </td>
                <td className="px-3 py-3 text-center text-xs text-foreground">
                  {row.fr[0]}–{row.fr[1]}
                </td>
                <td className="px-3 py-3 text-center text-xs text-foreground">
                  {row.pas[0]}–{row.pas[1]}
                </td>
                <td className="px-3 py-3 text-center text-xs text-foreground">
                  {row.pad[0]}–{row.pad[1]}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20 px-3 py-2.5">
          <p className="font-semibold text-red-700 dark:text-red-400 mb-1">Taquicardia (FC acima do máximo)</p>
          <ul className="space-y-0.5 text-red-600 dark:text-red-400">
            {VITALS.map((v, i) => (
              <li key={i}>
                <span className="font-medium">{v.age}:</span> FC &gt; {v.fc[1]} bpm
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 px-3 py-2.5">
          <p className="font-semibold text-amber-700 dark:text-amber-400 mb-1">Bradicardia (FC abaixo do mínimo)</p>
          <ul className="space-y-0.5 text-amber-600 dark:text-amber-400">
            {VITALS.map((v, i) => (
              <li key={i}>
                <span className="font-medium">{v.age}:</span> FC &lt; {v.fc[0]} bpm
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// ─── VALORES LABORATORIAIS ──────────────────────────────────────────────────
interface LabEntry {
  name: string;
  unit: string;
  ranges: { label: string; value: string }[];
  note?: string;
}

const LABS: LabEntry[] = [
  {
    name: "Hemoglobina",
    unit: "g/dL",
    ranges: [
      { label: "RN", value: "14 – 24" },
      { label: "3 meses", value: "9 – 14" },
      { label: "6m – 2a", value: "10,5 – 13,5" },
      { label: "2 – 6a", value: "11,5 – 13,5" },
      { label: "6 – 12a", value: "11,5 – 15,5" },
      { label: "> 12a", value: "12 – 16" },
    ],
    note: "Anemia: Hb < 11 g/dL em < 5 anos; < 11,5 em 5–12a; < 12 em > 12a",
  },
  {
    name: "Leucócitos",
    unit: "×10³/μL",
    ranges: [
      { label: "RN", value: "9 – 30" },
      { label: "1 mês", value: "5 – 19,5" },
      { label: "1 – 3a", value: "6 – 17,5" },
      { label: "4 – 7a", value: "5,5 – 15,5" },
      { label: "8 – 13a", value: "4,5 – 13,5" },
    ],
    note: "Leucocitose > 30 em RN e > 15 em > 1a (avaliar infecção/leucemia)",
  },
  {
    name: "Plaquetas",
    unit: "×10³/μL",
    ranges: [{ label: "Todas as idades", value: "150 – 400" }],
    note: "Trombocitopenia grave: < 20 (risco hemorrágico); Trombocitose: > 500",
  },
  {
    name: "Glicemia",
    unit: "mg/dL",
    ranges: [
      { label: "RN (primeiras 24h)", value: "40 – 60" },
      { label: "> 1 mês", value: "60 – 100" },
    ],
    note: "Hipoglicemia: < 40 mg/dL em RN; < 60 mg/dL em > 1m (intervenção imediata)",
  },
  {
    name: "TSH",
    unit: "μUI/mL",
    ranges: [
      { label: "RN (triagem)", value: "< 20" },
      { label: "> 1 mês", value: "0,5 – 4,5" },
    ],
    note: "TSH neonatal > 20: risco de hipotireoidismo congênito — confirmar T4 livre",
  },
  {
    name: "T4 livre",
    unit: "ng/dL",
    ranges: [{ label: "Todas as idades", value: "0,8 – 1,8" }],
  },
  {
    name: "Sódio",
    unit: "mEq/L",
    ranges: [{ label: "Todas as idades", value: "135 – 145" }],
    note: "Hiponatremia: < 130 (sintomática); Hipernatremia: > 150",
  },
  {
    name: "Potássio",
    unit: "mEq/L",
    ranges: [
      { label: "RN", value: "3,5 – 6,0" },
      { label: "> 1 mês", value: "3,5 – 5,0" },
    ],
    note: "Hipocalemia < 3,0: risco arrítmico; Hipercalemia > 6,5: emergência",
  },
  {
    name: "Creatinina",
    unit: "mg/dL",
    ranges: [
      { label: "Lactente (< 1a)", value: "0,2 – 0,4" },
      { label: "1 – 5 anos", value: "0,3 – 0,5" },
      { label: "6 – 12 anos", value: "0,5 – 0,8" },
      { label: "> 12 anos", value: "0,6 – 1,2" },
    ],
  },
  {
    name: "PCR (Proteína C-Reativa)",
    unit: "mg/L",
    ranges: [{ label: "Todas as idades", value: "< 5" }],
    note: "PCR > 100: infecção bacteriana grave provável; entre 5-100: avaliação clínica",
  },
  {
    name: "VHS",
    unit: "mm/h",
    ranges: [{ label: "Todas as idades", value: "< 20" }],
    note: "VHS > 50: considerar processo inflamatório/infeccioso importante",
  },
];

function LabsTable() {
  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">Valores de referência laboratoriais por faixa etária.</p>
      <div className="space-y-3">
        {LABS.map((lab, i) => (
          <div key={i} className="rounded-xl border border-border overflow-hidden">
            <div className="px-4 py-2.5 bg-muted/50 flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground">{lab.name}</span>
              <Badge variant="outline" className="text-[10px] font-mono">
                {lab.unit}
              </Badge>
            </div>
            <div className="px-4 py-3 space-y-2">
              <div className="flex flex-wrap gap-2">
                {lab.ranges.map((r, j) => (
                  <div key={j} className="flex items-center gap-1.5 text-xs">
                    <span className="text-muted-foreground">{r.label}:</span>
                    <span className="font-semibold text-foreground font-mono">{r.value}</span>
                  </div>
                ))}
              </div>
              {lab.note && (
                <p className="text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 rounded-md px-2.5 py-1.5 border border-amber-200 dark:border-amber-800">
                  ⚠ {lab.note}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── EQUIPAMENTOS / CALCULADORA ────────────────────────────────────────────
function EquipmentCalc() {
  const [peso, setPeso] = useState<string>("");
  const [idade, setIdade] = useState<string>("");

  const p = parseFloat(peso) || 0;
  const a = parseFloat(idade) || 0;

  // Tubo orotraqueal
  const tubSemCuff = a > 0 ? (a / 4 + 4).toFixed(1) : "—";
  const tubComCuff = a > 0 ? (a / 4 + 3.5).toFixed(1) : "—";

  function tuboLamina(ageYears: number): string {
    if (ageYears === 0) return "—";
    if (ageYears < 1 / 12) return "0"; // neonato
    if (ageYears < 1) return "1"; // lactente < 1a
    if (ageYears < 3) return "1,5";
    if (ageYears < 8) return "2";
    return "2–3";
  }
  const lamina = tuboLamina(a);

  function sonda(ageYears: number): string {
    if (ageYears === 0) return "—";
    if (ageYears < 1 / 12) return "5–8 Fr";
    if (ageYears < 1) return "8 Fr";
    if (ageYears < 5) return "10 Fr";
    return "12–14 Fr";
  }
  const sondaNG = sonda(a);

  function mascaraLaringea(weight: number): string {
    if (weight === 0) return "—";
    if (weight < 5) return "1";
    if (weight < 10) return "1,5";
    if (weight < 20) return "2";
    if (weight < 30) return "2,5";
    if (weight < 50) return "3";
    return "4";
  }
  const ml = mascaraLaringea(p);

  const bolus = p > 0 ? `${(p * 20).toFixed(0)} mL` : "—";
  const adrenalina = p > 0 ? `${(p * 0.01).toFixed(3)} mg  (${(p * 0.1).toFixed(2)} mL da solução 1:10.000)` : "—";
  const desfibMax = p > 0 ? `${(p * 2).toFixed(0)}–${(p * 4).toFixed(0)} J` : "—";

  return (
    <div className="space-y-5">
      <p className="text-xs text-muted-foreground">
        Preencha o peso e/ou a idade para calcular automaticamente os valores de equipamentos e doses de emergência.
      </p>

      {/* Inputs */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="input-peso" className="text-xs">
            Peso (kg)
          </Label>
          <Input
            id="input-peso"
            type="number"
            min="0"
            max="100"
            step="0.1"
            placeholder="ex: 15"
            value={peso}
            onChange={(e) => setPeso(e.target.value)}
            data-testid="input-peso"
            className="text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="input-idade" className="text-xs">
            Idade (anos)
          </Label>
          <Input
            id="input-idade"
            type="number"
            min="0"
            max="18"
            step="0.5"
            placeholder="ex: 4"
            value={idade}
            onChange={(e) => setIdade(e.target.value)}
            data-testid="input-idade"
            className="text-sm"
          />
        </div>
      </div>

      {/* Results */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Equipamentos de Via Aérea</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: "TOT sem cuff (fórmula: idade/4 + 4)", value: `${tubSemCuff} mm`, icon: "🫁" },
            { label: "TOT com cuff (fórmula: idade/4 + 3,5)", value: `${tubComCuff} mm`, icon: "🫁" },
            { label: "Lâmina de laringoscópio", value: lamina, icon: "🔦" },
            { label: "Sonda nasogástrica", value: sondaNG, icon: "🔗" },
            { label: "Máscara laríngea", value: ml, icon: "😷" },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3 rounded-lg border border-border bg-card px-4 py-3">
              <span className="text-base leading-none mt-0.5">{item.icon}</span>
              <div>
                <p className="text-[11px] text-muted-foreground">{item.label}</p>
                <p className={`text-sm font-bold font-mono mt-0.5 ${item.value === "—" ? "text-muted-foreground" : "text-foreground"}`}>
                  {item.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-2">Doses de Emergência</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            {
              label: "Bolus de cristaloide (20 mL/kg)",
              value: bolus,
              note: "SF 0,9% ou Ringer Lactato",
              icon: "💧",
              highlight: false,
            },
            {
              label: "Adrenalina IV/IO (0,01 mg/kg — 1:10.000)",
              value: adrenalina,
              note: "PCR / anafilaxia grave",
              icon: "💉",
              highlight: p > 0,
            },
            {
              label: "Desfibrilação (2–4 J/kg)",
              value: desfibMax,
              note: "FV / TV sem pulso — DEA ou desfibrilador manual",
              icon: "⚡",
              highlight: p > 0,
            },
          ].map((item, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 rounded-lg border px-4 py-3 ${
                item.highlight
                  ? "border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/20"
                  : "border-border bg-card"
              }`}
            >
              <span className="text-base leading-none mt-0.5">{item.icon}</span>
              <div>
                <p className="text-[11px] text-muted-foreground">{item.label}</p>
                <p
                  className={`text-sm font-bold font-mono mt-0.5 ${
                    item.value === "—"
                      ? "text-muted-foreground"
                      : item.highlight
                      ? "text-red-700 dark:text-red-400"
                      : "text-foreground"
                  }`}
                >
                  {item.value}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{item.note}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          <p className="text-[11px]">
            Estas calculações são estimativas para orientação inicial. Confirme sempre com o protocolo PALS/ATLS vigente e avaliação clínica do paciente.
          </p>
        </div>

        {/* Static reference for lâmina and TOT by age when no data entered */}
        <div className="rounded-xl border border-border overflow-hidden mt-2">
          <div className="px-4 py-2.5 bg-muted/50">
            <span className="text-xs font-semibold text-foreground">Referência Rápida — TOT e Lâmina por Faixa Etária</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-2 font-semibold text-foreground">Faixa Etária</th>
                  <th className="text-center px-3 py-2 font-semibold text-foreground">TOT sem cuff</th>
                  <th className="text-center px-3 py-2 font-semibold text-foreground">TOT com cuff</th>
                  <th className="text-center px-3 py-2 font-semibold text-foreground">Lâmina</th>
                  <th className="text-center px-3 py-2 font-semibold text-foreground">Sonda NG</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { age: "RN / prematuro", tot_s: "2,5–3,0", tot_c: "—", lamina: "00–0", sng: "5–8 Fr" },
                  { age: "Lactente (1–12m)", tot_s: "3,5–4,0", tot_c: "3,0–3,5", lamina: "1", sng: "8 Fr" },
                  { age: "1–2 anos", tot_s: "4,5", tot_c: "4,0", lamina: "1,5", sng: "10 Fr" },
                  { age: "3–4 anos", tot_s: "5,0–5,5", tot_c: "4,5–5,0", lamina: "2", sng: "10 Fr" },
                  { age: "5–8 anos", tot_s: "5,5–6,0", tot_c: "5,0–5,5", lamina: "2", sng: "12 Fr" },
                  { age: "9–12 anos", tot_s: "6,5–7,0", tot_c: "6,0–6,5", lamina: "2–3", sng: "14 Fr" },
                  { age: "> 12 anos", tot_s: "7,0–8,0", tot_c: "6,5–7,5", lamina: "3", sng: "14–16 Fr" },
                ].map((row, i) => (
                  <tr key={i} className={`border-b border-border last:border-0 ${i % 2 === 0 ? "" : "bg-muted/20"}`}>
                    <td className="px-4 py-2 font-medium text-foreground">{row.age}</td>
                    <td className="px-3 py-2 text-center font-mono">{row.tot_s}</td>
                    <td className="px-3 py-2 text-center font-mono">{row.tot_c}</td>
                    <td className="px-3 py-2 text-center font-mono">{row.lamina}</td>
                    <td className="px-3 py-2 text-center font-mono">{row.sng}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PAGE ────────────────────────────────────────────────────────────────────
export default function ValoresReferenciaPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Activity className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Valores de Referência Pediátrica</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Sinais vitais, laboratório e calculadora de equipamentos por peso/idade.
          </p>
        </div>
      </div>

      <Tabs defaultValue="vitais" className="w-full">
        <TabsList className="h-auto gap-1 p-1 mb-2">
          <TabsTrigger value="vitais" className="text-xs py-1.5 px-3" data-testid="tab-vitais">
            Sinais Vitais
          </TabsTrigger>
          <TabsTrigger value="lab" className="text-xs py-1.5 px-3" data-testid="tab-lab">
            Laboratório
          </TabsTrigger>
          <TabsTrigger value="equip" className="text-xs py-1.5 px-3" data-testid="tab-equip">
            <Calculator className="w-3.5 h-3.5 mr-1.5" />
            Equipamentos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="vitais" className="mt-4">
          <VitalsTable />
        </TabsContent>
        <TabsContent value="lab" className="mt-4">
          <LabsTable />
        </TabsContent>
        <TabsContent value="equip" className="mt-4">
          <EquipmentCalc />
        </TabsContent>
      </Tabs>

      <p className="text-xs text-muted-foreground border-t pt-4">
        Valores baseados em referências pediátricas nacionais e internacionais (SBP, AAP, Nelson Textbook of Pediatrics). Use como guia — sempre confirmar com laboratório e protocolo locais.
      </p>
    </div>
  );
}
