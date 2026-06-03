# Arquitetura Clínica V3.2 — NeuroPed EDJ

**Dr. Jadson Fraga Araújo Júnior · CRM-PE 25227 · RQE 17756**
**Versão:** 3.2.0 · **Data:** 03/06/2026 · **Tipo:** additive-first sobre V3.1

---

## Propósito da V3.2

A V3.1 entregou três engines isoladas com tipagem forte. A V3.2 transforma esse núcleo em uma **plataforma clínica auditável e extensível**, sem reescrever nada que já funciona. Toda nova capacidade é additive — pode ser desligada por simples remoção da tag `<script>` correspondente.

A V3.2 responde aos dez invariantes obrigatórios:

| # | Invariante | Onde é garantido |
|---|---|---|
| 1 | Zero regressão | nenhum arquivo V3.1 é alterado |
| 2 | APIs públicas preservadas | `NeuroPedClinical.*` mantém shape |
| 3 | Engines não cruzam storage | `VersionedStorageLayer` rejeita namespace fora de `neuro.{direct\|scale\|diary}` |
| 4 | Recomendação explicável | `RecommendationPipeline` retorna `reasons`, `contraindications`, `explainability` por instrumento |
| 5 | Plugin não registra schema inválido | `ClinicalGovernance.attach()` envolve `Registry.register()` |
| 6 | PDF rastreável | hash + QR + assinatura + UTC no rodapé legal obrigatório |
| 7 | Persistência versionada | `schema_version`, `engine_version`, `checksum`, `saved_at` em todo save |
| 8 | Lineage clínico | `clinical_hash`, `created_at`, `updated_at`, `source_plugin`, `governance_signature` injetados em cada instrumento admitido |
| 9 | Sem `if(tipo===…)` | Engines herdam de `BaseClinicalEngine`; cada uma só enxerga seu próprio `type` |
| 10 | Additive-first | 9 novos arquivos; V3.1 intocada |

---

## Arquivos novos (9)

```
clinical-governance.js                Camada de admissão (validação + hash + assinatura)
clinical-recommendation-pipeline.js   Pipeline multicritério com explainability
clinical-storage.js                   Persistência versionada + checksum + rollback
clinical-migrations.js                MigrationManager com BFS por grafo de versões
clinical-pdf-auditable.js             Bundle PDF auditável com QR e assinatura
clinical-event-bus.js                 Pub/sub clínico com 8 eventos canônicos
clinical-plugin-sdk.js                createClinicalPlugin + sandbox por capability
clinical-future-adapters.js           Interfaces vazias (Drive/FHIR/LGPD/Auth/Sync/etc.)
clinical-integrity-tests.js           18 testes auto-executáveis sem framework
```

---

## Camadas e responsabilidades

```
                              UI (3 painéis HTML)
                                     │
                            ┌────────┴────────┐
                            │ Event Bus (8 ev)│ ← desacopla tudo
                            └────────┬────────┘
                                     │
                       ┌─────────────┼─────────────┐
                       │             │             │
              DirectTestEngine  ScaleEngine  DiaryEngine
                       │             │             │
                       └─────────────┼─────────────┘
                                     │
                       ┌─────────────┼─────────────┐
                       │             │             │
             RecommendationPipeline  Registry   StorageLayer
                 (multi-strategy)   (governance)  (versioned)
                                     │
                              MigrationManager
                                     │
                       ┌─────────────┴─────────────┐
                       │                           │
                  Plugin SDK              Future Adapters (vazios)
              (sandboxed capabilities)    Drive / FHIR / LGPD / Auth / Sync / etc.
```

---

## Governança clínica

`ClinicalGovernance.attach(registry)` substitui o `register()` original por:

1. **validateSchema** — 11 campos obrigatórios + tipos + faixas de tempo realistas por type
2. **validateSemanticConflicts** — Jaccard >= 0.75 em nome OU mesmo `type/subtype/purpose/respondent`
3. **validateDuplicatePurpose** — alerta INFO se já há ≥2 instrumentos no mesmo `subtype/purpose`
4. **validateRecommendationIntegrity** — detecta heurística órfã
5. **generateClinicalHash** — FNV-1a duplo, 16 hex determinísticos, sem dependência de SubtleCrypto

