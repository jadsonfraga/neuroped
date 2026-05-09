/**
 * pinAuth.ts
 * Utilitário de verificação de PIN via SHA-256.
 *
 * O hash da senha/PIN deve ser definido via variável de ambiente:
 *   VITE_PIN_HASH=<sha256hex da senha>
 *
 * Para gerar o hash localmente (Node.js):
 *   node -e "require('crypto').createHash('sha256').update('sua_senha').digest('hex') |> console.log(%)"
 *
 * Ou via browser (DevTools console):
 *   const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('sua_senha'));
 *   console.log([...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join(''));
 *
 * NUNCA coloque a senha ou PIN em plain text no código-fonte.
 * Risco residual: SPA cliente — hash visível no bundle. Para segurança real, usar auth server-side.
 */

const PIN_HASH: string = import.meta.env.VITE_PIN_HASH ?? "";

export async function sha256hex(input: string): Promise<string> {
  // crypto.subtle exige contexto seguro (HTTPS). Verificação defensiva.
  if (typeof crypto === "undefined" || !crypto.subtle) {
    // Fallback: retorna string vazia (bloqueia acesso via fail-safe em verifyPin)
    console.error("[NeuroPed] crypto.subtle não disponível — contexto inseguro (HTTP)? Use HTTPS.");
    return "";
  }
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Verifica se o PIN fornecido corresponde ao hash configurado.
 * Retorna false se VITE_PIN_HASH não estiver configurado.
 */
export async function verifyPin(pin: string): Promise<boolean> {
  if (!PIN_HASH) {
    // Sem hash configurado: bloqueia acesso (fail-safe)
    console.warn("[NeuroPed] VITE_PIN_HASH não configurado. Acesso bloqueado.");
    return false;
  }
  const hash = await sha256hex(pin);
  return hash === PIN_HASH;
}
