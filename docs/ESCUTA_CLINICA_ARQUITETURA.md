# Escuta Clínica — arquitetura e operação

## Responsabilidades

O frontend React/Vite em /#/escuta-clinica usa as contas, o contexto de clínica e o prontuário já existentes. Não cria conta paralela, banco paralelo em produção nem API anônima. Cloudflare Pages Functions é a autoridade de sessão, tenant, cobrança, transcrição e documentos. Vercel é apenas espelho do frontend, no mesmo SHA, com VITE_API_URL apontando para a Cloudflare.

## Fluxo de dados

1. O profissional autoriza a gravação explicitamente e aciona getUserMedia. AudioWorklet captura amostras reais e converte para PCM mono 16 kHz, 16 bits. Pausa exclui amostras; finalizar drena o último bloco e encerra todas as tracks.
2. Áudio fica apenas na memória da aba. A pessoa pode reproduzir ou exportar WAV. O processamento divide amostras em WAVs íntegros de até 60 segundos; não recorta containers de áudio arbitrariamente.
3. POST /api/live/escuta com action=transcribe valida sessão persistida, papel clínico, membership ativa, entitlement, configuração clínica/criptográfica, autorização de gravação, tamanho e formato do áudio. Só então reserva cota e chama o binding nativo Workers AI. O resultado é texto, nunca uma anamnese simulada.
4. action=generate valida e envia o texto ao modelo de extração. A conversa é entrada não confiável, não instrução. Só seções sustentadas por citações literais são aceitas. Essa validação estrutural não prova equivalência semântica: cabe ao médico conferir atribuição, negativas, hipóteses, números e medicamentos.
5. Edição invalida a revisão. Ao salvar, a interface usa /api/live/documents com status=draft e familyVisibility=false. O fluxo canônico cifra o conteúdo por clínica, cria versão e registra metadados de auditoria. Não há assinatura nem publicação à família automáticas.

## Configuração

Produção exige DB canônico, NEUROPED_JWT_SECRET, CLINICAL_DATA_KEY e CLINICAL_INDEX_KEY distintos e já geridos pelo projeto, CLINICAL_LIVE_ENABLED=true, ESCUTA_ENABLED=true e binding AI. Não substituir chaves existentes para ativar este módulo. Chaves e tokens nunca entram em variáveis VITE_*, arquivos públicos, logs ou evidências.

GET /api/live/escuta exige a mesma autorização clínica do processamento e retorna disponibilidade efetiva. A presença do binding sozinha não prova que a inferência funciona. O gate de aceitação em nuvem testa a chamada real através da aplicação implantada.

Provedores configurados: @cf/openai/whisper-large-v3-turbo para transcrição e @cf/meta/llama-3.3-70b-instruct-fp8-fast para estruturação. Trata-se de modelos disponibilizados pela Cloudflare, não de uma conta ou chave da plataforma OpenAI.

## Limites e falhas

Limites configurados: 60 minutos por gravação, 25 MiB por importação, 60 segundos por trecho, 60 mil caracteres por transcrição e 720 processamentos por usuário/clínica/dia. Limite configurado não significa gravação física de 60 minutos validada. O contador depende das amostras, não só do relógio de parede.

Sem configuração, acesso ou capacidade, retorna erro explícito. Não há fallback para gerar dados clínicos fictícios. Uma falha de trecho preserva os blocos em memória para nova tentativa. Fechar/recarregar a aba descarta áudio e rascunho não salvo. O cancelamento da requisição do navegador não garante cancelamento da inferência já recebida pelo provedor.

Antes de dados reais, validar qualidade clínica, condições de tratamento/retenção do provedor e uso no hardware do consultório. Dados de testes automatizados são exclusivamente sintéticos; testes de componente identificam explicitamente serviços simulados.

## Implantação e reversão

Somente PR com verificações verdes entra em main. Os workflows oficiais deploy-cloudflare.yml e deploy-vercel.yml publicam e verificam sentinelas do mesmo SHA e autenticação nominal. Vercel resolve o proprietário a partir do ID imutável do projeto e do vínculo GitHub verificado, não de um nome de exibição ou de um teamId pessoal inválido.

Desativar ESCUTA_ENABLED interrompe novos processamentos sem apagar documentos. Reverter o commit pelo pipeline não altera o histórico já salvo. Não desabilitar autenticação, validação de tenant ou criptografia para recuperar disponibilidade.

## Aceitação e evidências

Há três camadas distintas: contratos de áudio/nota/cadastro; handler real com SQLite e provedor de contrato explicitamente simulado; e implantação isolada com D1, sessão, membership, inferência, criptografia e interface reais. Só o relatório acceptance.json de uma execução bem-sucedida da última camada prova o percurso em nuvem — não a existência do código ou screenshots de componente.

A homologação cria recursos com nome np-escuta-qa-<run>, jamais conecta ao D1 de produção. Aplica o corpus original de migrações por transporte de instruções SQLite completas, sem editar os arquivos históricos. Contas sintéticas são desabilitadas e sessões revogadas ao terminar. Recursos de uma execução com falha são removidos por seus identificadores exatos, nunca por uma busca ampla.
