import { Building2, ChevronDown, Loader2 } from "lucide-react";
import { useClinic } from "@/contexts/ClinicContext";
import { useAuth } from "@/contexts/AuthContext";

const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  clinic_admin: "Admin da clínica",
  professional: "Profissional",
  assistant: "Assistente",
  financial: "Financeiro",
};

export function ClinicSwitcher({ collapsed = false }: { collapsed?: boolean }) {
  const { accessMode, isAuthenticated } = useAuth();
  const { clinics, activeClinicId, activeClinic, isLoading, error, setActiveClinicId } = useClinic();

  if (accessMode !== "remote" || !isAuthenticated || (!isLoading && clinics.length === 0 && !error)) return null;

  if (collapsed) {
    return (
      <div className="flex justify-center px-2 pt-2" title={activeClinic?.name ?? "Contexto de clínica"}>
        <span
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-sidebar-border bg-sidebar-accent/40 text-primary"
          aria-label={activeClinic?.name ?? "Clínica não selecionada"}
        >
          <Building2 className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>
    );
  }

  return (
    <div className="px-2 pt-2" data-testid="clinic-switcher">
      <label className="sr-only" htmlFor="active-clinic-select">Clínica ativa</label>
      <div className="relative rounded-xl border border-primary/25 bg-primary/[0.07] p-2">
        <div className="mb-1 flex items-center gap-1.5 px-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-primary">
          <Building2 className="h-3 w-3" aria-hidden="true" />
          <span>Clínica ativa</span>
          {isLoading && <Loader2 className="ml-auto h-3 w-3 animate-spin" aria-label="Carregando clínicas" />}
        </div>
        {error ? (
          <p className="px-1 text-[11px] leading-snug text-destructive">{error}</p>
        ) : clinics.length > 0 ? (
          <>
            <select
              id="active-clinic-select"
              value={activeClinicId ?? ""}
              onChange={(event) => setActiveClinicId(event.target.value)}
              className="w-full appearance-none rounded-lg border border-sidebar-border bg-background/80 px-2.5 py-2 pr-8 text-xs font-semibold text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
              data-testid="select-active-clinic"
            >
              {clinics.map((clinic) => (
                <option key={clinic.id} value={clinic.id}>
                  {clinic.name} · {ROLE_LABELS[clinic.role] ?? clinic.role}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute bottom-5 right-4 h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
            {activeClinic && (
              <p className="mt-1 px-1 text-[10px] text-muted-foreground">
                {ROLE_LABELS[activeClinic.role] ?? activeClinic.role}
              </p>
            )}
          </>
        ) : (
          <p className="px-1 text-[11px] text-muted-foreground">Nenhuma clínica ativa disponível.</p>
        )}
      </div>
    </div>
  );
}
