import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { verifyPin } from "@/lib/pinAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Users, Plus, Search, X, Pencil, Trash2, ArrowRight, Calendar, Lock,
} from "lucide-react";
import { differenceInYears, parseISO } from "date-fns";

function calcAge(birthDate: string | null | undefined): string | null {
  if (!birthDate) return null;
  try {
    const years = differenceInYears(new Date(), parseISO(birthDate));
    return `${years} ano${years !== 1 ? "s" : ""}`;
  } catch {
    return null;
  }
}

export default function PacientesPage() {
  const [internalAuth, setInternalAuth] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);
  const [pinChecking, setPinChecking] = useState(false);

  async function handlePinSubmit() {
    if (!pin) return;
    setPinChecking(true);
    const ok = await verifyPin(pin);
    setPinChecking(false);
    if (ok) {
      setInternalAuth(true);
    } else {
      setPinError(true);
      setTimeout(() => setPinError(false), 3000);
    }
  }

  if (!internalAuth) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center">
          <Lock className="w-8 h-8 text-white" />
        </div>
        <div className="text-center space-y-1">
          <h2 className="text-lg font-bold text-foreground">Área Restrita</h2>
          <p className="text-xs text-muted-foreground">Acesso exclusivo do Dr. Jadson</p>
        </div>
        <div className="w-full max-w-xs space-y-3">
          <Input
            type="password"
            placeholder="PIN de acesso..."
            value={pin}
            onChange={(e) => { setPin(e.target.value); setPinError(false); }}
            onKeyDown={(e) => { if (e.key === "Enter") handlePinSubmit(); }}
            className={`text-center h-12 text-lg ${pinError ? "border-red-400" : ""}`}
            data-testid="input-pin-pacientes"
          />
          {pinError && (
            <p className="text-xs text-red-500 text-center">PIN incorreto. Tente novamente.</p>
          )}
          <Button
            className="w-full"
            onClick={handlePinSubmit}
            disabled={!pin || pinChecking}
            data-testid="button-acessar-prontuarios"
          >
            {pinChecking ? "Verificando..." : "Acessar Prontuários"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground text-center max-w-xs">
          Dados protegidos localmente. Modo demonstração — não inserir dados reais de pacientes.
        </p>
      </div>
    );
  }

  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formBirth, setFormBirth] = useState("");
  const [formNotes, setFormNotes] = useState("");

  const { data: patients = [] } = useQuery<any[]>({
    queryKey: ["/api/patients"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/patients", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      resetForm();
      toast({ title: "Paciente criado!" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiRequest("PATCH", `/api/patients/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      resetForm();
      toast({ title: "Paciente atualizado!" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/patients/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      toast({ title: "Paciente removido." });
    },
  });

  function resetForm() {
    setFormName("");
    setFormBirth("");
    setFormNotes("");
    setEditId(null);
    setDialogOpen(false);
  }

  function openEdit(p: any) {
    setEditId(p.id);
    setFormName(p.name);
    setFormBirth(p.birthDate || "");
    setFormNotes(p.notes || "");
    setDialogOpen(true);
  }

  function handleSubmit() {
    const data: any = { name: formName.trim() };
    if (formBirth) data.birthDate = formBirth;
    if (formNotes.trim()) data.notes = formNotes.trim();

    if (editId) {
      updateMutation.mutate({ id: editId, data });
    } else {
      createMutation.mutate(data);
    }
  }

  const q = search.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const filtered = q
    ? patients.filter((p: any) =>
        (p.name || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(q)
      )
    : patients;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center shadow-sm">
          <Users className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-bold">Meus Pacientes</h1>
          <p className="text-xs text-muted-foreground">Cadastre e acompanhe seus pacientes</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setDialogOpen(open); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5" data-testid="button-new-patient">
              <Plus className="w-3.5 h-3.5" /> Novo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editId ? "Editar Paciente" : "Novo Paciente"}</DialogTitle>
              <DialogDescription>
                {editId ? "Atualize os dados do paciente." : "Preencha os dados para cadastrar."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <Input
                placeholder="Nome completo *"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                data-testid="input-patient-name"
              />
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Data de nascimento</label>
                <Input
                  type="date"
                  value={formBirth}
                  onChange={(e) => setFormBirth(e.target.value)}
                  data-testid="input-patient-birth"
                />
              </div>
              <Textarea
                placeholder="Observações (opcional)"
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                rows={3}
                data-testid="input-patient-notes"
              />
            </div>
            <DialogFooter>
              <Button
                onClick={handleSubmit}
                disabled={!formName.trim() || createMutation.isPending || updateMutation.isPending}
                className="w-full"
                data-testid="button-save-patient"
              >
                {createMutation.isPending || updateMutation.isPending ? "Salvando..." : editId ? "Atualizar" : "Cadastrar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar paciente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 pr-10 h-10 rounded-xl"
          data-testid="input-search-patients"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Patient list */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 space-y-3">
          <Users className="w-10 h-10 mx-auto text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            {patients.length === 0 ? "Nenhum paciente cadastrado." : "Nenhum resultado encontrado."}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((p: any) => {
            const age = calcAge(p.birthDate);
            return (
              <Card key={p.id} className="border-card-border group hover:shadow-md transition-shadow">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <Link href={`/paciente/${p.id}`}>
                      <div className="cursor-pointer flex-1">
                        <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{p.name}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          {age && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> {age}
                            </span>
                          )}
                        </div>
                        {p.notes && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.notes}</p>}
                      </div>
                    </Link>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(p)} data-testid={`button-edit-${p.id}`}>
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        onClick={() => deleteMutation.mutate(p.id)}
                        data-testid={`button-delete-${p.id}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <Link href={`/paciente/${p.id}`}>
                    <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs mt-1">
                      Ver detalhes <ArrowRight className="w-3 h-3" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
