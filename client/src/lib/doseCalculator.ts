export interface MedDose {
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

export interface DoseResult {
  dailyDose: number;
  cappedDailyDose: number;
  dosePerIntake: number;
  volumePerIntake: number | null;
  exceedsMax: boolean;
  nearMax: boolean;
  timesPerDay: number;
}

export function getTimesPerDay(frequency: string): number {
  const idx8 = frequency.indexOf("8/8h");
  const idx12 = frequency.indexOf("12/12h");
  if (idx8 !== -1 && idx12 !== -1) {
    // Frequência ambígua ("X ou Y"): usa a opção citada primeiro no rótulo,
    // para que "Por tomada" corresponda ao que a badge exibe.
    return idx8 < idx12 ? 3 : 2;
  }
  if (idx8 !== -1) return 3;
  if (idx12 !== -1) return 2;
  return 1;
}

export function calcDoseResult(weight: number, med: MedDose): DoseResult | null {
  if (med.fixedDose) return null;
  const dailyDose = weight * med.dosePerKg;
  const cappedDailyDose = Math.min(dailyDose, med.maxDose);
  const timesPerDay = getTimesPerDay(med.frequency);
  const dosePerIntake = cappedDailyDose / timesPerDay;
  const volumePerIntake = med.liquidConc ? dosePerIntake / med.liquidConc : null;
  const exceedsMax = dailyDose > med.maxDose;
  const nearMax = dailyDose > med.maxDose * 0.85;
  return { dailyDose, cappedDailyDose, dosePerIntake, volumePerIntake, exceedsMax, nearMax, timesPerDay };
}
