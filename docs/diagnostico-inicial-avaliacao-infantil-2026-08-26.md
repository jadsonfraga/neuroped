# Diagnóstico inicial — abertura, sidebar e avaliação infantil

Data do diagnóstico: 26 de agosto de 2026.

## Evidência visual atual

A versão pública de `https://neuroped.pages.dev/` abriu no shell profissional com a barreira educativa exibida inicialmente. Após fechar o aviso, a tela continuou na rota de login por não haver uma sessão profissional autenticada neste navegador. A captura inicial da produção foi salva pelo navegador em `/home/ubuntu/screenshots/neuroped_pages_dev_2026-08-26_21-02-49_1627.webp`; a captura após o fechamento do aviso foi salva em `/home/ubuntu/screenshots/neuroped_pages_dev_2026-08-26_21-03-02_3477.webp`.

A sidebar observada em produção expõe os destaques de EEG & Vídeo-EEG, Filtro de Escalas, Marcação · Secretaria IA e Serviços da Clínica. Medicamentos não aparece no trecho visível da sidebar nessa viewport porque está dentro de uma seção recolhida/mais abaixo, mas a página inicial e o código confirmam que o cartão “Medicamentos e doses” ainda integra o conjunto principal de fluxos da abertura.

## Estado de código encontrado

`client/src/pages/home.tsx` define cinco cartões em `clinicalFlows`: Aplicar escala, Encontrar a escala ideal, Avaliação Cognitiva Infantil, Medicamentos e doses e Marcos do Desenvolvimento. O cartão de medicamentos usa a rota `/medicamentos`, o ícone `Pill` e a descrição “Farmacologia prática, calculadora de dose e monitorização”. O bloco de métricas também exibe “Medicações” usando `appMetrics.medicationCount`.

`client/src/data/navigation.ts` mantém Medicamentos (`/medicamentos`), Farmacologia (`/farmacologia`) e Calculadora de dose (`/calculadora-dose`) no grupo estrutural `REFERÊNCIA`. O requisito do usuário é retirar o cartão de medicamentos da abertura e criar uma entrada clínica organizada na sidebar, sem remover as ferramentas clínicas.

`client/src/pages/testes-reconhecimento.tsx` já possui uma página extensa e lúdica, mas atualmente está configurada para grupos de idade de 2–3, 3–4, 4–5, 5–6 e 6–7 anos. Os domínios existentes são Cores, Letras, Animais e Partes do Corpo; não há ainda os quatro domínios pedidos de forma explícita para 1–5 anos: frutas, meios de transporte, partes do corpo e conhecimentos gerais.

`client/src/pages/avaliacao-cognitiva-infantil.tsx` já possui quatro domínios: Reconhecimento Visual, Leitura, Escrita / Ortografia e Aritmética. A idade atual aceita 2–19 anos e agrupa a criança em bandas largas A–G. Cada domínio usa quatro itens por banda, o que deixa a bateria curta, mas o conteúdo ainda não está calibrado nos recortes exatos solicitados de 6, 7, 8, 9, 10, 12 e 13 anos.

## Diagnóstico técnico preliminar

A base existente é reaproveitável: a página de reconhecimento já possui scoring 0/1/2, abas, relatório clínico e salvamento no paciente; a avaliação cognitiva já possui a arquitetura de módulos e os domínios de leitura, escrita e aritmética. A mudança segura será uma evolução de bancos de itens, faixas e apresentação, não uma duplicação completa do motor.

O próximo passo é implementar uma bateria enxuta e graduada, mantendo aviso de triagem educativa, registro item a item, possibilidade de “não observado/não aplicável” quando necessário e separação clara entre desempenho observado e diagnóstico. Nenhum item deve ser tratado como instrumento psicométrico validado sem fonte e validação formal.

## Captura da Avaliação Cognitiva em produção

A tentativa de abrir `/#/avaliacao-cognitiva-infantil` no ambiente público foi redirecionada para `/#/login`, confirmando que a rota está protegida por sessão profissional. A captura dessa tela foi salva em `/home/ubuntu/screenshots/neuroped_pages_dev_2026-08-26_21-03-44_7900.webp`. A sidebar permanece visível, mas a bateria cognitiva não pode ser examinada interativamente neste navegador sem credenciais profissionais; a análise de conteúdo foi feita diretamente no código-fonte, sem tentar contornar a autenticação.

