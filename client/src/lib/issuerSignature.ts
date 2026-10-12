// Função pura (sem DOM nem rede): usada pelos geradores de texto clínico e
// testável em Node. O emissor vem de useIssuer() (lib/issuer.ts).
export interface SignatureSource {
  doctorName: string;
  specialty: string;
  credentialsLine: string;
  profileConfigured: boolean;
}

/**
 * Assinatura textual histórica do autor do NeuroPed. Continua sendo o padrão
 * quando nenhum perfil profissional foi salvo, para que nada mude na conta
 * original; uma segunda clínica com perfil configurado assina com os próprios dados.
 */
export const LEGACY_AUTHOR_SIGNATURE = "Dr. Jadson Fraga · Neuropediatra · CRM-PE 25227 · RQE 17756";

/** "Nome · Especialidade · Registro" do emissor configurado; sem perfil, a assinatura histórica. */
export function issuerSignatureLine(issuer: SignatureSource | null | undefined): string {
  if (!issuer?.profileConfigured) return LEGACY_AUTHOR_SIGNATURE;
  const parts = [issuer.doctorName, issuer.specialty, issuer.credentialsLine].map((v) => (v ?? "").trim()).filter(Boolean);
  return parts.length ? parts.join(" · ") : LEGACY_AUTHOR_SIGNATURE;
}

/** Texto histórico do termo de uso (conta original, sem perfil salvo). */
export const LEGACY_CONSENT_TERMS_TEXT =
  "O NeuroPed EDJ é ferramenta clínica do Dr. Jadson Fraga (CRM-PE 25227, RQE 17756), destinada ao apoio de profissionais de saúde habilitados e pacientes em acompanhamento.";

export interface ConsentControllerSource extends SignatureSource {
  clinicName?: string;
}

/**
 * Termo de uso do consentimento LGPD com o controlador correto: o profissional
 * (e a clínica) que configurou o perfil. Sem perfil salvo, o texto histórico,
 * idêntico ao que a conta original sempre registrou.
 */
export function consentTermsText(issuer: ConsentControllerSource | null | undefined): string {
  if (!issuer?.profileConfigured) return LEGACY_CONSENT_TERMS_TEXT;
  const name = (issuer.doctorName ?? "").trim();
  if (!name) return LEGACY_CONSENT_TERMS_TEXT;
  const cred = (issuer.credentialsLine ?? "").trim();
  const clinic = (issuer.clinicName ?? "").trim();
  const who = `${name}${cred ? ` (${cred})` : ""}${clinic ? `, ${clinic}` : ""}`;
  return `O NeuroPed EDJ é ferramenta clínica utilizada por ${who}, responsável pelo tratamento dos dados, destinada ao apoio de profissionais de saúde habilitados e pacientes em acompanhamento.`;
}
