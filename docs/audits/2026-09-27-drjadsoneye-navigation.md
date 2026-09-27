# DrJadsoneye — acesso externo pelo NeuroPed

Data: 27 de setembro de 2026. Rastreamento: #1019.
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
```

São sete testes novos: URL fixa sem dados; renderização expandida e recolhida; atributos de segurança/acessibilidade; callback sem impedir a navegação; ausência de passagem de dados; montagem única protegida no shell; preservação do isolamento modal e do conteúdo da consulta. A renderização usa React/ReactDOM e o runtime JSX automático do esbuild, sem simular o componente.

O mesmo workflow faz GET HTTPS do destino, exige resposta bem-sucedida, mesma origem, HTML e corpo não vazio. Esse smoke não valida a execução de JavaScript, a câmera ou a exatidão das métricas do aplicativo externo. Os workflows completos já existentes continuam inalterados.

No momento de inclusão deste registro, essas execuções ainda não produziram evidência de aprovação. Resultados e respectivos SHAs devem ser registrados na PR a partir dos logs reais, nunca inferidos do código dos testes.

## Limitações e critérios de liberação

- `BLOCKED_EXTERNAL_LOCAL_EXECUTION`: o ambiente de edição não conseguiu clonar o repositório por resolução de rede e não concluiu a instalação das dependências. Ação: executar os comandos no GitHub Actions e conferir os logs. Risco: erro de compilação ou integração não detectado por mera leitura. Verificação: checks completos no head final.
- `BLOCKED_EXTERNAL_BROWSER_ACCEPTANCE`: ainda não há prova de clique em navegador real na aplicação integrada. Ação: conferir desktop, menu recolhido e drawer móvel; abrir o destino, retornar à consulta e confirmar que o conteúdo permaneceu. Verificação: URL correta, nova aba, menu móvel fechado, nenhum dado clínico na requisição e nenhum erro de navegação. Os testes de renderização não substituem essa prova.
- Publicação da aba no NeuroPed exige revisão, merge e deploy pelo fluxo canônico. Esta alteração em branch não constitui publicação em produção.

## Rollback

Reverter a PR de navegação pelo fluxo normal de revisão. O revert retira o componente, sua inclusão no Layout e os testes/documentação/workflow específicos. Não há migração ou dados a desfazer. Não reescrever o histórico de nenhum dos projetos.
