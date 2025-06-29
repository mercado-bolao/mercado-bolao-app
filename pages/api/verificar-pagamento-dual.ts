
import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const prisma = new PrismaClient();

  try {
    const { bilheteId, txid, whatsapp } = req.body;

    console.log('🔍 Verificação dual (sandbox + produção):', { bilheteId, txid, whatsapp });

    // Buscar bilhete
    let bilhete;
    if (bilheteId) {
      bilhete = await prisma.bilhete.findUnique({
        where: { id: bilheteId },
        include: { palpites: true, pix: true }
      });
    } else if (txid) {
      bilhete = await prisma.bilhete.findFirst({
        where: { txid: txid },
        include: { palpites: true, pix: true }
      });
    } else if (whatsapp) {
      bilhete = await prisma.bilhete.findFirst({
        where: { 
          whatsapp: whatsapp,
          status: 'PENDENTE'
        },
        include: { palpites: true, pix: true },
        orderBy: { createdAt: 'desc' }
      });
    }

    if (!bilhete) {
      return res.status(404).json({ error: 'Bilhete não encontrado' });
    }

    if (!bilhete.txid) {
      return res.status(400).json({ error: 'Bilhete sem TXID' });
    }

    console.log('🎫 Bilhete encontrado:', {
      id: bilhete.id,
      txid: bilhete.txid,
      status: bilhete.status,
      ambiente: bilhete.pix?.ambiente || 'desconhecido'
    });

    const EfiPay = require('sdk-node-apis-efi');
    const resultados = [];

    // 1. TENTAR SANDBOX PRIMEIRO
    try {
      console.log('🧪 Tentando SANDBOX...');
      
      const sandboxConfig = {
        sandbox: true,
        client_id: process.env.EFI_CLIENT_ID,
        client_secret: process.env.EFI_CLIENT_SECRET
      };

      const efipaysandbox = new EfiPay(sandboxConfig);
      const sandboxResponse = await efipaybox.pixDetailCharge({ txid: bilhete.txid });

      console.log(`✅ SANDBOX - Status: ${sandboxResponse.status}`);
      
      resultados.push({
        ambiente: 'SANDBOX',
        status: sandboxResponse.status,
        encontrado: true
      });

      // Se encontrou e está pago no sandbox
      if (sandboxResponse.status === 'CONCLUIDA') {
        await atualizarBilhetePago(prisma, bilhete);
        
        return res.status(200).json({
          success: true,
          message: 'PIX confirmado no SANDBOX e bilhete atualizado!',
          ambiente: 'SANDBOX',
          status: 'PAGO',
          resultados
        });
      }

    } catch (sandboxError: any) {
      console.log('⚠️ SANDBOX - Não encontrado:', sandboxError.nome || sandboxError.message);
      resultados.push({
        ambiente: 'SANDBOX',
        encontrado: false,
        erro: sandboxError.nome || sandboxError.message
      });
    }

    // 2. TENTAR PRODUÇÃO
    try {
      console.log('🏭 Tentando PRODUÇÃO...');
      
      let prodConfig: any = {
        sandbox: false,
        client_id: process.env.EFI_CLIENT_ID,
        client_secret: process.env.EFI_CLIENT_SECRET
      };

      // Configurar certificado para produção
      const certificatePath = path.resolve('./certs/certificado-efi.p12');
      if (fs.existsSync(certificatePath) && process.env.EFI_CERTIFICATE_PASSPHRASE) {
        prodConfig.certificate = certificatePath;
        prodConfig.passphrase = process.env.EFI_CERTIFICATE_PASSPHRASE;
      }

      const efipayprod = new EfiPay(prodConfig);
      const prodResponse = await efipayprod.pixDetailCharge({ txid: bilhete.txid });

      console.log(`✅ PRODUÇÃO - Status: ${prodResponse.status}`);
      
      resultados.push({
        ambiente: 'PRODUÇÃO',
        status: prodResponse.status,
        encontrado: true
      });

      // Se encontrou e está pago na produção
      if (prodResponse.status === 'CONCLUIDA') {
        await atualizarBilhetePago(prisma, bilhete);
        
        return res.status(200).json({
          success: true,
          message: 'PIX confirmado na PRODUÇÃO e bilhete atualizado!',
          ambiente: 'PRODUÇÃO',
          status: 'PAGO',
          resultados
        });
      }

    } catch (prodError: any) {
      console.log('⚠️ PRODUÇÃO - Não encontrado:', prodError.nome || prodError.message);
      resultados.push({
        ambiente: 'PRODUÇÃO',
        encontrado: false,
        erro: prodError.nome || prodError.message
      });
    }

    // Se não encontrou em nenhum ambiente
    return res.status(200).json({
      success: false,
      message: 'PIX não encontrado em nenhum ambiente (sandbox ou produção)',
      bilhete: {
        id: bilhete.id,
        txid: bilhete.txid,
        status: bilhete.status
      },
      resultados
    });

  } catch (error) {
    console.error('❌ Erro na verificação dual:', error);
    return res.status(500).json({
      error: 'Erro interno',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  } finally {
    await prisma.$disconnect();
  }
}

// Função auxiliar para atualizar bilhete como pago
async function atualizarBilhetePago(prisma: PrismaClient, bilhete: any) {
  console.log('💳 Atualizando bilhete para PAGO...');

  // Atualizar bilhete
  await prisma.bilhete.update({
    where: { id: bilhete.id },
    data: { status: 'PAGO', updatedAt: new Date() }
  });

  // Atualizar palpites
  await prisma.palpite.updateMany({
    where: { bilheteId: bilhete.id },
    data: { status: 'pago' }
  });

  // Atualizar PIX se existir
  if (bilhete.pix) {
    await prisma.pixPagamento.update({
      where: { id: bilhete.pix.id },
      data: { status: 'PAGA' }
    });
  }

  console.log('✅ Bilhete atualizado com sucesso!');
}
