import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Zap, Plus, Trash2, FileDown, Info, Calendar } from "lucide-react";
import {
  epilepsyTypes, epilepsyTriggers, postIctalSymptoms,
  type EpilepsyEntry
} from "@/data/expandedScales";

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

export default function EpilepsyDiaryPage() {
  const [entries, setEntries] = useState<EpilepsyEntry[]>([]);
  const [current, setCurrent] = useState<EpilepsyEntry>(newEntry());
  const [adding, setAdding] = useState(false);

  function saveEntry() {
    if (!current.type || !current.duration) return;
    setEntries([current, ...entries]);
    setCurrent(newEntry());
    setAdding(false);
  }

  function removeEntry(i: number) {
    setEntries(entries.filter((_, idx) => idx !== i));
  }

  function exportCSV() {
    const headers = ["Data", "Hora", "Tipo", "Duração", "Consciência", "Triggers", "Descrição", "Pós-ictal", "Medicação", "Notas"];
    const rows = entries.map(e => [
      e.date, e.time, e.type, e.duration, e.consciousness,
      e.triggers.join("; "), e.description, e.postIctal.join("; "),
      e.medication, e.notes,
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `diario-epilepsia-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold">Diário de Crises Epilépticas</h1>
          <p className="text-xs text-muted-foreground">Registro e acompanhamento de crises</p>
        </div>
      </div>

      <div className="rounded-xl bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800/40 p-4">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-violet-600 dark:text-violet-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-violet-800 dark:text-violet-300 leading-relaxed">
            Registre cada crise epiléptica com detalhes. Os dados ajudam o neurologista a ajustar o tratamento. Você pode exportar o diário em CSV para levar à consulta.
          </p>
        </div>
      </div>

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
                <Label className="text-xs">Data</Label>
                <input type="date" value={current.date} onChange={(e) => setCurrent({ ...current, date: e.target.value })}
                  className="w-full text-sm rounded-lg border border-border bg-card px-3 py-2 text-foreground" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Hora</Label>
                <input type="time" value={current.time} onChange={(e) => setCurrent({ ...current, time: e.target.value })}
                  className="w-full text-sm rounded-lg border border-border bg-card px-3 py-2 text-foreground" />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Tipo de Crise</Label>
              <select value={current.type} onChange={(e) => setCurrent({ ...current, type: e.target.value })}
                className="w-full text-sm rounded-lg border border-border bg-card px-3 py-2 text-foreground">
                <option value="">Selecione...</option>
                {epilepsyTypes.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Duração</Label>
                <select value={current.duration} onChange={(e) => setCurrent({ ...current, duration: e.target.value })}
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
                <Label className="text-xs">Consciência</Label>
                <select value={current.consciousness} onChange={(e) => setCurrent({ ...current, consciousness: e.target.value })}
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
              <Label className="text-xs">Descrição da crise (movimentos, comportamento)</Label>
              <textarea value={current.description} onChange={(e) => setCurrent({ ...current, description: e.target.value })}
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
              <Label className="text-xs">Medicação em uso (e se tomou na hora correta)</Label>
              <input type="text" value={current.medication} onChange={(e) => setCurrent({ ...current, medication: e.target.value })}
                className="w-full text-sm rounded-lg border border-border bg-card px-3 py-2 text-foreground"
                placeholder="Ex: Valproato 500mg 2x/dia — tomou corretamente" />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Observações</Label>
              <textarea value={current.notes} onChange={(e) => setCurrent({ ...current, notes: e.target.value })}
                className="w-full text-sm rounded-lg border border-border bg-card px-3 py-2 text-foreground min-h-[40px]"
                placeholder="Notas adicionais..." />
            </div>

            <div className="flex gap-2">
              <Button onClick={saveEntry} disabled={!current.type || !current.duration} className="flex-1">Salvar Registro</Button>
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
            <p className="text-xs text-muted-foreground">Clique em &quot;Nova Crise&quot; para começar o registro.</p>
          </CardContent>
        </Card>
      )}

      {entries.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-foreground">Registros ({entries.length})</h3>
          {entries.map((e, i) => (
            <Card key={i} className="border-card-border">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 text-xs">
                      {e.date} {e.time}
                    </Badge>
                    <Badge variant="outline" className="text-xs">{e.duration}</Badge>
                  </div>
                  <button onClick={() => removeEntry(i)} className="text-muted-foreground hover:text-red-500 transition-colors">
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
