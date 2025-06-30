import { NextApiRequest, NextApiResponse } from 'next';
import { getEfiConfig } from '../../lib/certificate-utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const errors: string[] = [];
  const warnings: string[] = [];
  const success: string[] = [];

  try {
    // Verificar variáveis de ambiente
    if (!process.env.EFI_CLIENT_ID) errors.push('EFI_CLIENT_ID não configurado');
    if (!process.env.EFI_CLIENT_SECRET) errors.push('EFI_CLIENT_SECRET não configurado');
    if (!process.env.EFI_PIX_KEY) errors.push('EFI_PIX_KEY não configurado');
    if (!process.env.EFI_CERTIFICATE_PASSPHRASE) errors.push('EFI_CERTIFICATE_PASSPHRASE não configurado');

    // Verificar ambiente
    const efiSandbox = process.env.EFI_SANDBOX || 'false';
    const isSandbox = efiSandbox === 'true';
    success.push(`Ambiente: ${isSandbox ? 'Sandbox' : 'Produção'}`);

    // Tentar configurar EFI
    try {
      const EfiPay = require('sdk-node-apis-efi');
      const efiConfig = getEfiConfig(isSandbox);
      const efipay = new EfiPay(efiConfig);
      success.push('SDK EFI inicializado com sucesso');
    } catch (error: any) {
      errors.push(`Erro ao inicializar SDK EFI: ${error.message}`);
    }

    // Retornar resultado
    res.status(errors.length > 0 ? 500 : 200).json({
      status: errors.length > 0 ? 'error' : 'ok',
      errors,
      warnings,
      success
    });

  } catch (error: any) {
    console.error('Erro no health check:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
      errors: [error.message],
      warnings,
      success
    });
  }
}