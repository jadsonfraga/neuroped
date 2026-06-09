import { FileCheck, Download, Calendar, User, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface AuditEntry {
  timestamp: Date;
  action: string;
  actor: string;
  details: string;
  severity: "info" | "warning" | "critical";
}

interface AuditComplianceProps {
  patientId: string;
  auditLog: AuditEntry[];
  onExportReport?: (format: "pdf" | "csv") => void;
}

export function AuditCompliance({ patientId, auditLog, onExportReport }: AuditComplianceProps) {
  const formatDate = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 border-red-300 text-red-900";
      case "warning":
        return "bg-yellow-100 border-yellow-300 text-yellow-900";
      default:
        return "bg-blue-100 border-blue-300 text-blue-900";
    }
  };

  const stats = {
    totalActions: auditLog.length,
    uniqueActors: new Set(auditLog.map((e) => e.actor)).size,
    criticalEvents: auditLog.filter((e) => e.severity === "critical").length,
    dateRange:
      auditLog.length > 0
        ? `${new Date(auditLog[0].timestamp).toLocaleDateString("pt-BR")} a ${new Date(auditLog[auditLog.length - 1].timestamp).toLocaleDateString("pt-BR")}`
        : "N/A",
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              <CardTitle>Trilha de Auditoria & Compliance</CardTitle>
            </div>
            <Badge variant="outline">Paciente ID: {patientId}</Badge>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Log completo e imutável de todas as ações e decisões clínicas
          </p>
        </CardHeader>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-blue-50 border-blue-300">
          <CardContent className="pt-4">
            <p className="text-xs text-gray-600 font-semibold">Total de Ações</p>
            <p className="text-2xl font-bold text-blue-700 mt-1">{stats.totalActions}</p>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-300">
          <CardContent className="pt-4">
            <p className="text-xs text-gray-600 font-semibold">Profissionais</p>
            <p className="text-2xl font-bold text-purple-700 mt-1">{stats.uniqueActors}</p>
          </CardContent>
        </Card>

        <Card
          className={`${
            stats.criticalEvents > 0
              ? "bg-red-50 border-red-300"
              : "bg-green-50 border-green-300"
          }`}
        >
          <CardContent className="pt-4">
            <p className="text-xs text-gray-600 font-semibold">Eventos Críticos</p>
            <p
              className={`text-2xl font-bold mt-1 ${
                stats.criticalEvents > 0 ? "text-red-700" : "text-green-700"
              }`}
            >
              {stats.criticalEvents}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-50 border-gray-300">
          <CardContent className="pt-4">
            <p className="text-xs text-gray-600 font-semibold">Período</p>
            <p className="text-xs font-bold text-gray-700 mt-1">{stats.dateRange}</p>
          </CardContent>
        </Card>
      </div>

      {/* Export Options */}
      <Card className="bg-gray-50 border-gray-300">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Download className="h-4 w-4" />
            Exportar Relatório
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              onClick={() => onExportReport?.("pdf")}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              📄 Exportar como PDF
            </Button>
            <Button
              onClick={() => onExportReport?.("csv")}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              📊 Exportar como CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Audit Log */}
      {auditLog.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileCheck className="h-4 w-4" />
              Log Completo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {[...auditLog].reverse().map((entry, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border-l-4 ${getSeverityColor(entry.severity)}`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <p className="font-semibold text-sm">{entry.action}</p>
                    <span className="text-xs font-mono text-gray-600">
                      {formatDate(entry.timestamp)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                    <User className="h-3 w-3" />
                    <span>{entry.actor}</span>
                  </div>

                  <p className="text-xs text-gray-700 italic">"{entry.details}"</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6 text-center text-gray-500">
            <FileCheck className="h-12 w-12 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Nenhuma atividade registrada</p>
          </CardContent>
        </Card>
      )}

      {/* Compliance Info */}
      <Card className="bg-green-50 border-green-300">
        <CardContent className="pt-4 space-y-2 text-sm">
          <p className="font-semibold text-gray-900">✅ Conformidade & Regulamentação</p>
          <ul className="space-y-1 text-gray-700 list-disc list-inside">
            <li>Trilha de auditoria imutável (append-only)</li>
            <li>Timestamps precisos para todas as ações</li>
            <li>Identificação completa do ator (quem fez)</li>
            <li>Conformidade LGPD e regulação de dados</li>
            <li>Retenção mínima conforme legislação</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
