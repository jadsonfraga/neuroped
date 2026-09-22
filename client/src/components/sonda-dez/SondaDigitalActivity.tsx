import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { MODEL, type ActivitySpec } from "@/data/sondaDezDigital";
import {
  gridMetrics,
  timingAdvance,
  type SondaEvent,
  type StepRun,
} from "@/lib/sondaDezSession";
import { playSondaTone } from "@/lib/sondaDezAudio";
import { ART_LABELS, SondaObject, SondaScene } from "./SondaDigitalArt";

type Props = {
  spec: ActivitySpec;
  onComplete: (run: StepRun) => void;
  initialPlan?: string[];
  practice?: boolean;
  soundEnabled?: boolean;
  waitSeconds?: number;
};
const blockColors: Record<string, string> = {
  azul: "bg-blue-500",
  amarelo: "bg-yellow-300",
  vermelho: "bg-red-500",
  verde: "bg-green-500",
  roxo: "bg-violet-500",
  laranja: "bg-orange-400",
};
export default function SondaDigitalActivity({
  spec,
  onComplete,
  initialPlan,
  practice = false,
  soundEnabled = false,
  waitSeconds,
}: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const events = useRef<SondaEvent[]>([]);
  const started = useRef(performance.now());
  const callback = useRef(onComplete);
  callback.current = onComplete;
  const closed = useRef(false);
  const finished = useRef(false);
  const currentIndex = useRef(0);
  const [index, setIndex] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [ended, setEnded] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [relation, setRelation] = useState("para");
  const [lastMove, setLastMove] = useState<{
    from: string;
    to: string;
    relation: string;
  } | null>(null);
  const [carPosition, setCarPosition] = useState(0);
  const [marks, setMarks] = useState<number[]>([]);
  const marksRef = useRef<number[]>([]);
  const [slots, setSlots] = useState<(string | null)[]>(Array(6).fill(null));
  const [modelVisible, setModelVisible] = useState(true);
  const [order, setOrder] = useState<string[]>(initialPlan ?? []);
  const orderRef = useRef(order);
  orderRef.current = order;
  const [cup, setCup] = useState<number | null>(null);
  const [cupCovered, setCupCovered] = useState(false);
  const [cupTrial, setCupTrial] = useState(0);
  const [unlocked, setUnlocked] = useState(false);
  const [soundError, setSoundError] = useState("");
  const [verbalAnswers, setVerbalAnswers] = useState<Record<number, string>>(
    {},
  );
  const push = useCallback((type: string, value: string) => {
    events.current.push({
      type,
      value,
      elapsedMs: Math.round(performance.now() - started.current),
    });
  }, []);
  const close = useCallback(
    (status: StepRun["status"], reason?: string) => {
      if (closed.current) return;
      closed.current = true;
      if (spec.kind === "plan")
        push("plano-final", JSON.stringify(orderRef.current));
      callback.current({
        status,
        reason,
        events: [...events.current],
        elapsedMs: Math.round(performance.now() - started.current),
      });
    },
    [push, spec.kind],
  );
  useEffect(() => {
    if (!spec.responseRule || spec.prompt === "operator-only") return;
    const keys: Record<string, string> = { "1": "Uma palma", "2": "Esperar", "3": "Outra resposta", "4": "Não observado" };
    const observe = (event: KeyboardEvent) => {
      const answer = keys[event.key];
      const actual = Math.floor((performance.now() - started.current) / (spec.intervalMs ?? 2500));
      if (!answer || event.repeat || event.ctrlKey || event.altKey || event.metaKey || closed.current || finished.current || actual !== currentIndex.current) return;
      event.preventDefault();
      push("resposta-observada", JSON.stringify({ item: actual + 1, stimulus: spec.items?.[actual], answer, source: "teclado da aplicadora durante apresentação" }));
    };
    document.addEventListener("keydown", observe);
    return () => document.removeEventListener("keydown", observe);
  }, [spec, push]);
  useEffect(() => {
    dialog.current?.showModal();
    started.current = performance.now();
    if (spec.kind === "sequence") push("apresentado", "0");
    if (spec.kind === "grid")
      push("grade-apresentada", String(spec.items?.length));
    const onVisibility = () => {
      if (document.hidden)
        close(
          "interrupted",
          "A tela ficou oculta; retomar exige registrar a interrupção.",
        );
    };
    document.addEventListener("visibilitychange", onVisibility);
    const handle = setInterval(() => {
      if (closed.current || finished.current) return;
      const elapsed = performance.now() - started.current;
      setSeconds(Math.floor(elapsed / 1000));
      if (spec.kind === "model" && elapsed >= 5000) setModelVisible(false);
      if (spec.kind === "sequence" && spec.items) {
        const next = timingAdvance(
          currentIndex.current,
          elapsed,
          spec.intervalMs ?? 2500,
          spec.items.length,
        );
        if (next.delayed) {
          close(
            "interrupted",
            "O navegador atrasou a apresentação. Não contar itens não apresentados.",
          );
          return;
        }
        if (next.finished) {
          finished.current = true;
          push("serie-concluida", String(spec.items.length));
          setEnded(true);
          return;
        }
        if (next.index !== currentIndex.current) {
          currentIndex.current = next.index;
          setIndex(next.index);
          push("apresentado", String(next.index));
        }
      }
      if (
        spec.kind === "grid" &&
        elapsed >= (spec.durationSeconds ?? 60) * 1000
      ) {
        finished.current = true;
        const metrics = gridMetrics(
          spec.items ?? [],
          spec.target ?? "",
          marksRef.current,
        );
        push(
          "grade-concluida",
          JSON.stringify({ ...metrics, selected: marksRef.current }),
        );
        setEnded(true);
      }
    }, 100);
    return () => {
      clearInterval(handle);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [spec, push, close]);
  const itemButton = (
    item: string,
    action: () => void,
    active = false,
    disabled = false,
  ) => (
    <button
      key={item}
      type="button"
      onClick={action}
      disabled={disabled}
      aria-label={ART_LABELS[item] ?? item}
      aria-pressed={active}
      className={`min-h-24 rounded-2xl border-4 p-3 text-slate-950 focus-visible:outline focus-visible:outline-4 focus-visible:outline-cyan-700 ${active ? "border-cyan-600 bg-cyan-50" : "border-slate-200 bg-white"} disabled:opacity-50`}
    >
      <span className="mx-auto block h-28 w-28 max-w-full">
        <SondaObject item={item} />
      </span>
    </button>
  );
  function objectTap(item: string) {
    push("objeto-tocado", item);
    if (selected) {
      const pair = `${selected} ${relation} ${item}`;
      setLastMove({ from: selected, to: item, relation });
      push("relação", pair);
      setSelected(null);
    } else setSelected(item);
    if (item === "telefone" && soundEnabled)
      void playSondaTone()
        .then(() => push("som", "telefone"))
        .catch(() => {
          setSoundError(
            "Som indisponível. Continue visualmente e registre a condição.",
          );
          push("falha-som", "telefone");
        });
  }
  function gridTap(i: number) {
    if (
      finished.current ||
      performance.now() - started.current >= (spec.durationSeconds ?? 60) * 1000
    )
      return;
    const next = marksRef.current.includes(i)
      ? marksRef.current.filter((n) => n !== i)
      : [...marksRef.current, i];
    marksRef.current = next;
    setMarks(next);
    push(
      "marcação",
      JSON.stringify({ position: i, selected: next.includes(i) }),
    );
  }
  function response() {
    if (finished.current) return;
    const actual = Math.floor(
      (performance.now() - started.current) / (spec.intervalMs ?? 2500),
    );
    if (actual !== currentIndex.current) return; // Never assign a boundary click to the wrong stimulus.
    if (
      !events.current.some(
        (e) => e.type === "toque" && e.value === String(actual),
      )
    )
      push("toque", String(actual));
  }
  const timed = spec.kind === "sequence" || spec.kind === "grid";
  const completeAllowed =
    waitSeconds && seconds < waitSeconds
      ? false
      : timed
        ? ended
        : spec.kind === "cups"
          ? cupTrial === 1 && cup !== null
          : spec.kind === "model"
            ? !modelVisible
            : spec.kind === "imitation"
              ? index === 3
              : true;
  const operatorOnly = spec.prompt === "operator-only";
  return createPortal(
    <dialog
      ref={dialog}
      onCancel={(e) => {
        e.preventDefault();
        close(
          "interrupted",
          "Aplicadora encerrou o estímulo antes da conclusão.",
        );
      }}
      aria-label={
        practice
          ? "Ensaio sem registro clínico"
          : operatorOnly
            ? "Cartões da aplicadora — manter fora da visão da criança"
            : "Tela da criança"
      }
      className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none overflow-y-auto border-0 bg-slate-50 p-0 text-slate-950 backdrop:bg-slate-950/80"
    >
      <div className="flex min-h-full flex-col">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b bg-white p-3">
          <p className="text-sm font-semibold">
            {practice
              ? "Ensaio — dados descartados"
              : operatorOnly
                ? "Aplicadora: mantenha esta tela fora da visão da criança"
                : "Tela da criança"}
          </p>
          <Button
            variant="outline"
            onClick={() =>
              close("interrupted", "Aplicadora interrompeu a apresentação.")
            }
          >
            Pausar e voltar
          </Button>
        </header>
        <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center gap-5 p-4 sm:p-8">
          {operatorOnly && (
            <p className="rounded-xl bg-amber-100 p-4 text-lg font-semibold">
              Leia um cartão por vez. A criança responde à sua voz.
            </p>
          )}
          {waitSeconds && (
            <p className="text-sm text-slate-600">
              Espera livre: {Math.max(0, waitSeconds - seconds)} s
            </p>
          )}
          {soundError && <p role="alert">{soundError}</p>}
          {spec.kind === "blank" && (
            <div className="flex min-h-64 items-center justify-center">
              <div
                className="h-10 w-10 rounded-full bg-slate-300"
                aria-label="Tela neutra"
              />
            </div>
          )}
          {spec.kind === "scene" && <SondaScene kind={spec.scene ?? "rain"} />}
          {spec.kind === "objects" && (
            <div className="w-full space-y-5">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {spec.items?.map((item) =>
                  itemButton(item, () => objectTap(item), selected === item),
                )}
              </div>
              {!spec.naming && (spec.items?.length ?? 0) > 1 && (
                <div className="flex flex-wrap items-center justify-center gap-3">
                  {["para", "dentro", "em cima"].map((r) => (
                    <button
                      type="button"
                      key={r}
                      aria-pressed={relation === r}
                      onClick={() => {
                        setRelation(r);
                        push("relação-selecionada", r);
                      }}
                      className={`min-h-12 rounded-xl border px-5 py-3 ${relation === r ? "border-cyan-700 bg-cyan-100" : "bg-white"}`}
                    >
                      {r}
                    </button>
                  ))}
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelected(null);
                      push("seleção-limpa", "");
                    }}
                  >
                    Soltar seleção
                  </Button>
                </div>
              )}
              {lastMove && (
                <div
                  className="mx-auto flex w-full max-w-md items-center justify-center gap-4 rounded-xl border bg-white p-3"
                  aria-label={`Movimento: ${lastMove.from} ${lastMove.relation} ${lastMove.to}`}
                >
                  <div className="relative h-40 w-40">
                    <SondaObject item={lastMove.to} />
                    <div
                      className={`absolute h-16 w-16 ${lastMove.relation === "em cima" ? "left-12 top-0" : lastMove.relation === "dentro" ? "left-12 top-12" : "-left-10 top-12"}`}
                    >
                      <SondaObject item={lastMove.from} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          {spec.kind === "locked" && (
            <>
              <div className="relative w-60 rounded-3xl border-4 border-slate-400 bg-cyan-50 p-8">
                <SondaObject item="bola" />
                {!unlocked && (
                  <button
                    type="button"
                    aria-label="Caixa fechada"
                    onClick={() => push("tentativa-na-caixa", "fechada")}
                    className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white/60 text-6xl"
                  >
                    <span aria-hidden="true">▣</span>
                  </button>
                )}
              </div>
              {spec.prompt === "unlock" && !unlocked && (
                <Button
                  onClick={() => {
                    setUnlocked(true);
                    push("caixa-aberta", "pela aplicadora");
                  }}
                >
                  Abrir caixa
                </Button>
              )}
            </>
          )}
          {spec.kind === "imitation" && (
            <>
              <p className="text-lg">
                {
                  [
                    "Bater palmas",
                    "Mandar beijo",
                    "Tocar a cabeça",
                    "Mover o carro",
                  ][index]
                }
              </p>
              <div className="w-full overflow-hidden">
                <div
                  className="mx-auto w-40"
                  style={{
                    transform:
                      index === 3
                        ? `translateX(${carPosition - 50}px)`
                        : undefined,
                  }}
                >
                  <SondaObject item={index === 3 ? "carro" : "bebe"} />
                </div>
              </div>
              {index === 3 && (
                <input
                  type="range"
                  aria-label="Mover o carro"
                  min="0"
                  max="100"
                  defaultValue="0"
                  onChange={(e) => {
                    setCarPosition(Number(e.target.value));
                    push("carro-movido", e.target.value);
                  }}
                  className="w-64"
                />
              )}
              <Button
                variant="outline"
                disabled={index === 3}
                onClick={() => {
                  setIndex((i) => i + 1);
                  push("modelo", String(index + 1));
                }}
              >
                Próximo modelo
              </Button>
            </>
          )}
          {spec.kind === "cups" && (
            <>
              <p className="text-lg">
                {cupCovered ? "Onde está a bola?" : "Olhe onde está a bola."}
              </p>
              <div className="grid w-full max-w-lg grid-cols-2 gap-10">
                {[0, 1].map((i) => (
                  <button
                    type="button"
                    key={i}
                    disabled={!cupCovered || cup !== null}
                    aria-label={`Recipiente ${i + 1}`}
                    onClick={() => {
                      setCup(i);
                      push(
                        "busca",
                        JSON.stringify({
                          trial: cupTrial,
                          choice: i,
                          target: cupTrial,
                        }),
                      );
                    }}
                    className="h-44 rounded-3xl border-4 border-slate-400 bg-white p-4"
                  >
                    {!cupCovered && cupTrial === i ? (
                      <SondaObject item="bola" />
                    ) : (
                      <SondaObject item="copo" />
                    )}
                  </button>
                ))}
              </div>
              {!cupCovered ? (
                <Button
                  onClick={() => {
                    setCupCovered(true);
                    push("ocultação", String(cupTrial));
                  }}
                >
                  Cobrir recipientes
                </Button>
              ) : cup !== null && cupTrial === 0 ? (
                <Button
                  onClick={() => {
                    setCupTrial(1);
                    setCupCovered(false);
                    setCup(null);
                  }}
                >
                  Segunda tentativa
                </Button>
              ) : (
                <p className="h-10">
                  {cup !== null ? "Escolha registrada." : " "}
                </p>
              )}
            </>
          )}
          {spec.kind === "sequence" && (
            <>
              <div className="flex h-64 w-full max-w-sm items-center justify-center rounded-3xl border bg-white p-6">
                {ended ? (
                  <p className="text-xl">Concluído</p>
                ) : (
                  <SondaObject item={spec.items?.[index] ?? ""} />
                )}
              </div>
              {spec.target && !ended && (
                <button
                  type="button"
                  aria-label="Responder ao alvo"
                  onClick={response}
                  className="h-24 w-24 rounded-full border-4 border-slate-600 bg-slate-200 active:bg-slate-300 focus-visible:outline focus-visible:outline-4 focus-visible:outline-cyan-700"
                />
              )}
              {operatorOnly && (
                <p>
                  {index + 1}/{spec.items?.length} cartões
                </p>
              )}
              {operatorOnly && spec.responseRule && !ended && (
                <fieldset className="w-full max-w-xl rounded-xl border bg-white p-4">
                  <legend className="px-1 font-semibold">
                    O que a criança respondeu a este cartão?
                  </legend>
                  <p className="mb-3 text-sm">
                    Registre o que ouviu. Sem marcação significa resposta não
                    registrada, não erro.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      ...new Set([
                        ...(spec.items ?? []),
                        ...Object.values(spec.responseRule),
                        "Outra resposta",
                        "Sem resposta",
                      ]),
                    ].map((answer) => (
                      <Button
                        key={answer}
                        variant={
                          verbalAnswers[index] === answer
                            ? "default"
                            : "outline"
                        }
                        aria-pressed={verbalAnswers[index] === answer}
                        onClick={() => {
                          const actual = Math.floor(
                            (performance.now() - started.current) /
                              (spec.intervalMs ?? 2500),
                          );
                          if (
                            finished.current ||
                            actual !== currentIndex.current
                          )
                            return;
                          setVerbalAnswers((old) => ({
                            ...old,
                            [index]: answer,
                          }));
                          push(
                            "resposta-verbal",
                            JSON.stringify({
                              item: index + 1,
                              stimulus: spec.items?.[index],
                              answer,
                            }),
                          );
                        }}
                      >
                        {answer}
                      </Button>
                    ))}
                  </div>
                </fieldset>
              )}
            </>
          )}
          {spec.kind === "grid" && (
            <>
              <p className="text-lg">
                Alvo: <strong>{spec.target}</strong> ·{" "}
                {Math.max(0, (spec.durationSeconds ?? 60) - seconds)} s
              </p>
              <div className="grid w-full max-w-3xl grid-cols-4 gap-2 sm:grid-cols-6">
                {spec.items?.map((item, i) => (
                  <button
                    type="button"
                    key={i}
                    aria-label={`Posição ${i + 1}: ${item}`}
                    aria-pressed={marks.includes(i)}
                    disabled={ended}
                    onClick={() => gridTap(i)}
                    className={`min-h-16 rounded-xl border-2 p-2 text-2xl font-semibold sm:min-h-20 ${marks.includes(i) ? "border-cyan-700 bg-cyan-100" : "border-slate-300 bg-white"}`}
                  >
                    {item}
                  </button>
                ))}
              </div>
              {ended && <p>Concluído</p>}
            </>
          )}
          {spec.kind === "model" && (
            <>
              <p className="text-xl">
                {modelVisible ? "Observe o modelo." : "Agora monte o painel."}
              </p>
              <div className="grid w-full max-w-md grid-cols-3 gap-3">
                {(modelVisible ? MODEL : slots).map((color, i) => (
                  <button
                    type="button"
                    key={i}
                    disabled={modelVisible || !selected}
                    aria-label={`Posição ${i + 1}${color ? " ocupada" : ""}`}
                    onClick={() => {
                      const next = slots.map((color) =>
                        color === selected ? null : color,
                      );
                      next[i] = selected;
                      setSlots(next);
                      push(
                        "peça-colocada",
                        JSON.stringify({ slot: i, color: selected }),
                      );
                      setSelected(null);
                    }}
                    className={`h-24 rounded-lg border-2 border-slate-500 ${color ? blockColors[color] : "bg-white"}`}
                  />
                ))}
              </div>
              {!modelVisible && (
                <div className="flex flex-wrap justify-center gap-3">
                  {MODEL.map((color) => (
                    <button
                      type="button"
                      key={color}
                      aria-label={`Peça ${color}`}
                      aria-pressed={selected === color}
                      onClick={() => setSelected(color)}
                      className={`h-12 w-12 rounded-lg border-4 ${selected === color ? "border-slate-900" : "border-white"} ${blockColors[color]}`}
                    />
                  ))}
                </div>
              )}
            </>
          )}
          {spec.kind === "plan" && (
            <div className="w-full max-w-2xl space-y-4">
              {spec.prompt && (
                <p className="rounded-xl bg-amber-100 p-4 text-xl">
                  {spec.prompt}
                </p>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                {spec.items?.map((item) => (
                  <button
                    type="button"
                    key={item}
                    disabled={order.includes(item)}
                    onClick={() => {
                      setOrder((old) => [...old, item]);
                      push("cartão-ordenado", item);
                    }}
                    className="min-h-16 rounded-xl border-2 border-slate-300 bg-white p-4 text-lg disabled:opacity-40"
                  >
                    {item}
                  </button>
                ))}
              </div>
              <ol className="list-inside list-decimal space-y-2 rounded-xl bg-white p-4">
                {order.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ol>
              <Button
                variant="outline"
                disabled={!order.length}
                onClick={() => {
                  setOrder((old) => old.slice(0, -1));
                  push("ordem-desfeita", "último cartão");
                }}
              >
                Desfazer último cartão
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setOrder([]);
                  push("plano-reiniciado", "");
                }}
              >
                Reorganizar tudo
              </Button>
            </div>
          )}
        </div>
        <footer className="flex flex-wrap justify-center gap-3 border-t bg-white p-4">
          {waitSeconds && seconds < waitSeconds && (
            <p className="w-full text-center text-sm">
              Aguarde a observação. Se houver incômodo, use Pausar e voltar.
            </p>
          )}
          <Button disabled={!completeAllowed} onClick={() => close("complete")}>
            {timed ? "Voltar ao registro" : "Concluir observação"}
          </Button>
        </footer>
      </div>
    </dialog>,
    document.body,
  );
}
