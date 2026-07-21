import { ArrowLeft, BookOpen, ExternalLink, Filter, ShieldAlert } from "lucide-react";
import { Link, useLocation, useParams } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getUploadedInstrumentDetail,
  uploadedFilterInstruments,
  type UploadedInstrumentKind,
} from "@/data/uploadedInstrumentCatalog";

const KIND_LABEL: Record<UploadedInstrumentKind, string> = {
  instrumento: "Instrumento clínico",
  questionario_auxiliar: "Questionário auxiliar",
  referencia_clinica: "Referência clínica",
};

const STATUS_LABEL: Record<string, string> = {
  external_only: "Aplicação externa/licenciada",
  metadata_only: "Ficha técnica — sem aplicação embutida",
  complete: "Aplicação disponível no app",
  not_implemented: "Aplicação não implementada",
};

export default function InstrumentoImportadoPage() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const detail = getUploadedInstrumentDetail(params?.id);
  const scale = uploadedFilterInstruments.find((item) => item.id === params?.id);

  if (!detail || (!scale && params?.id !== "scq-asq")) {
    return (
      <main className="mx-auto max-w-xl space-y-4 p-4 sm:p-6">
        <Card className="border-red-300 bg-red-50/80 dark:border-red-900 dark:bg-red-950/30">
          <CardContent className="space-y-4 pt-6 text-center">
            <ShieldAlert className="mx-auto h-10 w-10 text-red-600" />
            <h1 className="text-xl font-bold">Instrumento importado não encontrado</h1>
            <p className="text-sm text-muted-foreground">ID: {params?.id || "não informado"}</p>
            <Button type="button" onClick={() => navigate("/filtro")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao filtro
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const status = scale?.implementationStatus ?? "external_only";
  const age = scale ? `${scale.ageMin}–${scale.ageMax} meses` : "A partir de 4 anos";
  const respondent = scale?.respondente.join(" · ") ?? "pais/cuidadores";

  return (
    <main className="mx-auto max-w-4xl space-y-5 p-3 pb-10 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button type="button" variant="ghost" onClick={() => navigate("/filtro")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar ao filtro
        </Button>
        <Link href="/instrumentos-padronizados">
          <Button type="button" variant="outline">
            <BookOpen className="mr-2 h-4 w-4" />
            Biblioteca padronizada
          </Button>
        </Link>
      </div>

      <section className="relative overflow-hidden rounded-[1.75rem] border border-border/70 bg-gradient-to-br from-primary/12 via-card to-chart-2/8 p-5 shadow-sm sm:p-7">
        <div className="relative space-y-3">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="rounded-full">
              {KIND_LABEL[detail.kind]}
            </Badge>
            <Badge className="rounded-full bg-amber-100 text-amber-900 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-100">
              {STATUS_LABEL[status] ?? status}
            </Badge>
          </div>
          <div>
            <h1 className="font-display text-2xl font-black tracking-tight sm:text-3xl">{detail.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground sm:text-base">{detail.subtitle}</p>
          </div>
          <p className="max-w-3xl text-sm leading-relaxed text-foreground/80">{detail.summary}</p>
        </div>
      </section>

      <Card className="border-amber-300/80 bg-amber-50/80 dark:border-amber-900 dark:bg-amber-950/25">
        <CardContent className="flex items-start gap-3 pt-6 text-sm leading-relaxed text-amber-950 dark:text-amber-100">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
          <p>
            Esta ficha registra metadados clínicos e regras de seleção. Itens, âncoras, crivos, normas e algoritmos protegidos não foram reproduzidos. A inclusão no catálogo não autoriza uso fora do manual, da licença ou da habilitação profissional aplicável.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Uso pretendido</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-foreground/80">{detail.intendedUse}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Limites e cautelas</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm leading-relaxed text-foreground/80">
                {detail.limitations.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span aria-hidden="true" className="mt-1 text-amber-600">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Regras de filtragem
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-foreground/80">
                {detail.filterRules.map((item) => (
                  <li key={item} className="rounded-xl border border-border/70 bg-muted/35 px-3 py-2">
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Metadados do catálogo</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Faixa</dt>
                  <dd>{age}</dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Respondente</dt>
                  <dd>{respondent}</dd>
                </div>
                {scale?.validacaoBrasil && (
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Brasil</dt>
                    <dd>{scale.validacaoBrasil}</dd>
                  </div>
                )}
                {scale?.scoringCutoff && (
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Interpretação</dt>
                    <dd>{scale.scoringCutoff}</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Proveniência</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p>{detail.provenance}</p>
          {detail.aliases && detail.aliases.length > 0 && (
            <p>
              <strong className="text-foreground">Também encontrado como:</strong> {detail.aliases.join(" · ")}
            </p>
          )}
          {scale?.fonte && <p>{scale.fonte}</p>}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Link href="/filtro">
          <Button type="button">
            <Filter className="mr-2 h-4 w-4" />
            Refinar no filtro clínico
          </Button>
        </Link>
        <Link href="/instrumentos-padronizados">
          <Button type="button" variant="outline">
            <ExternalLink className="mr-2 h-4 w-4" />
            Ver biblioteca de instrumentos
          </Button>
        </Link>
      </div>
    </main>
  );
}
