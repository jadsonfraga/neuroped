import { ArrowDown, AlertTriangle, BookOpenCheck, ExternalLink, ShieldAlert } from "lucide-react";

const question = "Como diferenciar dificuldade de alfabetização de dislexia?";
const findings: [string, string, string][] = [
  ["Ensino irregular e progresso após reforço", "Lacuna pedagógica plausível, sem exclusão automática de transtorno", "Ensino fônico explícito, metas e reavaliação documentada"],
  ["Decodificação imprecisa e fluência baixa apesar de apoio", "Risco de transtorno específico de aprendizagem com prejuízo na leitura", "Avaliação de leitura/escrita, linguagem e intervenção dirigida em paralelo"],
  ["Compreensão oral boa, leitura de palavras fraca", "Acesso ao texto escrito mais comprometido que linguagem oral", "Investigar precisão, palavras novas, fluência e ortografia"],
  ["Decodifica bem, mas não compreende o que lê", "Linguagem e compreensão textual podem ser o problema principal", "Investigar vocabulário, compreensão oral e ensino de estratégias"],
  ["Desatenção, ansiedade, TDL ou privação de sono", "Fatores associados ou comorbidades possíveis", "Investigar e tratar o que for indicado, sem descartar dislexia"],
];
const steps: [string, string][] = [
  ["Linha do tempo", "Início, história familiar, linguagem anterior, frequência escolar e intervenções já realizadas."],
  ["Oportunidade de ensino", "Ano, método, intensidade de instrução, idioma, faltas e comparação com pares com exposição semelhante."],
  ["Perfil de leitura", "Precisão, decodificação de palavras novas, fluência, escrita/ortografia, compreensão oral e escrita."],
  ["Diferenciais", "Audição, visão, TDL, TDAH, cognição global quando indicada, bilinguismo, sono, ansiedade e fatores escolares."],
  ["Hipóteses proporcionais", "Registrar dificuldade pedagógica, risco de dislexia ou transtorno em investigação; não inferir diagnóstico por um sinal."],
  ["Plano mensurável", "Instrução fônica, adaptações, medidas comparáveis de leitura e retorno pactuado com escola/família."],
];
const refs = [
  { name: "Brasil · Lei 14.254/2021", url: "https://legis.senado.leg.br/norma/35207438", note: "Acompanhamento integral e identificação precoce. Norma legal, não protocolo diagnóstico." },
  { name: "Hall et al. · Forty Years of Reading Intervention Research (2022/2023)", url: "https://doi.org/10.1002/rrq.477", note: "Metanálise: 53 estudos, N=6.053, g≈0,33; heterogeneidade e efeitos distintos por domínio." },
  { name: "Silva et al. · Rapid Automatized Naming and Explicit Phonological Processing (2020)", url: "https://doi.org/10.3389/fpsyg.2020.00928", note: "Estudo brasileiro observacional; nomeação rápida não é diagnóstico isolado." },
  { name: "Barbosa et al. · Profile of language and cognitive functions (2015)", url: "https://doi.org/10.1590/2317-1782/20152015043", note: "Amostra de falantes do português brasileiro; interpretação contextual." },
  { name: "NICHD · National Reading Panel (2000)", url: "https://www.nichd.nih.gov/publications/pubs/nrp/Pages/findings.aspx", note: "Síntese clássica sobre ensino fônico sistemático; extrapolação de contexto anglófono." },
  { name: "International Dyslexia Association · Structured Literacy", url: "https://dyslexiaida.org/structuredliteracy/", note: "Orientação profissional sobre ensino explícito e sistemático; não estudo primário." },
  { name: "WHO · ICD-11, developmental learning disorder (6A03)", url: "https://icd.who.int/browse/2025-01/mms/en", note: "Classificação diagnóstica; não substitui avaliação clínica e escolar." },
];
function Heading({ number, children }: { number: string; children: React.ReactNode }) {
  return <div className="mb-4 flex items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-800 text-sm font-black text-white">{number}</span><h3 className="font-serif text-xl font-bold text-slate-900 sm:text-2xl dark:text-white">{children}</h3></div>;
}
function FlowBox({ title, children, tone = "neutral" }: { title: string; children: React.ReactNode; tone?: "neutral" | "risk" | "good" }) {
  const style = tone === "risk" ? "border-rose-300 bg-rose-100 text-rose-950 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-100" : tone === "good" ? "border-teal-300 bg-teal-50 text-teal-950 dark:border-teal-900 dark:bg-teal-950 dark:text-teal-100" : "border-amber-300 bg-amber-50 text-slate-950 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100";
  return <div className={"rounded-xl border p-4 " + style}><strong className="block text-xs uppercase tracking-wider">{title}</strong><p className="mt-2 text-sm leading-6">{children}</p></div>;
}
export default function AlfabetizacaoDislexiaChapter() {
  return <article id="capitulo-alfabetizacao-dislexia" aria-labelledby="alfabetizacao-dislexia-title" className="scroll-mt-24 space-y-8 sm:space-y-10">
    <header className="overflow-hidden rounded-[1.8rem] bg-[#12253c] p-5 text-white sm:p-9">
      <p className="text-xs font-black uppercase tracking-[.18em] text-amber-200">Dia 04/365 · Aprendizagem e escola · 6 minutos</p>
      <h2 id="alfabetizacao-dislexia-title" className="mt-3 max-w-3xl font-serif text-3xl font-bold leading-tight sm:text-4xl">Dia 04/365 — {question}</h2>
      <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-200">A diferença está no perfil de leitura, nas oportunidades de ensino e na trajetória com intervenção — não em uma idade mágica.</p>
      <div className="mt-5 rounded-xl border border-amber-300/35 bg-amber-300/10 p-4 text-sm leading-6 text-amber-100"><ShieldAlert className="mr-2 inline h-4 w-4" aria-hidden="true" /> MATERIAL EDUCACIONAL EM REVISÃO MÉDICA. Sem aceite ou assinatura. Pesquisa Consensus Pro realizada em 02/11/2026.</div>
    </header>
    <section className="rounded-2xl border-l-4 border-teal-600 bg-teal-50 p-5 dark:bg-teal-950/30">
      <Heading number="01">Em 30 segundos</Heading>
      <p className="text-sm leading-7 text-slate-800 dark:text-slate-200">Dificuldade inicial pode refletir ensino insuficiente, ausências e variação no ritmo de aquisição. <strong>Dislexia torna-se hipótese mais forte</strong> quando a leitura de palavras é imprecisa ou muito lenta e a dificuldade persiste apesar de ensino explícito e apoio dirigido. Verifique precisão, fluência, decodificação de palavras novas, ortografia, compreensão e oportunidades de aprendizagem. Não espere o diagnóstico para intervir; inversões isoladas de letras não definem dislexia.</p>
    </section>
    <section><Heading number="02">Sinais e red flags que mudam conduta</Heading>
      <p className="text-sm leading-7 text-slate-700 dark:text-slate-200">História familiar, atraso prévio de linguagem, dificuldade com letras e sons, segmentação fonológica, soletração, palavras novas e fluência abaixo de pares com escolarização comparável justificam investigação precoce. Erros de espelhamento isolados são inespecíficos.</p>
      <div className="mt-3 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm leading-7 text-rose-950 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-100"><AlertTriangle className="mt-1 h-5 w-5 shrink-0" aria-hidden="true" /><p><strong>Prioridade médica:</strong> perda súbita ou progressiva de habilidade já adquirida, sinais neurológicos focais, regressão global, suspeita importante de alteração auditiva/visual ou sofrimento emocional intenso. Não atribuir esses sinais automaticamente à dislexia.</p></div>
    </section>
    <section><Heading number="03">Fluxograma decisório visual responsivo</Heading>
      <div role="group" aria-label="Fluxograma de alfabetização e dislexia: checar sinais médicos de alerta, oportunidades de ensino, perfil de leitura, intervir e medir resposta" className="rounded-[1.6rem] bg-slate-800 p-4 sm:p-7">
        <div className="mx-auto max-w-lg rounded-xl border border-amber-200/50 bg-white/10 p-4 text-center font-bold text-amber-100">Queixa de leitura ou escrita → história, escola e habilidades</div>
        <ArrowDown className="mx-auto my-3 h-6 w-6 text-amber-200" aria-hidden="true" />
        <div className="grid gap-3 md:grid-cols-3">
          <FlowBox title="1 · Alerta médico" tone="risk">Regressão, déficit focal, alteração sensorial? <strong>Avaliação prioritária</strong> se presente.</FlowBox>
          <FlowBox title="2 · Contexto">Oportunidade de ensino, idioma, frequência, linguagem, decodificação, fluência e compreensão.</FlowBox>
          <FlowBox title="3 · Ação imediata" tone="good">Instrução fônica explícita, apoio escolar e registro de metas; investigar em paralelo se alto risco.</FlowBox>
        </div>
        <ArrowDown className="mx-auto my-3 h-6 w-6 text-amber-200" aria-hidden="true" />
        <p className="rounded-xl border border-teal-300/40 bg-teal-300/10 p-4 text-center text-sm leading-7 text-white"><strong>Reavaliar resposta:</strong> melhora consistente → manter suporte; persistência/desproporção → avaliação especializada, sem suspender intervenção.</p>
      </div>
    </section>
    <section><Heading number="04">Achado → interpretação → próxima ação</Heading>
      <div className="space-y-3">{findings.map(([finding, meaning, action]) => <div key={finding} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-3 dark:border-slate-700 dark:bg-slate-900">{[["Achado", finding], ["Interpretação", meaning], ["Próxima ação", action]].map(([label, value]) => <p key={label} className="text-sm leading-6 text-slate-700 dark:text-slate-200"><strong className="mb-1 block text-xs uppercase tracking-wider text-teal-700 dark:text-teal-300">{label}</strong>{value}</p>)}</div>)}</div>
    </section>
    <section><Heading number="05">Consulta operacional em seis etapas</Heading>
      <ol className="grid gap-3 sm:grid-cols-2">{steps.map(([name, detail], i) => <li key={name} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900"><span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-amber-200">{i + 1}</span><h4 className="mt-3 font-bold text-slate-900 dark:text-white">{name}</h4><p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{detail}</p></li>)}</ol>
    </section>
    <section><Heading number="06">Quando investigar versus observar</Heading>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 dark:border-rose-900 dark:bg-rose-950/30"><h4 className="font-bold text-rose-900 dark:text-rose-100">Investigar sem demora</h4><p className="mt-2 text-sm leading-7 text-slate-800 dark:text-slate-200">Regressão, sinais médicos, prejuízo marcante, forte risco familiar, dificuldade fonológica relevante ou persistência. Avaliação fonoaudiológica e educacional pode ocorrer ao mesmo tempo que o apoio.</p></div>
        <div className="rounded-2xl border border-teal-200 bg-teal-50 p-5 dark:border-teal-900 dark:bg-teal-950/30"><h4 className="font-bold text-teal-900 dark:text-teal-100">Observação ativa, nunca espera passiva</h4><p className="mt-2 text-sm leading-7 text-slate-800 dark:text-slate-200">Dificuldade inicial com ensino irregular: oferecer instrução explícita e monitorar por cerca de 8–12 semanas como janela prática, não critério formal. Reavaliar precisão, fluência e participação.</p></div>
      </div>
      <p className="mt-3 text-xs leading-6 text-slate-500 dark:text-slate-400">DSM-5-TR considera persistência por pelo menos seis meses apesar de intervenção direcionada. Isso não exige esperar seis meses para começar suporte. CID-11 e DSM-5-TR não se resumem a um teste ou corte fixo de idade.</p>
    </section>
    <section><Heading number="07">Manejo, seguimento e comunicação com famílias/escola</Heading>
      <p className="text-sm leading-7 text-slate-700 dark:text-slate-200">Priorizar ensino explícito, sistemático e cumulativo de grafema–fonema, decodificação, ortografia e leitura com feedback. A metanálise de Hall et al. encontrou efeito médio g≈0,33 em leitura, com heterogeneidade e menor ganho em compreensão que em leitura de palavras. Monitorar amostras equivalentes de leitura, autoestima e participação. A Lei 14.254/2021 estabelece identificação precoce e apoio articulado entre escola, família e saúde; não transforma um teste em diagnóstico nem exige aguardar laudo para apoio pedagógico. Ajustes funcionais podem incluir tempo adicional, leitura de enunciados quando a habilidade de leitura não for o objeto da avaliação e formas orais de demonstrar conhecimento.</p>
      <blockquote className="mt-4 rounded-xl border-l-4 border-amber-500 bg-amber-50 p-5 text-sm leading-7 text-slate-800 dark:bg-amber-950/30 dark:text-slate-200">“A dificuldade é real. Vamos verificar como a leitura foi ensinada, oferecer apoio mais dirigido e medir a evolução. Só então teremos mais segurança sobre a origem e a necessidade de diagnóstico.”</blockquote>
      <p className="mt-3 text-xs leading-6 text-slate-500 dark:text-slate-400">Não há medicamento específico para dislexia. TDAH, ansiedade ou outros transtornos associados exigem avaliação e tratamento próprios, sem prescrição automática.</p>
    </section>
    <section><Heading number="08">Caso clínico inteiramente fictício</Heading>
      <p className="rounded-2xl bg-slate-50 p-5 text-sm leading-7 text-slate-800 dark:bg-slate-900 dark:text-slate-200">Criança fictícia de 7 anos, no 2º ano, com frequência regular e reforço fônico documentado, ainda lê palavras simples lentamente e com trocas frequentes. Compreende histórias ouvidas e há histórico familiar de leitura difícil. <strong>Fato relatado:</strong> prejuízo persistente na decodificação. <strong>Inferência:</strong> risco elevado de transtorno de aprendizagem com prejuízo na leitura. <strong>Ação:</strong> intensificar intervenção, avaliar linguagem/leitura com profissionais habilitados, acompanhar resposta e adaptar atividades; não fechar diagnóstico por esse relato isolado.</p>
    </section>
    <section><Heading number="09">Três erros frequentes</Heading>
      <ol className="list-decimal space-y-2 pl-6 text-sm leading-7 text-slate-700 dark:text-slate-200"><li>Diagnosticar dislexia por inversão isolada de letras ou pela idade.</li><li>Atribuir tudo à escola e deixar criança com sinais persistentes sem intervenção ou investigação.</li><li>Esperar laudo para oferecer apoio ou tratar melhora parcial como prova de ausência de transtorno.</li></ol>
    </section>
    <section><Heading number="10">Pontos de incerteza e força da evidência</Heading>
      <p className="text-sm leading-7 text-slate-700 dark:text-slate-200"><strong>Mais consistente:</strong> ensino fônico sistemático melhora resultados médios de leitura, mas efeitos variam por dose e domínio (metanálise). <strong>Associação, não prova:</strong> processamento fonológico e nomeação rápida ajudam a caracterizar risco em estudos brasileiros. Resposta à intervenção não é diagnóstico isolado. O intervalo de 8–12 semanas é sugestão operacional, não exigência universal. Evidências anglófonas precisam de contextualização para português brasileiro. Neuroimagem e EEG não são exames de rotina para diagnosticar dislexia.</p>
    </section>
    <section><Heading number="11">Bibliografia auditável</Heading>
      <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">Fontes verificadas em 02/11/2026. Pesquisa Consensus Pro concluída pelo conector oficial; o navegador Windows abriu o Consensus, mas a pesquisa gráfica não foi confirmada.</p>
      <ul className="space-y-2">{refs.map(ref => <li key={ref.url} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900"><a href={ref.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-start gap-2 text-sm font-semibold text-teal-800 underline underline-offset-4 dark:text-teal-200">{ref.name}<ExternalLink className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /></a><p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">{ref.note}</p></li>)}</ul>
      <p className="mt-4 text-xs leading-6 text-slate-500 dark:text-slate-400"><a href="https://consensus.app/search/investigue-para-capitulo-clinico-educacional-de-ne/H6yUG78oRjGwhBlQ3nL4bA/" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">Investigação Consensus Pro — 02/11/2026</a>. Versão 0.1.0, revisão médica pendente.</p>
    </section>
    <footer className="flex items-center gap-2 border-t border-slate-200 pt-5 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400"><BookOpenCheck className="h-4 w-4" aria-hidden="true" /> Biblioteca Clínica NeuroPed 365 · 02/11/2026 · revisão médica pendente</footer>
  </article>;
}
