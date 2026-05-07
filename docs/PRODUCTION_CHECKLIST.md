# Checklist de Producao — NeuroPed EDJ

Este checklist define o minimo necessario antes de qualquer uso com dados reais de pacientes.

## 1. Frontend

- [ ] `npm install` executado sem vulnerabilidades criticas.
- [ ] `npm run verify` aprovado.
- [ ] Deploy publicando apenas `dist/`.
- [ ] `VITE_APP_ENV=demo` mantido ate validacao completa.
- [ ] Nenhum dado real inserido em modo demo.

## 2. Supabase

- [ ] Projeto Supabase criado.
- [ ] Auth habilitado.
- [ ] Login por e-mail/senha ou OTP configurado.
- [ ] Migracao `supabase/migrations/20260506_secure_clinical_core.sql` aplicada.
- [ ] RLS confirmado como ativo em todas as tabelas clinicas.
- [ ] Perfis `doctor`, `staff` e `family` testados.
- [ ] Convite familiar com expiracao testado.
- [ ] Auditoria de eventos testada.

## 3. LGPD

- [ ] Politica de privacidade definida.
- [ ] Termo de uso definido.
- [ ] Base legal documentada.
- [ ] Retencao de dados documentada.
- [ ] Processo de revogacao de acesso familiar definido.
- [ ] Processo de exclusao/exportacao de dados definido.

## 4. Assinatura digital

- [ ] Provedor juridicamente valido escolhido.
- [ ] Fluxo de assinatura real testado.
- [ ] Validacao externa testada.
- [ ] Documento final nao usa linguagem ICP-Brasil sem assinatura real.

## 5. Go-live

- [ ] Variaveis de ambiente configuradas no provedor de deploy.
- [ ] `VITE_SUPABASE_URL` configurada.
- [ ] `VITE_SUPABASE_ANON_KEY` configurada.
- [ ] Nenhuma `service_role` key exposta no frontend.
- [ ] Backup e monitoramento definidos.
- [ ] Revisao juridica/tecnica concluida.
