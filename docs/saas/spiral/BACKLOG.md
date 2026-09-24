# Backlog da espiral SaaS

Prioridade: P0 segurança/perda/risco clínico · P1 jornada contratada,
cobrança, isolamento, recuperação · P2 usabilidade/confiabilidade ·
P3 refinamento/expansão. Este registro acompanha a continuação da PR #949, parte da issue #594.

## S0 · P0 · pendência registrada; revalidação externa bloqueada nesta sessão
A issue #926 permanece aberta: health de 22/09/2026 registrou
CLINICAL_CRYPTO_NOT_READY e LGPD_BUCKET_NOT_CONFIGURED no SHA a256d754.
Não reproduzido por HTTP nesta revisão; não afirmar que persiste ou foi corrigido.
Prioridade de retomada: revalidar health/metadados no release vigente e seguir
#926 antes de liberar LIVE. Não substituir chaves, remover gates ou provisionar
recursos pagos. Responsável: operador/proprietário com acesso autorizado.
Aceite: configuração e compatibilidade de chaves demonstradas, exercício
sintético de cifrar/ler/exportar e recuperação; rede/ambiente autorizados para
observação. A revisão de go-live não fecha esta pendência.

## S1 · P1 · verificada localmente; integração/publicação pendentes
Problema original: diagnóstico não explicitava limites de configuração.
Revisão S1-R1: CONFIGURACAO_PRESENTE era atestada mesmo com requisitos ausentes.
Correção e regressões executadas; evidência em EVIDENCE.md, seção S1-R1.
Aceite de código: todos os requisitos ausentes e ambiente vazio devem retornar
CONFIGURACAO_INCOMPLETA, sem alterar campos legados ou promover prova externa.
Próximo gate: CI/verify/build do HEAD real da PR, revisão e autorização de
merge/deploy aplicáveis. Responsável técnico: integrador da PR complementar a #949.
Não marcar release publicado ou venda autorizada a partir do teste local.

## S2 · P2 · aberto
Onboarding: quando POST /api/tenants recusa com EMAIL_VERIFICATION_REQUIRED,
a mensagem aparece mas falta ação direta para #/verificar-email, segundo o
ciclo inicial. Reproduzir no main vigente antes de editar. Aceite: ação
Reenviar link de verificação e teste de navegação/retomada. Dependência: nenhuma.
Responsável: próximo integrador do domínio Acesso.

## S3 · P1 · aberto — próximo item independente
Inventário por funcionalidade: 3 registros herdados, 1 reexaminado nesta
revisão, denominador completo desconhecido. Aceite: descobrir rotas, APIs,
catálogos e operações de Acesso/Comercial e preencher contratos, tenant,
entitlement, efeitos, recuperação e evidências, mantendo desconhecidos explícitos.
Não usar os 3 registros como denominador do produto inteiro.
Responsável: próximo integrador da espiral.

## S4 · P1 · bloqueado externamente
Integração Asaas sandbox real e e-mail verificável em ambiente autorizado.
Falta: credencial sandbox e ambiente de teste autorizados, configuração de
webhook autenticado e destinatário sintético autorizado. Responsável:
proprietário/operador do serviço. Menor ação: disponibilizar essas condições
pelo canal de secrets existente, sem colocar credenciais na PR ou na conversa.
Aceite: efeito observado no provedor e processamento idempotente em ambiente
publicado. Mock não satisfaz o critério. Não executar cobrança real.

## S5 · P1 · aberto
Restauração demonstrada: não equivale a backup configurado ou executado.
Prioridade reconciliada com a regra P1 de recuperação, sem alegar novo defeito.
Aceite: exercício isolado com dados sintéticos, vínculos de tenant e chaves,
medidas observadas e registro de falhas. Responsável: operador + integrador.
Não executar restauração destrutiva em produção.
