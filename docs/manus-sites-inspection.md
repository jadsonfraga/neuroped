# Inspeção inicial dos sites Manus

Data da verificação: 2026-08-20.

## Secretaria IA

URL: https://secretariaia-7jubr6nq.manus.space

O site apresenta a Clínica Dr. Jadson Fraga, com área de equipe em `/admin`, fluxo de triagem em `/triagem`, informações de consulta presencial, EEG domiciliar e teste de TDAH por realidade virtual. A página pública descreve triagem administrativa, consentimento e encaminhamento humano. O acesso à área de equipe pode exigir autenticação Google.

## Missão Saúde

URL: https://drjadsongame-ko8qudqs.manus.space

O site é um jogo educativo público chamado “Missão Saúde — Dr. Jadson”, com três estações: Mochila do cuidado, Bolhas de sabão e Lanche arco-íris. A sessão controla estrelas, adesivos e progresso do circuito no navegador; não foi identificado login na tela inicial.

## Decisão preliminar

As abas do NeuroPed devem separar claramente “Secretaria IA” e “Missão Saúde”, com abertura integrada e fallback em nova guia caso a política de segurança do site impeça incorporação. A área administrativa da Secretaria não deve receber credenciais pelo NeuroPed; quando necessário, o login deve ocorrer no próprio site, preservando a sessão do provedor.

## Página institucional do neuropediatra

URL: https://drjadsonmd-iqeiteek.manus.space

O título público é “Neuropediatra em Petrolina | Dr. Jadson Fraga”. Na inspeção inicial, a página renderizou apenas uma tela clara com a marca “Made with Manus”, sem elementos interativos ou conteúdo textual visível. A aba deverá manter um link de abertura externa como fallback, pois a renderização pode depender de recursos dinâmicos ou de uma publicação incompleta.
