import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  checkoutSeatsForSolo,
  isMultiSeatTenant,
} from "../../client/src/lib/soloBilling";

test("o checkout Solo nasce com um assento e preserva tenants multiassento", () => {
  assert.equal(checkoutSeatsForSolo({ contracted: null, activeMembers: null }), 1);
  assert.equal(checkoutSeatsForSolo({ contracted: 1, activeMembers: 1 }), 1);
  assert.equal(checkoutSeatsForSolo({ contracted: 2, activeMembers: 1 }), 2);
  assert.equal(checkoutSeatsForSolo({ contracted: 1, activeMembers: 2 }), 2);
  assert.equal(checkoutSeatsForSolo({ contracted: 0, activeMembers: null }), 1);
  assert.equal(checkoutSeatsForSolo({ contracted: null, activeMembers: 0 }), 1);
  assert.equal(checkoutSeatsForSolo({ contracted: -2, activeMembers: 0 }), 1);
});

test("só identifica multiassento quando contratação ou uso excede um", () => {
  assert.equal(isMultiSeatTenant({ contracted: null, activeMembers: null }), false);
  assert.equal(isMultiSeatTenant({ contracted: 1, activeMembers: 1 }), false);
  assert.equal(isMultiSeatTenant({ contracted: 2, activeMembers: 1 }), true);
  assert.equal(isMultiSeatTenant({ contracted: 1, activeMembers: 2 }), true);
  assert.equal(isMultiSeatTenant({ contracted: 0, activeMembers: 0 }), false);
});

test("o painel usa o helper, o nome comercial e mantém o checkout canônico", () => {
  const page = readFileSync("client/src/pages/configuracoes.tsx", "utf8");

  assert.match(page, /checkoutSeatsForSolo\(snapshot\.seats\)/);
  assert.match(page, /CANONICAL_PLAN_DISPLAY_NAME/);
  assert.match(page, /isMultiSeatTenant\(seats\)/);
  assert.match(page, /Gerenciar assinatura/);
  assert.match(page, /Gerenciar assentos/);
  assert.match(page, /authFetch\("\/api\/billing\/checkout"/);
});
