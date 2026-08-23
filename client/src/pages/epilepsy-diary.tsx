import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle, Zap, Plus, Trash2, FileDown, Info, Calendar, ShieldAlert } from "lucide-react";
import {
  epilepsyTypes, epilepsyTriggers, postIctalSymptoms,
  type EpilepsyEntry
} from "@/data/expandedScales";
import { useAuth } from "@/contexts/AuthContext";
import { secureGet, secureSet } from "@/lib/secureStorage";
import { neutralizeCsvFormula } from "@/lib/csv";

const STORAGE_KEY = "diario:epilepsia:v1";
const MAX_ENTRIES = 500;
const MAX_FIELD = 4_000;

function safeText(value: unknown, max = MAX_FIELD): string {
  return typeof value === "string" ? value.slice(0, max) : "";
}

function safeList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string").slice(0, 40).map((item) => item.slice(0, 200))
    : [];
}

function sanitizeEntries(value: unknown): EpilepsyEntry[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, MAX_ENTRIES).flatMap((candidate) => {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) return [];
    const item = candidate as Record<string, unknown>;
    return [{
      date: safeText(item.date, 10),
      time: safeText(item.time, 5),
      type: safeText(item.type, 160),
      duration: safeText(item.duration, 120),
      consciousness: safeText(item.consciousness, 120),
      triggers: safeList(item.triggers),
      description: safeText(item.description),
      postIctal: safeList(item.postIctal),
      medication: safeText(item.medication, 1_000),
      notes: safeText(item.notes),
    } satisfies EpilepsyEntry];
  });
}

function newEntry(): EpilepsyEntry {
  const now = new Date();
  return {
    date: now.toISOString().slice(0, 10),
    time: now.toTimeString().slice(0, 5),
    type: "",
    duration: "",
    consciousness: "",
    triggers: [],
    description: "",
    postIctal: [],
    medication: "",
    notes: "",
  };
}

function csvCell(value: unknown): string {
  return `"${neutralizeCsvFormula(String(value ?? "")).replace(/"/g, '""')}"`;
}

