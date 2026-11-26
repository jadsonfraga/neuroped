import { useId, useRef } from "react";
import { Sparkles } from "lucide-react";
import { welcomeProfile } from "@/lib/examWelcome";

const cards = {
  infantil: { title: "Cantinho de chegada", line: "Oi! A gente pode começar quando você quiser. Se quiser uma pausa, tudo bem." },
  escolar: { title: "Estação de chegada", line: "Bem-vindo! Vamos no seu ritmo. Você pode pedir uma pausa ou dizer que prefere parar." },
  adolescente: { title: "Antes de começar", line: "Este é o seu tempo para se acomodar. Se quiser uma pausa ou preferir não continuar, pode avisar." },
};

export function ExamWelcome({ ageLabel }: { ageLabel: string }) {
  const profile = welcomeProfile(ageLabel);
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const lineId = useId();

  return <section aria-label="Acolhimento opcional" className="rounded-2xl border border-primary/20 bg-card p-4">
    <div className="flex items-start gap-3">
      <Sparkles aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
      <div className="min-w-0 space-y-2">
        <h2 className="font-semibold">Acolhimento opcional</h2>
        {profile === "presencial"
          ? <p className="text-sm text-muted-foreground">Para o adulto: deixe a criança se acomodar com a pessoa de referência, sem apresentar uma tela. Não é uma atividade de avaliação.</p>
          : <>
            <p className="text-sm text-muted-foreground">Se quiser, apresente o cartão antes das atividades. Também pode seguir direto. A abertura não gera registro.</p>
            <button type="button" aria-haspopup="dialog" onClick={() => dialog.current?.showModal()}
              className="min-h-11 rounded-xl border border-primary/25 bg-primary/5 px-4 text-left text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">Mostrar cartão de chegada</button>
            <dialog ref={dialog} aria-labelledby={titleId} aria-describedby={lineId}
              className="fixed inset-0 m-auto max-h-[88dvh] w-[min(90%,32rem)] overflow-y-auto rounded-2xl border bg-background p-0 text-foreground shadow-xl backdrop:bg-slate-950/70">
              {profile !== "adolescente" && <div aria-hidden="true" className="h-12 bg-gradient-to-r from-primary/10 via-primary/25 to-primary/5 sm:h-16" />}
              <div className="space-y-4 p-5 sm:p-7">
                <h3 id={titleId} className="text-2xl font-bold">{cards[profile].title}</h3>
                <p id={lineId} className="text-base leading-relaxed">{cards[profile].line}</p>
                <button type="button" onClick={() => dialog.current?.close()}
                  className="min-h-12 rounded-xl border bg-card px-4 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">Fechar acolhimento</button>
              </div>
            </dialog>
          </>}
      </div>
    </div>
  </section>;
}
