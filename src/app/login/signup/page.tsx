'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import theme from '@/styles/theme';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [instagram, setInstagram] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nickname,
            instagram
          }
        }
      });

      if (error) throw error;
      
      // Armazenar flag de registro bem-sucedido no localStorage
      localStorage.setItem('justRegistered', 'true');
      
      // Redirecionar para o login
      router.push('/login');
    } catch (error: any) {
      setError(error.message || 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="flex min-h-screen flex-col items-center justify-center relative px-4 py-8"
      style={{ 
        backgroundColor: theme.colors.background,
        backgroundImage: `url('/images/mayan-temple-background.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Overlay escuro para melhorar a legibilidade */}
      <div 
        className="absolute inset-0 z-0" 
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.65)'
        }}
      />
      
      <div 
        className="w-full max-w-md p-6 sm:p-8 space-y-6 sm:space-y-8 rounded-lg shadow-lg z-10"
        style={{ 
          backgroundColor: `${theme.colors.surface}ee`,
          backdropFilter: 'blur(5px)',
          border: `2px solid ${theme.colors.primary}`,
          boxShadow: theme.shadows.glow
        }}
      >
        <div className="text-center">
          <div className="mb-6 flex justify-center">
            <div className="relative w-64 h-64">
              <img 
                src="/images/logo/magnificencia-green-full-logo.png" 
                alt="MagnifiGreen Logo" 
                className="max-w-full"
                style={{
                  width: '250px',
                  height: 'auto',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3))'
                }}
              />
            </div>
          </div>

          <p 
            className="mt-2 text-sm"
            style={{ 
              color: 'rgba(255, 255, 255, 0.9)',
              fontFamily: theme.typography.fontFamily.body
            }}
          >
            Crie sua conta para acessar o dashboard
          </p>
        </div>

        {error && (
          <div 
            className="p-3 rounded text-sm"
            style={{ 
              backgroundColor: 'rgba(230, 57, 70, 0.2)',
              border: '1px solid rgba(230, 57, 70, 0.3)',
              color: '#e63946'
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSignUp} className="mt-6 sm:mt-8 space-y-5 sm:space-y-6">
          <div>
            <label 
              htmlFor="email" 
              className="block text-sm font-medium mb-1.5"
              style={{ color: 'rgba(255, 255, 255, 0.9)' }}
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2.5 sm:py-2 border rounded-md shadow-sm focus:outline-none text-base sm:text-sm"
              style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.07)',
                borderColor: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                transition: theme.transitions.medium
              }}
              placeholder="seu@email.com"
            />
          </div>
          
          <div>
            <label 
              htmlFor="nickname" 
              className="block text-sm font-medium mb-1.5"
              style={{ color: 'rgba(255, 255, 255, 0.9)' }}
            >
              Nickname
            </label>
            <input
              id="nickname"
              name="nickname"
              type="text"
              required
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="mt-1 block w-full px-3 py-2.5 sm:py-2 border rounded-md shadow-sm focus:outline-none text-base sm:text-sm"
              style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.07)',
                borderColor: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                transition: theme.transitions.medium
              }}
              placeholder="Seu apelido"
            />
          </div>

          <div>
            <label 
              htmlFor="instagram" 
              className="block text-sm font-medium mb-1.5"
              style={{ color: 'rgba(255, 255, 255, 0.9)' }}
            >
              Instagram (@ ou link)
            </label>
            <input
              id="instagram"
              name="instagram"
              type="text"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              className="mt-1 block w-full px-3 py-2.5 sm:py-2 border rounded-md shadow-sm focus:outline-none text-base sm:text-sm"
              style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.07)',
                borderColor: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                transition: theme.transitions.medium
              }}
              placeholder="@seuinsta ou instagram.com/seuinsta"
            />
          </div>

          <div>
            <label 
              htmlFor="password" 
              className="block text-sm font-medium mb-1.5"
              style={{ color: 'rgba(255, 255, 255, 0.9)' }}
            >
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2.5 sm:py-2 border rounded-md shadow-sm focus:outline-none text-base sm:text-sm"
              style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.07)',
                borderColor: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                transition: theme.transitions.medium
              }}
              placeholder="••••••••"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2.5 sm:py-2 px-4 border border-transparent rounded-md shadow-sm text-base sm:text-sm font-medium disabled:opacity-50"
              style={{ 
                backgroundColor: theme.colors.primary,
                color: theme.colors.background,
                transition: theme.transitions.medium,
                fontFamily: theme.typography.fontFamily.heading,
                fontWeight: theme.typography.fontWeight.semiBold
              }}
            >
              {loading ? 'Cadastrando...' : 'Cadastrar'}
            </button>
          </div>
        </form>

        <div className="text-center mt-4">
          <p 
            className="text-sm"
            style={{ color: 'rgba(255, 255, 255, 0.9)' }}
          >
            Já tem uma conta?{' '}
            <Link 
              href="/login" 
              className="hover:underline transition-all"
              style={{ 
                color: theme.colors.accent,
                fontWeight: theme.typography.fontWeight.medium 
              }}
            >
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 