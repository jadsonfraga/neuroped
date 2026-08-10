const { chromium } = require('playwright');

const base = (process.env.NEUROPED_CONECTA_URL || 'https://neuroped-conecta.vercel.app').replace(/\/$/, '');
const errors = [];
const checks = [];
function assert(condition, message) {
  if (!condition) throw new Error(message);
  checks.push(message);
  console.log(`✓ ${message}`);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const width of [320, 375, 390, 430]) {
      const page = await browser.newPage({ viewport: { width, height: 844 } });
      page.on('pageerror', (error) => errors.push(`pageerror ${width}: ${error.message}`));
      page.on('console', (msg) => {
        if (msg.type() === 'error' && !/favicon|net::ERR_ABORTED/i.test(msg.text())) errors.push(`console ${width}: ${msg.text()}`);
      });
      const response = await page.goto(`${base}/`, { waitUntil: 'domcontentloaded', timeout: 45_000 });
      assert(response && response.status() < 400, `landing HTTP saudável em ${width}px`);
      await page.waitForTimeout(800);
      assert((await page.locator('body').innerText()).includes('NeuroPed Conecta'), `marca presente em ${width}px`);
      const polished = await page.evaluate(() => document.documentElement.dataset.npPolish === '1');
      assert(polished, `camada premium carregada em ${width}px`);
      const overflow = await page.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth);
      assert(overflow <= 4, `sem overflow horizontal crítico em ${width}px`);
      await page.close();
    }

    const insights = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const insightResponse = await insights.goto(`${base}/insights`, { waitUntil: 'networkidle', timeout: 45_000 });
    assert(insightResponse && insightResponse.status() < 400, 'Insights abre via deep link');
    const insightText = await insights.locator('body').innerText();
    assert(insightText.includes('Insights que mostram o caminho'), 'hero de Insights renderiza');
    assert(insightText.includes('Não constitui diagnóstico, prescrição ou ajuste de tratamento'), 'disclaimer clínico renderiza');
    assert(/Demonstração/i.test(insightText), 'sessão anônima permanece explicitamente DEMO');
    await insights.reload({ waitUntil: 'networkidle', timeout: 45_000 });
    assert((await insights.locator('h1').innerText()).includes('Insights'), 'refresh de /insights preserva rota');

    await insights.evaluate(() => {
      localStorage.setItem('sb-anti-regression-auth-token', JSON.stringify({ access_token: 'fake-live-token' }));
    });
    await insights.goto(`${base}/insights`, { waitUntil: 'networkidle', timeout: 45_000 });
    const fakeLiveText = await insights.locator('body').innerText();
    assert(/Conta real/i.test(fakeLiveText), 'modo LIVE é detectado sem cair para DEMO');
    assert(!fakeLiveText.includes('Lucas Demo'), 'LIVE nunca mostra Lucas Demo');
    assert(!/Dados fictícios para demonstração/i.test(fakeLiveText), 'LIVE não usa fixture de insights');
    await insights.evaluate(() => localStorage.removeItem('sb-anti-regression-auth-token'));
    await insights.close();

    const app = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const appResponse = await app.goto(`${base}/app`, { waitUntil: 'domcontentloaded', timeout: 45_000 });
    assert(appResponse && appResponse.status() < 400, '/app abre via deep link');
    await app.waitForTimeout(1200);
    assert(await app.evaluate(() => document.documentElement.dataset.npPolish === '1'), 'camada premium também ativa no app');
    const appText = await app.locator('body').innerText();
    assert(/DEMONSTRAÇÃO|Modo demonstração/i.test(appText), 'DEMO claramente sinalizada no acompanhamento anônimo');
    await app.reload({ waitUntil: 'domcontentloaded', timeout: 45_000 });
    assert(await app.evaluate(() => document.documentElement.dataset.npPolish === '1'), 'refresh de /app preserva camada premium');
    await app.close();

    if (errors.length) throw new Error(`Erros de navegador:\n${errors.join('\n')}`);
    console.log(`\nSmoke NeuroPed Conecta: APROVADO (${checks.length} verificações).`);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error.stack || error.message || error);
  process.exit(1);
});
