'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { colors } from '@/styles/colors';
import { supabase } from '@/lib/supabase';

interface Article {
  id: string;
  titulo: string;
  resumo: string;
  conteudo: string;
  categoria: string;
  tags: string[];
  imagem_url?: string;
  publicado: boolean;
  autor_id: string;
  autor_nome?: string;
  autor_avatar?: string;
  data_criacao: string;
  data_atualizacao?: string;
  data_publicacao?: string;
  visualizacoes: number;
  comentarios_count?: number;
}

// Adicionar classe específica para elementos clicáveis
interface ClickableElementProps {
  children: React.ReactNode;
  className?: string;
  [x: string]: any;
}

const ClickableElement = ({ children, className, ...props }: ClickableElementProps) => (
  <div 
    className={`blog-clickable-element ${className || ''}`}
    {...props}
  >
    {children}
  </div>
);

export default function BlogPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchArticles();
  }, []);

  // Função para buscar artigos do Supabase
  async function fetchArticles() {
    try {
      setLoading(true);
      setError(null);
      
      // Consulta para buscar apenas posts publicados
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('publicado', true)
        .order('data_criacao', { ascending: false });
      
      if (error) throw error;
      
      // Para cada post, buscar o perfil do autor
      const processedArticles: Article[] = await Promise.all(
        data.map(async (post) => {
          let autorNome = 'Usuário';
          let autorAvatar = '';
          
          // Se tiver autor_id, buscar informações do perfil
          if (post.autor_id) {
            const { data: authorData } = await supabase
              .from('profiles')
              .select('nome_completo, avatar_url, nickname')
              .eq('id', post.autor_id)
              .single();
              
            if (authorData) {
              autorNome = authorData.nickname || authorData.nome_completo || 'Usuário';
              autorAvatar = authorData.avatar_url || '';
            }
          }
          
          return {
            id: post.id,
            titulo: post.titulo,
            resumo: post.resumo,
            conteudo: post.conteudo,
            categoria: post.categoria,
            tags: post.tags || [],
            imagem_url: post.imagem_url,
            publicado: post.publicado,
            autor_id: post.autor_id,
            autor_nome: autorNome,
            autor_avatar: autorAvatar,
            data_criacao: post.data_criacao,
            data_atualizacao: post.data_atualizacao,
            data_publicacao: post.data_publicacao,
            visualizacoes: post.visualizacoes || 0,
            comentarios_count: 0 // Implementar contagem de comentários posteriormente
          };
        })
      );
      
      setArticles(processedArticles);
      
    } catch (err: any) {
      console.error('Erro ao buscar artigos:', err);
      setError(err.message || 'Erro ao carregar artigos');
    } finally {
      setLoading(false);
    }
  }

  // Obter categorias usadas nos artigos
  const usedCategories = Array.from(new Set(articles.map(article => article.categoria)));
  
  // Categorias disponíveis
  const categories = [
    { id: 'todos', label: 'Todos' },
    ...usedCategories.map(category => ({ id: category, label: category }))
  ];

  // Filtrar artigos por categoria e busca
  const filteredArticles = articles.filter(article => {
    return (activeCategory === 'todos' || article.categoria === activeCategory) && 
           article.titulo.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Formatar data
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('pt-BR', options);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent" 
             style={{ borderColor: colors.green, borderTopColor: 'transparent' }}></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#1A1A1A', color: 'white' }}>
      {/* Header com estilo bio-tech */}
      <header 
        className="border-b border-gray-800 relative z-10" 
        style={{ 
          backgroundColor: 'rgba(26, 32, 44, 0.95)',
          backdropFilter: 'blur(8px)',
          borderImage: 'linear-gradient(to right, rgba(127, 219, 63, 0.3), rgba(77, 168, 218, 0.3)) 1',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
        }}
      >
        <div className="container mx-auto px-4 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0">
            <Link 
              href="/" 
              className="flex items-center space-x-2 blog-clickable-element"
            >
              {/* Logo da MagnifiGreen */}
              <img 
                src="/images/logo/magnificencia-green-full-logo.png" 
                alt="MagnifiGreen Logo" 
                className="h-10"
              />
              <div>
                <h1 
                  className="text-xl font-bold gradient-text"
                  style={{ 
                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
                  }}
                >
                  MAGNIFIGREEN
                </h1>
                <p className="text-xs text-gray-400 hidden sm:block">Blog Sustentável & Tecnológico</p>
              </div>
            </Link>

            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar artigos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 rounded-full bg-gray-800 text-sm border border-gray-700 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 blog-clickable-element"
                  style={{ 
                    width: '180px',
                    backgroundColor: 'rgba(26, 32, 44, 0.6)',
                    backdropFilter: 'blur(4px)',
                    boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <Link 
                href="/dashboard" 
                className="blog-clickable-element rounded-md px-3 py-1.5 text-sm font-medium flex items-center"
                style={{ 
                  background: `linear-gradient(135deg, ${colors.green}ee, ${colors.blue}ee)`,
                  color: '#121212',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.15)'
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Comunidade
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section com elementos de natureza */}
      <div className="relative overflow-hidden">
        {/* Background com padrão de natureza */}
        <div 
          className="absolute inset-0 z-0" 
          style={{
            backgroundImage: `
              radial-gradient(circle at 80% 20%, rgba(127, 219, 63, 0.15) 0%, transparent 40%),
              radial-gradient(circle at 20% 60%, rgba(77, 168, 218, 0.1) 0%, transparent 40%)
            `,
            opacity: 0.4
          }}
        />
        
        {/* Conteúdo hero */}
        <div className="container mx-auto px-4 py-12 md:py-20 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl md:text-5xl font-bold mb-4 gradient-text">
              Blog da Magnificência Green
            </h1>
            <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Explorando a perfeita sintonia entre tecnologia, sustentabilidade e educação ambiental
            </p>
            
            {/* Categorias em estilo de chips */}
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {categories.map((cat) => (
                <button 
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className="px-4 py-1.5 rounded-full text-sm font-medium blog-clickable-element"
                  style={{ 
                    backgroundColor: cat.id === activeCategory 
                      ? `linear-gradient(135deg, ${colors.green}40, ${colors.blue}40)` 
                      : 'rgba(255, 255, 255, 0.07)',
                    border: cat.id === activeCategory 
                      ? `1px solid ${colors.green}80` 
                      : '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Grade de posts com efeito glassmorphism */}
      <div className="container mx-auto px-4 pb-16">
        {error && (
          <div className="p-6 bg-red-800 rounded-lg mb-6">
            <h3 className="text-white font-semibold mb-2">Erro ao carregar artigos</h3>
            <p className="text-white opacity-90">{error}</p>
            <button 
              onClick={() => fetchArticles()}
              className="mt-4 px-4 py-2 bg-white text-red-800 rounded-md font-medium hover:bg-opacity-90 transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {filteredArticles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map((article) => (
              <Link 
                href={`/blog/${article.id}`} 
                key={article.id} 
                className="blog-clickable-element rounded-xl overflow-hidden transform transition-all duration-300 h-full"
                style={{ 
                  backgroundColor: 'rgba(26, 32, 44, 0.7)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
                }}
              >
                <div className="relative h-48 overflow-hidden">
                  <div 
                    className="absolute inset-0 bg-cover bg-center" 
                    style={{ 
                      backgroundImage: article.imagem_url 
                        ? `url('${article.imagem_url}')` 
                        : `url('https://source.unsplash.com/random/600x400?nature,technology&sig=${article.id}')`,
                      filter: 'brightness(0.85) saturate(1.2)'
                    }}
                  />
                  <div 
                    className="absolute inset-0" 
                    style={{ 
                      background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 70%)',
                    }}
                  />
                  <div className="absolute top-3 left-3">
                    <span 
                      className="px-2 py-1 text-xs font-medium rounded-md"
                      style={{ 
                        backgroundColor: colors.green + 'e6',
                        color: '#121212'
                      }}
                    >
                      {article.categoria}
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-semibold mb-2">
                    {article.titulo}
                  </h3>
                  <p className="text-gray-400 text-sm mb-4">
                    {article.resumo}
                  </p>
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center">
                      <div 
                        className="h-8 w-8 rounded-full bg-cover bg-center mr-2" 
                        style={{ 
                          backgroundImage: article.autor_avatar 
                            ? `url('${article.autor_avatar}')` 
                            : `url('https://source.unsplash.com/random/100x100?portrait&sig=${article.id}')`,
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                        }}
                      />
                      <span className="text-sm text-gray-400">{article.autor_nome}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatDate(article.data_criacao)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg p-10 text-center">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-16 w-16 mx-auto mb-4 text-gray-600" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
            <h3 className="text-xl font-medium text-gray-300 mb-2">Nenhum artigo encontrado</h3>
            <p className="text-gray-500 mb-6">
              {activeCategory !== 'todos' 
                ? 'Não há artigos publicados nesta categoria ainda.' 
                : 'Não há artigos publicados ainda.'}
            </p>
            <Link 
              href="/dashboard/blog/novo" 
              className="px-4 py-2 rounded-md text-sm font-medium"
              style={{ 
                background: `linear-gradient(135deg, ${colors.green}ee, ${colors.blue}ee)`,
                color: '#121212',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.15)'
              }}
            >
              Criar um artigo
            </Link>
          </div>
        )}

        {/* Botão de carregar mais */}
        {filteredArticles.length > 0 && (
          <div className="mt-10 text-center">
            <button 
              className="px-6 py-2.5 rounded-lg text-sm font-semibold blog-clickable-element"
              style={{ 
                backgroundColor: 'rgba(26, 32, 44, 0.7)',
                border: `1px solid ${colors.green}50`,
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)'
              }}
            >
              Carregar Mais Artigos
            </button>
          </div>
        )}
      </div>

      {/* Footer com elementos naturais */}
      <footer 
        className="border-t relative overflow-hidden" 
        style={{ 
          backgroundColor: 'rgba(26, 32, 44, 0.98)',
          borderColor: 'rgba(255, 255, 255, 0.05)'
        }}
      >
        {/* Elemento decorativo */}
        <div className="absolute -bottom-10 right-0 opacity-10">
          <svg width="300" height="300" viewBox="0 0 24 24" fill={colors.green}>
            <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z" />
          </svg>
        </div>
        
        <div className="container mx-auto px-4 py-10">
          <div className="flex flex-col md:flex-row justify-between">
            <div className="mb-8 md:mb-0">
              <div className="flex items-center mb-4">
                <img 
                  src="/images/logo/magnificencia-green-full-logo.png" 
                  alt="MagnifiGreen Logo" 
                  className="h-10 mr-2"
                />
                <div>
                  <h3 className="text-xl font-semibold gradient-text">MAGNIFIGREEN</h3>
                  <p className="text-sm text-gray-400">Blog Sustentável & Tecnológico</p>
                </div>
              </div>
              <p className="text-gray-400 text-sm max-w-md">
                Conectando inovação, sustentabilidade e tecnologia para construir um futuro mais verde e consciente.
              </p>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500 text-sm mb-4 md:mb-0">
              &copy; {new Date().getFullYear()} MagnifiGreen. Todos os direitos reservados.
            </p>
            <div className="flex space-x-4">
              <a 
                href="#" 
                className="text-gray-400 hover:text-white transition-colors blog-clickable-element"
              >
                <span className="sr-only">Instagram</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 