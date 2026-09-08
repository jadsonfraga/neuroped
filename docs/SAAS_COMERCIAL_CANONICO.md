# NeuroPed SaaS — Arquitetura Comercial Canônica

**Estado:** implementação estrutural inicial  
**Data de referência:** 08/09/2026  
**Escopo:** produto B2B vendável derivado do NeuroPed, separado do prontuário clínico e do núcleo PANT.

## 1. Decisão arquitetônica

O produto comercial inicial não é "todo o NeuroPed".

A plataforma já possui autenticação, tenants, memberships, D1, billing, Clinical Core, PANT e fluxos clínicos. Isso não implica que todas essas capacidades estejam automaticamente licenciadas ao cliente externo.

A camada comercial introduz uma separação obrigatória:

```text
┌──────────────────────────────────────────────────────┐
│ Produto comercial / contrato de licença              │
│ commercial_offers + licenses + authorized users      │
│ + feature entitlements + usage/support ledger        │
└──────────────────────────┬───────────────────────────┘
                           │ autoriza somente
┌──────────────────────────▼───────────────────────────┐
│ Cinco materiais educativo-operacionais               │
│ 1. preparação da consulta                            │
│ 2. registro de mudanças                              │
│ 3. devolutiva escolar                                │
│ 4. plano aprovado em uma página                      │
│ 5. registro descritivo da rotina                     │
└──────────────────────────────────────────────────────┘

        NÃO FAZ PARTE DO SKU INICIAL
┌──────────────────────────────────────────────────────┐
│ prontuário / live_patients / Clinical Core           │
│ PANT / laudo final / assinatura médica               │
│ NeuroBoard / parecer assíncrono                      │
│ scoring psicométrico / escalas licenciadas           │
│ apoio à decisão / prescrição / diagnóstico            │
│ customização / white-label / redistribuição          │
└──────────────────────────────────────────────────────┘
```

## 2. Fonte de verdade

A ordem de autoridade do produto vendável é:

1. `shared/commercial.ts` — contrato de domínio versionado;
2. `db/migrations/0026_saas_commercial_catalog.sql` — representação persistente;
3. `functions/api/commercial/*` — enforcement server-side;
4. UI comercial — representação, nunca fonte de decisão;
5. provedor de pagamento — cobrança, nunca definição do que foi vendido.

`shared/billing.ts` continua válido como infraestrutura de billing do SaaS existente, mas **não é fonte canônica de SKU/preço/escopo do piloto institucional**. O histórico R$99/assento/mês não deve ser reutilizado automaticamente para o produto aqui definido.

## 3. SKUs canônicos

### 3.1 NeuroPed Institucional — Piloto 1.0

| Propriedade | Valor |
|---|---:|
| Código | `institutional-pilot-1-0` |
| Preço | R$ 1.490,00 |
| Vigência | 365 dias |
| Venda | somente por convite |
| Máximo global | 3 licenças |
| Unidades por licença | 1 |
| Usuários autorizados | até 10 |
| Onboarding incluído | 60 min |
| Suporte incluído | 120 min |

### 3.2 NeuroPed Institucional — Anual 1.0

| Propriedade | Valor |
|---|---:|
| Código | `institutional-annual-1-0` |
| Preço | R$ 2.490,00 |
| Vigência | 365 dias |
| Venda | `gated` |
| Unidades por licença | 1 |
| Usuários autorizados | até 10 |
| Onboarding incluído | 60 min |
| Suporte incluído | 120 min |

`gated` significa que o produto está definido, porém checkout público continua proibido até a decisão formal pós-piloto.

## 4. Fronteira clínica e regulatória

O SKU inicial é educativo-operacional. Sua arquitetura assume:

- nenhum dado identificável de paciente enviado ao produto comercial;
- nenhum ato médico incluído;
- nenhuma interpretação diagnóstica automatizada;
- nenhuma recomendação de tratamento;
- nenhuma prescrição;
- nenhuma pontuação psicométrica;
- nenhum PANT ou laudo final;
- nenhum NeuroBoard ou parecer de caso;
- nenhuma certificação da instituição.

Se qualquer requisito comercial futuro exigir remover uma dessas negativas, isso configura **mudança de classe de produto** e exige ADR/PR próprios, revisão jurídica/regulatória e nova avaliação LGPD antes de código de produção.

## 5. Multi-tenancy

Não foi criada uma segunda identidade de tenant.

Reutilizam-se:

- `clinics` como tenant institucional;
- `clinic_memberships` para vínculo do usuário ao tenant;
- `users` para identidade nominal;
- `saas_audit_log` para eventos administrativos auditáveis.

A camada comercial adiciona:

- `commercial_offers` — catálogo de produtos;
- `commercial_offer_features` — entitlements do SKU;
- `commercial_licenses` — contrato por unidade/tenant;
- `commercial_license_acceptances` — aceite das fronteiras de uso;
- `commercial_license_users` — usuários explicitamente autorizados;
- `commercial_usage_events` — telemetria comercial mínima e suporte.

