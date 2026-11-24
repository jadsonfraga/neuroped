# PANTY — suíte existente conectada ao gate de release

Data: 24/11/2026. Base inspecionada: `b8e895ef8ae35f52695f240ba093b2b3b9c43189`.

Rastreio: issue #1391.

## Problema e alteração

`tests/laudo/test-panty-audit.test.ts` existia, mas nenhum script do `package.json` o executava. Incluí-lo apenas em `test:clinical-documents` não garantiria execução no release: esse grupo não era chamado por `verify:release`.

O novo script `test:panty-audit` executa a suíte existente com `node --import tsx --test`. Ele é chamado por `test:clinical-documents` e por `verify:release`, mantendo a propagação de falha por `&&`. Nenhuma regra clínica, teste, dependência, backend, documento ou fluxo de emissão foi alterado.

## Validação executada

- `npm run test:panty-audit`: exit 0; 6 testes aprovados, 0 falhas e 0 ignorados.
- Execução em diretório isolado, Node 24.22.3 e tsx 4.20.5. O checkout completo e suas dependências ainda não estavam disponíveis nessa verificação. A instalação auxiliar não modificou o lockfile do projeto.
- `git hash-object client/src/lib/laudo/pantyAudit.ts tests/laudo/test-panty-audit.test.ts`: exit 0; hashes `c14fc584fce02868aca1e84ef5978fd2fd01223f` e `798f37e1822f6812e8c76704dd69f68094dc4896`, idênticos aos blobs da base.
- Inspeção do grafo de scripts e YAML: exit 0; `verify → verify:release → test:panty-audit` é alcançável pelos workflows `verify.yml` e `test-and-build.yml`, ambos acionados por push/PR para main sem filtro de paths. Nenhum workflow adicional foi necessário.

A suíte cobre verificações estruturais já existentes de fontes, divergências, hipóteses, metas, medicação e aceite declarado. Isso não autentica o médico, não comprova revisão humana, não homologa PANT V12 e não libera emissão clínica ou venda SaaS.

A suíte completa `npm run verify`, o build e a CI do novo commit não foram executados nesta verificação isolada. Seus resultados devem ser observados no PR antes da promoção.

## Rollback

Reverter apenas as três alterações de scripts do `package.json` deste incremento. Não há migração, segredo, mudança de dados ou efeito em produção; o rollback remove a cobertura adicional do gate.
