import { useState } from "react";
import { Link } from "wouter";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  Clock,
  Copy,
  FileText,
  Layers3,
  ShieldCheck,
  Target,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHero } from "@/components/PageHero";
import { allScalesComFichas } from "@/data/scaleFilter";
import {
  formatScaleAgeRange as formatCanonicalScaleAgeRange,
  scaleLicenseLabel,
  scalePriorityLabel,
  scaleRespondentsLabel,
} from "@/lib/scalePresentation";

/**
 * Export legado preservado para consumidores e testes externos. A decisão de
 * exibir meses na primeira infância permanece explícita aqui, enquanto toda a
 * aritmética vive na implementação canônica compartilhada.
 */
export function formatScaleAgeRange(
  minMonths: number,
  maxMonths: number,
): string {
  if (maxMonths < 24) {
    return formatCanonicalScaleAgeRange(minMonths, maxMonths);
  }
  return formatCanonicalScaleAgeRange(minMonths, maxMonths);
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
 * precisão em meses; limites decimais do catálogo nunca são arredondados para a
 * idade seguinte.
 */
export function ScaleFichaPage({ scaleId }: { scaleId: string }) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "success" | "error">(
    "idle",
  );
  const scale = allScalesComFichas.find((s) => s.id === scaleId);

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
      value: scaleRespondentsLabel(scale.respondente),
    },
    {
      icon: Target,
      label: "Finalidade",
      value: scalePriorityLabel(scale.prioridade),
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
        className="inline-flex min-h-10 items-center gap-1.5 rounded-xl px-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Voltar ao Filtro
      </Link>

      <PageHero
        icon={BookOpen}
        eyebrow="biblioteca clínica · ficha técnica"
        title={scale.name}
        subtitle={scale.fullName !== scale.name ? scale.fullName : undefined}
        gradient="from-violet-600 via-indigo-600 to-blue-600"
      >
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{scalePriorityLabel(scale.prioridade)}</Badge>
          <Badge variant="outline">
            {formatScaleAgeRange(scale.ageMin, scale.ageMax)}
          </Badge>
          <Badge variant="outline">{scaleLicenseLabel(scale.licencaUso)}</Badge>
        </div>
      </PageHero>

      <section
        className="grid grid-cols-1 gap-2.5 min-[420px]:grid-cols-2 lg:grid-cols-4"
        aria-label="Metadados do instrumento"
      >
        {infos.map((info) => (
          <Card
            key={info.label}
            className="h-full rounded-2xl border-border/70 bg-card/80 shadow-sm transition-shadow hover:shadow-md"
          >
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
        <Card className="overflow-hidden rounded-2xl border-border/70 bg-card/90">
          <div className="h-1 bg-gradient-to-r from-primary via-chart-2 to-chart-3" />
          <CardContent className="p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-black text-foreground">O que avalia</h2>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-9 gap-1.5 text-xs"
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

      <div className="grid gap-3 lg:grid-cols-2">
        {scale.scoringCutoff && (
          <Card className="rounded-2xl border-primary/20 bg-gradient-to-br from-primary/[0.06] to-chart-2/[0.04]">
            <CardContent className="p-5">
              <h2 className="mb-2 flex items-center gap-1.5 text-sm font-black text-foreground">
                <Target className="h-4 w-4 text-primary" aria-hidden="true" />
                Interpretação documentada
              </h2>
              <p className="text-sm leading-relaxed text-foreground/90">
                {scale.scoringCutoff}
              </p>
            </CardContent>
          </Card>
        )}

        <Card className="rounded-2xl border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.06] to-teal-500/[0.04]">
          <CardContent className="p-5">
            <h2 className="mb-2 flex items-center gap-1.5 text-sm font-black text-foreground">
              <ShieldCheck
                className="h-4 w-4 text-emerald-600"
                aria-hidden="true"
              />
              Uso e licença
            </h2>
            <p className="text-sm font-semibold text-foreground">
              {scaleLicenseLabel(scale.licencaUso)}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              A ficha organiza metadados e referência. Itens oficiais, normas e
              escore devem respeitar a licença e a fonte original.
            </p>
          </CardContent>
        </Card>
      </div>

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
                className="inline-flex min-h-10 items-center gap-1 rounded-xl px-2 text-xs font-bold text-primary underline underline-offset-2 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Estudo no PubMed ({pm.pmid})
              </a>
            )}
          </CardContent>
        </Card>
      )}

      {(!scale.scoringCutoff || !scale.validacaoBrasil || !scale.fonte) && (
        <div
          className="rounded-2xl border border-amber-300/60 bg-amber-50/70 p-4 text-xs leading-relaxed text-amber-900 dark:border-amber-800/50 dark:bg-amber-950/20 dark:text-amber-100"
          role="note"
        >
          <strong>Metadados ainda não documentados nesta base:</strong>{" "}
          {[
            !scale.scoringCutoff && "ponto de corte/interpretação",
            !scale.validacaoBrasil && "validação brasileira",
            !scale.fonte && "fonte/referência",
          ]
            .filter(Boolean)
            .join(" · ")}
          . A ausência do campo não deve ser interpretada como ausência de
          evidência; confirme na publicação ou manual original.
        </div>
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
