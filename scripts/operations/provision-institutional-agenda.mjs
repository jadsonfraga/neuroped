/** One-time, audited internal access for the configured institutional owner (#1039).
 * Not an auth bypass, paid subscription, migration, or patient-data backfill.
 */
import { createHash } from 'node:crypto';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const fail = (code) => { throw new Error(`AGENDA_SETUP_${code}`); };
const marker = 'institutional-agenda-v1';

export async function provisionInstitutionalAgenda({ query, batch }, { ownerEmail, e2eEmail, apply = false, runId = 'local-test' }) {
  const email = String(ownerEmail ?? '').trim().toLowerCase();
  const reserved = String(e2eEmail ?? '').trim().toLowerCase();
  if (!email || !reserved || email === reserved) fail('OWNER_IDENTITY_REQUIRED');
  const users = await query('SELECT id, role, is_active FROM users WHERE lower(email) = ?', [email]);
  if (users.length !== 1 || users[0].role !== 'admin' || users[0].is_active !== 1) fail('OWNER_NOT_UNIQUE_ACTIVE_ADMIN');
  const userId = users[0].id;
  const suffix = createHash('sha256').update(`neuroped:institutional:${userId}`).digest('hex').slice(0, 24);
  const clinicId = `institutional-${suffix}`;
  const customerId = `internal-${suffix}`;
  const auditId = `${marker}-${suffix}`;
  const slug = `neuroped-sdg-${suffix.slice(0, 12)}`;
  const invariant = async () => {
    const rows = await query(`SELECT c.status AS clinic_status, c.created_by_user_id, cm.user_id, cm.role, cm.active,
      bc.provider, bc.status AS customer_status, bc.provider_customer_id, bc.trial_ends_at,
      (SELECT COUNT(*) FROM billing_subscriptions WHERE customer_id = bc.id) AS subscriptions,
      (SELECT COUNT(*) FROM saas_audit_log WHERE id = ? AND clinic_id = c.id AND actor_user_id = cm.user_id AND action = 'institutional_internal_access_granted') AS audit_count,
      (SELECT COUNT(*) FROM clinic_memberships WHERE user_id = ? AND active = 1) AS active_memberships
      FROM clinics c JOIN clinic_memberships cm ON cm.clinic_id = c.id AND cm.user_id = ?
      JOIN billing_customers bc ON bc.clinic_id = c.id AND bc.id = ? WHERE c.id = ?`,
      [auditId, userId, userId, customerId, clinicId]);
    const r = rows[0];
    return rows.length === 1 && r.clinic_status === 'active' && r.created_by_user_id === userId && r.user_id === userId
      && r.role === 'owner' && r.active === 1 && r.provider === 'none' && r.customer_status === 'active'
      && r.provider_customer_id === null && r.trial_ends_at === null && r.subscriptions === 0 && r.audit_count === 1 && r.active_memberships === 1;
  };
  const existing = await query('SELECT id FROM saas_audit_log WHERE id = ?', [auditId]);
  if (existing.length) {
    if (!await invariant()) fail('EXISTING_SETUP_CHANGED_REVIEW_REQUIRED');
    return { status: 'already_configured', scope: 'institutional_owner_only', internalNonBillable: true, subscriptionsCreated: 0, clinicalRowsChanged: 0, writes: 0 };
  }
  const counts = (await query(`SELECT
    (SELECT COUNT(*) FROM clinic_memberships WHERE user_id = ?) AS memberships,
    (SELECT COUNT(*) FROM clinics WHERE created_by_user_id = ?) AS owned_clinics,
    (SELECT COUNT(*) FROM clinics WHERE id = ? OR slug = ?) AS target_conflicts`, [userId, userId, clinicId, slug]))[0];
  if (!counts || counts.memberships !== 0 || counts.owned_clinics !== 0 || counts.target_conflicts !== 0) fail('EXISTING_CONTEXT_REQUIRES_RECONCILIATION');
  if (!apply) return {status: 'ready_to_apply', scope: 'institutional_owner_only', writes: 0};

  // The first SELECT is evaluated INSIDE the same D1 batch transaction as all
  // INSERTs. json(invalid) deliberately aborts the batch if a precondition raced.
  const guard = `SELECT CASE WHEN
    (SELECT COUNT(*) FROM users WHERE id = ? AND lower(email) = ? AND role = 'admin' AND is_active = 1) = 1
    AND (SELECT COUNT(*) FROM clinic_memberships WHERE user_id = ?) = 0
    AND (SELECT COUNT(*) FROM clinics WHERE created_by_user_id = ? OR id = ? OR slug = ?) = 0
    THEN 1 ELSE json('AGENDA_SETUP_PRECONDITION_FAILED') END AS ok`;
  const metadata = JSON.stringify({ version: 1, issue: 1039, reason: 'owner_requested_internal_use', source: marker, runId,
    billingProvider: 'none', paidSubscription: false, clinicalDataMigrated: false });
  await batch([
    { sql: guard, params: [userId, email, userId, userId, clinicId, slug] },
    { sql: `INSERT INTO clinics (id, slug, name, legal_name, timezone, status, created_by_user_id)
      VALUES (?, ?, 'NeuroPed SDG', 'Fraga Serviços Médicos LTDA', 'America/Recife', 'active', ?)`, params: [clinicId, slug, userId] },
    { sql: `INSERT INTO clinic_memberships (clinic_id, user_id, role, active, invited_by_user_id)
      VALUES (?, ?, 'owner', 1, ?)`, params: [clinicId, userId, userId] },
    // provider=none is the existing domain's internal/non-billable account.
    // No invoice, payment, external customer or paid subscription is fabricated.
    { sql: `INSERT INTO billing_customers (id, clinic_id, provider, status, provider_customer_id, trial_ends_at)
      VALUES (?, ?, 'none', 'active', NULL, NULL)`, params: [customerId, clinicId] },
    { sql: `INSERT INTO saas_audit_log (id, clinic_id, actor_user_id, action, target_type, target_id, metadata_json)
      VALUES (?, ?, ?, 'institutional_internal_access_granted', 'clinic', ?, ?)`, params: [auditId, clinicId, userId, clinicId, metadata] },
  ]);
  if (!await invariant()) fail('POSTCONDITION_NOT_PROVEN');
  return {status: 'configured', scope: 'institutional_owner_only', internalNonBillable: true, subscriptionsCreated: 0,
    clinicalRowsChanged: 0, ownerMembershipVerified: true, writes: 4};
}

