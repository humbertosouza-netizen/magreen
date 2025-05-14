'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { isUserAdmin } from '@/lib/permissions';
import Link from 'next/link';

interface BlogPost {
  id: string;
  titulo: string;
  resumo: string;
  conteudo: string;
  autor_id: string;
  categoria: string;
  tags: string[];
  imagem_url?: string;
  publicado: boolean;
  data_criacao: string;
  data_publicacao?: string;
  data_atualizacao: string;
  autor_nome?: string;
}

export default function AdminBlogPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const supabase = createClientComponentClient();

  useEffect(() => {
    // Detectar se é dispositivo móvel
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Verificar inicialmente
    checkMobile();

    // Adicionar listener para redimensionamento
    window.addEventListener('resize', checkMobile);

    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    async function checkAdmin() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push('/login');
        return;
      }
      
      const isAdmin = await isUserAdmin(session.user);
      if (!isAdmin) {
        router.push('/dashboard');
        return;
      }
      
      fetchPosts();
    }

    checkAdmin();
  }, [router, supabase]);

  async function fetchPosts() {
    try {
      setLoading(true);
      setError(null);
      
      const { data: posts, error: postsError } = await supabase
        .from('blog_posts')
        .select(`
          *,
          profiles(nome_completo)
        `)
        .order('data_criacao', { ascending: false });

      if (postsError) {
        throw new Error('Erro ao buscar posts: ' + postsError.message);
      }

      // Formatar os posts com o nome do autor
      const formattedPosts = posts.map(post => ({
        ...post,
        autor_nome: post.profiles?.nome_completo || 'Usuário desconhecido'
      }));

      setPosts(formattedPosts);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function togglePublicacao(postId: string, currentStatus: boolean) {
    try {
      setError(null);
      setSuccess(null);
      
      const updates = {
        publicado: !currentStatus,
        data_publicacao: !currentStatus ? new Date().toISOString() : null
      };
      
      const { error } = await supabase
        .from('blog_posts')
        .update(updates)
        .eq('id', postId);
        
      if (error) throw new Error('Erro ao atualizar post: ' + error.message);
      
      setSuccess(`Post ${!currentStatus ? 'publicado' : 'despublicado'} com sucesso!`);
      fetchPosts(); // Atualizar lista
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function deletePost(postId: string) {
    if (!confirm('Tem certeza que deseja excluir este post? Esta ação não pode ser desfeita.')) {
      return;
    }
    
    try {
      setError(null);
      setSuccess(null);
      
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', postId);
        
      if (error) throw new Error('Erro ao excluir post: ' + error.message);
      
      setSuccess('Post excluído com sucesso!');
      fetchPosts(); // Atualizar lista
    } catch (err: any) {
      setError(err.message);
    }
  }

  // Renderização de cartões para layout mobile
  const renderMobileCards = () => {
    if (posts.length === 0) {
      return (
        <div className="text-center p-4 bg-gray-50 rounded">
          <p className="text-gray-500">
            Nenhum post encontrado. Clique em "Novo Post" para criar o primeiro!
          </p>
        </div>
      );
    }

    return posts.map(post => (
      <div key={post.id} className="bg-white border rounded-lg p-4 mb-4 shadow-sm">
        <h3 className="font-medium text-lg mb-2">{post.titulo}</h3>
        
        <div className="flex flex-wrap gap-2 mb-3">
          <span className="px-2 py-1 bg-gray-100 rounded text-xs">
            {post.categoria}
          </span>
          <span className={`px-2 py-1 rounded text-xs ${post.publicado ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
            {post.publicado ? 'Publicado' : 'Rascunho'}
          </span>
        </div>
        
        <div className="text-sm text-gray-600 mb-3">
          <p>Autor: {post.autor_nome}</p>
          <p>Data: {post.publicado 
            ? new Date(post.data_publicacao || post.data_criacao).toLocaleDateString('pt-BR')
            : new Date(post.data_criacao).toLocaleDateString('pt-BR')}
          </p>
        </div>
        
        <div className="grid grid-cols-3 gap-2">
          <Link 
            href={`/admin/blog/editar/${post.id}`}
            className="bg-blue-500 text-white py-2 px-4 rounded text-center text-sm hover:bg-blue-600"
          >
            Editar
          </Link>
          
          <button 
            onClick={() => togglePublicacao(post.id, post.publicado)}
            className={`py-2 px-4 rounded text-center text-sm ${
              post.publicado 
                ? 'bg-yellow-500 text-white hover:bg-yellow-600' 
                : 'bg-green-500 text-white hover:bg-green-600'
            }`}
          >
            {post.publicado ? 'Despublicar' : 'Publicar'}
          </button>
          
          <button 
            onClick={() => deletePost(post.id)}
            className="bg-red-500 text-white py-2 px-4 rounded text-center text-sm hover:bg-red-600"
          >
            Excluir
          </button>
        </div>
      </div>
    ));
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6 relative z-10">
        <h1 className="text-2xl font-bold">Gerenciamento de Posts do Blog</h1>
        <Link 
          href="/admin/blog/novo"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 blog-clickable-element"
          style={{ touchAction: "manipulation" }}
        >
          Novo Post
        </Link>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}
      
      {loading ? (
        <p>Carregando posts...</p>
      ) : isMobile ? (
        <div className="mt-4">
          {renderMobileCards()}
        </div>
      ) : (
        <div className="overflow-x-auto relative z-10">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 text-left">Título</th>
                <th className="px-4 py-2 text-left">Categoria</th>
                <th className="px-4 py-2 text-left">Autor</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Data</th>
                <th className="px-4 py-2 text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {posts.map(post => (
                <tr key={post.id} className="border-t border-gray-200">
                  <td className="px-4 py-2 font-medium">{post.titulo}</td>
                  <td className="px-4 py-2">
                    <span className="px-2 py-1 bg-gray-100 rounded text-sm">
                      {post.categoria}
                    </span>
                  </td>
                  <td className="px-4 py-2">{post.autor_nome}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded text-sm ${post.publicado ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {post.publicado ? 'Publicado' : 'Rascunho'}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    {post.publicado 
                      ? new Date(post.data_publicacao || post.data_criacao).toLocaleDateString('pt-BR')
                      : new Date(post.data_criacao).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-2 flex justify-center space-x-2">
                    <Link 
                      href={`/admin/blog/editar/${post.id}`}
                      className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 blog-clickable-element"
                      style={{ touchAction: "manipulation", minHeight: "36px", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                    >
                      Editar
                    </Link>
                    
                    <button 
                      onClick={() => togglePublicacao(post.id, post.publicado)}
                      className={`px-3 py-1 rounded text-sm blog-clickable-element ${
                        post.publicado 
                          ? 'bg-yellow-500 text-white hover:bg-yellow-600' 
                          : 'bg-green-500 text-white hover:bg-green-600'
                      }`}
                      style={{ touchAction: "manipulation", minHeight: "36px", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                    >
                      {post.publicado ? 'Despublicar' : 'Publicar'}
                    </button>
                    
                    <button 
                      onClick={() => deletePost(post.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 blog-clickable-element"
                      style={{ touchAction: "manipulation", minHeight: "36px", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
              
              {posts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-4 text-center text-gray-500">
                    Nenhum post encontrado. Clique em "Novo Post" para criar o primeiro!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 