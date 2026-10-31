import { ArrowDown, AlertTriangle, BookOpenCheck, CalendarClock, ClipboardCheck, ExternalLink, ShieldAlert } from "lucide-react";

const question = "Como diferenciar desatenção de imaturidade etária?";
const rows: [string, string, string][] = [
  ["Mais novo da turma; dificuldade em cópias longas", "Possível diferença maturacional e/ou exigência desproporcional", "Comparar pares da mesma idade; fracionar tarefas"],
  ["Desatenção concentrada na leitura", "Aprendizagem, linguagem ou ensino podem explicar a queixa", "Investigar decodificação, compreensão e contexto escolar"],
  ["Prejuízo em casa, escola e atividades cotidianas", "Padrão abrangente; TDAH é hipótese, não conclusão", "Investigar critérios clínicos e diferenciais com múltiplas fontes"],
  ["Ronco, sono insuficiente ou sonolência", "Comprometimento atencional possivelmente secundário", "Avaliar sono e comorbidades conforme apresentação"],
  ["Escola relata sintomas; família não", "Contextos e demandas diferentes; divergência não decide diagnóstico", "Obter exemplos, estratégias testadas e observação complementar"],
];
const steps: [string, string][] = [
  ["Prejuízo antes do rótulo", "Registre três exemplos verificáveis, frequência, duração e consequências funcionais."],
  ["Linha do tempo", "Caracterize início, persistência, transição escolar, oportunidades de ensino e acontecimentos familiares."],
  ["Calibração etária", "Registre idade em meses, corte de matrícula, posição na turma e adequação da demanda."],
  ["Convergência", "Ouça responsáveis, professor e criança; foco em atividade favorita não exclui TDAH."],
  ["Diferenciais", "Avalie sono, ansiedade, humor, linguagem, aprendizagem, visão/audição e medicamentos conforme indícios."],
  ["Plano e retorno", "Separe relato, observação e hipótese; defina metas e reavaliação. Escalas não fecham diagnóstico."],
];
const refs = [
  { name: "Ministério da Saúde · PCDT TDAH (2022; página 2025)", url: "https://www.gov.br/saude/pt-br/assuntos/pcdt/t/transtorno-do-deficit-de-atencao-com-hiperatividade-tdah/view", note: "Diretriz brasileira; interpretação contextual e abordagem assistencial." },
  { name: "AAP · Pediatrics 2019;144:e20192528", url: "https://doi.org/10.1542/peds.2019-2528", note: "DOI 10.1542/peds.2019-2528; PMID 31570648. Diagnóstico multicontextual, qualidade B." },
  { name: "NICE NG87 · diagnóstico e manejo", url: "https://www.nice.org.uk/guidance/ng87/chapter/Recommendations", note: "Escalas são complementares; prejuízo em múltiplos ambientes." },
  { name: "Frisira, Holland & Sayal · revisão e metanálise 2024/2025", url: "https://pubmed.ncbi.nlm.nih.gov/38767699/", note: "DOI 10.1007/s00787-024-02459-x; PMID 38767699. Efeito da idade relativa; heterogeneidade elevada." },
  { name: "Sayal et al. · revisão sistemática 2018/2019", url: "https://pubmed.ncbi.nlm.nih.gov/30293121/", note: "DOI 10.1007/s00787-018-1229-6; PMID 30293121. Associação populacional, não regra individual." },
];
function Heading({ n, title }: { n: string; title: string }) {
  return <div className="mb-4 flex items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-800 text-sm font-black text-white">{n}</span><h3 className="font-serif text-xl font-bold text-slate-900 sm:text-2xl dark:text-white">{title}</h3></div>;
}
export default function DesatencaoImaturidadeChapter() {
  return (
    <article id="capitulo-desatencao-imaturidade" aria-labelledby="desatencao-imaturidade-title" className="scroll-mt-24 space-y-8 sm:space-y-10">
      <header className="overflow-hidden rounded-[1.8rem] bg-[#102438] p-5 text-white sm:p-9">
        <p className="text-xs font-black uppercase tracking-[.18em] text-amber-200">Dia 02/365 · TDAH · 6 minutos</p>
        <h2 id="desatencao-imaturidade-title" className="mt-3 max-w-3xl font-serif text-3xl font-bold leading-tight sm:text-4xl">Dia 02/365 — {question}</h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-200">Uma decisão clínica antes do rótulo: idade em meses, prejuízo funcional, contexto escolar e alternativas explicativas.</p>
        <div className="mt-5 rounded-xl border border-amber-300/35 bg-amber-300/10 p-4 text-sm leading-6 text-amber-100">
          <ShieldAlert className="mr-2 inline h-4 w-4" aria-hidden="true" /> MATERIAL EDUCACIONAL EM REVISÃO MÉDICA. Sem aceite ou assinatura médica. Consensus indisponível por cota; síntese provisória de fontes públicas verificadas em 31/10/2026.
        </div>
      </header>
      <section className="rounded-2xl border-l-4 border-teal-600 bg-teal-50 p-5 dark:bg-teal-950/30">
        <Heading n="01" title="Em 30 segundos" />
        <p className="text-sm leading-7 text-slate-800 dark:text-slate-200">Desatenção não é sinônimo de TDAH. Pergunte se o padrão é <strong>persistente, desproporcional à idade e ao desenvolvimento e prejudicial em mais de um contexto</strong>. Compare a criança com pares de idade cronológica semelhante, não apenas com a média da turma. Ser dos mais novos aumenta o risco populacional de diagnóstico, mas não confirma nem exclui TDAH individualmente.</p>
      </section>
      <section><Heading n="02" title="Sinais que mudam a conduta" />
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 dark:border-rose-900 dark:bg-rose-950/30">
          <p className="flex items-start gap-2 text-sm leading-7 text-slate-800 dark:text-slate-200"><AlertTriangle className="mt-1 h-5 w-5 shrink-0 text-rose-700" aria-hidden="true" />Mudança súbita do comportamento, regressão, episódios com perda de responsividade, alteração de consciência, déficit neurológico novo ou risco de autoagressão exigem avaliação prioritária ou urgente conforme gravidade. Não atribuir a TDAH. Dificuldades persistentes de aprendizagem, linguagem, audição/visão ou sono exigem investigação dirigida.</p>
        </div>
      </section>
      <section><Heading n="03" title="Fluxograma decisório" />
        <div aria-label="Fluxo clínico para diferenciar desatenção de imaturidade etária" className="rounded-[1.6rem] bg-[#12253c] p-4 text-white sm:p-7">
          <div className="mx-auto max-w-xl rounded-xl border border-amber-300/40 bg-amber-300/10 p-4 text-center font-bold text-amber-100">Queixa de desatenção</div>
          <ArrowDown className="mx-auto my-3 h-5 w-5 text-amber-200" aria-hidden="true" />
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-white/20 bg-white/10 p-4"><strong className="text-xs uppercase tracking-wider text-amber-200">1 · Segurança</strong><p className="mt-2 text-sm leading-6">Regressão, alteração aguda, crise ou risco? <strong>Sim:</strong> priorizar avaliação.</p></div>
            <div className="rounded-xl border border-white/20 bg-white/10 p-4"><strong className="text-xs uppercase tracking-wider text-amber-200">2 · Calibração</strong><p className="mt-2 text-sm leading-6">Idade em meses, corte escolar, sono e demandas. Prejuízo em mais de um ambiente?</p></div>
            <div className="rounded-xl border border-white/20 bg-white/10 p-4"><strong className="text-xs uppercase tracking-wider text-amber-200">3 · Diferenciais</strong><p className="mt-2 text-sm leading-6">Sono, ansiedade, linguagem, aprendizagem, visão/audição e ambiente podem explicar?</p></div>
          </div>
          <ArrowDown className="mx-auto my-3 h-5 w-5 text-amber-200" aria-hidden="true" />
          <p className="rounded-xl border border-teal-300/40 bg-teal-300/10 p-4 text-center text-sm leading-6"><strong>Saída:</strong> hipótese contextualizada + apoio funcional + retorno. Se padrão incerto, observar com intervenção e segunda fonte. Escala isolada não confirma TDAH.</p>
        </div>
      </section>
      <section><Heading n="04" title="Achado → interpretação → próxima ação" />
        <div className="space-y-3">{rows.map(([finding, meaning, action]) => <div key={finding} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-3 dark:border-slate-700 dark:bg-slate-900">{[["Achado", finding],["Interpretação",meaning],["Próxima ação",action]].map(([label,value])=><p key={label} className="text-sm leading-6 text-slate-700 dark:text-slate-200"><strong className="mb-1 block text-xs uppercase tracking-wider text-teal-700 dark:text-teal-300">{label}</strong>{value}</p>)}</div>)}</div>
      </section>
      <section><Heading n="05" title="Consulta operacional em seis etapas" />
        <ol className="grid gap-3 sm:grid-cols-2">{steps.map(([name,detail],i)=><li key={name} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900"><span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#102438] text-xs font-bold text-amber-200">{i+1}</span><h4 className="mt-3 font-bold text-slate-900 dark:text-white">{name}</h4><p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{detail}</p></li>)}</ol>
      </section>
      <section><Heading n="06" title="Investigar ou observar?" /><div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 dark:border-rose-900 dark:bg-rose-950/30"><h4 className="font-bold text-rose-900 dark:text-rose-100">Investigar sem adiar</h4><p className="mt-2 text-sm leading-7 text-slate-800 dark:text-slate-200">Prejuízo persistente importante, múltiplos ambientes afetados, comorbidades prováveis, sinais atípicos ou alertas clínicos. Investigar explicações alternativas mesmo quando TDAH for plausível.</p></div>
        <div className="rounded-2xl border border-teal-200 bg-teal-50 p-5 dark:border-teal-900 dark:bg-teal-950/30"><h4 className="font-bold text-teal-900 dark:text-teal-100">Observar com plano</h4><p className="mt-2 text-sm leading-7 text-slate-800 dark:text-slate-200">Dificuldade leve, recente, restrita a uma exigência escolar e sem red flags: ajustar ambiente, registrar exemplos e reavaliar em 4–8 semanas (intervalo operacional, não critério validado). Não condicionar apoio escolar a diagnóstico.</p></div>
      </div></section>
      <section><Heading n="07" title="Manejo, família e escola" />
        <p className="text-sm leading-7 text-slate-700 dark:text-slate-200">Instruções curtas, etapas visíveis, tarefas compatíveis com alfabetização, pausas breves, feedback positivo e sono regular. Em pré-escolares, priorizar treinamento parental em manejo comportamental e apoio educacional. Farmacoterapia não é teste diagnóstico: requer avaliação formal, idade, gravidade, contraindicações, comorbidades e monitorização de crescimento, apetite, sono, pressão e frequência cardíaca quando indicada.</p>
        <blockquote className="mt-4 rounded-xl border-l-4 border-amber-500 bg-amber-50 p-5 text-sm leading-7 text-slate-800 dark:bg-amber-950/30 dark:text-slate-200">“Ser mais novo que os colegas pode tornar algumas tarefas mais difíceis, mas isso não explica tudo. Vamos comparar as exigências à idade real, ouvir a escola e acompanhar a resposta às adaptações.” Peça à escola exemplos concretos, frequência e estratégias já tentadas, não apenas um rótulo.</blockquote>
      </section>
      <section><Heading n="08" title="Caso de treinamento inteiramente fictício" />
        <p className="rounded-2xl bg-slate-50 p-5 text-sm leading-7 text-slate-800 dark:bg-slate-900 dark:text-slate-200">Criança fictícia de 6 anos e 2 meses, entre as mais novas do primeiro ano, acompanha histórias orais, mas não conclui cópias extensas. Rotinas familiares preservadas; melhora quando a professora divide a tarefa. <strong>Inferência:</strong> exigência grafomotora e alfabetização podem explicar parte da queixa; não há evidência suficiente para fechar TDAH. <strong>Ação:</strong> adaptar tarefas, acompanhar sono e leitura/escrita, obter novo relato escolar.</p>
      </section>
      <section><Heading n="09" title="Três erros frequentes" /><ol className="list-decimal space-y-2 pl-6 text-sm leading-7 text-slate-700 dark:text-slate-200"><li>Diagnosticar pela escala escolar isolada e comparar com colegas quase um ano mais velhos.</li><li>Excluir TDAH porque há concentração em atividades altamente motivadoras.</li><li>Usar resposta ao estimulante como “prova” diagnóstica sem investigação e monitorização.</li></ol></section>
      <section><Heading n="10" title="Incerteza e força da evidência" />
        <p className="text-sm leading-7 text-slate-700 dark:text-slate-200">Revisões observacionais confirmam associação populacional entre menor idade relativa e diagnóstico/medicação, com heterogeneidade alta; não permitem excluir TDAH individualmente. AAP: evidência grau B para avaliação com critérios, prejuízo em mais de um ambiente e múltiplas fontes. Adaptações propostas são recomendações pragmáticas, não testes diagnósticos.</p>
      </section>
      <section><Heading n="11" title="Bibliografia auditável" /><p className="mb-3 text-xs text-slate-500 dark:text-slate-400">Fontes verificadas em 31/10/2026; nenhum estudo Consensus foi recuperado nesta execução.</p>
        <ul className="space-y-2">{refs.map(ref=><li key={ref.url} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900"><a href={ref.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-start gap-2 text-sm font-semibold text-teal-800 underline underline-offset-4 dark:text-teal-200">{ref.name}<ExternalLink className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /></a><p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">{ref.note}</p></li>)}</ul>
        <p className="mt-4 flex items-start gap-2 text-xs leading-6 text-slate-500 dark:text-slate-400"><ClipboardCheck className="mt-1 h-4 w-4 shrink-0" aria-hidden="true" /> PCDRJADSON offline; Consensus oficial bloqueado por cota de 500 buscas (reinício anunciado 01/11/2026). Sem aceite ou assinatura médica. Versão 0.1.0.</p>
      </section>
      <footer className="flex flex-wrap items-center gap-3 border-t border-slate-200 pt-5 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400"><BookOpenCheck className="h-4 w-4" aria-hidden="true" /> Biblioteca Clínica NeuroPed 365 <CalendarClock className="h-4 w-4" aria-hidden="true" /> 31/10/2026 · revisão médica pendente</footer>
    </article>
  );
}
