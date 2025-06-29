import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface PalpitePorJogo {
  jogoId: string;
  palpite: string | null;
  resultado: string | null;
  acertou: boolean | null;
  finalizado: boolean;
}

interface UsuarioTabela {
  posicao: number;
  nome: string;
  whatsapp: string;
  acertos: number;
  totalPalpitesFinalizados: number;
  percentual: string;
  palpitesPorJogo: PalpitePorJogo[];
}

interface JogoFinalizado {
  id: string;
  mandante: string;
  visitante: string;
  resultado: string;
  horario: string;
  fotoMandante?: string;
  fotoVisitante?: string;
}

interface RankingData {
  ranking: any[];
  jogosFinalizados: JogoFinalizado[];
  todosJogos: any[];
  tabelaPalpites: UsuarioTabela[];
  distribuicaoPontos: { [pontos: number]: number };
  totalJogos: number;
  totalJogosFinalizados: number;
  totalParticipantes: number;
  message?: string;
}

export default function RankingConcurso() {
  const router = useRouter();
  const { id } = router.query;
  const [ranking, setRanking] = useState<RankingData | null>(null);
  const [concurso, setConcurso] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (id) {
      Promise.all([
        fetch(`/api/admin/ranking?concursoId=${id}`).then(res => res.json()),
        fetch(`/api/jogos?concursoId=${id}`).then(res => res.json())
      ]).then(([rankingData, concursoData]) => {
        setRanking(rankingData);
        setConcurso(concursoData);
        setLoading(false);
      });
    }
  }, [id]);

  const getResultadoDisplay = (resultado: string) => {
    switch(resultado) {
      case 'C': return { texto: 'Casa', emoji: '🏠' };
      case 'E': return { texto: 'Empate', emoji: '⚖️' };
      case 'F': return { texto: 'Fora', emoji: '✈️' };
      default: return { texto: resultado, emoji: '' };
    }
  };

  const getCelulaStyle = (palpite: PalpitePorJogo) => {
    if (!palpite.finalizado) return "bg-gray-100 text-gray-500";
    if (palpite.acertou === true) return "bg-green-200 text-green-800 font-bold";
    if (palpite.acertou === false) return "bg-red-200 text-red-800";
    return "bg-gray-100 text-gray-500";
  };

  // Filtrar participantes baseado no termo de busca
  const participantesFiltrados = ranking?.tabelaPalpites.filter(usuario =>
    usuario.nome.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Função para download do PDF
  const downloadPDF = async () => {
    const element = document.getElementById('ranking-table');
    if (!element) {
      alert('Tabela não encontrada para gerar PDF.');
      return;
    }

    try {
      // Mostrar loading
      const originalText = document.querySelector('[data-pdf-button]')?.textContent;
      const button = document.querySelector('[data-pdf-button]') as HTMLButtonElement;
      if (button) {
        button.disabled = true;
        button.textContent = '⏳ Gerando PDF...';
      }

      // Criar um clone do elemento para modificar estilos problemáticos
      const clonedElement = element.cloneNode(true) as HTMLElement;

      // Função para limpar estilos problemáticos e otimizar para PDF
      const optimizeForPDF = (el: Element) => {
        if (el instanceof HTMLElement) {
          const style = el.style;

          // Remover todas as classes CSS que podem causar problemas
          el.className = '';

          // Aplicar estilos básicos diretamente
          if (el.tagName === 'TABLE') {
            style.width = '100%';
            style.borderCollapse = 'collapse';
            style.fontSize = '12px';
            style.fontFamily = 'Arial, sans-serif';
          }

          if (el.tagName === 'TH') {
            style.backgroundColor = '#e5e7eb';
            style.color = '#1f2937';
            style.fontWeight = 'bold';
            style.padding = '8px';
            style.border = '1px solid #d1d5db';
            style.textAlign = 'center';
          }

          if (el.tagName === 'TD') {
            style.color = '#374151';
            style.padding = '6px';
            style.border = '1px solid #e5e7eb';
            style.textAlign = 'center';
          }

          // Cores específicas para células de palpites
          if (el.classList && el.classList.contains('bg-green-200')) {
            style.backgroundColor = '#bbf7d0';
            style.color = '#166534';
            style.fontWeight = 'bold';
          } else if (el.classList && el.classList.contains('bg-red-200')) {
            style.backgroundColor = '#fecaca';
            style.color = '#991b1b';
          } else if (el.classList && el.classList.contains('bg-gray-100')) {
            style.backgroundColor = '#f3f4f6';
            style.color = '#6b7280';
          }

          // Remover todos os efeitos visuais problemáticos
          style.boxShadow = 'none';
          style.textShadow = 'none';
          style.backgroundImage = 'none';
          style.background = style.backgroundColor || 'transparent';
          style.filter = 'none';
          style.transform = 'none';
          style.borderRadius = '0';

          // Garantir que não há cores modernas
          const computedStyle = window.getComputedStyle(el);
          if (computedStyle.backgroundColor && computedStyle.backgroundColor.includes('oklch')) {
            style.backgroundColor = '#ffffff';
          }
          if (computedStyle.color && computedStyle.color.includes('oklch')) {
            style.color = '#000000';
          }
        }

        // Recursivamente otimizar elementos filhos
        for (let i = 0; i < el.children.length; i++) {
          optimizeForPDF(el.children[i]);
        }
      };

      // Preparar elemento clonado com estilos inline
      clonedElement.style.cssText = `
        position: absolute !important;
        left: -9999px !important;
        top: 0 !important;
        z-index: -1 !important;
        width: 1400px !important;
        background-color: #ffffff !important;
        padding: 20px !important;
        font-family: Arial, sans-serif !important;
        color: #000000 !important;
      `;

      document.body.appendChild(clonedElement);

      // Otimizar estilos para PDF
      optimizeForPDF(clonedElement);

      // Aguardar um momento para garantir que os estilos sejam aplicados
      await new Promise(resolve => setTimeout(resolve, 300));

      // Configuração otimizada para html2canvas
      const canvas = await html2canvas(clonedElement, {
        scale: 1.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: 1400,
        height: clonedElement.scrollHeight,
        windowWidth: 1400,
        windowHeight: clonedElement.scrollHeight,
        scrollX: 0,
        scrollY: 0,
        foreignObjectRendering: false,
        removeContainer: true,
        imageTimeout: 10000,
        onclone: (clonedDoc) => {
          // Remover todas as folhas de estilo CSS do documento clonado
          const stylesheets = clonedDoc.querySelectorAll('link[rel="stylesheet"], style');
          stylesheets.forEach(sheet => sheet.remove());
        }
      });

      // Remover elemento clonado
      document.body.removeChild(clonedElement);

      const imgData = canvas.toDataURL('image/png', 0.9);

      // Usar formato A3 para mais espaço
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a3' // Mudança para A3 para mais espaço
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Calcular dimensões da imagem respeitando proporções
      const canvasRatio = canvas.width / canvas.height;
      const maxImgWidth = pdfWidth - 20; // Margem de 10mm de cada lado
      const maxImgHeight = pdfHeight - 60; // Espaço para cabeçalho e rodapé

      let imgWidth, imgHeight;

      if (canvasRatio > (maxImgWidth / maxImgHeight)) {
        // Imagem é mais larga - ajustar pela largura
        imgWidth = maxImgWidth;
        imgHeight = imgWidth / canvasRatio;
      } else {
        // Imagem é mais alta - ajustar pela altura
        imgHeight = maxImgHeight;
        imgWidth = imgHeight * canvasRatio;
      }

      // Centralizar horizontalmente
      const xPosition = (pdfWidth - imgWidth) / 2;

      // Adicionar cabeçalho melhorado
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      const title = `Ranking Detalhado - Concurso #${concurso?.numero || 'N/A'}`;
      const titleWidth = pdf.getTextWidth(title);
      pdf.text(title, (pdfWidth - titleWidth) / 2, 20);

      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      const subtitle = `Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')} | Total de participantes: ${ranking?.totalParticipantes || 0}`;
      const subtitleWidth = pdf.getTextWidth(subtitle);
      pdf.text(subtitle, (pdfWidth - subtitleWidth) / 2, 30);

      // Posição inicial da tabela
      const yPosition = 40;

      // Verificar se a imagem cabe em uma página
      if (imgHeight <= maxImgHeight) {
        pdf.addImage(imgData, 'PNG', xPosition, yPosition, imgWidth, imgHeight, '', 'FAST');
      } else {
        // Dividir em múltiplas páginas se necessário
        let remainingHeight = imgHeight;
        let sourceY = 0;
        let pageNum = 1;

        while (remainingHeight > 0) {
          if (pageNum > 1) {
            pdf.addPage();
            // Cabeçalho das páginas seguintes
            pdf.setFontSize(14);
            pdf.setFont('helvetica', 'bold');
            const contTitle = `Ranking Detalhado - Concurso #${concurso?.numero || 'N/A'} (Página ${pageNum})`;
            const contTitleWidth = pdf.getTextWidth(contTitle);
            pdf.text(contTitle, (pdfWidth - contTitleWidth) / 2, 20);
          }

          const currentPageHeight = Math.min(remainingHeight, maxImgHeight);
          const sourceHeight = (currentPageHeight / imgHeight) * canvas.height;

          // Criar canvas temporário para esta seção
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = canvas.width;
          tempCanvas.height = sourceHeight;
          const tempCtx = tempCanvas.getContext('2d');

          if (tempCtx) {
            tempCtx.drawImage(
              canvas,
              0, sourceY,
              canvas.width, sourceHeight,
              0, 0,
              canvas.width, sourceHeight
            );

            const tempImgData = tempCanvas.toDataURL('image/png', 1.0);
            pdf.addImage(tempImgData, 'PNG', xPosition, pageNum === 1 ? yPosition : 30, imgWidth, currentPageHeight, '', 'FAST');
          }

          sourceY += sourceHeight;
          remainingHeight -= currentPageHeight;
          pageNum++;
        }
      }

      // Adicionar rodapé em todas as páginas
      const pageCount = pdf.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'italic');
        const footerText = 'Mercado do Bolão - Sistema de Apostas';
        const footerWidth = pdf.getTextWidth(footerText);
        pdf.text(footerText, (pdfWidth - footerWidth) / 2, pdfHeight - 10);

        // Número da página
        const pageText = `Página ${i} de ${pageCount}`;
        const pageTextWidth = pdf.getTextWidth(pageText);
        pdf.text(pageText, pdfWidth - pageTextWidth - 10, pdfHeight - 10);
      }

      // Fazer download
      const fileName = `ranking-detalhado-concurso-${concurso?.numero || 'sem-numero'}-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

      // Restaurar botão
      if (button && originalText) {
        button.disabled = false;
        button.textContent = originalText;
      }

      console.log('PDF gerado com sucesso em alta qualidade!');

    } catch (error) {
      console.error('Erro detalhado ao gerar PDF:', error);

      // Restaurar botão em caso de erro
      const button = document.querySelector('[data-pdf-button]') as HTMLButtonElement;
      if (button) {
        button.disabled = false;
        button.textContent = '📄 Download PDF';
      }

      alert(`Erro ao gerar PDF: ${error instanceof Error ? error.message : 'Erro desconhecido'}. Verifique o console para mais detalhes.`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Carregando ranking...</p>
        </div>
      </div>
    );
  }

  if (!ranking || !concurso) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-lg">Erro ao carregar dados</p>
        </div>
      </div>
    );
  }

    const handleLiveMatchUpdate = (updatedMatch: any) => {
        // Implemente a lógica para atualizar a tabela de palpites dinamicamente
        // com base nos dados atualizados da partida ao vivo.
        // Por exemplo, você pode atualizar o estado 'ranking' com os novos
        // resultados e, em seguida, re-renderizar a tabela.
        console.log("Partida atualizada:", updatedMatch);
    };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">🏆 Ranking do Concurso</h1>
            <div className="bg-blue-100 rounded-lg p-3 mb-4">
              <p className="text-blue-800 font-semibold">
                Concurso #{concurso.numero}
              </p>
              <p className="text-blue-600 text-sm">
                {ranking.totalJogosFinalizados} de {ranking.totalJogos} jogos finalizados • {ranking.totalParticipantes} participantes
              </p>
            </div>
            <Link href="/">
              <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                ← Voltar ao Início
              </button>
            </Link>
          </div>
        </div>

        {/* Verificar se apostas encerraram */}
        {(() => {
          const dataFechamento = concurso.fechamentoPalpites || concurso.dataFim;
          const apostasEncerradas = dataFechamento ? new Date() > new Date(dataFechamento) : false;

          // Se não há jogos finalizados E apostas ainda não encerraram
          if (ranking.jogosFinalizados.length === 0 && !apostasEncerradas) {
            return (
              <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-lg">
                <p className="font-semibold">Aguardando encerramento das apostas para exibir o ranking detalhado</p>
              </div>
            );
          }

          return (
            <>
              {/* Acompanhamento Ao Vivo */}
              <LiveMatchTracker 
                concursoId={id as string} 
                onMatchUpdate={handleLiveMatchUpdate}
              />

            {/* Jogos Finalizados */}
            {ranking.jogosFinalizados.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">⚽ Jogos Finalizados</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {ranking.jogosFinalizados.map((jogo) => {
                    const resultadoInfo = getResultadoDisplay(jogo.resultado);
                    return (
                      <div key={jogo.id} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            {jogo.fotoMandante && (
                              <img src={jogo.fotoMandante} alt={jogo.mandante} className="w-6 h-6 rounded" />
                            )}
                            <span className="font-semibold text-sm text-black">{jogo.mandante}</span>
                          </div>
                          <span className="text-gray-500">vs</span>
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-sm text-black">{jogo.visitante}</span>
                            {jogo.fotoVisitante && (
                              <img src={jogo.fotoVisitante} alt={jogo.visitante} className="w-6 h-6 rounded" />
                            )}
                          </div>
                        </div>
                        <div className="text-center">
                          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-bold">
                            {resultadoInfo.emoji} {resultadoInfo.texto}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Distribuição de Pontos */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">📊 Resumo de Pontuação dos Bilhetes</h2>

              {/* Resumo textual */}
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">Distribuição de Acertos:</h3>
                <div className="text-blue-700 space-y-1">
                  {Object.keys(ranking.distribuicaoPontos)
                    .map(Number)
                    .sort((a, b) => a - b)
                    .map(pontos => (
                      <div key={pontos} className="flex justify-between">
                        <span>
                          {ranking.distribuicaoPontos[pontos]} {ranking.distribuicaoPontos[pontos] === 1 ? 'bilhete' : 'bilhetes'}
                        </span>
                        <span className="font-semibold">
                          {pontos === 0 ? 'com 0 acertos' : 
                           pontos === 1 ? 'com 1 acerto' : 
                           `com ${pontos} acertos`}
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Cards visuais */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {Object.keys(ranking.distribuicaoPontos)
                  .map(Number)
                  .sort((a, b) => b - a)
                  .map(pontos => (
                    <div key={pontos} className={`text-center p-3 rounded-lg ${
                      pontos === 0 ? 'bg-red-50 border border-red-200' :
                      pontos === Math.max(...Object.keys(ranking.distribuicaoPontos).map(Number)) ? 'bg-green-50 border border-green-200' :
                      'bg-blue-50 border border-blue-200'
                    }`}>
                      <div className={`text-2xl font-bold ${
                        pontos === 0 ? 'text-red-600' :
                        pontos === Math.max(...Object.keys(ranking.distribuicaoPontos).map(Number)) ? 'text-green-600' :
                        'text-blue-600'
                      }`}>
                        {ranking.distribuicaoPontos[pontos]}
                      </div>
                      <div className="text-sm text-gray-600">
                        {pontos === 0 ? '0 acertos' :
                         pontos === 1 ? '1 acerto' : 
                         `${pontos} acertos`}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {((ranking.distribuicaoPontos[pontos] / ranking.totalParticipantes) * 100).toFixed(1)}%
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Tabela Detalhada de Palpites */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
                <h2 className="text-2xl font-bold text-white text-center mb-4">
                  📋 Tabela Detalhada de Palpites
                </h2>

                {/* Campo de busca e botão PDF */}
                <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                  <div className="max-w-md">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="🔍 Buscar participante..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 pl-10 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/70 focus:outline-none focus:bg-white/30 focus:border-white/50"
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-white/70">🔍</span>
                      </div>
                    </div>
                    {searchTerm && (
                      <p className="text-white/80 text-sm mt-2 text-center">
                        {participantesFiltrados.length} de {ranking?.tabelaPalpites.length} participantes encontrados
                      </p>
                    )}
                  </div>

                  {/* Botão Download PDF */}
                  <button
                    onClick={downloadPDF}
                    data-pdf-button
                    className="bg-white/20 hover:bg-white/30 border border-white/30 hover:border-white/50 text-white px-6 py-2 rounded-lg font-semibold transition-all flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>📄</span>
                    <span>Download PDF</span>
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-x-auto" id="ranking-table">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left p-2 bg-gray-50 text-gray-800 font-semibold">Pos</th>
                      <th className="text-left p-2 bg-gray-50 text-gray-800 font-semibold">Participante</th>
                      {ranking.todosJogos.map((jogo, index) => (
                        <th key={jogo.id} className="text-center p-2 bg-gray-50 min-w-[60px]">
                          <div className="text-xs text-gray-700">
                            <div className="font-bold">{jogo.mandante.substring(0, 3)}</div>
                            <div>x</div>
                            <div className="font-bold">{jogo.visitante.substring(0, 3)}</div>
                          </div>
                        </th>
                      ))}
                      <th className="text-center p-2 bg-green-100 font-bold text-green-800">Acertos</th>
                      <th className="text-center p-2 bg-green-100 font-bold text-green-800">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {participantesFiltrados.map((usuario) => (
                      <tr key={`${usuario.nome}-${usuario.whatsapp}`} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="p-2 font-bold text-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm ${
                            usuario.posicao === 1 ? 'bg-yellow-500' :
                            usuario.posicao === 2 ? 'bg-gray-500' :
                            usuario.posicao === 3 ? 'bg-orange-500' : 'bg-blue-500'
                          }`}>
                            {usuario.posicao}
                          </div>
                        </td>
                        <td className="p-2">
                          <div className="font-semibold text-gray-800">{usuario.nome}</div>
                        </td>
                        {usuario.palpitesPorJogo.map((palpiteInfo) => (
                          <td key={palpiteInfo.jogoId} className="p-1 text-center">
                            <div className={`p-2 rounded text-xs font-bold ${getCelulaStyle(palpiteInfo)}`}>
                              {palpiteInfo.palpite || '-'}
                            </div>
                          </td>
                        ))}
                        <td className="p-2 text-center font-bold text-lg text-green-600">
                          {usuario.acertos}
                        </td>
                        <td className="p-2 text-center font-semibold text-green-600">
                          {usuario.percentual}%
                        </td>
                      </tr>
                    ))}
                    {searchTerm && participantesFiltrados.length === 0 && (
                      <tr>
                        <td colSpan={ranking.todosJogos.length + 4} className="p-8 text-center">
                          <div className="text-gray-500">
                            <span className="text-2xl block mb-2">😔</span>
                            <p className="text-lg font-semibold">Nenhum participante encontrado</p>
                            <p className="text-sm">Tente buscar por outro nome</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Legenda */}
            <div className="bg-white rounded-lg p-4 mt-4">
              <h3 className="font-bold text-gray-700 mb-2">Legenda:</h3>
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-green-200 rounded"></div>
                  <span>Acerto</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-red-200 rounded"></div>
                  <span>Erro</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-gray-100 rounded"></div>
                  <span>Jogo não finalizado / Sem palpite</span>
                </div>
              </div>
            </div>
            </>
          );
        })()}
      </div>
    </div>
  );
}

