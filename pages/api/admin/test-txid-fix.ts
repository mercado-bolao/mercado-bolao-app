
import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import path from 'path';
import fs from 'fs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { whatsapp = '81999999999', valor = 1.00 } = req.body;

  try {
    console.log('🧪 TESTE: Criando PIX com TXID controlado...');

    // 1. Gerar TXID nosso
    const { TxidUtils } = await import('../../../lib/txid-utils');
    const txidGerado = TxidUtils.gerarTxidSeguro(32);

    console.log('🎯 TXID gerado por nós:', txidGerado);

    // 2. Configurar EFI
    const efiSandbox = process.env.EFI_SANDBOX || 'true';
    const isSandbox = efiSandbox === 'true';
    const EfiPay = require('sdk-node-apis-efi');

    let efiConfig: any = {
      sandbox: isSandbox,
      client_id: process.env.EFI_CLIENT_ID,
      client_secret: process.env.EFI_CLIENT_SECRET
    };

    if (isSandbox) {
      const certificatePath = path.resolve('./certs/certificado-efi.p12');
      if (fs.existsSync(certificatePath) && process.env.EFI_CERTIFICATE_PASSPHRASE) {
        efiConfig.certificate = certificatePath;
        efiConfig.passphrase = process.env.EFI_CERTIFICATE_PASSPHRASE;
      }
    }

    const efipay = new EfiPay(efiConfig);

    // 3. Criar cobrança com PUT usando nosso TXID
    const body = {
      calendario: { expiracao: 300 },
      devedor: {
        nome: `Teste Cliente ${whatsapp}`,
        cpf: '12345678909',
      },
      valor: { original: valor.toFixed(2) },
      chave: process.env.EFI_PIX_KEY,
      solicitacaoPagador: `Teste TXID Fix - ${new Date().toISOString()}`,
    };

    console.log('📡 Criando PIX na EFI com PUT...');
    const params = { txid: txidGerado };
    const pixResponse = await efipay.pixCreateCharge(params, body);

    console.log('✅ PIX criado na EFI');
    console.log('📋 Resposta EFI:', JSON.stringify(pixResponse, null, 2));

    // 4. Salvar no banco
    const pixSalvo = await prisma.pixPagamento.create({
      data: {
        txid: txidGerado,
        whatsapp: whatsapp,
        valor: valor,
        status: 'ATIVA',
        pixCopiaECola: pixResponse.pixCopiaECola,
        ambiente: isSandbox ? 'sandbox' : 'producao',
        expiracao: new Date(Date.now() + 5 * 60 * 1000),
      }
    });

    console.log('💾 PIX salvo no banco');

    // 5. Verificar na EFI se reconhece nosso TXID
    let statusVerificacao = 'ERRO';
    try {
      const verificacao = await efipay.pixDetailCharge({ txid: txidGerado });
      statusVerificacao = verificacao.status;
      console.log('🔍 Verificação na EFI:', verificacao.status);
    } catch (verifyError) {
      console.error('❌ Erro na verificação:', verifyError);
    }

    // 6. RESULTADO DO TESTE
    const resultado = {
      sucesso: true,
      etapas: {
        '1_txid_gerado': txidGerado,
        '2_efi_aceito': !!pixResponse.pixCopiaECola,
        '3_banco_salvo': pixSalvo.id,
        '4_efi_reconhece': statusVerificacao !== 'ERRO'
      },
      consistencia: {
        txid_gerado: txidGerado,
        txid_banco: pixSalvo.txid,
        txid_efi: pixResponse.txid || 'N/A',
        todos_iguais: txidGerado === pixSalvo.txid
      },
      dados: {
        pixResponse: pixResponse,
        pixSalvo: pixSalvo,
        statusVerificacao: statusVerificacao
      }
    };

    return res.status(200).json({
      success: true,
      message: '🎉 Teste do TXID fix concluído!',
      resultado: resultado,
      conclusao: resultado.consistencia.todos_iguais
        ? '✅ TXID consistente! Fix funcionando!'
        : '❌ TXID inconsistente! Revisar implementação.'
    });

  } catch (error) {
    console.error('❌ Erro no teste:', error);
    return res.status(500).json({
      error: 'Erro no teste do TXID fix',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  } finally {
    await prisma.$disconnect();
  }
}
