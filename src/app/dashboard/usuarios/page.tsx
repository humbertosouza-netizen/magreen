'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import { listUsers, updateUserRole, toggleUserBan } from '@/lib/auth';
import { UserProfile } from '@/types/user';
import { colors } from '@/styles/colors';
import { supabase } from '@/lib/supabase';
import { usePageState } from '@/hooks/usePageState';
import { useDashboardState } from '@/contexts/DashboardStateContext';
import theme from '@/styles/theme';

export default function UsuariosPage() {
  const { user, isAdmin, loading } = useUser();
  const router = useRouter();
  const { setViewingItemId } = useDashboardState();
  
  const [usuarios, setUsuarios] = useState<UserProfile[]>([]);
  const [totalUsuarios, setTotalUsuarios] = useState(0);
  const [pagina, setPagina] = usePageState<number>('usuarios_pagina', 1);
  const [carregando, setCarregando] = useState(true);
  const [banReason, setBanReason] = usePageState<string>('usuarios_banReason', '');
  const [usuarioParaBanir, setUsuarioParaBanir] = usePageState<UserProfile | null>('usuarios_parabanir', null);
  const [usuarioParaPromover, setUsuarioParaPromover] = usePageState<UserProfile | null>('usuarios_parapromover', null);
  const [usuarioParaRemover, setUsuarioParaRemover] = usePageState<UserProfile | null>('usuarios_pararemover', null);
  const [mostrarModalCriarUsuario, setMostrarModalCriarUsuario] = usePageState<boolean>('usuarios_mostrarModal', false);
  const [novoUsuario, setNovoUsuario] = usePageState<{
    email: string;
    senha: string;
    confirmacaoSenha: string;
    nickname: string;
    instagram: string;
    role?: string;
  }>('usuarios_novoUsuario', {
    email: '',
    senha: '',
    confirmacaoSenha: '',
    nickname: '',
    instagram: '',
    role: 'user'
  });
  const [atualizando, setAtualizando] = useState(false);
  const [busca, setBusca] = usePageState<string>('usuarios_busca', '');
  const [mensagem, setMensagem] = useState({ texto: '', tipo: '' });

  const usuariosPorPagina = 10;

  // Carregar lista de usuários
  const carregarUsuarios = async () => {
    if (!isAdmin) return;
    
    setCarregando(true);
    const { users, count } = await listUsers(pagina, usuariosPorPagina);
    setUsuarios(users);
    setTotalUsuarios(count);
    setCarregando(false);
  };

  // Verificar se o usuário é admin, senão redirecionar
  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push('/dashboard');
    }
  }, [loading, isAdmin, router]);

  // Carregar usuários quando a página mudar
  useEffect(() => {
    if (isAdmin) {
      carregarUsuarios();
    }
  }, [pagina, isAdmin]);
  
  // Evento para quando a visibilidade da página muda (minimizar/restaurar)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Quando a página é minimizada, salvamos o estado atual
        if (usuarioParaBanir) {
          setViewingItemId(usuarioParaBanir.id);
        } else if (usuarioParaPromover) {
          setViewingItemId(usuarioParaPromover.id);
        } else if (usuarioParaRemover) {
          setViewingItemId(usuarioParaRemover.id);
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [usuarioParaBanir, usuarioParaPromover, usuarioParaRemover, setViewingItemId]);

  // Filtrar usuários pela busca
  const usuariosFiltrados = busca 
    ? usuarios.filter(
        u => 
          (u.email ? u.email.toLowerCase().includes(busca.toLowerCase()) : false) || 
          (u.name && u.name.toLowerCase().includes(busca.toLowerCase()))
      )
    : usuarios;

  // Banir ou desbanir um usuário
  const handleToggleBan = async (usuario: UserProfile, ban: boolean) => {
    if (ban) {
      // Abrir modal para informar motivo
      setUsuarioParaBanir(usuario);
    } else {
      // Desbanir diretamente
      await processarToggleBan(usuario.id, false);
    }
  };

  // Processar ban após confirmar o motivo
  const processarToggleBan = async (userId: string, ban: boolean) => {
    setAtualizando(true);
    const result = await toggleUserBan(userId, ban, banReason);
    setAtualizando(false);
    
    if (result.success) {
      setMensagem({ 
        texto: ban ? 'Usuário banido com sucesso' : 'Usuário desbanido com sucesso', 
        tipo: 'success' 
      });
      carregarUsuarios();
    } else {
      setMensagem({ 
        texto: `Erro ao ${ban ? 'banir' : 'desbanir'} usuário`, 
        tipo: 'error' 
      });
    }
    
    setUsuarioParaBanir(null);
    setBanReason('');
  };

  // Promover ou despromover um usuário
  const handleToggleAdmin = (usuario: UserProfile) => {
    setUsuarioParaPromover(usuario);
  };

  // Processar promoção/despromoção após confirmação
  const processarToggleAdmin = async () => {
    if (!usuarioParaPromover) return;
    
    const novoRole = usuarioParaPromover.role === 'admin' ? 'user' : 'admin';
    setAtualizando(true);
    
    const result = await updateUserRole(usuarioParaPromover.id, novoRole);
    setAtualizando(false);
    
    if (result.success) {
      setMensagem({ 
        texto: novoRole === 'admin' ? 'Usuário promovido a administrador' : 'Privilégios de administrador removidos', 
        tipo: 'success' 
      });
      carregarUsuarios();
    } else {
      setMensagem({ 
        texto: 'Erro ao atualizar privilégios do usuário', 
        tipo: 'error' 
      });
    }
    
    setUsuarioParaPromover(null);
  };

  // Remover um usuário
  const handleRemoveUser = (usuario: UserProfile) => {
    setUsuarioParaRemover(usuario);
  };

  // Processar remoção após confirmar
  const processarRemoveUser = async () => {
    if (!usuarioParaRemover) return;
    
    setAtualizando(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', usuarioParaRemover.id);
      
      if (error) {
        console.error('Erro ao remover usuário:', error);
        setMensagem({ 
          texto: 'Erro ao remover usuário', 
          tipo: 'error' 
        });
      } else {
        setMensagem({ 
          texto: 'Usuário removido com sucesso', 
          tipo: 'success' 
        });
        carregarUsuarios();
      }
    } catch (error) {
      console.error('Erro ao remover usuário:', error);
      setMensagem({ 
        texto: 'Erro ao remover usuário', 
        tipo: 'error' 
      });
    } finally {
      setAtualizando(false);
      setUsuarioParaRemover(null);
    }
  };

  // Função para criar novo usuário
  const handleCriarUsuario = () => {
    setMostrarModalCriarUsuario(true);
  };

  // Limpar dados do formulário de novo usuário
  const limparFormularioNovoUsuario = () => {
    setNovoUsuario({
      email: '',
      senha: '',
      confirmacaoSenha: '',
      nickname: '',
      instagram: '',
      role: 'user'
    });
    
    // Fechar o modal
    setMostrarModalCriarUsuario(false);
  };

  // Processar criação de novo usuário
  const processarCriarUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar campos
    if (novoUsuario.senha !== novoUsuario.confirmacaoSenha) {
      setMensagem({
        texto: 'As senhas não coincidem',
        tipo: 'error'
      });
      return;
    }
    
    if (novoUsuario.senha.length < 6) {
      setMensagem({
        texto: 'A senha deve ter pelo menos 6 caracteres',
        tipo: 'error'
      });
      return;
    }
    
    setAtualizando(true);
    
    try {
      console.log('Etapa 1: Criando usuário na autenticação...');
      
      // Etapa 1: Criar apenas o usuário na autenticação (auth)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: novoUsuario.email,
        password: novoUsuario.senha,
        options: {
          data: {
            nickname: novoUsuario.nickname,
            instagram: novoUsuario.instagram
          }
        }
      });
      
      if (authError) {
        console.error('Erro ao criar usuário na autenticação:', authError);
        setMensagem({ 
          texto: `Erro ao criar usuário: ${authError.message}`, 
          tipo: 'error' 
        });
        setAtualizando(false);
        return;
      }

      if (!authData.user) {
        console.error('Usuário não retornado após criação');
        setMensagem({ 
          texto: 'Erro ao criar usuário: dados não retornados', 
          tipo: 'error' 
        });
        setAtualizando(false);
        return;
      }
      
      console.log('Usuário criado com sucesso na autenticação:', authData.user.id);
      
      // Iniciar um pequeno atraso para dar tempo ao gatilho de criar o perfil
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Etapa 2: Atualizar o perfil do usuário já criado pelo trigger
      console.log('Etapa 2: Verificando/atualizando perfil do usuário...');
      
      const { data: profileExists, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', authData.user.id)
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Erro ao verificar perfil existente:', checkError);
        setMensagem({
          texto: `Usuário criado, mas houve um problema ao verificar o perfil: ${checkError.message}`,
          tipo: 'warning'
        });
        setAtualizando(false);
        return;
      }
      
      // Se o perfil não foi criado pelo trigger, criar manualmente
      if (!profileExists) {
        console.log('Perfil não criado automaticamente, criando manualmente...');
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            nome_completo: novoUsuario.nickname || '',
            email: novoUsuario.email,
            telefone: '',
            bio: '',
            avatar_url: '',
            role: novoUsuario.role === 'admin' ? 'ADMIN' : 'USUARIO', // Usar os valores em maiúscula conforme no banco
            banned: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          
        if (insertError) {
          console.error('Erro ao criar perfil do usuário:', insertError);
          setMensagem({
            texto: `Usuário criado, mas houve um problema ao criar o perfil: ${insertError.message}`,
            tipo: 'warning'
          });
          setAtualizando(false);
          return;
        }
      } else {
        // Se o perfil já existe (criado pelo trigger), atualizar para incluir os campos adicionais
        console.log('Atualizando perfil já existente...');
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            nome_completo: novoUsuario.nickname || '',
            email: novoUsuario.email,
            role: novoUsuario.role === 'admin' ? 'ADMIN' : 'USUARIO' // Usar os valores em maiúscula conforme no banco
          })
          .eq('id', authData.user.id);
          
        if (updateError) {
          console.error('Erro ao atualizar perfil do usuário:', updateError);
          setMensagem({
            texto: `Usuário criado, mas houve um problema ao atualizar o perfil: ${updateError.message}`,
            tipo: 'warning'
          });
          setAtualizando(false);
          return;
        }
      }
      
      console.log('Perfil do usuário configurado com sucesso');
      
      // Fechar o modal e atualizar a lista de usuários
      setMostrarModalCriarUsuario(false);
      setNovoUsuario({
        email: '',
        senha: '',
        confirmacaoSenha: '',
        nickname: '',
        instagram: '',
        role: 'user'
      });
      
      setMensagem({
        texto: 'Usuário criado com sucesso',
        tipo: 'success'
      });
      
      // Recarregar a lista de usuários
      await carregarUsuarios();
      
    } catch (err: any) {
      console.error('Erro não tratado ao criar usuário:', err);
      setMensagem({ 
        texto: `Erro inesperado: ${err.message || 'Erro desconhecido'}`, 
        tipo: 'error' 
      });
    } finally {
      setAtualizando(false);
    }
  };

  // Handler para mudanças nos campos do novo usuário
  const handleNovoUsuarioChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNovoUsuario(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Limpar mensagem após 5 segundos
  useEffect(() => {
    if (mensagem.texto) {
      const timer = setTimeout(() => {
        setMensagem({ texto: '', tipo: '' });
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [mensagem]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent" 
             style={{ borderColor: theme.colors.primary, borderTopColor: 'transparent' }}></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // Será redirecionado pelo useEffect
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
                Gerenciamento de Usuários
              </h1>
              <p 
                className="text-lg"
                style={{ 
                  color: 'rgba(255, 255, 255, 0.9)',
                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
                }}
              >
                Administre usuários do sistema Magnificência
              </p>
            </div>
            
            <button
              onClick={handleCriarUsuario}
              className="mt-4 md:mt-0 px-6 py-3 rounded-full flex items-center justify-center transition-all transform hover:scale-105"
              style={{ 
                background: `linear-gradient(135deg, #F8CC3C, #E3A507)`,
                color: '#1F1F1F',
                fontWeight: 'bold',
                boxShadow: '0 4px 10px rgba(248, 204, 60, 0.3)'
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
              </svg>
              Adicionar Usuário
            </button>
          </div>
        </div>

        {/* Mensagem de feedback */}
        {mensagem.texto && (
          <div 
            className={`p-4 mb-6 rounded-lg ${mensagem.tipo === 'success' 
              ? 'bg-gradient-to-r from-green-700 to-green-800' 
              : 'bg-gradient-to-r from-red-700 to-red-800'}`}
            style={{
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              border: `1px solid ${mensagem.tipo === 'success' 
                ? 'rgba(16, 185, 129, 0.2)' 
                : 'rgba(239, 68, 68, 0.2)'}`
            }}
          >
            <p className="text-white">{mensagem.texto}</p>
          </div>
        )}

        {/* Pesquisa de usuários */}
        <div className="mb-6 rounded-xl overflow-hidden" 
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
          }}>
          <div className="p-4">
            <div className="flex items-center">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Buscar por nome ou email..."
                  className="w-full px-5 py-3 rounded-full text-white"
                  style={{ 
                    background: 'rgba(255, 255, 255, 0.07)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(4px)',
                    outline: 'none',
                    boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.05)'
                  }}
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                />
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-5 w-5 absolute right-4 top-1/2 transform -translate-y-1/2" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                  style={{ color: theme.colors.textSecondary }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <button 
                className="ml-3 px-5 py-3 rounded-full flex items-center transition-all transform hover:scale-105"
                style={{ 
                  background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.accent})`,
                  color: '#1F1F1F',
                  fontWeight: 'bold',
                  boxShadow: `0 4px 10px rgba(127, 219, 63, 0.3)`
                }}
                onClick={carregarUsuarios}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
                Atualizar
              </button>
            </div>
          </div>
        </div>

        {/* Tabela de usuários */}
        {carregando ? (
          <div className="flex justify-center p-10">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-t-transparent" 
                style={{ borderColor: theme.colors.primary, borderTopColor: 'transparent' }}></div>
          </div>
        ) : (
          <div className="rounded-xl overflow-hidden" 
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
            }}>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr style={{ 
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    background: `linear-gradient(90deg, rgba(31, 41, 55, 0.8), rgba(17, 24, 39, 0.8))`
                  }}>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" 
                      style={{ color: theme.colors.primary }}>Usuário</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: theme.colors.primary }}>Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: theme.colors.primary }}>Tipo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: theme.colors.primary }}>Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: theme.colors.primary }}>Cadastrado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: theme.colors.primary }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {usuariosFiltrados.length > 0 ? (
                    usuariosFiltrados.map(usuario => (
                      <tr key={usuario.id} style={{ 
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        transition: 'all 0.2s'
                      }} className="hover:bg-white hover:bg-opacity-5">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full flex items-center justify-center text-white mr-3"
                              style={{ 
                                background: `linear-gradient(135deg, ${theme.colors.primary}80, ${theme.colors.accent}80)`,
                                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                              }}>
                              {usuario.nickname ? usuario.nickname.charAt(0).toUpperCase() : 
                               usuario.name ? usuario.name.charAt(0).toUpperCase() : 
                               usuario.email ? usuario.email.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <span className="text-white font-medium">{usuario.nickname || usuario.name || (usuario.email ? usuario.email.split('@')[0] : 'Usuário')}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap" style={{ color: theme.colors.textSecondary }}>
                          {usuario.email || 'Email não disponível'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span 
                            className="px-3 py-1.5 text-xs rounded-full font-medium" 
                            style={{ 
                              backgroundColor: usuario.role === 'admin' 
                                ? 'rgba(139, 92, 246, 0.3)' // Purple for admin
                                : 'rgba(16, 185, 129, 0.3)', // Green for user
                              color: usuario.role === 'admin' ? '#c4b5fd' : '#a7f3d0',
                              backdropFilter: 'blur(4px)',
                              border: usuario.role === 'admin' 
                                ? '1px solid rgba(139, 92, 246, 0.3)' 
                                : '1px solid rgba(16, 185, 129, 0.3)'
                            }}
                          >
                            {usuario.role === 'admin' ? 'Administrador' : 'Usuário'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {usuario.banned ? (
                            <span className="px-3 py-1.5 text-xs rounded-full font-medium"
                              style={{ 
                                backgroundColor: 'rgba(239, 68, 68, 0.3)',
                                color: '#fca5a5',
                                backdropFilter: 'blur(4px)',
                                border: '1px solid rgba(239, 68, 68, 0.3)'
                              }}>
                              Banido
                            </span>
                          ) : (
                            <span className="px-3 py-1.5 text-xs rounded-full font-medium"
                              style={{ 
                                backgroundColor: 'rgba(16, 185, 129, 0.3)',
                                color: '#a7f3d0',
                                backdropFilter: 'blur(4px)',
                                border: '1px solid rgba(16, 185, 129, 0.3)'
                              }}>
                              Ativo
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap" style={{ color: theme.colors.textSecondary }}>
                          {new Date(usuario.created_at).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex space-x-2">
                            {usuario.id !== user?.id && (
                              <>
                                <button 
                                  onClick={() => handleToggleAdmin(usuario)}
                                  className="text-xs px-3 py-1.5 rounded-full font-medium transition-all"
                                  style={{ 
                                    background: 'rgba(59, 130, 246, 0.15)',
                                    color: '#93c5fd',
                                    border: '1px solid rgba(59, 130, 246, 0.2)'
                                  }}
                                >
                                  {usuario.role === 'admin' ? 'Despromover' : 'Promover'}
                                </button>

                                <button 
                                  onClick={() => handleToggleBan(usuario, !usuario.banned)}
                                  className="text-xs px-3 py-1.5 rounded-full font-medium transition-all"
                                  style={{ 
                                    background: usuario.banned 
                                      ? 'rgba(16, 185, 129, 0.15)' 
                                      : 'rgba(239, 68, 68, 0.15)',
                                    color: usuario.banned ? '#a7f3d0' : '#fca5a5',
                                    border: usuario.banned 
                                      ? '1px solid rgba(16, 185, 129, 0.2)' 
                                      : '1px solid rgba(239, 68, 68, 0.2)'
                                  }}
                                >
                                  {usuario.banned ? 'Desbanir' : 'Banir'}
                                </button>

                                <button 
                                  onClick={() => handleRemoveUser(usuario)}
                                  className="text-xs px-3 py-1.5 rounded-full font-medium transition-all"
                                  style={{ 
                                    background: 'rgba(239, 68, 68, 0.15)',
                                    color: '#fca5a5',
                                    border: '1px solid rgba(239, 68, 68, 0.2)'
                                  }}
                                >
                                  Remover
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center" style={{ color: theme.colors.textSecondary }}>
                        Nenhum usuário encontrado
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Paginação */}
            {totalUsuarios > usuariosPorPagina && (
              <div className="p-6 border-t flex justify-between items-center"
                style={{ borderColor: 'rgba(255, 255, 255, 0.05)' }}>
                <div className="text-sm" style={{ color: theme.colors.textSecondary }}>
                  Mostrando {(pagina - 1) * usuariosPorPagina + 1} a {Math.min(pagina * usuariosPorPagina, totalUsuarios)} de {totalUsuarios} usuários
                </div>
                <div className="flex space-x-3">
                  <button 
                    onClick={() => setPagina(p => Math.max(1, p - 1))}
                    disabled={pagina === 1}
                    className="px-4 py-2 rounded-full font-medium text-sm transition-all disabled:opacity-40 flex items-center"
                    style={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.07)',
                      color: theme.colors.textPrimary,
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Anterior
                  </button>
                  <button 
                    onClick={() => setPagina(p => p + 1)}
                    disabled={pagina * usuariosPorPagina >= totalUsuarios}
                    className="px-4 py-2 rounded-full font-medium text-sm transition-all disabled:opacity-40 flex items-center"
                    style={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.07)',
                      color: theme.colors.textPrimary,
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    Próxima
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal para banir usuário */}
        {usuarioParaBanir && (
          <div className="fixed inset-0 z-30 overflow-y-auto" aria-labelledby="modal-ban-title" role="dialog">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:p-0">
              <div className="fixed inset-0 bg-black bg-opacity-75 transition-opacity" aria-hidden="true"></div>
              
              <div 
                className="inline-block rounded-lg text-left overflow-hidden shadow-xl transform transition-all max-w-lg w-full"
                style={{
                  background: 'rgba(31, 41, 55, 0.95)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)'
                }}
              >
                {/* Header com gradiente */}
                <div className="px-6 py-4" 
                  style={{
                    background: `linear-gradient(135deg, ${theme.colors.primary}60, ${theme.colors.accent}60)`,
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                  <h3 className="text-lg font-medium text-white" id="modal-ban-title">
                    Banir Usuário
                  </h3>
                </div>
                
                <div className="p-6">
                  <p className="mb-4" style={{ color: theme.colors.textSecondary }}>
                    Você está prestes a banir o usuário: <span className="font-medium text-white">{usuarioParaBanir.email}</span>
                  </p>
                  
                  <div className="mb-4">
                    <label htmlFor="ban-reason" className="block mb-2 text-sm font-medium" style={{ color: theme.colors.textSecondary }}>
                      Motivo do banimento
                    </label>
                    <textarea 
                      id="ban-reason" 
                      className="w-full px-3 py-2 rounded-lg text-white"
                      style={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        outline: 'none'
                      }}
                      rows={3}
                      value={banReason}
                      onChange={(e) => setBanReason(e.target.value)}
                      placeholder="Explique o motivo do banimento..."
                    />
                  </div>
                  
                  <div className="mt-6 flex justify-end space-x-3">
                    <button 
                      type="button" 
                      className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                      style={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        color: theme.colors.textPrimary
                      }}
                      onClick={() => {
                        setUsuarioParaBanir(null);
                        setBanReason('');
                      }}
                    >
                      Cancelar
                    </button>
                    <button 
                      type="button"
                      onClick={() => processarToggleBan(usuarioParaBanir.id, true)}
                      className="px-4 py-2 rounded-lg text-sm font-medium transition-all transform hover:scale-105"
                      style={{ 
                        background: 'linear-gradient(135deg, #EF4444, #DC2626)',
                        color: 'white',
                        boxShadow: '0 4px 10px rgba(239, 68, 68, 0.3)'
                      }}
                    >
                      Confirmar Banimento
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal para promover/despromover usuário */}
        {usuarioParaPromover && (
          <div className="fixed inset-0 z-30 overflow-y-auto" aria-labelledby="modal-promote-title" role="dialog">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:p-0">
              <div className="fixed inset-0 bg-black bg-opacity-75 transition-opacity" aria-hidden="true"></div>
              
              <div 
                className="inline-block rounded-lg text-left overflow-hidden shadow-xl transform transition-all max-w-lg w-full"
                style={{
                  background: 'rgba(31, 41, 55, 0.95)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)'
                }}
              >
                {/* Header com gradiente */}
                <div className="px-6 py-4" 
                  style={{
                    background: `linear-gradient(135deg, ${usuarioParaPromover.role === 'admin' ? '#9333EA' : theme.colors.primary}60, ${usuarioParaPromover.role === 'admin' ? '#7C3AED' : theme.colors.accent}60)`,
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                  <h3 className="text-lg font-medium text-white" id="modal-promote-title">
                    {usuarioParaPromover.role === 'admin' ? 'Remover Privilégios de Administrador' : 'Promover a Administrador'}
                  </h3>
                </div>
                
                <div className="p-6">
                  <p className="mb-4" style={{ color: theme.colors.textSecondary }}>
                    {usuarioParaPromover.role === 'admin' 
                      ? 'Você está prestes a remover os privilégios de administrador do usuário:' 
                      : 'Você está prestes a promover o usuário a administrador:'}
                    <span className="font-medium text-white ml-1">{usuarioParaPromover.email}</span>
                  </p>
                  
                  <p className="mb-4" style={{ color: theme.colors.textSecondary }}>
                    {usuarioParaPromover.role === 'admin' 
                      ? 'Este usuário não terá mais acesso às funções administrativas do sistema.' 
                      : 'Este usuário terá acesso a todas as funções administrativas do sistema.'}
                  </p>
                  
                  <div className="mt-6 flex justify-end space-x-3">
                    <button 
                      type="button" 
                      className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                      style={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        color: theme.colors.textPrimary
                      }}
                      onClick={() => setUsuarioParaPromover(null)}
                    >
                      Cancelar
                    </button>
                    <button 
                      type="button"
                      onClick={() => processarToggleAdmin()}
                      className="px-4 py-2 rounded-lg text-sm font-medium transition-all transform hover:scale-105"
                      style={{ 
                        background: usuarioParaPromover.role === 'admin'
                          ? 'linear-gradient(135deg, #3B82F6, #2563EB)' // Azul para despromover
                          : 'linear-gradient(135deg, #9333EA, #7C3AED)', // Roxo para promover
                        color: 'white',
                        boxShadow: usuarioParaPromover.role === 'admin'
                          ? '0 4px 10px rgba(59, 130, 246, 0.3)'
                          : '0 4px 10px rgba(147, 51, 234, 0.3)'
                      }}
                    >
                      {usuarioParaPromover.role === 'admin' ? 'Confirmar Remoção' : 'Confirmar Promoção'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de confirmação para remover usuário */}
        {usuarioParaRemover && (
          <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
              <h3 className="text-xl font-bold text-white mb-4">
                Confirmar remoção
              </h3>
              <p className="text-gray-300 mb-4">
                Tem certeza que deseja remover permanentemente o usuário <span className="font-semibold">{usuarioParaRemover.name || usuarioParaRemover.email || 'Usuário'}</span>? Esta ação não pode ser desfeita.
              </p>
              <div className="flex justify-end space-x-3">
                <button 
                  onClick={() => setUsuarioParaRemover(null)}
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  disabled={atualizando}
                >
                  Cancelar
                </button>
                <button 
                  onClick={processarRemoveUser}
                  className="px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-600 transition-colors"
                  disabled={atualizando}
                >
                  {atualizando ? 'Processando...' : 'Confirmar Remoção'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal para criar novo usuário */}
        {mostrarModalCriarUsuario && (
          <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
              <h3 className="text-xl font-bold text-white mb-4">
                Adicionar Novo Usuário
              </h3>
              
              <form onSubmit={processarCriarUsuario}>
                <div className="space-y-4">
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1 text-white">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={novoUsuario.email}
                      onChange={handleNovoUsuarioChange}
                      required
                      className="w-full px-3 py-2 rounded border text-sm"
                      style={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        borderColor: colors.gray,
                        color: 'white'
                      }}
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1 text-white">
                      Nickname
                    </label>
                    <input
                      type="text"
                      name="nickname"
                      value={novoUsuario.nickname}
                      onChange={handleNovoUsuarioChange}
                      required
                      className="w-full px-3 py-2 rounded border text-sm"
                      style={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        borderColor: colors.gray,
                        color: 'white'
                      }}
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1 text-white">
                      Instagram (@ ou link)
                    </label>
                    <input
                      type="text"
                      name="instagram"
                      value={novoUsuario.instagram || ''}
                      onChange={handleNovoUsuarioChange}
                      className="w-full px-3 py-2 rounded border text-sm"
                      style={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        borderColor: colors.gray,
                        color: 'white'
                      }}
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1 text-white">
                      Função
                    </label>
                    <select
                      name="role"
                      value={novoUsuario.role}
                      onChange={handleNovoUsuarioChange}
                      className="w-full px-3 py-2 rounded border text-sm"
                      style={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        borderColor: colors.darkGray,
                        color: 'white'
                      }}
                    >
                      <option value="user">Usuário</option>
                      {isAdmin && <option value="admin">Administrador</option>}
                    </select>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1 text-white">
                      Senha
                    </label>
                    <input
                      type="password"
                      name="senha"
                      value={novoUsuario.senha}
                      onChange={handleNovoUsuarioChange}
                      required
                      className="w-full px-3 py-2 rounded border text-sm"
                      style={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        borderColor: colors.gray,
                        color: 'white'
                      }}
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1 text-white">
                      Confirmar Senha
                    </label>
                    <input
                      type="password"
                      name="confirmacaoSenha"
                      value={novoUsuario.confirmacaoSenha}
                      onChange={handleNovoUsuarioChange}
                      required
                      className="w-full px-3 py-2 rounded border text-sm"
                      style={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        borderColor: colors.gray,
                        color: 'white'
                      }}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button 
                    type="button"
                    onClick={() => {
                      setMostrarModalCriarUsuario(false);
                      limparFormularioNovoUsuario();
                    }}
                    className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                    disabled={atualizando}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="px-4 py-2 rounded-lg transition-colors text-white"
                    style={{ backgroundColor: colors.greenLight }}
                    disabled={atualizando}
                  >
                    {atualizando ? 'Criando...' : 'Criar Usuário'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 