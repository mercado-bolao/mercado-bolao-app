import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { withAdminAuth } from '@/components/withAdminAuth';
import { useAuthenticatedFetch } from '@/hooks/useAuthenticatedFetch';

interface Concurso {
  id: string;
  numero: number;
  dataInicio: string;
  dataFim: string;
  status: string;
}

function AdicionarJogos() {
  const router = useRouter();
  const authenticatedFetch = useAuthenticatedFetch();
  const [concursos, setConcursos] = useState<Concurso[]>([]);
  const [concursoSelecionado, setConcursoSelecionado] = useState('');
  const [mandante, setMandante] = useState('');
  const [visitante, setVisitante] = useState('');
  const [horario, setHorario] = useState('');
  const [fotoMandante, setFotoMandante] = useState<File | null>(null);
  const [fotoVisitante, setFotoVisitante] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConcursos = async () => {
      try {
        const response = await authenticatedFetch('/api/admin/concursos');
        if (!response.ok) {
          throw new Error('Falha ao carregar concursos');
        }
        const data = await response.json();
        if (Array.isArray(data)) {
          setConcursos(data);
        } else {
          throw new Error('Formato de dados inválido');
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Erro ao carregar concursos');
        console.error('Erro ao carregar concursos:', error);
      }
    };

    fetchConcursos();
  }, [authenticatedFetch]);

  const handleFotoMandanteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFotoMandante(e.target.files[0]);
    }
  };

  const handleFotoVisitanteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFotoVisitante(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!concursoSelecionado || !mandante || !visitante || !horario) {
      setError('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('concursoId', concursoSelecionado);
      formData.append('mandante', mandante);
      formData.append('visitante', visitante);
      formData.append('horario', horario);

      if (fotoMandante) {
        formData.append('fotoMandante', fotoMandante);
      }

      if (fotoVisitante) {
        formData.append('fotoVisitante', fotoVisitante);
      }

      const response = await authenticatedFetch('/api/admin/jogos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          concursoId: concursoSelecionado,
          mandante,
          visitante,
          horario,
          fotoMandante: fotoMandante?.name || null,
          fotoVisitante: fotoVisitante?.name || null
        })
      });

      if (response.ok) {
        alert('Jogo adicionado com sucesso!');
        // Limpar formulário
        setMandante('');
        setVisitante('');
        setHorario('');
        setFotoMandante(null);
        setFotoVisitante(null);
        // Reset file inputs
        const fileInputs = document.querySelectorAll('input[type="file"]') as NodeListOf<HTMLInputElement>;
        fileInputs.forEach(input => input.value = '');
      } else {
        const errorData = await response.json();
        setError(`Erro ao adicionar jogo: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Erro:', error);
      setError('Erro ao adicionar jogo. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Adicionar Novo Jogo</h1>
          <p className="text-gray-600">Preencha as informações do jogo para adicionar ao concurso</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Seleção do Concurso */}
          <div>
            <label htmlFor="concurso" className="block text-sm font-medium text-gray-700 mb-2">
              Concurso *
            </label>
            <select
              id="concurso"
              value={concursoSelecionado}
              onChange={(e) => setConcursoSelecionado(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
              required
            >
              <option value="">Selecione um concurso</option>
              {concursos.map((concurso) => (
                <option key={concurso.id} value={concurso.id}>
                  Concurso #{concurso.numero} - {concurso.status}
                </option>
              ))}
            </select>
          </div>

          {/* Time Mandante */}
          <div>
            <label htmlFor="mandante" className="block text-sm font-medium text-gray-700 mb-2">
              Time Mandante *
            </label>
            <input
              type="text"
              id="mandante"
              value={mandante}
              onChange={(e) => setMandante(e.target.value)}
              placeholder="Ex: Palmeiras"
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
              required
            />
          </div>

          {/* Foto do Time Mandante */}
          <div>
            <label htmlFor="fotoMandante" className="block text-sm font-medium text-gray-700 mb-2">
              Foto do Time Mandante
            </label>
            <input
              type="file"
              id="fotoMandante"
              accept="image/*"
              onChange={handleFotoMandanteChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
            />
            {fotoMandante && (
              <p className="mt-2 text-sm text-gray-600">
                Arquivo selecionado: {fotoMandante.name}
              </p>
            )}
          </div>

          {/* Time Visitante */}
          <div>
            <label htmlFor="visitante" className="block text-sm font-medium text-gray-700 mb-2">
              Time Visitante *
            </label>
            <input
              type="text"
              id="visitante"
              value={visitante}
              onChange={(e) => setVisitante(e.target.value)}
              placeholder="Ex: Corinthians"
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
              required
            />
          </div>

          {/* Foto do Time Visitante */}
          <div>
            <label htmlFor="fotoVisitante" className="block text-sm font-medium text-gray-700 mb-2">
              Foto do Time Visitante
            </label>
            <input
              type="file"
              id="fotoVisitante"
              accept="image/*"
              onChange={handleFotoVisitanteChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
            />
            {fotoVisitante && (
              <p className="mt-2 text-sm text-gray-600">
                Arquivo selecionado: {fotoVisitante.name}
              </p>
            )}
          </div>

          {/* Data e Horário */}
          <div>
            <label htmlFor="horario" className="block text-sm font-medium text-gray-700 mb-2">
              Data e Horário do Jogo *
            </label>
            <input
              type="datetime-local"
              id="horario"
              value={horario}
              onChange={(e) => setHorario(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
              required
            />
          </div>

          {/* Botões */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-green-600 text-white py-3 px-6 rounded-md font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Adicionando...' : 'Adicionar Jogo'}
            </button>

            <button
              type="button"
              onClick={() => router.push('/admin')}
              className="flex-1 bg-gray-600 text-white py-3 px-6 rounded-md font-medium hover:bg-gray-700 transition-colors"
            >
              Voltar
            </button>
          </div>
        </form>

        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800">
            <strong>Dica:</strong> Os campos marcados com * são obrigatórios. As fotos dos times são opcionais e ajudam na visualização dos jogos.
          </p>
        </div>
      </div>
    </div>
  );
}

export default withAdminAuth(AdicionarJogos);