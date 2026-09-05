# NeuroPed SDG — piloto de fechamento por versão

Relaciona #796. Base examinada: `1b23a93f42fc5facfc49e04300a7d4771ae16652`.

## O que funciona neste corte

`shared/encounter-closure.mjs` projeta eventos no formato do `shared/clinical-core.ts`, sem novo banco, endpoint ou prontuário. Gera lista de alterações, diferenças entre fontes, informações não avaliadas, pendências explicitamente exigidas, sinalizações e versão SHA-256. O corte é determinístico para a mesma entrada e torna o resultado imutável.

O fechamento separa realizado, revisão médica da versão, documentos conferidos, prova de entrega ligada ao hash e situação financeira. Dinheiro pendente não bloqueia entrega assistencial. O rascunho por destinatário reutiliza somente planos explicitamente registrados como decisões do médico.

## Teste reproduzível sem dependências

Requer Node 22 ou superior com WebCrypto. Na raiz:

```sh
node --test tests/unit/encounter-closure.test.mjs
node tools/encounter-pilot/demo.mjs
```

Foram executados 49 testes do núcleo com Node 22.16.0: 49 passaram, 0 falharam e 0 foram ignorados. Não foi executada a suíte inteira do repositório, npm ci, build ou check de TypeScript neste ambiente. O workflow acrescentado testa somente este escopo e não substitui os checks obrigatórios do repositório.

## Não é aprovação, assinatura ou entrega real

As funções aceitam evidências já verificadas pelo chamador; elas NÃO autenticam pessoas, provam pagamento, assinam PDF, enviam documento ou consultam banco. Nunca encaminhar diretamente evidência submetida pelo cliente como autoridade de revisão. Nenhum botão de demonstração pode ser usado como aprovação clínica em produção.

Antes de integração LIVE: autenticar sessão; resolver tenant persistido e papel; validar eventos no schema canônico; garantir leitura completa; obter exigências documentais decididas pelo médico; verificar autoria, versão, hashes e prova de entrega em backend; invalidar aprovações de forma transacional ao receber nova informação. Leitura e escrita devem repetir tenant no predicado final e respeitar governança já existente. A projeção não resolve autorização, paginação, criptografia ou retenção.

`readyForReview` significa apenas completude nas regras explícitas do piloto. Não significa prontidão diagnóstica, ausência de risco ou avaliação clínica concluída. Diferenças entre fontes/contextos não são contradições diagnósticas automáticas.

## Métricas

Os quatro tempos representam trabalho médico, não tempo de espera nem trabalho da equipe. Valores ausentes permanecem desconhecidos. O honorário efetivo usa a soma dos recebimentos e a soma das durações somente das mesmas linhas completas. Não equivale a lucro da clínica. Não há economia observada sem amostra real.

## Compatibilidade e rollback

Arquivos novos, sem alterar contrato, rotas, banco, dependências ou interface do PR #792. Não consumir eventos reais na bancada fictícia. Rollback: reverter o commit deste piloto; não há migração ou dado persistido a desfazer. Manter em revisão até os checks e avaliação independente. Não ativar Clinical LIVE nem cobrança.
