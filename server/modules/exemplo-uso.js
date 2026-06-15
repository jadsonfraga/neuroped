/**
 * SuperNeuroPed - Exemplo de Uso
 * Demonstra como usar os módulos de geração de laudos e receitas
 */

const LaudoGenerator = require('./laudo-generator');
const ReceitaGenerator = require('./receita-generator');
const SignatureService = require('./signature-service');

// ============================================
// EXEMPLO 1: Gerar Laudo
// ============================================

async function exemploGerarLaudo() {
  console.log('📋 Exemplo 1: Gerando Laudo Neuropediátrico...\n');

  try {
    // Inicializar gerador
    // NOTA: Substitua pelos caminhos reais do seu certificado
    const gerador = new LaudoGenerator(
      './certificados/drjadson.p12',
      process.env.CERT_PASSWORD || 'sua_senha_aqui'
    );

    // Dados do paciente (compatíveis com o template real)
    const dadosPaciente = {
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
      descricaoClinica: `Alana Cristina Batista da Conceição Santos tem 14 anos e 3 meses e mora em Petrolina/PE.
      Chega à consulta acompanhada pela família, que a descreve como uma menina de comunicação predominantemente
      literal, de afeto seletivo e de rotinas firmes. Alguém que, quando o ambiente é previsível, se organiza
      melhor do que o esperado pelo peso dos diagnósticos, mas que se desorganiza rapidamente quando a agenda se quebra.`,
      prescricoes: [
        {
          medicamento: 'LISDEXANFETAMINA 70 MG — LISTA A3',
          descricao: 'Tomar 1 cápsula pela manhã, após o café. Indicada para manejo dos sintomas atencionais e executivos. Requere Notificação de Receita A conforme Portaria SVS/MS 344/98.'
        },
        {
          medicamento: 'LEVOMEPROMAZINA 25 MG — LISTA C1',
          descricao: 'Tomar 1 comprimido às 19h. Para reduzir irritabilidade vespertina, facilitar repouso noturno e modular agitação comportamental. Requere Receita de Controle Especial C1.'
        }
      ],
      medico: {
        nome: 'Dr. Jadson Fraga Araújo Júnior',
        especialidade: 'Neurologista Infantil · Neuropediatra',
        crm: '25.227',
        rqe: '17.756'
      }
    };

    // Gerar PDF
    const caminhoLaudo = './output/laudo_alana.pdf';
    const resultado = await gerador.gerarLaudo(dadosPaciente, caminhoLaudo);
    console.log(`✓ Laudo gerado: ${resultado}`);

    // Assinar com P12
    const caminhoAssinado = './output/laudo_alana_assinado.pdf';
    const assinatura = await gerador.assinarPDF(caminhoLaudo, caminhoAssinado);
    console.log(`✓ Assinado: ${assinatura.pdfPath}`);
    console.log(`✓ Arquivo de assinatura: ${assinatura.sigPath}`);
    console.log(`✓ Hash: ${assinatura.metadata.hash}\n`);

    return caminhoAssinado;
  } catch (error) {
    console.error(`✗ Erro: ${error.message}\n`);
  }
}

// ============================================
// EXEMPLO 2: Gerar Receita Especial
// ============================================

