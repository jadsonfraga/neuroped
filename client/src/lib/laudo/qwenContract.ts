import type {
  SuperCid,
  SuperEntrada,
  SuperHipotese,
  SuperPlanoItem,
  SuperSubsecaoHistoria,
} from "./modeloSuper";

export type QwenSectionStatus =
  | "complete"
  | "partial"
  | "not_provided"
  | "not_assessed"
  | "unknown";
export type QwenSourceKind =
  | "family_report"
  | "patient_report"
  | "school_report"
  | "therapy_report"
  | "direct_observation"
  | "instrument"
  | "external_document"
  | "complementary_exam"
  | "clinician_decision"
  | "clinical_inference"
  | "not_provided";

export interface QwenProvenance {
  source_kind: QwenSourceKind;
  source_label: string;
  source_date: string;
  informant: string;
  confidence: "high" | "medium" | "low" | "not_assessed";
}

export interface QwenFact {
  text: string;
  clinical_status:
    | "reported"
    | "observed"
    | "measured"
    | "documented"
    | "decided"
    | "inferred"
    | "not_provided"
    | "unknown";
  provenance: QwenProvenance;
}

export interface QwenSectionBase {
  status: QwenSectionStatus;
  narrative: string;
  provenance: QwenProvenance;
}

export interface QwenDiagnosis {
  label: string;
  status:
    | "firmed_by_clinician"
    | "working_hypothesis"
    | "screening_signal"
    | "differential"
    | "ruled_out"
    | "pending_code_validation";
  cid10: string;
  cid11: string;
  provenance: QwenProvenance;
  supporting_facts?: string[];
  limitations: string[];
}

export interface QwenDraft {
  schema_version: "neuroped-pant-1.0";
  document_status: "draft_for_clinician_review";
  case_metadata: {
    patient_label: string;
    date_of_birth?: string;
    age?: string;
    sex?: string;
    city_state?: string;
    evaluation_date: string;
    consultation_type?: string;
    protocol?: string;
    purpose: string;
    consent_state:
      | "authorized_minimum_dataset"
      | "pseudonymized"
      | "not_verified";
  };
  cover: { summary: string; cid_box: string };
  sections: {
    section_01: QwenSectionBase & {
      accompanied_by: string;
      interview_observation: string;
    };
    section_02: QwenSectionBase & { context: string };
    section_03: QwenSectionBase & {
      subsections: Array<{
        titulo: string;
        texto: string;
        provenance: QwenProvenance;
      }>;
    };
    section_04: QwenSectionBase & { divergences: string; documents: string };
    section_05: QwenSectionBase & {
      functioning: QwenFact[];
      needs_attention: QwenFact[];
    };
    section_06: QwenSectionBase & {
      hypotheses: Array<{
        titulo: string;
        texto: string;
        aFavor: string[];
        aPonderar: string[];
        provenance: QwenProvenance;
      }>;
    };
    section_07: QwenSectionBase & {
      exam_states: Array<{
        name: string;
        state: string;
        result: string;
        provenance: QwenProvenance;
      }>;
    };
    section_08: QwenSectionBase & { diagnoses: QwenDiagnosis[] };
    section_09: QwenSectionBase & {
      items: Array<{
        titulo: string;
        indicacao: string;
        evidencia: string;
        provenance: QwenProvenance;
      }>;
    };
    section_10: QwenSectionBase & {
      medication_plan: string;
      requests: QwenFact[];
    };
    section_11: QwenSectionBase;
    section_12: QwenSectionBase & {
      favorable: QwenFact[];
      expected: QwenFact[];
      reserved: QwenFact[];
    };
    section_13: QwenSectionBase & {
      alerts: QwenFact[];
      return_condition: string;
    };
    section_14: QwenSectionBase;
  };
  instruments: Array<{
    name: string;
    acronym: string;
    version: string;
    date: string;
    respondent: string;
    purpose: string;
    domain: string;
    raw_score: string;
    normative_score: string;
    classification: string;
    source: string;
    license_policy:
      | "embed_allowed_with_attribution"
      | "permission_required"
      | "link_only"
      | "not_provided";
    limitations: string[];
    provenance: QwenProvenance;
  }>;
  medications: Array<{
    name: string;
    presentation?: string;
    dose: string;
    route: string;
    frequency: string;
    duration: string;
    indication: string;
    adherence?: string;
    response?: string;
    adverse_effects?: string;
    provenance: QwenProvenance;
  }>;
  quality_gate: {
    status: "pass_with_review" | "blocked";
    checks: Array<{
      name: string;
      status: "pass" | "warning" | "fail";
      detail: string;
    }>;
    blocking_reasons: string[];
  };
  pending_clinician_review: Array<{
    field: string;
    reason: string;
    severity: "critical" | "high" | "medium" | "low";
    action: string;
  }>;
  sources: Array<{
    id: string;
    title: string;
    url_or_path: string;
    source_type:
      | "official"
      | "peer_reviewed"
      | "internal_project"
      | "copyrighted_reference"
      | "candidate";
    used_for: string;
    access_status:
      | "verified"
      | "metadata_only"
      | "not_accessed"
      | "pending_review";
  }>;
  rendered_text: string;
}

