import { Moon } from "lucide-react";
import { DiarioClinico, type DiarioConfig } from "@/components/DiarioClinico";

const config: DiarioConfig = {
  id: "diario-sono",
  storageKey: "neuroped:diario:sono:v1",
  title: "Diário do Sono",
  subtitle: "Hora de dormir, despertares e qualidade percebida",
  icon: Moon,
  gradient: "from-indigo-500 to-violet-600",
  trendLabel: "Qualidade do sono",
  fields: [
    { key: "date", label: "Data", type: "date", required: true },
    { key: "bedtime", label: "Hora de deitar", type: "time" },
    { key: "sleep_onset_min", label: "Tempo para pegar no sono (min)", type: "number", min: 0, max: 180 },
    { key: "wakeups", label: "Quantas vezes acordou", type: "number", min: 0, max: 20 },
    { key: "wake_time", label: "Hora de acordar", type: "time" },
    { key: "quality", label: "Qualidade do sono (1–5)", type: "number", min: 1, max: 5, trend: true },
    { key: "notes", label: "Observações", type: "textarea", placeholder: "soneca diurna, pesadelos, ronco…" },
  ],
};

export default function DiarioSonoPage() {
  return <DiarioClinico config={config} />;
}
