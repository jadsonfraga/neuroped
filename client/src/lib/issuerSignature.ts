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
