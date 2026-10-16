import {
  ASSUMPTION_DOC_TYPES,
  FEATURE_ACTION_LABELS,
  NOT_MEASURED,
  estimateTimeSaved,
  rate,
  type Assumptions,
  type AssumptionDocType,
} from "../../../../shared/outcomes";

type Db = D1Database;

interface Range {
  from: string;
  to: string;
}

function iso(d: Date): string {
  return d.toISOString();
}

/** Tolerante a tabela ausente: devolve null (bloco "indisponível"), nunca derruba o painel. */
async function safe<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/no such table|no such column/i.test(message)) return null;
    throw error;
  }
}

const D = (col: string) => `datetime(${col})`;

async function one(db: Db, sql: string, ...binds: unknown[]): Promise<number> {
  const row = await db.prepare(sql).bind(...binds).first<{ n: number }>();
  return Number(row?.n ?? 0);
}

async function patientsBlock(db: Db, clinicId: string, r: Range) {
  return safe(async () => {
    const encounters = await one(
      db,
      `SELECT COUNT(*) AS n FROM live_clinical_events WHERE clinic_id = ? AND event_type = 'encounter' AND status = 'active' AND ${D("occurred_at")} >= ${D("?")} AND ${D("occurred_at")} < ${D("?")}`,
      clinicId, r.from, r.to,
    );
    const attended = await one(
      db,
      `SELECT COUNT(DISTINCT patient_id) AS n FROM live_clinical_events WHERE clinic_id = ? AND event_type = 'encounter' AND status = 'active' AND ${D("occurred_at")} >= ${D("?")} AND ${D("occurred_at")} < ${D("?")}`,
      clinicId, r.from, r.to,
    );
    const returning = await one(
      db,
      `SELECT COUNT(DISTINCT e.patient_id) AS n FROM live_clinical_events e
        WHERE e.clinic_id = ? AND e.event_type = 'encounter' AND e.status = 'active'
          AND ${D("e.occurred_at")} >= ${D("?")} AND ${D("e.occurred_at")} < ${D("?")}
          AND EXISTS (SELECT 1 FROM live_clinical_events p WHERE p.clinic_id = e.clinic_id AND p.patient_id = e.patient_id
                       AND p.event_type = 'encounter' AND p.status = 'active' AND ${D("p.occurred_at")} < ${D("?")})`,
      clinicId, r.from, r.to, r.from,
    );
    const newPatients = await one(
      db,
      `SELECT COUNT(*) AS n FROM live_patients WHERE clinic_id = ? AND ${D("created_at")} >= ${D("?")} AND ${D("created_at")} < ${D("?")}`,
      clinicId, r.from, r.to,
    );
    return { encounters, attended, returning, firstTime: Math.max(0, attended - returning), newPatients };
  });
}

async function documentsBlock(db: Db, clinicId: string, r: Range) {
  return safe(async () => {
    const rows = await db
      .prepare(
        `SELECT document_type AS t, COUNT(*) AS n FROM live_documents
          WHERE clinic_id = ? AND status IN ('published','superseded') AND ${D("created_at")} >= ${D("?")} AND ${D("created_at")} < ${D("?")}
          GROUP BY document_type`,
      )
      .bind(clinicId, r.from, r.to)
      .all<{ t: string; n: number }>();
    const byType: Record<string, number> = {};
    let total = 0;
    for (const row of rows.results ?? []) {
      byType[row.t] = Number(row.n);
      total += Number(row.n);
    }
    const assessments = (await safe(() => one(db, `SELECT COUNT(*) AS n FROM live_assessments WHERE clinic_id = ? AND status <> 'voided' AND ${D("applied_at")} >= ${D("?")} AND ${D("applied_at")} < ${D("?")}`, clinicId, r.from, r.to))) ?? 0;
    return { total, byType, assessmentsApplied: assessments };
  });
}

async function portalBlock(db: Db, clinicId: string, r: Range) {
  return safe(async () => {
    const row = await db
      .prepare(
        `SELECT COUNT(*) AS created,
                SUM(CASE WHEN first_consented_at IS NOT NULL THEN 1 ELSE 0 END) AS consented,
                SUM(CASE WHEN view_count > 0 THEN 1 ELSE 0 END) AS opened,
                SUM(CASE WHEN status = 'revoked' THEN 1 ELSE 0 END) AS revoked
           FROM family_portal_shares WHERE clinic_id = ? AND ${D("created_at")} >= ${D("?")} AND ${D("created_at")} < ${D("?")}`,
      )
      .bind(clinicId, r.from, r.to)
      .first<{ created: number; consented: number | null; opened: number | null; revoked: number | null }>();
    const created = Number(row?.created ?? 0);
    const consented = Number(row?.consented ?? 0);
    const opened = Number(row?.opened ?? 0);
    const denied = await one(
      db,
      `SELECT COUNT(*) AS n FROM family_portal_audit_log WHERE clinic_id = ? AND action LIKE 'denied_%' AND ${D("created_at")} >= ${D("?")} AND ${D("created_at")} < ${D("?")}`,
      clinicId, r.from, r.to,
    );
    return { linksCreated: created, consented, opened, revoked: Number(row?.revoked ?? 0), deniedAccesses: denied, adherencePct: rate(opened, created), consentPct: rate(consented, created) };
  });
}

