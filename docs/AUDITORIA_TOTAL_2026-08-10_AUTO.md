# Auditoria automática de pontas soltas — NeuroPed

Scanner estático. Achados são candidatos para revisão e não equivalem automaticamente a bug.

## Inventário

- Arquivos de código analisados: **630**
- Rotas React literais: **141**
- Imports lazy de páginas: **139**
- Endpoints/handlers Cloudflare em `functions/api`: **37**

## Marcadores de implementação incompleta

Total: **564**

- `client/src/index.css:281` — `Personalidade acolhedora em TODO o app sem tocar componente por`
- `client/src/index.css:282` — `componente: todo botão responde ao toque com um "squish" elástico e todo`
- `client/src/index.css:282` — `componente: todo botão responde ao toque com um "squish" elástico e todo`
- `client/src/index.css:782` — `[contenteditable][data-placeholder]:empty::before { content: attr(data-placeholder); color: hsl(var(--muted-foreground)); pointer-events: none; }`
- `client/src/index.css:782` — `[contenteditable][data-placeholder]:empty::before { content: attr(data-placeholder); color: hsl(var(--muted-foreground)); pointer-events: none; }`
- `client/src/lib/persistentSecureStorage.ts:9` — `// texto puro no localStorage. Como todo storage browser-side, não protege contra`
- `client/src/lib/scaleResponseReport.ts:27` — `* Todo rótulo Likert real do catálogo usa travessão ("0 — Ausente...",`
- `client/src/lib/icpSign.ts:32` — `const SIGNATURE_PLACEHOLDER_LENGTHS = [131072, 262144];`
- `client/src/lib/icpSign.ts:128` — `if (/not enough space|placeholder|signature/i.test(msg)) {`
- `client/src/lib/icpSign.ts:186` — `{ pdflibAddPlaceholder },`
- `client/src/lib/icpSign.ts:191` — `import("@signpdf/placeholder-pdf-lib"),`
- `client/src/lib/icpSign.ts:198` — `pdflibAddPlaceholder({`
- `client/src/lib/icpSign.ts:209` — `const withPlaceholder = Buffer.from(await doc.save({ useObjectStreams: false }));`
- `client/src/lib/icpSign.ts:211` — `const signed = await new SignPdf().sign(withPlaceholder, signer);`
- `client/src/lib/icpSign.ts:230` — `for (const signatureLength of SIGNATURE_PLACEHOLDER_LENGTHS) {`
- `client/src/components/PrivateGate.tsx:255` — `placeholder="PIN de acesso"`
- `client/src/components/PrivateGate.tsx:256` — `className="w-full rounded-xl border px-4 py-3 text-center text-lg tracking-widest text-white placeholder:text-white/30 outline-none transition-all"`
- `client/src/components/WhatsAppShare.tsx:134` — `placeholder="(85) 98765-4321 ou 5585987654321"`
- `client/src/components/CommandPalette.tsx:126` — `placeholder="Buscar escalas, páginas, pacientes…"`
- `client/src/components/GenericScale.tsx:35` — `* Item de escala. Pode ser uma string simples (compatível com todo o acervo`
- `client/src/components/GenericScale.tsx:56` — `placeholder?: string;`
- `client/src/components/GenericScale.tsx:83` — `export function itemPlaceholder(item: ScaleItem): string | undefined {`
- `client/src/components/GenericScale.tsx:86` — `: item.placeholder;`
- `client/src/components/GenericScale.tsx:169` — `placeholder: itemPlaceholder(item),`
- `client/src/components/GenericScale.tsx:169` — `placeholder: itemPlaceholder(item),`
- `client/src/components/GenericScale.tsx:846` — `placeholder={`
- `client/src/components/GenericScale.tsx:847` — `itemPlaceholder(item) ??`
- `client/src/components/AssinaturaIcpPanel.tsx:156` — `senha passava no axe só porque o placeholder serve de nome fraco; o de`
- `client/src/components/AssinaturaIcpPanel.tsx:182` — `placeholder="••••••••"`
- `client/src/components/DiarioClinico.tsx:30` — `placeholder?: string;`
- `client/src/components/DiarioClinico.tsx:307` — `placeholder={f.placeholder}`
- `client/src/components/DiarioClinico.tsx:307` — `placeholder={f.placeholder}`
- `client/src/components/DiarioClinico.tsx:315` — `placeholder={f.placeholder}`
- `client/src/components/DiarioClinico.tsx:315` — `placeholder={f.placeholder}`
- `client/src/components/SaveToPatient.tsx:198` — `placeholder={`
- `client/src/components/SaveToPatient.tsx:222` — `placeholder="Nome do paciente"`
- `client/src/data/interactiveScalesDrive2026.ts:99` — `{ text: "G — Impacto funcional negativo · A família precisa estudar diariamente com esforço excessivo para compensar.", emoji: "⚠️", example: "Ex.: a família passa horas todo dia compensando.", options: [{ label: "Não oc`
- `client/src/data/interactiveScalesDrive2026.ts:241` — `{ text: "Adesão e Rotina de Uso · O paciente toma o medicamento nos horários corretos todos os dias", emoji: "⏰", example: "Ex.: toma o remédio na hora certa todo dia.", options: [{ label: "Discordo Totalmente", value: 1`
- `client/src/data/interactiveScaleItemsJ26Bloco4.ts:271` — `{ text: "Seguir rotina escolar com apoio mínimo", emoji: "🏫", example: "Ex.: Segue as atividades da escola sem precisar de ajuda o tempo todo." },`
- `client/src/data/interactiveScaleItemsJ26Bloco4.ts:543` — `{ text: "Interrupções frequentes da aula por parte da criança", emoji: "🙋", example: "Ex.: Fala fora de hora e interrompe a professora o tempo todo." },`
- `client/src/data/interactiveScaleItemsJ26Bloco4.ts:1023` — `{ minPct: 0, classification: "Sem uso funcional - intervir", color: "red", description: "CAA não implementada ou não funcional. Avaliação e plano urgentes." },`
- `client/src/data/interactiveScaleItemsJ26Bloco4.ts:1357` — `{ text: "Sente que a criança consome todos os seus recursos", emoji: "🕳️", example: "Ex.: Sente que todo o tempo, dinheiro e energia vão para o cuidado." },`
- `client/src/data/escalasAutorais.ts:494` — `description: "Checa como a criança com TDAH responde a recompensas, punições, consequências imediatas vs. futuras. 18 itens. Ajuda a família e professores a ajustar estratégias motivacionais sem precisar de punição o tem`
- `client/src/data/escalasAutorais.ts:868` — `description: "A criança que vive preocupada que vai ficar doente, que qualquer dor de cabeça é tumor, que busca reasseguramento o tempo todo. 14 itens de ansiedade de saúde adaptados pra criança nordestina.",`
- `client/src/data/escalasAutorais.ts:920` — `description: "Versão autoaplicável pra adolescente que se preocupa demais, não consegue relaxar, fica tenso o tempo todo. 16 itens do GAD adaptado ao jeito de falar do nordestino jovem. Aplica sozinho em 5 minutinhos.",`
- `client/src/data/escalasAutorais.ts:1067` — `description: "Depressão na criança aparece muito no corpo — dor de cabeça frequente, cansaço todo dia, dor de barriga, não quer comer. 14 itens de sintomas somáticos depressivos. Muito subestimado no Nordeste.",`
- `client/src/data/escalasAutorais.ts:1080` — `description: "No adolescente, depressão aparece como raiva — briga com todo mundo, é grossa, se isola. 16 itens que rastreiam depressão adolescente apresentada principalmente como irritabilidade e não como tristeza.",`
- `client/src/data/pantExamples.ts:84` — `69: "Coordena o corpo todo conforme a idade (correr, pular, subir).",`
- `client/src/data/pantExamples.ts:87` — `72: "Anda e corre com padrão típico (sem ficar na ponta do pé o tempo todo, sem muito desequilíbrio).",`
- `client/src/data/pantExamples.ts:98` — `81: "Em geral fica calma e estável, sem oscilações muito intensas o tempo todo.",`
- `client/src/data/interactiveScaleItemsIpnTdahFeAnamnesis.ts:11` — `"placeholder": "Registre início, frequência, ambientes, gatilhos, prejuízo, fatores protetores e fontes disponíveis...",`
- `client/src/data/interactiveScaleItemsIpnTdahFeAnamnesis.ts:18` — `"placeholder": "Registre início, frequência, ambientes, gatilhos, prejuízo, fatores protetores e fontes disponíveis...",`
- `client/src/data/interactiveScaleItemsIpnTdahFeAnamnesis.ts:25` — `"placeholder": "Registre início, frequência, ambientes, gatilhos, prejuízo, fatores protetores e fontes disponíveis...",`
- `client/src/data/interactiveScaleItemsIpnTdahFeAnamnesis.ts:32` — `"placeholder": "Registre início, frequência, ambientes, gatilhos, prejuízo, fatores protetores e fontes disponíveis...",`
- `client/src/data/interactiveScaleItemsIpnTdahFeAnamnesis.ts:39` — `"placeholder": "Registre início, frequência, ambientes, gatilhos, prejuízo, fatores protetores e fontes disponíveis...",`
- `client/src/data/interactiveScaleItemsIpnTdahFeAnamnesis.ts:46` — `"placeholder": "Registre início, frequência, ambientes, gatilhos, prejuízo, fatores protetores e fontes disponíveis...",`
- `client/src/data/interactiveScaleItemsIpnTdahFeAnamnesis.ts:53` — `"placeholder": "Registre início, frequência, ambientes, gatilhos, prejuízo, fatores protetores e fontes disponíveis...",`
- `client/src/data/interactiveScaleItemsIpnTdahFeAnamnesis.ts:60` — `"placeholder": "Registre início, frequência, ambientes, gatilhos, prejuízo, fatores protetores e fontes disponíveis...",`
- `client/src/data/interactiveScaleItemsIpnTdahFeAnamnesis.ts:67` — `"placeholder": "Registre início, frequência, ambientes, gatilhos, prejuízo, fatores protetores e fontes disponíveis...",`
- `client/src/data/interactiveScaleItemsIpnTdahFeAnamnesis.ts:74` — `"placeholder": "Registre início, frequência, ambientes, gatilhos, prejuízo, fatores protetores e fontes disponíveis...",`
- `client/src/data/interactiveScaleItemsIpnTdahFeAnamnesis.ts:81` — `"placeholder": "Registre início, frequência, ambientes, gatilhos, prejuízo, fatores protetores e fontes disponíveis...",`
- `client/src/data/interactiveScaleItemsIpnTdahFeAnamnesis.ts:88` — `"placeholder": "Registre início, frequência, ambientes, gatilhos, prejuízo, fatores protetores e fontes disponíveis...",`
- `client/src/data/interactiveScaleItemsIpnTdahFeAnamnesis.ts:95` — `"placeholder": "Registre início, frequência, ambientes, gatilhos, prejuízo, fatores protetores e fontes disponíveis...",`
- `client/src/data/interactiveScaleItemsIpnTdahFeAnamnesis.ts:102` — `"placeholder": "Registre início, frequência, ambientes, gatilhos, prejuízo, fatores protetores e fontes disponíveis...",`
- `client/src/data/interactiveScaleItemsIpnTdahFeAnamnesis.ts:109` — `"placeholder": "Registre início, frequência, ambientes, gatilhos, prejuízo, fatores protetores e fontes disponíveis...",`
- `client/src/data/interactiveScaleItemsIpnTdahFeAnamnesis.ts:116` — `"placeholder": "Registre início, frequência, ambientes, gatilhos, prejuízo, fatores protetores e fontes disponíveis...",`
- `client/src/data/interactiveScaleItemsIpnTdahFeAnamnesis.ts:123` — `"placeholder": "Registre início, frequência, ambientes, gatilhos, prejuízo, fatores protetores e fontes disponíveis...",`
- `client/src/data/interactiveScaleItemsIpnTdahFeAnamnesis.ts:130` — `"placeholder": "Registre início, frequência, ambientes, gatilhos, prejuízo, fatores protetores e fontes disponíveis...",`
- `client/src/data/psychiatryGuide.ts:70` — `diagnosis: "Avaliação fonoaudiológica + avaliação clínica. Marcos: balbucio aos 6m, primeiras palavras aos 12m, frases de 2 palavras aos 24m. Audiometria obrigatória em todo atraso de linguagem.",`
- `client/src/data/psychiatryGuide.ts:73` — `clinicalPearls: "• Rastrear perda auditiva em todo atraso de linguagem\n• Ausência de comunicação não verbal (apontar, contato visual) sugere TEA\n• Ausência de palavras aos 16 meses OU frases de 2 palavras aos 24 meses:`
- `client/src/data/interactiveScaleItemsIpnTdahFeSynthesis.ts:11` — `"placeholder": "Registre dados objetivos, exemplos, decisão provisória e próximos passos...",`
- `client/src/data/interactiveScaleItemsIpnTdahFeSynthesis.ts:18` — `"placeholder": "Registre dados objetivos, exemplos, decisão provisória e próximos passos...",`
- `client/src/data/interactiveScaleItemsIpnTdahFeSynthesis.ts:25` — `"placeholder": "Registre dados objetivos, exemplos, decisão provisória e próximos passos...",`
- `client/src/data/interactiveScaleItemsIpnTdahFeSynthesis.ts:32` — `"placeholder": "Registre dados objetivos, exemplos, decisão provisória e próximos passos...",`
- `client/src/data/interactiveScaleItemsIpnTdahFeSynthesis.ts:39` — `"placeholder": "Registre dados objetivos, exemplos, decisão provisória e próximos passos...",`
- `client/src/data/interactiveScaleItemsIpnTdahFeSynthesis.ts:46` — `"placeholder": "Registre dados objetivos, exemplos, decisão provisória e próximos passos...",`
- `client/src/data/interactiveScaleItemsIpnTdahFeSynthesis.ts:53` — `"placeholder": "Registre dados objetivos, exemplos, decisão provisória e próximos passos...",`
- `client/src/data/interactiveScaleItemsIpnTdahFeSynthesis.ts:60` — `"placeholder": "Registre dados objetivos, exemplos, decisão provisória e próximos passos...",`
- `client/src/data/interactiveScaleItemsIpnTdahFeSynthesis.ts:67` — `"placeholder": "Registre dados objetivos, exemplos, decisão provisória e próximos passos...",`
- `client/src/data/interactiveScaleItemsIpnTdahFeSynthesis.ts:74` — `"placeholder": "Registre dados objetivos, exemplos, decisão provisória e próximos passos...",`
- … +484 achados não exibidos.

