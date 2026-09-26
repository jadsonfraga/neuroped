# Filtro: preservar bloqueio de idade inválida entre dispositivos

26 de setembro de 2026. Reconciliação sobre PR #998, HEAD 15bc70cd28b533afee30f5384c62d8b8a9add913; incorpora a correção de privacidade 72a21ed92027e154f22183cf546834e55a6fadfc e as mudanças concorrentes de sessão, validação etária e duração máxima.

## Defeito e correção

A validação concorrente corretamente recusava meses adicionais acima de 11 e idade total acima de 216 meses. Porém omitir a idade inválida da URL preservava o bloqueio apenas na sessão do remetente. Um destinatário sem essa sessão recebia um perfil sem restrição etária.

O serializador agora emite somente `idade=invalid`, sem a entrada inválida original. O leitor restaura o marcador como campos inválidos, reconhecidos pelo validador existente, e descarta a faixa anterior. O erro exige correção explícita da idade. Links legados válidos, incluindo `18m` como meses totais, continuam compatíveis. Texto livre nunca é emitido em `q`. A página, o carregador de sessão e a correção concorrente para duração máxima não foram sobrescritos.

## Evidência executada

Fontes da base conferidas por Git blob: módulo bdb74c7f46b29d57d511b5bd698ff2b5fab802c1; teste a259e15521d6e4278974df5f86ed156742baae62.

- Baseline da base 15bc70c: teste existente, exit 0.
- Regressão sem sessão de origem contra a base: exit 1; idade inválida se tornava indefinida.
- Módulo corrigido e teste completo de URL: `node --experimental-strip-types tests/unit/filter-url-state.test.ts`, exit 0.
- Matriz adicional: 399 combinações de anos e meses; idades válidas preservadas, inválidas bloqueadas sem fallback etário.
- Typecheck isolado: `tsc --noEmit --strict --target es2022 --module esnext --lib es2022,dom,dom.iterable client/src/lib/filterUrlState.ts`, exit 0.
- Mutação adversarial removendo o marcador: teste recusou, exit 1; fonte restaurada e teste novamente exit 0.

Blobs finais: módulo 91cd883fb9a2166db4f67235460f502dcbd01f6c; teste 6c8fda1a7e722bc3c90f746006fe96da84cc36c1.

## Limites e publicação

Os testes acima são unitários do módulo real, não uma simulação de validação humana nem um E2E completo do aplicativo. A rede local não permitiu instalar o repositório integral; check, lint, build e jornadas de navegador completas dependem da CI do HEAD resultante. Nenhum gate foi retirado. Nenhuma chave, migração ou dado de paciente foi alterado. Merge e publicação só podem ser declarados após os respectivos resultados; a auditoria de criptografia clínica e armazenamento LGPD é uma pendência distinta.
