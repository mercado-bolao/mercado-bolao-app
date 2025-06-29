
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

interface PixData {
  txid: string;
  qrcode: string;
  imagemQrcode: string;
  valor: number;
  expiracao: string;
}

export default function PagamentoPix() {
  const router = useRouter();
  const [pixData, setPixData] = useState<PixData | null>(null);
  const [whatsapp, setWhatsapp] = useState('');
  const [copiado, setCopiado] = useState(false);
  const [tempoRestante, setTempoRestante] = useState<string>('');

  useEffect(() => {
    // Recuperar dados do PIX do localStorage
    const pixDataStorage = localStorage.getItem('pixData');
    const whatsappStorage = localStorage.getItem('pixWhatsapp');

    if (!pixDataStorage || !whatsappStorage) {
      router.push('/finalizar');
      return;
    }

    const pix = JSON.parse(pixDataStorage);
    setPixData(pix);
    setWhatsapp(whatsappStorage);

    // Timer para expiração
    const interval = setInterval(() => {
      const agora = new Date().getTime();
      const expiracao = new Date(pix.expiracao).getTime();
      const diferenca = expiracao - agora;

      if (diferenca > 0) {
        const minutos = Math.floor((diferenca % (1000 * 60 * 60)) / (1000 * 60));
        const segundos = Math.floor((diferenca % (1000 * 60)) / 1000);
        setTempoRestante(`${minutos}:${segundos.toString().padStart(2, '0')}`);
      } else {
        setTempoRestante('Expirado');
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [router]);

  const copiarPix = async () => {
    if (pixData?.qrcode) {
      try {
        await navigator.clipboard.writeText(pixData.qrcode);
        setCopiado(true);
        setTimeout(() => setCopiado(false), 3000);
      } catch (error) {
        console.error('Erro ao copiar:', error);
      }
    }
  };

  if (!pixData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Carregando pagamento...</p>
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
                <span className="text-white font-bold">💳</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">Pagamento PIX</h1>
            </div>
            <Link href="/finalizar">
              <span className="text-blue-600 hover:text-blue-800 font-medium cursor-pointer">
                ← Voltar
              </span>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status do pagamento */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 text-center">
          <div className="w-20 h-20 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
            <span className="text-4xl">💰</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">PIX Gerado com Sucesso!</h2>
          <p className="text-gray-600 mb-4">Escaneie o QR Code ou copie o código PIX</p>
          <div className="bg-green-50 rounded-lg p-4 mb-4">
            <div className="text-3xl font-bold text-green-600">R$ {pixData.valor.toFixed(2)}</div>
            <div className="text-sm text-green-700">WhatsApp: {whatsapp}</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
            <div className="text-yellow-800 font-semibold">⏰ Tempo restante: {tempoRestante}</div>
          </div>
        </div>

        {/* QR Code */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">QR Code PIX</h3>
          <div className="flex justify-center mb-4">
            <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
              <img 
                src={`data:image/png;base64,${pixData.imagemQrcode}`}
                alt="QR Code PIX"
                className="w-64 h-64"
              />
            </div>
          </div>
          <p className="text-center text-gray-600 text-sm">
            Abra o app do seu banco e escaneie o QR Code acima
          </p>
        </div>

        {/* Código PIX */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Código PIX Copia e Cola</h3>
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="text-xs text-gray-600 font-mono break-all">
              {pixData.qrcode}
            </div>
          </div>
          <button
            onClick={copiarPix}
            className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
              copiado
                ? 'bg-green-600 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {copiado ? '✅ Código Copiado!' : '📋 Copiar Código PIX'}
          </button>
        </div>

        {/* Instruções */}
        <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
          <h4 className="font-semibold text-blue-800 mb-3">📋 Como pagar:</h4>
          <ol className="text-sm text-blue-700 space-y-2">
            <li><strong>1.</strong> Abra o app do seu banco</li>
            <li><strong>2.</strong> Procure pela opção "PIX" ou "Pagar com QR Code"</li>
            <li><strong>3.</strong> Escaneie o QR Code acima OU copie e cole o código PIX</li>
            <li><strong>4.</strong> Confirme o pagamento de R$ {pixData.valor.toFixed(2)}</li>
            <li><strong>5.</strong> Após o pagamento, você receberá a confirmação via WhatsApp</li>
          </ol>
          
          <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-yellow-800 text-sm">
              <strong>⚠️ Importante:</strong> O PIX expira em 1 hora. Após o vencimento, será necessário gerar um novo pagamento.
            </p>
          </div>
        </div>

        {/* Botões de ação */}
        <div className="mt-6 flex flex-col sm:flex-row gap-4">
          <Link href="/" className="flex-1">
            <button className="w-full bg-gray-600 hover:bg-gray-700 text-white py-3 px-6 rounded-lg font-semibold transition-colors">
              🏠 Voltar ao Início
            </button>
          </Link>
          <button 
            onClick={() => window.location.reload()}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-semibold transition-colors"
          >
            🔄 Atualizar Status
          </button>
        </div>
      </div>
    </div>
  );
}