## Referências a mock/demo/fixture/simulação

Total: **102**

- `client/src/types/scaleClassification.ts:56` — `requer_explicacao: boolean; // Needs instruction/demo?`
- `client/src/data/interactiveScaleItemsIpnTeaClinicalPart3.ts:19` — `{"text": "Reconhece risco e busca ajuda em cenário simulado ou narrado.", "example": "Não provocar situação real de risco."},`
- `client/src/pages/agenda.tsx:128` — `<p className="text-sm text-muted-foreground">Nenhum dado foi simulado. Verifique autenticação e banco persistente.</p>`
- `client/src/pages/conecta.tsx:75` — `type BackendMode = "remote" | "local" | "demo-db" | "unavailable";`
- `client/src/pages/conecta.tsx:229` — `setBackendMode(data?.mode === "demo-db" ? "demo-db" : "remote");`
- `client/src/pages/conecta.tsx:229` — `setBackendMode(data?.mode === "demo-db" ? "demo-db" : "remote");`
- `client/src/pages/conecta.tsx:321` — `setBackendMode(created.storageMode === "demo-db" ? "demo-db" : "remote");`
- `client/src/pages/conecta.tsx:321` — `setBackendMode(created.storageMode === "demo-db" ? "demo-db" : "remote");`
- `client/src/pages/conecta.tsx:338` — `setStorageError("Não foi possível salvar o registro. Nada foi simulado ou considerado salvo.");`
- `client/src/pages/conecta.tsx:363` — `backendMode === "demo-db"`
- `client/src/pages/conecta.tsx:379` — `<Badge variant={backendMode === "demo-db" ? "destructive" : "outline"}>{modeLabel}</Badge>`
- `client/src/pages/bloco3-showcase.tsx:2` — `* BLOCO 3 SHOWCASE — Clinical Features Demo`
- `client/src/pages/bloco3-showcase.tsx:5` — `* This page is a development/demo page to showcase BLOCO 3 features:`
- `client/src/pages/portal-familia.tsx:229` — `? "Demonstração com dados fictícios: use demo-001."`
- `client/src/pages/portal-familia.tsx:235` — `placeholder={accessMode === "local" ? "ID fictício (ex.: demo-001)" : "ID interno do paciente"}`
- `client/src/components/clinical/PatientCockpit.tsx:379` — `return <p className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">Clinical Core indisponível neste ambiente; nenhum dado clínico foi simulado.</p>;`
- `functions/api/results.ts:174` — `mode: "demo",`
- `functions/api/results.ts:175` — `note: "Banco não configurado — registro simulado.",`
- `functions/api/_middleware.ts:290` — `// Auth (login/refresh/logout) é backend real, não escrita clínica demo — sempre`
- `functions/api/_middleware.ts:296` — `error: "API demo em modo somente leitura. Escritas clinicas exigem backend autenticado oficial.",`
- `functions/api/audit-log.ts:36` — `{ id: "log-001", action: "auth.login.success", resource: "auth", resource_id: null, user_id: "demo-user", ip: "127.0.0.1", details: null, created_at: new Date("2025-05-08T09:00:00").toISOString() },`
- `functions/api/audit-log.ts:37` — `{ id: "log-002", action: "patients.list", resource: "patients", resource_id: null, user_id: "demo-user", ip: "127.0.0.1", details: null, created_at: new Date("2025-05-08T09:01:00").toISOString() },`
- `functions/api/audit-log.ts:38` — `{ id: "log-003", action: "scale.result.create", resource: "scale_results", resource_id: "scale-demo-001", user_id: "demo-user", ip: "127.0.0.1", details: '{"scale_id":"mchat"}', created_at: new Date("2025-05-08T09:05:00"`
- `functions/api/audit-log.ts:38` — `{ id: "log-003", action: "scale.result.create", resource: "scale_results", resource_id: "scale-demo-001", user_id: "demo-user", ip: "127.0.0.1", details: '{"scale_id":"mchat"}', created_at: new Date("2025-05-08T09:05:00"`
- `functions/api/audit-log.ts:57` — `mode: "demo",`
- `functions/api/audit-log.ts:58` — `note: "Log de auditoria simulado. Configure D1 para log real.",`
- `functions/api/documents/index.ts:38` — `id: "doc-demo-001",`
- `functions/api/documents/index.ts:39` — `patient_id: "demo-001",`
- `functions/api/documents/index.ts:41` — `title: "Laudo de Avaliação Neuropediátrica — Demo",`
- `functions/api/documents/index.ts:75` — `return jsonResponse({ data: results, total: results.length, mode: "demo" });`
- `functions/api/documents/index.ts:164` — `return jsonResponse({ ...payload, mode: "demo", note: "Registro simulado — banco não configurado." }, 201);`
- `functions/api/documents/index.ts:164` — `return jsonResponse({ ...payload, mode: "demo", note: "Registro simulado — banco não configurado." }, 201);`
- `functions/api/scales/results.ts:64` — `id: "scale-demo-001",`
- `functions/api/scales/results.ts:65` — `patient_id: "demo-001",`
- `functions/api/scales/results.ts:78` — `id: "scale-demo-002",`
- `functions/api/scales/results.ts:79` — `patient_id: "demo-002",`
- `functions/api/scales/results.ts:113` — `mode: "demo",`
- `functions/api/scales/results.ts:238` — `mode: "demo",`
- `functions/api/scales/results.ts:239` — `note: "Registro simulado — banco não configurado.",`
- `functions/api/patients/[id].ts:28` — `"demo-001": {`
- `functions/api/patients/[id].ts:29` — `id: "demo-001",`
- `functions/api/patients/[id].ts:30` — `name: "Demo Paciente 1 — Fictício",`
- `functions/api/patients/[id].ts:32` — `guardian_name: "Responsável Demo 1",`
- `functions/api/patients/[id].ts:40` — `"demo-002": {`
- `functions/api/patients/[id].ts:41` — `id: "demo-002",`
- `functions/api/patients/[id].ts:42` — `name: "Demo Paciente 2 — Fictício",`
- `functions/api/patients/[id].ts:44` — `guardian_name: "Responsável Demo 2",`
- `functions/api/patients/[id].ts:52` — `"demo-003": {`
- `functions/api/patients/[id].ts:53` — `id: "demo-003",`
- `functions/api/patients/[id].ts:54` — `name: "Demo Paciente 3 — Fictício",`
- `functions/api/patients/[id].ts:56` — `guardian_name: "Responsável Demo 3",`
- `functions/api/patients/[id].ts:120` — `return errorResponse("Paciente demo não encontrado.", "NOT_FOUND", 404);`
- `functions/api/patients/[id].ts:126` — `mode: "demo",`
- `functions/api/patients/[id].ts:282` — `return jsonResponse({ ...partial, updated: true, mode: "demo" });`
- `functions/api/patients/[id].ts:332` — `return jsonResponse({ id, deleted: false, mode: "demo" });`
- `functions/api/patients/index.ts:29` — `id: "demo-001",`
- `functions/api/patients/index.ts:30` — `name: "Demo Paciente 1 — Fictício",`
- `functions/api/patients/index.ts:32` — `guardian_name: "Responsável Demo 1",`
- `functions/api/patients/index.ts:42` — `id: "demo-002",`
- `functions/api/patients/index.ts:43` — `name: "Demo Paciente 2 — Fictício",`
- `functions/api/patients/index.ts:45` — `guardian_name: "Responsável Demo 2",`
- `functions/api/patients/index.ts:55` — `id: "demo-003",`
- `functions/api/patients/index.ts:56` — `name: "Demo Paciente 3 — Fictício",`
- `functions/api/patients/index.ts:58` — `guardian_name: "Responsável Demo 3",`
- `functions/api/patients/index.ts:114` — `mode: "demo",`
- `functions/api/patients/index.ts:202` — `const id = 'demo-${crypto.randomUUID()}';`
- `functions/api/patients/index.ts:221` — `mode: "demo",`
- `functions/api/patients/index.ts:222` — `note: "Registro simulado — banco não configurado. Configure D1 para persistência real.",`
- `functions/api/memory/search.ts:8` — `* 3. Modo demo sem banco — retorna notas fictícias filtradas`
- `functions/api/memory/search.ts:68` — `// Notas demo para fallback sem banco`
- `functions/api/memory/search.ts:71` — `id: "mem-demo-001",`
- `functions/api/memory/search.ts:80` — `id: "mem-demo-002",`
- `functions/api/memory/search.ts:89` — `id: "mem-demo-003",`
- `functions/api/memory/search.ts:214` — `// MODO DEMO (sem banco configurado)`
- `functions/api/consultations/index.ts:37` — `id: "cons-demo-001",`
- `functions/api/consultations/index.ts:38` — `patient_id: "demo-001",`
- `functions/api/consultations/index.ts:48` — `id: "cons-demo-002",`
- `functions/api/consultations/index.ts:49` — `patient_id: "demo-002",`
- `functions/api/consultations/index.ts:72` — `return jsonResponse({ data: results, total: results.length, mode: "demo" });`
- `functions/api/consultations/index.ts:190` — `return jsonResponse({ ...payload, mode: "demo", note: "Registro simulado — banco não configurado." }, 201);`
- … +22 achados não exibidos.

