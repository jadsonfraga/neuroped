# Escuta Clínica — reconciliação final para merge

Data: 06/09/2026.

A PR #797 foi reconciliada com o `main` canônico em `fb13ad20f4cb38994e91c1a5b788bbc155738483` antes da tentativa de merge.

O único conflito de conteúdo identificado na reconciliação foi `client/src/data/navigation.ts`. A resolução preservou integralmente a navegação vigente em `main` e acrescentou apenas a entrada protegida de Escuta Clínica no bloco de destaques.

A reconciliação executou `npm ci`, `npm run check` e `npm run lint` antes do push do merge commit e removeu o workflow temporário usado para a operação. Nenhuma proteção de branch foi desabilitada.

Durante o gate oficial após a reconciliação, `guard:clinical-artifacts` detectou que `docs/PROVENIENCIA_CLINICA.md` ainda refletia 257 instrumentos e 81 aguardando validação, enquanto o catálogo reconciliado já produzia 258 e 82. O arquivo derivado foi regenerado exclusivamente pelo comando canônico `npm run validate:catalog`; o workflow de correção bloqueava qualquer mudança fora desse único artefato e se removeu após o commit.

A promoção para `main` continua condicionada aos contextos oficiais exigidos pela proteção da branch: `Build & Lint` e `Dedicated E2E account only`. Este registro não substitui esses checks nem declara o deploy concluído.
