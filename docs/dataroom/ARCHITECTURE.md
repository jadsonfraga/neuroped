# Architecture

Inspected baseline: `0b4f74fb49214d00944fc2a366d3b4454363601a`. Evidence date: 2026-09-26.

## Inspected baseline
The application has a React/TypeScript client in `client/`, Cloudflare Pages Functions in `functions/api/`, a D1/SQLite schema and forward migrations in `db/`, and shared contracts in `shared/`. The `server/` tree also exists; parity of every alternate runtime was not audited in this operation. This is a sampled architecture audit, not a complete dependency inventory.

## Canonical boundaries
Tenant authorization is centralized in `functions/api/tenant/_core.ts` and `shared/permissions.ts`. Billing checks are reused from `functions/api/billing/_guard.ts`. Clinical LIVE routes use tenant-scoped encrypted storage and a dedicated keyring. `/api/clinical-core` is a distinct legacy demo-backed surface; it is not a substitute for LIVE.

## Three increments
The SaaS branch adds a persisted-record onboarding read model. The clinical branch composes the canonical LIVE event reader to build a source-preserving, review-only summary. The trust branch adds tenant-scoped Product Evidence and an offline recovery verifier. None replaces the existing database or billing provider. No business data migration is introduced.

## Release boundary
Source integration and tests do not prove deployed operation. The three draft PRs must be reconciled and evaluated against complete acceptance gates. SaaS and trust both touch `TenantMetricsPanel.tsx`: preserve server-served permissions, onboarding and Product Evidence when merging; do not choose one entire side.
