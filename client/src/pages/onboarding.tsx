import { FormEvent, useEffect, useState } from "react";
import { Building2, Loader2, ShieldCheck, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { authFetch } from "@/lib/authClient";

interface ClinicSummary {
  id: string;
  name: string;
  role: string;
}

/**
 * Onboarding SaaS: conta nova → criar clínica (vira OWNER; trial de 14 dias e
 * lifecycle nascem por trigger no servidor) → identidade profissional →
 * dashboard. Quem já pertence a uma clínica é levado direto ao app.
 */
export default function OnboardingPage() {
  const { user, isLoading } = useAuth();
  const [existing, setExisting] = useState<ClinicSummary[] | null>(null);
  const [clinicName, setClinicName] = useState("");
  const [legalName, setLegalName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [credentials, setCredentials] = useState("");
  const [specialty, setSpecialty] = useState("Neuropediatria");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setDisplayName((current) => current || user.name);
    let cancelled = false;
    void authFetch("/api/tenants")
      .then(async (response) => (response.ok ? response.json() : { data: [] }))
      .then((body: { data?: ClinicSummary[] }) => {
        if (!cancelled) setExisting(body.data ?? []);
      })
      .catch(() => {
        if (!cancelled) setExisting([]);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  function enterApp(clinicId: string) {
    try {
      sessionStorage.setItem("neuroped:active-clinic-id", clinicId);
    } catch {
      // O switcher permite selecionar manualmente se o storage falhar.
    }
    window.location.hash = "/";
    window.location.reload();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const created = await authFetch("/api/tenants", {
        method: "POST",
        body: JSON.stringify({ name: clinicName.trim(), legalName: legalName.trim() || undefined }),
      });
      const clinic = await created.json().catch(() => ({}));
      if (!created.ok) {
        throw new Error((clinic as { error?: string }).error || `Não foi possível criar a clínica (${created.status}).`);
      }
      // Identidade profissional para os documentos — melhor esforço: o perfil
      // pode ser completado depois em Configurações.
      if (displayName.trim()) {
        await authFetch("/api/me/profile", {
          method: "PUT",
          body: JSON.stringify({
            displayName: displayName.trim(),
            credentialsLine: credentials.trim(),
            specialty: specialty.trim(),
            documentEmail: user?.email ?? "",
          }),
        }).catch(() => undefined);
      }
      enterApp((clinic as { id: string }).id);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Falha ao criar a clínica.");
      setSubmitting(false);
    }
  }

  if (isLoading || (user && existing === null)) {
    return (
      <section className="flex min-h-[60vh] items-center justify-center" role="status">
        <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />
        <span className="sr-only">Carregando…</span>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="mx-auto flex min-h-[60vh] w-full max-w-lg flex-col items-center justify-center px-4 text-center">
        <p className="text-sm text-muted-foreground">Entre na sua conta para configurar a clínica.</p>
        <a href="#/login" className="mt-3 text-sm font-semibold text-primary hover:underline">Ir para o login</a>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-2xl px-4 py-10">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-chart-2 shadow-lg shadow-primary/25">
          <Building2 className="h-7 w-7 text-primary-foreground" strokeWidth={1.75} />
        </div>
        <h1 className="text-xl font-bold text-foreground">Configurar sua clínica</h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          Sua clínica é o espaço isolado dos seus pacientes e da sua equipe. Você entra como proprietário(a), com 14 dias de avaliação e 2 assentos.
        </p>
      </div>

      {existing && existing.length > 0 && (
        <div className="mb-6 rounded-2xl border border-primary/15 bg-primary/[0.04] p-4">
          <p className="text-sm font-semibold text-foreground">Você já participa de {existing.length === 1 ? "uma clínica" : `${existing.length} clínicas`}.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {existing.map((clinic) => (
              <Button key={clinic.id} variant="outline" size="sm" className="gap-2" onClick={() => enterApp(clinic.id)}>
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                Entrar em {clinic.name}
              </Button>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 rounded-3xl border border-primary/15 bg-card p-5 shadow-xl shadow-primary/5 sm:p-6">
        <fieldset className="space-y-4">
          <legend className="flex items-center gap-2 text-sm font-bold text-foreground"><Building2 className="h-4 w-4 text-primary" aria-hidden="true" />Clínica</legend>
          <div className="space-y-2">
            <Label htmlFor="onb-clinic-name">Nome da clínica</Label>
            <Input id="onb-clinic-name" required minLength={2} maxLength={160} value={clinicName} onChange={(event) => setClinicName(event.target.value)} placeholder="Ex.: Clínica Desenvolver" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="onb-legal-name">Razão social (opcional)</Label>
            <Input id="onb-legal-name" maxLength={200} value={legalName} onChange={(event) => setLegalName(event.target.value)} placeholder="Nome jurídico para documentos" />
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="flex items-center gap-2 text-sm font-bold text-foreground"><Stethoscope className="h-4 w-4 text-primary" aria-hidden="true" />Identidade profissional (documentos)</legend>
          <div className="space-y-2">
            <Label htmlFor="onb-display-name">Nome como assina</Label>
            <Input id="onb-display-name" maxLength={160} value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Ex.: Dra. Ana Souza" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="onb-credentials">Registro profissional</Label>
            <Input id="onb-credentials" maxLength={240} value={credentials} onChange={(event) => setCredentials(event.target.value)} placeholder="Ex.: CRM-SP 12345 · RQE 6789" />
            <p className="text-[11px] leading-4 text-muted-foreground">Aparece nos laudos e receitas. Sem registro informado, os documentos indicam que a identidade não foi configurada — nunca inventamos credenciais.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="onb-specialty">Especialidade</Label>
            <Input id="onb-specialty" maxLength={120} value={specialty} onChange={(event) => setSpecialty(event.target.value)} />
          </div>
        </fieldset>

        {error && <p role="alert" className="rounded-xl border border-destructive/25 bg-destructive/5 p-3 text-xs leading-relaxed text-destructive">{error}</p>}
        <Button type="submit" disabled={submitting} className="w-full gap-2 rounded-xl bg-gradient-to-r from-primary to-chart-2">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ShieldCheck className="h-4 w-4" aria-hidden="true" />}
          {submitting ? "Criando clínica…" : "Criar clínica e entrar"}
        </Button>
      </form>
    </section>
  );
}
