import { assertBackendReady } from '../lib/supabase';
import type { ClinicalDocument, DocumentType } from '../types/database';

export async function listDocumentsForPatient(patientId: string): Promise<ClinicalDocument[]> {
  const client = assertBackendReady();
  const { data, error } = await client
    .from('clinical_documents')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function createDocument(input: {
  patientId: string;
  ownerId: string;
  kind: DocumentType;
  title: string;
  encryptedPayload?: string | null;
  payloadDigest?: string | null;
}): Promise<ClinicalDocument> {
  const client = assertBackendReady();
  const { data, error } = await client
    .from('clinical_documents')
    .insert({
      patient_id: input.patientId,
      owner_id: input.ownerId,
      document_type: input.kind,
      title: input.title,
      encrypted_payload: input.encryptedPayload ?? null,
      payload_digest: input.payloadDigest ?? null
    })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function updateDocument(documentId: string, input: Partial<Pick<ClinicalDocument, 'title' | 'document_type' | 'encrypted_payload' | 'payload_digest'>>) {
  const client = assertBackendReady();
  const { data, error } = await client
    .from('clinical_documents')
    .update(input)
    .eq('id', documentId)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}
