import { Activity } from "lucide-react";
import { DiarioClinico, type DiarioConfig } from "@/components/DiarioClinico";

/**
 * Registro observacional de episódios percebidos.
 * Não é o monitor autoral de irritabilidade e não interpreta o episódio.
 */
const config: DiarioConfig = {
  id: "diario-desregulacao",
  storageKey: "neuroped:diario:desregulacao:v1",
  title: "Diário de desregulação",
  subtitle: "Registro observacional de episódios percebidos. Não é escore, não é ponto de corte e não é diagnóstico.",
  icon: Activity,
  gradient: "from-rose-500 to-orange-600",
  trendLabel: "Intensidade percebida",
  fields: [
    { key: "date", label: "Data", type: "date", required: true },
    { key: "hora", label: "Hora aproximada", type: "time" },
    {
      key: "contexto",
      label: "Onde aconteceu",
      type: "select",
      options: ["casa", "escola", "terapia", "transição", "passeio", "outro"],
    },
    { key: "duracao_min", label: "Duração percebida (min)", type: "number", min: 0, max: 240 },
    {
      key: "intensidade",
      label: "Intensidade percebida (1–5)",
      type: "number",
      min: 1,
      max: 5,
      trend: true,
    },
    { key: "antes", label: "O que veio antes", type: "text", placeholder: "pedido, espera, barulho, mudança de atividade…" },
    { key: "o_que_ajudou", label: "O que ajudou a voltar", type: "text" },
    {
      key: "recuperacao",
      label: "Como terminou",
      type: "select",
      options: ["voltou ao habitual", "ainda agitado", "precisou de adulto o tempo todo", "não observado"],
    },
    { key: "notes", label: "Observações", type: "textarea" },
  ],
};

export default function DiarioDesregulacaoPage() {
  return <DiarioClinico config={config} />;
}
