'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import theme from '@/styles/theme';
import Image from 'next/image';

export default function Header() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function getUser() {
      try {
        const { data } = await supabase.auth.getUser();
        setUser(data.user);
      } catch (error) {
        console.error('Erro ao buscar usuário:', error);
      } finally {
        setLoading(false);
      }
    }

    getUser();
  }, []);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/login');
    } catch (error) {
      console.error('Erro ao sair:', error);
    }
  };

  return (
    <header 
      className="sticky top-0 z-30 border-b"
      style={{ 
        backgroundColor: theme.colors.surface,
        borderColor: `${theme.colors.primary}30`,
        boxShadow: theme.shadows.sm
      }}
    >
      <div className="flex items-center justify-between px-4 py-2">
        {/* Logo para versão mobile (só aparece em mobile) */}
        <div className="flex md:hidden items-center">
          <Link 
            href="/" 
            className="flex items-center justify-center cursor-pointer"
          >
            <div className="relative" style={{ width: '100px', height: '100px' }}>
              <Image
                src="/images/logo/magnificencia-green-full-logo.png"
                alt="MagnifiGreen Logo"
                fill
                style={{ objectFit: 'contain' }}
                priority
              />
            </div>
          </Link>
        </div>

        {/* Título da página - visível apenas em desktop */}
        <div className="hidden md:flex flex-1 justify-center md:justify-start">
          <h1 
            className="text-xl font-bold"
            style={{ 
              color: theme.colors.accent,
              fontFamily: theme.typography.fontFamily.heading
            }}
          >
            Dashboard Magnificência Green
          </h1>
        </div>

        {/* Perfil do usuário - Desktop */}
        <div className="relative md:block hidden">
          {loading ? (
            <div 
              className="w-8 h-8 rounded-full animate-pulse"
              style={{ backgroundColor: 'rgba(127, 219, 63, 0.2)' }}
            ></div>
          ) : user ? (
            <div className="flex items-center">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center focus:outline-none"
              >
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center mr-2 border"
                  style={{ 
                    backgroundColor: 'rgba(127, 219, 63, 0.1)',
                    borderColor: theme.colors.primary,
                    color: theme.colors.primary
                  }}
                >
                  {user.email ? (
                    <span className="text-sm font-medium">
                      {user.email.charAt(0).toUpperCase()}
                    </span>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
                <span 
                  className="hidden md:block text-sm"
                  style={{ color: theme.colors.textPrimary }}
                >
                  {user.email}
                </span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 ml-1"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  style={{ color: theme.colors.textSecondary }}
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              {userMenuOpen && (
                <div 
                  className="absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 z-50"
                  style={{ 
                    backgroundColor: theme.colors.surface,
                    borderColor: `${theme.colors.primary}30`,
                    border: `1px solid ${theme.colors.primary}30`,
                    boxShadow: theme.shadows.lg
                  }}
                >
                  <Link
                    href="/dashboard/perfil"
                    className="block px-4 py-2 text-sm"
                    style={{ color: theme.colors.textPrimary }}
                    onClick={() => setUserMenuOpen(false)}
                  >
                    Meu Perfil
                  </Link>
                  <Link
                    href="/dashboard/seguranca"
                    className="block px-4 py-2 text-sm"
                    style={{ color: theme.colors.textPrimary }}
                    onClick={() => setUserMenuOpen(false)}
                  >
                    Segurança
                  </Link>
                  <div 
                    className="border-t my-1"
                    style={{ borderColor: `${theme.colors.primary}20` }}
                  ></div>
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      handleSignOut();
                    }}
                    className="block w-full text-left px-4 py-2 text-sm"
                    style={{ color: theme.colors.error }}
                  >
                    Sair
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <Link
                href="/login"
                className="inline-flex items-center px-4 py-2 border rounded-md text-sm font-medium"
                style={{
                  backgroundColor: 'transparent',
                  borderColor: theme.colors.primary,
                  color: theme.colors.primary
                }}
              >
                Entrar
              </Link>
              <Link
                href="/login/signup"
                className="inline-flex items-center px-4 py-2 border rounded-md text-sm font-medium"
                style={{
                  backgroundColor: theme.colors.primary,
                  borderColor: theme.colors.primary,
                  color: theme.colors.background
                }}
              >
                Cadastrar
              </Link>
            </div>
          )}
        </div>
        
        {/* Ícones de navegação para mobile */}
        <div className="flex md:hidden items-center gap-4">
          <Link 
            href="/dashboard/perfil" 
            className="p-2 relative blog-clickable-element flex items-center justify-center cursor-pointer"
            style={{ color: theme.colors.textPrimary }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          </Link>
          
          <Link 
            href="/dashboard/seguranca" 
            className="p-2 relative blog-clickable-element flex items-center justify-center cursor-pointer"
            style={{ color: theme.colors.textPrimary }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </Link>
          
          <Link 
            href="/dashboard/produtos" 
            className="p-2 relative blog-clickable-element flex items-center justify-center cursor-pointer"
            style={{ color: theme.colors.textPrimary }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </Link>
        </div>
      </div>
    </header>
  );
} 