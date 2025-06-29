import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Concurso } from '../../types';

export default function ConcursosPage() {
  const [concursos, setConcursos] = useState<Concurso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConcursos = async () => {
      try {
        const response = await fetch('/api/concursos');
        const data = await response.json();
        if (data.success) {
          setConcursos(data.concursos);
        } else {
          setError(data.error || 'Erro ao carregar concursos');
        }
      } catch (err) {
        const error = err as ErrorWithMessage;
        setError(error.message || 'Erro ao carregar concursos');
      } finally {
        setLoading(false);
      }
    };

    fetchConcursos();
  }, []);

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (error) {
    return <div>Erro: {error}</div>;
  }

  return (
    <main className="p-4 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Concursos Disponíveis</h1>

      {concursos.length === 0 ? (
        <p>Nenhum concurso disponível no momento.</p>
      ) : (
        <ul className="space-y-4">
          {concursos.map((concurso) => (
            <li key={concurso.id} className="border p-4 rounded">
              <p className="font-semibold">Concurso #{concurso.numero}</p>
              <p>Início: {new Date(concurso.dataInicio).toLocaleString()}</p>
              <Link
                href={`/concurso/${concurso.id}`}
                className="text-blue-600 hover:text-blue-800"
              >
                Ver detalhes
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
