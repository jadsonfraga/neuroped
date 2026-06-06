import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Users, Plus, Search, X, Pencil, Trash2, ArrowRight, Calendar,
} from "lucide-react";
import { differenceInYears, parseISO } from "date-fns";
import { softTap, softTick, softSuccess, softError } from "@/lib/softSounds";
import { haptic } from "@/lib/haptic";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState, LoadingState } from "@/components/ui/VisualStates";
import { easing, duration } from "@/lib/motion";
import { PinGate } from "@/components/PinGate";

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
  // Todos os hooks são chamados de forma incondicional (regra rules-of-hooks).
  // O portão de PIN é um componente isolado (PinGate); enquanto não autenticado,
  // as queries ficam desabilitadas (enabled: internalAuth) para não buscar dados.
  const [internalAuth, setInternalAuth] = useState(false);
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formBirth, setFormBirth] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [confirmingDelete, setConfirmingDelete] = useState<{ id: string; name: string } | null>(null);

  const { data: patients = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/patients"],
    enabled: internalAuth,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/patients", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      resetForm();
      softSuccess();
      haptic.success();
      toast({ title: "Paciente criado!" });
    },
    onError: () => {
      softError();
      haptic.error();
      toast({ title: "Erro ao criar paciente.", variant: "destructive" });
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
      softSuccess();
      haptic.success();
      toast({ title: "Paciente atualizado!" });
    },
    onError: () => {
      softError();
      haptic.error();
      toast({ title: "Erro ao atualizar paciente.", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/patients/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      softSuccess();
      haptic.success();
      toast({ title: "Paciente removido." });
      setConfirmingDelete(null);
    },
    onError: () => {
      softError();
      haptic.error();
      toast({ title: "Erro ao remover paciente.", variant: "destructive" });
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

  if (!internalAuth) {
    return (
      <PinGate
        onUnlock={() => setInternalAuth(true)}
        inputTestId="input-pin-pacientes"
        buttonTestId="button-acessar-prontuarios"
        buttonClassName="w-full btn-glow"
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: duration.normal, ease: easing.smooth }}
        className="flex items-center gap-3"
      >
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center shadow-md">
          <Users className="w-5 h-5 text-white" strokeWidth={1.75} />
        </div>
        <div className="flex-1">
          <h1
            className="text-xl text-foreground leading-tight"
            style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
          >
            Meus Pacientes
          </h1>
          <p className="text-xs text-muted-foreground italic">Cadastre e acompanhe seus pacientes</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setDialogOpen(open); }}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              onClick={() => { softTap(); haptic.tap(); }}
              className="gap-1.5 btn-glow"
              data-testid="button-new-patient"
            >
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
                onClick={() => { softTap(); haptic.tap(); handleSubmit(); }}
                disabled={!formName.trim() || createMutation.isPending || updateMutation.isPending}
                className="w-full"
                data-testid="button-save-patient"
              >
                {createMutation.isPending || updateMutation.isPending ? "Salvando..." : editId ? "Atualizar" : "Cadastrar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>

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
      {isLoading ? (
        <LoadingState rows={4} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Users className="w-7 h-7 text-muted-foreground" />}
          title={patients.length === 0 ? "Nenhum paciente cadastrado" : "Nenhum resultado encontrado"}
          description={
            patients.length === 0
              ? "Cadastre o primeiro paciente para começar o acompanhamento."
              : "Tente outro termo de busca."
          }
          action={
            patients.length === 0
              ? {
                  label: "Cadastrar paciente",
                  onClick: () => {
                    softTap();
                    haptic.tap();
                    setDialogOpen(true);
                  },
                }
              : undefined
          }
        />
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
          }}
          className="grid gap-3 sm:grid-cols-2"
        >
          {filtered.map((p: any) => {
            const age = calcAge(p.birthDate);
            return (
              <motion.div
                key={p.id}
                variants={{
                  hidden: { opacity: 0, y: 10 },
                  visible: { opacity: 1, y: 0, transition: { duration: duration.normal, ease: easing.smooth } },
                }}
              >
                <Card className="card-premium group">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <Link href={`/paciente/${p.id}`}>
                        <div className="cursor-pointer flex-1" onClick={() => { softTap(); haptic.tap(); }}>
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
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => { softTick(); haptic.tap(); openEdit(p); }}
                          data-testid={`button-edit-${p.id}`}
                        >
                          <Pencil className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          onClick={() => {
                            softTap();
                            haptic.warning();
                            setConfirmingDelete({ id: p.id, name: p.name });
                          }}
                          data-testid={`button-delete-${p.id}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <Link href={`/paciente/${p.id}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { softTap(); haptic.tap(); }}
                        className="w-full gap-1.5 text-xs mt-1"
                      >
                        Ver detalhes <ArrowRight className="w-3 h-3" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Confirm delete dialog */}
      <ConfirmDialog
        open={!!confirmingDelete}
        onClose={() => setConfirmingDelete(null)}
        onConfirm={() => { if (confirmingDelete) deleteMutation.mutate(confirmingDelete.id); }}
        title={`Remover ${confirmingDelete?.name ?? "paciente"}?`}
        description="Esta ação remove o paciente e todos os resultados associados. Não pode ser desfeita."
        confirmLabel="Remover"
        variant="destructive"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
