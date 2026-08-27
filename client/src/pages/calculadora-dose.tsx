import { useState, useMemo } from "react";
import { Calculator, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PageHero } from "@/components/PageHero";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { calculateMedicationSafety } from "@shared/medicationSafety";

interface MedDose {
  name: string;
  indication: string;
  dosePerKg: number; // mg/kg/day
  maxDose: number; // mg/day
  frequency: string;
  liquidConc?: number; // mg/mL
  form: string;
  notes: string;
  fixedDose?: string; // for fixed-dose meds
}

const medications: MedDose[] = [
  { name: "Risperidona", indication: "TEA, psicose, irritabilidade", dosePerKg: 0.02, maxDose: 6, frequency: "12/12h", liquidConc: 1, form: "comprimido / solução oral (1mg/mL)", notes: "Iniciar com dose baixa. Monitorar prolactina e ganho de peso." },
  { name: "Aripiprazol", indication: "TEA, TDAH, psicose", dosePerKg: 0.1, maxDose: 30, frequency: "1x/dia", form: "comprimido", notes: "Menor risco metabólico que outros antipsicóticos." },
  { name: "Metilfenidato", indication: "TDAH", dosePerKg: 1, maxDose: 60, frequency: "8/8h ou 12/12h", form: "comprimido / cápsula LP", notes: "Dar com alimentação. Monitorar PA e FC. Não usar em <6 anos." },
  { name: "Lisdexanfetamina", indication: "TDAH", dosePerKg: 0, maxDose: 70, frequency: "1x/dia", fixedDose: "30-70mg fixo (não por peso)", form: "cápsula", notes: "Iniciar com 30mg. Ajuste a cada 1-2 semanas conforme resposta." },
  { name: "Clonidina", indication: "TDAH, tiques, sono", dosePerKg: 0.004, maxDose: 0.4, frequency: "8/8h ou 12/12h", form: "comprimido", notes: "Cuidado com hipotensão. Não interromper abruptamente." },
  { name: "Guanfacina", indication: "TDAH, tiques", dosePerKg: 0.05, maxDose: 4, frequency: "1x/dia", form: "comprimido", notes: "Preferir à noite. Monitorar PA. Retirada gradual." },
  { name: "Atomoxetina", indication: "TDAH", dosePerKg: 1.2, maxDose: 100, frequency: "1x/dia ou 12/12h", form: "cápsula", notes: "Efeito completo em 4-6 semanas. Monitorar humor nas primeiras semanas." },
  { name: "Sertralina", indication: "Ansiedade, TOC, depressão", dosePerKg: 1, maxDose: 200, frequency: "1x/dia", form: "comprimido", notes: "Iniciar com metade da dose. Aumentar gradualmente. Efeito em 4-6 semanas." },
  { name: "Fluoxetina", indication: "Depressão, TOC, ansiedade", dosePerKg: 0.5, maxDose: 60, frequency: "1x/dia", liquidConc: 4, form: "cápsula / solução oral (20mg/5mL)", notes: "Meia-vida longa — menos risco com esquecimento de dose. Cuidado com ativação." },
  { name: "Carbamazepina", indication: "Epilepsia, transtorno de humor", dosePerKg: 15, maxDose: 1200, frequency: "12/12h ou 8/8h", liquidConc: 20, form: "comprimido / xarope (20mg/mL)", notes: "Monitorar nível sérico (4-12mcg/mL). Induz enzimas hepáticas." },
  { name: "Valproato de Sódio", indication: "Epilepsia, transtorno bipolar", dosePerKg: 20, maxDose: 3000, frequency: "12/12h ou 8/8h", liquidConc: 57.6, form: "comprimido / xarope (57,6mg/mL)", notes: "Monitorar nível sérico (50-100mcg/mL). Hepatotoxicidade. Contraindicado em < 2 anos (uso criterioso)." },
  { name: "Lamotrigina", indication: "Epilepsia, transtorno bipolar", dosePerKg: 5, maxDose: 400, frequency: "12/12h", form: "comprimido", notes: "Titulação lenta obrigatória para evitar Stevens-Johnson. Dose varia muito com outros anticonvulsivantes." },
  { name: "Levetiracetam", indication: "Epilepsia", dosePerKg: 30, maxDose: 3000, frequency: "12/12h", liquidConc: 100, form: "comprimido / solução oral (100mg/mL)", notes: "Monitorar comportamento (irritabilidade). Boa tolerabilidade geral." },
  { name: "Topiramato", indication: "Epilepsia, migrânea profilática", dosePerKg: 3, maxDose: 400, frequency: "12/12h", form: "comprimido / cápsula sprinkle", notes: "Titulação lenta. Risco de nefrolitíase, hiposuor, perda ponderal." },
  { name: "Clobazam", indication: "Epilepsia (add-on)", dosePerKg: 0.5, maxDose: 40, frequency: "12/12h", form: "comprimido", notes: "Tolerância pode ocorrer. Benzodiazepínico — uso criterioso." },
  { name: "Melatonina", indication: "Distúrbios do sono, TEA", dosePerKg: 0, maxDose: 5, frequency: "30 min antes de dormir", fixedDose: "0,5-5mg fixo (não por peso)", form: "comprimido / drops", notes: "Iniciar com 0,5-1mg. Aumentar conforme necessidade. Muito segura." },
  { name: "Oxcarbazepina", indication: "Epilepsia focal", dosePerKg: 20, maxDose: 2400, frequency: "12/12h", liquidConc: 60, form: "comprimido / suspensão (60mg/mL)", notes: "Monitorar sódio sérico. Menos interações que carbamazepina." },
  { name: "Fenobarbital", indication: "Epilepsia (neonatal e em lactentes)", dosePerKg: 3, maxDose: 300, frequency: "1x/dia", liquidConc: 4, form: "comprimido / elixir (4mg/mL)", notes: "Nível sérico alvo 15-40 mcg/mL. Sedação e alteração cognitiva a longo prazo." },
  { name: "Clonazepam", indication: "Epilepsia, ansiedade, sínd. de Lennox-Gastaut", dosePerKg: 0.05, maxDose: 6, frequency: "8/8h ou 12/12h", liquidConc: 0.1, form: "comprimido / gotas (2,5mg/mL → diluir)", notes: "Cada gota ≈ 0,1mg. Tolerância pode se desenvolver. Retirada gradual." },
  { name: "Imipramina", indication: "Enurese, depressão, TDAH", dosePerKg: 1, maxDose: 200, frequency: "1x/dia (noite) ou 12/12h", form: "comprimido", notes: "Dose máxima 5mg/kg/dia (curto prazo). ECG antes de iniciar. Cuidado em cardiopatas." },
  { name: "Amitriptilina", indication: "Dor neuropática, migrânea, depressão", dosePerKg: 0.5, maxDose: 150, frequency: "1x/dia (noite)", form: "comprimido", notes: "Dose máxima 3mg/kg/dia. Efeitos anticolinérgicos. ECG antes de iniciar." },
  { name: "Olanzapina", indication: "Psicose, mania, TEA (grave)", dosePerKg: 0.1, maxDose: 20, frequency: "1x/dia", form: "comprimido", notes: "Alto risco de ganho de peso e síndrome metabólica. Monitorar glicemia e lipídios." },
  { name: "Quetiapina", indication: "Psicose, mania, insônia (baixa dose)", dosePerKg: 2, maxDose: 800, frequency: "12/12h ou 8/8h", form: "comprimido", notes: "Dose baixa (25-50mg) para sono. Dose alta para psicose. Sedação importante." },
  { name: "Haloperidol", indication: "Psicose, tiques, agitação", dosePerKg: 0.02, maxDose: 6, frequency: "12/12h", form: "comprimido", notes: "Risco de distonia aguda e efeitos extrapiramidais. Usar com cautela em crianças." },
  { name: "Periciazina", indication: "TEA, psicose, agitação", dosePerKg: 0.2, maxDose: 15, frequency: "12/12h ou 8/8h", liquidConc: 1, form: "comprimido / solução oral (1mg/mL)", notes: "Sedação significativa. Monitorar efeitos extrapiramidais." },
  { name: "Prometazina", indication: "Alergia, náusea, sedação", dosePerKg: 0.5, maxDose: 75, frequency: "8/8h", form: "comprimido / xarope", notes: "Contraindicado em < 2 anos (risco de apneia). Anti-histamínico sedante." },
  { name: "N-Acetilcisteína (NAC)", indication: "TEA (irritabilidade), TOC", dosePerKg: 30, maxDose: 2700, frequency: "12/12h ou 8/8h", form: "comprimido / sachê", notes: "Antioxidante. Evidências emergentes em TEA. Bem tolerado." },
  { name: "Memantina", indication: "TEA, Alzheimer precoce, TDAH grave", dosePerKg: 0.5, maxDose: 20, frequency: "12/12h", form: "comprimido", notes: "Antagonista NMDA. Titulação gradual. Bem tolerado em crianças." },
  { name: "Gabapentina", indication: "Epilepsia focal, dor neuropática", dosePerKg: 10, maxDose: 3600, frequency: "8/8h", form: "cápsula", notes: "Ajuste rápido possível. Sedação e tontura nas primeiras doses." },
  { name: "Pregabalina", indication: "Epilepsia focal, dor neuropática, ansiedade", dosePerKg: 3, maxDose: 600, frequency: "12/12h ou 8/8h", form: "cápsula", notes: "Similar à gabapentina, mais potente. Potencial de dependência." },
  { name: "Propranolol", indication: "Ansiedade de desempenho, migrânea, taquicardia", dosePerKg: 1, maxDose: 240, frequency: "8/8h ou 12/12h", form: "comprimido", notes: "Dose máxima 4mg/kg/dia. Contraindicado em asma, bloqueio AV. Monitorar FC e PA." },
  { name: "Flunarizina", indication: "Profilaxia de migrânea", dosePerKg: 0, maxDose: 10, frequency: "1x/dia (noite)", fixedDose: "5mg (< 40kg) / 10mg (≥ 40kg)", form: "cápsula", notes: "Uso por 3-6 meses. Cuidado com ganho de peso e depressão." },
  { name: "Amantadina", indication: "TDAH, fatiga cognitiva, TEA", dosePerKg: 5, maxDose: 300, frequency: "12/12h", form: "cápsula / xarope", notes: "Agonista dopaminérgico indireto. Evidências limitadas em pediatria." },
  { name: "Piracetam", indication: "Dislexia, déficits cognitivos", dosePerKg: 40, maxDose: 4800, frequency: "8/8h ou 12/12h", form: "comprimido", notes: "Nootropico. Evidências modestas. Muito bem tolerado." },
  { name: "Vigabatrina", indication: "Espasmos infantis, Sínd. West", dosePerKg: 50, maxDose: 3000, frequency: "12/12h", form: "sachê / comprimido", notes: "Déficits de campo visual (permanentes) — acompanhamento oftalmológico obrigatório." },
  { name: "Nitrazepam", indication: "Espasmos infantis, epilepsia refratária", dosePerKg: 0.3, maxDose: 10, frequency: "12/12h ou 8/8h", form: "comprimido", notes: "Benzodiazepínico. Salivação excessiva frequente. Monitorar deglutição." },
  { name: "Rufinamida", indication: "Sínd. Lennox-Gastaut (add-on)", dosePerKg: 15, maxDose: 3200, frequency: "12/12h", form: "comprimido / suspensão oral", notes: "Titular até 45mg/kg/dia se necessário. Tomar com alimentação." },
  { name: "Canabidiol (CBD)", indication: "Sínd. Dravet, Lennox-Gastaut, epilepsia refratária", dosePerKg: 5, maxDose: 1200, frequency: "12/12h", liquidConc: 100, form: "solução oral (100mg/mL)", notes: "Dose pode ir até 20mg/kg/dia. Monitorar enzimas hepáticas. Interações com valproato e clobazam." },
  { name: "Diazepam Retal", indication: "Crise epiléptica aguda", dosePerKg: 0.5, maxDose: 20, frequency: "dose única (emergência)", form: "solução retal", notes: "Dose única para status epilepticus. Monitorar respiração. Pode repetir após 10 min se necessário." },
  { name: "Midazolam Nasal", indication: "Crise epiléptica aguda", dosePerKg: 0.2, maxDose: 10, frequency: "dose única (emergência)", form: "solução intranasal", notes: "Aplicar metade em cada narina. Monitorar respiração. Alternativa prática ao diazepam retal." },
];

