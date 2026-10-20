import { useState } from "react";
import { Check, ChevronLeft, ChevronRight, ClipboardCopy, Download, ExternalLink, RotateCcw, ShieldAlert, Stethoscope } from "lucide-react";
import { downloadTextDocument } from "@/lib/shareText";
import {
  buildCircuitReport, circuitForAge, CIRCUIT_VERSION, CIRCUIT_METHODS, CIRCUIT_SOURCES, CIRCUIT_STATUSES,
  CIRCUIT_URGENCY_NOTE, CIRCUIT_VIDEO_LINKS, COVERAGE_LABELS, coverageStatus, MSE_SECTIONS, NEURO_BASIC_DOMAINS,
  STATION_DEMO, type CircuitArea, type CircuitRecords, type CircuitSource, type CircuitStatus, type CoverageDomain, type CoverageStatus,
} from "./clinicalCircuit";
import { ClinicalDemo } from "./ClinicalDemo";
import { MISSOES } from "./missoes";
import {
  matrizSuficiencia, pendenciasParaRevisao, SUFICIENCIA_LABELS, textoProntidao,
  type BateriaResumo, type SuficienciaStatus,
} from "./sufficiencia";

type CircuitTab = CircuitArea | "cobertura";

/** Resultados em linguagem de jogo. Cada um corresponde a um estado clínico já existente. */
const RESULTADOS: readonly { status: CircuitStatus; label: string; dica: string }[] = [
  { status: "observado", label: "⭐ Conseguiu", dica: "Registrado como realizado" },
  { status: "achado", label: "🤔 Teve dificuldade", dica: "Vai para revisão do médico" },
  { status: "nao_colaborou", label: "🙅 Não quis agora", dica: "Sem colaboração suficiente" },
  { status: "nao_realizado", label: "🚫 Não deu para fazer", dica: "Não realizado" },
];

const COVERAGE_TONE: Record<CoverageStatus, string> = {
  sem_estacao: "bg-[var(--snp-paper-fixed)]",
  pendente: "bg-[var(--snp-paper-fixed)]",
  parcial: "bg-[var(--snp-sun-tint)]",
  registrado: "bg-[var(--snp-grass-tint)]",
  esclarecer: "bg-[var(--snp-berry-tint)]",
  nao_obtido: "bg-[var(--snp-paper-fixed)]",
};

