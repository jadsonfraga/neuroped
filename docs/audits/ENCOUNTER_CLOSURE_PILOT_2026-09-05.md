# Execução do piloto operacional — 05/09/2026

Issue: #796. Base analisada: 1b23a93f42fc5facfc49e04300a7d4771ae16652.

## Evidência executada neste ambiente

- Node 22.16.0: `node --test tests/unit/encounter-closure.test.mjs`, exit 0; 49 testes aprovados, 0 falhas e 0 skips.
- Cinco fixtures totalmente sintéticas. Escopo, proveniência, correções, desconhecidos, versão, revisão, conferência, evidência de entrega e denominador financeiro exercitados.
- A bancada entregue separadamente no pacote de trabalho passou em 10 verificações de interface em Chromium em memória, sem erro de runtime ou requisição externa. Não constitui teste ponta a ponta de backend.
- A política do Chromium impediu navegação a localhost. A renderização de interface usou HTML em memória e adaptador SHA-256 hashlib exclusivo de teste. O núcleo foi testado com WebCrypto real no Node. Não houve alteração da política do navegador ou tentativa de remover a restrição.
- O pacote de trabalho contém planilha de medição sem pacientes e formulários editoriais em revisão. Materiais comerciais não são publicados neste repositório público.

## BLOCKED_EXTERNAL_WINDOWS_DEVICE

Sistema: Remote Desktop Commander. Resultado observado: lista de dispositivos vazia.
Falta: computador autorizado conectado. Ação pendente: instalar/abrir a demonstração no computador correto e verificar comportamento local.
Risco de não executar: não há evidência de funcionamento naquele Windows. Verificação: dispositivo listado, identificação confirmada e ensaio local com dados fictícios. Não declarar instalação realizada.

## Integração LIVE não executada por delimitação de escopo

A rota legada de Clinical Core examinada usa modo demo-db. Este commit não promove esse modo a produção e não cria uma segunda API. A integração autenticada, tenant-scoped, transacional e auditada ao backend canônico precisa de implementação e testes próprios; isso não é resolvido por fornecer uma credencial.

## Verificações ainda pendentes

- CI do SHA desta proposta e suite completa do repositório.
- Revisão independente do contrato e integração.
- Instalação e navegação local no Windows autorizado.
- Revisão editorial/clínica e jurídico-comercial do produto institucional.

Não houve merge em main, deploy, alteração de prontuário, envio de orientação clínica, venda, cobrança, contato com instituições ou compromisso de trabalho em segundo plano.
