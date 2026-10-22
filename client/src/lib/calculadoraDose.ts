/**
 * Calculadora de dose pediátrica por peso — dados e cálculo.
 *
 * Apoio clínico: os valores de referência abaixo são os que a página já
 * exibia. Este módulo só calcula e formata; dose, posologia e conduta são
 * decisão do médico.
 */

export type LiquidUnit = "mL" | "gota";

export interface MedDose {
  name: string;
  indication: string;
  dosePerKg: number; // mg/kg/dia
  maxDose: number; // mg/dia
  frequency: string;
  /** mg por unidade de volume da apresentação líquida (mL ou gota). */
  liquid?: { mgPer: number; unit: LiquidUnit };
  form: string;
  notes: string;
  fixedDose?: string; // medicamentos de dose fixa
}

export const WEIGHT_MAX_KG = 150;

export const medications: MedDose[] = [
  { name: "Risperidona", indication: "TEA, psicose, irritabilidade", dosePerKg: 0.02, maxDose: 6, frequency: "12/12h", liquid: { mgPer: 1, unit: "mL" }, form: "comprimido / solução oral (1mg/mL)", notes: "Iniciar com dose baixa. Monitorar prolactina e ganho de peso." },
  { name: "Aripiprazol", indication: "TEA, TDAH, psicose", dosePerKg: 0.1, maxDose: 30, frequency: "1x/dia", form: "comprimido", notes: "Menor risco metabólico que outros antipsicóticos." },
  { name: "Metilfenidato", indication: "TDAH", dosePerKg: 1, maxDose: 60, frequency: "8/8h ou 12/12h", form: "comprimido / cápsula LP", notes: "Dar com alimentação. Monitorar PA e FC. Não usar em <6 anos." },
  { name: "Lisdexanfetamina", indication: "TDAH", dosePerKg: 0, maxDose: 70, frequency: "1x/dia", fixedDose: "30-70mg fixo (não por peso)", form: "cápsula", notes: "Iniciar com 30mg. Ajuste a cada 1-2 semanas conforme resposta." },
  { name: "Clonidina", indication: "TDAH, tiques, sono", dosePerKg: 0.004, maxDose: 0.4, frequency: "8/8h ou 12/12h", form: "comprimido", notes: "Cuidado com hipotensão. Não interromper abruptamente." },
  { name: "Guanfacina", indication: "TDAH, tiques", dosePerKg: 0.05, maxDose: 4, frequency: "1x/dia", form: "comprimido", notes: "Preferir à noite. Monitorar PA. Retirada gradual." },
  { name: "Atomoxetina", indication: "TDAH", dosePerKg: 1.2, maxDose: 100, frequency: "1x/dia ou 12/12h", form: "cápsula", notes: "Efeito completo em 4-6 semanas. Monitorar humor nas primeiras semanas." },
  { name: "Sertralina", indication: "Ansiedade, TOC, depressão", dosePerKg: 1, maxDose: 200, frequency: "1x/dia", form: "comprimido", notes: "Iniciar com metade da dose. Aumentar gradualmente. Efeito em 4-6 semanas." },
  { name: "Fluoxetina", indication: "Depressão, TOC, ansiedade", dosePerKg: 0.5, maxDose: 60, frequency: "1x/dia", liquid: { mgPer: 4, unit: "mL" }, form: "cápsula / solução oral (20mg/5mL)", notes: "Meia-vida longa — menos risco com esquecimento de dose. Cuidado com ativação." },
  { name: "Carbamazepina", indication: "Epilepsia, transtorno de humor", dosePerKg: 15, maxDose: 1200, frequency: "12/12h ou 8/8h", liquid: { mgPer: 20, unit: "mL" }, form: "comprimido / xarope (20mg/mL)", notes: "Monitorar nível sérico (4-12mcg/mL). Induz enzimas hepáticas." },
  { name: "Valproato de Sódio", indication: "Epilepsia, transtorno bipolar", dosePerKg: 20, maxDose: 3000, frequency: "12/12h ou 8/8h", liquid: { mgPer: 57.6, unit: "mL" }, form: "comprimido / xarope (57,6mg/mL)", notes: "Monitorar nível sérico (50-100mcg/mL). Hepatotoxicidade. Contraindicado em < 2 anos (uso criterioso)." },
  { name: "Lamotrigina", indication: "Epilepsia, transtorno bipolar", dosePerKg: 5, maxDose: 400, frequency: "12/12h", form: "comprimido", notes: "Titulação lenta obrigatória para evitar Stevens-Johnson. Dose varia muito com outros anticonvulsivantes." },
  { name: "Levetiracetam", indication: "Epilepsia", dosePerKg: 30, maxDose: 3000, frequency: "12/12h", liquid: { mgPer: 100, unit: "mL" }, form: "comprimido / solução oral (100mg/mL)", notes: "Monitorar comportamento (irritabilidade). Boa tolerabilidade geral." },
  { name: "Topiramato", indication: "Epilepsia, migrânea profilática", dosePerKg: 3, maxDose: 400, frequency: "12/12h", form: "comprimido / cápsula sprinkle", notes: "Titulação lenta. Risco de nefrolitíase, hiposuor, perda ponderal." },
  { name: "Clobazam", indication: "Epilepsia (add-on)", dosePerKg: 0.5, maxDose: 40, frequency: "12/12h", form: "comprimido", notes: "Tolerância pode ocorrer. Benzodiazepínico — uso criterioso." },
  { name: "Melatonina", indication: "Distúrbios do sono, TEA", dosePerKg: 0, maxDose: 5, frequency: "30 min antes de dormir", fixedDose: "0,5-5mg fixo (não por peso)", form: "comprimido / drops", notes: "Iniciar com 0,5-1mg. Aumentar conforme necessidade. Muito segura." },
  { name: "Oxcarbazepina", indication: "Epilepsia focal", dosePerKg: 20, maxDose: 2400, frequency: "12/12h", liquid: { mgPer: 60, unit: "mL" }, form: "comprimido / suspensão (60mg/mL)", notes: "Monitorar sódio sérico. Menos interações que carbamazepina." },
  { name: "Fenobarbital", indication: "Epilepsia (neonatal e em lactentes)", dosePerKg: 3, maxDose: 300, frequency: "1x/dia", liquid: { mgPer: 4, unit: "mL" }, form: "comprimido / elixir (4mg/mL)", notes: "Nível sérico alvo 15-40 mcg/mL. Sedação e alteração cognitiva a longo prazo." },
  // A apresentação em gotas tem 2,5 mg/mL e 0,1 mg por gota (nota abaixo): o
  // volume sai em gotas. Calculado como mL, saía 25 vezes maior.
  { name: "Clonazepam", indication: "Epilepsia, ansiedade, sínd. de Lennox-Gastaut", dosePerKg: 0.05, maxDose: 6, frequency: "8/8h ou 12/12h", liquid: { mgPer: 0.1, unit: "gota" }, form: "comprimido / gotas (2,5mg/mL → diluir)", notes: "Cada gota ≈ 0,1mg. Tolerância pode se desenvolver. Retirada gradual." },
  { name: "Imipramina", indication: "Enurese, depressão, TDAH", dosePerKg: 1, maxDose: 200, frequency: "1x/dia (noite) ou 12/12h", form: "comprimido", notes: "Dose máxima 5mg/kg/dia (curto prazo). ECG antes de iniciar. Cuidado em cardiopatas." },
  { name: "Amitriptilina", indication: "Dor neuropática, migrânea, depressão", dosePerKg: 0.5, maxDose: 150, frequency: "1x/dia (noite)", form: "comprimido", notes: "Dose máxima 3mg/kg/dia. Efeitos anticolinérgicos. ECG antes de iniciar." },
  { name: "Olanzapina", indication: "Psicose, mania, TEA (grave)", dosePerKg: 0.1, maxDose: 20, frequency: "1x/dia", form: "comprimido", notes: "Alto risco de ganho de peso e síndrome metabólica. Monitorar glicemia e lipídios." },
  { name: "Quetiapina", indication: "Psicose, mania, insônia (baixa dose)", dosePerKg: 2, maxDose: 800, frequency: "12/12h ou 8/8h", form: "comprimido", notes: "Dose baixa (25-50mg) para sono. Dose alta para psicose. Sedação importante." },
  { name: "Haloperidol", indication: "Psicose, tiques, agitação", dosePerKg: 0.02, maxDose: 6, frequency: "12/12h", form: "comprimido", notes: "Risco de distonia aguda e efeitos extrapiramidais. Usar com cautela em crianças." },
  { name: "Periciazina", indication: "TEA, psicose, agitação", dosePerKg: 0.2, maxDose: 15, frequency: "12/12h ou 8/8h", liquid: { mgPer: 1, unit: "mL" }, form: "comprimido / solução oral (1mg/mL)", notes: "Sedação significativa. Monitorar efeitos extrapiramidais." },
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
  { name: "Canabidiol (CBD)", indication: "Sínd. Dravet, Lennox-Gastaut, epilepsia refratária", dosePerKg: 5, maxDose: 1200, frequency: "12/12h", liquid: { mgPer: 100, unit: "mL" }, form: "solução oral (100mg/mL)", notes: "Dose pode ir até 20mg/kg/dia. Monitorar enzimas hepáticas. Interações com valproato e clobazam." },
  { name: "Diazepam Retal", indication: "Crise epiléptica aguda", dosePerKg: 0.5, maxDose: 20, frequency: "dose única (emergência)", form: "solução retal", notes: "Dose única para status epilepticus. Monitorar respiração. Pode repetir após 10 min se necessário." },
  { name: "Midazolam Nasal", indication: "Crise epiléptica aguda", dosePerKg: 0.2, maxDose: 10, frequency: "dose única (emergência)", form: "solução intranasal", notes: "Aplicar metade em cada narina. Monitorar respiração. Alternativa prática ao diazepam retal." },
];

