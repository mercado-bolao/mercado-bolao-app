import { useEffect, useState } from "react";
import { useRouter } from "next/router";

interface Jogo {
  id: string;
  mandante: string;
  visitante: string;
  horario: string;
  fotoMandante?: string;
  fotoVisitante?: string;
}

interface Concurso {
  id: string;
  numero: number;
  dataInicio: string;
  dataFim: string;
  status: string;
  jogos: Jogo[];
  fechamentoPalpites?: string;
}

export default function ConcursoDetalhes() {
  const router = useRouter();
  const { id } = router.query;
  const [concurso, setConcurso] = useState<Concurso | null>(null);
  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [palpites, setPalpites] = useState<{ [key: string]: string }>({});
  const [carrinho, setCarrinho] = useState<{ [key: string]: string[] }>({});
  const [enviando, setEnviando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [palpitesEncerrados, setPalpitesEncerrados] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [palpitesPendentes, setPalpitesPendentes] = useState<any>(null);
  const [mostrarAvisoPendentes, setMostrarAvisoPendentes] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [processandoPagamento, setProcessandoPagamento] = useState(false);
  const [canSubmit, setCanSubmit] = useState(false);
  const [mostrarCarrinho, setMostrarCarrinho] = useState(false);

  useEffect(() => {
    if (id) {
      fetch(`/api/jogos?concursoId=${id}`)
        .then((res) => res.json())
        .then((data) => {
          setConcurso(data);
          // Check if betting period has ended
          if (data?.fechamentoPalpites) {
            const now = new Date();
            const closingTime = new Date(data.fechamentoPalpites);
            setPalpitesEncerrados(now > closingTime);
          }
        });
        verificarPalpitesPendentes();
    }
  }, [id]);

  useEffect(() => {
    setCanSubmit(nome.trim() !== '' && whatsapp.trim() !== '');
  }, [nome, whatsapp]);

  const verificarPalpitesPendentes = async () => {
    const whatsappStorage = localStorage.getItem('whatsapp');
    if (!whatsappStorage) return;

    try {
      const response = await fetch(`/api/palpites-pendentes?whatsapp=${encodeURIComponent(whatsappStorage)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.totalPalpites > 0) {
          setPalpitesPendentes(data);
          setMostrarAvisoPendentes(true);
        }
      }
    } catch (error) {
      console.log('Erro ao verificar palpites pendentes:', error);
    }
  };

  const handlePalpiteChange = (jogoId: string, resultado: string) => {
    // Converte X para 0 para manter consistência com a explicação
    const resultadoFinal = resultado === 'X' ? '0' : resultado;

    // Adiciona ou atualiza nos palpites pendentes
    setPalpites(prev => ({
      ...prev,
      [jogoId]: resultadoFinal
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('=== INICIANDO ENVIO DE PALPITES ===');
    console.log('Nome:', nome);
    console.log('WhatsApp:', whatsapp);
    console.log('Palpites:', palpites);

    if (!nome.trim() || !whatsapp.trim()) {
      alert("Por favor, preencha seu nome e WhatsApp");
      return;
    }

    // Salva palpites pendentes no carrinho antes de enviar
    if (Object.keys(palpites).length > 0) {
      adicionarPalpitesAoCarrinho();
      // Aguarda um pouco para o estado atualizar
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Gera todos os bilhetes completos
    const bilhetes = gerarTodosBilhetes();

    if (bilhetes.length === 0) {
      alert("Por favor, faça pelo menos um palpite");
      return;
    }

    setEnviando(true);

    try {
      // NOVA LÓGICA: Enviar todos os bilhetes de uma vez
      const dadosEnvio = {
        nome: nome.trim(),
        whatsapp: whatsapp.trim(),
        bilhetes: bilhetes
      };

      console.log('=== ENVIANDO BILHETES COMPLETOS ===');
      console.log('Total de bilhetes:', bilhetes.length);
      console.log('Dados do envio:', dadosEnvio);

      const response = await fetch("/api/palpites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dadosEnvio),
      });

      const result = await response.json();

      console.log('Resposta da API:', {
        status: response.status,
        result
      });

      if (response.ok) {
        // Sucesso total
        console.log('✅ Todos os bilhetes foram salvos com sucesso');

        // Salvar WhatsApp no localStorage para usar na página de finalizar
        localStorage.setItem('whatsapp', whatsapp);

        setSucesso(true);

        // Limpar formulário após sucesso
        setPalpites({});
        setCarrinho({});

        // Redirecionar para página de finalizar após breve delay
        setTimeout(() => {
          router.push('/finalizar');
        }, 2000);
      } else {
        // Erro parcial ou total
        console.error('❌ Erro ao enviar bilhetes:', result);

        let mensagemErro = "❌ Erro ao processar bilhetes.";
        if (result.detalhes?.mensagensErro && result.detalhes.mensagensErro.length > 0) {
          mensagemErro += `\n\nDetalhes:\n${result.detalhes.mensagensErro.join('\n')}`;
        } else if (result.error) {
          mensagemErro += `\n\nErro: ${result.error}`;
        }

        alert(mensagemErro);
      }

      } catch (error) {
      console.error('Erro geral ao enviar bilhetes:', error);
      alert("❌ Erro inesperado ao enviar bilhetes. Verifique sua conexão e tente novamente.");
    } finally {
      setEnviando(false);
    }
  };

  const adicionarPalpitesAoCarrinho = () => {
    // Adiciona os palpites atuais ao carrinho (múltiplos palpites por jogo)
    setCarrinho(prev => {
      const newCarrinho = { ...prev };

      Object.entries(palpites).forEach(([jogoId, palpite]) => {
        if (!newCarrinho[jogoId]) {
          newCarrinho[jogoId] = [];
        }

        // CORREÇÃO: Permite adicionar o mesmo resultado múltiplas vezes
        // Cada adição representa um bilhete diferente
        newCarrinho[jogoId].push(palpite);
      });

      return newCarrinho;
    });

    // IMPORTANTE: Limpa TODAS as seleções atuais para permitir novos palpites
    setPalpites({});

    // Scroll para o topo para ver os jogos e fazer novas seleções
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Feedback visual para o usuário
    console.log('✅ Palpites adicionados ao carrinho e seleções limpas para novos palpites');
  };

  // Função para remover um palpite específico do carrinho
  const removerPalpiteDoCarrinho = (jogoId: string, indexPalpite: number) => {
    setCarrinho(prev => {
      const newCarrinho = { ...prev };

      if (newCarrinho[jogoId]) {
        newCarrinho[jogoId].splice(indexPalpite, 1);

        // Remove o jogo completamente se não há mais palpites
        if (newCarrinho[jogoId].length === 0) {
          delete newCarrinho[jogoId];
        }
      }

      return newCarrinho;
    });
  };

  // NOVA FUNÇÃO: Calcula quantos bilhetes completos existem
  const calcularTotalBilhetes = () => {
    if (!concurso) return 0;

    // Encontra o maior número de palpites por jogo no carrinho
    const maxPalpitesPorJogo = Math.max(
      ...concurso.jogos.map(jogo => carrinho[jogo.id]?.length || 0),
      0
    );

    // Se há palpites pendentes, conta como 1 bilhete adicional
    const bilhetesPendentes = Object.keys(palpites).length > 0 ? 1 : 0;

    return maxPalpitesPorJogo + bilhetesPendentes;
  };

  // NOVA FUNÇÃO: Gera bilhetes completos
  const gerarTodosBilhetes = () => {
    if (!concurso) return [];

    const bilhetes: { [key: string]: string }[] = [];

    // 1. Adiciona bilhetes do carrinho (agrupados por posição)
    const maxPalpitesPorJogo = Math.max(
      ...concurso.jogos.map(jogo => carrinho[jogo.id]?.length || 0),
      0
    );

    for (let i = 0; i < maxPalpitesPorJogo; i++) {
      const bilhete: { [key: string]: string } = {};

      concurso.jogos.forEach(jogo => {
        const palpitesDoJogo = carrinho[jogo.id] || [];
        if (palpitesDoJogo[i]) {
          bilhete[jogo.id] = palpitesDoJogo[i];
        }
      });

      // Só adiciona se o bilhete tem pelo menos um palpite
      if (Object.keys(bilhete).length > 0) {
        bilhetes.push(bilhete);
      }
    }

    // 2. Adiciona bilhete pendente se existir
    if (Object.keys(palpites).length > 0) {
      const bilhetePendente: { [key: string]: string } = {};

      Object.entries(palpites).forEach(([jogoId, palpite]) => {
        bilhetePendente[jogoId] = palpite;
      });

      bilhetes.push(bilhetePendente);
    }

    return bilhetes;
  };

  const limparApostas = () => {
    setPalpites({});
    setCarrinho({});
  };

  const limparCarrinho = () => {
    setPalpites({});
    setCarrinho({});
  };

  const limparCarrinhoConcurso = async () => {
    const whatsappStorage = localStorage.getItem('whatsapp');
    if (!whatsappStorage) return;

    if (!confirm('⚠️ Tem certeza que deseja limpar todos os palpites pendentes?\n\nEsta ação não pode ser desfeita.')) {
      return;
    }

    try {
      const response = await fetch('/api/limpar-carrinho', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          whatsapp: whatsappStorage,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao limpar carrinho');
      }

      alert(`✅ ${data.message}\n\nVocê pode fazer novos palpites agora.`);
      setMostrarAvisoPendentes(false);
      setPalpitesPendentes(null);

    } catch (error) {
      alert(`Erro ao limpar carrinho: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  const handleGerarPagamento = async () => {
    if (!canSubmit || calcularTotalBilhetes() === 0) {
      return;
    }

    setProcessandoPagamento(true);

    try {
      console.log('=== INICIANDO GERAÇÃO DE PAGAMENTO DIRETO ===');
      console.log('Nome:', nome);
      console.log('WhatsApp:', whatsapp);
      console.log('Palpites pendentes:', palpites);
      console.log('Carrinho:', carrinho);

      // Salvar dados no localStorage
      localStorage.setItem('nome', nome);
      localStorage.setItem('whatsapp', whatsapp);

      // 1. Gerar todos os bilhetes (carrinho + pendentes)
      const todosBilhetes = gerarTodosBilhetes();
      console.log('📋 Total de bilhetes gerados:', todosBilhetes.length);

      if (todosBilhetes.length === 0) {
        throw new Error('Nenhum bilhete válido encontrado');
      }

      const dadosEnvio = {
        nome,
        whatsapp,
        bilhetes: todosBilhetes
      };

      console.log('📤 Salvando todos os bilhetes...');
      const palpitesResponse = await fetch('/api/palpites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dadosEnvio),
      });

      const palpitesResult = await palpitesResponse.json();
      console.log('📋 Resposta dos palpites:', palpitesResult);

      if (!palpitesResponse.ok || !palpitesResult.success) {
        throw new Error(palpitesResult.error || 'Erro ao salvar palpites');
      }

      console.log('✅ Todos os bilhetes salvos, gerando pagamento PIX...');

      // Calcular valor total correto
      const totalBilhetesLocal = calcularTotalBilhetes();
      const valorTotalLocal = totalBilhetesLocal * 10;

      console.log('💰 Cálculo local:', {
        totalBilhetes: totalBilhetesLocal,
        valorTotal: valorTotalLocal
      });

      // 2. Buscar os palpites pendentes para criar o PIX
      const palpitesPendentesResponse = await fetch(`/api/palpites-pendentes?whatsapp=${encodeURIComponent(whatsapp)}`);
      const palpitesPendentesData = await palpitesPendentesResponse.json();

      if (!palpitesPendentesResponse.ok || !palpitesPendentesData.palpites || palpitesPendentesData.palpites.length === 0) {
        throw new Error('Erro ao buscar palpites pendentes para pagamento');
      }

      console.log('📋 Palpites pendentes encontrados:', palpitesPendentesData.palpites.length);
      console.log('📊 Valores da API palpites-pendentes:', {
        valorTotal: palpitesPendentesData.valorTotal,
        totalBilhetes: palpitesPendentesData.totalBilhetes
      });

      // 3. Gerar PIX com valor correto calculado localmente
      const valorTotalCorreto = calcularTotalBilhetes() * 10;

      const pixResponse = await fetch('/api/gerar-pix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          whatsapp: whatsapp,
          nome: nome,
          valorTotal: valorTotalCorreto,
          totalBilhetes: calcularTotalBilhetes(),
          palpites: palpitesPendentesData.palpites
        }),
      });

      let pixData;
      try {
        const responseText = await pixResponse.text();
        if (!responseText.trim()) {
          throw new Error('Resposta vazia do servidor');
        }
        pixData = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ Erro ao fazer parse da resposta PIX:', parseError);
        throw new Error('Servidor retornou resposta inválida');
      }

      console.log('📥 Dados recebidos PIX:', pixData);

      if (!pixResponse.ok) {
        const errorMessage = pixData?.error || pixData?.details || pixData?.message || `Erro HTTP ${pixResponse.status}`;
        throw new Error(errorMessage);
      }

      if (pixResponse.ok && pixData.success) {
        console.log('✅ PIX e Bilhete gerados com sucesso');

        // Salvar dados para a página de pagamento
        localStorage.setItem('bilheteData', JSON.stringify(pixData.bilhete));
        localStorage.setItem('pixData', JSON.stringify(pixData.pix));

        // Limpar seleções após sucesso
        setPalpites({});

        alert('✅ Pagamento PIX gerado com sucesso! Redirecionando...');

        // Redirecionar para página de pagamento
        router.push('/pagamento-pix');
      } else {
        throw new Error('Resposta inválida da API PIX');
      }

    } catch (error) {
      console.error('❌ Erro ao gerar pagamento:', error);

      let mensagemErro = 'Erro desconhecido ao processar pagamento';
      if (error instanceof Error) {
        mensagemErro = error.message;

        if (error.message.includes('Credenciais EFI Pay inválidas')) {
          mensagemErro = '🔑 Credenciais EFI Pay inválidas.\n\nVerifique nos Secrets:\n• EFI_CLIENT_ID\n• EFI_CLIENT_SECRET';
        }
      }

      alert(`❌ Erro ao gerar pagamento PIX:\n\n${mensagemErro}\n\n🔧 Verifique o console para mais detalhes.`);
    } finally {
      setProcessandoPagamento(false);
    }
  };

  if (!concurso) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Carregando concurso...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header discreto */}
        <div className="text-center mb-3">
          <h1 className="text-sm text-gray-600">
            🏆 Concurso #{concurso.numero} • 📅 {new Date(concurso.dataInicio).toLocaleDateString('pt-BR')}
          </h1>
        </div>

        {/* Message when betting is closed */}
        {palpitesEncerrados && (
          <div className="bg-red-50 border border-red-200 rounded-2xl shadow-lg p-8 mb-6">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-4xl">🔒</span>
              </div>
              <h2 className="text-2xl font-bold text-red-800 mb-2">
                Rodada encerrada para palpites
              </h2>
              <p className="text-red-600 text-lg mb-4">
                Aguarde nova rodada.
              </p>
              {concurso.fechamentoPalpites && (
                <p className="text-red-500 text-sm">
                  Apostas encerraram em: {new Date(concurso.fechamentoPalpites).toLocaleDateString('pt-BR', {
                    timeZone: "America/Sao_Paulo"
                  })} às {new Date(concurso.fechamentoPalpites).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZone: "America/Sao_Paulo"
                  })}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Games list - always visible */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">🏆 Jogos</h2>
            {concurso.jogos[0]?.horario && (
              <p className="text-xs text-gray-500">
                {new Date(concurso.jogos[0].horario).toLocaleDateString('pt-BR', {
                  timeZone: "America/Sao_Paulo"
                })} às{' '}
                {new Date(concurso.jogos[0].horario).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                  timeZone: "America/Sao_Paulo"
                })}
              </p>
            )}
          </div>

          <div className="space-y-2">
            {concurso.jogos.map((jogo, index) => (
              <div key={jogo.id} className="border-b border-gray-100 last:border-b-0 pb-2 last:pb-0">
                {/* Layout horizontal compacto */}
                <div className="flex items-center justify-between py-1">
                  {/* Time mandante com sigla */}
                  <div className="flex items-center space-x-2 flex-1">
                    <div className="w-6 h-6 flex-shrink-0">
                      {jogo.fotoMandante && !jogo.fotoMandante.startsWith('data:') ? (
                        <img 
                          src={jogo.fotoMandante.startsWith('/uploads/') ? jogo.fotoMandante : `/uploads/${jogo.fotoMandante}`}
                          alt={jogo.mandante}
                          className="w-full h-full object-contain rounded-full border border-gray-200"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                            if (nextElement) {
                              nextElement.style.display = 'flex';
                            }
                          }}
                        />
                      ) : null}
                      <div 
                        className={`w-full h-full rounded-full bg-blue-50 flex items-center justify-center border ${jogo.fotoMandante && !jogo.fotoMandante.startsWith('data:') ? 'hidden' : 'flex'}`}
                        style={{ display: jogo.fotoMandante && !jogo.fotoMandante.startsWith('data:') ? 'none' : 'flex' }}
                      >
                        <span className="text-blue-600 font-bold text-xs">
                          {jogo.mandante.substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <span className="font-medium text-gray-700 text-sm truncate">
                      {jogo.mandante.length > 12 ? `${jogo.mandante.substring(0, 12)}...` : jogo.mandante}
                    </span>
                  </div>

                  {/* Botões de palpite - só aparece se apostas abertas */}
                  {!palpitesEncerrados ? (
                    <div className="flex items-center space-x-1 px-2">
                      <button
                        type="button"
                        onClick={() => handlePalpiteChange(jogo.id, "1")}
                        className={`py-1 px-2 rounded text-sm font-medium transition-all ${
                          palpites[jogo.id] === "1"
                            ? "bg-blue-500 text-white border border-blue-600"
                            : "bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"
                        }`}
                      >
                        1
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePalpiteChange(jogo.id, "X")}
                        className={`py-1 px-2 rounded text-sm font-medium transition-all ${
                          (palpites[jogo.id] === "X" || palpites[jogo.id] === "0")
                            ? "bg-gray-500 text-white border border-gray-600"
                            : "bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100"
                        }`}
                      >
                        X
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePalpiteChange(jogo.id, "2")}
                        className={`py-1 px-2 rounded text-sm font-medium transition-all ${
                          palpites[jogo.id] === "2"
                            ? "bg-red-500 text-white border border-red-600"
                            : "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
                        }`}
                      >
                        2
                      </button>
                    </div>
                  ) : (
                    <div className="px-2">
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">🔒 Fechado</span>
                    </div>
                  )}

                  {/* Time visitante com sigla */}
                  <div className="flex items-center space-x-2 flex-1 justify-end">
                    <span className="font-medium text-gray-700 text-sm truncate">
                      {jogo.visitante.length > 12 ? `${jogo.visitante.substring(0, 12)}...` : jogo.visitante}
                    </span>
                    <div className="w-6 h-6 flex-shrink-0">
                      {jogo.fotoVisitante && !jogo.fotoVisitante.startsWith('data:') ? (
                        <img 
                          src={jogo.fotoVisitante.startsWith('/uploads/') ? jogo.fotoVisitante : `/uploads/${jogo.fotoVisitante}`}
                          alt={jogo.visitante}
                          className="w-full h-full object-contain rounded-full border border-gray-200"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                            if (nextElement) {
                              nextElement.style.display = 'flex';
                            }
                          }}
                        />
                      ) : null}
                      <div 
                        className={`w-full h-full rounded-full bg-red-50 flex items-center justify-center border ${jogo.fotoVisitante && !jogo.fotoVisitante.startsWith('data:') ? 'hidden' : 'flex'}`}
                        style={{ display: jogo.fotoVisitante && !jogo.fotoVisitante.startsWith('data:') ? 'none' : 'flex' }}
                      >
                        <span className="text-red-600 font-bold text-xs">
                          {jogo.visitante.substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>


              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6" style={{ display: palpitesEncerrados ? 'none' : 'block' }}>
          {mostrarAvisoPendentes && palpitesPendentes && (
            <div className="bg-orange-50 rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-orange-800 mb-4">
                ⚠️ AVISO: Você tem palpites pendentes!
              </h3>
              <p className="text-orange-700 mb-2">
                Detectamos que você possui <strong>{palpitesPendentes.totalPalpites}</strong> palpite(s) pendente(s)
                no valor total de <strong>R$ {palpitesPendentes.valorTotal}</strong>.
              </p>
              <p className="text-orange-700 mb-4">
                Para evitar cobranças duplicadas, finalize ou limpe seu carrinho antes de continuar.
              </p>
              <button
                onClick={limparCarrinhoConcurso}
                className="py-3 px-4 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-colors"
              >
                🗑️ LIMPAR CARRINHO PENDENTE
              </button>
            </div>
          )}

          {/* Seção principal de carrinho - aparece quando há palpites */}
          {(Object.keys(palpites).length > 0 || Object.keys(carrinho).length > 0) && (
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200 p-4 shadow-md">
              {/* Badge do Carrinho */}
              <div className="text-center mb-3">
                <div className="inline-flex items-center space-x-1 bg-green-100 px-3 py-1 rounded-full border border-green-300">
                  <span className="text-green-600 text-sm font-medium">🧾 Carrinho: {calcularTotalBilhetes()} bilhete(s)</span>
                </div>
                <p className="text-green-700 text-xs mt-1">
                  👇 Finalize seus dados para gerar o pagamento:
                </p>
              </div>

              {/* Campos de dados */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Nome completo</label>
                  <input
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 placeholder-gray-500"
                    placeholder="Digite seu nome completo"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">WhatsApp</label>
                  <input
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 placeholder-gray-500"
                    placeholder="(11) 99999-9999"
                    required
                  />
                </div>
              </div>

              {/* Botões de ação - Lado a lado */}
              <div className="flex gap-2">
                {/* Botão principal de Gerar Pagamento */}
                <button
                  onClick={handleGerarPagamento}
                  disabled={!canSubmit || calcularTotalBilhetes() === 0 || processandoPagamento}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium text-sm transition-all ${
                    !canSubmit || calcularTotalBilhetes() === 0 || processandoPagamento
                      ? 'bg-gray-400 cursor-not-allowed text-gray-700'
                      : 'bg-green-600 hover:bg-green-700 shadow-md text-white'
                  } flex items-center justify-center space-x-1`}
                >
                  {processandoPagamento ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Gerando...</span>
                    </>
                  ) : (
                    <>
                      <span>💳</span>
                      <span>GERAR PAGAMENTO - R$ {(calcularTotalBilhetes() * 10).toFixed(2)}</span>
                    </>
                  )}
                </button>

                {/* Botão Adicionar ao Carrinho */}
                {Object.keys(palpites).length > 0 && (
                  <button
                    type="button"
                    onClick={adicionarPalpitesAoCarrinho}
                    className="py-3 px-4 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-1"
                  >
                    <span>+</span>
                    <span>MAIS JOGOS</span>
                  </button>
                )}

                {/* Botão Limpar */}
                {calcularTotalBilhetes() > 0 && (
                  <button
                    type="button"
                    onClick={limparCarrinho}
                    className="py-3 px-4 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors flex items-center justify-center space-x-1"
                    title="Limpar carrinho"
                  >
                    <span>🗑️</span>
                    <span>LIMPAR</span>
                  </button>
                )}
              </div>

              {/* Resumo compacto */}
              <div className="mt-2 text-center text-xs text-gray-600">
                <p>🔒 Pagamento seguro via PIX • R$ 10,00 por bilhete</p>
              </div>
            </div>
          )}

          

        </div>

        {/* Dica */}
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg mt-6 mb-24">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-2xl">💡</span>
            </div>
            <div className="ml-3">
              <p className="text-blue-700 text-sm">
                <strong>Como apostar:</strong> 1 = Casa vence, X = Empate, 2 = Fora vence
              </p>
              <p className="text-blue-600 text-xs mt-1">
                <strong>Nova regra:</strong> Cada conjunto completo de palpites = 1 bilhete de R$ 1,00
              </p>
              <p className="text-blue-600 text-xs mt-1">
                <strong>Exemplo:</strong> 3 conjuntos diferentes de palpites = 3 bilhetes = R$ 3,00 total
              </p>
              <p className="text-blue-600 text-xs mt-1">
                <strong>Permitido:</strong> Mesmo resultado em palpites diferentes (Ex: Casa em Bilhete 1 e 2)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Rodapé fixo para pagamento - aparece quando há palpites pendentes OU carrinho com itens */}
      {!palpitesEncerrados && (Object.keys(palpites).length > 0 || Object.keys(carrinho).length > 0) && (
        <div 
          className="fixed bottom-0 left-0 right-0 w-full bg-white border-t border-green-200 shadow-lg p-2" 
          style={{ 
            zIndex: 99999
          }}
        >
          <div className="max-w-2xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              {/* Campo Nome */}
              <div className="flex-1 md:max-w-xs">
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 placeholder-gray-500"
                  placeholder="Nome completo"
                  required
                />
              </div>

              {/* Campo WhatsApp */}
              <div className="flex-1 md:max-w-xs">
                <input
                  type="tel"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 placeholder-gray-500"
                  placeholder="WhatsApp (11) 99999-9999"
                  required
                />
              </div>

              {/* Botão de Pagamento */}
              <div className="flex-1 md:flex-none">
                <button
                  onClick={handleGerarPagamento}
                  disabled={!canSubmit || calcularTotalBilhetes() === 0 || processandoPagamento}
                  className={`w-full md:w-auto px-3 py-1 rounded-md font-medium text-xs transition-all ${
                    !canSubmit || calcularTotalBilhetes() === 0 || processandoPagamento
                      ? 'bg-gray-400 cursor-not-allowed text-gray-700'
                      : 'bg-green-600 hover:bg-green-700 shadow-md text-white'
                  } flex items-center justify-center space-x-1 whitespace-nowrap`}
                >
                  {processandoPagamento ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                      <span>Gerando...</span>
                    </>
                  ) : (
                    <>
                      <span>💳</span>
                      <span>PAGAR R$ {(calcularTotalBilhetes() * 10).toFixed(2)}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Resumo compacto */}
            <div className="mt-1 text-center">
              <span className="text-xs text-gray-600">
                {calcularTotalBilhetes()} bilhete(s) • R$ 10,00 cada • Total: R$ {(calcularTotalBilhetes() * 10).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Botão fixo do carrinho - aparece quando há palpites */}
      {!palpitesEncerrados && (Object.keys(palpites).length > 0 || Object.keys(carrinho).length > 0) && (
        <button
          onClick={() => setMostrarCarrinho(true)}
          className="fixed bottom-5 right-5 bg-yellow-400 hover:bg-yellow-500 text-black font-bold px-4 py-3 rounded-lg shadow-lg z-40 flex items-center space-x-2 transition-all transform hover:scale-105"
        >
          <span>🛒</span>
          <span>Carrinho ({calcularTotalBilhetes()})</span>
        </button>
      )}

      {/* Popout lateral do carrinho */}
      {mostrarCarrinho && (
        <>
          {/* Overlay para fechar clicando fora */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setMostrarCarrinho(false)}
          ></div>

          {/* Popout lateral */}
          <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-xl border-l z-50 overflow-y-auto">
            <div className="p-4">
              {/* Header do carrinho */}
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-200">
                <h2 className="font-bold text-lg text-gray-800">
                  🛒 Carrinho ({calcularTotalBilhetes()} bilhetes)
                </h2>
                <button
                  onClick={() => setMostrarCarrinho(false)}
                  className="text-gray-500 hover:text-gray-700 text-xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
                >
                  ×
                </button>
              </div>

              {/* Campos de dados */}
              <div className="mb-4">
                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Nome completo</label>
                  <input
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 placeholder-gray-500"
                    placeholder="Digite seu nome completo"
                    required
                  />
                </div>
                
                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">WhatsApp</label>
                  <input
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 placeholder-gray-500"
                    placeholder="(11) 99999-9999"
                    required
                  />
                </div>
              </div>

              {/* Tabela detalhada de palpites */}
              <div className="bg-gray-50 rounded-lg border p-3 mb-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Detalhes dos Bilhetes</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-1 font-medium text-gray-600">Jogo</th>
                        {Array.from({ length: calcularTotalBilhetes() }, (_, i) => (
                          <th key={i} className="text-center py-2 px-1 font-medium text-gray-600">
                            B{i + 1}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {concurso.jogos.map((jogo, index) => {
                        const palpitesCarrinho = carrinho[jogo.id] || [];
                        const palpitePendente = palpites[jogo.id];
                        const todosPalpites = [...palpitesCarrinho];
                        if (palpitePendente) {
                          todosPalpites.push(palpitePendente);
                        }

                        return (
                          <tr key={jogo.id} className="border-b border-gray-100 last:border-b-0">
                            <td className="py-2 px-1">
                              <div className="text-xs text-gray-500">#{index + 1}</div>
                              <div className="text-xs font-medium text-gray-700">
                                {jogo.mandante.substring(0, 3)} x {jogo.visitante.substring(0, 3)}
                              </div>
                            </td>

                            {Array.from({ length: calcularTotalBilhetes() }, (_, bilheteIndex) => (
                              <td key={bilheteIndex} className="py-2 px-1 text-center">
                                {todosPalpites[bilheteIndex] ? (
                                  <div className={`w-6 h-6 rounded flex items-center justify-center font-bold text-xs mx-auto ${
                                    palpitesCarrinho.includes(todosPalpites[bilheteIndex]) || bilheteIndex < palpitesCarrinho.length
                                      ? (todosPalpites[bilheteIndex] === '1' ? 'bg-blue-500 text-white' :
                                         (todosPalpites[bilheteIndex] === '0' || todosPalpites[bilheteIndex] === 'X') ? 'bg-gray-500 text-white' :
                                         'bg-red-500 text-white')
                                      : (todosPalpites[bilheteIndex] === '1' ? 'bg-blue-100 border border-blue-300 text-blue-700' :
                                         (todosPalpites[bilheteIndex] === '0' || todosPalpites[bilheteIndex] === 'X') ? 'bg-gray-100 border border-gray-300 text-gray-700' :
                                         'bg-red-100 border border-red-300 text-red-700')
                                  }`}>
                                    {todosPalpites[bilheteIndex] === '0' ? 'X' : todosPalpites[bilheteIndex]}
                                  </div>
                                ) : (
                                  <span className="text-gray-300 text-xs">-</span>
                                )}
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Botões de ação */}
              <div className="space-y-3">
                {/* Botão principal de Gerar Pagamento */}
                <button
                  onClick={handleGerarPagamento}
                  disabled={!canSubmit || calcularTotalBilhetes() === 0 || processandoPagamento}
                  className={`w-full py-3 px-4 rounded-lg font-medium text-sm transition-all ${
                    !canSubmit || calcularTotalBilhetes() === 0 || processandoPagamento
                      ? 'bg-gray-400 cursor-not-allowed text-gray-700'
                      : 'bg-green-600 hover:bg-green-700 shadow-md text-white'
                  } flex items-center justify-center space-x-2`}
                >
                  {processandoPagamento ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Gerando...</span>
                    </>
                  ) : (
                    <>
                      <span>💳</span>
                      <span>GERAR PAGAMENTO - R$ {(calcularTotalBilhetes() * 10).toFixed(2)}</span>
                    </>
                  )}
                </button>

                {/* Botões secundários */}
                <div className="flex gap-2">
                  {/* Botão Adicionar ao Carrinho */}
                  {Object.keys(palpites).length > 0 && (
                    <button
                      type="button"
                      onClick={adicionarPalpitesAoCarrinho}
                      className="flex-1 py-2 px-3 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-1"
                    >
                      <span>+</span>
                      <span>MAIS JOGOS</span>
                    </button>
                  )}

                  {/* Botão Limpar */}
                  <button
                    type="button"
                    onClick={limparCarrinho}
                    className="flex-1 py-2 px-3 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors flex items-center justify-center space-x-1"
                  >
                    <span>🗑️</span>
                    <span>LIMPAR</span>
                  </button>
                </div>
              </div>

              {/* Resumo */}
              <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="text-center text-sm text-green-800">
                  <p className="font-semibold">Total: R$ {(calcularTotalBilhetes() * 10).toFixed(2)}</p>
                  <p className="text-xs">{calcularTotalBilhetes()} bilhete(s) × R$ 10,00 cada</p>
                  <p className="text-xs mt-1">🔒 Pagamento seguro via PIX</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}