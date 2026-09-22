import { SONDA_DEZ_PROTOCOL, type BandDef, type FieldDef, type FieldValue } from "@/data/sondaDezProtocol";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSondaExitGuard } from "@/hooks/useSondaExitGuard";
import { isSondaResponseCode, validSondaAge, validSondaField, legacyCoverage } from "@/lib/sondaDezQuality";
import {
  AlertTriangle,
  Baby,
  Brain,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Copy,
  Eye,
  Hand,
  MessageCircle,
  MonitorSmartphone,
  PackageCheck,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Timer,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

/**
 * Sonda Dez — avaliação direta pré-consulta.
 *
 * Fonte clínica canônica: fichas AFN-10 A1/A2/B/C/D/E fornecidas pelo médico.
 * Esta página deliberadamente NÃO calcula escore global, percentil, norma ou
 * diagnóstico. O resultado é um registro observacional estruturado para
 * integração médica posterior.
 *
 * Privacidade: todo o estado desta tela vive apenas em memória. Não há
 * localStorage, D1, endpoint clínico nem persistência automática.
 */

type Phase = "setup" | "materials" | "run" | "report";
type ResponseCode = "E" | "I" | "P" | "0" | "NA";
type MissionRecord = {
  values: Record<string, FieldValue>;
  notes: string;
};

type Interference = "nenhum" | "sono" | "dor/fome" | "ansiedade/recusa";
type RedFlag =
  | "regressão"
  | "evento paroxístico"
  | "assimetria/marcha"
  | "auto/heteroagressão"
  | "não tolerou";

const CODES = ["E", "I", "P", "0", "NA"] as const;
const CODE_LABELS: Record<ResponseCode, string> = {
  E: "Espontâneo",
  I: "Após instrução",
  P: "Após pista/repetição",
  "0": "Não demonstrado",
  NA: "Não avaliável",
};
const CODE_MEANINGS: Record<ResponseCode, string> = {
  E: "A reação apareceu sem mediação adicional nesta situação; é evidência observacional de que o comportamento estava acessível aqui.",
  I: "A reação apareceu depois de uma instrução direta; a estrutura verbal foi suficiente para evocar o comportamento nesta tarefa.",
  P: "A reação apareceu somente após pista ou repetição; houve necessidade de mediação adicional nesta oportunidade.",
  "0": "A reação não apareceu nesta oportunidade. Isso não prova ausência da habilidade fora desta situação e não deve ser convertido em diagnóstico.",
  NA: "As condições da aplicação não permitiram inferência válida; não converter em erro, zero ou ausência de habilidade.",
};

const INTERFERENCES: Interference[] = [
  "nenhum",
  "sono",
  "dor/fome",
  "ansiedade/recusa",
];
const RED_FLAGS: RedFlag[] = [
  "regressão",
  "evento paroxístico",
  "assimetria/marcha",
  "auto/heteroagressão",
  "não tolerou",
];

const BANDS: BandDef[] = SONDA_DEZ_PROTOCOL;

function bandForMonths(months: number): BandDef | undefined {
  return BANDS.find((band) => months >= band.minMonths && months <= band.maxMonths);
}

function fieldValueText(field: FieldDef, value: FieldValue | undefined): string {
  if (value === undefined || value === "") return "não registrado";
  if (!validSondaField(field, value)) return "registro inválido — revisar";
  if (value === "NA") return "NA — Não avaliável";
  if (isSondaResponseCode(field, value)) {
    return `${value} — ${CODE_LABELS[String(value) as ResponseCode]}`;
  }
  if (field.kind === "count" && field.max) return `${value}/${field.max}`;
  return String(value);
}

function explainValue(field: FieldDef, value: FieldValue | undefined): string {
  if (value === undefined || value === "") return "Ainda não há resposta registrada para interpretar.";
  if (!validSondaField(field, value)) return "Valor inválido; revise antes da entrega.";
  if (value === "NA" || isSondaResponseCode(field, value)) return CODE_MEANINGS[String(value) as ResponseCode];
  const normalized = String(value).toLowerCase();
  if (normalized === "sim") return `Foi observado “${field.label}” nesta oportunidade. Registre o contexto e evite generalizar para outros ambientes.`;
  if (normalized === "não") return `“${field.label}” não foi observado nesta oportunidade; isso não prova ausência da habilidade fora desta tarefa.`;
  if (normalized === "na") return CODE_MEANINGS.NA;
  if (normalized.includes("intensa") || normalized.includes("não ocorreu")) return `A resposta “${value}” merece destaque ao médico e correlação com interferentes, sem insistir na tarefa se houver sofrimento.`;
  if (field.kind === "count") return `É uma medida bruta desta aplicação. Interprete junto ao modo de execução, interferentes e necessidade de mediação; não há ponto de corte automático.`;
  return `Registro descritivo desta aplicação: “${field.label}: ${value}”. O significado clínico depende da integração médica.`;
}

function buildAnalysis(band: BandDef, records: Record<string, MissionRecord>, interferences: Interference[], flags: RedFlag[]): string {
  const sentences: string[] = [];
  for (const mission of band.missions) {
    const record = records[mission.id];
    if (!record) continue;
    const parts = mission.fields
      .map((field) => {
        const value = record.values[field.id];
        if (!validSondaField(field, value)) return null;
        const coded = isSondaResponseCode(field, value);
        const valueText = fieldValueText(field, value);
        if (coded && String(value) === "E") return `demonstrou ${field.label.toLowerCase()} espontaneamente`;
        if (coded && String(value) === "I") return `demonstrou ${field.label.toLowerCase()} após instrução direta`;
        if (coded && String(value) === "P") return `demonstrou ${field.label.toLowerCase()} apenas após pista/repetição, com necessidade de mediação adicional`;
        if (coded && String(value) === "0") return `não demonstrou ${field.label.toLowerCase()} nesta oportunidade`;
        if (String(value) === "NA") return `${field.label.toLowerCase()} não foi avaliável`;
        return `${field.label.toLowerCase()} = ${valueText}`;
      })
      .filter(Boolean);
    if (parts.length) sentences.push(`Em ${mission.title.toLowerCase()}, ${parts.join("; ")}.`);
  }
  if (!sentences.length) sentences.push("Não houve registros suficientes para produzir síntese observacional.");
  const interferenceText = interferences.length ? interferences.join(", ") : "nenhum interferente marcado";
  sentences.push(`Interferentes registrados pela aplicadora: ${interferenceText}.`);
  if (flags.length) sentences.push(`Há alertas que exigem ciência do médico responsável: ${flags.join(", ")}.`);
  sentences.push("Os achados descrevem exclusivamente esta aplicação breve e devem ser integrados à história, exame e demais fontes pelo médico responsável.");
  return sentences.join(" ");
}

const BLOCKED_PATTERNS: RegExp[] = [
  /percentil/i,
  /escore\s*(total)?/i,
  /ponto\s+de\s+corte/i,
  /(abaixo|acima)\s+da\s+m[eé]dia/i,
  /(normal|anormal)\s+(para|pela)\s+idade/i,
  /confirma\s+(o\s+)?diagn[oó]stico/i,
  /diagn[oó]stico\s+de/i,
];

function auditAnalysis(text: string): string[] {
  return BLOCKED_PATTERNS.filter((pattern) => pattern.test(text)).map((pattern) => pattern.source);
}

function Seconds({ value }: { value: number }) {
  const safe = Math.max(0, value);
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return <>{minutes}:{String(seconds).padStart(2, "0")}</>;
}

function FieldControl({ field, value, onChange }: { field: FieldDef; value: FieldValue | undefined; onChange: (value: FieldValue) => void }) {
  if (field.kind === "count") {
    const current = typeof value === "number" && Number.isFinite(value) ? value : 0;
    return (
      <div className="rounded-2xl border border-border/70 bg-background p-3">
        <label className="block text-sm font-bold">
          {field.label}{field.max !== undefined ? ` (máximo ${field.max})` : ""}
          <Input aria-label={`Quantidade de ${field.label}`} type="number" min={0} max={field.max} step={1}
            className="mt-2 h-12" placeholder="Não registrado" disabled={value === "NA"}
            value={value === "NA" ? "" : value ?? ""}
            onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))} />
        </label>
        {field.hint && <p className="mt-1 text-xs text-muted-foreground">{field.hint}</p>}
        <div className="mt-3 flex flex-wrap gap-2">
          <Button type="button" variant="outline" aria-label={`Diminuir ${field.label}`} disabled={value === "NA" || value === undefined || value === "" || current <= 0} onClick={() => onChange(Math.max(0, current - 1))}>−</Button>
          <Button type="button" variant="outline" aria-label={`Aumentar ${field.label}`} disabled={value === "NA"} onClick={() => onChange(Math.min(field.max ?? Number.MAX_SAFE_INTEGER, current + 1))}>+</Button>
          <Button type="button" variant="outline" onClick={() => onChange(0)}>Registrar zero observado</Button>
          <Button type="button" variant={value === "NA" ? "default" : "outline"} aria-pressed={value === "NA"} onClick={() => onChange(value === "NA" ? "" : "NA")}>Não avaliável</Button>
          <Button type="button" variant="ghost" onClick={() => onChange("")}>Limpar</Button>
        </div>
        {value === "NA" && <p className="mt-2 text-sm">Descreva o motivo nas observações desta missão.</p>}
      </div>
    );
  }

  if (field.kind === "text") {
    return (
      <label className="block rounded-2xl border border-border/70 bg-background p-3">
        <span className="text-sm font-bold">{field.label}</span>
        <Input className="mt-2 h-12" value={String(value ?? "")} onChange={(event) => onChange(event.target.value)} />
      </label>
    );
  }

  return (
    <div className="rounded-2xl border border-border/70 bg-background p-3">
      <p className="mb-3 text-sm font-bold text-foreground">{field.label}</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {(field.options ?? []).map((option) => {
          const selected = String(value ?? "") === option;
          const code = isSondaResponseCode(field, option) || option === "NA";
          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(selected ? "" : option)}
              aria-pressed={selected}
              className={`min-h-12 rounded-xl border px-3 py-2 text-left text-sm font-bold transition ${selected ? "border-primary bg-primary text-primary-foreground shadow-sm" : "border-border bg-background hover:bg-muted"}`}
            >
              <span>{option}</span>
              {code && <span className={`mt-0.5 block text-[11px] font-medium ${selected ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{CODE_LABELS[option as ResponseCode]}</span>}
            </button>
          );
        })}
      </div>
      {value !== undefined && value !== "" && (
        <div className="mt-3 rounded-xl bg-amber-50 p-3 text-xs leading-relaxed text-amber-950 dark:bg-amber-950/20 dark:text-amber-100">
          <strong>O que esta reação pode significar:</strong> {explainValue(field, value)}
        </div>
      )}
    </div>
  );
}

export default function SondaDezPage({ onBandChange }: { onBandChange?: (id: string | undefined) => void } = {}) {
  const [phase, setPhase] = useState<Phase>("setup");
  const [caseCode, setCaseCode] = useState("");
  const [years, setYears] = useState("");
  const [months, setMonths] = useState("0");
  const [schoolYear, setSchoolYear] = useState("");
  const [interferences, setInterferences] = useState<Interference[]>(["nenhum"]);
  const [materialsChecked, setMaterialsChecked] = useState<Record<string, boolean>>({});
  const [missionIndex, setMissionIndex] = useState(0);
  const [records, setRecords] = useState<Record<string, MissionRecord>>({});
  const [redFlags, setRedFlags] = useState<RedFlag[]>([]);
  const [globalElapsed, setGlobalElapsed] = useState(0);
  const [missionElapsed, setMissionElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [childMode, setChildMode] = useState(false);
  const [copied, setCopied] = useState(false);

  const [copyError, setCopyError] = useState("");
  const missionTimes = useRef<Record<string, number>>({});
  const dirty = phase === "run" || phase === "report" || Object.keys(records).length > 0 || Boolean(caseCode || schoolYear);
  useSondaExitGuard(dirty);
  const totalMonths = validSondaAge(years, months) ?? NaN;
  const band = useMemo(() => bandForMonths(totalMonths), [totalMonths]);
  const mission = band?.missions[missionIndex];
  const allMaterialsReady = !!band && band.materials.every((item) => materialsChecked[item]);
  const coverage = band ? legacyCoverage(band, records) : [];
  const completeCount = coverage.filter((item) => item.complete).length;
  useEffect(() => { onBandChange?.(band?.id); }, [band?.id, onBandChange]);

  useEffect(() => {
    if (!running || phase !== "run") return;
    let previous = performance.now();
    let remainder = 0;
    const timer = window.setInterval(() => {
      const now = performance.now();
      remainder += now - previous;
      previous = now;
      const seconds = Math.floor(remainder / 1000);
      if (seconds) {
        setGlobalElapsed((value) => Math.min(600, value + seconds));
        setMissionElapsed((value) => value + seconds);
        remainder -= seconds * 1000;
      }
    }, 250);
    return () => window.clearInterval(timer);
  }, [running, phase]);
  useEffect(() => {
    if (globalElapsed >= 600) setRunning(false);
  }, [globalElapsed]);
  useEffect(() => {
    const hidden = () => { if (document.hidden) setRunning(false); };
    document.addEventListener("visibilitychange", hidden);
    return () => document.removeEventListener("visibilitychange", hidden);
  }, []);

  const missionTargetSeconds = useMemo(() => {
    if (!mission) return 0;
    const toSeconds = (clock: string) => {
      const [m, s] = clock.split(":").map(Number);
      return m * 60 + s;
    };
    return Math.max(1, toSeconds(mission.end) - toSeconds(mission.start));
  }, [mission]);

  function toggleInterference(item: Interference) {
    setInterferences((current) => {
      if (item === "nenhum") return ["nenhum"];
      const clean = current.filter((value) => value !== "nenhum");
      const next = clean.includes(item) ? clean.filter((value) => value !== item) : [...clean, item];
      return next.length ? next : ["nenhum"];
    });
  }

  function toggleFlag(flag: RedFlag) {
    setRedFlags((current) => current.includes(flag) ? current.filter((value) => value !== flag) : [...current, flag]);
  }

  function setField(missionId: string, fieldId: string, value: FieldValue) {
    setCopied(false);
    setRecords((current) => ({
      ...current,
      [missionId]: {
        values: { ...(current[missionId]?.values ?? {}), [fieldId]: value },
        notes: current[missionId]?.notes ?? "",
      },
    }));
  }

  function setNotes(missionId: string, notes: string) {
    setCopied(false);
    setRecords((current) => ({
      ...current,
      [missionId]: { values: current[missionId]?.values ?? {}, notes },
    }));
  }

  function beginRun() {
    setPhase("run");
    setMissionIndex(0);
    setGlobalElapsed(0);
    setMissionElapsed(0);
    setRunning(true);
  }

  function goMission(index: number) {
    if (!band) return;
    if (mission) missionTimes.current[mission.id] = missionElapsed;
    const target = Math.max(0, Math.min(band.missions.length - 1, index));
    setMissionIndex(target);
    setMissionElapsed(missionTimes.current[band.missions[target].id] ?? 0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function finish() {
    setRunning(false);
    setChildMode(false);
    setPhase("report");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetAll() {
    if (dirty && !window.confirm("Nova aplicação apaga estes registros. Copie ou baixe antes de continuar. Deseja apagar?")) return;
    setYears(""); setMonths("0"); setCopyError(""); missionTimes.current = {};
    setPhase("setup");
    setCaseCode("");
    setSchoolYear("");
    setInterferences(["nenhum"]);
    setMaterialsChecked({});
    setMissionIndex(0);
    setRecords({});
    setRedFlags([]);
    setGlobalElapsed(0);
    setMissionElapsed(0);
    setRunning(false);
    setChildMode(false);
    setCopied(false);
  }

  const analysis = band ? completeCount === band.missions.length
    ? buildAnalysis(band, records, interferences, redFlags)
    : "Registro parcial, com campos ausentes, inválidos ou sem contexto de NA/ajuda. Sem síntese interpretativa; confira os registros brutos e as pendências."
    : "";
  const auditFindings = auditAnalysis(analysis);

  const reportText = band
    ? [
        `SONDA DEZ — MODALIDADE PRESENCIAL · REGISTRO v2026-09-22.1`,
        `Estado documental: ${completeCount}/${band.missions.length} missões preenchidas com contexto. ${completeCount < band.missions.length ? "REGISTRO PARCIAL" : "Revisão médica necessária; NA não é habilidade avaliada"}. Tempo ativo: ${globalElapsed}s.`,
        `Código/iniciais: ${caseCode || "não informado"}. Idade: ${years}a ${months}m. Série: ${schoolYear || "não informada"}. Faixa: ${band.label}.`,
        `Interferentes assinalados: ${interferences.join(", ")}; não equivale a investigação negativa.`,
        "",
        "REGISTRO COMPLETO",
        ...band.missions.flatMap((item, index) => {
          const record = records[item.id];
          return [
            `${index + 1}. ${item.title} (${item.start}–${item.end})`,
            `Fala/pergunta: ${item.say.join(" / ")}`,
            ...item.fields.map((field) => `• ${field.label}: ${fieldValueText(field, record?.values[field.id])}`),
            `• Observação livre: ${record?.notes?.trim() || "não registrada"}`,
          ];
        }),
        "",
        "SÍNTESE DESCRITIVA DOS REGISTROS",
        analysis,
        "",
        `Alertas ao médico: ${redFlags.length ? redFlags.join(", ") : "nenhum marcado"}.`,
        "Prova observacional clínica piloto. Não gera diagnóstico, percentil ou escore total. Interpretação integrada pelo médico.",
      ].join("\n")
    : "";

  async function copyReport() {
    if (auditFindings.length) return;
    try {
      await navigator.clipboard.writeText(reportText);
      setCopied(true); setCopyError("");
    } catch {
      setCopied(false); setCopyError("Não foi possível copiar. Selecione o registro abaixo ou use Baixar registro.");
    }
  }
  function downloadReport() {
    if (auditFindings.length) return;
    const url = URL.createObjectURL(new Blob([reportText], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = "sonda-dez-presencial.txt";
    link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  if (childMode && mission?.childVisual) {
    return (
      <div className="fixed inset-0 z-[100] flex min-h-dvh flex-col bg-slate-950 text-white">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 p-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">Tela da criança</p>
            <p className="text-sm text-white/65">Sem instruções clínicas na área central</p>
          </div>
          <Button variant="secondary" onClick={() => setChildMode(false)}>Voltar à aplicadora</Button>
        </div>
        <main className="flex flex-1 flex-col items-center justify-center p-6 text-center">
          <div className="mb-5 text-4xl">{band?.icon} ✨</div>
          <h1 className="max-w-3xl text-3xl font-black tracking-tight sm:text-5xl">{mission.childVisual.title}</h1>
          {mission.childVisual.subtitle && <p className="mt-3 text-lg text-white/70">{mission.childVisual.subtitle}</p>}
          <div className="mt-10 grid w-full max-w-4xl grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
            {mission.childVisual.items.map((item, index) => (
              <div key={`${item}-${index}`} className="flex min-h-24 items-center justify-center rounded-[28px] border border-white/10 bg-white/10 p-3 text-3xl font-black shadow-2xl sm:min-h-28 sm:text-4xl">{item}</div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 pb-12">
      <section className="overflow-hidden rounded-[30px] border border-primary/15 bg-gradient-to-br from-primary/10 via-background to-amber-50/80 shadow-sm dark:to-amber-950/10">
        <div className="grid gap-5 p-5 sm:p-7 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="gap-1.5"><Sparkles className="h-3.5 w-3.5" /> Sonda Dez</Badge>
              <Badge variant="outline">10 minutos</Badge>
              <Badge variant="outline">estado somente em memória</Badge>
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-foreground sm:text-4xl">Avaliação direta pré-consulta</h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">Um roteiro guiado para a assistente: o app escolhe a faixa pela idade, prepara os materiais, mostra a fala exata, explica o que observar e registra pergunta por pergunta para revisão médica.</p>
          </div>
          <div className="hidden items-center gap-2 lg:flex" aria-hidden="true">
            {["🌱", "🚀", "🧭", "⭐"].map((icon) => <div key={icon} className="flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/15 bg-background/80 text-2xl shadow-sm">{icon}</div>)}
          </div>
        </div>
      </section>

      {phase === "setup" && (
        <div className="grid gap-5 lg:grid-cols-[1.25fr_.75fr]">
          <Card className="rounded-[26px] border-primary/15">
            <CardContent className="space-y-5 p-5 sm:p-7">
              <div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10"><Baby className="h-5 w-5 text-primary" /></div><div><h2 className="text-xl font-black">1. Quem vai fazer a Sonda?</h2><p className="text-sm text-muted-foreground">Use somente iniciais ou código interno.</p></div></div>
              <label className="block"><span className="text-sm font-bold">Iniciais/código <span className="font-normal text-muted-foreground">(opcional)</span></span><Input className="mt-2 h-12 rounded-xl" value={caseCode} onChange={(event) => setCaseCode(event.target.value.slice(0, 24))} placeholder="Ex.: A.L. ou CASO-07" /></label>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <label><span className="text-sm font-bold">Anos</span><Input type="number" min={0} max={17} className="mt-2 h-12 rounded-xl" value={years} onChange={(event) => setYears(event.target.value)} /></label>
                <label><span className="text-sm font-bold">Meses</span><Input type="number" min={0} max={11} className="mt-2 h-12 rounded-xl" value={months} onChange={(event) => setMonths(event.target.value)} /></label>
                <label className="col-span-2 sm:col-span-1"><span className="text-sm font-bold">Série/ano escolar</span><Input className="mt-2 h-12 rounded-xl" value={schoolYear} onChange={(event) => setSchoolYear(event.target.value)} placeholder="Ex.: 3º ano" /></label>
              </div>
              {band ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-100"><p className="text-xs font-bold uppercase tracking-wider">Trilha selecionada automaticamente</p><p className="mt-1 text-lg font-black">{band.icon} {band.label}</p><p className="mt-1 text-sm">{band.subtitle}</p></div>
              ) : (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-100">A Sonda Dez desta versão é aplicável de 12 meses a 17 anos e 11 meses. Revise a idade informada.</div>
              )}
              <div><p className="text-sm font-bold">Interferentes observados antes de iniciar</p><div className="mt-3 grid grid-cols-2 gap-2">{INTERFERENCES.map((item) => <button key={item} type="button" onClick={() => toggleInterference(item)} className={`min-h-12 rounded-xl border px-3 py-2 text-left text-sm font-semibold ${interferences.includes(item) ? "border-primary bg-primary/10 text-primary" : "border-border bg-background"}`}>{interferences.includes(item) && <Check className="mr-1 inline h-4 w-4" />}{item}</button>)}</div></div>
              <Button size="lg" className="h-13 w-full rounded-2xl" disabled={!band} onClick={() => { setMaterialsChecked({}); setPhase("materials"); }}>Ver materiais desta criança <ChevronRight className="ml-1 h-4 w-4" /></Button>
            </CardContent>
          </Card>

          <Card className="rounded-[26px] border-amber-200/80 bg-amber-50/60 dark:border-amber-900 dark:bg-amber-950/10">
            <CardContent className="space-y-4 p-5 sm:p-6">
              <div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-amber-700" /><h2 className="font-black">Guia rápido da aplicadora</h2></div>
              <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
                <p><strong className="text-foreground">DIGA</strong> exatamente o que aparece na tela. Não crie pistas extras.</p>
                <p><strong className="text-foreground">FAÇA</strong> o passo a passo na ordem. Só repita quando a missão autorizar.</p>
                <p><strong className="text-foreground">OBSERVE</strong> o comportamento, não tente adivinhar diagnóstico.</p>
                <p><strong className="text-foreground">REGISTRE</strong> o que aconteceu. Se não foi possível avaliar, use NA — nunca zero por conveniência.</p>
              </div>
              <div className="rounded-2xl bg-background p-4 text-xs leading-relaxed"><strong>Se houver sofrimento:</strong> não force. Interrompa a exigência, registre o interferente e use o alerta “não tolerou”.</div>
            </CardContent>
          </Card>
        </div>
      )}

      {phase === "materials" && band && (
        <Card className="rounded-[28px] border-primary/15">
          <CardContent className="p-5 sm:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex gap-3"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-50 dark:bg-cyan-950/20"><PackageCheck className="h-6 w-6 text-cyan-700 dark:text-cyan-300" /></div><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">2. Preparação</p><h2 className="text-2xl font-black">Separe apenas estes materiais</h2><p className="mt-1 text-sm text-muted-foreground">Faixa automática: {band.label}. Marque cada item quando estiver sobre a mesa.</p></div></div>
              <Badge variant="outline">{Object.values(materialsChecked).filter(Boolean).length}/{band.materials.length} prontos</Badge>
            </div>
            <div className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{band.materials.map((item) => { const checked = !!materialsChecked[item]; return <button key={item} type="button" onClick={() => setMaterialsChecked((current) => ({ ...current, [item]: !checked }))} className={`flex min-h-16 items-center gap-3 rounded-2xl border p-4 text-left transition ${checked ? "border-emerald-300 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/20" : "border-border bg-background hover:bg-muted/50"}`}><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${checked ? "bg-emerald-600 text-white" : "bg-muted text-muted-foreground"}`}>{checked ? <Check className="h-5 w-5" /> : "○"}</span><span className="text-sm font-bold">{item}</span></button>; })}</div>
            <div className="mt-6 rounded-2xl border border-primary/10 bg-primary/5 p-4 text-sm leading-relaxed"><strong>Antes de começar:</strong> deixe a mesa com poucos estímulos, posicione o tablet de modo que a aplicadora veja as instruções e preserve espaço para virar a “Tela da criança” quando a missão pedir.</div>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between"><Button variant="outline" className="h-12 rounded-xl" onClick={() => setPhase("setup")}><ChevronLeft className="mr-1 h-4 w-4" /> Voltar</Button><Button className="h-12 rounded-xl" disabled={!allMaterialsReady} onClick={beginRun}><Timer className="mr-1 h-4 w-4" /> Iniciar 10 minutos</Button></div>
          </CardContent>
        </Card>
      )}

      {phase === "run" && band && mission && (
        <>
          <div className="sticky top-2 z-30 overflow-hidden rounded-2xl border border-primary/20 bg-background/95 p-3 shadow-lg backdrop-blur sm:p-4">
            <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Combustível da Sonda</p><p className="text-xl font-black tabular-nums"><Seconds value={600 - globalElapsed} /></p></div><div className="text-right"><p className="text-xs text-muted-foreground">Missão {missionIndex + 1}/{band.missions.length}</p><p className="text-sm font-bold">{mission.start}–{mission.end}</p></div></div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-cyan-500 to-primary transition-all" style={{ width: `${Math.max(0, 100 - (globalElapsed / 600) * 100)}%` }} /></div>
          </div>

          <div className="flex flex-wrap items-center gap-3 rounded-2xl border p-4">
            <Button variant="outline" disabled={globalElapsed >= 600} onClick={() => setRunning((value) => !value)}>{running ? "Pausar" : "Retomar"}</Button>
            <Button variant="outline" className="h-auto whitespace-normal py-3" onClick={finish}>Encerrar e revisar registro parcial</Button>
            <p role="status" className="text-sm">{globalElapsed >= 600 ? "Tempo encerrado. Não force tarefas pendentes; revise e entregue o registro parcial." : !running ? "Aplicação pausada. Retome somente em condições adequadas." : `${completeCount}/${band.missions.length} missões preenchidas com contexto.`}</p>
          </div>
          {redFlags.length > 0 && <div className="flex flex-col gap-3 rounded-2xl border border-red-300 bg-red-50 p-4 text-red-950 dark:border-red-900 dark:bg-red-950/20 dark:text-red-100 sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-2"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-black">Alerta sinalizado: {redFlags.join(", ")}</p><p className="text-xs">Não force a tarefa. Se o cenário exigir interrupção, encerre e leve o registro ao médico.</p></div></div><Button variant="destructive" onClick={finish}>Encerrar e avisar médico</Button></div>}

          <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
            <main className="space-y-4">
              <Card className="rounded-[28px] border-primary/15">
                <CardContent className="p-5 sm:p-7">
                  <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2"><span className="text-2xl">{band.icon}</span><Badge variant="outline">{band.label}</Badge></div><h2 className="mt-2 text-2xl font-black tracking-tight">{mission.title}</h2></div><div className="rounded-2xl bg-muted px-4 py-2 text-center"><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">tempo da missão</p><p className="text-lg font-black tabular-nums"><Seconds value={missionElapsed} /> <span className="text-xs font-medium text-muted-foreground">/ <Seconds value={missionTargetSeconds} /></span></p></div></div>
                </CardContent>
              </Card>

              <section className="rounded-[28px] bg-slate-950 p-5 text-white shadow-xl sm:p-7"><div className="flex items-center gap-2 text-cyan-300"><MessageCircle className="h-5 w-5" /><p className="text-xs font-black uppercase tracking-[0.2em]">Diga exatamente</p></div><div className="mt-4 space-y-3">{mission.say.map((line) => <p key={line} className="text-2xl font-black leading-tight sm:text-3xl">“{line}”</p>)}</div></section>

              <div className="grid gap-4 md:grid-cols-2">
                <Card className="rounded-[24px]"><CardContent className="p-5"><div className="mb-3 flex items-center gap-2"><Hand className="h-5 w-5 text-primary" /><h3 className="text-xs font-black uppercase tracking-[0.18em]">Faça</h3></div><ol className="space-y-3">{mission.doSteps.map((step, index) => <li key={step} className="flex gap-3 text-sm leading-relaxed"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-black text-primary">{index + 1}</span><span>{step}</span></li>)}</ol></CardContent></Card>
                <Card className="rounded-[24px]"><CardContent className="p-5"><div className="mb-3 flex items-center gap-2"><PackageCheck className="h-5 w-5 text-primary" /><h3 className="text-xs font-black uppercase tracking-[0.18em]">Materiais agora</h3></div><div className="flex flex-wrap gap-2">{mission.materials.map((item) => <Badge key={item} variant="secondary" className="rounded-lg px-3 py-2">{item}</Badge>)}</div></CardContent></Card>
              </div>

              {mission.childVisual && <button type="button" onClick={() => setChildMode(true)} className="flex w-full items-center justify-between gap-4 rounded-[24px] border border-cyan-200 bg-cyan-50 p-5 text-left transition hover:-translate-y-0.5 hover:shadow-md dark:border-cyan-900 dark:bg-cyan-950/20"><div className="flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-600 text-white"><MonitorSmartphone className="h-6 w-6" /></div><div><p className="font-black">Abrir Tela da criança</p><p className="text-sm text-muted-foreground">Mostra só o estímulo, sem o texto da aplicadora.</p></div></div><ChevronRight className="h-5 w-5" /></button>}

              <Card className="rounded-[24px] border-amber-200/80 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/10"><CardContent className="p-5"><div className="mb-3 flex items-center gap-2"><Eye className="h-5 w-5 text-amber-700 dark:text-amber-300" /><h3 className="text-xs font-black uppercase tracking-[0.18em]">Observe</h3></div><div className="grid gap-2 sm:grid-cols-2">{mission.observe.map((item) => <div key={item} className="flex gap-2 rounded-xl bg-background/80 p-3 text-sm"><span aria-hidden="true">👀</span><span>{item}</span></div>)}</div></CardContent></Card>

              <Card className="rounded-[26px] border-primary/20 bg-primary/[0.025]"><CardContent className="space-y-3 p-5 sm:p-6"><div className="flex items-center gap-2"><ClipboardCheck className="h-5 w-5 text-primary" /><h3 className="text-xs font-black uppercase tracking-[0.18em]">Registre</h3></div>{mission.fields.map((field) => <FieldControl key={field.id} field={field} value={records[mission.id]?.values[field.id]} onChange={(value) => setField(mission.id, field.id, value)} />)}<label className="block rounded-2xl border border-border/70 bg-background p-3"><span className="text-sm font-bold">Observação livre <span className="font-normal text-muted-foreground">(obrigatória para motivo de NA ou ajuda P)</span></span><textarea className="mt-2 min-h-24 w-full resize-y rounded-xl border border-input bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring" value={records[mission.id]?.notes ?? ""} onChange={(event) => setNotes(mission.id, event.target.value)} placeholder="Descreva algo que não cabe nos botões, sem interpretar diagnóstico." /></label></CardContent></Card>

              <Card className="rounded-[24px] border-emerald-200/80 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/10"><CardContent className="p-5"><div className="mb-3 flex items-center gap-2"><Brain className="h-5 w-5 text-emerald-700 dark:text-emerald-300" /><h3 className="text-xs font-black uppercase tracking-[0.18em]">Como interpretar a reação?</h3></div><div className="space-y-2">{mission.interpretation.map((item) => <p key={item} className="text-sm leading-relaxed">{item}</p>)}</div><p className="mt-3 rounded-xl bg-background p-3 text-xs leading-relaxed text-muted-foreground"><strong className="text-foreground">Regra:</strong> a assistente descreve; o médico integra. Não transforme uma reação isolada em TEA, TDAH, atraso, deficiência ou qualquer diagnóstico.</p></CardContent></Card>

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between"><Button variant="outline" className="h-12 rounded-xl" disabled={missionIndex === 0} onClick={() => goMission(missionIndex - 1)}><ChevronLeft className="mr-1 h-4 w-4" /> Anterior</Button>{missionIndex + 1 < band.missions.length ? <Button className="h-12 rounded-xl" onClick={() => goMission(missionIndex + 1)}>Próxima missão <ChevronRight className="ml-1 h-4 w-4" /></Button> : <Button className="h-12 rounded-xl" onClick={finish}><CheckCircle2 className="mr-1 h-4 w-4" /> Finalizar e revisar</Button>}</div>
            </main>

            <aside className="space-y-4 lg:sticky lg:top-28 lg:self-start">
              <Card className="rounded-[24px]"><CardContent className="p-5"><h3 className="font-black">Legenda sem jargão</h3><div className="mt-3 space-y-2">{CODES.map((code) => <div key={code} className="rounded-xl bg-muted/60 p-3"><div className="flex items-center gap-2"><Badge className="min-w-9 justify-center">{code}</Badge><span className="text-sm font-bold">{CODE_LABELS[code]}</span></div><p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{CODE_MEANINGS[code]}</p></div>)}</div></CardContent></Card>
              <Card className="rounded-[24px] border-red-200/80 dark:border-red-900"><CardContent className="p-5"><div className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-red-600" /><h3 className="font-black">Alertas ao médico</h3></div><p className="mt-2 text-xs text-muted-foreground">Toque se surgir/for relatado durante a aplicação. Em sofrimento, pare a exigência.</p><div className="mt-3 space-y-2">{RED_FLAGS.map((flag) => <button key={flag} type="button" onClick={() => toggleFlag(flag)} className={`flex min-h-11 w-full items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs font-bold ${redFlags.includes(flag) ? "border-red-400 bg-red-50 text-red-800 dark:bg-red-950/30 dark:text-red-200" : "border-border bg-background"}`}>{redFlags.includes(flag) ? <CheckCircle2 className="h-4 w-4" /> : <span className="h-4 w-4 rounded-full border" />}{flag}</button>)}</div></CardContent></Card>
            </aside>
          </div>
        </>
      )}

      {phase === "report" && band && (
        <div className="space-y-5">
          <Card className="rounded-[28px] border-primary/15"><CardContent className="p-5 sm:p-7"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Resultado da aplicação</p><h2 className="mt-1 text-2xl font-black">Registro para revisão médica</h2><p className="mt-1 text-sm text-muted-foreground">{caseCode || "Sem código"} · {years}a {months}m · {band.label} · {schoolYear || "série não informada"}</p></div><Badge variant="outline">tempo registrado <Seconds value={globalElapsed} /></Badge></div></CardContent></Card>

          {redFlags.length > 0 && <div className="rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-950 dark:border-red-900 dark:bg-red-950/20 dark:text-red-100"><strong>Prioridade de revisão médica:</strong> {redFlags.join(", ")}.</div>}

          <div className="grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
            <div className="space-y-4">
              <Card className="rounded-[26px]"><CardContent className="p-5 sm:p-6"><div className="mb-4 flex items-center gap-2"><ClipboardCheck className="h-5 w-5 text-primary" /><h3 className="text-lg font-black">Registro completo</h3></div><div className="space-y-3">{band.missions.map((item, index) => { const record = records[item.id]; return <details key={item.id} className="group rounded-2xl border border-border/70 bg-background p-4" open={index === 0}><summary className="cursor-pointer list-none font-black">{index + 1}. {item.title} <span className="ml-2 text-xs font-medium text-muted-foreground">{item.start}–{item.end}</span></summary><div className="mt-4 space-y-3 text-sm"><div className="rounded-xl bg-slate-950 p-3 text-white"><p className="text-[10px] font-bold uppercase tracking-wider text-cyan-300">Fala/pergunta aplicada</p><p className="mt-1 font-semibold">{item.say.join(" / ")}</p></div>{item.fields.map((field) => <div key={field.id} className="flex flex-col justify-between gap-1 rounded-xl bg-muted/50 p-3 sm:flex-row"><span className="font-semibold">{field.label}</span><span className="font-black text-primary">{fieldValueText(field, record?.values[field.id])}</span></div>)}<div className="rounded-xl border border-dashed p-3 text-muted-foreground"><strong className="text-foreground">Observação livre:</strong> {record?.notes?.trim() || "não registrada"}</div></div></details>; })}</div></CardContent></Card>

              <Card className="rounded-[26px] border-emerald-200 dark:border-emerald-900"><CardContent className="p-5 sm:p-6"><div className="flex items-center gap-2"><Brain className="h-5 w-5 text-emerald-700 dark:text-emerald-300" /><h3 className="text-lg font-black">Síntese descritiva dos registros</h3></div><p className="mt-4 text-sm leading-7 text-foreground">{analysis}</p></CardContent></Card>
            </div>

            <aside className="space-y-4">
              <Card className={`rounded-[26px] ${auditFindings.length ? "border-red-300" : "border-emerald-300"}`}><CardContent className="p-5"><div className="flex items-center gap-2">{auditFindings.length ? <AlertTriangle className="h-5 w-5 text-red-600" /> : <ShieldCheck className="h-5 w-5 text-emerald-600" />}<h3 className="font-black">Portão de conferência</h3></div>{auditFindings.length ? <div className="mt-3 rounded-xl bg-red-50 p-3 text-xs text-red-900 dark:bg-red-950/20 dark:text-red-100">Bloqueado: a análise contém expressão normativa/diagnóstica proibida. Revise antes de copiar.</div> : <div className="mt-3 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-100"><strong>Conferência lexical concluída.</strong> Não substitui revisão clínica nem comprova completude do registro.</div>}<div className="mt-3 space-y-2 text-xs text-muted-foreground"><p>✓ sem percentil ou classificação normativa na análise</p><p>✓ sem ponto de corte</p><p>✓ sem confirmação diagnóstica automática</p><p>✓ dados não registrados permanecem “não registrado”</p></div></CardContent></Card>
              <Card className="rounded-[26px] border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/10"><CardContent className="p-5"><p className="text-sm font-black">Aviso obrigatório</p><p className="mt-2 text-xs leading-relaxed text-muted-foreground">Prova observacional clínica piloto. Não gera diagnóstico, percentil ou escore total. Interpretação integrada pelo médico.</p></CardContent></Card>
              <Button size="lg" className="h-13 w-full rounded-2xl" disabled={auditFindings.length > 0} onClick={copyReport}>{copied ? <CheckCircle2 className="mr-2 h-5 w-5" /> : <Copy className="mr-2 h-5 w-5" />}{copied ? "Copiado" : "Copiar resultado completo"}</Button>
              <Button variant="outline" className="h-12 w-full rounded-2xl" disabled={auditFindings.length > 0} onClick={downloadReport}>Baixar registro presencial</Button>
              {copyError && <p role="status" className="text-sm">{copyError}</p>}
              <label className="block text-sm font-bold">Registro presencial para copiar manualmente<textarea readOnly value={reportText} className="mt-2 min-h-64 w-full rounded-xl border bg-background p-3 text-sm font-normal" /></label>
              <div className="space-y-2"><p className="font-bold">Revisar pendências</p>{band.missions.map((item, i) => <Button key={item.id} variant="outline" className="h-auto w-full justify-start whitespace-normal text-left" onClick={() => { goMission(i); setPhase("run"); setRunning(false); }}>{item.title}: {coverage[i].complete ? "preenchida" : `${coverage[i].missing} campo(s) pendente(s)${coverage[i].needsContext ? "; falta contexto de NA/ajuda" : ""}`}</Button>)}</div>
              <Button variant="outline" className="h-12 w-full rounded-2xl" onClick={resetAll}><RotateCcw className="mr-2 h-4 w-4" /> Nova aplicação</Button>
            </aside>
          </div>
        </div>
      )}
    </div>
  );
}
