'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { colors } from '@/styles/colors';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import theme from '@/styles/theme';

interface SidebarProps {
  user: any;
}

// Componente de ícone de folha para o tema
const LeafIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg 
    width="20" 
    height="20" 
    viewBox="0 0 24 24" 
    className={className}
    style={style}
  >
    <path 
      d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z" 
      fill="currentColor"
    />
  </svg>
);

// Ícones do menu
const menuIcons = {
  dashboard: (active: boolean) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 13H10V4H4V13ZM4 20H10V15H4V20ZM12 20H18V11H12V20ZM12 4V9H18V4H12Z" 
        fill={active ? theme.colors.primary : theme.colors.textSecondary} />
    </svg>
  ),
  perfil: (active: boolean) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" 
        fill={active ? theme.colors.primary : theme.colors.textSecondary} />
    </svg>
  ),
  seguranca: (active: boolean) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1ZM12 11.99H19C18.47 16.11 15.72 19.78 12 20.93V12H5V6.3L12 3.19V11.99Z" 
        fill={active ? theme.colors.primary : theme.colors.textSecondary} />
    </svg>
  ),
  blog: (active: boolean) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M19 5V19H5V5H19ZM21 3H3V21H21V3ZM17 17H7V16H17V17ZM17 15H7V14H17V15ZM17 12H7V7H17V12Z" 
        fill={active ? theme.colors.primary : theme.colors.textSecondary} />
    </svg>
  ),
  usuarios: (active: boolean) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 11C17.66 11 18.99 9.66 18.99 8C18.99 6.34 17.66 5 16 5C14.34 5 13 6.34 13 8C13 9.66 14.34 11 16 11ZM8 11C9.66 11 10.99 9.66 10.99 8C10.99 6.34 9.66 5 8 5C6.34 5 5 6.34 5 8C5 9.66 6.34 11 8 11ZM8 13C5.67 13 1 14.17 1 16.5V19H15V16.5C15 14.17 10.33 13 8 13ZM16 13C15.71 13 15.38 13.02 15.03 13.05C16.19 13.89 17 15.02 17 16.5V19H23V16.5C23 14.17 18.33 13 16 13Z" 
        fill={active ? theme.colors.primary : theme.colors.textSecondary} />
    </svg>
  ),
  notificacoes: (active: boolean) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 22C13.1 22 14 21.1 14 20H10C10 21.1 10.9 22 12 22ZM18 16V11C18 7.93 16.36 5.36 13.5 4.68V4C13.5 3.17 12.83 2.5 12 2.5C11.17 2.5 10.5 3.17 10.5 4V4.68C7.63 5.36 6 7.92 6 11V16L4 18V19H20V18L18 16ZM16 17H8V11C8 8.52 9.51 6.5 12 6.5C14.49 6.5 16 8.52 16 11V17Z" 
        fill={active ? theme.colors.primary : theme.colors.textSecondary} />
    </svg>
  ),
};

// Interface dos links do menu
interface MenuItem {
  href: string;
  label: string;
  icon: (active: boolean) => JSX.Element;
  count?: number | null;
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function checkUserRole() {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
        
      if (!error && data) {
        setIsAdmin(data.role === 'ADMIN');
      }
    }
    
