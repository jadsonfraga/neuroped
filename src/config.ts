export type AppEnvironment = 'demo' | 'production';

const rawEnvironment = import.meta.env.VITE_APP_ENV;

export const appEnvironment: AppEnvironment = rawEnvironment === 'production' ? 'production' : 'demo';
export const isProductionMode = appEnvironment === 'production';

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? '';
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

export const hasConfiguredBackend = Boolean(supabaseUrl && supabaseAnonKey);
export const canUseClinicalData = isProductionMode && hasConfiguredBackend;

export const doctorIdentity = {
  name: 'Dr. Jadson Fraga Araújo Júnior',
  specialty: 'Neurologista Infantil',
  crm: 'CRM-PE 25.227',
  rqe: 'RQE 17.756',
  brand: 'NeuroPed EDJ',
  company: 'Fraga Serviços Médicos LTDA',
  cnpj: 'CNPJ 33.158.207/0001-48',
  address: 'Rua Raimundo Lacerda, 001 — Bairro São José — Petrolina/PE — CEP 56302-470',
  phone: '(87) 9 9109-7371',
  email: 'drjadsonfraga@proton.me'
};
