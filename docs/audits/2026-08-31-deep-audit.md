# Auditoria profunda do NeuroPed — 2026-08-31

## Resultado

Auditoria executada no commit `00da7878`, branch `codex/reconcile-neuroped-2026-08-29-21b4803`, cobrindo frontend React/Vite, roteamento e autorização, catálogo clínico, armazenamento local protegido, espelhamento Express/Cloudflare, exportação PDF/CSV e fluxos de navegador.

Foram encontrados e corrigidos cinco problemas de funcionamento/qualidade e um problema no próprio teste E2E:

1. O pódio do filtro envolvia o cartão inteiro em um link e também continha links para a aplicação e PubMed. Isso gerava `<a>` dentro de `<a>`, quebrava a semântica de teclado e podia interceptar o estudo externo. O cartão agora mantém ações internas separadas e o PubMed continua externo.
2. O auditor de telas encerrava a aba antes de importações lazy de CSS terminarem e registrava falsos `console.error`. A auditoria agora aguarda a estabilização da rede antes de concluir cada tela.
3. A experiência infantil dependia de um `@import` remoto de fontes. Com a rede bloqueada, o preload CSS falhava e a rota podia cair no Error Boundary. As fontes agora têm fallback de sistema e a montagem não depende de rede externa.
4. O texto de dificuldade da experiência infantil não atingia o contraste exigido em fundo colorido. A opacidade foi removida.
5. O E2E de NeuroAcompanhamento dizia validar instalação local, mas executava o build de produção (fechado e dependente de autenticação remota). O teste agora inicia um Vite efêmero com `VITE_OPEN_ACCESS=true` somente no processo de teste; o bundle de produção permanece fechado.
6. As escalas passavam `undefined` ao `RadioGroup` na primeira renderização e uma string após o primeiro clique, gerando a transição React “uncontrolled to controlled”. O wrapper compartilhado agora normaliza ausência de resposta para `""`, preservando o estado controlado desde o início.

## Evidências reproduzíveis

- `audit-screens`: 300/300 rotas, 0 crash, 0 tela vazia e 0 erro de console.
- `audit:a11y:full`: 54 rotas, 0 violações `serious/critical` e 0 violações em todas as severidades.
- `audit:lighthouse`: 12 arquétipos, todos dentro dos limites de performance 95, acessibilidade 100, boas práticas 100 e SEO 100.
- `test:e2e:scales`: 20/20 fluxos completos, PDFs válidos, snapshots estáveis antes/depois da exportação e nenhuma transição controlado/não-controlado.
- `test:e2e:missao-saude` e `test:e2e:neuroped-acompanhamento`: aprovados em navegador real.
- Regressão de `RadioGroup`: contrato central aprovado; as escalas deixam de emitir a transição controlado/não-controlado.
- TypeScript (`tsc --noEmit`), ESLint sem warnings, regressões de filtro/CSS/RBAC e guard de diário LIVE: aprovados.
- Catálogo: 253 instrumentos validados estruturalmente; ranking, fluxogramas, isolamento tenant e contratos clínicos existentes permaneceram verdes.

Os relatórios gerados ficam em [`a11y-report.json`](../../scripts/guards/a11y-report.json) e [`lighthouse-report.json`](../../scripts/guards/lighthouse-report.json). O novo E2E foi incorporado ao `verify:release`.

## Limites da auditoria

O ambiente não possui credenciais clínicas, configuração real de D1/Cloudflare, provedores de agendamento ou integração de envio de e-mail. Portanto, a auditoria comprova o comportamento local, os contratos e as barreiras de segurança, mas não substitui um smoke test controlado no ambiente LIVE com conta de teste, banco e integrações institucionais configurados.
