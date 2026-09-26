import { useEffect, useMemo, useState } from "react";
import { ExternalLink, LogIn, ShieldCheck, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  beginSncrLogin,
  clearSncrSession,
  getSncrAccessToken,
  isSncrOriginEligible,
  sncrOriginRequirement,
} from "@/lib/sncrClient";

const SNCR_ELECTRONIC_START = Date.parse("2026-09-30T00:00:00-03:00");

export function SncrIntegrationPanel() {
  const [authenticated, setAuthenticated] = useState(() => Boolean(getSncrAccessToken()));
  const eligible = isSncrOriginEligible();
  const electronicWindowOpen = Date.now() >= SNCR_ELECTRONIC_START;
  const requirement = sncrOriginRequirement();

  useEffect(() => {
    const sync = () => setAuthenticated(Boolean(getSncrAccessToken()));
    window.addEventListener("focus", sync);
    window.addEventListener("neuroped:sncr-auth", sync);
    return () => {
      window.removeEventListener("focus", sync);
      window.removeEventListener("neuroped:sncr-auth", sync);
    };
  }, []);

  const status = useMemo(() => {
    if (!eligible) return requirement;
    if (!electronicWindowOpen) return "Integração preparada. A nova etapa eletrônica nacional do SNCR inicia em 30/09/2026.";
    if (!authenticated) return "Domínio apto. Autentique o prescritor no SNCR via Gov.br antes da emissão integrada.";
    return "Sessão SNCR autenticada. A receita só pode ser marcada como integrada após resposta positiva da API oficial.";
  }, [authenticated, electronicWindowOpen, eligible, requirement]);

  return (
    <section className="rounded-3xl border border-primary/25 bg-primary/5 p-5 sm:p-6" data-testid="sncr-integration">
      <div className="flex items-start gap-3">
        {eligible ? <ShieldCheck className="mt-0.5 h-5 w-5 text-primary" /> : <TriangleAlert className="mt-0.5 h-5 w-5 text-amber-600" />}
        <div className="min-w-0 flex-1">
          <h2 className="font-bold">Integração oficial Anvisa · SNCR</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{status}</p>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            QR interno, PDF ou assinatura isolada não substituem o registro oficial quando o tipo de receituário exigir integração ao SNCR.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {eligible && electronicWindowOpen && !authenticated && (
              <Button type="button" className="gap-2" onClick={() => {
                try { beginSncrLogin(); } catch (error) { window.alert(String(error)); }
              }}>
                <LogIn className="h-4 w-4" /> Entrar no SNCR via Gov.br
              </Button>
            )}
            {authenticated && (
              <Button type="button" variant="outline" onClick={() => { clearSncrSession(); setAuthenticated(false); }}>
                Encerrar sessão SNCR
              </Button>
            )}
            <Button asChild type="button" variant="ghost" className="gap-2">
              <a href="https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/controlados/sncr/documentos-do-sncr" target="_blank" rel="noopener noreferrer">
                Documentação Anvisa <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
