'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import theme from '@/styles/theme';
import Link from 'next/link';
import { usePageState } from '@/hooks/usePageState';

export default function NovoBlogPost() {
  const router = useRouter();
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [titulo, setTitulo] = usePageState('blog_novo_titulo', '');
  const [resumo, setResumo] = usePageState('blog_novo_resumo', '');
  const [conteudo, setConteudo] = usePageState('blog_novo_conteudo', '');
  const [categoria, setCategoria] = usePageState('blog_novo_categoria', '');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = usePageState<string[]>('blog_novo_tags', []);
  const [imagemUrl, setImagemUrl] = usePageState('blog_novo_imagem_url', '');
  const [publicar, setPublicar] = usePageState('blog_novo_publicar', false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  const adicionarTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removerTag = (tagParaRemover: string) => {
    setTags(tags.filter(tag => tag !== tagParaRemover));
  };

  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      adicionarTag();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!titulo.trim() || !resumo.trim() || !conteudo.trim()) {
      setErro('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    try {
      setLoading(true);
      setErro('');

      if (!user || !user.id) {
        throw new Error('Usuário não autenticado. Faça login novamente.');
      }

      console.log('Iniciando criação do post com dados:', {
        titulo: titulo,
        resumo: resumo.substring(0, 20) + '...',
        categoria: categoria || 'Não definida',
        tags: tags,
        publicado: publicar
      });

      const postData = {
        titulo,
        resumo,
        conteudo,
        autor_id: user.id,
        categoria: categoria || 'Geral',
        tags: tags.length > 0 ? tags : [],
        imagem_url: imagemUrl || null,
        publicado: publicar,
        data_publicacao: publicar ? new Date().toISOString() : null
      };

      console.log('Enviando dados para o Supabase...');

      const { data, error } = await supabase
        .from('blog_posts')
        .insert(postData)
        .select();

      if (error) {
        console.error('Erro retornado pelo Supabase:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error('Nenhum dado retornado após a criação do post');
      }

      console.log('Post criado com sucesso:', data[0].id);
      
      // Limpar o estado após o envio bem-sucedido
      setTitulo('');
      setResumo('');
      setConteudo('');
      setCategoria('');
      setTags([]);
      setImagemUrl('');
      setPublicar(false);
      
      router.push('/dashboard/blog');
    } catch (error: any) {
      console.error('Erro ao criar post:', error);
      
      let mensagemErro = 'Ocorreu um erro ao salvar o post';
      
      if (error.message) {
        mensagemErro = error.message;
      } else if (error.details) {
        mensagemErro = `Erro: ${error.details}`;
      } else if (error.hint) {
        mensagemErro = `Dica: ${error.hint}`;
      }
      
      setErro(mensagemErro);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      {/* Fundo estilizado com padrão de folhas */}
      <div 
        className="absolute inset-0 z-0 opacity-5 pointer-events-none" 
        style={{
          backgroundImage: `url('/images/leaf-pattern-bg.svg')`,
          backgroundSize: '250px',
          backgroundRepeat: 'repeat',
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-10">
        <div 
          className="mb-8 relative overflow-hidden rounded-xl p-6"
          style={{
            background: `linear-gradient(135deg, ${theme.colors.primary}90, ${theme.colors.accent}70)`,
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
          }}
        >
          <div className="absolute inset-0 z-0 opacity-10" 
            style={{
              backgroundImage: `url('/images/leaf-pattern-bg.svg')`,
              backgroundSize: '100px',
              backgroundRepeat: 'repeat',
            }}
          />
          
          <div className="relative z-10 flex justify-between items-center">
            <h1 
              className="text-2xl md:text-3xl font-bold"
              style={{ 
                color: '#fff',
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
              }}
            >
              Novo Post
            </h1>
            
            <Link 
              href="/dashboard/blog"
              className="px-4 py-2 rounded-full shadow-sm text-sm font-medium"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                color: '#fff',
                backdropFilter: 'blur(4px)'
              }}
            >
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                Voltar
              </div>
            </Link>
          </div>
        </div>
        
        {erro && (
          <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5' }}>
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {erro}
            </div>
          </div>
        )}
        
        <div className="rounded-xl overflow-hidden" 
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
          }}
        >
          <form onSubmit={handleSubmit} className="p-6">
            <div className="mb-6">
              <label htmlFor="titulo" className="block text-sm font-medium mb-2" style={{ color: theme.colors.textSecondary }}>
                Título *
              </label>
              <input
                id="titulo"
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="w-full px-4 py-3 rounded-lg text-white"
                style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.07)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  outline: 'none',
                }}
                required
                placeholder="Digite o título do post"
              />
            </div>
            
            <div className="mb-6">
              <label htmlFor="resumo" className="block text-sm font-medium mb-2" style={{ color: theme.colors.textSecondary }}>
                Resumo *
              </label>
              <textarea
                id="resumo"
                rows={3}
                value={resumo}
                onChange={(e) => setResumo(e.target.value)}
                className="w-full px-4 py-3 rounded-lg text-white"
                style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.07)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  outline: 'none',
                }}
                required
                placeholder="Escreva um breve resumo do conteúdo"
              />
            </div>
            
            <div className="mb-6">
              <label htmlFor="conteudo" className="block text-sm font-medium mb-2" style={{ color: theme.colors.textSecondary }}>
                Conteúdo *
              </label>
              <textarea
                id="conteudo"
                rows={10}
                value={conteudo}
                onChange={(e) => setConteudo(e.target.value)}
                className="w-full px-4 py-3 rounded-lg text-white"
                style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.07)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  outline: 'none',
                }}
                required
                placeholder="Escreva o conteúdo completo do post"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label htmlFor="categoria" className="block text-sm font-medium mb-2" style={{ color: theme.colors.textSecondary }}>
                  Categoria
                </label>
                <input
                  id="categoria"
                  type="text"
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg text-white"
                  style={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.07)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    outline: 'none',
                  }}
                  placeholder="Ex: Cultivo, Ferramentas, Notícias"
                />
              </div>
              
              <div>
                <label htmlFor="imagem" className="block text-sm font-medium mb-2" style={{ color: theme.colors.textSecondary }}>
                  URL da Imagem de Capa
                </label>
                <input
                  id="imagem"
                  type="text"
                  value={imagemUrl}
                  onChange={(e) => setImagemUrl(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg text-white"
                  style={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.07)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    outline: 'none',
                  }}
                  placeholder="https://exemplo.com/imagem.jpg"
                />
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.textSecondary }}>
                Tags
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map((tag, index) => (
                  <span 
                    key={index}
                    className="px-3 py-1.5 rounded-full text-xs font-medium flex items-center"
                    style={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      color: theme.colors.textPrimary
                    }}
                  >
                    #{tag}
                    <button 
                      type="button"
                      onClick={() => removerTag(tag)}
                      className="ml-2 text-opacity-70 hover:text-opacity-100"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleTagKeyPress}
                  className="flex-grow px-4 py-3 rounded-l-lg text-white"
                  style={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.07)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    outline: 'none',
                  }}
                  placeholder="Digite uma tag e pressione Enter"
                />
                <button
                  type="button"
                  onClick={adicionarTag}
                  className="px-4 py-3 rounded-r-lg"
                  style={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    color: theme.colors.textPrimary
                  }}
                >
                  Adicionar
                </button>
              </div>
            </div>
            
            <div className="mb-8">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={publicar}
                  onChange={(e) => setPublicar(e.target.checked)}
                  className="sr-only"
                />
                <span className="relative inline-block w-10 h-5 rounded-full transition-colors duration-300 ease-in-out mr-3"
                  style={{ 
                    backgroundColor: publicar ? theme.colors.primary : 'rgba(255, 255, 255, 0.2)'
                  }}
                >
                  <span className="absolute inset-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform duration-300 ease-in-out"
                    style={{ 
                      transform: publicar ? 'translateX(1.25rem)' : 'translateX(0)'
                    }}
                  ></span>
                </span>
                <span style={{ color: theme.colors.textPrimary }}>
                  {publicar ? 'Publicar imediatamente' : 'Salvar como rascunho'}
                </span>
              </label>
            </div>
            
            <div className="flex justify-end space-x-3">
              <Link
                href="/dashboard/blog"
                className="px-4 py-2 rounded-full shadow-sm text-sm font-medium transition-all"
                style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: theme.colors.textPrimary
                }}
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 rounded-full shadow-sm text-sm font-medium transition-all transform hover:scale-105"
                style={{ 
                  background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.accent})`,
                  color: 'black',
                  fontWeight: 'bold',
                  boxShadow: '0 4px 10px rgba(127, 219, 63, 0.3)'
                }}
              >
                {loading ? 'Salvando...' : 'Salvar Post'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 