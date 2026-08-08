import { useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  Library,
  Search,
  ShieldAlert,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  scaleMessageCatalog2026,
  type ScaleMessageRecord,
  type ScoreLogic,
} from "@/data/scaleMessageCatalog2026";
import {
  dailyAuthorialCatalog,
  dailyAuthorialCatalogErrors,
  type DailyAuthorialInventory,
} from "@/data/dailyAuthorialCatalog";
import {
  dailyInventoryMatchesQuery,
  parseReferenceAgeRange,
} from "@/lib/instrument-library-filters";

const LOGIC_LABEL: Record<ScoreLogic, string> = {
  manual_dependent: "Depende do manual",
  higher_worse: "↑ = mais sinais",
  higher_better: "↑ = melhor",
  classification: "Classificação",
};

const RESPONDENT_LABEL: Record<string, string> = {
  pais_cuidadores: "Pais/cuidadores",
  professor: "Professor",
  clinico: "Clínico",
  crianca_adolescente: "Criança/adolescente",
  multiplo: "Múltiplos",
};

const CONTEXT_LABEL: Record<string, string> = {
  casa: "Casa",
  escola: "Escola",
  clinica: "Clínica",
  multicontexto: "Multicontexto",
};

const STATUS_LABEL: Record<string, string> = {
  metadata_only: "Ficha técnica",
  metadata_plus_messages: "Ficha + mensagens",
  external_only: "Externo/licenciado",
  rascunho_revisao: "Rascunho — revisar",
  revisado_clinicamente: "Revisado clinicamente",
  arquivado: "Arquivado",
};

const RISK_LABEL: Record<string, string> = {
  baixo: "Risco baixo",
  moderado: "Risco moderado",
  alto: "Risco alto",
};

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function formatAge(months: number): string {
  if (months < 12) return `${months} meses`;
  const years = Math.floor(months / 12);
  const rest = months % 12;
  return rest
    ? `${years}a ${rest}m`
    : `${years} ${years === 1 ? "ano" : "anos"}`;
}

function referenceRespondents(record: ScaleMessageRecord): string[] {
  const text = normalize(
    `${record.purpose} ${record.instruction} ${record.instrument}`,
  );
  const values = new Set<string>();
  if (/pais|cuidador|familia|responsavel/.test(text))
    values.add("pais_cuidadores");
  if (/professor|escola|docente/.test(text)) values.add("professor");
  if (/autoaplic|autorrelato|crianca|adolescente/.test(text))
    values.add("crianca_adolescente");
  if (/clinico|profissional|observa/.test(text)) values.add("clinico");
  return values.size ? [...values] : ["multiplo"];
}

function referenceContexts(record: ScaleMessageRecord): string[] {
  const text = normalize(
    `${record.purpose} ${record.instruction} ${record.category}`,
  );
  const values = new Set<string>();
  if (/pais|familia|casa|cuidador/.test(text)) values.add("casa");
  if (/escola|professor|academ/.test(text)) values.add("escola");
  if (/clinico|consulta|profissional/.test(text)) values.add("clinica");
  return values.size ? [...values] : ["multicontexto"];
}

