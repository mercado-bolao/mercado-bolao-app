
import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const prisma = new PrismaClient();

  try {
    console.log('🔧 Iniciando recuperação de pagamentos perdidos...');

    // Buscar todos os bilhetes pendentes
    const bilhetesPendentes = await prisma.bilhete.findMany({
      where: { 
        status: 'PENDENTE',
        txid: { not: null }
      },
      include: { palpites: true, pix: true }
    });

    console.log(`📊 Encontrados ${bilhetesPendentes.length} bilhetes pendentes`);

    const resultados = [];
    let recuperados = 0;

    for (const bilhete of bilhetesPendentes) {
      console.log(`\n🔍 Verificando bilhete: ${bilhete.id}`);
      console.log(`📋 TXID: ${bilhete.txid}`);
      console.log(`💰 Valor: R$ ${bilhete.valorTotal}`);

      try {
        // Tentar verificação dual
        const response = await fetch(`${req.headers.origin}/api/verificar-pagamento-dual`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bilheteId: bilhete.id })
        });

        const result = await response.json();

        if (result.success && result.status === 'PAGO') {
          console.log(`✅ Pagamento recuperado: ${bilhete.txid}`);
          recuperados++;
          
          resultados.push({
            bilheteId: bilhete.id,
            txid: bilhete.txid,
            valor: bilhete.valorTotal,
            status: 'RECUPERADO',
            ambiente: result.ambiente
          });
        } else {
          resultados.push({
            bilheteId: bilhete.id,
            txid: bilhete.txid,
            valor: bilhete.valorTotal,
            status: 'NAO_ENCONTRADO',
            detalhes: result.message
          });
        }

      } catch (error) {
        console.error(`❌ Erro ao verificar ${bilhete.txid}:`, error);
        resultados.push({
          bilheteId: bilhete.id,
          txid: bilhete.txid,
          valor: bilhete.valorTotal,
          status: 'ERRO',
          erro: error instanceof Error ? error.message : 'Erro desconhecido'
        });
      }
    }

    console.log(`\n🎉 Recuperação concluída: ${recuperados} pagamentos recuperados`);

    return res.status(200).json({
      success: true,
      message: `Recuperação concluída: ${recuperados} pagamentos recuperados de ${bilhetesPendentes.length} verificados`,
      recuperados,
      totalVerificados: bilhetesPendentes.length,
      resultados
    });

  } catch (error) {
    console.error('❌ Erro na recuperação:', error);
    return res.status(500).json({
      error: 'Erro ao recuperar pagamentos',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  } finally {
    await prisma.$disconnect();
  }
}