const REQUIRED_SECTION_KEYS = [
  "section_01",
  "section_02",
  "section_03",
  "section_04",
  "section_05",
  "section_06",
  "section_07",
  "section_08",
  "section_09",
  "section_10",
  "section_11",
  "section_12",
  "section_13",
  "section_14",
] as const;

const SECTION_STATUSES = new Set<QwenSectionStatus>([
  "complete",
  "partial",
  "not_provided",
  "not_assessed",
  "unknown",
]);
const DIAGNOSIS_STATUSES = new Set<QwenDiagnosis["status"]>([
  "firmed_by_clinician",
  "working_hypothesis",
  "screening_signal",
  "differential",
  "ruled_out",
  "pending_code_validation",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown, path: string, required = true): string {
  if (typeof value === "string") return value;
  if (!required && value === undefined) return "";
  throw new Error(`${path} deve ser texto`);
}

function recordValue(value: unknown, path: string): Record<string, unknown> {
  if (!isRecord(value)) throw new Error(`${path} deve ser objeto`);
  return value;
}

function arrayValue(value: unknown, path: string): unknown[] {
  if (!Array.isArray(value)) throw new Error(`${path} deve ser lista`);
  return value;
}

function assertProvenance(value: unknown, path: string): QwenProvenance {
  const p = recordValue(value, path);
  const sourceKinds = new Set<QwenSourceKind>([
    "family_report",
    "patient_report",
    "school_report",
    "therapy_report",
    "direct_observation",
    "instrument",
    "external_document",
    "complementary_exam",
    "clinician_decision",
    "clinical_inference",
    "not_provided",
  ]);
  const confidence = new Set(["high", "medium", "low", "not_assessed"]);
  const source_kind = stringValue(
    p.source_kind,
    `${path}.source_kind`,
  ) as QwenSourceKind;
  const source_confidence = stringValue(
    p.confidence,
    `${path}.confidence`,
  ) as QwenProvenance["confidence"];
  if (!sourceKinds.has(source_kind))
    throw new Error(`${path}.source_kind inválido`);
  if (!confidence.has(source_confidence))
    throw new Error(`${path}.confidence inválido`);
  return {
    source_kind,
    source_label: stringValue(p.source_label, `${path}.source_label`),
    source_date: stringValue(p.source_date, `${path}.source_date`),
    informant: stringValue(p.informant, `${path}.informant`),
    confidence: source_confidence,
  };
}

function assertFact(value: unknown, path: string): QwenFact {
  const f = recordValue(value, path);
  const statuses = new Set([
    "reported",
    "observed",
    "measured",
    "documented",
    "decided",
    "inferred",
    "not_provided",
    "unknown",
  ]);
  const clinical_status = stringValue(
    f.clinical_status,
    `${path}.clinical_status`,
  ) as QwenFact["clinical_status"];
  if (!statuses.has(clinical_status))
    throw new Error(`${path}.clinical_status inválido`);
  return {
    text: stringValue(f.text, `${path}.text`),
    clinical_status,
    provenance: assertProvenance(f.provenance, `${path}.provenance`),
  };
}

function assertSectionBase(value: unknown, path: string): QwenSectionBase {
  const s = recordValue(value, path);
  const status = stringValue(s.status, `${path}.status`) as QwenSectionStatus;
  if (!SECTION_STATUSES.has(status)) throw new Error(`${path}.status inválido`);
  return {
    status,
    narrative: stringValue(s.narrative, `${path}.narrative`),
    provenance: assertProvenance(s.provenance, `${path}.provenance`),
  };
}

function assertStringArray(value: unknown, path: string): string[] {
  return arrayValue(value, path).map((item, index) =>
    stringValue(item, `${path}[${index}]`),
  );
}

function assertDiagnosis(value: unknown, path: string): QwenDiagnosis {
  const d = recordValue(value, path);
  const status = stringValue(
    d.status,
    `${path}.status`,
  ) as QwenDiagnosis["status"];
  if (!DIAGNOSIS_STATUSES.has(status))
    throw new Error(`${path}.status inválido`);
  return {
    label: stringValue(d.label, `${path}.label`),
    status,
    cid10: stringValue(d.cid10, `${path}.cid10`),
    cid11: stringValue(d.cid11, `${path}.cid11`),
    provenance: assertProvenance(d.provenance, `${path}.provenance`),
    supporting_facts:
      d.supporting_facts === undefined
        ? undefined
        : assertStringArray(d.supporting_facts, `${path}.supporting_facts`),
    limitations: assertStringArray(d.limitations, `${path}.limitations`),
  };
}

function assertHypothesis(
  value: unknown,
  path: string,
): SuperHipotese & { provenance: QwenProvenance } {
  const h = recordValue(value, path);
  return {
    titulo: stringValue(h.title, `${path}.title`),
    texto: stringValue(h.narrative, `${path}.narrative`),
    aFavor: arrayValue(h.in_favor, `${path}.in_favor`).map(
      (item, i) => assertFact(item, `${path}.in_favor[${i}]`).text,
    ),
    aPonderar: arrayValue(h.to_consider, `${path}.to_consider`).map(
      (item, i) => assertFact(item, `${path}.to_consider[${i}]`).text,
    ),
    provenance: assertProvenance(h.provenance, `${path}.provenance`),
  };
}

export function parseQwenLaudoDraft(value: unknown): QwenDraft {
  const root = recordValue(value, "laudo");
  if (root.schema_version !== "neuroped-pant-1.0")
    throw new Error("schema_version incompatível");
  if (root.document_status !== "draft_for_clinician_review")
    throw new Error(
      "document_status deve permanecer draft_for_clinician_review",
    );

  const metadata = recordValue(root.case_metadata, "case_metadata");
  const consentState = stringValue(
    metadata.consent_state,
    "case_metadata.consent_state",
  ) as QwenDraft["case_metadata"]["consent_state"];
  if (
    !new Set([
      "authorized_minimum_dataset",
      "pseudonymized",
      "not_verified",
    ]).has(consentState)
  )
    throw new Error("consent_state inválido");
  const sectionRoot = recordValue(root.sections, "sections");
  for (const key of REQUIRED_SECTION_KEYS)
    if (!(key in sectionRoot))
      throw new Error(`seção obrigatória ausente: ${key}`);

  const parseBaseWith = (key: string) => {
    const raw = recordValue(sectionRoot[key], `sections.${key}`);
    const base = assertSectionBase(raw, `sections.${key}`);
    return { raw, ...base };
  };

  const s1 = parseBaseWith("section_01");
  const s2 = parseBaseWith("section_02");
  const s3 = parseBaseWith("section_03");
  const s4 = parseBaseWith("section_04");
  const s5 = parseBaseWith("section_05");
  const s6 = parseBaseWith("section_06");
  const s7 = parseBaseWith("section_07");
  const s8 = parseBaseWith("section_08");
  const s9 = parseBaseWith("section_09");
  const s10 = parseBaseWith("section_10");
  const s11 = parseBaseWith("section_11");
  const s12 = parseBaseWith("section_12");
  const s13 = parseBaseWith("section_13");
  const s14 = parseBaseWith("section_14");

  const parseSubsections = arrayValue(
    s3.raw.subsections,
    "sections.section_03.subsections",
  ).map((item, i) => {
    const sub = recordValue(item, `sections.section_03.subsections[${i}]`);
    return {
      titulo: stringValue(
        sub.title,
        `sections.section_03.subsections[${i}].title`,
      ),
      texto: stringValue(
        sub.narrative,
        `sections.section_03.subsections[${i}].narrative`,
      ),
      provenance: assertProvenance(
        sub.provenance,
        `sections.section_03.subsections[${i}].provenance`,
      ),
    } satisfies SuperSubsecaoHistoria & { provenance: QwenProvenance };
  });

  const parseItems = arrayValue(s9.raw.items, "sections.section_09.items").map(
    (item, i) => {
      const p = recordValue(item, `sections.section_09.items[${i}]`);
      return {
        titulo: stringValue(p.title, `sections.section_09.items[${i}].title`),
        indicacao: stringValue(
          p.indication,
          `sections.section_09.items[${i}].indication`,
        ),
        evidencia: stringValue(
          p.evidence,
          `sections.section_09.items[${i}].evidence`,
        ),
        provenance: assertProvenance(
          p.provenance,
          `sections.section_09.items[${i}].provenance`,
        ),
      } satisfies SuperPlanoItem & { provenance: QwenProvenance };
    },
  );

  const parseDiagnoses = arrayValue(
    s8.raw.diagnoses,
    "sections.section_08.diagnoses",
  ).map((item, i) =>
    assertDiagnosis(item, `sections.section_08.diagnoses[${i}]`),
  );
  const parseHypotheses = arrayValue(
    s6.raw.hypotheses,
    "sections.section_06.hypotheses",
  ).map((item, i) =>
    assertHypothesis(item, `sections.section_06.hypotheses[${i}]`),
  );

  const quality = recordValue(root.quality_gate, "quality_gate");
  const qualityStatus = stringValue(
    quality.status,
    "quality_gate.status",
  ) as QwenDraft["quality_gate"]["status"];
  if (!new Set(["pass_with_review", "blocked"]).has(qualityStatus))
    throw new Error("quality_gate.status inválido");
  const checks = arrayValue(quality.checks, "quality_gate.checks").map(
    (item, i) => {
      const c = recordValue(item, `quality_gate.checks[${i}]`);
      const status = stringValue(
        c.status,
        `quality_gate.checks[${i}].status`,
      ) as "pass" | "warning" | "fail";
      if (!new Set(["pass", "warning", "fail"]).has(status))
        throw new Error(`quality_gate.checks[${i}].status inválido`);
      return {
        name: stringValue(c.name, `quality_gate.checks[${i}].name`),
        status,
        detail: stringValue(c.detail, `quality_gate.checks[${i}].detail`),
      };
    },
  );

  const parseSources = arrayValue(root.sources, "sources").map((item, i) => {
    const source = recordValue(item, `sources[${i}]`);
    return {
      id: stringValue(source.id, `sources[${i}].id`),
      title: stringValue(source.title, `sources[${i}].title`),
      url_or_path: stringValue(source.url_or_path, `sources[${i}].url_or_path`),
      source_type: stringValue(
        source.source_type,
        `sources[${i}].source_type`,
      ) as QwenDraft["sources"][number]["source_type"],
      used_for: stringValue(source.used_for, `sources[${i}].used_for`),
      access_status: stringValue(
        source.access_status,
        `sources[${i}].access_status`,
      ) as QwenDraft["sources"][number]["access_status"],
    };
  });

  return {
    schema_version: "neuroped-pant-1.0",
    document_status: "draft_for_clinician_review",
    case_metadata: {
      patient_label: stringValue(
        metadata.patient_label,
        "case_metadata.patient_label",
      ),
      date_of_birth: stringValue(
        metadata.date_of_birth,
        "case_metadata.date_of_birth",
        false,
      ),
      age: stringValue(metadata.age, "case_metadata.age", false),
      sex: stringValue(metadata.sex, "case_metadata.sex", false),
      city_state: stringValue(
        metadata.city_state,
        "case_metadata.city_state",
        false,
      ),
      evaluation_date: stringValue(
        metadata.evaluation_date,
        "case_metadata.evaluation_date",
      ),
      consultation_type: stringValue(
        metadata.consultation_type,
        "case_metadata.consultation_type",
        false,
      ),
      protocol: stringValue(metadata.protocol, "case_metadata.protocol", false),
      purpose: stringValue(metadata.purpose, "case_metadata.purpose"),
      consent_state: consentState,
    },
    cover: {
      summary: stringValue(
        recordValue(root.cover, "cover").summary,
        "cover.summary",
      ),
      cid_box: stringValue(
        recordValue(root.cover, "cover").cid_box,
        "cover.cid_box",
      ),
    },
    sections: {
      section_01: {
        status: s1.status,
        narrative: s1.narrative,
        provenance: s1.provenance,
        accompanied_by: stringValue(
          s1.raw.accompanied_by,
          "sections.section_01.accompanied_by",
        ),
        interview_observation: stringValue(
          s1.raw.interview_observation,
          "sections.section_01.interview_observation",
        ),
      },
      section_02: {
        status: s2.status,
        narrative: s2.narrative,
        provenance: s2.provenance,
        context: stringValue(s2.raw.context, "sections.section_02.context"),
      },
      section_03: {
        status: s3.status,
        narrative: s3.narrative,
        provenance: s3.provenance,
        subsections: parseSubsections,
      },
      section_04: {
        status: s4.status,
        narrative: s4.narrative,
        provenance: s4.provenance,
        divergences: stringValue(
          s4.raw.divergences,
          "sections.section_04.divergences",
        ),
        documents: stringValue(
          s4.raw.documents,
          "sections.section_04.documents",
        ),
      },
      section_05: {
        status: s5.status,
        narrative: s5.narrative,
        provenance: s5.provenance,
        functioning: arrayValue(
          s5.raw.functioning,
          "sections.section_05.functioning",
        ).map((item, i) =>
          assertFact(item, `sections.section_05.functioning[${i}]`),
        ),
        needs_attention: arrayValue(
          s5.raw.needs_attention,
          "sections.section_05.needs_attention",
        ).map((item, i) =>
          assertFact(item, `sections.section_05.needs_attention[${i}]`),
        ),
      },
      section_06: {
        status: s6.status,
        narrative: s6.narrative,
        provenance: s6.provenance,
        hypotheses: parseHypotheses,
      },
      section_07: {
        status: s7.status,
        narrative: s7.narrative,
        provenance: s7.provenance,
        exam_states: arrayValue(
          s7.raw.exam_states,
          "sections.section_07.exam_states",
        ).map((item, i) => {
          const e = recordValue(item, `sections.section_07.exam_states[${i}]`);
          return {
            name: stringValue(
              e.name,
              `sections.section_07.exam_states[${i}].name`,
            ),
            state: stringValue(
              e.state,
              `sections.section_07.exam_states[${i}].state`,
            ),
            result: stringValue(
              e.result,
              `sections.section_07.exam_states[${i}].result`,
            ),
            provenance: assertProvenance(
              e.provenance,
              `sections.section_07.exam_states[${i}].provenance`,
            ),
          };
        }),
      },
      section_08: {
        status: s8.status,
        narrative: s8.narrative,
        provenance: s8.provenance,
        diagnoses: parseDiagnoses,
      },
      section_09: {
        status: s9.status,
        narrative: s9.narrative,
        provenance: s9.provenance,
        items: parseItems,
      },
      section_10: {
        status: s10.status,
        narrative: s10.narrative,
        provenance: s10.provenance,
        medication_plan: stringValue(
          s10.raw.medication_plan,
          "sections.section_10.medication_plan",
        ),
        requests: arrayValue(
          s10.raw.requests,
          "sections.section_10.requests",
        ).map((item, i) =>
          assertFact(item, `sections.section_10.requests[${i}]`),
        ),
      },
      section_11: {
        status: s11.status,
        narrative: s11.narrative,
        provenance: s11.provenance,
      },
      section_12: {
        status: s12.status,
        narrative: s12.narrative,
        provenance: s12.provenance,
        favorable: arrayValue(
          s12.raw.favorable,
          "sections.section_12.favorable",
        ).map((item, i) =>
          assertFact(item, `sections.section_12.favorable[${i}]`),
        ),
        expected: arrayValue(
          s12.raw.expected,
          "sections.section_12.expected",
        ).map((item, i) =>
          assertFact(item, `sections.section_12.expected[${i}]`),
        ),
        reserved: arrayValue(
          s12.raw.reserved,
          "sections.section_12.reserved",
        ).map((item, i) =>
          assertFact(item, `sections.section_12.reserved[${i}]`),
        ),
      },
      section_13: {
        status: s13.status,
        narrative: s13.narrative,
        provenance: s13.provenance,
        alerts: arrayValue(s13.raw.alerts, "sections.section_13.alerts").map(
          (item, i) => assertFact(item, `sections.section_13.alerts[${i}]`),
        ),
        return_condition: stringValue(
          s13.raw.return_condition,
          "sections.section_13.return_condition",
        ),
      },
      section_14: {
        status: s14.status,
        narrative: s14.narrative,
        provenance: s14.provenance,
      },
    },
    instruments: arrayValue(root.instruments, "instruments").map((item, i) => {
      const instrument = recordValue(item, `instruments[${i}]`);
      return {
        name: stringValue(instrument.name, `instruments[${i}].name`),
        acronym: stringValue(instrument.acronym, `instruments[${i}].acronym`),
        version: stringValue(instrument.version, `instruments[${i}].version`),
        date: stringValue(instrument.date, `instruments[${i}].date`),
        respondent: stringValue(
          instrument.respondent,
          `instruments[${i}].respondent`,
        ),
        purpose: stringValue(instrument.purpose, `instruments[${i}].purpose`),
        domain: stringValue(instrument.domain, `instruments[${i}].domain`),
        raw_score: stringValue(
          instrument.raw_score,
          `instruments[${i}].raw_score`,
        ),
        normative_score: stringValue(
          instrument.normative_score,
          `instruments[${i}].normative_score`,
        ),
        classification: stringValue(
          instrument.classification,
          `instruments[${i}].classification`,
        ),
        source: stringValue(instrument.source, `instruments[${i}].source`),
        license_policy: stringValue(
          instrument.license_policy,
          `instruments[${i}].license_policy`,
        ) as QwenDraft["instruments"][number]["license_policy"],
        limitations: assertStringArray(
          instrument.limitations,
          `instruments[${i}].limitations`,
        ),
        provenance: assertProvenance(
          instrument.provenance,
          `instruments[${i}].provenance`,
        ),
      };
    }),
    medications: arrayValue(root.medications, "medications").map((item, i) => {
      const m = recordValue(item, `medications[${i}]`);
      return {
        name: stringValue(m.name, `medications[${i}].name`),
        presentation: stringValue(
          m.presentation,
          `medications[${i}].presentation`,
          false,
        ),
        dose: stringValue(m.dose, `medications[${i}].dose`),
        route: stringValue(m.route, `medications[${i}].route`),
        frequency: stringValue(m.frequency, `medications[${i}].frequency`),
        duration: stringValue(m.duration, `medications[${i}].duration`),
        indication: stringValue(m.indication, `medications[${i}].indication`),
        adherence: stringValue(
          m.adherence,
          `medications[${i}].adherence`,
          false,
        ),
        response: stringValue(m.response, `medications[${i}].response`, false),
        adverse_effects: stringValue(
          m.adverse_effects,
          `medications[${i}].adverse_effects`,
          false,
        ),
        provenance: assertProvenance(
          m.provenance,
          `medications[${i}].provenance`,
        ),
      };
    }),
    quality_gate: {
      status: qualityStatus,
      checks,
      blocking_reasons: assertStringArray(
        quality.blocking_reasons,
        "quality_gate.blocking_reasons",
      ),
    },
    pending_clinician_review: arrayValue(
      root.pending_clinician_review,
      "pending_clinician_review",
    ).map((item, i) => {
      const p = recordValue(item, `pending_clinician_review[${i}]`);
      const severity = stringValue(
        p.severity,
        `pending_clinician_review[${i}].severity`,
      ) as QwenDraft["pending_clinician_review"][number]["severity"];
      if (!new Set(["critical", "high", "medium", "low"]).has(severity))
        throw new Error(`pending_clinician_review[${i}].severity inválido`);
      return {
        field: stringValue(p.field, `pending_clinician_review[${i}].field`),
        reason: stringValue(p.reason, `pending_clinician_review[${i}].reason`),
        severity,
        action: stringValue(p.action, `pending_clinician_review[${i}].action`),
      };
    }),
    sources: parseSources,
    rendered_text: stringValue(root.rendered_text, "rendered_text"),
  };
}

function textOrEmpty(value: string | undefined): string {
  return (value ?? "").trim();
}

export interface QwenImportResult {
  entrada: SuperEntrada;
  canPreview: boolean;
  canExport: boolean;
  warnings: string[];
}

/**
 * Converte somente dados já validados do contrato Qwen para o editor SuperNeuroPed.
 * Não preenche campos ausentes nem converte status pendente em diagnóstico firmado.
 */
export function qwenDraftToSuperEntrada(draft: QwenDraft): QwenImportResult {
  const s = draft.sections;
  const diagnoses: SuperCid[] = s.section_08.diagnoses.map((d) => ({
    hipotese: d.label,
    cid10: d.cid10,
    cid11: d.cid11,
    status: d.status,
  }));
  const warnings = [
    ...draft.quality_gate.blocking_reasons,
    ...draft.pending_clinician_review.map((p) => `${p.field}: ${p.reason}`),
  ];
  const hasMissingCodes = diagnoses.some(
    (d) => !d.cid10.trim() || !d.cid11.trim(),
  );
  if (hasMissingCodes)
    warnings.push(
      "Há CIDs ausentes; validar CID-10 e CID-11 antes de usar o gate de emissão.",
    );
  if (draft.quality_gate.status === "blocked")
    warnings.push("O quality_gate do Qwen está bloqueado.");
  if (draft.case_metadata.consent_state === "not_verified")
    warnings.push(
      "Consentimento/autorização do conjunto de dados não verificado.",
    );

  const entrada: SuperEntrada = {
    nome: draft.case_metadata.patient_label,
    idade: textOrEmpty(draft.case_metadata.age),
    tipoConsulta: textOrEmpty(draft.case_metadata.consultation_type),
    dataConsulta: textOrEmpty(draft.case_metadata.evaluation_date),
    resumoCapa: draft.cover.summary,
    caixaCid: draft.cover.cid_box,
    protocolo: textOrEmpty(draft.case_metadata.protocol),
    cidade: textOrEmpty(draft.case_metadata.city_state),
    quemE: s.section_01.narrative,
    acompanhadoPor: s.section_01.accompanied_by,
    observacaoEntrevista: s.section_01.interview_observation,
    motivo: s.section_02.narrative,
    motivoContexto: s.section_02.context,
    historiaSubsecoes: s.section_03.subsections.map(
      (sub): SuperSubsecaoHistoria => ({
        titulo: sub.titulo,
        texto: sub.texto,
      }),
    ),
    convergencia: s.section_04.narrative,
    divergencias: s.section_04.divergences,
    documentosConvergentes: s.section_04.documents,
    funcionando: s.section_05.functioning.map((fact) => fact.text),
    pedeAtencao: s.section_05.needs_attention.map((fact) => fact.text),
    hipoteses: s.section_06.hypotheses.map(
      (h): SuperHipotese => ({
        titulo: h.titulo,
        texto: h.texto,
        aFavor: h.aFavor,
        aPonderar: h.aPonderar,
      }),
    ),
    achadosComplementares: [
      s.section_07.narrative,
      ...s.section_07.exam_states.map(
        (e) => `${e.name}: ${e.state}; ${e.result}`,
      ),
    ]
      .filter(Boolean)
      .join(" "),
    cids: diagnoses,
    planoMulti: s.section_09.items.map(
      (p): SuperPlanoItem => ({
        titulo: p.titulo,
        indicacao: p.indicacao,
        evidencia: p.evidencia,
      }),
    ),
    condutaFarmaco: s.section_10.medication_plan,
    solicitacoes: s.section_10.requests.map((fact) => fact.text),
    prognosticoLeitura: s.section_11.narrative,
    cenarioFavoravel: s.section_12.favorable.map((fact) => fact.text),
    cenarioEsperado: s.section_12.expected.map((fact) => fact.text),
    cenarioReservado: s.section_12.reserved.map((fact) => fact.text),
    sinaisAlerta: s.section_13.alerts.map((fact) => fact.text),
    retornoCondicao: s.section_13.return_condition,
    sintese: s.section_14.narrative,
  };

  return {
    entrada,
    canPreview: Boolean(draft.rendered_text.trim()),
    canExport: draft.quality_gate.status !== "blocked" && !hasMissingCodes,
    warnings: Array.from(new Set(warnings)),
  };
}

export function parseQwenJsonText(text: string): QwenImportResult {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new Error("O conteúdo colado não é um JSON válido.");
  }
  return qwenDraftToSuperEntrada(parseQwenLaudoDraft(value));
}