function calcResult(weight: number, med: MedDose) {
  if (med.fixedDose) return null;
  const idx8 = med.frequency.indexOf("8/8h");
  const idx12 = med.frequency.indexOf("12/12h");
  const timesPerDay = idx8 !== -1 && idx12 !== -1 ? (idx8 < idx12 ? 3 : 2) : idx8 !== -1 ? 3 : idx12 !== -1 ? 2 : 1;
  const safety = calculateMedicationSafety({
    weightKg: weight,
    doseMgPerKgDay: med.dosePerKg,
    maxMgDay: med.maxDose,
    frequencyPerDay: timesPerDay,
    concentrationMgPerMl: med.liquidConc,
    activeIngredient: med.name,
    source: "Catálogo local não normativo do NeuroPed; confirmar fonte clínica vigente antes de qualquer conduta.",
  });
  return {
    ...safety,
    dailyDose: safety.dailyMg ?? 0,
    cappedDailyDose: safety.cappedDailyMg ?? 0,
    dosePerIntake: safety.doseMg ?? 0,
    volumePerIntake: safety.volumeMl,
    exceedsMax: (safety.dailyMg ?? 0) > (safety.cappedDailyMg ?? 0),
    nearMax: (safety.dailyMg ?? 0) > med.maxDose * 0.85,
    timesPerDay,
  };
}