function ReferenceCard({ record }: { record: ScaleMessageRecord }) {
  return (
    <details className="group rounded-xl border border-card-border bg-card">
      <summary className="flex cursor-pointer list-none items-start gap-3 p-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge
              variant="outline"
              className="text-[10px] text-indigo-700 dark:text-indigo-300"
            >
              Referência reconhecida
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              {record.ageRange}
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              {LOGIC_LABEL[record.scoreLogic]}
            </Badge>
          </div>
          <p className="mt-2 text-sm font-semibold text-foreground">
            {record.instrument}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {record.purpose}
          </p>
        </div>
        <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>
      <div className="space-y-3 border-t border-border/60 p-4 text-xs leading-relaxed">
        <div>
          <p className="font-semibold text-foreground">
            Instrução de referência
          </p>
          <p className="mt-1 text-muted-foreground">{record.instruction}</p>
        </div>
        <div className="rounded-lg bg-blue-50 p-3 text-blue-900 dark:bg-blue-950/20 dark:text-blue-200">
          {record.infoBox}
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          <p>
            <strong className="text-emerald-700 dark:text-emerald-300">
              Favorável:
            </strong>{" "}
            {record.resultMessages.favorable}
          </p>
          <p>
            <strong className="text-amber-700 dark:text-amber-300">
              Limítrofe:
            </strong>{" "}
            {record.resultMessages.borderline}
          </p>
          <p>
            <strong className="text-orange-700 dark:text-orange-300">
              Alterado:
            </strong>{" "}
            {record.resultMessages.altered}
          </p>
          <p>
            <strong className="text-red-700 dark:text-red-300">
              Importante:
            </strong>{" "}
            {record.resultMessages.important}
          </p>
        </div>
        <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-amber-900 dark:bg-amber-950/20 dark:text-amber-200">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{record.safetyNote}</p>
        </div>
        <p className="text-muted-foreground">
          <strong className="text-foreground">Licença:</strong>{" "}
          {record.licensePolicy}
        </p>
        <p className="text-muted-foreground">
          <strong className="text-foreground">Status:</strong>{" "}
          {STATUS_LABEL[record.implementationStatus] ??
            record.implementationStatus}
        </p>
      </div>
    </details>
  );
}

