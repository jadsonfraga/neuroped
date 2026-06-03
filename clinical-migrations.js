/* =====================================================================
   NeuroPed EDJ · CLINICAL MIGRATIONS V3.2
   Dr. Jadson Fraga · CRM-PE 25227 · RQE 17756
   ---------------------------------------------------------------------
   MigrationManager — pipeline de migração de schema entre versões.
   Cada migração é registrada como pareceria (from, to, migrator).
   Resolve via grafo de saltos (BFS) se não houver direct migrator.
   ===================================================================== */
(function (global) {
  "use strict";

  class MigrationManager {
    constructor() {
      /** @type {Map<string, Function>} */
      this._migrators = new Map();
    }

    register(from, to, migrator, namespace = "*") {
      const key = `${namespace}::${from}->${to}`;
      this._migrators.set(key, migrator);
    }

    migrate(payload, from, to, namespace = "*") {
      if (from === to) return { ok: true, payload, from, to, hops: 0 };
      // direct
      const direct = this._migrators.get(`${namespace}::${from}->${to}`) || this._migrators.get(`*::${from}->${to}`);
      if (direct) {
        try { return { ok: true, payload: direct(payload), from, to, hops: 1 }; }
        catch (e) { return { ok: false, error: "migration_failed", message: e.message }; }
      }
      // path search (BFS)
      const path = this._findPath(from, to, namespace);
      if (!path) return { ok: false, error: "no_path", from, to };
      let p = payload;
      for (let i = 0; i < path.length - 1; i++) {
        const m = this._migrators.get(`${namespace}::${path[i]}->${path[i+1]}`) ||
                  this._migrators.get(`*::${path[i]}->${path[i+1]}`);
        if (!m) return { ok: false, error: "broken_path", at: path[i] };
        try { p = m(p); }
        catch (e) { return { ok: false, error: "migration_failed", at: path[i], message: e.message }; }
      }
      return { ok: true, payload: p, from, to, hops: path.length - 1 };
    }

    _findPath(from, to, namespace) {
      const adj = new Map();
      for (const key of this._migrators.keys()) {
        const m = key.match(/^(.+)::(.+)->(.+)$/);
        if (!m) continue;
        if (m[1] !== namespace && m[1] !== "*") continue;
        if (!adj.has(m[2])) adj.set(m[2], []);
        adj.get(m[2]).push(m[3]);
      }
      const queue = [[from, [from]]];
      const seen = new Set([from]);
      while (queue.length) {
        const [node, path] = queue.shift();
        if (node === to) return path;
        for (const next of (adj.get(node) || [])) {
          if (seen.has(next)) continue;
          seen.add(next);
          queue.push([next, [...path, next]]);
        }
      }
      return null;
    }
  }

  /* Default migrations 3.0 → 3.1 → 3.2 (identity para payloads simples) */
  const manager = new MigrationManager();
  manager.register("3.0.0", "3.1.0", (p) => p);
  manager.register("3.1.0", "3.2.0", (p) => p);

  global.NeuroPedClinicalMigrations = { MigrationManager, defaultManager: manager, version: "3.2.0" };
  if (typeof module !== "undefined" && module.exports) module.exports = global.NeuroPedClinicalMigrations;
})(typeof window !== "undefined" ? window : globalThis);
