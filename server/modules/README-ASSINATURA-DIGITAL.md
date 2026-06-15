# SuperNeuroPed - Assinatura Digital P12

Módulos para geração de **laudos neuropediátricos** e **receitas especiais** com assinatura digital usando certificado P12 (ICP-Brasil).

## 📋 Arquivos Criados

### 1. `laudo-generator.js`
Gerador de laudos neuropediátricos em PDF
- Gera laudos profissionais com dados estruturados
- Suporte a prescrições, diagnósticos e descrições clínicas
- Integração com assinatura P12

**Uso:**
```javascript
const LaudoGenerator = require('./laudo-generator');

const gerador = new LaudoGenerator('./certificado.p12', 'sua_senha');

const dados = {
  nome: 'Alana Cristina Batista da Conceição Santos',
  idade: '14 anos e 3 meses',
  sexo: 'Feminino',
  localidade: 'Petrolina/PE',
  diagnosticos: [
    'TEA com necessidade substancial de suporte',
    'TDAH apresentação desatenta',
    'Transtorno do Desenvolvimento Intelectual leve',
    'Obesidade Grau I'
  ],
  descricaoClinica: 'Descrição clínica do paciente...',
  prescricoes: [
    {
      medicamento: 'LISDEXANFETAMINA 70 MG',
      descricao: 'Tomar 1 cápsula pela manhã'
    }
  ],
  medico: {
    nome: 'Dr. Jadson Fraga Araújo Júnior',
    especialidade: 'Neurologista Infantil',
    crm: '25.227',
    rqe: '17.756'
  }
};

// Gerar laudo
await gerador.gerarLaudo(dados, './laudo_assinado.pdf');

// Assinar
await gerador.assinarPDF('./laudo_assinado.pdf', './laudo_final.pdf');
```

### 2. `receita-generator.js`
Gerador de receitas especiais (C1, A3, etc)
- Receitas manipuladas
- Receitas com medicamentos controlados
- Validação de dados obrigatórios

**Uso:**
```javascript
const ReceitaGenerator = require('./receita-generator');

const gerador = new ReceitaGenerator('./certificado.p12', 'sua_senha');

const dados = {
  tipoReceita: 'ESPECIAL C1',
  paciente: {
    nome: 'Paula Lys',
    cpf: '123.456.789-00',
    idade: '35 anos'
  },
  medico: {
    nome: 'Dr. Jadson Fraga',
    crm: '25.227',
    rqe: '17.756'
  },
  viaAdministracao: 'Uso oral',
  formula: [
    { componente: 'L-triptofano', dosagem: '1000–2000 mg' },
    { componente: 'Valeriana', dosagem: '300–500 mg' },
    { componente: 'Passiflora', dosagem: '300–500 mg' }
  ],
  excipiente: '1 cápsula',
  numeroDoses: '15 cápsulas',
  posologia: 'Tomar 1 cápsula à noite, 30–60 minutos antes de deitar'
};

// Validar
const validacao = gerador.validarReceita(dados);
if (validacao.valido) {
  // Gerar
  await gerador.gerarReceita(dados, './receita.pdf');
  // Assinar
  await gerador.assinarReceita('./receita.pdf', './receita_assinada.pdf');
}
```

### 3. `signature-service.js`
Serviço centralizado de assinatura digital
- Validação de certificado P12
- Assinatura com timestamp
- Verificação de integridade de documentos
- Integração com OpenSSL

**Uso:**
```javascript
const SignatureService = require('./signature-service');

const signature = new SignatureService('./certificado.p12', 'sua_senha');

// Assinar com timestamp
const assinatura = await signature.assinarComTimestamp(
  './documento.pdf',
  './documento.sig'
);

// Verificar integridade
const verificacao = await signature.verificarAssinatura(
  './documento.pdf',
  './documento.sig'
);

if (verificacao.valido) {
  console.log('✓ Documento íntegro');
} else {
  console.log('⚠ Aviso: Documento foi modificado');
}
```

## 🔐 Requisitos

### Dependências Node.js
```bash
npm install pdfkit
npm install cryptography  # ou usar crypto nativo
```

