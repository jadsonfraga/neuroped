import { lazy, Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  REGULA20_DOMAINS, REGULA20_ITEMS, REGULA20_OPTIONS, REGULA20_RED_FLAGS,
  REGULA20_SOURCE, REGULA20_VERSION, REGULA20_WARNING,
  calculateRegula20, regula20Eligibility, regula20SafetyState,
} from "@/data/regula20";

const ClinicalReport = lazy(() => import("@/components/ClinicalReport").then((m) => ({ default: m.ClinicalReport })));
const SaveToPatient = lazy(() => import("@/components/SaveToPatient").then((m) => ({ default: m.SaveToPatient })));
const inputClass = "min-h-11 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm";
const purposes = { "basal-funcional": "Registro basal antes da consulta", "seguimento-funcional": "Seguimento da repercussão funcional" };
const respondents = { pais: "Pais/cuidador", professor: "Professor/profissional escolar", clinico: "Profissional que observou diretamente" };
const contexts = { casa: "Casa", escola: "Escola", terapia: "Terapia", outro: "Outro" };
const safetyOptions = { "presente": "Presente", "nao-relatado": "Não identificado nesta janela", "nao-sei": "Não sei informar" };
const durationOptions = ["Menos de 5 minutos", "5–14 minutos", "15–29 minutos", "30–59 minutos", "60 minutos ou mais", "Muito variável", "Não houve episódio", "Não sei informar"];
const triggers = ["Limite/não", "Transição", "Espera", "Tela", "Tarefa difícil", "Conflito social", "Escola", "Barulho/movimento", "Fome", "Cansaço/sono", "Dor/mal-estar", "Ambiente cheio", "Não identificado"];
const supports = ["Fala curta e objetiva", "Antecipação visual", "Pausa", "Ambiente silencioso", "Movimento", "Objeto/atividade preferida", "Lanche/água", "Descanso/sono", "Contato físico aceito", "Estratégia prescrita previamente", "Ainda não há estratégia consistente"];
function localToday() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }
function optionalCount(value: string, max = Number.MAX_SAFE_INTEGER) { return value === "" || (/^\d+$/.test(value) && Number.isSafeInteger(Number(value)) && Number(value) <= max); }
function displayDate(value: string) { return value.split("-").reverse().join("/"); }
function windowStart(value: string) { const d = new Date(`${value}T12:00:00`); if (!Number.isFinite(d.getTime())) return ""; d.setDate(d.getDate() - 13); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }
interface Snapshot { responses: Array<{ question: string; answer: string }>; answers: Array<number | undefined>; safety: string[]; applicationDate: string; ageMonths: number }

