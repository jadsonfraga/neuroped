import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useClinic } from "@/contexts/ClinicContext";
import { Check, ChevronLeft, ChevronRight, ClipboardCopy, Download, ExternalLink, RotateCcw, ShieldAlert, Stethoscope } from "lucide-react";
import { downloadTextDocument } from "@/lib/shareText";
import {
  buildCircuitReport, circuitForAge, fontesDaTarefa, missoesPreConsulta, textoPreConsulta, EXECUTOR_LABELS, CIRCUIT_VERSION, CIRCUIT_METHODS, CIRCUIT_SOURCES, CIRCUIT_STATUSES,
  CIRCUIT_URGENCY_NOTE, CIRCUIT_VIDEO_LINKS, COVERAGE_LABELS, coverageStatus, notaDeEstacao, MSE_SECTIONS, NEURO_BASIC_DOMAINS,
  STATION_DEMO, type CircuitArea, type CircuitRecords, type CircuitSource, type CircuitStatus, type CoverageDomain, type CoverageStatus,
} from "./clinicalCircuit";
import { ClinicalDemo } from "./ClinicalDemo";
import { MISSOES } from "./missoes";
import {
  CAMPO_LABELS, camposPendentes, detalheObrigatorio, linhaObrigatorio, resumoObrigatorio,
  type EstadoMissao, type ResumoObrigatorio,
} from "./obrigatorio";

/** Progresso da estrutura obrigatória, repassado à página para aparecer em todo o fluxo. */
export interface ProgressoCircuito { concluidas: number; total: number; completo: boolean }

const ESTADO_TONE: Record<EstadoItem, string> = {
  coletado: "bg-[var(--snp-grass-tint)]",
  achado_a_esclarecer: "bg-[var(--snp-berry-tint)]",
  fonte_externa: "bg-[var(--snp-sky-tint)]",
  pendente: "bg-[var(--snp-paper-fixed)]",
};

/** Guias de coleta por hipótese. Organizam dados a coletar; não pontuam nem estabelecem diagnóstico. */
function HipotesesPanel({ years, records }: { years: number; records: CircuitRecords }) {
  const guias = guiasAplicaveis(years);
  if (!guias.length) return null;
  return (
    <div className="space-y-3" data-testid="super-neuropad-clinical-hypotheses">
      <h3 className="text-sm font-black">Hipóteses em investigação: dados a coletar</h3>
      <p className="text-xs font-semibold">
        Guias para o médico. Não pontuam e não estabelecem diagnóstico; a conclusão depende de história longitudinal, de mais de um contexto e de avaliação clínica.
      </p>
      {guias.map((guia) => (
        <article key={guia.id} className="snp-panel snp-panel--soft space-y-2 p-3">
          <h4 className="text-sm font-black">{guia.titulo}</h4>
          <p className="text-xs font-semibold opacity-80">{guia.objetivo}</p>
          <ul className="space-y-2">
            {guia.itens.map((item) => {
              const estado = estadoItem(item, years, records);
              return (
                <li key={item.id} className="flex flex-wrap items-start justify-between gap-2 text-sm">
                  <span>{item.texto}</span>
                  <span className={`snp-chip ${ESTADO_TONE[estado]}`}>{ESTADO_ITEM_LABELS[estado]}</span>
                </li>
              );
            })}
          </ul>
        </article>
      ))}
    </div>
  );
}
import { dicaDeMissaoPorIdade, perfilAnual } from "./ageAdaptation";
import { podeVerModoMedico } from "./acessoMedico";
import {
  linhasDeRevisao, matrizSuficiencia, pendenciasParaRevisao, SUFICIENCIA_LABELS, textoProntidao, URGENCIA_ALERTA, urgenciaAtiva,
  type BateriaResumo, type SuficienciaStatus,
} from "./sufficiencia";
import { ESTADO_ITEM_LABELS, estadoItem, guiasAplicaveis, type EstadoItem } from "./hipoteses";

type CircuitTab = CircuitArea | "medico" | "cobertura";

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

/** Situação da missão atual: concluída ou com campos obrigatórios pendentes. Informa, não trava. */
function MissaoStatus({ faltam }: { faltam: readonly (keyof typeof CAMPO_LABELS)[] }) {
  const concluida = faltam.length === 0;
  return (
    <p role="status" data-testid="super-neuropad-mission-status"
      className={`rounded-xl border-2 p-3 text-xs font-bold ${concluida ? "border-[var(--snp-ink-40)] bg-white text-[var(--snp-ink-fixed)]" : "border-amber-700 bg-amber-50 text-amber-950"}`}>
      {concluida
        ? "✅ Missão concluída: campos obrigatórios preenchidos."
        : `⏳ Obrigatório ainda pendente nesta missão: ${faltam.map((campo) => CAMPO_LABELS[campo]).join("; ")}.`}
    </p>
  );
}

