import { useEffect, useMemo, useRef, useState } from "react";
import { Copy, Pause, Play } from "lucide-react";
import { acceptManualTap } from "@/components/jogo-facil/easyReport";
import { softTap } from "@/lib/softSounds";
import { playCoin } from "@/lib/sounds";
import { activeClockSeconds, emptyActiveClock, transitionActiveClock } from "@/features/super-neuropad/activeClock";
import { disponiveisDaIdade, estimativaOpcionaisSegundos, opcionaisDaIdade, pendentesDeCopia, proximoPendente, avisoDeIdade, type RegistrosOpcionais } from "@/features/super-neuropad/extensao";
import { ORIGIN_LABELS, STATUS_LABELS, formatDuration, phaseById, recordBuild, recordJudged, recordTouch, optionOrder, type AnswerRecord } from "@/features/super-neuropad/model";
import { ArcadeButton, RepeatToggle, TouchStage, MissBar, JudgeStage, BuildStage } from "./estimulos";

/**
 * Desafios opcionais: completam 50 por idade com itens dos mesmos bancos de origem. Ficam fora da contagem,
 * do tempo e do XP da partida; registro próprio, em memória e por idade (trocar a idade não apaga nada).
 * Nenhum controle fica desabilitado: aplicar, pular, pausar e recolher são sempre possíveis.
 */
