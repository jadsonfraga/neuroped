import { BookOpen, ChevronDown } from "lucide-react";
import { scaleReferences } from "@/data/scaleReferences";

/**
 * Referência científica recolhível. A evidência diferencia o NeuroPed de apps
 * genéricos, mas não deve ocupar a região nobre da tela durante ou após o
 * preenchimento — expande sob demanda via <details>, sem JS e acessível.
 */
export function ScaleReference({ scaleId }: { scaleId: string }) {
  const ref = scaleReferences[scaleId];
  if (!ref) return null;

  return (
    <details className="group mt-8 rounded-xl border border-border bg-muted/40">
      <summary className="flex min-h-[48px] cursor-pointer list-none items-center gap-2 rounded-xl px-4 py-3 transition-colors hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
        <BookOpen className="h-4 w-4 flex-shrink-0 text-primary" />
        <h2 className="flex-1 text-sm font-semibold text-foreground">
          Evidência e referência da escala
        </h2>
        <ChevronDown
          className="h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>
      <div className="space-y-2 px-4 pb-4">
        <p className="text-xs leading-relaxed text-muted-foreground">
          {ref.authors} ({ref.year}). <em>{ref.title}</em>.{" "}
          {ref.journal && <span>{ref.journal}.</span>}
        </p>
        {ref.note && (
          <p className="text-xs italic leading-relaxed text-muted-foreground">{ref.note}</p>
        )}
      </div>
    </details>
  );
}
