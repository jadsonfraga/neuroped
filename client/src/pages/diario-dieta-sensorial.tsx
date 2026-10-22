import { Waves } from "lucide-react";
import { DiarioClinico, type DiarioConfig } from "@/components/DiarioClinico";

/**
 * Registro observacional do que foi oferecido e da resposta percebida.
 * Não mede eficácia e não substitui uma prescrição de terapia.
 */
const config: DiarioConfig = {
  id: "diario-dieta-sensorial",
  storageKey: "neuroped:diario:dieta-sensorial:v1",
  title: "Diário da dieta sensorial",
  subtitle: "Registro observacional das estratégias oferecidas e da resposta percebida. Não é escore, não é ponto de corte e não é diagnóstico.",
  icon: Waves,
  gradient: "from-cyan-500 to-sky-600",
  trendLabel: "Resposta percebida",
  fields: [
    { key: "date", label: "Data", type: "date", required: true },
    {
      key: "momento",
      label: "Momento",
      type: "select",
      options: ["manhã", "antes de sair", "escola", "tarde", "noite", "transição"],
    },
    { key: "estrategia", label: "O que foi oferecido", type: "text", placeholder: "em palavras de quem acompanhou" },
    {
      key: "canal",
      label: "Tipo de estratégia",
      type: "select",
      options: ["movimento", "toque ou pressão", "corpo e peso", "som", "visual", "oral", "outro"],
    },
    {
      key: "realizacao",
      label: "O que aconteceu",
      type: "select",
      options: ["realizou", "realizou em parte", "recusou", "não foi oferecida"],
    },
    { key: "duracao_min", label: "Duração aproximada (min)", type: "number", min: 0, max: 120 },
    {
      key: "resposta",
      label: "Resposta percebida depois (1–5)",
      type: "number",
      min: 1,
      max: 5,
      trend: true,
    },
    { key: "notes", label: "Observações", type: "textarea", placeholder: "o que mudou no corpo, no humor ou na atividade…" },
  ],
};

export default function DiarioDietaSensorialPage() {
  return <DiarioClinico config={config} />;
}