function DailyCard({ record }: { record: DailyAuthorialInventory }) {
  const itemsByDomain = new Map(
    record.domains.map((domain) => [
      domain.id,
      record.items.filter((item) => item.domainId === domain.id),
    ]),
  );

  return (
    <details className="group rounded-xl border border-violet-200 bg-card dark:border-violet-800/60">
      <summary className="flex cursor-pointer list-none items-start gap-3 p-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge className="bg-violet-100 text-violet-800 hover:bg-violet-100 dark:bg-violet-950 dark:text-violet-200">
              Autoral diário
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              {STATUS_LABEL[record.status]}
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              {RISK_LABEL[record.riskClass]}
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              {record.generatedOn}
            </Badge>
          </div>
          <p className="mt-2 text-sm font-semibold text-foreground">
            {record.title}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {record.purpose}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] text-muted-foreground">
            <span>
              {formatAge(record.ageMinMonths)}–{formatAge(record.ageMaxMonths)}
            </span>
            <span>•</span>
            <span>{RESPONDENT_LABEL[record.respondent]}</span>
            <span>•</span>
            <span>{record.items.length} itens</span>
            <span>•</span>
            <span>{record.durationMinutes} min</span>
          </div>
        </div>
        <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>

      <div className="space-y-4 border-t border-border/60 p-4 text-xs leading-relaxed">
        <div className="rounded-lg border border-violet-200 bg-violet-50 p-3 text-violet-950 dark:border-violet-800/60 dark:bg-violet-950/20 dark:text-violet-100">
          <p className="font-semibold">Rascunho clínico não validado</p>
          <p className="mt-1">
            Não participa do ranking automático de escalas nem deve ser usado
            isoladamente para diagnóstico ou conduta. Exige revisão clínica
            explícita antes da promoção de status.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <p className="font-semibold text-foreground">Finalidade</p>
            <p className="mt-1 text-muted-foreground">{record.rationale}</p>
          </div>
          <div>
            <p className="font-semibold text-foreground">Aplicação</p>
            <p className="mt-1 text-muted-foreground">
              {record.instructions}
            </p>
          </div>
          <div>
            <p className="font-semibold text-foreground">Período</p>
            <p className="mt-1 text-muted-foreground">{record.timeframe}</p>
          </div>
          <div>
            <p className="font-semibold text-foreground">Contextos</p>
            <p className="mt-1 text-muted-foreground">
              {record.contexts
                .map((value) => CONTEXT_LABEL[value])
                .join(" · ")}
            </p>
          </div>
        </div>

        <div>
          <p className="font-semibold text-foreground">Opções de resposta</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {record.responseOptions.map((option) => (
              <Badge
                key={option.code}
                variant="outline"
                className="text-[10px]"
              >
                {option.code}: {option.label}
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <p className="font-semibold text-foreground">Domínios e itens</p>
          {record.domains.map((domain) => (
            <section
              key={domain.id}
              className="rounded-lg border border-border/70 p-3"
            >
              <p className="font-semibold text-foreground">{domain.label}</p>
              <p className="mt-0.5 text-muted-foreground">
                {domain.description}
              </p>
              <ol className="mt-2 space-y-2">
                {(itemsByDomain.get(domain.id) ?? []).map((item) => (
                  <li key={item.id} className="flex gap-2">
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {item.id}
                    </span>
                    <div>
                      <p className="text-foreground">
                        {item.text}{" "}
                        {item.redFlag && (
                          <Badge
                            variant="destructive"
                            className="ml-1 text-[9px]"
                          >
                            Red flag
                          </Badge>
                        )}
                      </p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        {item.clinicalNote}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>

        <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900/50">
          <p className="font-semibold text-foreground">
            Interpretação sem escore total
          </p>
          <p className="mt-1 text-muted-foreground">
            {record.scoring.instructions}
          </p>
          <p className="mt-1 text-muted-foreground">
            {record.scoring.domainInterpretation}
          </p>
        </div>

        {record.redFlags.length > 0 && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900/60 dark:bg-red-950/20">
            <p className="flex items-center gap-2 font-semibold text-red-900 dark:text-red-200">
              <ShieldAlert className="h-4 w-4" /> Red flags independentes
            </p>
            <ul className="mt-2 space-y-1.5 text-red-900 dark:text-red-200">
              {record.redFlags.map((flag) => (
                <li key={flag.itemId}>
                  <strong>{flag.itemId}:</strong> {flag.action}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <p className="font-semibold text-foreground">Diferenciais</p>
            <ul className="mt-1 space-y-1 text-muted-foreground">
              {record.differentialConsiderations.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-semibold text-foreground">Integração clínica</p>
            <ul className="mt-1 space-y-1 text-muted-foreground">
              {record.clinicalIntegration.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-semibold text-foreground">Limitações</p>
            <ul className="mt-1 space-y-1 text-muted-foreground">
              {record.limitations.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-amber-900 dark:bg-amber-950/20 dark:text-amber-200">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{record.safetyNote}</p>
        </div>

        <p className="text-[10px] text-muted-foreground">
          Gerado por {record.generation.model} · modo{" "}
          {record.generation.reasoningMode} · esforço{" "}
          {record.generation.reasoningEffort} · pipeline{" "}
          {record.generation.pipelineVersion}
        </p>
      </div>
    </details>
  );
}

export default function BibliotecaInstrumentosPage() {
  const [query, setQuery] = useState("");
  const [source, setSource] = useState("todos");
  const [category, setCategory] = useState("todas");
  const [ageYears, setAgeYears] = useState("");
  const [respondent, setRespondent] = useState("todos");
  const [context, setContext] = useState("todos");
  const [status, setStatus] = useState("todos");

  const categories = useMemo(
    () =>
      [
        ...new Set([
          ...scaleMessageCatalog2026.map((item) => item.category),
          ...dailyAuthorialCatalog.map((item) => item.category),
        ]),
      ].sort(),
    [],
  );

  const referenceResults = useMemo(() => {
    const q = normalize(query.trim());
    const ageMonths = ageYears === "" ? null : Number(ageYears) * 12;
    return scaleMessageCatalog2026.filter((record) => {
      if (source === "autorais") return false;
      if (category !== "todas" && record.category !== category) return false;
      if (status !== "todos" && status !== "referencia") return false;
      if (ageMonths !== null && Number.isFinite(ageMonths)) {
        const range = parseReferenceAgeRange(record.ageRange);
        if (range && (ageMonths < range[0] || ageMonths > range[1]))
          return false;
      }
      if (
        respondent !== "todos" &&
        !referenceRespondents(record).includes(respondent)
      )
        return false;
      if (
        context !== "todos" &&
        !referenceContexts(record).includes(context)
      )
        return false;
      if (!q) return true;
      return normalize(
        `${record.instrument} ${record.purpose} ${record.category} ${record.subcategory} ${record.instruction}`,
      ).includes(q);
    });
  }, [ageYears, category, context, query, respondent, source, status]);

  const dailyResults = useMemo(() => {
    const ageMonths = ageYears === "" ? null : Number(ageYears) * 12;
    return dailyAuthorialCatalog.filter((record) => {
      if (source === "referencias") return false;
      if (category !== "todas" && record.category !== category) return false;
      if (status !== "todos" && status !== record.status) return false;
      if (
        ageMonths !== null &&
        Number.isFinite(ageMonths) &&
        (ageMonths < record.ageMinMonths || ageMonths > record.ageMaxMonths)
      )
        return false;
      if (
        respondent !== "todos" &&
        record.respondent !== respondent &&
        record.respondent !== "multiplo"
      )
        return false;
      if (
        context !== "todos" &&
        !record.contexts.includes(
          context as DailyAuthorialInventory["contexts"][number],
        ) &&
        !record.contexts.includes("multicontexto")
      )
        return false;
      return dailyInventoryMatchesQuery(record, query);
    });
  }, [ageYears, category, context, query, respondent, source, status]);

  const totalShown = referenceResults.length + dailyResults.length;
  const hasFilters =
    query ||
    source !== "todos" ||
    category !== "todas" ||
    ageYears ||
    respondent !== "todos" ||
    context !== "todos" ||
    status !== "todos";

  function clearFilters() {
    setQuery("");
    setSource("todos");
    setCategory("todas");
    setAgeYears("");
    setRespondent("todos");
    setContext("todos");
    setStatus("todos");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-md">
          <Library className="h-5 w-5 text-white" strokeWidth={1.75} />
        </div>
        <div className="min-w-0 flex-1">
          <h1
            className="text-xl font-semibold leading-tight text-foreground"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Biblioteca de Instrumentos
          </h1>
          <p className="mt-0.5 text-xs italic text-muted-foreground">
            {scaleMessageCatalog2026.length} referências técnicas ·{" "}
            {dailyAuthorialCatalog.length === 1
              ? "1 inventário autoral diário"
              : `${dailyAuthorialCatalog.length} inventários autorais diários`}
          </p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3 dark:border-indigo-800/50 dark:bg-indigo-950/20">
          <p className="flex items-center gap-2 text-xs font-semibold text-indigo-900 dark:text-indigo-200">
            <Library className="h-4 w-4" /> Referências reconhecidas
          </p>
          <p className="mt-1 text-xs leading-relaxed text-indigo-800 dark:text-indigo-300">
            Ficha técnica, interpretação e política de licença. Itens
            protegidos e normas oficiais não são reproduzidos.
          </p>
        </div>
        <div className="rounded-xl border border-violet-200 bg-violet-50 p-3 dark:border-violet-800/50 dark:bg-violet-950/20">
          <p className="flex items-center gap-2 text-xs font-semibold text-violet-900 dark:text-violet-200">
            <Sparkles className="h-4 w-4" /> Inventários autorais diários
          </p>
          <p className="mt-1 text-xs leading-relaxed text-violet-800 dark:text-violet-300">
            Entram automaticamente como rascunhos não validados, sem escore
            total e fora das recomendações clínicas até revisão.
          </p>
        </div>
      </div>

      {dailyAuthorialCatalogErrors.length > 0 && (
        <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-xs text-red-900 dark:border-red-900 dark:bg-red-950/20 dark:text-red-200">
          <p className="font-semibold">
            Falha de integridade do catálogo autoral
          </p>
          {dailyAuthorialCatalogErrors.map((error) => (
            <p key={error} className="mt-1">
              {error}
            </p>
          ))}
        </div>
      )}

      <Card className="sticky top-0 z-20 border-card-border bg-background/95 shadow-sm backdrop-blur">
        <CardContent className="space-y-3 p-3">
          <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              aria-label="Buscar instrumento, tema, finalidade, domínio ou item"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar instrumento, tema, finalidade, domínio ou item…"
              className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              data-testid="input-search"
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
            <label className="text-[10px] font-medium text-muted-foreground">
              Fonte
              <select
                aria-label="Filtrar por fonte"
                value={source}
                onChange={(event) => setSource(event.target.value)}
                className="mt-1 h-9 w-full rounded-md border bg-background px-2 text-xs text-foreground"
              >
                <option value="todos">Todas</option>
                <option value="referencias">Referências</option>
                <option value="autorais">Autorais diários</option>
              </select>
            </label>
            <label className="text-[10px] font-medium text-muted-foreground">
              Categoria
              <select
                aria-label="Filtrar por categoria"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="mt-1 h-9 w-full rounded-md border bg-background px-2 text-xs text-foreground"
              >
                <option value="todas">Todas</option>
                {categories.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-[10px] font-medium text-muted-foreground">
              Idade em anos
              <input
                aria-label="Filtrar por idade em anos"
                type="number"
                min="0"
                max="20"
                step="0.1"
                value={ageYears}
                onChange={(event) => setAgeYears(event.target.value)}
                placeholder="Ex.: 8"
                className="mt-1 h-9 w-full rounded-md border bg-background px-2 text-xs text-foreground"
              />
            </label>
            <label className="text-[10px] font-medium text-muted-foreground">
              Respondente
              <select
                aria-label="Filtrar por respondente"
                value={respondent}
                onChange={(event) => setRespondent(event.target.value)}
                className="mt-1 h-9 w-full rounded-md border bg-background px-2 text-xs text-foreground"
              >
                <option value="todos">Todos</option>
                <option value="pais_cuidadores">Pais/cuidadores</option>
                <option value="professor">Professor</option>
                <option value="clinico">Clínico</option>
                <option value="crianca_adolescente">
                  Criança/adolescente
                </option>
                <option value="multiplo">Múltiplos</option>
              </select>
            </label>
            <label className="text-[10px] font-medium text-muted-foreground">
              Contexto
              <select
                aria-label="Filtrar por contexto"
                value={context}
                onChange={(event) => setContext(event.target.value)}
                className="mt-1 h-9 w-full rounded-md border bg-background px-2 text-xs text-foreground"
              >
                <option value="todos">Todos</option>
                <option value="casa">Casa</option>
                <option value="escola">Escola</option>
                <option value="clinica">Clínica</option>
                <option value="multicontexto">Multicontexto</option>
              </select>
            </label>
            <label className="text-[10px] font-medium text-muted-foreground">
              Evidência/status
              <select
                aria-label="Filtrar por evidência ou status"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="mt-1 h-9 w-full rounded-md border bg-background px-2 text-xs text-foreground"
              >
                <option value="todos">Todos</option>
                <option value="referencia">Referência reconhecida</option>
                <option value="rascunho_revisao">Rascunho autoral</option>
                <option value="revisado_clinicamente">Autoral revisado</option>
              </select>
            </label>
          </div>
          <div className="flex items-center justify-between gap-2">
            <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <SlidersHorizontal className="h-3.5 w-3.5" /> {totalShown}{" "}
              resultado{totalShown === 1 ? "" : "s"}
            </p>
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-7 text-xs"
              >
                Limpar filtros
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {dailyResults.length > 0 && (
        <section className="space-y-2">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-violet-600" />
            <h2 className="text-sm font-semibold text-foreground">
              Inventários autorais diários
            </h2>
            <span className="text-[11px] text-muted-foreground">
              ({dailyResults.length})
            </span>
          </div>
          <div className="space-y-2">
            {dailyResults.map((record) => (
              <DailyCard key={record.id} record={record} />
            ))}
          </div>
        </section>
      )}

      {referenceResults.length > 0 && (
        <section className="space-y-2">
          <div className="flex items-center gap-2">
            <Library className="h-4 w-4 text-indigo-600" />
            <h2 className="text-sm font-semibold text-foreground">
              Referências técnicas
            </h2>
            <span className="text-[11px] text-muted-foreground">
              ({referenceResults.length})
            </span>
          </div>
          <div className="space-y-2">
            {referenceResults.map((record) => (
              <ReferenceCard key={record.id} record={record} />
            ))}
          </div>
        </section>
      )}

      {totalShown === 0 && (
        <Card className="border-card-border">
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            Nenhum instrumento corresponde aos filtros selecionados.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
