
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';

interface BilheteConfirmado {
  id: string;
  txid: string;
  valorTotal: number;
  whatsapp: string;
  nome: string;
  status: string;
  createdAt: string;
  palpites: Array<{
    id: string;
    resultado: string;
    jogo: {
      mandante: string;
      visitante: string;
      horario: string;
    };
  }>;
  concurso: {
    nome: string;
    numero: number;
  };
}

export default function BilheteConfirmado() {
  const router = useRouter();
  const [bilhete, setBilhete] = useState<BilheteConfirmado | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [compartilhado, setCompartilhado] = useState(false);

  useEffect(() => {
    // Recuperar dados do bilhete confirmado do localStorage
    const bilheteConfirmadoData = localStorage.getItem('bilheteConfirmado');
    
    console.log('📋 Dados do bilhete no localStorage:', bilheteConfirmadoData);
    
    if (!bilheteConfirmadoData) {
      console.log('❌ Nenhum dado de bilhete encontrado no localStorage');
      // Se não há dados, redirecionar para home
      router.push('/');
      return;
    }

    try {
      const dadosBilhete = JSON.parse(bilheteConfirmadoData);
      console.log('✅ Dados do bilhete carregados:', dadosBilhete);
      
      // Validar estrutura básica dos dados
      if (!dadosBilhete.id || !dadosBilhete.palpites || !Array.isArray(dadosBilhete.palpites)) {
        throw new Error('Dados do bilhete inválidos');
      }
      
      setBilhete(dadosBilhete);
    } catch (error) {
      console.error('❌ Erro ao carregar dados do bilhete:', error);
      setError('Erro ao carregar dados do bilhete confirmado');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const compartilharWhatsApp = () => {
    if (!bilhete) return;

    const resumoPalpites = bilhete.palpites.map(p => 
      `• ${p.jogo.mandante} x ${p.jogo.visitante}: ${p.resultado}`
    ).join('\n');

    const mensagem = `🎉 *BILHETE CONFIRMADO* - Bolão TVLoteca\n\n` +
                    `📊 *${bilhete.concurso.nome}*\n` +
                    `🆔 *Bilhete:* ${bilhete.id.slice(-8).toUpperCase()}\n` +
                    `💰 *Valor:* R$ ${bilhete.valorTotal.toFixed(2)}\n` +
                    `📱 *WhatsApp:* ${bilhete.whatsapp}\n` +
                    `⏰ *Confirmado em:* ${new Date(bilhete.createdAt).toLocaleString('pt-BR')}\n\n` +
                    `⚽ *Meus Palpites:*\n${resumoPalpites}\n\n` +
                    `🏆 Boa sorte! Acompanhe os resultados e o ranking em tempo real.\n\n` +
                    `#BolãoTVLoteca #MeusPalpites`;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(mensagem)}`;
    window.open(whatsappUrl, '_blank');
    setCompartilhado(true);
  };

  const baixarImagem = async () => {
    if (!bilhete) return;
    
    // Aqui você pode implementar a funcionalidade para gerar e baixar uma imagem do bilhete
    alert('🚧 Funcionalidade de download de imagem será implementada em breve!');
  };

  const voltarParaInicio = () => {
    // Limpar dados do localStorage
    localStorage.removeItem('bilheteConfirmado');
    localStorage.removeItem('bilheteData');
    localStorage.removeItem('pixData');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Carregando bilhete confirmado...</p>
        </div>
      </div>
    );
  }

  if (error || !bilhete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md mx-4 text-center">
          <div className="w-20 h-20 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <span className="text-4xl">❌</span>
          </div>
          <h2 className="text-2xl font-bold text-red-800 mb-4">Erro</h2>
          <p className="text-red-600 mb-6">{error || 'Bilhete não encontrado'}</p>
          <Link href="/">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
              Voltar ao Início
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">✅</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">Bilhete Confirmado</h1>
            </div>
            <button
              onClick={voltarParaInicio}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              🏠 Início
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Confirmação de Sucesso */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6 text-center">
          <div className="w-24 h-24 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center animate-pulse">
            <span className="text-5xl">🎉</span>
          </div>
          <h2 className="text-3xl font-bold text-green-800 mb-3">Pagamento Confirmado!</h2>
          <p className="text-green-700 text-lg mb-4">Seus palpites foram validados com sucesso</p>
          
          <div className="bg-green-50 rounded-xl p-4 border border-green-200">
            <div className="text-sm text-green-600 font-medium mb-1">Bilhete ID</div>
            <div className="text-lg font-bold text-green-800">{bilhete.id.slice(-8).toUpperCase()}</div>
          </div>
        </div>

        {/* Resumo do Bilhete */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">📋 Resumo do Bilhete</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-sm text-blue-600 font-medium">Concurso</div>
              <div className="text-lg font-semibold text-blue-800">{bilhete.concurso.nome}</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-sm text-green-600 font-medium">Valor Pago</div>
              <div className="text-lg font-semibold text-green-800">R$ {bilhete.valorTotal.toFixed(2)}</div>
            </div>
          </div>

          {/* Palpites */}
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-700">⚽ Seus Palpites:</h4>
            {bilhete.palpites.map((palpite, index) => (
              <div key={palpite.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="flex justify-between items-center">
                  <div className="font-medium text-gray-800">
                    {palpite.jogo.mandante} x {palpite.jogo.visitante}
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    palpite.resultado === '1' ? 'bg-blue-100 text-blue-800' :
                    palpite.resultado === 'X' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {palpite.resultado === '1' ? 'Casa' : 
                     palpite.resultado === 'X' ? 'Empate' : 'Fora'}
                  </div>
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {new Date(palpite.jogo.horario).toLocaleString('pt-BR')}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ações */}
        <div className="space-y-4">
          {/* Compartilhar WhatsApp */}
          <button
            onClick={compartilharWhatsApp}
            className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-lg ${
              compartilhado
                ? 'bg-green-600 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {compartilhado ? '✅ Compartilhado!' : '📱 Compartilhar no WhatsApp'}
          </button>

          {/* Outras ações */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/ranking/geral">
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors">
                🏆 Ver Ranking
              </button>
            </Link>
            
            <button
              onClick={baixarImagem}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors"
            >
              📸 Baixar Imagem
            </button>
            
            <button
              onClick={voltarParaInicio}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors"
            >
              🏠 Nova Aposta
            </button>
          </div>
        </div>

        {/* Informações adicionais */}
        <div className="mt-6 bg-blue-50 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-blue-600">ℹ️</span>
            <h4 className="font-semibold text-blue-800">Próximos Passos</h4>
          </div>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Acompanhe os jogos e resultados em tempo real</li>
            <li>• Verifique sua posição no ranking geral</li>
            <li>• Os prêmios serão divulgados após o término de todos os jogos</li>
            <li>• Guarde o ID do seu bilhete para consultas futuras</li>
          </ul>
        </div>

        {/* Dados técnicos (ocultos, apenas para debug) */}
        <div className="mt-4 text-center">
          <details className="text-xs text-gray-500">
            <summary className="cursor-pointer hover:text-gray-700">Dados técnicos</summary>
            <div className="mt-2 bg-gray-100 rounded p-2 font-mono text-left">
              <div>TXID: {bilhete.txid}</div>
              <div>Status: {bilhete.status}</div>
              <div>Criado em: {new Date(bilhete.createdAt).toLocaleString('pt-BR')}</div>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