## Handlers vazios

Total: **0**

Nenhum achado.

## Links mortos/#/javascript

Total: **2**

- `client/src/components/SkipNav.tsx:24` — `href="#main-content"`
- `client/src/components/AvisoLegalGate.tsx:65` — `href="#/termos"`

## Status 501 / NOT_IMPLEMENTED

Total: **8**

- `client/src/data/filterPodium.ts:163` — `const notImplementedPenalty = getImplementationStatus(match.scale) === "not_implemented" ? 20 : 0;`
- `client/src/data/filterPodium.ts:462` — `if (!current || getImplementationStatus(current.scale) !== "not_implemented") return current;`
- `client/src/data/filterPodium.ts:468` — `getImplementationStatus(m.scale) !== "not_implemented" &&`
- `client/src/data/advancedFilterLogic.ts:116` — `if (!route) return isLicenseRestricted(scale) ? "external_only" : "not_implemented";`
- `client/src/data/advancedFilterLogic.ts:130` — `case "not_implemented":`
- `client/src/data/advancedFilterLogic.ts:557` — `not_implemented: 0,`
- `client/src/data/scaleFilter.ts:52` — `| "not_implemented"; // recomendação clínica; sem aplicação no app`
- `scripts/auditClinicaEscalas.js:33` — `"not_implemented",`

