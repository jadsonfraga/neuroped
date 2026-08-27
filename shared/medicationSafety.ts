export interface MedicationSafetyInput {
  weightKg: number;
  doseMgPerKgDay?: number;
  maxMgPerKgDay?: number;
  maxMgDay?: number;
  frequencyPerDay: number;
  concentrationMgPerMl?: number;
  activeIngredient: string;
  currentActiveIngredients?: string[];
  recordedAllergies?: string[];
  source: string;
}

export interface MedicationSafetyResult {
  ok: boolean;
  dailyMg: number | null;
  cappedDailyMg: number | null;
  doseMg: number | null;
  volumeMl: number | null;
  formula: string;
  warnings: string[];
  missingData: string[];
  duplicateActiveIngredient: boolean;
  allergyMatch: boolean;
  source: string;
}

function finitePositive(value: number | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}
function normalize(value: string): string { return value.normalize("NFKC").trim().toLocaleLowerCase("pt-BR"); }

export function calculateMedicationSafety(input: MedicationSafetyInput): MedicationSafetyResult {
  const warnings: string[] = [];
  const missingData: string[] = [];
  const weightOk = finitePositive(input.weightKg) && input.weightKg <= 300;
  const frequencyOk = Number.isInteger(input.frequencyPerDay) && input.frequencyPerDay >= 1 && input.frequencyPerDay <= 24;
  if (!weightOk) missingData.push("peso_kilogramas_valido");
  if (!frequencyOk) missingData.push("frequencia_diaria_valida");
  if (!finitePositive(input.doseMgPerKgDay) && !finitePositive(input.maxMgPerKgDay)) missingData.push("dose_de_referencia");
  if (!input.source.trim()) missingData.push("fonte_explicita");
  if (input.concentrationMgPerMl !== undefined && !finitePositive(input.concentrationMgPerMl)) missingData.push("concentracao_mg_por_ml_valida");

  const activeIngredient = normalize(input.activeIngredient);
  const duplicateActiveIngredient = Boolean(activeIngredient && (input.currentActiveIngredients ?? []).some((item) => normalize(item) === activeIngredient));
  const allergyMatch = Boolean(activeIngredient && (input.recordedAllergies ?? []).some((item) => normalize(item).includes(activeIngredient) || activeIngredient.includes(normalize(item))));
  if (duplicateActiveIngredient) warnings.push("princípio_ativo_duplicado");
  if (allergyMatch) warnings.push("alergia_registrada_compatível");

  if (missingData.length > 0 || !weightOk || !frequencyOk) {
    return { ok: false, dailyMg: null, cappedDailyMg: null, doseMg: null, volumeMl: null, formula: "Cálculo bloqueado até preencher os dados obrigatórios.", warnings, missingData, duplicateActiveIngredient, allergyMatch, source: input.source };
  }

  const dailyMg = input.weightKg * (input.doseMgPerKgDay ?? 0);
  const limits = [dailyMg];
  if (finitePositive(input.maxMgDay)) limits.push(input.maxMgDay);
  if (finitePositive(input.maxMgPerKgDay)) limits.push(input.weightKg * input.maxMgPerKgDay);
  const cappedDailyMg = Math.min(...limits);
  const doseMg = cappedDailyMg / input.frequencyPerDay;
  const volumeMl = finitePositive(input.concentrationMgPerMl) ? doseMg / input.concentrationMgPerMl : null;
  if (!finitePositive(input.concentrationMgPerMl)) missingData.push("concentracao_para_volume");
  if (dailyMg > cappedDailyMg) warnings.push("limite_configuravel_aplicado");
  warnings.push("não é prescrição automática; validar conduta, unidade, fonte e paciente");

  return {
    ok: !duplicateActiveIngredient && !allergyMatch,
    dailyMg,
    cappedDailyMg,
    doseMg,
    volumeMl,
    formula: `mg/kg/dia × peso = ${input.doseMgPerKgDay} × ${input.weightKg} = ${dailyMg.toFixed(3)} mg/dia; mg/dia ÷ ${input.frequencyPerDay} = ${doseMg.toFixed(3)} mg por tomada${volumeMl === null ? "" : `; mg por tomada ÷ ${input.concentrationMgPerMl} mg/mL = ${volumeMl.toFixed(3)} mL`}`,
    warnings,
    missingData,
    duplicateActiveIngredient,
    allergyMatch,
    source: input.source,
  };
}
