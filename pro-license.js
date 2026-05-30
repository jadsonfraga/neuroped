/* NeuroPed Pro — desbloqueio por código de licença (offline, sem backend).
 *
 * Como funciona (honesto e seguro):
 *  - Você vende um código (ex.: PRO-XXXX-XXXX) na plataforma de pagamento
 *    (Kiwify/Hotmart/Mercado Pago) e o entrega ao comprador.
 *  - O app NUNCA guarda os códigos em texto. Guarda apenas os HASHES SHA-256
 *    dos códigos válidos (window.NEUROPED_PRO_HASHES, em pro-hashes.js).
 *  - O comprador digita o código → o app calcula o hash → se bater com a lista,
 *    libera o conteúdo Pro NESTE aparelho. Tudo local, nada vai para servidor.
 *
 * Limite honesto: como não há servidor, um código pode ser usado em mais de um
 * aparelho. Isso é aceitável para infoproduto (todo curso online tem o mesmo
 * comportamento). Para revogar, basta remover o hash do lote e republicar.
 */
(function () {
  'use strict';
  var SESSION_KEY = 'np_pro_unlock_v1';

  function norm(s) {
    return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '')
      .toUpperCase().replace(/[^A-Z0-9]/g, '');
  }
  function format(s) {
    var c = norm(s);
    // PRO + 8 chars → PRO-XXXX-XXXX
    return c.replace(/(.{4})/g, '$1-').replace(/-$/, '');
  }
  async function sha256(s) {
    var buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(s)));
    return Array.from(new Uint8Array(buf)).map(function (x) { return x.toString(16).padStart(2, '0'); }).join('');
  }
  function hashes() {
    var h = window.NEUROPED_PRO_HASHES;
    return Array.isArray(h) ? h : [];
  }

  function session() {
    try {
      var s = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
      if (s && s.ok && s.h) return s;
    } catch (e) {}
    return null;
  }
  function isPro() {
    // Sessão local OU PIN master do autor (você sempre tem acesso)
    if (session()) return true;
    try { return !!(window.NeuroPedMasterAccess && window.NeuroPedMasterAccess.isUnlocked()); } catch (e) {}
    return false;
  }
  function clear() { localStorage.removeItem(SESSION_KEY); }

  async function unlock(code) {
    var h = await sha256(norm(code));
    if (hashes().indexOf(h) < 0) {
      return { ok: false, reason: 'Código inválido. Confira as letras e números, ou fale com o suporte.' };
    }
    var s = { ok: true, h: h, at: Date.now() };
    try { localStorage.setItem(SESSION_KEY, JSON.stringify(s)); } catch (e) {}
    return { ok: true };
  }

  window.NeuroPedPro = {
    isPro: isPro,
    unlock: unlock,
    clear: clear,
    session: session,
    format: format,
    sha256: sha256,
    norm: norm
  };
})();
