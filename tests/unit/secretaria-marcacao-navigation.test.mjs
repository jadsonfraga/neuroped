import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const root = new URL("../..", import.meta.url);

async function source(path) {
  return readFile(new URL(path, root), "utf8");
}

test("a Secretaria IA pública usa a agenda oficial do BoaConsulta com confirmação manual", async () => {
  const [
    app,
    navigation,
    publicRoutes,
    page,
    widget,
    cloudflareHeaders,
    vercelConfig,
  ] = await Promise.all([
    source("client/src/App.tsx"),
    source("client/src/data/navigation.ts"),
    source("client/src/lib/publicRoutes.ts"),
    source("client/src/pages/marcacao.tsx"),
    source("client/src/components/BoaConsultaScheduleWidget.tsx"),
    source("client/public/_headers"),
    source("vercel.json"),
  ]);

  assert.match(app, /import\("@\/pages\/marcacao"\)/);
  assert.match(app, /path="\/marcacao" component=\{MarcacaoPage\}/);
  assert.match(
    app,
    /if \(location === "\/marcacao"\) \{[\s\S]*?<MarcacaoPage \/>[\s\S]*?\n  \}/,
  );
  assert.match(
    navigation,
    /href: "\/marcacao",[\s\S]{0,200}label: "Secretaria IA"/,
  );
  assert.match(navigation, /description: "Pré-agendamento pelo BoaConsulta"/);
  assert.match(publicRoutes, /"\/marcacao"/);

  assert.match(page, /<BoaConsultaScheduleGateway \/>/);
  assert.match(page, /Valor atualizado no BoaConsulta/);
  assert.match(page, /Consulte o valor exibido no perfil oficial/);
  assert.doesNotMatch(page, /R\$ 800/);
  assert.match(page, /caução (?:obrigatória )?de R\$ 150/i);
  assert.match(page, /09:30/);
  assert.match(page, /13:30/);
  assert.match(page, /A escolha online ainda é um pré-agendamento/);
  assert.match(page, /5587991055790/);
  assert.match(page, /const MANAGE_WHATSAPP_URL = whatsappUrl/);
  assert.match(page, /const BOOKING_WHATSAPP_URL = whatsappUrl/);
  assert.match(page, /href=\{MANAGE_WHATSAPP_URL\}/);
  assert.match(page, /href=\{BOOKING_WHATSAPP_URL\}/);
  assert.match(page, /Já solicitei: avisar a secretaria/);
  assert.doesNotMatch(page, /apiRequest|\/api\/public-booking/);
  assert.doesNotMatch(page, /<textarea|<input/i);
  assert.doesNotMatch(page, /SECRETARIA_IA_URL|manus\.space/);

  assert.match(widget, /61e1abfa9730aa005f000743/);
  assert.match(widget, /www\.boaconsulta\.com\/especialista\/jadson-fraga/);
  assert.match(widget, /target="_blank"/);
  assert.match(widget, /rel="noopener noreferrer"/);
  assert.doesNotMatch(widget, /document\.createElement|customElements|<bc-widget-schedules/);

  for (const csp of [cloudflareHeaders, vercelConfig]) {
    assert.match(csp, /script-src 'self';/);
    assert.match(csp, /connect-src 'self' https:\/\/neuroped\.pages\.dev;/);
    assert.doesNotMatch(csp, /boaconsulta-widgets|admin\.boaconsulta\.com/);
    assert.doesNotMatch(csp, /connect-src 'self' https:;/);
    assert.doesNotMatch(csp, /script-src 'self' https:;/);
  }
});
