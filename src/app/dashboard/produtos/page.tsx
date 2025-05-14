'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/contexts/UserContext';
import theme from '@/styles/theme';

// Interface para produtos
interface Produto {
  id: string;
  nome: string;
  descricao: string;
  valor: number;
  imagem_url?: string;
  link_checkout?: string;
  ativo: boolean;
  created_at: string;
}

export default function ProdutosPage() {
  const { user, isAdmin } = useUser();
  const [loading, setLoading] = useState(true);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [currentProduto, setCurrentProduto] = useState<Produto | null>(null);
  const router = useRouter();

  // Form states
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [imagemUrl, setImagemUrl] = useState('');
  const [linkCheckout, setLinkCheckout] = useState('');
  const [ativo, setAtivo] = useState(true);

  useEffect(() => {
    async function loadProdutos() {
      try {
        // Verificar autenticação
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          router.push('/login');
          return;
        }
        
        // Recuperar estado do localStorage
        const savedShowModal = localStorage.getItem('produtos_showModal');
        const savedCurrentProduto = localStorage.getItem('produtos_currentProduto');
        
        if (savedShowModal) {
          setShowModal(savedShowModal === 'true');
        }
        
        if (savedCurrentProduto) {
          try {
            const produto = JSON.parse(savedCurrentProduto);
            setCurrentProduto(produto);
            
            // Restaurar estados do formulário
            setNome(produto.nome);
            setDescricao(produto.descricao);
            setValor(produto.valor.toString());
            setImagemUrl(produto.imagem_url || '');
            setLinkCheckout(produto.link_checkout || '');
            setAtivo(produto.ativo);
          } catch (error) {
            console.error('Erro ao recuperar produto do localStorage:', error);
          }
        }
        
        // Buscar produtos do Supabase
        const { data: produtosData, error } = await supabase
          .from('cultivo_produtos_loja')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setProdutos(produtosData || []);
      } catch (error) {
        console.error('Erro ao carregar produtos:', error);
      } finally {
        setLoading(false);
      }
    }

    loadProdutos();
  }, [router]);
  
  // Salvar estado no localStorage quando mudar
  useEffect(() => {
    if (showModal !== undefined) {
      localStorage.setItem('produtos_showModal', showModal.toString());
    }
    
    if (currentProduto) {
      localStorage.setItem('produtos_currentProduto', JSON.stringify(currentProduto));
    } else {
      localStorage.removeItem('produtos_currentProduto');
    }
  }, [showModal, currentProduto]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validação básica
      if (!nome.trim()) {
        alert('O nome do produto é obrigatório');
        return;
      }
      
      if (!valor || isNaN(parseFloat(valor)) || parseFloat(valor) <= 0) {
        alert('Insira um valor válido para o produto');
        return;
      }
      
      const produtoData = {
        nome,
        descricao,
        valor: parseFloat(valor),
        imagem_url: imagemUrl,
        link_checkout: linkCheckout,
        ativo
      };
      
      if (currentProduto) {
        // Atualizar produto existente no Supabase
        const { error } = await supabase
          .from('cultivo_produtos_loja')
          .update(produtoData)
          .eq('id', currentProduto.id);
          
        if (error) {
          console.error('Erro detalhado ao atualizar produto:', JSON.stringify(error));
          throw error;
        }
        
        // Atualizar estado local após confirmação do Supabase
        setProdutos(produtos.map(p => p.id === currentProduto.id ? {...p, ...produtoData, id: currentProduto.id} : p));
      } else {
        // Criar novo produto no Supabase
        const { data, error } = await supabase
          .from('cultivo_produtos_loja')
          .insert(produtoData)
          .select();
          
        if (error) {
          console.error('Erro detalhado ao inserir produto:', JSON.stringify(error));
          throw error;
        }
        
        // Atualizar estado local após confirmação do Supabase
        if (data && data.length > 0) {
          setProdutos([data[0], ...produtos]);
        }
      }
      
      resetForm();
      setShowModal(false);
      
    } catch (error: any) {
      console.error('Erro ao salvar produto:', JSON.stringify(error));
      alert(`Ocorreu um erro ao salvar o produto: ${error?.message || 'Erro desconhecido'}`);
    }
  };

  const handleEdit = (produto: Produto) => {
    setCurrentProduto(produto);
    setNome(produto.nome);
    setDescricao(produto.descricao);
    setValor(produto.valor.toString());
    setImagemUrl(produto.imagem_url || '');
    setLinkCheckout(produto.link_checkout || '');
    setAtivo(produto.ativo);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) {
      return;
    }
    
    try {
      // Excluir produto do Supabase
      const { error } = await supabase
        .from('cultivo_produtos_loja')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      // Atualizar estado local após confirmação do Supabase
      setProdutos(produtos.filter(p => p.id !== id));
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
      alert('Ocorreu um erro ao excluir o produto.');
    }
  };

  const toggleAtivo = async (id: string, novoStatus: boolean) => {
    try {
      // Atualizar status do produto no Supabase
      const { error } = await supabase
        .from('cultivo_produtos_loja')
        .update({ ativo: novoStatus })
        .eq('id', id);
        
      if (error) throw error;
      
      // Atualizar estado local após confirmação do Supabase
      setProdutos(produtos.map(p => p.id === id ? {...p, ativo: novoStatus} : p));
    } catch (error) {
      console.error('Erro ao atualizar status do produto:', error);
      alert('Ocorreu um erro ao atualizar o status do produto.');
    }
  };

  const resetForm = () => {
    setCurrentProduto(null);
    setNome('');
    setDescricao('');
    setValor('');
    setImagemUrl('');
    setLinkCheckout('');
    setAtivo(true);
    
    // Limpar localStorage
    localStorage.removeItem('produtos_currentProduto');
  };

  const formatarValor = (valor: number) => {
    return valor.toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: theme.colors.primary }}></div>
      </div>
    );
  }

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

      {/* Elemento decorativo do templo maia */}
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
        {/* Cabeçalho com estilo Maia/Green */}
        <div 
          className="mb-10 relative overflow-hidden rounded-xl p-8"
          style={{
            background: `linear-gradient(135deg, ${theme.colors.primary}90, ${theme.colors.accent}70)`,
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
          }}
        >
          {/* Overlay com padrão de folhas */}
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
                Produtos Magnificência
              </h1>
              <p 
                className="text-lg"
                style={{ 
                  color: 'rgba(255, 255, 255, 0.9)',
                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
                }}
              >
                Descubra produtos de alta qualidade para o seu cultivo
              </p>
            </div>
            
            {isAdmin && (
              <button 
                onClick={() => {
                  resetForm();
                  setShowModal(true);
                }}
                className="mt-4 md:mt-0 px-6 py-3 rounded-full flex items-center justify-center transition-all transform hover:scale-105"
                style={{ 
                  background: `linear-gradient(135deg, #F8CC3C, #E3A507)`,
                  color: '#1F1F1F',
                  fontWeight: 'bold',
                  boxShadow: '0 4px 10px rgba(248, 204, 60, 0.3)'
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Adicionar Produto
              </button>
            )}
          </div>
        </div>

        {produtos.length === 0 ? (
          <div 
            className="text-center py-16 rounded-xl"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <img 
              src="/images/logo/magnificencia-green-logo.svg" 
              alt="Magnificência Green" 
              className="h-24 w-24 mx-auto mb-6 opacity-50"
            />
            <h2 className="text-2xl font-bold mb-4" style={{ color: theme.colors.textPrimary }}>
              Nenhum produto disponível
            </h2>
            <p className="text-lg mb-8" style={{ color: theme.colors.textSecondary }}>
              No momento não temos produtos disponíveis em nosso catálogo.
            </p>
            
            {isAdmin && (
              <button 
                onClick={() => {
                  resetForm();
                  setShowModal(true);
                }}
                className="px-6 py-3 rounded-full flex items-center justify-center mx-auto transition-all transform hover:scale-105"
                style={{ 
                  background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.accent})`,
                  color: '#1F1F1F',
                  fontWeight: 'bold',
                  boxShadow: `0 4px 10px rgba(127, 219, 63, 0.3)`
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Adicionar Primeiro Produto
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {produtos.filter(p => p.ativo || isAdmin).map((produto) => (
              <div 
                key={produto.id} 
                className={`rounded-xl overflow-hidden transition-all transform hover:translate-y-[-5px] hover:shadow-xl ${
                  produto.ativo ? '' : 'opacity-70'
                }`}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(8px)',
                  border: produto.ativo 
                    ? '1px solid rgba(255, 255, 255, 0.1)' 
                    : '1px solid rgba(255, 59, 48, 0.3)',
                  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
                }}
              >
                {/* Imagem do produto com overlay gradiente */}
                <div className="h-48 relative overflow-hidden">
                  {produto.imagem_url ? (
                    <img 
                      src={produto.imagem_url}
                      alt={produto.nome}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div 
                      className="w-full h-full flex items-center justify-center"
                      style={{ background: `linear-gradient(135deg, ${theme.colors.primary}30, ${theme.colors.accent}30)` }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ color: theme.colors.primary }}>
                        <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z" />
                      </svg>
                    </div>
                  )}
                  
                  {/* Overlay de gradiente na parte inferior */}
                  <div 
                    className="absolute bottom-0 left-0 right-0 h-20" 
                    style={{ 
                      background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)'
                    }}
                  ></div>
                  
                  {/* Status tag (apenas se inativo) */}
                  {!produto.ativo && (
                    <div 
                      className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold"
                      style={{ 
                        background: 'rgba(255, 59, 48, 0.8)', 
                        color: 'white',
                        backdropFilter: 'blur(4px)'
                      }}
                    >
                      Indisponível
                    </div>
                  )}
                  
                  {/* Preço em destaque */}
                  <div 
                    className="absolute bottom-3 right-3 px-3 py-1 rounded-full text-lg font-bold"
                    style={{ 
                      background: `linear-gradient(135deg, #F8CC3C, #E3A507)`,
                      color: '#1F1F1F',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                    }}
                  >
                    {formatarValor(produto.valor)}
                  </div>
                </div>
                
                <div className="p-5">
                  <h2 
                    className="text-xl font-bold mb-3 line-clamp-2" 
                    style={{ color: theme.colors.textPrimary }}
                  >
                    {produto.nome}
                  </h2>
                  
                  <p 
                    className="text-sm mb-5 line-clamp-3" 
                    style={{ color: theme.colors.textSecondary }}
                  >
                    {produto.descricao}
                  </p>
                  
                  <div className="flex justify-between items-center">
                    {isAdmin ? (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(produto)}
                          className="p-2 rounded-full transition-colors"
                          style={{ 
                            background: 'rgba(59, 130, 246, 0.15)',
                            color: '#3B82F6'
                          }}
                          title="Editar"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        </button>
                        
                        <button
                          onClick={() => toggleAtivo(produto.id, !produto.ativo)}
                          className="p-2 rounded-full transition-colors"
                          style={{ 
                            background: produto.ativo 
                              ? 'rgba(245, 158, 11, 0.15)' 
                              : 'rgba(16, 185, 129, 0.15)',
                            color: produto.ativo 
                              ? '#F59E0B' 
                              : '#10B981'
                          }}
                          title={produto.ativo ? "Desativar" : "Ativar"}
                        >
                          {produto.ativo ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                        
                        <button
                          onClick={() => handleDelete(produto.id)}
                          className="p-2 rounded-full transition-colors"
                          style={{ 
                            background: 'rgba(239, 68, 68, 0.15)',
                            color: '#EF4444'
                          }}
                          title="Excluir"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    ) : produto.ativo ? (
                      <a
                        href={produto.link_checkout}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-5 py-2 rounded-full transition-all transform hover:scale-105 flex items-center"
                        style={{ 
                          background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.accent})`,
                          color: '#1F1F1F',
                          fontWeight: 'bold',
                          boxShadow: `0 4px 10px rgba(127, 219, 63, 0.3)`
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                        </svg>
                        Comprar
                      </a>
                    ) : (
                      <span
                        className="px-4 py-2 rounded-full text-sm"
                        style={{ 
                          background: 'rgba(255, 59, 48, 0.15)', 
                          color: '#FF3B30'
                        }}
                      >
                        Produto indisponível
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal para adicionar/editar produto */}
      {showModal && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{
            backgroundColor: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(5px)'
          }}
        >
          <div 
            className="relative max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-xl"
            style={{
              background: 'rgba(31, 41, 55, 0.95)',
              boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            {/* Header com gradiente */}
            <div 
              className="flex justify-between items-center p-6 rounded-t-xl"
              style={{
                background: `linear-gradient(135deg, ${theme.colors.primary}80, ${theme.colors.accent}80)`,
                borderBottom: '1px solid rgba(255,255,255,0.1)'
              }}
            >
              <h2 
                className="text-2xl font-bold" 
                style={{ 
                  color: '#fff',
                  textShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}
              >
                {currentProduto ? 'Editar Produto' : 'Adicionar Produto'}
              </h2>
              <button 
                onClick={() => setShowModal(false)}
                className="text-white p-1 rounded-full hover:bg-white hover:bg-opacity-20 transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Formulário com estilo temático */}
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-5">
                {/* Nome do Produto */}
                <div>
                  <label 
                    className="block mb-2 text-sm font-medium"
                    style={{ color: '#F8CC3C' }}
                  >
                    Nome do Produto *
                  </label>
                  <input
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg focus:ring-2"
                    style={{ 
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: theme.colors.textPrimary,
                      transition: 'all 0.2s',
                      outline: 'none'
                    }}
                    required
                  />
                </div>
                
                {/* Descrição */}
                <div>
                  <label 
                    className="block mb-2 text-sm font-medium"
                    style={{ color: '#F8CC3C' }}
                  >
                    Descrição *
                  </label>
                  <textarea
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg focus:ring-2"
                    style={{ 
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: theme.colors.textPrimary,
                      transition: 'all 0.2s',
                      outline: 'none'
                    }}
                    rows={4}
                    required
                  />
                </div>
                
                {/* Valor */}
                <div>
                  <label 
                    className="block mb-2 text-sm font-medium"
                    style={{ color: '#F8CC3C' }}
                  >
                    Valor (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={valor}
                    onChange={(e) => setValor(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg focus:ring-2"
                    style={{ 
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: theme.colors.textPrimary,
                      transition: 'all 0.2s',
                      outline: 'none'
                    }}
                    required
                  />
                </div>
                
                {/* URL da Imagem */}
                <div>
                  <label 
                    className="block mb-2 text-sm font-medium"
                    style={{ color: '#F8CC3C' }}
                  >
                    URL da Imagem
                  </label>
                  <input
                    type="url"
                    value={imagemUrl}
                    onChange={(e) => setImagemUrl(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg focus:ring-2"
                    style={{ 
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: theme.colors.textPrimary,
                      transition: 'all 0.2s',
                      outline: 'none'
                    }}
                    placeholder="https://exemplo.com/imagem.jpg"
                  />
                </div>
                
                {/* Link de Checkout */}
                <div>
                  <label 
                    className="block mb-2 text-sm font-medium"
                    style={{ color: '#F8CC3C' }}
                  >
                    Link de Checkout
                  </label>
                  <input
                    type="url"
                    value={linkCheckout}
                    onChange={(e) => setLinkCheckout(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg focus:ring-2"
                    style={{ 
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: theme.colors.textPrimary,
                      transition: 'all 0.2s',
                      outline: 'none'
                    }}
                    placeholder="https://loja.com/checkout/produto"
                  />
                </div>
                
                {/* Produto Ativo */}
                <div>
                  <label className="flex items-center cursor-pointer">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={ativo}
                        onChange={(e) => setAtivo(e.target.checked)}
                        className="sr-only"
                      />
                      <div 
                        className="w-10 h-6 rounded-full transition-all"
                        style={{ 
                          background: ativo 
                            ? theme.colors.primary 
                            : 'rgba(255, 255, 255, 0.1)'
                        }}
                      ></div>
                      <div 
                        className={`absolute left-1 top-1 w-4 h-4 rounded-full transition-all transform ${
                          ativo ? 'translate-x-4' : 'translate-x-0'
                        }`}
                        style={{ 
                          background: ativo 
                            ? '#1F1F1F' 
                            : 'rgba(255, 255, 255, 0.5)'
                        }}
                      ></div>
                    </div>
                    <span 
                      className="ml-3 text-sm font-medium"
                      style={{ color: theme.colors.textPrimary }}
                    >
                      Produto Ativo
                    </span>
                  </label>
                </div>
              </div>
              
              {/* Botões de ação */}
              <div className="flex justify-end space-x-4 mt-8">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 rounded-lg transition-all"
                  style={{ 
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: theme.colors.textPrimary
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg transition-all transform hover:scale-105"
                  style={{ 
                    background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.accent})`,
                    color: '#1F1F1F',
                    fontWeight: 'bold',
                    boxShadow: `0 4px 10px rgba(127, 219, 63, 0.3)`
                  }}
                >
                  {currentProduto ? 'Atualizar' : 'Adicionar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 