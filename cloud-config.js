/* NeuroPed EDJ - cloud-config.js
 * Configuracao opt-in para o backend Supabase (np-cloud.js).
 *
 * Por padrao, fica DESABILITADO. Para ativar:
 *   1. Crie um projeto Supabase: https://supabase.com (free tier serve).
 *   2. Aplique db/supabase-schema-v6.sql no SQL Editor.
 *   3. Project Settings > API: copie 'Project URL' e 'anon public'.
 *   4. Substitua os valores abaixo e troque enabled para true.
 *
 * A chave anon e PUBLICA (segura para o browser). RLS no Postgres garante
 * que anon so consegue INSERT em submissions/audit_logs - nao consegue ler
 * nem alterar nada.
 *
 * Sem PII real enquanto a auth (magic link / email+senha) nao for habilitada.
 *
 * Veja SUPABASE.md para o passo a passo completo.
 */
window.NEUROPED_CLOUD = {
  provider: 'supabase',
  supabaseUrl: 'https://jadsonfraga-neuroped.supabase.co', // URL de produção (placeholder atualizado)
  supabasePublicAnon: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', // Token anon público
  enabled: true,           // Habilitado para integração com backend
  projectLabel: 'NeuroPed EDJ Cloud'
};
