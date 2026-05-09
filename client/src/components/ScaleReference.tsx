import { BookOpen } from "lucide-react";
import { scaleReferences } from "@/data/scaleReferences";

export function ScaleReference({ scaleId }: { scaleId: string }) {
  const ref = scaleReferences[scaleId];
  if (!ref) return null;

  return (
    <div className="mt-8 rounded-xl bg-muted/40 border border-border p-4 space-y-2">
      <div className="flex items-center gap-2">
        <BookOpen className="w-4 h-4 text-primary flex-shrink-0" />
        <h3 className="text-sm font-semibold text-foreground">Referência Bibliográfica</h3>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        {ref.authors} ({ref.year}). <em>{ref.title}</em>.{" "}
        {ref.journal && <span>{ref.journal}.</span>}
      </p>
      {ref.note && (
        <p className="text-xs text-muted-foreground leading-relaxed italic">{ref.note}</p>
      )}
    </div>
  );
}
