import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Zap, Plus, Trash2, RotateCcw, ChevronDown, ChevronUp,
  Activity, Clock, AlertTriangle, Pill, FileText, BarChart3
} from "lucide-react";

/* ─── Types ─── */
interface Crise {
  id: number;
  data: string;
  hora: string;
  tipo: string;
  duracao: string;
  intensidade: number;
  gatilhos: string[];
  fasePostIctal: string;
  medicacoes: string;
  observacoes: string;
}

const tiposCrise = [
  "Tônico-clônica generalizada",
  "Ausência típica",
  "Ausência atípica",
  "Mioclônica",
  "Tônica",
  "Clônica",
  "Atônica",
  "Focal com consciência preservada",
  "Focal com comprometimento da consciência",
  "Focal evoluindo para tônico-clônica bilateral",
  "Espasmos epilépticos",
  "Outro",
];

const gatilhosList = [
  "Privação de sono",
  "Estresse emocional",
  "Febre / doença",
  "Fotoestimulação",
  "Esquecimento de medicação",
  "Menstruação",
  "Exercício físico intenso",
  "Jejum prolongado",
  "Álcool / substância",
  "Outro",
];

const fasesPostIctais = [
  "Sem alteração",
  "Sonolência leve",
  "Sonolência intensa",
  "Confusão mental",
  "Cefaleia",
  "Paralisia de Todd",
  "Agitação / irritabilidade",
  "Náusea / vômito",
  "Afasia transitória",
];

const duracoes = [
  "< 30 segundos",
  "30 seg – 1 min",
  "1 – 2 min",
  "2 – 5 min",
  "5 – 10 min",
  "10 – 30 min",
  "> 30 min (estado de mal)",
];

function emptyCrise(): Omit<Crise, "id"> {
  return {
    data: new Date().toISOString().slice(0, 10),
    hora: new Date().toTimeString().slice(0, 5),
    tipo: tiposCrise[0],
    duracao: duracoes[0],
    intensidade: 3,
    gatilhos: [],
    fasePostIctal: fasesPostIctais[0],
    medicacoes: "",
    observacoes: "",
  };
}

