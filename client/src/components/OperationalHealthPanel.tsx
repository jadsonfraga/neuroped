import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Download, RefreshCw, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useClinic } from "@/contexts/ClinicContext";
import { authFetch } from "@/lib/authClient";

type Health = {
  status: string;
  buildSha: string;
  timestamp: string;
  database: string;
  migrations: { status: string; expected: string; requiredTablesPresent: number; requiredTablesTotal: number };
  objectStorage: { status: string; configured: boolean; provider: string };
  clinicalCrypto: { configured: boolean };
  authentication: { required: boolean; schemaReady: boolean | null; configured: boolean };
  frontendCanonical: string;
  backendCanonical: string;
};

type AuditRow = { id: string; action: string; target_type: string; result: string; event_at: string; event_hash: string };
type Diagnostics = { tenant: { id: string; slug: string | null; status: string; membershipRole: string }; billing: { status: string; currentPeriodEnd: string | null }; migrations: { operationalTablesPresent: number; required: number }; objectStorage: { configured: boolean }; clinicalCrypto: { configured: boolean }; failures: Array<{ action: string; result: string; event_at: string }> };

function StateBadge({ ok, label }: { ok: boolean; label: string }) {
  return <Badge variant={ok ? "secondary" : "destructive"} className="gap-1">{ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}{label}</Badge>;
}

export function OperationalHealthPanel() {
  const { user, isAuthenticated } = useAuth();
  const { activeClinicId } = useClinic();
  const [health, setHealth] = useState<Health | null>(null);
  const [audit, setAudit] = useState<AuditRow[]>([]);
  const [diagnostics, setDiagnostics] = useState<Diagnostics | null>(null);
  const [auditAction, setAuditAction] = useState("");
  const [auditClinicId, setAuditClinicId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const healthResponse = await fetch(`/api/health?ts=${Date.now()}`, { cache: "no-store" });
      if (!healthResponse.ok) throw new Error("HEALTH_UNAVAILABLE");
      setHealth(await healthResponse.json() as Health);
      if (isAuthenticated && activeClinicId) {
        const diagnosticsResponse = await authFetch(`/api/live/diagnostics?clinicId=${encodeURIComponent(activeClinicId)}`);
        if (diagnosticsResponse.ok) setDiagnostics(await diagnosticsResponse.json() as Diagnostics);
      }
      if (user?.role === "admin" && isAuthenticated) {
        const auditQuery = new URLSearchParams({ limit: "8" });
        if (auditAction.trim()) auditQuery.set("action", auditAction.trim());
        if (auditClinicId.trim()) auditQuery.set("clinicId", auditClinicId.trim());
        const auditResponse = await authFetch(`/api/audit-log?${auditQuery.toString()}`);
        if (auditResponse.ok) {
          const data = await auditResponse.json() as { data?: AuditRow[] };
          setAudit(data.data ?? []);
        }
      }
    } catch { setError("Não foi possível obter o diagnóstico atual."); }
    finally { setLoading(false); }
  }, [user?.role, isAuthenticated, activeClinicId, auditAction, auditClinicId]);
  useEffect(() => { void load(); }, [load]);

  const controls = health ? [
    ["D1", health.database === "ok"],
    ["Migrations", health.migrations.status === "ok"],
    ["Object storage", health.objectStorage.status === "ok" && health.objectStorage.configured],
    ["Criptografia clínica", health.clinicalCrypto.configured],
    ["Autenticação", health.authentication.configured],
  ] as const : [];

  return (
    <Card className="border-primary/20 bg-primary/[0.03]">
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg"><ShieldCheck className="h-5 w-5 text-primary" /> Estado do NeuroPed</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">Diagnóstico derivado de checks reais. Nenhum segredo, e-mail ou dado clínico é exibido.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading} className="gap-2"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />Atualizar</Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}
        {health && <>
          <div className="flex flex-wrap gap-2">{controls.map(([label, ok]) => <StateBadge key={label} ok={ok} label={label} />)}</div>
          {diagnostics && <div className="grid gap-2 rounded-xl border border-border/70 bg-background/70 p-3 text-xs text-muted-foreground sm:grid-cols-2">
            <p><strong className="text-foreground">Tenant ativo:</strong> {diagnostics.tenant.slug ?? diagnostics.tenant.id} ({diagnostics.tenant.status}; {diagnostics.tenant.membershipRole})</p>
            <p><strong className="text-foreground">Billing:</strong> {diagnostics.billing.status}</p>
            <p><strong className="text-foreground">Tabelas operacionais:</strong> {diagnostics.migrations.operationalTablesPresent}/{diagnostics.migrations.required}</p>
            <p><strong className="text-foreground">Falhas recentes:</strong> {diagnostics.failures.length}</p>
          </div>}
          <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
            <p><strong className="text-foreground">Versão:</strong> <span className="font-mono">{health.buildSha}</span></p>
            <p><strong className="text-foreground">Último check:</strong> {new Date(health.timestamp).toLocaleString()}</p>
            <p><strong className="text-foreground">Frontend:</strong> {health.frontendCanonical}</p>
            <p><strong className="text-foreground">Backend:</strong> {health.backendCanonical}</p>
            <p><strong className="text-foreground">Schema esperado:</strong> {health.migrations.expected}</p>
            <p><strong className="text-foreground">Tabelas:</strong> {health.migrations.requiredTablesPresent}/{health.migrations.requiredTablesTotal}</p>
          </div>
          {user?.role === "admin" && isAuthenticated && <div className="rounded-xl border border-border/70 bg-background/70 p-3">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-semibold">Auditoria encadeada recente</h3><Button asChild variant="ghost" size="sm" className="gap-2"><a href={`/api/audit-log?format=csv${auditAction.trim() ? `&action=${encodeURIComponent(auditAction.trim())}` : ""}${auditClinicId.trim() ? `&clinicId=${encodeURIComponent(auditClinicId.trim())}` : ""}`} target="_blank" rel="noreferrer"><Download className="h-3.5 w-3.5" />CSV controlado</a></Button></div>
            <div className="mb-3 grid gap-2 sm:grid-cols-2"><Input aria-label="Filtrar ação da auditoria" placeholder="Ação" value={auditAction} onChange={(event) => setAuditAction(event.target.value)} /><Input aria-label="Filtrar clínica da auditoria" placeholder="ID opaco da clínica" value={auditClinicId} onChange={(event) => setAuditClinicId(event.target.value)} /></div>
            {audit.length === 0 ? <p className="text-xs text-muted-foreground">Nenhum evento disponível ou migration ainda não aplicada.</p> : <ul className="space-y-1 text-xs">{audit.map((row) => <li key={row.id} className="flex flex-wrap items-center gap-2"><Badge variant="outline">{row.result}</Badge><span className="font-medium">{row.action}</span><span className="text-muted-foreground">{new Date(row.event_at).toLocaleString()}</span><span className="font-mono text-[10px] text-muted-foreground">{row.event_hash.slice(0, 12)}…</span></li>)}</ul>}
          </div>}
        </>}
      </CardContent>
    </Card>
  );
}
