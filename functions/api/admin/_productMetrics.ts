/**
 * Agregados de uso do produto — DAU/WAU/MAU, funil de ativação e proxy de
 * retenção — computados a partir de colunas que já existem no schema.
 *
 * Por que não existe um "6º ledger": o repositório já tem cinco tabelas de
 * auditoria (`audit_logs`, `operations_audit_log`, `saas_audit_log`,
 * `saas_audit_events`, `public_submission_audit_log`), nenhuma pensada para
 * produto e nenhuma agregada em lugar nenhum. Login bem-sucedido já grava
 * `users.last_login_at` (`registerSuccessfulLogin`, auth/_shared.ts); conta
 * nova já grava `users.created_at`; clínica nova já grava `clinics.created_at`;
 * posse de e-mail já grava `users.email_verified_at` (0024). Os primitivos já
 * existem, espalhados. Criar uma tabela de eventos paralela fragmentaria
 * "onde eu olho para saber o que aconteceu" em dois lugares — o oposto da
 * doutrina de fonte única já seguida no resto do produto (ex.: o coletor de
 * exportação LGPD extraído para um módulo único em vez de duplicado).
 *
 * INVARIANTE: cada função aqui devolve CONTAGENS. Nenhuma linha de usuário,
 * nenhum e-mail, nenhum nome. Uma rota de métricas de produto não pode virar
 * canal de leitura de quem é quem.
 *
 * ESCOPO CLARO: isto cobre a SaaS clínica multi-tenant deste repositório —
 * login, cadastro, criação de clínica. Não cobre o app família (Portal
 * Família / "Vou Falar"), que é produto e possivelmente repositório distinto.
 */

/**
 * Contas de plataforma que não são cliente: `admin` é o operador da
 * instalação; `reader` é a identidade reservada da sentinela E2E
 * (bootstrapE2EAccount, auth/_shared.ts — role fixo 'reader', nunca ganha
 * membership de clínica). Uma sentinela que faz login em todo smoke test
 * inflaria DAU sozinha; excluir por role evita depender de comparar e-mail
 * contra variável de ambiente dentro da métrica.
 */
const CUSTOMER_ROLE_EXCLUSION = `role NOT IN ('admin', 'reader')`;

export interface ActivityWindowCounts {
  activeAccounts: number;
  newAccounts: number;
  newClinics: number;
}

export interface ActivationFunnel {
  windowDays: number;
  signedUp: number;
  emailVerified: number;
  ownsClinic: number;
}

export interface RetentionProxy {
  /**
   * Aproximação deliberada: `last_login_at` guarda só o login MAIS RECENTE,
   * não um histórico. "Ainda ativo 30 dias depois" aqui significa "o último
   * login registrado aconteceu 30+ dias após o cadastro" — não "logou
   * especificamente no dia 30". É a métrica honesta que a coluna permite,
   * não a métrica ideal que exigiria um ledger de eventos.
   */
  cohortSize: number;
  stillActiveAfter30d: number;
}

interface CountRow {
  total: number;
}

async function scalarCount(
  db: D1Database,
  sql: string,
  ...binds: unknown[]
): Promise<number> {
  const row = await db
    .prepare(sql)
    .bind(...binds)
    .first<CountRow>();
  return Number(row?.total ?? 0);
}

/**
 * Contas e clínicas ativas/criadas numa janela de `days` dias terminando
 * agora. `activeAccounts` é o proxy de DAU/WAU/MAU: distintas contas-cliente
 * com login registrado dentro da janela.
 */
export async function computeActivityWindow(
  db: D1Database,
  days: number,
): Promise<ActivityWindowCounts> {
  const [activeAccounts, newAccounts, newClinics] = await Promise.all([
    scalarCount(
      db,
      `SELECT COUNT(*) AS total FROM users
        WHERE ${CUSTOMER_ROLE_EXCLUSION} AND is_active = 1
          AND last_login_at IS NOT NULL
          AND julianday('now') - julianday(last_login_at) <= ?`,
      days,
    ),
    scalarCount(
      db,
      `SELECT COUNT(*) AS total FROM users
        WHERE ${CUSTOMER_ROLE_EXCLUSION}
          AND julianday('now') - julianday(created_at) <= ?`,
      days,
    ),
    scalarCount(
      db,
      `SELECT COUNT(*) AS total FROM clinics
        WHERE julianday('now') - julianday(created_at) <= ?`,
      days,
    ),
  ]);
  return { activeAccounts, newAccounts, newClinics };
}

/**
 * Funil de ativação para contas-cliente criadas nos últimos `windowDays`
 * dias: quantas verificaram o e-mail (0024) e quantas chegaram a criar ou
 * possuir uma clínica (`clinic_memberships`, qualquer papel — o funil mede
 * "chegou a ter clínica", não "é dona").
 */
export async function computeActivationFunnel(
  db: D1Database,
  windowDays: number,
): Promise<ActivationFunnel> {
  const [signedUp, emailVerified, ownsClinic] = await Promise.all([
    scalarCount(
      db,
      `SELECT COUNT(*) AS total FROM users
        WHERE ${CUSTOMER_ROLE_EXCLUSION}
          AND julianday('now') - julianday(created_at) <= ?`,
      windowDays,
    ),
    scalarCount(
      db,
      `SELECT COUNT(*) AS total FROM users
        WHERE ${CUSTOMER_ROLE_EXCLUSION}
          AND julianday('now') - julianday(created_at) <= ?
          AND email_verified_at IS NOT NULL`,
      windowDays,
    ),
    scalarCount(
      db,
      `SELECT COUNT(*) AS total FROM users u
        WHERE ${CUSTOMER_ROLE_EXCLUSION.replace("role", "u.role")}
          AND julianday('now') - julianday(u.created_at) <= ?
          AND EXISTS (
            SELECT 1 FROM clinic_memberships cm
             WHERE cm.user_id = u.id AND cm.active = 1
          )`,
      windowDays,
    ),
  ]);
  return { windowDays, signedUp, emailVerified, ownsClinic };
}

/**
 * Coorte fixa de 30-60 dias atrás: velha o bastante para uma janela de 30
 * dias já ter decorrido por inteiro (sem right-censoring — coorte de "7 dias
 * atrás" não pode ser julgada por retenção de 30 dias, porque os 30 dias
 * ainda não aconteceram).
 */
export async function computeRetentionProxy(
  db: D1Database,
): Promise<RetentionProxy> {
  const row = await db
    .prepare(
      `SELECT
         COUNT(*) AS cohort_size,
         SUM(CASE
               WHEN last_login_at IS NOT NULL
                AND julianday(last_login_at) - julianday(created_at) >= 30
               THEN 1 ELSE 0
             END) AS still_active
       FROM users
       WHERE ${CUSTOMER_ROLE_EXCLUSION}
         AND julianday('now') - julianday(created_at) >= 30
         AND julianday('now') - julianday(created_at) < 60`,
    )
    .first<{ cohort_size: number; still_active: number | null }>();
  return {
    cohortSize: Number(row?.cohort_size ?? 0),
    stillActiveAfter30d: Number(row?.still_active ?? 0),
  };
}
