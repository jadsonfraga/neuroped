// Zona de implantação — permite servir o MESMO build em dois hosts:
//   · host público (famílias):   VITE_ZONE=public   → sem PIN, só conteúdo aberto
//   · subdomínio médico:         VITE_ZONE=medical  → app completo (protegido por
//                                                     Cloudflare Access no edge)
//   · padrão (dev / host único): VITE_ZONE=full     → comportamento atual
//     (rota pública livre + PIN nas rotas médicas)
//
// VITE_MEDICAL_URL: URL do subdomínio médico, usada para linkar as famílias/
// profissional da zona pública para a área médica.
//
// IMPORTANTE: isto é organização de UX/deploy. O isolamento REAL do conteúdo
// médico vem do Cloudflare Access no subdomínio (edge), não do cliente.

export type Zone = "full" | "public" | "medical";

function readZone(): Zone {
  const z = (import.meta.env.VITE_ZONE as string | undefined)?.toLowerCase();
  return z === "public" || z === "medical" ? z : "full";
}

export const ZONE: Zone = readZone();
export const IS_PUBLIC_ZONE = ZONE === "public";
export const MEDICAL_URL = ((import.meta.env.VITE_MEDICAL_URL as string | undefined) || "").trim();
