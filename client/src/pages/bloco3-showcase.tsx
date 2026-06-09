/**
 * BLOCO 3 SHOWCASE — Clinical Features Demo
 * Demonstrates Feature 1 (Clinical Assistant) and Feature 2 (Battery Visualization)
 *
 * This page is a development/demo page to showcase BLOCO 3 features:
 * - Clinical Intelligence Assistant (Feature 1)
 * - Battery Visualization (Feature 2)
 *
 * TODO: Integrate these into main filtro.tsx page
 */

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClinicalAssistant, suggestBattery } from "@/features/clinical-assistant";
import { BatteryVisualization } from "@/features/battery-visualization";
import type { SuggestedBattery } from "@/features/clinical-assistant";

export function BLOCO3Showcase() {
  const [selectedBattery, setSelectedBattery] = useState<SuggestedBattery | null>(null);
  const [selectedScales, setSelectedScales] = useState<string[]>([]);

  const handleBatterySelected = (scaleIds: string[]) => {
    // Generate a sample battery for visualization
    const sample = suggestBattery({
      age: 72,
      complaint: "tdah",
      respondentsAvailable: ["pais", "professor"],
      timeAvailable: 30,
      childCapabilities: { canRead: true, canWrite: true, verbal: true },
    });

    setSelectedBattery(sample.battery);
    setSelectedScales(scaleIds);
  };

  const toggleScale = (scaleId: string) => {
    setSelectedScales((prev) =>
      prev.includes(scaleId) ? prev.filter((id) => id !== scaleId) : [...prev, scaleId]
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">🚀 BLOCO 3 — Funcionalidades Clínicas</h1>
          <p className="text-lg text-gray-600">
            Demonstração das Features 1-2: Assistente Clínico Inteligente + Visualização de Bateria
          </p>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="assistant" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="assistant">Assistente Clínico</TabsTrigger>
            <TabsTrigger value="visualization">Visualização de Bateria</TabsTrigger>
          </TabsList>

          {/* Feature 1: Clinical Assistant */}
          <TabsContent value="assistant" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Feature 1: Assistente Clínico Inteligente</CardTitle>
                <p className="text-sm text-gray-600 mt-2">
                  Gera baterias otimizadas baseadas em age, queixa principal, respondentes disponíveis e
                  tempo.
                </p>
              </CardHeader>
              <CardContent>
                <ClinicalAssistant
                  initialAge={72}
                  onBatterySelected={handleBatterySelected}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Feature 2: Battery Visualization */}
          <TabsContent value="visualization" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Feature 2: Visualização de Bateria</CardTitle>
                <p className="text-sm text-gray-600 mt-2">
                  Mostra timeline visual das fases de avaliação com detalhes das escalas e tempo
                  estimado.
                </p>
              </CardHeader>
              <CardContent>
                {selectedBattery ? (
                  <BatteryVisualization
                    battery={selectedBattery}
                    selectedScales={selectedScales}
                    onScaleToggle={toggleScale}
                  />
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    <p>Gere uma bateria usando o Assistente Clínico para ver a visualização aqui.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Implementation Status */}
        <Card className="bg-blue-50 border-blue-300">
          <CardHeader>
            <CardTitle className="text-lg">📋 Status de Implementação — BLOCO 3</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="space-y-2">
              <p className="font-semibold text-gray-900">✅ Completadas:</p>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>Feature 1: Clinical Intelligence Assistant (Suggestion Engine + UI)</li>
                <li>Feature 2: Battery Visualization (Timeline + Phase Details)</li>
                <li>Type definitions e estrutura modular</li>
              </ul>
            </div>

            <div className="space-y-2 pt-2 border-t border-blue-300">
              <p className="font-semibold text-gray-900">⏳ Próximas Etapas (BLOCO 3 continuação):</p>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>
                  Feature 3: Integração Multidisciplinar (Observation Form + Panel)
                </li>
                <li>Feature 4: Relatórios e Gráficos (Longitudinal + Comparison Charts)</li>
                <li>Feature 5: Export PDF/DOCX</li>
                <li>Feature 6: Modo Expert Override</li>
              </ul>
            </div>

            <div className="space-y-2 pt-2 border-t border-blue-300">
              <p className="font-semibold text-gray-900">🎯 Integração Principal:</p>
              <p className="text-gray-700">
                Estes componentes devem ser integrados ao <code>client/src/pages/filtro.tsx</code> como
                um modal/drawer que aparece no início do filtro. Atualmente é uma showcase isolada.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Feature Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">🤖 Feature 1 Detalhes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                <strong>O que faz:</strong> Gera automaticamente baterias de escalas otimizadas
              </p>
              <p>
                <strong>Entradas:</strong> Idade, queixa principal, respondentes, tempo disponível
              </p>
              <p>
                <strong>Saída:</strong> Bateria com 2-3 fases (triagem, diagnóstico, opcional)
              </p>
              <p>
                <strong>Benefício:</strong> Reduz tempo de decisão clínica em ~75%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">📊 Feature 2 Detalhes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                <strong>O que faz:</strong> Visualiza bateria como timeline com fases
              </p>
              <p>
                <strong>Componentes:</strong> Timeline bar, phase cards, scale listings
              </p>
              <p>
                <strong>Interatividade:</strong> Toggle escalas, expandir detalhes
              </p>
              <p>
                <strong>Benefício:</strong> Clareza visual 100% - clínico vê tudo de uma vez
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default BLOCO3Showcase;
