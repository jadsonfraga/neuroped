import { motion } from "framer-motion";
import { Sparkles, Check, RotateCcw } from "lucide-react";
import { queixas } from "@/data/scaleFilter";
import { getPopularSymptoms } from "@/data/popularSymptoms";

interface PopularSymptomPickerProps {
  selectedQueixas: string[];
  selectedSignalIds: string[];
  onToggle: (id: string) => void;
  onClear?: () => void;
  onHover?: () => void;
}

/**
 * Seletor de sintomas POPULARES, estilo Lovable — chips tocáveis em linguagem
 * de pai/mãe. Aparece assim que uma queixa é marcada (não exige idade). Para
 * cada queixa selecionada mostra um grupo com o rótulo e os sintomas comuns;
 * tocar num chip alterna a seleção, que refina o ranking do filtro.
 */
export function PopularSymptomPicker({
  selectedQueixas,
  selectedSignalIds,
  onToggle,
  onClear,
  onHover,
}: PopularSymptomPickerProps) {
  const groups = selectedQueixas
    .map((qid) => ({
      queixa: queixas.find((q) => q.id === qid),
      symptoms: getPopularSymptoms(qid),
    }))
    .filter((g) => g.queixa && g.symptoms.length > 0);

  if (groups.length === 0) return null;

  const totalSelected = groups.reduce(
    (sum, g) => sum + g.symptoms.filter((s) => selectedSignalIds.includes(s.id)).length,
    0,
  );

  return (
    <section className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.06] via-card to-chart-2/[0.05] p-4 sm:p-5 shadow-sm">
      <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br from-primary/20 to-transparent blur-2xl" />

      {/* Header */}
      <div className="relative flex items-center gap-2.5">
        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-chart-2 text-white shadow-sm shadow-primary/30">
          <Sparkles className="h-4.5 w-4.5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-black leading-tight text-foreground">Sintomas que você percebe</h3>
          <p className="text-[11px] leading-tight text-muted-foreground">Toque em tudo que a criança faz — ajuda a achar a escala certa.</p>
        </div>
        {totalSelected > 0 && (
          <div className="flex shrink-0 items-center gap-1.5">
            <span className="inline-flex items-center rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-bold text-primary">{totalSelected} marcado{totalSelected !== 1 ? "s" : ""}</span>
            {onClear && (
              <button
                type="button"
                onClick={onClear}
                onMouseEnter={onHover}
                aria-label="Limpar sintomas marcados"
                className="inline-flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Groups */}
      <div className="relative mt-4 space-y-4">
        {groups.map(({ queixa, symptoms }) => {
          const q = queixa!;
          const groupSelected = symptoms.filter((s) => selectedSignalIds.includes(s.id)).length;
          return (
            <div key={q.id}>
              {groups.length > 1 && (
                <div className="mb-1.5 flex items-center gap-1.5">
                  {q.emoji && <span aria-hidden="true" className="text-sm leading-none">{q.emoji}</span>}
                  <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{q.label}</span>
                  {groupSelected > 0 && <span className="text-[10px] font-bold text-primary">· {groupSelected}</span>}
                </div>
              )}
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {symptoms.map((s) => {
                  const active = selectedSignalIds.includes(s.id);
                  return (
                    <motion.button
                      key={s.id}
                      type="button"
                      whileTap={{ scale: 0.94 }}
                      onClick={() => onToggle(s.id)}
                      onMouseEnter={onHover}
                      aria-pressed={active}
                      aria-label={s.label}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-left text-[11px] sm:text-xs font-semibold transition-colors ${
                        active
                          ? "border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                          : "border-border bg-background text-foreground hover:-translate-y-0.5 hover:border-primary/50 hover:bg-primary/5"
                      }`}
                    >
                      <span aria-hidden="true" className="text-sm leading-none">{s.emoji}</span>
                      <span className="leading-tight">{s.label}</span>
                      {active && <Check className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Rótulo de transparência: conteúdo autoral educativo, sem validação clínica formal. */}
      <p className="relative mt-3 text-[10px] leading-snug text-muted-foreground">
        Sinais em linguagem do dia a dia — <strong className="font-semibold">material educativo, sem validação clínica
        formal</strong>. Ajudam a organizar a conversa, não substituem avaliação profissional.
      </p>
    </section>
  );
}