export default function CalculadoraDosePage() {
  const [weight, setWeight] = useState<string>("");
  const [selectedMed, setSelectedMed] = useState<string>("");
  const [search, setSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const med = useMemo(() => medications.find(m => m.name === selectedMed) || null, [selectedMed]);
  const weightNum = parseFloat(weight);
  const result = useMemo(() => {
    if (!med || !weightNum || weightNum <= 0) return null;
    return calcResult(weightNum, med);
  }, [med, weightNum]);

  const filteredMeds = useMemo(() => {
    const q = search.toLowerCase();
    return medications.filter(m =>
      m.name.toLowerCase().includes(q) || m.indication.toLowerCase().includes(q)
    );
  }, [search]);

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
        subtitle="Apoio determinístico — não prescreve nem altera conduta."
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
                type="number"
                placeholder="Ex: 25"
                value={weight}
                onChange={e => setWeight(e.target.value)}
                className="h-12 text-lg pr-10"
                min={1}
                max={150}
                data-testid="input-weight"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">kg</span>
            </div>
          </div>

          {/* Medication search/select */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Medicamento
            </label>
            <div className="relative">
              <Input
                placeholder="Digite o nome ou indicação..."
                value={search}
                onChange={e => {
                  setSearch(e.target.value);
                  setDropdownOpen(true);
                  if (e.target.value !== selectedMed) setSelectedMed("");
                }}
                onFocus={() => setDropdownOpen(true)}
                className="h-12"
                data-testid="input-medication-search"
              />
              {dropdownOpen && filteredMeds.length > 0 && search && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-64 overflow-y-auto">
                  {filteredMeds.map(m => (
                    <button
                      key={m.name}
                      className="w-full text-left px-4 py-2.5 hover:bg-accent transition-colors border-b border-border/50 last:border-0"
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
                {med.liquidConc && <Badge variant="outline" className="text-blue-600 border-blue-300">Líquido: {med.liquidConc}mg/mL</Badge>}
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

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/70 dark:bg-white/5 rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">Dose calculada</p>
                    <p className="text-xl font-bold text-foreground">{(result.dailyDose).toFixed(1)}</p>
                    <p className="text-xs text-muted-foreground">mg/dia</p>
                  </div>
                  <div className="bg-white/70 dark:bg-white/5 rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">Dose a usar</p>
                    <p className={`text-xl font-bold ${result.exceedsMax ? "text-red-600" : "text-foreground"}`}>{(result.cappedDailyDose).toFixed(1)}</p>
                    <p className="text-xs text-muted-foreground">mg/dia (limite configurado: {med.maxDose}mg)</p>
                  </div>
                  <div className="bg-white/70 dark:bg-white/5 rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">Por tomada</p>
                    <p className="text-xl font-bold text-foreground">{(result.dosePerIntake).toFixed(1)}</p>
                    <p className="text-xs text-muted-foreground">mg ({med.frequency})</p>
                  </div>
                  {result.volumePerIntake !== null && (
                    <div className="bg-blue-100/70 dark:bg-blue-950/30 rounded-lg p-3 text-center">
                      <p className="text-xs text-muted-foreground">Volume por tomada</p>
                      <p className="text-xl font-bold text-blue-700 dark:text-blue-300">{(result.volumePerIntake!).toFixed(1)}</p>
                      <p className="text-xs text-muted-foreground">mL ({med.liquidConc}mg/mL)</p>
                    </div>
                  )}
                </div>

                <div className="rounded-lg bg-white/60 dark:bg-white/5 border border-border/50 p-3 space-y-1">
                  <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Fórmula:</span> {result.formula}</p>
                  <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Fonte:</span> {result.source}</p>
                  {result.warnings.length > 0 && <p className="text-xs text-amber-700 dark:text-amber-300"><span className="font-medium">Alertas:</span> {result.warnings.join("; ")}</p>}
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
