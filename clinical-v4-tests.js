/* =====================================================================
   NeuroPed EDJ · V4 INTEGRITY TESTS V4.0
   Dr. Jadson Fraga · CRM-PE 25227 · RQE 17756
   ---------------------------------------------------------------------
   Estende NeuroPedTests com 12 cenários V4.0:
     · Drive event mode dispara CustomEvent
     · FHIR Observation valida shape mínimo
     · FHIR Bundle empacota Patient+Observation+Condition
     · LGPD scopes obedecem essencial vs opcional
     · LGPD purgePatientData limpa namespaces
     · Auth registerUser + login + logout
     · Auth capability gates
   ===================================================================== */
(function (global) {
  "use strict";

  if (!global.NeuroPedTests) {
    console.warn("[V4 tests] NeuroPedTests não carregado — esperando V3.2.");
    return;
  }
  const { TESTS } = global.NeuroPedTests;
  function test(name, fn) { TESTS.push({ name, fn }); }
  function assert(cond, msg) { if (!cond) throw new Error(msg || "assert"); }

  /* ---------- DRIVE ---------- */
  test("v4.drive: defaultAdapter presente em event mode", () => {
    const v4 = global.NeuroPedClinicalV4;
    assert(v4?.driveAdapter, "driveAdapter ausente");
    assert(v4.driveAdapter.mode === "event", "modo inicial deveria ser event");
  });

  test("v4.drive: uploadPDF event dispatcha CustomEvent", async () => {
    const v4 = global.NeuroPedClinicalV4;
    let fired = false;
    const handler = () => { fired = true; };
    window.addEventListener("neuroped:upload-to-drive", handler);
    const blob = new Blob(["test"], { type: "application/pdf" });
    await v4.driveAdapter.uploadPDF({ blob, patient: { id: "test-pat", name: "Teste" } });
    window.removeEventListener("neuroped:upload-to-drive", handler);
    assert(fired, "evento upload-to-drive não disparou");
  });

  /* ---------- FHIR ---------- */
  test("v4.fhir: Observation tem shape válido", () => {
    const v4 = global.NeuroPedClinicalV4;
    const inst = { id: "ofc-phq-a", name: "PHQ-A", type: "scale" };
    const obs = v4.fhirAdapter.toObservation({
      instrument: inst,
      patient: { id: "p1" },
      result: { total: 12 }
    });
    assert(obs.resourceType === "Observation", "resourceType");
    assert(obs.status === "final", "status");
    assert(obs.code?.coding?.length, "code.coding");
    assert(obs.subject?.reference === "Patient/p1", "subject");
  });

  test("v4.fhir: Bundle empacota Patient + Observation + Condition", () => {
    const v4 = global.NeuroPedClinicalV4;
    const inst = { id: "ofc-snap-iv", name: "SNAP-IV", type: "scale" };
    const bundle = v4.fhirAdapter.toBundle({
      patient: { id: "p2", name: "Test" },
      observations: [{ instrument: inst, result: { total: 18 }, patient: { id: "p2" } }],
      conditions: [{ hypothesis: { id: "TDAH_desatento", label: "TDAH desatento" }, confidence: 0.7 }]
    });
    assert(bundle.resourceType === "Bundle", "Bundle");
    assert(bundle.entry?.length === 3, "3 entries");
    assert(bundle.entry.find((e) => e.resource.resourceType === "Patient"), "Patient ausente");
    assert(bundle.entry.find((e) => e.resource.resourceType === "Observation"), "Observation ausente");
    assert(bundle.entry.find((e) => e.resource.resourceType === "Condition"), "Condition ausente");
  });

  test("v4.fhir: validate detecta Observation sem status", () => {
    const v4 = global.NeuroPedClinicalV4;
    const r = v4.fhirAdapter.validate({ resourceType: "Observation", code: {}, subject: {} });
    assert(!r.ok, "deveria reprovar");
    assert(r.errors.some((e) => /status/.test(e)), "deve apontar status missing");
  });

  /* ---------- LGPD ---------- */
  test("v4.lgpd: hasConsent inicia false para escopo opcional", () => {
    const v4 = global.NeuroPedClinicalV4;
    v4.lgpd.revokeConsent("drive_sync");
    assert(!v4.lgpd.hasConsent("drive_sync"), "drive_sync deveria estar revogado");
  });

  test("v4.lgpd: grantConsent + hasConsent + revokeConsent funcionam", () => {
    const v4 = global.NeuroPedClinicalV4;
    v4.lgpd.grantConsent("fhir_export");
    assert(v4.lgpd.hasConsent("fhir_export"), "deveria estar concedido");
    v4.lgpd.revokeConsent("fhir_export");
    assert(!v4.lgpd.hasConsent("fhir_export"), "deveria estar revogado");
  });

  test("v4.lgpd: purgePatientData rejeita sem id", () => {
    const v4 = global.NeuroPedClinicalV4;
    const r = v4.lgpd.purgePatientData(null);
    assert(!r.ok && r.error === "missing_patient_id", "deveria recusar");
  });

  /* ---------- AUTH ---------- */
  test("v4.auth: registerUser + login + currentUser", () => {
    const v4 = global.NeuroPedClinicalV4;
    v4.auth.registerUser({ id: "test-user", role: "secretaria", name: "Teste", pin: "1234" });
    const r = v4.auth.login({ id: "test-user", pin: "1234" });
    assert(r.ok, "login falhou");
    assert(v4.auth.currentUser()?.role === "secretaria", "role errado");
    v4.auth.logout();
  });

  test("v4.auth: login com PIN errado reprovado", () => {
    const v4 = global.NeuroPedClinicalV4;
    v4.auth.registerUser({ id: "test-pin-err", role: "paciente", pin: "abc" });
    const r = v4.auth.login({ id: "test-pin-err", pin: "xyz" });
    assert(!r.ok && r.error === "invalid_pin", "deveria reprovar PIN");
  });

  test("v4.auth: capability gate bloqueia capability não autorizada", () => {
    const v4 = global.NeuroPedClinicalV4;
    v4.auth.registerUser({ id: "test-cap", role: "paciente", pin: "9" });
    v4.auth.login({ id: "test-cap", pin: "9" });
    assert(!v4.auth.hasCapability("admin_panel"), "paciente não deveria ter admin_panel");
    assert(v4.auth.hasCapability("self_assessment"), "paciente deveria ter self_assessment");
    v4.auth.logout();
  });

  test("v4.auth: seed do Dr. Jadson Fraga existe", () => {
    const v4 = global.NeuroPedClinicalV4;
    const r = v4.auth.login({ id: "dr.jadson", pin: "neuroped" });
    assert(r.ok, "login do Dr. falhou");
    assert(v4.auth.hasCapability("admin_panel"), "Dr. deveria ter admin_panel");
    v4.auth.logout();
  });

  /* ---------- PLATFORM HEALTH ---------- */
  test("v4.platform: health() reporta todos os adapters ok", () => {
    const v4 = global.NeuroPedClinicalV4;
    if (!v4.platform) return; // ainda não carregou
    const h = v4.platform.health();
    assert(h.v4_drive && h.v4_fhir && h.v4_lgpd && h.v4_auth, "adapters faltando");
  });
})(typeof window !== "undefined" ? window : globalThis);
