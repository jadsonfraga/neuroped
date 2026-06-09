import { AlertTriangle, CheckCircle, Clock, User, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ScaleOverride, OverrideAuditLog } from "./types";

interface OverrideAuditLogProps {
  overrides: ScaleOverride[];
  auditLogs: OverrideAuditLog[];
}

export function OverrideAuditLog({ overrides, auditLogs }: OverrideAuditLogProps) {
  const formatDate = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusIcon = (override: ScaleOverride) => {
    if (override.isApprovedByReviewer === undefined) {
      return <Clock className="h-5 w-5 text-yellow-600" />;
    }
    if (override.isApprovedByReviewer) {
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    }
    return <AlertTriangle className="h-5 w-5 text-red-600" />;
  };

  const getStatusLabel = (override: ScaleOverride) => {
    if (override.isApprovedByReviewer === undefined) {
      return "Pending Review";
    }
    if (override.isApprovedByReviewer) {
      return "Approved";
    }
    return "Rejected";
  };

  const getStatusColor = (override: ScaleOverride) => {
    if (override.isApprovedByReviewer === undefined) {
      return "bg-yellow-50 border-yellow-300";
    }
    if (override.isApprovedByReviewer) {
      return "bg-green-50 border-green-300";
    }
    return "bg-red-50 border-red-300";
  };

  if (overrides.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-gray-600" />
            Trilha de Auditoria — Overrides
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-lg">
            <AlertTriangle className="h-12 w-12 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Nenhum override registrado neste período</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-gray-600" />
              <CardTitle>Trilha de Auditoria — Overrides</CardTitle>
            </div>
            <Badge variant="outline">{overrides.length} registros</Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Card className="bg-yellow-50 border-yellow-300">
          <CardContent className="pt-4">
            <p className="text-xs text-gray-600 font-semibold">Pendentes de Revisão</p>
            <p className="text-2xl font-bold text-yellow-700 mt-1">
              {overrides.filter((o) => o.isApprovedByReviewer === undefined).length}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-300">
          <CardContent className="pt-4">
            <p className="text-xs text-gray-600 font-semibold">Aprovados</p>
            <p className="text-2xl font-bold text-green-700 mt-1">
              {overrides.filter((o) => o.isApprovedByReviewer === true).length}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-300">
          <CardContent className="pt-4">
            <p className="text-xs text-gray-600 font-semibold">Rejeitados</p>
            <p className="text-2xl font-bold text-red-700 mt-1">
              {overrides.filter((o) => o.isApprovedByReviewer === false).length}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-300">
          <CardContent className="pt-4">
            <p className="text-xs text-gray-600 font-semibold">Taxa Aprovação</p>
            <p className="text-2xl font-bold text-blue-700 mt-1">
              {overrides.filter((o) => o.isApprovedByReviewer === true).length > 0
                ? Math.round(
                    (overrides.filter((o) => o.isApprovedByReviewer === true).length /
                      overrides.filter((o) => o.isApprovedByReviewer !== undefined).length) *
                      100
                  )
                : 0}
              %
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Override Records */}
      <div className="space-y-3">
        {overrides.map((override) => (
          <Card key={override.id} className={`border-l-4 ${getStatusColor(override)}`}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  {getStatusIcon(override)}
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-gray-900">
                      {override.scaleName}
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {override.overrideReason.description}
                    </p>
                  </div>
                </div>

                <div className="text-right flex items-center gap-2">
                  <Badge
                    variant={
                      override.isApprovedByReviewer === undefined
                        ? "outline"
                        : override.isApprovedByReviewer
                          ? "default"
                          : "destructive"
                    }
                  >
                    {getStatusLabel(override)}
                  </Badge>

                  {override.confidenceLevel === "high" && (
                    <Badge className="bg-green-100 text-green-900">Alta Confiança</Badge>
                  )}
                  {override.confidenceLevel === "medium" && (
                    <Badge className="bg-yellow-100 text-yellow-900">Confiança Média</Badge>
                  )}
                  {override.confidenceLevel === "low" && (
                    <Badge className="bg-orange-100 text-orange-900">Baixa Confiança</Badge>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              {/* Blocking Reason */}
              <div className="p-2 bg-white rounded border border-gray-200">
                <p className="text-xs font-semibold text-gray-700 mb-1">Razão da Bloqueagem Original</p>
                <p className="text-sm text-gray-800 font-mono">{override.blockedReason}</p>
              </div>

              {/* Evidence */}
              <div className="p-2 bg-white rounded border border-gray-200">
                <p className="text-xs font-semibold text-gray-700 mb-1">Evidência Clínica</p>
                <p className="text-sm text-gray-800 whitespace-pre-wrap">{override.overrideReason.evidence}</p>
              </div>

              {/* Metadata */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                <div className="flex items-center gap-1 text-gray-600">
                  <User className="h-3 w-3" />
                  <span>
                    <strong>Solicitante:</strong> {override.overrideAuthorizedBy}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-gray-600">
                  <Clock className="h-3 w-3" />
                  <span>
                    <strong>Data:</strong> {formatDate(override.timestamp)}
                  </span>
                </div>

                {override.reviewerName && (
                  <div className="flex items-center gap-1 text-gray-600">
                    <CheckCircle className="h-3 w-3" />
                    <span>
                      <strong>Revisor:</strong> {override.reviewerName}
                    </span>
                  </div>
                )}
              </div>

              {/* Additional Notes */}
              {override.additionalNotes && (
                <div className="p-2 bg-white rounded border border-gray-200">
                  <p className="text-xs font-semibold text-gray-700 mb-1">Observações</p>
                  <p className="text-sm text-gray-800 italic">"{override.additionalNotes}"</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Compliance Info */}
      <Card className="bg-blue-50 border-blue-300">
        <CardContent className="pt-4 space-y-2 text-sm">
          <p className="font-semibold text-gray-900">📋 Sobre Auditoria de Overrides</p>
          <ul className="space-y-1 text-gray-700 list-disc list-inside">
            <li>Todos os overrides são permanentemente registrados</li>
            <li>Supervisores devem revisar em até 7 dias</li>
            <li>Overrides aprovados informam refinamento de regras</li>
            <li>Taxa de aprovação elevada (&gt;90%) pode indicar regras muito restritivas</li>
            <li>Taxa baixa (&lt;50%) pode indicar julgamentos frágeis</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
