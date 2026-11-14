import { ArrowRight, BookOpen, CircleAlert, ClipboardCheck, HeartPulse, ShieldCheck } from "lucide-react";

/** Dia 12/365 — conteúdo educacional, sem dados de pacientes; revisão médica pendente. */
export default function TdahFarmacoterapiaDia12Chapter() {
  const rows = [
    ["Queixa escolar isolada", "Não confirma TDAH nem indicação de fármaco", "Ouvir família e escola, verificar prejuízo em mais de um contexto"],
    ["Pré-escolar com prejuízo leve", "Relação benefício-risco favorece abordagem comportamental inicial", "Treinamento parental e adaptações; reavaliar"],
    ["TDAH confirmado com prejuízo persistente", "Possível benefício de farmacoterapia", "Decisão compartilhada, metas e avaliação de segurança"],
    ["Insônia, ansiedade ou dificuldades de aprendizagem", "Diferenciais ou comorbidades relevantes", "Investigar e tratar em paralelo"],
    ["Síncope ao esforço ou morte súbita familiar", "Sinal de risco cardiovascular", "Avaliação dirigida antes de iniciar medicação"],
  ];
  return (
    <article id="capitulo-tdah-farmacoterapia-dia12" tabIndex={-1} aria-labelledby="dia12-title" className="scroll-mt-24 space-y-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm outline-none dark:border-slate-700 dark:bg-slate-900 sm:p-8">
      <header className="space-y-3">
        <span className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900 dark:bg-amber-950 dark:text-amber-200">Dia 12/365 · Material educacional em revisão médica</span>
        <h2 id="dia12-title" className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Dia 12/365 — Quando farmacoterapia é indicada no TDAH e quando não é?</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">Decisão clínica por idade, prejuízo funcional, preferências e segurança · leitura de 6 minutos</p>
      </header>
      <section aria-labelledby="dia12-resumo" className="rounded-2xl border-l-4 border-teal-600 bg-teal-50 p-5 dark:bg-teal-950/30">
        <h3 id="dia12-resumo" className="font-semibold text-teal-900 dark:text-teal-200">Em 30 segundos</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-800 dark:text-slate-200">Medicar não é consequência automática de uma escala ou queixa escolar. Exige diagnóstico consistente, prejuízo funcional relevante, avaliação de diferenciais e decisão compartilhada. Na pré-escola, intervenções comportamentais e treinamento parental vêm primeiro. Em escolares, farmacoterapia e apoios psicossociais podem ser combinados conforme necessidade.</p>
      </section>
      <section aria-labelledby="dia12-alertas">
        <h3 id="dia12-alertas" className="flex items-center gap-2 text-lg font-semibold"><CircleAlert aria-hidden="true" className="h-5 w-5 text-rose-700" /> Sinais que mudam a conduta</h3>
        <p className="mt-2 text-sm leading-relaxed">Investigue autoagressão, ideação suicida, mania/psicose, uso de substâncias, perda ponderal importante, síncope ao esforço, palpitações, cardiopatia e morte súbita familiar. Revise sono, ansiedade, trauma, transtornos de aprendizagem, tique e outras comorbidades. Situações agudas exigem atendimento específico.</p>
      </section>
      <section aria-labelledby="dia12-fluxo">
        <h3 id="dia12-fluxo" className="text-lg font-semibold">Fluxograma de decisão</h3>
        <div role="group" aria-label="Fluxo de decisão para farmacoterapia no TDAH" className="mt-3 grid gap-3 text-sm">
          <div className="rounded-xl border border-slate-300 bg-slate-50 p-4 text-center font-medium dark:border-slate-600 dark:bg-slate-800">Queixa de desatenção ou hiperatividade</div>
          <ArrowRight aria-hidden="true" className="mx-auto h-5 w-5 rotate-90 text-teal-700" />
          <div className="rounded-xl border border-teal-300 bg-teal-50 p-4 text-center dark:border-teal-800 dark:bg-teal-950/30">Sintomas persistentes, prejuízo funcional e diferenciais avaliados?</div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-amber-300 p-4"><strong>Não:</strong> completar história, informações escolares e avaliação clínica. Não medicar por presunção.</div>
            <div className="rounded-xl border border-teal-300 p-4"><strong>Sim:</strong> considerar idade, gravidade, intervenções disponíveis e preferências.</div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-100 p-4 dark:bg-slate-800"><strong>Pré-escolar:</strong> treinamento parental e abordagem comportamental primeiro; medicamento somente após avaliação especializada de prejuízo persistente importante.</div>
            <div className="rounded-xl bg-slate-100 p-4 dark:bg-slate-800"><strong>Escolar/adolescente:</strong> discutir farmacoterapia e suporte familiar/escolar, individualizando benefício-risco.</div>
          </div>
          <div className="rounded-xl border border-slate-300 p-4 text-center dark:border-slate-600"><strong>Antes de eventual prescrição:</strong> história cardíaca, PA, pulso, crescimento, sono, apetite, comorbidades e interações. Definir metas e retorno.</div>
        </div>
      </section>
      <section aria-labelledby="dia12-quadro">
        <h3 id="dia12-quadro" className="text-lg font-semibold">Achado → interpretação → próxima ação</h3>
        <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
          <table className="min-w-[620px] w-full text-left text-sm"><thead className="bg-slate-100 dark:bg-slate-800"><tr><th scope="col" className="p-3">Achado</th><th scope="col" className="p-3">Interpretação</th><th scope="col" className="p-3">Próxima ação</th></tr></thead><tbody>{rows.map(([a,b,c]) => <tr key={a} className="border-t border-slate-200 align-top dark:border-slate-700"><td className="p-3 font-medium">{a}</td><td className="p-3">{b}</td><td className="p-3">{c}</td></tr>)}</tbody></table>
        </div>
      </section>
      <section aria-labelledby="dia12-consulta">
        <h3 id="dia12-consulta" className="flex items-center gap-2 text-lg font-semibold"><ClipboardCheck aria-hidden="true" className="h-5 w-5 text-teal-700" /> Consulta em seis etapas</h3>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed">
          <li>Ouvir criança, responsáveis e escola; reconstruir evolução dos sintomas.</li>
          <li>Quantificar prejuízos concretos e definir linha de base funcional.</li>
          <li>Examinar sono, ansiedade, humor, aprendizagem, TEA, trauma e condições clínicas.</li>
          <li>Explicar intervenções familiares, escolares e opções farmacológicas quando pertinentes.</li>
          <li>Registrar peso, estatura, PA, pulso, história cardiovascular pessoal/familiar, apetite, sono e medicações concomitantes.</li>
          <li>Pactuar metas observáveis, efeitos adversos a monitorar e retorno programado.</li>
        </ol>
      </section>
      <section aria-labelledby="dia12-manejo" className="space-y-3">
        <h3 id="dia12-manejo" className="flex items-center gap-2 text-lg font-semibold"><HeartPulse aria-hidden="true" className="h-5 w-5 text-teal-700" /> Investigar, observar e acompanhar</h3>
        <p className="text-sm leading-relaxed">Se sintomas são transitórios ou restritos a um contexto sem prejuízo relevante, observar com intervenções ambientais e reavaliar. Investigar quando houver persistência, sofrimento, regressão, sinais neurológicos ou condições médicas associadas. EEG, exames laboratoriais e neuroimagem não confirmam TDAH e não são exames rotineiros para a queixa isolada.</p>
        <p className="text-sm leading-relaxed">Medicamentos podem reduzir sintomas no curto prazo, mas a escolha depende da idade, registro brasileiro, comorbidades e segurança. Monitorar função, PA, pulso, crescimento, apetite, sono, humor e adesão. Não há prescrição ou dose automática neste capítulo. A evidência de longo prazo é menos robusta.</p>
      </section>
      <section aria-labelledby="dia12-familia">
        <h3 id="dia12-familia" className="text-lg font-semibold">Comunicação com família e escola</h3>
        <blockquote className="mt-2 border-l-2 border-slate-300 pl-4 text-sm italic">O objetivo não é deixar a criança quieta; é melhorar aprendizagem, convivência e autonomia sem prejudicar o bem-estar. A medicação não é teste diagnóstico.</blockquote>
        <p className="mt-2 text-sm">Solicite exemplos funcionais da escola e acompanhe mudanças após apoios pedagógicos, sem delegar a ela o diagnóstico.</p>
      </section>
      <section aria-labelledby="dia12-caso">
        <h3 id="dia12-caso" className="text-lg font-semibold">Caso inteiramente fictício</h3>
        <p className="mt-2 text-sm leading-relaxed">Uma criança fictícia de oito anos apresenta impulsividade e desatenção persistentes em casa e na escola, com prejuízo acadêmico e social apesar de adaptações. A consulta identifica sono irregular, sem alertas cardiovasculares. A equipe aborda o sono, estabelece metas funcionais e discute farmacoterapia com os responsáveis após avaliação de segurança, mantendo apoio escolar e reavaliação periódica.</p>
      </section>
      <section aria-labelledby="dia12-erros">
        <h3 id="dia12-erros" className="text-lg font-semibold">Três erros frequentes</h3>
        <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm"><li>Medicar apenas por relato escolar ou pontuação isolada.</li><li>Interpretar melhora após estimulante como confirmação diagnóstica.</li><li>Aumentar dose sem monitorar função, sono, crescimento, pressão, pulso e efeitos adversos.</li></ol>
      </section>
      <section aria-labelledby="dia12-incerteza">
        <h3 id="dia12-incerteza" className="flex items-center gap-2 text-lg font-semibold"><ShieldCheck aria-hidden="true" className="h-5 w-5 text-teal-700" /> Incertezas e revisão</h3>
        <p className="mt-2 text-sm">Ensaios sustentam benefícios sintomáticos de curto prazo, mas há lacunas sobre efeitos de longo prazo. Verificar atualizações das diretrizes, protocolos brasileiros, bula e situação regulatória Anvisa antes da decisão individual. Conteúdo ainda não validado clinicamente.</p>
      </section>
      <section aria-labelledby="dia12-fontes">
        <h3 id="dia12-fontes" className="flex items-center gap-2 text-lg font-semibold"><BookOpen aria-hidden="true" className="h-5 w-5 text-teal-700" /> Bibliografia auditável</h3>
        <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm break-words">
          <li>Wolraich et al. AAP guideline. Pediatrics, 2019. <a className="text-teal-700 underline dark:text-teal-300" href="https://doi.org/10.1542/peds.2019-2528" target="_blank" rel="noopener noreferrer">DOI 10.1542/peds.2019-2528</a>.</li>
          <li>NICE NG87. <a className="text-teal-700 underline dark:text-teal-300" href="https://www.nice.org.uk/guidance/ng87" target="_blank" rel="noopener noreferrer">Diagnosis and management</a>.</li>
          <li>Coghill et al. European ADHD Guidelines Group, 2023. <a className="text-teal-700 underline dark:text-teal-300" href="https://consensus.app/papers/details/w:71cc05ef-4c85-47b3-9253-3d98ff350b64/" target="_blank" rel="noopener noreferrer">Pesquisa Consensus</a>.</li>
          <li>Gosling et al. BMJ, 2025. <a className="text-teal-700 underline dark:text-teal-300" href="https://doi.org/10.1136/bmj-2025-085875" target="_blank" rel="noopener noreferrer">DOI 10.1136/bmj-2025-085875</a>.</li>
        </ol>
        <p className="mt-3 text-xs text-slate-500">Verificação bibliográfica: 14/11/2026. Consensus via conector; acesso autenticado no Windows não comprovado. Revisão médica pendente. <a className="underline" href="https://docs.google.com/document/d/1tHSOtuzKElAar7HwG74q8dOUP9toCrxXKTLg2TO-0oQ/edit" target="_blank" rel="noopener noreferrer">Versão editável no Drive</a>.</p>
      </section>
    </article>
  );
}
