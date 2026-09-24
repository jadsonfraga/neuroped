# Evidências da espiral

## S1 — implementação inicial (registro do autor de 6d38d98)
- Origem: PR #949, commit `6d38d98f70c22ef1571a01423bc028c681f052bd`.
- O autor informou: teste go-live RED/GREEN, npm run check, npm run lint,
  npm run test:quick-wins e npm run test:saas-self-service com exit 0.
- Baseline informada: e77bbf7; entrega de e-mail 403 esperada no harness
  interceptado. Não é prova de entrega real, pagamento ou autorização de venda.
- Este histórico é preservado, sem atribuir sua execução à revisão abaixo.

## S1-R1 — revisão adversarial executada em 2026-09-24
- Escopo: handler real e autorização real; nove requisitos removidos um a um,
  configuração vazia, sete ambientes de cobrança, seis negativas de acesso,
  no-store, ausência de segredos/prefixos e ausência de chamadas a DB/provedor.
- Base exata: `6d38d98f70c22ef1571a01423bc028c681f052bd`.
- Fontes recebidas pelo conector GitHub e conferidas pelo SHA Git do blob:
  handler original `8f93c165fc341f5f58cb11c55f524ea20301b44b`;
  teste original `f62ed64a33cb5d9ce5d40233ab4daafdc01b0000`;
  autorização inalterada `9a1336205906f2a94911a6f702accf7a08cb2101`.
- Ambiente: Linux da sessão, Node 22.16.0, transpilador TypeScript 5.8.3
  já instalado. O package.json fixa TypeScript 5.6.3; esta execução auxiliar
  não substitui instalação pelo lockfile, typecheck ou a CI canônica.
- Comando realmente executado: `node --loader ./local-ts-loader.mjs
  tests/unit/go-live-readiness.test.ts`. O loader só transpila os arquivos
  originais; nenhuma regra de negócio foi copiada para um mock.
- Baseline PR sem novos testes: exit 0.
- Novo bloco 8 contra handler original: exit 1, mensagem
  `DB ausente não pode atestar configuração presente`.
- Handler corrigido + blocos 1 a 11: exit 0.
- Três mutações, cada uma exit 1: nível sempre presente; retirada da ressalva
  PRODUCAO_VERIFICADA ao escolher production; eco de ambiente arbitrário.
- Restaurado o candidato depois das mutações: exit 0.
- Uma colisão inicial na fixture (prefixo literal ambiente, igual ao nome do
  campo) foi corrigida usando cfg + bytes aleatórios. A assertiva permaneceu.

### Bytes efetivamente testados
- Handler Git blob: `3b3343d77a05253cdf26006c9e1e4f198c915dd3`.
- Handler SHA-256: `7711214b7e32f778dec54c8c8722375b5dc1c60a414b4c133ff2c262e98411fb`.
- Teste Git blob: `8413729829981a1fa347923f8cc87c36ed9f6288`.
- Teste SHA-256: `3eaba4e74a64c427b5dd57939478c6b2a5c599c8da77a4273e8a9ec8de100f62`.
- Artefatos locais: manifesto, fontes originais/candidatas, loader, runner
  de mutações e logs RED/GREEN. Anexo da sessão: neuroped-pr949-review.zip.
  A PR identifica o commit completo que contém esses blobs.

### Limites e gate de integração
- Sem checkout integral: clone bloqueado por DNS e terminal remoto por cota.
  Não foram executados npm ci, npm check/lint, verify/build completos nesta
  revisão local. Não confundir transpilação com verificação de tipos.
- Sem banco D1, envio de e-mail, cobrança, sessão real ou navegador autenticado.
  O teste injeta authUser no contrato interno; o middleware não foi contornado
  em produção. As sentinelas de fronteira demonstram ausência de efeitos.
- O package.json já inclui go-live-readiness em test:quick-wins e este em
  verify:release. Nenhum pipeline ou dependência foi adicionado.
- Exigir CI do novo HEAD e a revisão aplicável antes de merge/publicação.
  Resultados de ancestral não substituem os do candidato atual.

## Publicação anterior identificada, não publicação desta revisão
- e77bbf7942b0e6bc27af4468de0d332929573bbc: status Cloudflare success.
- Run 35945090755, job 107461209937: verificação pública, health autenticado,
  CORS e login constam como executados com success.
- HTTP atual das sentinelas indisponível na sessão. Não alegar SHA servido
  agora, credenciais comerciais válidas ou implantação deste candidato.

## Pendência operacional externa localizada
- Issue #926 consultada e ainda aberta, sem comentários, atualização em
  2026-09-22. Seu health do SHA a256d754 registrou criptografia e bucket não
  prontos. É evidência histórica específica; estado HTTP atual não observado.
- A issue rastreadora #594 conserva o aceite comercial completo. Nenhuma
  dessas issues foi fechada ou tratada como resolvida pelo diagnóstico.

## Reconciliação do merge concorrente
- Antes de mover qualquer ref, nova leitura mostrou #949 mesclada por outra
  sessão às 10:10:25 UTC. A branch encerrada não foi alterada.
- Main: `6614fbfc706bb5cbe6eefbe3772bc78dc4037f51`; sua árvore Git é
  `5ea861b2addf2de67037e8051724a387e0416a1d`, exatamente a árvore de 6d38d98.
  A correção complementar parte desse main, sem importar outro trabalho.
- Os blobs de código/teste acima permanecem os mesmos; testes finais
  reexecutados depois da reconciliação. Novo HEAD exige sua própria CI.
