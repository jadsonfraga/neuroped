# Pacote 01 — integração autoral

Fonte: quatro PDFs em branco fornecidos na conversa. AFI-12: 5–17 anos, dois domínios (6+6); SDRD-12: 3–17 anos, três domínios (4+4+4); SARF-12: 2–14 anos, três domínios (4+4+4). Todas usam janela de 7 dias e 12 itens de 0–3. As idades máximas em meses incluem todo o último ano sugerido: 215, 215 e 179.

A redação foi extraída dos PDFs atuais, não reconstruída de resumos. Os SHA-256 originais estão em cada registro. Os quatro PDFs foram enviados como anexos para jadsonfraga@hotmail.com; mensagem Gmail confirmada por leitura da pasta Enviados: 1a072cdcc707a550. A confirmação é de envio, não de leitura pelo destinatário.

## Implementação

`authorialMonitoring.json` é a fonte única de itens e metadados. O adaptador alimenta o catálogo/filtro e as aplicações interativas existentes. A composição histórica chamada Drive passa a incluir este lote sem atribuir falsa proveniência Drive aos registros. Futuras entradas neste contrato atualizam ambas as superfícies sem manter listas paralelas de itens.

Nenhum instrumento é declarado validado ou clinicamente revisado. Não há percentis, equivalência com teste licenciado, ponto de corte diagnóstico ou faixas artificiais de gravidade. Uma única etiqueta descritiva se aplica a toda a soma. O formulário exige respostas completas; dado não observado não deve ser imputado como zero. Alertas clínicos são independentes do total.

## Evidências e limites

Validação local: 36 itens, mapeamento dos três instrumentos, domínios originais, transpilação sintática TypeScript e rejeição de entradas inválidas. O clone por rede não estava disponível; não foi alegada execução local da suíte integral. A CI adicionada executa o filtro real, soma mínima/máxima, limites etários, respondentes, tipos, testes existentes e build. Publicação somente após checks e merge; Cloudflare é canônico, Vercel espelha o mesmo produto.

O envio recorrente exige execução e credencial de transporte fora desta conversa; memorizar a preferência não ativa uma automação. Não foi alterada a regra de revisão do inventário diário existente.

## Rollback

Reverter o commit deste lote por PR. Não há migração de banco, exclusão de dados, mudança de autenticação ou alteração de registros de pacientes. Não remover respostas já arquivadas; preservar proveniência dos IDs/versionamentos.
