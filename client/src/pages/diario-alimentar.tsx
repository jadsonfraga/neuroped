import { UtensilsCrossed } from "lucide-react";
import { DiarioClinico, type DiarioConfig } from "@/components/DiarioClinico";

const config: DiarioConfig = {
  id: "diario-alimentar",
  storageKey: "neuroped:diario:alimentar:v1",
  title: "Diário Alimentar",
  subtitle: "Aceite alimentar, recusas e nível de seletividade",
  icon: UtensilsCrossed,
  gradient: "from-orange-500 to-amber-600",
  trendLabel: "Seletividade",
  fields: [
    { key: "date", label: "Data", type: "date", required: true },
    {
      key: "refeicao", label: "Refeição", type: "select",
      options: ["café da manhã", "lanche manhã", "almoço", "lanche tarde", "jantar", "ceia"],
    },
    { key: "refeicoes_aceitas", label: "Aceitação da refeição (0–100%)", type: "number", min: 0, max: 100 },
    { key: "alimentos_novos", label: "Alimentos novos aceitos", type: "text", placeholder: "ex.: brócolis, manga…" },
    { key: "recusas", label: "Recusas / rejeições", type: "text", placeholder: "ex.: arroz, carne…" },
    { key: "seletividade", label: "Seletividade (1–5)", type: "number", min: 1, max: 5, trend: true },
    {
      key: "contexto", label: "Contexto da refeição", type: "select",
      options: ["calmo", "com distração (tela)", "com recusa/birra", "em grupo", "forçado"],
    },
    { key: "notes", label: "Observações", type: "textarea", placeholder: "texturas, ânsia, demora…" },
  ],
};

export default function DiarioAlimentarPage() {
  return <DiarioClinico config={config} />;
}
