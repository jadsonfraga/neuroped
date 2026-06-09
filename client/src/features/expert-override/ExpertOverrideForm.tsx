import { useState } from "react";
import { AlertTriangle, Shield, CheckCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ScaleOverride, OverrideReason } from "./types";

interface ExpertOverrideFormProps {
  scaleId: string;
  scaleName: string;
  patientId: string;
  blockedReason: string; // e.g., "Reading required but child cannot read"
  blockingRule: string;
  onSubmit?: (override: Omit<ScaleOverride, "id" | "timestamp">) => void;
  onCancel?: () => void;
}

const overrideCategories = [
  {
    id: "clinical_exception",
    label: "Exceção Clínica",
    description: "Caso clínico justifica o uso apesar da bloqueagem",
  },
  {
    id: "research_context",
    label: "Contexto de Pesquisa",
    description: "Uso em protocolo de pesquisa aprovado",
  },
  {
    id: "developmental_variance",
    label: "Variância Desenvolvimental",
    description: "Desenvolvimento atípico justifica adaptação",
  },
  {
    id: "cultural_adaptation",
    label: "Adaptação Cultural",
    description: "Contexto cultural demanda ajuste",
  },
  {
    id: "professional_judgment",
    label: "Julgamento Profissional",
    description: "Experiência clínica em caso específico",
  },
  {
    id: "other",
    label: "Outro",
    description: "Especificar em observações",
  },
];

