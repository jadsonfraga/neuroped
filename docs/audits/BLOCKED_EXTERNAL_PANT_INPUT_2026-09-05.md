# PANT — bloqueios externos em 05/09/2026

Relacionado à issue #791. Este registro distingue código testado de instalação/produção. Não contém dados de pacientes.

| Identificador | Sistema / acesso necessário | Ação que falta | Risco / verificação de conclusão |
|---|---|---|---|
| BLOCKED_EXTERNAL_WINDOWS | PCDRJADSON; conexão autenticada de terminal/arquivos no computador do usuário | Conectar o dispositivo e instalar/ligar o piloto às pastas autorizadas | Ainda não há integração local. Verificar processo no Windows, caminhos autorizados e execução de um caso sintético. Nenhum arquivo, segredo ou tarefa agendada do PC foi alterado. |
| BLOCKED_EXTERNAL_CANONICAL_RENDERER | Serviço de arquivos; acesso autorizado aos bytes do kit canônico e seus módulos. Cópia retornou HTTP 403 | Obter o kit por acesso permitido, escrever adaptador e executar renderização + QA canônico | Não há PDF PANT emitido ou conformidade visual demonstrada por este módulo. Verificar fase 1 aprovada, geração do PDF, QA e preservação do motor. Não contornar o 403. |
| BLOCKED_EXTERNAL_BROWSER | Política do ambiente Chromium; navegação local negada com ERR_BLOCKED_BY_ADMINISTRATOR | Executar homologação visual em ambiente autorizado | Interface do pacote separado não foi validada visualmente. HTTP e testes de backend não substituem testes do navegador. Nenhum contorno da política foi aplicado. |
| BLOCKED_EXTERNAL_APP_RELEASE | Checkout completo e esteira de CI do repositório | Conferir checks do PR; executar validação de release antes de eventual integração ao app | Este PR não representa deploy. Não houve npm ci/lint/check/build/verify local do app completo. Não mesclar com checks pendentes/falhos, não mudar proteção e não usar deploy alternativo. |

## Estado entregue

Núcleo Python de validação, importação estruturada, rascunho e contrato intermediário; 67 testes do escopo do PR executados localmente. PDF, assinatura, validação clínica, automação de agenda e transcrição por microfone não fazem parte do caminho entregue. A aprovação do texto é declaração local com hash, não assinatura digital.