Cada instrumento admitido recebe automaticamente:

```js
clinical_hash:        "a1b2c3d4e5f60718"
schema_version:       "3.1.0"
created_at:           "2026-06-03T12:00:00Z"
updated_at:           "2026-06-03T12:00:00Z"
source_plugin:        "core"  // ou nome do plugin que registrou
governance_signature: "f7e6d5c4b3a29180"
```

Erros bloqueiam; warnings passam (com log).

---

## Pipeline de recomendação explicável

Substitui scores mágicos por 8 strategies independentes, cada uma com `weight` e `evaluate(inst, query)`:

| Strategy | Weight | Sinal |
|---|---|---|
| AgeRange | 1.4 | janela etária centrada |
| ComplaintCluster | 1.5 | hits em `chief_complaints` |
| TimeBurden | 0.7 | minutos: ≤10 ótimo, >40 ruim |
| RemoteFeasibility | 0.6 | `application_mode === "remoto"` |
| TrainingRequirement | 0.8 | bloqueia em pré-consulta |
| PurposeMatch | 1.1 | `inst.purpose === query.intent` |
| ClinicalDomainSensitivity | 1.3 | tabela `tea/tdah/tod/dislexia/ansiedade/depressao` |
| ContextAlignment | 0.5 | `school/family/clinical` |

Cada resultado vem com `score (0-100 normalizado)`, `confidence (0-1)`, `reasons[]`, `contraindications[]`, `explainability{}` (flags TRUE/FALSE/NULL por strategy), e `explainability_prose` para PDF.

Strategies são plugáveis — qualquer plugin externo pode adicionar a sua via `plugin.defineRecommendationStrategy(strategy)`.

---

## Persistência versionada

Cada save é um envelope auditável:

```js
{
  schema_version: "3.2.0",
  engine_version: "3.1.0",
  saved_at: "2026-06-03T12:34:56.789Z",
  patient_context: { id_hash: "...", age_months: 96 },  // opcional
  payload: { ... },
  checksum: "a1b2c3d4e5f60718"  // FNV-1a duplo
}
```

`VersionedStorageLayer`:
- **Namespaces isolados:** `neuro.direct`, `neuro.scale`, `neuro.diary` (regex `^neuro\.(direct|scale|diary)$` no construtor)
- **Archive antes de overwrite:** mantém os 3 últimos snapshots de cada chave
- **Rollback:** restaura o archive mais recente
- **Audit trail:** últimos 500 atos em `__audit__`
- **Snapshot/Restore:** exporta o namespace inteiro com checksum

`MigrationManager` resolve migrações por **BFS no grafo de versões**. Plugins registram suas migrations e o manager encadeia transformações até o destino, sem migrations diretas hardcoded.

---

## PDF auditável

Cabeçalho institucional + **QRCode interno determinístico** gerado a partir do hash clínico (matriz 21×21 com finder patterns) + hash legível no canto + título + subtítulo.

Rodapé legal **obrigatório** em todas as páginas: *"Documento gerado automaticamente pelo NeuroPed Clinical Platform"* + `Schema · Engine · UTC · Assinatura · Página x de y`.

`exportClinicalBundlePDF()` consolida em um único PDF: capa identificadora → sumário → testes diretos → escalas → diários (com summary + trend) → recomendações com explainability completa. Paginação automática, cabeçalho repetido a cada nova página, quebra inteligente.

Dispatcha `neuroped:laudo-generated` para integração futura com MCP Drive (regra CLAUDE.md: subir cópia para "Laudos NeuroPed").

---

## Event Bus

8 eventos canônicos. Modo `strict` (default) recusa eventos fora do canon — protege contra typos.

Cada evento publicado carrega `{event, trace_id, ts, engine, payload}`. Audit trail dos últimos 2000 eventos disponível em `bus.audit()`.

Auto-wire na carga: `instrument:registered` é emitido sempre que `registry.register()` é chamado, sem que cada chamador precise emitir manualmente.

---

## Plugin SDK