// LiveMatchTracker Component
function LiveMatchTracker({ concursoId, onMatchUpdate }: { concursoId: string, onMatchUpdate: (updatedMatch: any) => void }) {
    const [matches, setMatches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchLiveMatches = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch(`/api/live-matches?concursoId=${concursoId}`);
                if (!response.ok) {
                    throw new Error(`Erro ao buscar partidas ao vivo: ${response.status}`);
                }
                const data = await response.json();
                setMatches(data);
                setLoading(false);
            } catch (err: any) {
                setError(err.message || 'Erro ao buscar partidas ao vivo.');
                setLoading(false);
            }
        };

        fetchLiveMatches();

        const intervalId = setInterval(fetchLiveMatches, 30000);

        return () => clearInterval(intervalId);
    }, [concursoId]);

    if (loading) {
        return <div>Carregando partidas ao vivo...</div>;
    }

    if (error) {
        return <div>Erro: {error}</div>;
    }

    if (!matches || matches.length === 0) {
        return <div>Nenhuma partida ao vivo encontrada.</div>;
    }

    return (
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">⚽ Acompanhamento Ao Vivo</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {matches.map((match) => (
                    <LiveMatchItem key={match.id} match={match} onMatchUpdate={onMatchUpdate} />
                ))}
            </div>
        </div>
    );
}

