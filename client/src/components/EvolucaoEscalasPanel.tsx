import { AlertTriangle, Info, TrendingDown, TrendingUp } from "lucide-react";
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AVISO_APOIO, type PendenteEvolucao, type SerieEvolucao } from "@/lib/evolucaoEscalas";
import { formatIsoDateBr } from "@/lib/clinicalDate";

const br = (iso: string): string => formatIsoDateBr(iso) ?? "—";

/** Gráficos de evolução + alertas (apoio ao médico). Dados já calculados em lib/evolucaoEscalas. */
export function EvolucaoEscalasPanel({ series, pendentes }: { series: SerieEvolucao[]; pendentes: PendenteEvolucao[] }) {
  return (
    <div className="space-y-5" data-testid="evolucao-panel">
      <div role="note" data-testid="evolucao-aviso-apoio" className="flex gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100">
        <Info className="mt-0.5 h-4 w-4 shrink-0" /><p>{AVISO_APOIO}</p>
      </div>

      {series.length === 0 && <p className="text-sm text-muted-foreground" data-testid="evolucao-vazio">Nenhum instrumento com regra de evolução validada e escore salvo para este paciente.</p>}

      {series.map((s) => {
        const dados = s.pontos.map((p) => ({ data: br(p.data), escore: p.escore, faixa: p.faixa }));
        const piora = s.alertas.some((a) => a.codigo === "piora-de-faixa");
        return (
          <section key={s.instrumento.id} className="space-y-3 rounded-2xl border border-border/70 bg-card/80 p-4" data-testid={`evolucao-serie-${s.instrumento.id}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="flex items-center gap-2 text-sm font-bold">
                {piora ? <TrendingUp className="h-4 w-4 text-red-600" /> : <TrendingDown className="h-4 w-4 text-emerald-600" />}
                {s.instrumento.nome}
              </h3>
              <span className="text-xs text-muted-foreground">{s.pontos.length} aplicação(ões) · fonte: {s.instrumento.fonte}</span>
            </div>
            {s.instrumento.nota && <p className="text-xs text-muted-foreground">{s.instrumento.nota}</p>}

            {s.pontos.length >= 2 ? (
              <div className="h-56 w-full" data-testid={`evolucao-grafico-${s.instrumento.id}`} role="img" aria-label={`Evolução do escore de ${s.instrumento.nome}: ${s.pontos.map((p) => `${br(p.data)} ${p.escore}`).join("; ")}`}>
                <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={200}>
                  <LineChart data={dados} margin={{ top: 8, right: 16, left: -12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="data" tick={{ fontSize: 11 }} />
                    <YAxis domain={[s.instrumento.minimo ?? "auto", s.instrumento.maximo ?? "auto"]} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    {s.cortes.map((c) => (
                      <ReferenceLine key={c.nome} y={c.deEscore} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" label={{ value: c.nome, fontSize: 10, position: "insideTopRight" }} />
                    ))}
                    <Line type="monotone" dataKey="escore" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={{ r: 4 }} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground" data-testid={`evolucao-sem-grafico-${s.instrumento.id}`}>Uma única aplicação: o gráfico aparece a partir da segunda.</p>
            )}

            <table className="w-full text-xs" data-testid={`evolucao-tabela-${s.instrumento.id}`}>
              <caption className="sr-only">Aplicações de {s.instrumento.nome}</caption>
              <thead><tr className="text-left text-muted-foreground"><th scope="col">Data</th><th scope="col">Escore</th><th scope="col">Faixa</th><th scope="col">Variação</th></tr></thead>
              <tbody>
                {s.pontos.map((p) => (
                  <tr key={p.id}><td>{br(p.data)}</td><td>{p.escore}</td><td>{p.faixa}</td><td>{p.delta === null ? "—" : `${p.delta > 0 ? "+" : ""}${p.delta}`}</td></tr>
                ))}
              </tbody>
            </table>

            {s.alertas.length > 0 && (
              <ul className="space-y-1" data-testid={`evolucao-alertas-${s.instrumento.id}`}>
                {s.alertas.map((a, i) => (
                  <li key={i} data-codigo={a.codigo} className={`flex gap-2 text-xs ${a.nivel === "atencao" ? "text-red-700 dark:text-red-300" : "text-muted-foreground"}`}>
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>{a.nivel === "atencao" ? "Atenção: " : "Nota: "}{a.mensagem}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}

      {pendentes.length > 0 && (
        <section className="space-y-2 rounded-2xl border border-dashed p-4" data-testid="evolucao-pendentes">
          <h3 className="text-sm font-bold">Pendentes de regra validada</h3>
          <p className="text-xs text-muted-foreground">Estes instrumentos têm aplicações salvas, mas o app ainda não tem regra de evolução validada para eles: sem gráfico nem alerta.</p>
          <ul className="space-y-1 text-xs">
            {pendentes.map((p) => (
              <li key={p.nome} data-testid="evolucao-pendente">
                <span className="font-semibold">{p.nome}</span>: {p.aplicacoes.map((a) => `${br(a.data)} ${a.escore ?? "sem escore"}`).join(" · ")}
                <span className="block text-muted-foreground">{p.motivo}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
