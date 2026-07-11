/**
 * NeuroPed Cognitive Lab — hub das tarefas cognitivas computadorizadas.
 * Catálogo V1 + histórico local de sessões (offline-first, só neste aparelho).
 */
import { Link } from "wouter";
import { FlaskConical, History, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cognitiveTasks } from "@/features/cognitive-lab/tasks";
import { deleteSession, exportSessionCsv, exportSessionJson, listSessions } from "@/features/cognitive-lab/storage";
import { useState } from "react";

export default function CognitiveLabPage() {
  const [sessions, setSessions] = useState(() => listSessions());

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4">
      <header className="space-y-1">
        <h1 className="flex items-center gap-2 text-2xl font-black tracking-tight">
          <FlaskConical className="h-6 w-6 text-primary" aria-hidden="true" /> Cognitive Lab
        </h1>
        <p className="text-sm text-muted-foreground">
          Tarefas cognitivas computadorizadas com cronometria em milissegundos: atenção, inibição,
          memória de trabalho e velocidade. Relatório <strong>descritivo</strong> — não são testes
          normatizados e não estabelecem diagnóstico.
        </p>
      </header>

      <section aria-label="Tarefas disponíveis" className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {cognitiveTasks.map((t) => (
          <Link key={t.id} href={`/cognitive-lab/${t.id}`} className="group">
            <Card className="h-full transition hover:border-primary/50">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-start gap-2 text-base">
                  <span className="text-2xl" aria-hidden="true">{t.emoji}</span>
                  <span className="min-w-0">
                    {t.name}
                    <span className="block text-[11px] font-semibold text-muted-foreground">{t.domain}</span>
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-xs leading-relaxed text-muted-foreground">{t.description}</p>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="secondary" className="text-[10px]">{t.ageLabel}</Badge>
                  <Badge variant="secondary" className="text-[10px]">{t.durationLabel}</Badge>
                  <Badge variant="outline" className="text-[10px]">{t.blocks}×{t.trialsPerBlock} ensaios</Badge>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </section>

      <section aria-label="Histórico de sessões" className="space-y-2">
        <h2 className="flex items-center gap-1.5 text-sm font-bold uppercase tracking-wider text-muted-foreground">
          <History className="h-4 w-4" aria-hidden="true" /> Sessões neste aparelho ({sessions.length})
        </h2>
        {sessions.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
            Nenhuma sessão ainda — escolha uma tarefa acima para começar. 🧪
          </p>
        ) : (
          <div className="space-y-1.5">
            {sessions.slice(0, 20).map((s) => (
              <div key={s.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs">
                <span className="font-bold">{s.taskName}</span>
                <span className="text-muted-foreground">{new Date(s.startedAtIso).toLocaleString("pt-BR")}</span>
                <Badge variant={s.validity.valid ? "secondary" : "destructive"} className="text-[10px]">
                  {s.validity.valid ? "válida" : "checar validade"}
                </Badge>
                <span className="tabular-nums text-muted-foreground">
                  TR {s.stats.meanRt ?? "—"}ms · acurácia {(s.stats.accuracy * 100).toFixed(0)}%
                </span>
                <span className="ml-auto flex gap-1">
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-[10px]" onClick={() => exportSessionCsv(s)}>CSV</Button>
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-[10px]" onClick={() => exportSessionJson(s)}>JSON</Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-destructive"
                    aria-label="Excluir sessão"
                    onClick={() => { deleteSession(s.id); setSessions(listSessions()); }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </span>
              </div>
            ))}
          </div>
        )}
        <p className="text-[10px] text-muted-foreground">
          LGPD: os resultados ficam somente neste dispositivo (armazenamento local) e podem ser
          exportados/excluídos aqui. Recomenda-se identificar sessões por iniciais, nunca nome completo.
        </p>
      </section>
    </div>
  );
}
