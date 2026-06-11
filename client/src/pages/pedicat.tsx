// TEMPLATE - Copiar e adaptar para cada escala
// Substitua: "pedicat", "PEDI-CAT", "PEDI-CAT", etc.

import { useLocation } from "wouter";
import { ArrowLeft, Download, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { allScales } from "@/data/scaleFilter";

const SCALE_CONFIG = {
  id: "pedicat", // ex: "bayley"
  name: "PEDI-CAT", // ex: "Bayley-III"
  fullName: "PEDI-CAT", // ex: "Bayley Scales of Infant Development III"
  whenToUse: [
    "✅ Indicação 1",
    "✅ Indicação 2",
    "✅ Indicação 3",
    "❌ NÃO use quando...",
  ],
  nextSteps: [
    "1. Aplicar escala",
    "2. Se resultado X → Próxima escala Y",
    "3. Documentar no prontuário",
  ],
  suggestedBattery: [
    { escala: "Escala A", tempo: "10 min", razao: "Triagem" },
    { escala: "Escala B", tempo: "20 min", razao: "Confirmação" },
  ],
};

export default function ScalePage() {
  const [_location, navigate] = useLocation();
  const [copied, setCopied] = useState(false);

  const scale = allScales.find(s => s.id === SCALE_CONFIG.id);

  const handleCopy = () => {
    navigator.clipboard.writeText(scale?.description || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <Button
          variant="ghost"
          onClick={() => navigate("/filtro")}
          className="text-slate-300 hover:text-white mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar ao Filtro
        </Button>

        {/* Título */}
        <Card className="bg-slate-800/80 border-slate-700 mb-6">
          <CardHeader className="border-b border-slate-700">
            <CardTitle className="text-3xl font-bold text-white mb-2">
              {SCALE_CONFIG.name}
            </CardTitle>
            <p className="text-lg text-slate-300">{SCALE_CONFIG.fullName}</p>
            {scale && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-700">
                <div>
                  <p className="text-xs text-slate-400 uppercase">Tempo</p>
                  <p className="text-sm font-semibold text-slate-200">{scale.tempo}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase">Faixa Etária</p>
                  <p className="text-sm font-semibold text-slate-200">
                    {Math.floor(scale.ageMin / 12)}-{Math.floor(scale.ageMax / 12)}a
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase">Respondente</p>
                  <p className="text-sm font-semibold text-slate-200">{scale.respondente.join(", ")}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase">Prioridade</p>
                  <p className="text-sm font-semibold text-slate-200 capitalize">{scale.prioridade}</p>
                </div>
              </div>
            )}
          </CardHeader>

          {/* Quando Usar */}
          <CardContent className="pt-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Quando Usar Esta Escala</h3>
              <ul className="space-y-2">
                {SCALE_CONFIG.whenToUse.map((item, i) => (
                  <li key={i} className="text-slate-300">
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Descrição */}
            {scale && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-white">Descrição</h3>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopy}
                    className="bg-slate-700 border-slate-600"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    {copied ? "Copiado!" : "Copiar"}
                  </Button>
                </div>
                <p className="text-slate-300 bg-slate-700/30 p-4 rounded">
                  {scale.description}
                </p>
              </div>
            )}

            {/* Escore */}
            {scale?.scoringCutoff && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Interpretação de Escore</h3>
                <div className="bg-blue-900/20 p-4 rounded border border-blue-700 text-blue-200">
                  {scale.scoringCutoff}
                </div>
              </div>
            )}

            {/* Bateria Sugerida */}
            <div className="border-t border-slate-700 pt-6">
              <h3 className="text-lg font-semibold text-white mb-4">Bateria Recomendada</h3>
              <div className="space-y-3">
                {SCALE_CONFIG.suggestedBattery.map((item, i) => (
                  <div key={i} className="bg-slate-700/30 p-4 rounded border border-slate-600">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-white">{i + 1}. {item.escala}</p>
                        <p className="text-sm text-slate-400">{item.razao}</p>
                      </div>
                      <span className="text-sm text-slate-300 font-mono">{item.tempo}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Próximos Passos */}
            <div className="border-t border-slate-700 pt-6">
              <h3 className="text-lg font-semibold text-white mb-4">Próximos Passos</h3>
              <ol className="space-y-2">
                {SCALE_CONFIG.nextSteps.map((step, i) => (
                  <li key={i} className="text-slate-300">
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* Ações */}
        <div className="flex gap-4">
          <Button
            onClick={() => navigate("/filtro")}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Filtro
          </Button>
          <Button
            onClick={() => window.print()}
            variant="outline"
            className="bg-slate-700 border-slate-600 hover:bg-slate-600"
          >
            <Download className="w-4 h-4 mr-2" />
            Imprimir
          </Button>
        </div>
      </div>
    </div>
  );
}
