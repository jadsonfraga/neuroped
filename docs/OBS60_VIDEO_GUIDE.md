# OBS-60 — guia dirigido e extração por vídeo

Versão: `obs60-2026-09-27.1`. Proposta autoral não validada, sem escore ou diagnóstico automático.

## Acesso e uso

No NeuroPed: **Pré-consulta / OBS-10 → Guia da assistente → Vídeo 60 segundos · Abrir guia e análise por vídeo**. É um espaço separado em diálogo; não substitui o Modo Fácil, o modo direto ou os dez minutos do OBS-10. Não há marcação clínica manual no OBS-60.

1. Selecionar idade exata: 24–35, 36–47 ou 48–59 meses. Separar bola macia grande e caixa aberta. Adaptar ambiente sem treinar respostas. Confirmar autorização de gravação.
2. Seguir as quatro janelas sugeridas: chamado 0–10 s; comando 10–25 s; comunicação 25–40 s; deslocamento/pegar no chão 40–60 s. A fonte canônica das frases por idade é `shared/obs60.ts`. Não acelerar nem forçar a criança.
3. Preparar câmera e gravar, ou anexar MP4/WebM de até 12 MiB e aproximadamente 60 s. Gravação integrada termina aos 60 s; sair da aba interrompe. O arquivo permanece local até o envio explícito. Filmagem mais curta não é reprovação; tarefas sem oportunidade devem ficar não avaliáveis.
4. Confirmar a autorização deste envio ao provedor externo e clicar **Analisar vídeo e preencher registros**. Se servidor, sessão, clínica, privacidade ou provedor não estiverem disponíveis, não há resultados simulados.
5. Ler os seis registros de somente leitura, rever trechos apontados pela IA, consultar até duas sínteses limitadas e uma próxima observação. Exportar JSON e vídeo separadamente e conferir armazenamento institucional. Exportar não prova que o arquivo foi salvo; fechar/limpar exige confirmação.

## Contrato de evidência

A IA extrai apenas códigos fechados para chamado, comando, gesto/CAA, produção verbal, deslocamento e pegar no chão/ficar em pé. Fala literal é permitida apenas no registro de produção verbal, com atribuição à criança; sem nomes e identificadores. A síntese é construída deterministicamente a partir dos eventos aceitos, nunca a partir de diagnóstico ou resumo livre do modelo.

Toda classificação exige trecho temporal proposto pelo modelo dentro da janela informada e qualidades necessárias. Qualidade contraditória torna o item não avaliável. Ausência de item, duplicação, categoria desconhecida, campo diagnóstico ou tempo impossível rejeitam a resposta. Não se completa a amostra com o roteiro esperado.

`demonstrated` documenta a execução nesta oportunidade e com a ajuda oferecida; não presume independência. `partial` identifica parte da sequência. `not_demonstrated` descreve uma oportunidade suficiente sem resposta-alvo identificada. `not_assessable` expressa falta de evidência, oportunidade, tempo ou qualidade. Nenhum estado equivale a diagnóstico, normalidade, atraso, QI, capacidade global ou risco de TEA/TDAH.

**Esquema válido não prova percepção correta.** Os timestamps e transcrições são propostos pela IA, não verificados por pessoa. A solicitação usa amostragem de 4 fps, não inspeção garantida de todos os quadros. Eventos rápidos, causalidade, ausência de apoio entre quadros, tônus, reflexos, força, ataxia e atenção sustentada não podem ser inferidos. A duração recebida pelo servidor é informada pelo navegador, não uma perícia do contêiner. O servidor pede explicitamente o recorte 0–janela (no máximo 60 s) ao provedor e valida os tempos da resposta. O reconhecimento de assinatura MP4/WebM é uma barreira de formato, não prova de decodificação válida.

## Arquitetura e privacidade

- `shared/obs60.ts`: roteiro, contrato, validação e síntese determinística.
- `client/src/features/obs60`: interface carregada sob demanda, captura reaproveitada de `useLocalRecorder`, guarda de saída existente, mídia/resultado apenas em memória, hash de associação do arquivo, cancelamento e invalidação na troca de sessão/clínica/arquivo.
- `functions/api/integrations/obs60/index.ts`: API canônica Cloudflare, sessão do middleware, papel clínico, membership ativa persistida e entitlement. Header de clínica não concede acesso. Sem DB/sessão/membership: bloqueia.
- `_video.ts`: envio de bytes inline ao Google Gemini `generateContent`, origem fixa, chave só no servidor, consentimento estrito, limite real de corpo/resposta, tempo limite e contrato de retorno. Sem URLs arbitrárias, fallback clínico, SDK novo ou upload persistente na Files API do provedor.
- O módulo não grava vídeo, fala ou resultado em D1/localStorage/IndexedDB. Registra somente eventos operacionais de solicitação/conclusão, ator/tenant/UUID, versão e consentimento no log de auditoria existente; sem nome, arquivo, idade, hash de mídia ou transcrição no log.
- Rosto e voz são dados identificáveis. Código de paciente não anonimiza vídeo. A ausência de persistência neste módulo não garante retenção zero no provedor; requer avaliação institucional do contrato, plano, retenção, uso de dados e consentimento. Cancelar a espera não garante cancelar processamento já recebido pelo provedor.
- Não foram adicionados segunda API Express, migrations, alteração de LIVE/realPatients, mudanças de tenant/billing, dependências ou segredos.

## Testes e limites de comprovação

`node --experimental-strip-types --test tests/unit/obs60.test.mjs`

39 testes executados localmente com Node 22.16.0: 39 passaram, nenhum falhou. Usam categorias sintéticas e bytes de cabeçalho sintéticos, com provedor simulado. São testes de validação e transporte, **não prova de decodificação de vídeo, precisão clínica, operação com provedor real ou isolamento E2E em produção**.

Também executado: TypeScript estrito do núcleo compartilhado e transporte (`tsc --noEmit --strict --target ES2022 --module ESNext --moduleResolution bundler --lib esnext,dom,dom.iterable --allowImportingTsExtensions shared/obs60.ts functions/api/integrations/obs60/_video.ts`) e verificação de sintaxe TS/TSX dos arquivos novos. Isso não é o build/check integral do repositório.

Antes de sair de draft: CI do repositório; E2E de navegador/câmera e perda de conexão; endpoint integrado com sessão/tenant A/B; integração real com mídia sintética e provedor autorizado; revisão clínica de discordâncias; avaliação de privacidade. Não declarar precisão, validação clínica, conformidade ou disponibilidade em produção a partir de testes mockados.

## Configuração, liberação e rollback

Ver `docs/audits/BLOCKED_EXTERNAL_OBS60_VIDEO_AI.md`. Default bloqueado. Não executar deploy, merge ou habilitar produção como efeito desta implementação. Reverter a PR remove apenas o módulo e seu lançador; desligar `OBS60_VIDEO_AI_ENABLED` bloqueia imediatamente novos envios sem remover o guia.

## Referências técnicas e limites clínicos

Consulta em 27/09/2026:
- Google Gemini API: https://ai.google.dev/api/generate-content (bytes inline, metadados de vídeo, saída estruturada).
- Google Video Understanding: https://ai.google.dev/gemini-api/docs/video-understanding (amostragem pode perder eventos rápidos).
- Google Structured Outputs: https://ai.google.dev/gemini-api/docs/structured-output (estrutura não garante correção semântica).
- CDC, diagnóstico de TEA: https://www.cdc.gov/autism/hcp/diagnosis/index.html (integração de história e observação; não depender de instrumento isolado).

Estas fontes não validam este protocolo autoral nem estabelecem suas janelas como pontos de corte.
