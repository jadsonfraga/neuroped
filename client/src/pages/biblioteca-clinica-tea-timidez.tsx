import { ArrowDown, AlertTriangle, BookOpen, Clock3, ShieldCheck } from "lucide-react";

const alerts = [
  "Perda de fala, gestos, brincadeiras ou habilidades motoras já adquiridas: priorizar avaliação e investigar causas.",
  "Entre 12 e 18 meses: resposta persistentemente reduzida ao nome, poucos gestos comunicativos ou ausência de apontar para compartilhar interesse.",
  "A partir de 18–24 meses: atenção compartilhada escassa, pouca imitação ou brincadeira simbólica, associadas a rigidez, repetição ou reatividade sensorial relevante.",
  "Atraso importante de linguagem, suspeita de perda auditiva, eventos paroxísticos ou prejuízo funcional significativo: investigar os respectivos diferenciais.",
];

const matrix = [
  ["Silêncio diante de desconhecidos; compartilha interesses e brinca em turnos com familiares", "Inibição comportamental situacional é plausível", "Confirmar com família e escola; observar impacto e evolução"],
  ["Não mostra ou aponta para compartilhar; pouco segue o gesto do outro", "Possível diferença na atenção compartilhada", "Avaliar comunicação social, desenvolvimento e necessidade de encaminhamento"],
  ["Pouca fala, mas gestos e reciprocidade preservados", "Atraso expressivo pode predominar; não exclui TEA", "Investigar audição e linguagem; acompanhar reciprocidade"],
  ["Diferenças sociais persistentes + rigidez, repetição ou interesses restritos", "Padrão que aumenta suspeita de TEA", "Avaliação clínica especializada e apoio precoce"],
  ["Olha nos olhos e fala no consultório", "Achado insuficiente para excluir TEA", "Examinar integração de olhar, gestos, afeto e turnos na história"],
  ["Triagem negativa com preocupações clínicas persistentes", "Falso negativo é possível", "Manter vigilância, avaliação e retorno planejado"],
] as const;

const steps = [
  ["01", "História longitudinal", "Quando começou? Como pede ajuda, mostra algo interessante, reage a convites e brinca com conhecidos? Perguntar sobre linguagem, audição, regressão, repetição, sensorialidade e participação na creche."],
  ["02", "Observação com tempo de adaptação", "Observar interação com cuidador, alternância de olhar, iniciativa social, gestos, imitação, turnos e flexibilidade. Registrar o que foi visto e o que só foi relatado."],
  ["03", "Triangulação de contextos", "Comparar relatos da família, escola e observação. Pedir exemplos concretos; vídeos domésticos podem ajudar quando apresentados com consentimento e sem envio a serviços não clínicos."],
  ["04", "Triagem adequada à idade", "No SUS, M-CHAT-R/F entre 16 e 30 meses; entrevista de seguimento quando indicada. AAP recomenda rastreio específico aos 18 e 24 meses. Resultado não é diagnóstico."],
  ["05", "Plano e retorno", "Registrar hipóteses a favor e contra, funcionamento, encaminhamentos para audiologia/fonoaudiologia/desenvolvimento e prazo explícito de reavaliação."],
] as const;

