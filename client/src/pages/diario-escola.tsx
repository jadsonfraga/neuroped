import { School } from "lucide-react";
import { DiarioClinico, type DiarioConfig } from "@/components/DiarioClinico";

const config: DiarioConfig = {
  id: "diario-escola",
  storageKey: "neuroped:diario:escola:v1",
  title: "Diário Escolar",
  subtitle: "Comportamento, rendimento e ocorrências do dia",
  icon: School,
  gradient: "from-sky-500 to-blue-600",
  trendLabel: "Comportamento",
  fields: [
    { key: "date", label: "Data", type: "date", required: true },
    { key: "rendimento", label: "Rendimento acadêmico (1–5)", type: "number", min: 1, max: 5 },
    { key: "comportamento", label: "Comportamento (1–5)", type: "number", min: 1, max: 5, trend: true },
    { key: "atencao", label: "Atenção / foco (1–5)", type: "number", min: 1, max: 5 },
    {
      key: "humor", label: "Humor predominante", type: "select",
      options: ["tranquilo", "agitado", "irritado", "retraído", "ansioso", "alegre"],
    },
    { key: "ocorrencias", label: "Ocorrências", type: "text", placeholder: "conflito, saída de sala, crise…" },
    { key: "antecedente", label: "Antecedente (o que veio antes)", type: "text" },
    { key: "intervencao", label: "Intervenção da escola", type: "text", placeholder: "o que a equipe fez" },
    { key: "notes", label: "Observações", type: "textarea" },
  ],
};

export default function DiarioEscolaPage() {
  return <DiarioClinico config={config} />;
}
