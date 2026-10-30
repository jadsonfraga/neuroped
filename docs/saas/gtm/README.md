# docs/saas/gtm: camada de gate, jurídico e legado (complementar)

Reconciliação feita em 2026-10-04, depois que a PR #1091 (loop SaaS, outra sessão) entrou na `main`.
Os artefatos do loop na RAIZ são os canônicos e estão travados por
`tests/unit/saas-loop-artifacts-static.test.mjs`: `ROADMAP.md`, `DECISIONS.md`, `METRICS.md`,
`docs/GTM_ENTREVISTAS_E_PILOTO.md`, `docs/LGPD_PRE_GO_LIVE.md`, `docs/SMOKE_CLIENTE_ZERO.md`.
Este diretório NÃO os substitui; só acrescenta o que eles não cobrem. Ao atualizar o loop, a
fonte é a raiz; replique aqui apenas o que for específico destes arquivos.

## O que é exclusivo daqui
| Arquivo | Acrescenta |
|---|---|
| `PHASE3_GATE.md` | gate G1–G7 com ordem obrigatória (chaves → DR com cifra real → S9) |
| `S9_DECISION_MEMO.md` | inferência dos 4 registros legados e confirmação por 2 números |
| `PLANOS_COPY_D004.md` | rascunho de `/planos` sem promessa que a produção não cumpre |
| `LEGAL_BRIEFING.md` | 11 perguntas para o advogado (detalha o B7 de `LGPD_PRE_GO_LIVE.md`) |
| `CLIENTE_ZERO_14D.md` | 14 dias em LIVE com dados reais; complementa o smoke sandbox da raiz |
| `VALUE_PROPOSITION.md`, `INTERVIEW_*`, `INVITE_AND_DEMO_KIT.md` | apoio operacional do ICP Solo; a raiz prevalece |

## Reconciliação vigente
1. **ICP decidido:** NeuroPed Solo atende primeiro o neuropediatra que opera o próprio
   consultório. A oferta Clínica fica para Later. D-002 foi superada por D-011.
2. **Piloto pago:** vale a oferta canônica de R$ 99/mês para um profissional. A sugestão
   histórica de R$ 1/mês em `INTERVIEW_PLAYBOOK.md` não define a oferta vigente.
3. **"Comprovado em código" não é "pronto em produção":** `LGPD_PRE_GO_LIVE.md` marca A4/A5
   (exportação, cifra) como ✅ por teste/código. A produção, em 17/10/2026, está com
   `clinicalCryptoConfigured=true`, mas exportação LGPD ainda sem R2 (audit Clinical/LGPD,
   `ready=false`). Não usar esses ✅ como autorização para paciente real: vale o gate G1–G7.
4. **Smoke da raiz (`go-live`):** `pronto: true` atesta configuração presente, não cifra clínica;
   não substitui G1/G4/G3.
5. **Bloqueios externos preservados:** Asaas, Resend, R2/LGPD, revisão jurídica, legado e
   smoke publicado precisam de evidência própria antes de piloto real.

## Duplicação aceita
Roteiro de entrevistas (raiz × `INTERVIEW_PLAYBOOK.md`) tem sobreposição. Para metas, preço e
ICP, usar `docs/GTM_ENTREVISTAS_E_PILOTO.md`; arquivos antigos daqui são apoio histórico.
