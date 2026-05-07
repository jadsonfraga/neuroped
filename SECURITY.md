# Seguranca — NeuroPed EDJ

## Estado atual

O projeto esta em modo demo seguro. Nao deve receber dados reais de pacientes ate a configuracao completa de producao.

## Regras obrigatorias antes de producao

1. Usar backend autenticado.
2. Aplicar politicas RLS no Supabase.
3. Nao usar CPF como senha.
4. Nao armazenar dados clinicos em endpoints publicos.
5. Nao expor service_role key no frontend.
6. Registrar auditoria de leitura, criacao, edicao e exclusao de dados clinicos.
7. Revisar LGPD, consentimento, retencao e revogacao de acesso familiar.
8. Usar assinatura digital real quando houver documento medico com pretensao de validade juridica.

## Assinatura digital

Hash SHA-256 local nao e assinatura digital ICP-Brasil. Qualquer documento medico real deve ser assinado por meio juridicamente adequado.

## Relato de vulnerabilidade

Abrir issue privada ou contato direto com o responsavel tecnico antes de publicar detalhes de vulnerabilidade.
