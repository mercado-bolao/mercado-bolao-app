import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import QRCode from 'qrcode';

interface PixData {
  txid: string;
  qrcode: string;
  imagemQrcode: string;
  valor: number;
  expiracao: string;
  ambiente?: string;
}

// Componente QR Code personalizado
function QRCodeCanvas({ value }: { value: string }) {
  const canvasRef = useState<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (canvasRef[0] && value) {
      QRCode.toCanvas(canvasRef[0], value, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      }).catch((error: Error) => {
        console.error('Erro ao gerar QR Code:', error);
      });
    }
  }, [value, canvasRef]);

  return (
    <canvas
      ref={(canvas) => canvasRef[1](canvas)}
      className="w-64 h-64"
    />
  );
}

export default function PagamentoPix() {
  const router = useRouter();
  const [pixData, setPixData] = useState<PixData | null>(null);
  const [whatsapp, setWhatsapp] = useState('');
  const [copiado, setCopiado] = useState(false);
  const [tempoRestante, setTempoRestante] = useState<string>('');
  const [statusPix, setStatusPix] = useState<string>('ATIVA');



  const verificarStatus = useCallback(async () => {
    const bilheteDataStorage = localStorage.getItem('bilheteData');
    const pixDataStorage = localStorage.getItem('pixData');
    if (!bilheteDataStorage || !pixDataStorage) return;

    const bilhete = JSON.parse(bilheteDataStorage);
    const pix = JSON.parse(pixDataStorage);

    try {
      console.log('🔍 Verificando status do pagamento...', { bilheteId: bilhete.id, txid: bilhete.txid || pix.txid });

      // Primeiro verificar status local do bilhete
      const response = await fetch(`/api/verificar-status-pagamento?bilheteId=${bilhete.id}`);
      const data = await response.json();

      if (data.success) {
        console.log('📋 Status atual:', data.data.status);
        setStatusPix(data.data.status);

        if (data.data.status === 'PAGO') {
          // Pagamento confirmado
          console.log('✅ Pagamento confirmado via verificação automática!');

          // Mostrar notificação de sucesso
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('🎉 Pagamento Confirmado!', {
              body: 'Seus palpites foram validados com sucesso.',
              icon: '/favicon.ico'
            });
          }

          // Buscar dados completos do bilhete para a tela de confirmação
          try {
            const bilheteResponse = await fetch(`/api/consultar-bilhete?id=${data.data.id}`);
            const bilheteCompleto = await bilheteResponse.json();

            if (bilheteCompleto.success) {
              // Se o bilhete não tem palpites ou concurso, usar os dados básicos
              const bilheteParaSalvar = bilheteCompleto.bilhete || {
                id: data.data.id,
                txid: data.data.txid,
                valorTotal: data.data.valorTotal,
                whatsapp: data.data.whatsapp,
                nome: data.data.nome,
                status: data.data.status,
                createdAt: data.data.createdAt,
                palpites: [],
                concurso: null
              };

              // Salvar dados do bilhete confirmado
              localStorage.setItem('bilheteConfirmado', JSON.stringify(bilheteParaSalvar));

              // Limpar dados temporários
              localStorage.removeItem('bilheteData');
              localStorage.removeItem('pixData');

              // Redirecionar para tela de confirmação com ID do bilhete
              router.push(`/bilhete-confirmado?id=${data.data.id}`);
              return;
            } else {
              console.error('Erro ao buscar dados completos:', bilheteCompleto.error);
              // Usar dados básicos do bilhete
              const bilheteBasico = {
                id: data.data.id,
                txid: data.data.txid,
                valorTotal: data.data.valorTotal,
                whatsapp: data.data.whatsapp,
                nome: data.data.nome,
                status: data.data.status,
                createdAt: data.data.createdAt,
                palpites: [],
                concurso: null
              };

              localStorage.setItem('bilheteConfirmado', JSON.stringify(bilheteBasico));
              localStorage.removeItem('bilheteData');
              localStorage.removeItem('pixData');
              router.push(`/bilhete-confirmado?id=${data.data.id}`);
              return;
            }
          } catch (error) {
            console.error('Erro ao buscar dados do bilhete:', error);
            // Usar dados básicos em caso de erro
            const bilheteBasico = {
              id: data.data.id,
              txid: data.data.txid,
              valorTotal: data.data.valorTotal,
              whatsapp: data.data.whatsapp,
              nome: data.data.nome,
              status: data.data.status,
              createdAt: data.data.createdAt,
              palpites: [],
              concurso: null
            };

            localStorage.setItem('bilheteConfirmado', JSON.stringify(bilheteBasico));
            localStorage.removeItem('bilheteData');
            localStorage.removeItem('pixData');
            router.push(`/bilhete-confirmado?id=${data.data.id}`);
            return;
          }
        }

        if (data.data.status === 'EXPIRADO' || data.data.status === 'CANCELADO') {
          console.log('⏰ PIX expirado/cancelado');
          setStatusPix('EXPIRADA');
          alert('⏰ O tempo para pagamento expirou. Gere um novo PIX.');
          localStorage.removeItem('bilheteData');
          localStorage.removeItem('pixData');
          router.push('/finalizar');
          return;
        }

        // Se status ainda está PENDENTE, tentar verificar na EFÍ
        if (data.data.status === 'PENDENTE' && (bilhete.txid || pix.txid)) {
          const txidParaVerificar = bilhete.txid || pix.txid;
          console.log('🔍 Tentando verificar diretamente na EFÍ...', txidParaVerificar);

          try {
            const efiResponse = await fetch(`/api/admin/verificar-status-efi?txid=${txidParaVerificar}`);
            const efiData = await efiResponse.json();

            if (efiData.success && efiData.status === 'CONCLUIDA') {
              console.log('✅ PIX confirmado diretamente na EFÍ!');
              // O sistema já deve ter atualizado automaticamente, verificar novamente
              setTimeout(() => verificarStatus(), 2000);
            }
          } catch (efiError) {
            console.log('⚠️ Não foi possível verificar na EFÍ:', efiError);
          }
        }

        if (data.warning === 'TXID_FORMATO_ANTIGO') {
          console.log('⚠️ TXID formato antigo detectado - verificação limitada');
        }
      }
    } catch (error) {
      console.error('❌ Erro ao verificar status:', error);
    }
  }, [router]);

  useEffect(() => {
    // Recuperar dados do bilhete do localStorage
    const bilheteDataStorage = localStorage.getItem('bilheteData');
    const pixDataStorage = localStorage.getItem('pixData');

    if (!bilheteDataStorage || !pixDataStorage) {
      router.push('/finalizar');
      return;
    }

    const bilhete = JSON.parse(bilheteDataStorage);
    const pix = JSON.parse(pixDataStorage);

    setPixData(pix);
    setWhatsapp(bilhete.whatsapp || pix.whatsapp);

    // Timer para expiração e verificação de status (5 minutos)
    const interval = setInterval(() => {
      const agora = new Date().getTime();
      const expiracao = new Date(bilhete.expiresAt || pix.expiracao).getTime();
      const diferenca = expiracao - agora;

      if (diferenca > 0) {
        const minutos = Math.floor((diferenca % (1000 * 60 * 60)) / (1000 * 60));
        const segundos = Math.floor((diferenca % (1000 * 60)) / 1000);
        setTempoRestante(`${minutos}:${segundos.toString().padStart(2, '0')}`);
      } else {
        setTempoRestante('Expirado');
        setStatusPix('EXPIRADA');
        clearInterval(interval);
      }
    }, 1000);

    // Verificar status do PIX a cada 30 segundos
    const statusInterval = setInterval(verificarStatus, 30000);

    return () => {
      clearInterval(interval);
      clearInterval(statusInterval);
    };
  }, [router, verificarStatus]);

  useEffect(() => {
    // Pedir permissão para notificações
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Verificar imediatamente ao carregar
    verificarStatus();

    // Verificar mais frequentemente: a cada 5 segundos
    const interval = setInterval(verificarStatus, 5000);
    return () => clearInterval(interval);
  }, [verificarStatus]);

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

          {/* Status do PIX */}
          <div className={`rounded-lg p-3 mb-4 border ${statusPix === 'ATIVA' ? 'bg-blue-100 border-blue-400' :
            statusPix === 'PAGA' ? 'bg-green-100 border-green-400' :
              statusPix === 'EXPIRADA' ? 'bg-red-100 border-red-400' :
                'bg-gray-100 border-gray-400'
            }`}>
            <p className={`text-sm font-semibold ${statusPix === 'ATIVA' ? 'text-blue-800' :
              statusPix === 'PAGA' ? 'text-green-800' :
                statusPix === 'EXPIRADA' ? 'text-red-800' :
                  'text-gray-800'
              }`}>
              {statusPix === 'ATIVA' ? '🟢 PIX ATIVO' :
                statusPix === 'PAGA' ? '✅ PIX PAGO' :
                  statusPix === 'EXPIRADA' ? '🔴 PIX EXPIRADO' :
                    '⚪ STATUS DESCONHECIDO'}
            </p>
            <p className={`text-xs ${statusPix === 'ATIVA' ? 'text-blue-700' :
              statusPix === 'PAGA' ? 'text-green-700' :
                statusPix === 'EXPIRADA' ? 'text-red-700' :
                  'text-gray-700'
              }`}>
              {statusPix === 'ATIVA' ? `Aguardando pagamento • Expira em ${tempoRestante}` :
                statusPix === 'PAGA' ? 'Pagamento confirmado com sucesso!' :
                  statusPix === 'EXPIRADA' ? 'Este PIX expirou. Gere um novo pagamento.' :
                    'Status não identificado'}
            </p>
          </div>

          {/* Ambiente */}
          {pixData?.ambiente === 'sandbox' ? (
            <div className="bg-yellow-100 border border-yellow-400 rounded-lg p-3 mb-4">
              <p className="text-yellow-800 text-sm font-semibold">🧪 AMBIENTE SANDBOX</p>
              <p className="text-yellow-700 text-xs">Este é um PIX de teste. Nenhum valor real será cobrado.</p>
            </div>
          ) : (
            <div className="bg-green-100 border border-green-400 rounded-lg p-3 mb-4">
              <p className="text-green-800 text-sm font-semibold">💰 AMBIENTE PRODUÇÃO</p>
              <p className="text-green-700 text-xs">Este é um PIX real. O valor será cobrado na sua conta.</p>
            </div>
          )}
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
          <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">📱 QR Code PIX</h3>
          <div className="flex justify-center mb-4">
            <div className="bg-white p-6 rounded-xl border-2 border-gray-200 shadow-inner">
              {pixData.imagemQrcode ? (
                <Image
                  src={`data:image/png;base64,${pixData.imagemQrcode}`}
                  alt="QR Code PIX"
                  width={256}
                  height={256}
                  className="w-64 h-64"
                />
              ) : (
                <QRCodeCanvas value={pixData.qrcode} />
              )}
            </div>
          </div>
          <p className="text-center text-gray-600 text-sm">
            📲 Abra o app do seu banco e escaneie o QR Code acima
          </p>
        </div>

        {/* Código PIX Copia e Cola */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">📋 Código PIX Copia e Cola</h3>
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-4 mb-4 border border-gray-200">
            <div className="text-xs text-gray-700 font-mono break-all leading-relaxed max-h-32 overflow-y-auto">
              {pixData.qrcode}
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={copiarPix}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all transform hover:scale-105 ${copiado
                ? 'bg-green-600 text-white shadow-lg'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg'
                }`}
            >
              {copiado ? '✅ Código Copiado!' : '📋 Copiar Código PIX'}
            </button>
            <button
              onClick={() => {
                const texto = `💰 *PIX GERADO* - Bolão TVLoteca\n\n🔢 *Valor:* R$ ${pixData.valor.toFixed(2)}\n📱 *WhatsApp:* ${whatsapp}\n🆔 *TXID:* ${pixData.txid}\n\n📋 *Código PIX:*\n${pixData.qrcode}\n\n⏰ *Válido até:* ${new Date(pixData.expiracao).toLocaleString('pt-BR')}`;
                navigator.clipboard.writeText(texto);
                alert('📱 Dados completos copiados para compartilhar!');
              }}
              className="px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all transform hover:scale-105 shadow-lg"
              title="Copiar dados completos para WhatsApp"
            >
              📱
            </button>
          </div>
        </div>

        {/* Instruções */}
        <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
          <h4 className="font-semibold text-blue-800 mb-3">📋 Como pagar:</h4>
          <ol className="text-sm text-blue-700 space-y-2">
            <li><strong>1.</strong> Abra o app do seu banco</li>
            <li><strong>2.</strong> Procure pela opção &quot;PIX&quot; ou &quot;Pagar com QR Code&quot;</li>
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