# Salvaguardas após a auditoria de 55 casos

As lacunas foram verificadas com o front-end em Chromium e a API de testes, sem pacientes. O teste direcionado reproduziu as cinco antes da mudança e passou depois. O registro continua volátil.

| Lacuna | Mudança |
| --- | --- |
| Saída da ficha médica descartava a nota sem confirmação | Guarda de tela com alerta só quando há anotação. Cancelar preserva; confirmar descarta. Não grava rascunho em disco. A expiração da sessão não fica bloqueada. |
| Falta de material deixava ações de execução ativas | O convite e os recursos ficam indisponíveis enquanto o item está marcado como não aplicado. A equipe pode retirar a marcação quando tiver o material. Na ficha médica, o motivo ainda pode ser anotado. |
| Campo de bebê fornecia exemplo de giz | Texto neutro para todas as faixas; o painel opcional continua com exemplos específicos. |
| Atividade alternativa sem tela não tinha atalho antes de registrar | Estende os dois atalhos de recusa/oportunidade à alternativa, sem sobrescrever registro já feito. |
| Registro social sugeria a segunda figura, mesmo sem usar uma | Texto neutro preserva o meio realmente usado, sem pressupor figuras ou resposta. |

Validação de código: tipos, lint, build; suíte de exame com a matriz de 55 trajetos e o novo teste de proteção. O teste de saída cobre mudança de rota, cancelar, confirmar e iniciar outra sessão vazia. Não valida conduta, adoção humana ou psicometria. Reversão: apenas este commit, sem tocar a versão ilustrada nem backend.
