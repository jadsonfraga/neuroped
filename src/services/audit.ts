import { assertBackendReady } from '../lib/supabase';

export async function writeAuditEvent(input: {
  actorId: string;
  eventName: string;
  targetTable: string;
  targetId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const client = assertBackendReady();
  const { error } = await client.from('audit_events').insert({
    actor_id: input.actorId,
    event_name: input.eventName,
    target_table: input.targetTable,
    target_id: input.targetId ?? null,
    metadata: input.metadata ?? {}
  });

  if (error) throw error;
}

export async function listAuditEvents(limit = 50) {
  const client = assertBackendReady();
  const { data, error } = await client
    .from('audit_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}