## Referências para calibração dos novos itens

A página oficial do CDC organiza marcos por idade e reforça que marcos descrevem habilidades que a maioria das crianças realiza em como brinca, aprende, fala, age e se movimenta; a própria página oferece recortes até 5 anos e materiais de monitoramento, sem equivaler a instrumento diagnóstico. Fonte consultada: https://www.cdc.gov/act-early/milestones/index.html.

No recorte de 2 anos, o CDC descreve como exemplos apontar elementos em um livro quando solicitado, apontar ao menos duas partes do corpo quando solicitado, usar gestos variados, manipular brinquedos com botões/interruptores e brincar com mais de um objeto. Esses achados apoiam tarefas de apontar, reconhecer e escolher com baixa carga verbal para a faixa pequena. Fonte consultada: https://www.cdc.gov/act-early/milestones/2-years.html.

No recorte de 5 anos, o CDC inclui responder perguntas simples sobre histórias, reconhecer rimas simples, contar até 10, nomear alguns números de 1 a 5, sustentar atenção por 5–10 minutos, escrever algumas letras do próprio nome e nomear algumas letras apontadas. Esses achados apoiam uma bateria curta com progressão para linguagem, contagem e pré-alfabetização, sem usar o resultado como diagnóstico isolado. Fonte consultada: https://www.cdc.gov/act-early/milestones/5-years.html.

A BNCC foi localizada no portal oficial do Ministério da Educação, embora a página tenha apresentado CAPTCHA no navegador. O conteúdo textual disponibilizado confirma a organização por Educação Infantil, Ensino Fundamental e habilidades/práticas de linguagem e matemática; a BNCC será usada apenas como referência curricular de progressão, nunca como norma psicométrica. Fonte consultada: https://basenacionalcomum.mec.gov.br/abase/.

Decisão de desenho: para 1–5 anos, usar itens de reconhecimento/apontar com imagens ou emojis grandes, poucos distratores, instruções simples, opção de resposta parcial/não observado e no máximo quatro domínios curtos. Para 6–13 anos, acrescentar blocos breves de leitura, escrita e aritmética graduados por idade/série, sempre rotulados como triagem/observação e com espaço para fatores como escolarização, língua, visão, audição, atenção e oportunidade de aprendizagem.

## Progressão acadêmica — referências adicionais

O guia do What Works Clearinghouse/IES sobre habilidades fundamentais de leitura para o Kindergarten ao 3º ano recomenda ensinar linguagem acadêmica e vocabulário, desenvolver consciência dos segmentos sonoros e sua ligação com letras, ensinar decodificação/análise de partes de palavras e escrita/reconhecimento de palavras, além de leitura de texto conectado para precisão, fluência e compreensão. A referência será usada para elevar a dificuldade de leitura e escrita de forma progressiva, sem converter o aplicativo em teste normatizado. Fonte consultada: https://ies.ed.gov/ncee/wwc/practiceguide/21.

O guia do What Works Clearinghouse/IES sobre intervenção em matemática elementar foi consultado como referência complementar para organizar progressão de número, operações e resolução de problemas, priorizando raciocínio e representação em vez de apenas contas soltas. Fonte consultada: https://ies.ed.gov/ncee/wwc/practiceguide/26.

Essas fontes orientam o desenho, mas não validam os itens autorais do NeuroPed. A implementação deverá declarar que o bloco é uma triagem estruturada/observação de desempenho e exigir interpretação clínica integrada a escolarização, idioma, visão, audição, atenção, oportunidade de aprendizagem e contexto sociocultural.

## Validação visual local

O build local compilou, mas a rota `/testes-reconhecimento` exibiu corretamente a tela “Área do profissional” mesmo com `VITE_ZONE=public`, porque essa rota permanece clínica/protegida pelo `RouteGuard`. O console não mostrou erro de runtime; o bloqueio ocorreu por política de acesso, não por falha do componente. A validação visual interativa das telas protegidas deve ser feita com uma sessão profissional autorizada ou por um preview de design explicitamente separado da aplicação clínica. Nenhuma autenticação foi contornada.
