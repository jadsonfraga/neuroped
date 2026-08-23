import { useEffect, useMemo, useRef, useState } from "react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus, Trash2, FileDown, TrendingUp, ListChecks, BarChart3, Info, ShieldAlert,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { MAX_SECURE_PLAINTEXT_BYTES, secureGet, secureSet } from "@/lib/secureStorage";
import { neutralizeCsvFormula } from "@/lib/csv";

/**
 * Motor genérico de diários clínicos longitudinais.
 * Portado de neuroped-diary-engine.js + neuroped-diarios.js (app legado).
 * NÃO pontua: registra episódios e produz histórico + tendência.
 *
 * Em sessão clínica remota autenticada, o diário falha fechado: nenhum dado é
 * lido, migrado ou gravado no dispositivo. Isso impede a criação silenciosa de
 * um prontuário paralelo fora do tenant LIVE. Dados locais preexistentes são
 * preservados no dispositivo e não são migrados automaticamente para LIVE.
 */

export type DiarioFieldType = "date" | "time" | "number" | "text" | "textarea" | "select";

export interface DiarioField {
  key: string;
  label: string;
  type: DiarioFieldType;
  required?: boolean;
  placeholder?: string;
  min?: number;
  max?: number;
  options?: string[];
  /** Se definido, o valor numérico deste campo alimenta o gráfico de tendência. */
  trend?: boolean;
}

export interface DiarioConfig {
  id: string;
  storageKey: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  fields: DiarioField[];
  /** Rótulo do eixo do gráfico de tendência. */
  trendLabel?: string;
}

export interface DiarioEntry {
  id: string;
  createdAt: number;
  [key: string]: string | number;
}

const MAX_DIARY_ENTRIES = 250;
const MAX_DIARY_FIELD_LENGTH = 2_000;
const MAX_DIARY_BYTES = Math.min(1_500_000, MAX_SECURE_PLAINTEXT_BYTES);

function sanitizeEntries(value: unknown, fields: DiarioField[]): DiarioEntry[] {
  if (!Array.isArray(value)) return [];
  const allowed = new Set(fields.map((field) => field.key));
  const normalized = value.slice(-MAX_DIARY_ENTRIES).flatMap((candidate) => {
    if (!candidate || typeof candidate !== "object") return [];
    const source = candidate as Record<string, unknown>;
    if (
      typeof source.id !== "string" ||
      typeof source.createdAt !== "number" ||
      !Number.isFinite(source.createdAt)
    ) return [];

    const entry: DiarioEntry = {
      id: source.id.slice(0, 128),
      createdAt: source.createdAt,
    };
    for (const key of allowed) {
      const fieldValue = source[key];
      if (typeof fieldValue === "string") entry[key] = fieldValue.slice(0, MAX_DIARY_FIELD_LENGTH);
      else if (typeof fieldValue === "number" && Number.isFinite(fieldValue)) entry[key] = fieldValue;
    }
    return [entry];
  });

  const selected: DiarioEntry[] = [];
  let totalBytes = 2;
  for (let index = normalized.length - 1; index >= 0; index -= 1) {
    const entry = normalized[index];
    const bytes = new TextEncoder().encode(JSON.stringify(entry)).byteLength + 1;
    if (totalBytes + bytes > MAX_DIARY_BYTES) continue;
    selected.unshift(entry);
    totalBytes += bytes;
  }
  return selected;
}

function emptyForm(fields: DiarioField[]): Record<string, string> {
  const f: Record<string, string> = {};
  for (const field of fields) {
    if (field.type === "date") f[field.key] = new Date().toISOString().slice(0, 10);
    else f[field.key] = "";
  }
  return f;
}

function fmtDate(entry: DiarioEntry): string {
  const raw = String(entry.date || entry.datetime || "");
  if (raw) {
    try {
      const d = new Date(raw.length <= 10 ? raw + "T00:00:00" : raw);
      return d.toLocaleDateString("pt-BR");
    } catch {
      return raw;
    }
  }
  return new Date(entry.createdAt).toLocaleDateString("pt-BR");
}

