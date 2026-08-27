import { useCallback, useEffect, useMemo, useState } from "react";
import { BrainCog, Cloud, Plus, Search, ShieldCheck, Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useClinic } from "@/contexts/ClinicContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

interface Patient { id: string; name: string }
interface MemoryNote {
  id: string;
  patientId: string | null;
  title: string;
  content: string;
  category: string | null;
  source: string | null;
  tags: string[];
  updatedAt: string;
  revision?: number;
  kind?: "operational" | "clinical";
}

function extractList(body: unknown): unknown[] {
  if (Array.isArray(body)) return body;
  if (body && typeof body === "object") {
    const value = body as { data?: unknown; items?: unknown[] };
    if (Array.isArray(value.items)) return value.items;
    if (Array.isArray(value.data)) return value.data;
  }
  return [];
}

function requestId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `memory-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function MemoriaClinicaPage() {
  const { toast } = useToast();
  const { accessMode, isAuthenticated } = useAuth();
  const { activeClinicId, activeClinic } = useClinic();
  const isRemote = accessMode === "remote" && isAuthenticated && Boolean(activeClinicId);
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
  const [kind, setKind] = useState<"operational" | "clinical">("clinical");
  const [scope, setScope] = useState<"patient" | "clinic">("patient");
  const [syncState, setSyncState] = useState<"cloud" | "backend" | "unavailable">(isRemote ? "cloud" : "backend");

  useEffect(() => {
    const endpoint = isRemote
      ? `/api/live/patients?clinicId=${encodeURIComponent(activeClinicId ?? "")}`
      : "/api/patients?limit=200";
    void apiRequest("GET", endpoint)
      .then((response) => response.json())
      .then((body) => {
        const list = extractList(body);
        setPatients(list.filter((item: unknown): item is Patient => !!item && typeof item === "object" && typeof (item as Patient).id === "string"));
      })
      .catch(() => toast({ title: "Não foi possível carregar os pacientes", description: isRemote ? "Verifique a clínica ativa e a conexão segura." : undefined, variant: "destructive" }));
  }, [activeClinicId, isRemote, toast]);

  const loadNotes = useCallback(async (selected: string, searchTerm = "") => {
    if ((!selected && scope === "patient") || (isRemote && !activeClinicId)) { setNotes([]); return; }
    setLoading(true);
    try {
      const encodedSearch = searchTerm.trim() ? `&q=${encodeURIComponent(searchTerm.trim())}` : "";
      const endpoint = isRemote
        ? `/api/live/memory?clinicId=${encodeURIComponent(activeClinicId ?? "")}&scope=${encodeURIComponent(scope)}&kind=${encodeURIComponent(kind)}${selected ? `&patientId=${encodeURIComponent(selected)}` : ""}${encodedSearch}`
        : `/api/memory?patient_id=${encodeURIComponent(selected)}${encodedSearch}`;
      const response = await apiRequest("GET", endpoint);
      const body = await response.json();
      setNotes(extractList(body) as MemoryNote[]);
      setSyncState(isRemote ? "cloud" : "backend");
    } catch {
      setSyncState("unavailable");
      toast({ title: "Memória indisponível", description: isRemote ? "O backend não confirmou a leitura em nuvem." : "O backend não confirmou a leitura.", variant: "destructive" });
    } finally { setLoading(false); }
  }, [activeClinicId, isRemote, kind, scope, toast]);

  useEffect(() => { void loadNotes(patientId); }, [loadNotes, patientId, scope]);

  async function saveNote(event: React.FormEvent) {
    event.preventDefault();
    if ((!patientId && scope === "patient") || !title.trim() || !content.trim() || (isRemote && !activeClinicId)) return;
    setSaving(true);
    try {
      const payload = isRemote
        ? {
            clinicId: activeClinicId,
            scope,
            kind,
            ...(patientId ? { patientId } : {}),
            title: title.trim(),
            content: content.trim(),
            category,
            source: "clinic_panel",
            tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean),
            clientRequestId: requestId(),
          }
        : {
            patientId, title: title.trim(), content: content.trim(), category,
            source: "registro_clinico", tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean),
          };
      await apiRequest("POST", isRemote ? "/api/live/memory" : "/api/memory", payload);
      setTitle(""); setContent(""); setTags("");
      await loadNotes(patientId, query);
      setSyncState(isRemote ? "cloud" : "backend");
      toast({ title: "Informação memorizada", description: isRemote ? `Persistida na nuvem da clínica ${activeClinic?.name ?? "ativa"}.` : "A gravação foi confirmada pelo backend." });
    } catch {
      setSyncState("unavailable");
      toast({ title: "A informação não foi salva", description: "Nenhuma confirmação de persistência foi recebida.", variant: "destructive" });
    } finally { setSaving(false); }
  }

  async function deleteNote(note: MemoryNote) {
    if (!window.confirm("Arquivar esta memória? Ela deixará de aparecer na lista, mas permanecerá auditada.")) return;
    try {
      if (isRemote) {
        if (!activeClinicId || !note.revision) throw new Error("Versão da memória ausente.");
        await apiRequest("DELETE", `/api/live/memory/${encodeURIComponent(note.id)}?clinicId=${encodeURIComponent(activeClinicId)}&revision=${note.revision}`);
      } else {
        await apiRequest("DELETE", `/api/memory/${encodeURIComponent(note.id)}`);
      }
      setNotes((current) => current.filter((item) => item.id !== note.id));
      toast({ title: isRemote ? "Memória arquivada na nuvem" : "Memória excluída" });
    } catch { toast({ title: "Não foi possível arquivar", description: "A versão pode ter sido alterada por outra pessoa.", variant: "destructive" }); }
  }

  const patientName = useMemo(() => patients.find((patient) => patient.id === patientId)?.name, [patientId, patients]);
  const syncLabel = syncState === "cloud" ? "Persistência confirmada na nuvem" : syncState === "backend" ? "Persistência confirmada no backend" : "Sincronização indisponível";

  return <div className="mx-auto max-w-6xl space-y-6 pb-12">
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-primary/10 p-3 text-primary"><BrainCog className="h-6 w-6" /></div>
        <div><h1 className="text-2xl font-bold">Memória da clínica</h1><p className="text-sm text-muted-foreground">Informações persistentes, pesquisáveis e vinculadas ao paciente.</p></div>
      </div>
      <Badge variant={syncState === "unavailable" ? "destructive" : "outline"} className="gap-1.5 whitespace-nowrap"><Cloud className="h-3.5 w-3.5" />{syncLabel}</Badge>
    </div>
    {isRemote && <div className="flex gap-2 rounded-2xl border border-primary/20 bg-primary/[0.06] p-3 text-sm"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><p>Clínica ativa: <strong>{activeClinic?.name ?? activeClinicId}</strong>. Secretarias podem registrar memórias operacionais; memórias clínicas permanecem limitadas aos perfis clínicos autorizados.</p></div>}
    <Card><CardContent className="grid gap-4 pt-6 md:grid-cols-[0.8fr_1fr_0.8fr]"><div><Label htmlFor="memory-scope">Escopo</Label><select id="memory-scope" className="mt-2 h-10 w-full rounded-md border bg-background px-3 text-sm" value={scope} onChange={(event) => { const next = event.target.value as "patient" | "clinic"; setScope(next); if (next === "clinic") setPatientId(""); }} disabled={!isRemote}><option value="patient">Paciente</option><option value="clinic">Toda a clínica</option></select></div><div className={scope === "clinic" ? "opacity-60" : ""}><Label htmlFor="memory-patient">Paciente</Label><select id="memory-patient" className="mt-2 h-10 w-full rounded-md border bg-background px-3 text-sm" value={patientId} onChange={(event) => setPatientId(event.target.value)} disabled={scope === "clinic"}><option value="">{scope === "clinic" ? "Memória da clínica" : "Selecione um paciente"}</option>{patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.name}</option>)}</select></div><div><Label htmlFor="memory-kind">Tipo de memória</Label><select id="memory-kind" className="mt-2 h-10 w-full rounded-md border bg-background px-3 text-sm" value={kind} onChange={(event) => setKind(event.target.value as "operational" | "clinical")}><option value="clinical">Clínica — acesso profissional</option><option value="operational">Operacional — compartilhada com secretaria</option></select></div></CardContent></Card>
    {(patientId || (isRemote && scope === "clinic")) && <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <Card><CardHeader><CardTitle className="text-base">Nova informação · {scope === "clinic" ? activeClinic?.name ?? "clínica ativa" : patientName}</CardTitle></CardHeader><CardContent><form className="space-y-4" onSubmit={saveNote}>
        <div><Label htmlFor="memory-title">Título</Label><Input id="memory-title" maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} required /></div>
        <div><Label htmlFor="memory-content">Informação</Label><Textarea id="memory-content" className="min-h-36" minLength={20} maxLength={20000} value={content} onChange={(e) => setContent(e.target.value)} required /><p className="mt-1 text-xs text-muted-foreground">Mínimo de 20 caracteres para que a informação seja útil e auditável.</p></div>
        <div><Label htmlFor="memory-category">Categoria</Label><select id="memory-category" className="mt-2 h-10 w-full rounded-md border bg-background px-3 text-sm" value={category} onChange={(e) => setCategory(e.target.value)}><option value="evolucao">Evolução</option><option value="conduta">Conduta</option><option value="familia">Família</option><option value="escola">Escola</option><option value="terapias">Terapias</option><option value="farmacologia">Farmacologia</option><option value="secretaria">Secretaria</option></select></div>
        <div><Label htmlFor="memory-tags">Marcadores, separados por vírgula</Label><Input id="memory-tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="sono, escola, retorno" /></div>
        <Button type="submit" disabled={saving || !title.trim() || !content.trim() || (scope === "patient" && !patientId)}><Plus className="mr-2 h-4 w-4" />{saving ? "Sincronizando…" : isRemote ? "Salvar na nuvem" : "Memorizar"}</Button>
      </form></CardContent></Card>
      <Card><CardHeader><CardTitle className="text-base">Histórico memorizado</CardTitle></CardHeader><CardContent className="space-y-4">
        <div className="flex gap-2"><Input aria-label="Pesquisar memória" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void loadNotes(patientId, query); }} placeholder="Pesquisar no histórico…" /><Button variant="outline" aria-label="Pesquisar memória" onClick={() => void loadNotes(patientId, query)}><Search className="h-4 w-4" /></Button></div>
        {loading ? <p className="text-sm text-muted-foreground">Carregando memória confirmada…</p> : notes.length === 0 ? <p className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">Nenhuma informação encontrada.</p> : notes.map((note) => <article key={note.id} className="rounded-2xl border p-4">
          <div className="flex items-start justify-between gap-3"><div><h2 className="font-semibold">{note.title}</h2><p className="text-xs text-muted-foreground">{new Date(note.updatedAt).toLocaleString("pt-BR")} · {note.kind === "operational" ? "operacional" : "clínica"}</p></div><Button size="icon" variant="ghost" aria-label="Arquivar memória" onClick={() => void deleteNote(note)}><Trash2 className="h-4 w-4" /></Button></div>
          <p className="mt-3 whitespace-pre-wrap text-sm">{note.content}</p><div className="mt-3 flex flex-wrap gap-1">{note.category && <Badge variant="secondary">{note.category}</Badge>}{note.tags.map((tag) => <Badge key={tag} variant="outline">{tag}</Badge>)}</div>
        </article>)}
      </CardContent></Card>
    </div>}
  </div>;
}
