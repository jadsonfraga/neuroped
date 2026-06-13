import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, HelpCircle } from "lucide-react";
import type { QueixaAgeRecommendations } from "@/data/filterRecommendationsOPB";

interface OPBRecommendationCardsProps {
  recommendations: QueixaAgeRecommendations;
  onSelectScale?: (scaleId: string) => void;
}

export function OPBRecommendationCards({ recommendations, onSelectScale }: OPBRecommendationCardsProps) {
  const sealConfig = {
    ouro: {
      label: "🏆 OURO - Essencial",
      bg: "bg-amber-50 dark:bg-amber-950/30",
      border: "border-amber-300 dark:border-amber-700",
      badge: "bg-amber-100 text-amber-900 dark:bg-amber-900 dark:text-amber-100",
    },
    prata: {
      label: "🥈 PRATA - Complementar",
      bg: "bg-slate-50 dark:bg-slate-950/30",
      border: "border-slate-300 dark:border-slate-700",
      badge: "bg-slate-100 text-slate-900 dark:bg-slate-900 dark:text-slate-100",
    },
    bronze: {
      label: "🥉 BRONZE - Adicional",
      bg: "bg-orange-50 dark:bg-orange-950/30",
      border: "border-orange-300 dark:border-orange-700",
      badge: "bg-orange-100 text-orange-900 dark:bg-orange-900 dark:text-orange-100",
    },
  };

  const renderCard = (seal: "ouro" | "prata" | "bronze") => {
    const rec = recommendations[seal];
    const config = sealConfig[seal];

    return (
      <Card key={seal} className={`${config.bg} border-2 ${config.border}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <CardTitle className="text-base">{rec.scaleName}</CardTitle>
              <CardDescription className="text-xs mt-1">{rec.time}</CardDescription>
            </div>
            <Badge className={config.badge} variant="secondary">
              {seal.toUpperCase()}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Pergunta Principal */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <HelpCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <p className="text-xs font-semibold text-blue-900 dark:text-blue-100">
                O que esta escala quer saber?
              </p>
            </div>
            <p className="text-sm font-medium text-foreground">{rec.mainQuestion}</p>
          </div>

          {/* Exemplo para Pais */}
          <div>
            <p className="text-xs font-semibold text-amber-900 dark:text-amber-200 mb-1">
              💬 O que será avaliado / respondido:
            </p>
            <p className="text-sm text-muted-foreground italic bg-white/50 dark:bg-black/20 p-2 rounded">
              &quot;{rec.parentExample}&quot;
            </p>
          </div>

          {/* Por que é útil */}
          <div>
            <p className="text-xs font-semibold text-green-900 dark:text-green-200 mb-1">
              ✓ Por que ajuda neste caso:
            </p>
            <p className="text-sm text-muted-foreground">{rec.whyUseful}</p>
          </div>

          {/* Botão de ação */}
          <Button
            onClick={() => onSelectScale?.(rec.scaleId)}
            variant="outline"
            size="sm"
            className="w-full gap-2 mt-2"
          >
            Usar esta escala
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho de contexto */}
      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
          ℹ️ Recomendações Estruturadas para {recommendations.ageRange}
        </p>
        <p className="text-xs text-blue-800 dark:text-blue-200 mt-1">
          Mostramos exatamente 1 escala de cada tipo. OURO = recomendada em primeiro lugar.
          PRATA = complementa a OURO. BRONZE = use se precisar de mais informações.
        </p>
      </div>

      {/* Cards das 3 recomendações */}
      <div className="grid gap-4 md:grid-cols-3">
        {renderCard("ouro")}
        {renderCard("prata")}
        {renderCard("bronze")}
      </div>

      {/* Explicação sobre como usar */}
      <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <p className="text-sm font-semibold text-green-900 dark:text-green-100 mb-2">
          Como usar essas recomendações:
        </p>
        <ul className="text-xs text-green-800 dark:text-green-200 space-y-1">
          <li>
            <strong>Comece pela OURO:</strong> Ela responde à pergunta clínica principal para esta faixa etária e queixa.
          </li>
          <li>
            <strong>Adicione PRATA se:</strong> Você quer mais detalhes ou confirmação. Ela complementa a OURO.
          </li>
          <li>
            <strong>Use BRONZE quando:</strong> OURO + PRATA deixarem dúvidas. Ou se quiser visão muito abrangente.
          </li>
          <li>
            <strong>NÃO use todas 3 rotineiramente:</strong> Cansam o paciente/família. Escolha estrategicamente.
          </li>
        </ul>
      </div>
    </div>
  );
}
