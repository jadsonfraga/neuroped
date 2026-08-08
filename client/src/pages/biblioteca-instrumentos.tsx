import { useMemo, useState } from "react";
import { Library, Search, ChevronDown, ShieldAlert, ScrollText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  scaleMessageCatalog2026,
  type ScaleMessageRecord,
  type ScoreLogic,
} from "@/data/scaleMessageCatalog2026";

const LOGIC_LABEL: Record<ScoreLogic, string> = {
  manual_dependent: "Depende do manual",
  higher_worse: "↑ = mais sinais",
  higher_better: "↑ = melhor",
  classification: "Classificação",
};
const LOGIC_TONE: Record<ScoreLogic, string> = {
  manual_dependent: "text-slate-600 border-slate-300 dark:text-slate-300",
  higher_worse: "text-orange-600 border-orange-300 dark:text-orange-300",
  higher_better: "text-emerald-600 border-emerald-300 dark:text-emerald-300",
  classification: "text-violet-600 border-violet-300 dark:text-violet-300",
};
const STATUS_LABEL: Record<string, string> = {
  metadata_only: "Ficha + mensagens",
  metadata_plus_messages: "Ficha + mensagens (itens sob termos)",
  external_only: "Uso externo / licenciado",
};

function RecordCard({ rec }: { rec: ScaleMessageRecord }) {
  return (
    <details className="group rounded-xl border border-card-border bg-card">
      <summary className="flex cursor-pointer select-none items-start gap-3 p-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">{rec.instrument}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{rec.purpose}</p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Badge variant="outline" className="text-[10px]">{rec.ageRange}</Badge>
            <Badge variant="outline" className={`text-[10px] ${LOGIC_TONE[rec.scoreLogic]}`}>{LOGIC_LABEL[rec.scoreLogic]}</Badge>
            <Badge variant="outline" className="text-[10px] text-muted-foreground">{STATUS_LABEL[rec.implementationStatus] ?? rec.implementationStatus}</Badge>
          </div>
        </div>
        <ChevronDown className="mt-1 h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>
      <div className="space-y-3 border-t border-border/50 p-4 text-xs leading-relaxed">
        <div>
          <p className="font-semibold text-foreground">Instrução</p>
          <p className="mt-0.5 text-muted-foreground">{rec.instruction}</p>
        </div>
        <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-950/20">
          <p className="text-blue-800 dark:text-blue-300">{rec.infoBox}</p>
        </div>
        <div>
          <p className="mb-1 font-semibold text-foreground">Mensagens de resultado</p>
          <ul className="space-y-1.5">
            <li><span className="font-semibold text-emerald-600 dark:text-emerald-400">Favorável:</span> <span className="text-muted-foreground">{rec.resultMessages.favorable}</span></li>
            <li><span className="font-semibold text-amber-600 dark:text-amber-400">Limítrofe:</span> <span className="text-muted-foreground">{rec.resultMessages.borderline}</span></li>
            <li><span className="font-semibold text-orange-600 dark:text-orange-400">Alterado:</span> <span className="text-muted-foreground">{rec.resultMessages.altered}</span></li>
            <li><span className="font-semibold text-red-600 dark:text-red-400">Importante:</span> <span className="text-muted-foreground">{rec.resultMessages.important}</span></li>
          </ul>
        </div>
        <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 dark:bg-amber-950/20">
          <ShieldAlert className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="text-amber-800 dark:text-amber-300">{rec.safetyNote}</p>
        </div>
        <div className="flex items-start gap-2 text-muted-foreground">
          <ScrollText className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
          <p><span className="font-semibold text-foreground">Licença:</span> {rec.licensePolicy}</p>
        </div>
      </div>
    </details>
  );
}

export default function BibliotecaInstrumentosPage() {
  const [query, setQuery] = useState("");

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? scaleMessageCatalog2026.filter(
          (r) =>
            r.instrument.toLowerCase().includes(q) ||
            r.purpose.toLowerCase().includes(q) ||
            r.category.toLowerCase().includes(q) ||
            r.subcategory.toLowerCase().includes(q),
        )
      : scaleMessageCatalog2026;
    const byCat = new Map<string, ScaleMessageRecord[]>();
    for (const r of filtered) {
      const list = byCat.get(r.category) ?? [];
      list.push(r);
      byCat.set(r.category, list);
    }
    return [...byCat.entries()];
  }, [query]);

  const total = scaleMessageCatalog2026.length;
  const shown = groups.reduce((s, [, list]) => s + list.length, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-md">
          <Library className="h-5 w-5 text-white" strokeWidth={1.75} />
        </div>
        <div>
          <h1 className="text-xl leading-tight text-foreground" style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}>
            Biblioteca de Instrumentos
          </h1>
          <p className="text-xs italic text-muted-foreground">
            {total} instrumentos de referência · instrução, interpretação, segurança e política de licença
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-800/40 dark:bg-amber-950/20">
        <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-300">
          Referência técnica de apoio. Não reproduz itens protegidos, estímulos, tabelas normativas nem algoritmos proprietários — a aplicação oficial de cada instrumento depende de versão, validação brasileira, licença e manual vigentes.
        </p>
      </div>

      <div className="sticky top-0 z-20 -mx-1 rounded-xl border bg-background/95 p-2 shadow-sm backdrop-blur">
        <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            aria-label="Buscar instrumento, finalidade ou categoria"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar instrumento, finalidade ou categoria…"
            data-testid="input-search"
            className="h-10 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>
        {query && (
          <p className="px-2 pt-1.5 text-[11px] text-muted-foreground">{shown} resultado{shown !== 1 ? "s" : ""}</p>
        )}
      </div>

      {groups.length === 0 && (
        <Card className="border-card-border">
          <CardContent className="p-6 text-center text-sm text-muted-foreground">Nenhum instrumento encontrado.</CardContent>
        </Card>
      )}

      {groups.map(([category, list]) => (
        <section key={category} className="space-y-2">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-foreground">{category}</h2>
            <span className="text-[11px] text-muted-foreground">({list.length})</span>
          </div>
          <div className="space-y-2">
            {list.map((rec) => <RecordCard key={rec.id} rec={rec} />)}
          </div>
        </section>
      ))}
    </div>
  );
}
