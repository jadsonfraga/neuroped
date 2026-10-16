import { roleSummaries } from "@shared/clinic-roles";

/** Quadro de perfis: o que cada papel pode e não pode (derivado de shared/clinic-roles.ts, validado contra a matriz). */
export function RolePermissionsCard() {
  return (
    <section className="space-y-3 rounded-2xl border bg-card p-5" data-testid="role-permissions-card">
      <div>
        <h2 className="text-base font-semibold">Perfis e permissões mínimas</h2>
        <p className="text-sm text-muted-foreground">Cada pessoa recebe só o necessário. A secretaria não tem acesso a prontuário, laudos nem conteúdo clínico.</p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {roleSummaries().map((r) => (
          <li key={r.role} className="rounded-xl border p-3 text-xs" data-testid={`role-${r.role}`}>
            <p className="text-sm font-semibold">{r.label}</p>
            <p className="mt-1"><span className="font-semibold text-emerald-700">Pode:</span> {r.can.join("; ")}</p>
            {r.cannot.length > 0 && <p className="mt-1"><span className="font-semibold text-red-700">Não pode:</span> {r.cannot.join("; ")}</p>}
          </li>
        ))}
      </ul>
    </section>
  );
}
