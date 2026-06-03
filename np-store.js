/* ============================================================
   NeuroPed — np-store.js · Perfil da Criança (espinha de dados)
   Camada local única (namespace np:*) que gerencia múltiplas
   crianças e elege a ATIVA. A criança ativa vira o "paciente" do
   sistema já existente (NeuroPedScales.setPatient) — conecta
   filtro, escalas e histórico SEM duplicar.
   100% local (localStorage). Dados sensíveis de menor: ficam só
   no aparelho, nunca enviados a servidor.
   ============================================================ */
(function () {
  'use strict';
  if (window.NPStore) return;

  var K_CHILDREN = 'np:children';
  var K_ACTIVE = 'np:activeChild';
  // chave que o scales-enhance lê (NeuroPedScales.getPatient). Escrevemos DIRETO
  // nela — sem depender do scales-enhance estar carregado (evita poll/fragilidade).
  var PATIENT_KEY = 'neuroped_scales_patient_v1';

  function read(k, d) { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } }
  function write(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function uid() { return 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

  function list() { var l = read(K_CHILDREN, []); return Array.isArray(l) ? l : []; }

  // idade em meses a partir da data de nascimento (AAAA-MM-DD)
  function ageMonths(c) {
    if (!c || !c.birth) return null;
    var b = new Date(c.birth);
    if (isNaN(b.getTime())) return null;
    var n = new Date();
    var m = (n.getFullYear() - b.getFullYear()) * 12 + (n.getMonth() - b.getMonth());
    if (n.getDate() < b.getDate()) m--;
    return Math.max(0, m);
  }
  function ageLabel(c) {
    var m = ageMonths(c);
    if (m == null) return '';
    if (m < 24) return m + ' meses';
    var a = Math.floor(m / 12), r = m % 12;
    return a + ' ano' + (a > 1 ? 's' : '') + (r ? ' e ' + r + ' m' : '');
  }

  // faixa etária para alimentar o filtro (mesmas bandas do filtro-escalas)
  function ageBand(c) {
    var m = ageMonths(c);
    if (m == null) return '';
    if (m < 36) return '18 meses';
    if (m < 72) return '4 anos';
    if (m < 144) return '9 anos';
    if (m < 216) return '15 anos';
    return '20 anos';
  }

  function active() {
    var id = read(K_ACTIVE, '');
    return list().filter(function (c) { return c.id === id; })[0] || null;
  }

  // a criança ativa É o paciente do sistema existente (fonte única de verdade).
  // Escreve DIRETO na PATIENT_KEY (que o scales-enhance lê) — funciona mesmo sem
  // o scales-enhance carregado, e ainda chama a API quando ela existir.
  function syncPatient() {
    var c = active();
    var p = c ? { code: c.id.slice(-5), name: c.name || '' } : { code: '', name: '' };
    write(PATIENT_KEY, p);
    try { if (window.NeuroPedScales && window.NeuroPedScales.setPatient) window.NeuroPedScales.setPatient(p); } catch (e) {}
  }
  function emit() { try { window.dispatchEvent(new Event('np-child-change')); } catch (e) {} }

  function setActive(id) { write(K_ACTIVE, id || ''); syncPatient(); emit(); }

  function add(data) {
    var l = list();
    var c = { id: uid(), created: Date.now() };
    ['name', 'birth', 'sex', 'diagnosis', 'notes'].forEach(function (k) { if (data && data[k] != null) c[k] = String(data[k]); });
    l.push(c); write(K_CHILDREN, l); setActive(c.id);
    return c;
  }
  function update(id, patch) {
    var l = list().map(function (c) {
      if (c.id !== id) return c;
      ['name', 'birth', 'sex', 'diagnosis', 'notes'].forEach(function (k) { if (patch && patch[k] != null) c[k] = String(patch[k]); });
      return c;
    });
    write(K_CHILDREN, l);
    if (active() && active().id === id) syncPatient();
    emit();
    return l;
  }
  function remove(id) {
    write(K_CHILDREN, list().filter(function (c) { return c.id !== id; }));
    if (read(K_ACTIVE, '') === id) { var l = list(); setActive(l[0] ? l[0].id : ''); }
    else emit();
  }

  // Histórico clínico da criança: lê os resultados de escala (gravados pelo
  // scales-enhance em neuroped_scales_results_v1) filtrados pelo código da criança.
  // É o "dado que não morre na tela" — a avaliação vira histórico longitudinal.
  var RESULTS_KEY = 'neuroped_scales_results_v1';
  function codeOf(c) { return c && c.id ? c.id.slice(-5) : ''; }
  function resultsFor(child) {
    var code = codeOf(child);
    if (!code) return [];
    var all = read(RESULTS_KEY, []);
    if (!Array.isArray(all)) return [];
    return all.filter(function (r) { return r && r.patient_code === code; });
  }

  // Resposta à medicação: stream SEPARADO do histórico de escalas (semântica
  // distinta — é "índice de melhora percebida", NÃO escore de triagem; por isso
  // NÃO entra na linha do tempo das escalas). Guardado por criança em np:medlog.
  var MEDLOG_KEY = 'np:medlog';
  function medLogAll() { var l = read(MEDLOG_KEY, []); return Array.isArray(l) ? l : []; }
  function addMedLog(entry) {
    if (!entry) return null;
    var c = active();
    var e = { id: 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), at: Date.now() };
    e.childId = entry.childId || (c ? c.id : '');
    e.childCode = entry.childCode || codeOf(c);
    ['med', 'tempo', 'pais', 'escola', 'fx', 'note'].forEach(function (k) { if (entry[k] != null) e[k] = entry[k]; });
    var l = medLogAll(); l.push(e); write(MEDLOG_KEY, l.slice(-500)); emit(); return e;
  }
  function medLogFor(child) {
    var id = child && child.id, code = codeOf(child);
    return medLogAll().filter(function (e) { return (id && e.childId === id) || (code && e.childCode === code); })
      .sort(function (a, b) { return (a.at || 0) - (b.at || 0); });
  }

  // Diário (escola/terapias) — leitura só-resumo para a Síntese do caso. O diário é
  // de criança única e casado por NOME; só associamos se bate com a criança ativa
  // (nunca mistura registros de outra criança).
  var DIARY_KEY = 'diario_neuroped_v2';
  function diarySummary(child) {
    var d = read(DIARY_KEY, null);
    if (!d || !Array.isArray(d.registros)) return null;
    var c = d.config && d.config.crianca;
    if (child && child.name && c && c.nome && c.nome.trim().toLowerCase() !== child.name.trim().toLowerCase()) return { count: 0, mismatch: true };
    var regs = d.registros;
    var last = regs.reduce(function (m, r) { var t = Date.parse(String(r.data || '').replace(' ', 'T')) || 0; return t > m ? t : m; }, 0);
    var hum = regs.filter(function (r) { return r.humor; }).map(function (r) { return r.humor; });
    var humAvg = hum.length ? Math.round(hum.reduce(function (a, b) { return a + b; }, 0) / hum.length * 10) / 10 : null;
    var ter = regs.filter(function (r) { return r.tipo && r.tipo !== 'escola'; }).length;
    return { count: regs.length, last: last || null, humorAvg: humAvg, therapy: ter, school: regs.length - ter };
  }

  // Portabilidade (LGPD: portabilidade + backup). Exporta/importa o prontuário local
  // (crianças + ativa + resultados + resposta à medicação). Import MESCLA por id —
  // nunca apaga o que existe.
  function exportAll() {
    return {
      app: 'NeuroPed', kind: 'np-export', v: 1,
      exportedAt: new Date().toISOString(),
      children: list(),
      active: read(K_ACTIVE, ''),
      results: read(RESULTS_KEY, []),
      medlog: medLogAll()
    };
  }
  function importAll(obj) {
    if (!obj || obj.kind !== 'np-export') return { ok: false, error: 'Arquivo inválido' };
    var added = 0, mergedR = 0;
    // crianças: mescla por id
    var cur = list(), byId = {}; cur.forEach(function (c) { byId[c.id] = c; });
    (obj.children || []).forEach(function (c) { if (c && c.id && !byId[c.id]) { cur.push(c); byId[c.id] = c; added++; } });
    write(K_CHILDREN, cur);
    // resultados: mescla por id
    var rs = read(RESULTS_KEY, []); if (!Array.isArray(rs)) rs = [];
    var seen = {}; rs.forEach(function (r) { if (r && r.id) seen[r.id] = 1; });
    (obj.results || []).forEach(function (r) { if (r && r.id && !seen[r.id]) { rs.push(r); seen[r.id] = 1; mergedR++; } });
    write(RESULTS_KEY, rs.slice(0, 1000));
    // resposta à medicação: mescla por id
    var mergedM = 0;
    var ml = medLogAll(); var seenM = {}; ml.forEach(function (m) { if (m && m.id) seenM[m.id] = 1; });
    (obj.medlog || []).forEach(function (m) { if (m && m.id && !seenM[m.id]) { ml.push(m); seenM[m.id] = 1; mergedM++; } });
    write(MEDLOG_KEY, ml.slice(-500));
    if (!read(K_ACTIVE, '') && obj.active) setActive(obj.active); else { syncPatient(); emit(); }
    return { ok: true, children: added, results: mergedR, medlog: mergedM };
  }

  window.NPStore = {
    list: list, add: add, update: update, remove: remove,
    active: active, setActive: setActive,
    ageMonths: ageMonths, ageLabel: ageLabel, ageBand: ageBand,
    resultsFor: resultsFor, code: codeOf,
    addMedLog: addMedLog, medLogFor: medLogFor,
    diarySummary: diarySummary,
    exportAll: exportAll, importAll: importAll
  };

  // ao carregar: garante que o paciente do sistema reflita a criança ativa
  syncPatient();
})();
