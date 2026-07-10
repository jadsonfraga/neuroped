import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RotateCcw, CheckCircle2, Info, type LucideIcon } from "lucide-react";
import { ScaleReference } from "@/components/ScaleReference";
import { celebrate } from "@/lib/confetti";
import { softTick, softSuccess } from "@/lib/softSounds";
import { haptic } from "@/lib/haptic";
import { easing, duration } from "@/lib/motion";

export interface ClassLevel {
  /** Rótulo curto do nível (ex.: "I", "0", "1+"). */
  code: string;
  /** Resumo de uma linha. */
  title: string;
  /** Texto integral do nível. */
  description: string;
  /** emerald | lime | amber | orange | red — gravidade crescente. */
  color: string;
}

export interface ClassModifier {
  code: string;
  label: string;
  description: string;
}

export interface ClassificationScaleConfig {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  gradient: string;
  instruction: string;
  infoBox?: string;
  /** Eixo principal — escolha de UM nível. */
  levels: ClassLevel[];
  /** Modificador opcional (ex.: EDACS: Independente / Requer Assistência / Totalmente Dependente). */
  modifierLabel?: string;
  modifiers?: ClassModifier[];
  /** Distinções entre níveis adjacentes (referência). */
  distinctions?: string[];
  /** Rodapé de referência (ex.: velocidade/ângulo do Tardieu, fonte). */
  note?: string;
  scaleId?: string;
}

const DOT: Record<string, string> = {
  emerald: "bg-emerald-500",
  lime: "bg-lime-500",
  amber: "bg-amber-500",
  orange: "bg-orange-500",
  red: "bg-red-500",
};
const RING: Record<string, string> = {
  emerald: "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30",
  lime: "border-lime-500 bg-lime-50 dark:bg-lime-950/30",
  amber: "border-amber-500 bg-amber-50 dark:bg-amber-950/30",
  orange: "border-orange-500 bg-orange-50 dark:bg-orange-950/30",
  red: "border-red-500 bg-red-50 dark:bg-red-950/30",
};

