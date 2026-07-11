# NeuroPed Intelligence — MVP

## Objetivo

Criar uma camada de apoio à decisão clínica que organize evidências, revise coerência documental, produza contraditório e permita análises agregadas da casuística, mantendo supervisão médica obrigatória.

## Princípios inegociáveis

1. Não fechar diagnóstico, prescrever ou substituir avaliação médica.
2. Não enviar dados identificáveis de menores a serviços externos.
3. Registrar fonte, data, nível de evidência, incerteza e limitações.
4. Separar dado relatado, observado, documentado e inferido.
5. Exigir confirmação humana antes de incorporar qualquer sugestão ao prontuário ou laudo.
6. Manter trilha de auditoria das versões, decisões aceitas e rejeitadas.
7. Nunca aprender silenciosamente com dados clínicos; memória clínica depende de consentimento e curadoria explícita.

## Módulos

### 1. Auditor clínico

Entrada: texto anonimizado de história, exame, instrumentos, hipóteses e conduta.

Saída mínima:
- lacunas clínicas;
- inconsistências internas;
- linguagem excessivamente categórica;
- ausência de impacto funcional;
- separação inadequada entre relato e observação;
- alertas de segurança farmacológica básica;
- pontos que precisam de revisão médica.

### 2. Contraditório

- achados a favor;
- achados contra;
- melhor tese alternativa;
- vieses cognitivos possíveis;
- evidências que mudariam a conclusão;
- red flags e dados de alto impacto ainda necessários.

### 3. Evidências

Conectores futuros:
- PubMed;
- Cochrane Library;
- diretrizes de sociedades profissionais;
- bases de evidência secundária.

Cada referência deverá incluir DOI/PMID quando disponível, tipo de estudo, população, tamanho amostral, efeito, limitações e aplicabilidade clínica.

### 4. Memória clínica curada

Não usar treinamento automático. Armazenar apenas regras ou decisões selecionadas e aprovadas pelo médico, com contexto, data, justificativa e versão.

### 5. Casuística anonimizada

Modelo agregado para idade, domínio clínico, escalas, comorbidades, exames, intervenções e desfechos. Proibir reidentificação e restringir análises com células pequenas.

### 6. Pesquisa e inovação

Transformar achados agregados em perguntas estruturadas, hipóteses, protocolos observacionais e oportunidades de publicação, sempre distinguindo exploração de inferência causal.

## Estado desta entrega

- Página clínica inicial criada em `client/src/pages/neuroped-intelligence.tsx`.
- Auditoria estrutural local no navegador, sem chamada externa.
- Cartões de módulos e estados de maturidade.
- Avisos explícitos de supervisão humana e LGPD.

## Próxima integração técnica

1. Registrar a rota `/neuroped-intelligence` no `client/src/App.tsx`.
2. Adicionar entrada no menu e na paleta de comandos.
3. Criar testes de navegação e de ausência de envio de dados.
4. Implementar API de evidências sem conteúdo identificável.
5. Criar schema de auditoria e decisão humana no Drizzle.
6. Adicionar controle de acesso exclusivo ao perfil médico.
