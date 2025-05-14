'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import theme from '@/styles/theme';
import { useUser } from '@/contexts/UserContext';
import { UserProvider } from '@/contexts/UserContext';
import { DashboardStateProvider } from '@/contexts/DashboardStateContext';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(true);
  const [produtosDisponiveisCount, setProdutosDisponiveisCount] = useState(0);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Envolver o conteúdo com o UserProvider
  return (
    <DashboardStateProvider>
      <UserProvider>
        <DashboardContent loading={loading} setLoading={setLoading}>
          {children}
        </DashboardContent>
      </UserProvider>
    </DashboardStateProvider>
  );
}

function DashboardContent({
  children,
  loading,
  setLoading
}: {
  children: React.ReactNode;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}) {
  const { user, loading: userLoading, isAdmin } = useUser();
  const [produtosDisponiveisCount, setProdutosDisponiveisCount] = useState(0);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Salvar e restaurar o estado da página usando localStorage
  useEffect(() => {
    // Função para salvar o URL atual no localStorage
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Quando a aba é minimizada ou o usuário muda para outra aba
        localStorage.setItem('dashboard_last_url', pathname);
      }
    };

    // Função para restaurar o URL salvo quando a página é carregada
    const restoreLastUrl = () => {
      // Removendo a verificação que força o redirecionamento para a última página visitada
      // para permitir que a página inicial do dashboard seja mantida
      
      // Código antigo comentado:
      // const lastUrl = localStorage.getItem('dashboard_last_url');
      // if (lastUrl && lastUrl !== pathname && lastUrl.startsWith('/dashboard')) {
      //   router.push(lastUrl);
      // }
      
      // Novo comportamento: não redirecionar automaticamente da página inicial
      return;
    };

    // Adicionar listener para eventos de visibilidade
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Verificar se há um URL salvo para restaurar
    if (pathname === '/dashboard') {
      // Não restauramos mais automaticamente para deixar a página inicial como padrão
      // restoreLastUrl();
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [pathname, router]);

  // Gerenciar a mudança de URL e atualizar localStorage
  useEffect(() => {
    if (pathname && pathname.startsWith('/dashboard') && pathname !== '/dashboard') {
      // Só salvamos rotas que não sejam a página inicial do dashboard
      localStorage.setItem('dashboard_last_url', pathname);
    }
  }, [pathname]);

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.push('/login');
        return;
      }
      
      // Em uma implementação real, buscaríamos o número de produtos disponíveis do backend
      setProdutosDisponiveisCount(3);
      
      setLoading(false);
    };

    checkUser();
  }, [router, setLoading]);

  // Fechar o menu quando clicar fora dele
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
      
      // Fechar a sidebar em mobile quando clicar fora (apenas se estiver em viewport mobile)
      if (window.innerWidth < 768 && sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setSidebarOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fechar sidebar ao mudar de rota em modo mobile
  useEffect(() => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, [pathname]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading || userLoading) {
    return (
      <div 
        className="flex min-h-screen items-center justify-center" 
        style={{ backgroundColor: theme.colors.background }}
      >
        <div className="text-center">
          <div 
            className="animate-spin rounded-full h-16 w-16 border-4 border-t-transparent mx-auto" 
            style={{ 
              borderColor: theme.colors.primary, 
              borderTopColor: 'transparent' 
            }}
          ></div>
          <p 
            className="mt-6 text-sm"
            style={{ 
              color: theme.colors.textPrimary,
              fontFamily: theme.typography.fontFamily.body
            }}
          >
            Carregando...
          </p>
        </div>
      </div>
    );
  }

  // Lista de itens de navegação para a barra lateral
  const navItems = [
    {
      name: 'Estudos',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/>
        </svg>
      ),
      href: '/dashboard/estudos',
    },
    {
      name: 'Blog',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M2 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 002 2H4a2 2 0 01-2-2V5zm3 1h6v4H5V6zm6 6H5v2h6v-2z" clipRule="evenodd" />
          <path d="M15 7h1a2 2 0 012 2v5.5a1.5 1.5 0 01-3 0V7z" />
        </svg>
      ),
      href: '/dashboard/blog',
    },
    {
      name: 'Meu Cultivo',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v11a3 3 0 106 0V4a2 2 0 00-2-2H4zm1 14a1 1 0 100-2 1 1 0 000 2zm5-1.757l4.9-4.9a2 2 0 000-2.828L13.485 5.1a2 2 0 00-2.828 0L10 5.757v8.486zM16 18H9.071l6-6H16a2 2 0 012 2v2a2 2 0 01-2 2z" clipRule="evenodd" />
        </svg>
      ),
      href: '/dashboard/cultivo',
    },
    {
      name: 'Produtos',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
          <path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
        </svg>
      ),
      href: '/dashboard/produtos',
    },
    // Item visível apenas para administradores
    ...(isAdmin ? [
      {
        name: 'Usuários',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
          </svg>
        ),
        href: '/dashboard/usuarios',
      }
    ] : []),
  ];

  // Ícone personalizado de folha para o dashboard
  const LeafIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z" />
        </svg>
  );

  return (
    <div 
      className="flex flex-col h-screen relative" 
      style={{ 
        backgroundColor: theme.colors.background, 
        color: theme.colors.textPrimary,
        fontFamily: theme.typography.fontFamily.body
      }}
    >
      {/* Fundo com imagem do templo maia */}
      <div 
        className="absolute inset-0 z-0 overflow-hidden pointer-events-none" 
        style={{
          backgroundImage: `url('/images/mayan-temple-background.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: 0.2
        }}
      />
      
      {/* Overlay escuro para melhorar a legibilidade */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none" 
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.65)'
        }}
      />
      
      {/* Fundo com padrão orgânico refinado */}
      <div 
        className="absolute inset-0 z-0 overflow-hidden pointer-events-none" 
        style={{
          backgroundImage: `
            radial-gradient(circle at 10% 20%, rgba(127, 219, 63, 0.03) 0%, transparent 50%),
            radial-gradient(circle at 90% 80%, rgba(127, 219, 63, 0.03) 0%, transparent 50%),
            url('/images/leaf-pattern-bg.svg')
          `,
          backgroundSize: '400px, 300px, 200px',
          opacity: 0.05,
          backgroundAttachment: 'fixed'
        }}
      />
      
      {/* Efeito de luz suave no topo */}
      <div 
        className="absolute top-0 left-0 right-0 h-64 z-0 pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, rgba(127, 219, 63, 0.035) 0%, transparent 100%)',
          filter: 'blur(40px)'
        }}
      />
      
      {/* Barra superior fixa para mobile - Design moderno */}
      <div 
        className="md:hidden flex items-center justify-between px-4 py-2 border-b z-20"
        style={{ 
          backgroundColor: 'rgba(31, 41, 55, 0.95)',
          backdropFilter: 'blur(8px)',
          borderColor: `${theme.colors.primary}25`,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}
      >
        <div className="flex justify-center w-full">
          <Link href="/dashboard" className="flex items-center blog-clickable-element">
            <img 
              src="/images/logo/magnificencia-green-full-logo.png"
              alt="MagnifiGreen Logo"
              style={{
                height: '100px', 
                width: '100px',
                maxWidth: '100%',
                objectFit: 'contain',
                filter: 'drop-shadow(0 1px 3px rgba(0, 0, 0, 0.2))'
              }}
            />
          </Link>
        </div>
        
        <div className="flex items-center space-x-3">
          <Link 
            href="/dashboard/perfil" 
            className="p-2 relative blog-clickable-element flex items-center justify-center"
            style={{ color: pathname === '/dashboard/perfil' ? theme.colors.primary : theme.colors.textPrimary }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          </Link>
          
          <Link 
            href="/dashboard/seguranca" 
            className="p-2 relative blog-clickable-element flex items-center justify-center"
            style={{ color: pathname === '/dashboard/seguranca' ? theme.colors.primary : theme.colors.textPrimary }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </Link>
          
          <Link 
            href="/dashboard/produtos" 
            className="p-2 relative blog-clickable-element flex items-center justify-center"
            style={{ color: theme.colors.textPrimary }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </Link>
        </div>
      </div>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Overlay para fechar sidebar em mobile */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        {/* Barra lateral de navegação - Estilo moderno e orgânico */}
        <div 
          ref={sidebarRef}
          className={`fixed md:relative md:w-64 flex-shrink-0 border-r flex flex-col z-40 h-full transition-transform duration-300 ease-in-out ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
          style={{ 
            backgroundColor: 'rgba(31, 41, 55, 0.98)',
            backdropFilter: 'blur(12px)',
            borderColor: `${theme.colors.primary}20`,
            width: '85vw', 
            maxWidth: '300px',
            boxShadow: sidebarOpen ? '0 0 15px rgba(0, 0, 0, 0.2)' : 'none'
          }}
        >
          <div 
            className="p-4 flex items-center justify-center border-b md:h-24"
            style={{ borderColor: `${theme.colors.primary}20` }}
          >
            <Link href="/dashboard" className="flex items-center justify-center blog-clickable-element">
              <img 
                src="/images/logo/magnificencia-green-full-logo.png"
                alt="MagnifiGreen Logo"
                style={{
                  width: '120px',
                  height: '120px',
                  maxWidth: '100%',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))',
                  margin: '0 auto'
                }}
              />
            </Link>
          </div>
          
          <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link 
                key={item.name}
                href={item.href}
                  className={`flex items-center px-4 py-3 rounded-lg transition-all relative blog-clickable-element ${
                    isActive ? 'font-medium' : ''
                }`}
                style={{ 
                    backgroundColor: isActive ? 'rgba(127, 219, 63, 0.08)' : 'transparent',
                    borderLeft: isActive ? `3px solid ${theme.colors.primary}` : '3px solid transparent',
                    color: isActive ? theme.colors.textPrimary : theme.colors.textSecondary,
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span style={{ color: isActive ? theme.colors.primary : theme.colors.textSecondary }}>
                  {item.icon}
                </span>
                  <span 
                    className="ml-3"
                    style={{ 
                      fontFamily: theme.typography.fontFamily.heading,
                      fontWeight: isActive ? theme.typography.fontWeight.semiBold : theme.typography.fontWeight.regular
                    }}
                  >
                    {item.name}
                  </span>
                  {isActive && (
                    <div 
                      className="absolute right-0 w-1 h-full rounded-l-full"
                      style={{ 
                        background: `linear-gradient(180deg, ${theme.colors.primary}, ${theme.colors.accent})`
                      }}
                    ></div>
                  )}
              </Link>
            );
          })}
        </nav>
        
          {/* Elemento decorativo - folha estilizada */}
          <div className="hidden md:block absolute -bottom-24 -right-24 opacity-5 pointer-events-none">
            <svg width="200" height="200" viewBox="0 0 24 24" fill={theme.colors.primary}>
              <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z" />
            </svg>
          </div>
          
          {/* Área de perfil com dropdown - Estilo refinado */}
          <div 
            className="p-4 border-t relative" 
            ref={profileMenuRef}
            style={{ borderColor: `${theme.colors.primary}20` }}
          >
            <div 
              className="flex items-center cursor-pointer blog-clickable-element" 
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            >
              <div 
                className="h-10 w-10 rounded-full flex items-center justify-center"
                style={{ 
                  background: `linear-gradient(135deg, ${theme.colors.primary}40, ${theme.colors.accent}40)`,
                  border: `1px solid ${theme.colors.primary}50`
                }}
              >
                {user?.nickname ? user?.nickname.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="ml-3 flex-1">
                <p 
                  className="text-sm font-medium truncate max-w-[150px]"
                  style={{ color: theme.colors.textPrimary }}
                >
                {user?.nickname || user?.email}
              </p>
                <div className="flex items-center text-xs">
                  <span 
                    style={{ 
                      color: isAdmin ? theme.colors.primary : theme.colors.textSecondary,
                      fontWeight: isAdmin ? 'bold' : 'normal'
                    }}
                  >
                    {isAdmin ? 'Administrador' : 'Usuário'}
                  </span>
                </div>
              </div>
              <div className="ml-2">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className={`h-5 w-5 transition-transform ${profileMenuOpen ? 'rotate-180' : ''}`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                  style={{ color: theme.colors.textSecondary }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                </svg>
            </div>
          </div>

            {/* Menu dropdown que aparece apenas quando profileMenuOpen é true */}
          {profileMenuOpen && (
            <div 
                className="absolute bottom-full left-0 right-0 md:left-4 md:right-4 mb-2 rounded-lg shadow-lg py-1 z-50"
                style={{ 
                  backgroundColor: 'rgba(26, 32, 44, 0.98)',
                  backdropFilter: 'blur(12px)',
                  borderColor: `${theme.colors.primary}40`,
                  border: `1px solid ${theme.colors.primary}30`,
                  boxShadow: '0 -10px 15px -3px rgba(0, 0, 0, 0.1), 0 -4px 6px -2px rgba(0, 0, 0, 0.05)'
                }}
              >
                <Link 
                  href="/dashboard/perfil"
                  className="flex items-center py-3 px-4 hover:bg-opacity-10 hover:bg-white"
                  style={{ 
                    color: pathname === '/dashboard/perfil' ? theme.colors.primary : theme.colors.textSecondary
                  }}
                  onClick={() => setProfileMenuOpen(false)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                  <span>Perfil</span>
                </Link>
                
                <Link 
                  href="/dashboard/seguranca"
                  className="flex items-center py-3 px-4 hover:bg-opacity-10 hover:bg-white"
                  style={{ 
                    color: pathname === '/dashboard/seguranca' ? theme.colors.primary : theme.colors.textSecondary
                  }}
                  onClick={() => setProfileMenuOpen(false)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Segurança</span>
                </Link>
                
                <div className="my-1 border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}></div>

                <button 
                  onClick={() => {
                    handleSignOut();
                    setProfileMenuOpen(false);
                  }}
                  className="flex items-center py-3 px-4 w-full text-left hover:bg-opacity-10 hover:bg-white"
                  style={{ color: theme.colors.error }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Sair</span>
                </button>
            </div>
          )}
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
          {/* Cabeçalho para desktop - Design moderno */}
          <header 
            className="hidden md:flex h-16 items-center px-6 border-b"
            style={{ 
              backgroundColor: 'rgba(31, 41, 55, 0.95)',
              backdropFilter: 'blur(8px)',
              borderColor: `${theme.colors.primary}20`,
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
            }}
          >
          <div className="flex-1">
              {/* Barra de pesquisa removida */}
            </div>
            <div className="flex items-center space-x-4">
              {/* Botões removidos */}
              <Link 
                href="/dashboard/produtos" 
                className="p-2 relative blog-clickable-element flex items-center justify-center"
                style={{ color: theme.colors.textPrimary }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </Link>
              {/* Link "Novo Artigo" removido */}
            </div>
          </header>

          {/* Área de conteúdo principal com scroll e efeito de brilho ambiental */}
          <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6 relative">
            {/* Efeito de luz ambiente */}
            <div 
              className="absolute top-0 left-1/4 w-1/2 h-1/3 opacity-30 pointer-events-none z-0"
              style={{
                background: `radial-gradient(circle, ${theme.colors.primary}10 0%, transparent 70%)`,
                filter: 'blur(70px)'
              }}
            />
            
            {/* Container para o conteúdo com leve efeito de aura */}
            <div className="relative z-10">
          {children}
            </div>
        </main>
          
          {/* Barra de navegação inferior para mobile - Estilo moderno flutuante */}
          <div 
            className="md:hidden flex justify-around items-center py-2 px-4 z-10 fixed bottom-0 left-0 right-0 border-t"
            style={{ 
              backgroundColor: 'rgba(31, 41, 55, 0.98)',
              backdropFilter: 'blur(12px)',
              borderColor: `${theme.colors.primary}20`,
              boxShadow: '0 -1px 8px rgba(0,0,0,0.15)'
            }}
          >
            {navItems.slice(0, 4).map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link 
                  key={item.name}
                  href={item.href}
                  className="flex flex-col items-center py-2 px-3 blog-clickable-element relative"
                  style={{ 
                    color: isActive ? theme.colors.primary : theme.colors.textSecondary
                  }}
                >
                  {isActive && (
                    <div 
                      className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-6 h-1 rounded-full"
                      style={{ 
                        background: `linear-gradient(90deg, ${theme.colors.primary}, ${theme.colors.accent})`,
                      }}
                    />
                  )}
                  {item.icon}
                  <span className="text-xs mt-1">{item.name}</span>
                </Link>
              );
            })}
            {isAdmin && (
              <Link 
                href="/dashboard/blog/novo" 
                className="flex flex-col items-center py-1 px-2 blog-clickable-element"
                style={{ 
                  color: theme.colors.textPrimary
                }}
              >
                <div 
                  className="h-8 w-8 flex items-center justify-center rounded-full"
                  style={{ 
                    background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.accent})`,
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="#121212">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-xs mt-1">Novo</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 