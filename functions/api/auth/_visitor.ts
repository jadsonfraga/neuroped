/**
 * Acesso de visitante: uma identidade compartilhada que só abre as escalas.
 *
 * Desenho (fail-closed, deny-by-default):
 * - a conta só existe e só autentica enquanto `NEUROPED_VISITOR_PASSWORD` estiver
 *   definido no ambiente. Remover o segredo desliga o login E derruba as sessões
 *   já emitidas (o middleware reavalia o segredo a cada requisição);
 * - a senha NUNCA é gravada no banco nem no repositório: a autenticação compara a
 *   senha enviada com o segredo do ambiente em tempo constante. A coluna
 *   `password_hash` guarda só uma impressão digital (não verificável como
 *   senha) que prende as sessões ao segredo vigente. Nenhum outro caminho (login
 *   comum, recuperação de senha, troca de senha) consegue autenticá-la;
 * - no banco a linha tem o papel mínimo `reader` (a tabela `users` só aceita
 *   admin/professional/reader/operator) e a identidade reservada `visitante`; a
 *   API expõe `visitor` (ver publicUser), ausente de `KNOWN_ROLES`: todo handler
 *   que usa `getContextUser` já responde 401 para ele. Além disso o middleware nega por
 *   padrão: fora da allowlist abaixo, 403, inclusive escritas, troca de senha,
 *   consentimento, perfil e qualquer rota de clínica;
 * - nunca recebe `clinic_memberships`. Escalas rodam no navegador, sem gravar
 *   dado de paciente no servidor.
 *
 * Não é um mecanismo de privacidade clínica: a senha é compartilhada por
 * definição. O que o protege é o escopo (somente leitura, sem paciente, sem
 * clínica) e o interruptor do segredo.
 */

import { sha256Hex } from "./_crypto";
import {
  VISITOR_API_ROLE,
  VISITOR_DB_ROLE,
  VISITOR_LOGIN,
  canonicalEmail,
  getUserByEmail,
  type Env,
  type UserRow,
} from "./_shared";

export { VISITOR_LOGIN };
/** Papel exposto pela API (o banco guarda `reader`; ver publicUser). */
export const VISITOR_ROLE = VISITOR_API_ROLE;
const VISITOR_NAME = "Visitante";
const VISITOR_PASSWORD_MIN_LENGTH = 8;

export type VisitorEnv = Pick<Env, "NEUROPED_VISITOR_PASSWORD">;

/** Segredo do visitante, ou null quando ausente/curto demais (login desligado). */
export function visitorPassword(env: VisitorEnv): string | null {
  const value = env.NEUROPED_VISITOR_PASSWORD?.trim() ?? "";
  return value.length >= VISITOR_PASSWORD_MIN_LENGTH ? value : null;
}

export function visitorLoginEnabled(env: VisitorEnv): boolean {
  return visitorPassword(env) !== null;
}

export type VisitorSessionEnv = VisitorEnv & Pick<Env, "NEUROPED_JWT_SECRET">;

/**
 * Impressão digital do segredo atual, guardada em `users.password_hash` da
 * linha do visitante (que nunca é uma senha verificável: o prefixo não é um
 * hash PBKDF2). Vincula as sessões ao segredo vigente: trocar ou remover o
 * segredo invalida na hora todas as sessões emitidas sob o anterior, sem
 * depender de a aba chamar refresh. Mistura o segredo JWT, então o valor
 * guardado não permite adivinhar a senha sem ele.
 */
export async function visitorFingerprint(env: VisitorSessionEnv): Promise<string | null> {
  const password = visitorPassword(env);
  const jwtSecret = env.NEUROPED_JWT_SECRET?.trim();
  if (!password || !jwtSecret) return null;
  return `visitor-fp:${(await sha256Hex(`neuroped-visitor-v1:${jwtSecret}:${password}`)).slice(0, 32)}`;
}

