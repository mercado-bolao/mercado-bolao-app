import { useEffect, useState } from "react";
import Link from "next/link";

/* COMPONENTE - Cronômetro de Contagem Regressiva */
function CountdownTimer({ concursos }) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const updateCountdown = () => {
      // Encontrar o concurso com fechamento mais próximo
      const agora = new Date();
      let proximoFechamento = null;

      for (const concurso of concursos) {
        const dataFechamento = concurso.fechamentoPalpites || concurso.dataFim;
        if (dataFechamento) {
          const fechamento = new Date(dataFechamento);
          if (fechamento > agora) {
            if (!proximoFechamento || fechamento < proximoFechamento) {
              proximoFechamento = fechamento;
            }
          }
        }
      }

      if (proximoFechamento) {
        const diferenca = proximoFechamento.getTime() - agora.getTime();
        const horas = Math.floor(diferenca / (1000 * 60 * 60));
        const minutos = Math.floor((diferenca % (1000 * 60 * 60)) / (1000 * 60));

        if (horas > 0) {
          setTimeLeft(`${horas}h ${minutos}min`);
        } else if (minutos > 0) {
          setTimeLeft(`${minutos}min`);
        } else {
          setTimeLeft("Encerrado");
        }
      } else {
        setTimeLeft("--");
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // Atualizar a cada minuto

    return () => clearInterval(interval);
  }, [concursos]);

  return timeLeft;
}

