import { useMemo, useState } from "react";
import { BookOpen, Search, ShieldAlert, Lock, Copy, Check, Quote, X, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  standardizedInstruments,
  availableDomains,
  DOMAIN_LABEL,
  NEUROPED_USE_LABEL,
  EVIDENCE_LABEL,
  type InstrumentDomain,
  type StandardizedInstrument,
} from "@/data/standardizedInstruments";

// Codificação de cor sóbria por domínio (pontinho nos badges + realce do filtro).
const DOMAIN_DOT: Record<InstrumentDomain, string> = {
  tea: "bg-rose-400",
  tdah: "bg-teal-400",
  desenvolvimento: "bg-amber-400",
  cognicao: "bg-violet-400",
  comportamento_adaptativo: "bg-emerald-400",
  sensorial: "bg-orange-400",
  atencao: "bg-sky-400",
  motricidade: "bg-indigo-400",
  aprendizagem: "bg-cyan-400",
};

const EVIDENCE_STYLE: Record<StandardizedInstrument["evidenceLevel"], string> = {
  amplo: "bg-emerald-100 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900",
  validado: "bg-sky-100 text-sky-700 ring-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:ring-sky-900",
  triagem: "bg-stone-100 text-stone-600 ring-stone-200 dark:bg-stone-800/60 dark:text-stone-300 dark:ring-stone-700",
};

const USE_STYLE: Record<StandardizedInstrument["neuropediatricUse"], string> = {
  integra_relatorio:
    "bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/30 dark:text-sky-300 dark:border-sky-900",
  triagem_nao_restrita:
    "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900",
  requer_psicologo:
    "bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900",
};

