/* NeuroPed EDJ - np-cloud.js
 * Cliente browser para Supabase, opt-in via window.NEUROPED_CLOUD.
 *
 * Coexiste com o backend D1 + Pages Functions: nao remove nada, apenas adiciona
 * uma segunda via opcional. Se cloud-config.js nao definir NEUROPED_CLOUD ou
 * estiver com enabled:false, este modulo vira no-op.
 *
 * Sem auth nesta fase: usa a chave anon publica. RLS no Postgres garante que
 * anon so consegue INSERT (write-only). SELECT requer service_role server-side.
 *
 * API publica:
 *   NeuroPedCloud.enabled() : boolean
 *   NeuroPedCloud.config()  : { url, label } sem expor a chave
 *   NeuroPedCloud.saveSubmission(payload) : Promise<{ok, id?, error?}>
 *   NeuroPedCloud.audit(action, entity, entityId, metadata) : Promise<{ok}>
 *   NeuroPedCloud.health() : Promise<{ok, status?, error?}>
 *
 * Eventos:
 *   document.dispatchEvent(new CustomEvent('np-cloud-ready', {detail:{enabled}}))
 */
(function(){
  'use strict';
  if (window.NeuroPedCloud) return;

  function cfg(){
    var c = window.NEUROPED_CLOUD || {};
    return {
      provider: c.provider || 'supabase',
      url: (c.supabaseUrl || '').replace(/\/+$/, ''),
      key: c.supabasePublicAnon || '',
      enabled: !!c.enabled && !!c.supabaseUrl && !!c.supabasePublicAnon,
      label: c.projectLabel || 'NeuroPed Cloud'
    };
  }

  function headers(){
    var c = cfg();
    return {
      'apikey': c.key,
      'Authorization': 'Bearer ' + c.key,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    };
  }

  function isEnabled(){ return cfg().enabled && cfg().provider === 'supabase'; }

  function publicConfig(){
    var c = cfg();
    // Nunca retornar a chave; apenas metadados.
    return { enabled: c.enabled, provider: c.provider, url: c.url, label: c.label };
  }

  function rest(table, init){
    var c = cfg();
    if (!c.enabled) return Promise.reject(new Error('cloud-disabled'));
    return fetch(c.url + '/rest/v1/' + table, Object.assign({ headers: headers() }, init || {}));
  }

  // POST /rest/v1/submissions
  function saveSubmission(payload){
    if (!isEnabled()) return Promise.resolve({ ok: false, error: 'cloud-disabled' });
    if (!payload || !payload.instrument_id || !payload.answers_json) {
      return Promise.resolve({ ok: false, error: 'instrument_id e answers_json sao obrigatorios' });
    }
    var row = {
      case_code:        payload.case_code || null,
      patient_code:     payload.patient_code || null,
      instrument_id:    String(payload.instrument_id).slice(0, 120),
      instrument_title: payload.instrument_title ? String(payload.instrument_title).slice(0, 240) : null,
      instrument_group: payload.instrument_group ? String(payload.instrument_group).slice(0, 120) : null,
      answers_json:     payload.answers_json,
      raw_score:        Number.isFinite(payload.raw_score) ? payload.raw_score : null,
      total_items:      Number.isFinite(payload.total_items) ? payload.total_items : null,
      source_page:      (payload.source_page || location.pathname || '').slice(0, 240),
      notes:            payload.notes ? String(payload.notes).slice(0, 1000) : null
    };
    return rest('submissions', { method: 'POST', body: JSON.stringify(row) })
      .then(function(r){
        if (!r.ok) return r.text().then(function(t){ return { ok: false, status: r.status, error: t || ('http ' + r.status) }; });
        return r.json().then(function(j){
          var id = Array.isArray(j) ? (j[0] && j[0].id) : (j && j.id);
          return { ok: true, id: id || null };
        });
      })
      .catch(function(e){ return { ok: false, error: String(e && e.message || e) }; });
  }

  // POST /rest/v1/audit_logs
  function audit(action, entity, entityId, metadata){
    if (!isEnabled()) return Promise.resolve({ ok: false, error: 'cloud-disabled' });
    var row = {
      action: String(action || '').slice(0, 80),
      entity: entity ? String(entity).slice(0, 80) : null,
      entity_id: entityId ? String(entityId).slice(0, 120) : null,
      metadata_json: metadata && typeof metadata === 'object' ? metadata : null
    };
    return rest('audit_logs', { method: 'POST', body: JSON.stringify(row) })
      .then(function(r){ return { ok: r.ok, status: r.status }; })
      .catch(function(e){ return { ok: false, error: String(e && e.message || e) }; });
  }

  // Health: usa GET nao-autenticado em uma rota leve. Nao garante 200 com RLS,
  // mas confirma que o host/url responde e a auth e aceita.
  function health(){
    var c = cfg();
    if (!c.enabled) return Promise.resolve({ ok: false, error: 'cloud-disabled' });
    // Esperado 200/206 (sem linhas) ou 401/403 (RLS bloqueia leitura).
    // Qualquer um deles confirma que url+key chegaram a Supabase.
    return rest('submissions?limit=0', { method: 'GET' })
      .then(function(r){ return { ok: r.status < 500, status: r.status }; })
      .catch(function(e){ return { ok: false, error: String(e && e.message || e) }; });
  }

  window.NeuroPedCloud = {
    enabled: isEnabled,
    config: publicConfig,
    saveSubmission: saveSubmission,
    audit: audit,
    health: health
  };

  function announce(){
    try { document.dispatchEvent(new CustomEvent('np-cloud-ready', { detail: { enabled: isEnabled() } })); } catch (e) {}
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', announce);
  else setTimeout(announce, 0);
})();
