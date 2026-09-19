import { useCallback, useEffect, useState } from "react";
import { Link } from "wouter";
import { CheckCircle2, Lock, ShieldCheck, UserMinus, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useClinic } from "@/contexts/ClinicContext";
import { useCommercialLicense } from "@/hooks/useCommercialLicense";
import {
  acceptCommercialLicense,
  fetchCommercialMaterials,
  fetchCommercialSeats,
  grantCommercialSeat,
  revokeCommercialSeat,
  type CommercialMaterialView,
  type CommercialSeatsResponse,
} from "@/lib/commercialClient";

const MANAGER_ROLES = new Set(["owner", "clinic_admin"]);

const BOUNDARIES = [
  {
    key: "acceptsNoPatientData" as const,
    label: "Os materiais licenciados não recebem dados identificáveis de paciente.",
  },
  {
    key: "acceptsNoMedicalService" as const,
    label: "A licença não inclui ato médico, apoio à decisão clínica nem laudo.",
  },
  {
    key: "acceptsNoRedistribution" as const,
    label: "A licença não permite redistribuição nem white-label.",
  },
];

function formatDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value.includes("T") ? value : `${value.replace(" ", "T")}Z`);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("pt-BR");
}

export default function LicencaPage() {
  const { activeClinicId, activeClinic } = useClinic();
  const { isInstitutional, isLoading, snapshot, error, reload } = useCommercialLicense();
  const [seats, setSeats] = useState<CommercialSeatsResponse | null>(null);
  const [materials, setMaterials] = useState<CommercialMaterialView[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [boundaries, setBoundaries] = useState({
    acceptsNoPatientData: false,
    acceptsNoMedicalService: false,
    acceptsNoRedistribution: false,
  });
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const isManager = MANAGER_ROLES.has(snapshot?.clinic.role ?? "");
  const license = snapshot?.license ?? null;

  const loadDetails = useCallback(async () => {
    if (!activeClinicId || !snapshot) return;
    const [seatsResult, materialsResult] = await Promise.allSettled([
      isManager ? fetchCommercialSeats(activeClinicId) : Promise.reject(new Error("skip")),
      fetchCommercialMaterials(activeClinicId),
    ]);
    setSeats(seatsResult.status === "fulfilled" ? seatsResult.value : null);
    setMaterials(materialsResult.status === "fulfilled" ? materialsResult.value.materials : []);
  }, [activeClinicId, isManager, snapshot]);

  useEffect(() => {
    void loadDetails();
  }, [loadDetails]);

  if (!isInstitutional) {
    return (
      <Shell>
        <Card>
          <CardContent className="space-y-2 p-6 text-sm text-muted-foreground">
            <p>Nenhuma unidade institucional está selecionada nesta sessão.</p>
            <p>
              A licença comercial existe por unidade. O uso individual do aplicativo não depende
              dela e continua disponível.
            </p>
            <Link href="/planos" className="underline">
              Conhecer a licença institucional
            </Link>
          </CardContent>
        </Card>
      </Shell>
    );
  }

  if (isLoading) {
    return (
      <Shell>
        <p className="text-sm text-muted-foreground" role="status">
          Carregando a licença da unidade…
        </p>
      </Shell>
    );
  }

  async function run(action: () => Promise<unknown>, success: string) {
    setBusy(true);
    setFeedback(null);
    try {
      await action();
      await reload();
      await loadDetails();
      setFeedback(success);
    } catch (cause) {
      setFeedback(cause instanceof Error ? cause.message : "A operação não foi concluída.");
    } finally {
      setBusy(false);
    }
  }

  const allBoundariesAccepted = BOUNDARIES.every((boundary) => boundaries[boundary.key]);
  const canAccept =
    isManager && license?.status === "pending" && allBoundariesAccepted && selected.size > 0;

  return (
    <Shell>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            {activeClinic?.name ?? "Unidade"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {license ? (
            <>
              <Row label="Contrato" value={license.offerName} />
              <Row
                label="Situação"
                value={<Badge variant={license.status === "active" ? "default" : "secondary"}>{license.status}</Badge>}
              />
              <Row label="Versão dos termos" value={license.contractVersion ?? "—"} />
              <Row label="Vigência" value={`${formatDate(license.activatedAt)} a ${formatDate(license.expiresAt)}`} />
              <Row
                label="Usuários autorizados"
                value={`${license.authorizedUsers} de ${license.maxAuthorizedUsers}`}
              />
              <Row
                label="Suporte consumido"
                value={`${license.supportMinutesUsed} de ${license.supportMinutes} minutos`}
              />
              <Row
                label="Seu acesso"
                value={license.currentUserAuthorized ? "autorizado" : "não autorizado"}
              />
            </>
          ) : (
            <p className="text-muted-foreground">
              {error ?? "Esta unidade não possui licença comercial registrada."}
            </p>
          )}
        </CardContent>
      </Card>

      {license?.status === "pending" && isManager && seats && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Aceitar a licença</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p className="text-muted-foreground">
              A licença só é ativada depois que a gestão da unidade aceita as fronteiras
              contratuais e escolhe quem pode usar os materiais.
            </p>
            <div className="space-y-2">
              {BOUNDARIES.map((boundary) => (
                <label key={boundary.key} className="flex items-start gap-2">
                  <Checkbox
                    checked={boundaries[boundary.key]}
                    onCheckedChange={(value) =>
                      setBoundaries((previous) => ({ ...previous, [boundary.key]: value === true }))
                    }
                  />
                  <span>{boundary.label}</span>
                </label>
              ))}
            </div>
            <div className="space-y-2">
              <p className="font-medium">Usuários autorizados (até {seats.maxAuthorizedUsers})</p>
              {seats.members.map((member) => (
                <label key={member.userId} className="flex items-center gap-2">
                  <Checkbox
                    checked={selected.has(member.userId)}
                    onCheckedChange={(value) =>
                      setSelected((previous) => {
                        const next = new Set(previous);
                        if (value === true) next.add(member.userId);
                        else next.delete(member.userId);
                        return next;
                      })
                    }
                  />
                  <span>
                    {member.name ?? member.email ?? member.userId}{" "}
                    <span className="text-muted-foreground">({member.role})</span>
                  </span>
                </label>
              ))}
            </div>
            <Button
              disabled={!canAccept || busy}
              onClick={() =>
                void run(
                  () =>
                    acceptCommercialLicense({
                      clinicId: activeClinicId as string,
                      licenseId: license.id,
                      termsVersion: license.contractVersion ?? "",
                      authorizedUserIds: [...selected],
                      ...boundaries,
                    }),
                  "Licença ativada.",
                )
              }
            >
              <CheckCircle2 className="mr-2 h-4 w-4" aria-hidden="true" />
              Aceitar e ativar
            </Button>
          </CardContent>
        </Card>
      )}

      {license?.status === "active" && isManager && seats && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Usuários autorizados ({seats.authorizedUsers} de {seats.maxAuthorizedUsers})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {seats.members.map((member) => (
              <div key={member.userId} className="flex items-center justify-between gap-3 border-b py-2 last:border-0">
                <span>
                  {member.name ?? member.email ?? member.userId}{" "}
                  <span className="text-muted-foreground">({member.role})</span>
                </span>
                {member.authorized ? (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() =>
                      void run(
                        () => revokeCommercialSeat(activeClinicId as string, member.userId),
                        "Acesso revogado.",
                      )
                    }
                  >
                    <UserMinus className="mr-2 h-4 w-4" aria-hidden="true" />
                    Revogar
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    disabled={busy || seats.authorizedUsers >= seats.maxAuthorizedUsers}
                    onClick={() =>
                      void run(
                        () => grantCommercialSeat(activeClinicId as string, member.userId),
                        "Acesso concedido.",
                      )
                    }
                  >
                    <UserPlus className="mr-2 h-4 w-4" aria-hidden="true" />
                    Autorizar
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {materials.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Materiais da licença</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {materials.map((material) => (
              <div key={material.code} className="space-y-1 border-b pb-3 last:border-0 last:pb-0">
                <div className="flex items-center gap-2 font-medium">
                  {material.licensed ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                  ) : (
                    <Lock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  )}
                  {material.title}
                </div>
                <p className="text-muted-foreground">{material.summary}</p>
                {material.surface === "public-intake" && (
                  <p className="text-xs text-muted-foreground">
                    Preenchido pela família sem conta, antes da consulta: esta tela não pede
                    autorização de quem preenche.
                  </p>
                )}
                {material.licensed && (
                  <div className="flex flex-wrap gap-3">
                    {material.routes.map((route) => (
                      <Link key={route} href={route} className="underline">
                        Abrir {route}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {feedback && (
        <p className="text-sm" role="status">
          {feedback}
        </p>
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-3xl space-y-4 px-4 py-8">
      <h1 className="text-xl font-semibold">Licença da unidade</h1>
      {children}
    </main>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}
