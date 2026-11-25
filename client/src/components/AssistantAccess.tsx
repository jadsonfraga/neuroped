import { useRef, useState, type ReactNode } from "react";
import { Eye, Hand, MessageCircle, Pause, VolumeX } from "lucide-react";

const supports = [
  { name: "Comunicação", Icon: MessageCircle, tip: "Use o meio habitual: gesto, olhar, fala, escrita ou prancha. Dê tempo para responder sem completar pela criança." },
  { name: "Movimento", Icon: Hand, tip: "Deixe o material acessível na posição habitual. Aceite uma indicação e, se for solicitado, mova o objeto por ela. Não guie a mão." },
  { name: "Visão", Icon: Eye, tip: "Reduza a quantidade de figuras e descreva o que está mostrando. Se a criança preferir, use objetos familiares em vez de imagens." },
  { name: "Ambiente", Icon: VolumeX, tip: "Reduza luz intensa e ruído quando possível. Ofereça pausa ou outra atividade, sem insistir." },
] as const;

const button = "min-h-12 rounded-xl border bg-background px-4 py-2 font-semibold";

export function AssistantAccess() {
  const [selected, setSelected] = useState<number | null>(null);
  return <details className="rounded-xl border bg-card px-3">
    <summary className="flex min-h-12 cursor-pointer items-center font-semibold">Ajustar para esta criança</summary>
    <p className="pb-2 text-sm text-muted-foreground">Escolha uma dica se precisar. Só o apoio usado de fato deve entrar no registro.</p>
    <div className="flex flex-wrap gap-2 pb-3" aria-label="Apoios disponíveis">
      {supports.map(({ name, Icon }, i) => <button key={name} type="button" aria-pressed={selected === i}
        className={button + " inline-flex items-center gap-2 text-sm aria-pressed:border-primary aria-pressed:bg-primary/10"}
        onClick={() => setSelected(selected === i ? null : i)}>
        <Icon aria-hidden="true" className="h-4 w-4" />{name}
      </button>)}
    </div>
    <div aria-live="polite">{selected !== null && <p className="mb-3 rounded-lg bg-muted p-3 text-sm">{supports[selected].tip}</p>}</div>
  </details>;
}

// A pausa não grava uma resposta, não tem cronômetro e não encerra a atividade.
export function ParticipantPace({ children, onClose, closeLabel }: {
  children: ReactNode; onClose: () => void; closeLabel: string;
}) {
  const [paused, setPaused] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  return <div className="space-y-4">
    {paused ? <div className="rounded-xl bg-muted p-5 text-center" role="status">
      <Pause aria-hidden="true" className="mx-auto mb-2 h-10 w-10" />
      <p className="text-2xl font-bold">Podemos fazer uma pausa.</p>
    </div> : <>
      <p className="text-sm text-muted-foreground">Agora: este convite. Depois: você pode escolher continuar ou parar.</p>
      {children}
    </>}
    <div className="flex flex-wrap gap-2">
      <button type="button" ref={toggle} className={button} onClick={() => { setPaused(!paused); toggle.current?.focus(); }}>
        {paused ? "Voltar ao convite" : "Fazer uma pausa"}
      </button>
      <button type="button" className={button} onClick={onClose}>{closeLabel}</button>
    </div>
  </div>;
}
