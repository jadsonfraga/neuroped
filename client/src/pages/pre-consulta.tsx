import { useMemo, useState } from "react";
import { Link } from "wouter";
import { ArrowRight, ClipboardCheck, Copy, Printer, Save, ShieldCheck, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PremiumVisualPanel } from "@/components/PremiumVisualPanel";
import { brandAssets } from "@/components/BrandAssets";
import {
  buildPreConsultaSummary,
  clearPreConsultas,
  createPreConsultaRecord,
  loadPreConsultas,
  preConsultaQueixas,
  recommendPreConsultaScales,
  sanitizeAgeInput,
  savePreConsultas,
  validateAge,
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

export default function PreConsultaPage() {
  const [paciente, setPaciente] = useState("");
  const [anos, setAnos] = useState("4");
  const [meses, setMeses] = useState("0");
  const [queixa, setQueixa] = useState("tea");
  const [respondente, setRespondente] = useState<PreConsultaRespondente>("pais");
  const [contexto, setContexto] = useState<PreConsultaContexto>("primeira-consulta");
  const [observacoes, setObservacoes] = useState("");
  const [saved, setSaved] = useState<PreConsultaRecord | null>(null);
  const [storageError, setStorageError] = useState("");

  const ageValidation = useMemo(() => validateAge({ years: anos, months: meses }), [anos, meses]);

  const draft = useMemo(() => createPreConsultaRecord({
    paciente,
    idadeMeses: ageValidation.totalMonths,
    queixa,
    respondente,
    contexto,
    observacoes,
  }), [paciente, ageValidation.totalMonths, queixa, respondente, contexto, observacoes]);

  const recommendations = useMemo(() => ageValidation.isValid ? recommendPreConsultaScales(draft) : [], [ageValidation.isValid, draft]);
  const summary = useMemo(
    () => ageValidation.isValid
      ? buildPreConsultaSummary(saved || draft, recommendations)
      : "Corrija a idade antes de gerar o resumo clínico.",
    [ageValidation.isValid, saved, draft, recommendations],
  );

  async function salvar() {
    setStorageError("");
    if (!ageValidation.isValid) {
      setSaved(null);
      return;
    }
    const record = { ...draft, status: "pronto-medico" as const };
    const current = await loadPreConsultas();
    const stored = await savePreConsultas([record, ...current].slice(0, 50));
    if (!stored) {
      setSaved(null);
      setStorageError("Não foi possível salvar neste dispositivo. Mantenha o formulário aberto e verifique o espaço ou as permissões de armazenamento do navegador.");
      return;
    }
    setSaved(record);
  }

  async function apagarDadosLocais() {
    if (!window.confirm("Apagar todas as pré-consultas protegidas deste dispositivo? Esta ação não pode ser desfeita.")) return;
    await clearPreConsultas();
    setSaved(null);
    setStorageError("");
  }

  async function copiar() {
    if (!ageValidation.isValid) return;
    await navigator.clipboard?.writeText(summary);
  }

  function imprimir() {
    if (!ageValidation.isValid) return;
    window.print();
  }

  return (
    <div className="page-enter space-y-5 pb-8">
      <header className="rounded-3xl border border-border/70 bg-card/90 p-5 shadow-sm backdrop-blur">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-chart-2 text-white shadow-md">
            <ClipboardCheck className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <Badge className="mb-2 rounded-full bg-primary/10 text-primary hover:bg-primary/10">pré-consulta · sem redesign</Badge>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Pré-consulta guiada</h1>
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
              <label htmlFor="pre-consulta-paciente" className="space-y-1 md:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Paciente</span>
                <Input id="pre-consulta-paciente" value={paciente} onChange={(event) => setPaciente(event.target.value)} placeholder="Nome ou identificação" />
              </label>
              <label htmlFor="pre-consulta-anos" className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Anos</span>
                <Input
                  id="pre-consulta-anos"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  min={0}
                  max={18}
                  value={anos}
                  aria-invalid={!ageValidation.isValid}
                  aria-describedby="pre-consulta-age-error"
                  onChange={(event) => setAnos(sanitizeAgeInput(event.target.value))}
                  className={!ageValidation.isValid ? "border-destructive focus-visible:ring-destructive" : undefined}
                />
              </label>
              <label htmlFor="pre-consulta-meses" className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Meses</span>
                <Input
                  id="pre-consulta-meses"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  min={0}
                  max={11}
                  value={meses}
                  aria-invalid={!ageValidation.isValid}
                  aria-describedby="pre-consulta-age-error"
                  onChange={(event) => setMeses(sanitizeAgeInput(event.target.value))}
                  className={!ageValidation.isValid ? "border-destructive focus-visible:ring-destructive" : undefined}
                />
              </label>
            </div>
            {!ageValidation.isValid && (
              <div id="pre-consulta-age-error" className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive" role="alert">
                {ageValidation.errors.join(" ")}
              </div>
            )}

            <PremiumVisualPanel
              src={brandAssets.illustrations.childAssessment}
              badge="Triagem organizada"
              title="Antes da consulta, a história já começa a ficar mais clara."
              subtitle="A recepção registra idade, queixa e contexto; o médico recebe um resumo objetivo para abrir melhor a conversa."
              className="min-h-40"
            />

            <fieldset className="space-y-2">
              <legend className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Queixa principal</legend>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {preConsultaQueixas.map((item) => (
                  <button key={item.id} type="button" onClick={() => setQueixa(item.id)} aria-pressed={queixa === item.id} className={`rounded-2xl border px-3 py-2 text-left text-xs font-bold transition ${queixa === item.id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-primary/40"}`}>
                    {item.label}
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="grid gap-3 md:grid-cols-2">
              <label htmlFor="pre-consulta-respondente" className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Respondente</span>
                <select id="pre-consulta-respondente" value={respondente} onChange={(event) => setRespondente(event.target.value as PreConsultaRespondente)} className="h-10 w-full rounded-2xl border border-border bg-background px-3 text-sm">
                  {respondentes.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                </select>
              </label>
              <label htmlFor="pre-consulta-contexto" className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Contexto</span>
                <select id="pre-consulta-contexto" value={contexto} onChange={(event) => setContexto(event.target.value as PreConsultaContexto)} className="h-10 w-full rounded-2xl border border-border bg-background px-3 text-sm">
                  {contextos.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                </select>
              </label>
            </div>

            <label htmlFor="pre-consulta-observacoes" className="block space-y-1">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Observações da recepção/família</span>
              <textarea id="pre-consulta-observacoes" value={observacoes} onChange={(event) => setObservacoes(event.target.value)} className="min-h-24 w-full rounded-2xl border border-border bg-background p-3 text-sm" placeholder="Relato curto, dúvida principal ou informação prática." />
            </label>

            <div className="flex flex-wrap gap-2">
              <Button onClick={salvar} aria-disabled={!ageValidation.isValid} className="gap-2"><Save className="h-4 w-4" /> Salvar pré-consulta</Button>
              <Button variant="outline" onClick={copiar} aria-disabled={!ageValidation.isValid} className="gap-2"><Copy className="h-4 w-4" /> Copiar resumo</Button>
              <Button variant="outline" onClick={imprimir} aria-disabled={!ageValidation.isValid} className="gap-2"><Printer className="h-4 w-4" /> Imprimir</Button>
              <Button variant="ghost" onClick={apagarDadosLocais} className="gap-2 text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /> Apagar deste dispositivo</Button>
            </div>
            {storageError && (
              <p className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive" role="alert">
                {storageError}
              </p>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><ShieldCheck className="h-4 w-4 text-primary" /> Questionários sugeridos</div>
              {recommendations.map((item) => (
                <div key={item.label} className="rounded-2xl border border-border/70 bg-muted/40 p-3">
                  <Badge variant="outline" className="mb-2">{item.label}</Badge>
                  <p className="text-sm font-semibold text-foreground">{item.scale?.name || "Sem sugestão forte"}</p>
                  <p className="line-clamp-2 text-xs text-muted-foreground">{item.scale?.fullName || "Refine idade/queixa/respondente."}</p>
                  <p className="mt-2 text-[11px] text-muted-foreground">{item.reason}</p>
                  {item.scale?.appRoute && <Link href={item.scale.appRoute} className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-primary">Abrir questionário <ArrowRight className="h-3 w-3" /></Link>}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 p-4">
              <p className="text-sm font-semibold text-foreground">Resumo para o médico</p>
              <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap rounded-2xl bg-muted/50 p-3 text-xs leading-relaxed text-muted-foreground">{summary}</pre>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
