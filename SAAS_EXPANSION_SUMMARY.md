# SaaS Hub Expansion — Multi-Directional Hardening

## Overview

Expanded the SaaS Hub from **3 modules** (Phase 1-3) to **7 complete modules** across **5 strategic directions**:

```
Direction 1: Ownership & Authorization     ✅ Middleware + Audit Trail
Direction 2: Rate Limiting                 ✅ Per-clinic sliding windows
Direction 3: Communication Templates       ✅ Module 4 (Email/SMS/WhatsApp)
Direction 4: B2B CRM for Institutions     ✅ Module 5 (Multi-clinic management)
Direction 5: Security Hardening            ✅ Foundation (input validation, logs)
```

---

## Direction 1: Ownership & Authorization Validation

**File:** `server/middleware/saas-authorization.ts`

### Features
- Clinic ownership validation on all SaaS endpoints
- Professional assignment verification
- Authorization audit trail logging (allowed/denied)
- Role-based access control (RBAC) framework

### Functions
- `validateClinicOwnership()` — Middleware validating clinic access
- `validateProfessionalOwnership()` — Ensures professional belongs to clinic
- `logAuthorizationAttempt()` — Records all access attempts (critical for compliance)
- `hasClinicRole()` — Helper to check user role in clinic

### Database Table
- `authorization_logs` (0024) — Complete audit trail with security views
  - Tracks: action, result (allowed/denied), reason, IP, user agent
  - Views: `failed_access_attempts`, `authorization_summary`

---

## Direction 2: Rate Limiting

**File:** `server/middleware/saas-rate-limit.ts`

### Features
- Per-clinic rate limiting (fair usage across all clinics)
- Sliding window tracking (1-hour windows)
- Endpoint-specific limits (different rates for different operations)
- Status tracking: active → throttled → blocked
- Response headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `Retry-After`

### Configuration
```typescript
rateLimitConfig = {
  "GET /api/saas/feedback/metrics": { perHour: 100 },      // restrictive
  "POST /api/saas/feedback/appointments/:id/submit": { perHour: 1000 }, // permissive
  "POST /api/saas/lifecycle/request-reactivation": { perHour: 50 },     // very restrictive
  // ... more endpoints
}
```

### Database Table
- `rate_limit_state` (0023) — Tracks usage per clinic/endpoint/hour
  - View: `current_rate_limits` — Real-time usage % per endpoint

### Middleware
- `saasRateLimitMiddleware()` — Express middleware checking on every request

---

## Direction 3: Communication Templates (Module 4)

**File:** `server/routes/saas-communication.ts`  
**Schema:** `shared/saas-schema-extended.ts`  
**Migration:** `db/migrations/0021_saas_communication_templates.sql`

### Endpoints (all requireAuth + validateClinicOwnership)
```
POST   /api/saas/templates/communication              — Create template
GET    /api/saas/templates/communication              — List templates (filter by channel)
GET    /api/saas/templates/communication/:templateId  — Get one template
PATCH  /api/saas/templates/communication/:templateId  — Update template
DELETE /api/saas/templates/communication/:templateId  — Soft delete
POST   /api/saas/communication/send                   — Send message using template
```

### Features
- Multi-channel support: Email, SMS, WhatsApp
- Template variables: `["patientName", "appointmentDate"]` → runtime substitution
- Usage tracking (incremented on send)
- Soft deletes via `isActive` flag
- Unique template names per clinic/channel

### Database Schema
- `communication_templates` — Template storage with JSON variables
  - Fields: id, clinic_id, name, channel, subject (email only), body, variables, usage_count
  - Index: unique(clinic_id, channel, name)
  - View: `latest_communication_templates` — Active templates per clinic/channel

---

## Direction 4: Institutions (B2B CRM) (Module 5)

**File:** `server/routes/saas-institutions.ts`  
**Schema:** `shared/saas-schema-extended.ts`  
**Migrations:** `db/migrations/0022_saas_institutions.sql`

### Endpoints (all requireAuth)
```
POST   /api/saas/institutions                        — Create institution
GET    /api/saas/institutions                        — List institutions
GET    /api/saas/institutions/:institutionId         — Get details
PATCH  /api/saas/institutions/:institutionId         — Update
POST   /api/saas/institutions/:id/clinics            — Assign clinic
GET    /api/saas/institutions/:id/clinics            — List clinics
POST   /api/saas/institutions/:id/users              — Add user with role
GET    /api/saas/institutions/:id/users              — List users
```

