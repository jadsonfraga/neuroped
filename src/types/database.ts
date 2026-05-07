export type Json = unknown;

export type UserRole = 'doctor' | 'staff' | 'family';
export type DocumentType = 'report' | 'prescription' | 'school_letter' | 'exam_request' | 'other';

export type Profile = {
  id: string;
  role: UserRole;
  display_name: string;
  created_at: string;
};

export type Patient = {
  id: string;
  owner_id: string;
  initials: string;
  birth_year: number | null;
  encrypted_payload: string | null;
  payload_digest: string | null;
  created_at: string;
  updated_at: string;
};

export type ClinicalDocument = {
  id: string;
  patient_id: string;
  owner_id: string;
  document_type: DocumentType;
  title: string;
  encrypted_payload: string | null;
  payload_digest: string | null;
  created_at: string;
  updated_at: string;
};

export type FamilyAccessGrant = {
  id: string;
  patient_id: string;
  family_user_id: string;
  granted_by: string;
  expires_at: string;
  created_at: string;
};

export type AuditEvent = {
  id: number;
  actor_id: string | null;
  event_name: string;
  target_table: string;
  target_id: string | null;
  metadata: Json;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at'> & { created_at?: string };
        Update: Partial<Omit<Profile, 'id'>>;
        Relationships: [];
      };
      patients: {
        Row: Patient;
        Insert: Partial<Pick<Patient, 'id' | 'created_at' | 'updated_at'>> & Pick<Patient, 'owner_id' | 'initials'> & Partial<Pick<Patient, 'birth_year' | 'encrypted_payload' | 'payload_digest'>>;
        Update: Partial<Omit<Patient, 'id' | 'owner_id' | 'created_at'>>;
        Relationships: [];
      };
      clinical_documents: {
        Row: ClinicalDocument;
        Insert: Partial<Pick<ClinicalDocument, 'id' | 'created_at' | 'updated_at'>> & Pick<ClinicalDocument, 'patient_id' | 'owner_id' | 'document_type' | 'title'> & Partial<Pick<ClinicalDocument, 'encrypted_payload' | 'payload_digest'>>;
        Update: Partial<Omit<ClinicalDocument, 'id' | 'owner_id' | 'created_at'>>;
        Relationships: [];
      };
      family_access_grants: {
        Row: FamilyAccessGrant;
        Insert: Partial<Pick<FamilyAccessGrant, 'id' | 'created_at'>> & Pick<FamilyAccessGrant, 'patient_id' | 'family_user_id' | 'granted_by' | 'expires_at'>;
        Update: Partial<Omit<FamilyAccessGrant, 'id' | 'created_at'>>;
        Relationships: [];
      };
      audit_events: {
        Row: AuditEvent;
        Insert: Partial<Pick<AuditEvent, 'id' | 'created_at'>> & Pick<AuditEvent, 'actor_id' | 'event_name' | 'target_table'> & Partial<Pick<AuditEvent, 'target_id' | 'metadata'>>;
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
