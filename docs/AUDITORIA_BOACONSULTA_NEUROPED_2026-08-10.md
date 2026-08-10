# Auditoria BoaConsulta × NeuroPed — Bridge de prontuários

Data: 10 de agosto de 2026

## Resumo executivo

A integração não deve copiar prontuários diretamente para `patients_demo`, `consultations_demo` ou `clinical_events_demo`. O backend canônico publicado do NeuroPed ainda usa estruturas `*_demo` com campos clínicos em texto claro, enquanto o backend Express/local já possui criptografia de campos e um Clinical Core append-only com proveniência.

A solução implementada nesta branch cria uma fronteira de interoperabilidade independente: **BoaConsulta Bridge**.

Fluxo:

1. profissional autenticado seleciona uma exportação do BoaConsulta;
2. o NeuroPed calcula SHA-256 do arquivo e gera prévia sem persistir conteúdo clínico;
3. ao confirmar, o arquivo original é dividido em chunks de 64 KiB, cada chunk é cifrado com AES-256-GCM e persistido no D1;
4. CSV/JSON/TXT são normalizados por um adaptador versionado e cada registro fica cifrado individualmente;
5. o mesmo arquivo não é importado duas vezes para o mesmo proprietário;
6. identificadores de reconciliação e hashes de registros usam HMAC-SHA-256 com subchave dedicada derivada por HKDF;
7. registros com identidade insuficiente entram em `needs_review`;
8. nenhuma promoção para prontuário ativo ocorre enquanto o formato real de exportação não tiver sido validado e o caminho canônico de dados reais não estiver protegido em repouso.

O objetivo desta separação é permitir que **todo o conteúdo exportado seja preservado automaticamente**, sem converter uma incerteza de mapeamento em dado clínico incorreto.

## O que foi possível confirmar publicamente sobre o BoaConsulta

Fontes públicas oficiais consultadas em 10/08/2026:

- https://profissionais.boaconsulta.com/prontuario-eletronico/
- https://profissionais.boaconsulta.com/
- https://profissionais.boaconsulta.com/prontuario-eletronico-saude/

O produto descreve:

- prontuário eletrônico customizável por especialidade;
- histórico clínico/evoluções;
- anexos, exames, imagens e vídeos;
- prescrições, cartas, atestados e pedidos de exame;
- integração com agenda, teleconsulta, financeiro e Guias TISS;
- conexão com ferramentas externas conforme o plano contratado;
- proteção de dados e backups descritos comercialmente.

### Limite da pesquisa pública

Não foi localizada, nas páginas públicas oficiais consultadas, documentação de uma API clínica pública nem um contrato público de exportação de prontuários com schema estável (CSV/JSON/FHIR etc.). Portanto esta implementação **não usa endpoint interno, scraping de sessão, automação de navegador ou engenharia reversa de API privada**.

Se a conta contratada disponibilizar uma API/exportação oficial estruturada, ela pode ser adicionada como novo adaptador sobre a mesma camada de staging, sem alterar o modelo de segurança.

## Auditoria do NeuroPed

### Pontos fortes existentes

- autenticação nominal no backend Cloudflare;
- ownership de pacientes;
- auditoria de ações;
- Clinical Core com eventos append-only e proveniência obrigatória;
- backend Express/local com criptografia AES-256-GCM para campos sensíveis;
- separação entre evento, problema, medicação, observação, plano, desfecho e segurança.

### Gap crítico encontrado

O deploy oficial descrito em `docs/DEPLOY_OFICIAL.md` usa Cloudflare Pages Functions + D1 como backend canônico. Esse caminho ainda usa tabelas `*_demo` (`patients_demo`, `consultations_demo`, `clinical_events_demo` etc.) e campos de texto clínico sem criptografia de aplicação.

Por isso, importar um acervo real do BoaConsulta diretamente para essas tabelas seria uma regressão de segurança.

### Outro gap relevante

A interface do NeuroPed está configurada com `OPEN_ACCESS = true` para navegação da UI. A proteção real permanece na API. O Bridge, portanto, não confia na visibilidade da página: `GET` e `POST` exigem sessão e papel `admin` ou `professional` no servidor.

