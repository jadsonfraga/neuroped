/* =====================================================================
   NeuroPed · np-sign-client.js · MP9.0 WS3
   Dr. Jadson Fraga · CRM-PE 25227 · RQE 17756
   ---------------------------------------------------------------------
   Chama /api/sign para hash assinado server-side. Substitui o
   "signatureSecret" hardcoded que estava no bundle (WS3 do MP9.0).

   Uso:
     await NPSign.sign({ patient_id, instrument, score, ts })
     → { signature: "...", server_ts: 1234, hash_local: "..." }

   Em falha de rede ou 501, retorna apenas hash local (FNV-1a, audit
   degraded). A flag "signed_by_server" indica se foi server-side.
   ===================================================================== */
(function () {
  "use strict";
  if (window.NPSign) return;

  function fnv1a(s, seed) {
    let h = (seed >>> 0) || 0x811c9dc5;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return h.toString(16).padStart(8, "0");
  }
  function localHash(payload) {
    const s = JSON.stringify(payload);
    return fnv1a(s, 0x811c9dc5) + fnv1a(s, 0xa1b2c3d4);
  }

  async function sign(payload) {
    const hash_local = localHash(payload);
    try {
      const r = await fetch("/api/sign", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ payload, hash_local })
      });
      if (!r.ok) {
        return { signature: hash_local, hash_local, signed_by_server: false, status: r.status };
      }
      const j = await r.json();
      return { signature: j.signature || hash_local, hash_local, signed_by_server: true, server_ts: j.ts };
    } catch (e) {
      return { signature: hash_local, hash_local, signed_by_server: false, error: e.message };
    }
  }

  window.NPSign = { sign, localHash, version: "MP9.0" };
})();