// LiveMatchItem Component
function LiveMatchItem({ match, onMatchUpdate }: { match: any, onMatchUpdate: (updatedMatch: any) => void }) {
    const [timeElapsed, setTimeElapsed] = useState(match.timeElapsed || '0');
    const [score, setScore] = useState(match.score || '0 - 0');

    useEffect(() => {
        //Simulando atualizacao do placar a cada 30 segundos
        const intervalId = setInterval(() => {
            const newTimeElapsed = parseInt(timeElapsed) + 1;
            setTimeElapsed(newTimeElapsed.toString());

            //Placar aleatorio simulado
            const newScoreHome = Math.floor(Math.random() * 5);
            const newScoreAway = Math.floor(Math.random() * 5);
            const newScore = `${newScoreHome} - ${newScoreAway}`;
            setScore(newScore);

            //Notificar componente pai sobre a atualizacao
            onMatchUpdate({ ...match, timeElapsed: newTimeElapsed, score: newScore });
        }, 30000);

        return () => clearInterval(intervalId);
    }, [match, onMatchUpdate, timeElapsed]);

    return (
        <div className="border rounded-lg p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                    <span className="font-semibold text-sm">{match.homeTeam}</span>
                </div>
                <span className="text-gray-500">vs</span>
                <div className="flex items-center space-x-2">
                    <span className="font-semibold text-sm">{match.awayTeam}</span>
                </div>
            </div>
            <div className="text-center">
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-bold">
                    {timeElapsed}&apos; | {score}
                </span>
            </div>
        </div>
    );
}