    checkUserRole();
  }, [user, supabase]);

  // Definição dos itens do menu
  const menuItems: MenuItem[] = [
    { href: '/dashboard', label: 'Dashboard', icon: menuIcons.dashboard },
    { href: '/dashboard/perfil', label: 'Meu Perfil', icon: menuIcons.perfil },
    { href: '/dashboard/seguranca', label: 'Segurança', icon: menuIcons.seguranca },
    { href: '/dashboard/blog', label: 'Blog & Conteúdo', icon: menuIcons.blog },
    { href: '/dashboard/usuarios', label: 'Usuários', icon: menuIcons.usuarios },
    { 
      href: '/dashboard/notificacoes', 
      label: 'Notificações', 
      icon: menuIcons.notificacoes, 
    },
  ];

  // Itens de navegação apenas para administradores
  const adminItems = [
    {
      name: 'Gerenciar Usuários',
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ),
      href: '/admin/usuarios',
    },
    {
      name: 'Gerenciar Blog',
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
          />
        </svg>
      ),
      href: '/admin/blog',
    },
  ];

  return (
    <aside
      className={`${
        expanded ? 'w-64' : 'w-20'
      } h-screen fixed left-0 top-0 z-40 transition-width duration-300 ease-in-out`}
      style={{ backgroundColor: theme.colors.surface }}
    >
      <div className="h-full flex flex-col px-3 py-4">
        <div className="flex items-center justify-between mb-6">
          {expanded ? (
            <Link href="/dashboard" className="text-xl font-bold text-white flex items-center">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ 
                  backgroundColor: theme.colors.backgroundMedium,
                  color: theme.colors.primary
                }}
              >
                <LeafIcon />
              </div>
              <div className="ml-3">
                <h1 
                  className="text-lg font-bold tracking-wide"
                  style={{ fontFamily: theme.typography.fontFamily.heading }}
                >
                  <span style={{ color: theme.colors.textPrimary }}>
                    MAGNIFI
                  </span>
                  <span style={{ color: theme.colors.primary }}>
                    GREEN
                  </span>
                </h1>
              </div>
            </Link>
          ) : (
            <Link href="/dashboard" className="flex justify-center w-full">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ 
                  backgroundColor: theme.colors.backgroundMedium,
                  color: theme.colors.primary
                }}
              >
                <LeafIcon />
              </div>
            </Link>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-white hover:text-gray-300 focus:outline-none"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {expanded ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 5l7 7-7 7M5 5l7 7-7 7"
                />
              )}
            </svg>
          </button>
        </div>

        <nav className="flex-1 space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center p-3 rounded-lg ${
                  expanded ? 'justify-start' : 'justify-center'
                } ${
                  isActive
                    ? 'bg-opacity-20 bg-white'
                    : 'hover:bg-opacity-10 hover:bg-white'
                }`}
              >
                <div
                  className={`${
                    isActive ? 'text-white' : 'text-gray-300'
                  }`}
                  style={{ color: isActive ? theme.colors.primary : 'inherit' }}
                >
                  {item.icon(isActive)}
                </div>
                {expanded && (
                  <span
                    className={`ml-3 ${
                      isActive ? 'font-medium text-white' : 'text-gray-300'
                    }`}
                  >
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
          
          {/* Seção de Administração - visível apenas para admins */}
          {isAdmin && (
            <>
              {expanded && (
                <div className="pt-6 mt-6 border-t border-gray-700">
                  <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Administração
                  </h3>
                </div>
              )}
              
              {adminItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center p-3 rounded-lg ${
                      expanded ? 'justify-start' : 'justify-center'
                    } ${
                      isActive
                        ? 'bg-opacity-20 bg-white'
                        : 'hover:bg-opacity-10 hover:bg-white'
                    }`}
                  >
                    <div
                      className={`${
                        isActive ? 'text-white' : 'text-gray-300'
                      }`}
                      style={{ color: isActive ? theme.colors.primary : '#ff9800' }}
                    >
                      {item.icon}
                    </div>
                    {expanded && (
                      <span
                        className={`ml-3 ${
                          isActive ? 'font-medium text-white' : 'text-gray-300'
                        }`}
                      >
                        {item.name}
                      </span>
                    )}
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        {expanded && (
          <div className="mt-6 pt-6 border-t border-gray-700">
            <div className="flex items-center px-3">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-gray-600 flex items-center justify-center text-white">
                  {user?.nickname ? user?.nickname.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || 'U'}
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-white">
                  {user?.nickname || user?.email || 'Usuário'}
                </p>
                <p className="text-xs text-gray-300">
                  {isAdmin ? 'Administrador' : 'Usuário padrão'}
                </p>
                <button 
                  onClick={async () => {
                    await supabase.auth.signOut();
                    window.location.href = '/login';
                  }} 
                  className="text-xs text-gray-300 hover:text-white"
                  style={{ color: theme.colors.primary }}
                >
                  Sair
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
} 