## Console log/debug em código de produção

Total: **164**

- `client/src/lib/domainGuard.ts:62` — `console.log(`
- `client/src/lib/domainGuard.ts:66` — `console.log(`
- `server/storage.ts:324` — `console.log('[bootstrap] Usuario admin criado: ${adminEmail} (deve trocar senha no primeiro login)');`
- `server/index.ts:61` — `console.log('${formattedTime} [${source}] ${message}');`
- `server/modules/exemplo-uso.js:15` — `console.log('📋 Exemplo 1: Gerando Laudo Neuropediátrico...\n');`
- `server/modules/exemplo-uso.js:62` — `console.log('✓ Laudo gerado: ${resultado}');`
- `server/modules/exemplo-uso.js:67` — `console.log('✓ Assinado: ${assinatura.pdfPath}');`
- `server/modules/exemplo-uso.js:68` — `console.log('✓ Arquivo de assinatura: ${assinatura.sigPath}');`
- `server/modules/exemplo-uso.js:69` — `console.log('✓ Hash: ${assinatura.metadata.hash}\n');`
- `server/modules/exemplo-uso.js:82` — `console.log('💊 Exemplo 2: Gerando Receita Especial C1...\n');`
- `server/modules/exemplo-uso.js:119` — `console.log('✓ Validação: ${validacao.valido ? 'OK' : 'ERRO'}');`
- `server/modules/exemplo-uso.js:122` — `console.log(' Erros:');`
- `server/modules/exemplo-uso.js:123` — `validacao.erros.forEach(erro => console.log(' - ${erro}'));`
- `server/modules/exemplo-uso.js:130` — `console.log('✓ Receita gerada: ${resultado}');`
- `server/modules/exemplo-uso.js:135` — `console.log('✓ Assinado: ${assinatura.pdfPath}');`
- `server/modules/exemplo-uso.js:136` — `console.log('✓ Hash: ${assinatura.metadata.hash}\n');`
- `server/modules/exemplo-uso.js:149` — `console.log('🔍 Exemplo 3: Verificando Integridade de Assinatura...\n');`
- `server/modules/exemplo-uso.js:163` — `console.log('✓ Documento íntegro: ${resultado.documentoIntegro}');`
- `server/modules/exemplo-uso.js:164` — `console.log('✓ Data da assinatura: ${resultado.dataAssinatura}');`
- `server/modules/exemplo-uso.js:165` — `console.log('✓ Status: ${resultado.mensagem}\n');`
- `server/modules/exemplo-uso.js:178` — `console.log('📜 Exemplo 4: Informações do Certificado...\n');`
- `server/modules/exemplo-uso.js:187` — `console.log('Certificado P12:');`
- `server/modules/exemplo-uso.js:189` — `console.log(' ${chave}: ${valor}');`
- `server/modules/exemplo-uso.js:191` — `console.log('');`
- `server/modules/exemplo-uso.js:204` — `console.log('═══════════════════════════════════════════════════════════');`
- `server/modules/exemplo-uso.js:205` — `console.log(' SuperNeuroPed - Exemplos de Uso');`
- `server/modules/exemplo-uso.js:206` — `console.log(' Geração de Laudos e Receitas com Assinatura P12');`
- `server/modules/exemplo-uso.js:207` — `console.log('═══════════════════════════════════════════════════════════\n');`
- `server/modules/exemplo-uso.js:221` — `console.log('⚠️ NOTA: Estes são exemplos de demonstração.');`
- `server/modules/exemplo-uso.js:222` — `console.log(' Para usar em produção:');`
- `server/modules/exemplo-uso.js:223` — `console.log(' 1. Coloque seu certificado P12 em ./certificados/');`
- `server/modules/exemplo-uso.js:224` — `console.log(' 2. Configure a variável de ambiente CERT_PASSWORD');`
- `server/modules/exemplo-uso.js:225` — `console.log(' 3. Instale as dependências: npm install pdfkit\n');`
- `server/modules/exemplo-uso.js:236` — `console.log('✓ Exemplos carregados com sucesso!');`
- `server/modules/exemplo-uso.js:237` — `console.log(' Para executar, descomente as linhas no final deste arquivo.\n');`
- `server/lib/db.ts:43` — `console.log('[db] Conectado ao SQLite: ${dbPath}');`
- `server/lib/db.ts:65` — `console.log('[db] Conectado ao Postgres: ${redactUrl(DATABASE_URL)}');`
- `server/lib/db-enhanced.ts:45` — `console.log('[db] ✅ Conectado ao SQLite: ${dbPath}');`
- `server/lib/db-enhanced.ts:73` — `console.log('[db] ✅ Conectado ao Postgres: ${redactUrl(DATABASE_URL)}');`
- `server/lib/db-enhanced.ts:74` — `console.log('[db] 📊 Pool config: max=${process.env.DATABASE_POOL_MAX || 20}, min=${process.env.DATABASE_POOL_MIN || 2}');`
- `server/lib/db-enhanced.ts:110` — `console.log("[db] ✅ Postgres connection closed");`
- `server/lib/db-enhanced.ts:113` — `console.log("[db] ✅ SQLite connection closed");`
- `server/lib/db-enhanced.ts:119` — `console.log("[db] SIGTERM recebido, fechando conexões...");`
- `server/lib/db-enhanced.ts:124` — `console.log("[db] SIGINT recebido, fechando conexões...");`
- `scripts/audit-scales-export.mts:87` — `console.log('OK — ${ids.length} escalas exportadas para ${OUT}');`
- `scripts/audit-scales-export.mts:88` — `console.log(' • escalas-autorais-auditoria.md (${md.length} linhas)');`
- `scripts/audit-scales-export.mts:89` — `console.log(' • escalas-autorais-itens.csv (${itemRows.length - 1} itens)');`
- `scripts/audit-scales-export.mts:90` — `console.log(' • escalas-autorais-faixas.csv (${bandRows.length - 1} faixas)');`
- `scripts/audit-scales-export.mts:91` — `if (semMeta) console.log(' ⚠ ${semMeta} escala(s) com itens mas SEM metadados no catálogo autoral.');`
- `scripts/verify-local-pin-env.mjs:16` — `console.log("[local-pin] validação obrigatória apenas em deploy estático de produção.");`
- `scripts/verify-local-pin-env.mjs:33` — `console.log("[local-pin] verificador PBKDF2 de produção confirmado.");`
- `scripts/audit-a11y.mjs:36` — `console.log('[a11y] modo=${mode} | violações serious/critical=${violations.length} (teto ${MAX}) | todas as severidades=${allSeverityCount} (teto ${MAX_TOTAL})');`
- `scripts/audit-a11y.mjs:42` — `console.log("[a11y] ✓ sem violações serious/critical acima do teto.");`
- `scripts/audit-a11y.mjs:61` — `console.log('[a11y] auditando ${ROUTES.length} rota(s) em navegador real${process.env.A11Y_FULL === "1" ? " (cobertura integral)" : ""}.');`
- `scripts/audit-a11y.mjs:155` — `console.log("[a11y] Chromium indisponível - executando lint estático determinístico.");`
- `scripts/generate-daily-authorial-fallback.mts:296` — `console.log('Já existe inventário para ${date}; contingência não necessária.');`
- `scripts/generate-daily-authorial-fallback.mts:440` — `console.log('Inventário de contingência criado: ${filename}');`
- `scripts/auditClinicaEscalas.js:170` — `console.log(`
- `scripts/auditClinicaEscalas.js:182` — `console.log("[audit:scales:clinical] ✓ catálogo real aprovado sem mocks.");`
- `scripts/generate-daily-authorial-inventory.mts:164` — `console.log('Catálogo autoral diário válido: ${records.length} registro(s).');`
- `scripts/generate-daily-authorial-inventory.mts:248` — `if (datedRecords.length && !FORCE && !promotableContingency) return console.log('Já existe inventário para ${date}.');`
- `scripts/generate-daily-authorial-inventory.mts:271` — `console.log('Inventário criado: ${filename}');`
- `scripts/audit-design.mjs:52` — `console.log("[design] arquivos com mais valores crus:");`
- `scripts/audit-design.mjs:53` — `for (const [f, n] of top) console.log(' ${String(n).padStart(4)} ${f}');`
- `scripts/audit-design.mjs:54` — `console.log('[design] total de valores de cor crus = ${total}');`
- `scripts/audit-design.mjs:62` — `console.log('[design] ✓ dentro da catraca (${total} <= ${limit}).');`
- `scripts/audit-design.mjs:64` — `console.log("[design] baseline.designRawValues = null — execução informativa (catraca ainda não travada).");`
- `scripts/audit-scales-classify.mts:60` — `console.log("=== POR RISCO ===");`
- `scripts/audit-scales-classify.mts:61` — `for (const [k, n] of tally((r) => r.risco)) console.log(' ${k.padEnd(7)} ${n}');`
- `scripts/audit-scales-classify.mts:62` — `console.log("=== POR TIPO DE FAIXA ===");`
- `scripts/audit-scales-classify.mts:63` — `for (const [k, n] of tally((r) => r.faixa)) console.log(' ${k.padEnd(10)} ${n}');`
- `scripts/audit-scales-classify.mts:64` — `console.log("=== CRUZAMENTO risco × faixa ===");`
- `scripts/audit-scales-classify.mts:65` — `for (const [k, n] of tally((r) => '${r.risco} / ${r.faixa}')) console.log(' ${k.padEnd(20)} ${n}');`
- `scripts/audit-scales-classify.mts:66` — `console.log("=== POR QUEIXA PRIMÁRIA ===");`
- `scripts/audit-scales-classify.mts:67` — `for (const [k, n] of tally((r) => (byId.get(r.id)?.queixas?.[0] ?? "?"))) console.log(' ${k.padEnd(16)} ${n}');`
- `scripts/audit-scales-classify.mts:72` — `console.log('\n=== "Mais seguras" (BAIXO risco + MARCOS): ${seguras.length} ===');`
- `scripts/audit-scales-classify.mts:73` — `console.log('=== "Mais sensíveis" (ALTO risco): ${perigosas.length} ===');`
- `scripts/audit-scales-classify.mts:74` — `for (const r of perigosas) console.log(' ${r.id} [${r.queixas}] ${r.nome}');`
- `scripts/audit-lighthouse.mjs:48` — `console.log('[lighthouse] ${reason} - usando fallback de bundle size.');`
- `scripts/audit-lighthouse.mjs:139` — `console.log("[lighthouse] scores:", JSON.stringify(report));`
- … +84 achados não exibidos.

