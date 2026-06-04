/* ============================================================
   NeuroPed EDJ — public-mode.js · Modo público (educacional), SEM SENHAS
   ============================================================
   Decisão do Dr. Jadson: divulgar o app ao público como ferramenta
   EDUCACIONAL. Não há senha em lugar nenhum. Como não dá para "proteger
   sem senha", as áreas sensíveis (operação clínica profissional, admin,
   monetização e páginas de dev/teste) ficam OCULTAS do deploy público:

     1) Se a página atual é sensível → redireciona para a home (sem piscar).
     2) Remove da interface os links que apontam para páginas ocultas
        (varredura inicial + observador de mutações para conteúdo dinâmico).
     3) Bloqueia rotas internas sensíveis do SPA (#/prontuario, #/secretaria…).

   Carrega CEDO (script bloqueante no <head>) para o redirect acontecer antes
   de qualquer conteúdo sensível pintar. Idempotente.
   ------------------------------------------------------------
   Lista do que fica oculto e por quê: ver docs/PUBLICO-O-QUE-FICA-OCULTO.md
   ============================================================ */
(function () {
  'use strict';
  if (window.__npPublicMode) return; window.__npPublicMode = true;

  // ---- Páginas OCULTAS no público (nome do arquivo, minúsculo) ----
  var HIDDEN_PAGES = {
    // Operação clínica profissional / dados de paciente
    'consulta.html': 1, 'consulta-livre.html': 1, 'intake.html': 1,
    'assinatura-digital.html': 1, 'perfil-laudo.html': 1,
    // Administração / secretaria / financeiro
    'secretaria.html': 1, 'agenda-financeiro.html': 1,
    // Monetização (REMOVIDA): Pro + e-book + licenças + passe pago
    'gerar-licencas-pro.html': 1, 'neuroped-pro.html': 1,
    'neuroped-master-vitrine.html': 1, 'solicitar-neuroped-master.html': 1,
    'ativar-passe-familiar.html': 1, 'politica-acesso-familiar.html': 1,
    // Auditoria / dev / teste / demonstração interna / status
    'auditoria-ontologia.html': 1, 'auditoria-operacional.html': 1,
    'qa-smoke-test.html': 1, 'teste-e2e-manual.html': 1, 'teste-ouro-pin.html': 1,
    'scale-engine-demo.html': 1, 'clinical-trajetoria-demo.html': 1, 'ds-pilot.html': 1,
    'verificar.html': 1, 'verificar-app.html': 1, 'cloud-status.html': 1,
    'setup.html': 1, 'guia-lancamento.html': 1
  };

  // ---- Rotas internas sensíveis do SPA (hash) ----
  var SENSITIVE_HASH = [
    /pacientes?(\/|$|\?)/i, /prontuario/i, /prescri(c|ç)/i, /receita/i, /\blaudo/i,
    /secretaria/i, /portal-documentos/i, /portal-chat/i, /portal-acompanhamento/i,
    /relatorio-familia/i, /relatorio-consolidado/i, /certificado-digital/i,
    /calculadora-dose/i, /farmacolog/i, /alarme-medicacao/i, /lembretes/i,
    /gerador-laudo/i, /prescritor/i, /plano-(terapeutico|intervencao)/i,
    /anamnese/i, /equivalencia-medicamentos/i, /diario-epilepsia/i
  ];

  function file() { try { return (location.pathname.split('/').pop() || 'index.html').toLowerCase(); } catch (e) { return 'index.html'; } }
  function base() { try { return location.pathname.replace(/[^/]*$/, ''); } catch (e) { return './'; } }

  // ---- 1) Página oculta → redireciona ANTES de pintar ----
  if (HIDDEN_PAGES[file()]) {
    try { document.documentElement.style.visibility = 'hidden'; } catch (e) {}
    try { location.replace(base() + 'index.html?indisponivel=' + encodeURIComponent(file())); } catch (e) { location.href = './index.html'; }
    return;
  }

  // ---- 3) Bloqueia rota interna sensível do SPA ----
  function hashSensitive() {
    var h = (location.hash || '').replace(/^#/, '');
    if (!h) return false;
    for (var i = 0; i < SENSITIVE_HASH.length; i++) if (SENSITIVE_HASH[i].test(h)) return true;
    return false;
  }
  function guardHash() {
    if (hashSensitive()) { try { location.replace(base() + 'index.html?indisponivel=rota'); } catch (e) { location.hash = ''; } }
  }

  // ---- 2) Remove links para páginas ocultas ----
  function linkHidden(a) {
    try {
      if (!a || !a.getAttribute) return false;
      var href = a.getAttribute('href') || '';
      if (!href || href.charAt(0) === '#') {                 // rota interna do SPA
        return SENSITIVE_HASH.some(function (re) { return re.test(href); });
      }
      var f = (href.split('#')[0].split('?')[0].split('/').pop() || '').toLowerCase();
      if (HIDDEN_PAGES[f]) return true;
      var hash = href.indexOf('#') >= 0 ? href.slice(href.indexOf('#') + 1) : '';
      return hash && SENSITIVE_HASH.some(function (re) { return re.test(hash); });
    } catch (e) { return false; }
  }
  function scrubLinks(root) {
    try {
      var as = (root || document).querySelectorAll('a[href]');
      for (var i = 0; i < as.length; i++) {
        if (as[i].__npHidden) continue;
        if (linkHidden(as[i])) {
          as[i].__npHidden = 1;
          // remove o card/botão inteiro quando o link é o container clicável
          var host = as[i].closest ? (as[i].closest('.card,.feat,li,.np-card,.sc-card,.tile,.menu-item') || as[i]) : as[i];
          host.setAttribute('aria-hidden', 'true');
          host.style.display = 'none';
        }
      }
    } catch (e) {}
  }

  function start() {
    scrubLinks(document);
    guardHash();
    try {
      var mo = new MutationObserver(function (muts) {
        for (var i = 0; i < muts.length; i++) {
          var added = muts[i].addedNodes; if (!added) continue;
          for (var j = 0; j < added.length; j++) {
            var n = added[j];
            if (n.nodeType === 1) { if (n.matches && n.matches('a[href]')) { if (linkHidden(n)) { n.style.display = 'none'; } } scrubLinks(n); }
          }
        }
      });
      mo.observe(document.documentElement, { childList: true, subtree: true });
    } catch (e) {}
    window.addEventListener('hashchange', guardHash);
    window.addEventListener('popstate', guardHash);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
