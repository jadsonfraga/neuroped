/**
 * scaleMigration.ts — Batch 1 Phase 2 Migration Utility
 *
 * Applies Phase 2 scale reclassification from scaleBatch1Migration.ts
 * to existing scales in scaleFilter.ts.
 *
 * Responsibilities:
 * 1. Match Batch 1 entries to existing scales by ID
 * 2. Apply respondente_novo and tarefa_tipo classifications
 * 3. Validate against absolute rules (TOCTOU safety)
 * 4. Generate audit report (before/after state)
 * 5. Export migration patch for manual review/approval
 */

import {
  scaleBatch1Complete,
  ScaleBatch1Entry,
  scaleBatch1Stats,
} from "./scaleBatch1Migration";
import {
  validateAbsoluteRule,
  type RespondentType,
  type TarefaTipo,
} from "../types/scaleClassification";
import type { ScaleEntry } from "./scaleFilter";

/**
 * ScaleEntryV2 — Extended ScaleEntry with Phase 2 classifications
 * Maintains backward compatibility with existing ScaleEntry while adding new fields.
 */
export interface ScaleEntryV2 extends ScaleEntry {
  respondente_novo?: RespondentType;
  tarefa_tipo?: TarefaTipo;
  migration_batch?: "1a" | "1b" | "1c" | "1d" | "1e";
  migration_status?: "success" | "validation_warning" | "validation_error";
  migration_notes?: string;
}

/**
 * Audit report entry showing before/after state for one scale
 */
export interface MigrationAuditEntry {
  id: string;
  name: string;
  lote: string;
  respondente_old: string[];
  respondente_novo: RespondentType;
  tarefa_tipo: TarefaTipo;
  validation_status: "pass" | "warning" | "error";
  validation_message?: string;
  justificacao: string;
}

/**
 * Summary statistics for migration run
 */
export interface MigrationSummary {
  total_batch1_entries: number;
  total_processed: number;
  total_validated: number;
  total_passed: number;
  total_warnings: number;
  total_errors: number;
  distribution_by_lote: Record<string, number>;
  distribution_by_respondent: Record<RespondentType, number>;
  distribution_by_tarefa: Record<TarefaTipo, number>;
}

/**
 * Applies Batch 1 migration data to a scale entry
 * Returns ScaleEntryV2 with classifications + validation status
 */
export function applyBatch1Classification(
  scaleId: string,
  existingScale: ScaleEntry,
  batch1Entry: ScaleBatch1Entry
): ScaleEntryV2 {
  const v2: ScaleEntryV2 = {
    ...existingScale,
    respondente_novo: batch1Entry.respondente_novo,
    tarefa_tipo: batch1Entry.tarefa_tipo,
    migration_batch: batch1Entry.lote,
  };

  // Validate using absolute rules
  const validationResult = validateAbsoluteRule(
    batch1Entry.respondente_novo,
    batch1Entry.tarefa_tipo,
    scaleId
  );

  v2.migration_status = validationResult.valid ? "success" : "validation_error";
  if (!validationResult.valid) {
    v2.migration_notes = validationResult.errors.join("; ");
  }

  return v2;
}

/**
 * Generates audit report for all Batch 1 entries
 */