export function OpcionaisPanel({ years, registros, copiados, seed, onRegistrar, onCopiar }: {
  years: number;
  registros: RegistrosOpcionais;
  copiados: RegistrosOpcionais;
  seed: number;
  onRegistrar: (record: AnswerRecord) => void;
  onCopiar: () => void;
}) {
  const lista = opcionaisDaIdade(years);
  const disponivel = disponiveisDaIdade(years);
  const [aberto, setAberto] = useState(false);
  const [pausado, setPausado] = useState(false);
  const [escolhido, setEscolhido] = useState<string | null>(null);
  const [repetido, setRepetido] = useState(false);
  const cronometro = useRef(emptyActiveClock());
  const itemCronometrado = useRef<string | null>(null);
  const ultimoToque = useRef(Number.NEGATIVE_INFINITY);
  const atualId = escolhido ?? proximoPendente(years, registros) ?? lista[0]?.item.id;
  const posicao = Math.max(0, lista.findIndex((entry) => entry.item.id === atualId));
  const atual = lista[posicao];
  const registrados = Object.keys(registros).length;
  const pendentes = pendentesDeCopia(registros, copiados);
  const ordem = useMemo(
    () => (atual && atual.item.kind === "toque" ? optionOrder(atual.item, seed + posicao * 17, posicao) : []),
    [atual, seed, posicao],
  );
  useEffect(() => {
    const agora = performance.now();
    if (itemCronometrado.current !== atualId) {
      itemCronometrado.current = atualId;
      cronometro.current = emptyActiveClock();
      setRepetido(false);
    }
    cronometro.current = transitionActiveClock(cronometro.current, agora, aberto && !pausado);
  }, [atualId, aberto, pausado]);
  // Tela bloqueada ou troca de aba com um opcional aberto: pausa sozinho, como na partida principal,
  // para o tempo do item não inflar. Retomar continua a contagem acumulada do item atual.
  useEffect(() => {
    if (!aberto || pausado) return;
    const onVisibility = () => { if (document.hidden) setPausado(true); };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [aberto, pausado]);
  if (!atual) return null;
  const segundos = () => activeClockSeconds(cronometro.current, performance.now());
  const registrar = (record: AnswerRecord, event: { timeStamp: number }) => {
    if (pausado || !acceptManualTap(ultimoToque.current, event.timeStamp)) return;
    ultimoToque.current = event.timeStamp;
    playCoin();
    onRegistrar(record);
    setEscolhido(proximoPendente(years, { ...registros, [record.itemId]: record }, record.itemId));
  };
  const ir = (delta: number) => { softTap(); setEscolhido(lista[(posicao + delta + lista.length) % lista.length].item.id); };
  const item = atual.item;
  const anterior = registros[item.id];
  // Nome padrão do mundo (conteúdo do item); aos 2–3 anos os mundos da bateria levam nomes de domínio.
  const mundo = phaseById(atual.phaseId);
  return (
    <section className="snp-panel p-5" data-testid="super-neuropad-optional" aria-labelledby="snp-optional-title">
      <div className="space-y-3">
        <div>
          <h2 id="snp-optional-title" className="snp-pixel text-base">Desafios opcionais · {years} anos</h2>
          <p className="mt-1 text-xs font-bold opacity-80">
            {disponivel.total} disponíveis: {disponivel.principal} na bateria principal + {disponivel.opcionais} opcionais, dos mesmos bancos de origem. Escolha conforme a finalidade e a tolerância da criança; não é preciso aplicar todos.
          </p>
          <p className="mt-1 text-xs font-semibold opacity-70">
            Fora da contagem, do tempo e do XP da partida principal. Estimativa de todos os opcionais: {formatDuration(estimativaOpcionaisSegundos(years))}, sem pausas nem adaptações. Interrompa diante de cansaço ou recusa.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="snp-chip" data-testid="super-neuropad-optional-count">{registrados} de {disponivel.opcionais} registrados</span>
          {aberto && (
            <ArcadeButton tone="paper" aria-pressed={pausado} onClick={() => { softTap(); setPausado((current) => !current); }}>
              {pausado ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />} {pausado ? "Retomar opcionais" : "Pausar opcionais"}
            </ArcadeButton>
          )}
          <ArcadeButton tone={aberto ? "slate" : "sky"} aria-expanded={aberto} onClick={() => { softTap(); setAberto((current) => !current); setPausado(false); }}>
            {aberto ? "Recolher opcionais" : "Abrir opcionais"}
          </ArcadeButton>
        </div>
      </div>

      {aberto && (
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex min-w-0 basis-full flex-col text-xs font-black sm:basis-auto sm:flex-1">
              Ir para o desafio opcional
              <select
                className="snp-option mt-1 w-full bg-[var(--snp-paper-fixed)] px-2 py-2 text-sm font-semibold"
                value={item.id}
                onChange={(event) => { softTap(); setEscolhido(event.target.value); }}
              >
                {lista.map((entry, index) => (
                  <option key={entry.item.id} value={entry.item.id}>
                    {registros[entry.item.id] ? "✓" : "○"} {index + 1} · {phaseById(entry.phaseId).name} · {entry.item.prompt.slice(0, 70)}
                  </option>
                ))}
              </select>
            </label>
            <ArcadeButton tone="paper" onClick={() => ir(-1)}>Anterior</ArcadeButton>
            <ArcadeButton tone="paper" onClick={() => ir(1)}>Próximo</ArcadeButton>
          </div>

          {pausado ? (
            <p className="snp-panel snp-panel--soft p-4 text-center text-sm font-bold" role="status">Opcionais em pausa: nada é registrado até retomar.</p>
          ) : (
            <div className="rounded-2xl bg-[var(--snp-stage)] p-3 text-[var(--snp-stage-text)] sm:p-4" data-testid="super-neuropad-optional-stage">
              <p className="snp-pixel mb-2 text-[11px] opacity-80">
                Opcional {posicao + 1} de {lista.length} · {mundo.emoji} {mundo.name} · {ORIGIN_LABELS[item.origin]} · {item.ref}
              </p>
              {anterior && <p className="snp-chip mb-2 bg-[var(--snp-sun-tint)]" role="status">Já registrado: {STATUS_LABELS[anterior.status]}. Registrar de novo substitui.</p>}
              {avisoDeIdade(years, item) && <p className="snp-panel snp-panel--soft mb-2 p-2 text-xs font-bold normal-case" role="note" data-testid="super-neuropad-optional-age-note">{avisoDeIdade(years, item)}</p>}
              {item.kind === "toque" ? (
                <div className="space-y-4">
                  <TouchStage key={item.id} item={item} paused={pausado} order={ordem}
                    onAnswer={(chosen, event) => registrar(recordTouch(item, atual.phaseId, chosen, segundos(), repetido, false, ordem), event)} />
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <RepeatToggle repeated={repetido} onToggle={() => setRepetido((current) => !current)} />
                    <MissBar onMiss={(status, event) => registrar(recordTouch(item, atual.phaseId, null, segundos(), repetido, status === "recusa", ordem), event)} />
                  </div>
                </div>
              ) : item.kind === "montar" ? (
                <div className="space-y-4">
                  <BuildStage key={item.id} item={item} seed={seed + posicao * 17}
                    onDone={(placed, event) => registrar(recordBuild(item, atual.phaseId, placed, segundos(), repetido), event)} />
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <RepeatToggle repeated={repetido} onToggle={() => setRepetido((current) => !current)} />
                    <MissBar onMiss={(status, event) => registrar(recordBuild(item, atual.phaseId, null, segundos(), repetido, status === "recusa"), event)} />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <JudgeStage key={item.id} item={item}
                    onJudge={(status, event, gesture) => registrar(recordJudged(item, atual.phaseId, status, segundos(), repetido, gesture ? "gesto" : undefined), event)} />
                  <RepeatToggle repeated={repetido} onToggle={() => setRepetido((current) => !current)} />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <ArcadeButton tone="paper" onClick={() => { softTap(); onCopiar(); }}>
          <Copy className="h-4 w-4" /> Copiar registro dos opcionais
        </ArcadeButton>
        <p className="text-xs font-bold opacity-70" role="status" data-testid="super-neuropad-optional-status">
          {registrados === 0 ? "Nenhum opcional registrado." : pendentes > 0 ? `${pendentes} registro(s) opcional(is) ainda não copiado(s).` : "Registro dos opcionais copiado."}
        </p>
      </div>
    </section>
  );
}
