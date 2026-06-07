import { Pill } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default function EfeitosColateraisPage() {
  return (
    <div className="page-enter space-y-5 pb-8">
      <header className="rounded-[2rem] border border-border/70 bg-card/90 p-5 shadow-sm backdrop-blur">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-chart-2 text-white shadow-md">
            <Pill className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <Badge className="mb-2 rounded-full bg-primary/10 text-primary hover:bg-primary/10">relato familiar</Badge>
            <h1 className="text-2xl font-black tracking-tight text-foreground">Checklist de efeitos colaterais</h1>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">Rota reservada para coleta estruturada de relatos antes da consulta.</p>
          </div>
        </div>
      </header>

      <Card>
        <CardContent className="space-y-3 p-4">
          <p className="text-sm text-muted-foreground">Implementar aqui o formulário local-first de relatos familiares, mantendo linguagem prudente e sem orientar ajuste de conduta.</p>
        </CardContent>
      </Card>
    </div>
  );
}