export default function Home() {
  const [concursos, setConcursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const carregarConcursos = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/concursos");

        if (!response.ok) {
          throw new Error('Erro ao carregar concursos');
        }

        const data = await response.json();
        setConcursos(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Erro ao buscar concursos:', err);
        setError(err.message);
        setConcursos([]);
      } finally {
        setLoading(false);
      }
    };

    carregarConcursos();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 relative overflow-hidden">
      {/* Bolhas animadas no fundo */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-0 w-80 h-80 bg-purple-400 opacity-30 rounded-full filter blur-3xl animate-blob"></div>
        <div className="absolute top-0 right-0 w-80 h-80 bg-yellow-300 opacity-30 rounded-full filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-pink-400 opacity-30 rounded-full filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      {/* Header */}
      <header className="bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center h-20">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center rotate-12 hover:rotate-0 transition-transform">
              <span className="text-3xl">⚽</span>
            </div>
            <div>
              <h1 className="text-2xl font-black text-white bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                MERCADO DO BOLÃO
              </h1>
              <p className="text-sm text-white/70">
                Apostas e diversão garantida
              </p>
            </div>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <a
              href="#"
              className="text-white hover:text-yellow-400 font-semibold"
            >
              Início
            </a>
            <a
              href="#"
              className="text-white hover:text-yellow-400 font-semibold"
            >
              Regulamento
            </a>
            <Link href="/ranking/geral">
              <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-3 rounded-full font-bold hover:shadow-lg transform hover:scale-105 transition">
                🏆 Ranking Geral
              </span>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-16">
          <span className="inline-block bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-6 py-2 rounded-full font-bold text-sm">
            🔥 Apostas em tempo real
          </span>
          <h2 className="text-6xl md:text-7xl font-black text-white mt-6 mb-4">
            RODADAS{" "}
            <span className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
              ATIVAS
            </span>
          </h2>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Faça suas apostas nos melhores jogos e concorra a prêmios incríveis.
            Diversão garantida!
          </p>
        </div>

        {/* Cards de estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {/* Concursos Ativos */}
          <CardStat
            icon="🎯"
            title="Concursos Ativos"
            value={concursos.length}
            desc="Disponíveis agora"
            color="from-blue-500 to-cyan-400"
          />
          {/* Prêmio Total */}
          <CardStat
            icon="💰"
            title="Prêmio Total"
            value={(() => {
              const totalPremio = concursos.reduce((total, concurso) => {
                return total + (concurso.premioEstimado || 0);
              }, 0);
              return totalPremio > 0 
                ? `R$ ${(totalPremio / 1000).toFixed(0)}K`
                : 'A definir';
            })()}
            desc="Em premiações"
            color="from-green-500 to-emerald-400"
          />
          {/* Participantes */}
          <CardStat
            icon="👥"
            title="Participantes"
            value="156"
            desc="Apostadores ativos"
            color="from-purple-500 to-pink-400"
          />
          {/* Próximo Encerramento */}
          <CardStat
            icon="⏰"
            title="Próximo Encerramento"
            value={<CountdownTimer concursos={concursos} />}
            desc="Para apostas"
            color="from-orange-500 to-red-400"
          />
        </div>

        {/* Listagem de concursos */}
        <div className="space-y-12">
          {loading ? (
            <LoadingSkeleton />
          ) : error ? (
            <ErrorState error={error} onRetry={() => window.location.reload()} />
          ) : concursos.length === 0 ? (
            <EmptyConcurso />
          ) : (
            concursos.map((concurso) => (
              <CardConcurso key={concurso.id} concurso={concurso} />
            ))
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-black/20 backdrop-blur-lg border-t border-white/20 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center">
              <span className="text-2xl">⚽</span>
            </div>
            <span className="text-2xl font-black text-white">
              MERCADO DO BOLÃO
            </span>
          </div>
          <p className="text-white/60 mb-2">
            A melhor plataforma de apostas esportivas
          </p>
          <p className="text-white/40">
            © 2024 Mercado do Bolão. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}

/* COMPONENTE - Card Estatística */
function CardStat({ icon, title, value, desc, color }) {
  return (
    <div className="group">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center border border-white/20 hover:bg-white/20 transform hover:scale-105 transition">
        <div
          className={`w-16 h-16 bg-gradient-to-r ${color} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:rotate-12 transition`}
        >
          <span className="text-3xl">{icon}</span>
        </div>
        <h3 className="text-white text-lg font-semibold mb-2">{title}</h3>
        <p className="text-4xl font-black text-white mb-2">{value}</p>
        <p className="text-white/60 text-sm">{desc}</p>
      </div>
    </div>
  );
}

/* COMPONENTE - Card Concurso */
function CardConcurso({ concurso }) {
  // Verificar se as apostas encerraram
  const dataFechamento = concurso.fechamentoPalpites || concurso.dataFim;
  const agora = new Date();
  const apostasEncerradas = dataFechamento ? agora > new Date(dataFechamento) : false;

  return (
    <div className="group">
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl overflow-hidden border border-white/20 hover:border-white/40 transition shadow-xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex items-center space-x-6">
              <div className="relative">
                <div className={`w-4 h-4 ${apostasEncerradas ? 'bg-yellow-400' : 'bg-green-400'} rounded-full animate-pulse`}></div>
                <div className={`absolute inset-0 w-4 h-4 ${apostasEncerradas ? 'bg-yellow-400' : 'bg-green-400'} rounded-full animate-ping`}></div>
              </div>
              <div>
                <h3 className="text-3xl font-black text-white mb-2">
                  {concurso.nome || `CONCURSO #${concurso.numero}`}
                </h3>
                <div className="flex items-center space-x-4 flex-wrap">
                  <span className="bg-white/20 px-4 py-2 rounded-full text-white font-semibold">
                    #{concurso.numero}
                  </span>
                  <span className="bg-blue-500/20 px-4 py-2 rounded-full text-blue-300 font-semibold">
                    {concurso.jogos?.length || 0} Jogos
                  </span>
                  <span className={`px-4 py-2 rounded-full font-semibold ${
                    apostasEncerradas 
                      ? 'bg-yellow-500/20 text-yellow-300' 
                      : 'bg-green-500/20 text-green-300'
                  }`}>
                    • {apostasEncerradas ? 'EM ANDAMENTO' : 'ATIVO'}
                  </span>
                </div>
              </div>
            </div>
            <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/20">
              <div className="flex items-center justify-center mb-2">
                <span className="text-2xl">⏰</span>
                <p className="text-white font-bold text-lg ml-2">
                  Apostas Encerram
                </p>
              </div>
              <p className="text-yellow-300 font-bold text-lg">
                {dataFechamento ? new Date(dataFechamento).toLocaleDateString("pt-BR", {
                  timeZone: "America/Sao_Paulo"
                }) : "A definir"}
              </p>
              <p className="text-yellow-200 text-sm">
                {dataFechamento ? `às ${new Date(dataFechamento).toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZone: "America/Sao_Paulo"
                })}` : ""}
              </p>
            </div>
          </div>
        </div>

        {/* Corpo */}
        <div className="p-10">
          <div className="bg-gradient-to-r from-yellow-500 via-yellow-600 to-orange-500 rounded-2xl p-8 mb-10 text-center shadow-xl">
            <div className="flex items-center justify-center space-x-4 mb-4">
              <span className="text-4xl">🏆</span>
              <h4 className="text-white text-2xl font-black">
                Prêmio Estimado
              </h4>
            </div>
            <div className="text-5xl md:text-6xl font-black text-white mb-2">
              {concurso.premioEstimado 
                ? `R$ ${concurso.premioEstimado.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : 'A definir'
              }
            </div>
            <p className="text-yellow-100 text-lg font-semibold">
              Para os melhores palpiteiros!
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Link href={`/concurso/${concurso.id}`}>
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-8 text-center hover:from-green-400 hover:to-emerald-500 transform hover:scale-105 transition cursor-pointer">
                <div className="w-20 h-20 mx-auto mb-6 bg-white/20 rounded-2xl flex items-center justify-center hover:bg-white/30">
                  <span className="text-4xl">🎯</span>
                </div>
                <h5 className="text-2xl font-black text-white mb-3">
                  FAZER APOSTAS
                </h5>
                <p className="text-green-100 text-lg">
                  Clique aqui e participe!
                </p>
              </div>
            </Link>

            <Link href={`/ranking/${concurso.id}`}>
              <div className="bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl p-8 text-center hover:from-purple-400 hover:to-violet-500 transform hover:scale-105 transition cursor-pointer">
                <div className="w-20 h-20 mx-auto mb-6 bg-white/20 rounded-2xl flex items-center justify-center hover:bg-white/30">
                  <span className="text-4xl">👑</span>
                </div>
                <h5 className="text-2xl font-black text-white mb-3">RANKING</h5>
                <p className="text-purple-100 text-lg">
                  Veja quem está liderando
                </p>
              </div>
            </Link>

          </div>
        </div>
      </div>
    </div>
  );
}

/* COMPONENTE - Loading Skeleton */
function LoadingSkeleton() {
  return (
    <div className="space-y-12">
      {[1, 2].map((i) => (
        <div key={i} className="bg-white/10 backdrop-blur-lg rounded-3xl overflow-hidden border border-white/20 animate-pulse">
          <div className="bg-gradient-to-r from-gray-600 to-gray-500 p-8">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="flex items-center space-x-6">
                <div className="w-4 h-4 bg-gray-400 rounded-full"></div>
                <div>
                  <div className="h-8 bg-gray-400 rounded w-64 mb-2"></div>
                  <div className="flex items-center space-x-4">
                    <div className="h-6 bg-gray-500 rounded-full w-16"></div>
                    <div className="h-6 bg-gray-500 rounded-full w-20"></div>
                    <div className="h-6 bg-gray-500 rounded-full w-24"></div>
                  </div>
                </div>
              </div>
              <div className="bg-black/30 rounded-2xl p-6 w-48 h-24"></div>
            </div>
          </div>
          <div className="p-10">
            <div className="bg-gray-500 rounded-2xl p-8 mb-10 h-32"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-gray-500 rounded-2xl h-40"></div>
              <div className="bg-gray-500 rounded-2xl h-40"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* COMPONENTE - Estado de Erro */
function ErrorState({ error, onRetry }) {
  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-16 text-center border border-red-300/20">
      <div className="w-32 h-32 mx-auto mb-8 bg-gradient-to-r from-red-600 to-red-400 rounded-full flex items-center justify-center">
        <span className="text-6xl">⚠️</span>
      </div>
      <h3 className="text-3xl font-bold text-white mb-6">
        Erro ao Carregar Concursos
      </h3>
      <p className="text-xl text-white/70 mb-8 max-w-2xl mx-auto">
        {error || 'Ocorreu um erro inesperado. Tente novamente.'}
      </p>
      <button
        onClick={onRetry}
        className="inline-block bg-gradient-to-r from-red-500 to-red-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:shadow-xl transform hover:scale-105 cursor-pointer transition"
      >
        🔄 Tentar Novamente
      </button>
    </div>
  );
}

/* COMPONENTE - Caso não tenha concursos */
function EmptyConcurso() {
  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-16 text-center border border-white/20">
      <div className="w-32 h-32 mx-auto mb-8 bg-gradient-to-r from-gray-600 to-gray-400 rounded-full flex items-center justify-center">
        <span className="text-6xl">📊</span>
      </div>
      <h3 className="text-3xl font-bold text-white mb-6">
        Nenhum concurso ativo
      </h3>
      <p className="text-xl text-white/70 mb-8 max-w-2xl mx-auto">
        Aguarde novos concursos serem disponibilizados em breve. Enquanto isso,
        confira o ranking dos participantes!
      </p>
      <Link href="/ranking/geral">
        <span className="inline-block bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:shadow-xl transform hover:scale-105 cursor-pointer">
          Ver Ranking Geral 🏆
        </span>
      </Link>
    </div>
  );
}