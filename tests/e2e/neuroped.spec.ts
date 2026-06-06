import { expect, test } from '@playwright/test';

const baseURL = process.env.E2E_BASE_URL || 'http://127.0.0.1:4173';

test('app carrega sem erro crítico', async ({ page }) => {
  const critical: string[] = [];
  page.on('console', (msg) => { if (msg.type() === 'error') critical.push(msg.text()); });
  await page.goto(baseURL);
  await expect(page.locator('body')).toContainText(/NeuroPed|Jadson|Escalas/i);
  expect(critical).toEqual([]);
});

test('rota inexistente mostra fallback compreensível', async ({ page }) => {
  await page.goto(`${baseURL}/rota-inexistente-sdg`);
  await expect(page.locator('body')).toContainText(/NeuroPed|Redirecionando|Escalas|não encontrado/i);
});