const references = [
  { title: "Ministério da Saúde · TEA na Atenção Primária", year: "2025–2026", url: "https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/a/autismo/aps", detail: "Rastreio 16–30 meses; apoio antes de diagnóstico." },
  { title: "Ministério da Saúde · Nova linha de cuidado", year: "2025; atualização 2026", url: "https://www.gov.br/saude/pt-br/assuntos/noticias/2025/setembro/ministerio-da-saude-orienta-teste-a-todas-as-criancas-para-identificar-possiveis-sinais-de-autismo-com-foco-na-intervencao-precoce", detail: "Triagem na APS e início oportuno do suporte." },
  { title: "Hyman et al. · Pediatrics", year: "2020; reafirmado 2025", url: "https://doi.org/10.1542/peds.2019-3447", detail: "Diretriz AAP de identificação e avaliação. DOI 10.1542/peds.2019-3447." },
  { title: "NICE CG128 · Reconhecimento e diagnóstico", year: "2011; atualização 2017", url: "https://www.nice.org.uk/guidance/cg128", detail: "Padrões clínicos e diferenciais; não usar sinais isolados." },
  { title: "Wieckowski et al. · JAMA Pediatrics", year: "2023", url: "https://pubmed.ncbi.nlm.nih.gov/36804771/", detail: "Metanálise de 50 estudos do M-CHAT(-R/F). DOI 10.1001/jamapediatrics.2022.5975; PMID 36804771." },
  { title: "CDC · Marcos aos 18 meses", year: "2025", url: "https://www.cdc.gov/act-early/milestones-in-action/18-months.html", detail: "Apontar para compartilhar interesse e outros marcos." },
  { title: "McGlade et al. · Autism Research", year: "2023", url: "https://doi.org/10.1002/aur.2924", detail: "Revisão de intervenções muito precoces; resultados heterogêneos." },
  { title: "AAP · Vigilância e triagem do desenvolvimento", year: "2024–2026", url: "https://www.aap.org/en/patient-care/screening-technical-assistance-and-resource-center/surveillancemonitoring-and-screening/", detail: "Vigilância contínua e encaminhamento sem esperar diagnóstico." },
] as const;

function Heading({ number, title, summary }: { number: string; title: string; summary?: string }) {
  return <div className="mb-4"><span className="text-[11px] font-bold uppercase tracking-[.18em] text-teal-700 dark:text-teal-300">Dia 01 · {number}</span><h3 className="mt-1 font-serif text-xl font-bold leading-snug text-slate-950 sm:text-2xl dark:text-white">{title}</h3>{summary && <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{summary}</p>}</div>;
}

