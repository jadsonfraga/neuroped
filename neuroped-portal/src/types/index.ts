export type UserRole = 'admin' | 'medico' | 'secretaria' | 'familia';

export type Patient = {
  id: string;
  code: string;
  name: string;
  ageLabel: string;
  contactName: string;
  primaryNote: string;
  status: 'demo' | 'active' | 'archived';
  nextAppointment?: string;
};

export type DocumentItem = {
  id: string;
  patientId: string;
  title: string;
  type: string;
  status: string;
  createdAt: string;
};

export type AuditLog = {
  id: string;
  actor: string;
  action: string;
  resource: string;
  createdAt: string;
};
