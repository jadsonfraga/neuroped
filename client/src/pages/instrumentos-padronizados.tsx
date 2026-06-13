import { useMemo, useState } from "react";
import { BookOpen, Search, ShieldAlert, Lock, Copy, Check, Quote, X } from "lucide-react";
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

const EVIDENCE_STYLE: Record<StandardizedInstrument["evidenceLevel"], string> = {
  amplo: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
  validado: "bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300",
  triagem: "bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300",
};

const USE_STYLE: Record<StandardizedInstrument["neuropediatricUse"], string> = {
  integra_relatorio:
    "bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300 border-sky-300 dark:border-sky-800",
  triagem_nao_restrita:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800",
  requer_psicologo:
    "bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-300 border-amber-300 dark:border-amber-800",
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

  return (
    <Card
      className={`h-full border-2 transition ${
        inst.restricted
          ? "border-amber-300/70 dark:border-amber-800/60"
          : "border-border/70"
      }`}
    >
      <CardContent className="flex h-full flex-col gap-3 p-4 sm:p-5">
        {/* Cabeçalho */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-base font-black leading-tight text-foreground">{inst.name}</h3>
            <p className="text-xs leading-snug text-muted-foreground">{inst.fullName}</p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <Badge variant="outline" className="text-[10px] font-bold">
              {inst.publisher}
            </Badge>
            <span
              className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${EVIDENCE_STYLE[inst.evidenceLevel]}`}
              title="Grau de padronização/validação (não é nível formal de evidência clínica/GRADE)."
            >
              {EVIDENCE_LABEL[inst.evidenceLevel]}
            </span>
          </div>
        </div>

        {/* Alerta de restrição profissional */}
        {inst.restricted && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-[11px] font-bold leading-snug text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>Restrito a psicóloga(o) — aplicação/interpretação conforme SATEPSI/CFP.</span>
          </div>
        )}

        {/* Domínios */}
        <div className="flex flex-wrap gap-1.5">
          {inst.domains.map((d) => (
            <Badge key={d} variant="secondary" className="text-[10px]">
              {DOMAIN_LABEL[d]}
            </Badge>
          ))}
        </div>

        {/* Metadados */}
        <dl className="space-y-1.5 text-xs">
          <div>
            <dt className="font-semibold text-foreground/70">Faixa / observação</dt>
            <dd className="text-muted-foreground">{inst.ageRange}</dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground/70">Indicação clínica</dt>
            <dd className="text-muted-foreground">{inst.clinicalIndication}</dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground/70">Forma geral de uso</dt>
            <dd className="text-muted-foreground">{inst.generalUse}</dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground/70">Restrição profissional</dt>
            <dd className="text-muted-foreground">{inst.professionalRestriction}</dd>
          </div>
        </dl>

        {/* Uso pelo neuropediatra */}
        <div
          className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-bold leading-snug ${USE_STYLE[inst.neuropediatricUse]}`}
        >
          <span className="opacity-70">Uso pelo neuropediatra:</span> {NEUROPED_USE_LABEL[inst.neuropediatricUse]}
        </div>

        {/* Referência */}
        <p className="text-[11px] italic text-muted-foreground">{inst.reference}</p>

        {/* Como citar no laudo */}
        <div className="mt-auto pt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full gap-2 text-xs"
            onClick={() => setShowCitation((v) => !v)}
          >
            <Quote className="h-3.5 w-3.5" />
            {showCitation ? "Ocultar citação" : "Como citar no laudo"}
          </Button>
          {showCitation && (
            <div className="mt-2 rounded-lg border border-border bg-muted/40 p-2.5">
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

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-sm">
          <BookOpen className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0">
          <h1 className="text-lg font-bold leading-tight">Literatura e Instrumentos Padronizados</h1>
          <p className="text-xs text-muted-foreground">Pearson / Hogrefe — biblioteca de apoio à avaliação</p>
        </div>
      </div>

      {/* Aviso ético FIXO */}
      <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-800/50 dark:bg-amber-950/20">
        <div className="flex items-start gap-2.5">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-400" />
          <div className="space-y-2 text-xs leading-relaxed text-amber-900 dark:text-amber-100">
            <p>
              Esta seção apresenta instrumentos padronizados e literatura técnica usados como
              <strong> apoio</strong> à avaliação do neurodesenvolvimento, cognição, comportamento adaptativo,
              responsividade social, processamento sensorial, atenção e desenvolvimento infantil.
            </p>
            <p>
              A inclusão de um instrumento nesta biblioteca <strong>não autoriza</strong> sua aplicação fora das
              normas legais, éticas e editoriais. Testes psicológicos restritos devem ser aplicados, corrigidos e
              interpretados por <strong>psicóloga(o) habilitada(o)</strong>, com consulta ao SATEPSI e uso de
              material original licenciado (Resolução CFP nº 31/2022).
            </p>
            <p>
              O NeuroPed EDJ <strong>não reproduz</strong> itens, pranchas, folhas de resposta, tabelas normativas,
              crivos ou conteúdo protegido. O objetivo é orientar a escolha clínica, integrar resultados já obtidos e
              apoiar a construção de hipóteses de forma ética e documentada — nunca diagnóstico automático.
            </p>
          </div>
        </div>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar instrumento, finalidade ou domínio…"
          className="pl-9"
          aria-label="Buscar instrumento"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            aria-label="Limpar busca"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filtros por domínio */}
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => setDomain("todos")}
          className={`rounded-full border px-3 py-1 text-xs font-bold transition ${
            domain === "todos"
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-background hover:border-primary/40"
          }`}
        >
          Todos
        </button>
        {availableDomains.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDomain(d)}
            className={`rounded-full border px-3 py-1 text-xs font-bold transition ${
              domain === d
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background hover:border-primary/40"
            }`}
          >
            {DOMAIN_LABEL[d]}
          </button>
        ))}
      </div>

      {/* Resultado */}
      <p className="text-xs text-muted-foreground">
        {filtered.length} instrumento{filtered.length === 1 ? "" : "s"}
        {domain !== "todos" ? ` · ${DOMAIN_LABEL[domain]}` : ""}
      </p>

      {filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            Nenhum instrumento para este filtro. Ajuste a busca ou o domínio.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((inst) => (
            <InstrumentCard key={inst.id} inst={inst} />
          ))}
        </div>
      )}

      {/* Rodapé ético */}
      <div className="rounded-xl border border-border/70 bg-muted/30 p-4">
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          <strong className="text-foreground/80">Aviso permanente:</strong> instrumentos psicológicos restritos devem
          ser aplicados e interpretados por psicóloga(o), conforme SATEPSI/CFP. O NeuroPed organiza metadados e
          referências para <em>apoiar o raciocínio clínico</em> e <em>auxiliar na triagem</em> — os resultados devem ser
          integrados à anamnese, à observação clínica e a relatórios escolares/familiares. Aplicação e correção seguem
          sempre o manual original licenciado.
        </p>
        <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
          <strong className="text-foreground/80">Sobre o selo de validação:</strong> &ldquo;Amplamente validado / Validado /
          Triagem&rdquo; indica o grau de <em>padronização e validação psicométrica</em> do instrumento — não é um nível
          formal de evidência clínica (GRADE). Disponibilidade e edição devem ser confirmadas no catálogo oficial
          Pearson/Hogrefe.
        </p>
      </div>
    </div>
  );
}
