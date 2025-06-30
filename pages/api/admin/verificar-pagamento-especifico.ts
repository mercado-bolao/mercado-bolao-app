import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import path from 'path';
import fs from 'fs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { data, whatsapp, txid } = req.body;

  console.log('🔍 Verificando pagamento específico:', { data, whatsapp, txid });

  try {
    // 1. BUSCAR BILHETES POR DATA E WHATSAPP
    let bilhetes: any[] = [];

    if (data && whatsapp) {
      // Converter data brasileira para ISO
      const [dataParte, horaParte] = data.split(', ');
      const [dia, mes, ano] = dataParte.split('/');
      const [hora, minuto, segundo] = horaParte.split(':');

      const dataInicio = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia), parseInt(hora), parseInt(minuto), parseInt(segundo));
      const dataFim = new Date(dataInicio.getTime() + 60 * 60 * 1000); // +1 hora

      console.log('📅 Buscando entre:', dataInicio.toISOString(), 'e', dataFim.toISOString());

      bilhetes = await prisma.bilhete.findMany({
        where: {
          whatsapp: whatsapp,
          createdAt: {
            gte: dataInicio,
            lte: dataFim
          }
        },
        include: {
          palpites: true,
          pix: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    } else if (txid) {
      const bilhete = await prisma.bilhete.findFirst({
        where: { txid: txid },
        include: { palpites: true, pix: true }
      });
      if (bilhete) bilhetes = [bilhete];
    } else {
      return res.status(400).json({ error: 'Forneça data + whatsapp ou txid' });
    }

    console.log(`📊 Encontrados ${bilhetes.length} bilhetes`);

    if (bilhetes.length === 0) {
      return res.status(404).json({
        error: 'Nenhum bilhete encontrado',
        dados: { data, whatsapp, txid }
      });
    }

    const resultados = [];

    // 2. VERIFICAR CADA BILHETE NA EFI
    for (const bilhete of bilhetes) {
      console.log(`\n🎫 Verificando bilhete: ${bilhete.id}`);
      console.log(`📋 TXID: ${bilhete.txid}`);
      console.log(`💰 Valor: R$ ${bilhete.valorTotal}`);
      console.log(`📱 WhatsApp: ${bilhete.whatsapp}`);
      console.log(`🕒 Criado em: ${bilhete.createdAt.toLocaleString('pt-BR')}`);
      console.log(`📊 Status atual: ${bilhete.status}`);

      const resultado: {
        bilheteId: string;
        txid: string | null;
        valor: number;
        whatsapp: string;
        criadoEm: string;
        statusBanco: string;
        palpites: number;
        statusEfi: string | null;
        erro: string | null;
        atualizado: boolean;
      } = {
        bilheteId: bilhete.id,
        txid: bilhete.txid,
        valor: bilhete.valorTotal,
        whatsapp: bilhete.whatsapp,
        criadoEm: bilhete.createdAt.toLocaleString('pt-BR'),
        statusBanco: bilhete.status,
        palpites: bilhete.palpites.length,
        statusEfi: null,
        erro: null,
        atualizado: false
      };

      if (!bilhete.txid) {
        resultado.erro = 'TXID não encontrado no bilhete';
        resultados.push(resultado);
        continue;
      }

      // Verificar na EFI
      try {
        const efiSandbox = process.env.EFI_SANDBOX || 'false';
        const isSandbox = efiSandbox === 'true';
        const EfiPay = require('sdk-node-apis-efi');

        // Usar a função auxiliar para obter a configuração
        const { getEfiConfig } = await import('../../../lib/certificate-utils');
        const efiConfig = getEfiConfig(isSandbox);

        const efipay = new EfiPay(efiConfig);

        // Consultar PIX na EFI
        const params = { txid: bilhete.txid };
        const pixResponse = await efipay.pixDetailCharge(params);

        console.log(`📋 Status na EFI: ${pixResponse.status}`);
        resultado.statusEfi = pixResponse.status;

        // Se foi pago na EFI mas não no banco
        if (pixResponse.status === 'CONCLUIDA' && bilhete.status === 'PENDENTE') {
          console.log('✅ Pagamento confirmado na EFI! Atualizando banco...');

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

          resultado.atualizado = true;
          console.log('🎉 Bilhete atualizado para PAGO!');
        }

      } catch (efiError: any) {
        console.error(`❌ Erro na EFI para ${bilhete.txid}:`, efiError);
        resultado.erro = efiError.mensagem || efiError.message || 'Erro na consulta EFI';
      }

      resultados.push(resultado);
    }

    // 3. RESUMO
    const resumo = {
      totalBilhetes: bilhetes.length,
      bilhetesPagos: resultados.filter(r => r.statusEfi === 'CONCLUIDA').length,
      bilhetesAtualizados: resultados.filter(r => r.atualizado).length,
      bilhetesComErro: resultados.filter(r => r.erro).length
    };

    console.log('\n📊 RESUMO DA VERIFICAÇÃO:');
    console.log(`Total de bilhetes: ${resumo.totalBilhetes}`);
    console.log(`Pagos na EFI: ${resumo.bilhetesPagos}`);
    console.log(`Atualizados: ${resumo.bilhetesAtualizados}`);
    console.log(`Com erro: ${resumo.bilhetesComErro}`);

    return res.status(200).json({
      success: true,
      message: `Verificação concluída para ${resultados.length} bilhete(s)`,
      resumo,
      resultados,
      parametros: { data, whatsapp, txid }
    });

  } catch (error) {
    console.error('❌ Erro geral:', error);
    return res.status(500).json({
      error: 'Erro ao verificar pagamento',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  } finally {
    await prisma.$disconnect();
  }
}
