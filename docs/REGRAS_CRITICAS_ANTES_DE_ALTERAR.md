# ANEXO OBRIGATÓRIO — REGRAS CRÍTICAS ANTES DE QUALQUER ALTERAÇÃO

Antes de iniciar qualquer melhoria no NeuroPed EDJ, obedecer estas regras.

---

## 1. Fluxo de PIN master

- Em toda área protegida, primeiro sempre oferecer campo de PIN.
- Nunca mostrar “voltar para conteúdo educacional” antes da tentativa de PIN.
- Se o PIN estiver correto: abrir a aba solicitada.
- Se o PIN estiver errado: aí sim mostrar “tentar novamente” e “voltar para conteúdo educacional”.
- O PIN deve aceitar letras e números.
- Não forçar teclado numérico.
- Não limpar letras do PIN.
- Não redirecionar área protegida direto para página bloqueada.

### Critério de aceite

Clique em Secretaria, Consulta, Prontuário, Prescrições, Laudos, Documentos ou área sensível:

1. aparece tela de PIN;
2. permite digitar PIN alfanumérico;
3. se correto, abre;
4. se errado, aparece voltar.

---

## 2. Segurança realista

- Não tratar PIN frontend como segurança real de produção.
- Documentar que PIN frontend é controle de interface.
- Para produção real: autenticação, backend, sessão segura, RLS, logs e criptografia.
- Nunca colocar service_role key, API key privada ou segredo no frontend.
- Nunca armazenar dados clínicos reais em localStorage sem criptografia e política clara.

---

## 3. Service Worker

- Não cachear dados sensíveis.
- Cachear apenas assets estáticos e páginas públicas/estruturais.
- Versionar cache a cada mudança relevante.
- Remover caches antigos no activate.
- Garantir botão ou fluxo de atualização do app.

---

## 4. Documentos médicos

- Prescrição e laudos podem ter editor livre, copiar, imprimir e salvar rascunho local.
- Não sugerir medicação, dose ou conduta automaticamente.
- Não gerar prescrição automática.
- O texto final deve ser responsabilidade médica.
- Cabeçalho institucional pode ser incluído.

---

## 5. Família

- Portal da família deve ter navegação livre para conteúdo educativo.
- Áreas sensíveis não devem abrir para família.
- Passe familiar pode liberar conteúdo não sensível por prazo definido.
- Passe familiar não libera prontuário, laudos, prescrições, documentos, chat clínico ou dados de outros pacientes.

---

## 6. Backend / memória / embeddings

- Se Cloudflare, D1, Vectorize, Supabase ou pgvector não estiverem configurados, não fingir que estão.
- Criar fallback textual honesto.
- Retornar status:

```json
{
  "semanticSearchStatus": "not_configured"
}
```

- Não enviar dados reais para embeddings sem consentimento, anonimização quando possível, base legal e auditoria.

---

## 7. Merge e deploy

- Não fazer merge automático.
- Não alterar main sem instrução explícita, se estiver em branch local.
- Fazer commits pequenos.
- Documentar cada mudança.
- Rodar build/lint/test se existirem.
- Se não existirem testes, criar auditoria mínima navegável.

---

## 8. Critério de “pronto”

Só declarar pronto se:

- rota abre;
- botão funciona;
- fluxo foi testado;
- não há erro crítico evidente;
- cache foi versionado;
- documentação foi atualizada;
- riscos restantes foram declarados.

---

## Regra de prioridade

Se houver conflito entre melhorar visual e preservar segurança/funcionamento, priorizar segurança e funcionamento. Estética nunca deve quebrar fluxo clínico, PIN, cache, dados ou navegação.
