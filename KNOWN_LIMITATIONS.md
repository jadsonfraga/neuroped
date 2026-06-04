# KNOWN LIMITATIONS — NeuroPed SDG

Este documento existe para evitar que a aparência polida do produto seja confundida
com prontidão para substituir avaliação clínica ou prontuário regulado. Ele descreve
a build **atual** (e é mantido em dia — versões antigas descreviam um app diferente).

> **Natureza:** o NeuroPed SDG é uma ferramenta **educativa e de triagem**. Os
> instrumentos autorais são de triagem **não normatizada** e **não substituem**
> avaliação, diagnóstico ou conduta de um profissional de saúde.

---

## Estado atual dos controles (o que mudou)

### Autenticação / acesso restrito
- O PIN master **não fica em texto claro**: o app guarda apenas o **hash SHA-256**
  (`MASTER_HASH` em `master-access-policy.js`) e compara o hash do que foi digitado.
- O hash é **rotacionável sem editar o core**, via `window.NEUROPED_MASTER_PIN_HASH`.
- ⚠️ **Pendência conhecida:** o valor padrão do hash já constou do histórico do
  repositório → **deve ser rotacionado** (gere um novo: `echo -n "NOVO_PIN" | shasum -a 256`).
- Continua **não havendo** autenticação server-side, MFA ou sessão segura no servidor.
  Para rotina clínica com múltiplos usuários, isso é obrigatório e ainda não existe.

### Armazenamento de dados
- Dados ficam em **localStorage deste aparelho/navegador** (local-first), não em
  servidor por padrão.
- **Implementado (LGPD — direitos do titular):** fluxo de **consentimento** na 1ª
  visita e botão 🛡️ sempre disponível com **exportar (portabilidade)** e **apagar
  (eliminação)** os dados do aparelho — `np-lgpd-consent.js`.
- **Ainda pendente (organizacional):** retenção formal, trilha de auditoria, Row
  Level Security e backup gerenciado dependem de backend ativo.

### Instrumentos clínicos
- Instrumentos clássicos/proprietários (M-CHAT, SNAP-IV, CARS, Conners, Vineland,
  CBCL, ASQ-3, GMFCS, etc.) aparecem como **referência catalogada com proveniência**
  (nome oficial, licença, link à fonte) — **não** são reproduzidos nem aplicados.
- Os instrumentos **autorais** do Dr. Jadson são **triagem não normatizada**; não
  substituem escala normatizada.

### Laudos / documentos
- Documentos gerados são de **DEMONSTRAÇÃO / organização**, exibem aviso destacado
  de **SEM validade jurídica** e **NÃO** possuem assinatura digital ICP-Brasil.
- O hash interno é identificador técnico, **não** assinatura jurídica.

### Sincronização em nuvem / Backend
- Opcional e **desligada por padrão**. Sem criptografia adicional além do TLS quando
  configurada.
- O domínio público (GitHub Pages) **não executa** Pages Functions; endpoints `/api/*`
  não estão ativos lá.

### Service Worker
- Cacheia o shell estático para offline; **não** deve armazenar dados clínicos
  sensíveis em rotas privadas.

---

## Conformidade LGPD — status honesto
- ✅ Informação ao titular + **consentimento** na entrada.
- ✅ **Portabilidade** (exportar) e **eliminação** (apagar) a pedido do titular.
- ✅ Aviso de natureza educativa/triagem não normatizada.
- ⏳ **Pendente (organizacional, não resolvível só no front):** base legal documentada,
  política de retenção, encarregado (DPO), RIPD, e segurança server-side com auditoria.
- **Conclusão:** adequado para uso **educativo/triagem com consentimento**; **não**
  substitui um prontuário eletrônico regulado nem dispensa as pendências acima para
  operação clínica formal.

---

## Para quem esta versão SERVE
- Famílias buscando **triagem orientadora** antes de procurar especialista (com consentimento).
- Escolas e equipes terapêuticas usando como **referência** educativa.
- Apresentação institucional do Dr. Jadson (CRM-PE 25227, RQE 17756).

## Para quem esta versão NÃO SERVE (ainda)
- Substituir avaliação/diagnóstico médico.
- Prontuário eletrônico seguro multiusuário / rotina clínica com vários profissionais.
- Emissão de **laudo com validade jurídica**.
- Telemedicina (exige WebRTC + consentimento + registro + CFM 2.314/2022).

---

## Documentação relacionada
- `PRIVACY_AND_LGPD.md` — documento jurídico de privacidade
- `SECURITY.md` — controles antes de aceitar dados reais em rotina
- `GO_LIVE_CHECKLIST.md` — checklist antes do primeiro paciente em rotina formal
- `ARCHITECTURE.md` — direção do produto
