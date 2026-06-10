import { Activity } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function AshworthTab() {
  return <div className="p-4">Ashworth Modificada - Em desenvolvimento</div>;
}

function TardieuTab() {
  return <div className="p-4">Tardieu Modificada - Em desenvolvimento</div>;
}

export default function EspasticidadePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        <Card className="bg-slate-800/80 border-slate-700 mb-6">
          <CardHeader className="border-b border-slate-700">
            <CardTitle className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <Activity className="h-8 w-8" />
              Escala de Espasticidade
            </CardTitle>
            <p className="text-lg text-slate-300">Avaliação de tônus e espasticidade motora</p>
          </CardHeader>

          <CardContent className="pt-6">
            <Tabs defaultValue="ashworth" className="w-full">
              <TabsList className="w-full mb-4">
                <TabsTrigger value="ashworth" className="flex-1 text-xs" data-testid="tab-ashworth">
                  Ashworth Modificada
                </TabsTrigger>
                <TabsTrigger value="tardieu" className="flex-1 text-xs" data-testid="tab-tardieu">
                  Tardieu Modificada
                </TabsTrigger>
              </TabsList>
              <TabsContent value="ashworth">
                <AshworthTab />
              </TabsContent>
              <TabsContent value="tardieu">
                <TardieuTab />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
