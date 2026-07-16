import { Download, Printer, Share2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClinicalPattern, getBatteryForPattern } from "@/data/smartRecommendations";
import { allScales } from "@/data/scaleFilter";
import { printPlainTextDocument } from "@/lib/printDocument";
import { downloadTextDocument, safeTextFilename, shareTextDocument } from "@/lib/shareText";

interface BatteryReportCardProps {
  pattern: ClinicalPattern;
  patientName?: string;
  patientAge?: number;
  clinician?: string;
}

export function BatteryReportCard({ 
  pattern, 
  patientName = "Paciente",
  patientAge,
  clinician = "Clínico"
}: BatteryReportCardProps) {
  const battery = getBatteryForPattern(pattern);

  const generateReport = () => {
    const date = new Date().toLocaleDateString("pt-BR");
    const totalTime = pattern.estimatedTime;

    let report = `
RECOMENDAÇÃO DE BATERIA DE AVALIAÇÃO
========================================
Data: ${date}
Paciente: ${patientName}
${patientAge ? `Idade: ${patientAge} anos` : ""}
Clínico: ${clinician}

DIAGNÓSTICO CLÍNICO SUSPEITO
${pattern.reason}

BATERIA RECOMENDADA
Tempo total estimado: ${totalTime}
Taxa de sucesso diagnóstico: ${pattern.successRate}%

1️⃣  ESCALA PRIMÁRIA (PADRÃO-OURO):
${battery.total
  .slice(0, 1)
  .map((id) => {
    const scale = allScales.find((s) => s.id === id);
    return `   • ${scale?.name} - ${scale?.tempo}`;
  })
  .join("\n")}

2️⃣  ESCALAS COMPLEMENTARES:
${battery.secondary
  .map((id) => {
    const scale = allScales.find((s) => s.id === id);
    return `   • ${scale?.name} - ${scale?.tempo}`;
  })
  .join("\n")}

3️⃣  ESCALAS DE APOIO:
${battery.supporting
  .map((id) => {
    const scale = allScales.find((s) => s.id === id);
    return `   • ${scale?.name} - ${scale?.tempo}`;
  })
  .join("\n")}

PRÓXIMOS PASSOS:
1. Aplicar escala primária (padrão-ouro)
2. Se resultado positivo/alterado, aplicar escalas complementares
3. Se necessário detalhar, aplicar escalas de apoio
4. Documentar em prontuário eletrônico
5. Agendar follow-up conforme resultado

Relatório gerado automaticamente pelo Sistema NeuroPed
    `;

    return report;
  };

  const handlePrint = () => {
    const report = generateReport();
    printPlainTextDocument({ title: "Recomendação de bateria", text: report });
  };

  const handleDownload = () => {
    const report = generateReport();
    downloadTextDocument(
      report,
      `bateria-${safeTextFilename(patientName)}-${new Date().toISOString().split("T")[0]}.txt`,
    );
  };

  const handleShare = async () => {
    await shareTextDocument({
      title: "Recomendação de bateria NeuroPed",
      text: generateReport(),
      filename: `bateria-${patientName}`,
    });
  };

  return (
    <Card className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 border-purple-600 mt-6">
      <CardHeader className="bg-purple-900/40 border-b border-purple-700">
        <CardTitle className="text-white">📋 Relatório de Bateria</CardTitle>
      </CardHeader>

      <CardContent className="pt-6 space-y-4">
        <div className="bg-purple-800/20 p-4 rounded border border-purple-700/50 text-sm text-purple-100">
          <p className="font-semibold mb-2">Bateria para: {pattern.reason}</p>
          <p className="text-xs opacity-75">Tempo total: {pattern.estimatedTime}</p>
          <p className="text-xs opacity-75">Sucesso esperado: {pattern.successRate}%</p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Button
            onClick={handlePrint}
            className="bg-purple-600 hover:bg-purple-700 text-white text-xs h-auto py-2"
          >
            <Printer className="w-3 h-3 mr-1" />
            Imprimir
          </Button>
          <Button
            onClick={handleDownload}
            className="bg-purple-600 hover:bg-purple-700 text-white text-xs h-auto py-2"
          >
            <Download className="w-3 h-3 mr-1" />
            Baixar
          </Button>
          <Button
            onClick={handleShare}
            variant="outline"
            className="bg-purple-800/20 border-purple-600 text-white text-xs h-auto py-2"
          >
            <Share2 className="w-3 h-3 mr-1" />
            Compartilhar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
