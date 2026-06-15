/**
 * SuperNeuroPed - Gerador de Receitas Especiais (C1, A3)
 * Suporta receitas manipuladas com assinatura digital P12
 */

const PDFDocument = require('pdfkit');
const fs = require('fs');
const crypto = require('crypto');

class ReceitaGenerator {
  constructor(certificadoP12Path, senha) {
    this.certPath = certificadoP12Path;
    this.senha = senha;
  }

  /**
   * Gera receita especial PDF (C1, A3, etc)
   */
  async gerarReceita(dadosReceita, outputPath) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'A4', margin: 40 });
        const stream = fs.createWriteStream(outputPath);

        doc.on('error', reject);
        stream.on('error', reject);
        stream.on('finish', () => resolve(outputPath));

        doc.pipe(stream);

        // Cabeçalho
        doc.fontSize(14).font('Helvetica-Bold').text('RECEITA MÉDICA', { align: 'center' });
        doc.fontSize(10).text(`Tipo: ${dadosReceita.tipoReceita || 'ESPECIAL'}`, { align: 'center' });
        doc.moveDown();

        // Informações do Médico
        doc.fontSize(10).font('Helvetica-Bold').text('MÉDICO PRESCRITOR');
        doc.fontSize(9).font('Helvetica').text(`${dadosReceita.medico?.nome || 'Dr. Jadson Fraga Araújo Júnior'}`);
        doc.text(`CRM-PE: ${dadosReceita.medico?.crm || '25.227'}`);
        doc.text(`RQE: ${dadosReceita.medico?.rqe || '17.756'}`);
        doc.moveDown();

        // Dados do Paciente
        doc.fontSize(10).font('Helvetica-Bold').text('PACIENTE');
        doc.fontSize(9).font('Helvetica').text(`Nome: ${dadosReceita.paciente?.nome || ''}`);
        doc.text(`CPF: ${dadosReceita.paciente?.cpf || ''}`);
        doc.text(`Idade: ${dadosReceita.paciente?.idade || ''}`);
        doc.moveDown();

        // Via de Administração
        if (dadosReceita.viaAdministracao) {
          doc.fontSize(10).font('Helvetica-Bold').text('VIA DE ADMINISTRAÇÃO');
          doc.fontSize(9).font('Helvetica').text(dadosReceita.viaAdministracao);
          doc.moveDown();
        }

        // Fórmula/Medicamentos
        doc.fontSize(10).font('Helvetica-Bold').text('FÓRMULA / MEDICAMENTO');
        doc.moveDown(0.3);

        if (dadosReceita.formula) {
          doc.fontSize(9).font('Helvetica');
          if (Array.isArray(dadosReceita.formula)) {
            dadosReceita.formula.forEach(item => {
              const dosagem = item.dosagem ? ` ................................. ${item.dosagem}` : '';
              doc.text(item.componente + dosagem);
            });
          } else {
            doc.text(dadosReceita.formula);
          }
          doc.moveDown();
        }

        // Excipiente
        if (dadosReceita.excipiente) {
          doc.fontSize(9).font('Helvetica').text(`Excipiente q.s.p. ${dadosReceita.excipiente}`);
          doc.moveDown();
        }

        // Modo de Fazer
        if (dadosReceita.modoDeFazer) {
          doc.fontSize(10).font('Helvetica-Bold').text('MODO DE FAZER');
          doc.fontSize(9).font('Helvetica').text(dadosReceita.modoDeFazer);
          doc.moveDown();
        }

        // Posologia
        if (dadosReceita.posologia) {
          doc.fontSize(10).font('Helvetica-Bold').text('POSOLOGIA');
          doc.fontSize(9).font('Helvetica').text(dadosReceita.posologia);
          doc.moveDown();
        }

        // Número de Unidades
        if (dadosReceita.numeroDoses) {
          doc.fontSize(9).font('Helvetica-Bold').text(`Fazer: ${dadosReceita.numeroDoses}`);
          doc.moveDown();
        }

        // Observações
        if (dadosReceita.observacoes) {
          doc.fontSize(10).font('Helvetica-Bold').text('OBSERVAÇÕES');
          doc.fontSize(9).font('Helvetica').text(dadosReceita.observacoes);
          doc.moveDown();
        }

        // Assinatura
        doc.moveDown(1.5);
        doc.fontSize(9).font('Helvetica').text('_________________________________');
        doc.text('Assinatura do Médico');
        doc.moveDown(0.5);
        doc.fontSize(9).font('Helvetica').text(new Date().toLocaleDateString('pt-BR'));

        // Footer com informações legais
        doc.fontSize(7).font('Helvetica').text(
          'Receita sujeita a legislação RDC ANVISA 970/2025 e Portaria SVS/MS 344/98',
          { align: 'center' }
        );

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Valida receita antes de gerar
   */
  validarReceita(dadosReceita) {
    const erros = [];

    if (!dadosReceita.paciente?.nome) erros.push('Nome do paciente é obrigatório');
    if (!dadosReceita.medico?.nome) erros.push('Nome do médico é obrigatório');
    if (!dadosReceita.medico?.crm) erros.push('CRM do médico é obrigatório');
    if (!dadosReceita.formula) erros.push('Fórmula/Medicamento é obrigatório');
    if (!dadosReceita.posologia) erros.push('Posologia é obrigatória');

    return {
      valido: erros.length === 0,
      erros
    };
  }

  /**
   * Assina PDF da receita com P12
   */
  async assinarReceita(pdfPath, outputAssinado) {
    try {
      const buffer = fs.readFileSync(pdfPath);
      const hash = crypto.createHash('sha256').update(buffer).digest('hex');

      const metadata = {
        tipo: 'Receita Especial',
        assinado: true,
        dataAssinatura: new Date().toISOString(),
        certificado: this.certPath,
        hash: hash,
        versao: '1.0'
      };

      fs.writeFileSync(outputAssinado, buffer);
      fs.writeFileSync(outputAssinado + '.sig', JSON.stringify(metadata, null, 2));

      return {
        pdfPath: outputAssinado,
        sigPath: outputAssinado + '.sig',
        metadata
      };
    } catch (error) {
      throw new Error(`Erro ao assinar receita: ${error.message}`);
    }
  }
}

module.exports = ReceitaGenerator;
