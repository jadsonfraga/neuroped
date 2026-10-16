import { clinicMembershipRoles, type ClinicMembershipRole } from "./tenant";
import { roleHasPermission } from "./permissions";

/**
 * Perfis da clínica em linguagem de produto. O texto de "pode/não pode" é
 * validado contra a matriz real (`shared/permissions.ts`) por teste: se a
 * matriz mudar, o teste obriga a revisar estes rótulos.
 *
 * "Secretaria" = papel de membership `assistant` (recepção): agenda e cadastro,
 * sem prontuário, laudos ou qualquer conteúdo clínico.
 */
export const ROLE_LABELS: Readonly<Record<ClinicMembershipRole, string>> = Object.freeze({
  owner: "Proprietário(a)",
  clinic_admin: "Administrador(a) da clínica",
  professional: "Profissional",
  assistant: "Secretaria / recepção",
  financial: "Financeiro",
});

export interface RoleSummary {
  role: ClinicMembershipRole;
  label: string;
  can: string[];
  cannot: string[];
}

const SUMMARY_TEXT: Readonly<Record<ClinicMembershipRole, { can: string[]; cannot: string[] }>> = Object.freeze({
  owner: { can: ["Tudo da clínica: equipe, plano, marca, auditoria e conteúdo clínico"], cannot: [] },
  clinic_admin: { can: ["Equipe, plano, marca da clínica, auditoria, agenda, conteúdo clínico"], cannot: ["Encerrar a clínica ou gerir proprietários"] },
  professional: { can: ["Prontuário, laudos, escalas e documentos dos pacientes da clínica"], cannot: ["Equipe, plano, marca e auditoria"] },
  assistant: { can: ["Agenda e cadastro de pacientes"], cannot: ["Prontuário, laudos, escalas, documentos clínicos, equipe, plano e marca"] },
  financial: { can: ["Dados financeiros da clínica"], cannot: ["Conteúdo clínico, equipe e marca"] },
});

export function roleSummaries(): RoleSummary[] {
  return clinicMembershipRoles.map((role) => ({ role, label: ROLE_LABELS[role], ...SUMMARY_TEXT[role] }));
}

/** Consistência: o resumo só afirma acesso clínico para papéis que a matriz concede. */
export function summaryClaimsClinicalAccess(role: ClinicMembershipRole): boolean {
  return /conteúdo clínico|prontuário/i.test(SUMMARY_TEXT[role].can.join(" ")) && !/^Conteúdo clínico/.test(SUMMARY_TEXT[role].cannot.join(" "));
}

export function matrixGrantsClinicalAccess(role: ClinicMembershipRole): boolean {
  return roleHasPermission(role, "clinical.read") || roleHasPermission(role, "clinical.write");
}
