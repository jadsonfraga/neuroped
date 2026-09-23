import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Images, ShieldCheck } from "lucide-react";

const AGE_BANDS = [
  "12–23 meses",
  "24–35 meses",
  "3 anos",
  "4 anos",
  "5–6 anos",
  "7–9 anos",
  "10–12 anos",
  "13–17 anos",
] as const;

const CATEGORIES = [
  "Cores",
  "Meios de transporte",
  "Frutas",
  "Animais",
  "Conceitos opostos",
] as const;

export default function TesteReconhecimentoVisualPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <section className="rounded-[28px] border border-primary/15 bg-gradient-to-br from-primary/[0.08] via-background to-cyan-50/60 p-5 shadow-sm dark:to-cyan-950/10 sm:p-7">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="gap-1.5">
            <Images className="h-3.5 w-3.5" />
            Avaliação direta
          </Badge>
          <Badge variant="outline">Ferramenta autoral complementar</Badge>
        </div>
        <h1 className="mt-4 text-2xl font-black tracking-tight sm:text-3xl">
          Teste de Reconhecimento Visual
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Acesso separado da Sonda Dez, organizado por faixa etária. O banco de figuras
          está em curadoria clínica e visual para evitar estímulos ambíguos ou
          inadequados. Esta tela não produz escore, percentil, idade equivalente ou
          interpretação diagnóstica.
        </p>
      </section>

      <Card className="rounded-[24px]">
        <CardHeader>
          <CardTitle className="text-lg">Faixas etárias</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {AGE_BANDS.map((band) => (
              <div
                key={band}
                className="rounded-2xl border border-border/70 bg-muted/25 px-4 py-3 text-sm font-bold"
              >
                {band}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-[24px]">
        <CardHeader>
          <CardTitle className="text-lg">Categorias previstas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORIES.map((category) => (
              <div
                key={category}
                className="rounded-2xl border border-border/70 bg-background px-4 py-3 text-sm font-semibold"
              >
                {category}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-sm leading-relaxed text-amber-950 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-100">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
        <p>
          <strong>Aplicação ainda não liberada:</strong> a biblioteca só será ativada
          quando as figuras por faixa etária passarem pela curadoria de reconhecimento,
          consistência visual e testes de interface em tablet. Até lá, esta aba funciona
          apenas como ponto de acesso seguro e não registra desempenho infantil.
        </p>
      </div>
    </div>
  );
}
