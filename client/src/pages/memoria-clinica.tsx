import { useCallback, useEffect, useMemo, useState } from "react";
import { BrainCog, Plus, Search, Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

interface Patient { id: string; name: string }
interface MemoryNote {
  id: string; patientId: string | null; title: string; content: string;
  category: string | null; source: string | null; tags: string[]; updatedAt: string;
}

export default function MemoriaClinicaPage() {
  const { toast } = useToast();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientId, setPatientId] = useState("");
  const [notes, setNotes] = useState<MemoryNote[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("evolucao");
  const [tags, setTags] = useState("");

  useEffect(() => {
    void apiRequest("GET", "/api/patients?limit=200").then((response) => response.json()).then((body) => {
      const list = Array.isArray(body) ? body : Array.isArray(body.data) ? body.data : [];
      setPatients(list.filter((item: unknown): item is Patient => !!item && typeof item === "object" && typeof (item as Patient).id === "string"));
    }).catch(() => toast({ title: "Não foi possível carregar os pacientes", variant: "destructive" }));
  }, [toast]);

  const loadNotes = useCallback(async (selected: string, searchTerm = "") => {
    if (!selected) { setNotes([]); return; }
    setLoading(true);
    try {
      const suffix = searchTerm.trim() ? `&q=${encodeURIComponent(searchTerm.trim())}` : "";
      const response = await apiRequest("GET", `/api/memory?patient_id=${encodeURIComponent(selected)}${suffix}`);
      const body = await response.json();
      setNotes(Array.isArray(body.data) ? body.data : []);
    } catch {
      toast({ title: "Memória clínica indisponível", description: "O backend não confirmou a leitura.", variant: "destructive" });
    } finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { void loadNotes(patientId); }, [loadNotes, patientId]);

  async function saveNote(event: React.FormEvent) {
    event.preventDefault();
    if (!patientId || !title.trim() || !content.trim()) return;
    setSaving(true);
    try {
      await apiRequest("POST", "/api/memory", {
        patientId, title: title.trim(), content: content.trim(), category,
        source: "registro_clinico", tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean),
      });
      setTitle(""); setContent(""); setTags("");
      await loadNotes(patientId);
      toast({ title: "Informação memorizada", description: "A gravação foi confirmada pelo backend." });
    } catch {
      toast({ title: "A informação não foi salva", description: "Nenhuma confirmação de persistência foi recebida.", variant: "destructive" });
    } finally { setSaving(false); }
  }

  async function deleteNote(id: string) {
    if (!window.confirm("Excluir permanentemente esta memória clínica?")) return;
    try {
      await apiRequest("DELETE", `/api/memory/${encodeURIComponent(id)}`);
      setNotes((current) => current.filter((note) => note.id !== id));
      toast({ title: "Memória excluída" });
    } catch { toast({ title: "Não foi possível excluir", variant: "destructive" }); }
  }

  const patientName = useMemo(() => patients.find((patient) => patient.id === patientId)?.name, [patientId, patients]);

  return <div className="mx-auto max-w-6xl space-y-6 pb-12">
    <div className="flex items-center gap-3">
      <div className="rounded-2xl bg-primary/10 p-3 text-primary"><BrainCog className="h-6 w-6" /></div>
      <div><h1 className="text-2xl font-bold">Memória clínica</h1><p className="text-sm text-muted-foreground">Informações persistentes, pesquisáveis e vinculadas ao prontuário.</p></div>
    </div>
    <Card><CardContent className="pt-6">
      <Label htmlFor="memory-patient">Paciente</Label>
      <select id="memory-patient" className="mt-2 h-10 w-full rounded-md border bg-background px-3 text-sm" value={patientId}
        onChange={(event) => setPatientId(event.target.value)}>
        <option value="">Selecione um paciente</option>
        {patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.name}</option>)}
      </select>
    </CardContent></Card>
    {patientId && <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <Card><CardHeader><CardTitle className="text-base">Nova informação · {patientName}</CardTitle></CardHeader><CardContent>
        <form className="space-y-4" onSubmit={saveNote}>
          <div><Label htmlFor="memory-title">Título</Label><Input id="memory-title" maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} required /></div>
          <div><Label htmlFor="memory-content">Informação</Label><Textarea id="memory-content" className="min-h-36" maxLength={20000} value={content} onChange={(e) => setContent(e.target.value)} required /></div>
          <div><Label htmlFor="memory-category">Categoria</Label><select id="memory-category" className="mt-2 h-10 w-full rounded-md border bg-background px-3 text-sm" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="evolucao">Evolução</option><option value="conduta">Conduta</option><option value="familia">Família</option><option value="escola">Escola</option><option value="terapias">Terapias</option><option value="farmacologia">Farmacologia</option>
          </select></div>
          <div><Label htmlFor="memory-tags">Marcadores, separados por vírgula</Label><Input id="memory-tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="sono, escola, retorno" /></div>
          <Button type="submit" disabled={saving || !title.trim() || !content.trim()}><Plus className="mr-2 h-4 w-4" />{saving ? "Salvando…" : "Memorizar"}</Button>
        </form>
      </CardContent></Card>
      <Card><CardHeader><CardTitle className="text-base">Histórico memorizado</CardTitle></CardHeader><CardContent className="space-y-4">
        <div className="flex gap-2"><Input aria-label="Pesquisar memória" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void loadNotes(patientId, query); }} placeholder="Pesquisar no histórico…" /><Button type="button" variant="outline" aria-label="Pesquisar memória clínica" onClick={() => void loadNotes(patientId, query)}><Search className="h-4 w-4" aria-hidden="true" /></Button></div>
        {loading ? <p className="text-sm text-muted-foreground">Carregando…</p> : notes.length === 0 ? <p className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">Nenhuma informação encontrada.</p> : notes.map((note) => <article key={note.id} className="rounded-2xl border p-4">
          <div className="flex items-start justify-between gap-3"><div><h2 className="font-semibold">{note.title}</h2><p className="text-xs text-muted-foreground">{new Date(note.updatedAt).toLocaleString("pt-BR")}</p></div><Button size="icon" variant="ghost" aria-label="Excluir memória" onClick={() => void deleteNote(note.id)}><Trash2 className="h-4 w-4" /></Button></div>
          <p className="mt-3 whitespace-pre-wrap text-sm">{note.content}</p>
          <div className="mt-3 flex flex-wrap gap-1">{note.category && <Badge variant="secondary">{note.category}</Badge>}{note.tags.map((tag) => <Badge key={tag} variant="outline">{tag}</Badge>)}</div>
        </article>)}
      </CardContent></Card>
    </div>}
  </div>;
}
