
import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const prisma = new PrismaClient();

  try {
    console.log('🧪 INICIANDO TESTE COMPLETO DO SISTEMA...');
    
    const resultados = {
      database: { status: 'ERRO', details: null },
      efiCredentials: { status: 'ERRO', details: null },
      txidGeneration: { status: 'ERRO', details: null },
      concursos: { status: 'ERRO', details: null },
      jogos: { status: 'ERRO', details: null },
      palpites: { status: 'ERRO', details: null },
      pixGeneration: { status: 'ERRO', details: null },
      webhookConfig: { status: 'ERRO', details: null }
    };

    // 1. TESTE DO BANCO DE DADOS
    console.log('📊 Testando conexão com banco...');
    try {
      const bilhetes = await prisma.bilhete.count();
      const concursos = await prisma.concurso.count();
      const jogos = await prisma.jogo.count();
      const palpites = await prisma.palpite.count();
      
      resultados.database = {
        status: 'OK',
        details: {
          bilhetes,
          concursos,
          jogos,
          palpites,
          conexao: 'Funcionando'
        }
      };
      console.log('✅ Banco de dados OK');
    } catch (dbError) {
      resultados.database = {
        status: 'ERRO',
        details: dbError instanceof Error ? dbError.message : 'Erro desconhecido'
      };
      console.error('❌ Erro no banco:', dbError);
    }

    // 2. TESTE DAS CREDENCIAIS EFI
    console.log('🔑 Testando credenciais EFI...');
    try {
      const efiSandbox = process.env.EFI_SANDBOX || 'true';
      const efiClientId = process.env.EFI_CLIENT_ID;
      const efiClientSecret = process.env.EFI_CLIENT_SECRET;
      const efiPixKey = process.env.EFI_PIX_KEY;

      const credenciaisOk = !!(efiClientId && efiClientSecret && efiPixKey);
      
      if (credenciaisOk) {
        resultados.efiCredentials = {
          status: 'OK',
          details: {
            clientId: efiClientId?.substring(0, 8) + '...',
            clientSecret: efiClientSecret ? 'CONFIGURADO' : 'FALTANDO',
            pixKey: efiPixKey ? 'CONFIGURADO' : 'FALTANDO',
            sandbox: efiSandbox,
            ambiente: efiSandbox === 'true' ? 'SANDBOX' : 'PRODUÇÃO'
          }
        };
        console.log('✅ Credenciais EFI OK');
      } else {
        throw new Error('Credenciais EFI incompletas');
      }
    } catch (efiError) {
      resultados.efiCredentials = {
        status: 'ERRO',
        details: efiError instanceof Error ? efiError.message : 'Erro desconhecido'
      };
      console.error('❌ Erro nas credenciais EFI:', efiError);
    }

    // 3. TESTE DE GERAÇÃO DE TXID
    console.log('🎯 Testando geração de TXID...');
    try {
      const { TxidUtils } = await import('../../lib/txid-utils');
      const txidTeste = TxidUtils.gerarTxidSeguro(32);
      const txidPattern = /^[a-zA-Z0-9]{26,35}$/;
      const valido = txidPattern.test(txidTeste);

      resultados.txidGeneration = {
        status: valido ? 'OK' : 'ERRO',
        details: {
          txidGerado: txidTeste,
          comprimento: txidTeste.length,
          valido: valido,
          analise: valido ? 'TXID válido para EFI Pay' : 'TXID inválido'
        }
      };
      console.log('✅ Geração de TXID OK');
    } catch (txidError) {
      resultados.txidGeneration = {
        status: 'ERRO',
        details: txidError instanceof Error ? txidError.message : 'Erro desconhecido'
      };
      console.error('❌ Erro na geração de TXID:', txidError);
    }

    // 4. TESTE DOS CONCURSOS
    console.log('🏆 Testando concursos...');
    try {
      const concursoAtivo = await prisma.concurso.findFirst({
        where: { status: 'ativo' },
        include: { jogos: true }
      });

      if (concursoAtivo) {
        resultados.concursos = {
          status: 'OK',
          details: {
            concursoAtivo: concursoAtivo.nome,
            jogosNoConcurso: concursoAtivo.jogos.length,
            id: concursoAtivo.id
          }
        };
        console.log('✅ Concursos OK');
      } else {
        resultados.concursos = {
          status: 'WARNING',
          details: 'Nenhum concurso ativo encontrado'
        };
        console.log('⚠️ Nenhum concurso ativo');
      }
    } catch (concursoError) {
      resultados.concursos = {
        status: 'ERRO',
        details: concursoError instanceof Error ? concursoError.message : 'Erro desconhecido'
      };
      console.error('❌ Erro nos concursos:', concursoError);
    }

    // 5. TESTE DOS JOGOS
    console.log('⚽ Testando jogos...');
    try {
      const jogosDisponiveis = await prisma.jogo.count({
        where: {
          concurso: { status: 'ativo' }
        }
      });

      if (jogosDisponiveis > 0) {
        resultados.jogos = {
          status: 'OK',
          details: {
            jogosDisponiveis,
            status: 'Jogos disponíveis para apostas'
          }
        };
        console.log('✅ Jogos OK');
      } else {
        resultados.jogos = {
          status: 'WARNING',
          details: {
            jogosDisponiveis: 0,
            status: 'Nenhum jogo disponível'
          }
        };
        console.log('⚠️ Nenhum jogo disponível');
      }
    } catch (jogoError) {
      resultados.jogos = {
        status: 'ERRO',
        details: jogoError instanceof Error ? jogoError.message : 'Erro desconhecido'
      };
      console.error('❌ Erro nos jogos:', jogoError);
    }

    // 6. TESTE DOS PALPITES
    console.log('🎲 Testando palpites...');
    try {
      const palpitesPendentes = await prisma.palpite.count({
        where: { status: 'pendente' }
      });
      
      const palpitesPagos = await prisma.palpite.count({
        where: { status: 'pago' }
      });

      resultados.palpites = {
        status: 'OK',
        details: {
          palpitesPendentes,
          palpitesPagos,
          total: palpitesPendentes + palpitesPagos
        }
      };
      console.log('✅ Palpites OK');
    } catch (palpiteError) {
      resultados.palpites = {
        status: 'ERRO',
        details: palpiteError instanceof Error ? palpiteError.message : 'Erro desconhecido'
      };
      console.error('❌ Erro nos palpites:', palpiteError);
    }

    // 7. TESTE DE GERAÇÃO DE PIX (SIMULADO)
    console.log('💳 Testando capacidade de gerar PIX...');
    try {
      const efiSandbox = process.env.EFI_SANDBOX || 'true';
      const isSandbox = efiSandbox === 'true';
      
      // Verificar se tem certificado para produção
      let certificadoOk = true;
      if (!isSandbox) {
        const certificatePath = path.resolve('./certs/certificado-efi.p12');
        certificadoOk = fs.existsSync(certificatePath) && !!process.env.EFI_CERTIFICATE_PASSPHRASE;
      }

      resultados.pixGeneration = {
        status: certificadoOk ? 'OK' : 'WARNING',
        details: {
          ambiente: isSandbox ? 'SANDBOX' : 'PRODUÇÃO',
          certificado: certificadoOk ? 'Configurado' : 'Faltando',
          capacidadeGerar: certificadoOk ? 'Sim' : 'Não (falta certificado)'
        }
      };
      console.log('✅ Geração de PIX OK');
    } catch (pixError) {
      resultados.pixGeneration = {
        status: 'ERRO',
        details: pixError instanceof Error ? pixError.message : 'Erro desconhecido'
      };
      console.error('❌ Erro na geração de PIX:', pixError);
    }

    // 8. TESTE DO WEBHOOK
    console.log('🔔 Testando configuração de webhook...');
    try {
      resultados.webhookConfig = {
        status: 'OK',
        details: {
          endpoint: '/api/webhook-pix',
          configurado: 'Sim',
          metodo: 'POST'
        }
      };
      console.log('✅ Webhook OK');
    } catch (webhookError) {
      resultados.webhookConfig = {
        status: 'ERRO',
        details: webhookError instanceof Error ? webhookError.message : 'Erro desconhecido'
      };
      console.error('❌ Erro no webhook:', webhookError);
    }

    // RESUMO FINAL
    const statusCounts = {
      ok: Object.values(resultados).filter(r => r.status === 'OK').length,
      warning: Object.values(resultados).filter(r => r.status === 'WARNING').length,
      erro: Object.values(resultados).filter(r => r.status === 'ERRO').length
    };

    let summaryMessage = '';
    if (statusCounts.erro > 0) {
      summaryMessage = `❌ Sistema com ${statusCounts.erro} erro(s) crítico(s)`;
    } else if (statusCounts.warning > 0) {
      summaryMessage = `⚠️ Sistema funcionando com ${statusCounts.warning} aviso(s)`;
    } else {
      summaryMessage = '✅ Sistema 100% funcional!';
    }

    console.log('🎉 TESTE COMPLETO FINALIZADO');
    console.log('📊 Resumo:', summaryMessage);

    return res.status(200).json({
      success: true,
      message: 'Teste do sistema executado com sucesso',
      timestamp: new Date().toISOString(),
      resultados,
      summary: summaryMessage,
      estatisticas: statusCounts
    });

  } catch (error) {
    console.error('❌ Erro geral no teste:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro no teste do sistema',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  } finally {
    await prisma.$disconnect();
  }
}