async function exemploGerarReceita() {
  console.log('💊 Exemplo 2: Gerando Receita Especial C1...\n');

  try {
    const gerador = new ReceitaGenerator(
      './certificados/drjadson.p12',
      process.env.CERT_PASSWORD || 'sua_senha_aqui'
    );

    // Dados da receita (conforme template real)
    const dadosReceita = {
      tipoReceita: 'ESPECIAL C1',
      paciente: {
        nome: 'Paula Lys',
        cpf: '123.456.789-00',
        idade: '35 anos'
      },
      medico: {
        nome: 'Dr. Jadson Fraga Araújo Júnior',
        especialidade: 'Neurologista Infantil',
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
      modoDeFazer: 'Colocar os componentes em cápsula',
      posologia: 'Tomar 1 cápsula à noite, 30–60 minutos antes de deitar',
      observacoes: 'Não associar com bebidas alcoólicas. Manter em local fresco e seco.'
    };

    // Validar
    const validacao = gerador.validarReceita(dadosReceita);
    console.log(`✓ Validação: ${validacao.valido ? 'OK' : 'ERRO'}`);

    if (!validacao.valido) {
      console.log('  Erros:');
      validacao.erros.forEach(erro => console.log(`  - ${erro}`));
      return;
    }

    // Gerar PDF
    const caminhoReceita = './output/receita_paula.pdf';
    const resultado = await gerador.gerarReceita(dadosReceita, caminhoReceita);
    console.log(`✓ Receita gerada: ${resultado}`);

    // Assinar
    const caminhoAssinado = './output/receita_paula_assinada.pdf';
    const assinatura = await gerador.assinarReceita(caminhoReceita, caminhoAssinado);
    console.log(`✓ Assinado: ${assinatura.pdfPath}`);
    console.log(`✓ Hash: ${assinatura.metadata.hash}\n`);

    return caminhoAssinado;
  } catch (error) {
    console.error(`✗ Erro: ${error.message}\n`);
  }
}

// ============================================
// EXEMPLO 3: Verificar Assinatura
// ============================================

async function exemploVerificarAssinatura() {
  console.log('🔍 Exemplo 3: Verificando Integridade de Assinatura...\n');

  try {
    const signature = new SignatureService(
      './certificados/drjadson.p12',
      process.env.CERT_PASSWORD || 'sua_senha_aqui'
    );

    // Verificar documento
    const resultado = await signature.verificarAssinatura(
      './output/laudo_alana_assinado.pdf',
      './output/laudo_alana_assinado.pdf.sig'
    );

    console.log(`✓ Documento íntegro: ${resultado.documentoIntegro}`);
    console.log(`✓ Data da assinatura: ${resultado.dataAssinatura}`);
    console.log(`✓ Status: ${resultado.mensagem}\n`);

    return resultado.valido;
  } catch (error) {
    console.error(`✗ Erro: ${error.message}\n`);
  }
}

// ============================================
// EXEMPLO 4: Informações do Certificado
// ============================================

async function exemploInfoCertificado() {
  console.log('📜 Exemplo 4: Informações do Certificado...\n');

  try {
    const signature = new SignatureService(
      './certificados/drjadson.p12',
      process.env.CERT_PASSWORD || 'sua_senha_aqui'
    );

    const info = await signature.exportarCertificadoInfo();
    console.log('Certificado P12:');
    Object.entries(info).forEach(([chave, valor]) => {
      console.log(`  ${chave}: ${valor}`);
    });
    console.log('');

    return info;
  } catch (error) {
    console.error(`✗ Erro: ${error.message}\n`);
  }
}

// ============================================
// EXECUTAR EXEMPLOS
// ============================================

async function executarExemplos() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('    SuperNeuroPed - Exemplos de Uso');
  console.log('    Geração de Laudos e Receitas com Assinatura P12');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Criar diretório de output se não existir
  const fs = require('fs');
  if (!fs.existsSync('./output')) {
    fs.mkdirSync('./output', { recursive: true });
  }

  // NOTA: Estes exemplos usam caminhos de certificado fictícios
  // Em produção, substitua pelos caminhos reais e certifique-se de que:
  // 1. O arquivo P12 existe
  // 2. A senha está correta
  // 3. O certificado é válido e registrado na ICP-Brasil

  console.log('⚠️  NOTA: Estes são exemplos de demonstração.');
  console.log('   Para usar em produção:');
  console.log('   1. Coloque seu certificado P12 em ./certificados/');
  console.log('   2. Configure a variável de ambiente CERT_PASSWORD');
  console.log('   3. Instale as dependências: npm install pdfkit\n');

  // try {
  //   await exemploGerarLaudo();
  //   await exemploGerarReceita();
  //   await exemploInfoCertificado();
  //   await exemploVerificarAssinatura();
  // } catch (error) {
  //   console.error('Erro durante execução dos exemplos:', error);
  // }

  console.log('✓ Exemplos carregados com sucesso!');
  console.log('  Para executar, descomente as linhas no final deste arquivo.\n');
}

// Executar se for chamado direto
if (require.main === module) {
  executarExemplos().catch(console.error);
}

module.exports = {
  exemploGerarLaudo,
  exemploGerarReceita,
  exemploVerificarAssinatura,
  exemploInfoCertificado
};
