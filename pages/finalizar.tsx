import { useState, useEffect, useCallback } from 'react';
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
  const [isLoading, setIsLoading] = useState(false);

  const buscarDados = useCallback(async (whatsapp: string) => {
    if (!whatsapp) return;

    setIsLoading(true);
    try {
      await buscarPalpitesPendentes(whatsapp);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Evitar múltiplas execuções
    if (isLoading) return;

    // Buscar WhatsApp do localStorage ou query params
    const whatsappStorage = localStorage.getItem('whatsapp');
    const whatsappQuery = router.query.whatsapp as string;

    if (whatsappQuery && whatsappQuery !== whatsapp) {
      setWhatsapp(whatsappQuery);
      buscarDados(whatsappQuery);
    } else if (whatsappStorage && !whatsappQuery && whatsappStorage !== whatsapp) {
      setWhatsapp(whatsappStorage);
      buscarDados(whatsappStorage);
    } else if (!whatsappQuery && !whatsappStorage && !error) {
      setError('WhatsApp não encontrado. Faça uma aposta primeiro.');
      setLoading(false);
    }
  }, [router.query.whatsapp, buscarDados, whatsapp, isLoading, error]);

  const buscarPalpitesPendentes = async (whatsappUsuario: string) => {
    try {
      setLoading(true);
      console.log('🔍 Buscando palpites para:', whatsappUsuario);
      
      const response = await fetch(`/api/palpites-pendentes?whatsapp=${encodeURIComponent(whatsappUsuario)}`);
      
      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', response.headers.get('content-type'));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erro da API:', errorText);
        throw new Error(`Erro ao buscar palpites pendentes: ${response.status}`);
      }

      // Verificar se a resposta é JSON válido
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text();
        console.error('❌ Resposta não é JSON:', responseText);
        throw new Error('Servidor retornou resposta inválida (não JSON)');
      }

      const data = await response.json();
      console.log('✅ Dados recebidos:', data);
      setPalpitesPendentes(data);
    } catch (error) {
      console.error('❌ Erro ao buscar palpites:', error);
      if (error instanceof Error && error.message.includes('JSON')) {
        setError('Erro de comunicação com o servidor. Tente recarregar a página.');
      } else {
        setError('Erro ao carregar seus palpites pendentes.');
      }
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
      console.log('📤 Dados enviados:', {
        whatsapp: whatsapp,
        valorTotal: palpitesPendentes.valorTotal,
        totalBilhetes: palpitesPendentes.totalBilhetes,
      });

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

      console.log('📡 Response status PIX:', response.status);
      console.log('📡 Response headers PIX:', response.headers.get('content-type'));

      let data;
      try {
        const responseText = await response.text();
        console.log('📄 Response text (primeiros 200 chars):', responseText.substring(0, 200));
        
        // Verificar se é HTML (erro de servidor)
        if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
          console.error('❌ Servidor retornou HTML ao invés de JSON');
          throw new Error('O servidor está retornando uma página de erro. Verifique os logs do servidor.');
        }
        
        // Verificar se é JSON válido
        if (!responseText.trim()) {
          throw new Error('Resposta vazia do servidor');
        }
        
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ Erro ao fazer parse da resposta:', parseError);
        console.error('❌ Response text completa:', responseText);
        
        if (parseError instanceof SyntaxError) {
          throw new Error('Servidor retornou resposta inválida (não é JSON válido)');
        } else {
          throw new Error('Erro ao processar resposta do servidor');
        }
      }

      console.log('📥 Dados recebidos PIX:', data);

      if (!response.ok) {
        const errorMessage = data.error || data.details || 'Erro ao gerar PIX';
        console.error('❌ Erro da API PIX:', {
          status: response.status,
          error: data.error,
          details: data.details,
          suggestion: data.suggestion
        });
        throw new Error(errorMessage);
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
      
      let mensagemErro = 'Erro desconhecido';
      if (error instanceof Error) {
        mensagemErro = error.message;
        
        // Mensagens mais específicas baseadas no erro
        if (mensagemErro.includes('certificado') || mensagemErro.includes('certificate')) {
          mensagemErro = 'Erro de certificado EFI. Verifique a configuração dos Secrets.';
        } else if (mensagemErro.includes('sandbox')) {
          mensagemErro = 'Erro de configuração do ambiente EFI. Verifique os Secrets.';
        } else if (mensagemErro.includes('Credenciais EFI Pay inválidas') || mensagemErro.includes('Invalid or inactive credentials')) {
          mensagemErro = '🔑 Credenciais EFI Pay inválidas ou inativas.\n\n📋 Verifique nos Secrets:\n• EFI_CLIENT_ID\n• EFI_CLIENT_SECRET\n\n💡 As credenciais podem estar incorretas ou sua conta EFI pode estar inativa.';
        } else if (mensagemErro.includes('401')) {
          mensagemErro = 'Credenciais EFI inválidas. Verifique CLIENT_ID e CLIENT_SECRET.';
        } else if (mensagemErro.includes('422')) {
          mensagemErro = 'Erro nos dados enviados para EFI. Verifique a chave PIX.';
        }
      }
      
      alert(`❌ Erro ao gerar pagamento PIX:\n\n${mensagemErro}\n\n💡 Dica: Verifique se todos os Secrets da EFI estão configurados corretamente.`);
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
            <div className="mt-2 bg-green-100 border border-green-400 rounded-lg p-2">
              <p className="text-green-800 text-xs font-semibold">💰 AMBIENTE PRODUÇÃO ATIVO</p>
              <p className="text-green-700 text-xs">Pagamentos reais serão processados</p>
            </div>
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