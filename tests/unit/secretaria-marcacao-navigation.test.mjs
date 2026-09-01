import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const root = new URL("../..", import.meta.url);

async function source(path) {
  return readFile(new URL(path, root), "utf8");
}

test("a Secretaria IA institucional tem uma única rota e autoridades consolidadas", async () => {
  const [
    app,
    navigation,
    publicRoutes,
    page,
    widget,
    integrations,
    runbook,
    todo,
    cloudflareHeaders,
    vercelConfig,
  ] = await Promise.all([
    source("client/src/App.tsx"),
    source("client/src/data/navigation.ts"),
    source("client/src/lib/publicRoutes.ts"),
    source("client/src/pages/marcacao.tsx"),
    source("client/src/components/BoaConsultaScheduleWidget.tsx"),
    source("client/src/pages/manus-integracoes.tsx"),
    source("docs/SECRETARIA_IA_RECONSTRUCAO.md"),
    source("todo.md"),
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

  assert.match(page, /<BoaConsultaScheduleGateway onOpen=\{markScheduleOpened\} \/>/);
  assert.match(page, /const OFFICIAL_CONSULTATION_PRICE = "R\$ 800"/);
  assert.match(page, /Valor oficial da clínica · \{OFFICIAL_CONSULTATION_PRICE\}/);
  assert.match(page, /Se o BoaConsulta exibir outro valor/);
  assert.match(page, /caução (?:obrigatória )?(?:é )?de R\$ 150/i);
  assert.match(page, /09:30/);
  assert.match(page, /13:30/);
  assert.match(page, /Até 5 pacientes por dia útil/);
  assert.match(page, /A escolha online ainda é um pré-agendamento/);
  assert.match(page, /Secretária IA · fluxo[\s\S]{0,80}administrativo guiado/);
  assert.match(page, /5587991055790/);
  assert.match(page, /const MANAGE_WHATSAPP_URL = whatsappUrl/);
  assert.match(page, /const BOOKING_WHATSAPP_URL = whatsappUrl/);
  assert.match(page, /Este é meu WhatsApp de contato/);
  assert.match(page, /href=\{MANAGE_WHATSAPP_URL\}/);
  assert.match(page, /href=\{BOOKING_WHATSAPP_URL\}/);
  assert.match(page, /Já solicitei: avisar a secretaria/);
  assert.match(page, /setScheduleOpened\(true\)/);
  assert.match(page, /Voltou do BoaConsulta\?/);
  assert.match(page, /Avisar secretaria agora/);
  assert.match(page, /onClick=\{markScheduleOpened\}/);
  assert.doesNotMatch(page, /apiRequest|\/api\/public-booking/);
  assert.doesNotMatch(page, /<textarea|<input/i);
  assert.doesNotMatch(page, /SECRETARIA_IA_URL|manus\.space/);

  assert.match(widget, /61e1abfa9730aa005f000743/);
  assert.match(widget, /www\.boaconsulta\.com\/especialista\/jadson-fraga/);
  assert.match(widget, /onOpen\?: \(\) => void/);
  assert.match(widget, /onClick=\{onOpen\}/);
  assert.match(widget, /target="_blank"/);
  assert.match(widget, /rel="noopener noreferrer"/);
  assert.doesNotMatch(widget, /document\.createElement|customElements|<bc-widget-schedules/);

  // A antiga duplicação da Secretaria no hub Manus não pode voltar.
  assert.doesNotMatch(integrations, /id:\s*"secretaria"/);
  assert.doesNotMatch(integrations, /secretaria:\s*"\/#\/marcacao"/);
  assert.match(integrations, /Secretária IA já possui rota pública própria/);

  // O runbook consolidado deve manter preço e responsabilidades inequívocos.
  assert.match(runbook, /Rota institucional única:\*\* `#\/marcacao`/);
  assert.match(runbook, /Valor da consulta particular \| \*\*R\$ 800/);
  assert.match(runbook, /BoaConsulta é autoridade apenas para \*\*disponibilidade\*\*/);
  assert.match(runbook, /Antigo site Secretaria IA no Manus \| histórico/);
  assert.doesNotMatch(runbook, /valor da consulta não é fixado neste runbook nem no frontend/i);

  // O checklist operacional não pode voltar a pedir link para a Secretaria Manus.
  assert.match(todo, /Incorporar a Secretária IA ao próprio NeuroPed; remover dependência do antigo site Manus/);
  assert.match(todo, /BLOCKED_EXTERNAL_SECRETARIA_WHATSAPP_2026-09-01\.md/);

  for (const csp of [cloudflareHeaders, vercelConfig]) {
    assert.match(csp, /script-src 'self';/);
    assert.match(csp, /connect-src 'self' https:\/\/neuroped\.pages\.dev;/);
    assert.doesNotMatch(csp, /boaconsulta-widgets|admin\.boaconsulta\.com/);
    assert.doesNotMatch(csp, /connect-src 'self' https:;/);
    assert.doesNotMatch(csp, /script-src 'self' https:;/);
  }
});
