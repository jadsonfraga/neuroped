import { useState } from "react";
import { Link } from "wouter";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Clock,
  Users,
  Target,
  Copy,
  Check,
  FileText,
  AlertCircle,
  Layers3,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHero } from "@/components/PageHero";
import { allScalesComFichas } from "@/data/scaleFilter";

const respondentLabels: Record<string, string> = {
  pais: "Pais/cuidadores",
  clinico: "Clínico",
  professor: "Professor/escola",
  autoaplicavel: "Autorrelato",
  crianca: "Criança/adolescente",
  teste_direto_crianca: "Teste direto com a criança",
};

const priorityLabels: Record<string, string> = {
  triagem: "Triagem",
  diagnostico: "Apoio diagnóstico",
  monitorizacao: "Monitorização",
  seguimento: "Seguimento",
  psicoeducacao: "Psicoeducação",
};

function formatAgePoint(months: number): string {
  if (months === 0) return "nascimento";
  if (months < 24) return `${months} ${months === 1 ? "mês" : "meses"}`;
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  if (remainingMonths === 0) return `${years} ${years === 1 ? "ano" : "anos"}`;
  return `${years}a ${remainingMonths}m`;
}

export function formatScaleAgeRange(minMonths: number, maxMonths: number): string {
  if (minMonths === maxMonths) return formatAgePoint(minMonths);
  if (maxMonths < 24) return `${minMonths}–${maxMonths} meses`;
  if (minMonths >= 24 && minMonths % 12 === 0 && maxMonths % 12 === 0) {
    return `${minMonths / 12}–${maxMonths / 12} anos`;
  }
  return `${formatAgePoint(minMonths)} – ${formatAgePoint(maxMonths)}`;
}

function pubmedRef(
  pubmedId?: string | null,
): { pmid: string; href: string } | null {
  const digits = pubmedId?.match(/\d{4,}/)?.[0];
  return digits
    ? { pmid: digits, href: `https://pubmed.ncbi.nlm.nih.gov/${digits}/` }
    : null;
}

interface InfoCard {
  icon: LucideIcon;
  label: string;
  value: string;
}

/**
 * Ficha técnica on-brand de um instrumento.
 *
 * Mostra somente dados reais do catálogo. Faixas da primeira infância mantêm a
 * precisão em meses, sem o antigo arredondamento que podia exibir "0 anos".
 */
export function ScaleFichaPage({ scaleId }: { scaleId: string }) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "success" | "error">(
    "idle",
  );
  const scale = allScalesComFichas.find((item) => item.id === scaleId);

  if (!scale) {
    return (
      <div className="space-y-5 pb-8">
        <PageHero
          icon={BookOpen}
          eyebrow="ficha técnica"
          title="Instrumento não encontrado"
          subtitle="Esta ficha não está disponível no catálogo atual."
        />
        <Button asChild variant="outline" className="gap-2">
          <Link href="/filtro">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Voltar ao Filtro
          </Link>
        </Button>
      </div>
    );
  }

  const pm = pubmedRef(scale.pubmedId);
  const description = scale.description;
  const infos: InfoCard[] = [
    { icon: Clock, label: "Tempo", value: scale.tempo || "Não informado" },
    {
      icon: Layers3,
      label: "Faixa etária",
      value: formatScaleAgeRange(scale.ageMin, scale.ageMax),
    },
    {
      icon: Users,
      label: "Respondente",
      value:
        scale.respondente
          .map((respondent) => respondentLabels[respondent] ?? respondent)
          .join(" · ") || "Não informado",
    },
    {
      icon: Target,
      label: "Finalidade",
      value: priorityLabels[scale.prioridade] ?? scale.prioridade,
    },
  ];

  async function copyDescription() {
    setCopyStatus("idle");
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("clipboard unavailable");
      }
      await navigator.clipboard.writeText(description);
      setCopyStatus("success");
    } catch {
      setCopyStatus("error");
    }
    window.setTimeout(() => setCopyStatus("idle"), 2200);
  }

  return (
    <div className="space-y-5 pb-8" data-testid="scale-technical-sheet">
      <Link
        href="/filtro"
        className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-1 text-xs font-semibold text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Voltar ao Filtro
      </Link>

      <PageHero
        icon={BookOpen}
        eyebrow="ficha técnica"
        title={scale.name}
        subtitle={scale.fullName !== scale.name ? scale.fullName : undefined}
        gradient="from-violet-600 to-blue-600"
      />

      <section
        className="grid grid-cols-1 gap-2.5 min-[420px]:grid-cols-2 lg:grid-cols-4"
        aria-label="Metadados do instrumento"
      >
        {infos.map((info) => (
          <Card key={info.label} className="h-full rounded-2xl border-border/70">
            <CardContent className="p-4">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <info.icon className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="text-[10px] font-bold uppercase tracking-[0.1em]">
                  {info.label}
                </span>
              </div>
              <p className="mt-1.5 text-sm font-bold leading-snug text-foreground">
                {info.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </section>

      {description && (
        <Card className="rounded-2xl border-border/70">
          <CardContent className="p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-black text-foreground">Descrição</h2>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 gap-1.5 text-xs"
                onClick={() => void copyDescription()}
                aria-live="polite"
              >
                {copyStatus === "success" ? (
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                ) : copyStatus === "error" ? (
                  <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                {copyStatus === "success"
                  ? "Copiado"
                  : copyStatus === "error"
                    ? "Não foi possível copiar"
                    : "Copiar descrição"}
              </Button>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          </CardContent>
        </Card>
      )}

      {scale.scoringCutoff && (
        <Card className="rounded-2xl border-primary/20 bg-primary/[0.04]">
          <CardContent className="p-5">
            <h2 className="mb-2 flex items-center gap-1.5 text-sm font-black text-foreground">
              <Target className="h-4 w-4 text-primary" aria-hidden="true" />
              Interpretação do escore
            </h2>
            <p className="text-sm leading-relaxed text-foreground/90">
              {scale.scoringCutoff}
            </p>
          </CardContent>
        </Card>
      )}

      {(scale.fonte || scale.validacaoBrasil || pm) && (
        <Card className="rounded-2xl border-border/70">
          <CardContent className="space-y-3 p-5">
            <h2 className="flex items-center gap-1.5 text-sm font-black text-foreground">
              <FileText className="h-4 w-4 text-primary" aria-hidden="true" />
              Evidência e proveniência
            </h2>
            {scale.validacaoBrasil && (
              <p className="text-xs leading-relaxed text-muted-foreground">
                <span className="font-semibold text-foreground">
                  Validação Brasil:
                </span>{" "}
                {scale.validacaoBrasil}
              </p>
            )}
            {scale.fonte && (
              <p className="text-xs leading-relaxed text-muted-foreground">
                <span className="font-semibold text-foreground">Fonte:</span>{" "}
                {scale.fonte}
              </p>
            )}
            {pm && (
              <a
                href={pm.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-9 items-center gap-1 rounded-lg text-xs font-bold text-primary underline underline-offset-2 hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Estudo no PubMed ({pm.pmid})
              </a>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap gap-2">
        <Button asChild className="gap-2">
          <Link href="/filtro">
            Encontrar no Filtro Clínico
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
        <Button
          type="button"
          variant="outline"
          className="gap-2"
          onClick={() => window.print()}
        >
          <FileText className="h-4 w-4" aria-hidden="true" />
          Imprimir ficha
        </Button>
      </div>
    </div>
  );
}
