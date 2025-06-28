
import { useEffect, useState } from "react";
import Link from "next/link";

interface RankingItem {
  posicao: number;
  nome: string;
  whatsapp: string;
  acertos: number;
  totalPalpites: number;
  percentualFormatado: string;
}

interface RankingData {
  ranking: RankingItem[];
  totalJogos: number;
  totalParticipantes: number;
  message?: string;
}

export default function RankingGeral() {
  const [ranking, setRanking] = useState<RankingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/ranking-geral')
      .then(res => res.json())
      .then(data => {
        setRanking(data);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Carregando ranking geral...</p>
        </div>
      </div>
    );
  }

  if (!ranking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-lg">Erro ao carregar ranking</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">🏆 Ranking Geral</h1>
            <div className="bg-purple-100 rounded-lg p-3 mb-4">
              <p className="text-purple-800 font-semibold">
                Classificação de Todos os Concursos
              </p>
              <p className="text-purple-600 text-sm">
                {ranking.totalJogos} jogos finalizados • {ranking.totalParticipantes} participantes
              </p>
            </div>
            <div className="flex justify-center space-x-4">
              <Link href="/">
                <button className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                  ← Voltar ao Início
                </button>
              </Link>
              <Link href="/admin">
                <button className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors">
                  Admin
                </button>
              </Link>
            </div>
          </div>
        </div>

        {ranking.message ? (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-lg">
            <p className="font-semibold">{ranking.message}</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6">
              <h2 className="text-2xl font-bold text-white text-center">
                👑 Hall da Fama
              </h2>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                {ranking.ranking.map((item, index) => (
                  <div
                    key={`${item.nome}-${item.whatsapp}`}
                    className={`p-4 rounded-xl border-2 transition-all hover:shadow-md ${
                      index === 0
                        ? "bg-gradient-to-r from-yellow-100 to-yellow-200 border-yellow-400"
                        : index === 1
                        ? "bg-gradient-to-r from-gray-100 to-gray-200 border-gray-400"
                        : index === 2
                        ? "bg-gradient-to-r from-orange-100 to-orange-200 border-orange-400"
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                            index === 0
                              ? "bg-yellow-500 text-white"
                              : index === 1
                              ? "bg-gray-500 text-white"
                              : index === 2
                              ? "bg-orange-500 text-white"
                              : "bg-purple-500 text-white"
                          }`}
                        >
                          {item.posicao === 1 ? "🥇" : item.posicao === 2 ? "🥈" : item.posicao === 3 ? "🥉" : item.posicao}
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-gray-800">{item.nome}</h3>
                          <p className="text-sm text-gray-600">WhatsApp: {item.whatsapp}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">
                          {item.acertos}
                        </div>
                        <div className="text-sm text-gray-600">
                          {item.acertos}/{item.totalPalpites} ({item.percentualFormatado}%)
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {ranking.ranking.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-lg">Nenhum participante ainda</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Estatísticas gerais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div className="bg-white rounded-xl p-6 text-center shadow-lg">
            <div className="text-3xl font-bold text-purple-600">{ranking.totalJogos}</div>
            <div className="text-gray-600">Total de Jogos</div>
          </div>
          <div className="bg-white rounded-xl p-6 text-center shadow-lg">
            <div className="text-3xl font-bold text-green-600">{ranking.totalParticipantes}</div>
            <div className="text-gray-600">Participantes</div>
          </div>
          <div className="bg-white rounded-xl p-6 text-center shadow-lg">
            <div className="text-3xl font-bold text-orange-600">
              {ranking.ranking.length > 0 ? ranking.ranking[0].acertos : 0}
            </div>
            <div className="text-gray-600">Recorde de Acertos</div>
          </div>
        </div>
      </div>
    </div>
  );
}
