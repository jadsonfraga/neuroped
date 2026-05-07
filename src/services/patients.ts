import { assertBackendReady } from '../lib/supabase';
import type { Patient } from '../types/database';

export async function listPatients(): Promise<Patient[]> {
  const client = assertBackendReady();
  const { data, error } = await client
    .from('patients')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function createPatient(input: {
  ownerId: string;
  initials: string;
  birthYear?: number | null;
  encryptedPayload?: string | null;
  payloadDigest?: string | null;
}): Promise<Patient> {
  const client = assertBackendReady();
  const { data, error } = await client
    .from('patients')
    .insert({
      owner_id: input.ownerId,
      initials: input.initials,
      birth_year: input.birthYear ?? null,
      encrypted_payload: input.encryptedPayload ?? null,
      payload_digest: input.payloadDigest ?? null
    })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function updatePatient(patientId: string, input: Partial<Pick<Patient, 'initials' | 'birth_year' | 'encrypted_payload' | 'payload_digest'>>) {
  const client = assertBackendReady();
  const { data, error } = await client
    .from('patients')
    .update(input)
    .eq('id', patientId)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}
