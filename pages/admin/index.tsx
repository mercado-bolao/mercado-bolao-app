import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { withAdminAuth } from '../../components/withAdminAuth';

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

function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Painel Administrativo
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            href="/admin/concursos"
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Concursos</h2>
            <p className="text-gray-600">Gerenciar concursos e jogos</p>
          </Link>

          <Link
            href="/admin/bilhetes"
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Bilhetes</h2>
            <p className="text-gray-600">Visualizar e gerenciar bilhetes</p>
          </Link>

          <Link
            href="/admin/estatisticas"
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Estatísticas</h2>
            <p className="text-gray-600">Visualizar estatísticas do sistema</p>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default withAdminAuth(AdminDashboard);