## localStorage/sessionStorage em superfícies potencialmente sensíveis

Total: **11**

- `client/src/components/DiarioClinico.tsx:137` — `const raw = localStorage.getItem(config.storageKey);`
- `client/src/components/DiarioClinico.tsx:142` — `if (migrated && localStorage.getItem(config.storageKey) === raw) {`
- `client/src/components/DiarioClinico.tsx:143` — `localStorage.removeItem(config.storageKey);`
- `client/src/components/DiarioClinico.tsx:146` — `localStorage.removeItem(config.storageKey);`
- `client/src/components/DiarioClinico.tsx:152` — `try { localStorage.removeItem(config.storageKey); } catch { /* legado indisponível */ }`
- `client/src/pages/agendar.tsx:50` — `try { return sessionStorage.getItem("neuroped:booking-token") || ""; } catch { return ""; }`
- `client/src/pages/agendar.tsx:121` — `try { sessionStorage.setItem("neuroped:booking-token", data.bookingToken); } catch { /* token segue visível */ }`
- `client/src/pages/lgpd-consent.tsx:88` — `localStorage.setItem(`
- `client/src/pages/lgpd-consent.tsx:93` — `// Sem localStorage: apenas segue para o app.`
- `client/src/pages/lgpd-consent.tsx:128` — `localStorage.setItem(`
- `client/src/pages/lgpd-consent.tsx:147` — `localStorage.setItem(`