export interface IntakeSchedule {
  /** Trecho da frequência a que esta divisão corresponde (ex.: "8/8h"). */
  label: string;
  timesPerDay: number;
}

/**
 * Lê as opções de frequência na ordem em que aparecem ("8/8h ou 12/12h" →
 * 3 e 2 tomadas). Antes, só a primeira opção era usada e "1x/dia ou 12/12h"
 * dividia por 2 sem dizer: a tela mostrava metade da dose como a tomada única.
 */
export function intakeSchedules(frequency: string): IntakeSchedule[] {
  const found: Array<IntakeSchedule & { index: number }> = [];
  for (const match of frequency.matchAll(/(\d+)\/(\d+)h/g)) {
    const hours = Number(match[1]);
    if (hours > 0 && hours === Number(match[2]) && 24 % hours === 0) {
      found.push({ index: match.index ?? 0, label: match[0], timesPerDay: 24 / hours });
    }
  }
  for (const match of frequency.matchAll(/(\d+)x\/dia/g)) {
    const times = Number(match[1]);
    if (times > 0) found.push({ index: match.index ?? 0, label: match[0], timesPerDay: times });
  }
  found.sort((a, b) => a.index - b.index);
  const unique = found.filter((item, i) => found.findIndex((other) => other.timesPerDay === item.timesPerDay) === i);
  return unique.length > 0
    ? unique.map(({ label, timesPerDay }) => ({ label, timesPerDay }))
    : [{ label: frequency, timesPerDay: 1 }];
}

