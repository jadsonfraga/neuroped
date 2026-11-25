# Prontuário: confirmação interrompida após gravar

Prova isolada sobre a árvore combinada `3b18a9cf45b1018717b1050e5623219ad6029744`, com Chromium, Pages Functions e D1 real local. Nenhum dado clínico real. Não integra os PRs #1407/#1408.

- Antes: quando o D1 gravava e a confirmação era interrompida, repetir a criação inseria uma segunda versão ativa. Após uma correção, a interface podia reabrir mostrando a versão antiga.
- Candidato: tentativas explícitas iguais na mesma tela conservam a referência opaca; a API confirma somente o mesmo evento ativo, autor, paciente, clínica, conteúdo e versão esperada. Não há reenvio automático. Um conteúdo diferente não reutiliza uma tentativa pendente.
- Testes: ciclo normal, perda da confirmação na criação e perda na correção, com uma versão ativa coerente; unitário cobre conteúdo diferente e tenant não autorizado.
- Limite: não é uma transação para o prontuário inteiro nem cobertura de múltiplos operadores editando em paralelo. Em outra aba ou após recarregar, verificar o estado salvo antes de repetir. Rollback local: reverter o commit deste candidato; sem migração.
