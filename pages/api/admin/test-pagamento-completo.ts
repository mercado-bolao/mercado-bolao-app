
import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { TxidUtils } from '../../../lib/txid-utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { whatsapp = '85999999999', simularPagamento = true } = req.body;

  try {
    console.log('🧪 === INICIANDO TESTE COMPLETO DE PAGAMENTO ===');

    // 1. CRIAR UM BILHETE DE TESTE
    console.log('📝 Etapa 1: Criando bilhete de teste...');
    
    const concursoAtivo = await prisma.concurso.findFirst({
      where: { status: 'ativo' },
      include: { jogos: true }
    });

    if (!concursoAtivo || concursoAtivo.jogos.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Não há concurso ativo com jogos para teste'
      });
    }

    // Gerar TXID válido
    const txid = TxidUtils.gerar();
    const orderId = `TEST${Date.now()}`;
    
    // Criar bilhete de teste
    const bilhete = await prisma.bilhete.create({
      data: {
        orderId: orderId,
        whatsapp: whatsapp,
        nome: 'Teste Pagamento',
        valorTotal: 5.00,
        totalBilhetes: 1,
        status: 'PENDENTE',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutos
        txid: txid,
        ip: '127.0.0.1',
        userAgent: 'Teste'
      }
    });

    console.log('✅ Bilhete criado:', bilhete.id);

    // 2. CRIAR PALPITES DE TESTE
    console.log('📝 Etapa 2: Criando palpites de teste...');
    
    const palpitesData = concursoAtivo.jogos.slice(0, 2).map(jogo => ({
      jogoId: jogo.id,
      bilheteId: bilhete.id,
      palpite: Math.floor(Math.random() * 3), // 0, 1 ou 2
      whatsapp: whatsapp,
      nome: 'Teste Pagamento',
      valor: 2.50,
      status: 'pendente_pagamento'
    }));

    await prisma.palpite.createMany({
      data: palpitesData
    });

    console.log('✅ Palpites criados:', palpitesData.length);

    // 3. CRIAR PIX DE TESTE
    console.log('📝 Etapa 3: Criando PIX de teste...');
    
    const pixPagamento = await prisma.pixPagamento.create({
      data: {
        txid: txid,
        whatsapp: whatsapp,
        valor: 5.00,
        status: 'ATIVA',
        pixCopiaECola: `00020101021226830014BR.GOV.BCB.PIX2561teste.com/pix/${txid}5204000053000065802BR5905TESTE6008TESTECIT61040000`,
        ambiente: 'teste',
        expiracao: new Date(Date.now() + 5 * 60 * 1000)
      }
    });

    console.log('✅ PIX criado:', pixPagamento.id);

    // 4. VERIFICAR STATUS INICIAL
    console.log('📝 Etapa 4: Verificando status inicial...');
    
    const statusInicial = await prisma.bilhete.findUnique({
      where: { id: bilhete.id },
      include: {
        palpites: true
      }
    });

    console.log('📊 Status inicial:', {
      bilhete: statusInicial?.status,
      palpites: statusInicial?.palpites.map(p => p.status)
    });

    let resultadoTeste = {
      sucesso: true,
      etapas: {
        bilheteCriado: true,
        palpitesCriados: true,
        pixCriado: true,
        statusInicial: statusInicial?.status === 'PENDENTE'
      },
      dados: {
        bilheteId: bilhete.id,
        txid: txid,
        orderId: orderId,
        valor: 5.00,
        palpites: palpitesData.length
      }
    };

    // 5. SIMULAR PAGAMENTO (se solicitado)
    if (simularPagamento) {
      console.log('💰 Etapa 5: Simulando pagamento via webhook...');
      
      // Simular dados do webhook da EFI
      const webhookData = {
        pix: [{
          txid: txid,
          valor: "5.00",
          status: "PAGA",
          endToEndId: `E${Date.now()}`,
          horario: new Date().toISOString()
        }]
      };

      console.log('📨 Dados do webhook simulado:', webhookData);

      // Processar webhook internamente
      try {
        // 1. Registrar log do webhook
        const webhookLog = await prisma.webhookLog.create({
          data: {
            evento: 'pix.test.received',
            txid: txid,
            dados: webhookData,
            processado: false
          }
        });

        // 2. Buscar bilhete pelo TXID
        const bilheteParaPagar = await prisma.bilhete.findFirst({
          where: {
            txid: txid,
            status: 'PENDENTE'
          },
          include: {
            palpites: true
          }
        });

        if (bilheteParaPagar) {
          // 3. Atualizar bilhete para PAGO
          await prisma.bilhete.update({
            where: { id: bilheteParaPagar.id },
            data: { 
              status: 'PAGO',
              updatedAt: new Date()
            }
          });

          // 4. Atualizar palpites para pago
          await prisma.palpite.updateMany({
            where: { bilheteId: bilheteParaPagar.id },
            data: { status: 'pago' }
          });

          // 5. Atualizar PIX para PAGA
          await prisma.pixPagamento.updateMany({
            where: { txid: txid },
            data: { 
              status: 'PAGA',
              updatedAt: new Date()
            }
          });

          // 6. Marcar webhook como processado
          await prisma.webhookLog.update({
            where: { id: webhookLog.id },
            data: { processado: true }
          });

          console.log('✅ Pagamento simulado processado com sucesso!');

          // Verificar status final
          const statusFinal = await prisma.bilhete.findUnique({
            where: { id: bilhete.id },
            include: {
              palpites: true
            }
          });

          resultadoTeste.etapas = {
            ...resultadoTeste.etapas,
            webhookProcessado: true,
            bilheteAtualizado: statusFinal?.status === 'PAGO',
            palpitesAtualizados: statusFinal?.palpites.every(p => p.status === 'pago') || false
          };

          console.log('📊 Status final:', {
            bilhete: statusFinal?.status,
            palpites: statusFinal?.palpites.map(p => p.status)
          });

        } else {
          throw new Error('Bilhete não encontrado para pagamento');
        }

      } catch (webhookError) {
        console.error('❌ Erro no processamento do webhook:', webhookError);
        resultadoTeste.sucesso = false;
        resultadoTeste.erro = webhookError instanceof Error ? webhookError.message : 'Erro no webhook';
      }
    }

    // 6. RESULTADO FINAL
    console.log('🎉 === TESTE CONCLUÍDO ===');
    console.log('📊 Resultado:', resultadoTeste);

    return res.status(200).json({
      success: true,
      message: 'Teste de pagamento executado com sucesso',
      resultado: resultadoTeste,
      instrucoes: {
        proximosPasos: [
          'Verifique o bilhete no admin: /admin/bilhetes',
          `Consulte via API: /api/consultar-cobranca-completa?txid=${txid}`,
          `Teste verificação manual: /api/verificar-status-pagamento?bilheteId=${bilhete.id}`
        ]
      }
    });

  } catch (error) {
    console.error('❌ Erro no teste de pagamento:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro no teste de pagamento',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}
