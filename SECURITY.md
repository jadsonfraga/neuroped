# Política de Segurança

## Reporte de vulnerabilidades

Levamos a segurança do NeuroPed EDJ muito a sério, especialmente por se tratar de uma ferramenta clínica que pode envolver dados pessoais de pacientes em conformidade com a LGPD.

### Como reportar

Caso identifique uma vulnerabilidade de segurança, **NÃO abra issue pública no GitHub**. Use um dos canais abaixo para divulgação responsável:

- **WhatsApp**: (87) 9 9109-7371 — mensagem privada com a descrição do problema
- **Endereço postal**: Rua Raimundo Lacerda, 001 — São José, Petrolina/PE — CEP 56302-470

### O que esperar

Comprometemo-nos com o processo de divulgação responsável:

| Etapa | Prazo |
|-------|-------|
| Confirmação de recebimento | 72 horas |
| Avaliação inicial e classificação | 7 dias |
| Patch para vulnerabilidades críticas | 14 dias |
| Patch para vulnerabilidades altas | 30 dias |
| Patch para vulnerabilidades médias/baixas | 90 dias |
| Período de confidencialidade antes da divulgação pública | 90 dias após patch |

### Escopo

Considere problema de segurança qualquer condição que possa:

- Permitir acesso não autorizado a dados de pacientes
- Comprometer a integridade de cálculos clínicos (doses, scores)
- Permitir falsificação de laudos ou QR/hash
- Bypass dos controles de privacidade LGPD
- Cross-site scripting (XSS), CSRF ou injeção
- Vazamento de informação por logs, headers ou cookies
- Bibliotecas de terceiros com CVEs ativas

### Fora do escopo

- Bugs cosméticos sem impacto de segurança
- Engenharia social
- Negação de serviço (DoS) por força bruta
- Vulnerabilidades em componentes de terceiros já reportadas e em janela de patch

### Reconhecimento

Pesquisadores que reportarem vulnerabilidades válidas e seguirem este processo de divulgação responsável serão reconhecidos publicamente (com seu consentimento) na seção de agradecimentos do CHANGELOG, após a publicação do patch.

## Versões com suporte de segurança

| Versão | Suporte |
|--------|---------|
| Atual (main) | Sim |
| Anteriores | Não |

## Conformidade

- **LGPD** — Lei 13.709/2018 (Lei Geral de Proteção de Dados)
- **CFM** — Resolução 2.314/2022 (Telemedicina) e Código de Ética Médica
- **OWASP** — práticas Top 10 aplicadas

---

Documento atualizado em 2026-05-07.
