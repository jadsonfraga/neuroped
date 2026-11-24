import assert from "node:assert/strict";
import { test } from "node:test";
import { publicUser, type UserRow } from "../../functions/api/auth/_shared.ts";

const admin: UserRow = {
  id: "owner-1",
  name: "Proprietário",
  email: " owner@example.test ",
  role: "admin",
  is_active: 1,
  password_hash: "synthetic-hash",
  must_change_password: 0,
  failed_login_attempts: 0,
  locked_until: null,
};

test("renderizador identifica apenas a conta admin configurada e com senha definitiva", () => {
  assert.equal(publicUser(admin, { ADMIN_EMAIL: "OWNER@EXAMPLE.TEST" }).isAppOwner, true);
  assert.equal(publicUser(admin, { ADMIN_EMAIL: "other@example.test" }).isAppOwner, false);
  assert.equal(publicUser(admin, {}).isAppOwner, false);
  assert.equal(publicUser({ ...admin, role: "professional" }, { ADMIN_EMAIL: "owner@example.test" }).isAppOwner, false);
  assert.equal(publicUser({ ...admin, must_change_password: 1 }, { ADMIN_EMAIL: "owner@example.test" }).isAppOwner, false);
  assert.equal(publicUser({ ...admin, is_active: 0 }, { ADMIN_EMAIL: "owner@example.test" }).isAppOwner, false);
});
