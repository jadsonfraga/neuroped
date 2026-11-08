import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useClinic } from "@/contexts/ClinicContext";
import { readRouteParam } from "@/lib/routeQuery";
import {
  createLiveDiaryEntry,
  listLiveDiaryRows,
  REPORTER_LABELS,
  voidLiveDiaryEntry,
  type LiveDiaryRow,
} from "@/lib/liveDiaryClient";
import { LIVE_DIARY_REPORTERS, type LiveDiaryFieldValue, type LiveDiaryId, type LiveDiaryReporter } from "@shared/live-diaries";

/**
 * Diário LIVE para telas com modelo próprio (crises, cefaleia): registros no
 * prontuário da clínica, cifrados e vinculados ao paciente. Nada é lido ou
 * gravado no navegador. A tela decide se há rascunho a proteger na troca de
 * paciente (`hasDraft`), para que um relato nunca atravesse prontuários.
 */
export function useLiveDiary(diaryId: LiveDiaryId) {
  const { accessMode, isAuthenticated } = useAuth();
  const { activeClinicId } = useClinic();
  const live = accessMode === "remote" && isAuthenticated;
  const clinicId = live ? activeClinicId ?? null : null;
  const [patientId, setPatientId] = useState(() => readRouteParam("patientId"));
  const [reportedBy, setReportedBy] = useState<LiveDiaryReporter>("family");
  const [rows, setRows] = useState<LiveDiaryRow[]>([]);
  const [ready, setReady] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [reload, setReload] = useState(0);

  const patientsQuery = useQuery<{ data?: Array<{ id: string; profile?: { name?: string } }> }>({
    queryKey: [`/api/live/patients?clinicId=${encodeURIComponent(clinicId ?? "")}`],
    enabled: live && Boolean(clinicId),
  });
  const patients = (patientsQuery.data?.data ?? []).map((patient) => ({
    id: patient.id,
    name: patient.profile?.name ?? "Paciente sem nome",
  }));

  useEffect(() => {
    let active = true;
    setError(null);
    if (!live || !clinicId || !patientId) {
      setRows([]);
      setReady(true);
      return () => { active = false; };
    }
    setReady(false);
    void listLiveDiaryRows(clinicId, patientId, diaryId)
      .then((next) => { if (active) setRows(next); })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : "Não foi possível carregar o diário.");
      })
      .finally(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, [live, clinicId, patientId, diaryId, reload]);

  const changePatient = useCallback(
    (nextPatientId: string, hasDraft: boolean, discardDraft: () => void) => {
      if (nextPatientId === patientId) return;
      if (hasDraft && !confirm("Trocar de paciente descarta o registro em preenchimento. Continuar?")) return;
      discardDraft();
      setReportedBy("family");
      setPatientId(nextPatientId);
    },
    [patientId],
  );

  const save = useCallback(
    async (entryDate: string, fields: Record<string, LiveDiaryFieldValue>) => {
      if (!clinicId || !patientId) throw new Error("Selecione o paciente antes de registrar.");
      setBusy(true);
      try {
        await createLiveDiaryEntry({ clinicId, patientId, diaryId, entryDate, reportedBy, fields });
        setReload((value) => value + 1);
      } finally {
        setBusy(false);
      }
    },
    [clinicId, patientId, diaryId, reportedBy],
  );

  const voidEntry = useCallback(
    async (id: string) => {
      if (!clinicId) return;
      await voidLiveDiaryEntry(clinicId, id);
      setReload((value) => value + 1);
    },
    [clinicId],
  );

  return {
    live,
    clinicId,
    patientId,
    patients,
    patientsLoading: patientsQuery.isLoading,
    reportedBy,
    setReportedBy,
    rows,
    ready,
    error,
    busy,
    changePatient,
    save,
    voidEntry,
  };
}

export type LiveDiaryState = ReturnType<typeof useLiveDiary>;

export function LiveDiaryContextCard({
  diary,
  hasDraft,
  discardDraft,
}: {
  diary: LiveDiaryState;
  hasDraft: boolean;
  discardDraft: () => void;
}) {
  if (!diary.clinicId) {
    return (
      <Card data-testid="diario-live-sem-clinica">
        <CardContent className="p-5 text-sm text-muted-foreground">
          Selecione a clínica ativa para registrar no diário do paciente.
        </CardContent>
      </Card>
    );
  }
  return (
    <Card data-testid="diario-live-contexto">
      <CardContent className="grid gap-3 p-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="diario-live-paciente" className="text-xs">Paciente</Label>
          <select
            id="diario-live-paciente"
            data-testid="diario-live-paciente"
            value={diary.patientId}
            onChange={(event) => diary.changePatient(event.target.value, hasDraft, discardDraft)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="">{diary.patientsLoading ? "Carregando pacientes…" : "Selecione o paciente"}</option>
            {diary.patientId && !diary.patients.some((patient) => patient.id === diary.patientId) && (
              <option value={diary.patientId}>Paciente aberto pela ficha</option>
            )}
            {diary.patients.map((patient) => (
              <option key={patient.id} value={patient.id}>{patient.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="diario-live-relato" className="text-xs">Relatado por</Label>
          <select
            id="diario-live-relato"
            value={diary.reportedBy}
            onChange={(event) => diary.setReportedBy(event.target.value as LiveDiaryReporter)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            {LIVE_DIARY_REPORTERS.map((reporter) => (
              <option key={reporter} value={reporter}>{REPORTER_LABELS[reporter]}</option>
            ))}
          </select>
        </div>
        {diary.error && (
          <p role="alert" className="text-sm text-destructive sm:col-span-2" data-testid="diario-live-erro">{diary.error}</p>
        )}
      </CardContent>
    </Card>
  );
}
