import { useState } from "react";
import { Clock, Users, AlertCircle, ArrowRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ClinicalAssistantInput } from "./types";
import { suggestBattery } from "./suggestionEngine";

interface ClinicalAssistantProps {
  initialAge?: number;
  onBatterySelected?: (scaleIds: string[]) => void;
}

export function ClinicalAssistant({ initialAge = 60, onBatterySelected }: ClinicalAssistantProps) {
  const [age, setAge] = useState(initialAge);
  const [complaint, setComplaint] = useState("tdah");
  const [respondents, setRespondents] = useState<("pais" | "professor" | "clinico" | "crianca")[]>(["pais"]);
  const [timeAvailable, setTimeAvailable] = useState(30);
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [childCapabilities, setChildCapabilities] = useState({
    canRead: true,
    canWrite: true,
    verbal: true,
  });

  const commonComplaints = [
    { id: "tea", label: "Autismo / TEA" },
    { id: "tdah", label: "TDAH" },
    { id: "ansiedade", label: "Ansiedade" },
    { id: "depressao", label: "Depressão / Humor" },
    { id: "atraso", label: "Atraso do Desenvolvimento" },
    { id: "linguagem", label: "Linguagem / Comunicação" },
    { id: "comportamento", label: "Comportamento / Disruptivo" },
  ];

  const toggleRespondent = (respondent: typeof respondents[number]) => {
    setRespondents((prev) =>
      prev.includes(respondent) ? prev.filter((r) => r !== respondent) : [...prev, respondent]
    );
  };

  const input: ClinicalAssistantInput = {
    age,
    complaint,
    respondentsAvailable: respondents,
    timeAvailable,
    childCapabilities,
  };

  const suggestion = showSuggestion ? suggestBattery(input) : null;
  const phrasedAge = age < 12 ? `${age}m` : `${Math.floor(age / 12)}a`;

  const handleSelectBattery = () => {
    if (suggestion) {
      const scaleIds = suggestion.battery.phases.flatMap((phase) => phase.scales.map((s) => s.id));
      onBatterySelected?.(scaleIds);
    }
  };

  return (
    <div className="space-y-4">
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Assistente Clínico Inteligente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Age Slider */}
          <div>
            <label htmlFor="assistant-idade" className="block text-sm font-medium mb-2">
              Idade: <span className="text-lg font-bold text-blue-600">{phrasedAge}</span>
            </label>
            <input
              id="assistant-idade"
              type="range"
              min="0"
              max="216"
              value={age}
              onChange={(e) => setAge(Number(e.target.value))}
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">0 meses a 18 anos</p>
          </div>

          {/* Main Complaint */}
          <div>
            <label className="block text-sm font-medium mb-3">Queixa Principal</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {commonComplaints.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setComplaint(c.id)}
                  className={`text-left px-3 py-2 rounded-lg border-2 transition ${
                    complaint === c.id
                      ? "border-blue-500 bg-blue-50 text-blue-900"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Available Respondents */}
          <div>
            <label className="block text-sm font-medium mb-3 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Respondentes Disponíveis
            </label>
            <div className="space-y-2">
              {[
                { id: "pais", label: "Pais / Cuidadores" },
                { id: "professor", label: "Professor(a)" },
                { id: "clinico", label: "Clínico (observação direta)" },
                { id: "crianca", label: "Criança / Adolescente" },
              ].map((r) => (
                <label
                  key={r.id}
                  className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    aria-label={r.label}
                    checked={respondents.includes(r.id as any)}
                    onChange={() => toggleRespondent(r.id as any)}
                    className="rounded"
                  />
                  <span className="text-sm">{r.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Time Available */}
          <div>
            <label htmlFor="assistant-tempo-disponivel" className="block text-sm font-medium mb-2 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Tempo Disponível na Consulta
            </label>
            <div className="flex items-center gap-4">
              <input
                id="assistant-tempo-disponivel"
                type="range"
                min="5"
                max="120"
                step="5"
                value={timeAvailable}
                onChange={(e) => setTimeAvailable(Number(e.target.value))}
                className="flex-1"
              />
              <span className="text-lg font-semibold text-blue-600 min-w-fit">{timeAvailable} min</span>
            </div>
          </div>

          {/* Child Capabilities */}
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <label className="block text-sm font-medium mb-3">Capacidades da Criança</label>
            <div className="space-y-2">
              {[
                { key: "canRead", label: "Consegue ler?" },
                { key: "canWrite", label: "Consegue escrever?" },
                { key: "verbal", label: "Fala fluente?" },
              ].map((c) => (
                <label
                  key={c.key}
                  className="flex items-center gap-2 p-2 hover:bg-white rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    aria-label={c.label}
                    checked={childCapabilities[c.key as keyof typeof childCapabilities]}
                    onChange={(e) =>
                      setChildCapabilities((prev) => ({
                        ...prev,
                        [c.key]: e.target.checked,
                      }))
                    }
                    className="rounded"
                  />
                  <span className="text-sm">{c.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <Button
            onClick={() => setShowSuggestion(true)}
            className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
            size="lg"
          >
            <Zap className="h-4 w-4 mr-2" />
            Gerar Bateria Otimizada
          </Button>
        </CardContent>
      </Card>

      {/* Suggestion Output */}
      {suggestion && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top">
          {/* Warnings */}
          {suggestion.warnings.length > 0 && (
            <div className="space-y-2">
              {suggestion.warnings.map((w) => (
                <Card
                  key={w.id}
                  className={`border-l-4 ${
                    w.severity === "alert"
                      ? "border-l-red-500 bg-red-50"
                      : w.severity === "warning"
                        ? "border-l-yellow-500 bg-yellow-50"
                        : "border-l-blue-500 bg-blue-50"
                  }`}
                >
                  <CardContent className="pt-4 flex gap-3">
                    <AlertCircle
                      className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                        w.severity === "alert"
                          ? "text-red-600"
                          : w.severity === "warning"
                            ? "text-yellow-600"
                            : "text-blue-600"
                      }`}
                    />
                    <div>
                      <p className="text-sm font-medium">{w.message}</p>
                      {w.actionItems && (
                        <ul className="text-xs mt-2 space-y-1 ml-4 list-disc text-gray-700">
                          {w.actionItems.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Battery Phases */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{suggestion.battery.name}</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">{suggestion.battery.explanation}</p>
                </div>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {suggestion.battery.totalDuration} min
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {suggestion.battery.phases.map((phase) => (
                <div key={phase.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-blue-900">
                      FASE {suggestion.battery.phases.indexOf(phase) + 1}: {phase.label}
                    </h4>
                    <span className="text-sm font-medium text-gray-600">{phase.duration} min</span>
                  </div>

                  <div className="space-y-2">
                    {phase.scales.map((scale) => (
                      <div
                        key={scale.id}
                        className="flex items-start justify-between p-2 bg-gray-50 rounded hover:bg-gray-100 transition"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-sm">{scale.name}</p>
                          <p className="text-xs text-gray-600 mt-0.5">{scale.reasoning}</p>
                          <div className="flex gap-2 mt-2">
                            <Badge variant="secondary" className="text-xs">
                              {scale.respondent}
                            </Badge>
                            <Badge
                              variant={scale.priority === "essential" ? "default" : "outline"}
                              className="text-xs"
                            >
                              {scale.priority === "essential" ? "Essencial" : "Complementar"}
                            </Badge>
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-gray-600 ml-2">{scale.duration}m</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <p className="text-xs text-gray-600 italic">{suggestion.battery.clinicalNotes}</p>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleSelectBattery}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              Aplicar Esta Bateria
            </Button>
            <Button onClick={() => setShowSuggestion(false)} variant="outline" className="flex-1">
              Editar Parâmetros
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
