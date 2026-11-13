import { ArrowDown, AlertTriangle, BookOpenCheck, CalendarClock, ClipboardCheck, ExternalLink, ShieldAlert } from "lucide-react";

const question = "Primeira crise convulsiva afebril: qual a abordagem inicial?";
const findings: [string, string, string][] = [
  ["Crise ≥5 minutos, recorrência sem recuperação ou apneia", "Emergência convulsiva e risco de comprometimento vital", "SAMU 192, ABC e protocolo de crise prolongada por equipe habilitada"],
  ["Pródromo ortostático, palidez e recuperação rápida", "Síncope convulsiva pode imitar crise epiléptica", "ECG de 12 derivações e avaliação cardiovascular conforme história"],
  ["Jejum, vômitos, medicação nova ou intoxicação suspeita", "Crise aguda sintomática possível", "Glicemia e exames laboratoriais direcionados ao contexto"],
  ["Déficit focal persistente, trauma ou sinais de hipertensão intracraniana", "Lesão estrutural ou causa aguda possível", "Pronto atendimento e neuroimagem urgente conforme indicação"],
  ["Evento único, retorno ao basal e exame normal", "Recorrência possível; epilepsia ainda não confirmada", "Consulta prioritária, decidir EEG/RM conforme semiologia e orientar segurança"],
];
const steps: [string, string][] = [
  ["Estabilização", "Duração, respiração, recuperação, lesões e déficit novo: urgência se alerta; primeira crise requer avaliação médica."],
  ["Reconstrução", "Ouvir testemunha e criança, revisar vídeo seguro, início focal/bilateral, olhar, automatismos e período pós-ictal."],
  ["Provocada ou não?", "Investigar hipoglicemia, distúrbios metabólicos, neuroinfecção, trauma, tóxicos e fármacos quando houver indícios."],
  ["Diferenciais", "Pesquisar síncope, eventos do sono, enxaqueca e movimentos não epilépticos; considerar ECG após primeira crise suspeita."],
  ["Exame dirigido", "Sinais vitais, estado mental, motricidade, tônus, pares cranianos, coordenação, marcha, meningismo e coração; registrar apenas o avaliado."],
  ["Plano e retorno", "Explicar hipótese, decidir exames com justificativa, orientar família/escola, organizar seguimento e critérios de reavaliação."],
];
const refs = [
  { name: "Ministério da Saúde · PCDT Epilepsia (anexo atualizado em 2026)", url: "https://www.gov.br/saude/pt-br/assuntos/pcdt/e/epilepsia/view", note: "Diretriz brasileira de epilepsia; não é algoritmo exclusivo de primeira crise." },
  { name: "Sociedade Brasileira de Pediatria · Epilepsia (2023)", url: "https://www.sbp.com.br/pediatria-para-familias/doencas/epilepsia/", note: "Orientações nacionais para famílias, segurança e procura de emergência na primeira crise." },
  { name: "NICE NG217 · Diagnosis and assessment (2022, consultada em 2026)", url: "https://www.nice.org.uk/guidance/ng217/chapter/diagnosis-and-assessment-of-epilepsy", note: "ECG; EEG se indicado, idealmente em até 72 h; EEG normal não exclui epilepsia." },
  { name: "Royal Children's Hospital · Seizures acute management (2025)", url: "https://www.rch.org.au/afebrile_seizures/", note: "Crise ≥5 min: manejo urgente. Após primeira crise, EEG não é universalmente rotineiro." },
  { name: "Fisher et al. · ILAE Practical definition (2014)", url: "https://doi.org/10.1111/epi.12550", note: "DOI 10.1111/epi.12550; PMID 24730690. Definição de epilepsia e limiar de risco ≥60% em 10 anos." },
  { name: "Baykan et al. · ILAE/IFCN meta-analysis (2025)", url: "https://doi.org/10.1111/epi.18591", note: "DOI 10.1111/epi.18591. Descargas epileptiformes e recorrência; OR 2,32 (IC 95% 1,69–3,17)." },
  { name: "Wendt et al. · Recurrence rates in children (2018)", url: "https://doi.org/10.1111/acem.13374", note: "DOI 10.1111/acem.13374. Comentário sobre estudos observacionais de recorrência pediátrica; não é estudo primário." },
  { name: "Jiménez-Villegas et al. · First unprovoked seizure (2021)", url: "https://doi.org/10.1016/j.seizure.2021.03.027", note: "DOI 10.1016/j.seizure.2021.03.027. Revisão narrativa; decisão terapêutica individualizada." },
];
function Heading({ number, children }: { number: string; children: React.ReactNode }) {
  return <div className="mb-4 flex items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-800 text-sm font-black text-white">{number}</span><h3 className="font-serif text-xl font-bold text-slate-900 sm:text-2xl dark:text-white">{children}</h3></div>;
}
function FlowBox({ label, children, kind = "neutral" }: { label: string; children: React.ReactNode; kind?: "neutral" | "danger" | "safe" }) {
  const style = kind === "danger" ? "border-rose-300 bg-rose-100 text-rose-950 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-100" : kind === "safe" ? "border-teal-300 bg-teal-50 text-teal-950 dark:border-teal-900 dark:bg-teal-950 dark:text-teal-100" : "border-amber-300 bg-amber-50 text-slate-950 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100";
  return <div className={"rounded-xl border p-4 " + style}><strong className="block text-xs uppercase tracking-wider">{label}</strong><p className="mt-2 text-sm leading-6">{children}</p></div>;
}
export default function PrimeiraCriseAfebrilChapter() {
  return <article id="capitulo-primeira-crise-afebril" aria-labelledby="primeira-crise-title" className="scroll-mt-24 space-y-8 sm:space-y-10">
    <header className="overflow-hidden rounded-[1.8rem] bg-slate-900 p-5 text-white sm:p-9">
      <p className="text-xs font-black uppercase tracking-[.18em] text-amber-200">Dia 03/365 · Epilepsia e eventos · 6 minutos</p>
      <h2 id="primeira-crise-title" className="mt-3 max-w-3xl font-serif text-3xl font-bold leading-tight sm:text-4xl">Dia 03/365 — {question}</h2>
      <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-200">Da segurança imediata à decisão sobre EEG, imagem e acompanhamento: um roteiro sem diagnóstico ou medicação automáticos.</p>
      <div className="mt-5 rounded-xl border border-amber-300/35 bg-amber-300/10 p-4 text-sm leading-6 text-amber-100"><ShieldAlert className="mr-2 inline h-4 w-4" aria-hidden="true" /> MATERIAL EDUCACIONAL EM REVISÃO MÉDICA. Sem aceite ou assinatura médica. Pesquisa Consensus Pro concluída e diretrizes verificadas em 01/11/2026.</div>
    </header>
    <section className="rounded-2xl border-l-4 border-teal-600 bg-teal-50 p-5 dark:bg-teal-950/30">
      <Heading number="01">Em 30 segundos</Heading>
      <p className="text-sm leading-7 text-slate-800 dark:text-slate-200">Pergunte: <strong>a crise está em curso, a criança recuperou o estado habitual e existe causa aguda tratável?</strong> Uma primeira crise afebril não equivale automaticamente a epilepsia. Crise convulsiva com duração ≥5 minutos, crises repetidas sem recuperação ou comprometimento respiratório exigem emergência. Depois, testemunha, exame e ECG orientam exames direcionados, EEG, neuroimagem e seguimento.</p>
    </section>
    <section><Heading number="02">Sinais e red flags que mudam a conduta</Heading>
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 dark:border-rose-900 dark:bg-rose-950/30">
        <p className="flex items-start gap-3 text-sm leading-7 text-slate-800 dark:text-slate-200"><AlertTriangle className="mt-1 h-5 w-5 shrink-0 text-rose-700" aria-hidden="true" /><span><strong>SAMU 192 / emergência:</strong> crise ≥5 minutos (ou duração desconhecida em curso), repetição sem recuperar, cianose/apneia, trauma importante, déficit focal novo, alteração persistente de consciência, suspeita de meningite/encefalite, intoxicação ou hipoglicemia. Mesmo resolvida, a primeira crise deve ser avaliada por serviço médico; a SBP orienta procurar emergência na primeira ocorrência.</span></p>
      </div>
    </section>
    <section><Heading number="03">Fluxograma decisório responsivo</Heading>
      <div role="group" aria-label="Fluxograma: primeiro avaliar crise em curso e recuperação; se emergência, acionar SAMU; se estável, procurar causa aguda; depois investigar e acompanhar" className="rounded-[1.6rem] bg-slate-800 p-4 sm:p-7">
        <div className="mx-auto max-w-md rounded-xl border border-amber-200/50 bg-white/10 p-4 text-center font-bold text-amber-100">Primeiro episódio afebril → cronometrar, ABC e recuperação</div>
        <ArrowDown className="mx-auto my-3 h-6 w-6 text-amber-200" aria-hidden="true" />
        <div className="grid gap-3 md:grid-cols-3">
          <FlowBox label="1 · Emergência" kind="danger">Crise ≥5 min, repetição, respiração alterada ou déficit? <strong>Sim:</strong> SAMU 192, estabilizar e protocolo agudo.</FlowBox>
          <FlowBox label="2 · Causa provocada">Hipoglicemia, distúrbio metabólico, trauma, intoxicação ou infecção? <strong>Sim:</strong> exames e tratamento dirigidos.</FlowBox>
          <FlowBox label="3 · Estável" kind="safe">Recuperação completa? História, exame, ECG; considerar EEG/RM conforme suspeita e fatores de risco.</FlowBox>
        </div>
        <ArrowDown className="mx-auto my-3 h-6 w-6 text-amber-200" aria-hidden="true" />
        <p className="rounded-xl border border-teal-300/40 bg-teal-300/10 p-4 text-center text-sm leading-7 text-white"><strong>Saída:</strong> hipótese documentada, plano de segurança, avaliação neuropediátrica e retorno. Sem rótulo ou manutenção automática.</p>
      </div>
    </section>
    <section><Heading number="04">Achado → interpretação → próxima ação</Heading>
      <div className="space-y-3">{findings.map(([finding, meaning, action]) => <div key={finding} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-3 dark:border-slate-700 dark:bg-slate-900">{[["Achado",finding],["Interpretação",meaning],["Próxima ação",action]].map(([label,value])=><p key={label} className="text-sm leading-6 text-slate-700 dark:text-slate-200"><strong className="mb-1 block text-xs uppercase tracking-wider text-teal-700 dark:text-teal-300">{label}</strong>{value}</p>)}</div>)}</div>
    </section>
    <section><Heading number="05">Consulta operacional em seis etapas</Heading>
      <ol className="grid gap-3 sm:grid-cols-2">{steps.map(([name,detail],i)=><li key={name} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900"><span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-amber-200">{i+1}</span><h4 className="mt-3 font-bold text-slate-900 dark:text-white">{name}</h4><p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{detail}</p></li>)}</ol>
    </section>
    <section><Heading number="06">Quando investigar versus observar</Heading>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 dark:border-rose-900 dark:bg-rose-950/30"><h4 className="font-bold text-rose-900 dark:text-rose-100">Investigar imediatamente</h4><p className="mt-2 text-sm leading-7 text-slate-800 dark:text-slate-200">Red flags, alteração de consciência, exame anormal, focalidade persistente, suspeita metabólica ou infecciosa: avaliação de urgência, glicemia e exames dirigidos. TC urgente apenas se indicada por hipótese aguda; RM é preferível para estudo estrutural não emergencial.</p></div>
        <div className="rounded-2xl border border-teal-200 bg-teal-50 p-5 dark:border-teal-900 dark:bg-teal-950/30"><h4 className="font-bold text-teal-900 dark:text-teal-100">Acompanhar com investigação seletiva</h4><p className="mt-2 text-sm leading-7 text-slate-800 dark:text-slate-200">Recuperação completa e exame normal: avaliação médica inicial, ECG e seguimento. NICE considera EEG se suspeita de epilepsia; quando pedido, idealmente em 72 h. RCH não indica EEG rotineiro em toda primeira crise. EEG normal não exclui epilepsia.</p></div>
      </div>
      <p className="mt-3 text-xs leading-6 text-slate-500 dark:text-slate-400">A indicação de RM cresce com focalidade, alteração do desenvolvimento ou exame e suspeita de epilepsia estrutural; evitar exames de rotina sem justificativa clínica. Punção lombar apenas quando há suspeita de neuroinfecção e segurança para realizá-la.</p>
    </section>
    <section><Heading number="07">Manejo, seguimento, família e escola</Heading>
      <p className="text-sm leading-7 text-slate-700 dark:text-slate-200">Após uma primeira crise não provocada, a recorrência acumulada varia aproximadamente entre 30–50% conforme perfil e tempo. Descargas epileptiformes elevam o risco, mas não definem automaticamente o tratamento. A ILAE admite diagnóstico de epilepsia após uma crise quando o risco estimado de recorrência em 10 anos é ≥60% ou há síndrome definida. Decisão sobre fármaco anticrise requer avaliação de síndrome, EEG, RM, riscos, contraindicações, preferências e monitorização; não prescrever automaticamente. Se houver necessidade de plano de resgate, exige prescrição individual e treinamento. Retorno neuropediátrico nas primeiras semanas, mais cedo se novos eventos.</p>
      <blockquote className="mt-4 rounded-xl border-l-4 border-amber-500 bg-amber-50 p-5 text-sm leading-7 text-slate-800 dark:bg-amber-950/30 dark:text-slate-200">“Uma crise isolada precisa ser investigada, mas não significa necessariamente epilepsia. Se ocorrer novamente, afastem objetos, protejam a cabeça, posicionem de lado quando seguro, cronometrem e acionem o SAMU 192 nas situações de alerta. Nunca coloquem nada na boca nem ofereçam água durante a crise.” A escola deve receber orientação escrita e medidas de segurança; evitar exclusão automática.</blockquote>
    </section>
    <section><Heading number="08">Caso clínico inteiramente fictício</Heading>
      <p className="rounded-2xl bg-slate-50 p-5 text-sm leading-7 text-slate-800 dark:bg-slate-900 dark:text-slate-200">Menina fictícia de 9 anos tem episódio noturno de 90 segundos com abalos bilaterais, seguido de sonolência por 15 minutos. Recupera-se completamente, sem febre, trauma, medicamentos novos ou déficit no exame. <strong>Inferência:</strong> provável primeira crise epiléptica não provocada, ainda sem confirmação de epilepsia. <strong>Próxima ação:</strong> avaliação médica, vídeo da testemunha, ECG, considerar EEG precoce e RM conforme semiologia, segurança e seguimento. Não iniciar manutenção por reflexo.</p>
    </section>
    <section><Heading number="09">Três erros frequentes</Heading><ol className="list-decimal space-y-2 pl-6 text-sm leading-7 text-slate-700 dark:text-slate-200"><li>Chamar qualquer episódio motor de epilepsia, sem excluir síncope ou causa aguda sintomática.</li><li>Solicitar TC, laboratório amplo ou EEG como prova isolada; EEG normal não exclui epilepsia.</li><li>Prescrever manutenção antes de avaliar risco de recorrência, segurança e possíveis efeitos adversos.</li></ol></section>
    <section><Heading number="10">Incertezas e força da evidência</Heading>
      <p className="text-sm leading-7 text-slate-700 dark:text-slate-200">NICE e RCH divergem sobre EEG rotineiro; ambas priorizam história e seguimento. Metanálise ILAE/IFCN (2025) associou descargas epileptiformes à recorrência (OR combinado 2,32; IC 95% 1,69–3,17; I² 76%); no subgrupo pediátrico, OR 3,24 (IC 95% 2,19–4,79). São associações, não probabilidade individual automática. Estudos de recorrência são heterogêneos. Evidência de benefício de fármaco imediato sobre remissão tardia vem parcialmente de estudos em adultos, com extrapolação limitada para crianças. Recomendações de exames e intervalos são contextualizadas, não regras diagnósticas universais.</p>
    </section>
    <section><Heading number="11">Bibliografia auditável</Heading><p className="mb-3 text-xs text-slate-500 dark:text-slate-400">Fontes verificadas em 01/11/2026. Pesquisa científica Consensus Pro concluída, com conferência em diretrizes oficiais.</p>
      <ul className="space-y-2">{refs.map(ref=><li key={ref.url} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900"><a href={ref.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-start gap-2 text-sm font-semibold text-teal-800 underline underline-offset-4 dark:text-teal-200">{ref.name}<ExternalLink className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /></a><p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">{ref.note}</p></li>)}</ul>
      <p className="mt-4 flex items-start gap-2 text-xs leading-6 text-slate-500 dark:text-slate-400"><ClipboardCheck className="mt-1 h-4 w-4 shrink-0" aria-hidden="true" /> <a href="https://consensus.app/search/investigacao-cientifica-para-capitulo-educacional-/3N34Ce0ZToKsLUfqTBvSuQ/" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">Investigação Consensus Pro — 01/11/2026</a>. Navegador Windows abriu o Consensus, mas conteúdo da sessão não foi validado; a pesquisa concluída foi pelo conector oficial. Versão 0.1.0; revisão médica pendente.</p>
    </section>
    <footer className="flex flex-wrap items-center gap-3 border-t border-slate-200 pt-5 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400"><BookOpenCheck className="h-4 w-4" aria-hidden="true" /> Biblioteca Clínica NeuroPed 365 <CalendarClock className="h-4 w-4" aria-hidden="true" /> 01/11/2026 · revisão médica pendente</footer>
  </article>;
}
