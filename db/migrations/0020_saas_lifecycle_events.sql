-- NeuroPed SaaS — Tenant Lifecycle Events
--
-- Rastreamento de transições de estado de clínica
-- Estados: created, activated, closure_requested, closed, reactivation_requested, reactivated

CREATE TABLE IF NOT EXISTS tenant_lifecycle_events (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (
    event_type IN (
      'created',
      'activated',
      'closure_requested',
      'closed',
      'reactivation_requested',
      'reactivated',
      'legal_hold_placed',
      'legal_hold_released'
    )
  ),
  reason TEXT,
  triggered_by TEXT NOT NULL,
  previous_state TEXT,
  new_state TEXT,
  metadata TEXT, -- JSON
  created_at TEXT NOT NULL
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_lifecycle_tenant
  ON tenant_lifecycle_events(tenant_id);

CREATE INDEX IF NOT EXISTS idx_lifecycle_event_type
  ON tenant_lifecycle_events(event_type);

-- View para últimos eventos por clínica
CREATE VIEW IF NOT EXISTS latest_lifecycle_events AS
SELECT DISTINCT ON (tenant_id)
  tenant_id,
  event_type,
  new_state,
  created_at,
  reason
FROM tenant_lifecycle_events
ORDER BY tenant_id, created_at DESC;
