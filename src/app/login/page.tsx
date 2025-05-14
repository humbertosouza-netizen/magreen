'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import theme from '@/styles/theme';

// Componente cliente que usa useSearchParams
function LoginWithParams({ onRegistered }: { onRegistered: (registered: boolean) => void }) {
  const searchParams = useSearchParams();
  
  useEffect(() => {
    // Verificar se o usuário acabou de se registrar
    const registered = searchParams.get('registered');
    if (registered) {
      onRegistered(true);
    }
  }, [searchParams, onRegistered]);
  
  return null;
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const router = useRouter();

  const handleRegistered = (registered: boolean) => {
    if (registered) {
      setMessage({
        text: 'Cadastro realizado com sucesso! Por favor, faça login.',
        type: 'success'
      });
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      // Redirecionar para o dashboard após login bem-sucedido
      router.push('/dashboard/estudos');
    } catch (error: any) {
      setMessage({
        text: error.message || 'Erro ao fazer login',
        type: 'error'
      });
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
      {/* Suspense boundary for useSearchParams */}
      <Suspense fallback={null}>
        <LoginWithParams onRegistered={handleRegistered} />
      </Suspense>

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
            Faça login para acessar a plataforma
          </p>
        </div>

        {message && (
          <div 
            className="p-3 rounded text-sm"
            style={{ 
              backgroundColor: message.type === 'success' 
                ? 'rgba(46, 160, 67, 0.2)' 
                : 'rgba(230, 57, 70, 0.2)',
              border: `1px solid ${message.type === 'success' 
                ? 'rgba(46, 160, 67, 0.3)' 
                : 'rgba(230, 57, 70, 0.3)'}`,
              color: message.type === 'success' ? '#2ea043' : '#e63946'
            }}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleLogin} className="mt-6 sm:mt-8 space-y-5 sm:space-y-6">
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
            <div className="flex items-center justify-between mb-1.5">
              <label 
                htmlFor="password" 
                className="block text-sm font-medium"
                style={{ color: 'rgba(255, 255, 255, 0.9)' }}
              >
                Senha
              </label>
              <Link 
                href="/recuperar-senha" 
                className="text-xs hover:underline"
                style={{ color: theme.colors.accent }}
              >
                Esqueceu a senha?
              </Link>
            </div>
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
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </div>
        </form>

        <div className="text-center mt-4">
          <p 
            className="text-sm"
            style={{ color: 'rgba(255, 255, 255, 0.9)' }}
          >
            Não tem uma conta?{' '}
            <Link 
              href="/login/signup" 
              className="hover:underline transition-all"
              style={{ 
                color: theme.colors.accent,
                fontWeight: theme.typography.fontWeight.medium 
              }}
            >
              Cadastre-se
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 