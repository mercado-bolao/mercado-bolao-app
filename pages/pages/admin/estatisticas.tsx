
import { useState, useEffect } from "react";
import Link from "next/link";

interface Estatisticas {
  totalConcursos: number;
  totalJogos: number;
  totalPalpites: number;
  totalUsuarios: number;
  concursoAtivo?: {
    numero: number;
    palpites: number;
    usuarios: number;
  };
  distribuicaoPalpites: {
    casa: number;
    empate: number;
    fora: number;
  };
}

export default function AdminEstatisticas() {
  const [stats, setStats] = useState<Estatisticas | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    buscarEstatisticas();
  }, []);

  const buscarEstatisticas = async () => {
    try {
      const response = await fetch("/api/admin/estatisticas");
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Erro ao buscar estatísticas:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">⚽</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">Admin - Estatísticas</h1>
            </div>
            <Link href="/">
              <span className="text-blue-600 hover:text-blue-800 font-medium cursor-pointer">
                ← Voltar ao Site
              </span>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation */}
        <div className="flex flex-wrap gap-4 mb-8">
          <Link href="/admin">
            <span className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 cursor-pointer">
              Palpites
            </span>
          </Link>
          <Link href="/admin/jogos">
            <span className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 cursor-pointer">
              Jogos
            </span>
          </Link>
          <Link href="/admin/concursos">
            <span className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 cursor-pointer">
              Concursos
            </span>
          </Link>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium">
            Estatísticas
          </button>
          <Link href="/ranking/geral">
            <span className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 cursor-pointer">
              Ranking Geral
            </span>
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Carregando estatísticas...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Cards de Estatísticas Gerais */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">🏆</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Concursos</p>
                    <p className="text-2xl font-bold text-gray-900">{stats?.totalConcursos || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">⚽</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Jogos</p>
                    <p className="text-2xl font-bold text-gray-900">{stats?.totalJogos || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">🎯</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Palpites</p>
                    <p className="text-2xl font-bold text-gray-900">{stats?.totalPalpites || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">👥</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Usuários</p>
                    <p className="text-2xl font-bold text-gray-900">{stats?.totalUsuarios || 0}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Distribuição de Palpites */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Distribuição de Palpites</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-xl font-bold text-blue-600">C</span>
                  </div>
                  <p className="text-sm text-gray-600">Casa (Mandante)</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.distribuicaoPalpites?.casa || 0}</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-xl font-bold text-gray-600">E</span>
                  </div>
                  <p className="text-sm text-gray-600">Empate</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.distribuicaoPalpites?.empate || 0}</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-xl font-bold text-red-600">F</span>
                  </div>
                  <p className="text-sm text-gray-600">Fora (Visitante)</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.distribuicaoPalpites?.fora || 0}</p>
                </div>
              </div>
            </div>

            {/* Concurso Ativo */}
            {stats?.concursoAtivo && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Concurso Ativo</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm text-gray-600">Número do Concurso</p>
                    <p className="text-xl font-bold text-gray-900">#{stats.concursoAtivo.numero}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Palpites Registrados</p>
                    <p className="text-xl font-bold text-gray-900">{stats.concursoAtivo.palpites}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Usuários Participando</p>
                    <p className="text-xl font-bold text-gray-900">{stats.concursoAtivo.usuarios}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