## Imports lazy sem arquivo correspondente

Total: **0**

Nenhum achado.

## Referências internas sem rota registrada

Total: **0**

Nenhum achado.

## Rotas registradas sem referência literal de navegação

Total: **124**

- `client/src/App.tsx:1` — `rota sem referência literal de navegação: /abc`
- `client/src/App.tsx:1` — `rota sem referência literal de navegação: /academico-interativo`
- `client/src/App.tsx:1` — `rota sem referência literal de navegação: /acessibilidade`
- `client/src/App.tsx:1` — `rota sem referência literal de navegação: /agenda`
- `client/src/App.tsx:1` — `rota sem referência literal de navegação: /agendar`
- `client/src/App.tsx:1` — `rota sem referência literal de navegação: /ahsd-tea`
- `client/src/App.tsx:1` — `rota sem referência literal de navegação: /aq10`
- `client/src/App.tsx:1` — `rota sem referência literal de navegação: /aq50`
- `client/src/App.tsx:1` — `rota sem referência literal de navegação: /asq3`
- `client/src/App.tsx:1` — `rota sem referência literal de navegação: /assinatura-digital`
- `client/src/App.tsx:1` — `rota sem referência literal de navegação: /atencao-concentracao`
- `client/src/App.tsx:1` — `rota sem referência literal de navegação: /avaliacao-multiprofissional`
- `client/src/App.tsx:1` — `rota sem referência literal de navegação: /ballard`
- `client/src/App.tsx:1` — `rota sem referência literal de navegação: /bateria-jadson`
- `client/src/App.tsx:1` — `rota sem referência literal de navegação: /bayley`
- `client/src/App.tsx:1` — `rota sem referência literal de navegação: /biblioteca-instrumentos`
- `client/src/App.tsx:1` — `rota sem referência literal de navegação: /brief2`
- `client/src/App.tsx:1` — `rota sem referência literal de navegação: /caa`
- `client/src/App.tsx:1` — `rota sem referência literal de navegação: /calculadora-dose`
- `client/src/App.tsx:1` — `rota sem referência literal de navegação: /cars`
- `client/src/App.tsx:1` — `rota sem referência literal de navegação: /cbcl`
- `client/src/App.tsx:1` — `rota sem referência literal de navegação: /cbcl-interativo`
- `client/src/App.tsx:1` — `rota sem referência literal de navegação: /cdi2`
- `client/src/App.tsx:1` — `rota sem referência literal de navegação: /cefaleia`
- `client/src/App.tsx:1` — `rota sem referência literal de navegação: /classificacoes`
- `client/src/App.tsx:1` — `rota sem referência literal de navegação: /conecta`
- `client/src/App.tsx:1` — `rota sem referência literal de navegação: /confias`
- `client/src/App.tsx:1` — `rota sem referência literal de navegação: /conhecimento-visual`
- `client/src/App.tsx:1` — `rota sem referência literal de navegação: /conhecimentos-gerais`
- `client/src/App.tsx:1` — `rota sem referência literal de navegação: /conners`
- `client/src/App.tsx:1` — `rota sem referência literal de navegação: /consentimento-lgpd`
- `client/src/App.tsx:1` — `rota sem referência literal de navegação: /crafft`
- `client/src/App.tsx:1` — `rota sem referência literal de navegação: /cshq`
- `client/src/App.tsx:1` — `rota sem referência literal de navegação: /cssrs`
- `client/src/App.tsx:1` — `rota sem referência literal de navegação: /curvas-crescimento`
- `client/src/App.tsx:1` — `rota sem referência literal de navegação: /denver`
- `client/src/App.tsx:1` — `rota sem referência literal de navegação: /diario-alimentar`
- `client/src/App.tsx:1` — `rota sem referência literal de navegação: /diario-escola`
- `client/src/App.tsx:1` — `rota sem referência literal de navegação: /diario-sono`
- `client/src/App.tsx:1` — `rota sem referência literal de navegação: /documentos`
- `client/src/App.tsx:1` — `rota sem referência literal de navegação: /eaah`
- `client/src/App.tsx:1` — `rota sem referência literal de navegação: /eaf`
- `client/src/App.tsx:1` — `rota sem referência literal de navegação: /eai`
- `client/src/App.tsx:1` — `rota sem referência literal de navegação: /easi`
- `client/src/App.tsx:1` — `rota sem referência literal de navegação: /ecar-si`
- `client/src/App.tsx:1` — `rota sem referência literal de navegação: /ecsm`
- `client/src/App.tsx:1` — `rota sem referência literal de navegação: /edi`
- `client/src/App.tsx:1` — `rota sem referência literal de navegação: /efeitos-colaterais`
- `client/src/App.tsx:1` — `rota sem referência literal de navegação: /emdi`
- `client/src/App.tsx:1` — `rota sem referência literal de navegação: /ems`
- `client/src/App.tsx:1` — `rota sem referência literal de navegação: /epilepsia`
- `client/src/App.tsx:1` — `rota sem referência literal de navegação: /escrita-desenho`
- `client/src/App.tsx:1` — `rota sem referência literal de navegação: /espasticidade`
- `client/src/App.tsx:1` — `rota sem referência literal de navegação: /etare`
- `client/src/App.tsx:1` — `rota sem referência literal de navegação: /eusm10`
- `client/src/App.tsx:1` — `rota sem referência literal de navegação: /familia`
- `client/src/App.tsx:1` — `rota sem referência literal de navegação: /farmacologia`
- `client/src/App.tsx:1` — `rota sem referência literal de navegação: /fichas-registro`
- `client/src/App.tsx:1` — `rota sem referência literal de navegação: /fluxograma`
- `client/src/App.tsx:1` — `rota sem referência literal de navegação: /fluxogramas`
- `client/src/App.tsx:1` — `rota sem referência literal de navegação: /funcoes-executivas`
- `client/src/App.tsx:1` — `rota sem referência literal de navegação: /gad7`
- `client/src/App.tsx:1` — `rota sem referência literal de navegação: /glossario`
- `client/src/App.tsx:1` — `rota sem referência literal de navegação: /gmfcs`
- `client/src/App.tsx:1` — `rota sem referência literal de navegação: /griffiths`
- `client/src/App.tsx:1` — `rota sem referência literal de navegação: /instrumentos-padronizados`
- `client/src/App.tsx:1` — `rota sem referência literal de navegação: /inventarios-auto`
- `client/src/App.tsx:1` — `rota sem referência literal de navegação: /inventarios-escola`
- `client/src/App.tsx:1` — `rota sem referência literal de navegação: /ips`
- `client/src/App.tsx:1` — `rota sem referência literal de navegação: /laudo-neuroped`
- `client/src/App.tsx:1` — `rota sem referência literal de navegação: /leiter3`
- `client/src/App.tsx:1` — `rota sem referência literal de navegação: /linguagem-fonologia`
- `client/src/App.tsx:1` — `rota sem referência literal de navegação: /login`
- `client/src/App.tsx:1` — `rota sem referência literal de navegação: /marcos-desenvolvimento`
- `client/src/App.tsx:1` — `rota sem referência literal de navegação: /masc2`
- `client/src/App.tsx:1` — `rota sem referência literal de navegação: /mchat`
- `client/src/App.tsx:1` — `rota sem referência literal de navegação: /medicamentos`
- `client/src/App.tsx:1` — `rota sem referência literal de navegação: /memoria-teste`
- `client/src/App.tsx:1` — `rota sem referência literal de navegação: /motricidade-teste`
- `client/src/App.tsx:1` — `rota sem referência literal de navegação: /nepsy2`
- … +44 achados não exibidos.