Nunca usar `role=admin` global como bypass de tenant para liberar material comercial.

## 6. Privacy by architecture

A telemetria comercial é distinta de prontuário.

`commercial_usage_events.metadata_json` aceita apenas chaves de baixa cardinalidade definidas em código, atualmente:

- `materialId`;
- `deliveryChannel`;
- `clientVersion`;
- `sourceVersion`;
- `supportCategory`.

Chaves arbitrárias como nome, CPF, diagnóstico, prontuário ou texto clínico são rejeitadas pelo domínio. O banco ainda limita o payload a 2 KB.

Dados clínicos pertencem às estruturas clínicas existentes e não devem ser copiados para tabelas comerciais para facilitar métricas.

## 7. Enforcement de licença

Uma feature comercial só é utilizável quando todas as condições são verdadeiras:

1. existe licença para o tenant;
2. licença está `active`;
3. `activated_at <= now < expires_at`;
4. o offer code é conhecido pelo domínio;
5. a feature pertence ao offer persistido e ao contrato canônico;
6. o usuário pertence ao tenant;
7. para superfícies licenciadas, o usuário deve também constar entre os autorizados quando esse gate for acoplado à UI final.

`GET /api/commercial/me?clinicId=...` fornece o snapshot tenant-scoped para a UI. O frontend não deve reconstruir permissões a partir de preço, role ou query string.

## 8. Billing

O provedor de pagamento é adaptador, não domínio.

Fluxo alvo:

```text
convite comercial
  → aceite da proposta/termos
  → criação da commercial_license (pending)
  → cobrança
  → confirmação idempotente do PSP
  → activation gate
  → commercial_license = active
  → authorized users
  → uso dos cinco materiais
```

O checkout genérico existente por assento não deve ativar `commercial_license` sem uma ponte explícita entre `offerCode`, pagamento e aceite contratual.

Nenhuma informação de cartão deve ser armazenada no D1; somente referências opacas do PSP.

## 9. Suporte como COGS

Suporte faz parte do contrato e deve ser medido.

- onboarding: até 60 min;
- suporte incluído: até 120 min/ano;
- uso registrado como `commercial_usage_events.kind = 'support_minutes'`;
- expansão fica bloqueada se a operação demonstrar dependência de suporte não sustentável.

O ledger registra minutos, não conteúdo do atendimento de suporte.

## 10. Gate de expansão

O plano `institutional-annual-1-0` permanece `gated` até decisão formal.

Critério recomendado para abrir o gate, após a primeira coorte:

- pelo menos 2 de 3 instituições usando regularmente 3 ou mais dos 5 materiais;
- suporte <= 3 horas por instituição no período observado;
- zero incidente de segurança/uso clínico indevido;
- disposição de renovação >= R$ 2.250/ano;
- valor percebido independente de acesso pessoal ao médico;
- revisão jurídica, fiscal e de licença concluída.

A abertura do gate deve ocorrer por PR que altera `saleMode`, com teste de regressão correspondente. Não usar variável de frontend para burlar o gate.

## 11. Stop rules

Suspender licença/piloto imediatamente em caso de:

- incidente com dado pessoal decorrente da oferta comercial;
- uso do material como diagnóstico/prescrição;
- divulgação de "certificação NeuroPed" não autorizada;
- disputa relevante de propriedade intelectual;
- exigência regulatória incompatível com o SKU;
- erro material com potencial de risco clínico.

## 12. Evolução permitida

### Fase A — atual

Contrato + catálogo + licença + tenant + usuários + telemetria mínima.

### Fase B — após aceite da arquitetura

- backoffice para criar convites/licenças;
- tela institucional dos cinco materiais;
- bridge de checkout anual pelo PSP escolhido;
- PDF/termo contratual versionado;
- exportação de métricas agregadas do piloto.

### Fase C — somente após PMF

- self-service público do plano anual;
- multiunidade;
- planos adicionais;
- cobrança recorrente opcional;
- suporte estruturado e central de ajuda.

### Fora desta linhagem

PANT como serviço, NeuroBoard, clinical decision support e prontuário multi-instituição exigem produtos/ADRs próprios. Eles não entram por expansão silenciosa de entitlement.

## 13. Regras antirregressão

O workflow `saas-commercial-canonical.yml` deve falhar se:

- os cinco materiais deixarem de ser exatamente cinco sem revisão do teste;
- preço piloto divergir de R$ 1.490;
- preço anual divergir de R$ 2.490;
- piloto deixar de exigir convite;
- plano anual deixar de estar gated sem mudança explícita;
- qualquer guardrail clínico/LGPD do SKU inicial virar `true`;
- metadados comerciais aceitarem chaves arbitrárias;
- a migração divergir do domínio.

## 14. Não é liberação comercial automática

Merge desta arquitetura significa **produto tecnicamente estruturado**, não oferta pública automática.

Venda real ainda exige os gates de negócio já definidos: revisão final dos cinco materiais, licença/termos revisados, emissão fiscal, responsável por suporte/operação e seleção das instituições-piloto.