## Arquitetura implementada

### 1. Cofre e staging D1

Migração: `db/migrations/0008_boaconsulta_import_bridge.sql`

Tabelas:

- `external_import_batches`
- `external_import_file_chunks`
- `external_import_records`

Características:

- ownership obrigatório;
- fingerprint SHA-256 do arquivo completo;
- unicidade por `(owner, source_system, source_sha256)`;
- nome original do arquivo cifrado;
- arquivo original integral preservado em chunks AES-GCM;
- conteúdo bruto e normalizado de registros cifrado individualmente;
- fingerprint de paciente em HMAC não reversível;
- estados `staged`, `needs_review`, `ready`, `imported`, `failed`;
- referência futura para paciente/eventos alvo sem criar vínculo prematuro.

A escolha por D1 elimina uma permissão R2 que o token Cloudflare atual do repositório não possui. A primeira tentativa de bootstrap detectou esse limite antes do merge, e a arquitetura foi simplificada para usar apenas a infraestrutura que o NeuroPed já controla. Nenhum prontuário real foi envolvido nessa tentativa.

### 2. Criptografia e separação de chaves

Secret Cloudflare: `NEUROPED_IMPORT_ENCRYPTION_KEY`

- segredo aleatório de 32 bytes;
- HKDF-SHA-256 para derivar subchaves independentes;
- subchave AES-256-GCM para conteúdo;
- subchave HMAC-SHA-256 para fingerprints de paciente e de registros;
- IV aleatório de 12 bytes por payload/chunk AES-GCM;
- não reutiliza JWT;
- workflow cria o segredo apenas se ele ainda não existir e nunca registra o valor em log;
- reexecuções preservam a mesma chave para não tornar acervo antigo ilegível.

### 3. Parser adaptativo

Arquivo: `shared/boaconsulta-import.ts`

Versão: `boaconsulta-generic-v1`

Suporta:

- CSV com `;`, `,` ou tab;
- CSV com campos entre aspas;
- normalização de MIME no console para CSV rotulado pelo sistema operacional como arquivo de Excel;
- JSON como array ou envelopes comuns (`data`, `records`, `pacientes`, `prontuarios`, `atendimentos`, `items`);
- TXT como conteúdo preservado sem vínculo automático;
- datas brasileiras `dd/mm/aaaa` e ISO sem converter formato de data estrangeiro/ambíguo;
- aliases comuns para nome, nascimento, CPF, responsável, telefone, CID, data, evolução, profissional e identificador externo.

### 4. PDF

PDF é aceito para arquivamento criptografado do original.

**Não há OCR nem extração heurística de prontuário PDF nesta versão.** Transformar PDF em registro clínico sem validar o template real seria inseguro. Um adaptador de PDF deve ser criado somente após inspecionar uma exportação BoaConsulta deidentificada.

### 5. Console de uso

URL estática no mesmo origin:

`/integracoes/boaconsulta/`

A página:

- usa a sessão clínica do NeuroPed;
- faz prévia;
- mostra número de registros e alertas;
- mascara CPF na prévia;
- não persiste o conteúdo no navegador;
- armazena no cofre somente após confirmação;
- lista apenas metadados não clínicos de lotes anteriores.

## Deduplicação

### Arquivo

SHA-256 do arquivo completo. Se o mesmo arquivo já existir para o mesmo proprietário, a API retorna o lote existente e não grava cópia.

### Linha/registros

Cada registro estruturado recebe HMAC-SHA-256 do JSON bruto com subchave dedicada. Linhas idênticas repetidas no mesmo arquivo são ignoradas e contabilizadas sem deixar um hash clínico vulnerável a correlação offline simples.

### Paciente

O staging cria uma chave de reconciliação a partir de:

1. CPF, quando existente;
2. nome normalizado;
3. data de nascimento.

A chave é convertida em HMAC-SHA-256 antes de persistir. **Nome sozinho nunca autoriza vínculo automático.**

## Comparação funcional

