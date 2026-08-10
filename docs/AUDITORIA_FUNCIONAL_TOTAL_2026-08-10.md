# Auditoria funcional total — NeuroPed

**Data:** 10 de agosto de 2026  
**Escopo:** aplicação React/PWA, Cloudflare Functions, rotas públicas e privadas, segurança, Clinical Core, NeuroPed Conecta, agenda/recepção, escalas, testes clínicos, documentos e pipelines de produção.

## Síntese executiva

A auditoria percorreu 630 arquivos de código, 141 rotas React literais, 139 imports lazy de páginas e 37 handlers/endpoints Cloudflare. O scanner estático foi usado apenas como mecanismo de descoberta: termos como `placeholder`, `demo` e `TODO` foram revisados em contexto para evitar transformar exemplos, metadados ou comentários legítimos em falsos bugs.

A bateria de execução antes das correções passou em `verify:release`, auditoria completa de acessibilidade, E2E de escalas, auditoria de telas e build integral. A revisão manual encontrou, porém, uma falha funcional não capturada pelos gates existentes: cinco endpoints clínicos de escrita respondiam `201` quando D1 não estava configurado, embora nenhum dado fosse realmente persistido. Esse comportamento foi removido.

## Falha corrigida

As escritas de pacientes, consultas, documentos, resultados de escalas e resultados clínicos agora falham fechado quando D1 está ausente. A resposta é `503 DB_REQUIRED` e informa explicitamente que nenhum registro foi criado. Leituras demonstrativas continuam permitidas apenas onde já são explicitamente identificadas como demo.

Essa regra passou a ter dois níveis de proteção permanente:

- teste runtime `tests/unit/no-fake-clinical-write.test.ts`, exercitando os cinco endpoints;
- teste estático `tests/unit/loose-ends-regression.test.mjs`, impedindo retorno futuro de “Registro simulado” em escrita clínica e protegendo também triagem efêmera, Portal Família e versionamento derivado do `package.json`.

O teste legado `cloudflare-input-limits.test.ts` foi reconciliado com a semântica fail-closed: payload válido continua atravessando a validação, mas sem D1 deve terminar em `503 DB_REQUIRED`, nunca em falso sucesso.

## Matriz funcional revisada

| Domínio | Estado após auditoria | Evidência/gate principal |
|---|---|---|
| Home, shell, navegação, PWA e rotas | Verificado | `audit:navigation`, build, auditoria de telas |
| Acesso público/privado e RouteGuard | Verificado | `validate:public`, `guard:open-access`, `audit:access` |
| Login, sessão, refresh, logout e ownership | Verificado | testes de auth/races/sessões + `test:ownership` |
| LGPD e consentimentos | Verificado no contrato atual | testes Cloudflare/Express de consentimento |
| Pacientes e prontuário | Verificado; escrita sem DB corrigida | ownership + novo gate `DB_REQUIRED` |
| Pré-consulta e pré-retorno | Verificado | navegação, build e contratos do app |
| Filtro inteligente de escalas | Verificado | `test:filter`, ranking, filtro prático/ideal e auditoria fillable |
| Sinais/sintomas no filtro | Funcional | ranking/signalTags e seletor clínico existentes |
| Triagem sem cadastro (`mode=flash`) | Verificado e protegido | sessionStorage efêmero + novo teste de regressão |
| Catálogo e escalas interativas | Verificado | catálogo, dados, auditoria clínica, interatividade e E2E |
| Testes diretos/cognitivos | Verificado | `test:cognitive`, build e navegação |
| Diários clínicos/escola/terapias/epilepsia/sono etc. | Verificado no contrato atual | inventário, rotas, build e auditoria de telas |
| CAA | Verificado no build/rotas atuais | release gate e auditoria visual |
| Documentos, relatórios, PANT, receitas e assinatura | Verificado no contrato atual; escrita sem DB corrigida | segurança, build e novo gate fail-closed |
| Clinical Core / Cockpit longitudinal | Verificado | `test:clinical` e PR/release gates existentes |
| NeuroPed Conecta | Verificado | gate dedicado dentro do PR/release |
| Recepção, agenda, booking, lista de espera, reputação e financeiro | Verificado no hardening atual da main | Operational Suite + migrações D1 0007/0008 |
| Referências, farmacologia, curvas e utilitários | Verificado em rotas/build | navegação, build e auditorias de acesso |
| Compartilhamento/WhatsApp | Verificado no que é implementado | `test:share-whatsapp`; integrações externas não são simuladas |
| Cloudflare/Vercel/GitHub Pages | Pipeline com trava de SHA | deploy só após merge e gates verdes |

## Pontas soltas reconciliadas

Diversas issues antigas descrevem estados já superados pelo produto. Triagem efêmera sem cadastro, segurança do Portal Família, fonte única de versão, cobertura do filtro/escalas e auditorias visuais atuais já possuem implementação e/ou gates correspondentes; devem ser tratadas como concluídas/supersedidas quando a promoção desta correção for comprovada em produção.

Quatro pendências não devem ser “fechadas por força” nesta entrega:

1. **#514 — criptografia de dados clínicos reais em repouso.** Exige migração coordenada, backup, rollback, teste de restauração e revisão LGPD. Enquanto aberta, o sistema não deve ser promovido como repositório irrestrito de dados clínicos identificáveis reais.
2. **#515 — revogação externa de credenciais históricas.** A remoção no código/Cloudflare não prova revogação no emissor/provedor externo.
3. **#533 — proveniência de conteúdo externo.** Depende da fonte original fora do repositório; não pode ser resolvida por inferência.
4. **#438 — peso clínico exato de 50% para sinais/sintomas.** Os sinais já participam do ranking; mudar o peso altera decisão clínica do motor e requer decisão médica explícita, não simples fechamento técnico de issue.

## Trava antirregressão desta entrega

`verify:release` agora inclui `test:no-fake-clinical-write` e `test:loose-ends`. Antes da promoção, também são obrigatórios `audit:a11y:full`, `test:e2e:scales`, `audit:screens` e build integral. Depois do merge, Cloudflare e Vercel devem publicar o mesmo SHA; divergência, falha de health/auth/CORS ou qualquer gate vermelho bloqueia a conclusão do deploy.
