
import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";

const Home = () => {
  const [concursos, setConcursos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConcursos();
  }, []);

  const fetchConcursos = async () => {
    try {
      const response = await fetch("/api/concursos");
      if (response.ok) {
        const data = await response.json();
        setConcursos(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Erro ao buscar concursos:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Bolão TV Loteca</title>
        <meta name="description" content="Sistema de bolão TV Loteca" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🎯 Bolão TV Loteca
          </h1>
          <p className="text-xl text-gray-600">
            Faça seus palpites e acompanhe os resultados
          </p>
        </div>

        {/* Navigation Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Link href="/concurso" className="group">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-l-4 border-blue-500">
              <div className="flex items-center mb-4">
                <span className="text-3xl mr-3">🎮</span>
                <h2 className="text-xl font-semibold text-gray-900">Concursos</h2>
              </div>
              <p className="text-gray-600">
                Veja todos os concursos disponíveis e faça seus palpites
              </p>
            </div>
          </Link>

          <Link href="/ranking/geral" className="group">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-l-4 border-green-500">
              <div className="flex items-center mb-4">
                <span className="text-3xl mr-3">🏆</span>
                <h2 className="text-xl font-semibold text-gray-900">Ranking Geral</h2>
              </div>
              <p className="text-gray-600">
                Acompanhe a classificação geral de todos os participantes
              </p>
            </div>
          </Link>

          <Link href="/admin" className="group">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-l-4 border-red-500">
              <div className="flex items-center mb-4">
                <span className="text-3xl mr-3">⚙️</span>
                <h2 className="text-xl font-semibold text-gray-900">Administração</h2>
              </div>
              <p className="text-gray-600">
                Gerenciar concursos, jogos e visualizar estatísticas
              </p>
            </div>
          </Link>
        </div>

        {/* Concursos Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            📋 Concursos Recentes
          </h2>
          
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">Carregando concursos...</div>
            </div>
          ) : concursos.length > 0 ? (
            <div className="grid gap-4">
              {concursos.slice(0, 3).map((concurso) => (
                <div key={concurso.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-lg">
                        {concurso.nome || `Concurso #${concurso.numero}`}
                      </h3>
                      <p className="text-gray-600">
                        Status: <span className="font-medium">{concurso.status}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <Link 
                        href={`/concurso/${concurso.id}`}
                        className="inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                      >
                        Ver Detalhes
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <span className="text-4xl block mb-4">🎯</span>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum concurso encontrado
              </h3>
              <p className="text-gray-600 mb-4">
                Ainda não há concursos cadastrados no sistema.
              </p>
              <Link 
                href="/admin"
                className="inline-block bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 transition-colors"
              >
                Ir para Administração
              </Link>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-12 pt-8 border-t border-gray-200">
          <p className="text-gray-500">
            © 2024 Bolão TV Loteca - Sistema de Apostas Esportivas
          </p>
        </div>
      </main>
    </div>
  );
};

export default Home;
