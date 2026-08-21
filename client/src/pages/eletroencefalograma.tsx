/**
 * ESTILO: orientação clínica serena e objetiva, com tom dourado do Neuroped;
 * prioriza leitura por etapas, ações internas e nenhum redirecionamento externo.
 */
import { ArrowRight, CircleCheck, FileText, House, Waves } from "lucide-react";

const steps = [
  {
    title: "Solicitação e orientação",
    description:
      "A equipe organiza as informações necessárias e orienta a família sobre os próximos passos do serviço.",
  },
  {
    title: "Captação no ambiente domiciliar",
    description:
      "Quando indicada pela equipe responsável, a coleta é planejada para respeitar a rotina da criança e da família.",
  },
  {
    title: "Análise e devolutiva",
    description:
      "A interpretação e a comunicação dos resultados seguem o fluxo clínico definido pela equipe assistente.",
  },
];

export default function EletroencefalogramaPage() {
  return (
    <main className="min-h-full bg-stone-50 px-4 py-8 text-slate-900 sm:px-6 lg:px-10 lg:py-12">
      <section className="mx-auto grid max-w-6xl overflow-hidden rounded-[2rem] border border-amber-200/80 bg-white shadow-2xl lg:grid-cols-[1.1fr_0.9fr]">
        <div className="relative overflow-hidden bg-amber-950 px-7 py-10 text-amber-50 sm:px-10 sm:py-14">
          <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full border border-amber-200/25" />
          <div className="absolute -bottom-32 -left-24 h-72 w-72 rounded-full border border-amber-300/15" />
          <div className="relative">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-300 text-amber-950 shadow-lg shadow-black/20">
              <Waves className="h-6 w-6" aria-hidden="true" />
            </div>
            <p className="mt-10 text-xs font-extrabold uppercase tracking-[0.2em] text-amber-200">
              Serviço integrado Neuroped
            </p>
            <h1 className="mt-4 max-w-xl text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl">
              Vídeo-EEG domiciliar, com orientação de ponta a ponta.
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-amber-50/80 sm:text-lg">
              Este espaço reúne a orientação inicial do serviço, sem depender de uma página externa. A equipe Neuroped conduz o fluxo de solicitação, organização e retorno clínico.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a
                href="#/agendar"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-300 px-5 py-3 text-sm font-extrabold text-amber-950 transition-transform duration-150 hover:scale-[1.02] active:scale-[0.97]"
              >
                Solicitar orientação <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
              <a
                href="#/marcacao"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-amber-100/45 px-5 py-3 text-sm font-extrabold text-amber-50 transition-colors duration-150 hover:bg-white/10 active:scale-[0.97]"
              >
                Falar com a secretaria <House className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>

        <div className="px-7 py-10 sm:px-10 sm:py-14">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-amber-700">
            Percurso orientado
          </p>
          <div className="mt-7 space-y-7">
            {steps.map((step, index) => (
              <article key={step.title} className="flex gap-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-black text-amber-900">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <div>
                  <h2 className="text-lg font-extrabold tracking-tight text-slate-900">{step.title}</h2>
                  <p className="mt-1.5 text-sm leading-6 text-slate-600">{step.description}</p>
                </div>
              </article>
            ))}
          </div>
          <div className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-start gap-3">
              <FileText className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden="true" />
              <div>
                <h2 className="font-extrabold text-slate-900">Informação com responsabilidade</h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Esta página é informativa. As indicações, a preparação e a interpretação do exame devem ser definidas pela equipe de saúde responsável.
                </p>
              </div>
            </div>
          </div>
          <p className="mt-6 flex items-center gap-2 text-sm font-semibold text-emerald-700">
            <CircleCheck className="h-4 w-4" aria-hidden="true" />
            Página integrada ao Neuroped — sem redirecionamento para o endereço indisponível.
          </p>
        </div>
      </section>
    </main>
  );
}
