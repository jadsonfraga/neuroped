/**
 * Acesso de visitante: uma identidade compartilhada que só abre as escalas.
 *
 * Desenho (fail-closed, deny-by-default):
 * - a conta só existe e só autentica enquanto `NEUROPED_VISITOR_PASSWORD` estiver
 *   definido no ambiente. Remover o segredo desliga o login E derruba as sessões
 *   já emitidas (o middleware reavalia o segredo a cada requisição);
 * - a senha NUNCA é gravada no banco nem no repositório: a autenticação compara a
 *   senha enviada com o segredo do ambiente em tempo constante, e a linha em
 *   `users` nasce sem `password_hash`. Nenhum outro caminho (login comum,
 *   recuperação de senha, troca de senha) consegue autenticá-la ou alterá-la;
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
export async function ensureVisitorAccount(db: D1Database): Promise<UserRow | null> {
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
  return user;
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