Manifest validado (`name` 2-40 chars lowercase, `version` semver, `capabilities` em whitelist).

Capabilities disponíveis: `register_instrument`, `define_strategy`, `define_pdf`, `subscribe_events`, `read_storage`. Plugin sem a capability não consegue chamar o método correspondente (erro lançado).

Lifecycle: `onInit → install → onReady → ... → uninstall → onDestroy`.

Instrumentos registrados via plugin são automaticamente marcados com `source_plugin`. Auditoria identifica quem registrou cada item.

---

## Adapters futuros (interfaces vazias)

`DriveAdapter`, `FHIRAdapter`, `LGPDConsentLayer`, `AuthAdapter`, `SyncAdapter`, `OfflineAdapter`, `SignatureAdapter`, `TelemedAdapter` — 8 contratos abstratos. Métodos lançam `not_implemented`. Implementação em V4.x.

A presença das interfaces permite que o restante da plataforma já dependa do shape esperado — quando a implementação real chegar, a integração é plug-in.

---

## Suíte de integridade

`NeuroPedTests.runAll()` executa 18 testes cobrindo:

- Smoke (módulos globais presentes; 3 engines instanciadas)
- Governance (rejeita schema inválido; hash determinístico; duplicata semântica)
- Storage (roundtrip checksum; checksum_mismatch; rollback; namespace inválido)
- Migrations (3.0→3.2 sem perda; no_path quando ausente)
- Pipeline (explainability completa em cada resultado)
- Event Bus (subscribe + strict mode)
- Plugin SDK (manifest inválido reprovado; install dispara `plugin:loaded`)

Sem framework externo. Retorna `{total, passed, failed, pass_rate, results, timestamp, platform_version}`.

---

## Como ligar tudo em um painel

```html
<head>
  <!-- V3.1 (já em produção) -->
  <script src="./clinical-engines.js" defer></script>
  <script src="./clinical-pdf-export.js" defer></script>
  <script src="./clinical-router.js" defer></script>

  <!-- V3.2 (additive) -->
  <script src="./clinical-event-bus.js" defer></script>
  <script src="./clinical-governance.js" defer></script>
  <script src="./clinical-migrations.js" defer></script>
  <script src="./clinical-storage.js" defer></script>
  <script src="./clinical-recommendation-pipeline.js" defer></script>
  <script src="./clinical-pdf-auditable.js" defer></script>
  <script src="./clinical-plugin-sdk.js" defer></script>
  <script src="./clinical-future-adapters.js" defer></script>
  <script src="./clinical-integrity-tests.js" defer></script>
</head>
```

Ordem importa apenas porque governance auto-attach em `DOMContentLoaded` espera o registry já existente. Tudo o mais é independente.

Após carregar, no console:

```js
NeuroPedTests.runAll();              // executa 18 testes
NeuroPedClinical.registry.governance; // governance ativa
NeuroPedClinicalEventBus.bus.audit(); // trilha de eventos
```

---

## O que NÃO está nesta versão (preservando escopo)

- Drive MCP funcional (apenas evento `neuroped:laudo-generated`)
- FHIR Observation real (interface vazia)
- Auth de médico/secretária (interface vazia)
- Criptografia AES da persistência (R2.1 dos riscos — fica para V4.0)
- Calendário-heatmap em diários (sparkline atual atende — V3.3)
- Chart.js nas tendências (V3.3)

---

## Roadmap V3.3 → V4.0

| Versão | Foco |
|---|---|
| V3.3 | Calendário-heatmap + Chart.js em trends + QR real (lib qrcode-generator) |
| V3.4 | Short-link com QR para pais preencherem escala remotamente |
| V4.0 | Implementação real de DriveAdapter (MCP) + FHIRAdapter (R4) + LGPDConsentLayer + AuthAdapter |
| V4.1 | Criptografia AES-GCM da persistência (Web Crypto) |
| V4.2 | SyncAdapter cloud bidirecional + OfflineAdapter com queue |
| V4.3 | SignatureAdapter ICP-BR + TelemedAdapter |

---

**A V3.2 entrega a plataforma. As implementações reais dos adapters virão sobre uma base já preparada.**
