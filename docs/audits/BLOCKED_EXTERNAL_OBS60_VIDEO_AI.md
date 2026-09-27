# Bloqueios externos — OBS-60 / análise por vídeo

Data: 27/09/2026. A análise automática é fechada por padrão. Publicar o guia
local não ativa a IA nem comprova sua operação ou validade clínica. O estado
atual de merge/deploy deve ser consultado na PR #1023 e nos runs do GitHub.

## Sistema e permissões necessárias

Backend canônico: projeto Cloudflare Pages `neuroped`. É necessário um
administrador autorizado a gerir os segredos/variáveis de produção desse
projeto, além de acesso autorizado ao projeto Google contratado e aprovação
institucional documentada do tratamento de vídeo/voz. Não se exige que
credenciais sejam copiadas para chat, PR ou código.

- `OBS60_VIDEO_AI_ENABLED=true`: habilitação explícita, somente após liberação.
- `OBS60_PRIVACY_APPROVED=true`: declaração operacional de aprovação
  institucional do fluxo e do provedor. Não é certificação nem substitui
  documentos e avaliação de privacidade. Não marcar para contornar o gate.
- `OBS60_GEMINI_API_KEY`: segredo exclusivo do servidor, inserido via gestão
  de segredos; nunca em GitHub, logs ou variável VITE.
- `OBS60_GEMINI_MODEL`: identificador de modelo com vídeo/áudio e resposta
  estruturada compatíveis. Não há substituto silencioso. Testar o modelo
  contratado antes de liberar.

Não foram lidas credenciais nem comprovadas essas configurações na
instalação atual por esta retomada. Ausência de qualquer requisito deixa a
análise indisponível; nenhum resultado é fabricado. Também são exigidos DB,
sessão autenticada, membership clínica ativa, permissão e entitlement.

## Provas técnicas versionadas, não presumidas

`.github/workflows/obs60-proof.yml` executa contrato/transporte sintéticos,
regressão do import/inventário, handlers reais com SQL/migrações reais em
SQLite e frontend compilado com câmera sintética via MediaRecorder real.
A prova de navegador cobre faixas etárias, acessibilidade, consentimento,
encerramento antecipado, proteção de descarte, MP4, download e nenhum envio
com provedor indisponível. Verificar conclusão e SHA de cada execução;
existência de teste não é prova verde. Autenticação/capability do navegador
são fixtures; isso não comprova sessão remota, provedor ou precisão clínica.

## Ações ainda necessárias antes de ativar IA externa

1. Confirmar gates do head final e deploy canônico. Com conta técnica
   autorizada, verificar endpoint integrado na instalação real, tenant A/B,
   leitor, clínica/billing suspensos, ausência de consentimento/credencial,
   payload inválido, timeout e ausência de resposta reaproveitada após troca
   de sessão/clínica. Não usar pacientes reais.
2. Exercitar interrupção automática aos 60 segundos, saída da aba, perda de
   conexão e cancelamento no fluxo completo, incluindo os dispositivos e
   navegadores usados pela clínica. Um cancelamento não comprova que o
   provedor interrompeu processamento já recebido.
3. Executar provedor real autorizado com vídeos sintéticos: áudio ausente,
   quadro incompleto, ações fora da ordem, tarefa não aplicada, voz somente
   do adulto e instrução maliciosa no vídeo. Conferir bytes/hash, timestamps,
   contrato e ausência de inferências não permitidas. Registrar modelo,
   versão e evidências sem credenciais.
4. Revisão médica das discordâncias perceptuais e apreciação institucional
   de retenção, segurança, base legal/consentimento e contrato. Não declarar
   taxa de acerto, diagnóstico, dispositivo validado ou conformidade presumida.

## Como verificar conclusão e riscos

Configuração presente pode tornar o GET autenticado `configured=true`, mas
isso sozinho não confirma processamento. A conclusão exige POST real
bem-sucedido com vídeo sintético autorizado, resposta vinculada ao hash,
revisão das condições adversas acima e registro da aprovação institucional.
Até lá, preservar a flag de habilitação desligada.

O modelo pode errar mesmo com JSON válido; códigos fechados limitam
extrapolação, não garantem percepção. Vídeo e voz podem identificar pessoas.
O envio é explícito e falha fechado; não persistir conteúdo no módulo não
garante retenção zero no provedor. Não são gerados diagnóstico ou conduta.
O conteúdo do vídeo é dado não confiável, não instrução para ferramentas.

Rollback: desligar `OBS60_VIDEO_AI_ENABLED`; para remover código, reverter
somente a PR #1023 e republicar após os gates. Sem migrations próprias nem
alteração do protocolo OBS-10 de dez minutos. Retomada operacional em
`docs/audits/OBS60_RECOVERY_2026-09-27.md`.
