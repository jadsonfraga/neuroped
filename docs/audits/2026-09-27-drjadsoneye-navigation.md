# DrJadsoneye — acesso externo pelo NeuroPed

Data: 27 de setembro de 2026. Rastreamento: #1019 / PR #1021.
Base examinada: `2dd01b24c78a6c7e79dd6ed9730946435b6931a0`.

## Alteração e fronteira

O menu compartilhado de desktop/celular recebe um único atalho `DrJadsoneye`, logo abaixo do seletor de clínica. O link nativo abre `https://drjadsoneye.lovable.app` em nova aba com `noopener noreferrer` e `referrerPolicy="no-referrer"`. Nenhum paciente, tenant, token, parâmetro de consulta ou fragmento é enviado. Não há iframe, login compartilhado, cópia de código do aplicativo externo ou sincronização de prontuários.

O atendimento atual permanece na aba do NeuroPed. O clique fecha somente o drawer móvel. A política existente de `/conecta` controla a visibilidade; carregamento de sessão, zona pública, PIN e papéis permanecem sob os mesmos guards. A navegação recolhida mantém nome acessível e apresenta o rótulo no celular. Não foram alterados contratos clínicos, autenticação, banco, migrations ou demais rotas.

A URL foi identificada no projeto conectado do aplicativo externo. Estado publicado e disponibilidade HTTP são evidências diferentes: o primeiro não prova que o destino está saudável nem qual revisão está publicada. A análise privada do aplicativo externo não é reproduzida neste repositório público. O atalho identifica o destino como aplicativo externo de pesquisa; ele não certifica precisão clínica, segurança ou prontidão do produto de destino.

## Verificação reproduzível

O workflow aditivo `.github/workflows/drjadsoneye-navigation.yml`, somente leitura, executa:

```sh
npm ci
node --test tests/unit/drjadsoneye-shortcut.test.mjs
node --import tsx tests/unit/route-guard-policy.test.ts
npx playwright install --with-deps chromium
npm run build:client
node tests/e2e/drjadsoneye-navigation.mjs
```

São sete testes novos de renderização/contrato: URL fixa sem dados; variantes expandida/recolhida; segurança e acessibilidade; callback sem impedir a navegação; ausência de passagem de dados; montagem única protegida no shell; preservação do isolamento modal e da consulta. Usam React/ReactDOM e o runtime JSX automático do esbuild, sem simular o componente.

O workflow também faz GET HTTPS do destino, exigindo resposta bem-sucedida, mesma origem, HTML e corpo não vazio. Em seguida, o teste de navegador percorre três variantes do cliente realmente compilado: desktop, desktop recolhido e celular com preferência de menu recolhido. Utiliza a API clínica sintética já existente, nunca dados reais ou credenciais de produção. Seleciona idade/personagem fictícios, abre o link real, confere nova aba, URL, ausência de referrer/opener e preservação do estado/DOM da tela original. No celular exige fechamento do drawer e liberação de `inert`. Não pede câmera nem grava avaliação.

Esta é prova de UI com fixture de backend, não de autenticação remota de produção, precisão clínica ou jornada completa do aplicativo externo. Os workflows completos existentes permanecem inalterados.

## Evidência já obtida e limite atual

No head `66c8fe77c645fe4c48deaafcf39d1e628db11ad6`, o run `36338288985`, job `108673253086`, terminou com sucesso: sete testes passaram, zero falhas/skip; guard de acesso aprovado; GET do destino retornou HTTP 200 e `text/html; charset=utf-8`, na mesma origem. O checkout registrado foi o merge de teste `a5a70d767afa0e2f043c9e686c743a7de2e16fbf` sobre a base acima. Esses resultados são anteriores à adição do E2E; a prova de navegador só deve ser declarada após execução bem-sucedida no novo head.

- `BLOCKED_EXTERNAL_LOCAL_EXECUTION`: o ambiente de edição não conseguiu clonar por resolução de rede nem concluir a instalação local. O CI forneceu a execução unitária/HTTP real; execução local continua não demonstrada.
- Aceite de navegador: a execução automatizada foi adicionada, mas seu resultado ainda precisa ser conferido. Registrar resultado, run e SHA na PR. Não inferir aprovação pela existência do teste.
- A publicação da aba no NeuroPed exige revisão, merge e deploy canônico. Código em branch e CI verde não constituem publicação em produção.

## Rollback

Reverter a PR de navegação pelo fluxo normal de revisão. O revert retira o componente, sua inclusão no Layout e os testes/documentação/workflow específicos. Não há migração ou dados a desfazer. Não reescrever o histórico de nenhum dos projetos.