/** Formulário dedicado. Nenhum rascunho ou identificador clínico vai para URL/storage. */
export default function Regula20Page() {
  const [years, setYears] = useState("");
  const [months, setMonths] = useState("0");
  const [respondent, setRespondent] = useState("");
  const [purpose, setPurpose] = useState("");
  const [focus, setFocus] = useState("");
  const [context, setContext] = useState("");
  const [observer, setObserver] = useState("");
  const [observed, setObserved] = useState(false);
  const [urgent, setUrgent] = useState("");
  const [ready, setReady] = useState(false);
  const [answers, setAnswers] = useState<Array<number | undefined>>([]);
  const [safety, setSafety] = useState<string[]>([]);
  const [endDate, setEndDate] = useState(localToday);
  const [days, setDays] = useState("");
  const [episodes, setEpisodes] = useState("");
  const [duration, setDuration] = useState("");
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([]);
  const [selectedSupports, setSelectedSupports] = useState<string[]>([]);
  const [example, setExample] = useState("");
  const [changes, setChanges] = useState("");
  const [nextStepsRead, setNextStepsRead] = useState(false);
  const [error, setError] = useState("");
  const [reviewGate, setReviewGate] = useState(false);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [showSave, setShowSave] = useState(false);
  const validAge = /^\d+$/.test(years) && /^\d+$/.test(months) && Number(months) <= 11;
  const ageMonths = validAge ? Number(years) * 12 + Number(months) : Number.NaN;
  const eligibility = regula20Eligibility({ ageMonths, respondent, purpose, focus });
  const contextValid = Object.hasOwn(contexts, context) && (respondent !== "professor" || context === "escola");
  const canStart = eligibility.eligible && contextValid && observer.trim().length > 0 && observed && urgent === "nao";
  const answeredCount = answers.filter((value) => value !== undefined).length;
  const needsSafetyReview = snapshot ? regula20SafetyState(snapshot.safety).needsReview : regula20SafetyState(safety).needsReview;

  function reset() {
    if (!window.confirm("Limpar esta aplicação e preparar para outra família? Confirme antes se a equipe já recebeu ou salvou o registro.")) return;
    setYears(""); setMonths("0"); setRespondent(""); setPurpose(""); setFocus(""); setContext(""); setObserver(""); setObserved(false); setUrgent(""); setReady(false); setAnswers([]); setSafety([]); setEndDate(localToday()); setDays(""); setEpisodes(""); setDuration(""); setSelectedTriggers([]); setSelectedSupports([]); setExample(""); setChanges(""); setNextStepsRead(false); setError(""); setReviewGate(false); setSnapshot(null); setShowSave(false);
  }
  function finish(forReview = false) {
    setError("");
    const score = calculateRegula20(answers);
    if (!canStart || !score.complete || !regula20SafetyState(safety).complete || !nextStepsRead) { setError("Revise o filtro, responda aos 20 itens e aos 7 alertas e confirme a leitura dos próximos passos. N/O é uma resposta válida; deixar em branco não é."); return; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(endDate) || !windowStart(endDate) || endDate > localToday() || !optionalCount(days, 14) || !optionalCount(episodes)) { setError("Confira a data da janela e as contagens. Dias com episódios deve ficar entre 0 e 14; campos desconhecidos podem permanecer vazios."); return; }
    if (regula20SafetyState(safety).needsReview && !forReview) { setReviewGate(true); return; }
    const label = (options: Record<string, string>, key: string) => options[key] ?? key;
    const responses = [
      { question: "Identificação do instrumento e contrato", answer: `REGULA-20 SDG · ${REGULA20_VERSION}. Autoria: ${REGULA20_SOURCE.author}. ${REGULA20_WARNING}` },
      { question: "Finalidade", answer: label(purposes, purpose) },
      { question: "Observador / contexto", answer: `${observer.trim()} · ${label(respondents, respondent)} · ${label(contexts, context)}. Registro separado; não combinar com outro informante.` },
      { question: "Janela de observação", answer: `${displayDate(windowStart(endDate))} a ${displayDate(endDate)} · 14 dias` },
      ...REGULA20_ITEMS.map((question, i) => ({ question: `Item ${i + 1}. ${question}`, answer: `${REGULA20_OPTIONS[answers[i]!].label} — ${REGULA20_OPTIONS[answers[i]!].description}` })),
      { question: "Dias com episódios / total aproximado (fora do escore)", answer: `${days === "" ? "Não informado" : days + "/14 dias"}; total: ${episodes === "" ? "não informado" : episodes}` },
      { question: "Duração típica (fora do escore)", answer: duration || "Não informada" },
      { question: "Gatilhos relatados (fora do escore)", answer: selectedTriggers.join("; ") || "Não informados" },
      { question: "Apoios que ajudaram (fora do escore)", answer: selectedSupports.join("; ") || "Não informados" },
      { question: "Episódio representativo (relato)", answer: example.trim() || "Não informado" },
      { question: "Mudanças de rotina, medicação, saúde ou ambiente (relato)", answer: changes.trim() || "Não informadas" },
      ...REGULA20_RED_FLAGS.map((question, i) => ({ question: `Alerta ${i + 1} (fora do escore). ${question}`, answer: `${safety[i] === "nao-relatado" ? "" : "ATENÇÃO — "}${label(safetyOptions, safety[i])}` })),
      { question: "Próximos passos", answer: forReview ? "Apresentar os alertas e este registro à equipe antes de uma conclusão rotineira. Não há diagnóstico ou conduta automática." : "Revisar com o profissional, combinar uma meta funcional e decidir quando repetir o mesmo instrumento, observador e contexto. Não há diagnóstico ou conduta automática." },
    ];
    setSnapshot({ responses, answers: [...answers], safety: [...safety], ageMonths, applicationDate: new Date().toISOString() });
    setReviewGate(false);
  }
  const nextSteps = <section className="rounded-2xl border border-primary/30 bg-primary/5 p-4" aria-label="Próximos passos">
    <h2 className="font-semibold">Próximos passos</h2>
    <p className="mt-2 text-sm leading-6">Apresente o registro ao profissional. Conversem sobre o que mais atrapalha a rotina e escolham uma meta observável. O profissional decidirá quando repetir. Não ajuste medicamentos nem retire apoios eficazes com base neste questionário. Alertas devem ser discutidos separadamente, mesmo quando as demais respostas forem baixas.</p>
  </section>;

  return <article className="mx-auto max-w-3xl space-y-5 pb-10" data-testid="regula20-app">
    <header className="rounded-3xl border bg-card p-5">
      <Badge variant="outline">NeuroPed SDG · Autoral não validado</Badge>
      <h1 className="mt-3 text-2xl font-bold">REGULA-20 SDG</h1>
      <p className="mt-1 text-sm">Irritabilidade, Desregulação e Recuperação Funcional · versão 1.0</p>
      <p className="mt-3 text-sm text-muted-foreground">3–17 anos · 14 dias · 20 itens. Pais respondem sobre o cotidiano, não apenas sobre o comportamento na sala de espera. A recepção pode ajudar a ler, sem responder pelo cuidador.</p>
      <p className="mt-3 text-xs text-muted-foreground">{REGULA20_WARNING}</p>
    </header>
    <p className="text-xs text-muted-foreground">As respostas desta tela ficam apenas em memória até uma ação explícita de copiar, imprimir ou salvar pela equipe. Fechar ou recarregar a tela perde a aplicação não salva. Não há envio automático.</p>

    {snapshot ? <>
      {needsSafetyReview && <div role="alert" className="rounded-xl border border-destructive bg-destructive/10 p-4"><strong>Alertas presentes ou informação incerta: avaliação pela equipe.</strong><p className="mt-2 text-sm">Não aguarde uma pontuação para pedir ajuda. Em perigo imediato, avise a equipe do consultório; fora do serviço, acione o SAMU 192.</p></div>}
      <Card><CardContent className="space-y-3 p-5"><h2 className="font-semibold">Registro pronto para revisão — não é diagnóstico</h2><p className="text-sm">20 respostas registradas; {calculateRegula20(snapshot.answers).observed}/20 itens observáveis. N/O não recebe zero.</p>{calculateRegula20(snapshot.answers).globalMean === null && <p className="text-sm">Média global não calculável: menos de 16 itens observáveis. Isso não significa ausência de dificuldades.</p>}<p className="text-sm text-muted-foreground">A entrega para a família preserva perguntas e respostas por extenso. A apuração do PDF é descritiva, sem categorias de gravidade.</p></CardContent></Card>
      {nextSteps}
      <Suspense fallback={<p role="status">Preparando registro…</p>}><ClinicalReport scaleName="REGULA-20 SDG" scaleFullName={`Monitor Autoral de Irritabilidade, Desregulação e Recuperação Funcional · ${REGULA20_VERSION}`} items={snapshot.responses} patientAge={`${Math.floor(snapshot.ageMonths / 12)} anos e ${snapshot.ageMonths % 12} meses`} applicationDate={snapshot.applicationDate} /></Suspense>
      <Button variant="outline" onClick={() => setShowSave(true)}>Equipe: vincular ao prontuário</Button>
      {showSave && <Suspense fallback={<p role="status">Preparando salvamento seguro…</p>}><SaveToPatient scaleName="REGULA-20 SDG" responses={snapshot.responses} patientAge={`${snapshot.ageMonths} meses`} applicationDate={snapshot.applicationDate} instrumentVersion={REGULA20_VERSION} /></Suspense>}
      <Button variant="outline" onClick={() => { setSnapshot(null); setShowSave(false); setNextStepsRead(false); }}>Revisar respostas</Button>
    </> : !ready ? <Card><CardContent className="space-y-4 p-5">
      <h2 className="text-lg font-semibold">Filtro autoral: este registro faz sentido agora?</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <label>Idade em anos<Input id="regula-years" value={years} inputMode="numeric" onChange={(e) => setYears(e.target.value)} /></label>
        <label>Meses adicionais (0–11)<Input id="regula-months" value={months} inputMode="numeric" onChange={(e) => setMonths(e.target.value)} /></label>
        <label>Quem responde?<select id="regula-respondent" className={inputClass} value={respondent} onChange={(e) => setRespondent(e.target.value)}><option value="">Selecione</option>{Object.entries(respondents).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
        <label>Contexto observado<select id="regula-context" className={inputClass} value={context} onChange={(e) => setContext(e.target.value)}><option value="">Selecione</option>{Object.entries(contexts).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
      </div>
      <label className="block">Finalidade explícita<select id="regula-purpose" className={inputClass} value={purpose} onChange={(e) => setPurpose(e.target.value)}><option value="">Selecione a finalidade</option>{Object.entries(purposes).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
      <label className="block">Foco da observação<select id="regula-focus" className={inputClass} value={focus} onChange={(e) => setFocus(e.target.value)}><option value="">Selecione o foco</option><option value="irritabilidade-funcional">Irritabilidade / desregulação / recuperação funcional</option></select></label>
      <label className="block">Identificação/função do observador<Input id="regula-observer" maxLength={100} value={observer} onChange={(e) => setObserver(e.target.value)} placeholder="Ex.: cuidadora principal; manter a mesma identificação no retorno" /></label>
      <label className="flex items-start gap-3 text-sm"><input id="regula-observed" type="checkbox" className="mt-1 h-5 w-5" checked={observed} onChange={(e) => setObserved(e.target.checked)} />Observei diretamente esta criança nos últimos 14 dias. Onde não pude observar, usarei N/O. Escola, casa e terapia serão registradas separadamente.</label>
      <label className="block text-sm">Há perigo imediato, ferimento grave, dificuldade para respirar ou alteração da consciência agora?<select id="regula-urgent" className={inputClass} value={urgent} onChange={(e) => setUrgent(e.target.value)}><option value="">Selecione</option><option value="nao">Não</option><option value="sim">Sim</option><option value="nao-sei">Não sei; preciso de ajuda da equipe</option></select></label>
      {(urgent === "sim" || urgent === "nao-sei") && <div role="alert" className="rounded-xl border border-destructive p-4"><strong>Interrompa o questionário e avise a equipe agora.</strong><p className="mt-2 text-sm">A escala não avalia urgências. Em risco imediato fora do serviço, acione o SAMU 192.</p></div>}
      <p className="text-sm" role="status">{eligibility.reason}</p>
      {respondent === "professor" && context !== "escola" && <p className="text-sm">Para o professor, selecione Escola; não responder pela família.</p>}
      <p className="rounded-xl bg-muted p-3 text-sm">Escolha um monitor de irritabilidade por objetivo e momento. Este formulário não será somado ao MAPA-RI, VS1, MCRI ou ADAPTA; nenhuma escala anterior foi apagada ou convertida.</p>
      <Button id="regula-start" disabled={!canStart} onClick={() => { if (canStart) setReady(true); }} className="min-h-11 w-full">Iniciar os 20 itens</Button>
    </CardContent></Card> : <>
      <section className="rounded-xl border bg-card p-4"><h2 className="font-semibold">Como responder</h2><p className="mt-2 text-sm leading-6">Marque o nível que descreve a maior parte das vezes em que a situação ocorreu nos últimos 14 dias. Não use apenas o pior episódio isolado. Se não houve oportunidade suficiente de observar, marque N/O; se houve observação suficiente e o comportamento não ocorreu, marque 0. Frequência e duração ficam separadas do escore.</p><p className="mt-2 text-sm" aria-live="polite">{answeredCount}/20 respostas preenchidas</p></section>
      {REGULA20_DOMAINS.map((domain, di) => <section key={domain} className="space-y-3" aria-label={domain}><h2 className="text-lg font-semibold">{domain}</h2>{REGULA20_ITEMS.slice(di * 5, di * 5 + 5).map((text, ii) => { const i = di * 5 + ii; return <fieldset key={i} className="space-y-3 rounded-2xl border bg-card p-4" data-testid={`regula-item-${i + 1}`}><legend className="px-1 text-sm font-semibold">{i + 1}. {text}</legend><div className="grid gap-2 sm:grid-cols-2">{REGULA20_OPTIONS.map((option, value) => <label key={value} className={`flex min-h-12 cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm ${answers[i] === value ? "border-primary bg-primary/10" : "border-border"}`}><input type="radio" name={`regula-item-${i}`} value={value} checked={answers[i] === value} onChange={() => setAnswers((current) => { const next = [...current]; next[i] = value; return next; })} className="mt-1 h-5 w-5 shrink-0" /><span><strong>{option.label}</strong><span className="mt-1 block text-xs leading-5 text-muted-foreground">{option.description}</span></span></label>)}</div></fieldset>; })}</section>)}
      <section className="space-y-4 rounded-2xl border bg-card p-4"><h2 className="font-semibold">Contexto da aplicação — não pontuado</h2><div className="grid gap-3 sm:grid-cols-2"><label>Fim da janela de 14 dias<Input id="regula-window-end" type="date" max={localToday()} value={endDate} onChange={(e) => setEndDate(e.target.value)} /></label><label>Dias com episódios (0–14)<Input id="regula-days" inputMode="numeric" value={days} onChange={(e) => setDays(e.target.value)} placeholder="Deixe vazio se não souber" /></label><label>Total aproximado de episódios<Input id="regula-episodes" inputMode="numeric" value={episodes} onChange={(e) => setEpisodes(e.target.value)} /></label><label>Duração típica<select className={inputClass} value={duration} onChange={(e) => setDuration(e.target.value)}><option value="">Não informada</option>{durationOptions.map((value) => <option key={value}>{value}</option>)}</select></label></div>
        {[["Gatilhos observados", triggers, selectedTriggers, setSelectedTriggers], ["O que ajudou a recuperação", supports, selectedSupports, setSelectedSupports]].map(([title, options, selected, setter]) => <fieldset key={title as string}><legend className="mb-2 font-medium">{title as string}</legend><div className="grid gap-2 sm:grid-cols-2">{(options as string[]).map((value) => <label key={value} className="flex min-h-10 items-center gap-2 text-sm"><input type="checkbox" checked={(selected as string[]).includes(value)} onChange={(e) => (setter as typeof setSelectedTriggers)((current) => e.target.checked ? [...current, value] : current.filter((v) => v !== value))} />{value}</label>)}</div></fieldset>)}
        <label className="block text-sm">Um episódio representativo: antes, durante, como terminou e o que ajudou<textarea className={inputClass} rows={4} maxLength={1200} value={example} onChange={(e) => setExample(e.target.value)} /></label><label className="block text-sm">Mudanças de medicação, rotina, saúde, sono ou ambiente<textarea className={inputClass} rows={3} maxLength={800} value={changes} onChange={(e) => setChanges(e.target.value)} /></label>
      </section>
      <section className="space-y-3 rounded-2xl border border-destructive/40 bg-card p-4"><h2 className="font-semibold">Alertas independentes do escore</h2><p className="text-sm">Responda aos 7 alertas. Um resultado baixo nos 20 itens não anula um alerta. “Não sei” será levado à equipe, sem ser tratado como ausência de risco.</p>{REGULA20_RED_FLAGS.map((text, i) => <label key={text} className="block text-sm"><span>{i + 1}. {text}</span><select id={`regula-alert-${i}`} className={inputClass} value={safety[i] ?? ""} onChange={(e) => { const value = e.target.value; setSafety((current) => { const next = [...current]; next[i] = value; return next; }); }}><option value="">Selecione</option>{Object.entries(safetyOptions).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>)}</section>
      {nextSteps}
      <label className="flex items-start gap-3 text-sm"><input id="regula-next-steps" type="checkbox" className="h-5 w-5" checked={nextStepsRead} onChange={(e) => setNextStepsRead(e.target.checked)} />Li os próximos passos. Este registro será interpretado pelo profissional, não como diagnóstico automático.</label>
      {error && <p role="alert" className="rounded-xl border border-destructive p-3 text-sm">{error}</p>}
      {reviewGate ? <section role="alert" className="space-y-3 rounded-xl border border-destructive p-4"><h2 className="font-semibold">Há alerta ou informação de segurança incerta.</h2><p className="text-sm">Avise a equipe antes de prosseguir com uma conclusão rotineira. Em perigo imediato, interrompa e peça atendimento agora.</p><Button variant="outline" onClick={() => setReviewGate(false)}>Revisar os alertas</Button><Button onClick={() => finish(true)}>Mostrar registro para avaliação da equipe</Button></section> : <Button id="regula-finish" className="min-h-11 w-full" onClick={() => finish()}>Concluir registro para revisão</Button>}
    </>}
    <Button variant="outline" className="min-h-11" onClick={reset}>Nova família / limpar esta aplicação</Button>
    <footer className="border-t pt-4 text-xs text-muted-foreground">Dr. Jadson Fraga · Neuropediatra · CRM-PE 25227 · RQE 17756<br />NeuroPed SDG · Soli Deo Gloria · {REGULA20_VERSION}</footer>
  </article>;
}