/** Missões obrigatórias que ainda faltam. Cada item leva direto à missão; nada é desabilitado. */
function ObrigatoriosPanel({ resumo, onIr }: { resumo: ResumoObrigatorio; onIr: (id: string) => void }) {
  return (
    <div className="space-y-2" data-testid="super-neuropad-clinical-mandatory">
      <h3 className="text-sm font-black">Estrutura obrigatória — {resumo.concluidas} de {resumo.total} missões concluídas</h3>
      <p className="text-xs font-semibold">
        Toda missão exige resultado e quem informou; a missão realizada exige marcador ou descrição; “Teve dificuldade” exige descrição do achado; a síntese final do examinador também é obrigatória.
        O circuito consta como {resumo.completo ? "COMPLETO" : "INCOMPLETO"} no relatório. Nada é desabilitado e a decisão de emitir o laudo continua sendo do médico.
      </p>
      {resumo.pendencias.length === 0 ? (
        <p className="snp-chip bg-[var(--snp-grass-tint)]">✅ Todas as missões obrigatórias estão concluídas.</p>
      ) : (
        <ul className="space-y-2">
          {resumo.pendencias.map((pendencia) => (
            <li key={pendencia.id} className="snp-panel snp-panel--soft flex flex-wrap items-start justify-between gap-2 p-3 text-sm">
              <span><strong>{pendencia.titulo}</strong>: falta {pendencia.faltam.map((campo) => CAMPO_LABELS[campo]).join("; ")}.</span>
              <button type="button" onClick={() => onIr(pendencia.id)} className="snp-btn snp-btn--sky inline-flex min-h-11 items-center px-3 py-2 text-xs">Ir para a missão</button>
            </li>
          ))}
        </ul>
      )}
      {!resumo.sinteseFeita && <p className="text-xs font-semibold">Falta a síntese final do examinador (campo no fim desta seção).</p>}
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
      {urgenciaAtiva(linhas) && (
        <div className="rounded-xl border-2 border-amber-700 bg-amber-50 p-3 text-sm font-semibold text-amber-950" role="alert">
          {URGENCIA_ALERTA}
        </div>
      )}
      <p className="text-xs font-semibold">
        Emissão automática: não. O jogo não preenche achados ausentes nem libera documentos. Itens de fonte externa e decisão médica permanecem pendentes até revisão do médico.
        Pendências para revisão: {pendenciasParaRevisao(linhas)} de {linhasDeRevisao(linhas).length}. São lembretes, não impedem o registro nem a emissão.
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
 * Parte obrigatória da avaliação, isolada da pontuação da bateria principal: não entra em XP,
 * contagem de itens, resultado estatístico, PDF do jogo ou entrega automática à família.
 * Estado mantido em memória durante a passagem pelos seis mundos.
 * Toda missão tem campos obrigatórios (ver obrigatorio.ts) e o circuito é declarado COMPLETO ou INCOMPLETO.
 * Obrigatório não trava a interface: nenhum controle é desabilitado e a navegação é livre.
 */
type CircuitoProps = {
  years: number | null; visible: boolean; bateria?: BateriaResumo | null; onProgresso?: (progresso: ProgressoCircuito | null) => void;
  onDirtyChange?: (dirty: boolean) => void;
};

/**
 * Entrada do circuito. A sessão decide o modo médico; trocar de sessão remonta o circuito, para que
 * registros de um proprietário não permaneçam na tela depois do logout ou de outra conta.
 */
export function ClinicalCircuit(props: CircuitoProps) {
  const { accessMode, isAuthenticated, user } = useAuth();
  const { activeClinic } = useClinic();
  const modoMedico = podeVerModoMedico({
    accessMode,
    isAuthenticated,
    mustChangePassword: user?.mustChangePassword,
    clinicRole: activeClinic?.role,
    clinicStatus: activeClinic?.status,
  });
  return <CircuitoClinico key={modoMedico ? "modo-medico" : "pre-consulta"} {...props} modoMedico={modoMedico} />;
}

function CircuitoClinico({ years, visible, bateria = null, onProgresso, onDirtyChange, modoMedico }: CircuitoProps & { modoMedico: boolean }) {
  const [tabEscolhida, setTab] = useState<CircuitTab>("neurologico");
  // Sem o modo médico, abas do médico e cobertura não existem: a tela cai na pré-consulta.
  const tab: CircuitTab = modoMedico || (tabEscolhida !== "medico" && tabEscolhida !== "cobertura") ? tabEscolhida : "neurologico";
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
  const all = years === null ? [] : missoesPreConsulta(years);
  const todas = years === null ? [] : circuitForAge(years);
  const doMedico = modoMedico ? todas.filter((entry) => entry.executor === "medico") : [];
  const tasks = years === null ? [] : tab === "medico" ? doMedico : missoesPreConsulta(years, area);
  const task = tasks[Math.min(active, tasks.length - 1)];
  const demo = task ? STATION_DEMO[task.id] : undefined;
  const estados: Record<string, EstadoMissao> = Object.fromEntries(todas.map((entry) =>
    [entry.id, { status: statuses[entry.id], source: sources[entry.id], marcadores: marks[entry.id] ?? [], descricao: notes[entry.id] ?? "" }]));
  const resumo = years === null ? null : resumoObrigatorio(years, estados, generalNote);
  const faltamDe = (id: string) => camposPendentes(estados[id] ?? {});
  const marcaDe = (id: string) => (faltamDe(id).length === 0 ? " ✓" : statuses[id] ? " ⚠" : "");
  const countFor = (option: CircuitArea) => `${all.filter((entry) => entry.area === option && faltamDe(entry.id).length === 0).length}/${all.filter((entry) => entry.area === option).length}`;
  const anotacaoDe = (id: string) => notaDeEstacao(statuses[id], marks[id] ?? [], notes[id] ?? "");
  const records: CircuitRecords = Object.fromEntries(todas.filter((entry) => statuses[entry.id]).map((entry) =>
    [entry.id, { status: statuses[entry.id], note: anotacaoDe(entry.id), source: sources[entry.id], descricao: notes[entry.id] || "" }]));
  const report = years === null || !resumo ? ""
    : `${buildCircuitReport(years, records, generalNote, new Date(), [linhaObrigatorio(resumo)])}\n\n${detalheObrigatorio(resumo).join("\n")}\n\n${textoProntidao(years, matrizSuficiencia(years, records, bateria)).join("\n")}`;
  const relatorioPreConsulta = years === null ? "" : textoPreConsulta(years, records);
  const progressoConcluidas = resumo ? resumo.concluidas : null;
  const progressoTotal = resumo ? resumo.total : null;
  const progressoCompleto = resumo ? resumo.completo : null;
  const dirty = Object.keys(statuses).length > 0
    || Object.keys(marks).length > 0
    || Object.keys(notes).length > 0
    || Object.keys(sources).length > 0
    || generalNote.trim().length > 0;
  useEffect(() => {
    onProgresso?.(progressoConcluidas === null || progressoTotal === null || progressoCompleto === null
      ? null : { concluidas: progressoConcluidas, total: progressoTotal, completo: progressoCompleto });
  }, [onProgresso, progressoConcluidas, progressoTotal, progressoCompleto]);
  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);
  if (years === null || !all.length || !resumo) return null;
  const irParaMissao = (id: string) => {
    const alvo = all.find((entry) => entry.id === id);
    if (!alvo) return;
    setTab(alvo.area);
    setActive(Math.max(0, missoesPreConsulta(years, alvo.area).findIndex((entry) => entry.id === id)));
    setFeedback("");
  };
  const previous = () => { setActive((index) => Math.max(0, index - 1)); setFeedback(""); };
  const next = () => { setActive((index) => Math.min(tasks.length - 1, index + 1)); setFeedback(""); };
  const escolherResultado = (status: CircuitStatus) => {
    setStatuses((prior) => ({ ...prior, [task.id]: status }));
    if (status === "achado") setAnotacaoAberta(true);
    if (status === "nao_realizado" || status === "nao_colaborou") setMarks((prior) => ({ ...prior, [task.id]: [] }));
    setFeedback("");
  };
  const alternarPista = (pista: string) => {
    setMarks((prior) => {
      const atuais = prior[task.id] ?? [];
      return { ...prior, [task.id]: atuais.includes(pista) ? atuais.filter((item) => item !== pista) : [...atuais, pista] };
    });
    setFeedback("");
  };
  const copyReport = async (texto: string) => {
    try {
      await navigator.clipboard.writeText(texto);
      setFeedback("Registro copiado. Revise antes de incorporar ao prontuário.");
    } catch {
      setFeedback("Área de transferência indisponível. Use Baixar TXT se desejar salvar o registro; nenhum arquivo foi criado automaticamente.");
    }
  };
  const reset = () => {
    if (!window.confirm("Apagar apenas as observações do circuito complementar desta criança? A bateria principal não será alterada.")) return;
    setStatuses({}); setMarks({}); setNotes({}); setSources({}); setGeneralNote(""); setActive(0); setTab("neurologico"); setFeedback("");
  };
  const missao = task ? MISSOES[task.id] : undefined;
  const perfil = perfilAnual(years);
  const minutosTotal = all.reduce((soma, entry) => soma + (MISSOES[entry.id]?.minutos ?? 3), 0);
  const dicaEtaria = task ? dicaDeMissaoPorIdade(years, task) : null;
  const pistasMarcadas = task ? (marks[task.id] ?? []) : [];
  return (
    <section id="snp-clinical-circuit" className={visible ? "snp-panel space-y-4 p-4 sm:p-6" : "hidden"} aria-label="Circuito clínico complementar" data-testid="super-neuropad-clinical-circuit">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="snp-pixel flex items-center gap-2 text-base"><Stethoscope className="h-5 w-5" /> Missões da pré-consulta · auxiliar e secretaria</h2>
          <p className="mt-2 max-w-3xl text-sm font-semibold">
            {resumo.total} brincadeiras curtas para {years} anos, em cerca de {minutosTotal} min. Leia o convite em voz alta, observe e toque no que viu: não precisa saber de neurologia.
            Não altera os seis mundos, o XP ou a pontuação, e nenhuma missão conclui diagnóstico · v{CIRCUIT_VERSION}.
          </p>
        </div>
        <span className="snp-chip bg-[var(--snp-sun-tint)]" aria-live="polite">⭐ {resumo.concluidas}/{resumo.total} missões concluídas</span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full border-2 border-[var(--snp-ink-fixed)] bg-[var(--snp-paper-fixed)]" role="progressbar"
        aria-label="Missões concluídas" aria-valuemin={0} aria-valuemax={resumo.total} aria-valuenow={resumo.concluidas}>
        <div className="h-full bg-[var(--snp-sun)] transition-all" style={{ width: `${resumo.total ? Math.round((resumo.concluidas / resumo.total) * 100) : 0}%` }} />
      </div>
      <div className="snp-panel snp-panel--soft p-3 text-xs font-semibold" role="note">
        <ShieldAlert className="mr-1 inline-block h-4 w-4" />
        Avise o responsável antes de começar. Cada missão leva três toques: o que você viu, como foi e quem informou; nenhuma etapa trava a próxima.
        O exame físico (fundo de olho, reflexos, nuca, força graduada, sensibilidade) e a entrevista reservada ficam com o médico na consulta.
      </div>
      <div className="snp-panel snp-panel--soft p-3 text-xs font-semibold" role="note" data-testid="super-neuropad-clinical-urgency">
        <ShieldAlert className="mr-1 inline-block h-4 w-4" />
        <strong>Sinais de urgência:</strong> {CIRCUIT_URGENCY_NOTE}
      </div>
      {perfil && (
        <div className="snp-panel snp-panel--soft space-y-2 p-3" data-testid="super-neuropad-age-profile">
          <p className="text-sm font-black">🧩 Roteiro de {years} anos · {perfil.nome}</p>
          <p className="text-xs font-semibold"><strong>Convite:</strong> {perfil.convite}</p>
          <p className="text-xs font-semibold"><strong>Acessibilidade e ajuda:</strong> {perfil.acessibilidade}</p>
          <p className="text-[11px] font-semibold opacity-80">
            Sugestões de apresentação, sem comparação com referência etária. Cada ação só consta como executada após registro real.
          </p>
        </div>
      )}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Área clínica">
        {([
          { key: "neurologico", label: `🧠 Exame neurológico · ${countFor("neurologico")}` },
          { key: "mental", label: `💬 Estado mental · ${countFor("mental")}` },
          ...(modoMedico && doMedico.length ? [{ key: "medico", label: `🩺 Exame do médico · ${doMedico.filter((entry) => statuses[entry.id]).length}/${doMedico.length}` } as const] : []),
          ...(modoMedico ? [{ key: "cobertura", label: "🧭 Cobertura e lacunas" } as const] : []),
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
          <ObrigatoriosPanel resumo={resumo} onIr={irParaMissao} />
          <CoverageList title="Exame neurológico básico — domínios" domains={NEURO_BASIC_DOMAINS} years={years} records={records} />
          <CoverageList title="Exame do estado mental — seções" domains={MSE_SECTIONS} years={years} records={records} />
          <MatrizList years={years} records={records} bateria={bateria} />
          <HipotesesPanel years={years} records={records} />
        </div>
      ) : task && missao ? (
        <article className="snp-panel snp-panel--soft space-y-4 p-4" data-testid="super-neuropad-clinical-station">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="snp-chip">Missão {active + 1} de {tasks.length} · {task.domain}</span>
            <span className="snp-chip" data-testid="super-neuropad-mission-executor">{EXECUTOR_LABELS[task.executor]}</span>
          </div>
          <h3 className="text-xl font-black">{task.emoji} {task.title}</h3>
          <p className="rounded-xl border-2 border-[var(--snp-ink-fixed)] bg-[var(--snp-sun-tint)] p-3 text-base font-black" data-testid="super-neuropad-mission-invite">{task.executor === "secretaria" ? "📞 Contato da secretaria:" : "🗣️ Diga:"} “{missao.fala}”</p>
          <div className="flex flex-wrap gap-2 text-xs font-semibold">
            <span className="snp-chip">🧰 {missao.material}</span>
            <span className="snp-chip">⏱ ~{missao.minutos} min</span>
          </div>
          {dicaEtaria && <p className="rounded-xl border-2 border-[var(--snp-ink-40)] bg-white p-3 text-sm font-semibold text-[var(--snp-ink-fixed)]"
            data-testid="super-neuropad-age-station-guidance">{dicaEtaria}</p>}
          <div className="space-y-2">
            <h4 className="text-sm font-black">{task.executor === "secretaria" ? "Roteiro do contato para esta idade" : task.method === "presencial" ? "Passo a passo do examinador" : "Passo a passo da brincadeira"}</h4>
            <ol className="space-y-2">
              {(missao.roteiroPorIdade?.[years] ?? missao.passos).map((passo, index) => (
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
            <legend className="text-sm font-black">Toque no que você percebeu (pode marcar mais de um) · obrigatório: um marcador ou uma descrição</legend>
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
            <legend className="text-sm font-black">Como foi? (obrigatório)</legend>
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
            <legend className="text-sm font-black">Quem informou (obrigatório) — sem escolha, a missão não conta como concluída</legend>
            <div className="flex flex-wrap gap-2">
              {fontesDaTarefa(task).map((key) => [key, CIRCUIT_SOURCES[key]] as [CircuitSource,string]).map(([key,label]) =>
                <button key={key} type="button" aria-pressed={sources[task.id] === key}
                  onClick={() => { setSources((prior) => ({...prior,[task.id]:key})); setFeedback(""); }}
                  className={`snp-option min-h-11 px-3 py-2 text-left text-xs font-semibold ${sources[task.id] === key ? "bg-[var(--snp-sky-tint)]" : "bg-[var(--snp-paper-fixed)]"}`}>
                  {label}
                </button>)}
            </div>
          </fieldset>
          <div className="space-y-2">
            <button type="button" aria-expanded={anotacaoAberta} onClick={() => setAnotacaoAberta((aberta) => !aberta)}
              className="snp-option min-h-11 px-4 py-2 text-left text-sm font-black bg-[var(--snp-paper-fixed)]">{anotacaoAberta ? "▾" : "▸"} Anotação livre (obrigatória em “Teve dificuldade”)</button>
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
          <MissaoStatus faltam={faltamDe(task.id)} />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button type="button" onClick={previous}
              className="snp-btn snp-btn--paper inline-flex min-h-11 items-center gap-1 px-4 py-2 text-sm"><ChevronLeft className="h-4 w-4" /> Anterior</button>
            <select aria-label="Ir para estação" value={active} onChange={(event) => setActive(Number(event.target.value))}
              className="min-w-0 max-w-52 rounded-xl border-2 border-[var(--snp-ink-fixed)] bg-white p-2 text-sm text-[var(--snp-ink-fixed)]">
              {tasks.map((entry,index) => <option key={entry.id} value={index}>{index + 1}. {entry.title}{marcaDe(entry.id)}</option>)}
            </select>
            <button type="button" onClick={next}
              className="snp-btn snp-btn--sky inline-flex min-h-11 items-center gap-1 px-4 py-2 text-sm">Próxima <ChevronRight className="h-4 w-4" /></button>
          </div>
        </article>
      ) : task && (
        <article className="snp-panel snp-panel--soft space-y-3 p-4" data-testid="super-neuropad-clinical-station">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="snp-chip">Exame do médico {active + 1} de {tasks.length} · {task.domain}</span>
            <span className="snp-chip">{CIRCUIT_METHODS[task.method]}</span>
          </div>
          <p className="text-xs font-semibold" data-testid="super-neuropad-medico-note">Exame físico e entrevista reservada: tarefa do médico na consulta. Não conta nas missões da pré-consulta e pode ficar sem registro.</p>
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
              {fontesDaTarefa(task).map((key) => [key, CIRCUIT_SOURCES[key]] as [CircuitSource,string]).map(([key,label]) =>
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
              {tasks.map((entry,index) => <option key={entry.id} value={index}>{index + 1}. {entry.title}{marcaDe(entry.id)}</option>)}
            </select>
            <button type="button" onClick={next}
              className="snp-btn snp-btn--sky inline-flex min-h-11 items-center gap-1 px-4 py-2 text-sm">Próxima <ChevronRight className="h-4 w-4" /></button>
          </div>
        </article>
      )}
      <label className="block text-sm font-black">Síntese final (obrigatória): o que mais chamou a atenção
        <textarea rows={2} maxLength={2000} value={generalNote} onChange={(event) => setGeneralNote(event.target.value)}
          className="mt-2 w-full rounded-xl border-2 border-[var(--snp-ink-fixed)] bg-white p-3 text-sm font-normal text-[var(--snp-ink-fixed)]"
          placeholder="Limitações, necessidade de exame dirigido ou informações de fonte distinta, com proveniência." />
      </label>
      <div className="flex flex-wrap gap-2">
        {modoMedico && (tab === "medico" || tab === "cobertura") ? (
          <>
            <button type="button" onClick={() => void copyReport(report)}
              className="snp-btn snp-btn--sun inline-flex min-h-11 items-center gap-2 px-4 py-2 text-sm"><ClipboardCopy className="h-4 w-4" /> Copiar registro clínico do médico</button>
            <button type="button" onClick={() => { downloadTextDocument(report, `super-neuropad-circuito-${years}a.txt`); setFeedback("TXT clínico salvo localmente: contém observações clínicas e a síntese do médico. Revise antes de incorporar ao prontuário e guarde conforme a política da clínica, sem enviar a terceiros."); }}
              className="snp-btn snp-btn--paper inline-flex min-h-11 items-center gap-2 px-4 py-2 text-sm"><Download className="h-4 w-4" /> Baixar TXT do médico</button>
          </>
        ) : (
          <>
            <button type="button" onClick={() => void copyReport(relatorioPreConsulta)}
              className="snp-btn snp-btn--sun inline-flex min-h-11 items-center gap-2 px-4 py-2 text-sm"><ClipboardCopy className="h-4 w-4" /> Copiar registro da pré-consulta</button>
            <button type="button" onClick={() => { downloadTextDocument(relatorioPreConsulta, `super-neuropad-pre-consulta-${years}a.txt`); setFeedback("TXT da pré-consulta salvo localmente: registro observacional de auxiliar e secretaria, sem exame do médico nem síntese. Não é laudo; revise antes de incorporar ao prontuário."); }}
              className="snp-btn snp-btn--paper inline-flex min-h-11 items-center gap-2 px-4 py-2 text-sm"><Download className="h-4 w-4" /> Baixar TXT da pré-consulta</button>
          </>
        )}
        <button type="button" onClick={reset}
          className="snp-btn snp-btn--slate inline-flex min-h-11 items-center gap-2 px-4 py-2 text-sm"><RotateCcw className="h-4 w-4" /> Limpar circuito</button>
      </div>
      {feedback && <p className="text-xs font-semibold" role="status">{feedback}</p>}
      <p className="text-xs font-semibold opacity-80">Os registros permanecem apenas em memória até cópia ou exportação explícita. Não são anexados ao PDF da aventura nem enviados à família. Ao trocar de paciente/idade, são apagados. A avaliação médica integra dados de história, exame e fontes externas.</p>
    </section>
  );
}
