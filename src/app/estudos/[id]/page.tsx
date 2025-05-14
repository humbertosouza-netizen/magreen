'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { colors } from '@/styles/colors';
import { supabase } from '@/lib/supabase';
import dynamic from 'next/dynamic';

// Importação dinâmica do ReactPlayer para evitar problemas de SSR
const ReactPlayer = dynamic(() => import('react-player/lazy'), { ssr: false });

// Interface para o estado do player
interface PlayerState {
  played: number;
  loaded: number;
  playedSeconds: number;
  loadedSeconds: number;
}

// Definindo a interface para os cursos
interface Curso {
  id: string;
  titulo: string;
  descricao: string;
  categoria: string;
  instrutor: string;
  imagem_url?: string;
  video_url?: string;
  material_url?: string;
  total_aulas: number;
  duracao_total: string;
  nivel: 'Iniciante' | 'Intermediário' | 'Avançado';
  data_criacao: string;
  visualizacoes: number;
}

// Definindo a interface para as aulas
interface Aula {
  id: string;
  curso_id: string;
  titulo: string;
  descricao: string;
  video_url: string;
  material_url?: string;
  duracao: string;
  ordem: number;
}

export default function CursoDetalhePage() {
  const { id } = useParams();
  const cursoId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();

  const [curso, setCurso] = useState<Curso | null>(null);
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [aulaAtual, setAulaAtual] = useState<Aula | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [played, setPlayed] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const fetchCurso = async () => {
      try {
        setLoading(true);
        
        // Simulação de dados - em produção, buscaria do Supabase
        const cursoMock: Curso = {
          id: '1',
          titulo: 'Desenvolvimento Sustentável com React',
          descricao: 'Aprenda a criar aplicações React eficientes e sustentáveis para o meio ambiente. Este curso aborda técnicas de otimização de performance, redução de consumo de energia e boas práticas de desenvolvimento que contribuem para um mundo mais verde. Você aprenderá a construir interfaces mais eficientes, reduzir o impacto ambiental de suas aplicações e contribuir para um futuro mais sustentável através de código consciente.',
          categoria: 'Frontend',
          instrutor: 'Marina Silva',
          imagem_url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba',
          video_url: 'https://www.youtube.com/embed/jGPZO4HCzkQ',
          material_url: 'https://example.com/material1.pdf',
          total_aulas: 12,
          duracao_total: '8h 30min',
          nivel: 'Intermediário',
          data_criacao: '2025-03-15',
          visualizacoes: 1230
        };
        
        // Aulas de exemplo
        const aulasMock: Aula[] = [
          {
            id: '1',
            curso_id: '1',
            titulo: 'Introdução ao Desenvolvimento Sustentável',
            descricao: 'Nesta aula, vamos explorar os conceitos básicos de desenvolvimento sustentável e como aplicá-los ao desenvolvimento web.',
            video_url: 'https://www.youtube.com/watch?v=jGPZO4HCzkQ',
            material_url: 'https://example.com/material1.pdf',
            duracao: '45min',
            ordem: 1
          },
          {
            id: '2',
            curso_id: '1',
            titulo: 'React e Eficiência Energética',
            descricao: 'Aprenda como otimizar o desempenho de suas aplicações React para reduzir o consumo de energia.',
            video_url: 'https://www.youtube.com/watch?v=w7ejDZ8SWv8',
            material_url: 'https://example.com/material2.pdf',
            duracao: '52min',
            ordem: 2
          },
          {
            id: '3',
            curso_id: '1',
            titulo: 'Estratégias de Carregamento Eficiente',
            descricao: 'Técnicas de lazy loading e outras estratégias para carregar recursos de forma eficiente e sustentável.',
            video_url: 'https://www.youtube.com/watch?v=sBws8MSXN7A',
            material_url: 'https://example.com/material3.pdf',
            duracao: '38min',
            ordem: 3
          }
        ];
        
        // Em produção, você buscaria do Supabase:
        /*
        const { data: cursoData, error: cursoError } = await supabase
          .from('cursos')
          .select('*')
          .eq('id', cursoId)
          .single();
          
        if (cursoError) throw cursoError;
        
        const { data: aulasData, error: aulasError } = await supabase
          .from('aulas')
          .select('*')
          .eq('curso_id', cursoId)
          .order('ordem', { ascending: true });
          
        if (aulasError) throw aulasError;
        
        setCurso(cursoData);
        setAulas(aulasData || []);
        if (aulasData && aulasData.length > 0) {
          setAulaAtual(aulasData[0]);
        }
        */
        
        // Simulação dos dados
        if (cursoId === '1') {
          setCurso(cursoMock);
          setAulas(aulasMock);
          setAulaAtual(aulasMock[0]);
        } else {
          setError('Curso não encontrado');
        }
        
      } catch (error) {
        console.error('Erro ao buscar curso:', error);
        setError('Erro ao carregar o curso. Tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCurso();
  }, [cursoId]);

  // Função para selecionar uma aula
  const handleSelectAula = (aula: Aula) => {
    setAulaAtual(aula);
    setPlayed(0);
    setPlaying(true);
    
    // Rolar para o topo para ver o player
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Formatar URL para o ReactPlayer
  const formatVideoUrl = (url: string): string => {
    if (!url) return '';
    
    // Se já é uma URL de embed, retorna como está
    if (url.includes('/embed/')) return url;
    
    // Converter URL do YouTube normal para formato de embed
    const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube.com\/shorts\/)([^&]+)/);
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    }
    
    // Converter URL do Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }
    
    return url;
  };

  // Handler para o progresso do player
  const handleProgress = (state: PlayerState) => {
    setPlayed(state.played);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4" style={{ borderColor: colors.green }}></div>
      </div>
    );
  }

  if (error || !curso) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg max-w-md text-center">
          <p className="text-xl font-bold mb-2">Erro</p>
          <p>{error || 'Curso não encontrado'}</p>
          <Link 
            href="/estudos" 
            className="inline-block mt-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            Voltar para Cursos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Cabeçalho do curso */}
      <div 
        className="relative px-4 sm:px-6 lg:px-8 py-16 mb-8"
        style={{ 
          backgroundImage: curso.imagem_url 
            ? `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.6)), url(${curso.imagem_url})`
            : 'linear-gradient(120deg, rgba(84, 179, 43, 0.9), rgba(84, 179, 43, 0.8))',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-start lg:items-center">
            <div className="flex-1">
              <Link 
                href="/estudos" 
                className="inline-flex items-center text-white mb-6 hover:underline"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Voltar para Cursos
              </Link>
              
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
                {curso.titulo}
              </h1>
              
              <div className="flex flex-wrap gap-4 mb-6">
                <span 
                  className="px-3 py-1 text-sm font-medium rounded-full"
                  style={{ backgroundColor: 'rgba(127, 219, 63, 0.9)', color: '#121212' }}
                >
                  {curso.categoria}
                </span>
                <span className="px-3 py-1 bg-white bg-opacity-20 text-white text-sm font-medium rounded-full">
                  {curso.nivel}
                </span>
                <span className="px-3 py-1 bg-white bg-opacity-20 text-white text-sm font-medium rounded-full flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {curso.duracao_total}
                </span>
                <span className="px-3 py-1 bg-white bg-opacity-20 text-white text-sm font-medium rounded-full flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                  {curso.total_aulas} aulas
                </span>
              </div>
              
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-gray-700 font-bold">
                  {curso.instrutor.charAt(0)}
                </div>
                <div className="ml-3">
                  <p className="text-white font-medium">{curso.instrutor}</p>
                  <p className="text-white text-opacity-80 text-sm">Instrutor</p>
                </div>
              </div>
            </div>
            
            <div className="mt-8 lg:mt-0 lg:ml-8">
              {curso.material_url && (
                <a 
                  href={curso.material_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center px-5 py-3 bg-white rounded-lg shadow-md text-gray-800 font-medium hover:bg-opacity-90 transition-colors mb-4"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                  </svg>
                  Material de Apoio
                </a>
              )}
              
              <div className="bg-white bg-opacity-10 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-white text-sm">Progresso do curso</p>
                  <p className="text-white text-sm font-medium">0%</p>
                </div>
                <div className="w-full bg-white bg-opacity-20 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full" 
                    style={{ 
                      width: '0%',
                      backgroundColor: colors.green
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Conteúdo principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Player de vídeo e detalhes da aula */}
          <div className="lg:col-span-2">
            {/* Player de vídeo */}
            <div className="bg-black rounded-lg overflow-hidden shadow-lg mb-6">
              {/* Adicione a classe para manter a proporção do vídeo */}
              <div className="relative pt-[56.25%]">
                {/* @ts-ignore - Ignorando erros do TypeScript para o ReactPlayer importado dinamicamente */}
                {ReactPlayer && (
                  <ReactPlayer
                    className="absolute top-0 left-0"
                    url={aulaAtual ? formatVideoUrl(aulaAtual.video_url) : formatVideoUrl(curso.video_url || '')}
                    width="100%"
                    height="100%"
                    playing={playing}
                    controls={true}
                    onProgress={handleProgress}
                    onPause={() => setPlaying(false)}
                    onPlay={() => setPlaying(true)}
                    config={{
                      youtube: {
                        playerVars: { 
                          showinfo: 0,
                          rel: 0
                        }
                      }
                    }}
                  />
                )}
              </div>
            </div>
            
            {/* Informações da aula atual */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-xl font-bold mb-2">
                {aulaAtual ? aulaAtual.titulo : 'Introdução ao curso'}
              </h2>
              <p className="text-gray-500 text-sm mb-4">
                {aulaAtual ? aulaAtual.duracao : curso.duracao_total}
              </p>
              <div className="prose max-w-none">
                <p className="text-gray-700 mb-6">
                  {aulaAtual ? aulaAtual.descricao : curso.descricao}
                </p>
              </div>
              
              {aulaAtual?.material_url && (
                <a 
                  href={aulaAtual.material_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                  </svg>
                  Baixar Material Complementar
                </a>
              )}
            </div>
            
            {/* Descrição completa do curso */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-xl font-bold mb-4">Sobre este curso</h2>
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-line">
                  {curso.descricao}
                </p>
              </div>
            </div>
          </div>
          
          {/* Lista de aulas */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md overflow-hidden sticky top-4">
              <div className="p-4 border-b bg-gray-50">
                <h3 className="font-bold">Conteúdo do Curso</h3>
                <p className="text-sm text-gray-500">{aulas.length} aulas • {curso.duracao_total}</p>
              </div>
              
              <div className="max-h-[70vh] overflow-y-auto">
                {aulas.map((aula, index) => (
                  <div 
                    key={aula.id}
                    className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${aulaAtual?.id === aula.id ? 'bg-green-50' : ''}`}
                    onClick={() => handleSelectAula(aula)}
                  >
                    <div className="flex items-start">
                      <div 
                        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                          aulaAtual?.id === aula.id ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className={`font-medium ${aulaAtual?.id === aula.id ? 'text-green-700' : 'text-gray-800'}`}>
                          {aula.titulo}
                        </h4>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{aula.duracao}</span>
                        </div>
                      </div>
                      {aulaAtual?.id === aula.id && (
                        <div className="flex-shrink-0 ml-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 