export function ClassificationScale({ config }: { config: ClassificationScaleConfig }) {
  const [levelCode, setLevelCode] = useState<string | null>(null);
  const [modifierCode, setModifierCode] = useState<string | null>(null);

  const selectedLevel = useMemo(
    () => config.levels.find((l) => l.code === levelCode) ?? null,
    [config.levels, levelCode],
  );
  const selectedModifier = useMemo(
    () => config.modifiers?.find((m) => m.code === modifierCode) ?? null,
    [config.modifiers, modifierCode],
  );
  const modifierNeeded = Boolean(config.modifiers && config.modifiers.length > 0);
  const complete = Boolean(selectedLevel) && (!modifierNeeded || Boolean(selectedModifier));

  function reset() {
    haptic.tap();
    setLevelCode(null);
    setModifierCode(null);
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: duration.normal, ease: easing.smooth }}
        className="flex items-center gap-3"
      >
        <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-md`}>
          <config.icon className="w-5 h-5 text-white" strokeWidth={1.75} />
        </div>
        <div>
          <h1 className="text-xl text-foreground leading-tight" style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}>
            {config.title}
          </h1>
          <p className="text-xs text-muted-foreground italic">{config.subtitle}</p>
        </div>
      </motion.div>

      <div className="rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40 p-4">
        <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
          <strong>Instruções:</strong> {config.instruction}
        </p>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Selecione o nível que melhor descreve o paciente</h2>
        {config.levels.map((level) => {
          const active = level.code === levelCode;
          return (
            <button
              key={level.code}
              type="button"
              onClick={() => {
                softTick();
                haptic.select();
                setLevelCode(level.code);
              }}
              aria-pressed={active}
              data-testid={`level-${level.code}`}
              className={`w-full rounded-xl border p-4 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                active ? RING[level.color] ?? "border-primary bg-muted" : "border-card-border bg-card hover:bg-muted/50"
              }`}
            >
              <div className="flex items-start gap-3">
                <span className={`mt-0.5 flex h-7 min-w-7 items-center justify-center rounded-lg px-1.5 text-xs font-bold text-white ${DOT[level.color] ?? "bg-gray-500"}`}>
                  {level.code}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">{level.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{level.description}</p>
                </div>
                {active && <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />}
              </div>
            </button>
          );
        })}
      </div>

      {modifierNeeded && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-foreground">{config.modifierLabel ?? "Modificador"}</h2>
          <div className="flex flex-wrap gap-2">
            {config.modifiers!.map((m) => {
              const active = m.code === modifierCode;
              return (
                <button
                  key={m.code}
                  type="button"
                  onClick={() => {
                    softTick();
                    haptic.select();
                    setModifierCode(m.code);
                  }}
                  aria-pressed={active}
                  data-testid={`modifier-${m.code}`}
                  title={m.description}
                  className={`rounded-full border px-3.5 py-2 text-xs transition-all ${
                    active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground hover:bg-muted"
                  }`}
                >
                  <span className="font-semibold">{m.code}</span> — {m.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {complete && selectedLevel && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: duration.normal, ease: easing.smooth }}
          onAnimationStart={() => {
            softSuccess();
            haptic.success();
            celebrate();
          }}
        >
          <Card className="border-card-border overflow-hidden">
            <div className={`p-6 text-center space-y-2 ${
              selectedLevel.color === "emerald"
                ? "bg-gradient-to-br from-emerald-500 to-green-600"
                : selectedLevel.color === "lime"
                  ? "bg-gradient-to-br from-lime-500 to-emerald-600"
                  : selectedLevel.color === "amber"
                    ? "bg-gradient-to-br from-amber-500 to-yellow-600"
                    : selectedLevel.color === "orange"
                      ? "bg-gradient-to-br from-orange-500 to-red-500"
                      : "bg-gradient-to-br from-red-500 to-rose-600"
            }`}>
              <div className="text-4xl font-bold text-white">
                {selectedLevel.code}{selectedModifier ? ` ${selectedModifier.code}` : ""}
              </div>
              <p className="text-sm text-white/90">{selectedLevel.title}</p>
            </div>
            <CardContent className="p-6 space-y-4">
              <div className="rounded-xl bg-muted/50 p-4">
                <p className="text-sm text-foreground leading-relaxed">{selectedLevel.description}</p>
              </div>
              {selectedModifier && (
                <div className="rounded-xl bg-muted/40 p-4">
                  <p className="text-sm text-foreground leading-relaxed">
                    <strong>{config.modifierLabel ?? "Modificador"} — {selectedModifier.code} ({selectedModifier.label}):</strong> {selectedModifier.description}
                  </p>
                </div>
              )}
              {config.infoBox && (
                <div className="rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40 p-4">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">{config.infoBox}</p>
                  </div>
                </div>
              )}
              <button
                type="button"
                onClick={reset}
                data-testid="button-reset"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-sm font-medium text-foreground transition hover:bg-muted"
              >
                <RotateCcw className="h-4 w-4" /> Nova classificação
              </button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {config.distinctions && config.distinctions.length > 0 && (
        <details className="rounded-xl border border-border/60 bg-muted/20 p-4">
          <summary className="cursor-pointer select-none text-sm font-semibold text-foreground">
            Distinções entre níveis adjacentes
          </summary>
          <ul className="mt-3 space-y-2">
            {config.distinctions.map((d, i) => (
              <li key={i} className="text-xs text-muted-foreground leading-relaxed">• {d}</li>
            ))}
          </ul>
        </details>
      )}

      {config.note && (
        <div className="rounded-xl border border-border/50 bg-muted/20 p-4">
          <p className="text-[11px] text-muted-foreground leading-relaxed whitespace-pre-line">{config.note}</p>
        </div>
      )}

      {config.scaleId && <ScaleReference scaleId={config.scaleId} />}
    </div>
  );
}
