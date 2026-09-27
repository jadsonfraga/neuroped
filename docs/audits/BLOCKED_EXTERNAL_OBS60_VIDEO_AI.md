# Bloqueios externos — OBS-60 / análise por vídeo

Data: 27/09/2026. Estado: implementação em PR draft; não ativada por esta mudança.

## Configuração necessária no backend canônico Cloudflare

- `OBS60_VIDEO_AI_ENABLED=true`: habilitação explícita do módulo.
- `OBS60_PRIVACY_APPROVED=true`: declaração operacional de aprovação institucional do fluxo e do provedor. Não é certificação nem substitui documentos e avaliação de privacidade.
- `OBS60_GEMINI_API_KEY`: segredo exclusivo do servidor; inserir via gestão de segredos, nunca no chat, GitHub, log ou variável VITE.
- `OBS60_GEMINI_MODEL`: identificador de modelo Gemini com vídeo/áudio e resposta estruturada compatíveis. Não há modelo substituto silencioso. Escolher e testar o modelo contratado antes de liberar.

Não foram lidas credenciais nem comprovadas estas configurações na instalação atual. Ausência de qualquer requisito deixa a análise indisponível com mensagem explícita; nunca mostra seis resultados fabricados. Também exige DB, sessão autenticada, membership clínica ativa, permissão clínica e entitlement persistidos.

## Provas ainda necessárias

1. Build/check/lint e gates existentes no head final da PR; testes do workflow dedicado.
2. Navegador real: entrar pelo Guia da assistente, escolher cada faixa, preparar câmera, gravar/encerrar, interromper ao sair da aba, anexar arquivo, confirmar exportação, cancelar, trocar sessão/clínica sem reaproveitar resposta anterior. Não usar crianças reais nestes testes técnicos.
3. Endpoint integrado: não autenticado, leitor, clínica suspensa, tenant A/B, billing negado, ausência de consentimento/credencial, payload inválido, timeout. Os guardas canônicos são reutilizados; teste de unidade do transporte não comprova estes cenários E2E.
4. Provedor real autorizado: vídeo sintético claramente identificado como teste, áudio e quadro ausentes, ações fora da ordem, tarefa não aplicada, fala somente do adulto, instrução maliciosa inserida no vídeo. Conferir bytes/hash, timestamps e ausência de inferências não permitidas. Registrar modelo/versão e evidências sem segredos.
5. Revisão médica de discordâncias perceptuais e apreciação institucional de retenção, segurança, base legal/consentimento e adequação contratual. Não declarar taxa de acerto, diagnóstico, dispositivo validado ou conformidade presumida.

## Risco e proteção vigente

O modelo pode errar mesmo com JSON válido; os códigos fechados limitam extrapolação, não garantem percepção. Vídeo/voz identificam pessoas. O envio é explícito, falha fechado, não persiste conteúdo no módulo e não gera conduta/diagnóstico. Conteúdo importado é dado não confiável; não pode instruir ferramentas, acessar URLs ou modificar o protocolo.

Rollback: desligar `OBS60_VIDEO_AI_ENABLED`; para remover o código, reverter somente a PR do OBS-60. Sem migrations nem mudanças no protocolo OBS-10 de dez minutos.
