# Validação visual — próxima fase

## 2026-08-27

A rota `http://127.0.0.1:5174/#/saas` carregou a tela de falha global do NeuroPed, com identificador técnico `4447FD3E`, antes de montar a Central OS. O console do navegador não exibiu exceção textual. O smoke E2E e a checagem TypeScript passaram, portanto o próximo passo é reproduzir o bundle/runtime servido no navegador e revisar os artefatos gerados antes de continuar a inspeção das abas.


Após limpar o cache local no navegador, a Central montou corretamente. A aba Acessos exibiu a matriz de papéis e o bloco Convites de equipe com papel, expiração e mensagem explícita de que não há dados reais no modo demo. A falha inicial era cache/runtime local, não uma falha persistente do bundle; o smoke E2E continua verde.


A aba LGPD renderizou a fila de direitos com formulário de solicitação e estados demonstrativos “Em revisão”, “Disponível” e “Requer verificação”. O texto explica que o e-mail é transformado em hash no servidor e que a execução real exige verificação de identidade; nenhum e-mail ou PHI foi exibido no modo demo.


A aba Developer API renderizou corretamente o console de integrações, mostrando ambiente, status, escopos, referência de secret manager e endpoint como campos controlados, além de distinguir a credencial demo local. O console revelou warnings React de chaves duplicadas na tabela de papéis da aba Acessos (`Total`, `Vínculo` e `Não`), sem exceção fatal. Esse warning será corrigido antes do commit.


Após o reload completo, a rota correta `#/saas` exibiu novamente a aba Developer API e o formulário de integrações com sandbox, produção, status, escopos, referência de segredo e endpoint. O parâmetro adicionado dentro do hash foi corretamente identificado como rota inválida e não será usado. O snapshot visual confirma a operação em modo demo sem tenant e sem credencial real.
