import { useState, useEffect } from "react";
import Link from "next/link";

interface Concurso {
  id: string;
  nome?: string;
  numero: number;
  status: string;
  dataInicio: string;
  dataFim: string;
  premioEstimado?: number;
  fechamentoPalpites?: string;
  _count?: {
    jogos: number;
    palpites: number;
    bilhetes: number;
  };
}

interface Jogo {
  id: string;
  mandante: string;
  visitante: string;
  horario: string;
  resultado: string | null;
  fotoMandante?: string;
  fotoVisitante?: string;
  tempGolsCasa?: string;
  tempGolsVisitante?: string;
}

export default function AdminConcursos() {
  const [concursos, setConcursos] = useState<Concurso[]>([]);
  const [jogos, setJogos] = useState<Jogo[] | { error: string }>([]);
  const [selectedConcurso, setSelectedConcurso] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [loadingJogos, setLoadingJogos] = useState(false);
  const [loadingFinalizar, setLoadingFinalizar] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [editingConcurso, setEditingConcurso] = useState<Concurso | null>(null);
  const [editingJogo, setEditingJogo] = useState<Jogo | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    numero: '',
    dataInicio: '',
    dataFim: '',
    status: 'ativo',
    premioEstimado: '',
    fechamentoPalpites: ''
  });
  const [resultData, setResultData] = useState({
    golsCasa: '',
    golsVisitante: ''
  });
  const [showEditJogoModal, setShowEditJogoModal] = useState(false);
  const [editJogoData, setEditJogoData] = useState({
    mandante: '',
    visitante: '',
    horario: '',
    fotoMandante: '',
    fotoVisitante: ''
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedConcursosToDelete, setSelectedConcursosToDelete] = useState<string[]>([]);

  useEffect(() => {
    buscarConcursos();
  }, []);

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
    } finally {
      setLoading(false);
    }
  };

  const abrirModal = (concurso?: Concurso) => {
    if (concurso) {
      setEditingConcurso(concurso);
      setFormData({
        nome: concurso.nome || '',
        numero: concurso.numero.toString(),
        dataInicio: new Date(concurso.dataInicio).toISOString().slice(0, 16),
        dataFim: new Date(concurso.dataFim).toISOString().slice(0, 16),
        status: concurso.status,
        premioEstimado: concurso.premioEstimado?.toString() || '',
        fechamentoPalpites: concurso.fechamentoPalpites ? new Date(concurso.fechamentoPalpites).toISOString().slice(0, 16) : ''
      });
    } else {
      setEditingConcurso(null);
      setFormData({
        nome: '',
        numero: '',
        dataInicio: '',
        dataFim: '',
        status: 'ativo',
        premioEstimado: '',
        fechamentoPalpites: ''
      });
    }
    setShowModal(true);
  };

  const fecharModal = () => {
    setShowModal(false);
    setEditingConcurso(null);
    setFormData({
      nome: '',
      numero: '',
      dataInicio: '',
      dataFim: '',
      status: 'ativo',
      premioEstimado: '',
      fechamentoPalpites: ''
    });
  };

  const buscarJogos = async (concursoId: string) => {
    setLoadingJogos(true);
    try {
      console.log('Buscando jogos para concurso:', concursoId);
      const response = await fetch(`/api/admin/jogos?concursoId=${concursoId}`);
      const data = await response.json();
      console.log('Jogos encontrados:', data);
      // Garantir que sempre seja um array
      if (Array.isArray(data)) {
        setJogos(data);
      } else {
        console.error('API retornou erro:', data);
        setJogos({ error: data.error || 'Erro desconhecido. Verifique a conexão com o banco de dados.' });
        if (data.error) {
          alert(`Erro ao carregar jogos: ${data.error}`);
        }
      }
    } catch (error) {
      console.error("Erro ao buscar jogos:", error);
      setJogos({ error: 'Erro ao carregar jogos. Verifique o console para mais detalhes.' });
      alert('Erro ao carregar jogos. Verifique o console para mais detalhes.');
    } finally {
      setLoadingJogos(false);
    }
  };

  const handleConcursoChange = (concursoId: string) => {
    setSelectedConcurso(concursoId);
    if (concursoId) {
      buscarJogos(concursoId);
    } else {
      setJogos([]);
    }
  };

  const abrirModalResultado = (jogo: Jogo) => {
    setEditingJogo(jogo);
    setResultData({
      golsCasa: '',
      golsVisitante: ''
    });
    setShowResultModal(true);
  };

  const abrirModalEditJogo = (jogo: Jogo) => {
    setEditingJogo(jogo);

    // Converter UTC para horário brasileiro (UTC-3)
    const horarioUTC = new Date(jogo.horario);
    const horarioBrasil = new Date(horarioUTC.getTime() - (3 * 60 * 60 * 1000)); // Subtrair 3 horas para converter UTC para BRT

    // Formatar para datetime-local (YYYY-MM-DDTHH:MM)
    const year = horarioBrasil.getFullYear();
    const month = String(horarioBrasil.getMonth() + 1).padStart(2, '0');
    const day = String(horarioBrasil.getDate()).padStart(2, '0');
    const hours = String(horarioBrasil.getHours()).padStart(2, '0');
    const minutes = String(horarioBrasil.getMinutes()).padStart(2, '0');

    const horarioFormatado = `${year}-${month}-${day}T${hours}:${minutes}`;

    setEditJogoData({
      mandante: jogo.mandante,
      visitante: jogo.visitante,
      horario: horarioFormatado,
      fotoMandante: jogo.fotoMandante || '',
      fotoVisitante: jogo.fotoVisitante || ''
    });
    setShowEditJogoModal(true);
  };

  const salvarEdicaoJogo = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingJogo) return;

    try {
      const response = await fetch('/api/admin/jogos', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingJogo.id,
          mandante: editJogoData.mandante,
          visitante: editJogoData.visitante,
          horario: editJogoData.horario,
          fotoMandante: editJogoData.fotoMandante || null,
          fotoVisitante: editJogoData.fotoVisitante || null
        })
      });

      if (response.ok) {
        alert('✅ Jogo editado com sucesso!');
        setShowEditJogoModal(false);
        if (selectedConcurso) {
          await buscarJogos(selectedConcurso);
        }
      } else {
        const error = await response.json();
        alert(`❌ Erro ao editar jogo: ${error.error}`);
      }
    } catch (error) {
      console.error('Erro ao editar jogo:', error);
      alert('❌ Erro ao editar jogo');
    }
  };

  const limparResultado = async (jogoId: string) => {
    if (!confirm('🧹 Tem certeza que deseja limpar o resultado deste jogo? Ele ficará pendente novamente.')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/limpar-resultado', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jogoId }),
      });

      if (response.ok) {
        alert('✅ Resultado limpo com sucesso! O jogo está pendente novamente.');
        if (selectedConcurso) {
          await buscarJogos(selectedConcurso);
        }
      } else {
        const error = await response.json();
        alert(`❌ Erro ao limpar resultado: ${error.error}`);
      }
    } catch (error) {
      console.error('Erro ao limpar resultado:', error);
      alert('❌ Erro ao limpar resultado');
    }
  };

  const excluirJogo = async (jogoId: string) => {
    if (!confirm('⚠️ Tem certeza que deseja excluir este jogo? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/delete-jogo', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: jogoId })
      });

      if (response.ok) {
        alert('✅ Jogo excluído com sucesso!');
        if (selectedConcurso) {
          await buscarJogos(selectedConcurso);
        }
      } else {
        const error = await response.json();
        alert(`❌ Erro ao excluir jogo: ${error.error}`);
      }
    } catch (error) {
      console.error('Erro ao excluir jogo:', error);
      alert('❌ Erro ao excluir jogo');
    }
  };

  const fecharModalResultado = () => {
    setShowResultModal(false);
    setEditingJogo(null);
    setResultData({ golsCasa: '', golsVisitante: '' });
  };

  const salvarResultado = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingFinalizar(true);

    console.log('🎯 Iniciando salvarResultado...');
    console.log('🎯 Estado atual:', {
      editingJogo: editingJogo,
      resultData: resultData,
      selectedConcurso: selectedConcurso
    });

    if (!editingJogo) {
      console.error('❌ Jogo não selecionado');
      alert('❌ Erro: Jogo não selecionado');
      return;
    }

    if (!resultData.golsCasa || !resultData.golsVisitante) {
      console.error('❌ Placar não preenchido');
      alert('⚠️ Por favor, preencha o placar completo (gols da casa e visitante)');
      return;
    }

    const golsCasa = parseInt(resultData.golsCasa);
    const golsVisitante = parseInt(resultData.golsVisitante);

    if (isNaN(golsCasa) || isNaN(golsVisitante) || golsCasa < 0 || golsVisitante < 0) {
      alert('⚠️ Por favor, insira números válidos para os gols (0 ou maior)');
      return;
    }

    // Calcular resultado baseado na diferença de gols
    let tipoResultado: string;
    const diferenca = golsCasa - golsVisitante;

    if (diferenca === 0) {
      tipoResultado = 'Empate';
    } else if (diferenca > 0) {
      tipoResultado = 'Casa venceu';
    } else {
      tipoResultado = 'Fora venceu';
    }

    const placar = `${golsCasa}x${golsVisitante}`;

    if (!confirm(`🤔 Confirma o placar ${placar} (${tipoResultado}) para o jogo ${editingJogo.mandante} vs ${editingJogo.visitante}?`)) {
      return;
    }

    try {
      console.log('📤 Enviando dados:', {
        id: editingJogo.id,
        resultado: placar
      });

      const requestBody = {
        id: editingJogo.id,
        resultado: placar
      };

      console.log('📦 Request body:', JSON.stringify(requestBody));

      console.log('🚀 Fazendo requisição para API...');

      const response = await fetch('/api/admin/jogos', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      console.log('📨 Resposta recebida:', response);
      console.log('📨 Response status:', response.status);

      let responseData;
      try {
        responseData = await response.json();
        console.log('📨 Response data:', responseData);
      } catch (parseError) {
        console.error('❌ Erro ao fazer parse da resposta:', parseError);
        const responseText = await response.text();
        console.error('❌ Response text:', responseText);
        throw new Error('Resposta inválida do servidor');
      }

      if (!response.ok) {
        console.error('❌ Response não OK:', responseData);
        throw new Error(responseData.error || `Erro HTTP: ${response.status}`);
      }

      console.log('✅ Resultado salvo com sucesso!');
      alert(`✅ Placar ${placar} salvo com sucesso! O jogo foi finalizado.`);

      // Recarregar os jogos para mostrar o resultado atualizado
      if (selectedConcurso) {
        console.log('🔄 Recarregando jogos...');
        await buscarJogos(selectedConcurso);
      }

      // Fechar modal apenas após sucesso
      fecharModalResultado();

    } catch (error) {
      console.error('❌ Erro completo ao salvar resultado:', error);

      let mensagemErro = 'Erro desconhecido';
      if (error.name === 'AbortError') {
        mensagemErro = 'Timeout - A requisição demorou muito para responder';
      } else if (error.message) {
        mensagemErro = error.message;
      }

      alert(`❌ Erro ao salvar resultado: ${mensagemErro}`);
    } finally {
      setLoadingFinalizar(false);
    }
  };

  const salvarConcurso = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = "/api/admin/concursos";
      const method = editingConcurso ? "PUT" : "POST";
      const body = editingConcurso 
        ? { ...formData, id: editingConcurso.id }
        : formData;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        await buscarConcursos();
        fecharModal();
        alert(editingConcurso ? 'Concurso atualizado com sucesso!' : 'Concurso criado com sucesso!');
      } else {
        alert('Erro ao salvar concurso');
      }
    } catch (error) {
      console.error('Erro ao salvar concurso:', error);
      alert('Erro ao salvar concurso');
    }
  };

  const handleDeleteConcurso = async (id: string) => {
    if (!confirm("Tem certeza que deseja deletar este concurso?")) {
      return;
    }

    try {
      const response = await fetch(`/api/deleteconcursos`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ concursoIds: [id] }),
      });

      if (response.ok) {
        setConcursos(concursos.filter((c) => c.id !== id));
        alert("Concurso deletado com sucesso!");
      } else {
        alert("Erro ao deletar concurso");
      }
    } catch (error) {
      console.error("Erro ao deletar concurso:", error);
      alert("Erro ao deletar concurso");
    }
  };

  const abrirModalDelete = () => {
    setSelectedConcursosToDelete([]);
    setShowDeleteModal(true);
  };

  const handleSelectConcurso = (concursoId: string) => {
    setSelectedConcursosToDelete(prev => {
      if (prev.includes(concursoId)) {
        return prev.filter(id => id !== concursoId);
      } else {
        return [...prev, concursoId];
      }
    });
  };

  const handleDeleteSelectedConcursos = async () => {
    if (selectedConcursosToDelete.length === 0) {
      alert("Selecione pelo menos um concurso para deletar");
      return;
    }

    const concursosParaDeletar = concursos.filter(c => selectedConcursosToDelete.includes(c.id));
    const nomes = concursosParaDeletar.map(c => `${c.nome || `Concurso #${c.numero}`}`).join(', ');

    if (!confirm(`Tem certeza que deseja deletar os seguintes concursos?\n\n${nomes}`)) {
      return;
    }

    try {
      const response = await fetch(`/api/deleteconcursos`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          concursoIds: selectedConcursosToDelete 
        }),
      });

      if (response.ok) {
        setConcursos(concursos.filter((c) => !selectedConcursosToDelete.includes(c.id)));
        setShowDeleteModal(false);
        setSelectedConcursosToDelete([]);
        alert(`${concursosParaDeletar.length} concurso(s) deletado(s) com sucesso!`);
      } else {
        alert("Erro ao deletar concursos");
      }
    } catch (error) {
      console.error("Erro ao deletar concursos:", error);
      alert("Erro ao deletar concursos");
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
            <div className="group bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 rounded-xl p-4 text-center cursor-default">
              <div className="w-12 h-12 mx-auto mb-3 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">⚽</span>
              </div>
              <span className="block text-sm font-semibold text-blue-800">
                Concursos
              </span>
            </div>

            <Link href="/admin">
              <div className="group bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 border-2 border-green-200 hover:border-green-300 rounded-xl p-4 text-center cursor-pointer transition-all duration-300 transform hover:scale-105">
                <div className="w-12 h-12 mx-auto mb-3 bg-green-600 rounded-full flex items-center justify-center group-hover:bg-green-700 transition-colors">
                  <span className="text-white text-xl">🎯</span>
                </div>
                <span className="block text-sm font-semibold text-green-800 group-hover:text-green-900">
                  Palpites
                </span>
              </div>
            </Link>

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

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm border mb-8">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">
              Concursos ({concursos.length})
            </h2>
            <div className="flex space-x-3">
              <button
                onClick={abrirModalDelete}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                🗑️ Deletar Concursos
              </button>
              <button
                onClick={() => abrirModal()}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700"
              >
                + Novo Concurso
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Carregando concursos...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nome
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Número
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data Início
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data Fim
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prêmio Estimado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fechamento Apostas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Jogos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bilhetes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Palpites
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {concursos.map((concurso) => (
                    <tr key={concurso.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {concurso.nome || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{concurso.numero}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          concurso.status === 'ativo' 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {concurso.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(concurso.dataInicio).toLocaleDateString('pt-BR', {
                          timeZone: "America/Sao_Paulo"
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(concurso.dataFim).toLocaleDateString('pt-BR', {
                          timeZone: "America/Sao_Paulo"
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {concurso.premioEstimado ? `R$ ${concurso.premioEstimado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {concurso.fechamentoPalpites ? (
                          <div>
                            <div>{new Date(concurso.fechamentoPalpites).toLocaleDateString('pt-BR', {
                              timeZone: "America/Sao_Paulo"
                            })}</div>
                            <div className="text-xs text-gray-500">
                              {new Date(concurso.fechamentoPalpites).toLocaleTimeString('pt-BR', { 
                                hour: '2-digit', 
                                minute: '2-digit',
                                timeZone: "America/Sao_Paulo"
                              })}
                            </div>
                          </div>
                        ) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {concurso._count?.jogos || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {concurso._count?.bilhetes || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {concurso._count?.palpites || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => abrirModal(concurso)}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Editar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Gerenciamento de Jogos */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Gerenciar Jogos e Resultados
            </h2>
            <div className="flex items-center space-x-4">
              <label className="block text-sm font-medium text-gray-700">
                Selecione um Concurso:
              </label>
              <select
                value={selectedConcurso}
                onChange={(e) => handleConcursoChange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecione um concurso</option>
                {concursos.map((concurso) => (
                  <option key={concurso.id} value={concurso.id}>
                    Concurso #{concurso.numero} - {concurso.status}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedConcurso && (
            <div className="p-6">
              {loadingJogos ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-600">Carregando jogos...</p>
                </div>
              ) : !Array.isArray(jogos) ? (
                <div className="text-center py-8">
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    <p className="font-bold">Erro ao carregar jogos.</p>
                    <p className="text-sm">
                      {(jogos as { error: string }).error || 'Erro desconhecido. Verifique a conexão com o banco de dados.'}
                    </p>
                  </div>
                </div>
              ) : jogos.length === 0 ? (
                <div className="text-center py-8">
                  <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
                    <p className="font-bold">Nenhum jogo encontrado para este concurso.</p>
                    <p className="text-sm">Certifique-se de que existem jogos cadastrados para este concurso.</p>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Jogo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Horário
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Resultado
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {jogos.map((jogo) => (
                        <tr key={jogo.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-3">
                              {jogo.fotoMandante && (
                                <img src={jogo.fotoMandante} alt={jogo.mandante} className="w-8 h-8 rounded-full object-cover" />
                              )}
                              <span className="text-sm font-medium text-gray-900">
                                {jogo.mandante} vs {jogo.visitante}
                              </span>
                              {jogo.fotoVisitante && (
                                <img src={jogo.fotoVisitante} alt={jogo.visitante} className="w-8 h-8 rounded-full object-cover" />
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(jogo.horario).toLocaleString('pt-BR', {
                              timeZone: "America/Sao_Paulo",
                              day: '2-digit',
                              month: '2-digit', 
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {jogo.resultado ? (
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                {jogo.resultado.includes('x') ? jogo.resultado : 
                                 (jogo.resultado === 'C' ? 'Casa' : jogo.resultado === 'E' ? 'Empate' : 'Fora')}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              jogo.resultado 
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {jogo.resultado ? 'Finalizado' : 'Pendente'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => abrirModalEditJogo(jogo)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg font-medium transition-colors"
                                title="Editar jogo"
                              >
                                ✏️ Editar
                              </button>
                              <button
                                onClick={() => abrirModalResultado(jogo)}
                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg font-medium transition-colors"
                                title="Definir resultado"
                              >
                                📊 Resultado
                              </button>
                               <button
                                onClick={() => limparResultado(jogo.id)}
                                className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-2 rounded-lg font-medium transition-colors"
                                title="Limpar resultado"
                              >
                                🧹 Limpar
                              </button>
                              <button
                                onClick={() => excluirJogo(jogo.id)}
                                className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg font-medium transition-colors"
                                title="Excluir jogo"
                              >
                                🗑️ Excluir
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {editingConcurso ? 'Editar Concurso' : 'Novo Concurso'}
            </h3>

            <form onSubmit={salvarConcurso}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do Concurso
                </label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({...formData, nome: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 bg-white"
                  placeholder="Ex: Copa do Mundo 2024"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número do Concurso
                </label>
                <input
                  type="number"
                  value={formData.numero}
                  onChange={(e) => setFormData({...formData, numero: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 bg-white"
                  placeholder="Ex: 1"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data de Início
                </label>
                <input
                  type="datetime-local"
                  value={formData.dataInicio}
                  onChange={(e) => setFormData({...formData, dataInicio: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 bg-white"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data de Fim
                </label>
                <input
                  type="datetime-local"
                  value={formData.dataFim}
                  onChange={(e) => setFormData({...formData, dataFim: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 bg-white"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prêmio Estimado (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.premioEstimado}
                  onChange={(e) => setFormData({...formData, premioEstimado: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 bg-white"
                  placeholder="Ex: 10000.00"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fechamento de Apostas
                </label>
                <input
                  type="datetime-local"
                  value={formData.fechamentoPalpites}
                  onChange={(e) => setFormData({...formData, fechamentoPalpites: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 bg-white"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Após este horário, novos palpites serão bloqueados
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 bg-white"
                >
                  <option value="ativo">Ativo</option>
                  <option value="encerrado">Encerrado</option>
                  <option value="aguardando">Aguardando</option>
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={fecharModal}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingConcurso ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Edição de Jogo */}
      {showEditJogoModal && editingJogo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800">✏️ Editar Jogo</h3>
              <button
                onClick={() => setShowEditJogoModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={salvarEdicaoJogo} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Time Mandante */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time Mandante *
                  </label>
                  <input
                    type="text"
                    value={editJogoData.mandante}
                    onChange={(e) => setEditJogoData({...editJogoData, mandante: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                    required
                  />
                </div>

                {/* Time Visitante */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time Visitante *
                  </label>
                  <input
                    type="text"
                    value={editJogoData.visitante}
                    onChange={(e) => setEditJogoData({...editJogoData, visitante: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                    required
                  />
                </div>
              </div>

              {/* Data e Horário */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data e Horário *
                </label>
                <input
                  type="datetime-local"
                  value={editJogoData.horario}
                  onChange={(e) => setEditJogoData({...editJogoData, horario: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Foto Mandante */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Foto do Mandante
                  </label>

                  {/* Upload de arquivo */}
                  <div className="mb-3">
                    <label className="block text-xs text-gray-600 mb-1">Upload de Arquivo:</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          const file = e.target.files[0];
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            setEditJogoData({...editJogoData, fotoMandante: event.target?.result as string});
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 bg-white"
                    />
                  </div>

                  {/* URL manual */}
                  <div className="mb-3">
                    <label className="block text-xs text-gray-600 mb-1">Ou insira URL:</label>
                    <input
                      type="url"
                      value={typeof editJogoData.fotoMandante === 'string' && editJogoData.fotoMandante.startsWith('http') ? editJogoData.fotoMandante : ''}
                      onChange={(e) => setEditJogoData({...editJogoData, fotoMandante: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 bg-white"
                      placeholder="https://exemplo.com/foto.png"
                    />
                  </div>

                  {/* Preview */}
                  {editJogoData.fotoMandante && (
                    <div className="mt-2">
                      <img src={editJogoData.fotoMandante} alt="Preview Mandante" className="w-16 h-16 rounded-full object-cover border-2 border-gray-300" />
                    </div>
                  )}
                </div>

                {/* Foto Visitante */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Foto do Visitante
                  </label>

                  {/* Upload de arquivo */}
                  <div className="mb-3">
                    <label className="block text-xs text-gray-600 mb-1">Upload de Arquivo:</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          const file = e.target.files[0];
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            setEditJogoData({...editJogoData, fotoVisitante: event.target?.result as string});
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 bg-white"
                    />
                  </div>

                  {/* URL manual */}
                  <div className="mb-3">
                    <label className="block text-xs text-gray-600 mb-1">Ou insira URL:</label>
                    <input
                      type="url"
                      value={typeof editJogoData.fotoVisitante === 'string' && editJogoData.fotoVisitante.startsWith('http') ? editJogoData.fotoVisitante : ''}
                      onChange={(e) => setEditJogoData({...editJogoData, fotoVisitante: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 bg-white"
                      placeholder="https://exemplo.com/foto.png"
                    />
                  </div>

                  {/* Preview */}
                  {editJogoData.fotoVisitante && (
                    <div className="mt-2">
                      <img src={editJogoData.fotoVisitante} alt="Preview Visitante" className="w-16 h-16 rounded-full object-cover border-2 border-gray-300" />
                    </div>
                  )}
                </div>
              </div>

              {/* Botões */}
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  💾 Salvar Alterações
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditJogoModal(false)}
                  className="flex-1 bg-gray-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-gray-700 transition-colors"
                >
                  ❌ Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Resultado */}
      {showResultModal && editingJogo && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border-4 border-blue-300">
            {/* Header do Modal */}
            <div className="text-center mb-6 border-b border-gray-200 pb-4">
              <h3 className="text-3xl font-black text-gray-800 mb-2">
                🏁 FINALIZAR JOGO
              </h3>
              <p className="text-lg text-gray-600 font-semibold">Selecione o resultado final</p>
            </div>

            {/* Informações do Jogo */}
            <div className="mb-8">
              <div className="flex items-center justify-center space-x-6 mb-4 p-6 bg-gradient-to-r from-blue-100 to-purple-100 rounded-2xl border-2 border-blue-300">
                <div className="flex flex-col items-center space-y-2">
                  {editingJogo.fotoMandante && (
                    <img src={editingJogo.fotoMandante} alt={editingJogo.mandante} className="w-16 h-16 rounded-full object-cover border-4 border-blue-400 shadow-lg" />
                  )}
                  <span className="font-black text-blue-900 text-lg text-center">{editingJogo.mandante}</span>
                </div>
                <div className="px-4 py-2 bg-white rounded-2xl border-4 border-blue-400 shadow-lg">
                  <span className="text-2xl font-black text-blue-600">VS</span>
                </div>
                <div className="flex flex-col items-center space-y-2">
                  <span className="font-black text-blue-900 text-lg text-center">{editingJogo.visitante}</span>
                  {editingJogo.fotoVisitante && (
                    <img src={editingJogo.fotoVisitante} alt={editingJogo.visitante} className="w-16 h-16 rounded-full object-cover border-4 border-blue-400 shadow-lg" />
                  )}
                </div>
              </div>

              <div className="text-center text-lg text-gray-600 font-semibold bg-gray-100 p-3 rounded-xl">
                ⏰ {new Date(editingJogo.horario).toLocaleString('pt-BR')}
              </div>
            </div>

            {/* Formulário */}
            <form onSubmit={salvarResultado} className="space-y-6">
              <div>
                <h4 className="text-2xl font-black text-center text-gray-800 mb-6 bg-yellow-100 p-3 rounded-xl border-2 border-yellow-300">
                  ⚽ DIGITE O PLACAR FINAL:
                </h4>

                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-8 rounded-2xl border-4 border-blue-300 mb-6">
                  <div className="flex items-center justify-center space-x-8">
                    {/* Casa */}
                    <div className="text-center">
                      <div className="flex flex-col items-center space-y-4">
                        {editingJogo.fotoMandante && (
                          <img src={editingJogo.fotoMandante} alt={editingJogo.mandante} className="w-16 h-16 rounded-full object-cover border-4 border-blue-400 shadow-lg" />
                        )}
                        <span className="font-black text-xl text-blue-900">{editingJogo.mandante}</span>
                        <span className="text-2xl font-black text-blue-800 mb-2">GOLS:</span>
                        <input
                          type="number"
                          min="0"
                          value={resultData.golsCasa}
                          onChange={(e) => setResultData({...resultData, golsCasa: e.target.value})}
                          className="w-20 h-16 text-center text-3xl font-black border-4 border-blue-400 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-200 bg-white shadow-lg"
                          placeholder="0"
                        />
                      </div>
                    </div>

                    {/* VS */}
                    <div className="px-6 py-4 bg-white rounded-2xl border-4 border-yellow-400 shadow-lg">
                      <span className="text-4xl font-black text-yellow-600">X</span>
                    </div>

                    {/* Fora */}
                    <div className="text-center">
                      <div className="flex flex-col items-center space-y-4">
                        {editingJogo.fotoVisitante && (
                          <img src={editingJogo.fotoVisitante} alt={editingJogo.visitante} className="w-16 h-16 rounded-full object-cover border-4 border-purple-400 shadow-lg" />
                        )}
                        <span className="font-black text-xl text-purple-900">{editingJogo.visitante}</span>
                        <span className="text-2xl font-black text-purple-800 mb-2">GOLS:</span>
                        <input
                          type="number"
                          min="0"
                          value={resultData.golsVisitante}
                          onChange={(e) => setResultData({...resultData, golsVisitante: e.target.value})}
                          className="w-20 h-16 text-center text-3xl font-black border-4 border-purple-400 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-200 bg-white shadow-lg"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Preview do resultado */}
                  {resultData.golsCasa !== '' && resultData.golsVisitante !== '' && (
                    <div className="mt-8 text-center">
                      <div className="bg-white p-6 rounded-2xl border-4 border-green-400 shadow-lg">
                        <div className="text-4xl font-black text-green-800 mb-4">
                          {resultData.golsCasa} X {resultData.golsVisitante}
                        </div>
                        <div className="text-2xl font-bold">
                          {(() => {
                            const golsCasa = parseInt(resultData.golsCasa);
                            const golsVisitante = parseInt(resultData.golsVisitante);
                            const diferenca = golsCasa - golsVisitante;

                            if (isNaN(golsCasa) || isNaN(golsVisitante)) return '';

                            if (diferenca === 0) {
                              return <span className="text-yellow-600">⚖️ EMPATE</span>;
                            } else if (diferenca > 0) {
                              return <span className="text-green-600">🏠 {editingJogo.mandante} VENCEU</span>;
                            } else {
                              return <span className="text-blue-600">✈️ {editingJogo.visitante} VENCEU</span>;
                            }
                          })()}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Estado de preenchimento */}
              <div className={`text-center p-4 rounded-xl border-2 ${
                resultData.golsCasa !== '' && resultData.golsVisitante !== '' 
                  ? 'bg-green-50 border-green-300' 
                  : 'bg-red-50 border-red-300'
              }`}>
                <p className={`text-lg font-bold ${
                  resultData.golsCasa !== '' && resultData.golsVisitante !== '' ? 'text-green-700' : 'text-red-700'
                }`}>
                  {resultData.golsCasa !== '' && resultData.golsVisitante !== '' ? (
                    '✅ Placar preenchido - Pronto para finalizar!'
                  ) : (
                    '⚠️ Digite os gols de ambos os times para continuar'
                  )}
                </p>
              </div>

              {/* Botões */}
              <div className="flex gap-6 pt-4">
                <button
                  type="button"
                  onClick={fecharModalResultado}
                  className="flex-1 px-8 py-4 bg-gray-400 text-white rounded-2xl hover:bg-gray-500 font-black text-lg transition-colors shadow-lg"
                >
                  ❌ CANCELAR
                </button>
                <button
                  type="submit"
                  disabled={!resultData.golsCasa || !resultData.golsVisitante || loadingFinalizar}
                  className={`flex-1 px-8 py-4 rounded-2xl font-black text-lg transition-all shadow-lg transform ${
                    resultData.golsCasa && resultData.golsVisitante && !loadingFinalizar
                      ? 'bg-green-600 text-white hover:bg-green-700 hover:scale-105'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {loadingFinalizar ? (
                    '⏳ FINALIZANDO...'
                  ) : resultData.golsCasa && resultData.golsVisitante ? (
                    '✅ CONFIRMAR PLACAR'
                  ) : (
                    '⚠️ PREENCHA O PLACAR'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Seleção para Deletar Concursos */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800">🗑️ Deletar Concursos</h3>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            <p className="text-gray-600 mb-6">
              Selecione os concursos que deseja deletar. Esta ação é irreversível e irá deletar todos os jogos e palpites associados.
            </p>

            <div className="space-y-3 mb-6">
              {concursos.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Nenhum concurso disponível para deletar.</p>
              ) : (
                concursos.map((concurso) => (
                  <div key={concurso.id} className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <input
                      type="checkbox"
                      id={`concurso-${concurso.id}`}
                      checked={selectedConcursosToDelete.includes(concurso.id)}
                      onChange={() => handleSelectConcurso(concurso.id)}
                      className="w-5 h-5 text-red-600 border-2 border-gray-300 rounded focus:ring-red-500"
                    />
                    <label 
                      htmlFor={`concurso-${concurso.id}`}
                      className="flex-1 cursor-pointer"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-semibold text-gray-900">
                            {concurso.nome || `Concurso #${concurso.numero}`}
                          </span>
                          <div className="text-sm text-gray-500">
                            Status: {concurso.status} | Jogos: {concurso._count?.jogos || 0} | Palpites: {concurso._count?.palpites || 0}
                          </div>
                        </div>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          concurso.status === 'ativo' 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          #{concurso.numero}
                        </span>
                      </div>
                    </label>
                  </div>
                ))
              )}
            </div>

            {selectedConcursosToDelete.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-red-800 mb-2">
                  ⚠️ Concursos selecionados para deletar ({selectedConcursosToDelete.length}):
                </h4>
                <ul className="text-sm text-red-700">
                  {concursos
                    .filter(c => selectedConcursosToDelete.includes(c.id))
                    .map(c => (
                      <li key={c.id} className="mb-1">
                        • {c.nome || `Concurso #${c.numero}`} - {c._count?.jogos || 0} jogos, {c._count?.palpites || 0} palpites
                      </li>
                    ))
                  }
                </ul>
              </div>
            )}

            <div className="flex justify-between items-center">
              <button
                onClick={() => {
                  if (concursos.length > 0) {
                    const allSelected = concursos.every(c => selectedConcursosToDelete.includes(c.id));
                    if (allSelected) {
                      setSelectedConcursosToDelete([]);
                    } else {
                      setSelectedConcursosToDelete(concursos.map(c => c.id));
                    }
                  }
                }}
                className="text-blue-600 hover:text-blue-800 font-medium"
                disabled={concursos.length === 0}
              >
                {concursos.length > 0 && concursos.every(c => selectedConcursosToDelete.includes(c.id)) 
                  ? 'Desmarcar Todos' 
                  : 'Selecionar Todos'
                }
              </button>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteSelectedConcursos}
                  disabled={selectedConcursosToDelete.length === 0}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                    selectedConcursosToDelete.length === 0
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  🗑️ Deletar {selectedConcursosToDelete.length > 0 ? `(${selectedConcursosToDelete.length})` : ''}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}