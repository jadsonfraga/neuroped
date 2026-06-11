import { useState } from "react";
import { X, Send, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ProfessionalType, Observation } from "./types";

interface ObservationFormProps {
  patientId: string;
  onSubmit?: (observation: Omit<Observation, "id" | "timestamp">) => void;
  onCancel?: () => void;
  defaultProfessional?: ProfessionalType;
}

const professionalProfiles = {
  neuro: { label: "Neurologista", emoji: "🧠", color: "bg-purple-100 text-purple-900" },
  psicolog: { label: "Psicólogo(a)", emoji: "💭", color: "bg-blue-100 text-blue-900" },
  fono: { label: "Fonoaudiólogo(a)", emoji: "🗣️", color: "bg-green-100 text-green-900" },
  to: { label: "Terapeuta Ocupacional", emoji: "🤲", color: "bg-orange-100 text-orange-900" },
  pedagogo: { label: "Pedagogo(a)", emoji: "📚", color: "bg-amber-100 text-amber-900" },
  pediatra: { label: "Pediatra", emoji: "👨‍⚕️", color: "bg-red-100 text-red-900" },
  outro: { label: "Outro Profissional", emoji: "👤", color: "bg-gray-100 text-gray-900" },
};

export function ObservationForm({
  patientId,
  onSubmit,
  onCancel,
  defaultProfessional = "psicolog",
}: ObservationFormProps) {
  const [professionalType, setProfessionalType] = useState<ProfessionalType>(defaultProfessional);
  const [professionalName, setProfessionalName] = useState("");
  const [observationText, setObservationText] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [confidenceLevel, setConfidenceLevel] = useState<"low" | "medium" | "high">("medium");
  const [errors, setErrors] = useState<string[]>([]);

  const handleAddTag = () => {
    if (tagInput.trim()) {
      setTags((prev) => [...prev, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  };

  const handleSubmit = () => {
    const newErrors: string[] = [];

    if (!professionalName.trim()) {
      newErrors.push("Nome do profissional é obrigatório");
    }

    if (!observationText.trim()) {
      newErrors.push("Observação não pode estar vazia");
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    const observation: Omit<Observation, "id" | "timestamp"> = {
      patientId,
      professionalType,
      professionalName: professionalName.trim(),
      observationText: observationText.trim(),
      createdByUserId: "current-user", // TODO: Get from context
      tags: tags.length > 0 ? tags : undefined,
      confidenceLevel,
    };

    onSubmit?.(observation);

    // Reset form
    setProfessionalName("");
    setObservationText("");
    setTags([]);
    setTagInput("");
    setConfidenceLevel("medium");
    setErrors([]);
  };

  const _profile = professionalProfiles[professionalType];

  return (
    <Card className="border-2 border-blue-300 bg-blue-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Adicionar Observação Clínica</CardTitle>
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
          <div className="p-3 bg-red-100 border border-red-300 rounded-lg">
            {errors.map((error, i) => (
              <p key={i} className="text-sm text-red-900 flex gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                {error}
              </p>
            ))}
          </div>
        )}

        {/* Professional Type Selection */}
        <div>
          <label className="block text-sm font-medium mb-2">Tipo de Profissional</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {Object.entries(professionalProfiles).map(([key, { label, emoji, color }]) => (
              <button
                key={key}
                onClick={() => setProfessionalType(key as ProfessionalType)}
                className={`p-2 rounded-lg border-2 transition text-center ${
                  professionalType === key
                    ? `border-blue-500 ${color}`
                    : "border-gray-300 bg-white hover:border-gray-400"
                }`}
              >
                <div className="text-xl">{emoji}</div>
                <div className="text-xs font-semibold mt-1">{label.split("(")[0].trim()}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Professional Name */}
        <div>
          <label className="block text-sm font-medium mb-2">Nome Completo do Profissional</label>
          <input
            type="text"
            value={professionalName}
            onChange={(e) => setProfessionalName(e.target.value)}
            placeholder="Ex: Dr. João Silva"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Observation Text */}
        <div>
          <label className="block text-sm font-medium mb-2">Observação Clínica</label>
          <textarea
            value={observationText}
            onChange={(e) => setObservationText(e.target.value)}
            placeholder="Descreva suas observações clínicas, achados importantes, mudanças de comportamento, etc..."
            rows={5}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          />
          <p className="text-xs text-gray-600 mt-1">
            {observationText.length} caracteres
          </p>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium mb-2">Tags (Categorização)</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
              placeholder="Ex: comportamento, linguagem, atenção"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Button
              onClick={handleAddTag}
              variant="outline"
              size="sm"
            >
              Adicionar
            </Button>
          </div>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="cursor-pointer hover:opacity-80"
                  onClick={() => handleRemoveTag(tag)}
                >
                  {tag} ✕
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Confidence Level */}
        <div>
          <label className="block text-sm font-medium mb-2">Nível de Confiança</label>
          <div className="flex gap-2">
            {(["low", "medium", "high"] as const).map((level) => (
              <button
                key={level}
                onClick={() => setConfidenceLevel(level)}
                className={`flex-1 px-3 py-2 rounded-lg border-2 transition ${
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
                <span className="text-xs font-semibold">
                  {level === "high" ? "Alta 🟢" : level === "medium" ? "Média 🟡" : "Baixa 🔴"}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4 border-t border-blue-300">
          <Button
            onClick={handleSubmit}
            className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
          >
            <Send className="h-4 w-4 mr-2" />
            Registrar Observação
          </Button>
          <Button onClick={onCancel} variant="outline" className="flex-1">
            Cancelar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
