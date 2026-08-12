/**
 * ResultsPanel — relatório DESCRITIVO de uma sessão do Cognitive Lab:
 * métricas, validade automática, curva RT por ensaio (aprendizagem/fadiga),
 * comparação por condição (ex.: congruente × incongruente) e exportação.
 */
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { exportSessionCsv, exportSessionJson, saveSession } from "./storage";
import type { CognitiveSession } from "./types";
import { useEffect, useState } from "react";

const GRID = "hsl(var(--border))";
const MUTED = "hsl(var(--muted-foreground))";
const LINE = "hsl(var(--primary))";
const SURFACE = "hsl(var(--card) / 0.97)";

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 px-3 py-2">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-lg font-bold tabular-nums">{value}</p>
      {hint && <p className="text-[10px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

const pct = (x: number) => `${(x * 100).toFixed(1)}%`;
const ms = (x: number | null) => (x === null ? "—" : `${x} ms`);

export function ResultsPanel({ session }: { session: CognitiveSession }) {
  const [persistence, setPersistence] = useState<"saving" | "saved" | "error">("saving");

  useEffect(() => {
    let active = true;
    setPersistence("saving");
    void saveSession(session).then((stored) => {
      if (active) setPersistence(stored ? "saved" : "error");
    });
    return () => { active = false; };
  }, [session]);

  const s = session.stats;
  const rtSeries = session.trials
    .filter((t) => t.phase === "test" && t.rtMs !== null && !t.anticipated)
    .map((t, i) => ({ ensaio: i + 1, rt: t.rtMs as number }));

  const tagPairs = Object.entries(s.byTag).filter(([, v]) => v.meanRt !== null);
  const congr = s.byTag["congruente"];
  const incongr = s.byTag["incongruente"];
  const interference =
    congr?.meanRt != null && incongr?.meanRt != null ? Math.round((incongr.meanRt - congr.meanRt) * 10) / 10 : null;
  // Custo de troca (task switching): RT em ensaios de troca − ensaios de repetição.
  const rep = s.byTag["repeticao"];
  const swi = s.byTag["troca"];
  const switchCost =
    rep?.meanRt != null && swi?.meanRt != null ? Math.round((swi.meanRt - rep.meanRt) * 10) / 10 : null;

  return (
    <div className="space-y-4">
      {persistence === "error" ? (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive" role="alert">
          O resultado está visível, mas não pôde ser salvo neste dispositivo. Exporte CSV ou JSON antes de sair desta tela.
        </div>
      ) : (
        <p className="text-[10px] text-muted-foreground" role="status">
          {persistence === "saving" ? "Salvando sessão temporária…" : "Sessão temporária salva neste dispositivo."}
        </p>
      )}
      <div
        className={`rounded-xl border px-3 py-2 text-xs leading-relaxed ${
          session.validity.valid
            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
            : "border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300"
        }`}
        role="status"
      >
        {session.validity.valid ? (
          <><strong>Execução válida</strong> pelos critérios automáticos (engajamento e padrão de resposta).</>
        ) : (
          <>
            <strong>Atenção — critérios de validade não atendidos:</strong>
            <ul className="mt-1 list-disc pl-4">
              {session.validity.issues.map((i) => <li key={i}>{i}</li>)}
            </ul>
          </>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Stat label="TR médio" value={ms(s.meanRt)} hint={`mediana ${ms(s.medianRt)}`} />
        <Stat label="Desvio padrão" value={ms(s.sdRt)} hint={s.cvRt !== null ? `CV ${(s.cvRt * 100).toFixed(1)}% (variabilidade)` : undefined} />
        <Stat label="Acurácia" value={pct(s.accuracy)} hint={`${s.nTrials} ensaios`} />
        <Stat label="Omissões" value={pct(s.omissionRate)} hint="alvos sem resposta" />
        <Stat label="Comissões" value={pct(s.commissionRate)} hint="respostas indevidas/erradas" />
        <Stat label="Antecipações" value={pct(s.anticipationRate)} hint="respostas <150 ms" />
        <Stat label="TR mínimo" value={ms(s.minRt)} />
        <Stat label="TR máximo" value={ms(s.maxRt)} />
        <Stat
          label="Fadiga (Δ blocos)"
          value={s.fatigueDeltaMs === null ? "—" : `${s.fatigueDeltaMs > 0 ? "+" : ""}${s.fatigueDeltaMs} ms`}
          hint="último − primeiro bloco"
        />
      </div>

      {interference !== null && (
        <div className="rounded-xl border border-border bg-muted/30 px-3 py-2 text-xs">
          <strong>Efeito de interferência:</strong> incongruente {ms(incongr?.meanRt ?? null)} −
          congruente {ms(congr?.meanRt ?? null)} = <strong>{interference > 0 ? "+" : ""}{interference} ms</strong>
        </div>
      )}

      {switchCost !== null && (
        <div className="rounded-xl border border-border bg-muted/30 px-3 py-2 text-xs">
          <strong>Custo de troca:</strong> troca {ms(swi?.meanRt ?? null)} − repetição {ms(rep?.meanRt ?? null)} ={" "}
          <strong>{switchCost > 0 ? "+" : ""}{switchCost} ms</strong>
        </div>
      )}

      {session.customSummary && session.customSummary.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {session.customSummary.map((c) => (
            <Stat key={c.label} label={c.label} value={c.value} hint={c.hint} />
          ))}
        </div>
      )}

      {rtSeries.length > 3 && (
        <div className="h-44 w-full rounded-xl border border-border bg-muted/20 p-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rtSeries} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid stroke={GRID} strokeDasharray="3 3" />
              <XAxis dataKey="ensaio" tick={{ fontSize: 10, fill: MUTED }} stroke={GRID} />
              <YAxis tick={{ fontSize: 10, fill: MUTED }} stroke={GRID} unit="ms" />
              <Tooltip
                contentStyle={{ background: SURFACE, border: `1px solid ${GRID}`, borderRadius: 12, fontSize: 12 }}
                formatter={(v: number) => [`${v} ms`, "TR"]}
                labelFormatter={(l) => `Ensaio ${l}`}
              />
              <Line type="monotone" dataKey="rt" stroke={LINE} strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        {s.blockMeans.map((b) => (
          <Badge key={b.block} variant="secondary" className="text-[10px]">
            Bloco {b.block + 1}: {ms(b.meanRt)} · {pct(b.accuracy)}
          </Badge>
        ))}
        {tagPairs.map(([tag, v]) => (
          <Badge key={tag} variant="outline" className="text-[10px]">
            {tag}: {ms(v.meanRt)} · {pct(v.accuracy)}
          </Badge>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => exportSessionCsv(session)}>
          <Download className="h-3.5 w-3.5" /> CSV
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => exportSessionJson(session)}>
          <Download className="h-3.5 w-3.5" /> JSON
        </Button>
      </div>

      <p className="text-[10px] leading-relaxed text-muted-foreground">
        Relatório descritivo de tarefa cognitiva computadorizada (NeuroPed Cognitive Lab). Não é teste
        normatizado; interpretar no contexto clínico, considerando idade, colaboração e condições de aplicação.
      </p>
    </div>
  );
}
