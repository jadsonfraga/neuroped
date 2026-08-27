import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { authFetch } from "@/lib/authClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface AcceptResult {
  clinicId: string;
  clinicName: string;
  role: string;
  acceptedAt: string;
}

function inviteTokenFromLocation(): string {
  if (typeof window === "undefined") return "";
  const hashRoute = window.location.hash.replace(/^#/, "");
  return new URLSearchParams(hashRoute.split("?")[1] ?? "").get("token")?.trim() ?? "";
}

export default function ConvitePage() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const token = useMemo(inviteTokenFromLocation, []);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");
  const [result, setResult] = useState<AcceptResult | null>(null);

  useEffect(() => {
    if (isLoading || !isAuthenticated || !token || status !== "idle") return;
    setStatus("loading");
    void authFetch("/api/tenants/invites/accept", {
      method: "POST",
      body: JSON.stringify({ token }),
    })
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(typeof body?.error === "string" ? body.error : "Não foi possível aceitar o convite.");
        setResult(body.data as AcceptResult);
        setStatus("success");
      })
      .catch((cause) => {
        setError(cause instanceof Error ? cause.message : "Não foi possível aceitar o convite.");
        setStatus("error");
      });
  }, [isAuthenticated, isLoading, status, token]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/20 px-4 py-10">
      <Card className="w-full max-w-xl shadow-sm">
        <CardHeader>
          <div className="mb-3 flex flex-wrap items-center gap-2"><Badge className="gap-1.5"><ShieldCheck className="h-3.5 w-3.5" />NeuroPed</Badge><Badge variant="outline">Convite protegido</Badge></div>
          <CardTitle>{result ? "Convite aceito" : "Convite para uma clínica"}</CardTitle>
          <CardDescription>O aceite valida a sessão, o e-mail convidado e o tenant no servidor. O token não é salvo no navegador.</CardDescription>
        </CardHeader>
        <CardContent>
          {!token && <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">Este link não contém um token válido. Solicite um novo convite ao administrador da clínica.</p>}
          {token && !isLoading && !isAuthenticated && <div className="space-y-4"><p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">Entre com o e-mail que recebeu o convite. O servidor recusará o aceite se a identidade não coincidir.</p><Button asChild><Link href="/login">Entrar para aceitar</Link></Button></div>}
          {status === "loading" && <div className="flex items-center gap-3 rounded-xl border p-4 text-sm"><Loader2 className="h-4 w-4 animate-spin" />Validando convite no tenant…</div>}
          {status === "error" && <div className="space-y-4"><p className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</p><Button asChild variant="outline"><Link href="/login">Voltar ao login</Link></Button></div>}
          {status === "success" && result && <div className="space-y-4"><div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-semibold">Acesso concedido a {result.clinicName}</p><p className="mt-1 text-xs">Papel: {result.role} · {user?.email}</p></div></div><Button asChild><Link href="/saas">Abrir Central SaaS</Link></Button></div>}
        </CardContent>
      </Card>
    </main>
  );
}
