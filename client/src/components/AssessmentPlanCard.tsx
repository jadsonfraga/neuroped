import { Clock } from "lucide-react";
import {
  getAssessmentUse,
  type RefinedScaleMatch,
} from "@/data/advancedFilterLogic";
import type { PodiumSelection } from "@/data/filterPodium";
import { formatMinutesBudget, sumScaleMinutes } from "@/lib/scaleTime";

/**
 * Plano de avaliação em fases, derivado do PÓDIO AUDITADO do filtro.
 *
 * Herdeiro honesto do "BLOCO 3": o antigo showcase demonstrava uma "bateria
 * otimizada" gerada por um motor paralelo com ids hardcoded (vários
 * inexistentes no catálogo — baterias saíam VAZIAS), sem gate de idade e com
 * confiança fixa inventada. Este componente não tem motor próprio: consome
 * exclusivamente as escalas que o motor real do filtro já aprovou (idade,
 * queixa, respondente, segurança, disponibilidade) e só acrescenta a leitura
 * operacional — fases e orçamento de tempo real do catálogo, com a incerteza
 * declarada quando algum tempo é "variável".
 */
interface AssessmentPlanCardProps {
  podium: PodiumSelection;
}

/**
 * A finalidade exibida vem do CATÁLOGO (getAssessmentUse), nunca da posição
 * no plano: rotular a fase como "triagem" reclassificaria clinicamente um
 * ouro diagnóstico (ex.: CARS) ou de monitorização (ex.: EUSM-10). As fases
 * têm nomes neutros de ordem de aplicação; a categoria clínica é por escala.
 */
const ASSESSMENT_USE_LABEL: Record<string, string> = {
  triagem: "Triagem",
  diagnostico: "Apoio diagnóstico",
  monitorizacao: "Monitorização",
  seguimento: "Seguimento",
  psicoeducacao: "Psicoeducação",
};

interface PlanPhase {
  label: string;
  detail: string;
  matches: RefinedScaleMatch[];
}

function PlanScaleRow({ match }: { match: RefinedScaleMatch }) {
  const { scale } = match;
  return (
    <li className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
      <span className="text-sm font-semibold text-foreground">
        {scale.name}
        <span className="ml-2 text-xs font-normal text-muted-foreground">
          {scale.respondente.join(" · ")}
        </span>
      </span>
      <span className="text-xs text-muted-foreground">
        <span className="mr-2 rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[10px] font-semibold text-foreground/80">
          {ASSESSMENT_USE_LABEL[getAssessmentUse(scale)] ?? getAssessmentUse(scale)}
        </span>
        {scale.tempo?.trim() || "tempo variável"}
        {match.implementationStatus !== "complete" && (
          <span className="ml-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-800 dark:text-amber-200">
            {match.implementationLabel}
          </span>
        )}
      </span>
    </li>
  );
}

export function AssessmentPlanCard({ podium }: AssessmentPlanCardProps) {
  const phases: PlanPhase[] = [
    {
      label: "Fase 1 — Instrumento principal",
      detail:
        "Comece por aqui: melhor cruzamento de idade, queixa e respondente para este perfil.",
      matches: [podium.ouro].filter(Boolean) as RefinedScaleMatch[],
    },
    {
      label: "Fase 2 — Complementares",
      detail: "Aplique se houver tempo e a suspeita clínica se mantiver.",
      matches: [podium.prata, podium.bronze].filter(
        Boolean,
      ) as RefinedScaleMatch[],
    },
    {
      label: "Complemento por contexto",
      detail: "Testagem direta com a criança e/ou visão da escola, quando disponíveis.",
      matches: [podium.direct, podium.school].filter(
        Boolean,
      ) as RefinedScaleMatch[],
    },
  ].filter((phase) => phase.matches.length > 0);

  if (phases.length === 0) return null;

  const budget = sumScaleMinutes(
    phases.flatMap((phase) => phase.matches.map((m) => m.scale.tempo)),
  );

  return (
    <section
      data-testid="assessment-plan"
      aria-label="Plano de avaliação em fases"
      className="rounded-2xl border border-border bg-card p-4 sm:p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-primary">
          Plano de avaliação em fases
        </h3>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <Clock className="h-3.5 w-3.5" aria-hidden />
          {formatMinutesBudget(budget)}
        </span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Derivado do pódio acima — mesmas escalas, organizadas em ordem de
        aplicação com o tempo declarado no catálogo. Nada aqui contorna idade,
        licença ou disponibilidade.
      </p>
      <ol className="mt-3 space-y-3">
        {phases.map((phase) => (
          <li
            key={phase.label}
            className="rounded-xl border border-border bg-muted/30 p-3"
          >
            <p className="text-xs font-bold text-foreground">{phase.label}</p>
            <p className="text-[11px] text-muted-foreground">{phase.detail}</p>
            <ul className="mt-2 space-y-1.5">
              {phase.matches.map((match) => (
                <PlanScaleRow key={match.scale.id} match={match} />
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </section>
  );
}
