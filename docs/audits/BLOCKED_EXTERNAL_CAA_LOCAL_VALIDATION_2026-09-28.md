# CAA Vou Falar — liberação em memória no LIVE

Data: 28 de setembro de 2026. Rastreio: #1038. Implementação: PR #1037.
Baseline: `966debf88065862e8f446688322e435a678b5cba`.

## Causa e escopo

A rota `/caa` já era pública na allowlist. O `RouteGuard` impedia sua
montagem quando autenticada no backend remoto porque a página restaurava e
persistia workspace/histórico browser-local sem fonte clínica tenant-aware.

A correção permite comunicação sem criar essa persistência: apenas o modo
local explícito pode invocar os adaptadores de storage da prancha. No remoto,
com ou sem autenticação, dados personalizados ficam em memória React. O
workspace é remontado ao mudar modo, identidade/autenticação ou clínica;
sair da tela/recarregar também descarta o estado e interrompe a síntese.

Mantidos os recursos existentes: cartões, frase, fala/repetir/apagar/desfazer,
busca, favoritos/histórico da sessão, três modos de uso, Primeiro → Depois e
exportação/importação manual. Exportar produz um JSON que o usuário precisa
proteger; não equivale a backup criptografado nem sincronização entre aparelhos.
O banner e o status informam a ausência de salvamento automático remoto.

Não alterados: autenticação, PIN, papéis, acesso ao prontuário, banco,
migrations, credenciais, inventários clínicos ou identidade institucional.
A assinatura digital continua bloqueada no LIVE. Todos os namespaces CAA
permanecem clínicos e negados na política global em sessão remota autenticada.

## Bloqueio do ambiente local — não confundir com falha do produto

| Sistema/acesso necessário | Fato verificado | Ação que falta | Risco/como encerrar |
| --- | --- | --- | --- |
| Terminal remoto conectado | Franquia mensal de execução esgotada; ferramenta instruiu não repetir/reconectar | Executar as verificações locais num terminal autorizado disponível | Não há prova de execução local independente. Encerrar somente com comandos/códigos de saída reais no SHA final. |
| Container da conversa | Sem checkout do repositório; obtenção de código por Git/rede não funcionou | Disponibilizar checkout e dependências de forma autorizada | Não afirmar lint/build/Chromium locais. Não pedir nem expor tokens para contornar. |

A conexão GitHub conseguiu ler/escrever a branch e abrir a PR. Os testes
foram submetidos aos workflows existentes; isso é execução remota do CI,
não uma execução local simulada. Nenhum workflow, assertiva crítica ou regra
de proteção foi desativado. Não se publicou por caminho alternativo.

## Evidência inicial e critérios de conclusão

No primeiro SHA de teste `6e99f4231421ac7f5f6bfa22b614d42b669a54d7`,
a execução `36424635833` (LIVE browser persistence guard), job
`108935474681`, já havia concluído com sucesso: decisões centrais,
contrato da fronteira/Service Worker, regressões de diários/pré-visita e
TypeScript. Na leitura registrada, lint/Chromium/build ainda não tinham
concluído. Isso não é aprovação do SHA final desta PR.

Antes do merge: verificar todos os checks obrigatórios e de segurança no
SHA final, incluindo os testes CAA e a jornada Chromium. A jornada ampliada
verifica zero tentativas de Storage/IndexedDB/Cache clínico antes de cada
navegação/reload, usa apenas fixtures sintéticas e mantém a assinatura
bloqueada. O teste de voz inspeciona o SpeechSynthesisUtterance enviado pelo
handler real; não comprova som audível no aparelho.

Depois do merge: conferir o workflow canônico Cloudflare, SHA/run da
sentinela pública `deploy-check.json` e uso de CAA no domínio publicado.
Um CI verde não comprova deploy. A issue #1038 permanece aberta enquanto
não houver prova de publicação; consultar PR/issue para os resultados
posteriores a este registro, sem reutilizar o verde de um SHA anterior.

## Rollback

Reverter o merge da PR #1037 pelo fluxo normal. Sem migration ou rollback de
banco. A correção não apaga os dados locais legados. A reversão restabelece
o bloqueio anterior da CAA em LIVE autenticado; não abre dados clínicos.
