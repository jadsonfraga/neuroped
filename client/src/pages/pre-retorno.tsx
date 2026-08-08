import { useMemo, useState } from "react";
import { ClipboardCheck, Copy, MessageCircle, Printer, Save, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { sanitizeAgeInput, validateAge } from "@/lib/preConsultaCore";
import { copyText, formatForWhatsApp, openWhatsAppShare } from "@/lib/shareText";
import { secureClear, secureGet, secureSet } from "@/lib/secureStorage";

const STORAGE_KEY = "neuroped:pre-retornos";
const SECURE_STORAGE_KEY = "pre-retornos";

interface PreRetornoRecord {
  id: string;
  paciente: string;
  idade: string;
  ultimaConsulta: string;
  motivo: string;
  evolucao: string;
  sono: string;
  comportamento: string;
  escola: string;
  alimentacao: string;
  comunicacao: string;
  crises: string;
  medicacao: string;
  sintomasTratamento?: string;
  duvida: string;
  prioridade: string;
  observacoes: string;
  createdAt: string;
}

const opcoesEvolucao = ["melhorou", "igual", "piorou", "oscilando"];
const opcoesBasicas = ["melhorou", "igual", "piorou", "não se aplica"];
const opcoesEscola = ["melhorou", "igual", "piorou", "sem informação"];
const opcoesAlimentacao = ["melhorou", "igual", "piorou", "seletividade importante"];
const opcoesCrises = ["não tem", "sem crises", "reduziu", "aumentou", "mudou padrão"];
const opcoesMedicacao = ["sem medicação", "usando corretamente", "esquece doses", "suspendeu", "mudou por conta própria", "teve efeitos colaterais"];

async function loadRecords(): Promise<PreRetornoRecord[]> {
  const protectedRecords = await secureGet<PreRetornoRecord[]>(SECURE_STORAGE_KEY);
  if (Array.isArray(protectedRecords)) return protectedRecords;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const legacy = raw ? JSON.parse(raw) : [];
    if (Array.isArray(legacy) && legacy.length > 0) {
      const migrated = await secureSet(SECURE_STORAGE_KEY, legacy);
      if (migrated && localStorage.getItem(STORAGE_KEY) === raw) {
        localStorage.removeItem(STORAGE_KEY);
      }
      return legacy;
    }
    if (raw !== null) localStorage.removeItem(STORAGE_KEY);
    return [];
  } catch {
    return [];
  }
}

async function saveRecords(items: PreRetornoRecord[]): Promise<boolean> {
  let stored: boolean;
  try {
    stored = await secureSet(SECURE_STORAGE_KEY, items);
  } catch {
    return false;
  }
  if (!stored) return false;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // A cópia cifrada já foi confirmada; a limpeza legada é best-effort.
  }
  return true;
}

async function clearRecords(): Promise<void> {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // A entrada protegida ainda será removida abaixo.
  }
  await secureClear(SECURE_STORAGE_KEY);
}

function buildRecord(data: Omit<PreRetornoRecord, "id" | "createdAt">): PreRetornoRecord {
  return { ...data, id: `pr-${crypto.randomUUID()}`, createdAt: new Date().toISOString() };
}

function listAlertas(record: PreRetornoRecord) {
  const sintomasTratamento = record.sintomasTratamento || "";
  const alertas = [
    record.evolucao === "piorou" ? "Evolução geral relatada como piora." : "",
    record.comportamento === "piorou" || record.comportamento === "oscilando" ? "Oscilação ou piora comportamental relatada." : "",
    record.crises === "aumentou" || record.crises === "mudou padrão" ? "Mudança no padrão de crises relatada." : "",
    record.medicacao.includes("suspendeu") || record.medicacao.includes("mudou") || record.medicacao.includes("efeitos") ? "Há ponto de atenção envolvendo uso de medicação." : "",
    sintomasTratamento.trim() ? "Família descreveu sintomas ou efeitos percebidos durante o tratamento." : "",
  ].filter(Boolean);
  return alertas.length ? alertas.slice(0, 3) : ["Sem alerta crítico informado no formulário.", "Confirmar contexto escolar/terapêutico.", "Correlacionar relato com avaliação clínica."];
}

