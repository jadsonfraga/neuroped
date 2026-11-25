import { useState } from "react";
import { examBands } from "@/data/exame-por-idade";

export default function ExamePorIdade() {
  const [age, setAge] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const band = examBands.find(item => item.age === age);
  return (
    <section className="mx-auto max-w-3xl space-y-5 p-4 sm:p-6">
      <header>
        <h1 className="text-2xl font-bold">Exame neurológico e mental</h1>
        <p className="mt-1 text-muted-foreground">Comece pela idade. Adapte a proposta à mobilidade, à linguagem e à forma de comunicação da criança.</p>
      </header>
      <label className="block font-semibold">Faixa etária
        <select value={age} onChange={event => setAge(event.target.value)} className="mt-2 block min-h-12 w-full rounded-lg border bg-background px-3">
          <option value="">Escolha a faixa etária</option>
          {examBands.map(item => <option key={item.age}>{item.age}</option>)}
        </select>
      </label>
      {band && <div key={age} className="space-y-3">
        <p className="rounded-lg bg-muted p-4"><strong>Para começar. </strong>{band.setup}</p>
        {band.steps.map((item, index) => {
          const id = age + "/" + item.title;
          return <details key={id} open={index === 0} className="rounded-xl border bg-card px-4">
            <summary className="cursor-pointer py-4 font-semibold">{item.title}</summary>
            <p className="mb-2"><strong>Como examinar. </strong>{item.action}</p>
            <p className="mb-3"><strong>O que observar. </strong>{item.observe}</p>
            <label className="mb-4 block text-sm">Observação temporária · {item.title}
              <textarea className="mt-1 block w-full rounded-lg border bg-background p-2" rows={2} value={notes[id] ?? ""}
                placeholder="Resposta observada, apoio usado ou motivo para não avaliar"
                onChange={event => setNotes({ ...notes, [id]: event.target.value })} />
            </label>
          </details>;
        })}
        <p className="text-sm text-muted-foreground">As anotações ficam nesta tela até sair ou recarregar. Transcreva os achados pertinentes ao prontuário. Diferencie o que observou do que o cuidador relatou.</p>
        <details className="rounded-lg border p-3">
          <summary className="cursor-pointer font-semibold">Quando aprofundar o exame</summary>
          <p className="mt-2">Se a participação for limitada, ofereça pausa, demonstração ou comunicação alternativa e descreva a limitação. Em alteração aguda de consciência ou déficit focal súbito, interrompa o roteiro e priorize avaliação de urgência.</p>
          <p className="mt-2">Quando houver sofrimento, explore humor, percepção, pensamento e segurança em linguagem compreensível. Diante de risco atual de autoagressão, mantenha supervisão e acione avaliação urgente.</p>
        </details>
      </div>}
      <details className="text-sm text-muted-foreground">
        <summary className="cursor-pointer py-2">Referências e versão do roteiro</summary>
        <p>Roteiro clínico observacional NeuroPed v1.0, sem validação psicométrica. As faixas orientam a abordagem. A interpretação é clínica.</p>
        <ul className="list-disc space-y-1 pl-5 underline">
          <li><a href="https://aci.health.nsw.gov.au/ecat/paediatric/assessment/neurological">NSW Agency for Clinical Innovation · Exame neurológico pediátrico</a></li>
          <li><a href="https://med.stanford.edu/newborns/professional-education/photo-gallery/neuro-reflexes">Stanford Medicine · Exame neurológico do recém-nascido</a></li>
          <li><a href="https://www.rch.org.au/clinicalguide/guideline_index/Mental_state_examination/">Royal Children’s Hospital · Exame do estado mental</a></li>
        </ul>
      </details>
    </section>
  );
}
