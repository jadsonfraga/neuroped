# NeuroPed Flow OS — Navigation Layer

## Objetivo

Transformar navegação em continuidade de tarefa. O usuário não deve precisar lembrar onde uma função está, percorrer menus longos ou abandonar a tela atual para encontrar um paciente.

## Princípios

1. **Primário sempre disponível no mobile** — Início, Pacientes, Clínica, Agenda e Buscar ficam acessíveis em um toque.
2. **Busca representa o que promete** — paciente, escala e página são resultados reais, não apenas placeholders.
3. **Privacidade por padrão** — a busca de pacientes só roda na zona privada e após intenção explícita (2+ caracteres); nomes de pacientes não entram no histórico local de recentes.
4. **Conteúdo nunca fica atrás da navegação** — o shell reserva safe area e espaço inferior para o dock.
5. **Sem regressão clínica** — esta camada não altera Clinical Core, pontuações, prescrição, agenda backend, documentos ou regras de segurança.

## Métricas da fase

- distância máxima no mobile para Pacientes, Agenda, Filtro e Busca: **1 toque**;
- busca de paciente a partir de qualquer tela privada: **abrir busca + digitar 2 caracteres**;
- persistência de nome do paciente pelo mecanismo de recentes da paleta: **zero**;
- violações de acessibilidade introduzidas: **zero**.

## Próximo degrau

Depois da navegação, a evolução natural é **Task Continuity**: retomar consulta/paciente recente, ações contextuais por paciente e redução mensurável de cliques entre seleção do paciente, registro clínico, documento e follow-up.
