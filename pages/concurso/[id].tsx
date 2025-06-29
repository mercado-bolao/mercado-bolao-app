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

    // Conta todos os palpites no carrinho
    const palpitesNoCarrinho = Object.values(carrinho).reduce((total, palpitesJogo) => {
      return total + palpitesJogo.length;
    }, 0);

    // Conta palpites pendentes (um por jogo que tem palpite)
    const palpitesPendentes = Object.keys(palpites).length;

    // Se há palpites pendentes, conta como 1 bilhete adicional
    const bilhetesCarrinho = Math.ceil(palpitesNoCarrinho / concurso.jogos.length);
    const bilhetesPendentes = palpitesPendentes > 0 ? 1 : 0;

    return bilhetesCarrinho + bilhetesPendentes;
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
    if (!canSubmit || Object.keys(palpites).length === 0) {
      return;
    }

    setProcessandoPagamento(true);

    try {
      console.log('=== INICIANDO GERAÇÃO DE PAGAMENTO DIRETO ===');
      console.log('Nome:', nome);
      console.log('WhatsApp:', whatsapp);
      console.log('Palpites:', palpites);

      // Salvar dados no localStorage
      localStorage.setItem('nome', nome);
      localStorage.setItem('whatsapp', whatsapp);

      // 1. Primeiro salvar os palpites
      const bilhetes = [palpites];
      const dadosEnvio = {
        nome,
        whatsapp,
        bilhetes
      };

      console.log('📤 Salvando palpites primeiro...');
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

      console.log('✅ Palpites salvos, gerando pagamento PIX...');

      // 2. Buscar os palpites pendentes para criar o PIX
      const palpitesPendentesResponse = await fetch(`/api/palpites-pendentes?whatsapp=${encodeURIComponent(whatsapp)}`);
      const palpitesPendentesData = await palpitesPendentesResponse.json();

      if (!palpitesPendentesResponse.ok || !palpitesPendentesData.palpites || palpitesPendentesData.palpites.length === 0) {
        throw new Error('Erro ao buscar palpites pendentes para pagamento');
      }

      console.log('📋 Palpites pendentes encontrados:', palpitesPendentesData.palpites.length);

      // 3. Gerar PIX
      const pixResponse = await fetch('/api/gerar-pix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          whatsapp: whatsapp,
          nome: nome,
          valorTotal: palpitesPendentesData.valorTotal,
          totalBilhetes: palpitesPendentesData.totalBilhetes,
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
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">⚽ Apostar</h1>
            <div className="bg-green-100 rounded-lg p-3">
              <p className="text-green-800 font-semibold">
                Concurso #{concurso.numero}
              </p>
              <p className="text-green-600 text-sm">
                {new Date(concurso.dataInicio).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
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
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">🏆 Jogos</h2>
            {concurso.jogos[0]?.horario && (
              <p className="text-sm text-gray-600">
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

          <div className="space-y-4">
            {concurso.jogos.map((jogo) => (
              <div key={jogo.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                {/* Times */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="w-10 h-10 flex-shrink-0">
                      {jogo.fotoMandante ? (
                        <img 
                          src={jogo.fotoMandante} 
                          alt={jogo.mandante}
                          className="w-full h-full object-contain rounded-full border-2 border-gray-200"
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
                        className={`w-full h-full rounded-full bg-blue-100 flex items-center justify-center ${jogo.fotoMandante ? 'hidden' : 'flex'}`}
                        style={{ display: jogo.fotoMandante ? 'none' : 'flex' }}
                      >
                        <span className="text-blue-600 font-bold text-sm">
                          {jogo.mandante.substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <span className="font-semibold text-gray-800 text-sm">{jogo.mandante}</span>
                  </div>

                  <div className="text-gray-500 font-bold text-lg px-4">X</div>

                  <div className="flex items-center space-x-3 flex-1 justify-end">
                    <span className="font-semibold text-gray-800 text-sm">{jogo.visitante}</span>
                    <div className="w-10 h-10 flex-shrink-0">
                      {jogo.fotoVisitante ? (
                        <img 
                          src={jogo.fotoVisitante} 
                          alt={jogo.visitante}
                          className="w-full h-full object-contain rounded-full border-2 border-gray-200"
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
                        className={`w-full h-full rounded-full bg-red-100 flex items-center justify-center ${jogo.fotoVisitante ? 'hidden' : 'flex'}`}
                        style={{ display: jogo.fotoVisitante ? 'none' : 'flex' }}
                      >
                        <span className="text-red-600 font-bold text-sm">
                          {jogo.visitante.substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Betting buttons - only show if betting is still open */}
                {!palpitesEncerrados && (
                  <>
                    {/* Botões de palpite */}
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() => handlePalpiteChange(jogo.id, "1")}
                        className={`py-3 px-4 rounded-lg font-semibold text-lg transition-all ${
                          palpites[jogo.id] === "1"
                            ? "bg-blue-600 text-white shadow-lg transform scale-105"
                            : "bg-blue-100 text-blue-800 hover:bg-blue-200"
                        }`}
                      >
                        1
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePalpiteChange(jogo.id, "X")}
                        className={`py-3 px-4 rounded-lg font-semibold text-lg transition-all ${
                          (palpites[jogo.id] === "X" || palpites[jogo.id] === "0")
                            ? "bg-gray-600 text-white shadow-lg transform scale-105"
                            : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                        }`}
                      >
                        X
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePalpiteChange(jogo.id, "2")}
                        className={`py-3 px-4 rounded-lg font-semibold text-lg transition-all ${
                          palpites[jogo.id] === "2"
                            ? "bg-red-600 text-white shadow-lg transform scale-105"
                            : "bg-red-100 text-red-800 hover:bg-red-200"
                        }`}
                      >
                        2
                      </button>
                    </div>

                    {/* Palpites selecionados */}
                    {(palpites[jogo.id] || (carrinho[jogo.id] && carrinho[jogo.id].length > 0)) && (
                      <div className="mt-3 text-center">
                        {/* Palpite atual (pendente) */}
                        {palpites[jogo.id] && (
                          <div className="mb-1">
                            <span className="text-sm font-semibold text-blue-600">
                              ⏳ Selecionado: {palpites[jogo.id] === '0' ? 'X' : palpites[jogo.id]}
                            </span>
                          </div>
                        )}

                        {/* Palpites no carrinho */}
                        {carrinho[jogo.id] && carrinho[jogo.id].length > 0 && (
                          <div>
                            <span className="text-sm font-semibold text-green-600">
                              ✅ No carrinho: {carrinho[jogo.id].map(p => p === '0' ? 'X' : p).join(', ')}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}

                {/* Show message when betting is closed */}
                {palpitesEncerrados && (
                  <div className="mt-3 text-center bg-gray-100 py-2 rounded-lg">
                    <span className="text-sm text-gray-600 font-semibold">
                      🔒 Apostas encerradas para este jogo
                    </span>
                  </div>
                )}
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

          {/* Carrinho de Apostas */}
          {(Object.keys(carrinho).length > 0 || Object.keys(palpites).length > 0) && (
            <div className="bg-yellow-50 rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-yellow-800 mb-4">
                🛒 CARRINHO DE BILHETES COMPLETOS
              </h3>

              {/* Tabela de palpites múltiplos */}
              <div className="bg-white rounded-lg p-4 mb-4 overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-2 font-semibold text-gray-700">Jogo</th>
                      {Array.from({ length: calcularTotalBilhetes() }, (_, i) => (
                        <th key={i} className="text-center py-3 px-2 font-semibold text-gray-700">
                          Bilhete {i + 1}
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
                        <tr key={jogo.id} className={`border-b border-gray-100 ${todosPalpites.length > 0 ? 'bg-blue-50' : ''}`}>
                          {/* Nome do jogo */}
                          <td className="py-4 px-2">
                            <div className="text-xs font-bold text-gray-500 mb-1">JOGO {index + 1}</div>
                            <div className="text-sm font-semibold text-gray-800">
                              {jogo.mandante} x {jogo.visitante}
                            </div>
                          </td>

                          {/* Palpites por bilhete */}
                          {Array.from({ length: calcularTotalBilhetes() }, (_, bilheteIndex) => (
                            <td key={bilheteIndex} className="py-4 px-2 text-center">
                              {todosPalpites[bilheteIndex] ? (
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mx-auto ${
                                  palpitesCarrinho.includes(todosPalpites[bilheteIndex]) || bilheteIndex < palpitesCarrinho.length
                                    ? (todosPalpites[bilheteIndex] === '1' ? 'bg-blue-600 text-white' :
                                       (todosPalpites[bilheteIndex] === '0' || todosPalpites[bilheteIndex] === 'X') ? 'bg-gray-600 text-white' :
                                       'bg-red-600 text-white')
                                    : (todosPalpites[bilheteIndex] === '1' ? 'bg-blue-100 border-2 border-dashed border-blue-400 text-blue-800' :
                                       (todosPalpites[bilheteIndex] === '0' || todosPalpites[bilheteIndex] === 'X') ? 'bg-gray-100 border-2 border-dashed border-gray-400 text-gray-800' :
                                       'bg-red-100 border-2 border-dashed border-red-400 text-red-800')
                                }`}>
                                  {todosPalpites[bilheteIndex] === '0' ? 'X' : todosPalpites[bilheteIndex]}
                                </div>
                              ) : (
                                <span className="text-gray-400 text-sm">-</span>
                              )}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Mensagem quando não há palpites */}
                {Object.keys(carrinho).length === 0 && Object.keys(palpites).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">🎯</div>
                    <div className="font-medium">Nenhum palpite adicionado ainda</div>
                    <div className="text-sm mt-1">Escolha seus palpites nos jogos acima</div>
                  </div>
                )}
              </div>

              {/* Resumo dos bilhetes */}
              <div className="border-t border-yellow-200 pt-4">
                <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-yellow-800 mb-2">📊 Resumo dos Bilhetes Completos</h4>
                  <div className="text-sm mb-3 text-yellow-700 bg-yellow-50 p-2 rounded">
                    <strong>Nova Regra:</strong> Cada conjunto completo de palpites = 1 bilhete de R$ 10,00
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-yellow-700">Jogos disponíveis:</span>
                      <span className="font-bold text-yellow-900">
                        {concurso.jogos.length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-yellow-700">Total de bilhetes:</span>
                      <span className="font-bold text-yellow-900">
                        {calcularTotalBilhetes()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-yellow-700">Valor por bilhete:</span>
                      <span className="font-bold text-yellow-900">R$ 10,00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-yellow-700">Valor total:</span>
                      <span className="font-bold text-yellow-900 text-lg">
                        R$ {(calcularTotalBilhetes() * 10).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botões de ação do carrinho */}
              <div className="mt-4 flex gap-2">
                {Object.keys(palpites).length > 0 && (
                  <button
                    type="button"
                    onClick={adicionarPalpitesAoCarrinho}
                    className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                  >
                    💾 ADICIONAR AO CARRINHO
                  </button>
                )}

                {/* Botão para limpar carrinho */}
                {calcularTotalBilhetes() > 0 && (
                  <button
                    type="button"
                    onClick={limparCarrinho}
                    className="py-3 px-4 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-colors"
                    title="Limpar todo o carrinho"
                  >
                    🗑️
                  </button>
                )}

                <button
                  onClick={handleGerarPagamento}
                  disabled={!canSubmit || isLoading || Object.keys(palpites).length === 0 || palpitesEncerrados || processandoPagamento}
                  className={`w-full py-4 px-8 rounded-xl font-bold text-lg transition-all transform ${
                    !canSubmit || isLoading || Object.keys(palpites).length === 0 || palpitesEncerrados || processandoPagamento
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700 hover:scale-105 shadow-lg'
                  } text-white flex items-center justify-center space-x-2`}
                >
                  {isLoading || processandoPagamento ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>{processandoPagamento ? 'Gerando Pagamento...' : 'Enviando...'}</span>
                    </>
                  ) : (
                    <>
                      <span>💳</span>
                      <span>GERAR PAGAMENTO ({Object.keys(palpites).length} palpites)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Finalização do Bilhete */}
          {(Object.keys(carrinho).length > 0 || Object.keys(palpites).length > 0) && (
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">🎯 Finalizar Bilhete</h2>

              {/* Dados do usuário */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome completo
                  </label>
                  <input
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-purple-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-200 text-gray-900 bg-white placeholder-gray-500"
                    placeholder="Digite seu nome completo"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-purple-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-200 text-gray-900 bg-white placeholder-gray-500"
                    placeholder="(11) 99999-9999"
                    required
                  />
                </div>
              </div>

              {/* Botões de ação */}
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={limparApostas}
                  className="flex-1 py-4 px-6 bg-gray-500 text-white rounded-xl font-semibold text-lg hover:bg-gray-600 transition-colors"
                >
                  🗑️ LIMPAR CARRINHO
                </button>

                <button
                  type="submit"
                  disabled={enviando}
                  className="flex-1 py-4 px-6 bg-green-600 text-white rounded-xl font-semibold text-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {enviando ? "SALVANDO..." : "✅ FINALIZAR BILHETE"}
                </button>
              </div>

              {/* Mensagem de sucesso */}
              {sucesso && (
                <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-lg mt-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <span className="text-2xl">✅</span>
                    </div>
                    <div className="ml-3">
                      <p className="font-semibold">Bilhete salvo como pendente!</p>
                      <p className="text-sm">Seus palpites foram registrados e estão aguardando pagamento.</p>
                      <p className="text-sm font-medium mt-1">💰 Valor do bilhete: R$ 10,00</p>
                    </div>
                  </div>
                </div>
              )}
            </form>
          )}
        </div>

        {/* Dica */}
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg mt-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-2xl">💡</span>
            </div>
            <div className="ml-3">
              <p className="text-blue-700 text-sm">
                <strong>Como apostar:</strong> 1 = Casa vence, X = Empate, 2 = Fora vence
              </p>
              <p className="text-blue-600 text-xs mt-1">
                <strong>Nova regra:</strong> Cada conjunto completo de palpites = 1 bilhete de R$ 10,00
              </p>
              <p className="text-blue-600 text-xs mt-1">
                <strong>Exemplo:</strong> 3 conjuntos diferentes de palpites = 3 bilhetes = R$ 30,00 total
              </p>
              <p className="text-blue-600 text-xs mt-1">
                <strong>Permitido:</strong> Mesmo resultado em palpites diferentes (Ex: Casa em Bilhete 1 e 2)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}