/** A linha guardada corresponde ao segredo vigente? (false = desligado ou rotacionado) */
export async function visitorSessionCurrent(
  env: VisitorSessionEnv,
  storedMarker: string | null | undefined,
): Promise<boolean> {
  const expected = await visitorFingerprint(env);
  return expected !== null && storedMarker === expected;
}

export function isVisitorLoginName(value: string): boolean {
  return canonicalEmail(value) === VISITOR_LOGIN;
}

/** Comparação em tempo constante: compara digests SHA-256 de mesmo tamanho. */
export async function visitorPasswordMatches(
  env: VisitorEnv,
  supplied: string,
): Promise<boolean> {
  const expected = visitorPassword(env);
  if (!expected) return false;
  const [a, b] = await Promise.all([sha256Hex(supplied), sha256Hex(expected)]);
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

/**
 * Garante a linha do visitante, sem nunca reativar ou reescrever uma existente.
 * Desativar a conta (is_active = 0) é um segundo interruptor do operador.
 * Retorna null se a identidade estiver ocupada por outro papel ou desativada
 * (nesse caso o login de `visitante` simplesmente não existe).
 */
export async function ensureVisitorAccount(
  db: D1Database,
  fingerprint: string,
): Promise<UserRow | null> {
  const now = new Date().toISOString();
  await db
    .prepare(
      `INSERT INTO users
         (id, name, email, password_hash, must_change_password, failed_login_attempts,
          role, is_active, created_at, updated_at)
       SELECT ?, ?, ?, NULL, 0, 0, ?, 1, ?, ?
        WHERE NOT EXISTS (SELECT 1 FROM users WHERE lower(email) = ?)`,
    )
    .bind(crypto.randomUUID(), VISITOR_NAME, VISITOR_LOGIN, VISITOR_DB_ROLE, now, now, VISITOR_LOGIN)
    .run();
  const user = await getUserByEmail(db, VISITOR_LOGIN);
  if (!user || user.role !== VISITOR_DB_ROLE || !user.is_active) return null;

  // Segredo novo (primeiro login ou rotação): só o vencedor da corrida grava a
  // impressão digital e revoga as sessões emitidas ANTES deste instante; quem
  // perde a corrida não revoga, então não derruba a sessão recém-criada de outro.
  if (user.password_hash !== fingerprint) {
    const cutoff = new Date().toISOString();
    const updated = await db
      .prepare(
        `UPDATE users SET password_hash = ?, updated_at = ?
          WHERE id = ? AND role = ? AND (password_hash IS NULL OR password_hash != ?)`,
      )
      .bind(fingerprint, cutoff, user.id, VISITOR_DB_ROLE, fingerprint)
      .run();
    if ((updated.meta?.changes ?? 0) === 1) {
      await db
        .prepare(
          `UPDATE auth_refresh_sessions
              SET revoked_at = ?, revoke_reason = 'account_disabled'
            WHERE user_id = ? AND revoked_at IS NULL AND created_at <= ?`,
        )
        .bind(cutoff, user.id, cutoff)
        .run();
    }
  }
  return { ...user, password_hash: fingerprint };
}

/**
 * Allowlist do visitante. Tudo o que não está aqui é 403, qualquer método.
 * Só a leitura da própria sessão. (Login, refresh, logout, health e version já
 * são públicos e nem chegam a este gate.) A UI não chama clínicas nem perfil
 * para o visitante; um 403 aqui não dispara renovação de sessão no cliente.
 */
const VISITOR_ALLOWED_REQUESTS: ReadonlyArray<readonly [string, string]> = [
  ["GET", "/api/auth/me"],
];

export function visitorApiAllowed(method: string, path: string): boolean {
  const normalized = path.replace(/\/+$/, "") || "/";
  const verb = method.toUpperCase();
  return VISITOR_ALLOWED_REQUESTS.some(([m, p]) => m === verb && p === normalized);
}
