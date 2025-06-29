import { useState, useEffect } from "react";
import Link from "next/link";

interface Bilhete {
  id: string;
  whatsapp: string;
  nome: string;
  valorTotal: number;
  quantidadePalpites: number;
  status: string;
  txid: string | null;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  userAgent?: string;
  ipAddress?: string;
  pix?: {
    id: string;
    status: string;
    ambiente: string;
  };
}

interface VerificarStatusResponse {
  success: boolean;
  status: string;
  message?: string;
  error?: string;
}

export default function BilhetesAdmin() {
  const [bilhetes, setBilhetes] = useState<Bilhete[]>([]);
  const [loading, setLoading] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState<'confirmados' | 'nao-pagos'>('confirmados');
  const [senhaAdmin, setSenhaAdmin] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [verificandoStatus, setVerificandoStatus] = useState<string | null>(null);
  const [verificandoTodos, setVerificandoTodos] = useState(false);

  useEffect(() => {
    buscarBilhetes();

    // Auto-atualizar a cada 10 segundos
    const autoUpdate = setInterval(() => {
      buscarBilhetes();
    }, 10000);

    return () => clearInterval(autoUpdate);
  }, []);

  const buscarBilhetes = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/bilhetes');
      const data = await response.json();

      if (data.success) {
        setBilhetes(data.bilhetes || []);
      } else {
        console.error('Erro ao buscar bilhetes:', data.error);
        setBilhetes([]);
      }
    } catch (error) {
      console.error('Erro ao buscar bilhetes:', error);
      setBilhetes([]);
    } finally {
      setLoading(false);
    }
  };

  const verificarStatusEfi = async (txid: string, bilheteId: string) => {
    if (!txid) {
      alert('TXID não disponível para este bilhete');
      return;
    }

    setVerificandoStatus(bilheteId);

    try {
      const response = await fetch(`/api/admin/verificar-status-efi?txid=${txid}`);
      const data: VerificarStatusResponse = await response.json();

      if (data.success) {
        alert(`✅ Status verificado via EFÍ:\n\nStatus: ${data.status}\n\n${data.message || ''}`);
        // Recarregar lista após verificação
        await buscarBilhetes();
      } else {
        if (data.error?.includes('TXID inválido')) {
          alert(`❌ TXID com formato inválido:\n\n${data.error}\n\nEste bilhete foi criado com um TXID no formato antigo. Para corrigir, será necessário gerar um novo PIX.`);
        } else {
          alert(`❌ Erro ao verificar status:\n\n${data.error || 'Erro desconhecido'}`);
        }
      }
    } catch (error) {
      console.error('Erro ao verificar status:', error);
      alert('❌ Erro ao consultar EFÍ Pay. Verifique a conexão.');
    } finally {
      setVerificandoStatus(null);
    }
  };

  const verificarTodosPendentes = async () => {
    setVerificandoTodos(true);

    try {
      const response = await fetch('/api/verificar-pix-pendentes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        alert(`✅ Verificação concluída!\n\n📊 Bilhetes verificados: ${data.bilhetesVerificados}\n💰 PIX atualizados: ${data.pixAtualizados}`);
        await buscarBilhetes();
      } else {
        alert(`❌ Erro: ${data.error}`);
      }
    } catch (error) {
      console.error('Erro ao verificar PIX pendentes:', error);
      alert('❌ Erro ao verificar PIX pendentes');
    } finally {
      setVerificandoTodos(false);
    }
  };

  const marcarComoPago = async (bilheteId: string) => {
    if (!senhaAdmin.trim()) {
      alert('❌ Digite a senha de administrador');
      return;
    }

    if (!confirm('⚠️ Confirma marcar este bilhete como PAGO manualmente?')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/marcar-pago', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bilheteId,
          senhaAdmin
        })
      });

      const data = await response.json();

      if (data.success) {
        alert('✅ Bilhete marcado como PAGO com sucesso!');
        setSenhaAdmin('');
        await buscarBilhetes();
      } else {
        alert(`❌ Erro: ${data.error}`);
      }
    } catch (error) {
      console.error('Erro ao marcar como pago:', error);
      alert('❌ Erro ao processar solicitação');
    }
  };

  const bilhetesFiltrados = bilhetes.filter(bilhete => {
    if (abaAtiva === 'confirmados') {
      return bilhete.status === 'PAGO';
    } else {
      return bilhete.status === 'PENDENTE' || bilhete.status === 'CANCELADO';
    }
  });

  const formatarData = (dataString: string) => {
    return new Date(dataString).toLocaleString('pt-BR');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAGO': return 'bg-green-100 text-green-800 border-green-300';
      case 'PENDENTE': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'CANCELADO': return 'bg-red-100 text-red-800 border-red-300';
      case 'EXPIRADO': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusDetalhado = (bilhete: Bilhete) => {
    const agora = new Date();
    const expiracao = new Date(bilhete.expiresAt);

    if (bilhete.status === 'PAGO') {
      return { status: 'PAGO', cor: 'bg-green-100 text-green-800 border-green-300' };
    }

    if (bilhete.status === 'CANCELADO') {
      return { status: 'CANCELADO', cor: 'bg-red-100 text-red-800 border-red-300' };
    }

    if (agora > expiracao) {
      return { status: 'EXPIRADO', cor: 'bg-gray-100 text-gray-800 border-gray-300' };
    }

    return { status: 'PENDENTE', cor: 'bg-yellow-100 text-yellow-800 border-yellow-300' };
  };

  const formatarDispositivo = (userAgent?: string) => {
    if (!userAgent) return 'Não informado';

    let dispositivo = 'Desconhecido';
    let navegador = 'Desconhecido';

    // Detectar sistema operacional
    if (userAgent.includes('Android')) {
      const androidMatch = userAgent.match(/Android ([0-9._]+)/);
      dispositivo = androidMatch ? `Android ${androidMatch[1]}` : 'Android';
    } else if (userAgent.includes('iPhone')) {
      dispositivo = 'iPhone';
    } else if (userAgent.includes('iPad')) {
      dispositivo = 'iPad';
    } else if (userAgent.includes('Windows')) {
      dispositivo = 'Windows';
    } else if (userAgent.includes('Mac')) {
      dispositivo = 'macOS';
    } else if (userAgent.includes('Linux')) {
      dispositivo = 'Linux';
    }

    // Detectar navegador
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
      navegador = 'Chrome';
    } else if (userAgent.includes('Firefox')) {
      navegador = 'Firefox';
    } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      navegador = 'Safari';
    } else if (userAgent.includes('Edg')) {
      navegador = 'Edge';
    }

    return `${dispositivo} - ${navegador}`;
  };

  const verificarEfi = async (bilheteId: string) => {
    setVerificandoStatus(bilheteId);
    
    try {
      const response = await fetch(`/api/verificar-status-pagamento?bilheteId=${bilheteId}`);
      const data = await response.json();

      if (data.success) {
        if (data.statusAtualizado) {
          alert(`✅ Status atualizado!\n\nStatus: ${data.status}\nBilhete foi atualizado no sistema.`);
        } else {
          alert(`📋 Status atual: ${data.status}\n\nNenhuma alteração necessária.`);
        }
        // Recarregar dados após verificação
        buscarBilhetes();
      } else {
        if (data.error?.includes('TXID com formato inválido') || data.error?.includes('formato antigo')) {
          alert(`⚠️ TXID Incompatível\n\nEste bilhete foi criado com um TXID no formato antigo que não é mais aceito pela EFÍ Pay.\n\nPara verificar o pagamento:\n1. Use "Marcar como PAGO" se confirmou o pagamento manualmente\n2. Ou gere um novo PIX para o cliente`);
        } else {
          alert(`❌ Erro: ${data.error}`);
        }
      }
    } catch (error) {
      console.error('Erro ao verificar EFÍ:', error);
      alert('❌ Erro ao verificar status na EFÍ');
    } finally {
      setVerificandoStatus(null);
    }
  };

  const forcarVerificacaoPagamento = async (bilheteId: string, txid: string) => {
    try {
      console.log('🔍 Forçando verificação de pagamento...');

      const response = await fetch('/api/admin/forcar-verificacao-pagamento', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bilheteId, txid }),
      });

      const data = await response.json();

      if (data.success) {
        alert('✅ ' + data.message);
        buscarBilhetes();
      } else {
        alert('❌ Erro: ' + data.error);
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao verificar pagamento');
    }
  };


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">💳</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">Bilhetes - Status de Pagamento</h1>
            </div>
            <Link href="/admin">
              <span className="text-blue-600 hover:text-blue-800 font-medium cursor-pointer">
                ← Voltar ao Admin
              </span>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Abas */}
        <div className="bg-white rounded-xl shadow-sm border mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setAbaAtiva('confirmados')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  abaAtiva === 'confirmados'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                ✅ Confirmados ({bilhetes.filter(b => b.status === 'PAGO').length})
              </button>
              <button
                onClick={() => setAbaAtiva('nao-pagos')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  abaAtiva === 'nao-pagos'
                    ? 'border-yellow-500 text-yellow-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                ⏳ Não Pagos ({bilhetes.filter(b => b.status === 'PENDENTE' || b.status === 'CANCELADO').length})
              </button>
            </nav>
          </div>

          {/* Controles para aba "Não Pagos" */}
          {abaAtiva === 'nao-pagos' && (
            <div className="p-6 bg-yellow-50 border-b">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">🔧 Controles Administrativos</h3>
              <div className="flex items-center space-x-4">
                <div className="flex-1 max-w-md">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Senha do Administrador
                  </label>
                  <div className="relative">
                    <input
                      type={mostrarSenha ? 'text' : 'password'}
                      value={senhaAdmin}
                      onChange={(e) => setSenhaAdmin(e.target.value)}
                      placeholder="Digite a senha admin"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarSenha(!mostrarSenha)}
                      className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                    >
                      {mostrarSenha ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>
                <button
                  onClick={buscarBilhetes}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  🔄 Atualizar Lista
                </button>
                <button
                  onClick={verificarTodosPendentes}
                  disabled={verificandoTodos}
                  className={`text-white px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    verificandoTodos
                      ? 'bg-orange-400 cursor-wait'
                      : 'bg-orange-600 hover:bg-orange-700'
                  }`}
                >
                  {verificandoTodos ? '🔄 Verificando...' : '🔍 Verificar Todos PIX'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Carregando bilhetes...</p>
          </div>
        )}

        {/* Lista de Bilhetes */}
        {!loading && (
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {abaAtiva === 'confirmados' ? '✅ Bilhetes Confirmados' : '⏳ Bilhetes Não Pagos'}
                <span className="ml-2 text-sm font-normal text-gray-600">
                  ({bilhetesFiltrados.length} bilhetes)
                </span>
              </h2>
            </div>

            {bilhetesFiltrados.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">
                    {abaAtiva === 'confirmados' ? '✅' : '📋'}
                  </span>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {abaAtiva === 'confirmados' ? 'Nenhum bilhete confirmado' : 'Nenhum bilhete pendente'}
                </h3>
                <p className="text-gray-600">
                  {abaAtiva === 'confirmados' 
                    ? 'Ainda não há bilhetes com pagamento confirmado.'
                    : 'Todos os bilhetes estão com pagamento em dia.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cliente
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Dispositivo/IP
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Valor/Palpites
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        TXID
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {bilhetesFiltrados.map((bilhete) => {
                      const statusDetalhado = getStatusDetalhado(bilhete);
                      return (
                        <tr key={bilhete.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{bilhete.nome}</div>
                              <div className="text-sm text-gray-500 font-mono flex items-center">
                                📱 {bilhete.whatsapp}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-xs">
                              <div className="text-gray-600 mb-1">
                                🖥️ {formatarDispositivo(bilhete.userAgent)}
                              </div>
                              {bilhete.ipAddress && (
                                <div className="text-gray-500 font-mono">
                                  🌐 IP: {bilhete.ipAddress}
                                </div>
                              )}
                              {!bilhete.ipAddress && (
                                <div className="text-gray-400">
                                  🌐 IP: Não informado
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">R$ {bilhete.valorTotal.toFixed(2)}</div>
                            <div className="text-sm text-gray-500">{bilhete.quantidadePalpites} palpites</div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${statusDetalhado.cor}`}>
                              {statusDetalhado.status}
                            </span>
                            {bilhete.pix && (
                              <div className="text-xs text-gray-500 mt-1">
                                PIX: {bilhete.pix.status} ({bilhete.pix.ambiente})
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            {bilhete.txid ? (
                              <div className="max-w-40">
                                <div className="text-xs font-mono text-gray-600 break-all" title={bilhete.txid}>
                                  {bilhete.txid}
                                </div>
                                <button
                                  onClick={() => navigator.clipboard.writeText(bilhete.txid || '')}
                                  className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                                  title="Copiar TXID"
                                >
                                  📋 Copiar
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">Sem TXID</span>
                            )}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div>{formatarData(bilhete.createdAt)}</div>
                            {(bilhete.status === 'PENDENTE' || statusDetalhado.status === 'PENDENTE') && (
                              <div className="text-xs text-red-600">
                                Expira: {formatarData(bilhete.expiresAt)}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm space-y-2">
                            {/* Botão Verificar Status via EFÍ */}
                             <button
                                onClick={() => verificarEfi(bilhete.id)}
                                disabled={verificandoStatus === bilhete.id}
                                className={`text-sm ${
                                  verificandoStatus === bilhete.id
                                    ? 'text-orange-400 cursor-wait'
                                    : 'text-orange-600 hover:text-orange-800'
                                }`}
                                title="Verificar status via EFÍ"
                              >
                                {verificandoStatus === bilhete.id ? '🔄 Verificando...' : '🔍 Verificar via EFÍ'}
                              </button>

                            {/* Botão Marcar como PAGO (apenas para não pagos) */}
                            {abaAtiva === 'nao-pagos' && (
                              <>
                                <button
                                  onClick={() => marcarComoPago(bilhete.id)}
                                  disabled={!senhaAdmin.trim()}
                                  className={`w-full px-3 py-1 rounded text-xs font-medium transition-colors ${
                                    !senhaAdmin.trim()
                                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                      : 'bg-green-100 hover:bg-green-200 text-green-700'
                                  }`}
                                >
                                  ✅ Marcar como PAGO
                                </button>
                                <button
                                  onClick={() => forcarVerificacaoPagamento(bilhete.id, bilhete.txid)}
                                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                                >
                                  Verificar Pagamento
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}