export function DiarioClinico({ config }: { config: DiarioConfig }) {
  const { toast } = useToast();
  const { accessMode, isAuthenticated } = useAuth();
  const localDraftEnabled = !(accessMode === "remote" && isAuthenticated);
  const [entries, setEntries] = useState<DiarioEntry[]>([]);
  const [entriesReady, setEntriesReady] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const saveQueue = useRef<Promise<unknown>>(Promise.resolve());
  const [tab, setTab] = useState<"add" | "history" | "trend">("add");
  const [form, setForm] = useState<Record<string, string>>(() => emptyForm(config.fields));

  useEffect(() => {
    let active = true;
    if (!localDraftEnabled) {
      setEntries([]);
      setStorageError(false);
      setEntriesReady(true);
      return () => { active = false; };
    }

    const secureKey = `diario:${config.id}`;
    setEntriesReady(false);
    void (async () => {
      const protectedEntries = await secureGet<DiarioEntry[]>(secureKey);
      let restored = sanitizeEntries(protectedEntries, config.fields);

      if (protectedEntries === null) {
        try {
          const raw = localStorage.getItem(config.storageKey);
          const legacy = sanitizeEntries(raw ? JSON.parse(raw) : [], config.fields);
          if (legacy.length > 0) {
            restored = legacy;
            const migrated = await secureSet(secureKey, legacy);
            if (migrated && localStorage.getItem(config.storageKey) === raw) {
              localStorage.removeItem(config.storageKey);
            }
          } else if (raw !== null && legacy.length === 0) {
            localStorage.removeItem(config.storageKey);
          }
        } catch {
          // Sem armazenamento, o diário permanece disponível apenas em memória.
        }
      } else {
        try { localStorage.removeItem(config.storageKey); } catch { /* legado indisponível */ }
      }

      if (!active) return;
      setEntries(restored);
      setEntriesReady(true);
    })();
    return () => { active = false; };
  }, [config.fields, config.id, config.storageKey, localDraftEnabled]);

  useEffect(() => {
    if (!entriesReady || !localDraftEnabled) return;
    const secureKey = `diario:${config.id}`;
    const snapshot = sanitizeEntries(entries, config.fields);
    const operation = saveQueue.current
      .catch(() => undefined)
      .then(() => secureSet(secureKey, snapshot))
      .catch(() => false);
    saveQueue.current = operation;
    void operation.then((stored) => setStorageError(stored !== true));
  }, [config.fields, config.id, entries, entriesReady, localDraftEnabled]);

  const Icon = config.icon;
  const trendField = config.fields.find((f) => f.trend);

  const sorted = useMemo(
    () => [...entries].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)),
    [entries],
  );

  const trendData = useMemo(() => {
    if (!trendField) return [];
    return [...entries]
      .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
      .map((e) => ({ data: fmtDate(e), valor: Number(e[trendField.key]) }))
      .filter((d) => Number.isFinite(d.valor));
  }, [entries, trendField]);

  function setField(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function saveEntry(e: React.FormEvent) {
    e.preventDefault();
    if (!localDraftEnabled) {
      toast({
        title: "Registro local bloqueado no modo clínico LIVE",
        description: "Use somente fluxos vinculados à clínica e ao paciente.",
        variant: "destructive",
      });
      return;
    }
    const missing = config.fields.filter((f) => f.required && !form[f.key]?.trim());
    if (missing.length) {
      toast({ title: "Preencha os campos obrigatórios", variant: "destructive" });
      return;
    }
    const entry: DiarioEntry = {
      ...(form as Record<string, string>),
      id: `ep-${crypto.randomUUID()}`,
      createdAt: Date.now(),
    };
    setEntries((prev) => [...prev, entry]);
    setForm(emptyForm(config.fields));
    toast({ title: "Rascunho local salvo neste dispositivo" });
    setTab("history");
  }

  function removeEntry(id: string) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  function clearAll() {
    if (!confirm(`Apagar todos os ${entries.length} registros deste diário?`)) return;
    setEntries([]);
  }

  function exportCSV() {
    const cols = config.fields.map((f) => f.key);
    const header = ["data_registro", ...config.fields.map((f) => f.label)];
    const rows = sorted.map((e) => [
      new Date(e.createdAt).toLocaleString("pt-BR"),
      ...cols.map((c) => e[c] ?? ""),
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((c) => `"${neutralizeCsvFormula(String(c)).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${config.id}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2_000);
  }

  if (!entriesReady) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground" role="status">
        Carregando diário clínico protegido…
      </div>
    );
  }

  if (!localDraftEnabled) {
    return (
      <Card
        className="border-amber-300 bg-amber-50/80 dark:border-amber-900/60 dark:bg-amber-950/20"
        data-testid="diario-local-persistence-disabled"
      >
        <CardContent className="flex items-start gap-3 p-5 text-sm leading-6 text-amber-950 dark:text-amber-100">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-semibold">Persistência local bloqueada no modo clínico LIVE.</p>
            <p className="mt-1">
              Este diário não lê, migra nem grava dados clínicos no dispositivo durante uma sessão remota autenticada. Use apenas fluxos tenant-aware vinculados à clínica e ao paciente. Dados locais preexistentes não foram apagados nem enviados automaticamente.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {storageError && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive" role="alert">
          Os rascunhos continuam visíveis, mas não puderam ser salvos neste dispositivo. Exporte o CSV antes de sair da tela.
        </div>
      )}
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-sm`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold">{config.title}</h1>
          <p className="text-xs text-muted-foreground">{config.subtitle}</p>
        </div>
        <Badge variant="secondary" className="ml-auto">
          {entries.length} registro{entries.length === 1 ? "" : "s"}
        </Badge>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <Button size="sm" variant={tab === "add" ? "default" : "outline"} onClick={() => setTab("add")}>
          <Plus className="w-4 h-4 mr-1" /> Novo registro
        </Button>
        <Button size="sm" variant={tab === "history" ? "default" : "outline"} onClick={() => setTab("history")}>
          <ListChecks className="w-4 h-4 mr-1" /> Histórico
        </Button>
        <Button size="sm" variant={tab === "trend" ? "default" : "outline"} onClick={() => setTab("trend")}>
          <TrendingUp className="w-4 h-4 mr-1" /> Tendência
        </Button>
      </div>

      {/* Add */}
      {tab === "add" && (
        <Card>
          <CardContent className="p-5">
            <form onSubmit={saveEntry} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                {config.fields.map((f) => (
                  <div key={f.key} className={f.type === "textarea" ? "sm:col-span-2 space-y-1.5" : "space-y-1.5"}>
                    <Label htmlFor={f.key} className="text-xs">
                      {f.label}{f.required && <span className="text-destructive"> *</span>}
                    </Label>
                    {f.type === "select" ? (
                      <select
                        id={f.key}
                        value={form[f.key] || ""}
                        onChange={(e) => setField(f.key, e.target.value)}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      >
                        <option value="">—</option>
                        {f.options?.map((o) => (
                          <option key={o} value={o}>{o}</option>
                        ))}
                      </select>
                    ) : f.type === "textarea" ? (
                      <Textarea
                        id={f.key}
                        value={form[f.key] || ""}
                        placeholder={f.placeholder}
                        onChange={(e) => setField(f.key, e.target.value)}
                      />
                    ) : (
                      <Input
                        id={f.key}
                        type={f.type}
                        value={form[f.key] || ""}
                        placeholder={f.placeholder}
                        min={f.min}
                        max={f.max}
                        onChange={(e) => setField(f.key, e.target.value)}
                      />
                    )}
                  </div>
                ))}
              </div>
              <Button type="submit">
                <Plus className="w-4 h-4 mr-1" /> Salvar rascunho local
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* History */}
      {tab === "history" && (
        <div className="space-y-3">
          {sorted.length > 0 && (
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={exportCSV}>
                <FileDown className="w-4 h-4 mr-1" /> Exportar CSV
              </Button>
              <Button size="sm" variant="ghost" className="text-destructive" onClick={clearAll}>
                <Trash2 className="w-4 h-4 mr-1" /> Apagar tudo
              </Button>
            </div>
          )}
          {sorted.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-sm text-muted-foreground">
                Nenhum rascunho local ainda. Clique em “Novo registro”.
              </CardContent>
            </Card>
          ) : (
            sorted.map((entry) => (
              <Card key={entry.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <strong className="text-sm text-primary">{fmtDate(entry)}</strong>
                    <button
                      onClick={() => removeEntry(entry.id)}
                      className="text-xs text-destructive hover:underline"
                    >
                      apagar
                    </button>
                  </div>
                  <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                    {config.fields
                      .filter((f) => entry[f.key])
                      .map((f) => (
                        <div key={f.key} className="contents">
                          <dt className="font-semibold text-muted-foreground">{f.label}</dt>
                          <dd className="text-foreground">{entry[f.key]}</dd>
                        </div>
                      ))}
                  </dl>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Trend */}
      {tab === "trend" && (
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold">
                Tendência — {trendField?.label || "sem métrica numérica"}
              </h2>
            </div>
            {!trendField ? (
              <p className="text-sm text-muted-foreground">Este diário não tem métrica numérica de tendência.</p>
            ) : trendData.length < 2 ? (
              <p className="text-sm text-muted-foreground">
                São necessários ao menos 2 registros com valor numérico para desenhar a tendência.
              </p>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="data" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis
                      domain={[trendField.min ?? "auto", trendField.max ?? "auto"]}
                      tick={{ fontSize: 11 }}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: 12,
                        fontSize: 12,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="valor"
                      name={config.trendLabel || trendField.label}
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <p className="text-[11px] text-muted-foreground border-t border-border pt-3 flex items-start gap-1.5">
        <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
        Rascunho longitudinal local — os dados ficam apenas neste dispositivo e não integram o prontuário LIVE. Padrões são insumo para o médico; leve o histórico completo (Exportar CSV) à consulta.
      </p>
    </div>
  );
}