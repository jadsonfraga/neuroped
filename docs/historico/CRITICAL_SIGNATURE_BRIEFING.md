# CRITICAL — Briefing técnico-jurídico sobre Assinatura Digital

**Dr. Jadson, leia isto antes de eu prosseguir.**

Você pediu assinatura digital real verificável. Isso é tecnicamente fazível, mas exige decisões suas que afetam custo, fluxo de trabalho e validade jurídica. Estou pausando o avanço cego para te dar a verdade.

---

## 1. O que "assinatura digital verificável" significa no Brasil

Existem 3 níveis de assinatura eletrônica conforme **Lei 14.063/2020** + **MP 2.200-2/2001**:

| Nível | Exemplo | Validade jurídica | Verificável por terceiro? |
|---|---|---|---|
| **Simples** | Login/senha, marca d'água, foto da assinatura | Limitada — depende de prova adicional | Não |
| **Avançada** | Assinatura criptográfica não-ICP, identidade vinculada a método confiável | Boa para contratos privados, exames, atestados não-críticos | Parcial — depende do provedor |
| **Qualificada (ICP-Brasil)** | A1/A3 com certificado emitido por AC credenciada | **Equivale a assinatura à mão**, presume-se autêntica | Sim — verificável publicamente |

**Para documentos médicos** (laudos, atestados, receitas, pedidos de exame):
- **Receita médica** → CFM exige assinatura **qualificada ICP-Brasil** (Resolução CFM 1.821/2007 + 2.299/2021)
- **Atestado** → recomendável qualificada
- **Laudo** → qualificada para validade plena
- **Pedido de exame** → varia, mas qualificada é o padrão seguro

> Conclusão: você precisa de **ICP-Brasil qualificada**, não "assinatura eletrônica simples".

---

## 2. Tipos de certificado ICP-Brasil

| Tipo | Onde fica | Como assina | Custo aproximado |
|---|---|---|---|
| **A1** | Arquivo `.pfx`/`.p12` no disco | Software lê o arquivo + senha | R$ 100–200/ano |
| **A3** | Cartão inteligente ou token USB | Drivers PKCS#11 + leitor físico | R$ 300–600 (validade 3 anos) |
| **A3 em nuvem** | HSM do provedor | API REST + OTP | R$ 200–500/ano + por assinatura |

Você tem A1, A3 físico, A3 em nuvem ou ainda não tem?

---

## 3. Onde a assinatura é feita tecnicamente

### Opção 1 — Assinatura no navegador
- **A1**: tecnicamente possível com `node-forge` ou Web Crypto, MAS **expor a senha do .pfx no frontend é falha de segurança grave**
- **A3 físico**: exige plugin do navegador (BSP — Brazil Signing Plugin), driver PKCS#11. Funciona, mas UX ruim
- **Verdict:** **não recomendado**

### Opção 2 — Assinatura no servidor com .pfx em segredo
- A1 (`certificado.pfx`) armazenado como **secret no Cloudflare Pages Functions** ou Supabase
- Senha do certificado em variável de ambiente
- Cada assinatura: backend lê o arquivo, assina o PDF, devolve
- Vantagens: simples, controlável por mim, sem dependência de terceiro
- Riscos: você precisa manter o arquivo .pfx seguro; rotação anual; senha forte
- **Esta é a opção mais pragmática e que recomendo**

### Opção 3 — Provedor de assinatura em nuvem (Bry, Vault ID, Validcertif, Soluti)
- Você cadastra o certificado no provedor (uma vez)
- App chama API REST do provedor; assinatura é executada no HSM deles
- Provedor cobra por assinatura (R$ 1–3 cada)
- Vantagem: você não gerencia o arquivo; eles cuidam de rotação, backup, validação
- Desvantagem: dependência de terceiro; custo recorrente
- **Recomendado se você quer escalar para muitos médicos depois**

---

## 4. Formato da assinatura no PDF

