import { hashPassword, verifyPassword } from "./_crypto";
import { getUserByEmail, isLocked, type Env } from "./_shared";

/**
 * Mantém a identidade técnica E2E reservada aos smokes pós-deploy.
 * A sentinela é sempre `reader`, nunca possui clinic_membership e só pode ser
 * criada, recuperada ou rotacionada quando a própria credencial E2E atual foi
 * apresentada. Guardas SQL atômicas fecham janelas TOCTOU com memberships.
 */
export async function bootstrapHardenedE2EAccount(
  db: D1Database,
  env: Env,
  presentedPassword?: string,
): Promise<void> {
  const email = env.NEUROPED_E2E_EMAIL?.toLowerCase().trim();
  const password = env.NEUROPED_E2E_PASSWORD;
  if (!email || !password) return;
  if (presentedPassword !== password) {
    throw new Error("E2E_CREDENTIAL_MISMATCH");
  }

  const adminEmail = env.ADMIN_EMAIL?.toLowerCase().trim();
  if (adminEmail && email === adminEmail) {
    throw new Error("E2E_ACCOUNT_COLLIDES_WITH_ADMIN");
  }

  const existing = await getUserByEmail(db, email);
  const now = new Date().toISOString();

  if (existing) {
    if (existing.role !== "reader") {
      throw new Error("E2E_ACCOUNT_ROLE_INVALID");
    }

    const membership = await db
      .prepare(
        `SELECT 1 AS has_membership
           FROM clinic_memberships
          WHERE user_id = ?
          LIMIT 1`,
      )
      .bind(existing.id)
      .first<{ has_membership: number }>();
    if (membership) {
      throw new Error("E2E_ACCOUNT_HAS_CLINIC_MEMBERSHIP");
    }

    const passwordMatches = existing.password_hash
      ? await verifyPassword(password, existing.password_hash)
      : false;
    const ready =
      passwordMatches &&
      existing.is_active === 1 &&
      !existing.must_change_password &&
      !isLocked(existing);

    if (ready) {
      const guard = await db
        .prepare(
          `UPDATE users
              SET updated_at = updated_at
            WHERE id = ?
              AND role = 'reader'
              AND NOT EXISTS (
                SELECT 1 FROM clinic_memberships cm WHERE cm.user_id = users.id
              )`,
        )
        .bind(existing.id)
        .run();
      if ((guard.meta?.changes ?? 0) !== 1) {
        throw new Error("E2E_ACCOUNT_MEMBERSHIP_RACE");
      }
      return;
    }

    const hash =
      passwordMatches && existing.password_hash
        ? existing.password_hash
        : await hashPassword(password);

    const results = await db.batch([
      db
        .prepare(
          `UPDATE users
              SET password_hash = ?, is_active = 1, must_change_password = 0,
                  failed_login_attempts = 0, locked_until = NULL, updated_at = ?
            WHERE id = ?
              AND role = 'reader'
              AND NOT EXISTS (
                SELECT 1 FROM clinic_memberships cm WHERE cm.user_id = users.id
              )`,
        )
        .bind(hash, now, existing.id),
      db
        .prepare(
          `DELETE FROM auth_refresh_sessions
            WHERE user_id = ?
              AND EXISTS (
                SELECT 1 FROM users u
                 WHERE u.id = ?
                   AND u.role = 'reader'
                   AND u.password_hash = ?
                   AND NOT EXISTS (
                     SELECT 1 FROM clinic_memberships cm WHERE cm.user_id = u.id
                   )
              )`,
        )
        .bind(existing.id, existing.id, hash),
    ]);

    if ((results[0]?.meta?.changes ?? 0) !== 1) {
      throw new Error("E2E_ACCOUNT_MEMBERSHIP_RACE");
    }
    return;
  }

  const id = crypto.randomUUID();
  const name = env.NEUROPED_E2E_NAME || "Conta técnica E2E";
  const hash = await hashPassword(password);
  try {
    await db
      .prepare(
        `INSERT INTO users (id, name, email, role, is_active, password_hash,
                must_change_password, failed_login_attempts, created_at, updated_at)
         VALUES (?, ?, ?, 'reader', 1, ?, 0, 0, ?, ?)`,
      )
      .bind(id, name, email, hash, now, now)
      .run();
  } catch (error) {
    const winner = await getUserByEmail(db, email);
    if (!winner || winner.role !== "reader") {
      throw error;
    }
    const guard = await db
      .prepare(
        `UPDATE users
            SET updated_at = updated_at
          WHERE id = ?
            AND role = 'reader'
            AND NOT EXISTS (
              SELECT 1 FROM clinic_memberships cm WHERE cm.user_id = users.id
            )`,
      )
      .bind(winner.id)
      .run();
    if ((guard.meta?.changes ?? 0) !== 1) {
      throw new Error("E2E_ACCOUNT_MEMBERSHIP_RACE", { cause: error });
    }
  }
}