## Rotas duplicadas

Total: **0**

Nenhum achado.

## Campos TEXT potencialmente sensíveis em migrações SQL sem encrypted/hash

Total: **0**

Nenhum achado.

## API Cloudflare — inventário

- `functions/api/[[path]].js`
- `functions/api/_buildInfo.ts`
- `functions/api/_clinicalValidation.ts`
- `functions/api/_middleware.ts`
- `functions/api/_request.ts`
- `functions/api/audit-log.ts`
- `functions/api/auth/_authorization.ts`
- `functions/api/auth/_crypto.ts`
- `functions/api/auth/_limits.ts`
- `functions/api/auth/_sessions.ts`
- `functions/api/auth/_shared.ts`
- `functions/api/auth/login.ts`
- `functions/api/auth/logout.ts`
- `functions/api/auth/me.ts`
- `functions/api/auth/refresh.ts`
- `functions/api/cert.ts`
- `functions/api/clinical-core/_schema.ts`
- `functions/api/clinical-core/index.ts`
- `functions/api/conecta/[id].ts`
- `functions/api/conecta/_schema.ts`
- `functions/api/conecta/index.ts`
- `functions/api/consents.ts`
- `functions/api/consultations/index.ts`
- `functions/api/documents/index.ts`
- `functions/api/health.ts`
- `functions/api/memory/search.ts`
- `functions/api/operations/_core.ts`
- `functions/api/operations/index.ts`
- `functions/api/patients/[id].ts`
- `functions/api/patients/[id]/results.ts`
- `functions/api/patients/_contract.ts`
- `functions/api/patients/index.ts`
- `functions/api/public-booking.ts`
- `functions/api/results.ts`
- `functions/api/results/[id].ts`
- `functions/api/scales/results.ts`
- `functions/api/version.ts`

