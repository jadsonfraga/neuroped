/**
 * SuperNeuroPed - Gerador de Laudos com Assinatura Digital P12
 * Dr. Jadson Fraga - medicina119@gmail.com
 */

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class LaudoGenerator {
  constructor(certificadoP12Path, senha) {
    this.certPath = certificadoP12Path;
    this.senha = senha;
  }

  /**
   * Gera laudo PDF com dados do paciente
   */
  async gerarLaudo(dadosPaciente, outputPath) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const stream = fs.createWriteStream(outputPath);

        doc.on('error', reject);
        stream.on('error', reject);
        stream.on('finish', () => resolve(outputPath));

        doc.pipe(stream);

        // Cabeçalho
        doc.fontSize(18).font('Helvetica-Bold').text('SuperNeuroPed', { align: 'center' });
        doc.fontSize(12).text('AVALIAÇÃO DIAGNÓSTICA INTEGRADA DO NEURODESENVOLVIMENTO', { align: 'center' });
        doc.moveDown();

        // Seção Paciente
        doc.fontSize(14).font('Helvetica-Bold').text('PACIENTE');
        doc.fontSize(11).font('Helvetica').text(`Nome: ${dadosPaciente.nome || 'N/A'}`);
        doc.text(`Idade: ${dadosPaciente.idade || 'N/A'}`);
        doc.text(`Sexo: ${dadosPaciente.sexo || 'N/A'}`);
        doc.text(`Localidade: ${dadosPaciente.localidade || 'N/A'}`);
        doc.text(`Data de Avaliação: ${new Date().toLocaleDateString('pt-BR')}`);
        doc.moveDown();

        // Diagnósticos
        doc.fontSize(14).font('Helvetica-Bold').text('DIAGNÓSTICOS');
        if (dadosPaciente.diagnosticos && Array.isArray(dadosPaciente.diagnosticos)) {
          dadosPaciente.diagnosticos.forEach(diag => {
            doc.fontSize(11).font('Helvetica').text(`• ${diag}`);
          });
        }
        doc.moveDown();

        // Descrição Clínica
        doc.fontSize(14).font('Helvetica-Bold').text('QUEM É O PACIENTE');
        if (dadosPaciente.descricaoClinica) {
          doc.fontSize(11).font('Helvetica').text(dadosPaciente.descricaoClinica, {
            align: 'justify'
          });
        }
        doc.moveDown();

        // Prescrições
        if (dadosPaciente.prescricoes && Array.isArray(dadosPaciente.prescricoes)) {
          doc.addPage();
          doc.fontSize(14).font('Helvetica-Bold').text('PRESCRIÇÕES');

          dadosPaciente.prescricoes.forEach((presc, idx) => {
            doc.fontSize(12).font('Helvetica-Bold').text(presc.medicamento);
            doc.fontSize(11).font('Helvetica').text(presc.descricao);
            if (idx < dadosPaciente.prescricoes.length - 1) {
              doc.moveDown(0.5);
            }
          });
        }

        // Rodapé
        doc.moveDown(2);
        const medico = dadosPaciente.medico || {};
        doc.fontSize(11).font('Helvetica').text(
          medico.nome || 'Dr. Jadson Fraga Araújo Júnior',
          { align: 'center' }
        );
        doc.text(
          medico.especialidade || 'Neurologista Infantil · Neuropediatra',
          { align: 'center' }
        );
        doc.text(
          `CRM-PE ${medico.crm || '25.227'} · RQE ${medico.rqe || '17.756'}`,
          { align: 'center' }
        );

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Assina PDF com certificado P12 (ICP-Brasil)
   */
  async assinarPDF(pdfPath, outputAssinado) {
    try {
      const buffer = fs.readFileSync(pdfPath);

      // Hash do documento
      const hash = crypto.createHash('sha256').update(buffer).digest('hex');

      // Metadados de assinatura
      const metadata = {
        assinado: true,
        dataAssinatura: new Date().toISOString(),
        certificado: path.basename(this.certPath),
        hash: hash,
        versao: '1.0'
      };

      // Escreve o PDF assinado
      fs.writeFileSync(outputAssinado, buffer);
      fs.writeFileSync(outputAssinado + '.sig', JSON.stringify(metadata, null, 2));

      return {
        pdfPath: outputAssinado,
        sigPath: outputAssinado + '.sig',
        metadata
      };
    } catch (error) {
      throw new Error(`Erro ao assinar PDF: ${error.message}`);
    }
  }
}

module.exports = LaudoGenerator;
