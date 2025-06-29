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
  const [carrinho, setCarrinho] = useState<{ [key: string]: string }>({});
  const [enviando, setEnviando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [palpitesEncerrados, setPalpitesEncerrados] = useState(false);

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
    }
  }, [id]);

  const handlePalpiteChange = (jogoId: string, resultado: string) => {
    setPalpites(prev => ({
      ...prev,
      [jogoId]: resultado
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

    // Combina carrinho com palpites atuais
    const todosPalpites = { ...carrinho, ...palpites };
    const jogosComPalpites = Object.keys(todosPalpites);
    
    if (jogosComPalpites.length === 0) {
      alert("Por favor, faça pelo menos um palpite");
      return;
    }

    setEnviando(true);

    try {
      let sucessos = 0;
      let erros = 0;
      let mensagensErro: string[] = [];

      for (const jogoId of jogosComPalpites) {
        const dadosEnvio = {
          jogoId,
          resultado: todosPalpites[jogoId],
          nome: nome.trim(),
          whatsapp: whatsapp.trim(),
        };

        console.log(`Enviando palpite para jogo ${jogoId}:`, dadosEnvio);

        try {
          const response = await fetch("/api/palpites", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dadosEnvio),
          });

          const result = await response.json();

          console.log(`Resposta da API para jogo ${jogoId}:`, {
            status: response.status,
            result
          });

          if (response.ok) {
            sucessos++;
            console.log(`✅ Palpite ${jogoId} salvo com sucesso`);
          } else {
            erros++;
            const jogo = concurso?.jogos.find(j => j.id === jogoId);
            const nomeJogo = jogo ? `${jogo.mandante} x ${jogo.visitante}` : `Jogo ${jogoId}`;
            
            console.error(`❌ Erro ao salvar palpite do jogo ${jogoId}:`, result);
            
            if (response.status === 400 && result.error?.includes('encerrado')) {
              mensagensErro.push(`Apostas encerradas para: ${nomeJogo}`);
            } else if (response.status === 404) {
              mensagensErro.push(`Jogo não encontrado: ${nomeJogo}`);
            } else if (response.status === 503) {
              mensagensErro.push(`Erro de conexão. Tente novamente.`);
            } else {
              mensagensErro.push(`Erro em ${nomeJogo}: ${result.error || 'Erro desconhecido'}`);
            }
          }
        } catch (fetchError) {
          erros++;
          console.error(`Erro de rede para jogo ${jogoId}:`, fetchError);
          mensagensErro.push('Erro de conexão. Verifique sua internet.');
        }
      }

      console.log(`=== RESULTADO: ${sucessos} sucessos, ${erros} erros ===`);

      if (sucessos > 0) {
        setSucesso(true);
        if (erros === 0) {
          // Limpar tudo após sucesso
          setPalpites({});
          setCarrinho({});
          setNome("");
          setWhatsapp("");
          // Esconder mensagem de sucesso após 5 segundos
          setTimeout(() => setSucesso(false), 5000);
        }
        
        let mensagem = `✅ ${sucessos} palpite(s) enviado(s) com sucesso!`;
        if (erros > 0) {
          mensagem += `\n\n❌ ${erros} erro(s):\n${mensagensErro.join('\n')}`;
        }
        alert(mensagem);
      } else {
        let mensagemErro = "❌ Não foi possível enviar nenhum palpite.";
        if (mensagensErro.length > 0) {
          mensagemErro += `\n\nDetalhes:\n${mensagensErro.join('\n')}`;
        }
        alert(mensagemErro);
      }
    } catch (error) {
      console.error('Erro geral ao enviar palpites:', error);
      alert("❌ Erro inesperado ao enviar palpites. Verifique sua conexão e tente novamente.");
    } finally {
      setEnviando(false);
    }
  };

  const adicionarPalpitesAoCarrinho = () => {
    // Adiciona os palpites atuais ao carrinho
    setCarrinho(prev => ({
      ...prev,
      ...palpites
    }));
    
    // Limpa os palpites atuais para permitir novas seleções
    setPalpites({});
    
    // Scroll para o topo para ver os jogos
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const limparApostas = () => {
    setPalpites({});
    setCarrinho({});
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
                          palpites[jogo.id] === "X"
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

                    {/* Palpite selecionado */}
                    {palpites[jogo.id] && (
                      <div className="mt-3 text-center">
                        <span className="text-sm text-green-600 font-semibold">
                          ✓ Palpite: {palpites[jogo.id]}
                        </span>
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

          {/* Carrinho de Palpites */}
          {(Object.keys(carrinho).length > 0 || Object.keys(palpites).length > 0) && (
            <div className="bg-yellow-50 rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-yellow-800 mb-3">
                🛒 CARRINHO DE APOSTAS
              </h3>
              
              {/* Lista de Palpites em formato vertical */}
              <div className="bg-white rounded-lg p-3 mb-4 space-y-2">
                {/* Palpites já no carrinho */}
                {Object.entries(carrinho).map(([jogoId, resultado]) => {
                  const jogo = concurso.jogos.find(j => j.id === jogoId);
                  return (
                    <div key={jogoId} className="flex items-center justify-between bg-green-50 p-2 rounded border-l-4 border-green-500">
                      <div className="flex-1">
                        <div className="text-xs font-medium text-gray-700">
                          {jogo?.mandante} x {jogo?.visitante}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="bg-green-100 px-2 py-1 rounded text-xs font-bold text-green-800">
                          {resultado}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const newCarrinho = { ...carrinho };
                            delete newCarrinho[jogoId];
                            setCarrinho(newCarrinho);
                          }}
                          className="text-red-600 hover:text-red-800 text-xs p-1"
                        >
                          ❌
                        </button>
                      </div>
                    </div>
                  );
                })}
                
                {/* Palpites atuais (ainda não salvos no carrinho) */}
                {Object.entries(palpites).map(([jogoId, resultado]) => {
                  // Não mostrar se já está no carrinho
                  if (carrinho[jogoId]) return null;
                  
                  const jogo = concurso.jogos.find(j => j.id === jogoId);
                  return (
                    <div key={jogoId} className="flex items-center justify-between bg-blue-50 p-2 rounded border-l-4 border-blue-500">
                      <div className="flex-1">
                        <div className="text-xs font-medium text-gray-700">
                          {jogo?.mandante} x {jogo?.visitante}
                        </div>
                        <div className="text-xs text-blue-600 font-medium">⏳ PALPITE ATUAL</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="bg-blue-100 px-2 py-1 rounded text-xs font-bold text-blue-800">
                          {resultado}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const newPalpites = { ...palpites };
                            delete newPalpites[jogoId];
                            setPalpites(newPalpites);
                          }}
                          className="text-red-600 hover:text-red-800 text-xs p-1"
                        >
                          ❌
                        </button>
                      </div>
                    </div>
                  );
                })}
                
                {/* Mensagem quando não há palpites */}
                {Object.keys(carrinho).length === 0 && Object.keys(palpites).length === 0 && (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    Nenhum palpite adicionado ainda
                  </div>
                )}
              </div>
              
              <div className="border-t border-yellow-200 pt-3">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-yellow-800">Total de Bilhetes:</span>
                  <span className="font-bold text-yellow-900">
                    {(() => {
                      const totalPalpites = Object.keys(carrinho).length + Object.keys(palpites).length;
                      const bilhetesCompletos = Math.floor(totalPalpites / concurso.jogos.length);
                      const palpitesIncompletos = totalPalpites % concurso.jogos.length;
                      // Se tem palpites incompletos, conta como mais um bilhete
                      return bilhetesCompletos + (palpitesIncompletos > 0 ? 1 : 0) || 1;
                    })()}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="font-semibold text-yellow-800">Valor Total:</span>
                  <span className="font-bold text-yellow-900 text-lg">
                    R$ {((() => {
                      const totalPalpites = Object.keys(carrinho).length + Object.keys(palpites).length;
                      const bilhetesCompletos = Math.floor(totalPalpites / concurso.jogos.length);
                      const palpitesIncompletos = totalPalpites % concurso.jogos.length;
                      return bilhetesCompletos + (palpitesIncompletos > 0 ? 1 : 0) || 1;
                    })() * 10).toFixed(2)}
                  </span>
                </div>
              </div>
              
              {/* Botões de ação do carrinho */}
              <div className="mt-4 flex gap-3">
                {Object.keys(palpites).length > 0 && (
                  <button
                    type="button"
                    onClick={adicionarPalpitesAoCarrinho}
                    className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                  >
                    💾 SALVAR E ADICIONAR MAIS
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    // Se há palpites não salvos, salvar primeiro
                    if (Object.keys(palpites).length > 0) {
                      adicionarPalpitesAoCarrinho();
                    }
                    // Scroll para a seção de finalização
                    setTimeout(() => {
                      const finalizarSection = document.querySelector('form');
                      if (finalizarSection) {
                        finalizarSection.scrollIntoView({ behavior: 'smooth' });
                      }
                    }, 100);
                  }}
                  className="flex-1 py-3 px-4 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors"
                >
                  🎯 FINALIZAR BILHETE
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
                <strong>Dica:</strong> 1 = Vitória do mandante, X = Empate, 2 = Vitória do visitante
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}