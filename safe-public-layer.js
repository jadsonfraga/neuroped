/* ======================================================
   NeuroPed EDJ — Safe Public Layer v1
   Interceptor de rotas sensíveis no roteamento por hash.
   Redireciona acessos diretos a /pacientes, /prontuario,
   /prescricao, /calculadora-dose, /farmacologia, /laudos
   e similares para a página estática de área restrita.
   ====================================================== */

(function () {
  "use strict";

  // Padrões de rota considerados sensíveis na camada pública.
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
    /^\/gerador-rotinas/i,
    /^\/prescritor-terapias/i,
    /^\/plano-terapeutico/i,
    /^\/plano-intervencao/i,
    /^\/anamnese-inteligente/i,
    /^\/equivalencia-medicamentos/i,
    /^\/portal-documentos/i,
    /^\/portal-chat/i,
    /^\/diario-epilepsia/i
  ];

  function getCurrentPath() {
    var hash = window.location.hash || "";
    if (hash.charAt(0) === "#") hash = hash.slice(1);
    return hash || "/";
  }

  function isSensitive(path) {
    if (!path) return false;
    for (var i = 0; i < SENSITIVE_PATTERNS.length; i++) {
      if (SENSITIVE_PATTERNS[i].test(path)) return true;
    }
    return false;
  }

  function redirectToRestricted(reason) {
    try {
      var basePath = window.location.pathname;
      // Manter dentro do escopo /neuroped/ (subpath do GitHub Pages).
      var target = basePath.replace(/[^/]*$/, "") + "restricted.html";
      var qs = reason ? ("?from=" + encodeURIComponent(reason)) : "";
      window.location.replace(target + qs);
    } catch (e) {
      // Fallback inerte: apenas limpa o hash.
      window.location.hash = "";
    }
  }

  function check() {
    var path = getCurrentPath();
    if (isSensitive(path)) {
      redirectToRestricted(path);
    }
  }

  // Verificação inicial após o bundle carregar.
  if (document.readyState === "complete" || document.readyState === "interactive") {
    setTimeout(check, 0);
  } else {
    window.addEventListener("DOMContentLoaded", check);
  }

  // Verificação contínua em mudanças de rota.
  window.addEventListener("hashchange", check);
  window.addEventListener("popstate", check);
})();