export function ExpertOverrideForm({
  scaleId,
  scaleName,
  patientId,
  blockedReason,
  blockingRule,
  onSubmit,
  onCancel,
}: ExpertOverrideFormProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [evidence, setEvidence] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [confidenceLevel, setConfidenceLevel] = useState<"low" | "medium" | "high">("medium");
  const [acknowledged, setAcknowledged] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const handleSubmit = () => {
    const newErrors: string[] = [];

    if (!selectedCategory) {
      newErrors.push("Selecione uma categoria de justificativa");
    }

    if (!evidence.trim()) {
      newErrors.push("Descreva a evidência/raciocínio clínico");
    }

    if (!acknowledged) {
      newErrors.push("Você deve reconhecer as implicações do override");
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    const category = selectedCategory as OverrideReason["category"];
    const overrideReason: OverrideReason = {
      id: `override-${Date.now()}`,
      category,
      description: overrideCategories.find((c) => c.id === category)?.label || category,
      evidence: evidence.trim(),
    };

    const override: Omit<ScaleOverride, "id" | "timestamp"> = {
      scaleId,
      scaleName,
      patientId,
      blockedReason,
      blockingRule,
      overrideAuthorizedBy: "current-user", // TODO: Get from context
      overrideReason,
      additionalNotes: additionalNotes.trim(),
      confidenceLevel,
    };

    onSubmit?.(override);

    // Reset form
    setSelectedCategory(null);
    setEvidence("");
    setAdditionalNotes("");
    setConfidenceLevel("medium");
    setAcknowledged(false);
    setErrors([]);
  };

  return (
    <Card className="border-2 border-red-300 bg-red-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-red-600" />
            <div>
              <CardTitle className="text-lg">Expert Override — {scaleName}</CardTitle>
              <p className="text-xs text-red-700 mt-1">Escape da bloqueagem com justificativa documentada</p>
            </div>
          </div>
          <Button
            onClick={onCancel}
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Error Messages */}
        {errors.length > 0 && (
          <div className="p-3 bg-red-100 border border-red-300 rounded-lg space-y-1">
            {errors.map((error, i) => (
              <p key={i} className="text-sm text-red-900 flex gap-2">
                <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                {error}
              </p>
            ))}
          </div>
        )}

        {/* Blocking Reason (Read-only) */}
        <Card className="bg-white border-red-200">
          <CardHeader className="pb-2">
            <p className="text-sm font-semibold text-gray-700">Razão da Bloqueagem Original</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="text-sm font-mono text-red-700">{blockedReason}</p>
              <p className="text-xs text-gray-600">Regra: {blockingRule}</p>
            </div>
          </CardContent>
        </Card>

        {/* Override Category Selection */}
        <div>
          <label className="block text-sm font-semibold mb-3 text-gray-900">
            Categoria de Justificativa
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {overrideCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`p-3 rounded-lg border-2 transition text-left ${
                  selectedCategory === cat.id
                    ? "border-blue-500 bg-blue-100"
                    : "border-gray-300 bg-white hover:border-gray-400"
                }`}
              >
                <p className="font-semibold text-sm text-gray-900">{cat.label}</p>
                <p className="text-xs text-gray-600 mt-1">{cat.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Clinical Evidence / Reasoning */}
        <div>
          <label className="block text-sm font-semibold mb-2 text-gray-900">
            Evidência Clínica & Raciocínio
          </label>
          <textarea
            value={evidence}
            onChange={(e) => setEvidence(e.target.value)}
            placeholder="Descreva em detalhes:
- Por que essa criança é uma exceção
- Que evidências clínicas suportam essa decisão
- Riscos/benefícios considerados
- Alternativas avaliadas e por que rejeitadas"
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 font-mono text-sm"
          />
          <p className="text-xs text-gray-600 mt-1">Mínimo 50 caracteres recomendado para auditoria</p>
        </div>

        {/* Confidence Level */}
        <div>
          <label className="block text-sm font-semibold mb-3 text-gray-900">
            Nível de Confiança na Decisão
          </label>
          <div className="flex gap-2">
            {(["low", "medium", "high"] as const).map((level) => (
              <button
                key={level}
                onClick={() => setConfidenceLevel(level)}
                className={`flex-1 px-3 py-2 rounded-lg border-2 transition font-semibold ${
                  confidenceLevel === level
                    ? `border-blue-500 ${
                        level === "high"
                          ? "bg-green-100 text-green-900"
                          : level === "medium"
                            ? "bg-yellow-100 text-yellow-900"
                            : "bg-orange-100 text-orange-900"
                      }`
                    : "border-gray-300 bg-white hover:border-gray-400"
                }`}
              >
                {level === "high" ? "Alta 🟢" : level === "medium" ? "Média 🟡" : "Baixa 🔴"}
              </button>
            ))}
          </div>
        </div>

        {/* Additional Notes */}
        <div>
          <label className="block text-sm font-semibold mb-2 text-gray-900">
            Observações Adicionais (Opcional)
          </label>
          <textarea
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            placeholder="Notas adicionais, contexto, ou informações relevantes..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        {/* Acknowledgement */}
        <Card className="border-l-4 border-l-red-500 bg-red-50">
          <CardContent className="pt-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                className="rounded mt-1"
              />
              <div>
                <p className="text-sm font-semibold text-gray-900">Reconheço as Implicações</p>
                <p className="text-xs text-gray-700 mt-1">
                  Este override será auditado. Entendo que:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>A decisão será revisada por supervisores</li>
                    <li>Qualquer harm será investigado</li>
                    <li>Padrões de overrides podem trigger retraining</li>
                    <li>Decisões devem ser clinicamente defendíveis</li>
                  </ul>
                </p>
              </div>
            </label>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4 border-t border-red-300">
          <Button
            onClick={handleSubmit}
            disabled={!acknowledged}
            className={`flex-1 ${
              acknowledged
                ? "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                : "opacity-50 cursor-not-allowed"
            }`}
          >
            <Shield className="h-4 w-4 mr-2" />
            Aplicar Override Documentado
          </Button>
          <Button onClick={onCancel} variant="outline" className="flex-1">
            Cancelar
          </Button>
        </div>

        {/* Info Box */}
        <Card className="bg-blue-50 border-blue-300">
          <CardContent className="pt-4 text-sm text-gray-700">
            <p className="font-semibold mb-2">ℹ️ Sobre Override de Especialista</p>
            <p>
              Este modo permite que clínicos usem escalas bloqueadas por boas razões clínicas.
              Cada override é registrado, auditado e pode ser usado para refinar as regras
              de bloqueagem.
            </p>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}
