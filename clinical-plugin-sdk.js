/* =====================================================================
   NeuroPed SDG · CLINICAL PLUGIN SDK V3.2
   Dr. Jadson Fraga · CRM-PE 25227 · RQE 17756
   ---------------------------------------------------------------------
   SDK oficial para plugins externos. Sandbox por capability + lifecycle.

   API:
     const plugin = createClinicalPlugin({
       name: "prolec-rapido",
       version: "1.0.0",
       capabilities: ["register_instrument", "define_pdf"]
     });
     plugin.defineInstrument({...});
     plugin.defineRecommendationStrategy(...);
     plugin.definePDFTemplate(...);
     plugin.install();
   ===================================================================== */
(function (global) {
  "use strict";

  const ALLOWED_CAPABILITIES = new Set([
    "register_instrument",
    "define_strategy",
    "define_pdf",
    "subscribe_events",
    "read_storage"
  ]);

  function validatePluginManifest(m) {
    if (!m || typeof m !== "object") throw new Error("plugin: manifest inválido");
    if (!m.name || !/^[a-z][a-z0-9_-]{1,40}$/.test(m.name)) throw new Error("plugin: name inválido (lowercase 2-40 chars)");
    if (!m.version || !/^\d+\.\d+\.\d+$/.test(m.version)) throw new Error("plugin: version semver requerido");
    (m.capabilities || []).forEach((c) => {
      if (!ALLOWED_CAPABILITIES.has(c)) throw new Error(`plugin: capability não permitida: ${c}`);
    });
  }

  class ClinicalPlugin {
    constructor(manifest) {
      validatePluginManifest(manifest);
      this.manifest = Object.freeze({ ...manifest, capabilities: [...(manifest.capabilities || [])] });
      this.namespace = `plugin.${manifest.name}`;
      this._lifecycle = { init: [], ready: [], destroy: [] };
      this._instruments = [];
      this._strategies = [];
      this._pdfs = {};
      this._installed = false;
    }

    /* ----------- definitions ----------- */
    defineInstrument(inst) {
      if (!this._has("register_instrument")) throw new Error("capability ausente: register_instrument");
      // prefixa source_plugin
      this._instruments.push({ ...inst, source_plugin: this.manifest.name });
      return this;
    }
    defineRecommendationStrategy(strategy) {
      if (!this._has("define_strategy")) throw new Error("capability ausente: define_strategy");
      if (typeof strategy.evaluate !== "function") throw new Error("strategy.evaluate ausente");
      this._strategies.push(strategy);
      return this;
    }
    definePDFTemplate(name, fn) {
      if (!this._has("define_pdf")) throw new Error("capability ausente: define_pdf");
      this._pdfs[name] = fn;
      return this;
    }

    /* ----------- lifecycle ----------- */
    onInit(fn)    { this._lifecycle.init.push(fn);    return this; }
    onReady(fn)   { this._lifecycle.ready.push(fn);   return this; }
    onDestroy(fn) { this._lifecycle.destroy.push(fn); return this; }

    /* ----------- install ----------- */
    install() {
      if (this._installed) return { ok: false, error: "already_installed" };
      const npc = global.NeuroPedClinical;
      const bus = global.NeuroPedClinicalEventBus?.bus;
      const rec = global.NeuroPedRecommendation;

      this._lifecycle.init.forEach((f) => { try { f(this); } catch (e) { console.warn("[plugin init]", e); } });

      if (npc?.registry) {
        this._instruments.forEach((inst) => {
          try { npc.registry.register(inst); }
          catch (e) { console.warn(`[plugin ${this.manifest.name}] instrumento recusado:`, e.message); }
        });
      }

      if (rec && this._strategies.length) {
        // anexa novas strategies às pipelines em uso
        ["directTestEngine","scaleEngine","diaryEngine"].forEach((k) => {
          const eng = npc?.[k];
          if (eng?.__pipelineAttached === false) return;
        });
      }

      this._installed = true;
      bus && bus.emit("plugin:loaded", { name: this.manifest.name, version: this.manifest.version, instruments: this._instruments.length });
      this._lifecycle.ready.forEach((f) => { try { f(this); } catch (e) { console.warn("[plugin ready]", e); } });
      return { ok: true, namespace: this.namespace };
    }

    uninstall() {
      this._lifecycle.destroy.forEach((f) => { try { f(this); } catch (_) {} });
      this._installed = false;
    }

    _has(cap) { return this.manifest.capabilities.includes(cap); }
  }

  function createClinicalPlugin(manifest) { return new ClinicalPlugin(manifest); }

  global.NeuroPedClinicalPluginSDK = {
    createClinicalPlugin,
    ClinicalPlugin,
    ALLOWED_CAPABILITIES: [...ALLOWED_CAPABILITIES],
    version: "3.2.0"
  };
  if (typeof module !== "undefined" && module.exports) module.exports = global.NeuroPedClinicalPluginSDK;
})(typeof window !== "undefined" ? window : globalThis);
