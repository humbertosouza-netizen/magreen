'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { colors } from '@/styles/colors';
import { supabase } from '@/lib/supabase';
import theme from '@/styles/theme';

// Definindo a interface para os cursos
interface Curso {
  id: string;
  titulo: string;
  descricao: string;
  categoria: string;
  instrutor: string;
  imagem_url?: string;
  total_aulas: number;
  duracao_total: string;
  nivel: 'Iniciante' | 'Intermediário' | 'Avançado';
  data_criacao: string;
  visualizacoes: number;
}

export default function EstudosPage() {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroCategoria, setFiltroCategoria] = useState<string>('Todos');
  const [filtroNivel, setFiltroNivel] = useState<string>('Todos');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Simulação de dados - em produção, esses dados viriam do supabase
    const cursosMock: Curso[] = [
      {
        id: '1',
        titulo: 'Desenvolvimento Sustentável com React',
        descricao: 'Aprenda a criar aplicações React eficientes e sustentáveis para o meio ambiente',
        categoria: 'Frontend',
        instrutor: 'Marina Silva',
        imagem_url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba',
        total_aulas: 12,
        duracao_total: '8h 30min',
        nivel: 'Intermediário',
        data_criacao: '2025-03-15',
        visualizacoes: 1230
      },
      {
        id: '2',
        titulo: 'Agricultura Orgânica Básica',
        descricao: 'Fundamentos da agricultura orgânica para iniciantes',
        categoria: 'Agricultura',
        instrutor: 'João Pereira',
        imagem_url: 'https://images.unsplash.com/photo-1562159858-c30d77767347',
        total_aulas: 8,
        duracao_total: '5h 15min',
        nivel: 'Iniciante',
        data_criacao: '2025-04-10',
        visualizacoes: 876
      },
      {
        id: '3',
        titulo: 'Energias Renováveis: Fontes e Aplicações',
        descricao: 'Um panorama completo sobre as principais fontes de energia renovável e suas aplicações',
        categoria: 'Energia',
        instrutor: 'Carla Mendes',
        imagem_url: 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d',
        total_aulas: 15,
        duracao_total: '10h 45min',
        nivel: 'Avançado',
        data_criacao: '2025-02-20',
        visualizacoes: 2150
      },
      {
        id: '4',
        titulo: 'Introdução à Permacultura',
        descricao: 'Conceitos básicos de permacultura e como aplicar em pequenos espaços',
        categoria: 'Agricultura',
        instrutor: 'Rafael Costa',
        imagem_url: 'https://images.unsplash.com/photo-1572078549789-dbf82b35bdf1',
        total_aulas: 10,
        duracao_total: '7h 20min',
        nivel: 'Iniciante',
        data_criacao: '2025-05-05',
        visualizacoes: 943
      },
      {
        id: '5',
        titulo: 'Gestão de Resíduos Empresariais',
        descricao: 'Estratégias para implementar um sistema eficiente de gestão de resíduos corporativos',
        categoria: 'Gestão',
        instrutor: 'Amanda Oliveira',
        imagem_url: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b',
        total_aulas: 14,
        duracao_total: '9h 10min',
        nivel: 'Intermediário',
        data_criacao: '2025-01-30',
        visualizacoes: 1567
      },
      {
        id: '6',
        titulo: 'Certificações Ambientais para Produtos',
        descricao: 'Guia completo sobre as principais certificações ambientais para produtos e serviços',
        categoria: 'Certificação',
        instrutor: 'Fernando Matos',
        imagem_url: 'https://images.unsplash.com/photo-1590212151175-e58edd96185b',
        total_aulas: 9,
        duracao_total: '6h 40min',
        nivel: 'Avançado',
        data_criacao: '2025-04-22',
        visualizacoes: 732
      }
    ];

    setCursos(cursosMock);
    setLoading(false);

    // Em produção, você buscaria os cursos do Supabase:
    /*
    const fetchCursos = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('cursos')
          .select('*')
          .order('data_criacao', { ascending: false });
          
        if (error) throw error;
        setCursos(data || []);
      } catch (error) {
        console.error('Erro ao buscar cursos:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCursos();
    */
  }, []);

  // Filtrar cursos com base nos filtros selecionados e termo de pesquisa
  const cursosFiltrados = cursos.filter(curso => {
    const matchCategoria = filtroCategoria === 'Todos' || curso.categoria === filtroCategoria;
    const matchNivel = filtroNivel === 'Todos' || curso.nivel === filtroNivel;
    const matchSearch = 
      curso.titulo.toLowerCase().includes(searchTerm.toLowerCase()) || 
      curso.descricao.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchCategoria && matchNivel && matchSearch;
  });

  // Extrair categorias únicas para o filtro
  const categorias = ['Todos', ...Array.from(new Set(cursos.map(curso => curso.categoria)))];
  const niveis = ['Todos', 'Iniciante', 'Intermediário', 'Avançado'];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4" style={{ borderColor: colors.green }}></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div 
        className="relative px-6 lg:px-8 py-24 mb-12"
        style={{ 
          backgroundImage: 'linear-gradient(120deg, rgba(84, 179, 43, 0.9), rgba(84, 179, 43, 0.8)), url("https://images.unsplash.com/photo-1542601906990-b4d3fb778b09")',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
            Magnificência Green Estudos
          </h1>
          <p className="mt-6 text-xl text-white max-w-3xl">
            Aprenda sobre práticas sustentáveis, agricultura orgânica e outras tecnologias verdes com nossos cursos especializados.
          </p>
          <div className="mt-10 flex gap-4">
            <button 
              className="px-6 py-3 text-md font-semibold rounded-lg shadow-sm focus:outline-none"
              style={{ backgroundColor: 'white', color: colors.darkGreen }}
            >
              Explorar Cursos
            </button>
            <button 
              className="px-6 py-3 text-md font-semibold rounded-lg shadow-sm border-2 border-white text-white hover:bg-white hover:bg-opacity-10 focus:outline-none transition-colors"
            >
              Sobre Nossos Cursos
            </button>
          </div>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="col-span-2">
              <label htmlFor="search" className="sr-only">Buscar cursos</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"></path>
                  </svg>
                </div>
                <input
                  id="search"
                  type="text"
                  placeholder="Buscar cursos..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label htmlFor="categoria" className="block text-sm font-medium text-gray-700">Categoria</label>
              <select
                id="categoria"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md"
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
              >
                {categorias.map((categoria) => (
                  <option key={categoria} value={categoria}>{categoria}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="nivel" className="block text-sm font-medium text-gray-700">Nível</label>
              <select
                id="nivel"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md"
                value={filtroNivel}
                onChange={(e) => setFiltroNivel(e.target.value)}
              >
                {niveis.map((nivel) => (
                  <option key={nivel} value={nivel}>{nivel}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Cursos */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">
          {cursosFiltrados.length} {cursosFiltrados.length === 1 ? 'Curso' : 'Cursos'} {filtroCategoria !== 'Todos' ? `em ${filtroCategoria}` : 'Disponíveis'}
        </h2>

        {cursosFiltrados.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-16 w-16 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Nenhum curso encontrado</h3>
            <p className="mt-2 text-sm text-gray-500">
              Tente ajustar seus filtros ou buscar por outros termos.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {cursosFiltrados.map((curso) => (
              <Link href={`/estudos/${curso.id}`} key={curso.id} className="group">
                <div className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
                  <div className="relative h-48">
                    <div 
                      className="absolute inset-0 bg-cover bg-center transform group-hover:scale-105 transition-transform duration-300" 
                      style={{ 
                        backgroundImage: curso.imagem_url 
                          ? `url('${curso.imagem_url}')` 
                          : `url('https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&h=400&q=80')`,
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                    
                    <div className="absolute bottom-4 left-4 right-4">
                      <span 
                        className="inline-block px-2 py-1 text-xs font-semibold rounded-md"
                        style={{ backgroundColor: colors.green, color: 'white' }}
                      >
                        {curso.categoria}
                      </span>
                      <h3 className="mt-2 text-lg font-bold text-white line-clamp-2">{curso.titulo}</h3>
                    </div>
                  </div>
                  
                  <div className="p-5">
                    <p className="text-gray-600 text-sm line-clamp-2 mb-4">{curso.descricao}</p>
                    
                    <div className="flex justify-between items-center text-sm text-gray-500 mt-2">
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{curso.duracao_total}</span>
                      </div>
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                        </svg>
                        <span>{curso.nivel}</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium">
                          {curso.instrutor.charAt(0)}
                        </div>
                        <span className="ml-2 text-sm text-gray-600">{curso.instrutor}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span>{curso.visualizacoes}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 