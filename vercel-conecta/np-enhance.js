(() => {
  'use strict';

  const SAVE_RE = /(registro|check-?in|dose|crise|observa[cç][aã]o).{0,50}(salv|registrad)/i;
  const PT_REPLACEMENTS = new Map([
    ['Page not found', 'Página não encontrada'],
    ["This page didn't load", 'Não foi possível carregar esta página'],
    ["Something went wrong on our end. You can try refreshing or head back home.", 'Algo não carregou como esperado. Tente novamente ou volte ao início.'],
    ['Try again', 'Tentar novamente'],
    ['Go home', 'Voltar ao início'],
  ]);
  let lastSaveSheetAt = 0;
  let refreshQueued = false;

  function hasLiveSession() {
    try {
      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i) || '';
        if (!/^sb-.+-auth-token$/.test(key)) continue;
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const parsed = JSON.parse(raw);
        const token = parsed?.access_token || parsed?.currentSession?.access_token || parsed?.session?.access_token;
        if (token) return true;
      }
    } catch { /* storage indisponível */ }
    return false;
  }

  function mode() {
    return hasLiveSession() ? 'live' : 'demo';
  }

  function element(tag, className, html) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (html != null) node.innerHTML = html;
    return node;
  }

  function brandHeader() {
    const candidates = document.querySelectorAll('header a[href="/"], main > a[href="/"]');
    candidates.forEach((anchor) => {
      if (anchor.querySelector('[data-np-brand-logo]')) return;
      const img = document.createElement('img');
      img.src = '/brand-logo.jpeg';
      img.alt = 'NeuroPed SDG';
      img.width = 38;
      img.height = 38;
      img.decoding = 'async';
      img.dataset.npBrandLogo = '1';
      img.className = 'np-brand-logo';
      anchor.prepend(img);

      const firstSvg = anchor.querySelector(':scope > svg, :scope > div > svg');
      if (firstSvg && /NeuroPed/i.test(anchor.textContent || '')) firstSvg.classList.add('np-generic-brand-mark');
    });
  }

  function translateFallbacks() {
    document.querySelectorAll('h1,h2,p,a,button').forEach((node) => {
      const value = (node.textContent || '').trim();
      const translated = PT_REPLACEMENTS.get(value);
      if (translated) node.textContent = translated;
    });
  }

  function demoBadge() {
    const isDemo = mode() === 'demo';
    document.documentElement.dataset.npMode = isDemo ? 'demo' : 'live';
    if (!isDemo || document.querySelector('[data-np-demo-pill]') || !location.pathname.startsWith('/app')) return;
    if (/Modo demonstração|DEMONSTRAÇÃO/i.test(document.querySelector('header')?.innerText || '')) return;

    const pill = element('div', 'np-demo-pill', '<span></span> DEMONSTRAÇÃO · dados fictícios');
    pill.dataset.npDemoPill = '1';
    const header = document.querySelector('header');
    if (header) header.appendChild(pill);
  }

  function insightCopy() {
    const text = document.body.innerText || '';
    const sleep = text.match(/Sono ontem\s*([0-9]+h[0-9]{2})/i)?.[1]
      || text.match(/Sono\s*([0-9]+h[0-9]{2})/i)?.[1];
    if (sleep && mode() === 'demo') {
      return {
        eyebrow: 'Insight do dia · demonstração',
        title: `O último sono registrado foi ${sleep}`,
        body: 'Veja a tendência ao longo dos dias antes de interpretar uma mudança isolada.',
      };
    }
    return {
      eyebrow: mode() === 'demo' ? 'Insight do dia · demonstração' : 'Insights dos seus registros',
      title: mode() === 'demo' ? 'Transforme registros em padrões compreensíveis' : 'Entenda mudanças sem transformar tendência em diagnóstico',
      body: mode() === 'demo'
        ? 'O painel explica de onde cada insight veio e quando ainda não há dados suficientes.'
        : 'A análise utiliza somente registros autorizados da conta e informa as limitações dos dados.',
    };
  }

  function injectHomeInsight() {
    const home = /^\/app\/?$|^\/app\/hoje\/?$/.test(location.pathname);
    if (!home || document.querySelector('[data-np-home-insight]')) return;
    const main = document.querySelector('main') || document.querySelector('[role="main"]');
    if (!main) return;

    const copy = insightCopy();
    const card = element('section', 'np-home-insight');
    card.dataset.npHomeInsight = '1';
    card.innerHTML = `
      <div class="np-insight-icon" aria-hidden="true">✦</div>
      <div class="np-insight-copy">
        <span class="np-eyebrow">${copy.eyebrow}</span>
        <h2>${copy.title}</h2>
        <p>${copy.body}</p>
      </div>
      <a class="np-insight-cta" href="/insights">Entender <span aria-hidden="true">→</span></a>`;

    const firstCard = main.querySelector('.surface-card, article, section');
    if (firstCard?.parentElement === main) firstCard.insertAdjacentElement('afterend', card);
    else main.prepend(card);
  }

  function headerInsightsShortcut() {
    if (!location.pathname.startsWith('/app') || document.querySelector('[data-np-insights-shortcut]')) return;
    const header = document.querySelector('header');
    if (!header) return;
    const shortcut = element('a', 'np-insights-shortcut', '<span aria-hidden="true">✦</span><span>Insights</span>');
    shortcut.href = '/insights';
    shortcut.dataset.npInsightsShortcut = '1';
    shortcut.setAttribute('aria-label', 'Abrir Insights');
    header.appendChild(shortcut);
  }

  function showSaveResult() {
    const now = Date.now();
    if (now - lastSaveSheetAt < 3500 || document.querySelector('[data-np-result-sheet]')) return;
    lastSaveSheetAt = now;

    const wrap = element('div', 'np-result-backdrop');
    wrap.dataset.npResultSheet = '1';
    wrap.innerHTML = `
      <section class="np-result-sheet" role="dialog" aria-modal="true" aria-labelledby="np-result-title">
        <div class="np-result-handle" aria-hidden="true"></div>
        <div class="np-result-success" aria-hidden="true">✓</div>
        <p class="np-eyebrow">REGISTRO SALVO</p>
        <h2 id="np-result-title">Já entrou na sua jornada</h2>
        <p class="np-result-message">${mode() === 'demo'
          ? 'Quando houver registros comparáveis, o app passa a mostrar tendências sem inventar conclusões.'
          : 'O registro foi salvo. Insights só serão exibidos quando houver dados suficientes e autorizados.'}</p>
        <div class="np-result-actions">
          <a href="/insights">Ver tendência</a>
          <button type="button" data-np-close-result>Continuar</button>
        </div>
      </section>`;
    const close = () => {
      wrap.classList.add('np-result-leave');
      window.setTimeout(() => wrap.remove(), 220);
    };
    wrap.addEventListener('click', (event) => {
      if (event.target === wrap || event.target.closest('[data-np-close-result]')) close();
    });
    document.body.appendChild(wrap);
    window.setTimeout(close, 10000);
  }

  function inspectSaveFeedback(nodes) {
    for (const node of nodes) {
      const text = node?.textContent || '';
      if (text.length < 240 && SAVE_RE.test(text)) {
        showSaveResult();
        break;
      }
    }
  }

  function protectLiveFromDemoLeak() {
    if (mode() !== 'live' || !location.pathname.startsWith('/app')) return;
    const main = document.querySelector('main') || document.querySelector('[role="main"]');
    if (!main || main.querySelector('.np-live-safety-gate')) return;

    const text = main.innerText || '';
    const leaked = /Lucas Demo|Escola Municipal Aurora|dados fict[ií]cios/i.test(text);
    if (!leaked) return;

    Array.from(main.children).forEach((child) => { child.hidden = true; });
    const gate = element('section', 'np-live-safety-gate');
    gate.hidden = false;
    gate.innerHTML = `
      <img src="/brand-logo.jpeg" alt="NeuroPed SDG" width="64" height="64">
      <span class="np-eyebrow">CONTA REAL · PROTEÇÃO ATIVA</span>
      <h1>Conteúdo demonstrativo bloqueado</h1>
      <p>Esta versão detectou dados de demonstração em uma área autenticada e interrompeu a exibição automaticamente. Nenhum dado fictício será apresentado como se fosse do paciente.</p>
      <div class="np-live-gate-actions">
        <a href="/onboarding">Revisar vínculo</a>
        <a class="secondary" href="/privacidade">Privacidade</a>
      </div>
      <small>O módulo permanece bloqueado até que a origem confirme segregação completa DEMO × REAL.</small>`;
    main.appendChild(gate);
  }

  function routeGuidance() {
    if (!location.pathname.startsWith('/app') || document.querySelector('[data-np-route-note]')) return;
    const main = document.querySelector('main') || document.querySelector('[role="main"]');
    if (!main) return;

    const guides = [
      [/\/app\/jornada\/?$/, 'Jornada longitudinal', 'Compare períodos e contextos. Uma tendência descreve os registros; não atribui diagnóstico nem causalidade.', '/insights', 'Abrir Insights'],
      [/\/app\/escola\/?$/, 'Casa × Escola', 'Registre funcionamento e adaptações por contexto. Diferenças entre ambientes são pistas para discussão, não conclusões clínicas.', '/insights', 'Comparar registros'],
      [/\/app\/terapias\/?$/, 'Metas observáveis', 'Prefira objetivos funcionais e evolução descritiva. Evite porcentagens de progresso sem um critério previamente definido.', '/insights', 'Ver tendências'],
      [/\/app\/medicacoes\/?$/, 'Tratamento com trava clínica', 'O app registra horários, adesão e efeitos percebidos. Alterações de tratamento devem ser realizadas somente pelo profissional responsável.', null, null],
      [/\/app\/documentos\/?$/, 'Cofre de documentos', 'Arquivos clínicos devem permanecer privados e acessíveis apenas por vínculos autorizados. Upload inseguro deve continuar bloqueado.', null, null],
      [/\/app\/equipe\/?$/, 'Acesso por necessidade', 'Mostre de forma simples o que cada pessoa pode ver. Permissão deve ser específica, revogável e vinculada à criança.', null, null],
      [/\/app\/(resumo|pre-consulta)\/?$/, 'Preparar próxima consulta', 'O resumo organiza somente o que foi registrado e deve explicitar lacunas. Resumo informativo; não é diagnóstico nem prescrição.', '/insights', 'Revisar padrões'],
    ];

    const current = guides.find(([pattern]) => pattern.test(location.pathname));
    if (!current) return;
    const [, title, body, href, label] = current;
    const note = element('section', 'np-route-note');
    note.dataset.npRouteNote = '1';
    note.innerHTML = `<div><span class="np-eyebrow">CONTEXTO ÚTIL</span><strong>${title}</strong><p>${body}</p></div>${href ? `<a href="${href}">${label} <span aria-hidden="true">→</span></a>` : ''}`;
    main.prepend(note);
  }

  function seizureSafety() {
    if (!/\/app\/crises\/?$/.test(location.pathname) || document.querySelector('[data-np-seizure-safety]')) return;
    const main = document.querySelector('main') || document.querySelector('[role="main"]');
    if (!main) return;
    const card = element('section', 'np-seizure-safety');
    card.dataset.npSeizureSafety = '1';
    card.innerHTML = `<div class="np-seizure-icon" aria-hidden="true">⌁</div><div><span class="np-eyebrow">SEGURANÇA NA CRISE</span><strong>Proteja, observe o tempo e siga o plano individual.</strong><p>Afaste objetos que possam causar trauma, lateralize quando possível e não coloque nada na boca. Acione o SAMU 192 conforme sinais de gravidade e o plano de emergência individual.</p><small>Este cartão é educativo e não substitui o plano prescrito pela equipe responsável.</small></div>`;
    main.prepend(card);
  }

  function addRegisterHint() {
    if (!/\/app\/registrar\/?$/.test(location.pathname) || document.querySelector('[data-np-register-hint]')) return;
    const main = document.querySelector('main') || document.querySelector('[role="main"]');
    if (!main) return;
    const note = element('div', 'np-register-hint', '<strong>Registre o essencial primeiro.</strong><span>Detalhes adicionais podem ser acrescentados depois; evite preencher por preencher.</span>');
    note.dataset.npRegisterHint = '1';
    main.prepend(note);
  }

  function refresh() {
    refreshQueued = false;
    brandHeader();
    translateFallbacks();
    demoBadge();
    injectHomeInsight();
    headerInsightsShortcut();
    routeGuidance();
    seizureSafety();
    addRegisterHint();
    protectLiveFromDemoLeak();
  }

  function queueRefresh() {
    if (refreshQueued) return;
    refreshQueued = true;
    requestAnimationFrame(refresh);
  }

  const observer = new MutationObserver((mutations) => {
    const added = [];
    mutations.forEach((mutation) => mutation.addedNodes.forEach((node) => added.push(node)));
    inspectSaveFeedback(added);
    queueRefresh();
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      refresh();
      observer.observe(document.documentElement, { childList: true, subtree: true });
    }, { once: true });
  } else {
    refresh();
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  window.addEventListener('popstate', queueRefresh);
})();