export default function TeaTimidezChapter() {
  return (
    <article id="capitulo-tea-timidez" aria-labelledby="tea-timidez-title" className="scroll-mt-24 space-y-9">
      <header className="relative overflow-hidden rounded-[1.75rem] bg-[#102438] p-6 text-white sm:p-9">
        <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full border-[35px] border-teal-400/10" aria-hidden="true" />
        <div className="relative">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-[.14em] text-amber-200"><BookOpen className="h-4 w-4" /> Biblioteca Clínica NeuroPed · TEA <span className="rounded-full border border-amber-300/40 px-2 py-1">Revisão médica pendente</span></div>
          <h2 id="tea-timidez-title" className="mt-5 max-w-3xl font-serif text-2xl font-bold leading-tight sm:text-4xl">Dia 01/365 — Como distinguir sinais de TEA de timidez na primeira infância?</h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-200 sm:text-base">Uma decisão clínica de consultório: diferenciar retraimento situacional de diferenças persistentes na comunicação social, sem diagnosticar por um único comportamento.</p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs text-slate-200"><span className="rounded-full bg-white/10 px-3 py-1.5"><Clock3 className="mr-1 inline h-3.5 w-3.5" /> 6 min de leitura</span><span className="rounded-full bg-white/10 px-3 py-1.5">Versão 0.1.0 · 29/10/2026</span><span className="rounded-full bg-amber-200/10 px-3 py-1.5 text-amber-100">Evidência pública; Consensus indisponível</span></div>
        </div>
      </header>

      <section className="rounded-2xl border-l-4 border-teal-600 bg-teal-50 p-5 dark:bg-teal-950/30">
        <Heading number="ESSENCIAL" title="Em 30 segundos" />
        <p className="text-sm leading-7 text-slate-800 dark:text-slate-200"><strong>Timidez:</strong> aproximação lenta de desconhecidos, mas comunicação e brincadeira recíprocas quando a criança está segura. <strong>Suspeita de TEA:</strong> diferenças persistentes de reciprocidade e comunicação social, associadas a padrões restritos ou repetitivos. O que pesa é a <strong>qualidade da atenção compartilhada, dos gestos e do brincar em vários contextos</strong>. Contato visual ou fala isolados não confirmam nem excluem TEA.</p>
      </section>

      <section>
        <Heading number="01" title="Sinais que mudam a conduta" summary="Investigue a combinação e a persistência; não transforme um marco isolado em diagnóstico." />
        <div className="grid gap-3 md:grid-cols-2">{alerts.map((alert, i) => <div key={alert} className="flex gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-900 dark:bg-rose-950/30"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-700 dark:text-rose-300" aria-hidden="true" /><p className="text-sm leading-6 text-slate-800 dark:text-slate-200"><span className="sr-only">Alerta {i + 1}: </span>{alert}</p></div>)}</div>
        <p className="mt-3 text-xs leading-6 text-slate-500 dark:text-slate-400">Regressão e sinais neurológicos associados exigem avaliação da causa, não apenas investigação de TEA.</p>
      </section>

      <section>
        <Heading number="02" title="Fluxograma decisório" summary="Mapa de decisão responsivo: cada seta leva a uma ação, não a um diagnóstico automático." />
        <div role="group" aria-label="Fluxo clínico para diferenciar timidez de sinais de TEA" className="rounded-[1.6rem] bg-[#12253c] p-4 text-white sm:p-7">
          <div className="mx-auto max-w-xl rounded-xl border border-amber-300/40 bg-amber-300/10 p-4 text-center"><strong className="text-amber-100">Queixa: “é tímido” / “não interage”</strong></div>
          <ArrowDown className="mx-auto my-3 h-6 w-6 text-amber-200" aria-hidden="true" />
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-white/20 bg-white/10 p-4"><span className="text-xs font-bold text-amber-200">1 · PRIORIDADE</span><h4 className="mt-2 font-semibold">Regressão ou alerta neurológico?</h4><p className="mt-2 text-sm leading-6 text-slate-200"><strong>Sim:</strong> avaliar prioritariamente, investigar causa e iniciar suporte.</p></div>
            <div className="rounded-xl border border-white/20 bg-white/10 p-4"><span className="text-xs font-bold text-amber-200">2 · PADRÃO</span><h4 className="mt-2 font-semibold">Diferenças persistentes de comunicação social e repetição?</h4><p className="mt-2 text-sm leading-6 text-slate-200"><strong>Sim ou incerto:</strong> triagem por idade, avaliação de desenvolvimento e audição.</p></div>
            <div className="rounded-xl border border-white/20 bg-white/10 p-4"><span className="text-xs font-bold text-amber-200">3 · CONTEXTO</span><h4 className="mt-2 font-semibold">Com familiares compartilha, imita e brinca em turnos?</h4><p className="mt-2 text-sm leading-6 text-slate-200"><strong>Sim:</strong> timidez é plausível; confirmar em mais de um contexto e acompanhar.</p></div>
          </div>
          <ArrowDown className="mx-auto my-3 h-6 w-6 text-amber-200" aria-hidden="true" />
          <div className="rounded-xl border border-teal-300/40 bg-teal-300/10 p-4 text-center text-sm leading-6"><strong>Saída obrigatória:</strong> registrar observação × relato × hipótese, impacto funcional, encaminhamento e data de retorno.</div>
        </div>
      </section>

      <section>
        <Heading number="03" title="Achado → interpretação → próxima ação" />
        <div className="space-y-3">{matrix.map(([finding, interpretation, action]) => <div key={finding} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-3 dark:border-slate-700 dark:bg-slate-900"><p className="text-sm leading-6 text-slate-900 dark:text-slate-100"><strong className="mb-1 block text-[11px] uppercase tracking-wider text-teal-700 dark:text-teal-300">Achado</strong>{finding}</p><p className="text-sm leading-6 text-slate-700 dark:text-slate-300"><strong className="mb-1 block text-[11px] uppercase tracking-wider text-teal-700 dark:text-teal-300">Interpretação</strong>{interpretation}</p><p className="text-sm leading-6 text-slate-700 dark:text-slate-300"><strong className="mb-1 block text-[11px] uppercase tracking-wider text-teal-700 dark:text-teal-300">Próxima ação</strong>{action}</p></div>)}</div>
      </section>

      <section>
        <Heading number="04" title="Consulta operacional em cinco etapas" />
        <ol className="grid gap-3 md:grid-cols-2">{steps.map(([n, name, detail]) => <li key={n} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900"><span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#102438] text-sm font-bold text-amber-200">{n}</span><h4 className="mt-3 font-semibold text-slate-900 dark:text-white">{name}</h4><p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{detail}</p></li>)}</ol>
      </section>

      <section>
        <Heading number="05" title="Investigar agora ou observar com plano?" />
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 dark:border-rose-900 dark:bg-rose-950/30"><h4 className="font-bold text-rose-900 dark:text-rose-100">Investigar sem adiar</h4><p className="mt-2 text-sm leading-7 text-slate-800 dark:text-slate-200">Regressão, atenção compartilhada/gestos persistentemente reduzidos, diferenças sociais associadas a repetição/rigidez, atraso importante de linguagem ou prejuízo funcional. Avaliar audição e desenvolvimento conforme achados. Iniciar apoio às necessidades identificadas, mesmo sem diagnóstico fechado.</p></div>
          <div className="rounded-2xl border border-teal-200 bg-teal-50 p-5 dark:border-teal-900 dark:bg-teal-950/30"><h4 className="font-bold text-teal-900 dark:text-teal-100">Observação estruturada</h4><p className="mt-2 text-sm leading-7 text-slate-800 dark:text-slate-200">Comunicação social e marcos preservados com pessoas familiares, retraimento principalmente diante de estranhos, sem regressão ou prejuízo relevante. Obter relato escolar e reavaliar em cerca de 4–8 semanas — sugestão operacional, não ponto de corte validado.</p></div>
        </div>
      </section>

      <section>
        <Heading number="06" title="Manejo, família e escola" />
        <div className="grid gap-3 md:grid-cols-2"><div className="rounded-2xl bg-slate-50 p-5 dark:bg-slate-900"><h4 className="font-bold text-slate-900 dark:text-white">Timidez provável</h4><p className="mt-2 text-sm leading-7 text-slate-700 dark:text-slate-300">Não forçar exposição ou contato visual. Propor aproximação gradual, previsibilidade e brincadeiras em pequenos grupos. Se houver evitação e sofrimento persistentes, investigar ansiedade e contexto.</p></div><div className="rounded-2xl bg-slate-50 p-5 dark:bg-slate-900"><h4 className="font-bold text-slate-900 dark:text-white">Atraso ou suspeita de TEA</h4><p className="mt-2 text-sm leading-7 text-slate-700 dark:text-slate-300">Apoiar comunicação funcional e interações responsivas; considerar fonoaudiologia e avaliação multiprofissional conforme necessidades. Não há indicação de medicação para “timidez” ou sinais nucleares de TEA.</p></div></div>
        <blockquote className="mt-4 rounded-2xl border-l-4 border-amber-500 bg-amber-50 p-5 text-sm leading-7 text-slate-800 dark:bg-amber-950/30 dark:text-slate-200">“Ficar retraído diante de pessoas novas pode ser parte do temperamento. Precisamos compreender como a criança compartilha interesses e brinca quando está confortável. Há sinais que merecem acompanhamento, mas isso ainda não é um diagnóstico fechado.”</blockquote>
        <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300"><strong>À escola:</strong> solicitar exemplos de brincadeira livre, convites de pares, gestos, turnos e transições. Evitar interpretar silêncio como desinteresse.</p>
      </section>

      <section>
        <Heading number="07" title="Caso de treinamento — 100% fictício" />
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900"><p className="text-sm leading-7 text-slate-700 dark:text-slate-200">Criança fictícia de 2 anos e 4 meses permanece silenciosa nos primeiros dez minutos da consulta. Em casa, segundo a cuidadora, aponta aviões para mostrar, alterna olhar entre objeto e adulto, imita e brinca de faz de conta. Na creche observa antes de participar, depois entra em brincadeiras com turnos. Não há regressão ou repetição relevante.</p><p className="mt-3 border-t border-slate-200 pt-3 text-sm leading-7 text-slate-700 dark:border-slate-700 dark:text-slate-200"><strong>Interpretação:</strong> inibição comportamental é hipótese plausível; o silêncio no consultório não é diagnóstico. <strong>Ação:</strong> documentar marcos e audição, colher observações da creche, orientar aproximação gradual e reavaliar. Não excluir TEA definitivamente por um único encontro.</p></div>
      </section>

      <section>
        <Heading number="08" title="Três erros frequentes" />
        <ol className="grid gap-3 md:grid-cols-3"><li className="rounded-2xl border border-slate-200 p-4 text-sm leading-7 dark:border-slate-700"><strong className="block text-rose-700 dark:text-rose-300">01 · “Olha nos olhos, então não é TEA.”</strong> Contato visual e fala preservados não excluem diferenças qualitativas de reciprocidade.</li><li className="rounded-2xl border border-slate-200 p-4 text-sm leading-7 dark:border-slate-700"><strong className="block text-rose-700 dark:text-rose-300">02 · “Não falou comigo, então é TEA.”</strong> Um consultório desconhecido não representa toda a comunicação social.</li><li className="rounded-2xl border border-slate-200 p-4 text-sm leading-7 dark:border-slate-700"><strong className="block text-rose-700 dark:text-rose-300">03 · “Aguardar laudo para apoiar.”</strong> Atrasos funcionais merecem intervenção antes da conclusão diagnóstica.</li></ol>
      </section>

      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900 dark:bg-amber-950/30">
        <Heading number="09" title="Incerteza e força da evidência" />
        <p className="text-sm leading-7 text-slate-700 dark:text-slate-200">Não há teste único para distinguir timidez de TEA. Diretrizes AAP, NICE e Ministério da Saúde sustentam vigilância e avaliação contextualizada (recomendações de consenso). A metanálise de 50 estudos do M-CHAT(-R/F) estimou sensibilidade agrupada de <strong>0,83</strong> e especificidade de <strong>0,94</strong>, com heterogeneidade importante; esses números não são probabilidades individuais. Estudos de intervenção precoce têm diferenças de amostra, método e desfecho. O retorno em 4–8 semanas é proposta prática, não intervalo validado.</p>
      </section>

      <section>
        <Heading number="10" title="Bibliografia auditável" summary="Fontes verificadas em 29/10/2026; referências clicáveis. Nenhuma fonte foi atribuída a uma pesquisa Consensus que não ocorreu." />
        <ol className="grid gap-2 md:grid-cols-2">{references.map((ref, index) => <li key={ref.url} className="rounded-xl border border-slate-200 p-4 dark:border-slate-700"><span className="text-[11px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-300">{String(index + 1).padStart(2, "0")} · {ref.year}</span><a href={ref.url} target="_blank" rel="noopener noreferrer" className="mt-1 block break-words text-sm font-semibold leading-6 text-sky-800 underline decoration-sky-300 underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-500 dark:text-sky-300">{ref.title}</a><p className="mt-1 text-xs leading-6 text-slate-600 dark:text-slate-300">{ref.detail}</p></li>)}</ol>
      </section>

      <footer className="rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900 dark:bg-amber-950/30">
        <div className="flex items-center gap-2 text-sm font-bold text-amber-950 dark:text-amber-100"><ShieldCheck className="h-5 w-5" /> Material educacional em revisão médica</div>
        <p className="mt-2 text-xs leading-6 text-slate-700 dark:text-slate-200">Versão 0.1.0 · 29/10/2026 · Sem aceite ou assinatura médica. PCDRJADSON offline; pesquisa Consensus pelo Windows não realizada. Conector oficial Consensus tentou pesquisa em 29/10/2026 e retornou cota mensal de 500 pesquisas esgotada, com reinício anunciado para 01/11/2026. Síntese provisória fundamentada nas fontes públicas listadas. Sem dados de pacientes reais ou itens protegidos de testes.</p>
      </footer>
    </article>
  );
}
