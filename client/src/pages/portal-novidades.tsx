import { useMemo, useState } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Newspaper, Clock, ChevronLeft, Users } from "lucide-react";
import {
  NOVIDADES_ARTIGOS_AMPLIADOS,
  NOVIDADES_CATEGORIAS_AMPLIADAS,
  novidadesConteudoStats,
} from "@/data/novidadesConteudoAmpliado";
import type { NovidadeArtigo } from "@/data/novidadesArtigos";
import { sanitizeArticleHtml } from "@/lib/sanitizeArticleHtml";
import {
  FamilyNewsFeed,
  InstagramLatestCard,
} from "@/components/FamilyFeedNovidades";

export default function PortalNovidadesPage() {
  const [cat, setCat] = useState("todos");
  const [open, setOpen] = useState<NovidadeArtigo | null>(null);

  const filtered = useMemo(
    () =>
      cat === "todos"
        ? NOVIDADES_ARTIGOS_AMPLIADOS
        : NOVIDADES_ARTIGOS_AMPLIADOS.filter((a) => a.cat === cat),
    [cat],
  );
  const sanitizedContent = useMemo(
    () => (open ? sanitizeArticleHtml(open.content) : ""),
    [open],
  );

  if (open) {
    return (
      <div className="space-y-5 pb-12">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1"
          onClick={() => setOpen(null)}
        >
          <ChevronLeft className="w-4 h-4" /> Voltar aos artigos
        </Button>
        <article className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-3xl" aria-hidden>
              {open.emoji}
            </span>
            {open.isNew && (
              <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                Novo
              </Badge>
            )}
          </div>
          <h1 className="text-2xl font-bold leading-tight">{open.title}</h1>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{open.date}</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3 h-3" /> {open.readTime}
            </span>
          </div>
          <div
            className="novidade-prose prose prose-sm dark:prose-invert max-w-none mt-4"
            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
          />
        </article>
        <p className="text-[11px] text-muted-foreground border-t border-border pt-3">
          Conteúdo educativo — não substitui avaliação profissional. Em caso de
          dúvida, procure o neuropediatra ou psiquiatra infantil. Dr. Jadson
          Fraga · CRM-PE 25227 · RQE 17756
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/15 via-chart-2/10 to-transparent border border-border p-6">
        <div className="flex items-center gap-2 mb-2">
          <Newspaper className="w-6 h-6 text-primary" />
          <Badge variant="secondary">Portal das Famílias</Badge>
        </div>
        <h1 className="text-2xl font-bold">Saúde &amp; Desenvolvimento</h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          Biblioteca ampliada com {novidadesConteudoStats.artigosTotal} artigos
          educativos em {novidadesConteudoStats.categoriasTotal - 1} trilhas:
          neurodesenvolvimento, escola, sono, comportamento, medicação,
          terapias, segurança e rotina familiar.
        </p>
        <Link href="/portal-familia">
          <Button variant="outline" size="sm" className="mt-3 gap-1">
            <Users className="w-4 h-4" /> Portal da Família
          </Button>
        </Link>
      </div>

      <InstagramLatestCard />

      <FamilyNewsFeed />

      <div className="border-t border-border pt-5">
        <h2 className="text-base font-bold text-foreground">
          Biblioteca educativa NeuroPed
        </h2>
        <p className="text-[11px] text-muted-foreground">
          Artigos autorais validados internamente, organizados por trilha.
        </p>
      </div>

      {/* Filtros de categoria */}
      <div className="flex flex-wrap gap-1.5">
        {NOVIDADES_CATEGORIAS_AMPLIADAS.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => setCat(c.key)}
            aria-pressed={cat === c.key}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              cat === c.key
                ? "bg-primary text-primary-foreground"
                : "bg-muted/60 text-muted-foreground hover:bg-muted"
            }`}
          >
            <span className="mr-1" aria-hidden>
              {c.emoji}
            </span>
            {c.label}
          </button>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        {filtered.length} artigo{filtered.length !== 1 ? "s" : ""}
      </p>

      <div className="grid sm:grid-cols-2 gap-3">
        {filtered.map((a) => (
          <button
            key={a.id}
            type="button"
            aria-label={`Abrir artigo: ${a.title}`}
            className="h-full rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            onClick={() => {
              setOpen(a);
              window.scrollTo({ top: 0 });
            }}
          >
            <Card className="h-full cursor-pointer transition-colors hover:border-primary/40">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl" aria-hidden>
                    {a.emoji}
                  </span>
                  {a.isNew && (
                    <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                      Novo
                    </Badge>
                  )}
                </div>
                <h2 className="text-sm font-bold leading-tight">{a.title}</h2>
                <p className="text-xs text-muted-foreground line-clamp-3">
                  {a.summary}
                </p>
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground pt-1">
                  <span>{a.date}</span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {a.readTime}
                  </span>
                </div>
              </CardContent>
            </Card>
          </button>
        ))}
      </div>
    </div>
  );
}
