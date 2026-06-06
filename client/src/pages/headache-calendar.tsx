import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { BrainCog, Plus, Trash2, FileDown, Info, Calendar } from "lucide-react";
import {
  headacheTypes, headacheLocations, headacheTriggers,
  headacheSymptoms, headacheAuraTypes,
  type HeadacheEntry
} from "@/data/expandedScales";

function newEntry(): HeadacheEntry {
  const now = new Date();
  return {
    date: now.toISOString().slice(0, 10),
    intensity: 5,
    type: "",
    location: "",
    duration: "",
    aura: false,
    auraType: "",
    triggers: [],
    symptoms: [],
    medication: "",
    relief: "",
    notes: "",
  };
}

export default function HeadacheCalendarPage() {
  const [entries, setEntries] = useState<HeadacheEntry[]>([]);
  const [current, setCurrent] = useState<HeadacheEntry>(newEntry());
  const [adding, setAdding] = useState(false);

  function saveEntry() {
    if (!current.type) return;
    setEntries([current, ...entries]);
    setCurrent(newEntry());
    setAdding(false);
  }

  function removeEntry(i: number) {
    setEntries(entries.filter((_, idx) => idx !== i));
  }

  function exportCSV() {
    const headers = ["Data", "Intensidade", "Tipo", "Localização", "Duração", "Aura", "Tipo Aura", "Triggers", "Sintomas", "Medicação", "Alívio", "Notas"];
    const rows = entries.map(e => [
      e.date, e.intensity, e.type, e.location, e.duration,
      e.aura ? "Sim" : "Não", e.auraType,
      e.triggers.join("; "), e.symptoms.join("; "),
      e.medication, e.relief, e.notes,
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `calendario-cefaleia-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const intensityColor = (v: number) => v <= 3 ? "text-emerald-600" : v <= 6 ? "text-amber-600" : "text-red-600";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center shadow-sm">
          <BrainCog className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold">Calendário de Cefaleia</h1>
          <p className="text-xs text-muted-foreground">Registro diário de episódios de dor de cabeça</p>
        </div>
      </div>

      <div className="rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/40 p-4">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-rose-600 dark:text-rose-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-rose-800 dark:text-rose-300 leading-relaxed">
            Registre cada episódio de cefaleia com o máximo de detalhes. O diário é essencial para diagnóstico e acompanhamento de cefaleias na infância e adolescência.
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={() => setAdding(true)} className="gap-2" disabled={adding}>
          <Plus className="w-4 h-4" /> Novo Episódio
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
            <h3 className="text-sm font-bold text-foreground">Registrar Episódio de Cefaleia</h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Data</Label>
                <input type="date" value={current.date} onChange={(e) => setCurrent({ ...current, date: e.target.value })}
                  className="w-full text-sm rounded-lg border border-border bg-card px-3 py-2 text-foreground" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Duração</Label>
                <select value={current.duration} onChange={(e) => setCurrent({ ...current, duration: e.target.value })}
                  className="w-full text-sm rounded-lg border border-border bg-card px-3 py-2 text-foreground">
                  <option value="">Selecione...</option>
                  <option value="< 30 minutos">&lt; 30 minutos</option>
                  <option value="30min - 2 horas">30min - 2 horas</option>
                  <option value="2 - 4 horas">2 - 4 horas</option>
                  <option value="4 - 12 horas">4 - 12 horas</option>
                  <option value="12 - 24 horas">12 - 24 horas</option>
                  <option value="24 - 72 horas">24 - 72 horas</option>
                  <option value="> 72 horas">&gt; 72 horas</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Intensidade da Dor (EVA 0-10)</Label>
              <div className="flex items-center gap-4">
                <span className="text-xs text-muted-foreground">0</span>
                <Slider value={[current.intensity]} onValueChange={([v]) => setCurrent({ ...current, intensity: v })} max={10} step={1} className="flex-1" />
                <span className={`text-lg font-bold w-8 text-right ${intensityColor(current.intensity)}`}>{current.intensity}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Sem dor</span><span>Leve</span><span>Moderada</span><span>Forte</span><span>Insuportável</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Tipo de Cefaleia</Label>
                <select value={current.type} onChange={(e) => setCurrent({ ...current, type: e.target.value })}
                  className="w-full text-sm rounded-lg border border-border bg-card px-3 py-2 text-foreground">
                  <option value="">Selecione...</option>
                  {headacheTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Localização</Label>
                <select value={current.location} onChange={(e) => setCurrent({ ...current, location: e.target.value })}
                  className="w-full text-sm rounded-lg border border-border bg-card px-3 py-2 text-foreground">
                  <option value="">Selecione...</option>
                  {headacheLocations.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox checked={current.aura} onCheckedChange={(checked) => setCurrent({ ...current, aura: !!checked, auraType: checked ? current.auraType : "" })} />
                <Label className="text-xs">Presença de Aura</Label>
              </div>
              {current.aura && (
                <select value={current.auraType} onChange={(e) => setCurrent({ ...current, auraType: e.target.value })}
                  className="w-full text-sm rounded-lg border border-border bg-card px-3 py-2 text-foreground">
                  <option value="">Tipo de aura...</option>
                  {headacheAuraTypes.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Fatores Desencadeantes</Label>
              <div className="flex flex-wrap gap-2">
                {headacheTriggers.map((t) => (
                  <label key={t} className="flex items-center gap-1.5">
                    <Checkbox
                      checked={current.triggers.includes(t)}
                      onCheckedChange={(checked) => setCurrent({
                        ...current,
                        triggers: checked ? [...current.triggers, t] : current.triggers.filter((x) => x !== t),
                      })}
                    />
                    <span className="text-xs text-foreground">{t}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Sintomas Associados</Label>
              <div className="flex flex-wrap gap-2">
                {headacheSymptoms.map((s) => (
                  <label key={s} className="flex items-center gap-1.5">
                    <Checkbox
                      checked={current.symptoms.includes(s)}
                      onCheckedChange={(checked) => setCurrent({
                        ...current,
                        symptoms: checked ? [...current.symptoms, s] : current.symptoms.filter((x) => x !== s),
                      })}
                    />
                    <span className="text-xs text-foreground">{s}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Medicação utilizada</Label>
                <input type="text" value={current.medication} onChange={(e) => setCurrent({ ...current, medication: e.target.value })}
                  className="w-full text-sm rounded-lg border border-border bg-card px-3 py-2 text-foreground"
                  placeholder="Ex: Ibuprofeno 400mg" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Alívio com medicação</Label>
                <select value={current.relief} onChange={(e) => setCurrent({ ...current, relief: e.target.value })}
                  className="w-full text-sm rounded-lg border border-border bg-card px-3 py-2 text-foreground">
                  <option value="">Selecione...</option>
                  <option value="Alívio total">Alívio total</option>
                  <option value="Alívio parcial">Alívio parcial</option>
                  <option value="Sem alívio">Sem alívio</option>
                  <option value="Não tomou medicação">Não tomou</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Observações</Label>
              <textarea value={current.notes} onChange={(e) => setCurrent({ ...current, notes: e.target.value })}
                className="w-full text-sm rounded-lg border border-border bg-card px-3 py-2 text-foreground min-h-[40px]"
                placeholder="Notas adicionais..." />
            </div>

            <div className="flex gap-2">
              <Button onClick={saveEntry} disabled={!current.type} className="flex-1">Salvar Registro</Button>
              <Button onClick={() => { setCurrent(newEntry()); setAdding(false); }} variant="outline">Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {entries.length === 0 && !adding && (
        <Card className="border-card-border">
          <CardContent className="p-8 text-center space-y-3">
            <Calendar className="w-10 h-10 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">Nenhum episódio registrado ainda.</p>
            <p className="text-xs text-muted-foreground">Clique em “Novo Episódio” para começar o registro.</p>
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
                    <Badge className="bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 text-xs">{e.date}</Badge>
                    <Badge variant="outline" className={`text-xs font-bold ${intensityColor(e.intensity)}`}>EVA {e.intensity}/10</Badge>
                    {e.duration && <Badge variant="outline" className="text-xs">{e.duration}</Badge>}
                  </div>
                  <button onClick={() => removeEntry(i)} className="text-muted-foreground hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm font-medium text-foreground">{e.type}</p>
                {e.location && <p className="text-xs text-muted-foreground">Local: {e.location}</p>}
                {e.aura && <p className="text-xs text-muted-foreground">Aura: {e.auraType || "Presente"}</p>}
                {e.symptoms.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {e.symptoms.map((s) => <Badge key={s} variant="outline" className="text-xs">{s}</Badge>)}
                  </div>
                )}
                {e.triggers.length > 0 && (
                  <p className="text-xs text-muted-foreground">Triggers: {e.triggers.join(", ")}</p>
                )}
                {e.medication && <p className="text-xs text-muted-foreground">Medicação: {e.medication} — {e.relief}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
