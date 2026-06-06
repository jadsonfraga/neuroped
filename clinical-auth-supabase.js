/* =====================================================================
   NeuroPed SDG · clinical-auth-supabase.js
   Adaptador de AUTENTICAÇÃO REAL (Supabase Auth / GoTrue via REST).
   ---------------------------------------------------------------------
   POR QUE EXISTE: o clinical-auth-adapter.js atual autentica por PIN no
   localStorage — é proteção de UX, NÃO autenticação. Este módulo entrega
   auth de servidor (magic link por e-mail + sessão JWT + papel via RLS),
   no mesmo estilo SEM bundler do np-cloud.js (fetch direto à API REST).

   ⚠️ ESTADO: ESQUELETO. Não é carregado por nenhuma página ainda. Só passa
   a valer DEPOIS de:
     1) provisionar o Supabase (ver docs/BACKEND_GO_LIVE.md),
     2) preencher cloud-config.js com URL + anon REAIS e enabled:true,
     3) habilitar este adaptador (NEUROPED_CLOUD.auth = true),
     4) TESTAR login + RLS ponta a ponta.
   Enquanto isso, o app segue local-first, inalterado.

   API (espelha clinical-auth-adapter p/ ser drop-in no futuro):
     NeuroPedAuthSupabase.isEnabled()
     NeuroPedAuthSupabase.signIn(email)            -> envia magic link
     NeuroPedAuthSupabase.completeFromRedirect()   -> captura tokens do #hash
     NeuroPedAuthSupabase.currentUser()            -> {id,email,...}|null (cache)
     NeuroPedAuthSupabase.fetchUser()              -> valida no servidor (async)
     NeuroPedAuthSupabase.role()                   -> papel via tabela profiles (async)
     NeuroPedAuthSupabase.logout()                 -> encerra sessão
     NeuroPedAuthSupabase.isAuthenticated()
   Helpers PUROS (testáveis em Node): parseAuthHash, isExpired, buildOtpBody.
   ===================================================================== */