function listPositivos(record: PreRetornoRecord) {
  const positivos = [
    record.evolucao === "melhorou" ? "Família percebe melhora geral desde a última consulta." : "",
    record.sono === "melhorou" ? "Sono relatado como melhor." : "",
    record.escola === "melhorou" ? "Escola relatada como melhor." : "",
    record.comunicacao === "melhorou" ? "Comunicação relatada como melhor." : "",
  ].filter(Boolean);
  return positivos.length ? positivos.slice(0, 3) : ["Família trouxe informações organizadas para o retorno.", "Há prioridade objetiva para a consulta.", "O registro facilita triagem pela recepção."];
}

function buildResumo(record: PreRetornoRecord) {
  const alertas = listAlertas(record);
  const positivos = listPositivos(record);
  return `RESUMO PRÉ-RETORNO\n\nPaciente: ${record.paciente || "Não informado"}\nIdade: ${record.idade || "Não informada"}\nÚltima consulta: ${record.ultimaConsulta || "Não informada"}\nMotivo do retorno: ${record.motivo || "Não informado"}\n\nEvolução geral: ${record.evolucao}\nSono: ${record.sono}\nComportamento: ${record.comportamento}\nEscola: ${record.escola}\nAlimentação: ${record.alimentacao}\nComunicação: ${record.comunicacao}\nCrises, se aplicável: ${record.crises}\nMedicação: ${record.medicacao}\nSintomas/efeitos percebidos pela família: ${record.sintomasTratamento || "Não informado"}\n\nDúvida principal da família: ${record.duvida || "Não informada"}\nPrioridade da consulta de hoje: ${record.prioridade || "Não informada"}\n\nPontos de alerta:\n1. ${alertas[0] || "Revisar relato."}\n2. ${alertas[1] || "Correlacionar com contexto escolar/terapêutico."}\n3. ${alertas[2] || "Confirmar em consulta."}\n\nPontos positivos:\n1. ${positivos[0] || "Registro familiar organizado."}\n2. ${positivos[1] || "Família engajada."}\n3. ${positivos[2] || "Consulta pode iniciar com prioridade clara."}\n\nPerguntas estratégicas para o médico:\n1. Qual é a maior preocupação da família hoje?\n2. O que mais atrapalha a rotina em casa, escola ou terapias?\n\nInterpretação prudente:\n- relato familiar pré-consulta;\n- não substitui avaliação médica;\n- não define causalidade de sintomas relatados;\n- não orienta ajuste de dose sem avaliação médica;\n- correlacionar com exame clínico e contexto escolar/terapêutico.\n\nObservações livres:\n${record.observacoes || "- Sem observações adicionais."}`;
}

function FieldSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return (
    <label className="space-y-1">
      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</span>
      <select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} className="h-10 w-full rounded-2xl border border-border bg-background px-3 text-sm">
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

