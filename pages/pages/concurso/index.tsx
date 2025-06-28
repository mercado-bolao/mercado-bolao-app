
import { useEffect, useState } from "react";
import Link from "next/link";

export default function ConcursosPage() {
  const [concursos, setConcursos] = useState([]);

  useEffect(() => {
    fetch("/api/concursos")
      .then((res) => res.json())
      .then((data) => setConcursos(data));
  }, []);

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
                className="inline-block mt-2 px-4 py-2 bg-green-600 text-white rounded"
              >
                Fazer Palpite
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
