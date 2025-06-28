
import { useEffect, useState } from 'react';

interface LiveMatch {
  id: string;
  mandante: string;
  visitante: string;
  horario: string;
  fotoMandante?: string;
  fotoVisitante?: string;
  totalPalpites: number;
  palpitesCasa: number;
  palpitesEmpate: number;
  palpitesFora: number;
  percentualCasa: string;
  percentualEmpate: string;
  percentualFora: string;
  status: string;
}

interface LiveMatchTrackerProps {
  concursoId: string;
  onMatchUpdate?: (updatedMatch: any) => void;
}

export default function LiveMatchTracker({ concursoId, onMatchUpdate }: LiveMatchTrackerProps) {
  const [matches, setMatches] = useState<LiveMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLiveMatches = async () => {
      try {
        setError(null);
        const response = await fetch(`/api/live-matches?concursoId=${concursoId}`);
        
        if (!response.ok) {
          throw new Error(`Erro ao buscar partidas: ${response.status}`);
        }
        
        const data = await response.json();
        setMatches(data);
        setLoading(false);
      } catch (err: any) {
        console.error('Erro ao buscar partidas ao vivo:', err);
        setError(err.message || 'Erro ao buscar partidas ao vivo.');
        setLoading(false);
      }
    };

    fetchLiveMatches();

    // Atualizar a cada 30 segundos
    const intervalId = setInterval(fetchLiveMatches, 30000);

    return () => clearInterval(intervalId);
  }, [concursoId]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">⚽ Jogos em Andamento</h2>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Carregando jogos em andamento...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">⚽ Jogos em Andamento</h2>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">⚠️ {error}</p>
        </div>
      </div>
    );
  }

  if (!matches || matches.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">⚽ Jogos em Andamento</h2>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-gray-600">📊 Nenhum jogo em andamento no momento</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">⚽ Jogos em Andamento</h2>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>Atualização automática</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {matches.map((match) => (
          <LiveMatchItem key={match.id} match={match} />
        ))}
      </div>
    </div>
  );
}

function LiveMatchItem({ match }: { match: LiveMatch }) {
  return (
    <div className="border-2 border-gray-200 rounded-xl p-6 bg-gradient-to-br from-gray-50 to-white hover:shadow-lg transition-all">
      {/* Header do jogo */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          {match.fotoMandante && (
            <img 
              src={match.fotoMandante} 
              alt={match.mandante} 
              className="w-8 h-8 rounded object-cover" 
            />
          )}
          <span className="font-bold text-gray-800">{match.mandante}</span>
        </div>
        
        <div className="text-center">
          <div className="text-sm text-gray-500 font-semibold">VS</div>
          <div className="text-xs text-gray-400">
            {new Date(match.horario).toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <span className="font-bold text-gray-800">{match.visitante}</span>
          {match.fotoVisitante && (
            <img 
              src={match.fotoVisitante} 
              alt={match.visitante} 
              className="w-8 h-8 rounded object-cover" 
            />
          )}
        </div>
      </div>

      {/* Informação de palpites */}
      <div className="bg-blue-50 rounded-lg p-4 mb-4">
        <div className="text-center mb-3">
          <span className="text-blue-800 font-semibold">
            📊 {match.totalPalpites} palpites registrados
          </span>
        </div>
        
        {/* Barras de percentual */}
        <div className="space-y-3">
          {/* Casa */}
          <div className="flex items-center space-x-3">
            <div className="w-12 text-center">
              <span className="bg-green-500 text-white px-2 py-1 rounded text-xs font-bold">
                C
              </span>
            </div>
            <div className="flex-1">
              <div className="bg-gray-200 rounded-full h-6 relative overflow-hidden">
                <div 
                  className="bg-green-500 h-full rounded-full transition-all duration-500 flex items-center justify-center"
                  style={{ width: `${match.percentualCasa}%` }}
                >
                  {parseFloat(match.percentualCasa) > 15 && (
                    <span className="text-white text-xs font-bold">
                      {match.percentualCasa}%
                    </span>
                  )}
                </div>
                {parseFloat(match.percentualCasa) <= 15 && (
                  <span className="absolute inset-0 flex items-center justify-center text-gray-700 text-xs font-bold">
                    {match.percentualCasa}%
                  </span>
                )}
              </div>
            </div>
            <div className="w-8 text-center text-sm font-semibold text-green-600">
              {match.palpitesCasa}
            </div>
          </div>

          {/* Empate */}
          <div className="flex items-center space-x-3">
            <div className="w-12 text-center">
              <span className="bg-yellow-500 text-white px-2 py-1 rounded text-xs font-bold">
                E
              </span>
            </div>
            <div className="flex-1">
              <div className="bg-gray-200 rounded-full h-6 relative overflow-hidden">
                <div 
                  className="bg-yellow-500 h-full rounded-full transition-all duration-500 flex items-center justify-center"
                  style={{ width: `${match.percentualEmpate}%` }}
                >
                  {parseFloat(match.percentualEmpate) > 15 && (
                    <span className="text-white text-xs font-bold">
                      {match.percentualEmpate}%
                    </span>
                  )}
                </div>
                {parseFloat(match.percentualEmpate) <= 15 && (
                  <span className="absolute inset-0 flex items-center justify-center text-gray-700 text-xs font-bold">
                    {match.percentualEmpate}%
                  </span>
                )}
              </div>
            </div>
            <div className="w-8 text-center text-sm font-semibold text-yellow-600">
              {match.palpitesEmpate}
            </div>
          </div>

          {/* Fora */}
          <div className="flex items-center space-x-3">
            <div className="w-12 text-center">
              <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                F
              </span>
            </div>
            <div className="flex-1">
              <div className="bg-gray-200 rounded-full h-6 relative overflow-hidden">
                <div 
                  className="bg-red-500 h-full rounded-full transition-all duration-500 flex items-center justify-center"
                  style={{ width: `${match.percentualFora}%` }}
                >
                  {parseFloat(match.percentualFora) > 15 && (
                    <span className="text-white text-xs font-bold">
                      {match.percentualFora}%
                    </span>
                  )}
                </div>
                {parseFloat(match.percentualFora) <= 15 && (
                  <span className="absolute inset-0 flex items-center justify-center text-gray-700 text-xs font-bold">
                    {match.percentualFora}%
                  </span>
                )}
              </div>
            </div>
            <div className="w-8 text-center text-sm font-semibold text-red-600">
              {match.palpitesFora}
            </div>
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="text-center">
        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
          🔴 Ao Vivo
        </span>
      </div>
    </div>
  );
}