export default function DiarioEpilepsiaPage() {
  const [crises, setCrises] = useState<Crise[]>([]);
  const [form, setForm] = useState(emptyCrise());
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [nextId, setNextId] = useState(1);
  const [showStats, setShowStats] = useState(false);

  /* ─── Form helpers ─── */
  function toggleGatilho(g: string) {
    setForm((f) => ({
      ...f,
      gatilhos: f.gatilhos.includes(g)
        ? f.gatilhos.filter((x) => x !== g)
        : [...f.gatilhos, g],
    }));
  }

  function handleSave() {
    setCrises((prev) => [{ ...form, id: nextId }, ...prev]);
    setNextId((n) => n + 1);
    setForm(emptyCrise());
    setShowForm(false);
  }

  function handleDelete(id: number) {
    setCrises((prev) => prev.filter((c) => c.id !== id));
  }

  function handleReset() {
    setCrises([]);
    setForm(emptyCrise());
    setShowForm(false);
    setExpandedId(null);
    setNextId(1);
    setShowStats(false);
  }

  /* ─── Stats ─── */
  const totalCrises = crises.length;
  const last30 = crises.filter((c) => {
    const d = new Date(c.data);
    const now = new Date();
    return now.getTime() - d.getTime() <= 30 * 24 * 60 * 60 * 1000;
  });
  const crisesUltimos30 = last30.length;

  const tipoFreq: Record<string, number> = {};
  for (const c of crises) {
    tipoFreq[c.tipo] = (tipoFreq[c.tipo] || 0) + 1;
  }
  const tipoMaisFrequente = Object.entries(tipoFreq).sort((a, b) => b[1] - a[1])[0];

  const gatilhoFreq: Record<string, number> = {};
  for (const c of crises) {
    for (const g of c.gatilhos) {
      gatilhoFreq[g] = (gatilhoFreq[g] || 0) + 1;
    }
  }
  const topGatilhos = Object.entries(gatilhoFreq).sort((a, b) => b[1] - a[1]).slice(0, 3);

  const avgIntensidade =
    crises.length > 0
      ? (crises.reduce((s, c) => s + c.intensidade, 0) / crises.length).toFixed(1)
      : "—";

  const statusMalEpileptico = crises.some((c) => c.duracao === "> 30 min (estado de mal)");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold">Diário de Crises Epilépticas</h1>
          <p className="text-xs text-muted-foreground">
            Registro e acompanhamento de crises convulsivas
          </p>
        </div>
      </div>

      {/* Quick stats bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800/40 p-3 text-center">
          <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">{totalCrises}</p>
          <p className="text-xs text-muted-foreground">Total de crises</p>
        </div>
        <div className="rounded-xl bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/40 p-3 text-center">
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{crisesUltimos30}</p>
          <p className="text-xs text-muted-foreground">Últimos 30 dias</p>
        </div>
        <div className="rounded-xl bg-fuchsia-50 dark:bg-fuchsia-950/20 border border-fuchsia-200 dark:border-fuchsia-800/40 p-3 text-center">
          <p className="text-2xl font-bold text-fuchsia-600 dark:text-fuchsia-400">{avgIntensidade}</p>
          <p className="text-xs text-muted-foreground">Intensidade média</p>
        </div>
      </div>

      {/* Status de mal epiléptico warning */}
      {statusMalEpileptico && (
        <div className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-300 dark:border-red-800 p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-700 dark:text-red-300">
              Atenção: Estado de mal epiléptico registrado
            </p>
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
              Crises com duração &gt; 30 minutos requerem avaliação médica urgente. Considere revisão do plano terapêutico.
            </p>
          </div>
        </div>
      )}

      {/* New crisis button */}
      <Button
        onClick={() => setShowForm(!showForm)}
        className="w-full gap-2 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
        data-testid="button-nova-crise"
      >
        {showForm ? (
          <>
            <ChevronUp className="w-4 h-4" />
            Fechar Formulário
          </>
        ) : (
          <>
            <Plus className="w-4 h-4" />
            Registrar Nova Crise
          </>
        )}
      </Button>

      {/* Crisis form */}
      {showForm && (
        <Card className="border-violet-200 dark:border-violet-800/40">
          <CardContent className="p-5 space-y-5">
            <h2 className="text-sm font-semibold text-violet-600 dark:text-violet-400 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Nova Crise
            </h2>

            {/* Date + Time */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Data</label>
                <input
                  type="date"
                  value={form.data}
                  onChange={(e) => setForm({ ...form, data: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                  data-testid="input-data"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Hora</label>
                <input
                  type="time"
                  value={form.hora}
                  onChange={(e) => setForm({ ...form, hora: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                  data-testid="input-hora"
                />
              </div>
            </div>

            {/* Tipo de crise */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Tipo de Crise</label>
              <select
                value={form.tipo}
                onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                data-testid="select-tipo"
              >
                {tiposCrise.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Duração */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Duração
              </label>
              <div className="flex flex-wrap gap-2">
                {duracoes.map((d) => (
                  <button
                    key={d}
                    onClick={() => setForm({ ...form, duracao: d })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      form.duracao === d
                        ? "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 border-violet-300 dark:border-violet-700"
                        : "bg-card text-muted-foreground border-border hover:bg-muted"
                    }`}
                    data-testid={`button-duracao-${d}`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Intensidade 1-5 */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Intensidade ({form.intensidade}/5)
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((level) => (
                  <button
                    key={level}
                    onClick={() => setForm({ ...form, intensidade: level })}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all border ${
                      form.intensidade === level
                        ? level <= 2
                          ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700 ring-1 ring-green-400/30"
                          : level === 3
                          ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700 ring-1 ring-amber-400/30"
                          : "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700 ring-1 ring-red-400/30"
                        : "bg-card text-muted-foreground border-border hover:bg-muted"
                    }`}
                    data-testid={`button-intensidade-${level}`}
                  >
                    {level}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground px-1">
                <span>Leve</span>
                <span>Moderada</span>
                <span>Grave</span>
              </div>
            </div>

            {/* Gatilhos */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Possíveis Gatilhos
              </label>
              <div className="flex flex-wrap gap-2">
                {gatilhosList.map((g) => (
                  <button
                    key={g}
                    onClick={() => toggleGatilho(g)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      form.gatilhos.includes(g)
                        ? "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700"
                        : "bg-card text-muted-foreground border-border hover:bg-muted"
                    }`}
                    data-testid={`button-gatilho-${g}`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Fase pós-ictal */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Fase Pós-ictal</label>
              <select
                value={form.fasePostIctal}
                onChange={(e) => setForm({ ...form, fasePostIctal: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                data-testid="select-postictal"
              >
                {fasesPostIctais.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>

            {/* Medicações */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <Pill className="w-3.5 h-3.5" />
                Medicações em Uso
              </label>
              <input
                type="text"
                value={form.medicacoes}
                onChange={(e) => setForm({ ...form, medicacoes: e.target.value })}
                placeholder="Ex: Valproato 500mg 2x/dia, Levetiracetam 250mg 2x/dia"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                data-testid="input-medicacoes"
              />
            </div>

            {/* Observações */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Observações</label>
              <textarea
                value={form.observacoes}
                onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                rows={3}
                placeholder="Descrição semiológica, circunstâncias, testemunhas..."
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 resize-none"
                data-testid="textarea-observacoes"
              />
            </div>

            {/* Save */}
            <Button
              onClick={handleSave}
              className="w-full gap-2 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
              data-testid="button-salvar-crise"
            >
              <Plus className="w-4 h-4" />
              Salvar Crise
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Detailed stats section */}
      {crises.length > 0 && (
        <button
          onClick={() => setShowStats(!showStats)}
          className="w-full flex items-center justify-between p-4 rounded-xl bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800/40 transition-colors hover:opacity-90"
          data-testid="button-toggle-stats"
        >
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            <span className="text-sm font-semibold text-violet-600 dark:text-violet-400">
              Estatísticas Detalhadas
            </span>
          </div>
          {showStats ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
      )}

      {showStats && crises.length > 0 && (
        <Card className="border-violet-200 dark:border-violet-800/40">
          <CardContent className="p-5 space-y-4">
            {/* Tipo mais frequente */}
            {tipoMaisFrequente && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Tipo mais frequente</p>
                <div className="flex items-center gap-2">
                  <Badge className="bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
                    {tipoMaisFrequente[0]}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    ({tipoMaisFrequente[1]}x — {((tipoMaisFrequente[1] / totalCrises) * 100).toFixed(0)}%)
                  </span>
                </div>
              </div>
            )}

            {/* Distribuição de tipos */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Distribuição por tipo</p>
              {Object.entries(tipoFreq)
                .sort((a, b) => b[1] - a[1])
                .map(([tipo, count]) => (
                  <div key={tipo} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-foreground truncate mr-2">{tipo}</span>
                      <span className="text-muted-foreground font-mono">{count}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all"
                        style={{ width: `${(count / totalCrises) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
            </div>

            {/* Top gatilhos */}
            {topGatilhos.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Gatilhos mais comuns</p>
                <div className="flex flex-wrap gap-2">
                  {topGatilhos.map(([g, count]) => (
                    <Badge
                      key={g}
                      variant="outline"
                      className="text-xs text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800"
                    >
                      {g} ({count}x)
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Frequência mensal hint */}
            {crisesUltimos30 >= 4 && (
              <div className="rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 p-3 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  <strong>Frequência elevada:</strong> {crisesUltimos30} crises nos últimos 30 dias.
                  Considere revisar a adequação do esquema terapêutico e solicitar EEG de controle.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Crisis list */}
      {crises.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <FileText className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            Registro de Crises ({crises.length})
          </h2>

          {crises.map((c) => {
            const isExpanded = expandedId === c.id;
            const intensityColor =
              c.intensidade <= 2
                ? "text-green-600 dark:text-green-400"
                : c.intensidade === 3
                ? "text-amber-600 dark:text-amber-400"
                : "text-red-600 dark:text-red-400";

            return (
              <Card
                key={c.id}
                className="border-card-border"
                data-testid={`card-crise-${c.id}`}
              >
                <CardContent className="p-4 space-y-3">
                  {/* Summary row */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : c.id)}
                    className="w-full flex items-center justify-between"
                    data-testid={`button-expand-crise-${c.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                        <Zap className="w-4 h-4 text-white" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium text-foreground">{c.tipo}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(c.data + "T00:00:00").toLocaleDateString("pt-BR")} às {c.hora}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`text-xs font-mono ${intensityColor}`}>
                        {c.intensidade}/5
                      </Badge>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </button>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="space-y-3 pt-2 border-t border-border">
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <p className="text-muted-foreground">Duração</p>
                          <p className="font-medium text-foreground">{c.duracao}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Pós-ictal</p>
                          <p className="font-medium text-foreground">{c.fasePostIctal}</p>
                        </div>
                      </div>

                      {c.gatilhos.length > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Gatilhos</p>
                          <div className="flex flex-wrap gap-1.5">
                            {c.gatilhos.map((g) => (
                              <Badge
                                key={g}
                                variant="outline"
                                className="text-xs text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800"
                              >
                                {g}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {c.medicacoes && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Medicações</p>
                          <p className="text-xs text-foreground">{c.medicacoes}</p>
                        </div>
                      )}

                      {c.observacoes && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Observações</p>
                          <p className="text-xs text-foreground leading-relaxed">{c.observacoes}</p>
                        </div>
                      )}

                      <Button
                        onClick={() => handleDelete(c.id)}
                        variant="outline"
                        size="sm"
                        className="w-full gap-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
                        data-testid={`button-delete-crise-${c.id}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Excluir Registro
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {crises.length === 0 && !showForm && (
        <div className="rounded-xl bg-muted/50 p-8 text-center space-y-3">
          <Zap className="w-10 h-10 text-violet-400 mx-auto" />
          <p className="text-sm text-muted-foreground">
            Nenhuma crise registrada ainda.
          </p>
          <p className="text-xs text-muted-foreground">
            Utilize o botão acima para registrar a primeira crise.
          </p>
        </div>
      )}

      {/* Reset */}
      {crises.length > 0 && (
        <Button
          onClick={handleReset}
          variant="outline"
          className="w-full gap-2"
          data-testid="button-reset"
        >
          <RotateCcw className="w-4 h-4" />
          Limpar Todos os Registros
        </Button>
      )}

      {/* Info box */}
      <div className="rounded-xl bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800/40 p-4">
        <p className="text-xs text-foreground/80 leading-relaxed">
          <strong>Orientações:</strong> Mantenha este diário atualizado e apresente-o ao neurologista em cada consulta.
          Registre o maior número de detalhes possível sobre cada crise — tipo, duração, semiologia, gatilhos e fase pós-ictal
          são informações essenciais para o ajuste terapêutico. Crises com duração {">"}5 minutos ou mudanças no padrão habitual
          devem ser comunicadas ao médico antes da próxima consulta.
        </p>
      </div>
    </div>
  );
}
