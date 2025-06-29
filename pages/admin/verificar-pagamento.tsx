
import { useState } from 'react';
import Link from 'next/link';

export default function VerificarPagamento() {
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<any>(null);
  const [data, setData] = useState('29/06/2025, 16:05:55');
  const [whatsapp, setWhatsapp] = useState('81981179564');
  const [txid, setTxid] = useState('');
  const [metodo, setMetodo] = useState<'data' | 'txid'>('data');

  const verificarPagamento = async () => {
    setLoading(true);
    setResultado(null);

    try {
      const body = metodo === 'data' 
        ? { data, whatsapp }
        : { txid };

      const response = await fetch('/api/admin/verificar-pagamento-especifico', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();
      setResultado(data);

    } catch (error) {
      setResultado({
        success: false,
        error: 'Erro ao fazer requisição',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
            ← Voltar ao Admin
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Verificar Pagamento Específico</h1>
          <p className="text-gray-600 mt-2">Verificar pagamentos que podem não ter sido reconhecidos automaticamente</p>
        </div>

        {/* Formulário */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Método de busca:
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="data"
                  checked={metodo === 'data'}
                  onChange={(e) => setMetodo(e.target.value as 'data')}
                  className="mr-2"
                />
                Por Data e WhatsApp
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="txid"
                  checked={metodo === 'txid'}
                  onChange={(e) => setMetodo(e.target.value as 'txid')}
                  className="mr-2"
                />
                Por TXID
              </label>
            </div>
          </div>

          {metodo === 'data' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data e Hora (formato: DD/MM/YYYY, HH:MM:SS)
                </label>
                <input
                  type="text"
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  className="w-full p-3 border rounded-lg"
                  placeholder="29/06/2025, 16:05:55"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  WhatsApp
                </label>
                <input
                  type="text"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="w-full p-3 border rounded-lg"
                  placeholder="81981179564"
                />
              </div>
            </div>
          ) : (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                TXID
              </label>
              <input
                type="text"
                value={txid}
                onChange={(e) => setTxid(e.target.value)}
                className="w-full p-3 border rounded-lg"
                placeholder="Digite o TXID do PIX"
              />
            </div>
          )}

          <button
            onClick={verificarPagamento}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Verificando...' : 'Verificar Pagamento'}
          </button>
        </div>

        {/* Resultados */}
        {resultado && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Resultado da Verificação</h2>
            
            {resultado.success ? (
              <div>
                {/* Resumo */}
                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                  <h3 className="font-semibold text-blue-900 mb-2">Resumo:</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Total:</span>
                      <div className="font-semibold">{resultado.resumo?.totalBilhetes || 0}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Pagos na EFI:</span>
                      <div className="font-semibold text-green-600">{resultado.resumo?.bilhetesPagos || 0}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Atualizados:</span>
                      <div className="font-semibold text-blue-600">{resultado.resumo?.bilhetesAtualizados || 0}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Com erro:</span>
                      <div className="font-semibold text-red-600">{resultado.resumo?.bilhetesComErro || 0}</div>
                    </div>
                  </div>
                </div>

                {/* Detalhes dos bilhetes */}
                <div className="space-y-4">
                  {resultado.resultados?.map((bilhete: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <div className="text-sm text-gray-600">Bilhete ID:</div>
                          <div className="font-mono text-xs">{bilhete.bilheteId}</div>
                          <div className="text-sm text-gray-600 mt-2">TXID:</div>
                          <div className="font-mono text-xs">{bilhete.txid}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Valor:</div>
                          <div className="font-semibold">R$ {bilhete.valor}</div>
                          <div className="text-sm text-gray-600 mt-2">WhatsApp:</div>
                          <div>{bilhete.whatsapp}</div>
                          <div className="text-sm text-gray-600 mt-2">Criado em:</div>
                          <div className="text-sm">{bilhete.criadoEm}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Status no Banco:</div>
                          <div className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                            bilhete.statusBanco === 'PAGO' ? 'bg-green-100 text-green-800' :
                            bilhete.statusBanco === 'PENDENTE' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {bilhete.statusBanco}
                          </div>
                          
                          {bilhete.statusEfi && (
                            <>
                              <div className="text-sm text-gray-600 mt-2">Status na EFI:</div>
                              <div className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                                bilhete.statusEfi === 'CONCLUIDA' ? 'bg-green-100 text-green-800' :
                                bilhete.statusEfi === 'ATIVA' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {bilhete.statusEfi}
                              </div>
                            </>
                          )}

                          {bilhete.atualizado && (
                            <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-semibold mt-2">
                              ✅ ATUALIZADO PARA PAGO
                            </div>
                          )}

                          {bilhete.erro && (
                            <div className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs mt-2">
                              ❌ {bilhete.erro}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="text-red-800 font-semibold">Erro:</div>
                <div className="text-red-700">{resultado.error}</div>
                {resultado.details && (
                  <div className="text-red-600 text-sm mt-2">{resultado.details}</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
