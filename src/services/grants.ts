import { assertBackendReady } from '../lib/supabase';
import type { FamilyAccessGrant } from '../types/database';

export async function listFamilyGrants(patientId: string): Promise<FamilyAccessGrant[]> {
  const client = assertBackendReady();
  const { data, error } = await client
    .from('family_access_grants')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function createFamilyGrant(input: {
  patientId: string;
  familyUserId: string;
  grantedBy: string;
  expiresAt: string;
}): Promise<FamilyAccessGrant> {
  const client = assertBackendReady();
  const { data, error } = await client
    .from('family_access_grants')
    .insert({
      patient_id: input.patientId,
      family_user_id: input.familyUserId,
      granted_by: input.grantedBy,
      expires_at: input.expiresAt
    })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function revokeFamilyGrant(grantId: string) {
  const client = assertBackendReady();
  const { error } = await client
    .from('family_access_grants')
    .delete()
    .eq('id', grantId);

  if (error) throw error;
}
