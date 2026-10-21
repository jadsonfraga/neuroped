import { Pill } from "lucide-react";
import { DiarioClinico, type DiarioConfig } from "@/components/DiarioClinico";

/**
 * Registro observacional longitudinal no motor DiarioClinico.
 * Não pontua adesão, não calcula dose e não altera tratamento.
 */
const config: DiarioConfig = {
  id: "diario-aderencia",
  storageKey: "neuroped:diario:aderencia:v1",
  title: "Diário de aderência",
  subtitle: "Registro observacional do combinado e do que foi feito. Não é escore, não é ponto de corte e não é diagnóstico.",
  icon: Pill,
  gradient: "from-teal-500 to-emerald-600",
  trendLabel: "Cumprimento percebido",
  fields: [
    { key: "date", label: "Data", type: "date", required: true },
    {
      key: "plano",
      label: "O que estava combinado",
      type: "select",
      options: ["medicação", "terapia", "orientação em casa", "estratégia sensorial", "outro"],
    },
    { key: "combinado", label: "Descrição do combinado", type: "text", placeholder: "em palavras da família ou da escola" },
    {
      key: "cumprimento",
      label: "O que aconteceu",
      type: "select",
      options: ["seguiu", "seguiu em parte", "não seguiu", "não observado"],
    },
    { key: "horario", label: "Horário observado", type: "time" },
    { key: "motivo", label: "O que impediu, se não seguiu", type: "text" },
    {
      key: "percepcao",
      label: "Cumprimento percebido (1–5)",
      type: "number",
      min: 1,
      max: 5,
      trend: true,
    },
    { key: "notes", label: "Observações", type: "textarea", placeholder: "quem registrou, contexto do dia…" },
  ],
};

export default function DiarioAderenciaPage() {
  return <DiarioClinico config={config} />;
}
