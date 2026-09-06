# Escuta Clínica — bloqueios externos verificados

Verificação em 05/09/2026. Não liberar uso clínico nem declarar a jornada ponta a ponta concluída.

## Cloudflare Workers AI

Sistema: conta Cloudflare canônica do NeuroPed. Tentativa efetiva com áudio inteiramente sintético, WAV mono16k, duração26,931s. O segredo CLOUDFLARE_API_TOKEN estava presente no GitHub Actions, mas a API /accounts/{id}/ai/run/@cf/openai/whisper-large-v3-turbo retornou HTTP401. Runs33985962071 e33986156623; artifacts/provider.json registra HTTP, duração e falha, sem chave.

Ação necessária: disponibilizar token válido para a conta correta com permissão Workers AI Read. A documentação oficial exige essa permissão para /ai/*; HTTP401 sozinho não diferencia token inválido, conta errada e escopo insuficiente. Não há autorização para contornar uma negativa. Não mudar cegamente o token de deploy se isso quebrar as demais permissões. A política de segredo pode usar token separado para QA.

Configuração de runtime ainda não aplicada: binding AI e ESCUTA_ENABLED no projeto Pages correto. O módulo falha fechado503 quando ausentes; ativação exige pedido real bem-sucedido, configuração de retenção e validação sintética autorizada. Não é suficiente a presença da flag ou do código.

Verificação de fechamento: STT real de áudio fictício retorna texto, extração real retorna JSON com fontes literais, teste no backend autenticado autoriza somente clínica válida, preserva revisão e salva rascunho sem visibilidade familiar. Em seguida, pipelines oficiais no mesmoSHA e teste nos dois domínios.

## Provedor alternativo

O repositório referencia GEMINI_API_KEY em workflows. Foi feita consulta segura de presença, sem revelar valor. Run33986559701 retornou BLOCKED_EXTERNAL_GEMINI_KEY_NOT_CONFIGURED. Nenhuma requisição clínica e nenhuma chave nova criada. A referência no YAML não comprova que existe credencial.

## Vercel

Conector atual: equipe team_bv4ukCpg4I0DHyQAk757HXnp sem projetos visíveis. Isso não prova ausência do NeuroPed em outra equipe. Não foi criado novo projeto nem publicado em conta errada. Requer escopo da equipe/projeto corretos ou execução validada do pipeline oficial existente; Vercel permanece espelho de frontend, não segundo backend.

## Evidências técnicas já obtidas

Run33986156623: código, tipos, lint, testes WAV/nota, worklet, buildcliente e compilação Functions passaram.11 testes de componente Chromium passaram com microfone virtual; serviços/auth/persistência foram fixtures explícitas. Esse teste não prova provider, sessão clínica real ou persistência emprodução.35 testes de contratos/worklet anteriores não são validação clínica. Correção posterior de cadastro lê profile.name e torna histórico acessível sem nova geração; CI deve validar oSHAfinal.

## Estado de publicação e reversão

PR797 Draft; não mesclado por esta execução. Main, produção, políticas de acesso existentes e registros clínicos não alterados. Códigofonte no repositório existente público não equivale a dados clínicos públicos: nenhuma informação identificável ou segredo foi adicionada. Rollback: manterflagdesligada e descartar/reverter PR pelo pipeline, preservando documentoscanônicos.
