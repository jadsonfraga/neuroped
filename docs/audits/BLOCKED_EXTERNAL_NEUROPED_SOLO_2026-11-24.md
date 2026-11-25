# Ativação do NeuroPed Solo em 24/11/2026

O [sentinela de publicação](https://neuroped.pages.dev/deploy-check.json) apontava para `b8e895ef`, run [45465644710](https://github.com/jadsonfraga/neuroped/actions/runs/45465644710). O [health](https://neuroped.pages.dev/api/health) confirmou banco, autenticação e chave clínica configurados. Este é um registro pontual.

| Sistema | Evidência de 24/11 | Ação e critério de fechamento |
| --- | --- | --- |
| Cadastro | `503 SIGNUP_DISABLED` com corpo vazio | Operador autoriza a ativação em preview isolada. Uma conta sintética criada pelo fluxo público recebe e consome o link de verificação. |
| Cloudflare R2 | `LGPD_BUCKET_NOT_CONFIGURED`, sem binding e execução | Titular autoriza provisionamento privado e o binding `LGPD_EXPORT_BUCKET`. O workflow automatizado exige `Workers R2 Storage: Edit`. Exercitar o worker com dados sintéticos e conferir o objeto privado e seu digest. |
| Asaas | `503 WEBHOOK_NOT_CONFIGURED` com corpo vazio | Provisionar as credenciais sandbox na preview e o webhook autenticado no provedor. Validar checkout de um assento e o `charge_paid` persistido. A cobrança de produção requer confirmação própria. |
| Resend | Entrega observada indisponível nesta verificação | Configurar domínio/remetente e credencial por console seguro. Confirmar recebimento e consumo do token na preview. |
| Jurídico | Documentos SaaS versionados em `shared/legal.ts` seguem em revisão | Registrar revisão, texto aprovado, acordos de processamento e procedimentos conforme o [briefing G6](../saas/gtm/LEGAL_BRIEFING.md). |
| Legado S9 | Censo e migração sintética registrados em [G3](../saas/gtm/PHASE3_GATE.md), execução atual pendente de prova | Confirmar novamente contagens, recuperação e titular ativo no destino já aprovado. Registrar reconciliação e isolamento pós-migração. |

O ensaio [42468389352](https://github.com/jadsonfraga/neuroped/actions/runs/42468389352) comprovou backup/restore de ciphertext sintético com chave efêmera. O RTO de produção segue sem medição. O [roteiro do Cliente Zero](../SMOKE_CLIENTE_ZERO.md) define o teste publicado e a evidência de cada etapa.
