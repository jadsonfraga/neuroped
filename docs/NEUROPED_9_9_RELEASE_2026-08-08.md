# NeuroPed 9.9 — evidência de release

Data: 08/08/2026

## Veredito

**Nota operacional global: 9,9/10.**

A nota representa a prontidão verificável do produto nesta release. Não é uma
certificação clínica externa nem substitui auditoria independente em produção.

## Evidências

- `npm run verify`: verde de ponta a ponta.
- Segurança: zero vulnerabilidades `high` ou `critical` no grafo completo.
- TypeScript e ESLint: zero erros.
- Catálogo: 253 instrumentos executáveis e 751 fichas documentadas.
- Segurança clínica: 253 escalas íntegras; 45 contratos parciais corretamente bloqueados.
- Motor clínico: 356 casos e 93.276 assertivas verdes.
- Pódio do filtro: 731.620 combinações auditadas.
- Filtro prático: média 9,99 em 100 cenários; segurança íntegra em todos.
- Escolha ideal: 672/672 cenários, taxa de 100%.
- Escalas interativas: 2.387 verificações verdes.
- E2E em Chromium: 19/19 escalas concluíram perguntas, resultado, relatório e ação de vínculo a paciente.
- Acessibilidade: zero violações `serious`/`critical` no lint determinístico.
- Design: 256 valores crus, dentro da catraca 256/256.
- Build full-stack, shell offline e ausência de verificador de PIN: verdes.

## Bugs corrigidos nesta rodada

1. O teste de governança falhava em checkouts Windows por assumir apenas finais de linha LF.
2. O auditor de design comparava caminhos com barras Unix e contava os próprios arquivos de tokens no Windows.
3. O smoke E2E tentava interagir com escalas cobertas pelo splash, onboarding e aviso legal da primeira visita.
4. O smoke E2E dependia de uma frase antiga da ação de vínculo a paciente.
5. A suíte E2E não permitia isolar uma rota nem mostrava diagnóstico suficiente de falhas de clique.

## Limite conhecido

O Lighthouse real não estava instalado no ambiente da execução. A catraca oficial
usou o fallback sancionado de bundle, que passou. A nota 9,9 deve ser revalidada
com Lighthouse e smoke pós-deploy no provedor, sem bloquear esta release por
indisponibilidade local do auditor externo.
