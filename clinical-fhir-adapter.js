/* =====================================================================
   NeuroPed EDJ · CLINICAL FHIR ADAPTER V4.0
   Dr. Jadson Fraga · CRM-PE 25227 · RQE 17756
   ---------------------------------------------------------------------
   FHIR R4 mínimo viável para interoperabilidade com EHR/HIS.

   Mapeamentos:
     · instrument + result → Observation (status:final)
     · patient → Patient resource
     · clinical bundle → Bundle (transaction|collection|document)
     · diary entries → Observation seriadas
     · scale answers → Observation com componentes
     · differential top → Condition (provisional)

   Conformidade: FHIR R4 v4.0.1.
   Validação leve: presença de resourceType + status + code + subject.
   ===================================================================== */
(function (global) {
  "use strict";

  const FHIR_VERSION = "4.0.1";
  const NEUROPED_SYSTEM = "https://neuroped.io/fhir/CodeSystem/instruments";
  const LOINC = "http://loinc.org";

  /* ------------------------------------------------------------------
   *  LOINC mapping (parcial — instrumentos com código LOINC reconhecido)
   * ------------------------------------------------------------------ */
  const LOINC_MAP = {
    "ofc-phq-a":      { code: "44249-1",  display: "PHQ-9 quick depression assessment panel" },
    "ofc-gad-7":      { code: "69737-5",  display: "GAD-7 anxiety screening panel" },
    "ofc-mchat-rf":   { code: "97520-0",  display: "M-CHAT-R/F autism screening" },
    "ofc-vanderbilt": { code: "99474-8",  display: "Vanderbilt ADHD diagnostic rating scale" },
    "ofc-sdq":        { code: "73831-0",  display: "Strengths and Difficulties Questionnaire" },
    "ofc-cssrs":      { code: "93373-7",  display: "Columbia Suicide Severity Rating Scale" }
  };
  function codingFor(instId, instName) {
    const loinc = LOINC_MAP[instId];
    const coding = [{ system: NEUROPED_SYSTEM, code: instId, display: instName }];
    if (loinc) coding.unshift({ system: LOINC, code: loinc.code, display: loinc.display });
    return { coding, text: instName };
  }

  function uuid() {
    if (global.crypto?.randomUUID) return global.crypto.randomUUID();
    return "u-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
  }

  /* ------------------------------------------------------------------
   *  PATIENT
   * ------------------------------------------------------------------ */
  function toPatient(patient = {}) {
    const id = patient.id || uuid();
    return {
      resourceType: "Patient",
      id,
      identifier: patient.cpf ? [{ system: "https://www.gov.br/receitafederal/cpf", value: patient.cpf }] : [],
      name: patient.name ? [{ use: "official", text: patient.name }] : [],
      gender: patient.sex === "M" ? "male" : patient.sex === "F" ? "female" : "unknown",
      birthDate: patient.dob || undefined,
      meta: {
        source: "NeuroPed Clinical Platform V4",
        profile: ["http://hl7.org/fhir/StructureDefinition/Patient"]
      }
    };
  }

  /* ------------------------------------------------------------------
   *  OBSERVATION (instrumento aplicado)
   * ------------------------------------------------------------------ */
  function toObservation({ instrument, patient, result, effectiveDateTime, category }) {
    const obs = {
      resourceType: "Observation",
      id: uuid(),
      status: "final",
      category: [{
        coding: [{
          system: "http://terminology.hl7.org/CodeSystem/observation-category",
          code: category || (instrument.type === "diary" ? "vital-signs" : "survey"),
          display: instrument.type === "diary" ? "Longitudinal monitoring" : "Survey/Assessment"
        }]
      }],
      code: codingFor(instrument.id, instrument.name || instrument.label),
      subject: patient ? { reference: `Patient/${patient.id || uuid()}` } : undefined,
      effectiveDateTime: effectiveDateTime || new Date().toISOString(),
      issued: new Date().toISOString(),
      performer: [{ display: "Dr. Jadson Fraga · CRM-PE 25227 · RQE 17756" }],
      meta: { source: "NeuroPed Clinical Platform V4", profile: ["http://hl7.org/fhir/StructureDefinition/Observation"] }
    };

    if (result && typeof result === "object") {
      const numericKey = Object.keys(result).find((k) => typeof result[k] === "number");
      if (numericKey) {
        obs.valueQuantity = { value: result[numericKey], unit: "score", system: NEUROPED_SYSTEM, code: numericKey };
      } else if (typeof result === "string") {
        obs.valueString = result;
      }
      // componentes para cada métrica
      const components = Object.entries(result)
        .filter(([k]) => k !== numericKey && k !== "ts" && k !== "date")
        .map(([k, v]) => ({
          code: { coding: [{ system: NEUROPED_SYSTEM + "/components", code: k, display: k }] },
          ...(typeof v === "number" ? { valueQuantity: { value: v, unit: "score" } } : { valueString: String(v) })
        }));
      if (components.length) obs.component = components;
    }
    return obs;
  }

  /* ------------------------------------------------------------------
   *  CONDITION (hipótese provisional do differential-engine)
   * ------------------------------------------------------------------ */
  function toCondition({ hypothesis, patient, confidence }) {
    return {
      resourceType: "Condition",
      id: uuid(),
      clinicalStatus: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/condition-clinical", code: "active" }] },
      verificationStatus: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/condition-ver-status", code: "provisional" }] },
      category: [{ coding: [{ system: "http://terminology.hl7.org/CodeSystem/condition-category", code: "encounter-diagnosis" }] }],
      code: { coding: [{ system: NEUROPED_SYSTEM + "/hypotheses", code: hypothesis.id, display: hypothesis.label }] },
      subject: patient ? { reference: `Patient/${patient.id}` } : undefined,
      note: [{ text: `Hipótese gerada pelo differential-engine. Confidence: ${(confidence ?? 0).toFixed(2)}` }],
      meta: { source: "NeuroPed Clinical Platform V4" }
    };
  }

  /* ------------------------------------------------------------------
   *  BUNDLE (paciente + observações + condições)
   * ------------------------------------------------------------------ */
  function toBundle({ patient, observations = [], conditions = [], type = "collection" }) {
    const patientResource = toPatient(patient);
    const entries = [{ fullUrl: `Patient/${patientResource.id}`, resource: patientResource }];
    observations.forEach((o) => {
      const obs = (o.resourceType === "Observation") ? o : toObservation(o);
      obs.subject = { reference: `Patient/${patientResource.id}` };
      entries.push({ fullUrl: `Observation/${obs.id}`, resource: obs });
    });
    conditions.forEach((c) => {
      const cond = (c.resourceType === "Condition") ? c : toCondition(c);
      cond.subject = { reference: `Patient/${patientResource.id}` };
      entries.push({ fullUrl: `Condition/${cond.id}`, resource: cond });
    });
    return {
      resourceType: "Bundle",
      id: uuid(),
      type,
      timestamp: new Date().toISOString(),
      meta: { source: "NeuroPed Clinical Platform V4", versionId: FHIR_VERSION },
      entry: entries
    };
  }

  /* ------------------------------------------------------------------
   *  VALIDAÇÃO LEVE
   * ------------------------------------------------------------------ */
  function validate(resource) {
    const errors = [];
    if (!resource) errors.push("resource_null");
    if (!resource?.resourceType) errors.push("missing_resourceType");
    if (resource?.resourceType === "Observation") {
      if (!resource.status) errors.push("Observation.status missing");
      if (!resource.code) errors.push("Observation.code missing");
      if (!resource.subject) errors.push("Observation.subject missing");
    }
    if (resource?.resourceType === "Patient") {
      if (!resource.id) errors.push("Patient.id missing");
    }
    return { ok: errors.length === 0, errors };
  }

  /* ------------------------------------------------------------------
   *  EXPORT JSON download
   * ------------------------------------------------------------------ */
  function downloadJSON(obj, filename) {
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/fhir+json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename || `fhir-${obj.resourceType || "bundle"}-${Date.now()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 30000);
    return { ok: true, filename: a.download };
  }

  /* ------------------------------------------------------------------
   *  CLASSE
   * ------------------------------------------------------------------ */
  class FHIRAdapter {
    constructor() { this.version = FHIR_VERSION; }
    toObservation(args) { return toObservation(args); }
    toPatient(p) { return toPatient(p); }
    toCondition(args) { return toCondition(args); }
    toBundle(args) { return toBundle(args); }
    validate(r) { return validate(r); }
    pushBundle(bundle) {
      // sem servidor real ainda — exporta JSON
      return downloadJSON(bundle);
    }
    downloadJSON(o, f) { return downloadJSON(o, f); }
  }

  global.NeuroPedClinicalV4 = global.NeuroPedClinicalV4 || {};
  global.NeuroPedClinicalV4.FHIRAdapter = FHIRAdapter;
  global.NeuroPedClinicalV4.fhirAdapter = new FHIRAdapter();
  global.NeuroPedClinicalV4.fhirVersion = FHIR_VERSION;
  if (typeof module !== "undefined" && module.exports) module.exports = { FHIRAdapter };
})(typeof window !== "undefined" ? window : globalThis);
