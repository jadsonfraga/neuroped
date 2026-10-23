/**
 * Quem pode abrir o modo médico do circuito (exame direto, cobertura, matriz e síntese do médico).
 *
 * Regra: sessão remota autenticada, sem troca de senha pendente, com o papel `owner` na clínica ativa e
 * clínica ativa. Quem não entrou (modo local ou sem sessão), a assistente, a secretaria, o profissional,
 * o administrador da clínica e o financeiro não veem nem registram nada do modo médico.
 * Pura: não lê storage nem rede. Os dados do modo médico ficam só em memória na aba.
 */
export interface SessaoParaModoMedico {
  accessMode: "checking" | "remote" | "local";
  isAuthenticated: boolean;
  mustChangePassword?: boolean;
  clinicRole?: string | null;
  clinicStatus?: string | null;
}

export function podeVerModoMedico(sessao: SessaoParaModoMedico): boolean {
  return sessao.accessMode === "remote"
    && sessao.isAuthenticated
    && sessao.mustChangePassword !== true
    && sessao.clinicRole === "owner"
    && sessao.clinicStatus === "active";
}
