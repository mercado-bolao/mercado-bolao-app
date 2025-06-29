import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log('🏥 Verificação de saúde EFI Pay...');

    const certificatePath = process.env.EFI_CERTIFICATE_PATH || './certs/certificado-efi.p12';

    // Em produção, verificar se o certificado existe
    let certificateExists = false;
    try {
      const fs = require('fs');
      certificateExists = fs.existsSync(certificatePath);
    } catch (error) {
      console.warn('Não foi possível verificar certificado:', error);
    }

    const config = {
      EFI_SANDBOX: process.env.EFI_SANDBOX || 'false',
      EFI_CLIENT_ID: !!process.env.EFI_CLIENT_ID,
      EFI_CLIENT_SECRET: !!process.env.EFI_CLIENT_SECRET,
      EFI_PIX_KEY: !!process.env.EFI_PIX_KEY,
      EFI_CERTIFICATE_PASSPHRASE: !!process.env.EFI_CERTIFICATE_PASSPHRASE,
      certificateExists: certificateExists
    };

    const isSandbox = config.EFI_SANDBOX === 'true';
    const isProduction = !isSandbox && config.certificateExists && config.EFI_CERTIFICATE_PASSPHRASE;

    let status = 'OK';
    let warnings = [];
    let errors = [];

    // Verificações obrigatórias
    if (!config.EFI_CLIENT_ID) errors.push('EFI_CLIENT_ID não configurado');
    if (!config.EFI_CLIENT_SECRET) errors.push('EFI_CLIENT_SECRET não configurado');
    if (!config.EFI_PIX_KEY) errors.push('EFI_PIX_KEY não configurado');

    // Verificações para produção
    if (isSandbox) {
      if (!config.certificateExists) {
        errors.push('Certificado não encontrado em ./certs/certificado-efi.p12');
      }
      if (!config.EFI_CERTIFICATE_PASSPHRASE) {
        errors.push('EFI_CERTIFICATE_PASSPHRASE não configurado');
      }
    }

    if (errors.length > 0) {
      status = 'ERROR';
    } else if (warnings.length > 0) {
      status = 'WARNING';
    }

    return res.status(200).json({
      status,
      environment: isSandbox ? 'SANDBOX' : 'PRODUÇÃO',
      ready: errors.length === 0,
      config: {
        sandbox: isSandbox,
        hasCredentials: config.EFI_CLIENT_ID && config.EFI_CLIENT_SECRET,
        hasPixKey: config.EFI_PIX_KEY,
        hasCertificate: config.certificateExists,
        hasPassphrase: config.EFI_CERTIFICATE_PASSPHRASE
      },
      errors,
      warnings,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erro na verificação de saúde:', error);
    return res.status(500).json({
      status: 'ERROR',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}