### Certificado P12
- Deve estar em formato PKCS#12 (.p12 ou .pfx)
- Válido e emitido por AC ICP-Brasil

### Para assinatura avançada (opcional)
```bash
npm install node-pkcs11    # Para PKCS#11
apt install openssl        # Para assinatura via CLI
```

## 📝 Estrutura de Dados

### Laudo Neuropediátrico
```javascript
{
  nome: string,                    // Nome do paciente
  idade: string,                   // Ex: "14 anos e 3 meses"
  sexo: 'Masculino' | 'Feminino',
  localidade: string,
  diagnosticos: string[],          // Array de diagnósticos
  descricaoClinica: string,        // Descrição do quadro clínico
  prescricoes: [                   // Array de medicamentos
    {
      medicamento: string,
      descricao: string
    }
  ],
  medico: {
    nome: string,
    especialidade: string,
    crm: string,
    rqe: string
  }
}
```

### Receita Especial
```javascript
{
  tipoReceita: string,             // Ex: "ESPECIAL C1"
  paciente: {
    nome: string,
    cpf: string,
    idade: string
  },
  medico: {
    nome: string,
    crm: string,
    rqe: string
  },
  viaAdministracao: string,        // Ex: "Uso oral"
  formula: [                       // Componentes da fórmula
    {
      componente: string,
      dosagem: string
    }
  ],
  excipiente: string,
  numeroDoses: string,
  posologia: string,
  observacoes?: string
}
```

## ⚠️ Notas Importantes

### Assinatura Digital
- **Placeholder atual**: Gera arquivo `.sig` com metadados
- **Para assinatura real** em ambiente de produção:
  1. Usar bibliotecas especializadas como **pyHanko** (Python)
  2. Integrar com **OpenSSL** via CLI
  3. Usar **PKCS#11** com drivers da AC certificadora
  4. Implementar **timestamp** com servidor autorizado

### Validação Legal
- Documentos gerados seguem RDC ANVISA 970/2025
- Receitas especiais precisam de notificação conforme Portaria SVS/MS 344/98
- Certificado deve estar registrado na CNJ (Conselho Nacional de Justiça)

### Segurança
- **NUNCA** armazene senha do certificado em código
- Use variáveis de ambiente: `process.env.CERT_PASSWORD`
- Implemente rate-limiting e auditoria de assinaturas
- Criptografe arquivos `.sig` em armazenamento

## 🔧 Integração com API Express

```javascript
const express = require('express');
const LaudoGenerator = require('./laudo-generator');
const ReceitaGenerator = require('./receita-generator');

const app = express();

app.post('/api/laudo/gerar', async (req, res) => {
  try {
    const gerador = new LaudoGenerator(
      process.env.CERT_P12_PATH,
      process.env.CERT_PASSWORD
    );
    
    const pdfPath = await gerador.gerarLaudo(
      req.body,
      `/tmp/laudo_${Date.now()}.pdf`
    );
    
    res.download(pdfPath);
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

app.post('/api/receita/gerar', async (req, res) => {
  try {
    const gerador = new ReceitaGenerator(
      process.env.CERT_P12_PATH,
      process.env.CERT_PASSWORD
    );
    
    const validacao = gerador.validarReceita(req.body);
    if (!validacao.valido) {
      return res.status(400).json({ erros: validacao.erros });
    }
    
    const pdfPath = await gerador.gerarReceita(
      req.body,
      `/tmp/receita_${Date.now()}.pdf`
    );
    
    res.download(pdfPath);
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

app.listen(3000, () => console.log('API rodando na porta 3000'));
```

## 📚 Referências

- [RDC ANVISA 970/2025](https://www.in.gov.br)
- [Portaria SVS/MS 344/98](https://www.in.gov.br)
- [ICP-Brasil](https://www.iti.gov.br)
- [PDFKit Documentation](http://pdfkit.org)
- [OpenSSL SMIME](https://www.openssl.org)

## 👨‍⚕️ Autor

**Dr. Jadson Fraga Araújo Júnior**
- Neurologista Infantil · Neuropediatra
- CRM-PE 25.227 · RQE 17.756
- Email: medicina119@gmail.com

---

**Última atualização**: 12 de junho de 2026
**Versão**: 1.0
