import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight, AlertTriangle } from "lucide-react";
import { difficultyLevels, getDifficultyLevelByAge, getDifficultyLevelConfig, type DifficultyLevel } from "@/data/difficulttyLevels";

interface RecognitionTestDifficultySelectorProps {
  testName: string;
  patientAgeMonths: number | null;
  supportedLevels?: DifficultyLevel[];
  onSelectDifficulty?: (level: DifficultyLevel) => void;
}

export function RecognitionTestDifficultySelector({
  testName,
  patientAgeMonths,
  supportedLevels,
  onSelectDifficulty
}: RecognitionTestDifficultySelectorProps) {
  const [selectedLevel, setSelectedLevel] = useState<DifficultyLevel | null>(null);

  if (!patientAgeMonths) {
    return (
      <Card className="border-amber-200/70 bg-amber-50/70 dark:border-amber-900/40 dark:bg-amber-950/20">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-900 dark:text-amber-100">
              <strong>Selecione a idade</strong> da criança para visualizar os níveis de dificuldade apropriados para este teste.
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const recommendedLevel = getDifficultyLevelByAge(patientAgeMonths);
  const recommendedConfig = getDifficultyLevelConfig(recommendedLevel);
  const availableLevels = supportedLevels && supportedLevels.length > 0
    ? supportedLevels
    : difficultyLevels;

  const handleSelectLevel = (level: DifficultyLevel) => {
    setSelectedLevel(level);
    onSelectDifficulty?.(level);
  };

  return (
    <Card className="border-blue-200/70 bg-blue-50/70 dark:border-blue-900/40 dark:bg-blue-950/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <span>📊 Níveis de Dificuldade — {testName}</span>
          <Badge variant="secondary" className="ml-auto">RQ-01 & RQ-02</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Recomendação automática */}
        {recommendedConfig && (
          <div className="mb-4 p-3 rounded-lg border border-green-200 bg-green-50 dark:border-green-900/50 dark:bg-green-950/20">
            <p className="text-xs font-semibold text-green-900 dark:text-green-100 mb-1">
              ✓ Recomendado para esta idade:
            </p>
            <p className="text-sm font-bold text-green-800 dark:text-green-200">
              {recommendedConfig.label}
            </p>
            <p className="text-xs text-green-700 dark:text-green-300 mt-1">
              Faixa etária: {Math.floor(recommendedConfig.ageMin / 12)}-{Math.floor(recommendedConfig.ageMax / 12)} anos
            </p>
          </div>
        )}

        {/* Grade de níveis disponíveis */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {availableLevels.map((level) => {
            const config = getDifficultyLevelConfig(level.id || level as any);
            if (!config) return null;

            const isRecommended = config.id === recommendedLevel;
            const isSelected = selectedLevel === config.id;

            return (
              <Button
                key={config.id}
                onClick={() => handleSelectLevel(config.id)}
                variant={isSelected ? "default" : "outline"}
                className={`h-auto p-3 text-left justify-start transition-all ${
                  isRecommended
                    ? "border-green-500 bg-green-50 hover:bg-green-100 dark:border-green-700 dark:bg-green-950/30"
                    : ""
                }`}
              >
                <div className="flex-1 text-xs">
                  <div className="font-semibold mb-1">
                    {config.label}
                    {isRecommended && <span className="ml-2 text-green-600 dark:text-green-400">✓</span>}
                  </div>
                  <div className="text-muted-foreground">
                    {config.ageRangeLabel}
                  </div>
                  <div className="mt-1 text-[10px] text-muted-foreground max-h-[2.5rem] overflow-hidden">
                    {config.characteristics[0]}
                  </div>
                </div>
              </Button>
            );
          })}
        </div>

        {/* Detalhes do nível selecionado */}
        {selectedLevel && (
          <div className="mt-4 p-3 rounded-lg border border-primary/30 bg-primary/5">
            {(() => {
              const config = getDifficultyLevelConfig(selectedLevel);
              return config ? (
                <>
                  <p className="text-xs font-bold text-primary mb-2">Características do {config.label}:</p>
                  <ul className="text-xs space-y-1 text-muted-foreground">
                    {config.characteristics.map((char, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-primary flex-shrink-0">•</span>
                        <span>{char}</span>
                      </li>
                    ))}
                  </ul>
                </>
              ) : null;
            })()}
          </div>
        )}

        {/* CTA */}
        <Button
          disabled={!selectedLevel}
          className="w-full"
        >
          <span>Aplicar nível selecionado</span>
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          ⚠️ Sempre validar que o nível de dificuldade corresponde à idade da criança
        </p>
      </CardContent>
    </Card>
  );
}