Para ser **verificável por qualquer um com internet**, o PDF assinado precisa ser:

- **PAdES** (PDF Advanced Electronic Signatures) — padrão europeu, aceito no Brasil
- **PAdES-B** (básica) ou **PAdES-LTA** (com timestamp + longevidade)
- Recomendo **PAdES-LTA** para laudos médicos: válido por 30+ anos, contém o certificado + timestamp de autoridade

A verificação por terceiro acontece automaticamente em:
- Adobe Reader (verifica ICP-Brasil nativamente)
- VALIDAR.iti.gov.br (verificador oficial brasileiro)
- Sua própria página `/verificar?doc=<hash>` (vou construir)

---

## 5. O que eu posso fazer AGORA, sem você decidir

1. ✅ Construir o **schema Supabase** com tabelas `documents`, `signatures`, `audit_log`
2. ✅ Construir as **Cloudflare Pages Functions** com endpoint `/api/sign/<doc_id>` (scaffold que aceita futura integração)
3. ✅ Construir a **página pública de verificação** `/verificar/<hash>` que valida assinatura quando existir
4. ✅ Construir o **fluxo do médico**: cria laudo → escolhe "Assinar agora" → backend processa
5. ✅ Construir o **registro de auditoria** de cada assinatura
6. ✅ Corrigir os bugs identificados
7. ✅ Tudo isso pronto para "plugar" a opção 2 ou opção 3 depois

## 6. O que eu PRECISO de você para ativar assinatura real

Por opção escolhida:

### Se você escolher opção 2 (.pfx no Cloudflare):
1. Arquivo `certificado.pfx` ou `certificado.p12` (formato PKCS#12)
2. Senha do certificado (em variável de ambiente segura)
3. Validade do certificado e data de expiração
4. Confirmação de que você tem ICP-Brasil A1 emitido por AC credenciada

### Se você escolher opção 3 (provedor em nuvem):
1. Conta criada em Bry / Vault ID / Validcertif / Soluti
2. API Key
3. ID do certificado no provedor
4. Cadastro do método de autenticação (OTP/PIN)

---

## 7. Documentos que vou habilitar para assinatura

| Documento | Status atual | Após sua autorização |
|---|---|---|
| Laudo neuropediátrico | Modelo PDF com carimbo DEMO | PAdES-LTA assinado |
| Atestado médico | Não existe ainda | Modelo + assinatura |
| Pedido de exame | Não existe ainda | Modelo + assinatura |
| Receita simples | Não existe ainda | Modelo + assinatura |
| Receita controlada | **Bloqueado** — exige certificação digital + receita branca/azul oficial | Avaliar separadamente |
| Declaração / orientação | Não existe ainda | Modelo + assinatura |
| Devolutiva de escala | Modelo PDF com carimbo DEMO | PAdES assinado |

---

## 8. Aviso jurídico que eu vou colocar em CADA documento assinado

> "Documento eletrônico assinado digitalmente nos termos da MP 2.200-2/2001 e Lei 14.063/2020. Certificado ICP-Brasil emitido por [AC]. Validade verificável em https://neuroped.app/verificar/[hash] ou em https://validar.iti.gov.br/"

---

## 9. Minha recomendação final

**Vai de opção 2** (A1 em segredo no Cloudflare):
- Você mantém controle total
- Custo: só o do certificado (R$ 100–200/ano)
- UX: você loga, clica "Assinar", PDF sai assinado
- Backup: você guarda o .pfx em local seguro adicional

**Próxima ação sua:**
1. Confirma que escolhe opção 2
2. Diz se já tem A1 ou precisa emitir
3. Me passa por canal seguro o caminho do .pfx (não cole aqui no chat)

**Enquanto isso eu vou:**
- Construir TODO o resto: schema, functions, UI, verificação
- Implementar a integração com placeholder do certificado
- Deixar pronto para "plug-and-play" assim que você confirmar

Vamos seguir?
