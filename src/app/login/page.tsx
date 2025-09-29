'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import theme from '@/styles/theme';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const [needsMFA, setNeedsMFA] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaSecret, setMfaSecret] = useState('');
  const [userId, setUserId] = useState('');
  const router = useRouter();

  // Verificar localStorage e URL params
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const justRegistered = localStorage.getItem('justRegistered');
      const urlParams = new URLSearchParams(window.location.search);
      const resetParam = urlParams.get('reset');
      
      if (justRegistered) {
        setMessage({
          text: 'Cadastro realizado com sucesso! Por favor, faça login.',
          type: 'success'
        });
        // Limpar a flag após usar
        localStorage.removeItem('justRegistered');
      } else if (resetParam === 'true') {
        setMessage({
          text: 'Clique no link do email para redefinir sua senha ou faça login normalmente.',
          type: 'success'
        });
      }
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      // Verificar se o usuário tem MFA ativado
      const { data: profile } = await supabase
        .from('profiles')
        .select('mfa_enabled, mfa_secret')
        .eq('id', data.user.id)
        .single();

      if (profile?.mfa_enabled && profile?.mfa_secret) {
        // Usuário tem MFA ativado, solicitar código
        setNeedsMFA(true);
        setMfaSecret(profile.mfa_secret);
        setUserId(data.user.id);
        setMessage({
          text: 'Digite o código de 6 dígitos do seu autenticador',
          type: 'success'
        });
      } else {
        // Usuário não tem MFA, redirecionar normalmente
        router.push('/dashboard/estudos');
      }
    } catch (error: any) {
      setMessage({
        text: error.message || 'Erro ao fazer login',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMFAVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // Verificar código TOTP
      const response = await fetch('/api/verify-totp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ secret: mfaSecret, code: mfaCode }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Código inválido');
      }

      // Código válido, redirecionar para dashboard
      router.push('/dashboard/estudos');
    } catch (error: any) {
      setMessage({
        text: error.message || 'Código inválido',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setNeedsMFA(false);
    setMfaCode('');
    setMfaSecret('');
    setUserId('');
    setMessage(null);
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

        {!needsMFA ? (
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
              autoComplete="email"
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
              autoComplete="current-password"
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
              aria-label={loading ? 'Fazendo login, aguarde...' : 'Fazer login na plataforma'}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </div>
        </form>
        ) : (
          <form onSubmit={handleMFAVerification} className="mt-6 sm:mt-8 space-y-5 sm:space-y-6">
            <div className="text-center mb-6">
              <h2 
                className="text-xl font-bold mb-2"
                style={{ color: 'rgba(255, 255, 255, 0.9)' }}
              >
                Verificação de Dois Fatores
              </h2>
              <p 
                className="text-sm"
                style={{ color: 'rgba(255, 255, 255, 0.7)' }}
              >
                Digite o código de 6 dígitos do seu autenticador
              </p>
            </div>

            <div>
              <label 
                htmlFor="mfa-code"
                className="block text-sm font-medium mb-1.5"
                style={{ color: 'rgba(255, 255, 255, 0.9)' }}
              >
                Código de Verificação
              </label>
              <input
                id="mfa-code"
                name="mfa-code"
                type="text"
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="w-full px-4 py-3 rounded-lg text-center text-lg font-mono"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  transition: theme.transitions.medium
                }}
                maxLength={6}
                required
                autoComplete="one-time-code"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleBackToLogin}
                className="flex-1 px-4 py-3 rounded-lg transition-colors"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: 'rgba(255, 255, 255, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  fontFamily: theme.typography.fontFamily.heading
                }}
              >
                Voltar
              </button>
              <button
                type="submit"
                disabled={loading || mfaCode.length !== 6}
                className="flex-1 px-4 py-3 rounded-lg transition-colors disabled:opacity-50"
                style={{
                  backgroundColor: theme.colors.primary,
                  color: theme.colors.background,
                  fontFamily: theme.typography.fontFamily.heading,
                  fontWeight: theme.typography.fontWeight.semiBold
                }}
              >
                {loading ? 'Verificando...' : 'Verificar'}
              </button>
            </div>
          </form>
        )}

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