import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

interface Jogo {
  id: string;
  mandante: string;
  visitante: string;
  horario: string;
}

interface Palpite {
  id: string;
  resultado: string;
  valor: number;
  jogo: Jogo;
  createdAt: string;
}

interface PalpitesPendentes {
  palpites: Palpite[];
  totalPalpites: number;
  totalBilhetes: number;
  valorTotal: number;
  usuario: {
    nome: string;
    whatsapp: string;
  };
}

export default function FinalizarAposta() {
  const router = useRouter();
  const [palpitesPendentes, setPalpitesPendentes] = useState<PalpitesPendentes | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [processandoPagamento, setProcessandoPagamento] = useState(false);
  const [limpandoCarrinho, setLimpandoCarrinho] = useState(false); // Estado para controlar o loading ao limpar o carrinho

  useEffect(() => {
    // Buscar WhatsApp do localStorage ou query params
    const whatsappStorage = localStorage.getItem('whatsapp');
    const whatsappQuery = router.query.whatsapp as string;

    if (whatsappQuery) {
      setWhatsapp(whatsappQuery);
      buscarPalpitesPendentes(whatsappQuery);
    } else if (whatsappStorage) {
      setWhatsapp(whatsappStorage);
      buscarPalpitesPendentes(whatsappStorage);
    } else {
      setError('WhatsApp não encontrado. Faça uma aposta primeiro.');
      setLoading(false);
    }
  }, [router.query]);

  const buscarPalpitesPendentes = async (whatsappUsuario: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/palpites-pendentes?whatsapp=${encodeURIComponent(whatsappUsuario)}`);

      if (!response.ok) {
        throw new Error('Erro ao buscar palpites pendentes');
      }

      const data = await response.json();
      setPalpitesPendentes(data);
    } catch (error) {
      console.error('Erro ao buscar palpites:', error);
      setError('Erro ao carregar seus palpites pendentes.');
    } finally {
      setLoading(false);
    }
  };

  const limparCarrinho = async () => {
    if (!confirm('⚠️ Tem certeza que deseja limpar todos os palpites pendentes?\n\nEsta ação não pode ser desfeita.')) {
      return;
    }

    setLimpandoCarrinho(true);
    try {
      console.log('🗑️ Limpando carrinho...');

      const response = await fetch('/api/limpar-carrinho', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          whatsapp: whatsapp,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao limpar carrinho');
      }

      console.log('✅ Carrinho limpo com sucesso!');
      alert(`✅ ${data.message}\n\nVocê pode fazer novos palpites agora.`);

      // Redirecionar para página inicial
      router.push('/');

    } catch (error) {
      console.error('❌ Erro ao limpar carrinho:', error);
      alert(`Erro ao limpar carrinho: ${error instanceof Error ? error.message : 'Erro desconhecido'}\n\nTente novamente.`);
    } finally {
      setLimpandoCarrinho(false);
    }
  };

  const gerarPagamento = async () => {
    if (!palpitesPendentes) return;

    setProcessandoPagamento(true);
    try {
      console.log('🔄 Gerando PIX para pagamento...');

      const response = await fetch('/api/gerar-pix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          whatsapp: whatsapp,
          valorTotal: palpitesPendentes.valorTotal,
          totalBilhetes: palpitesPendentes.totalBilhetes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao gerar PIX');
      }

      if (data.success && data.pix) {
        console.log('✅ PIX gerado com sucesso!');

        // Salvar dados do PIX no localStorage para mostrar na próxima tela
        localStorage.setItem('pixData', JSON.stringify(data.pix));
        localStorage.setItem('pixWhatsapp', whatsapp);

        // Redirecionar para tela de pagamento PIX
        router.push('/pagamento-pix');
      } else {
        throw new Error('Resposta inválida da API');
      }

    } catch (error) {
      console.error('❌ Erro ao gerar pagamento:', error);
      alert(`Erro ao gerar pagamento PIX: ${error instanceof Error ? error.message : 'Erro desconhecido'}\n\nTente novamente.`);
    } finally {
      setProcessandoPagamento(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Carregando seus palpites...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md mx-4 text-center">
          <div className="w-20 h-20 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <span className="text-4xl">❌</span>
          </div>
          <h2 className="text-2xl font-bold text-red-800 mb-4">Erro</h2>
          <p className="text-red-600 mb-6">{error}</p>
          <Link href="/">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
              Voltar ao Início
            </button>
          </Link>
        </div>
      </div>
    );
  }

  if (!palpitesPendentes || palpitesPendentes.totalPalpites === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md mx-4 text-center">
          <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <span className="text-4xl">📝</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Nenhum Palpite Pendente</h2>
          <p className="text-gray-600 mb-6">Você não possui palpites pendentes para finalizar.</p>
          <Link href="/">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
              Fazer Novos Palpites
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">⚽</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">Finalizar Aposta</h1>
            </div>
            <Link href="/">
              <span className="text-blue-600 hover:text-blue-800 font-medium cursor-pointer">
                ← Voltar
              </span>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Informações do usuário */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">📋 Resumo da Aposta</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-sm text-blue-600 font-medium">Apostador</div>
              <div className="text-lg font-semibold text-blue-800">{palpitesPendentes.usuario.nome}</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-sm text-green-600 font-medium">Total de Bilhetes</div>
              <div className="text-lg font-semibold text-green-800">{palpitesPendentes.totalBilhetes}</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-sm text-purple-600 font-medium">Valor Total</div>
              <div className="text-lg font-semibold text-purple-800">R$ {palpitesPendentes.valorTotal.toFixed(2)}</div>
            </div>
          </div>
        </div>



        {/* Total e botão de pagamento */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl shadow-lg p-6 border-2 border-green-200">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-2">💰 Total a Pagar</h3>
            <div className="text-4xl font-bold text-green-600 mb-1">
              R$ {palpitesPendentes.valorTotal.toFixed(2)}
            </div>
            <p className="text-gray-600">
              {palpitesPendentes.totalBilhetes} bilhete(s) × R$ 10,00 cada
            </p>
          </div>

          <div className="flex justify-center space-x-4"> {/* Adicionado espaçamento entre os botões */}
            <button
              onClick={gerarPagamento}
              disabled={processandoPagamento || limpandoCarrinho}
              className={`px-8 py-4 rounded-xl font-bold text-lg transition-all transform ${
                processandoPagamento || limpandoCarrinho
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 hover:scale-105 shadow-lg'
              } text-white flex items-center space-x-2`}
            >
              {processandoPagamento ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Gerando Pagamento...</span>
                </>
              ) : (
                <>
                  <span>💳</span>
                  <span>Gerar Pagamento</span>
                </>
              )}
            </button>

            <button
              onClick={limparCarrinho}
              disabled={limpandoCarrinho || processandoPagamento}
              className={`px-8 py-4 rounded-xl font-bold text-lg transition-all transform ${
                limpandoCarrinho || processandoPagamento
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-700 hover:scale-105 shadow-lg'
              } text-white flex items-center space-x-2`}
            >
              {limpandoCarrinho ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Limpando Carrinho...</span>
                </>
              ) : (
                <>
                  <span>🗑️</span>
                  <span>Limpar Carrinho</span>
                </>
              )}
            </button>
          </div>


          <div className="mt-4 text-center text-sm text-gray-600">
            <p>🔒 Pagamento seguro via PIX</p>
            <p>As instruções serão enviadas para seu WhatsApp</p>
          </div>
        </div>

        {/* Informações adicionais */}
        <div className="mt-6 bg-blue-50 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-blue-600">ℹ️</span>
            <h4 className="font-semibold text-blue-800">Informações Importantes</h4>
          </div>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• O pagamento deve ser realizado até 1 hora antes do primeiro jogo</li>
            <li>• Apostas não pagas serão automaticamente canceladas</li>
            <li>• Após o pagamento, você receberá um comprovante via WhatsApp</li>
            <li>• Os resultados serão divulgados após o término de todos os jogos</li>
          </ul>
        </div>
      </div>
    </div>
  );
}