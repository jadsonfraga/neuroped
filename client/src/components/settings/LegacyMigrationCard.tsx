import { useEffect, useState } from "react";
import { DatabaseZap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authFetch } from "@/lib/authClient";

/**
 * G3: copia o paciente legado real (e suas escalas) para o prontuário cifrado
 * da clínica do administrador. O servidor refaz o censo e recusa qualquer
 * divergência; a origem legada não é apagada. A tela mostra só contagens.
 */
const CONFIRMATION = "MIGRAR-PACIENTE-LEGADO";

interface MigrationResult {
  dryRun?: boolean;
  patientsMigrated?: number;
  assessmentsMigrated?: number;
  assessmentsFound?: number;
  code?: string;
  error?: string;
}

const BLOCKED: Record<string, string> = {
  CENSUS_MISMATCH: "O censo mudou desde a conferência. Nada foi gravado; revise antes de seguir.",
  OWNER_CLINIC_NOT_UNIQUE: "Sua conta precisa ser titular de exatamente uma clínica ativa.",
  UNSUPPORTED_DEPENDENTS: "O registro tem consultas ou documentos que esta migração não cobre. Nada foi gravado.",
  ALREADY_MIGRATED: "Este paciente já foi migrado. Nada foi gravado de novo.",
  CLINICAL_CRYPTO_NOT_CONFIGURED: "A cifra clínica não está configurada no servidor.",
  FORBIDDEN: "Disponível apenas para a conta administradora principal.",
};

export function LegacyMigrationCard() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [eligible, setEligible] = useState(false);

  // Só a conta administradora principal vê o cartão; quem decide é o servidor.
  useEffect(() => {
    let cancelled = false;
    authFetch("/api/admin/legacy-patient-migration")
      .then((response) => { if (!cancelled) setEligible(response.ok); })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, []);

  async function run(dryRun: boolean) {
    if (!dryRun) {
      const typed = window.prompt(`Para migrar, digite ${CONFIRMATION}`);
      if (typed !== CONFIRMATION) return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const response = await authFetch("/api/admin/legacy-patient-migration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: CONFIRMATION, dryRun }),
      });
      const result = (await response.json().catch(() => ({}))) as MigrationResult;
      if (!response.ok) {
        setMessage(BLOCKED[result.code ?? ""] ?? result.error ?? `Falha (${response.status}).`);
      } else if (result.dryRun) {
        setMessage(`Simulação aprovada: 1 paciente e ${result.assessmentsFound ?? 0} escala(s) seriam copiados. Nada foi gravado.`);
      } else {
        setMessage(`Migração concluída: ${result.patientsMigrated ?? 0} paciente e ${result.assessmentsMigrated ?? 0} escala(s) no prontuário cifrado. A origem foi preservada.`);
      }
    } catch {
      setMessage("Não foi possível falar com o servidor.");
    } finally {
      setBusy(false);
    }
  }

  if (!eligible) return null;
  return (
    <section className="rounded-xl border border-border p-4 space-y-3" data-testid="legacy-migration-card">
      <div className="flex items-center gap-2">
        <DatabaseZap className="h-4 w-4" />
        <h3 className="text-sm font-semibold">Migrar paciente do modelo antigo</h3>
      </div>
      <p className="text-sm text-muted-foreground">
        Copia o único paciente real do modelo antigo, com as escalas, para o prontuário cifrado da sua clínica.
        O servidor confere as contagens antes; o registro antigo não é apagado.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" disabled={busy} onClick={() => void run(true)}>Simular</Button>
        <Button disabled={busy} onClick={() => void run(false)}>Migrar</Button>
      </div>
      {message && <p role="status" className="text-sm">{message}</p>}
    </section>
  );
}
