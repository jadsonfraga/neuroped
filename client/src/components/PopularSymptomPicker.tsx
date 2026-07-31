import { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Sparkles, Check, RotateCcw } from "lucide-react";
import { queixas } from "@/data/scaleFilter";
import { getPopularSymptoms } from "@/data/popularSymptoms";
import { getAllSignalsForQueixa } from "@/data/signalsAndSymptoms";

interface PopularSymptomPickerProps {
  selectedQueixas: string[];
  selectedSignalIds: string[];
  onToggle: (id: string) => void;
  onClear?: () => void;
  onHover?: () => void;
}

/**
 * Seletor de sintomas em linguagem cotidiana.
 *
 * Além da interface, este componente mantém a coerência do estado do filtro:
 * quando uma queixa é removida, qualquer sinal que pertencia apenas a ela é
 * descartado. Assim, um sintoma invisível nunca continua influenciando o ranking.
 */
export function PopularSymptomPicker({
  selectedQueixas,
  selectedSignalIds,
  onToggle,
  onClear,
  onHover,
}: PopularSymptomPickerProps) {
  const groups = useMemo(
    () =>
      selectedQueixas
        .map((queixaId) => ({
          queixa: queixas.find((queixa) => queixa.id === queixaId),
          symptoms: getPopularSymptoms(queixaId),
        }))
        .filter((group) => group.queixa && group.symptoms.length > 0),
    [selectedQueixas],
  );

  const validSignalIds = useMemo(
    () =>
      new Set(
        selectedQueixas.flatMap((queixaId) =>
          getAllSignalsForQueixa(queixaId).map((signal) => signal.id),
        ),
      ),
    [selectedQueixas],
  );

  useEffect(() => {
    const orphanSignals = selectedSignalIds.filter(
      (signalId) => !validSignalIds.has(signalId),
    );
    for (const signalId of orphanSignals) onToggle(signalId);
  }, [onToggle, selectedSignalIds, validSignalIds]);

  if (groups.length === 0) return null;

  const totalSelected = groups.reduce(
    (sum, group) =>
      sum +
      group.symptoms.filter((symptom) =>
        selectedSignalIds.includes(symptom.id),
      ).length,
    0,
  );

  return (
    <section
      className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.06] via-card to-chart-2/[0.05] p-4 shadow-sm sm:p-5"
      aria-labelledby="popular-symptoms-title"
      data-testid="popular-symptom-picker"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br from-primary/20 to-transparent blur-2xl"
      />

      <div className="relative flex items-center gap-2.5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-chart-2 text-white shadow-sm shadow-primary/30">
          <Sparkles className="h-4.5 w-4.5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h3
            id="popular-symptoms-title"
            className="text-sm font-black leading-tight text-foreground"
          >
            Sintomas que você percebe
          </h3>
          <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
            Marque apenas o que foi observado. Cada seleção refina o ranking sem
            substituir a avaliação clínica.
          </p>
        </div>
        {totalSelected > 0 && (
          <div className="flex shrink-0 items-center gap-1.5">
            <span
              className="inline-flex items-center rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-bold text-primary"
              aria-live="polite"
            >
              {totalSelected} marcado{totalSelected !== 1 ? "s" : ""}
            </span>
            {onClear && (
              <button
                type="button"
                onClick={onClear}
                onMouseEnter={onHover}
                aria-label="Limpar sintomas marcados"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="relative mt-4 space-y-4">
        {groups.map(({ queixa, symptoms }) => {
          const currentQueixa = queixa!;
          const groupSelected = symptoms.filter((symptom) =>
            selectedSignalIds.includes(symptom.id),
          ).length;
          const groupTitleId = `popular-symptoms-${currentQueixa.id}`;

          return (
            <div
              key={currentQueixa.id}
              role="group"
              aria-labelledby={groupTitleId}
            >
              <div className="mb-2 flex items-center gap-1.5">
                {currentQueixa.emoji && (
                  <span aria-hidden="true" className="text-sm leading-none">
                    {currentQueixa.emoji}
                  </span>
                )}
                <span
                  id={groupTitleId}
                  className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground"
                >
                  {currentQueixa.label}
                </span>
                {groupSelected > 0 && (
                  <span className="text-[10px] font-bold text-primary">
                    · {groupSelected}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {symptoms.map((symptom) => {
                  const active = selectedSignalIds.includes(symptom.id);
                  return (
                    <motion.button
                      key={symptom.id}
                      type="button"
                      whileTap={{ scale: 0.96 }}
                      onClick={() => onToggle(symptom.id)}
                      onMouseEnter={onHover}
                      aria-pressed={active}
                      className={`inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 py-1.5 text-left text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:min-h-10 sm:text-xs ${
                        active
                          ? "border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                          : "border-border bg-background text-foreground hover:border-primary/50 hover:bg-primary/5"
                      }`}
                    >
                      <span aria-hidden="true" className="text-sm leading-none">
                        {symptom.emoji}
                      </span>
                      <span className="leading-tight">{symptom.label}</span>
                      {active && (
                        <Check
                          className="h-3.5 w-3.5 shrink-0"
                          aria-hidden="true"
                        />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <p className="relative mt-4 border-t border-border/60 pt-3 text-[10px] leading-relaxed text-muted-foreground">
        Conteúdo autoral educativo, sem validação clínica formal. Os sinais
        ajudam a organizar a conversa e nunca estabelecem diagnóstico isolado.
      </p>
    </section>
  );
}
