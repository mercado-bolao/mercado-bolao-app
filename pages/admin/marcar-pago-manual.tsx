import { useState } from 'react';
import Layout from '../../components/Layout';
import { withAdminAuth } from '@/components/withAdminAuth';

function MarcarPagoManual() {
  const [bilheteId, setBilheteId] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<any>(null);

  const marcarComoPago = async () => {
    if (!bilheteId.trim()) {
      alert('Digite o ID do bilhete');
      return;
    }

    setLoading(true);
    setResultado(null);

    try {
      const response = await fetch('/api/admin/marcar-como-pago', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bilheteId: bilheteId.trim()
        }),
      });

      const data = await response.json();
      setResultado(data);

      if (data.success) {
        alert('✅ Bilhete marcado como PAGO com sucesso!');
        setBilheteId('');
      } else {
        alert(`❌ Erro: ${data.error}`);
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('❌ Erro ao processar solicitação');
    } finally {
      setLoading(false);
    }
  };

  const testarNovoTxid = async () => {
    setLoading(true);

    try {
      const response = await fetch('/api/admin/test-novo-txid');
      const data = await response.json();

      console.log('📋 Resultado do teste de TXID:', data);
      alert('✅ Teste concluído! Veja o console para detalhes.');
    } catch (error) {
      console.error('Erro:', error);
      alert('❌ Erro no teste de TXID');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Marcar Bilhete como Pago (Manual)</h1>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">⚠️ Ferramenta de Emergência</h2>
          <p className="text-gray-600 mb-4">
            Use esta ferramenta apenas quando houver problemas com a verificação automática de pagamentos.
          </p>

          <div className="space-y-4">
            <div>
              <label htmlFor="bilheteId" className="block text-sm font-medium text-gray-700 mb-2">
                ID do Bilhete
              </label>
              <input
                type="text"
                id="bilheteId"
                value={bilheteId}
                onChange={(e) => setBilheteId(e.target.value)}
                placeholder="Digite o ID do bilhete (ex: 6d3ddc10-bf7b-42a0-bc54-fd24a0f30542)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={marcarComoPago}
              disabled={loading}
              className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? 'Processando...' : '🔧 Marcar como PAGO'}
            </button>
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">🧪 Teste do Novo TXID</h2>
          <p className="text-gray-600 mb-4">
            Testar o novo formato de TXID para garantir compatibilidade com a EFI Pay.
          </p>

          <button
            onClick={testarNovoTxid}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Testando...' : '🧪 Testar Novo TXID'}
          </button>
        </div>

        {resultado && (
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-2">Resultado:</h3>
            <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
              {JSON.stringify(resultado, null, 2)}
            </pre>
          </div>
        )}

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">📝 Instruções de Uso</h3>
          <ol className="list-decimal list-inside text-yellow-700 space-y-1">
            <li>Copie o ID do bilhete que precisa ser marcado como pago</li>
            <li>Cole no campo acima e clique em "Marcar como PAGO"</li>
            <li>O sistema irá atualizar o bilhete e todos os palpites associados</li>
            <li>Use o teste de TXID para verificar se o novo formato está funcionando</li>
          </ol>
        </div>
      </div>
    </Layout>
  );
}

export default withAdminAuth(MarcarPagoManual);
