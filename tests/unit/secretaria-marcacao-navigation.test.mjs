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

  assert.match(page, /<BoaConsultaScheduleWidget \/>/);
  assert.match(page, /R\$ 800/);
  assert.match(page, /caução (?:obrigatória )?de R\$ 150/i);
  assert.match(page, /09:30/);
  assert.match(page, /13:30/);
  assert.match(page, /A escolha online ainda é um pré-agendamento/);
  assert.match(page, /5587991055790/);
  assert.doesNotMatch(page, /apiRequest|\/api\/public-booking/);
  assert.doesNotMatch(page, /<textarea|<input/i);
  assert.doesNotMatch(page, /SECRETARIA_IA_URL|manus\.space/);

  assert.match(widget, /61e1abfa9730aa005f000743/);
  assert.match(
    widget,
    /boaconsulta-widgets\.s3\.sa-east-1\.amazonaws\.com\/bc-widget-schedules\.min\.js/,
  );
  assert.match(widget, /<bc-widget-schedules/);
  assert.match(widget, /profile-slug=\{BOACONSULTA_PROFILE_SLUG\}/);
  assert.match(widget, /target="_blank"/);

  for (const csp of [cloudflareHeaders, vercelConfig]) {
    assert.match(
      csp,
      /script-src 'self' https:\/\/boaconsulta-widgets\.s3\.sa-east-1\.amazonaws\.com/,
    );
    assert.match(
      csp,
      /connect-src 'self' https:\/\/neuroped\.pages\.dev https:\/\/admin\.boaconsulta\.com/,
    );
    assert.doesNotMatch(csp, /connect-src 'self' https:;/);
    assert.doesNotMatch(csp, /script-src 'self' https:;/);
  }
});
