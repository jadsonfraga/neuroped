# Fase 3: gate de confiabilidade para o primeiro terceiro (Ciclo 4)

Regra: nenhum médico externo entra em LIVE antes de TODOS os itens P0 abaixo estarem ✅ com
evidência verificável. Fonte dos fatos: `docs/saas/spiral/BACKLOG.md`, `docs/audits/*`,
audit Clinical/LGPD (último resultado: `ready=false`). Sem PHI em nenhuma evidência.

| # | Item | Quem | Evidência de conclusão | Estado |
|---|---|---|---|---|
| G1 | Keyring clínico (`CLINICAL_DATA_KEY`/`_ID`/`CLINICAL_INDEX_KEY`) em Production | proprietário | audit: `clinicalCryptoConfigured=true` | 🔒 |
| G2 | Permissão `Workers R2 Storage: Edit` no token + bucket/binding | proprietário | audit: `lgpdExport.configured=true` | 🔒 |
| G3 | S9: destino autorizado dos 4 registros legados + backfill + remoção do bypass de admin global | proprietário decide; engenharia executa | censo repetido sem órfãos; testes negativos Alfa/Beta; acesso do Cliente Zero validado | 🔒 |
| G4 | Ensaio de backup/restore com **ciphertext real** (reusa `dr-mechanism-rehearsal.yml`) | engenharia, após G1 | run verde com `encryptClinicalJson` real | ⛔ depende de G1 |
| G5 | S4: webhook sandbox Asaas exercitado em ambiente publicado | proprietário (credencial sandbox) | webhook autenticado processado | 🔒 |
| G6 | Revisão jurídica de Política de Privacidade, Termos, DPA com clínicas e papel de DPO | proprietário + advogado | parecer registrado; textos publicados | ⏳ não iniciado |
| G7 | Texto de `/planos` sobre cifra qualificado até G1 (D-004) | proprietário | `planos.tsx` revisado ou G1 concluído | ⏳ |

## Ordem obrigatória
G1 → G4 → G3 → (G2, G5, G6 em paralelo) → Cliente Zero em LIVE → primeiro terceiro.
Motivo: o backfill do S9 e a prova de restauração exigem o keyring; sem backup restaurado e
provado, mexer no legado trocaria vazamento por perda de dados (BLOCKED_EXTERNAL_LEGACY_TENANT_CENSUS).

## Decisão do proprietário para destravar G3 (5 minutos; autorização, não execução)
Contexto: censo de 26/09/2026 achou 4 pacientes legados: 3 sem owner (os 3 IDs fixos do seed
`demo-001..003` existem, mas **não** está provado que sejam esses 3) e 1 com owner sem clínica
ativa. A conta bootstrap admin tem zero clínicas e 1 paciente próprio.

Responda por escrito (ficam em DECISIONS.md, sem nome de paciente):
1. Os 3 sem owner são fixtures de demonstração (descartáveis) ou podem ser casos reais? Se não
   souber, o próximo passo é uma consulta **só de contagem** que cruze os 3 IDs do seed com os
   3 sem owner (a engenharia prepara; a execução em produção é sua).
2. O paciente do owner sem clínica ativa é um caso real seu? Em qual clínica deve ficar?
3. A conta bootstrap admin é a sua conta profissional ou uma conta técnica separada?

Regras que não mudam: não atribuir órfãos ao admin por inferência; não apagar seeds sem backup
restaurado e provado; repetir o censo imediatamente antes de qualquer migração.