async function invitationsBlock(db: Db, clinicId: string, r: Range) {
  const count = (table: string) =>
    safe(async () => {
      const row = await db
        .prepare(`SELECT COUNT(*) AS created, SUM(CASE WHEN status = 'submitted' THEN 1 ELSE 0 END) AS submitted FROM ${table} WHERE clinic_id = ? AND ${D("created_at")} >= ${D("?")} AND ${D("created_at")} < ${D("?")}`)
        .bind(clinicId, r.from, r.to)
        .first<{ created: number; submitted: number | null }>();
      const created = Number(row?.created ?? 0);
      const submitted = Number(row?.submitted ?? 0);
      return { created, submitted, responsePct: rate(submitted, created) };
    });
  return { intake: await count("live_intake_invitations"), scale: await count("live_scale_invitations") };
}

async function aiBlock(db: Db, clinicId: string, r: Range) {
  return safe(async () => {
    const rows = await db
      .prepare(
        `SELECT purpose AS purpose, family_status AS fs, human_reviewed AS hr, COUNT(*) AS n FROM ai_use_records
          WHERE clinic_id = ? AND ${D("used_at")} >= ${D("?")} AND ${D("used_at")} < ${D("?")} GROUP BY purpose, family_status, human_reviewed`,
      )
      .bind(clinicId, r.from, r.to)
      .all<{ purpose: string; fs: string; hr: number; n: number }>();
    let total = 0, informed = 0, reviewed = 0;
    const byPurpose: Record<string, number> = {};
    for (const x of rows.results ?? []) {
      const n = Number(x.n);
      total += n;
      byPurpose[x.purpose] = (byPurpose[x.purpose] ?? 0) + n;
      if (x.fs === "informada") informed += n;
      if (x.hr === 1) reviewed += n;
    }
    return { total, byPurpose, familyInformedPct: rate(informed, total), humanReviewedPct: rate(reviewed, total) };
  });
}

async function featureBlock(db: Db, clinicId: string, r: Range) {
  return safe(async () => {
    const actions = Object.keys(FEATURE_ACTION_LABELS);
    const marks = actions.map(() => "?").join(", ");
    const rows = await db
      .prepare(`SELECT action AS a, COUNT(*) AS n FROM saas_audit_log WHERE clinic_id = ? AND action IN (${marks}) AND ${D("created_at")} >= ${D("?")} AND ${D("created_at")} < ${D("?")} GROUP BY action`)
      .bind(clinicId, ...actions, r.from, r.to)
      .all<{ a: string; n: number }>();
    const counts = new Map((rows.results ?? []).map((x) => [x.a, Number(x.n)]));
    return actions.map((a) => ({ action: a, label: FEATURE_ACTION_LABELS[a], count: counts.get(a) ?? 0 }));
  });
}

export async function readAssumptions(db: Db, clinicId: string): Promise<{ available: boolean; values: Assumptions }> {
  const rows = await safe(() =>
    db.prepare(`SELECT doc_type AS t, minutes_saved AS m FROM clinic_metrics_assumptions WHERE clinic_id = ?`).bind(clinicId).all<{ t: string; m: number }>(),
  );
  if (!rows) return { available: false, values: {} };
  const values: Assumptions = {};
  for (const row of rows.results ?? []) {
    if ((ASSUMPTION_DOC_TYPES as readonly string[]).includes(row.t)) values[row.t as AssumptionDocType] = Number(row.m);
  }
  return { available: true, values };
}

export async function readOutcomes(db: Db, clinicId: string, days: number, now: Date = new Date()) {
  const to = now;
  const from = new Date(now.getTime() - days * 86_400_000);
  const prevFrom = new Date(from.getTime() - days * 86_400_000);
  const current: Range = { from: iso(from), to: iso(to) };
  const previous: Range = { from: iso(prevFrom), to: iso(from) };

  const [patients, prevPatients, documents, prevDocuments, portal, invitations, ai, features, assumptions] = await Promise.all([
    patientsBlock(db, clinicId, current),
    patientsBlock(db, clinicId, previous),
    documentsBlock(db, clinicId, current),
    documentsBlock(db, clinicId, previous),
    portalBlock(db, clinicId, current),
    invitationsBlock(db, clinicId, current),
    aiBlock(db, clinicId, current),
    featureBlock(db, clinicId, current),
    readAssumptions(db, clinicId),
  ]);

  const timeSaved = documents ? estimateTimeSaved(documents.byType as Partial<Record<AssumptionDocType, number>>, assumptions.values) : null;

  return {
    clinicId,
    windowDays: days,
    period: current,
    previousPeriod: previous,
    containsPatientIdentifiers: false as const,
    patients: patients && { ...patients, previous: prevPatients },
    documents: documents && { ...documents, previousTotal: prevDocuments?.total ?? null },
    timeSaved: timeSaved && { ...timeSaved, assumptionsAvailable: assumptions.available, assumptions: assumptions.values },
    portal,
    invitations,
    ai,
    features,
    notMeasured: NOT_MEASURED,
  };
}
