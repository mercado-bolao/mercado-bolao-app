import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Concurso {
  id: string;
  numero: number;
  status: string;
}

interface Jogo {
  id: string;
  mandante: string;
  visitante: string;
  horario: string;
  concursoId: string;
  concurso: Concurso;
}

interface Palpite {
  id: string;
  nome: string;
  whatsapp: string;
  resultado: string;
  jogoId: string;
  jogo: Jogo;
  createdAt?: string;
}

interface UserPalpites {
  nome: string;
  whatsapp: string;
  palpites: { [jogoId: string]: string };
}

export default function AdminPanel() {
  const [concursos, setConcursos] = useState<Concurso[]>([]);
  const [palpites, setPalpites] = useState<Palpite[]>([]);
  const [jogos, setJogos] = useState<Jogo[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [filtros, setFiltros] = useState({
    concursoId: "",
    jogoId: "",
    usuario: "",
    nome: "",
    whatsapp: "",
    status: ""
  });

  const buscarConcursos = async () => {
    try {
      const response = await fetch("/api/admin/concursos");
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }
      const data = await response.json();
      // Garantir que data é um array
      if (Array.isArray(data)) {
        setConcursos(data);
      } else {
        console.error("API retornou dados inválidos:", data);
        setConcursos([]);
      }
    } catch (error) {
      console.error("Erro ao buscar concursos:", error);
      setConcursos([]); // Garantir que concursos seja um array vazio em caso de erro
    }
  };

  const buscarJogos = async (concursoId: string) => {
    try {
      const response = await fetch(`/api/admin/jogos?concursoId=${concursoId}`);
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }
      const data = await response.json();
      if (Array.isArray(data)) {
        setJogos(data);
      } else {
        console.error("API retornou dados inválidos para jogos:", data);
        setJogos([]);
      }
    } catch (error) {
      console.error("Erro ao buscar jogos:", error);
      setJogos([]);
    }
  };

  useEffect(() => {
    buscarConcursos();
  }, []);

  useEffect(() => {
    if (filtros.concursoId) {
      buscarJogos(filtros.concursoId);
    }
  }, [filtros.concursoId]);

  const buscarPalpites = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔍 Buscando palpites com filtros:', filtros);

      const query = new URLSearchParams();
      if (filtros.nome) query.append('nome', filtros.nome);
      if (filtros.whatsapp) query.append('whatsapp', filtros.whatsapp);
      if (filtros.status) query.append('status', filtros.status);
      if (filtros.concursoId) query.append('concursoId', filtros.concursoId);

      const response = await fetch(`/api/admin/palpites?${query.toString()}`);
      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const data = await response.json();
      console.log('📊 Dados recebidos:', data);

      if (data.success) {
        setPalpites(data.palpites);
        setTotal(data.total);
      } else {
        throw new Error(data.error || 'Erro desconhecido');
      }
    } catch (error) {
      console.error('❌ Erro ao buscar palpites:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [filtros]);

  useEffect(() => {
    buscarPalpites();
  }, [filtros, buscarPalpites]);

  const formatResultado = (resultado: string) => {
    switch (resultado) {
      case "1": return "C"; // Casa
      case "X": return "E"; // Empate
      case "2": return "F"; // Fora
      default: return resultado;
    }
  };

  const processarPalpitesPorUsuario = (): UserPalpites[] => {
    // Garantir que palpites seja sempre um array
    const palpitesArray = Array.isArray(palpites) ? palpites : [];
    console.log('Processando palpites:', palpitesArray.length);
    console.log('Jogos disponíveis:', jogos.length);

    if (palpitesArray.length === 0 || jogos.length === 0) {
      return [];
    }

    // Agrupar palpites por usuário
    const usuariosMap = new Map<string, Palpite[]>();

    palpitesArray.forEach(palpite => {
      const chaveUsuario = `${palpite.nome}-${palpite.whatsapp}`;

      if (!usuariosMap.has(chaveUsuario)) {
        usuariosMap.set(chaveUsuario, []);
      }

      usuariosMap.get(chaveUsuario)!.push(palpite);
    });

    // Processar cada usuário para gerar bilhetes individuais
    const bilhetesIndividuais: UserPalpites[] = [];

    usuariosMap.forEach((palpitesUsuario, chaveUsuario) => {
      const [nome, whatsapp] = chaveUsuario.split('-');

      // Ordenar palpites por data de criação
      palpitesUsuario.sort((a, b) => 
        new Date(a.createdAt || '').getTime() - new Date(b.createdAt || '').getTime()
      );

      // Dividir palpites em grupos de 8 (número de jogos por bilhete)
      const totalJogos = jogos.length;
      const totalBilhetes = Math.ceil(palpitesUsuario.length / totalJogos);

      for (let bilheteNum = 0; bilheteNum < totalBilhetes; bilheteNum++) {
        const palpitesBilhete: { [jogoId: string]: string } = {};

        // Pegar os 8 palpites deste bilhete
        for (let jogoIndex = 0; jogoIndex < totalJogos; jogoIndex++) {
          const palpiteIndex = bilheteNum * totalJogos + jogoIndex;
          if (palpiteIndex < palpitesUsuario.length) {
            const palpite = palpitesUsuario[palpiteIndex];
            palpitesBilhete[palpite.jogoId] = formatResultado(palpite.resultado);
          }
        }

        // Só adicionar se o bilhete tem pelo menos alguns palpites
        if (Object.keys(palpitesBilhete).length > 0) {
          bilhetesIndividuais.push({
            nome: totalBilhetes > 1 ? `${nome} (#${bilheteNum + 1})` : nome,
            whatsapp: whatsapp,
            palpites: palpitesBilhete
          });
        }
      }
    });

    const resultado = bilhetesIndividuais.sort((a, b) => a.nome.localeCompare(b.nome));
    console.log('Bilhetes individuais processados:', resultado.length);
    return resultado;
  };

  const exportarParaExcel = () => {
    const usuariosPalpites = processarPalpitesPorUsuario();
    const jogosOrdenados = Array.isArray(jogos) ? [...jogos].sort((a, b) => new Date(a.horario).getTime() - new Date(b.horario).getTime()) : [];

    console.log('Exportando:', usuariosPalpites.length, 'usuários e', jogosOrdenados.length, 'jogos');

    // Criar cabeçalho com BOM para UTF-8
    const headers = ['Nome', 'Telefone'];
    jogosOrdenados.forEach((jogo, index) => {
      headers.push(`Jogo ${index + 1} - ${jogo.mandante} x ${jogo.visitante}`);
    });

    // Criar dados
    const data = usuariosPalpites.map(usuario => {
      const row = [usuario.nome, usuario.whatsapp];
      jogosOrdenados.forEach(jogo => {
        row.push(usuario.palpites[jogo.id] || '-');
      });
      return row;
    });

    // Converter para CSV com BOM UTF-8
    const csvRows = [];
    csvRows.push(headers.join(','));

    data.forEach(row => {
      const escapedRow = row.map(cell => {
        // Escapar aspas duplas e quebras de linha
        const cellStr = String(cell || '');
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      });
      csvRows.push(escapedRow.join(','));
    });

    const csvContent = '\uFEFF' + csvRows.join('\n'); // BOM + conteúdo

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;

    const concursoSelecionado = concursos.find(c => c.id === filtros.concursoId);
    const dataAtual = new Date().toISOString().split('T')[0];
    const nomeArquivo = `palpites_concurso_${concursoSelecionado?.numero || 'todos'}_${dataAtual}.csv`;

    link.download = nomeArquivo;
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Limpar URL
    URL.revokeObjectURL(url);

    console.log('Arquivo exportado:', nomeArquivo);
  };

  const jogosOrdenados = Array.isArray(jogos) ? [...jogos].sort((a, b) => new Date(a.horario).getTime() - new Date(b.horario).getTime()) : [];
  const usuariosPalpites = processarPalpitesPorUsuario();

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
              <h1 className="text-xl font-bold text-gray-900">Admin - Mercado do Bolão</h1>
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
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Navegação</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <Link href="/admin/concursos">
              <div className="group bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border-2 border-blue-200 hover:border-blue-300 rounded-xl p-4 text-center cursor-pointer transition-all duration-300 transform hover:scale-105">
                <div className="w-12 h-12 mx-auto mb-3 bg-blue-600 rounded-full flex items-center justify-center group-hover:bg-blue-700 transition-colors">
                  <span className="text-white text-xl">🏆</span>
                </div>
                <span className="block text-sm font-semibold text-blue-800 group-hover:text-blue-900">
                  Concursos
                </span>
              </div>
            </Link>

            <div className="group bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300 rounded-xl p-4 text-center cursor-default">
              <div className="w-12 h-12 mx-auto mb-3 bg-green-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xl">🎯</span>
              </div>
              <span className="block text-sm font-semibold text-green-800">
                Palpites
              </span>
            </div>

            <Link href="/admin/jogos">
              <div className="group bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 border-2 border-purple-200 hover:border-purple-300 rounded-xl p-4 text-center cursor-pointer transition-all duration-300 transform hover:scale-105">
                <div className="w-12 h-12 mx-auto mb-3 bg-purple-600 rounded-full flex items-center justify-center group-hover:bg-purple-700 transition-colors">
                  <span className="text-white text-xl">⚽</span>
                </div>
                <span className="block text-sm font-semibold text-purple-800 group-hover:text-purple-900">
                  Jogos
                </span>
              </div>
            </Link>

            <Link href="/admin/bilhetes">
              <div className="group bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 border-2 border-green-200 hover:border-green-300 rounded-xl p-4 text-center cursor-pointer transition-all duration-300 transform hover:scale-105">
                <div className="w-12 h-12 mx-auto mb-3 bg-green-600 rounded-full flex items-center justify-center group-hover:bg-green-700 transition-colors">
                  <span className="text-white text-xl">💳</span>
                </div>
                <span className="block text-sm font-semibold text-green-800 group-hover:text-green-900">
                  Bilhetes
                </span>
              </div>
            </Link>

            <Link href="/admin/estatisticas">
              <div className="group bg-gradient-to-br from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 border-2 border-orange-200 hover:border-orange-300 rounded-xl p-4 text-center cursor-pointer transition-all duration-300 transform hover:scale-105">
                <div className="w-12 h-12 mx-auto mb-3 bg-orange-600 rounded-full flex items-center justify-center group-hover:bg-orange-700 transition-colors">
                  <span className="text-white text-xl">📊</span>
                </div>
                <span className="block text-sm font-semibold text-orange-800 group-hover:text-orange-900">
                  Estatísticas
                </span>
              </div>
            </Link>

            <Link href="/ranking/geral">
              <div className="group bg-gradient-to-br from-teal-50 to-teal-100 hover:from-teal-100 hover:to-teal-200 border-2 border-teal-200 hover:border-teal-300 rounded-xl p-4 text-center cursor-pointer transition-all duration-300 transform hover:scale-105">
                <div className="w-12 h-12 mx-auto mb-3 bg-teal-600 rounded-full flex items-center justify-center group-hover:bg-teal-700 transition-colors">
                  <span className="text-white text-xl">🏅</span>
                </div>
                <span className="block text-sm font-semibold text-teal-800 group-hover:text-teal-900">
                  Ranking
                </span>
              </div>
            </Link>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Filtros</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Concurso
              </label>
              <select
                value={filtros.concursoId}
                onChange={(e) => setFiltros({ ...filtros, concursoId: e.target.value, jogoId: "" })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos os concursos</option>
                {concursos.map((concurso) => (
                  <option key={concurso.id} value={concurso.id}>
                    Concurso #{concurso.numero}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jogo Específico
              </label>
              <select
                value={filtros.jogoId}
                onChange={(e) => setFiltros({ ...filtros, jogoId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!filtros.concursoId}
              >
                <option value="">Todos os jogos</option>
                {jogosOrdenados.map((jogo) => (
                  <option key={jogo.id} value={jogo.id}>
                    {jogo.mandante} x {jogo.visitante}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Usuário
              </label>
              <input
                type="text"
                placeholder="Nome ou WhatsApp"
                value={filtros.usuario}
                onChange={(e) => setFiltros({ ...filtros, usuario: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Carregando palpites...</p>
          </div>
        )}

        {/* Botão de Exportar Excel */}
        {!loading && filtros.concursoId && usuariosPalpites.length > 0 && (
          <div className="mb-6">
            <button
              onClick={exportarParaExcel}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors"
            >
              📊 Exportar para Excel
            </button>
          </div>
        )}

        {/* Tabela de Palpites por Usuário */}
        {!loading && filtros.concursoId && (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Lista de Apostas ({usuariosPalpites.length} bilhetes)
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                <strong>Legenda:</strong> C = Casa (Mandante) | E = Empate | F = Fora (Visitante) | Cada linha = 1 bilhete de R$ 10,00
              </p>
            </div>
            <div className="overflow-x-auto border-2 border-black rounded-lg shadow-lg">
              <table className="w-full text-sm border-collapse border-2 border-black bg-white">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left font-bold text-gray-900 border border-black bg-gray-100">
                      <div className="flex items-center space-x-2">
                        <span className="text-blue-600">#</span>
                        <span>Nome</span>
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left font-bold text-gray-900 border border-black bg-gray-100">
                      <div className="flex items-center space-x-1">
                        <span>📱</span>
                        <span>Telefone</span>
                      </div>
                    </th>
                    {jogosOrdenados.map((jogo, index) => (
                      <th key={jogo.id} className={`px-2 py-3 text-center font-bold text-gray-900 border border-black min-w-[85px] bg-gray-100 ${index > 0 ? 'border-l-4 border-l-gray-800' : ''}`}>
                        <div className="text-xs leading-tight flex flex-col items-center justify-center space-y-1">
                          <div className="font-bold text-blue-700 text-[11px]">Jogo {index + 1}</div>
                          <div className="font-semibold text-gray-700 text-[10px]">
                            {jogo.mandante.substring(0, 3)} x {jogo.visitante.substring(0, 3)}
                          </div>
                          <div className="text-[10px] text-gray-600 font-medium">
                            {new Date(jogo.horario).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                          </div>

                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {usuariosPalpites.map((usuario, userIndex) => (
                    <tr 
                      key={`${usuario.nome}-${usuario.whatsapp}`} 
                      className={`transition-colors hover:bg-blue-50 ${
                        userIndex % 2 === 0 
                          ? "bg-white" 
                          : "bg-gray-50 hover:bg-blue-50"
                      }`}
                    >
                      <td className="px-4 py-4 font-medium text-gray-900 border border-black bg-gray-50">
                        <div className="flex items-center space-x-2">
                          <span className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold">
                            {userIndex + 1}
                          </span>
                          <span className="font-semibold">{usuario.nome}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-gray-700 border border-black bg-gray-50 font-mono text-sm font-semibold">
                        {usuario.whatsapp}
                      </td>
                      {jogosOrdenados.map((jogo, index) => (
                        <td key={jogo.id} className={`px-3 py-4 text-center border border-black bg-white ${index > 0 ? 'border-l-4 border-l-gray-800' : ''}`}>
                          <div className="flex flex-col items-center justify-center">
                            <span className={`inline-block w-10 h-10 rounded-lg text-white font-bold text-lg leading-10 shadow-md ${
                              usuario.palpites[jogo.id] === "C" ? "bg-blue-600 hover:bg-blue-700" :
                              usuario.palpites[jogo.id] === "E" ? "bg-gray-600 hover:bg-gray-700" :
                              usuario.palpites[jogo.id] === "F" ? "bg-red-600 hover:bg-red-700" :
                              "bg-gray-300 text-gray-700"
                            } transition-colors border border-gray-400`}>
                              {usuario.palpites[jogo.id] || "-"}
                            </span>
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Mensagem quando nenhum concurso está selecionado */}
        {!loading && !filtros.concursoId && (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">🎯</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Selecione um concurso</h3>
            <p className="text-gray-600">
              Escolha um concurso nos filtros acima para visualizar os palpites dos usuários.
            </p>
          </div>
        )}

        {/* Estado vazio para concurso selecionado sem palpites */}
        {!loading && filtros.concursoId && usuariosPalpites.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum palpite encontrado</h3>
            <p className="text-gray-600">
              Ainda não há palpites registrados para este concurso.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}