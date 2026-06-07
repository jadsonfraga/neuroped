import { useMemo, useState } from "react";
import { Link } from "wouter";
import { ArrowRight, ClipboardCheck, Copy, Printer, Save, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PremiumVisualPanel } from "@/components/PremiumVisualPanel";
import { brandAssets } from "@/components/BrandAssets";
import {
  buildPreConsultaSummary,
  createPreConsultaRecord,
  loadPreConsultas,
  preConsultaQueixas,
  recommendPreConsultaScales,
  savePreConsultas,
  type PreConsultaContexto,
  type PreConsultaRecord,
  type PreConsultaRespondente,
} from "@/lib/preConsultaCore";

const contextos: Array<{ id: PreConsultaContexto; label: string }> = [
  { id: "primeira-consulta", label: "Primeira consulta" },
  { id: "retorno", label: "Retorno" },
  { id: "avaliacao-escolar", label: "Avaliação escolar" },
  { id: "ajuste-medicacao", label: "Ajuste de medicação" },
  { id: "acompanhamento", label: "Acompanhamento" },
];

const respondentes: Array<{ id: PreConsultaRespondente; label: string }> = [
  { id: "pais", label: "Pais/cuidadores" },
  { id: "adolescente", label: "Adolescente" },
  { id: "professor", label: "Professor" },
  { id: "secretaria", label: "Secretária auxiliando" },
];

function idadeMeses(anos: string, meses: string) {
  return Math.max(0, Number(anos || 0) * 12 + Number(meses || 0));
}

export default function PreConsultaPage() {
  const [paciente, setPaciente] = useState("");
  const [anos, setAnos] = useState("4");
  const [meses, setMeses] = useState("0");
  const [queixa, setQueixa] = useState("tea");
  const [respondente, setRespondente] = useState<PreConsultaRespondente>("pais");
  const [contexto, setContexto] = useState<PreConsultaContexto>("primeira-consulta");
  const [observacoes, setObservacoes] = useState("");
  const [saved, setSaved] = useState<PreConsultaRecord | null>(null);

  const draft = useMemo(() => createPreConsultaRecord({
    paciente,
    idadeMeses: idadeMeses(anos, meses),
    queixa,
    respondente,
    contexto,
    observacoes,
  }), [paciente, anos, meses, queixa, respondente, contexto, observacoes]);

  const recommendations = useMemo(() => recommendPreConsultaScales(draft), [draft]);
  const summary = useMemo(() => buildPreConsultaSummary(saved || draft, recommendations), [saved, draft, recommendations]);

  function salvar() {
    const record = { ...draft, status: "pronto-medico" as const };
    const current = loadPreConsultas();
    savePreConsultas([record, ...current].slice(0, 50));
    setSaved(record);
  }

  async function copiar() {
    await navigator.clipboard?.writeText(summary);
  }

  return (
    <div className="page-enter space-y-5 pb-8">
      <header className="rounded-[2rem] border border-border/70 bg-card/90 p-5 shadow-sm backdrop-blur">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-chart-2 text-white shadow-md">
            <ClipboardCheck className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <Badge className="mb-2 rounded-full bg-primary/10 text-primary hover:bg-primary/10">pré-consulta · sem redesign</Badge>
            <h1 className="text-2xl font-black tracking-tight text-foreground">Pré-consulta guiada</h1>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Fluxo simples para recepção/família antes da consulta. Usa o motor do Filtro Inteligente e mostra apenas as melhores opções.
            </p>
          </div>
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardContent className="space-y-4 p-4">
            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-1 md:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Paciente</span>
                <Input value={paciente} onChange={(event) => setPaciente(event.target.value)} placeholder="Nome ou identificação" />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Anos</span>
                <Input type="number" min={0} max={20} value={anos} onChange={(event) => setAnos(event.target.value)} />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Meses</span>
                <Input type="number" min={0} max={11} value={meses} onChange={(event) => setMeses(event.target.value)} />
              </label>
            </div>

            <PremiumVisualPanel
              src={brandAssets.illustrations.childAssessment}
              badge="Triagem organizada"
              title="Antes da consulta, a história já começa a ficar mais clara."
              subtitle="A recepção registra idade, queixa e contexto; o médico recebe um resumo objetivo para abrir melhor a conversa."
              className="min-h-40"
            />

            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Queixa principal</span>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {preConsultaQueixas.map((item) => (
                  <button key={item.id} type="button" onClick={() => setQueixa(item.id)} className={`rounded-2xl border px-3 py-2 text-left text-xs font-bold transition ${queixa === item.id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-primary/40"}`}>
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Respondente</span>
                <select value={respondente} onChange={(event) => setRespondente(event.target.value as PreConsultaRespondente)} className="h-10 w-full rounded-2xl border border-border bg-background px-3 text-sm">
                  {respondentes.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                </select>
              </label>
              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Contexto</span>
                <select value={contexto} onChange={(event) => setContexto(event.target.value as PreConsultaContexto)} className="h-10 w-full rounded-2xl border border-border bg-background px-3 text-sm">
                  {contextos.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                </select>
              </label>
            </div>

            <label className="block space-y-1">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Observações da recepção/família</span>
              <textarea value={observacoes} onChange={(event) => setObservacoes(event.target.value)} className="min-h-24 w-full rounded-2xl border border-border bg-background p-3 text-sm" placeholder="Relato curto, dúvida principal ou informação prática." />
            </label>

            <div className="flex flex-wrap gap-2">
              <Button onClick={salvar} className="gap-2"><Save className="h-4 w-4" /> Salvar pré-consulta</Button>
              <Button variant="outline" onClick={copiar} className="gap-2"><Copy className="h-4 w-4" /> Copiar resumo</Button>
              <Button variant="outline" onClick={() => window.print()} className="gap-2"><Printer className="h-4 w-4" /> Imprimir</Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center gap-2 text-sm font-black text-foreground"><ShieldCheck className="h-4 w-4 text-primary" /> Questionários sugeridos</div>
              {recommendations.map((item) => (
                <div key={item.label} className="rounded-2xl border border-border/70 bg-muted/40 p-3">
                  <Badge variant="outline" className="mb-2">{item.label}</Badge>
                  <p className="text-sm font-black text-foreground">{item.scale?.name || "Sem sugestão forte"}</p>
                  <p className="line-clamp-2 text-xs text-muted-foreground">{item.scale?.fullName || "Refine idade/queixa/respondente."}</p>
                  <p className="mt-2 text-[11px] text-muted-foreground">{item.reason}</p>
                  {item.scale?.appRoute && <Link href={item.scale.appRoute} className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-primary">Abrir questionário <ArrowRight className="h-3 w-3" /></Link>}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 p-4">
              <p className="text-sm font-black text-foreground">Resumo para o médico</p>
              <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap rounded-2xl bg-muted/50 p-3 text-xs leading-relaxed text-muted-foreground">{summary}</pre>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
