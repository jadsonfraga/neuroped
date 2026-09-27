/** S13 follow-up to #1008: reuse the real SQLite/D1 harness, never mock SQL. */
import assert from "node:assert/strict";
import type { DatabaseSync } from "node:sqlite";
import { onRequestGet as opsGet, onRequestPost as opsPost } from "../../functions/api/operations/index";
import { onRequestGet as publicGet, onRequestPost as publicPost } from "../../functions/api/public-booking";

export async function assertPublicBookingClinicIsolation(raw: DatabaseSync, db: D1Database, key: string) {
  const userId = "s13-regression-professional";
  const now = new Date().toISOString();
  const env = { DB: db, OPERATIONAL_DATA_KEY: key };
  raw.prepare(`INSERT INTO users (id, name, email, role, is_active, created_at, updated_at)
    VALUES (?, 'S13 Synthetic Professional', 's13-professional@example.test', 'professional', 1, ?, ?)`)
    .run(userId, now, now);
  for (const suffix of ["a", "b", "c"]) {
    raw.prepare(`INSERT INTO clinics (id, slug, name, status, created_by_user_id, created_at, updated_at)
      VALUES (?, ?, ?, 'active', ?, ?, ?)`)
      .run(`s13-${suffix}`, `s13-${suffix}`, `S13 Synthetic ${suffix}`, userId, now, now);
    if (suffix !== "c") {
      raw.prepare(`INSERT INTO clinic_memberships (clinic_id, user_id, role, active, created_at, updated_at)
        VALUES (?, ?, 'professional', 1, ?, ?)`)
        .run(`s13-${suffix}`, userId, now, now);
    }
  }
  const opsContext = (clinic: string, body?: Record<string, unknown>) => ({
    request: new Request("https://neuroped.test/api/operations", {
      method: body ? "POST" : "GET",
      headers: { "Content-Type": "application/json", "X-Tenant-Id": clinic },
      body: body ? JSON.stringify(body) : undefined,
    }),
    env,
    data: { authUser: { id: userId, name: "S13 Synthetic Professional", email: "s13-professional@example.test", role: "professional", mustChangePassword: false } },
  });
  async function configure(clinic: string, body: Record<string, unknown>) {
    const response = await opsPost(opsContext(clinic, body) as never);
    assert.equal(response.status, 200, `S13 fixture ${clinic}/${body.action}: ${await response.text()}`);
  }
  await configure("s13-a", {
    action: "upsert_profile", displayName: "S13 Synthetic Professional", specialty: "Neuropediatria",
    timezone: "America/Recife", bookingEnabled: true,
  });
  const profile = raw.prepare("SELECT slug FROM booking_provider_profiles WHERE user_id = ?").get(userId) as { slug: string };
  async function get(query: Record<string, string>) {
    const response = await publicGet({ request: new Request(`https://neuroped.test/api/public-booking?${new URLSearchParams(query)}`), env } as never);
    assert.equal(response.status, 200, `S13 public GET ${JSON.stringify(query)}`);
    return await response.json() as any;
  }
  async function directory(clinic?: string) {
    const body = await get({ action: "providers", ...(clinic ? { clinic } : {}) });
    return body.providers.map((provider: { slug: string }) => provider.slug) as string[];
  }
  async function createService(clinic: string) {
    await configure(clinic, { action: "create_service", name: `Consulta ${clinic}`, durationMinutes: 60 });
    return (raw.prepare("SELECT id FROM booking_services WHERE provider_user_id = ? AND clinic_id = ?").get(userId, clinic) as { id: string }).id;
  }

  // The provider is a member of BOTH clinics; only B has any service at all.
  // This must fail against #1008's original SQL, not merely exercise hidden UI.
  const serviceB = await createService("s13-b");
  assert.deepEqual(await directory("s13-b"), [profile.slug], "S13: positive control, public service exists in B");
  assert.deepEqual(await directory("s13-a"), [], "S13: public service only in B must not list the provider in A");
  assert.equal((raw.prepare("SELECT COUNT(*) AS n FROM booking_services WHERE clinic_id = 's13-a'").get() as { n: number }).n, 0);
  for (const flag of ["active", "public_visible"] as const) {
    raw.prepare(`UPDATE booking_services SET ${flag} = 0 WHERE id = ?`).run(serviceB);
    assert.deepEqual(await directory("s13-b"), [], `S13: ${flag}=0 must not enable directory discovery`);
    raw.prepare(`UPDATE booking_services SET ${flag} = 1 WHERE id = ?`).run(serviceB);
  }
  const serviceA = await createService("s13-a");
  assert.deepEqual(await directory("s13-a"), [profile.slug], "S13: public service in A now enables A, without changing memberships");

  // Future date derived at runtime; distinct times respect provider-global slot locks.
  const future = new Date();
  future.setUTCDate(future.getUTCDate() + 30);
  const date = future.toISOString().slice(0, 10);
  const cases = [
    { clinic: "s13-a", service: serviceA, hour: "13", minute: 780 },
    { clinic: "s13-b", service: serviceB, hour: "15", minute: 900 },
  ];
  for (const item of cases) {
    await configure(item.clinic, { action: "create_rule", weekday: future.getUTCDay(), startMinute: item.minute, endMinute: item.minute + 60, slotMinutes: 60 });
    const slots = await get({ action: "slots", provider: profile.slug, clinic: item.clinic, service: item.service, date });
    assert.equal(slots.bookingEnabled, true);
    assert.ok(slots.slots.some((slot: { startsAtLocal: string }) => slot.startsAtLocal === `${date}T${item.hour}:00`), `S13: ${item.clinic} must expose a genuinely bookable slot`);
    const publicProfile = await get({ provider: profile.slug, clinic: item.clinic });
    assert.deepEqual(publicProfile.services.map((service: { id: string }) => service.id), [item.service]);
  }
  const payload = (item: typeof cases[number], action: "book" | "waitlist") => ({
    action, provider: profile.slug, clinic: item.clinic, serviceId: item.service,
    startsAtLocal: `${date}T${item.hour}:00`, preferredDate: date,
    guardianName: `Responsável sintético ${item.clinic}`, patientName: `Paciente sintético ${item.clinic}`,
    guardianEmail: `${item.clinic}@example.test`, guardianPhone: "11999998888", privacyAccepted: true,
  });
  async function post(body: Record<string, unknown>, expectedStatus: number) {
    const response = await publicPost({
      request: new Request("https://neuroped.test/api/public-booking", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      }), env,
    } as never);
    const result = await response.json() as any;
    assert.equal(response.status, expectedStatus, `S13 ${body.clinic ?? "legacy"}/${body.action}: ${JSON.stringify(result)}`);
    return result;
  }
  const snapshot = () => ({
    appointments: raw.prepare("SELECT * FROM appointments WHERE provider_user_id = ? ORDER BY id").all(userId),
    waitlist: raw.prepare("SELECT * FROM waitlist_entries WHERE provider_user_id = ? ORDER BY id").all(userId),
  });

  // Swap a valid service from the OTHER clinic, in BOTH directions. No write.
  const beforeSwaps = snapshot();
  for (const [index, item] of cases.entries()) {
    const other = cases[1 - index];
    await post({ ...payload(item, "book"), serviceId: other.service }, 409);
    await post({ ...payload(item, "waitlist"), serviceId: other.service }, 400);
  }
  assert.deepEqual(snapshot(), beforeSwaps, "S13: cross-clinic service IDs must not persist any appointment or waitlist entry");

  const saved: Array<{ clinic: string; service: string; appointmentId: string; waitlistId: string }> = [];
  for (const item of cases) {
    const booking = await post(payload(item, "book"), 201);
    const waitlist = await post(payload(item, "waitlist"), 201);
    assert.equal(booking.status, "requested");
    assert.equal(waitlist.status, "waiting");
    assert.equal(typeof booking.bookingToken, "string");
    assert.equal(typeof waitlist.accessToken, "string");
    assert.ok(booking.bookingToken.length > 20);
    assert.ok(waitlist.accessToken.length > 20);
    assert.equal(booking.startsAtLocal, `${date}T${item.hour}:00`);
    const appointment = raw.prepare("SELECT provider_user_id, clinic_id, service_id, source, status FROM appointments WHERE id = ?").get(booking.appointmentId);
    const entry = raw.prepare("SELECT provider_user_id, clinic_id, service_id, status FROM waitlist_entries WHERE id = ?").get(waitlist.waitlistId);
    assert.deepEqual({ ...appointment }, { provider_user_id: userId, clinic_id: item.clinic, service_id: item.service, source: "public", status: "requested" });
    assert.deepEqual({ ...entry }, { provider_user_id: userId, clinic_id: item.clinic, service_id: item.service, status: "waiting" });
    saved.push({ clinic: item.clinic, service: item.service, appointmentId: booking.appointmentId, waitlistId: waitlist.waitlistId });
    const slots = await get({ action: "slots", provider: profile.slug, clinic: item.clinic, service: item.service, date });
    assert.ok(!slots.slots.some((slot: { startsAtLocal: string }) => slot.startsAtLocal === booking.startsAtLocal), "S13: successful booking must really occupy the slot");
  }
  async function assertDashboardsIsolated() {
    for (const item of saved) {
      const response = await opsGet(opsContext(item.clinic) as never);
      assert.equal(response.status, 200);
      const body = await response.json() as any;
      assert.deepEqual(body.appointments.map((appointment: { id: string }) => appointment.id), [item.appointmentId], `S13: appointments visible only in ${item.clinic}`);
      assert.deepEqual(body.waitlist.map((entry: { id: string }) => entry.id), [item.waitlistId], `S13: waitlist visible only in ${item.clinic}`);
      assert.deepEqual(body.services.map((service: { id: string }) => service.id), [item.service]);
      assert.equal(body.appointments[0].patientName, `Paciente sintético ${item.clinic}`);
      assert.equal(body.waitlist[0].patientName, `Paciente sintético ${item.clinic}`);
    }
  }
  await assertDashboardsIsolated();
  const persisted = snapshot();
  async function assertUnavailable(item: typeof cases[number], clinic: string | null = item.clinic) {
    const query = { provider: profile.slug, ...(clinic ? { clinic } : {}) };
    assert.equal(await get(query), null, "S13: unresolved/revoked/suspended public profile fails closed");
    const slots = await get({ ...query, action: "slots", service: item.service, date });
    assert.equal(slots.bookingEnabled, false);
    assert.deepEqual(slots.slots, []);
    if (clinic) assert.deepEqual(await directory(clinic), []);
    for (const action of ["book", "waitlist"] as const) {
      const body: Record<string, unknown> = { ...payload(item, action) };
      if (clinic) body.clinic = clinic;
      else delete body.clinic;
      await post(body, 409);
    }
    assert.deepEqual(snapshot(), persisted, "S13: rejected access must not alter already persisted A/B records");
  }

  // Both real memberships exist: no-clinic links remain fail-closed.
  await assertUnavailable(cases[0], null);
  await assertUnavailable(cases[0], "s13-missing");
  await assertUnavailable(cases[0], "s13-c");
  raw.prepare("UPDATE clinic_memberships SET active = 0 WHERE user_id = ? AND clinic_id = 's13-b'").run(userId);
  await assertUnavailable(cases[1]);
  assert.deepEqual(await directory("s13-a"), [profile.slug]);
  // Legacy discovery must not use B's stale service after B membership is revoked.
  raw.prepare("UPDATE booking_services SET public_visible = 0 WHERE id = ?").run(serviceA);
  assert.ok(!(await directory()).includes(profile.slug), "S13: sole-clinic legacy directory must not borrow a public service from a revoked clinic");
  raw.prepare("UPDATE booking_services SET public_visible = 1 WHERE id = ?").run(serviceA);
  assert.ok((await directory()).includes(profile.slug), "S13: valid single-clinic legacy discovery remains supported");
  raw.prepare("UPDATE clinic_memberships SET active = 1 WHERE user_id = ? AND clinic_id = 's13-b'").run(userId);
  raw.prepare("UPDATE clinics SET status = 'suspended' WHERE id = 's13-a'").run();
  await assertUnavailable(cases[0]);
  assert.deepEqual(await directory("s13-b"), [profile.slug]);
  raw.prepare("UPDATE clinics SET status = 'active' WHERE id = 's13-a'").run();
  await assertDashboardsIsolated();
  assert.deepEqual(snapshot(), persisted);
  console.log("✓ S13: negative directory A/B; 201 bookings and waitlists in both clinics; persisted tenant/service isolation; swapped services, revoked membership, suspended/missing/foreign clinics and legacy fail-closed");
}