## Sinais de dívida de produto conhecidos

- `portal-familia` ainda aparece no roteador principal; revisar se é rota intencional ou legado órfão.
- `portal-acesso` ainda aparece no roteador principal; revisar se é rota intencional ou legado órfão.
- `familia` ainda aparece no roteador principal; revisar se é rota intencional ou legado órfão.
## Gates de execução

### verify_release

- Status: **PASS**

### a11y_full

- Status: **PASS**

### e2e_scales

- Status: **PASS**

### audit_screens

- Status: **PASS**

### build_full

- Status: **PASS**

## Issues abertas observadas

- #533 — [P1] Quarentena de proveniência — mutismo seletivo 04/08/2026 — https://github.com/jadsonfraga/neuroped/issues/533
- #515 — P0 — Revogar credenciais históricas e remover secrets ICP aposentados — https://github.com/jadsonfraga/neuroped/issues/515
- #514 — P0 — Criptografar dados clínicos persistidos no D1 com migração reversível — https://github.com/jadsonfraga/neuroped/issues/514
- #438 — [FILTRO] Reintroduzir sinais e sintomas com peso de 50% no ranking de escalas — https://github.com/jadsonfraga/neuroped/issues/438
- #416 — Elevar filtro e escalas para 9 real — https://github.com/jadsonfraga/neuroped/issues/416
- #386 — [LEGACY AUDIT] Garantir aproveitamento do app pré-React sem bagunçar a arquitetura atual — https://github.com/jadsonfraga/neuroped/issues/386
- #359 — [SDG] Corrigir gargalos negativos da auditoria rigorosa — https://github.com/jadsonfraga/neuroped/issues/359
- #301 — [Design System] np-tokens.css + np-foundation.css (background cinemático + tipografia) — https://github.com/jadsonfraga/neuroped/issues/301
- #300 — [IA] Sidebar canônica: TRABALHO CLÍNICO / REFERÊNCIA com hubs principais — https://github.com/jadsonfraga/neuroped/issues/300
- #299 — [UX] Modo "Triar sem cadastrar" no Clinical Intelligence Engine — https://github.com/jadsonfraga/neuroped/issues/299
- #297 — [UI] Remover emojis decorativos da UI clínica formal (sidebar, headings, escudo) — https://github.com/jadsonfraga/neuroped/issues/297
- #296 — [Home] Hero editorial 88vh com Fraunces 72px e CTA pill 56px único — https://github.com/jadsonfraga/neuroped/issues/296
- #295 — [Visual] Substituir ilustrações AI-generated por ilustração editorial vetorial — https://github.com/jadsonfraga/neuroped/issues/295
- #293 — [Coerência] Versão única do package.json propagada para header e footer — https://github.com/jadsonfraga/neuroped/issues/293
- #291 — [DECISÃO] Portal Famílias: deletar rota órfã OU consertar auth? — https://github.com/jadsonfraga/neuroped/issues/291
- #288 — [H12] CURVAS: gate profissional contextualizado + a11y — https://github.com/jadsonfraga/neuroped/issues/288
- #31 — v41 — App shell, consulta livre, secretaria e identidade premium — https://github.com/jadsonfraga/neuroped/issues/31

