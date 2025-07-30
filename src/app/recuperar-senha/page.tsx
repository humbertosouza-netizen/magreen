'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import theme from '@/styles/theme';

export default function RecuperarSenha() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  const handleRecoverPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login?reset=true`,
      });

      if (error) throw error;
      
      setEmailSent(true);
      setMessage({
        text: 'Email de recuperação enviado! Verifique sua caixa de entrada.',
        type: 'success'
      });
    } catch (error: any) {
      setMessage({
        text: error.message || 'Erro ao enviar email de recuperação',
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

          <h1 
            className="text-xl sm:text-2xl font-bold mb-2"
            style={{ 
              color: theme.colors.textPrimary,
              fontFamily: theme.typography.fontFamily.heading
            }}
          >
            Recuperar Senha
          </h1>
          
          <p 
            className="mt-2 text-sm"
            style={{ 
              color: 'rgba(255, 255, 255, 0.9)',
              fontFamily: theme.typography.fontFamily.body
            }}
          >
            {emailSent 
              ? 'Instruções enviadas para seu email'
              : 'Digite seu email para receber instruções de recuperação'
            }
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

        {!emailSent ? (
          <form onSubmit={handleRecoverPassword} className="mt-6 sm:mt-8 space-y-5 sm:space-y-6">
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
                {loading ? 'Enviando...' : 'Enviar Email de Recuperação'}
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-6 sm:mt-8 space-y-4 text-center">
            <div 
              className="p-4 rounded-lg"
              style={{ 
                backgroundColor: 'rgba(46, 160, 67, 0.1)',
                border: `1px solid ${theme.colors.success}30`
              }}
            >
              <h3 
                className="text-lg font-medium mb-2"
                style={{ color: theme.colors.success }}
              >
                Email Enviado!
              </h3>
              <p 
                className="text-sm"
                style={{ color: 'rgba(255, 255, 255, 0.8)' }}
              >
                Verifique sua caixa de entrada e clique no link para redefinir sua senha.
              </p>
            </div>
            
            <button
              onClick={() => {
                setEmailSent(false);
                setEmail('');
                setMessage(null);
              }}
              className="text-sm hover:underline"
              style={{ color: theme.colors.accent }}
            >
              Enviar para outro email
            </button>
          </div>
        )}

        <div className="mt-6 text-center">
          <Link 
            href="/login" 
            className="text-sm hover:underline"
            style={{ color: theme.colors.accent }}
          >
            ← Voltar ao Login
          </Link>
        </div>
      </div>
    </div>
  );
} 