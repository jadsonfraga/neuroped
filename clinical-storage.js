/* =====================================================================
   NeuroPed EDJ · CLINICAL STORAGE V3.2
   Dr. Jadson Fraga · CRM-PE 25227 · RQE 17756
   ---------------------------------------------------------------------
   Camada de persistência versionada para as 3 engines.

   Schema de cada save:
     {
       schema_version, engine_version, saved_at,
       patient_context, payload, checksum
     }

   ADITIVO — engines V3.1 continuam usando o storage antigo. V3.2
   oferece adapter que pode ser plugado via Engine.useStorage(adapter).

   Namespaces ISOLADOS (proíbe cross-access):
     neuro.direct.* | neuro.scale.* | neuro.diary.*
   ===================================================================== */
(function (global) {
  "use strict";

  function fnv1a(str, seed) {
    let h = (seed >>> 0) || 0x811c9dc5;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return h >>> 0;
  }
  function checksumOf(payload) {
    const s = typeof payload === "string" ? payload : JSON.stringify(payload);
    return (fnv1a(s, 0x811c9dc5).toString(16).padStart(8, "0") +
            fnv1a(s, 0xa1b2c3d4).toString(16).padStart(8, "0"));
  }

  /* ------------------------------------------------------------------
   *  INTERFACE
   * ------------------------------------------------------------------ */
  class ClinicalStorageAdapter {
    save(key, record)   { throw new Error("override save"); }
    load(key)           { throw new Error("override load"); }
    list(prefix)        { throw new Error("override list"); }
    remove(key)         { throw new Error("override remove"); }
    snapshot()          { throw new Error("override snapshot"); }
    restore(snap)       { throw new Error("override restore"); }
  }

  /* ------------------------------------------------------------------
   *  VERSIONED LOCAL STORAGE
   * ------------------------------------------------------------------ */
  class VersionedStorageLayer extends ClinicalStorageAdapter {
    constructor(namespace, opts = {}) {
      super();
      if (!/^neuro\.(direct|scale|diary)$/.test(namespace))
        throw new Error("namespace inválido — use neuro.direct | neuro.scale | neuro.diary");
      this.ns = namespace;
      this.schemaVersion = opts.schemaVersion || "3.2.0";
      this.engineVersion = opts.engineVersion || "3.1.0";
      this._migrations  = opts.migrationManager || null;
      this._auditKey    = `${namespace}.__audit__`;
    }

    _k(key) { return `${this.ns}.${key}`; }

    /** Persiste com schema versionado + checksum + audit trail. */
    save(key, payload, patientContext = null) {
      const record = {
        schema_version: this.schemaVersion,
        engine_version: this.engineVersion,
        saved_at: new Date().toISOString(),
        patient_context: patientContext,
        payload,
        checksum: checksumOf(payload)
      };
      try {
        const fullKey = this._k(key);
        const existing = localStorage.getItem(fullKey);
        if (existing) this._archiveBeforeOverwrite(fullKey, existing);
        localStorage.setItem(fullKey, JSON.stringify(record));
        this._audit("save", { key, checksum: record.checksum });
        return { ok: true, record };
      } catch (e) {
        return { ok: false, error: e.message };
      }
    }

    /** Carrega, valida checksum, migra schema se necessário. */
    load(key) {
      const raw = localStorage.getItem(this._k(key));
      if (!raw) return { ok: false, error: "not_found" };
      let rec;
      try { rec = JSON.parse(raw); } catch (e) { return { ok: false, error: "corrupted_json" }; }
      const expect = checksumOf(rec.payload);
      if (rec.checksum !== expect) {
        return { ok: false, error: "checksum_mismatch", stored: rec.checksum, expected: expect, record: rec };
      }
      if (rec.schema_version !== this.schemaVersion && this._migrations) {
        const migrated = this._migrations.migrate(rec.payload, rec.schema_version, this.schemaVersion, this.ns);
        if (migrated.ok) {
          rec.payload = migrated.payload;
          rec.schema_version = this.schemaVersion;
          rec.checksum = checksumOf(rec.payload);
          localStorage.setItem(this._k(key), JSON.stringify(rec));
          this._audit("migrate", { key, from: migrated.from, to: migrated.to });
        }
      }
      return { ok: true, record: rec };
    }

    list(prefix = "") {
      const out = [];
      const full = this._k(prefix);
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(full) && !k.endsWith("__audit__") && !k.includes(".__archive__.")) {
          out.push(k.substring(this.ns.length + 1));
        }
      }
      return out;
    }

    remove(key) {
      const fullKey = this._k(key);
      const existing = localStorage.getItem(fullKey);
      if (existing) this._archiveBeforeOverwrite(fullKey, existing);
      localStorage.removeItem(fullKey);
      this._audit("remove", { key });
    }

    snapshot() {
      const data = {};
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(this.ns + ".")) data[k] = localStorage.getItem(k);
      }
      return {
        namespace: this.ns,
        schema_version: this.schemaVersion,
        captured_at: new Date().toISOString(),
        data,
        checksum: checksumOf(data)
      };
    }

    restore(snap) {
      if (!snap || snap.namespace !== this.ns) return { ok: false, error: "namespace_mismatch" };
      if (snap.checksum !== checksumOf(snap.data)) return { ok: false, error: "snapshot_corrupted" };
      Object.entries(snap.data).forEach(([k, v]) => localStorage.setItem(k, v));
      this._audit("restore", { captured_at: snap.captured_at });
      return { ok: true };
    }

    audit() {
      try { return JSON.parse(localStorage.getItem(this._auditKey) || "[]"); } catch (_) { return []; }
    }

    _audit(action, meta) {
      const log = this.audit();
      log.push({ ts: Date.now(), action, ...meta });
      if (log.length > 500) log.splice(0, log.length - 500);
      localStorage.setItem(this._auditKey, JSON.stringify(log));
    }

    _archiveBeforeOverwrite(fullKey, oldValue) {
      const archiveKey = `${this.ns}.__archive__.${fullKey.substring(this.ns.length + 1)}.${Date.now()}`;
      try { localStorage.setItem(archiveKey, oldValue); } catch (_) {}
      // mantém só os 3 últimos archives de cada chave
      const archives = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(`${this.ns}.__archive__.${fullKey.substring(this.ns.length + 1)}.`)) archives.push(k);
      }
      archives.sort();
      while (archives.length > 3) localStorage.removeItem(archives.shift());
    }

    /** Restaura versão arquivada anterior (rollback). */
    rollback(key) {
      const pattern = `${this.ns}.__archive__.${key}.`;
      const candidates = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(pattern)) candidates.push(k);
      }
      if (!candidates.length) return { ok: false, error: "no_archive" };
      candidates.sort();
      const latest = candidates[candidates.length - 1];
      const old = localStorage.getItem(latest);
      if (!old) return { ok: false, error: "archive_empty" };
      localStorage.setItem(this._k(key), old);
      this._audit("rollback", { key, from_archive: latest });
      return { ok: true };
    }
  }

  global.NeuroPedClinicalStorage = {
    ClinicalStorageAdapter,
    VersionedStorageLayer,
    checksumOf,
    version: "3.2.0"
  };
  if (typeof module !== "undefined" && module.exports) module.exports = global.NeuroPedClinicalStorage;
})(typeof window !== "undefined" ? window : globalThis);
