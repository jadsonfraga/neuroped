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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHero } from "@/components/PageHero";
import { allScalesComFichas } from "@/data/scaleFilter";

function anos(min: number, max: number): string {
  const a = Math.floor(min / 12);
  const b = Math.floor(max / 12);
  return a === b ? `${a} anos` : `${a}–${b} anos`;
}

function pubmedRef(
  pubmedId?: string | null,
): { pmid: string; href: string } | null {
  const digits = pubmedId?.match(/\d{4,}/)?.[0];
  return digits
    ? { pmid: digits, href: `https://pubmed.ncbi.nlm.nih.gov/${digits}/` }
    : null;
}

/**
 * Ficha técnica on-brand de um instrumento — substitui o antigo template
 * escuro com conteúdo placeholder ("✅ Indicação 1", "Escala A"…). Mostra os
 * dados REAIS do catálogo (faixa etária, tempo, respondente, descrição, ponto
 * de corte, fonte, validação BR e link PubMed). Sem inventar conteúdo clínico.
 */
export function ScaleFichaPage({ scaleId }: { scaleId: string }) {
  const [copied, setCopied] = useState(false);
  const scale = allScalesComFichas.find((s) => s.id === scaleId);

  if (!scale) {
    return (
      <div className="space-y-5 pb-8">
        <PageHero
          icon={BookOpen}
          eyebrow="ficha técnica"
          title="Instrumento"
          subtitle="Ficha não encontrada no catálogo."
        />
        <Link href="/filtro">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Voltar ao Filtro
          </Button>
        </Link>
      </div>
    );
  }

  const pm = pubmedRef(scale.pubmedId);
  const infos = [
    { icon: Clock, label: "Tempo", value: scale.tempo || "—" },
    {
      icon: Users,
      label: "Faixa etária",
      value: anos(scale.ageMin, scale.ageMax),
    },
    {
      icon: Users,
      label: "Respondente",
      value: scale.respondente.join(", ") || "—",
    },
    { icon: Target, label: "Prioridade", value: scale.prioridade },
  ];

  return (
    <div className="space-y-5 pb-8">
      <Link
        href="/filtro"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Voltar ao Filtro
      </Link>

      <PageHero
        icon={BookOpen}
        eyebrow="ficha técnica"
        title={scale.name}
        subtitle={scale.fullName !== scale.name ? scale.fullName : undefined}
        gradient="from-violet-600 to-blue-600"
      />

      {/* Metadados em cards */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {infos.map((info) => (
          <Card key={info.label} className="border-border/70">
            <CardContent className="p-3.5">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <info.icon className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="text-[10px] font-semibold uppercase tracking-wide">
                  {info.label}
                </span>
              </div>
              <p className="mt-1 text-sm font-bold capitalize text-foreground">
                {info.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Descrição */}
      {scale.description && (
        <Card>
          <CardContent className="p-5">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h2 className="text-sm font-black text-foreground">Descrição</h2>
              <Button
                size="sm"
                variant="outline"
                className="h-7 gap-1.5 text-xs"
                onClick={() => {
                  navigator.clipboard?.writeText(scale.description);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}{" "}
                {copied ? "Copiado!" : "Copiar"}
              </Button>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {scale.description}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Ponto de corte / interpretação */}
      {scale.scoringCutoff && (
        <Card className="border-primary/20 bg-primary/[0.04]">
          <CardContent className="p-5">
            <h2 className="mb-1.5 flex items-center gap-1.5 text-sm font-black text-foreground">
              <Target className="h-4 w-4 text-primary" /> Interpretação do
              escore
            </h2>
            <p className="text-sm leading-relaxed text-foreground/90">
              {scale.scoringCutoff}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Evidência / proveniência */}
      {(scale.fonte || scale.validacaoBrasil || pm) && (
        <Card className="border-border/70">
          <CardContent className="p-5 space-y-2">
            <h2 className="flex items-center gap-1.5 text-sm font-black text-foreground">
              <FileText className="h-4 w-4 text-primary" /> Evidência
            </h2>
            {scale.validacaoBrasil && (
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">
                  🇧🇷 Validação Brasil:
                </span>{" "}
                {scale.validacaoBrasil}
              </p>
            )}
            {scale.fonte && (
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">Fonte:</span>{" "}
                {scale.fonte}
              </p>
            )}
            {pm && (
              <a
                href={pm.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-primary underline underline-offset-2 hover:opacity-80"
              >
                📄 Estudo no PubMed ({pm.pmid})
              </a>
            )}
          </CardContent>
        </Card>
      )}

      {/* Ações */}
      <div className="flex flex-wrap gap-2">
        <Link href="/filtro">
          <Button className="gap-2">
            Encontrar no Filtro Clínico <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => window.print()}
        >
          <FileText className="h-4 w-4" /> Imprimir ficha
        </Button>
      </div>
    </div>
  );
}
