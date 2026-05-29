# NeuroPed EDJ — v5.1 (truth-pass)

**Plataforma educacional e demonstrativa de neuropediatria**

Dr. Jadson Fraga Araújo Júnior · CRM-PE 25227 · RQE 17756
Petrolina-PE · Juazeiro-BA

---

> ⚠️ **AMBIENTE DEMONSTRATIVO**
> Esta versão é uma demonstração técnica honesta. Não inserir dados reais de pacientes. Não tratar laudos gerados como documentos formais. Não esperar funcionalidades clínicas profissionais até as etapas P0/P1 do `GO_LIVE_CHECKLIST.md` estarem completas.

---

## O que esta versão FAZ

### Para famílias e visitantes (acesso aberto)
- 15 instrumentos autorais do Dr. Jadson — triagem orientadora para famílias
- 8 materiais educativos sobre desenvolvimento, sono, alimentação, TDAH, TEA, CAA
- 9 marcos do desenvolvimento por faixa etária com sinais de alerta
- Calculadora de IMC infantil e dose pediátrica (referenciais)
- CAA — pictogramas + síntese de voz pt-BR para comunicação alternativa
- Página institucional do Dr. Jadson com áreas de atuação e contato
- WhatsApp direto para agendamento

### Para o médico (área profissional demo)
Acessada apenas após PIN MASTER. Esta área é **apenas demonstração** — pacientes e consultas listados são fictícios.

- CRM com pacientes fictícios marcados `[DEMO]`
- Modelos de laudo PDF com carimbo "DEMONSTRAÇÃO"
- Catálogo de referência de 8 instrumentos clínicos clássicos (M-CHAT-R, SNAP-IV, SRS-2, CBCL, GMFCS, ASQ-3, Vineland-3, Conners-3) — **não aplicáveis** nesta build, requerem licença formal

## O que esta versão NÃO faz

- ❌ Não autentica médicos profissionalmente (PIN local não é autenticação)
- ❌ Não armazena dados em banco seguro com RLS
- ❌ Não emite documentos com assinatura digital ICP-Brasil
- ❌ Não processa cobranças ou assinaturas reais
- ❌ Não oferece telemedicina (módulo removido até conformidade CFM 2.314/2022)
- ❌ Não envia mensagens criptografadas a famílias (módulo removido)
- ❌ Não sincroniza com nuvem por padrão

Tudo isso está documentado em `KNOWN_LIMITATIONS.md`.

## Estrutura de arquivos

```
neuroped/
├── index.html                       Shell PWA com demo banner
├── styles.css                       Design system completo
├── app.js                           SPA router + views públicas e demo
├── data.js                          Instrumentos com registry estruturado
├── api.js                           Cliente cloud opcional (Supabase/Cloudflare)
├── pdf.js                           Gerador de PDF com carimbo DEMO
├── charts.js                        Charts SVG nativos
├── sw.js                            Service Worker (cache shell)
├── manifest.json                    PWA manifest
├── icon.svg                         Ícone vetorial
├── functions/api/                   Cloudflare Pages Functions (não ativas no github.io)
│   ├── health.js
│   └── submissions.js
├── schema.sql                       Schema D1 (legado, descontinuado)
├── supabase-schema.sql              Schema PostgreSQL alvo
├── wrangler.toml                    Config Cloudflare Pages
└── docs/
    ├── README.md                    Este arquivo
    ├── ARCHITECTURE.md              Arquitetura atual + alvo
    ├── SECURITY.md                  Controles obrigatórios
    ├── PRIVACY_AND_LGPD.md          Conformidade legal
    ├── INSTRUMENT_REGISTRY.md       Fonte única de verdade clínica
    ├── KNOWN_LIMITATIONS.md         Limitações honestas
    ├── GO_LIVE_CHECKLIST.md         Checklist antes de paciente real
    ├── AUDIT_REMEDIATION_REPORT.md  Auditoria que originou v5.1
    └── CHANGELOG.md                 Histórico de mudanças
```

## Como executar localmente

```bash
cd outputs
python -m http.server 8080
# ou: npx serve .
```

Abrir `http://localhost:8080`. O Service Worker registra automaticamente.

## Como fazer deploy

### Atual: GitHub Pages (vitrine)
- Push para `main` no repositório `jadsonfraga/neuroped`
- GitHub Pages publica automaticamente em `jadsonfraga.github.io/neuroped/`
- Backend Cloudflare Functions NÃO executa neste domínio

### Recomendado para próxima versão: Cloudflare Pages
Ver `ARCHITECTURE.md` seção 6 (plano de migração) e `GO_LIVE_CHECKLIST.md` para a lista completa.

## Acesso ao modo profissional (demo)

PIN MASTER: `FRAGA1108`

Este PIN está em texto claro no `app.js`. Sua finalidade é apenas evitar exposição acidental dos módulos demo, **não é mecanismo de segurança**.

## Histórico

- v5.1 (28/05/2026) — Truth-pass: remoção de 487 placeholders, demo banner, documentação obrigatória
- v5.0 (28/05/2026) — Modo único + PIN, sem onboarding multi-perfil
- v4.0 (28/05/2026) — Edição comercial (com claims falsos — revisado)
- v3.0 — Migração para PWA modular
- v2.x — Múltiplas iterações estáticas
- v1.0 — Aplicativo estático inicial

## Aviso clínico

Os instrumentos autorais são recursos de **triagem operacional**. Não substituem avaliação médica, exame clínico ou instrumentos normatizados quando formalmente indicados.

## Licença

- Código-fonte: a definir
- Conteúdo educacional e instrumentos autorais: CC-BY-NC do Dr. Jadson Fraga
- Pictogramas e ícones: emoji Unicode (uso livre)

## Contato

- WhatsApp: `+55 87 9609-7028`
- Instagram: `@drjadsonfraga`
- Site profissional: a definir

Para reportar bug de segurança: contato direto pelo WhatsApp com a palavra-chave `[security]`.

---

© 2026 NeuroPed EDJ · Dr. Jadson Fraga · Neuropediatria