export function generateMigrationAudit(
  batch1Entries: ScaleBatch1Entry[],
  scaleMap: Map<string, ScaleEntry>
): {
  audit: MigrationAuditEntry[];
  summary: MigrationSummary;
} {
  const audit: MigrationAuditEntry[] = [];
  const summary: MigrationSummary = {
    total_batch1_entries: batch1Entries.length,
    total_processed: 0,
    total_validated: 0,
    total_passed: 0,
    total_warnings: 0,
    total_errors: 0,
    distribution_by_lote: {},
    distribution_by_respondent: {},
    distribution_by_tarefa: {},
  };

  for (const batch1Entry of batch1Entries) {
    const existingScale = scaleMap.get(batch1Entry.id);
    if (!existingScale) {
      console.warn(
        `[Migration] Scale not found in scaleFilter: ${batch1Entry.id}`
      );
      continue;
    }

    summary.total_processed++;

    // Apply classification and validate
    const v2 = applyBatch1Classification(
      batch1Entry.id,
      existingScale,
      batch1Entry
    );

    const validation = validateAbsoluteRule(
      batch1Entry.respondente_novo,
      batch1Entry.tarefa_tipo,
      batch1Entry.id
    );

    summary.total_validated++;

    const auditEntry: MigrationAuditEntry = {
      id: batch1Entry.id,
      name: existingScale.name,
      lote: batch1Entry.lote,
      respondente_old: existingScale.respondente,
      respondente_novo: batch1Entry.respondente_novo,
      tarefa_tipo: batch1Entry.tarefa_tipo,
      validation_status: validation.valid ? "pass" : "error",
      validation_message: validation.valid
        ? undefined
        : validation.errors.join("; "),
      justificacao: batch1Entry.justificacao,
    };

    if (validation.valid) {
      summary.total_passed++;
      audit.push(auditEntry);
    } else {
      summary.total_errors++;
      audit.push(auditEntry);
    }

    // Track distributions
    summary.distribution_by_lote[batch1Entry.lote] =
      (summary.distribution_by_lote[batch1Entry.lote] || 0) + 1;
    summary.distribution_by_respondent[batch1Entry.respondente_novo] =
      (summary.distribution_by_respondent[batch1Entry.respondente_novo] || 0) +
      1;
    summary.distribution_by_tarefa[batch1Entry.tarefa_tipo] =
      (summary.distribution_by_tarefa[batch1Entry.tarefa_tipo] || 0) + 1;
  }

  return { audit, summary };
}

/**
 * Formats migration audit for display
 */
export function formatMigrationReport(
  audit: MigrationAuditEntry[],
  summary: MigrationSummary
): string {
  let report = `
═══════════════════════════════════════════════════════════════
Phase 2 Batch 1 Migration Audit Report
═══════════════════════════════════════════════════════════════

SUMMARY
───────────────────────────────────────────────────────────────
Total Batch 1 entries:     ${summary.total_batch1_entries}
Total processed:           ${summary.total_processed}
Total validated:           ${summary.total_validated}
Total passed validation:    ${summary.total_passed}
Total warnings:            ${summary.total_warnings}
Total errors:              ${summary.total_errors}

PASS RATE: ${summary.total_processed > 0 ? ((summary.total_passed / summary.total_processed) * 100).toFixed(1) : "N/A"}%

DISTRIBUTION BY LOTE
───────────────────────────────────────────────────────────────
`;

  for (const [lote, count] of Object.entries(summary.distribution_by_lote)) {
    report += `${lote}: ${count} scales\n`;
  }

  report += `
DISTRIBUTION BY RESPONDENT TYPE
───────────────────────────────────────────────────────────────
`;
  for (const [respondent, count] of Object.entries(
    summary.distribution_by_respondent
  )) {
    report += `${respondent}: ${count} scales\n`;
  }

  report += `
DISTRIBUTION BY TASK TYPE
───────────────────────────────────────────────────────────────
`;
  for (const [tarefa, count] of Object.entries(summary.distribution_by_tarefa)) {
    report += `${tarefa}: ${count} scales\n`;
  }

  report += `
DETAILED AUDIT ENTRIES
───────────────────────────────────────────────────────────────
`;

  for (const entry of audit) {
    const icon =
      entry.validation_status === "pass"
        ? "✓"
        : entry.validation_status === "warning"
          ? "⚠"
          : "✗";
    report += `
${icon} ${entry.id.toUpperCase()} — ${entry.name}
  Lote:              ${entry.lote}
  Old Respondent:    ${entry.respondente_old.join(", ")}
  New Respondent:    ${entry.respondente_novo}
  Task Type:         ${entry.tarefa_tipo}
  Validation:        ${entry.validation_status.toUpperCase()}${
    entry.validation_message ? ` — ${entry.validation_message}` : ""
  }
  Justification:     ${entry.justificacao}
`;
  }

  report += `
═══════════════════════════════════════════════════════════════
`;

  return report;
}

/**
 * Export for use in integration (will be called from scale loading logic)
 */
export { scaleBatch1Complete, scaleBatch1Stats };
