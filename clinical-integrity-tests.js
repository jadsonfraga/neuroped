/* =====================================================================
   NeuroPed EDJ · INTEGRITY TESTS V3.2
   Dr. Jadson Fraga · CRM-PE 25227 · RQE 17756
   ---------------------------------------------------------------------
   Suíte de testes auto-executável. Sem framework externo.
     · smoke      — APIs públicas respondem
     · schema     — registry valida 11 campos
     · integrity  — checksum roundtrip storage
     · migration  — 3.0 → 3.1 → 3.2 sem perda
     · pipeline   — pipeline retorna explainability completa
     · plugin     — lifecycle install/uninstall

   Executar: NeuroPedTests.runAll()
   ===================================================================== */
(function (global) {
  "use strict";

  const TESTS = [];
  function test(name, fn) { TESTS.push({ name, fn }); }
  function assert(cond, msg) { if (!cond) throw new Error(msg || "asserção falhou"); }

  /* ========== SMOKE ========== */
  test("smoke: módulos globais V3.2 presentes", () => {
    ["NeuroPedClinical", "NeuroPedClinicalGovernance", "NeuroPedRecommendation",
     "NeuroPedClinicalStorage", "NeuroPedClinicalMigrations", "NeuroPedClinicalEventBus",
     "NeuroPedClinicalPluginSDK", "NeuroPedFutureAdapters", "NeuroPedPDFAuditable"
    ].forEach((k) => assert(global[k], `${k} ausente`));
  });

  test("smoke: 3 engines instanciadas", () => {
    const npc = global.NeuroPedClinical;
    assert(npc.directTestEngine, "directTestEngine");
    assert(npc.scaleEngine, "scaleEngine");
    assert(npc.diaryEngine, "diaryEngine");
  });

  /* ========== GOVERNANCE / SCHEMA ========== */
  test("governance: rejeita instrumento sem campo obrigatório", () => {
    const g = new global.NeuroPedClinicalGovernance.ClinicalGovernance();
    const r = g.validateSchema({ id: "x", name: "X" });
    assert(!r.ok, "deveria reprovar");
    assert(r.findings.some((f) => f.code === "MISSING_FIELD"), "deve apontar MISSING_FIELD");
  });

  test("governance: hash determinístico", () => {
    const g = new global.NeuroPedClinicalGovernance.ClinicalGovernance();
    const inst = {
      id: "td-x", name: "X", type: "direct_test", subtype: "academic", category: "clinical_application",
      application_mode: "presencial", respondent: "paciente_em_desempenho", longitudinal: false,
      requires_training: true, estimated_minutes: 10, purpose: "triagem"
    };
    const h1 = g.generateClinicalHash(inst);
    const h2 = g.generateClinicalHash(inst);
    assert(h1 === h2, "hash não-determinístico");
    assert(h1.length === 16, "hash deve ter 16 hex");
  });

  test("governance: detecta duplicata semântica", () => {
    const g = new global.NeuroPedClinicalGovernance.ClinicalGovernance();
    const a = { id: "td-1", name: "A", type: "direct_test", subtype: "reading", purpose: "triagem", respondent: "paciente_em_desempenho",
      category: "clinical_application", application_mode: "presencial", longitudinal: false, requires_training: true, estimated_minutes: 5 };
    const b = { ...a, id: "td-2", name: "B" };
    g.admit(a, []);
    const r = g.validateSemanticConflicts(b, []);
    assert(r.findings.some((f) => f.code === "SEMANTIC_DUPLICATE"), "deve apontar SEMANTIC_DUPLICATE");
  });

  /* ========== STORAGE ========== */
  test("storage: roundtrip com checksum válido", () => {
    const S = global.NeuroPedClinicalStorage;
    const layer = new S.VersionedStorageLayer("neuro.direct");
    const r1 = layer.save("test-key", { result: 42 });
    assert(r1.ok, "save falhou");
    const r2 = layer.load("test-key");
    assert(r2.ok, "load falhou");
    assert(r2.record.payload.result === 42, "payload corrompido");
    assert(r2.record.checksum === r1.record.checksum, "checksum divergiu");
    layer.remove("test-key");
  });

  test("storage: detecta checksum_mismatch", () => {
    const S = global.NeuroPedClinicalStorage;
    const layer = new S.VersionedStorageLayer("neuro.scale");
    layer.save("corruption-key", { v: 1 });
    // tampering manual
    const k = "neuro.scale.corruption-key";
    const rec = JSON.parse(localStorage.getItem(k));
    rec.payload.v = 999;
    localStorage.setItem(k, JSON.stringify(rec));
    const r = layer.load("corruption-key");
    assert(!r.ok && r.error === "checksum_mismatch", "deveria detectar tampering");
    layer.remove("corruption-key");
  });

  test("storage: rollback restaura archive anterior", () => {
    const S = global.NeuroPedClinicalStorage;
    const layer = new S.VersionedStorageLayer("neuro.diary");
    layer.save("rb-key", { v: 1 });
    layer.save("rb-key", { v: 2 });
    const r = layer.rollback("rb-key");
    assert(r.ok, "rollback falhou");
    const loaded = layer.load("rb-key");
    assert(loaded.ok && loaded.record.payload.v === 1, "rollback não restaurou v=1");
    layer.remove("rb-key");
  });

  test("storage: namespace inválido rejeitado", () => {
    const S = global.NeuroPedClinicalStorage;
    let threw = false;
    try { new S.VersionedStorageLayer("foo.bar"); } catch (_) { threw = true; }
    assert(threw, "deveria rejeitar namespace fora do canon");
  });

  /* ========== MIGRATIONS ========== */
  test("migrations: 3.0 → 3.1 → 3.2 sem perda (identity)", () => {
    const M = global.NeuroPedClinicalMigrations.defaultManager;
    const payload = { x: 1, y: [2, 3] };
    const r = M.migrate(payload, "3.0.0", "3.2.0");
    assert(r.ok, "migration falhou");
    assert(JSON.stringify(r.payload) === JSON.stringify(payload), "payload alterado em identity migration");
    assert(r.hops === 2, "deveria fazer 2 saltos");
  });

  test("migrations: caminho ausente retorna no_path", () => {
    const M = global.NeuroPedClinicalMigrations.defaultManager;
    const r = M.migrate({}, "99.0.0", "100.0.0");
    assert(!r.ok && r.error === "no_path", "deveria retornar no_path");
  });

  /* ========== PIPELINE ========== */
  test("pipeline: retorna explainability completa", () => {
    const R = global.NeuroPedRecommendation;
    const pipe = new R.RecommendationPipeline();
    const inst = {
      id: "ofc-test", name: "Test", type: "scale", subtype: "attention", category: "pre_consultation",
      application_mode: "remoto", respondent: "familia", longitudinal: false, requires_training: false,
      estimated_minutes: 5, purpose: "triagem", age_window: [60, 144]
    };
    const out = pipe.run({ age_months: 96, chief_complaints: ["atencao"], intent: "triagem" }, [inst]);
    assert(out.length === 1, "1 resultado esperado");
    assert(typeof out[0].score === "number", "score numérico");
    assert(out[0].explainability && "matched_age_range" in out[0].explainability, "explainability ausente");
    assert(out[0].reasons.length > 0, "reasons vazio");
  });

  /* ========== EVENT BUS ========== */
  test("event-bus: evento canônico recebido pelo subscriber", () => {
    const B = global.NeuroPedClinicalEventBus.bus;
    let received = null;
    const off = B.on("pdf:generated", (e) => { received = e; });
    B.emit("pdf:generated", { hash: "abc" }, { engine: "test" });
    off();
    assert(received && received.event === "pdf:generated", "evento não chegou");
    assert(received.trace_id, "trace_id ausente");
  });

  test("event-bus: evento fora do canon rejeitado em strict mode", () => {
    const B = global.NeuroPedClinicalEventBus.bus;
    const r = B.emit("evento:invalido", {});
    assert(r === null, "deveria rejeitar");
  });

  /* ========== PLUGIN SDK ========== */
  test("plugin-sdk: manifest inválido reprovado", () => {
    const SDK = global.NeuroPedClinicalPluginSDK;
    let threw = false;
    try { SDK.createClinicalPlugin({ name: "X", version: "1.0" }); } catch (_) { threw = true; }
    assert(threw, "manifest sem semver deveria falhar");
  });

  test("plugin-sdk: install registra instrumento e dispara plugin:loaded", () => {
    const SDK = global.NeuroPedClinicalPluginSDK;
    const B = global.NeuroPedClinicalEventBus.bus;
    let fired = false;
    const off = B.on("plugin:loaded", () => { fired = true; });
    const p = SDK.createClinicalPlugin({
      name: "test-plugin-x", version: "1.0.0",
      capabilities: ["register_instrument"]
    });
    p.defineInstrument({
      id: "td-plugin-test", name: "Plugin Test", type: "direct_test", subtype: "academic",
      category: "clinical_application", application_mode: "presencial",
      respondent: "paciente_em_desempenho", longitudinal: false,
      requires_training: true, estimated_minutes: 5, purpose: "triagem"
    });
    p.install();
    off();
    assert(fired, "plugin:loaded não disparado");
    const found = global.NeuroPedClinical.registry.get("td-plugin-test");
    assert(found && found.source_plugin === "test-plugin-x", "instrumento não registrado");
  });

  /* ========== EXECUÇÃO ========== */
  function runAll(opts = {}) {
    const verbose = opts.verbose !== false;
    const results = TESTS.map(({ name, fn }) => {
      try { fn(); return { name, passed: true }; }
      catch (e) {
        if (verbose) console.error(`✗ ${name}:`, e.message);
        return { name, passed: false, error: e.message };
      }
    });
    const passed = results.filter((r) => r.passed).length;
    const failed = results.length - passed;
    const report = {
      total: results.length, passed, failed,
      pass_rate: (passed / results.length * 100).toFixed(1) + "%",
      results,
      timestamp: new Date().toISOString(),
      platform_version: "3.2.0"
    };
    if (verbose) {
      console.log(`%c[NeuroPed V3.2 Tests] ${passed}/${results.length} passaram (${report.pass_rate})`,
        passed === results.length ? "color:#6d6af5;font-weight:bold" : "color:#f25c5c;font-weight:bold");
    }
    return report;
  }

  global.NeuroPedTests = { runAll, TESTS, version: "3.2.0" };
  if (typeof module !== "undefined" && module.exports) module.exports = global.NeuroPedTests;
})(typeof window !== "undefined" ? window : globalThis);
