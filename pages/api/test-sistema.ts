
import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../lib/prisma';
import { TxidUtils } from '../../lib/txid-utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    console.log('🧪 INICIANDO TESTE COMPLETO DO SISTEMA');
    
    const resultados = {
      database: { status: 'unknown', details: null },
      txidGeneration: { status: 'unknown', details: null },
      efiCredentials: { status: 'unknown', details: null },
      concursos: { status: 'unknown', details: null },
      jogos: { status: 'unknown', details: null },
      summary: 'Processando...'
    };

    // 1. Teste de conexão com banco
    console.log('🔍 Testando conexão com banco...');
    try {
      const contadorBilhetes = await prisma.bilhete.count();
      const contadorConcursos = await prisma.concurso.count();
      const contadorJogos = await prisma.jogo.count();
      
      resultados.database = {
        status: 'OK',
        details: {
          bilhetes: contadorBilhetes,
          concursos: contadorConcursos,
          jogos: contadorJogos,
          conexao: 'Funcionando'
        }
      };
      console.log('✅ Banco funcionando:', resultados.database.details);
    } catch (dbError) {
      resultados.database = {
        status: 'ERROR',
        details: dbError instanceof Error ? dbError.message : 'Erro desconhecido'
      };
      console.error('❌ Erro no banco:', dbError);
    }

    // 2. Teste de geração de TXID
    console.log('🔍 Testando geração de TXID...');
    try {
      const txidTeste = TxidUtils.gerarTxidSeguro(32);
      const analise = TxidUtils.analisarTxid(txidTeste);
      
      resultados.txidGeneration = {
        status: analise.valido ? 'OK' : 'ERROR',
        details: {
          txidGerado: txidTeste,
          comprimento: analise.comprimento,
          valido: analise.valido,
          analise: analise.recomendacao
        }
      };
      console.log('✅ TXID gerado:', resultados.txidGeneration.details);
    } catch (txidError) {
      resultados.txidGeneration = {
        status: 'ERROR',
        details: txidError instanceof Error ? txidError.message : 'Erro na geração'
      };
      console.error('❌ Erro no TXID:', txidError);
    }

    // 3. Teste de credenciais EFI
    console.log('🔍 Testando credenciais EFI...');
    try {
      const efiClientId = process.env.EFI_CLIENT_ID;
      const efiClientSecret = process.env.EFI_CLIENT_SECRET;
      const efiSandbox = process.env.EFI_SANDBOX;
      const efiPixKey = process.env.EFI_PIX_KEY;
      
      const credenciaisOk = !!(efiClientId && efiClientSecret && efiPixKey);
      
      resultados.efiCredentials = {
        status: credenciaisOk ? 'OK' : 'ERROR',
        details: {
          clientId: efiClientId ? `${efiClientId.substring(0, 8)}...` : 'NÃO CONFIGURADO',
          clientSecret: efiClientSecret ? 'CONFIGURADO' : 'NÃO CONFIGURADO',
          pixKey: efiPixKey ? 'CONFIGURADO' : 'NÃO CONFIGURADO',
          sandbox: efiSandbox || 'true',
          ambiente: efiSandbox === 'true' ? 'SANDBOX' : 'PRODUÇÃO'
        }
      };
      console.log('✅ Credenciais EFI:', resultados.efiCredentials.details);
    } catch (efiError) {
      resultados.efiCredentials = {
        status: 'ERROR',
        details: efiError instanceof Error ? efiError.message : 'Erro nas credenciais'
      };
      console.error('❌ Erro EFI:', efiError);
    }

    // 4. Teste de concursos ativos
    console.log('🔍 Testando concursos...');
    try {
      const concursoAtivo = await prisma.concurso.findFirst({
        where: { status: 'ATIVO' },
        include: {
          _count: {
            select: { jogos: true, palpites: true }
          }
        }
      });
      
      resultados.concursos = {
        status: concursoAtivo ? 'OK' : 'WARNING',
        details: concursoAtivo ? {
          id: concursoAtivo.id,
          nome: concursoAtivo.nome,
          jogos: concursoAtivo._count.jogos,
          palpites: concursoAtivo._count.palpites,
          dataFechamento: concursoAtivo.dataFechamento
        } : 'Nenhum concurso ativo encontrado'
      };
      console.log('✅ Concurso:', resultados.concursos.details);
    } catch (concursoError) {
      resultados.concursos = {
        status: 'ERROR',
        details: concursoError instanceof Error ? concursoError.message : 'Erro nos concursos'
      };
      console.error('❌ Erro concurso:', concursoError);
    }

    // 5. Teste de jogos disponíveis
    console.log('🔍 Testando jogos...');
    try {
      const jogosDisponiveis = await prisma.jogo.count({
        where: {
          concurso: { status: 'ATIVO' },
          horario: { gte: new Date() }
        }
      });
      
      resultados.jogos = {
        status: jogosDisponiveis > 0 ? 'OK' : 'WARNING',
        details: {
          jogosDisponiveis: jogosDisponiveis,
          status: jogosDisponiveis > 0 ? 'Jogos disponíveis para apostas' : 'Nenhum jogo disponível'
        }
      };
      console.log('✅ Jogos:', resultados.jogos.details);
    } catch (jogosError) {
      resultados.jogos = {
        status: 'ERROR',
        details: jogosError instanceof Error ? jogosError.message : 'Erro nos jogos'
      };
      console.error('❌ Erro jogos:', jogosError);
    }

    // Gerar resumo
    const statusGeral = Object.values(resultados).slice(0, -1).every(r => r.status === 'OK');
    const warnings = Object.values(resultados).slice(0, -1).filter(r => r.status === 'WARNING').length;
    const errors = Object.values(resultados).slice(0, -1).filter(r => r.status === 'ERROR').length;

    if (statusGeral) {
      resultados.summary = '✅ Sistema funcionando perfeitamente!';
    } else if (errors === 0 && warnings > 0) {
      resultados.summary = `⚠️ Sistema funcionando com ${warnings} aviso(s)`;
    } else {
      resultados.summary = `❌ Sistema com ${errors} erro(s) e ${warnings} aviso(s)`;
    }

    console.log('🏁 TESTE COMPLETO FINALIZADO');
    console.log('📊 Resumo:', resultados.summary);

    return res.status(200).json({
      success: true,
      message: 'Teste do sistema executado com sucesso',
      timestamp: new Date().toISOString(),
      resultados: resultados
    });

  } catch (error) {
    console.error('❌ Erro geral no teste:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Erro durante teste do sistema',
      details: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString()
    });
  } finally {
    await prisma.$disconnect();
  }
}