export interface IntakeResult extends IntakeSchedule {
  dosePerIntake: number;
  volumePerIntake: number | null;
}

export interface DoseResult {
  dailyDose: number;
  cappedDailyDose: number;
  exceedsMax: boolean;
  nearMax: boolean;
  intakes: IntakeResult[];
}

export function calcResult(weight: number, med: MedDose): DoseResult | null {
  if (med.fixedDose) return null;
  const dailyDose = weight * med.dosePerKg;
  const cappedDailyDose = Math.min(dailyDose, med.maxDose);
  const intakes = intakeSchedules(med.frequency).map((schedule) => {
    const dosePerIntake = cappedDailyDose / schedule.timesPerDay;
    return {
      ...schedule,
      dosePerIntake,
      volumePerIntake: med.liquid ? dosePerIntake / med.liquid.mgPer : null,
    };
  });
  return {
    dailyDose,
    cappedDailyDose,
    exceedsMax: dailyDose > med.maxDose,
    nearMax: dailyDose > med.maxDose * 0.85,
    intakes,
  };
}

/**
 * Número em pt-BR com precisão proporcional ao valor. Com uma casa fixa, doses
 * abaixo de 0,05 mg saíam "0,0" e a tomada de 0,05 mg aparecia igual à diária.
 */
export function formatDose(value: number): string {
  if (!Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  const options: Intl.NumberFormatOptions = abs === 0
    ? { maximumFractionDigits: 0 }
    : abs < 1
      ? { maximumSignificantDigits: 2 }
      : abs < 10
        ? { maximumFractionDigits: 2 }
        : { maximumFractionDigits: 1 };
  return new Intl.NumberFormat("pt-BR", options).format(value);
}

export function liquidUnitLabel(unit: LiquidUnit, value: number): string {
  if (unit === "mL") return "mL";
  return value === 1 ? "gota" : "gotas";
}

export type WeightInput =
  | { ok: true; kg: number }
  | { ok: false; reason: "vazio" | "invalido" | "fora_da_faixa" };

/** Aceita vírgula decimal e recusa peso fora de (0, 150] kg em vez de calcular. */
export function parseWeight(raw: string): WeightInput {
  const text = raw.trim().replace(",", ".");
  if (!text) return { ok: false, reason: "vazio" };
  if (!/^\d+(\.\d+)?$/.test(text)) return { ok: false, reason: "invalido" };
  const kg = Number(text);
  if (!Number.isFinite(kg) || kg <= 0) return { ok: false, reason: "invalido" };
  if (kg > WEIGHT_MAX_KG) return { ok: false, reason: "fora_da_faixa" };
  return { ok: true, kg };
}
