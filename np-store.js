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

  // a criança ativa É o paciente do sistema existente (fonte única de verdade)
  function syncPatient() {
    try {
      if (window.NeuroPedScales && window.NeuroPedScales.setPatient) {
        var c = active();
        window.NeuroPedScales.setPatient(c ? { code: c.id.slice(-5), name: c.name || '' } : { code: '', name: '' });
      }
    } catch (e) {}
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

  window.NPStore = {
    list: list, add: add, update: update, remove: remove,
    active: active, setActive: setActive,
    ageMonths: ageMonths, ageLabel: ageLabel, ageBand: ageBand
  };

  // ao carregar: garante que o paciente do sistema reflita a criança ativa
  syncPatient();
})();
