# NeuroPed EDJ v4.0 — Edição Comercial

**Plataforma clínica integrada de neuropediatria · Dr. Jadson Fraga**

PWA profissional de nível comercial unificando os repositórios `jadsonfraga/neuroped` e `jadsonfraga/Superneuroped` em um único produto SaaS pronto para venda e operação.

---

## Resumo executivo

Aplicação progressiva instalável que substitui múltiplas ferramentas do consultório de neuropediatria por uma plataforma única, com sistema de autenticação multi-perfil, prontuário eletrônico, banco de 507 instrumentos autorais, geração de laudos em PDF, agenda integrada com financeiro, telemedicina, portal família, mensageria interna e sincronização em nuvem.

---

## Arquitetura comercial

| Camada | Stack |
|---|---|
| Frontend | SPA vanilla com hash router, design system próprio, glassmorphism, dark/light auto, micro-interações |
| Autenticação | Multi-perfil (Médico, Secretária, Família) com onboarding em 3 telas, demo mode |
| Estado | Store reativo com IndexedDB/localStorage, pub/sub interno |
| Offline | Service Worker (cache-first shell, network-first API), background sync |
| PDF | Gerador de laudos com modelo profissional A4 e assinatura digital |
| Charts | SVG nativo (line, bar, donut) sem dependência externa |
| Backend A | Supabase (Postgres, RLS, REST) — multi-dispositivo |
| Backend B | Cloudflare Pages Functions + D1 (mantém infra existente) |
| PWA | manifest com shortcuts, install prompt, push notifications-ready |

---

## 12 módulos integrados

1. **Início** — Dashboard com KPIs, gráficos de tendência, distribuição por domínio, agenda do dia e pacientes recentes
2. **Pacientes** — CRM completo com busca, filtros por status e domínio, ficha individual
3. **Paciente individual** — Prontuário com evolução, linha do tempo, contatos, escalas e laudos
4. **Consultas** — Nova consulta, atendimentos do dia, histórico, salvar-e-gerar-laudo
5. **Escalas** — 507 instrumentos com filtros inteligentes; runner de aplicação com progresso e resultado
6. **Laudos** — Modelos pré-prontos (TEA, TDAH, Linguagem, Sono, FE, livre) + geração PDF assinada
7. **Agenda** — Calendário mensal visual, eventos, telemedicina, novo evento via sheet
8. **Financeiro** — KPIs de receita, evolução semanal, cobrança em aberto, exportação
9. **Mensagens** — Chat com famílias e equipe, com indicadores de presença e vídeo
10. **CAA** — Pictogramas categorizados, montagem de frase, síntese de voz pt-BR
11. **Portal Família** — Passes familiares com link copiável, materiais educativos
12. **Planos** — 3 tiers (Starter, Pro Clínico, Clínica), histórico de pagamentos
13. **Configurações** — Conta, nuvem, LGPD, aparência, sobre

---

## Funcionalidades comerciais diferenciadas

### Experiência

- Splash de marca com gradiente animado
- Onboarding interativo em 3 telas (artes SVG ilustradas)
- Login profissional com sidebar de benefícios e selo LGPD
- Quick search com `⌘K` / `Ctrl+K`
- Bottom sheet para ações em mobile
- Drawer de notificações com badge animado
- Toast com curva spring
- Skeleton loaders prontos
- Tema claro/escuro com persistência

### Operação clínica

- Sistema multi-perfil real: médico vê tudo, secretária vê agenda e cobrança, família vê apenas escalas e portal
- 507 instrumentos clínicos (curados + catálogo)
- Runner de escala com progress bar, navegação e cálculo automático de sinalização (Baixo/Moderado/Alto)
- Geração de laudo PDF profissional com cabeçalho de marca, dados do paciente, hipótese, conduta, assinatura digital e hash de verificação
- Atalho "Salvar consulta e gerar laudo" em um clique

### Modelo de negócio

- Tela de planos comerciais funcionando (Starter grátis, Pro R$197/mês, Clínica R$497/mês)
- Histórico de pagamentos
- Badge de plano no avatar
- Limites por plano implementáveis (já tem infraestrutura no Store)

### Multi-dispositivo

- IndexedDB local primeiro
- Sync configurável para Supabase (multi-device) ou Cloudflare D1 (backend existente)
- Backup JSON exportável
- Ping de status da nuvem em tempo real

### Conformidade

- LGPD: armazena somente códigos operacionais e respostas estruturadas
- HTTPS obrigatório em produção
- Limpeza de dados locais a 1 clique
- Política e termos linkados

---

## Estrutura de arquivos

```
outputs/
├── index.html                # Shell com splash + onboarding + auth + app
├── styles.css                # Design system completo (~900 linhas)
├── app.js                    # SPA controller (auth, store, router, 12 views)
├── data.js                   # 507 escalas + pacientes + agenda + mensagens + planos
├── api.js                    # Cliente Supabase + Cloudflare
├── pdf.js                    # Gerador de laudos PDF (modelo A4 profissional)
├── charts.js                 # Charts SVG (line, bar, donut)
├── sw.js                     # Service Worker offline-first
├── manifest.json             # PWA manifest com shortcuts
├── icon.svg                  # Logo vetorial
├── functions/
│   └── api/
│       ├── health.js         # Cloudflare Function — status
│       └── submissions.js    # Cloudflare Function — escalas
├── schema.sql                # SQLite/D1
├── supabase-schema.sql       # Postgres/Supabase com RLS
├── wrangler.toml             # Config Cloudflare Pages
└── README.md                 # Este arquivo
```

---

## Como executar

### Local

```bash
cd outputs
python -m http.server 8080
# ou: npx serve .
```

Abra `http://localhost:8080`. O Service Worker registra automaticamente.

### Deploy comercial

**Recomendado: Vercel + Supabase**

1. Push do diretório para um repositório GitHub
2. Importar no Vercel — deploy automático
3. Criar projeto Supabase, rodar `supabase-schema.sql`
4. Abrir o app → Configurações → Nuvem → colar URL e Anon Key

**Alternativa: Cloudflare Pages + D1** (mantém infra do neuroped)

```bash
npx wrangler d1 create neuroped-db
# copiar database_id para wrangler.toml
npx wrangler d1 execute neuroped-db --file=./schema.sql --remote
npx wrangler pages secret put APP_TOKEN
npx wrangler pages deploy .
```

---

## Roadmap pós-MVP

- Stripe / Mercado Pago para cobrança recorrente real
- Push notifications via Web Push API
- Telemedicina com WebRTC (PeerJS) embutida
- Assinatura digital ICP-Brasil para laudos
- Importação de PDF/DICOM via File System Access
- Dashboard administrativo multi-clínica
- App nativo via Capacitor

---

## Aviso clínico

Os instrumentos autorais são recursos de triagem, organização clínica e acompanhamento. Não substituem avaliação médica completa, exame clínico ou instrumentos normatizados quando formalmente indicados.

---

© 2026 NeuroPed EDJ · Dr. Jadson Fraga · Neuropediatria