function CoverageList({ title, domains, years, records }: { title: string; domains: readonly CoverageDomain[]; years: number; records: CircuitRecords }) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-black">{title}</h3>
      <ul className="space-y-2">
        {domains.map((domain) => {
          const status = coverageStatus(domain, years, records);
          const stations = circuitForAge(years).filter((task) => domain.stations.includes(task.id));
          return (
            <li key={domain.id} className="snp-panel snp-panel--soft p-3 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <span className="font-black">{domain.label}</span>
                <span className={`snp-chip ${COVERAGE_TONE[status]}`}>{COVERAGE_LABELS[status]}</span>
              </div>
              {stations.length > 0 && <p className="mt-1 text-xs font-semibold opacity-80">Estações: {stations.map((task) => task.title).join("; ")}</p>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

const SUFICIENCIA_TONE: Record<SuficienciaStatus, string> = {
  examinado: "bg-[var(--snp-grass-tint)]",
  a_esclarecer: "bg-[var(--snp-berry-tint)]",
  nao_obtido: "bg-[var(--snp-berry-tint)]",
  falta_exame_direto: "bg-[var(--snp-sun-tint)]",
  pendente_execucao: "bg-[var(--snp-sun-tint)]",
  depende_fonte_externa: "bg-[var(--snp-sky-tint)]",
  depende_decisao_medica: "bg-[var(--snp-paper-fixed)]",
  fora_do_jogo: "bg-[var(--snp-paper-fixed)]",
};

function MatrizList({ years, records, bateria }: { years: number; records: CircuitRecords; bateria: BateriaResumo | null }) {
  const linhas = matrizSuficiencia(years, records, bateria);
  const secoes = Array.from(new Set(linhas.map((linha) => linha.secao)));
  return (
    <div className="space-y-3" data-testid="super-neuropad-clinical-readiness">
      <h3 className="text-sm font-black">Prontidão para o laudo — matriz de suficiência</h3>
      <p className="text-xs font-semibold">
        Emissão automática: não. O jogo não preenche achados ausentes nem libera documentos. Itens de fonte externa e decisão médica permanecem pendentes até revisão do médico.
        Pendências para revisão: {pendenciasParaRevisao(linhas)} de {linhas.length}. São lembretes, não impedem o registro nem a emissão.
      </p>
      {secoes.map((secao) => (
        <div key={secao} className="space-y-2">
          <h4 className="text-xs font-black uppercase">{secao}</h4>
          <ul className="space-y-2">
            {linhas.filter((linha) => linha.secao === secao).map((linha) => (
              <li key={linha.id} className="snp-panel snp-panel--soft p-3 text-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <span className="font-semibold">{linha.label}</span>
                  <span className={`snp-chip ${SUFICIENCIA_TONE[linha.status]}`}>{SUFICIENCIA_LABELS[linha.status]}</span>
                </div>
                <p className="mt-1 text-xs font-semibold opacity-80">{linha.detalhe}</p>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

/**
 * Opcional e isolado da bateria principal: não entra em XP, contagem de itens,
 * resultado estatístico, PDF do jogo ou entrega automática à família.
 * Estado mantido em memória durante a passagem pelos seis mundos.
 * Nenhum controle trava o fluxo: cada missão pode ser registrada, revisada ou deixada em branco.
 */
export function ClinicalCircuit({ years, visible, bateria = null }: { years: number | null; visible: boolean; bateria?: BateriaResumo | null }) {
  const [tab, setTab] = useState<CircuitTab>("neurologico");
  const [active, setActive] = useState(0);
  const [statuses, setStatuses] = useState<Record<string, CircuitStatus>>({});
  const [marks, setMarks] = useState<Record<string, string[]>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [sources, setSources] = useState<Record<string, CircuitSource>>({});
  const [generalNote, setGeneralNote] = useState("");
  const [feedback, setFeedback] = useState("");
  const [anotacaoAberta, setAnotacaoAberta] = useState(false);
  const [orientacaoAberta, setOrientacaoAberta] = useState(false);
  const area: CircuitArea = tab === "mental" ? "mental" : "neurologico";
  const all = years === null ? [] : circuitForAge(years);
  const tasks = years === null ? [] : circuitForAge(years, area);
  const task = tasks[Math.min(active, tasks.length - 1)];
  const demo = task ? STATION_DEMO[task.id] : undefined;
  const recorded = all.filter((entry) => statuses[entry.id]).length;
  const countFor = (option: CircuitArea) => `${all.filter((entry) => entry.area === option && statuses[entry.id]).length}/${all.filter((entry) => entry.area === option).length}`;
  const anotacaoDe = (id: string) => [
    marks[id]?.length ? `Marcado: ${marks[id].join("; ")}.` : "",
    (notes[id] || "").trim(),
  ].filter(Boolean).join(" ");
  const records: CircuitRecords = Object.fromEntries(all.filter((entry) => statuses[entry.id]).map((entry) =>
    [entry.id, { status: statuses[entry.id], note: anotacaoDe(entry.id), source: sources[entry.id] }]));
  const report = years === null ? "" : `${buildCircuitReport(years, records, generalNote)}\n\n${textoProntidao(years, matrizSuficiencia(years, records, bateria)).join("\n")}`;
  if (years === null || !all.length) return null;
  const previous = () => { setActive((index) => Math.max(0, index - 1)); setFeedback(""); };
  const next = () => { setActive((index) => Math.min(tasks.length - 1, index + 1)); setFeedback(""); };
  const escolherResultado = (status: CircuitStatus) => {
    setStatuses((prior) => ({ ...prior, [task.id]: status }));
    if (task.method !== "entrevista") setSources((prior) => ({ ...prior, [task.id]: prior[task.id] ?? "examinador" }));
    setFeedback("");
  };
  const alternarPista = (pista: string) => {
    setMarks((prior) => {
      const atuais = prior[task.id] ?? [];
      return { ...prior, [task.id]: atuais.includes(pista) ? atuais.filter((item) => item !== pista) : [...atuais, pista] };
    });
    setFeedback("");
  };
  const copyReport = async () => {
    try {
      await navigator.clipboard.writeText(report);
      setFeedback("Registro copiado. Revise antes de incorporar ao prontuário.");
    } catch {
      downloadTextDocument(report, `super-neuropad-circuito-${years}a.txt`);
      setFeedback("Área de transferência indisponível; TXT baixado no dispositivo.");
    }
  };
  const reset = () => {
    if (!window.confirm("Apagar apenas as observações do circuito complementar desta criança? A bateria principal não será alterada.")) return;
    setStatuses({}); setMarks({}); setNotes({}); setSources({}); setGeneralNote(""); setActive(0); setTab("neurologico"); setFeedback("");
  };
  const missao = task ? MISSOES[task.id] : undefined;
  const pistasMarcadas = task ? (marks[task.id] ?? []) : [];
  return (
    <section id="snp-clinical-circuit" className={visible ? "snp-panel space-y-4 p-4 sm:p-6" : "hidden"} aria-label="Circuito clínico complementar" data-testid="super-neuropad-clinical-circuit">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="snp-pixel flex items-center gap-2 text-base"><Stethoscope className="h-5 w-5" /> Missões clínicas extras</h2>
          <p className="mt-2 max-w-3xl text-sm font-semibold">
            Circuito opcional de exame neurológico e estado mental · v{CIRCUIT_VERSION} · {years} anos. Supervisão profissional.
            Não altera os seis mundos, o tempo da partida, XP ou pontuação. Nenhuma tarefa isolada estabelece diagnóstico.
          </p>
        </div>
        <span className="snp-chip bg-[var(--snp-sun-tint)]" aria-live="polite">{recorded}/{all.length} missões registradas</span>
      </div>
      <div className="snp-panel snp-panel--soft p-3 text-xs font-semibold" role="note">
        <ShieldAlert className="mr-1 inline-block h-4 w-4" />
        Atividade lúdica de observação: avise o responsável antes de iniciar. Os toques registram o que foi percebido, a anotação livre é opcional e nenhuma etapa trava a próxima.
        Exame presencial é feito pelo profissional para inferir força, tônus, reflexos, pares cranianos ou sensibilidade. Vídeos e animações são demonstrações da técnica, nunca gravações da criança.
      </div>
      <div className="snp-panel snp-panel--soft p-3 text-xs font-semibold" role="note" data-testid="super-neuropad-clinical-urgency">
        <ShieldAlert className="mr-1 inline-block h-4 w-4" />
        <strong>Sinais de urgência:</strong> {CIRCUIT_URGENCY_NOTE}
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Área clínica">
        {([
          { key: "neurologico", label: `🧠 Exame neurológico · ${countFor("neurologico")}` },
          { key: "mental", label: `💬 Estado mental · ${countFor("mental")}` },
          { key: "cobertura", label: "🧭 Cobertura e lacunas" },
        ] as const).map((option) => (
          <button key={option.key} type="button" aria-pressed={tab === option.key} onClick={() => { setTab(option.key); setActive(0); setFeedback(""); }}
            className={`snp-option min-h-11 px-4 py-2 text-sm font-black ${tab === option.key ? "bg-[var(--snp-sun)]" : "bg-[var(--snp-paper-fixed)]"}`}>
            {option.label}
          </button>
        ))}
      </div>
      {tab === "cobertura" ? (
        <div className="snp-panel snp-panel--soft space-y-4 p-4" data-testid="super-neuropad-clinical-coverage">
          <p className="text-sm font-semibold">
            A cobertura mostra somente o que foi registrado. Pendente, parcial ou não realizado não significa normal nem alterado.
          </p>
          <CoverageList title="Exame neurológico básico — domínios" domains={NEURO_BASIC_DOMAINS} years={years} records={records} />
          <CoverageList title="Exame do estado mental — seções" domains={MSE_SECTIONS} years={years} records={records} />
          <MatrizList years={years} records={records} bateria={bateria} />
        </div>
      ) : task && missao ? (
        <article className="snp-panel snp-panel--soft space-y-4 p-4" data-testid="super-neuropad-clinical-station">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="snp-chip">Missão {active + 1} de {tasks.length} · {task.domain}</span>
            <span className="snp-chip">{CIRCUIT_METHODS[task.method]}</span>
          </div>
          <h3 className="text-xl font-black">{task.emoji} {task.title}</h3>
          <div className="space-y-2">
            <h4 className="text-sm font-black">{task.method === "presencial" ? "Passo a passo do examinador" : "Passo a passo da brincadeira"}</h4>
            <ol className="space-y-2">
              {missao.passos.map((passo, index) => (
                <li key={passo} className="flex gap-3 rounded-xl bg-white p-3 text-sm font-semibold text-[var(--snp-ink-fixed)]">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--snp-sun)] font-black">{index + 1}</span>
                  <span>{passo}</span>
                </li>
              ))}
            </ol>
          </div>
          {demo && <ClinicalDemo kind={demo} />}
          {task.safety && <div className="rounded-xl border-2 border-amber-700 bg-amber-50 p-3 text-sm font-semibold text-amber-950" role="alert">{task.safety}</div>}
          {task.video && <a className="snp-chip inline-flex min-h-11 items-center gap-2 bg-[var(--snp-sky-tint)]"
            href={CIRCUIT_VIDEO_LINKS[task.video].url} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer">
            <ExternalLink className="h-4 w-4" /> Ver vídeo demonstrativo: {CIRCUIT_VIDEO_LINKS[task.video].label}
          </a>}
          <fieldset className="space-y-2">
            <legend className="text-sm font-black">Toque no que você percebeu (pode marcar mais de um)</legend>
            <div className="flex flex-wrap gap-2">
              {missao.pistas.map((pista) => (
                <button key={pista} type="button" aria-pressed={pistasMarcadas.includes(pista)} onClick={() => alternarPista(pista)}
                  className={`snp-option min-h-11 px-3 py-2 text-left text-xs font-semibold ${pistasMarcadas.includes(pista) ? "bg-[var(--snp-sky-tint)]" : "bg-[var(--snp-paper-fixed)]"}`}>
                  {pistasMarcadas.includes(pista) ? "✓ " : ""}{pista}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset className="space-y-2">
            <legend className="text-sm font-black">Como foi?</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {RESULTADOS.map((opcao) => (
                <button key={opcao.status} type="button" aria-pressed={statuses[task.id] === opcao.status} onClick={() => escolherResultado(opcao.status)}
                  className={`snp-option flex min-h-14 flex-col items-start gap-1 px-3 py-2 text-left text-sm font-black ${statuses[task.id] === opcao.status ? (opcao.status === "achado" ? "bg-[var(--snp-berry-tint)]" : "bg-[var(--snp-grass-tint)]") : "bg-[var(--snp-paper-fixed)]"}`}>
                  <span>{opcao.label}</span>
                  <span className="text-xs font-semibold opacity-80">{opcao.dica}</span>
                </button>
              ))}
            </div>
            {pistasMarcadas.length > 0 && !statuses[task.id] && <p className="text-xs font-semibold">Escolha o resultado para incluir esta missão no registro.</p>}
          </fieldset>
          <fieldset className="space-y-2">
            <legend className="text-sm font-black">Quem informou (opcional)</legend>
            <div className="flex flex-wrap gap-2">
              {(Object.entries(CIRCUIT_SOURCES) as [CircuitSource,string][]).map(([key,label]) =>
                <button key={key} type="button" aria-pressed={sources[task.id] === key}
                  onClick={() => { setSources((prior) => ({...prior,[task.id]:key})); setFeedback(""); }}
                  className={`snp-option min-h-11 px-3 py-2 text-left text-xs font-semibold ${sources[task.id] === key ? "bg-[var(--snp-sky-tint)]" : "bg-[var(--snp-paper-fixed)]"}`}>
                  {label}
                </button>)}
            </div>
          </fieldset>
          <div className="space-y-2">
            <button type="button" aria-expanded={anotacaoAberta} onClick={() => setAnotacaoAberta((aberta) => !aberta)}
              className="snp-option min-h-11 px-4 py-2 text-left text-sm font-black bg-[var(--snp-paper-fixed)]">{anotacaoAberta ? "▾" : "▸"} Anotação livre (opcional)</button>
            {anotacaoAberta && (
              <textarea rows={3} maxLength={1800} value={notes[task.id] || ""} onChange={(event) => setNotes((prior) => ({ ...prior, [task.id]:event.target.value }))}
                className="w-full rounded-xl border-2 border-[var(--snp-ink-fixed)] bg-white p-3 text-sm font-normal text-[var(--snp-ink-fixed)]"
                placeholder="Fatos observados, condições, lateralidade e limitações. Evite identificadores pessoais." />
            )}
          </div>
          <div className="space-y-2 text-sm">
            <button type="button" aria-expanded={orientacaoAberta} onClick={() => setOrientacaoAberta((aberta) => !aberta)}
              className="snp-option min-h-11 px-4 py-2 text-left text-xs font-black bg-[var(--snp-paper-fixed)]">{orientacaoAberta ? "▾" : "▸"} Orientação clínica completa</button>
            {orientacaoAberta && <p className="font-semibold leading-relaxed">{task.guide}</p>}
          </div>
          <p className="text-xs font-semibold opacity-80"><strong>Documentar:</strong> {task.observe}</p>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button type="button" onClick={previous}
              className="snp-btn snp-btn--paper inline-flex min-h-11 items-center gap-1 px-4 py-2 text-sm"><ChevronLeft className="h-4 w-4" /> Anterior</button>
            <select aria-label="Ir para estação" value={active} onChange={(event) => setActive(Number(event.target.value))}
              className="min-w-0 max-w-52 rounded-xl border-2 border-[var(--snp-ink-fixed)] bg-white p-2 text-sm text-[var(--snp-ink-fixed)]">
              {tasks.map((entry,index) => <option key={entry.id} value={index}>{index + 1}. {entry.title}{statuses[entry.id] ? " ✓" : ""}</option>)}
            </select>
            <button type="button" onClick={next}
              className="snp-btn snp-btn--sky inline-flex min-h-11 items-center gap-1 px-4 py-2 text-sm">Próxima <ChevronRight className="h-4 w-4" /></button>
          </div>
        </article>
      ) : task && (
        <article className="snp-panel snp-panel--soft space-y-3 p-4" data-testid="super-neuropad-clinical-station">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="snp-chip">Estação {active + 1} de {tasks.length} · {task.domain}</span>
            <span className="snp-chip">{CIRCUIT_METHODS[task.method]}</span>
          </div>
          <h3 className="text-xl font-black">{task.emoji} {task.title}</h3>
          <p className="text-sm font-semibold leading-relaxed">{task.guide}</p>
          <p className="text-sm"><strong>Descrever:</strong> {task.observe}</p>
          {task.safety && <div className="rounded-xl border-2 border-amber-700 bg-amber-50 p-3 text-sm font-semibold text-amber-950" role="alert">{task.safety}</div>}
          <fieldset className="space-y-2">
            <legend className="text-sm font-black">Resultado observado — selecione somente após executar</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {(Object.entries(CIRCUIT_STATUSES) as [CircuitStatus,string][]).map(([key,label]) =>
                <button key={key} type="button" aria-pressed={statuses[task.id] === key}
                  onClick={() => { setStatuses((prior) => ({...prior,[task.id]:key})); setFeedback(""); }}
                  className={`snp-option flex min-h-11 items-center gap-2 px-3 py-2 text-left text-sm font-semibold ${statuses[task.id] === key ? (key === "achado" ? "bg-[var(--snp-berry-tint)]" : "bg-[var(--snp-grass-tint)]") : "bg-[var(--snp-paper-fixed)]"}`}>
                  {statuses[task.id] === key ? <Check className="h-4 w-4 shrink-0" /> : <span aria-hidden="true" className="h-4 w-4 shrink-0" />} {label}
                </button>)}
            </div>
          </fieldset>
          <fieldset className="space-y-2">
            <legend className="text-sm font-black">Fonte da informação deste registro</legend>
            <div className="flex flex-wrap gap-2">
              {(Object.entries(CIRCUIT_SOURCES) as [CircuitSource,string][]).map(([key,label]) =>
                <button key={key} type="button" aria-pressed={sources[task.id] === key}
                  onClick={() => { setSources((prior) => ({...prior,[task.id]:key})); setFeedback(""); }}
                  className={`snp-option min-h-11 px-3 py-2 text-left text-xs font-semibold ${sources[task.id] === key ? "bg-[var(--snp-sky-tint)]" : "bg-[var(--snp-paper-fixed)]"}`}>
                  {label}
                </button>)}
            </div>
          </fieldset>
          <label className="block text-sm font-black">Achados objetivos ou motivo de não realização
            <textarea rows={3} maxLength={1800} value={notes[task.id] || ""} onChange={(event) => setNotes((prior) => ({ ...prior, [task.id]:event.target.value }))}
              className="mt-2 w-full rounded-xl border-2 border-[var(--snp-ink-fixed)] bg-white p-3 text-sm font-normal text-[var(--snp-ink-fixed)]"
              placeholder="Somente fatos efetivamente observados, condições, lateralidade, colaboração e limitações. Evite identificadores pessoais." />
          </label>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button type="button" onClick={previous}
              className="snp-btn snp-btn--paper inline-flex min-h-11 items-center gap-1 px-4 py-2 text-sm"><ChevronLeft className="h-4 w-4" /> Anterior</button>
            <select aria-label="Ir para estação" value={active} onChange={(event) => setActive(Number(event.target.value))}
              className="min-w-0 max-w-52 rounded-xl border-2 border-[var(--snp-ink-fixed)] bg-white p-2 text-sm text-[var(--snp-ink-fixed)]">
              {tasks.map((entry,index) => <option key={entry.id} value={index}>{index + 1}. {entry.title}{statuses[entry.id] ? " ✓" : ""}</option>)}
            </select>
            <button type="button" onClick={next}
              className="snp-btn snp-btn--sky inline-flex min-h-11 items-center gap-1 px-4 py-2 text-sm">Próxima <ChevronRight className="h-4 w-4" /></button>
          </div>
        </article>
      )}
      <label className="block text-sm font-black">Síntese adicional do examinador (opcional)
        <textarea rows={2} maxLength={2000} value={generalNote} onChange={(event) => setGeneralNote(event.target.value)}
          className="mt-2 w-full rounded-xl border-2 border-[var(--snp-ink-fixed)] bg-white p-3 text-sm font-normal text-[var(--snp-ink-fixed)]"
          placeholder="Limitações, necessidade de exame dirigido ou informações de fonte distinta, com proveniência." />
      </label>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => void copyReport()}
          className="snp-btn snp-btn--sun inline-flex min-h-11 items-center gap-2 px-4 py-2 text-sm"><ClipboardCopy className="h-4 w-4" /> Copiar registro clínico</button>
        <button type="button" onClick={() => { downloadTextDocument(report, `super-neuropad-circuito-${years}a.txt`); setFeedback("TXT clínico salvo localmente. Revise antes de incorporar ao prontuário."); }}
          className="snp-btn snp-btn--paper inline-flex min-h-11 items-center gap-2 px-4 py-2 text-sm"><Download className="h-4 w-4" /> Baixar TXT</button>
        <button type="button" onClick={reset}
          className="snp-btn snp-btn--slate inline-flex min-h-11 items-center gap-2 px-4 py-2 text-sm"><RotateCcw className="h-4 w-4" /> Limpar circuito</button>
      </div>
      {feedback && <p className="text-xs font-semibold" role="status">{feedback}</p>}
      <p className="text-xs font-semibold opacity-80">Os registros permanecem apenas em memória até cópia ou exportação explícita. Não são anexados ao PDF da aventura nem enviados à família. Ao trocar de paciente/idade, são apagados. A avaliação médica integra dados de história, exame e fontes externas.</p>
    </section>
  );
}