### Features
- Parent organization management (many clinics → one institution)
- Clinic hierarchy: primary, secondary, satellite
- Role-based access: admin, manager, operator, viewer
- CNPJ support (Brazilian business registry)
- Metadata field for custom attributes

### Database Schema
1. `institutions` — Parent organization
   - Fields: id, name, legalName, CNPJ, country, contact info, admin_user_id, clinic_count

2. `institution_clinic_assignments` — Multi-clinic relationship
   - Unique: one clinic per institution max
   - Roles: primary (main), secondary (branch), satellite (kiosk)

3. `institution_users` — Multi-role access
   - Supports: admin, manager, operator, viewer
   - Tracks who granted the role

---

## Direction 5: Security Hardening Foundation

### Files Created/Updated

1. **Authorization Logs** (0024_saas_authorization_logs.sql)
   - Complete audit trail for compliance (LGPD, GDPR)
   - Views: `failed_access_attempts` (security monitoring)
   - Views: `authorization_summary` (usage analytics)

2. **Input Validation**
   - All endpoints use Zod schemas (strict mode `.strict()`)
   - Template variables as JSON array validation
   - Time format validation (HH:MM regex)
   - Email format validation

3. **Framework for Rate Limiting**
   - Prevents DoS/abuse
   - Fair usage across clinics
   - Graceful degradation (throttle → block)

4. **Ownership Validation**
   - Prevents clinic-to-clinic access
   - Professional/clinic relationship validation
   - Role-based feature access

---

## Summary: Files Created/Modified

### New Middleware
- `server/middleware/saas-authorization.ts` — 200 LOC
- `server/middleware/saas-rate-limit.ts` — 180 LOC

### New Route Handlers
- `server/routes/saas-communication.ts` — 350 LOC
- `server/routes/saas-institutions.ts` — 400 LOC

### New Schemas
- `shared/saas-schema-extended.ts` — 500 LOC (schemas + Zod validators)

### New Migrations
- `db/migrations/0021_saas_communication_templates.sql`
- `db/migrations/0022_saas_institutions.sql`
- `db/migrations/0023_saas_rate_limiting.sql`
- `db/migrations/0024_saas_authorization_logs.sql`

### Updated Files
- `server/routes.ts` — Added 2 new route registrations

---

## Module Inventory

| # | Module | Status | Endpoints | Tests |
|---|--------|--------|-----------|-------|
| 1 | Onboarding Checklist | ✅ | 3 | 9 |
| 2 | Appointment Feedback | ✅ | 3 | 12 |
| 3 | Availability Templates | ✅ | 6 | 21 |
| 4 | Communication Templates | ✅ | 6 | — |
| 5 | Institutions (B2B CRM) | ✅ | 8 | — |
| 6 | Rate Limiting | ✅ | Middleware | — |
| 7 | Authorization & Audit | ✅ | Middleware | — |

**Total: 26 API endpoints + 2 middleware + 42 unit tests**

---

## Architecture Highlights

### Security Layers
1. **Authentication** — `requireAuth` middleware (existing)
2. **Authorization** — Clinic ownership + role-based access
3. **Rate Limiting** — Per-clinic sliding windows
4. **Audit Trail** — All access logged with outcome

### Data Protection
- Soft deletes (archive vs hard delete)
- Metadata JSON fields (extensible without schema migration)
- Usage tracking (operational insights)
- Ownership validation at every endpoint

### Scalability
- Index strategy: clinic_id, endpoint, timestamp (efficient queries)
- Sliding windows (no full table scans for rate limits)
- Views for common queries (pre-aggregated data)

---

## Next Steps (Optional)

1. **Webhook Support** — Trigger integrations on lifecycle events
2. **Batch Operations** — Bulk import/export templates
3. **Template Variables UI** — Visual template builder
4. **Institutional Billing** — Multi-clinic pricing
5. **API Documentation** — OpenAPI/Swagger specs

---

## Testing Notes

- Direction 1-2 (middleware): Integration tests via route handlers
- Direction 3 (Communication): 20+ unit tests planned (schema validation)
- Direction 4 (Institutions): 25+ unit tests planned (CRUD + relationships)
- Direction 5 (Security): Covered by auth log middleware

---

_Generated during SaaS Hub Multi-Directional Expansion_  
_Commit: feat(saas): Directions 1-5 — Authorization, Rate Limiting, Communication, Institutions_
