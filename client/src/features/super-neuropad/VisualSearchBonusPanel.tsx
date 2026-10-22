import { useEffect, useMemo, useState } from "react";
import type { AnswerRecord } from "./model";
import { recordTouch, STATUS_LABELS } from "./model";
import type { TouchItem } from "./items";
import { visualSearchProfile } from "./visualSearch";
import { VisualSearchStage } from "./VisualSearchStage";

/** Missão complementar, sem entrar nas contagens, normas ou pontuação da bateria de 50. */
export function VisualSearchBonusPanel({ years, visible }: { years: number; visible: boolean }) {
  const profile = useMemo(() => visualSearchProfile(years), [years]);
  const item = useMemo<TouchItem>(() => ({
    id: "busca-visual-bonus-" + years,
    kind: "toque",
    origin: "visual",
    ref: "Busca visual autoral não padronizada: " + profile.cells + " figuras, limite " + profile.seconds + " segundos",
    prompt: "Encontre o explorador com uma estrela preenchida no centro do boné.",
    answer: "Explorador com estrela dourada",
    seconds: profile.seconds,
    options: [
      { art: "★", label: "Explorador com estrela dourada" },
      { art: "●", label: "Outro explorador" },
    ],
  }), [years, profile]);
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [trial, setTrial] = useState(0);
  const [record, setRecord] = useState<AnswerRecord | null>(null);
  const [copyStatus, setCopyStatus] = useState("");

  // Esconder o painel no meio da bateria principal não consome o tempo da missão.
  useEffect(() => { if (!visible) setPaused(true); }, [visible]);
  useEffect(() => {
    if (!running || paused) return;
    const onVisibility = () => { if (document.hidden) setPaused(true); };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [running, paused]);

  const start = () => {
    setTrial((value) => value + 1);
    setRecord(null);
    setPaused(false);
    setCopyStatus("");
    setRunning(true);
  };

  const complete = (chosen: TouchItem["options"][number] | null, seconds: number) => {
    setRecord(recordTouch(item, "olhos", chosen, Math.round(seconds * 10) / 10));
    setRunning(false);
    setPaused(false);
  };

  const copy = async () => {
    if (!record) return;
    const text = [
      "Super NeuroPad Game — missão complementar de busca visual",
      "Idade: " + years + " anos",
      "Quantidade de personagens: " + profile.cells,
      "Tempo máximo lúdico: " + profile.seconds + " s",
      "Resultado: " + STATUS_LABELS[record.status],
      "Tempo ativo observado: " + record.seconds + " s",
      "Registro descritivo, atividade autoral não padronizada. Sem classificação diagnóstica.",
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus("Registro copiado.");
    } catch {
      setCopyStatus("Não foi possível copiar automaticamente neste navegador.");
    }
  };

  return (
    <div hidden={!visible} className={"snp-panel space-y-4 p-4 sm:p-5 " + (visible ? "" : "hidden")} data-testid="super-neuropad-visual-search" aria-labelledby="snp-search-title">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="max-w-2xl space-y-2">
          <span className="snp-chip bg-[var(--snp-sky-tint)]">Missão extra · busca visual</span>
          <h2 id="snp-search-title" className="snp-pixel text-lg sm:text-xl">Onde está o explorador?</h2>
          <div className="flex flex-wrap gap-2">
            <span className="snp-chip">{years} anos</span>
            <span className="snp-chip">{profile.cells} personagens</span>
            <span className="snp-chip">{profile.seconds} segundos</span>
          </div>
          <p className="text-sm font-semibold opacity-90">Dificuldade: {["alto contraste e alvos grandes", "formas simples com algumas cores iguais", "mais personagens com cores semelhantes", "símbolos parecidos e maior densidade", "quase iguais, exigindo identificar forma e posição"][profile.tier]}.</p>
          <p className="text-xs opacity-80">
            Missão complementar independente, com personagens originais. Não altera os 50 desafios,
            o XP nem o resultado da bateria principal. Tempo operacional não validado como norma.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {running ? (
            <>
              <button type="button" className="snp-option min-h-[44px] px-4 py-2 font-bold"
                aria-pressed={paused || !visible} onClick={() => setPaused((value) => !value)}>
                {paused || !visible ? "▶ Continuar" : "⏸ Pausar"}
              </button>
              <button type="button" className="snp-option min-h-[44px] px-4 py-2 font-bold" onClick={() => setRunning(false)}>Encerrar sem registro</button>
            </>
          ) : <button type="button" className="snp-option min-h-[48px] bg-[var(--snp-sun)] px-5 py-3 font-black" onClick={start}>
            {record ? "Nova tentativa" : "Iniciar busca"}
          </button>}
        </div>
      </div>
      {running && paused && visible && (
        <div role="status" className="rounded-xl border-2 border-[var(--snp-ink-40)] bg-[var(--snp-sun-tint)] p-3 text-center text-sm font-bold">
          Busca pausada — o tempo está congelado.
        </div>
      )}
      {running && <VisualSearchStage key={years + "-" + trial} years={years} item={item} seed={trial * 1537 + years * 53}
        paused={paused || !visible} onAnswer={(chosen, _event, seconds) => complete(chosen, seconds)} />}
      {record && !running && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border-2 border-[var(--snp-ink-40)] bg-[var(--snp-paper-fixed)] p-3"
          role="status" data-testid="visual-search-result">
          <strong className="text-base">{STATUS_LABELS[record.status]}</strong>
          <span className="text-sm">Tempo ativo: {record.seconds} s (limite {profile.seconds} s).</span>
          <button type="button" className="snp-option min-h-[44px] px-3 py-2 font-bold" onClick={() => void copy()}>Copiar registro</button>
          <span className="text-xs">{copyStatus}</span>
        </div>
      )}
    </div>
  );
}
