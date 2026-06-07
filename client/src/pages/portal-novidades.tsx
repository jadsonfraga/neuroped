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

const ARTICLE_BREAK_RE = new RegExp("<\\s*br\\s*\\/?>|<\\s*\\/\\s*(p|li|h2|h3|h4|div)\\s*>", "gi");
const ARTICLE_TAG_RE = new RegExp("<[^>]+>", "g");

function articleHtmlToParagraphs(html: string): string[] {
  return html
    .replace(ARTICLE_BREAK_RE, "\n")
    .replace(ARTICLE_TAG_RE, "")
    .split(/\n+/)
    .map((part) => part.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

export default function PortalNovidadesPage() {
  const [cat, setCat] = useState("todos");
  const [open, setOpen] = useState<NovidadeArtigo | null>(null);

  const filtered = useMemo(
    () => (cat === "todos" ? NOVIDADES_ARTIGOS_AMPLIADOS : NOVIDADES_ARTIGOS_AMPLIADOS.filter((a) => a.cat === cat)),
    [cat],
  );

  const safeOpenParagraphs = useMemo(
    () => (open ? articleHtmlToParagraphs(open.content) : []),
    [open],
  );

  if (open) {
    return (
      <div className="space-y-5 pb-12">
        <Button variant="ghost" size="sm" className="gap-1" onClick={() => setOpen(null)}>
          <ChevronLeft className="w-4 h-4" /> Voltar aos artigos
        </Button>
        <article className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-3xl" aria-hidden>{open.emoji}</span>
            {open.isNew && <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">Novo</Badge>}
          </div>
          <h1 className="text-2xl font-black leading-tight">{open.title}</h1>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{open.date}</span>
            <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" /> {open.readTime}</span>
          </div>
          <div className="novidade-prose prose prose-sm dark:prose-invert max-w-none mt-4 space-y-3">
            {safeOpenParagraphs.map((paragraph, index) => (
              <p key={`${open.id}-${index}`} className="text-sm leading-relaxed text-foreground/90">
                {paragraph}
              </p>
            ))}
          </div>
        </article>
        <p className="text-[11px] text-muted-foreground border-t border-border pt-3">
          Conteúdo educativo — não substitui avaliação profissional. Em caso de dúvida, procure
          o neuropediatra ou psiquiatra infantil. Dr. Jadson Fraga · CRM-PE 25227 · RQE 17756
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
        <h1 className="text-2xl font-black">Saúde &amp; Desenvolvimento</h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          Biblioteca ampliada com {novidadesConteudoStats.artigosTotal} artigos educativos em {novidadesConteudoStats.categoriasTotal - 1} trilhas: neurodesenvolvimento, escola, sono, comportamento, medicação, terapias, segurança e rotina familiar.
        </p>
        <Link href="/portal-familia">
          <Button variant="outline" size="sm" className="mt-3 gap-1">
            <Users className="w-4 h-4" /> Portal da Família
          </Button>
        </Link>
      </div>

      {/* Filtros de categoria */}
      <div className="flex flex-wrap gap-1.5">
        {NOVIDADES_CATEGORIAS_AMPLIADAS.map((c) => (
          <button
            key={c.key}
            onClick={() => setCat(c.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              cat === c.key ? "bg-primary text-primary-foreground" : "bg-muted/60 text-muted-foreground hover:bg-muted"
            }`}
          >
            <span className="mr-1" aria-hidden>{c.emoji}</span>{c.label}
          </button>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        {filtered.length} artigo{filtered.length !== 1 ? "s" : ""}
      </p>

      <div className="grid sm:grid-cols-2 gap-3">
        {filtered.map((a) => (
          <Card
            key={a.id}
            className="cursor-pointer hover:border-primary/40 transition-colors"
            onClick={() => { setOpen(a); window.scrollTo({ top: 0 }); }}
          >
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl" aria-hidden>{a.emoji}</span>
                {a.isNew && <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">Novo</Badge>}
              </div>
              <h2 className="text-sm font-bold leading-tight">{a.title}</h2>
              <p className="text-xs text-muted-foreground line-clamp-3">{a.summary}</p>
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground pt-1">
                <span>{a.date}</span>
                <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" /> {a.readTime}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
