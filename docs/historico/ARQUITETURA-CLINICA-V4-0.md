# Arquitetura Clínica V4.0 — NeuroPed EDJ

**Dr. Jadson Fraga Araújo Júnior · CRM-PE 25227 · RQE 17756**
**Versão:** 4.0.0 · **Data:** 03/06/2026 · **Tipo:** additive-first sobre V3.2

---

## O salto da V3.2 para a V4.0

V3.2 entregou a plataforma com **interfaces vazias** dos adapters futuros. V4.0 substitui essas interfaces por **implementações funcionais reais** dos quatro adapters críticos para uso institucional.

| Adapter | V3.2 (interface) | V4.0 (implementação) |
|---|---|---|
| DriveAdapter | `throw not_implemented` | 2 modos: **event** (MCP Drive) ou **REST** (Google Drive API v3 + OAuth2) |
| FHIRAdapter | `throw not_implemented` | R4 mínimo: Observation, Patient, Condition, Bundle + LOINC mapping + validate |
| LGPDConsentLayer | `throw not_implemented` | 5 escopos · modal UI · audit log · revoke · **purgePatientData** atravessa os 3 namespaces |
| AuthAdapter | `throw not_implemented` | 4 roles + PIN local (FNV-1a) + capability gates + UI de login + seed do Dr. |

A V3.2 continua intocada. V4.0 expõe `window.NeuroPedClinicalV4` com `driveAdapter`, `fhirAdapter`, `lgpd`, `auth`, `platform.health()`.

---

## 6 novos módulos

```
clinical-drive-adapter.js     DriveAdapter funcional (event + REST)
clinical-fhir-adapter.js      FHIR R4 (Observation/Patient/Condition/Bundle)
clinical-lgpd-consent.js      LGPD com 5 scopes + modal + purge
clinical-auth-adapter.js      4 roles + PIN local + capability gates
clinical-v4-integration.js    Orchestrator (event bus → adapters)
clinical-v4-tests.js          12 testes adicionados ao NeuroPedTests.runAll()
```

---

## DriveAdapter

### Modo "event" (default, plug-and-play)

Quando uma PDF é gerado, o adapter dispatcha `neuroped:upload-to-drive` com:

```js
{
  filename, mime, objectURL, size,
  parentId: "1I6hUmweVTo2TP_xsqUTKfcnhCCW8TzEY",   // CLAUDE.md
  folderName: "Laudos NeuroPed",
  patient, disableConversionToGoogleType: true,
  source: "NeuroPed Clinical Platform V4",
  doctor: "Dr. Jadson Fraga · CRM-PE 25227 · RQE 17756"
}
```

O MCP do Google Drive (já configurado nas Cowork Preferências do Dr.) escuta esse evento e faz o `create_file` na pasta "Laudos NeuroPed". Compliance total com a regra do CLAUDE.md sem precisar embedar OAuth no app.

### Modo "rest" (opcional, app sozinho)

Se o Dr. configurar OAuth2 Client ID no Google Cloud Console:

```js
NeuroPedClinicalV4.driveAdapter = new NeuroPedClinicalV4.DriveAdapter({
  mode: "rest",
  accessToken: "<bearer obtido via gapi.auth2>"
});
```

Faz multipart upload REST direto, com `keepRevisionForever=true` e `convertToGoogleAppFormat=false`. Audit local de todos os uploads em `neuro.drive.v4.audit` (últimos 500).

### Auto-wire

Escuta `neuroped:laudo-generated` (evento emitido por `clinical-pdf-auditable.js` V3.2) e dispara upload sem que o caller precise saber.

---

## FHIRAdapter

R4 mínimo viável (`fhirVersion = "4.0.1"`). Construtores:

```js
const f = NeuroPedClinicalV4.fhirAdapter;
f.toPatient(patient);                                  // → Patient resource
f.toObservation({ instrument, patient, result });      // → Observation final
f.toCondition({ hypothesis, patient, confidence });    // → Condition provisional
f.toBundle({ patient, observations, conditions });     // → Bundle collection
f.validate(resource);                                  // → {ok, errors}
f.pushBundle(bundle);                                  // download JSON
```

### LOINC mapping incluído

PHQ-A, GAD-7, M-CHAT-R/F, Vanderbilt, SDQ, C-SSRS já mapeados para códigos LOINC reconhecidos. Demais instrumentos usam `system: "https://neuroped.io/fhir/CodeSystem/instruments"` com o id interno.

### Componentes

Resultados com múltiplas métricas geram `component[]` automaticamente, um por métrica do registro.

---

## LGPDConsentLayer

### 5 escopos canônicos

1. **local_storage** (essencial) — armazenar registros localmente
2. **clinical_processing** (essencial) — processar com o motor clínico
3. **pdf_generation** (opcional) — gerar laudos PDF
4. **drive_sync** (opcional) — subir laudos ao Google Drive
5. **fhir_export** (opcional) — exportar bundles FHIR

### Modal automático

Dispara no primeiro carregamento se algum escopo essencial não foi concedido. Visual alinhado ao design dark editorial. Inclui aviso legal Lei 13.709/2018, opção "Negar opcionais" (mantém apenas essenciais), trilha de audit em `neuroped.lgpd.v4.audit`.

