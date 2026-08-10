(() => {
  'use strict';

  const state = { period: 30, mode: 'demo', rows: [], child: null, limitation: null };
  const $ = (id) => document.getElementById(id);
  const grid = $('insight-grid');
  const modeBanner = $('mode-banner');
  const sourceLabels = { symptom_logs: 'Registros rápidos', observations: 'Observações', seizure_logs: 'Eventos neurológicos' };

  function storageSession() {
    try {
      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i) || '';
        const match = key.match(/^sb-(.+)-auth-token$/);
        if (!match) continue;
        const parsed = JSON.parse(localStorage.getItem(key) || 'null');
        const session = parsed?.currentSession || parsed?.session || parsed;
        if (session?.access_token) return { key, projectRef: match[1], session };
      }
    } catch { /* storage bloqueado */ }
    return null;
  }

  const liveSession = storageSession();
  state.mode = liveSession ? 'live' : 'demo';

  function demoRows() {
    const now = Date.now();
    const day = 86400000;
    const rows = [];
    const sleep = [7.33, 7.8, 6.9, 7.15, 8.0, 7.45, 7.05, 7.6, 7.25, 6.8, 7.4, 7.2, 7.7, 7.1];
    sleep.forEach((hours, index) => rows.push({
      table: 'symptom_logs', kind: 'Sono', numeric: hours, intensity: null,
      occurred_at: new Date(now - index * day).toISOString(), context: 'Casa', id: `demo-s-${index}`,
    }));
    [1,2,5,8,9,12].forEach((offset, index) => rows.push({
      table: 'symptom_logs', kind: 'Irritabilidade', numeric: null, intensity: [2,3,2,4,3,2][index],
      occurred_at: new Date(now - offset * day + 17 * 3600000).toISOString(), context: 'Casa', id: `demo-i-${index}`,
    }));
    [0,3,7,10].forEach((offset, index) => rows.push({
      table: 'observations', kind: 'Escola', numeric: null, intensity: null,
      occurred_at: new Date(now - offset * day + 10 * 3600000).toISOString(), context: 'Escola', id: `demo-e-${index}`,
      title: index < 3 ? 'Boa participação com apoio visual' : 'Atenção oscilante em atividade longa',
    }));
    return rows;
  }

  async function discoverSupabase() {
    let url = sessionStorage.getItem('np:supabase:url');
    let anon = sessionStorage.getItem('np:supabase:anon');
    if (url && anon) return { url, anon };

    try {
      const html = await fetch('/', { cache: 'no-store' }).then((r) => r.text());
      const srcs = [...html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)]
        .map((match) => match[1])
        .filter((src) => src.startsWith('/') && /\.js(?:\?|$)/.test(src))
        .slice(0, 8);

      for (const src of srcs) {
        const text = await fetch(src, { cache: 'force-cache' }).then((r) => r.text());
        const urlMatch = text.match(/https:\/\/[a-z0-9-]+\.supabase\.co/i);
        const jwtMatches = text.match(/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g) || [];
        if (urlMatch && !url) url = urlMatch[0];
        if (!anon) {
          for (const token of jwtMatches) {
            try {
              const part = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
              const padded = part + '='.repeat((4 - part.length % 4) % 4);
              const payload = JSON.parse(atob(padded));
              if (payload?.role === 'anon') { anon = token; break; }
            } catch { /* não é JWT anon */ }
          }
        }
        if (url && anon) break;
      }
    } catch { /* descoberta é opcional */ }

    if (url) sessionStorage.setItem('np:supabase:url', url);
    if (anon) sessionStorage.setItem('np:supabase:anon', anon);
    return url && anon ? { url, anon } : null;
  }

  async function rest(config, path, accessToken) {
    const response = await fetch(`${config.url}/rest/v1/${path}`, {
      headers: { apikey: config.anon, Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
      cache: 'no-store',
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }

  async function loadLive() {
    const config = await discoverSupabase();
    if (!config || !liveSession?.session?.access_token) {
      state.limitation = 'A sessão está ativa, mas esta camada ainda não conseguiu confirmar a configuração pública necessária para ler os registros com RLS.';
      return [];
    }

    try {
      const token = liveSession.session.access_token;
      const children = await rest(config, 'children?select=id,full_name,preferred_name&deleted_at=is.null&order=created_at.asc&limit=1', token);
      const child = children?.[0];
      if (!child) {
        state.limitation = 'Nenhuma criança ou adolescente vinculado foi encontrado para esta conta.';
        return [];
      }
      state.child = child.preferred_name || child.full_name;
      const childId = encodeURIComponent(child.id);
      const since = new Date(Date.now() - 190 * 86400000).toISOString();
      const queries = [
        ['observations', `observations?select=id,domain,title,body,context,occurred_at&child_id=eq.${childId}&occurred_at=gte.${encodeURIComponent(since)}&deleted_at=is.null&order=occurred_at.desc&limit=400`],
        ['symptom_logs', `symptom_logs?select=*&child_id=eq.${childId}&occurred_at=gte.${encodeURIComponent(since)}&deleted_at=is.null&order=occurred_at.desc&limit=400`],
        ['seizure_logs', `seizure_logs?select=id,started_at,duration_seconds,description,context,recovery,rescue_used&child_id=eq.${childId}&started_at=gte.${encodeURIComponent(since)}&deleted_at=is.null&order=started_at.desc&limit=200`],
      ];
      const settled = await Promise.allSettled(queries.map(async ([table, query]) => [table, await rest(config, query, token)]));
      const rows = [];
      settled.forEach((result) => {
        if (result.status !== 'fulfilled') return;
        const [table, data] = result.value;
        (data || []).forEach((row) => rows.push(normalizeRow(table, row)));
      });
      return rows.filter(Boolean);
    } catch {
      state.limitation = 'Não foi possível carregar os registros autorizados agora. Nenhum insight foi estimado com dados fictícios.';
      return [];
    }
  }

  function firstNumber(row) {
    for (const key of ['value_numeric','value_number','numeric_value','hours','duration_hours','value']) {
      const value = Number(row?.[key]);
      if (Number.isFinite(value)) return value;
    }
    return null;
  }

  function normalizeRow(table, row) {
    const occurred = table === 'seizure_logs' ? row.started_at : row.occurred_at;
    if (!occurred) return null;
    return {
      table,
      id: String(row.id || `${table}-${occurred}`),
      occurred_at: occurred,
      kind: table === 'observations' ? (row.domain || 'Observação') : table === 'seizure_logs' ? 'Evento neurológico' : (row.kind || 'Registro'),
      title: row.title || row.description || row.value_text || '',
      context: row.context || '',
      intensity: Number.isFinite(Number(row.intensity)) ? Number(row.intensity) : null,
      numeric: firstNumber(row),
      duration: Number.isFinite(Number(row.duration_seconds)) ? Number(row.duration_seconds) : null,
    };
  }

  function filteredRows() {
    const threshold = Date.now() - state.period * 86400000;
    return state.rows.filter((row) => new Date(row.occurred_at).getTime() >= threshold);
  }

  function dayPart(date) {
    const hour = new Date(date).getHours();
    if (hour < 12) return 'manhã';
    if (hour < 18) return 'tarde';
    return 'noite';
  }

  function insight(id, icon, title, body, meta) { return { id, icon, title, body, meta }; }

  function buildInsights(rows) {
    const insights = [];
    if (rows.length < 5) return insights;

    const byKind = new Map();
    rows.forEach((row) => {
      const key = String(row.kind || 'Registro');
      if (!byKind.has(key)) byKind.set(key, []);
      byKind.get(key).push(row);
    });
    const ranked = [...byKind.entries()].sort((a,b) => b[1].length - a[1].length);
    const top = ranked[0];
    if (top && top[1].length >= 3) {
      insights.push(insight('frequency','↗',`${top[0]} aparece com mais frequência neste período`, `${top[1].length} de ${rows.length} registros disponíveis pertencem a essa categoria. Frequência não indica causa ou gravidade por si só.`, {
        period: state.period, count: rows.length, sources: [...new Set(top[1].map((r) => sourceLabels[r.table] || r.table))].join(', '), limitation: 'A frequência depende de quando e do que foi registrado; dias sem registro não são considerados normais.',
      }));
    }

    const parts = { manhã:0, tarde:0, noite:0 };
    rows.forEach((row) => { parts[dayPart(row.occurred_at)] += 1; });
    const [part, count] = Object.entries(parts).sort((a,b) => b[1]-a[1])[0];
    if (count >= 4 && count / rows.length >= .45) {
      insights.push(insight('time','◷',`Maior concentração de registros à ${part}`, `${count} de ${rows.length} registros ocorreram nesse período do dia. Pode ser útil discutir o contexto em que esses registros acontecem.`, {
        period: state.period, count: rows.length, sources: 'Linha do tempo', limitation: 'Horário de registro pode não corresponder exatamente ao início do comportamento ou sintoma.',
      }));
    }

    const half = Date.now() - (state.period * 86400000) / 2;
    const recent = rows.filter((r) => new Date(r.occurred_at).getTime() >= half);
    const prior = rows.filter((r) => new Date(r.occurred_at).getTime() < half);
    if (recent.length >= 3 && prior.length >= 3) {
      const delta = recent.length - prior.length;
      if (Math.abs(delta) >= 2) {
        insights.push(insight('change', delta > 0 ? '↑' : '↓', delta > 0 ? 'Mais registros na metade mais recente do período' : 'Menos registros na metade mais recente do período', `${recent.length} registros na metade mais recente versus ${prior.length} na metade anterior. Isso pode refletir mudança real ou simplesmente diferença na frequência de preenchimento.`, {
          period: state.period, count: rows.length, sources: 'Todos os registros', limitation: 'Contagem de registros mede documentação, não intensidade clínica.',
        }));
      }
    }

    const seizures = rows.filter((r) => r.table === 'seizure_logs');
    if (seizures.length >= 2) {
      const seizureParts = { manhã:0, tarde:0, noite:0 };
      seizures.forEach((row) => { seizureParts[dayPart(row.occurred_at)] += 1; });
      const [seizurePart, seizureCount] = Object.entries(seizureParts).sort((a,b) => b[1]-a[1])[0];
      insights.push(insight('neuro','⌁','Eventos neurológicos registrados no período', `${seizures.length} eventos foram registrados; ${seizureCount} ocorreram à ${seizurePart}. Leve a descrição e, quando houver, os vídeos para revisão profissional.`, {
        period: state.period, count: seizures.length, sources: 'Diário de eventos neurológicos', limitation: 'O aplicativo não classifica o tipo de crise nem confirma natureza epiléptica.',
      }));
    }

    if (state.mode === 'demo') {
      const sleep = rows.filter((r) => String(r.kind).toLowerCase().includes('sono') && Number.isFinite(r.numeric));
      if (sleep.length >= 5) {
        const avg = sleep.reduce((sum,row) => sum + row.numeric, 0) / sleep.length;
        insights.unshift(insight('sleep','☾','Sono recente na demonstração', `A média dos ${sleep.length} registros fictícios disponíveis é ${avg.toFixed(1).replace('.',',')} horas. O gráfico deve ser interpretado como tendência, não como meta individual.`, {
          period: state.period, count: sleep.length, sources: 'Sono · dados fictícios', limitation: 'Demonstração: estes números não pertencem a um paciente real e não definem necessidade individual de sono.',
        }));
      }
    }

    return insights.slice(0, 6);
  }

  function updatedLabel(rows) {
    if (!rows.length) return 'Sem dados';
    const latest = rows.reduce((a,b) => new Date(a.occurred_at) > new Date(b.occurred_at) ? a : b);
    return new Intl.DateTimeFormat('pt-BR', { day:'2-digit', month:'short' }).format(new Date(latest.occurred_at));
  }

  function render() {
    const rows = filteredRows();
    $('kpi-records').textContent = String(rows.length);
    $('kpi-sources').textContent = String(new Set(rows.map((r) => r.table)).size);
    $('kpi-updated').textContent = updatedLabel(rows);
    $('period-label').textContent = `Últimos ${state.period} dias`;

    document.querySelectorAll('[data-period]').forEach((button) => button.setAttribute('aria-pressed', String(Number(button.dataset.period) === state.period)));
    const insights = buildInsights(rows);
    if (!insights.length) {
      grid.innerHTML = `<div class="np-insight-empty"><strong>Ainda não há dados suficientes para uma tendência segura.</strong><span>${state.limitation || 'Continue registrando apenas o que for relevante. O app não completa lacunas por suposição.'}</span></div>`;
      return;
    }
    grid.innerHTML = insights.map((item) => `
      <article class="np-insight-card">
        <div class="np-card-icon" aria-hidden="true">${item.icon}</div>
        <h3>${item.title}</h3>
        <p>${item.body}</p>
        <button type="button" data-explain="${item.id}">Por que estou vendo isso?</button>
      </article>`).join('');
    grid.querySelectorAll('[data-explain]').forEach((button) => button.addEventListener('click', () => explain(insights.find((item) => item.id === button.dataset.explain))));
  }

  function explain(item) {
    if (!item) return;
    const modal = document.createElement('div');
    modal.className = 'np-explain-backdrop';
    modal.innerHTML = `<section class="np-explain" role="dialog" aria-modal="true" aria-labelledby="explain-title">
      <span class="np-eyebrow">TRANSPARÊNCIA DO INSIGHT</span>
      <h2 id="explain-title">${item.title}</h2>
      <p>${item.body}</p>
      <dl><dt>Período</dt><dd>${item.meta.period} dias</dd><dt>Registros</dt><dd>${item.meta.count}</dd><dt>Fontes</dt><dd>${item.meta.sources}</dd><dt>Limitação</dt><dd>${item.meta.limitation}</dd></dl>
      <p><strong>Uso correto:</strong> este padrão serve para organizar a conversa com o profissional. Não confirma diagnóstico, causalidade ou resposta a medicamento.</p>
      <button type="button">Fechar</button>
    </section>`;
    modal.addEventListener('click', (event) => { if (event.target === modal || event.target.closest('button')) modal.remove(); });
    document.body.appendChild(modal);
    modal.querySelector('button')?.focus();
  }

  async function boot() {
    if (state.mode === 'demo') {
      modeBanner.textContent = 'Demonstração · dados fictícios';
      modeBanner.classList.remove('live');
      state.rows = demoRows();
    } else {
      modeBanner.textContent = state.child ? `Conta real · ${state.child}` : 'Conta real · RLS ativo';
      modeBanner.classList.add('live');
      state.rows = await loadLive();
      modeBanner.textContent = state.child ? `Conta real · ${state.child}` : 'Conta real · dados autorizados';
    }
    render();
  }

  document.querySelectorAll('[data-period]').forEach((button) => button.addEventListener('click', () => {
    state.period = Number(button.dataset.period) || 30;
    render();
  }));

  boot();
})();
