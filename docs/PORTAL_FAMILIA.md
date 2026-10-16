# Portal da família (item 5)

Link seguro, temporário e de uso limitado que reúne, para a família, **orientações em linguagem simples, lembretes, questionário de pré-consulta e documentos já liberados pelo médico**. O app **não envia nada**: gera o link e uma mensagem-rascunho para o médico copiar e enviar.

## Regra do médico (vale para tudo)
- Nos testes próprios do NeuroPad (Super NeuroPad Game, Dyslexia Risk/ICED-8) o portal **não mostra corte, nível, nota nem classificação**. O item "avaliação própria" só tem: instrumento, data, texto fixo de **como a avaliação foi feita** e uma descrição **escrita pelo médico** de como a criança respondeu. Não existe campo de pontuação/nível no schema.
- Textos livres (orientações, lembretes, descrição da avaliação) passam por um filtro que recusa diagnóstico, CID, nível, corte, pontuação, percentil, "positivo/negativo" etc. (`findForbiddenInterpretation`, em `shared/family-portal.ts`). O médico só gera o link marcando que revisou o conteúdo.
- Documentos entram somente se já estiverem **publicados e liberados à família** no prontuário (`family_visibility`), e nunca os de origem `instrument` nem do tipo `scale`.

## Segurança e LGPD
- Link = `/portal.html#token=<id>.<segredo>`. O token fica no fragmento (não vai ao servidor em logs/referrer), é removido da barra de endereço e só existe em memória.
- O segredo **não é guardado**: só o blind index por clínica (`token_hash`), comparado em tempo constante.
- **Expiração** (1–720 h, padrão 72 h) e **aberturas limitadas** (1–10, padrão 3; 1 = uso único). O consumo é um `UPDATE` atômico com as mesmas regras (ativo, não expirado, abaixo do limite).
- **Consentimento LGPD explícito a cada abertura**: o `GET` devolve só metadados e o aviso; o conteúdo só sai no `POST` com `consentAccepted` e a versão do aviso. Registro de versão e instante do primeiro consentimento.
- **Mínimo de dados**: o conteúdo é um snapshot cifrado (chave clínica da clínica) só com o que o médico escolheu; nenhum dado de prontuário além disso; nome do paciente não é exibido.
- **Auditoria**: `saas_audit_log` (criação/cancelamento, com o médico como ator, só contagens) e `family_portal_audit_log` (aberturas, consentimento, negações; sem nome, conteúdo, token ou IP).
- Cancelamento pelo médico a qualquer momento; clínica suspensa bloqueia o acesso.
- Página pública estática isolada da SPA, com CSP restrita (`default-src 'none'`), `no-store`, `noindex`, sem `innerHTML`, sem armazenamento local, sem terceiros.
- Sem IA externa e sem envio de e-mail/WhatsApp.

## Arquivos
- `shared/family-portal.ts` — regras, filtro, modelos de orientação, mensagem-rascunho.
- `functions/api/public-family-portal.ts` (público, por token) e `functions/api/live/family-portal/index.ts` (médico: listar, criar, cancelar); `functions/api/family-portal/_shared.ts`.
- `db/migrations/0034_family_portal.sql` — **versionada, NÃO aplicada em produção**. Rollback no cabeçalho.
- `client/public/portal.html|js|css` e `_headers`; painel `FamilyPortalPanel` na ficha do paciente.
- Reaproveitado: criptografia clínica, blind index, membership/billing, `saas_audit_log`, padrão de convite do intake, `intake.html` (questionário).

## Testes
`npm run test:portal-familia` (unitário + estático + SQL real em SQLite), `npm run test:e2e:portal-familia` (Playwright, após `npm run build`).

## Limitações
- Os handlers de D1 não puderam rodar contra SQLite neste ambiente (o `better-sqlite3` nativo não compila aqui); por isso o SQL de consumo/auditoria é testado diretamente com SQLite do Python e os handlers por teste estático + tsc. Rodar o teste de integração em CI/staging antes de aplicar a migração.
- O link do questionário reutiliza o convite existente (o médico cola o token); não há geração automática conjunta.
- Lembretes são exibidos e exportáveis em `.ics`; não há push/e-mail/WhatsApp automáticos (exigiria decisão do médico e provedor).
- Os modelos de orientação são textos neutros (preparo, uso do portal, privacidade) e aguardam revisão do médico.
- Quem abre o link vê o conteúdo na tela; não há login individual da família (por desenho: link pessoal e temporário).
- Fora do escopo e **não alterado**: `client/src/features/super-neuropad/familyDelivery.ts` já existente gera para a família uma "leitura do jogo" com níveis (esperado/observar/alerta) e acertos por mundo — isso conflita com a regra do médico e precisa de decisão.