export default function PreRetornoPage() {
  const [paciente, setPaciente] = useState("");
  const [anos, setAnos] = useState("4");
  const [meses, setMeses] = useState("0");
  const [ultimaConsulta, setUltimaConsulta] = useState("");
  const [motivo, setMotivo] = useState("");
  const [evolucao, setEvolucao] = useState("igual");
  const [sono, setSono] = useState("igual");
  const [comportamento, setComportamento] = useState("igual");
  const [escola, setEscola] = useState("sem informação");
  const [alimentacao, setAlimentacao] = useState("igual");
  const [comunicacao, setComunicacao] = useState("igual");
  const [crises, setCrises] = useState("não tem");
  const [medicacao, setMedicacao] = useState("sem medicação");
  const [sintomasTratamento, setSintomasTratamento] = useState("");
  const [duvida, setDuvida] = useState("");
  const [prioridade, setPrioridade] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [saved, setSaved] = useState<PreRetornoRecord | null>(null);
  const [storageError, setStorageError] = useState("");

  const ageValidation = useMemo(() => validateAge({ years: anos, months: meses }), [anos, meses]);
  const idade = ageValidation.label;

  const draft = useMemo(() => buildRecord({ paciente, idade, ultimaConsulta, motivo, evolucao, sono, comportamento, escola, alimentacao, comunicacao, crises, medicacao, sintomasTratamento, duvida, prioridade, observacoes }), [paciente, idade, ultimaConsulta, motivo, evolucao, sono, comportamento, escola, alimentacao, comunicacao, crises, medicacao, sintomasTratamento, duvida, prioridade, observacoes]);
  const resumo = useMemo(
    () => ageValidation.isValid ? buildResumo(saved || draft) : "Corrija a idade antes de gerar o resumo clínico.",
    [ageValidation.isValid, saved, draft],
  );

  async function salvar() {
    setStorageError("");
    if (!ageValidation.isValid) {
      setSaved(null);
      return;
    }
    const record = buildRecord({ paciente, idade, ultimaConsulta, motivo, evolucao, sono, comportamento, escola, alimentacao, comunicacao, crises, medicacao, sintomasTratamento, duvida, prioridade, observacoes });
    const current = await loadRecords();
    const stored = await saveRecords([record, ...current].slice(0, 50));
    if (!stored) {
      setSaved(null);
      setStorageError("Não foi possível salvar neste dispositivo. Mantenha o formulário aberto e verifique o espaço ou as permissões de armazenamento do navegador.");
      return;
    }
    setSaved(record);
  }

  async function apagarDadosLocais() {
    if (!window.confirm("Apagar todos os pré-retornos protegidos deste dispositivo? Esta ação não pode ser desfeita.")) return;
    await clearRecords();
    setSaved(null);
    setStorageError("");
  }

  function copiarResumo() {
    if (!ageValidation.isValid) return;
    copyText(resumo);
  }

  function compartilharWhatsApp() {
    if (!ageValidation.isValid) return;
    openWhatsAppShare(formatForWhatsApp("Resumo pré-retorno", resumo));
  }

  function imprimir() {
    if (!ageValidation.isValid) return;
    window.print();
  }

  return (
    <div className="page-enter space-y-5 pb-8">
      <header className="rounded-[2rem] border border-border/70 bg-card/90 p-5 shadow-sm backdrop-blur">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-chart-2 text-white shadow-md">
            <ClipboardCheck className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <Badge className="mb-2 rounded-full bg-primary/10 text-primary hover:bg-primary/10">pré-retorno · família</Badge>
            <h1 className="text-2xl font-black tracking-tight text-foreground">Pré-retorno familiar</h1>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">Registro simples do que mudou desde a última consulta, pronto para recepção e médico.</p>
          </div>
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <Card><CardContent className="space-y-4 p-4">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1 md:col-span-2"><span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Paciente</span><Input value={paciente} onChange={(e) => setPaciente(e.target.value)} placeholder="Nome ou identificação" /></label>
            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Anos</span>
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                min={0}
                max={18}
                value={anos}
                aria-invalid={!ageValidation.isValid}
                aria-describedby="pre-retorno-age-error"
                onChange={(e) => setAnos(sanitizeAgeInput(e.target.value))}
                className={!ageValidation.isValid ? "border-destructive focus-visible:ring-destructive" : undefined}
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Meses</span>
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                min={0}
                max={11}
                value={meses}
                aria-invalid={!ageValidation.isValid}
                aria-describedby="pre-retorno-age-error"
                onChange={(e) => setMeses(sanitizeAgeInput(e.target.value))}
                className={!ageValidation.isValid ? "border-destructive focus-visible:ring-destructive" : undefined}
              />
            </label>
            {!ageValidation.isValid && (
              <div id="pre-retorno-age-error" className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive md:col-span-2" role="alert">
                {ageValidation.errors.join(" ")}
              </div>
            )}
            <label className="space-y-1"><span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Última consulta</span><Input value={ultimaConsulta} onChange={(e) => setUltimaConsulta(e.target.value)} placeholder="Data aproximada" /></label>
            <label className="space-y-1 md:col-span-2"><span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Motivo do retorno</span><Input value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Principal motivo" /></label>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <FieldSelect label="Evolução geral" value={evolucao} onChange={setEvolucao} options={opcoesEvolucao} />
            <FieldSelect label="Sono" value={sono} onChange={setSono} options={opcoesBasicas} />
            <FieldSelect label="Comportamento" value={comportamento} onChange={setComportamento} options={opcoesEvolucao} />
            <FieldSelect label="Escola" value={escola} onChange={setEscola} options={opcoesEscola} />
            <FieldSelect label="Alimentação" value={alimentacao} onChange={setAlimentacao} options={opcoesAlimentacao} />
            <FieldSelect label="Comunicação" value={comunicacao} onChange={setComunicacao} options={opcoesBasicas} />
            <FieldSelect label="Crises epilépticas" value={crises} onChange={setCrises} options={opcoesCrises} />
            <FieldSelect label="Medicação" value={medicacao} onChange={setMedicacao} options={opcoesMedicacao} />
          </div>

          <label className="block space-y-1"><span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Sintomas ou efeitos percebidos pela família</span><textarea aria-label="Sintomas ou efeitos percebidos pela família" value={sintomasTratamento} onChange={(e) => setSintomasTratamento(e.target.value)} className="min-h-20 w-full rounded-2xl border border-border bg-background p-3 text-sm" placeholder="Relato livre. Não altera conduta automaticamente; será revisado pelo médico." /></label>
          <label className="block space-y-1"><span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Dúvida principal da família</span><Input value={duvida} onChange={(e) => setDuvida(e.target.value)} /></label>
          <label className="block space-y-1"><span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Prioridade de hoje</span><Input value={prioridade} onChange={(e) => setPrioridade(e.target.value)} /></label>
          <label className="block space-y-1"><span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Observações livres</span><textarea aria-label="Observações livres" value={observacoes} onChange={(e) => setObservacoes(e.target.value)} className="min-h-24 w-full rounded-2xl border border-border bg-background p-3 text-sm" /></label>

          <div className="flex flex-wrap gap-2">
            <Button onClick={salvar} aria-disabled={!ageValidation.isValid} className="gap-2"><Save className="h-4 w-4" /> Salvar pré-retorno</Button>
            <Button variant="outline" onClick={copiarResumo} aria-disabled={!ageValidation.isValid} className="gap-2"><Copy className="h-4 w-4" /> Copiar resumo</Button>
            <Button variant="outline" onClick={compartilharWhatsApp} aria-disabled={!ageValidation.isValid} className="gap-2"><MessageCircle className="h-4 w-4" /> Copiar para WhatsApp</Button>
            <Button variant="outline" onClick={imprimir} aria-disabled={!ageValidation.isValid} className="gap-2"><Printer className="h-4 w-4" /> Imprimir</Button>
            <Button variant="ghost" onClick={apagarDadosLocais} className="gap-2 text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /> Apagar deste dispositivo</Button>
          </div>
          {storageError && (
            <p className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive" role="alert">
              {storageError}
            </p>
          )}
        </CardContent></Card>

        <Card><CardContent className="space-y-3 p-4">
          <p className="text-sm font-black text-foreground">Resumo para o médico</p>
          <pre className="max-h-[680px] overflow-auto whitespace-pre-wrap rounded-2xl bg-muted/50 p-3 text-xs leading-relaxed text-muted-foreground">{resumo}</pre>
        </CardContent></Card>
      </section>
    </div>
  );
}
