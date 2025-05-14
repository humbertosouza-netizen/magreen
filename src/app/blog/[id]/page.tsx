'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
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

interface Comment {
  id: number;
  author: string;
  authorAvatar: string;
  date: string;
  content: string;
  likes: number;
}

export default function ArticlePage() {
  const params = useParams();
  const articleId = params.id;
  
  const [article, setArticle] = useState<Article | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);

  useEffect(() => {
    fetchArticle();
  }, [articleId]);

  // Função para buscar artigo do Supabase
  async function fetchArticle() {
    try {
      setLoading(true);
      setError(null);
      
      if (!articleId) {
        setError('ID do artigo não encontrado');
        return;
      }

      // Buscar artigo
      const { data: articleData, error: articleError } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('id', articleId)
        .single();
      
      if (articleError) {
        console.error('Erro ao buscar artigo:', articleError);
        setError('Artigo não encontrado');
        return;
      }
      
      // Buscar autor
      let autorNome = 'Usuário';
      let autorAvatar = '';
      
      if (articleData.autor_id) {
        const { data: authorData } = await supabase
          .from('profiles')
          .select('nome_completo, avatar_url')
          .eq('id', articleData.autor_id)
          .single();
          
        if (authorData) {
          autorNome = authorData.nome_completo || 'Usuário';
          autorAvatar = authorData.avatar_url || '';
        }
      }

      // Definir valores locais para exibição imediata
      const currentViews = articleData.visualizacoes || 0;
      const displayViews = currentViews + 1;
      
      // Processar o artigo com contagem atualizada para exibição imediata
      setArticle({
        id: articleData.id,
        titulo: articleData.titulo,
        resumo: articleData.resumo,
        conteudo: articleData.conteudo,
        categoria: articleData.categoria,
        tags: articleData.tags || [],
        imagem_url: articleData.imagem_url,
        publicado: articleData.publicado,
        autor_id: articleData.autor_id,
        autor_nome: autorNome,
        autor_avatar: autorAvatar,
        data_criacao: articleData.data_criacao,
        data_atualizacao: articleData.data_atualizacao,
        data_publicacao: articleData.data_publicacao,
        visualizacoes: displayViews, // Visualizações incrementadas localmente para exibição imediata
        comentarios_count: 0
      });
      
      // Buscar comentários para este artigo
      fetchComments(articleData.id);
      
      // Incrementar visualização via API do servidor
      // (executado após carregar o artigo para não bloquear a exibição)
      fetch('/api/increment-view', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: articleId
        }),
      }).catch(err => {
        // Erro silencioso - não afeta a experiência do usuário
        console.log('Nota: visualização registrada apenas localmente');
      });
      
      // Buscar artigos relacionados
      const { data: relatedData, error: relatedError } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('publicado', true)
        .neq('id', articleId)
        .eq('categoria', articleData.categoria)
        .limit(3);
      
      if (relatedError) {
        console.error('Erro ao buscar artigos relacionados:', relatedError);
      } else {
        // Processar artigos relacionados
        const processedRelated = await Promise.all(
          relatedData.map(async (post) => {
            let postAutorNome = 'Usuário';
            let postAutorAvatar = '';
            
            if (post.autor_id) {
              const { data: authorData } = await supabase
                .from('profiles')
                .select('nome_completo, avatar_url')
                .eq('id', post.autor_id)
                .single();
                
              if (authorData) {
                postAutorNome = authorData.nome_completo || 'Usuário';
                postAutorAvatar = authorData.avatar_url || '';
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
              autor_nome: postAutorNome,
              autor_avatar: postAutorAvatar,
              data_criacao: post.data_criacao,
              data_atualizacao: post.data_atualizacao,
              data_publicacao: post.data_publicacao,
              visualizacoes: post.visualizacoes || 0,
              comentarios_count: 0
            };
          })
        );
        
        setRelatedArticles(processedRelated);
      }
      
    } catch (err: any) {
      console.error('Erro ao buscar artigo:', err);
      setError(err.message || 'Erro ao carregar artigo');
    } finally {
      setLoading(false);
    }
  }

  // Função para buscar comentários do artigo
  async function fetchComments(postId: string) {
    try {
      // Buscar comentários
      const { data, error } = await supabase
        .from('blog_comentarios')
        .select('*')
        .eq('post_id', postId)
        .eq('aprovado', true)
        .order('data_criacao', { ascending: false });
      
      if (error) {
        console.error('Erro ao buscar comentários:', error);
        return;
      }
      
      if (!data) {
        console.error('Erro ao buscar comentários: Dados não retornados');
        return;
      }
      
      // Formatar os comentários para o formato usado pelo componente
      const processedComments = await Promise.all(data.map(async (comment) => {
        // Buscar informações do autor para cada comentário
        let authorName = 'Usuário';
        let authorAvatar = '/avatars/default.jpg';
        
        if (comment.autor_id) {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('nome_completo, avatar_url')
            .eq('id', comment.autor_id)
            .single();
          
          if (profileError) {
            console.log('Erro ao buscar perfil do autor:', profileError);
          } else if (profileData) {
            authorName = profileData.nome_completo || 'Usuário';
            authorAvatar = profileData.avatar_url || '/avatars/default.jpg';
          }
        }
        
        return {
          id: comment.id,
          author: authorName,
          authorAvatar: authorAvatar,
          date: comment.data_criacao,
          content: comment.conteudo,
          likes: comment.likes || 0 // Usar likes se existir, senão 0
        };
      }));
      
      setComments(processedComments);
    } catch (err) {
      console.error('Erro ao buscar comentários:', err);
    }
  }

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('pt-BR', options);
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    
    try {
      // Verificar se o usuário está autenticado
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('Erro ao verificar usuário:', authError);
        alert('Ocorreu um erro ao verificar sua autenticação. Tente novamente.');
        return;
      }
      
      if (!user) {
        alert('Você precisa estar logado para comentar.');
        return;
      }
      
      // Obter informações do perfil do usuário
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('nome_completo, avatar_url')
        .eq('id', user.id)
        .single();
      
      if (profileError && profileError.code !== 'PGRST116') {
        console.log('Aviso ao buscar perfil:', profileError);
      }
      
      const userName = profileData?.nome_completo || user.email?.split('@')[0] || 'Usuário';
      const userAvatar = profileData?.avatar_url || '/avatars/default.jpg';
      
      // Verificar se a tabela blog_comentarios existe
      const { error: tableExistsError } = await supabase
        .from('blog_comentarios')
        .select('id')
        .limit(1);
        
      if (tableExistsError && tableExistsError.code === '42P01') {
        console.error('Tabela blog_comentarios não existe:', tableExistsError);
        // Tentar criar a tabela
        const createTableSQL = `
          CREATE TABLE IF NOT EXISTS blog_comentarios (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
            autor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            conteudo TEXT NOT NULL,
            data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            aprovado BOOLEAN DEFAULT true,
            likes INTEGER DEFAULT 0
          );
        `;
        
        try {
          // Note: isso só funciona se o usuário tiver permissões de administrador no Supabase
          // Na prática, você deve criar essa tabela manualmente no Supabase
          await supabase.rpc('execute_sql', { sql: createTableSQL });
          console.log('Tabela blog_comentarios criada com sucesso');
        } catch (createError) {
          console.error('Erro ao criar tabela blog_comentarios:', createError);
          alert('Não foi possível criar a estrutura necessária para comentários. Por favor, contate o administrador.');
          return;
        }
      }
      
      // Criar objeto de comentário para inserção com valores padrão seguros
      const commentObject = {
        post_id: articleId,
        autor_id: user.id,
        conteudo: commentText,
        aprovado: true, 
        data_criacao: new Date().toISOString(),
        likes: 0
      };
      
      // Adicionar comentário no banco de dados
      const { data, error } = await supabase
        .from('blog_comentarios')
        .insert(commentObject)
        .select('id, data_criacao');
      
      if (error) {
        console.error('Erro ao salvar comentário:', error);
        
        if (error.code === '42P01') {
          alert('A estrutura de comentários não está configurada. Por favor, contate o administrador.');
        } else {
          alert('Erro ao enviar comentário. Tente novamente mais tarde.');
        }
        return;
      }
      
      if (!data || data.length === 0) {
        console.error('Erro ao salvar comentário: Dados não retornados');
        alert('Erro ao processar seu comentário. Tente novamente.');
        return;
      }
      
      // Adicionar o novo comentário à lista de comentários exibida
    const newComment = {
        id: data[0].id,
        author: userName,
        authorAvatar: userAvatar,
        date: data[0].data_criacao,
      content: commentText,
      likes: 0,
    };
    
      // Atualizar contador de comentários no post (usando uma função segura)
      try {
        await supabase.rpc('increment_comment_count', { post_id: articleId });
      } catch (counterError) {
        console.warn('Não foi possível atualizar o contador de comentários:', counterError);
        // Não impede o fluxo principal
      }
      
      // Adicionar o novo comentário no topo da lista (comentários mais recentes primeiro)
      setComments([newComment, ...comments]);
    setCommentText('');
    } catch (err) {
      console.error('Erro ao enviar comentário:', err);
      alert('Ocorreu um erro ao enviar seu comentário. Tente novamente.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent" 
             style={{ borderColor: colors.green, borderTopColor: 'transparent' }}></div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center p-8 bg-gray-800 rounded-lg max-w-md">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-xl font-bold text-white mb-2">Artigo não encontrado</h2>
          <p className="text-gray-400 mb-6">O artigo que você está procurando não existe ou foi removido.</p>
          <Link 
            href="/blog"
            className="px-4 py-2 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            Voltar para o Blog
          </Link>
        </div>
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
              <Link 
                href="/blog"
                className="blog-clickable-element px-3 py-1.5 rounded text-sm font-medium"
                style={{ 
                  backgroundColor: 'rgba(26, 32, 44, 0.6)',
                  backdropFilter: 'blur(4px)',
                  border: '1px solid rgba(127, 219, 63, 0.3)'
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Voltar ao Blog
              </Link>
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
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo do artigo */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Coluna principal */}
          <div className="lg:w-2/3">
            {/* Breadcrumb */}
            <div className="mb-6 flex items-center text-sm text-gray-400">
              <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mx-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-gray-300">{article.categoria}</span>
            </div>
            
            {/* Categoria e data */}
            <div className="flex flex-wrap justify-between items-center mb-4">
              <span 
                className="px-3 py-1 text-xs font-medium rounded-md mb-2 sm:mb-0"
                style={{ 
                  backgroundColor: colors.green + 'e6',
                  color: '#121212'
                }}
              >
                {article.categoria}
              </span>
              <span className="text-sm text-gray-400">{formatDate(article.data_criacao)}</span>
            </div>
            
            {/* Título do artigo */}
            <h1 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">{article.titulo}</h1>
            
            {/* Autor */}
            <div className="flex items-center mb-8">
              <div 
                className="h-10 w-10 rounded-full bg-cover bg-center mr-3" 
                style={{ 
                  backgroundImage: article.autor_avatar 
                    ? `url('${article.autor_avatar}')` 
                    : `url('https://source.unsplash.com/random/100x100?portrait&sig=${article.id}')`,
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              />
              <div>
                <div className="text-sm font-medium text-white">{article.autor_nome}</div>
                <div className="text-xs text-gray-400">Autor</div>
              </div>
            </div>
            
            {/* Imagem em destaque */}
            {article.imagem_url && (
              <div className="relative h-64 md:h-96 mb-8 rounded-xl overflow-hidden">
                <div 
                  className="absolute inset-0 bg-cover bg-center" 
                  style={{ 
                    backgroundImage: `url('${article.imagem_url}')`,
                    filter: 'brightness(0.9) saturate(1.1)'
                  }}
                />
                <div 
                  className="absolute inset-0" 
                  style={{ 
                    background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 70%)',
                  }}
                />
              </div>
            )}
            
            {/* Conteúdo do artigo */}
            <div 
              className="prose prose-invert prose-lg max-w-none mb-10 article-content"
              style={{
                color: '#E2E8F0'
              }}
              dangerouslySetInnerHTML={{ __html: article.conteudo }}
            />
            
            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-10">
              {article.tags.map((tag, index) => (
                <span 
                  key={index} 
                  className="text-sm py-1 px-3 rounded-full bg-gray-800 text-gray-300"
                >
                  #{tag}
                </span>
              ))}
            </div>
            
            {/* Separador */}
            <div className="border-t border-gray-800 my-10"></div>
            
            {/* Seção de comentários */}
            <div className="bg-gray-800 rounded-xl p-6" style={{ 
              backgroundColor: 'rgba(26, 32, 44, 0.7)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              <h3 className="text-xl font-bold mb-6">Comentários ({comments.length})</h3>
              
              {/* Formulário de comentário */}
              <form onSubmit={handleCommentSubmit} className="mb-8">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Escreva seu comentário..."
                  className="w-full px-4 py-3 rounded-lg text-white text-sm focus:outline-none focus:ring-1 min-h-[120px]"
                  style={{ 
                    backgroundColor: 'rgba(26, 32, 44, 0.5)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(4px)'
                  }}
                ></textarea>
                <div className="flex justify-end mt-3">
                  <button 
                    type="submit"
                    className="px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 touch-manipulation blog-clickable-element"
                    style={{ 
                      background: `linear-gradient(135deg, ${colors.green}ee, ${colors.blue}ee)`,
                      color: '#121212',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.15)'
                    }}
                    disabled={!commentText.trim()}
                  >
                    Enviar Comentário
                  </button>
                </div>
              </form>
              
              {/* Lista de comentários */}
              <div className="space-y-6">
                {comments.map(comment => (
                  <div key={comment.id} className="rounded-lg p-4" style={{ 
                    backgroundColor: 'rgba(26, 32, 44, 0.5)',
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                  }}>
                    <div className="flex items-center mb-3">
                      <div className="w-8 h-8 rounded-full bg-gray-600 overflow-hidden mr-3 flex items-center justify-center text-white">
                        {comment.author.charAt(0).toUpperCase()}
                      </div>
                      <div className="mr-auto">
                        <span className="text-sm font-medium text-white">{comment.author}</span>
                        <span className="text-xs text-gray-400 ml-2">{formatDate(comment.date)}</span>
                      </div>
                    </div>
                    <p className="text-gray-300 text-sm mb-3">{comment.content}</p>
                    <div className="flex items-center text-gray-400 text-xs">
                      <button className="flex items-center hover:text-white transition-colors blog-clickable-element">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                        </svg>
                        {comment.likes}
                      </button>
                      <button className="flex items-center ml-4 hover:text-white transition-colors blog-clickable-element">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                        Responder
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="lg:w-1/3 space-y-8 mt-8 lg:mt-0">
            {/* Artigos relacionados */}
            <div className="rounded-xl overflow-hidden" style={{ 
              backgroundColor: 'rgba(26, 32, 44, 0.7)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
            }}>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-4">Artigos Relacionados</h3>
              <div className="space-y-4">
                {relatedArticles.length > 0 ? relatedArticles.map(related => (
                    <Link 
                      key={related.id} 
                      href={`/blog/${related.id}`}
                      className="block border-b border-gray-700 pb-4 last:border-0 last:pb-0 hover:opacity-80 transition-opacity blog-clickable-element"
                    >
                      <div className="flex">
                        {related.imagem_url && (
                          <div 
                            className="h-16 w-16 rounded bg-gray-700 mr-3 bg-cover bg-center flex-shrink-0"
                            style={{ 
                              backgroundImage: `url('${related.imagem_url}')`,
                            }}
                          />
                        )}
                        <div>
                          <h4 className="text-sm font-medium text-white mb-1 line-clamp-2">
                            {related.titulo}
                      </h4>
                          <div className="flex items-center text-xs">
                            <span className="text-gray-400">{formatDate(related.data_criacao)}</span>
                            <span className="mx-2">•</span>
                            <span className="text-gray-400">{related.categoria}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                )) : (
                  <p className="text-gray-400 text-sm">Nenhum artigo relacionado encontrado.</p>
                )}
                </div>
              </div>
            </div>
            
            {/* Tags populares */}
            <div className="rounded-xl overflow-hidden" style={{ 
              backgroundColor: 'rgba(26, 32, 44, 0.7)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
            }}>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-4">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {article.tags.map((tag, index) => (
                <Link 
                      key={index}
                      href={`/blog?tag=${tag}`}
                      className="text-sm py-1 px-3 rounded-full bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors blog-clickable-element"
                      style={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.07)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      #{tag}
                </Link>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Estatísticas do artigo */}
            <div className="rounded-xl overflow-hidden" style={{ 
              backgroundColor: 'rgba(26, 32, 44, 0.7)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
            }}>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-4">Estatísticas</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Comentários</span>
                    <div className="flex items-center text-white">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                      {comments.length}
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Data de publicação</span>
                    <span className="text-white">{formatDate(article.data_criacao)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer com elementos naturais */}
      <footer 
        className="border-t relative overflow-hidden mt-16" 
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