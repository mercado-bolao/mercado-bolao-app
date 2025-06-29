
import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function RecuperarComprovante() {
  const router = useRouter();
  const [whatsapp, setWhatsapp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const buscarBilhetePago = async () => {
    if (!whatsapp.trim()) {
      setError('Digite seu WhatsApp');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/recuperar-bilhete-pago?whatsapp=${encodeURIComponent(whatsapp)}`);
      const data = await response.json();

      if (data.success) {
        // Salvar dados do bilhete confirmado
        localStorage.setItem('bilheteConfirmado', JSON.stringify(data.bilhete));
        
        // Redirecionar para o comprovante
        router.push('/bilhete-confirmado');
      } else {
        setError(data.error || 'Nenhum bilhete pago encontrado');
      }
    } catch (error) {
      console.error('Erro ao buscar bilhete:', error);
      setError('Erro ao buscar bilhete. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const formatarWhatsApp = (valor: string) => {
    // Remove tudo que não é número
    const numeros = valor.replace(/\D/g, '');
    
    // Formatação baseada no tamanho
    if (numeros.length <= 11) {
      return numeros.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    
    return numeros;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">📄</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">Recuperar Comprovante</h1>
            </div>
            <Link href="/">
              <span className="text-blue-600 hover:text-blue-800 font-medium cursor-pointer">
                🏠 Início
              </span>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-6">
            <div className="w-20 h-20 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-4xl">🔍</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Recuperar Comprovante</h2>
            <p className="text-gray-600">Digite seu WhatsApp para encontrar seus bilhetes pagos</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                WhatsApp
              </label>
              <input
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="(81) 99999-9999"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">
                Digite apenas os números do seu WhatsApp
              </p>
            </div>

            <button
              onClick={buscarBilhetePago}
              disabled={loading || !whatsapp.trim()}
              className={`w-full py-3 px-4 rounded-lg font-bold text-lg transition-all transform ${
                loading || !whatsapp.trim()
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 hover:scale-105 shadow-lg'
              } text-white flex items-center justify-center space-x-2`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Buscando...</span>
                </>
              ) : (
                <>
                  <span>🔍</span>
                  <span>Buscar Comprovante</span>
                </>
              )}
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 mb-4">
              Não encontrou seu comprovante?
            </p>
            <div className="space-y-2">
              <Link href="/finalizar">
                <button className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium transition-colors">
                  ➕ Fazer Nova Aposta
                </button>
              </Link>
              <Link href="/">
                <button className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg font-medium transition-colors">
                  🏠 Voltar ao Início
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Informações adicionais */}
        <div className="mt-6 bg-blue-50 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-blue-600">ℹ️</span>
            <h4 className="font-semibold text-blue-800">Como funciona?</h4>
          </div>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Digite o mesmo WhatsApp usado na aposta</li>
            <li>• O sistema buscará seu bilhete pago mais recente</li>
            <li>• Você será redirecionado para o comprovante</li>
            <li>• Poderá compartilhar novamente no WhatsApp</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
