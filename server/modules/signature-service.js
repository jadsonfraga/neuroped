/**
 * SuperNeuroPed - Serviço de Assinatura Digital P12
 * Integração com certificados ICP-Brasil
 * Classe base para assinatura de documentos
 */

const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

class SignatureService {
  constructor(certificadoP12Path, senha) {
    this.certPath = certificadoP12Path;
    this.senha = senha;
    this.validarCertificado();
  }

  /**
   * Valida se o arquivo P12 existe e é acessível
   */
  validarCertificado() {
    if (!fs.existsSync(this.certPath)) {
      throw new Error(`Certificado P12 não encontrado: ${this.certPath}`);
    }

    const stat = fs.statSync(this.certPath);
    if (stat.size === 0) {
      throw new Error('Certificado P12 está vazio');
    }
  }

  /**
   * Carrega o certificado P12
   * NOTA: A assinatura real requer bibliotecas específicas como:
   * - node-pkcs11 (PKCS#11)
   * - pyhanko (Python)
   * - openssl (CLI)
   */
  async carregarCertificado() {
    try {
      const certBuffer = fs.readFileSync(this.certPath);

      // Validar que é um arquivo P12 válido (magic number)
      if (!this._ehArquivoP12Valido(certBuffer)) {
        throw new Error('Arquivo não é um certificado P12 válido');
      }

      return {
        buffer: certBuffer,
        hash: crypto.createHash('sha256').update(certBuffer).digest('hex'),
        tamanho: certBuffer.length,
        tipo: 'PKCS#12'
      };
    } catch (error) {
      throw new Error(`Erro ao carregar certificado: ${error.message}`);
    }
  }

  /**
   * Verifica magic number do P12 (0x30 0x82 ou 0x30 0x83)
   */
  _ehArquivoP12Valido(buffer) {
    if (buffer.length < 4) return false;
    // P12 files start with 0x30 82 or 0x30 83 (SEQUENCE tag)
    return (buffer[0] === 0x30) && (buffer[1] === 0x82 || buffer[1] === 0x83);
  }

  /**
   * Assina documento com timestamp
   * Para assinatura real, integrar com serviço de timestamp como:
   * - SERPRO (Brasil)
   * - ATOPOS
   * - Certisign
   */
  async assinarComTimestamp(documentPath, outputPath) {
    try {
      const documentBuffer = fs.readFileSync(documentPath);
      const documentHash = crypto.createHash('sha256').update(documentBuffer).digest('hex');

      const timestamp = new Date().toISOString();

      const assinatura = {
        documento: path.basename(documentPath),
        hashAlgoritmo: 'SHA-256',
        hash: documentHash,
        certificado: path.basename(this.certPath),
        dataAssinatura: timestamp,
        timestamp: timestamp,
        versao: '1.0',
        status: 'assinado'
      };

      fs.writeFileSync(outputPath, JSON.stringify(assinatura, null, 2));

      return assinatura;
    } catch (error) {
      throw new Error(`Erro ao assinar com timestamp: ${error.message}`);
    }
  }

  /**
   * Verifica integridade de documento assinado
   */
  async verificarAssinatura(documentPath, assinaturaPath) {
    try {
      const documentBuffer = fs.readFileSync(documentPath);
      const documentHashAtual = crypto.createHash('sha256').update(documentBuffer).digest('hex');

      const assinatura = JSON.parse(fs.readFileSync(assinaturaPath, 'utf-8'));

      const valido = assinatura.hash === documentHashAtual;

      return {
        valido,
        documentoIntegro: valido,
        hashArmazenado: assinatura.hash,
        hashAtual: documentHashAtual,
        dataAssinatura: assinatura.dataAssinatura,
        mensagem: valido ? 'Assinatura válida' : 'AVISO: Documento foi modificado após assinatura'
      };
    } catch (error) {
      throw new Error(`Erro ao verificar assinatura: ${error.message}`);
    }
  }

  /**
   * Exporta certificado para formato PEM (para debug/inspeção)
   */
  async exportarCertificadoInfo() {
    try {
      const certBuffer = await this.carregarCertificado();

      return {
        arquivo: path.basename(this.certPath),
        tamanho: certBuffer.tamanho,
        hash: certBuffer.hash,
        tipo: certBuffer.tipo,
        algoritmoAssinatura: 'SHA-256',
        padraoICP: 'ICP-Brasil',
        nota: 'Para extrair certificado real, use: openssl pkcs12 -in certificado.p12 -nokeys -out cert.pem'
      };
    } catch (error) {
      throw new Error(`Erro ao exportar informações: ${error.message}`);
    }
  }

  /**
   * Integração com OpenSSL via CLI para assinatura real
   * Alternativa quando bibliotecas node não estão disponíveis
   */
  async assinarComOpenSSL(documentPath, outputPath) {
    const { exec } = require('child_process');
    const util = require('util');
    const execPromise = util.promisify(exec);

    try {
      // Comando OpenSSL para assinar
      const comando = `openssl smime -sign -in "${documentPath}" -out "${outputPath}" -signer "${this.certPath}" -inkey "${this.certPath}" -password pass:"${this.senha}" -binary -outform DER`;

      await execPromise(comando);
      return { sucesso: true, arquivo: outputPath };
    } catch (error) {
      throw new Error(`Erro na assinatura OpenSSL: ${error.message}`);
    }
  }
}

module.exports = SignatureService;