function norm(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function InstrumentCard({ inst }: { inst: StandardizedInstrument }) {
  const [showCitation, setShowCitation] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyCitation = () => {
    navigator.clipboard?.writeText(inst.citation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Barra de acento no topo: vermelho (desfavorável) > âmbar (restrito) > primário.
  const accentBar = inst.satepsiUnfavorable
    ? "from-red-500 to-rose-600"
    : inst.restricted
      ? "from-amber-400 to-orange-500"
      : "from-primary to-chart-2";

  return (
    <Card
      className={`group relative flex h-full flex-col overflow-hidden rounded-3xl border bg-card/90 shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg ${
        inst.restricted ? "border-amber-200/70 dark:border-amber-900/50" : "border-border/70 hover:border-primary/40"
      }`}
    >
      {/* Acento superior */}
      <div className={`h-1 w-full bg-gradient-to-r ${accentBar}`} />

      <CardContent className="flex h-full flex-col gap-3 p-4 sm:p-5">
        {/* Cabeçalho */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="fraunces text-[1.05rem] font-bold leading-tight tracking-tight text-foreground">
              {inst.name}
            </h3>
            <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{inst.fullName}</p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <Badge variant="outline" className="rounded-full text-[10px] font-bold">
              {inst.publisher}
            </Badge>
            <span
              className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ring-1 ${EVIDENCE_STYLE[inst.evidenceLevel]}`}
              title="Grau de padronização/validação (não é nível formal de evidência clínica/GRADE)."
            >
              {EVIDENCE_LABEL[inst.evidenceLevel]}
            </span>
          </div>
        </div>

        {/* Alerta de restrição profissional */}
        {inst.restricted && (
          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/80 px-2.5 py-1.5 text-[11px] font-semibold leading-snug text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>Restrito a psicóloga(o) — aplicação/interpretação conforme SATEPSI/CFP.</span>
          </div>
        )}

        {/* Domínios (com pontinho de cor) */}
        <div className="flex flex-wrap gap-1.5">
          {inst.domains.map((d) => (
            <span
              key={d}
              className="inline-flex items-center gap-1.5 rounded-full bg-muted/70 px-2.5 py-0.5 text-[10px] font-semibold text-foreground/75"
            >
              <span className={`h-1.5 w-1.5 rounded-full ${DOMAIN_DOT[d]}`} />
              {DOMAIN_LABEL[d]}
            </span>
          ))}
        </div>

        {/* Metadados */}
        <dl className="space-y-2 text-xs">
          {([
            ["Faixa / observação", inst.ageRange],
            ["Indicação clínica", inst.clinicalIndication],
            ["Forma geral de uso", inst.generalUse],
            ["Restrição profissional", inst.professionalRestriction],
          ] as const).map(([term, desc]) => (
            <div key={term}>
              <dt className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground/80">{term}</dt>
              <dd className="mt-0.5 leading-relaxed text-foreground/80">{desc}</dd>
            </div>
          ))}
        </dl>

        {/* Uso pelo neuropediatra */}
        <div
          className={`rounded-xl border px-3 py-2 text-[11px] font-semibold leading-snug ${USE_STYLE[inst.neuropediatricUse]}`}
        >
          <span className="opacity-60">Uso pelo neuropediatra · </span>
          {NEUROPED_USE_LABEL[inst.neuropediatricUse]}
        </div>

        {/* Nota SATEPSI */}
        {inst.satepsiNote && (
          <div
            className={`rounded-xl border px-3 py-2 text-[11px] font-medium leading-snug ${
              inst.satepsiUnfavorable
                ? "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
                : "border-border bg-muted/40 text-muted-foreground"
            }`}
          >
            {inst.satepsiUnfavorable ? "⚠️ " : ""}
            <span className="font-bold">SATEPSI:</span> {inst.satepsiNote}
          </div>
        )}

        {/* Referência */}
        <p className="text-[11px] italic leading-relaxed text-muted-foreground">{inst.reference}</p>

        {/* Como citar no laudo */}
        <div className="mt-auto pt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full gap-2 rounded-xl text-xs"
            onClick={() => setShowCitation((v) => !v)}
          >
            <Quote className="h-3.5 w-3.5" />
            {showCitation ? "Ocultar citação" : "Como citar no laudo"}
          </Button>
          {showCitation && (
            <div className="mt-2 rounded-xl border border-border bg-muted/40 p-3">
              <p className="text-[11px] leading-relaxed text-foreground/80">{inst.citation}</p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-1.5 h-7 gap-1.5 text-[11px]"
                onClick={copyCitation}
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copiado" : "Copiar texto"}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function InstrumentosPadronizadosPage() {
  const [search, setSearch] = useState("");
  const [domain, setDomain] = useState<InstrumentDomain | "todos">("todos");

  const filtered = useMemo(() => {
    const q = norm(search.trim());
    return standardizedInstruments.filter((inst) => {
      const domainOk = domain === "todos" || inst.domains.includes(domain);
      if (!domainOk) return false;
      if (!q) return true;
      const haystack = norm(
        `${inst.name} ${inst.fullName} ${inst.clinicalIndication} ${inst.publisher} ${inst.domains
          .map((d) => DOMAIN_LABEL[d])
          .join(" ")}`
      );
      return haystack.includes(q);
    });
  }, [search, domain]);

  const restritos = standardizedInstruments.filter((i) => i.restricted).length;

  return (
    <div className="space-y-6 pb-8">
      {/* ───────── Hero ───────── */}
      <div className="relative overflow-hidden rounded-[1.75rem] border border-border/70 bg-gradient-to-br from-primary/12 via-chart-2/8 to-transparent p-5 shadow-sm backdrop-blur sm:p-7">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-chart-2 text-white shadow-md">
            <BookOpen className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <Badge className="mb-1.5 rounded-full bg-primary/10 text-[10px] font-bold text-primary hover:bg-primary/10">
              Pearson · Hogrefe
            </Badge>
            <h1 className="fraunces text-xl font-bold leading-tight tracking-tight text-foreground sm:text-2xl">
              Literatura e Instrumentos Padronizados
            </h1>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground sm:text-sm">
              Biblioteca de apoio à avaliação do neurodesenvolvimento — metadados e referência, sem reproduzir
              conteúdo proprietário.
            </p>
          </div>
        </div>

        {/* Mini-stats */}
        <div className="relative mt-5 grid grid-cols-3 gap-2 sm:max-w-md">
          {[
            { n: standardizedInstruments.length, l: "instrumentos" },
            { n: availableDomains.length, l: "domínios" },
            { n: restritos, l: "restritos a psi." },
          ].map((s) => (
            <div key={s.l} className="rounded-2xl border border-border/60 bg-card/70 px-3 py-2 text-center backdrop-blur">
              <p className="fraunces text-lg font-bold leading-none text-foreground">{s.n}</p>
              <p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">{s.l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ───────── Aviso ético fixo ───────── */}
      <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50 to-amber-50/40 p-4 dark:border-amber-900/50 dark:from-amber-950/20 dark:to-transparent sm:p-5">
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div className="space-y-2 text-xs leading-relaxed text-amber-900/90 dark:text-amber-100/90">
            <p>
              Instrumentos padronizados usados como <strong>apoio</strong> à avaliação. A inclusão aqui{" "}
              <strong>não autoriza</strong> aplicação fora das normas legais, éticas e editoriais.
            </p>
            <p>
              Testes psicológicos restritos devem ser aplicados, corrigidos e interpretados por{" "}
              <strong>psicóloga(o) habilitada(o)</strong>, com consulta ao SATEPSI e material original licenciado
              (Resolução CFP nº 31/2022). O NeuroPed <strong>não reproduz</strong> itens, pranchas, crivos ou tabelas
              normativas — apoia o raciocínio clínico, nunca diagnóstico automático.
            </p>
          </div>
        </div>
      </div>

      {/* ───────── Busca ───────── */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar instrumento, finalidade ou domínio…"
          className="h-11 rounded-2xl pl-10 shadow-sm"
          aria-label="Buscar instrumento"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            aria-label="Limpar busca"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* ───────── Filtros por domínio ───────── */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setDomain("todos")}
          className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition ${
            domain === "todos"
              ? "border-primary bg-primary text-primary-foreground shadow-sm"
              : "border-border bg-background hover:border-primary/40 hover:bg-muted/50"
          }`}
        >
          Todos
        </button>
        {availableDomains.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDomain(d)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-bold transition ${
              domain === d
                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                : "border-border bg-background hover:border-primary/40 hover:bg-muted/50"
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${DOMAIN_DOT[d]} ${domain === d ? "ring-2 ring-white/60" : ""}`} />
            {DOMAIN_LABEL[d]}
          </button>
        ))}
      </div>

      {/* Contagem */}
      <p className="text-xs font-medium text-muted-foreground">
        {filtered.length} instrumento{filtered.length === 1 ? "" : "s"}
        {domain !== "todos" ? ` · ${DOMAIN_LABEL[domain]}` : ""}
      </p>

      {/* ───────── Grade ───────── */}
      {filtered.length === 0 ? (
        <Card className="rounded-3xl border-dashed">
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            Nenhum instrumento para este filtro. Ajuste a busca ou o domínio.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((inst) => (
            <InstrumentCard key={inst.id} inst={inst} />
          ))}
        </div>
      )}

      {/* ───────── Rodapé ético ───────── */}
      <div className="rounded-2xl border border-border/70 bg-muted/30 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div className="space-y-2 text-[11px] leading-relaxed text-muted-foreground">
            <p>
              <strong className="text-foreground/80">Aviso permanente:</strong> instrumentos psicológicos restritos
              devem ser aplicados e interpretados por psicóloga(o), conforme SATEPSI/CFP. Os resultados devem ser
              integrados à anamnese, à observação clínica e a relatórios escolares/familiares; aplicação e correção
              seguem sempre o manual original licenciado.
            </p>
            <p>
              <strong className="text-foreground/80">Selo de validação:</strong> &ldquo;Amplamente validado /
              Validado / Triagem&rdquo; indica o grau de <em>padronização e validação psicométrica</em> — não é um
              nível formal de evidência clínica (GRADE). Disponibilidade e edição devem ser confirmadas no catálogo
              oficial Pearson/Hogrefe.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
