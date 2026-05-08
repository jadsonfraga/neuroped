/* ======================================================
   NeuroPed EDJ — Safe Public Layer v36
   Regra:
   - Primeiro dá chance de digitar PIN master.
   - Só após erro de PIN a Consulta mostra opção de voltar.
   - Portal da família educativo segue livre.
   - Dados sensíveis seguem protegidos.
   ====================================================== */
(function () {
  "use strict";
  var FAMILY_PUBLIC_PATTERNS = [
    /^\/portal-familias?(\/|$|\?)/i,
    /^\/portal-biblioteca(\/|$|\?)/i,
    /^\/portal-novidades(\/|$|\?)/i,
    /^\/portal-psicoeducacao(\/|$|\?)/i,
    /^\/portal-faq(\/|$|\?)/i,
    /^\/portal-recursos(\/|$|\?)/i,
    /^\/orientacao-parental(\/|$|\?)/i,
    /^\/guia-terapias(\/|$|\?)/i,
    /^\/marcos-desenvolvimento(\/|$|\?)/i,
    /^\/gerador-rotinas(\/|$|\?)/i,
    /^\/testes-cognitivos(\/|$|\?)/i,
    /^\/testes-conhecimentos-gerais(\/|$|\?)/i,
    /^\/teste-conhecimento(\/|$|\?)/i,
    /^\/teste-escrita(\/|$|\?)/i
  ];
  var SENSITIVE_PATTERNS = [
    /^\/pacientes(\/|$|\?)/i,
    /^\/paciente\//i,
    /^\/prontuario(\/|$|\?)/i,
    /^\/prescri(c|ç)/i,
    /^\/receita/i,
    /^\/calculadora-dose/i,
    /^\/farmacolog/i,
    /^\/laudo/i,
    /^\/relatorio-familia/i,
    /^\/relatorio-consolidado/i,
    /^\/certificado-digital/i,
    /^\/alarme-medicacao/i,
    /^\/lembretes/i,
    /^\/secretaria/i,
    /^\/gerador-laudo/i,
    /^\/prescritor-terapias/i,
    /^\/plano-terapeutico/i,
    /^\/plano-intervencao/i,
    /^\/anamnese-inteligente/i,
    /^\/equivalencia-medicamentos/i,
    /^\/portal-documentos/i,
    /^\/portal-chat/i,
    /^\/portal-acompanhamento/i,
    /^\/diario-conquistas/i,
    /^\/linha-do-tempo/i,
    /^\/diario-epilepsia/i
  ];
  function getCurrentPath() {
    var hash = window.location.hash || "";
    if (hash.charAt(0) === "#") hash = hash.slice(1);
    return hash || "/";
  }
  function matches(path, patterns) {
    if (!path) return false;
    for (var i = 0; i < patterns.length; i++) if (patterns[i].test(path)) return true;
    return false;
  }
  function masterUnlocked() {
    try { return !!(window.NeuroPedMasterAccess && window.NeuroPedMasterAccess.isUnlocked && window.NeuroPedMasterAccess.isUnlocked()); }
    catch (e) { return false; }
  }
  function goToPin(path) {
    try {
      var basePath = window.location.pathname;
      var target = basePath.replace(/[^/]*$/, "") + "consulta.html?next=" + encodeURIComponent(path || "/");
      window.location.replace(target);
    } catch (e) { window.location.hash = ""; }
  }
  function check() {
    var path = getCurrentPath();
    if (masterUnlocked()) return;
    if (matches(path, FAMILY_PUBLIC_PATTERNS)) return;
    if (matches(path, SENSITIVE_PATTERNS)) goToPin(path);
  }
  if (document.readyState === "complete" || document.readyState === "interactive") setTimeout(check, 0);
  else window.addEventListener("DOMContentLoaded", check);
  window.addEventListener("hashchange", check);
  window.addEventListener("popstate", check);
})();