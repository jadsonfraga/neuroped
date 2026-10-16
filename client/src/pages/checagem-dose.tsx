import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, ExternalLink, Info, ShieldAlert } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AVISO_APOIO_DOSE, BASE_REFERENCIAS, checarDose, medicamentosDaBase } from "@/lib/checagemDose";

const num = (s: string) => (s.trim() === "" ? NaN : Number(s.replace(",", ".")));
const br = (iso: string) => iso.split("-").reverse().join("/");

export default function ChecagemDosePage() {
  const [medicamento, setMedicamento] = useState("");
  const [dose, setDose] = useState("");
  const [vezes, setVezes] = useState("");
  const [peso, setPeso] = useState("");
  const [anos, setAnos] = useState("");
  const [meses, setMeses] = useState("0");
  const lista = useMemo(() => medicamentosDaBase(), []);

  const preenchido = medicamento.trim() && dose.trim() && vezes.trim() && peso.trim() && anos.trim();
  const resultado = useMemo(() => {
    if (!preenchido) return null;
    return checarDose({ medicamento, doseMg: num(dose), dosesPorDia: num(vezes), pesoKg: num(peso), idadeMeses: num(anos) * 12 + (num(meses) || 0) });
  }, [preenchido, medicamento, dose, vezes, peso, anos, meses]);

  return (
    <div className="space-y-5 pb-8" data-testid="page-checagem-dose">
      <PageHero icon={ShieldAlert} eyebrow="apoio à leitura" title="Checagem de dose por peso e idade" subtitle="Compara a dose registrada com faixas de referência de bulas oficiais, com fonte e trecho. Somente apoio: não prescreve nem sugere conduta." gradient="from-primary to-chart-2" />

      <div role="note" data-testid="dose-aviso-apoio" className="flex gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100">
        <Info className="mt-0.5 h-4 w-4 shrink-0" /><p>{AVISO_APOIO_DOSE}</p>
      </div>

      <section className="grid gap-3 rounded-2xl border border-border/70 bg-card/80 p-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="dose-form">
        <div className="space-y-1 sm:col-span-2 lg:col-span-1">
          <Label htmlFor="dose-med" className="text-xs">Medicamento (apenas os da base com fonte)</Label>
          <Input id="dose-med" list="dose-med-lista" value={medicamento} onChange={(e) => setMedicamento(e.target.value)} placeholder="Ex.: levetiracetam" data-testid="dose-medicamento" />
          <datalist id="dose-med-lista">{lista.map((m) => <option key={m} value={m} />)}</datalist>
        </div>
        {([
          ["dose-dose", "Dose por administração (mg)", dose, setDose, "dose-dose"],
          ["dose-vezes", "Administrações por dia", vezes, setVezes, "dose-vezes"],
          ["dose-peso", "Peso (kg)", peso, setPeso, "dose-peso"],
          ["dose-anos", "Idade (anos completos)", anos, setAnos, "dose-anos"],
          ["dose-meses", "Meses adicionais", meses, setMeses, "dose-meses"],
        ] as const).map(([id, label, valor, setter, tid]) => (
          <div key={id} className="space-y-1">
            <Label htmlFor={id} className="text-xs">{label}</Label>
            <Input id={id} inputMode="decimal" value={valor} onChange={(e) => setter(e.target.value)} data-testid={tid} />
          </div>
        ))}
      </section>

      {!resultado && <p className="text-xs text-muted-foreground" data-testid="dose-aguardando-dados">Preencha medicamento, dose, administrações por dia, peso e idade.</p>}

      {resultado?.situacao === "entrada-invalida" && <p role="alert" className="text-sm text-red-700" data-testid="dose-invalida">{resultado.motivo}</p>}

      {resultado?.situacao === "sem-dado-validado" && (
        <section className="rounded-2xl border border-dashed p-4" data-testid="dose-sem-dado">
          <h2 className="text-sm font-bold">Sem dado validado</h2>
          <p className="text-sm">{resultado.motivo}</p>
          <p className="mt-1 text-xs text-muted-foreground">A checagem não usa faixas sem fonte oficial verificada. Nenhuma faixa foi estimada.</p>
        </section>
      )}

      {resultado?.situacao === "avaliada" && (
        <section className="space-y-4 rounded-2xl border border-border/70 bg-card/80 p-4" data-testid="dose-resultado">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-bold">{resultado.entrada.medicamento} · {resultado.entrada.indicacao}</h2>
            {resultado.aguardandoValidacao && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900" data-testid="dose-status-validacao">Aguardando validação do médico</span>}
          </div>
          <p className="text-sm" data-testid="dose-calculo">Dose diária registrada: <strong>{String(Number(resultado.doseDiariaMg.toFixed(2))).replace(".", ",")} mg/dia</strong> = <strong>{String(Number(resultado.doseMgKgDia.toFixed(2))).replace(".", ",")} mg/kg/dia</strong></p>

          <ul className="space-y-3" data-testid="dose-alertas">
            {resultado.alertas.map((a, i) => (
              <li key={i} data-codigo={a.codigo} className={`rounded-lg border p-3 text-sm ${a.nivel === "atencao" ? "border-red-300 bg-red-50 text-red-900 dark:bg-red-950/30 dark:text-red-100" : "border-border bg-muted/30"}`}>
                <p className="flex gap-2">{a.nivel === "atencao" ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}<span>{a.mensagem}</span></p>
                <p className="mt-2 text-xs"><span className="font-semibold">Faixa de referência (trecho literal da fonte):</span> “{a.limite.trecho}”</p>
              </li>
            ))}
          </ul>

          <div className="space-y-1 text-xs" data-testid="dose-fonte">
            <p className="font-semibold">Fonte</p>
            <p>{resultado.entrada.fonte.titulo} — {resultado.entrada.fonte.fabricante} · {resultado.entrada.fonte.orgao}</p>
            <p>Seção: {resultado.entrada.fonte.secao} · versão SPL {resultado.entrada.fonte.versaoSpl} · vigente em {br(resultado.entrada.fonte.dataEfetiva)} · consultada em {br(resultado.entrada.fonte.dataConsulta)}</p>
            <a className="inline-flex items-center gap-1 underline" href={resultado.entrada.fonte.url} target="_blank" rel="noopener noreferrer">Abrir bula na fonte <ExternalLink className="h-3 w-3" /></a>
            {resultado.entrada.observacoes && <p className="mt-1 text-muted-foreground" data-testid="dose-observacoes">Ressalvas: {resultado.entrada.observacoes}</p>}
          </div>
        </section>
      )}

      <p className="text-xs text-muted-foreground" data-testid="dose-base-info">Base: {BASE_REFERENCIAS.entradas.length} entradas, {lista.length} medicamentos, todas dependem de validação do médico antes de uso rotineiro. Não considera função renal/hepática, interações, formulação, indicação diferente da listada nem ajustes da bula.</p>
    </div>
  );
}
