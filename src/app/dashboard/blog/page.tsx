'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { colors } from '@/styles/colors';
import { useUser } from '@/contexts/UserContext';
import { supabase } from '@/lib/supabase';
import theme from '@/styles/theme';
import { useRouter } from 'next/navigation';
import { usePageState } from '@/hooks/usePageState';

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

export default function DashboardBlogPage() {
  const { hasPermission, isAdmin, user } = useUser();
  const [activeTab, setActiveTab] = usePageState<'todos' | 'publicados' | 'rascunhos'>('blog_activeTab', 'todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (user) {
      fetchArticles();
    }
  }, [user, activeTab]);

  async function fetchArticles() {
    setLoading(true);
    setUpdating(true);
    setError(null);
    try {
      console.log("Iniciando busca de artigos...");
      
      if (!user) {
        throw new Error("Usuário não autenticado");
      }
      
      let query = supabase
        .from('blog_posts')
        .select('*')
        .order('data_criacao', { ascending: false });
      
      if (activeTab === 'publicados') {
        query = query.eq('publicado', true);
      } else if (activeTab === 'rascunhos') {
        query = query.eq('publicado', false);
      }
      
      if (!isAdmin) {
        query = query.eq('autor_id', user?.id);
      }
      
      const { data: posts, error } = await query;
      
      if (error) {
        console.error("Erro na consulta ao Supabase:", error);
        throw error;
      }
      
      console.log("Posts recuperados:", posts?.length || 0);
      
      if (!posts || posts.length === 0) {
        setArticles([]);
        setLoading(false);
        setUpdating(false);
        return;
      }
      
      const processedArticles = await Promise.all(
        posts.map(async (post) => {
          const safePost = {
            id: post.id || '',
            titulo: post.titulo || 'Sem título',
            resumo: post.resumo || '',
            conteudo: post.conteudo || '',
            categoria: post.categoria || '',
            tags: Array.isArray(post.tags) ? post.tags : [],
            imagem_url: post.imagem_url || '',
            publicado: Boolean(post.publicado),
            autor_id: post.autor_id || '',
            data_criacao: post.data_criacao || new Date().toISOString(),
            data_atualizacao: post.data_atualizacao || null,
            data_publicacao: post.data_publicacao || null,
            visualizacoes: typeof post.visualizacoes === 'number' ? post.visualizacoes : 0
          };
          
          let autorNome = 'Usuário';
          let autorAvatar = '';
          
          if (safePost.autor_id) {
            try {
              const { data: authorData } = await supabase
                .from('profiles')
                .select('nome_completo, avatar_url')
                .eq('id', safePost.autor_id)
                .single();
                
              if (authorData) {
                autorNome = authorData.nome_completo || 'Usuário';
                autorAvatar = authorData.avatar_url || '';
              }
            } catch (err) {
              console.log("Erro ao buscar dados do autor:", err);
            }
          }
          
          return {
            ...safePost,
            autor_nome: autorNome,
            autor_avatar: autorAvatar,
            comentarios_count: 0
          };
        })
      );
      
      setArticles(processedArticles);
    } catch (error: any) {
      console.error("Erro ao buscar artigos:", error);
      setError(error?.message || 'Erro ao carregar artigos');
      setArticles([]);
    } finally {
      setLoading(false);
      setUpdating(false);
    }
  }

  async function togglePublicacao(postId: string, currentStatus: boolean) {
    try {
      let updateData: any = { 
        publicado: !currentStatus 
      };
      
      if (!currentStatus) {
        updateData.data_publicacao = new Date().toISOString();
      }
      
      const { error } = await supabase
        .from('blog_posts')
        .update(updateData)
        .eq('id', postId)
        .eq('autor_id', user?.id);

      if (error) {
        throw error;
      }

      setArticles(articles.map(post => 
        post.id === postId 
          ? { ...post, publicado: !currentStatus, data_publicacao: !currentStatus ? new Date().toISOString() : post.data_publicacao } 
          : post
      ));
    } catch (error) {
      console.error('Erro ao atualizar publicação:', error);
    }
  }

  async function deletePost(postId: string) {
    try {
      if (!confirm("Tem certeza que deseja excluir este post?")) {
        return;
      }
      
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', postId)
        .eq('autor_id', user?.id);

      if (error) {
        throw error;
      }

      setArticles(articles.filter(post => post.id !== postId));
    } catch (error) {
      console.error('Erro ao excluir post:', error);
    }
  }

  function formatarData(dataString: string) {
    if (!dataString) return 'N/A';
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  return (
    <div className="relative">
      <div 
        className="absolute inset-0 z-0 opacity-5 pointer-events-none" 
        style={{
          backgroundImage: `url('/images/leaf-pattern-bg.svg')`,
          backgroundSize: '250px',
          backgroundRepeat: 'repeat',
        }}
      />

      <div className="absolute bottom-0 right-0 w-96 h-96 opacity-5 pointer-events-none z-0 hidden md:block">
        <div 
          className="w-full h-full"
          style={{
            backgroundImage: `url('/images/mayan-temple-background.png')`,
            backgroundSize: 'contain',
            backgroundPosition: 'bottom right',
            backgroundRepeat: 'no-repeat',
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-10">
        <div 
          className="mb-10 relative overflow-hidden rounded-xl p-8"
          style={{
            background: `linear-gradient(135deg, ${theme.colors.primary}90, ${theme.colors.accent}70)`,
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
          }}
        >
          <div 
            className="absolute inset-0 z-0 opacity-10" 
            style={{
              backgroundImage: `url('/images/leaf-pattern-bg.svg')`,
              backgroundSize: '100px',
              backgroundRepeat: 'repeat',
            }}
          />
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center">
            <div>
              <h1 
                className="text-3xl md:text-4xl font-bold mb-2"
                style={{ 
                  color: '#fff',
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                }}
              >
                Blog
              </h1>
              <p 
                className="text-lg"
                style={{ 
                  color: 'rgba(255, 255, 255, 0.9)',
                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
                }}
              >
                Gerenciar artigos e publicações
              </p>
            </div>
            
            <div className="flex items-center mt-4 md:mt-0 space-x-3">
              <button
                onClick={() => fetchArticles()}
                className="px-4 py-2 rounded-full flex items-center transition-all"
                style={{ 
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  backdropFilter: 'blur(4px)'
                }}
                disabled={updating}
              >
                {updating ? (
                  <>
                    <div className="animate-spin h-4 w-4 mr-2 border-2 border-white rounded-full border-t-transparent"></div>
                    Atualizando...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                    </svg>
                    Atualizar
                  </>
                )}
              </button>

              <Link
                href="/dashboard/blog/novo"
                className="px-6 py-3 rounded-full flex items-center justify-center transition-all transform hover:scale-105"
                style={{ 
                  background: `linear-gradient(135deg, #F8CC3C, #E3A507)`,
                  color: '#1F1F1F',
                  fontWeight: 'bold',
                  boxShadow: '0 4px 10px rgba(248, 204, 60, 0.3)'
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Novo Artigo
              </Link>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            <p className="text-red-400 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
              <button 
                className="ml-auto text-sm underline" 
                onClick={() => setError(null)}
              >
                Fechar
              </button>
            </p>
          </div>
        )}

        <div className="mb-6 rounded-xl overflow-hidden bg-opacity-10 backdrop-blur-sm" 
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
          }}
        >
          <div className="flex">
            <button
              className={`py-3 px-6 font-medium text-sm transition-all ${
                activeTab === 'todos'
                  ? 'text-white bg-opacity-20'
                  : 'text-gray-400 hover:text-white'
              }`}
              style={{ 
                borderBottom: activeTab === 'todos' ? `2px solid ${theme.colors.primary}` : 'none',
                background: activeTab === 'todos' ? 'rgba(255, 255, 255, 0.05)' : 'transparent' 
              }}
              onClick={() => setActiveTab('todos')}
            >
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                Todos os Posts
              </div>
            </button>
            <button
              className={`py-3 px-6 font-medium text-sm transition-all ${
                activeTab === 'publicados'
                  ? 'text-white bg-opacity-20'
                  : 'text-gray-400 hover:text-white'
              }`}
              style={{ 
                borderBottom: activeTab === 'publicados' ? `2px solid ${theme.colors.primary}` : 'none',
                background: activeTab === 'publicados' ? 'rgba(255, 255, 255, 0.05)' : 'transparent' 
              }}
              onClick={() => setActiveTab('publicados')}
            >
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                Publicados
              </div>
            </button>
            <button
              className={`py-3 px-6 font-medium text-sm transition-all ${
                activeTab === 'rascunhos'
                  ? 'text-white bg-opacity-20'
                  : 'text-gray-400 hover:text-white'
              }`}
              style={{ 
                borderBottom: activeTab === 'rascunhos' ? `2px solid ${theme.colors.primary}` : 'none',
                background: activeTab === 'rascunhos' ? 'rgba(255, 255, 255, 0.05)' : 'transparent' 
              }}
              onClick={() => setActiveTab('rascunhos')}
            >
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                  <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                </svg>
                Rascunhos
              </div>
            </button>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent" 
                style={{ borderColor: theme.colors.primary, borderTopColor: 'transparent' }}></div>
          </div>
        )}

        {!loading && articles.length === 0 && !error && (
          <></>
        )}

        {articles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {articles.map(article => (
              <div key={article.id} className="rounded-xl overflow-hidden transition-all hover:shadow-xl"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
                }}>
                {article.imagem_url ? (
                  <div className="h-48 overflow-hidden">
                    <Link 
                      href={`/dashboard/blog/editar/${article.id}`}
                      className="block h-full w-full blog-clickable-element"
                      style={{ touchAction: "manipulation" }}
                    >
                      <div 
                        className="w-full h-full bg-center bg-cover transition-transform hover:scale-105" 
                        style={{ 
                          backgroundImage: `url(${article.imagem_url})`,
                          backgroundColor: 'rgba(109, 190, 78, 0.1)' 
                        }}
                      ></div>
                    </Link>
                  </div>
                ) : (
                  <div className="h-48 flex items-center justify-center"
                    style={{
                      background: `linear-gradient(135deg, ${theme.colors.primary}30, ${theme.colors.accent}30)`,
                    }}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1" style={{ color: theme.colors.primary }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                    </svg>
                  </div>
                )}
                
                <div className="p-5">
                  <div className="flex justify-between items-center mb-3">
                    <span 
                      className="px-2 py-1 text-xs rounded-full"
                      style={{ backgroundColor: theme.colors.primary + '30', color: theme.colors.textPrimary }}
                    >
                      {article.categoria}
                    </span>
                    <span className="text-xs" style={{ color: theme.colors.textSecondary }}>{formatarData(article.data_criacao)}</span>
                  </div>
                  
                  <h3 className="text-lg font-semibold mb-2 transition-colors" style={{ color: theme.colors.textPrimary }}>
                    {article.titulo}
                    {!article.publicado && (
                      <span className="ml-2 px-2 py-0.5 text-xs rounded-full" style={{ backgroundColor: '#F8CC3C', color: '#1F1F1F' }}>
                        Rascunho
                      </span>
                    )}
                  </h3>
                  <p className="text-sm mb-4 line-clamp-3" style={{ color: theme.colors.textSecondary }}>{article.resumo}</p>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {article.tags && article.tags.map((tag, index) => (
                      <span 
                        key={index} 
                        className="text-xs py-1 px-2 rounded-full"
                        style={{ backgroundColor: 'rgba(255, 255, 255, 0.07)', color: theme.colors.textSecondary }}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex justify-between items-center pt-3 border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full overflow-hidden mr-2 flex items-center justify-center" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', color: theme.colors.textPrimary }}>
                        {article.autor_nome ? article.autor_nome.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <span className="text-sm" style={{ color: theme.colors.textSecondary }}>{article.autor_nome || 'Usuário'}</span>
                    </div>
                    <div className="flex items-center">
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className="h-5 w-5 mr-1" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                        style={{ color: theme.colors.textSecondary }}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span className="text-sm" style={{ color: theme.colors.textSecondary }}>{article.visualizacoes || 0}</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-3 flex justify-between items-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}>
                  {isAdmin || (user && user.id === article.autor_id) ? (
                    <div className="flex space-x-2">
                      <Link 
                        href={`/dashboard/blog/editar/${article.id}`}
                        className="text-xs hover:text-white transition-colors flex items-center blog-clickable-element"
                        style={{ color: theme.colors.textSecondary, touchAction: "manipulation", minHeight: "36px" }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                        Editar
                      </Link>
                      {isAdmin && (
                        <button 
                          className={`text-xs blog-clickable-element transition-colors flex items-center`}
                          onClick={() => deletePost(article.id)}
                          disabled={deleting === article.id}
                          style={{ 
                            color: deleting === article.id ? theme.colors.textSecondary : theme.colors.error,
                            touchAction: "manipulation", 
                            minHeight: "36px" 
                          }}
                        >
                          {deleting === article.id ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-2 border-t-transparent mr-1" 
                                  style={{ borderColor: theme.colors.error, borderTopColor: 'transparent' }}></div>
                              Excluindo...
                            </>
                          ) : (
                            <>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              Excluir
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  ) : (
                    <div></div>
                  )}
                  <div className="flex space-x-2">
                    {article.publicado && (
                      <Link 
                        href={`/blog/${article.id}`}
                        className="text-xs px-3 py-1 rounded-full text-white transition-colors blog-clickable-element"
                        style={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          touchAction: "manipulation", 
                          minHeight: "36px" 
                        }}
                      >
                        Ver Publicado
                      </Link>
                    )}
                    <Link 
                      href={`/dashboard/blog/editar/${article.id}`}
                      className="text-xs px-3 py-1 rounded-full blog-clickable-element"
                      style={{ 
                        background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.accent})`,
                        color: 'black',
                        fontWeight: 'bold',
                        touchAction: "manipulation",
                        minHeight: "36px" 
                      }}
                    >
                      {isAdmin 
                        ? (article.publicado ? 'Gerenciar' : 'Continuar Editando')
                        : 'Visualizar'
                      }
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 rounded-xl overflow-hidden" 
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
            }}>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-20 w-20 mx-auto mb-6" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
              style={{ color: theme.colors.textSecondary }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
            {activeTab === 'todos' && searchQuery === '' ? (
              <>
                <h2 className="text-2xl font-semibold mb-3" style={{ color: theme.colors.textPrimary }}>Nenhum artigo encontrado</h2>
                <p className="text-lg mb-8" style={{ color: theme.colors.textSecondary }}>
                  {activeTab === 'todos' 
                  ? 'Você ainda não possui nenhum artigo. Comece criando seu primeiro artigo.'
                  : activeTab === 'publicados'
                    ? 'Você ainda não publicou nenhum artigo.'
                    : 'Você não possui nenhum rascunho de artigo.'}
                </p>
                {isAdmin && (
                  <Link
                    href="/dashboard/blog/novo"
                    className="px-6 py-3 rounded-full transition-all transform hover:scale-105"
                    style={{ 
                      background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.accent})`,
                      color: 'black',
                      fontWeight: 'bold',
                      boxShadow: '0 4px 15px rgba(127, 219, 63, 0.4)',
                      touchAction: "manipulation"
                    }}
                  >
                    Criar Primeiro Artigo
                  </Link>
                )}
              </>
            ) : (
              <>
                <h2 className="text-2xl font-semibold mb-3" style={{ color: theme.colors.textPrimary }}>Nenhum artigo encontrado</h2>
                <p className="text-lg mb-8" style={{ color: theme.colors.textSecondary }}>Não encontramos artigos com os filtros aplicados.</p>
                <button 
                  onClick={() => {
                    setActiveTab('todos');
                    setSearchQuery('');
                  }}
                  className="px-6 py-3 rounded-full shadow-sm text-sm font-medium transition-all"
                  style={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    color: theme.colors.textPrimary,
                    touchAction: "manipulation"
                  }}
                >
                  Limpar filtros
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 