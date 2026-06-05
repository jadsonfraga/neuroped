/* ============================================================
   NeuroPed SDG — scales-preconsulta-gate.js
   ------------------------------------------------------------
   DEFINIÇÃO ÚNICA do que entra (ou não) na PRÉ-CONSULTA — a fonte
   da verdade compartilhada por filtro-escalas, intake e pelos testes.

   O filtro/intake são o momento de TRIAGEM que a secretária entrega ao
   paciente/familiar antes da consulta. Ficam DE FORA:
     1) DIÁRIOS (família/paciente/longitudinais) — são acompanhamento,
        não triagem. Vivem no painel de diários (diarios.html).
     2) BANCOS/lotes — agrupadores, não instrumentos aplicáveis.
     3) Instrumentos de APLICAÇÃO CLÍNICA — entrevistas estruturadas,
        observação clínica, classificações funcionais e gates de risco
        exigem profissional treinado e juízo ativo (a secretária não os
        entrega na sala de espera). Ex.: C-SSRS, Columbia, GMFCS, CARS,
        Vineland, Conners, CBCL, ADOS/ADI-R, WISC/WAIS/WPPSI.

   Puro, sem dependências. Browser (window.NeuroPedPreConsultaGate) +
   Node (module.exports) para teste unitário.
   ============================================================ */
(function (root) {
  'use strict';

  function norm(s) {
    return String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }

  // 1) DIÁRIO — sinal factual kind==='diário'/daily prevalece sobre o título
  // (havia diários titulados "Inventário … ritmo diário" e registros longitudinais).
  function isDiary(s) {
    if (!s) return false;
    if (s.kind === 'diário' || s.kind === 'diario' || s.daily === true) return true;
    var id = norm(s.id);
    if (/(^|[-_])diario(s)?([-_]|$)/.test(id)) return true;
    var t = norm([s.title, s.short_title, s.domain].join(' '));
    if (/\bdiario\b|registro diario|controle diario|monitoramento longitud|acompanhamento longitud|longitudinal/.test(t)) return true;
    return false;
  }

  // 2) BANCO/lote — agrupador, não instrumento individual aplicável
  function isBank(s) {
    return !!s && /lote|banco completo/i.test(s.title || '');
  }

  // 3) APLICAÇÃO CLÍNICA — gate conservador: o catálogo não traz duração/training,
  // então cruzamos uma blocklist de IDs conhecidos + padrão de nome (cirúrgico).
  var CLINICAL_BLOCK = {
    'ofc-cssrs': 1, 'ofc-asq': 1, 'ofc-asq-suicide': 1, 'ofc-gmfcs-er': 1, 'ofc-gmfcs': 1,
    'ofc-cars-2': 1, 'ofc-vineland-3': 1, 'ofc-conners-3': 1, 'ofc-cbcl': 1
  };
  // 'suicid' casa PT (suicídio/suicida → suicidio/suicida) E EN (suicide, pois
  // contém 'suicid'); rede de segurança: rastreio de risco NUNCA é auto-aplicado
  // pela família/secretaria na sala de espera, qualquer que seja o ID.
  var CLINICAL_RE = /entrevista (clinic|estrutur|diagnost|semiestrut)|observacao clinica estrutur|\bados\b|\badi-?r\b|\bcars\b|vineland|conners|c-?ssrs|columbia.*(suic|risco|ideac)|suicid|autoexterm|automutila|autolesao|ideacao suicida|risco de vida|escala de inteligenc|\bwisc\b|\bwais\b|\bwppsi\b|gmfcs/;
  function isClinicalOnly(s) {
    if (!s) return false;
    if (CLINICAL_BLOCK[s.id]) return true;
    return CLINICAL_RE.test(norm([s.title, s.short_title, s.domain].join(' ')));
  }

  // allow(s): o instrumento é entregável na pré-consulta?
  function allow(s) {
    return !!s && !!s.id && !isDiary(s) && !isBank(s) && !isClinicalOnly(s);
  }

  // filter(catalog): aplica o gate a uma lista do catálogo.
  function filter(catalog) {
    return (catalog || []).filter(allow);
  }

  var api = {
    version: '1.0.0',
    isDiary: isDiary, isBank: isBank, isClinicalOnly: isClinicalOnly,
    allow: allow, filter: filter, CLINICAL_BLOCK: CLINICAL_BLOCK
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.NeuroPedPreConsultaGate = api;
})(typeof window !== 'undefined' ? window : null);
