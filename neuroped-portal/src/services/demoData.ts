import type { AuditLog, DocumentItem, Patient } from '../types';

export const demoPatients: Patient[] = [
  {
    id: 'patient-demo-001',
    code: 'DEMO-001',
    name: 'João Demo',
    ageLabel: '7 anos',
    contactName: 'Responsável Teste',
    primaryNote: 'Registro fictício para validação do fluxo do portal.',
    status: 'demo',
    nextAppointment: '2026-05-20'
  },
  {
    id: 'patient-demo-002',
    code: 'DEMO-002',
    name: 'Maria Exemplo',
    ageLabel: '4 anos',
    contactName: 'Responsável Exemplo',
    primaryNote: 'Caso fictício usado apenas para demonstração de navegação.',
    status: 'demo',
    nextAppointment: '2026-05-27'
  }
];

export const demoDocuments: DocumentItem[] = [
  {
    id: 'doc-demo-001',
    patientId: 'patient-demo-001',
    title: 'Relatório demonstrativo de acompanhamento',
    type: 'relatorio-demo',
    status: 'pending_signature',
    createdAt: '2026-05-06'
  },
  {
    id: 'doc-demo-002',
    patientId: 'patient-demo-002',
    title: 'Orientações familiares fictícias',
    type: 'orientacao-demo',
    status: 'draft',
    createdAt: '2026-05-06'
  }
];

export const demoAuditLogs: AuditLog[] = [
  {
    id: 'audit-demo-001',
    actor: 'Sistema Demo',
    action: 'visualizou_dashboard_demo',
    resource: 'portal',
    createdAt: '2026-05-06T12:00:00Z'
  }
];
