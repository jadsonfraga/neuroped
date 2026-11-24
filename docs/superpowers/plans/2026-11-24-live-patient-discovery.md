# Live Patient Discovery Implementation Plan

> **For agentic workers:** Execute with superpowers:executing-plans and test-driven-development.

**Goal:** Make older LIVE patients discoverable without downloading all profiles.
**Architecture:** The real Pages handlers read bounded, stable cursor windows and decrypt only server-side. The patient UI consumes each page; search requests carry names in JSON.
**Tech Stack:** Pages Functions, SQLite/D1, React, TanStack Query, node:test.
**Spec:** docs/superpowers/specs/2026-11-24-live-patient-discovery-design.md

## Global Constraints
Clinic predicate in the final SQL; synthetic fixtures only; no production writes; no security or crypto bypass.

## Review Focus
Matching patient older than 100; no match while more rows remain; same timestamp ordering; wrong clinic; new search must not show the previous clinic/term's rows.

- [x] Add failing real-handler + SQLite tests for the above API cases in tests/unit/live-patient-discovery.test.ts.
- [x] Implement cursor list and private-body search in functions/api/live/patients; keep existing auth and old clients.
- [x] Connect client/src/pages/pacientes.tsx to backend search and cursor movement.
- [x] Run regression suite, check and build; attempt browser with canonical backend; log limits and rollback.

## Verification and rollback

- Regression: `npm run test:patient-safety` uses the actual handlers, session
  middleware, encryption and SQLite with 156 fictitious profiles and two clinics.
- Browser: build with `npm run build:client`; prepare an isolated local D1
  from `node --import tsx tests/e2e/fixtures/live-patient-discovery.mts /tmp/new-live-fixture.sqlite`.
  Set `LIVE_DISCOVERY_EMAIL=owner-a@example.test` and the same synthetic
  `LIVE_DISCOVERY_PASSWORD` for the seed and browser. Use the synthetic
  bindings from the fixture module, never production bindings. Serve the
  build and the compiled Pages Functions with the seeded D1 at
  `http://127.0.0.1:8794`; run `npm run test:e2e:live-patient-discovery`.
  The browser test rejects non-loopback targets and consumes real HTTP
  responses from the application (no interception).
- Rollback: revert this change as one unit. It adds no migration, changes no
  clinical data, and does not rotate keys. Keep the existing GET path and
  response fields for clients that only need the first page.

Local evidence (24/11/2026): five direct regression tests passed; the compiled
Pages Worker authenticated against local D1 and found the oldest of 156 encrypted
synthetic profiles, while denying the other clinic. Chromium + the final build
passed private search, partial and final empty states, next/previous page and
reload; no production operation was performed.
