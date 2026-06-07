import { useMemo, useState } from "react";
import { Link } from "wouter";
import { ClipboardCheck, Copy, PlayCircle, Printer, RefreshCw, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { buildPreConsultaSummary, loadPreConsultas, savePreConsultas, type PreConsultaRecord, type PreConsultaStatus } from "@/lib/preConsultaCore";

const statusLabels: Record<PreConsultaStatus, string> = {
  aguardando: "aguardando",
  respondendo: "respondendo",
  concluido: "concluído",
  "precisa-ajuda": "precisa ajuda",
  "pronto-medico": "pronto para o médico",
};

const nextStatus: PreConsultaStatus[] = ["aguardando", "respondendo", "concluido", "precisa-ajuda", "pronto-medico"];

function idade(record: PreConsultaRecord) {
  return record.idadeMeses < 24 ? `${record.idadeMeses} meses` : `${Math.floor(record.idadeMeses / 12)}a ${record.idadeMeses % 12}m`;
}

export default function RecepcaoPage() {
  const [items, setItems] = useState<PreConsultaRecord[]>(() => loadPreConsultas());
  const [selected, setSelected] = useState<PreConsultaRecord | null>(items[0] || null);

  const resumo = useMemo(() => selected ? buildPreConsultaSummary(selected) : "Nenhuma pré-consulta selecionada.", [selected]);

  function refresh() {
    const loaded = loadPreConsultas();
    setItems(loaded);
    setSelected(loaded[0] || null);
  }

  function updateStatus(record: PreConsultaRecord, status: PreConsultaStatus) {
    const updated = items.map((item) => item.id === record.id ? { ...item, status } : item);
    setItems(updated);
    savePreConsultas(updated);
    setSelected((current) => current?.id === record.id ? { ...record, status } : current);
  }

  async function copiarResumo() {
    await navigator.clipboard?.writeText(resumo);
  }

  return (
    <div className="page-enter space-y-5 pb-8">
      <header className="rounded-[2rem] border border-border/70 bg-card/90 p-5 shadow-sm backdrop-blur">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-chart-2 text-white shadow-md">
            <Users className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <Badge className="mb-2 rounded-full bg-primary/10 text-primary hover:bg-primary/10">recepção · fluxo operacional</Badge>
            <h1 className="text-2xl font-black tracking-tight text-foreground">Painel da recepção</h1>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Inicie pré-consultas, acompanhe status e entregue um resumo objetivo ao médico sem acessar áreas sensíveis.
            </p>
          </div>
        </div>
      </header>

      <section className="grid gap-3 md:grid-cols-4">
        <Card><CardContent className="p-4"><p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">total</p><p className="text-2xl font-black text-foreground">{items.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">prontos</p><p className="text-2xl font-black text-foreground">{items.filter((i) => i.status === "pronto-medico").length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">respondendo</p><p className="text-2xl font-black text-foreground">{items.filter((i) => i.status === "respondendo").length}</p></CardContent></Card>
        <Card><CardContent className="flex h-full items-center gap-2 p-4"><Button asChild className="w-full gap-2"><Link href="/pre-consulta"><PlayCircle className="h-4 w-4" />Iniciar</Link></Button></CardContent></Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Card>
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-black text-foreground">Pré-consultas salvas</p>
              <Button variant="outline" size="sm" onClick={refresh} className="gap-2"><RefreshCw className="h-4 w-4" />Atualizar</Button>
            </div>
            {items.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                Nenhuma pré-consulta salva neste dispositivo. Clique em “Iniciar”.
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((record) => (
                  <button key={record.id} type="button" onClick={() => setSelected(record)} className={`w-full rounded-2xl border p-3 text-left transition ${selected?.id === record.id ? "border-primary bg-primary/10" : "border-border bg-background hover:border-primary/40"}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-black text-foreground">{record.paciente || "Paciente sem nome"}</p>
                        <p className="text-xs text-muted-foreground">{idade(record)} · {record.queixa} · {record.respondente}</p>
                      </div>
                      <Badge variant="outline">{statusLabels[record.status]}</Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {nextStatus.map((status) => (
                        <span key={status} onClick={(event) => { event.stopPropagation(); updateStatus(record, status); }} className="rounded-full border border-border px-2 py-1 text-[10px] font-bold text-muted-foreground hover:border-primary hover:text-primary">
                          {statusLabels[status]}
                        </span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-black text-foreground"><ClipboardCheck className="h-4 w-4 text-primary" /> Resumo para o médico</div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={copiarResumo} className="gap-2"><Copy className="h-4 w-4" />Copiar</Button>
                <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-2"><Printer className="h-4 w-4" />Imprimir</Button>
              </div>
            </div>
            <pre className="max-h-[560px] overflow-auto whitespace-pre-wrap rounded-2xl bg-muted/50 p-3 text-xs leading-relaxed text-muted-foreground">{resumo}</pre>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
