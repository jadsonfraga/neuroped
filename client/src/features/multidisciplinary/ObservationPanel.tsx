import { useState } from "react";
import { Trash2, Plus, Filter, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ObservationForm } from "./ObservationForm";
import type { Observation, ProfessionalType, ObservationStats } from "./types";

interface ObservationPanelProps {
  patientId: string;
  observations: Observation[];
  onAddObservation?: (obs: Omit<Observation, "id" | "timestamp">) => void;
  onDeleteObservation?: (id: string) => void;
}

const professionalProfiles = {
  neuro: { label: "Neurologista", emoji: "🧠", color: "from-purple-400 to-purple-600" },
  psicolog: { label: "Psicólogo(a)", emoji: "💭", color: "from-blue-400 to-blue-600" },
  fono: { label: "Fonoaudiólogo(a)", emoji: "🗣️", color: "from-green-400 to-green-600" },
  to: { label: "Terapeuta Ocupacional", emoji: "🤲", color: "from-orange-400 to-orange-600" },
  pedagogo: { label: "Pedagogo(a)", emoji: "📚", color: "from-amber-400 to-amber-600" },
  pediatra: { label: "Pediatra", emoji: "👨‍⚕️", color: "from-red-400 to-red-600" },
  outro: { label: "Outro", emoji: "👤", color: "from-gray-400 to-gray-600" },
};

function calculateStats(observations: Observation[]): ObservationStats {
  const byProfessional: Record<ProfessionalType, number> = {
    neuro: 0,
    psicolog: 0,
    fono: 0,
    to: 0,
    pedagogo: 0,
    pediatra: 0,
    outro: 0,
  };

  observations.forEach((obs) => {
    byProfessional[obs.professionalType]++;
  });

  const sorted = [...observations].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return {
    totalCount: observations.length,
    byProfessional,
    latestObservation: sorted[0],
    timelineRange: {
      start: sorted[sorted.length - 1]?.timestamp || new Date(),
      end: sorted[0]?.timestamp || new Date(),
    },
  };
}

export function ObservationPanel({
  patientId,
  observations,
  onAddObservation,
  onDeleteObservation,
}: ObservationPanelProps) {
  const [showForm, setShowForm] = useState(false);
  const [selectedProfessional, setSelectedProfessional] = useState<ProfessionalType | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const stats = calculateStats(observations);

  // Filter observations
  const filteredObservations = observations.filter((obs) => {
    const matchesProfessional = !selectedProfessional || obs.professionalType === selectedProfessional;
    const matchesSearch = !searchQuery || obs.observationText.toLowerCase().includes(searchQuery.toLowerCase()) || obs.professionalName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesProfessional && matchesSearch;
  });

  // Sort by date descending
  const sortedObservations = [...filteredObservations].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="space-y-4">
      {/* Header with Stats */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Observações Multidisciplinares</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                {stats.totalCount} observação{stats.totalCount !== 1 ? "ões" : ""} de {Object.values(stats.byProfessional).filter((n) => n > 0).length} profissional{Object.values(stats.byProfessional).filter((n) => n > 0).length !== 1 ? "ais" : ""}
              </p>
            </div>
            <Button
              onClick={() => setShowForm(true)}
              className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Observação
            </Button>
          </div>
        </CardHeader>

        {/* Stats Grid */}
        {stats.totalCount > 0 && (
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {Object.entries(stats.byProfessional)
                .filter(([, count]) => count > 0)
                .map(([professional, count]) => {
                  const profile = professionalProfiles[professional as ProfessionalType];
                  return (
                    <div
                      key={professional}
                      className="p-2 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200"
                    >
                      <div className="text-lg">{profile.emoji}</div>
                      <p className="text-xs font-semibold mt-1">{profile.label}</p>
                      <p className="text-lg font-bold text-blue-600">{count}</p>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Add Observation Form */}
      {showForm && (
        <ObservationForm
          patientId={patientId}
          onSubmit={(obs) => {
            onAddObservation?.(obs);
            setShowForm(false);
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Search and Filter */}
      {sortedObservations.length > 0 && (
        <Card className="bg-gray-50 border-gray-300">
          <CardContent className="pt-4 space-y-3">
            <div>
              <input
                type="text"
                placeholder="Buscar observações..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filtrar por Profissional
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedProfessional(null)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                    selectedProfessional === null
                      ? "bg-blue-500 text-white"
                      : "bg-white border border-gray-300 text-gray-700 hover:border-gray-400"
                  }`}
                >
                  Todos
                </button>
                {Object.entries(professionalProfiles).map(([key, { emoji, label }]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedProfessional(key as ProfessionalType)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition flex items-center gap-1 ${
                      selectedProfessional === key
                        ? "bg-blue-500 text-white"
                        : "bg-white border border-gray-300 text-gray-700 hover:border-gray-400"
                    }`}
                  >
                    {emoji} {label.split("(")[0].trim()}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Observations Timeline */}
      {sortedObservations.length > 0 ? (
        <div className="space-y-3">
          {sortedObservations.map((obs) => {
            const profile = professionalProfiles[obs.professionalType];
            return (
              <Card key={obs.id} className="border-l-4" style={{ borderLeftColor: `var(--tw-gradient-stops)` }}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`text-2xl`}>{profile.emoji}</div>
                      <div>
                        <p className="font-semibold text-sm">
                          {obs.professionalName} — {profile.label}
                        </p>
                        <p className="text-xs text-gray-500">{formatDate(obs.timestamp)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {obs.confidenceLevel && (
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            obs.confidenceLevel === "high"
                              ? "bg-green-100 text-green-900"
                              : obs.confidenceLevel === "medium"
                                ? "bg-yellow-100 text-yellow-900"
                                : "bg-orange-100 text-orange-900"
                          }`}
                        >
                          {obs.confidenceLevel === "high" ? "Alta Confiança" : obs.confidenceLevel === "medium" ? "Confiança Média" : "Baixa Confiança"}
                        </Badge>
                      )}

                      <Button
                        onClick={() => onDeleteObservation?.(obs.id)}
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">{obs.observationText}</p>

                  {obs.tags && obs.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {obs.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="bg-blue-50 border-blue-300">
          <CardContent className="pt-6 text-center">
            <BarChart3 className="h-12 w-12 text-blue-400 mx-auto mb-2 opacity-50" />
            <p className="text-gray-600 text-sm">
              {observations.length === 0
                ? "Nenhuma observação registrada ainda. Clique em 'Nova Observação' para começar."
                : "Nenhuma observação corresponde aos filtros selecionados."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