### purgePatientData

```js
NeuroPedClinicalV4.lgpd.purgePatientData("anon-001");
// → { ok: true, removed_total: 23, details: [{ns, key, removed}, ...] }
```

Limpa registros do paciente em todos os namespaces das engines (`neuro.direct`, `neuro.scale`, `neuro.diary`, `neuroped.diaries.v3`) atendendo direito à exclusão.

---

## AuthAdapter

### 4 roles com capabilities documentadas

| Role | Capabilities |
|---|---|
| **medico** | read_all · apply_test · fill_scale · log_diary · generate_pdf · drive_sync · fhir_export · admin_panel · purge_data |
| **secretaria** | read_pre_consultation · fill_scale · register_patient |
| **paciente** | self_assessment · log_own_diary |
| **familia** | parent_questionnaire · log_child_diary |

### PIN hash + capability gates

PIN salvo com FNV-1a dupla (não criptografia real; documentado em RISCOS-ESTRUTURAIS R6.x como gate operacional, não substituto de auth de servidor).

```js
const auth = NeuroPedClinicalV4.auth;
auth.registerUser({ id, role, name, pin });
auth.login({ id, pin });
auth.hasCapability("admin_panel");
auth.requireCapability("admin_panel"); // throw se faltar
auth.guardAllByDataAttr();             // esconde [data-np-cap="..."] sem capability
```

### Seed automático

Cria o perfil `dr.jadson` (role medico, PIN inicial `neuroped`) se ainda não existir. **Trocar PIN no primeiro uso.**

### UI

`auth.openLoginModal()` abre modal dark editorial com campo de usuário e PIN.

---

## Orchestrator

`clinical-v4-integration.js` faz duas wires automáticas:

1. `pdf:generated` → se `drive_sync` consentido, chama `driveAdapter.uploadPDF`
2. Mudança de sessão Auth → re-executa `guardAllByDataAttr()` para atualizar gates de UI

Também expõe `NeuroPedClinicalV4.platform.health()` que reporta o status de cada camada — útil para debug e dashboards admin.

---

## Suíte de testes estendida

`clinical-v4-tests.js` adiciona **12 testes** ao `NeuroPedTests.runAll()`. Após carregar V4.0, esperar **30/30 testes verdes** (18 da V3.2 + 12 da V4.0):

- Drive default adapter em event mode
- Drive uploadPDF event dispatcha CustomEvent
- FHIR Observation shape válido
- FHIR Bundle empacota Patient+Observation+Condition
- FHIR validate detecta status ausente
- LGPD hasConsent inicia false para opcional
- LGPD grant/revoke ciclo completo
- LGPD purgePatientData rejeita sem id
- Auth registerUser + login + currentUser
- Auth PIN errado reprovado
- Auth capability gate bloqueia ação não autorizada
- Auth seed Dr. Jadson existe e tem admin_panel

---

## Como conectar tudo num painel

```html
<head>
  <!-- V3.2 (já em produção) -->
  <script src="./clinical-event-bus.js" defer></script>
  <script src="./clinical-engines.js" defer></script>
  <script src="./clinical-governance.js" defer></script>
  <script src="./clinical-storage.js" defer></script>
  <script src="./clinical-recommendation-pipeline.js" defer></script>
  <script src="./clinical-pdf-auditable.js" defer></script>
  <script src="./clinical-integrity-tests.js" defer></script>

  <!-- V4.0 (additive) -->
  <script src="./clinical-lgpd-consent.js" defer></script>
  <script src="./clinical-auth-adapter.js" defer></script>
  <script src="./clinical-drive-adapter.js" defer></script>
  <script src="./clinical-fhir-adapter.js" defer></script>
  <script src="./clinical-v4-integration.js" defer></script>
  <script src="./clinical-v4-tests.js" defer></script>
</head>
```

No console:

```js
NeuroPedClinicalV4.platform.health();
// → { v3, v32_*, v4_drive, v4_fhir, v4_lgpd, v4_auth }

NeuroPedTests.runAll();
// → 30/30 passaram
```

---

## Restrições explícitas

- **Sem backend.** Auth e LGPD são camadas locais. Para uso institucional multi-usuário com SLA, V4.x prevê migrar para servidor real.
- **PIN hash não é crypto.** É gate operacional. Vide R6.x dos riscos.
- **REST mode do Drive precisa Client ID OAuth2.** Default é event mode (CLAUDE.md).
- **FHIR mínimo.** Não é certificação FHIR — atende interoperabilidade básica.

---

## Roadmap V4.x

| Versão | Foco |
|---|---|
| V4.1 | Criptografia AES-GCM da persistência via Web Crypto |
| V4.2 | SyncAdapter cloud bidirecional + OfflineAdapter com queue |
| V4.3 | SignatureAdapter ICP-BR + TelemedAdapter |
| V4.4 | Dashboard admin com platform.health() visual |
| V5.0 | Backend dedicado (PostgreSQL + autenticação real) |

---

**A V4.0 transforma o NeuroPed em uma plataforma clínica institucional. Os contratos de V3.2 estão honrados; as integrações reais começam aqui.**