export default function EpilepsyDiaryPage() {
  const { accessMode, isAuthenticated } = useAuth();
  const localDraftEnabled = !(accessMode === "remote" && isAuthenticated);
  const [entries, setEntries] = useState<EpilepsyEntry[]>([]);
  const [entriesReady, setEntriesReady] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const saveQueue = useRef<Promise<unknown>>(Promise.resolve());
  const [current, setCurrent] = useState<EpilepsyEntry>(newEntry());
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    let active = true;
    if (!localDraftEnabled) {
      setEntries([]);
      setStorageError(false);
      setAdding(false);
      setEntriesReady(true);
      return () => { active = false; };
    }

    setEntriesReady(false);
    void (async () => {
      const restored = sanitizeEntries(await secureGet<EpilepsyEntry[]>(STORAGE_KEY));
      if (!active) return;
      setEntries(restored);
      setEntriesReady(true);
    })();
    return () => { active = false; };
  }, [localDraftEnabled]);

  useEffect(() => {
    if (!entriesReady || !localDraftEnabled) return;
    const snapshot = sanitizeEntries(entries);
    const operation = saveQueue.current
      .catch(() => undefined)
      .then(() => secureSet(STORAGE_KEY, snapshot));
    saveQueue.current = operation.then(() => undefined, () => undefined);
    void operation.then((stored) => setStorageError(stored !== true));
  }, [entries, entriesReady, localDraftEnabled]);

  function saveEntry() {
    if (!localDraftEnabled || !current.type || !current.duration) return;
    setEntries((previous) => [current, ...previous].slice(0, MAX_ENTRIES));
    setCurrent(newEntry());
    setAdding(false);
  }

  function removeEntry(i: number) {
    setEntries((previous) => previous.filter((_, idx) => idx !== i));
  }

  function exportCSV() {
    const headers = ["Data", "Hora", "Tipo", "Duração", "Consciência", "Triggers", "Descrição", "Pós-ictal", "Medicação", "Notas"];
    const rows = entries.map(e => [
      e.date, e.time, e.type, e.duration, e.consciousness,
      e.triggers.join("; "), e.description, e.postIctal.join("; "),
      e.medication, e.notes,
    ]);
    const csv = [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `diario-epilepsia-${new Date().toISOString().slice(0, 10)}.csv`;
    a.rel = "noopener";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 2_000);
  }

  if (!entriesReady) {
    return (
      <div className="space-y-4" role="status" aria-live="polite">
        <div className="h-24 animate-pulse rounded-2xl bg-muted" />
        <div className="h-40 animate-pulse rounded-2xl bg-muted" />
        <span className="sr-only">Carregando diário de crises</span>
      </div>
    );
  }

  if (!localDraftEnabled) {
    return (
      <Card
        className="border-amber-300 bg-amber-50/80 dark:border-amber-900/60 dark:bg-amber-950/20"
        data-testid="epilepsy-diary-local-persistence-disabled"
      >
        <CardContent className="flex items-start gap-3 p-5 text-sm leading-6 text-amber-950 dark:text-amber-100">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-semibold">Diário local de crises bloqueado no modo clínico LIVE.</p>
            <p className="mt-1">
              A sessão remota não lê nem grava o histórico deste dispositivo. Registros locais preexistentes permanecem preservados e não são migrados automaticamente para o prontuário tenant-aware.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold">Diário de Crises Epilépticas</h1>
          <p className="text-xs text-muted-foreground">Rascunho local para acompanhamento de crises</p>
        </div>
      </div>

      <div className="rounded-xl bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800/40 p-4">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-violet-600 dark:text-violet-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-violet-800 dark:text-violet-300 leading-relaxed">
            Registre cada crise com detalhes. Este é um rascunho local cifrado e não integra o prontuário LIVE. Exporte o diário em CSV quando precisar levá-lo à consulta.
          </p>
        </div>
      </div>

      {storageError && (
        <div className="flex items-start gap-2 rounded-xl border border-red-300 bg-red-50 p-3 text-xs text-red-800 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200" role="alert">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>O rascunho está visível nesta tela, mas o cofre local não confirmou a gravação. Exporte o CSV antes de sair.</span>
        </div>
      )}

      <div className="flex gap-2">
        <Button onClick={() => setAdding(true)} className="gap-2" disabled={adding}>
          <Plus className="w-4 h-4" /> Nova Crise
        </Button>
        {entries.length > 0 && (
          <Button onClick={exportCSV} variant="outline" className="gap-2">
            <FileDown className="w-4 h-4" /> Exportar CSV
          </Button>
        )}
      </div>

      {adding && (
        <Card className="border-primary/30 shadow-md">
          <CardContent className="p-5 space-y-4">
            <h3 className="text-sm font-bold text-foreground">Registrar Nova Crise</h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="seizure-date" className="text-xs">Data</Label>
                <input id="seizure-date" type="date" value={current.date} onChange={(e) => setCurrent({ ...current, date: e.target.value })}
                  className="w-full text-sm rounded-lg border border-border bg-card px-3 py-2 text-foreground" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="seizure-time" className="text-xs">Hora</Label>
                <input id="seizure-time" type="time" value={current.time} onChange={(e) => setCurrent({ ...current, time: e.target.value })}
                  className="w-full text-sm rounded-lg border border-border bg-card px-3 py-2 text-foreground" />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="seizure-type" className="text-xs">Tipo de Crise</Label>
              <select id="seizure-type" value={current.type} onChange={(e) => setCurrent({ ...current, type: e.target.value })}
                className="w-full text-sm rounded-lg border border-border bg-card px-3 py-2 text-foreground">
                <option value="">Selecione...</option>
                {epilepsyTypes.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="seizure-duration" className="text-xs">Duração</Label>
                <select id="seizure-duration" value={current.duration} onChange={(e) => setCurrent({ ...current, duration: e.target.value })}
                  className="w-full text-sm rounded-lg border border-border bg-card px-3 py-2 text-foreground">
                  <option value="">Selecione...</option>
                  <option value="< 30 segundos">&lt; 30 segundos</option>
                  <option value="30s - 1 minuto">30s - 1 minuto</option>
                  <option value="1 - 2 minutos">1 - 2 minutos</option>
                  <option value="2 - 5 minutos">2 - 5 minutos</option>
                  <option value="> 5 minutos">&gt; 5 minutos</option>
                  <option value="Estado de mal epiléptico (>30min)">Estado de mal (&gt;30min)</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="seizure-consciousness" className="text-xs">Consciência</Label>
                <select id="seizure-consciousness" value={current.consciousness} onChange={(e) => setCurrent({ ...current, consciousness: e.target.value })}
                  className="w-full text-sm rounded-lg border border-border bg-card px-3 py-2 text-foreground">
                  <option value="">Selecione...</option>
                  <option value="Preservada">Preservada</option>
                  <option value="Alterada">Alterada</option>
                  <option value="Perda total">Perda total</option>
                  <option value="Não observada">Não observada</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Fatores Desencadeantes</Label>
              <div className="flex flex-wrap gap-2">
                {epilepsyTriggers.map((t) => (
                  <label key={t} className="flex items-center gap-1.5">
                    <Checkbox
                      checked={current.triggers.includes(t)}
                      onCheckedChange={(checked) => {
                        setCurrent({
                          ...current,
                          triggers: checked ? [...current.triggers, t] : current.triggers.filter((x) => x !== t),
                        });
                      }}
                    />
                    <span className="text-xs text-foreground">{t}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="seizure-description" className="text-xs">Descrição da crise (movimentos, comportamento)</Label>
              <textarea id="seizure-description" value={current.description} onChange={(e) => setCurrent({ ...current, description: e.target.value })}
                className="w-full text-sm rounded-lg border border-border bg-card px-3 py-2 text-foreground min-h-[60px]"
                placeholder="Descreva o que observou durante a crise..." />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Sintomas Pós-Ictais</Label>
              <div className="flex flex-wrap gap-2">
                {postIctalSymptoms.map((s) => (
                  <label key={s} className="flex items-center gap-1.5">
                    <Checkbox
                      checked={current.postIctal.includes(s)}
                      onCheckedChange={(checked) => {
                        setCurrent({
                          ...current,
                          postIctal: checked ? [...current.postIctal, s] : current.postIctal.filter((x) => x !== s),
                        });
                      }}
                    />
                    <span className="text-xs text-foreground">{s}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="seizure-medication" className="text-xs">Medicação em uso (e se tomou na hora correta)</Label>
              <input id="seizure-medication" type="text" value={current.medication} onChange={(e) => setCurrent({ ...current, medication: e.target.value })}
                className="w-full text-sm rounded-lg border border-border bg-card px-3 py-2 text-foreground"
                placeholder="Ex: Valproato 500mg 2x/dia — tomou corretamente" />
            </div>

            <div className="space-y-1">
              <Label htmlFor="seizure-notes" className="text-xs">Observações</Label>
              <textarea id="seizure-notes" value={current.notes} onChange={(e) => setCurrent({ ...current, notes: e.target.value })}
                className="w-full text-sm rounded-lg border border-border bg-card px-3 py-2 text-foreground min-h-[40px]"
                placeholder="Notas adicionais..." />
            </div>

            <div className="flex gap-2">
              <Button onClick={saveEntry} disabled={!current.type || !current.duration} className="flex-1">Salvar Rascunho</Button>
              <Button onClick={() => { setCurrent(newEntry()); setAdding(false); }} variant="outline">Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {entries.length === 0 && !adding && (
        <Card className="border-card-border">
          <CardContent className="p-8 text-center space-y-3">
            <Calendar className="w-10 h-10 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">Nenhuma crise registrada ainda.</p>
            <p className="text-xs text-muted-foreground">Clique em “Nova Crise” para começar o rascunho local.</p>
          </CardContent>
        </Card>
      )}

      {entries.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-foreground">Rascunhos ({entries.length})</h3>
          {entries.map((e, i) => (
            <Card key={`${e.date}-${e.time}-${i}`} className="border-card-border">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 text-xs">
                      {e.date} {e.time}
                    </Badge>
                    <Badge variant="outline" className="text-xs">{e.duration}</Badge>
                  </div>
                  <button onClick={() => removeEntry(i)} className="text-muted-foreground hover:text-red-500 transition-colors" aria-label={`Excluir crise de ${e.date} ${e.time}`}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm font-medium text-foreground">{e.type}</p>
                {e.consciousness && <p className="text-xs text-muted-foreground">Consciência: {e.consciousness}</p>}
                {e.description && <p className="text-xs text-muted-foreground">{e.description}</p>}
                {e.triggers.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {e.triggers.map((t) => <Badge key={t} variant="outline" className="text-xs">{t}</Badge>)}
                  </div>
                )}
                {e.postIctal.length > 0 && e.postIctal[0] !== "Nenhum" && (
                  <p className="text-xs text-muted-foreground">Pós-ictal: {e.postIctal.join(", ")}</p>
                )}
                {e.medication && <p className="text-xs text-muted-foreground">Medicação: {e.medication}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
