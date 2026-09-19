import { useEffect, useState, type ReactNode } from "react";
import { Link } from "wouter";
import { Lock, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useClinic } from "@/contexts/ClinicContext";
import { useCommercialLicense } from "@/hooks/useCommercialLicense";
import { CommercialRequestError, openCommercialMaterial } from "@/lib/commercialClient";
import { getCommercialMaterial, type CommercialFeatureCode } from "@shared/commercial";

/**
 * Barreira de um material licenciado.
 *
 * Fora de uma unidade institucional — instalação individual ou nenhuma clínica
 * selecionada — não há licença a exercer e o material aparece como sempre. É a
 * fronteira do produto: o SKU vendido é a licença institucional, não o uso
 * individual do aplicativo.
 *
 * Dentro de uma unidade, a permissão vem do servidor duas vezes: o snapshot
 * pinta a tela e a confirmação de abertura, que também registra o uso no ledger
 * comercial, decide. Se a confirmação recusa, o material não é renderizado,
 * mesmo que o snapshot anterior dissesse o contrário.
 */
export function CommercialGate({
  feature,
  children,
}: {
  feature: CommercialFeatureCode;
  children: ReactNode;
}) {
  const { activeClinicId } = useClinic();
  const { access, snapshot, error } = useCommercialLicense();
  const state = access(feature);
  const [confirmation, setConfirmation] = useState<"pending" | "confirmed" | "denied">("pending");
  const [denialCode, setDenialCode] = useState<string | null>(null);
  const material = getCommercialMaterial(feature);

  useEffect(() => {
    if (state !== "licensed" || !activeClinicId) return;
    let cancelled = false;
    setConfirmation("pending");
    void openCommercialMaterial(activeClinicId, feature)
      .then(() => {
        if (!cancelled) setConfirmation("confirmed");
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        setDenialCode(cause instanceof CommercialRequestError ? cause.code : "COMMERCIAL_REQUEST_FAILED");
        setConfirmation("denied");
      });
    return () => {
      cancelled = true;
    };
  }, [state, activeClinicId, feature]);

  if (state === "outside-scope") return <>{children}</>;

  if (state === "loading" || (state === "licensed" && confirmation === "pending")) {
    return (
      <Card className="mx-auto my-8 max-w-xl">
        <CardContent className="p-6 text-sm text-muted-foreground" role="status">
          Confirmando a licença desta unidade…
        </CardContent>
      </Card>
    );
  }

  if (state === "licensed" && confirmation === "confirmed") {
    return (
      <>
        <div className="mx-auto mb-4 flex max-w-5xl items-center gap-2 px-4 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-emerald-600" aria-hidden="true" />
          <span>
            {material?.title ?? "Material"} licenciado para {snapshot?.clinic.name ?? "esta unidade"}.
          </span>
        </div>
        {children}
      </>
    );
  }

  const code = confirmation === "denied" ? denialCode : null;
  return (
    <Card className="mx-auto my-8 max-w-xl">
      <CardContent className="space-y-3 p-6">
        <div className="flex items-center gap-2 font-semibold">
          <Lock className="h-5 w-5" aria-hidden="true" />
          {material?.title ?? "Material"} indisponível nesta unidade
        </div>
        <p className="text-sm text-muted-foreground">{blockedReason(code, error)}</p>
        <p className="text-sm">
          <Link href="/licenca" className="underline">
            Ver a licença da unidade
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

function blockedReason(code: string | null, error: string | null): string {
  switch (code) {
    case "COMMERCIAL_USER_NOT_AUTHORIZED":
      return "Você é membro desta unidade, mas não está entre os usuários autorizados da licença. A gestão da unidade concede o acesso.";
    case "COMMERCIAL_LICENSE_INACTIVE":
      return "A licença da unidade não está ativa ou está fora da vigência.";
    case "COMMERCIAL_FEATURE_NOT_LICENSED":
      return "Este material não faz parte da licença contratada por esta unidade.";
    case "COMMERCIAL_LICENSE_MISSING":
      return "Esta unidade ainda não possui licença comercial para materiais.";
    case "COMMERCIAL_OFFER_UNKNOWN":
      return "A licença aponta para um contrato que não corresponde ao catálogo atual. Fale com o suporte antes de usar o material.";
    default:
      return error ?? "Não foi possível confirmar a licença desta unidade.";
  }
}
