import { useState, useMemo } from "react";
import { Calculator, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PageHero } from "@/components/PageHero";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  WEIGHT_MAX_KG,
  calcResult,
  formatDose,
  liquidUnitLabel,
  medications,
  parseWeight,
} from "@/lib/calculadoraDose";

export default function CalculadoraDosePage() {
  const [weight, setWeight] = useState<string>("");
  const [selectedMed, setSelectedMed] = useState<string>("");
  const [search, setSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const med = useMemo(() => medications.find(m => m.name === selectedMed) || null, [selectedMed]);
  const weightInput = useMemo(() => parseWeight(weight), [weight]);
  const result = useMemo(() => {
    if (!med || !weightInput.ok) return null;
    return calcResult(weightInput.kg, med);
  }, [med, weightInput]);
  const weightError = !weightInput.ok && weightInput.reason !== "vazio"
    ? weightInput.reason === "fora_da_faixa"
      ? `Peso acima de ${WEIGHT_MAX_KG} kg. Confira o valor digitado.`
      : "Informe o peso em kg, com vírgula ou ponto para a parte decimal."
    : null;

  const filteredMeds = useMemo(() => {
    const q = search.toLowerCase();
    return medications.filter(m =>
      m.name.toLowerCase().includes(q) || m.indication.toLowerCase().includes(q)
    );
  }, [search]);

  const listOpen = dropdownOpen && filteredMeds.length > 0 && search.length > 0;

  function selectMed(name: string) {
    setSelectedMed(name);
    setSearch(name);
    setDropdownOpen(false);
  }

  const statusColor = result
    ? result.exceedsMax
      ? "border-red-500 bg-red-50 dark:bg-red-950/20"
      : result.nearMax
      ? "border-amber-500 bg-amber-50 dark:bg-amber-950/20"
      : "border-green-500 bg-green-50 dark:bg-green-950/20"
    : "";

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHero
        icon={Calculator}
        eyebrow="dose pediátrica"
        title="Calculadora de Dose Pediátrica"
        subtitle="Cálculo por peso — neuropediatria."
        gradient="from-blue-500 to-cyan-500"
        mascotContext="resultado"
      />

      <Card className="border-card-border">
        <CardContent className="p-5 space-y-5">
          {/* Weight input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Peso da criança
            </label>
            <div className="relative">
              <Input
                type="text"
                inputMode="decimal"
                autoComplete="off"
                placeholder="Ex: 25,5"
                value={weight}
                onChange={e => setWeight(e.target.value)}
                className="h-12 text-lg pr-10"
                data-testid="input-weight"
                aria-label="Peso da criança (kg)"
                aria-invalid={weightError ? true : undefined}
                aria-describedby={weightError ? "weight-error" : undefined}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">kg</span>
            </div>
            {weightError && (
              <p id="weight-error" role="alert" className="text-xs font-medium text-red-700 dark:text-red-400" data-testid="weight-error">
                {weightError}
              </p>
            )}
          </div>

          {/* Medication search/select */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Medicamento
            </label>
            <div className="relative">
              <Input
                placeholder="Digite o nome ou indicação..."
                aria-label="Medicamento"
                role="combobox"
                aria-autocomplete="list"
                aria-controls="medication-options"
                aria-expanded={listOpen}
                value={search}
                onChange={e => {
                  setSearch(e.target.value);
                  setDropdownOpen(true);
                  if (e.target.value !== selectedMed) setSelectedMed("");
                }}
                onFocus={() => setDropdownOpen(true)}
                onBlur={() => setDropdownOpen(false)}
                onKeyDown={e => {
                  if (e.key === "Escape") setDropdownOpen(false);
                }}
                className="h-12"
                data-testid="input-medication-search"
              />
              {listOpen && (
                <div
                  id="medication-options"
                  role="listbox"
                  aria-label="Medicamentos"
                  className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-64 overflow-y-auto"
                >
                  {filteredMeds.map(m => (
                    <button
                      key={m.name}
                      type="button"
                      role="option"
                      aria-selected={m.name === selectedMed}
                      className="w-full text-left px-4 py-2.5 hover:bg-accent transition-colors border-b border-border/50 last:border-0"
                      // mousedown antes do blur do campo: sem isto o fechamento no blur engolia o clique.
                      onMouseDown={e => e.preventDefault()}
                      onClick={() => selectMed(m.name)}
                      data-testid={`option-med-${m.name}`}
                    >
                      <div className="text-sm font-medium">{m.name}</div>
                      <div className="text-xs text-muted-foreground">{m.indication}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Selected med info */}
          {med && (
            <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1 text-xs">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{med.form}</Badge>
                <Badge variant="outline">{med.frequency}</Badge>
                {med.liquid && <Badge variant="outline" className="text-blue-600 border-blue-300">Líquido: {formatDose(med.liquid.mgPer)} mg/{med.liquid.unit}</Badge>}
              </div>
              <p className="text-muted-foreground pt-1"><span className="font-medium text-foreground">Indicação:</span> {med.indication}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {med && (
        <>
          {med.fixedDose ? (
            <Card className="border-blue-400 bg-blue-50 dark:bg-blue-950/20">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Info className="w-5 h-5 text-blue-600" />
                  <h2 className="font-bold text-blue-800 dark:text-blue-300">Dose Fixa — Não calculada por peso</h2>
                </div>
                <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">{med.fixedDose}</p>
                <p className="text-xs text-muted-foreground bg-white/60 dark:bg-white/5 rounded-lg p-3">{med.notes}</p>
              </CardContent>
            </Card>
          ) : result ? (
            <Card className={`border-2 ${statusColor}`}>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-2">
                  {result.exceedsMax ? (
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  ) : result.nearMax ? (
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                  ) : (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  )}
                  <h2 className="font-bold">Resultado do Cálculo — {med.name}</h2>
                </div>

                {result.exceedsMax && (
                  <div className="flex items-center gap-2 text-xs font-semibold text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-950/30 rounded-lg px-3 py-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    Dose calculada excede o máximo recomendado! Usar dose máxima.
                  </div>
                )}
                {!result.exceedsMax && result.nearMax && (
                  <div className="flex items-center gap-2 text-xs font-semibold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/30 rounded-lg px-3 py-2" data-testid="dose-near-max">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    Dose calculada acima de 85% do máximo recomendado.
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/70 dark:bg-white/5 rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">Dose calculada</p>
                    <p className="text-xl font-bold text-foreground" data-testid="dose-daily">{formatDose(result.dailyDose)}</p>
                    <p className="text-xs text-muted-foreground">mg/dia</p>
                  </div>
                  <div className="bg-white/70 dark:bg-white/5 rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">Dose a usar</p>
                    <p className={`text-xl font-bold ${result.exceedsMax ? "text-red-600" : "text-foreground"}`} data-testid="dose-capped">{formatDose(result.cappedDailyDose)}</p>
                    <p className="text-xs text-muted-foreground">mg/dia (máx: {formatDose(med.maxDose)} mg)</p>
                  </div>
                </div>

                <div className="space-y-2" data-testid="dose-intakes">
                  {result.intakes.length > 1 && (
                    <p className="text-xs text-muted-foreground">
                      A frequência admite {result.intakes.length} esquemas ({med.frequency}). A dose por tomada sai para cada um.
                    </p>
                  )}
                  {result.intakes.map(intake => (
                    <div key={intake.label} className="grid grid-cols-2 gap-3">
                      <div className="bg-white/70 dark:bg-white/5 rounded-lg p-3 text-center">
                        <p className="text-xs text-muted-foreground">Por tomada</p>
                        <p className="text-xl font-bold text-foreground">{formatDose(intake.dosePerIntake)}</p>
                        <p className="text-xs text-muted-foreground">
                          mg · {intake.timesPerDay === 1 ? "1 tomada/dia" : `${intake.timesPerDay} tomadas/dia`} ({intake.label})
                        </p>
                      </div>
                      {med.liquid && intake.volumePerIntake !== null && (
                        <div className="bg-blue-100/70 dark:bg-blue-950/30 rounded-lg p-3 text-center">
                          <p className="text-xs text-muted-foreground">Volume por tomada</p>
                          <p className="text-xl font-bold text-blue-700 dark:text-blue-300">{formatDose(intake.volumePerIntake)}</p>
                          <p className="text-xs text-muted-foreground">
                            {liquidUnitLabel(med.liquid.unit, intake.volumePerIntake)} ({formatDose(med.liquid.mgPer)} mg/{med.liquid.unit})
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="rounded-lg bg-white/60 dark:bg-white/5 border border-border/50 p-3 space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5" /> Observações Clínicas
                  </p>
                  <p className="text-xs text-foreground">{med.notes}</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-8 text-sm text-muted-foreground">
              Informe o peso da criança para calcular a dose.
            </div>
          )}
        </>
      )}

      {!med && !weight && (
        <div className="text-center py-10 space-y-3">
          <Calculator className="w-12 h-12 mx-auto text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">Selecione um medicamento e informe o peso para calcular.</p>
          <p className="text-xs text-muted-foreground">{medications.length} medicamentos neuropediátricos disponíveis</p>
        </div>
      )}

      {/* Disclaimer */}
      <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/20 p-3 flex gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800 dark:text-amber-300">
          Esta calculadora é um apoio clínico. Sempre confirme a dose em fontes especializadas e ajuste conforme resposta clínica individual do paciente.
        </p>
      </div>
    </div>
  );
}