| Domínio | BoaConsulta público | NeuroPed antes | Bridge implementado |
|---|---|---|---|
| Prontuário longitudinal | Sim | Parcial/Clinical Core | Preserva export + prepara reconciliação |
| Evolução clínica | Sim | Sim | Detecta como `encounter` quando estruturado |
| Anexos | Sim | Infra local existente | Export original integral em chunks cifrados |
| Prescrição/documentos | Sim | Sim | Preserva no arquivo; mapeamento específico depende do export real |
| Agenda/teleconsulta | Sim | Módulos próprios | Fora do escopo desta importação |
| Deduplicação de importação | Não documentada publicamente | Ausente para fonte externa | SHA-256 de arquivo + HMAC de registro |
| Proveniência da fonte | Origem implícita | Clinical Core suporta | `source_system=boaconsulta` + mapping version |
| Auditoria | Produto descreve segurança | `audit_logs` existente | preview/store/duplicate auditados sem PHI nos detalhes |
| Criptografia de staging | Não é possível auditar implementação interna | Gap no D1 demo | AES-256-GCM antes de persistir arquivo/registros |
| API pública clínica | Não localizada | API própria | Bridge por exportação, sem scraping |

## O que deliberadamente ainda não foi automatizado

### Promoção para paciente/prontuário ativo

Não foi implementada nesta primeira camada por dois motivos objetivos:

1. o schema exato do export BoaConsulta não foi disponibilizado publicamente nem fornecido como amostra;
2. o caminho Cloudflare de pacientes/Clinical Core ainda usa estruturas demo/plaintext.

A promoção automática deve ser liberada somente após:

- migrar o catálogo clínico canônico para armazenamento protegido em repouso;
- validar uma exportação real deidentificada do BoaConsulta;
- definir regras determinísticas de match (CPF; nome + nascimento; conflito);
- testar medicamentos, CID, evoluções, anexos, datas, autoria e documentos;
- rodar importação sentinela com registros fictícios e comparação campo a campo.

Até lá, **o acervo já pode ser armazenado com integridade no NeuroPed**, mas não é transformado silenciosamente em dado clínico canônico.

## Critérios de aceite da próxima etapa

Uma exportação de exemplo deidentificada deve permitir responder, campo a campo:

- formato(s) entregues pelo BoaConsulta;
- encoding e delimitador;
- estrutura de paciente;
- identificador estável do paciente;
- identificador do atendimento;
- timezone/data/hora;
- separação entre anamnese, exame, hipótese, plano e evolução;
- CID;
- medicamentos/prescrições;
- anexos e nomes de documentos;
- autoria profissional;
- retificações/edições históricas.

Quando esses itens estiverem validados, cria-se um mapper `boaconsulta-<formato>-v2` e o estágio pode promover eventos para o Clinical Core mantendo referência reversível ao lote e ao identificador de origem.

## Validação automatizada

PR gate dedicado:

- parser/contrato de reconciliação;
- type-check das Pages Functions e código compartilhado;
- build do console;
- presença do console no artefato;
- bootstrap idempotente das três tabelas D1 e da chave dedicada.

Release gate em `main`:

- auditoria de dependências;
- `npm run verify`;
- migração D1 idempotente;
- criação não destrutiva da chave dedicada se ausente;
- build e redeploy do Cloudflare Pages;
- verificação do console publicado.

## Arquivos da implementação

- `db/migrations/0008_boaconsulta_import_bridge.sql`
- `shared/boaconsulta-import.ts`
- `functions/api/integrations/boaconsulta/_crypto.ts`
- `functions/api/integrations/boaconsulta/import.ts`
- `client/public/integracoes/boaconsulta/index.html`
- `tests/unit/boaconsulta-import-contract.test.ts`
- `.github/workflows/boaconsulta-import-pr.yml`
- `.github/workflows/boaconsulta-import-release.yml`
- `wrangler.toml`

## Princípio de segurança

**Importar não significa diagnosticar, corrigir ou reinterpretar.** O Bridge preserva origem, integridade e incerteza. Dados externos só se tornam parte do prontuário canônico quando a correspondência puder ser demonstrada, auditada e revertida por supersessão/proveniência.
