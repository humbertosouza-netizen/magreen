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
        <div className="flex md:hidden w-full justify-center">
          <Link 
            href="/" 
            className="flex items-center justify-center"
          >
            <div className="relative" style={{ width: '120px', height: '90px' }}>
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

        {/* Perfil do usuário */}
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
      </div>
    </header>
  );
} 