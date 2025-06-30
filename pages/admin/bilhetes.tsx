import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuthenticatedFetch } from '@/hooks/useAuthenticatedFetch';
import { withAdminAuth } from '@/components/withAdminAuth';

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

function AdminBilhetes() {
  const [bilhetes, setBilhetes] = useState<Bilhete[]>([]);
  const [loading, setLoading] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState<'confirmados' | 'nao-pagos'>('confirmados');
  const [senhaAdmin, setSenhaAdmin] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [verificandoStatus, setVerificandoStatus] = useState<string | null>(null);
  const [verificandoTodos, setVerificandoTodos] = useState(false);
  const authenticatedFetch = useAuthenticatedFetch();

  useEffect(() => {
    carregarBilhetes();
  }, []);

  const carregarBilhetes = async () => {
    try {
      const response = await authenticatedFetch('/api/admin/bilhetes');
      if (!response.ok) {
        throw new Error('Erro ao carregar bilhetes');
      }
      const data = await response.json();
      setBilhetes(data.bilhetes || []);
    } catch (error) {
      console.error('Erro ao carregar bilhetes:', error);
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
        await carregarBilhetes();
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
        await carregarBilhetes();
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

      if (response.ok) {
        const data = await response.json();

        if (data.success) {
          alert('✅ Bilhete marcado como PAGO com sucesso!');
          setSenhaAdmin('');
          await carregarBilhetes();
        } else {
          alert(`❌ Erro: ${data.error}`);
        }
      } else {
        alert('Erro ao marcar como pago');
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
    if (!userAgent || userAgent === 'Não informado') {
      return 'Dispositivo não identificado';
    }

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
        if (data.warning === 'TXID_FORMATO_ANTIGO') {
          alert(`⚠️ TXID Formato Antigo\n\n${data.message}\n\nStatus atual: ${data.status}\n\nPara verificar o pagamento:\n• Use "Marcar como PAGO" se confirmou manualmente\n• Ou gere um novo PIX para o cliente`);
        } else if (data.statusAtualizado) {
          alert(`✅ Status atualizado!\n\nStatus: ${data.status}\nBilhete foi atualizado no sistema.`);
        } else {
          alert(`📋 Status atual: ${data.status}\n\nNenhuma alteração necessária.`);
        }
        // Recarregar dados após verificação
        await carregarBilhetes();
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
        await carregarBilhetes();
      } else {
        alert('❌ Erro: ' + data.error);
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao verificar pagamento');
    }
  };

  const forcarPagamentoManual = async (bilheteId: string) => {
    if (!confirm('⚠️ ATENÇÃO: Você confirma que o pagamento foi realizado?\n\nEsta ação irá marcar o bilhete como PAGO mesmo que não tenha sido verificado automaticamente.\n\nConfirma?')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/force-verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bilheteId: bilheteId,
          forcarAtualizacao: true
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert(`✅ ${data.message}\n\n📊 Detalhes:\n• Bilhete: ${data.bilhete.id}\n• Status: ${data.bilhete.status}\n• Valor: R$ ${data.bilhete.valorTotal.toFixed(2)}\n• Palpites atualizados: ${data.bilhete.palpitesAtualizados}`);
        await carregarBilhetes();
      } else {
        alert('❌ Erro: ' + data.error);
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('❌ Erro ao forçar pagamento manual');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Carregando bilhetes...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Bilhetes</h1>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nome/WhatsApp
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Palpites
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  TXID
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {bilhetes.map((bilhete: any) => (
                <tr key={bilhete.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{bilhete.nome}</div>
                    <div className="text-sm text-gray-500">{bilhete.whatsapp}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={getStatusColor(bilhete.status)}>
                      {bilhete.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    R$ {bilhete.valorTotal.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {bilhete.quantidadePalpites}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatarData(bilhete.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {bilhete.txid || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default withAdminAuth(AdminBilhetes);