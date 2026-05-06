# Segurança — NeuroPed EDJ

## Estado atual

O projeto está em **modo demo seguro**. Não deve receber dados reais de pacientes até a configuração completa de produção.

## Regras obrigatórias antes de produção

1. Usar backend autenticado.
2. Aplicar políticas RLS no Supabase.
3. Não usar CPF como senha.
4. Não armazenar dados clínicos em endpoints públicos.
5. Não expor `service_role` key no frontend.
6. Registrar auditoria de leitura, criação, edição e exclusão de dados clínicos.
7. Revisar LGPD, consentimento, retenção e revogação de acesso familiar.
8. Usar assinatura digital real quando houver documento médico com pretensão de validade jurídica.

## Assinatura digital

Hash SHA-256 local não é assinatura digital ICP-Brasil. Qualquer documento médico real deve ser assinado por meio juridicamente adequado.

## Relato de vulnerabilidade

Abrir issue privada ou contato direto com o responsável técnico antes de publicar detalhes de vulnerabilidade.
