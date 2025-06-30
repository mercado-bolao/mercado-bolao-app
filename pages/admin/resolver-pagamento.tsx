import { useState } from 'react';
import Link from 'next/link';
import { withAdminAuth } from '@/components/withAdminAuth';

function ResolverPagamento() {
  const [whatsapp, setWhatsapp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<any>(null);

  const resolverPagamento = async () => {
    if (!whatsapp.trim()) {
      alert('❌ Digite o número do WhatsApp');
      return;
    }

    setLoading(true);
    setResultado(null);

    try {
      console.log('🔍 Resolvendo pagamento para:', whatsapp);

      // Primeiro tentar verificação automática
      const responseVerificar = await fetch('/api/admin/force-verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          whatsapp: whatsapp.trim(),
          forcarAtualizacao: false
        }),
      });

      const dataVerificar = await responseVerificar.json();

      if (dataVerificar.success) {
        setResultado({
          tipo: 'sucesso_automatico',
          message: dataVerificar.message,
          bilhete: dataVerificar.bilhete
        });
        return;
      }

      // Se não conseguiu automaticamente, perguntar se quer forçar
      if (confirm(`⚠️ Não foi possível verificar automaticamente.\n\n${dataVerificar.message || dataVerificar.error}\n\nVocê confirma que o pagamento foi realizado e quer marcar como PAGO manualmente?`)) {

        const responseForcar = await fetch('/api/admin/force-verify-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            whatsapp: whatsapp.trim(),
            forcarAtualizacao: true
          }),
        });

        const dataForcar = await responseForcar.json();

        if (dataForcar.success) {
          setResultado({
            tipo: 'sucesso_manual',
            message: dataForcar.message,
            bilhete: dataForcar.bilhete
          });
        } else {
          setResultado({
            tipo: 'erro',
            message: dataForcar.error || 'Erro ao forçar pagamento'
          });
        }
      } else {
        setResultado({
          tipo: 'cancelado',
          message: 'Operação cancelada pelo usuário'
        });
      }

    } catch (error) {
      console.error('Erro:', error);
      setResultado({
        tipo: 'erro',
        message: 'Erro interno do servidor'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">🔧</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">Resolver Problema de Pagamento</h1>
            </div>
            <Link href="/admin">
              <span className="text-blue-600 hover:text-blue-800 font-medium cursor-pointer">
                ← Voltar ao Admin
              </span>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Formulário */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            🔍 Buscar e Resolver Pagamento
          </h2>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Número do WhatsApp
            </label>
            <input
              type="text"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="Ex: 81999999999"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <button
            onClick={resolverPagamento}
            disabled={loading || !whatsapp.trim()}
            className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${loading || !whatsapp.trim()
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-orange-600 hover:bg-orange-700 text-white'
              }`}
          >
            {loading ? '🔄 Verificando...' : '🔍 Verificar e Resolver Pagamento'}
          </button>
        </div>

        {/* Resultado */}
        {resultado && (
          <div className={`rounded-xl p-6 border ${resultado.tipo === 'sucesso_automatico' ? 'bg-green-50 border-green-200' :
              resultado.tipo === 'sucesso_manual' ? 'bg-blue-50 border-blue-200' :
                resultado.tipo === 'erro' ? 'bg-red-50 border-red-200' :
                  'bg-yellow-50 border-yellow-200'
            }`}>
            <h3 className={`text-lg font-semibold mb-3 ${resultado.tipo === 'sucesso_automatico' ? 'text-green-800' :
                resultado.tipo === 'sucesso_manual' ? 'text-blue-800' :
                  resultado.tipo === 'erro' ? 'text-red-800' :
                    'text-yellow-800'
              }`}>
              {resultado.tipo === 'sucesso_automatico' ? '✅ Pagamento Confirmado Automaticamente!' :
                resultado.tipo === 'sucesso_manual' ? '🔧 Pagamento Marcado Manualmente!' :
                  resultado.tipo === 'erro' ? '❌ Erro na Verificação' :
                    '⚠️ Operação Cancelada'}
            </h3>

            <p className={`mb-4 ${resultado.tipo === 'sucesso_automatico' ? 'text-green-700' :
                resultado.tipo === 'sucesso_manual' ? 'text-blue-700' :
                  resultado.tipo === 'erro' ? 'text-red-700' :
                    'text-yellow-700'
              }`}>
              {resultado.message}
            </p>

            {resultado.bilhete && (
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2">📋 Detalhes do Bilhete:</h4>
                <div className="space-y-1 text-sm">
                  <p><strong>ID:</strong> {resultado.bilhete.id}</p>
                  <p><strong>Status:</strong>
                    <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                      {resultado.bilhete.status}
                    </span>
                  </p>
                  <p><strong>Valor:</strong> R$ {resultado.bilhete.valorTotal?.toFixed(2)}</p>
                  {resultado.bilhete.txid && (
                    <p><strong>TXID:</strong>
                      <span className="ml-2 font-mono text-xs">{resultado.bilhete.txid}</span>
                    </p>
                  )}
                  {resultado.bilhete.palpitesAtualizados && (
                    <p><strong>Palpites Atualizados:</strong> {resultado.bilhete.palpitesAtualizados}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Instruções */}
        <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
          <h4 className="font-semibold text-blue-800 mb-3">📋 Como usar esta ferramenta:</h4>
          <ol className="text-sm text-blue-700 space-y-2">
            <li><strong>1.</strong> Digite o número do WhatsApp do cliente (apenas números)</li>
            <li><strong>2.</strong> Clique em "Verificar e Resolver Pagamento"</li>
            <li><strong>3.</strong> O sistema tentará verificar automaticamente na EFÍ Pay</li>
            <li><strong>4.</strong> Se não conseguir, será perguntado se quer marcar manualmente</li>
            <li><strong>5.</strong> Confirme apenas se você verificou que o pagamento foi realizado</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

export default withAdminAuth(ResolverPagamento);