async function main() {
  const output = 'artifacts/agenda-setup/result.json';
  mkdirSync('artifacts/agenda-setup', {recursive:true});
  let mutationAttempted = false;
  const save = data => writeFileSync(output, JSON.stringify({checkedAt:new Date().toISOString(), commit:process.env.GITHUB_SHA, run:process.env.GITHUB_RUN_ID, ...data},null,2));
  try {
    if (process.env.GITHUB_REPOSITORY !== 'jadsonfraga/neuroped' || process.env.GITHUB_REF !== 'refs/heads/main') fail('TRUSTED_MAIN_REQUIRED');
    if (!process.argv.includes('--apply')) fail('EXPLICIT_APPLY_REQUIRED');
    const account=process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
    const token=process.env.CLOUDFLARE_API_TOKEN?.trim();
    if (!account || !token) fail('CREDENTIALS_UNAVAILABLE');
    const databaseId=/database_id\s*=\s*"([a-f0-9-]+)"/.exec(readFileSync('wrangler.toml','utf8'))?.[1];
    if (!databaseId) fail('DATABASE_ID_MISSING');
    async function cf(path, body) {
      const response=await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}${path}`, {
        method:body?'POST':'GET', headers:{Authorization:`Bearer ${token}`, 'Content-Type':'application/json'},
        body:body?JSON.stringify(body):undefined, signal:AbortSignal.timeout(30000),
      });
      const data=await response.json().catch(()=>null);
      if (!response.ok || data?.success !== true) fail('PROVIDER_REQUEST_FAILED');
      return data.result;
    }
    const project=await cf('/pages/projects/neuroped');
    if (project?.name !== 'neuroped' || project?.deployment_configs?.production?.d1_databases?.DB?.id !== databaseId) fail('CANONICAL_BINDING_MISMATCH');
    const path=`/d1/database/${databaseId}/query`;
    const adapter={
      query: async (sql,params=[]) => {
        if (!/^SELECT\s/i.test(sql) || sql.includes(';')) fail('READ_QUERY_REQUIRED');
        const result=await cf(path,{sql,params});
        if (result?.length !== 1 || result[0].success !== true) fail('QUERY_FAILED');
        return result[0].results;
      },
      batch: async (statements) => {
        mutationAttempted=true;
        const result=await cf(path,{batch:statements});
        if (result?.length !== statements.length || result.some(item=>item.success !== true)) fail('ATOMIC_BATCH_FAILED');
      },
    };
    const result=await provisionInstitutionalAgenda(adapter, {ownerEmail:process.env.INSTITUTIONAL_OWNER_EMAIL,e2eEmail:process.env.NEUROPED_E2E_EMAIL,apply:true,runId:process.env.GITHUB_RUN_ID});
    save(result); console.log(JSON.stringify(result));
  } catch(error) {
    const code=/^AGENDA_SETUP_[A-Z_]+$/.test(error?.message||'')?error.message:'AGENDA_SETUP_FAILED';
    save({status:'blocked',code,mutationAttempted}); console.error(code); process.exitCode=1;
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) await main();