(function (root) {
  'use strict';

  var SESSION_KEY = 'np:auth:supabase:v1';

  // ── Config (reusa o mesmo objeto do np-cloud) ──────────────────────────
  function cfg() {
    var c = (root && root.NEUROPED_CLOUD) || {};
    return {
      url: String(c.supabaseUrl || '').replace(/\/+$/, ''),
      anon: c.supabasePublicAnon || '',
      // Auth é um opt-in SEPARADO do sync (np-cloud): só liga com auth:true.
      enabled: !!c.enabled && !!c.supabaseUrl && !!c.supabasePublicAnon && c.auth === true
    };
  }
  function isEnabled() { return cfg().enabled; }

  // ── Helpers PUROS (sem rede; testados no gate) ─────────────────────────
  // parseAuthHash('#access_token=a&refresh_token=r&expires_in=3600&token_type=bearer')
  //   -> { access_token, refresh_token, expires_at(ms), token_type }  |  null
  function parseAuthHash(hash) {
    if (!hash) return null;
    var h = String(hash).replace(/^#/, '');
    if (!h) return null;
    var out = {};
    h.split('&').forEach(function (kv) {
      var i = kv.indexOf('=');
      if (i < 0) return;
      out[decodeURIComponent(kv.slice(0, i))] = decodeURIComponent(kv.slice(i + 1));
    });
    if (!out.access_token) return null;
    var expSec = parseInt(out.expires_in, 10);
    return {
      access_token: out.access_token,
      refresh_token: out.refresh_token || '',
      token_type: out.token_type || 'bearer',
      expires_at: Date.now() + (isNaN(expSec) ? 3600 : expSec) * 1000
    };
  }
  // isExpired(session, skewMs?) — true se a sessão já passou (com margem de segurança)
  function isExpired(session, skewMs) {
    if (!session || !session.expires_at) return true;
    return Date.now() >= (session.expires_at - (skewMs || 30000));
  }
  // buildOtpBody(email, redirectTo) — corpo do POST /auth/v1/otp (magic link)
  function buildOtpBody(email, redirectTo) {
    var body = { email: String(email || '').trim().toLowerCase(), create_user: true };
    if (redirectTo) body.options = { email_redirect_to: redirectTo };
    return body;
  }

  // ── Sessão (localStorage) ──────────────────────────────────────────────
  function readSession() { try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch (_) { return null; } }
  function writeSession(s) { try { localStorage.setItem(SESSION_KEY, JSON.stringify(s)); } catch (_) {} }
  function clearSession() { try { localStorage.removeItem(SESSION_KEY); } catch (_) {} }
  function currentUser() { var s = readSession(); return (s && !isExpired(s) && s.user) ? s.user : null; }
  function isAuthenticated() { return !!currentUser(); }

  function headers(bearer) {
    var c = cfg();
    var h = { 'apikey': c.anon, 'Content-Type': 'application/json' };
    if (bearer) h['Authorization'] = 'Bearer ' + bearer;
    return h;
  }

  // ── Fluxos (rede; só rodam com isEnabled()) ────────────────────────────
  // signIn: envia magic link para o e-mail; o usuário volta pela URL de redirect.
  function signIn(email, redirectTo) {
    var c = cfg();
    if (!c.enabled) return Promise.reject(new Error('auth_disabled'));
    return fetch(c.url + '/auth/v1/otp', {
      method: 'POST', headers: headers(),
      body: JSON.stringify(buildOtpBody(email, redirectTo || (root.location && root.location.href.split('#')[0])))
    }).then(function (r) { return r.ok ? { ok: true } : r.json().then(function (e) { throw new Error(e.error_description || e.msg || 'otp_failed'); }); });
  }

  // completeFromRedirect: se a URL trouxe tokens no #hash (retorno do magic link),
  // valida o usuário no servidor e grava a sessão. Limpa o hash da URL.
  function completeFromRedirect() {
    if (!isEnabled() || !root.location) return Promise.resolve(null);
    var parsed = parseAuthHash(root.location.hash);
    if (!parsed) return Promise.resolve(currentUser());
    return fetchUserWith(parsed.access_token).then(function (user) {
      var session = { access_token: parsed.access_token, refresh_token: parsed.refresh_token, expires_at: parsed.expires_at, user: user };
      writeSession(session);
      try { history.replaceState(null, '', root.location.pathname + root.location.search); } catch (_) {}
      return user;
    });
  }

  function fetchUserWith(bearer) {
    var c = cfg();
    return fetch(c.url + '/auth/v1/user', { headers: headers(bearer) })
      .then(function (r) { if (!r.ok) throw new Error('user_unauthorized'); return r.json(); })
      .then(function (u) { return { id: u.id, email: u.email, created_at: u.created_at }; });
  }
  function fetchUser() { var s = readSession(); return s && s.access_token ? fetchUserWith(s.access_token) : Promise.resolve(null); }

  // role: papel do usuário a partir da tabela profiles (RLS deixa ler só o próprio).
  function role() {
    var c = cfg(), s = readSession();
    if (!c.enabled || !s || !s.access_token || !s.user) return Promise.resolve(null);
    return fetch(c.url + '/rest/v1/profiles?select=role&user_id=eq.' + encodeURIComponent(s.user.id), { headers: headers(s.access_token) })
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (rows) { return (rows && rows[0] && rows[0].role) || null; });
  }

  function logout() {
    var c = cfg(), s = readSession();
    clearSession();
    if (c.enabled && s && s.access_token) {
      return fetch(c.url + '/auth/v1/logout', { method: 'POST', headers: headers(s.access_token) }).then(function () {}, function () {});
    }
    return Promise.resolve();
  }

  var api = {
    version: '0.1.0-scaffold',
    isEnabled: isEnabled,
    signIn: signIn,
    completeFromRedirect: completeFromRedirect,
    currentUser: currentUser,
    fetchUser: fetchUser,
    role: role,
    logout: logout,
    isAuthenticated: isAuthenticated,
    // helpers puros expostos p/ teste
    parseAuthHash: parseAuthHash,
    isExpired: isExpired,
    buildOtpBody: buildOtpBody
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.NeuroPedAuthSupabase = api;
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
