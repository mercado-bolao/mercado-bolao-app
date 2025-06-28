
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'

interface Concurso {
  id: string
  numero: number
  nome: string
  status: string
  jogos: number
  dataInicio: string
  dataFim: string
  fechamentoPalpites: string
}

export default function Home() {
  const [concursos, setConcursos] = useState<Concurso[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchConcursos()
  }, [])

  const fetchConcursos = async () => {
    try {
      const response = await fetch('/api/concursos')
      const data = await response.json()
      setConcursos(data)
    } catch (error) {
      console.error('Erro ao buscar concursos:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Header */}
      <header className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm"></div>
        <nav className="relative z-10 container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">⚽</span>
              </div>
              <h1 className="text-2xl font-bold text-white">Bolão TV Loteca</h1>
            </div>
            <div className="hidden md:flex items-center space-x-6">
              <Link href="/" className="text-white/90 hover:text-white transition-colors">
                Home
              </Link>
              <Link href="/ranking/geral" className="text-white/90 hover:text-white transition-colors">
                Ranking
              </Link>
              <Link href="/admin" className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all">
                Admin
              </Link>
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-6">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-6 py-2 mb-8">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-3 animate-pulse"></span>
              <span className="text-white/90 text-sm font-medium">Sistema Online e Atualizado</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Seu Bolão de
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"> Futebol</span>
            </h1>
            
            <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto leading-relaxed">
              Faça seus palpites, acompanhe os resultados em tempo real e dispute prêmios incríveis com seus amigos.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button 
                onClick={() => concursos.length > 0 && router.push(`/concurso/${concursos[0].id}`)}
                className="group bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 transform hover:-translate-y-1"
              >
                <span className="mr-2">🎯</span>
                Fazer Palpites
                <span className="ml-2 group-hover:translate-x-1 transition-transform inline-block">→</span>
              </button>
              
              <Link href="/ranking/geral" className="group bg-white/10 backdrop-blur-sm border border-white/20 text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/20 transition-all duration-300">
                <span className="mr-2">🏆</span>
                Ver Ranking
              </Link>
            </div>
          </div>
        </div>

        {/* Background decoration */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-blue-500/20 rounded-full blur-xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-purple-500/20 rounded-full blur-xl animate-float animate-delay-1000"></div>
      </section>

      {/* Concursos Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Concursos Ativos</h2>
            <p className="text-white/70 text-lg">Escolha seu concurso e faça seus palpites</p>
          </div>

          {loading ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
              {concursos.map((concurso, index) => (
                <div 
                  key={concurso.id} 
                  className="group bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 hover:bg-white/15 transition-all duration-300 hover:scale-105 animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold">#{concurso.numero}</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">{concurso.nome}</h3>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          concurso.status === 'ativo' 
                            ? 'bg-green-400/20 text-green-300 border border-green-400/30' 
                            : 'bg-gray-400/20 text-gray-300 border border-gray-400/30'
                        }`}>
                          {concurso.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-white/70">
                      <span>Jogos:</span>
                      <span className="font-semibold text-white">{concurso.jogos}</span>
                    </div>
                    <div className="flex justify-between text-white/70">
                      <span>Início:</span>
                      <span className="font-semibold text-white">
                        {new Date(concurso.dataInicio).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <div className="flex justify-between text-white/70">
                      <span>Fechamento:</span>
                      <span className="font-semibold text-white">
                        {new Date(concurso.fechamentoPalpites).toLocaleString('pt-BR')}
                      </span>
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <Link 
                      href={`/concurso/${concurso.id}`}
                      className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 px-4 rounded-lg font-semibold text-center hover:shadow-lg transition-all group-hover:shadow-blue-500/25"
                    >
                      Apostar
                    </Link>
                    <Link 
                      href={`/ranking/${concurso.id}`}
                      className="bg-white/10 border border-white/20 text-white py-3 px-4 rounded-lg font-semibold hover:bg-white/20 transition-all"
                    >
                      Ranking
                    </Link>
                  </div>
                </div>
              ))}

              {concursos.length === 0 && !loading && (
                <div className="col-span-full text-center py-16">
                  <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-3xl">⚽</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">Nenhum concurso ativo</h3>
                  <p className="text-white/70 mb-8">Em breve teremos novos concursos disponíveis!</p>
                  <Link 
                    href="/admin" 
                    className="inline-flex bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
                  >
                    Criar Concurso
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 border-t border-white/10">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Palpites Fáceis</h3>
              <p className="text-white/70">Interface intuitiva para fazer seus palpites de forma rápida e simples.</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Ranking Dinâmico</h3>
              <p className="text-white/70">Acompanhe sua posição e dos seus amigos em tempo real.</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl">🏆</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Prêmios</h3>
              <p className="text-white/70">Compete com seus amigos e ganhe prêmios incríveis.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/10">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center space-x-4 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">⚽</span>
            </div>
            <span className="text-white font-semibold">Bolão TV Loteca</span>
          </div>
          <p className="text-white/60">© 2025 Bolão TV Loteca. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
