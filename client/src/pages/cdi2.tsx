import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CloudRain, ExternalLink, ShieldCheck, Sparkles } from "lucide-react";
import { ScaleReference } from "@/components/ScaleReference";

/**
 * CDI-2 — ficha técnica honesta (instrumento comercial, MHS).
 *
 * A aplicação anterior desta rota apresentava cada item como três frases
 * concatenadas com opções genéricas 0/1/2, o que não é fiel ao formato real
 * do CDI-2 (escolha de UMA frase por item) nem coberto por licença de uso.
 * Seguindo a política de verdade clínica do NeuroPed (issue 629 do GitHub), a rota
 * passou a ser uma ficha técnica: informa o instrumento, orienta a aquisição
 * licenciada e indica alternativas livres implementadas no app.
 */
export default function Cdi2Page() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-sm">
          <CloudRain className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold">CDI-2 — Ficha técnica</h1>
          <p className="text-xs text-muted-foreground">
            Children&apos;s Depression Inventory 2 · Kovacs M, 2011 (MHS)
          </p>
        </div>
        <Badge variant="outline" className="ml-auto shrink-0">
          Instrumento licenciado
        </Badge>
      </div>

      <Card className="border-card-border">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
              <p>
                <strong className="text-foreground">
                  Por que o CDI-2 não é aplicável dentro do app:
                </strong>{" "}
                o CDI-2 é um instrumento comercial da Multi-Health Systems. Os
                itens oficiais (28 grupos de três frases, com escolha de uma
                frase por item) e as normas de T-score exigem aquisição
                licenciada. Uma reprodução aproximada não seria fiel ao
                instrumento nem legalmente adequada — por isso esta rota é uma
                ficha técnica, não uma aplicação.
              </p>
              <p>
                Se você possui o material licenciado, aplique na versão
                impressa/plataforma oficial e registre o resultado no
                prontuário do paciente normalmente.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-card-border">
        <CardContent className="p-6 space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            Alternativas livres implementadas no NeuroPed
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Link href="/phqa" className="group rounded-2xl border border-border bg-background p-4 transition hover:border-primary/50 hover:bg-primary/5">
              <p className="text-sm font-bold text-foreground group-hover:text-primary">
                PHQ-A
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Triagem de depressão em adolescentes (11–18 anos), 9 itens,
                licença livre, com escore e sentinela de ideação suicida.
              </p>
            </Link>
            <Link href="/generic-scale/smfq" className="group rounded-2xl border border-border bg-background p-4 transition hover:border-primary/50 hover:bg-primary/5">
              <p className="text-sm font-bold text-foreground group-hover:text-primary">
                SMFQ
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Humor na criança escolar (5–12 anos), 13 itens breves,
                autorrelato, licença livre.
              </p>
            </Link>
          </div>
          <Button asChild variant="outline" className="w-full gap-2">
            <Link href="/filtro">
              <ExternalLink className="h-4 w-4" />
              Ver mais opções no Filtro Clínico
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Card className="border-card-border">
        <CardContent className="p-6 space-y-2">
          <h2 className="text-sm font-semibold text-foreground">
            Ficha técnica resumida
          </h2>
          <ul className="list-disc space-y-1 pl-5 text-xs leading-relaxed text-muted-foreground">
            <li>Faixa etária: 7 a 17 anos; autorrelato (versão completa com 28 itens e breve com 12).</li>
            <li>Formato oficial: cada item apresenta três frases; a criança escolhe a que melhor a descreve nas últimas duas semanas.</li>
            <li>Escore: T-score normatizado; T ≥ 65 clinicamente relevante.</li>
            <li>Licença: comercial (Multi-Health Systems); aquisição obrigatória para aplicação.</li>
            <li>Validação brasileira: parcial (adaptações publicadas do CDI original).</li>
          </ul>
        </CardContent>
      </Card>
      <ScaleReference scaleId="cdi2" />
    </div>
  );
}
