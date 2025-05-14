'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import theme from '@/styles/theme';

export default function SegurancaPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [mfaMessage, setMfaMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [updatingMfa, setUpdatingMfa] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function loadUser() {
      try {
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          router.push('/login');
          return;
        }

        setUser(data.session.user);
        
        // Verificar status da MFA (exemplo, na prática precisaria verificar no backend)
        // Esta é uma simplificação, você precisará implementar a lógica real conforme sua configuração no Supabase
        setMfaEnabled(false); // Valor inicial padrão
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [router]);

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações básicas
    if (newPassword.length < 6) {
      setPasswordMessage({ text: 'A nova senha deve ter pelo menos 6 caracteres', type: 'error' });
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ text: 'As senhas não coincidem', type: 'error' });
      return;
    }

    setUpdatingPassword(true);
    setPasswordMessage(null);

    try {
      // Para alterar a senha no Supabase, você precisa primeiro verificar a senha atual
      // e depois atualizar para a nova senha
      // Na API atual do Supabase, não há um método simples para isso, então estamos simulando
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;
      
      setPasswordMessage({ text: 'Senha atualizada com sucesso!', type: 'success' });
      setNewPassword('');
      setCurrentPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Erro ao atualizar senha:', error);
      setPasswordMessage({ text: error.message || 'Erro ao atualizar senha', type: 'error' });
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleToggleMfa = async () => {
    setUpdatingMfa(true);
    setMfaMessage(null);

    try {
      // Aqui você implementaria a lógica real para ativar/desativar MFA
      // Esta é uma simplificação para demonstração
      setTimeout(() => {
        setMfaEnabled(!mfaEnabled);
        setMfaMessage({ 
          text: !mfaEnabled 
            ? 'Autenticação de dois fatores ativada com sucesso!' 
            : 'Autenticação de dois fatores desativada', 
          type: 'success' 
        });
        setUpdatingMfa(false);
      }, 1000);
    } catch (error: any) {
      console.error('Erro ao configurar MFA:', error);
      setMfaMessage({ text: 'Erro ao configurar autenticação de dois fatores', type: 'error' });
      setUpdatingMfa(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div 
          className="animate-spin rounded-full h-12 w-12 border-b-2"
          style={{ borderColor: theme.colors.primary }}
        ></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <h1 
          className="text-xl sm:text-2xl font-bold"
          style={{ 
            color: theme.colors.textPrimary,
            fontFamily: theme.typography.fontFamily.heading
          }}
        >
          Segurança da Conta
        </h1>
        <Link 
          href="/dashboard" 
          className="px-4 py-2 rounded-md transition-colors text-center sm:text-left"
          style={{ 
            backgroundColor: theme.colors.backgroundLight,
            color: theme.colors.textPrimary,
            fontFamily: theme.typography.fontFamily.body
          }}
        >
          Voltar ao Dashboard
        </Link>
      </div>
      
      {/* Seção de alteração de senha */}
      <div 
        className="rounded-lg p-4 sm:p-6 mb-6 shadow-md"
        style={{ 
          backgroundColor: theme.colors.surface,
          boxShadow: theme.shadows.md,
          border: `1px solid ${theme.colors.primary}30`,
        }}
      >
        <h2 
          className="text-lg sm:text-xl font-medium mb-4"
          style={{ 
            color: theme.colors.textPrimary,
            fontFamily: theme.typography.fontFamily.heading 
          }}
        >
          Alterar Senha
        </h2>
        
        {passwordMessage && (
          <div 
            className={`p-4 mb-4 rounded-md text-sm`}
            style={{ 
              backgroundColor: passwordMessage.type === 'success' 
                ? `${theme.colors.primary}20` 
                : 'rgba(230, 57, 70, 0.2)',
              color: passwordMessage.type === 'success' 
                ? theme.colors.primary 
                : '#e63946',
              border: `1px solid ${passwordMessage.type === 'success' 
                ? theme.colors.primary 
                : '#e63946'}30`,
            }}
          >
            {passwordMessage.text}
          </div>
        )}
        
        <form onSubmit={handlePasswordUpdate}>
          <div className="space-y-4">
            <div>
              <label 
                htmlFor="current-password" 
                className="block text-sm font-medium mb-1"
                style={{ 
                  color: theme.colors.textSecondary,
                  fontFamily: theme.typography.fontFamily.heading
                }}
              >
                Senha Atual
              </label>
              <input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none text-sm sm:text-base"
                style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderColor: `${theme.colors.primary}30`,
                  color: theme.colors.textPrimary,
                  transition: theme.transitions.medium
                }}
                required
              />
            </div>
            
            <div>
              <label 
                htmlFor="new-password" 
                className="block text-sm font-medium mb-1"
                style={{ 
                  color: theme.colors.textSecondary,
                  fontFamily: theme.typography.fontFamily.heading
                }}
              >
                Nova Senha
              </label>
              <input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none text-sm sm:text-base"
                style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderColor: `${theme.colors.primary}30`,
                  color: theme.colors.textPrimary,
                  transition: theme.transitions.medium
                }}
                required
              />
            </div>
            
            <div>
              <label 
                htmlFor="confirm-password" 
                className="block text-sm font-medium mb-1"
                style={{ 
                  color: theme.colors.textSecondary,
                  fontFamily: theme.typography.fontFamily.heading
                }}
              >
                Confirmar Nova Senha
              </label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none text-sm sm:text-base"
                style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderColor: `${theme.colors.primary}30`,
                  color: theme.colors.textPrimary,
                  transition: theme.transitions.medium
                }}
                required
              />
            </div>
            
            <div>
              <button
                type="submit"
                disabled={updatingPassword}
                className="px-4 py-2 rounded-md disabled:opacity-50 transition-all text-sm sm:text-base touch-manipulation"
                style={{ 
                  backgroundColor: theme.colors.primary,
                  color: theme.colors.background,
                  fontFamily: theme.typography.fontFamily.heading,
                  fontWeight: theme.typography.fontWeight.semiBold,
                  boxShadow: theme.shadows.sm
                }}
              >
                {updatingPassword ? 'Atualizando...' : 'Atualizar Senha'}
              </button>
            </div>
          </div>
        </form>
      </div>
      
      {/* Seção de autenticação de dois fatores */}
      <div 
        className="rounded-lg p-4 sm:p-6 shadow-md"
        style={{ 
          backgroundColor: theme.colors.surface,
          boxShadow: theme.shadows.md,
          border: `1px solid ${theme.colors.primary}30`,
        }}
      >
        <h2 
          className="text-lg sm:text-xl font-medium mb-4"
          style={{ 
            color: theme.colors.textPrimary,
            fontFamily: theme.typography.fontFamily.heading 
          }}
        >
          Autenticação de Dois Fatores
        </h2>
        
        {mfaMessage && (
          <div 
            className={`p-4 mb-4 rounded-md text-sm`}
            style={{ 
              backgroundColor: mfaMessage.type === 'success' 
                ? `${theme.colors.primary}20` 
                : 'rgba(230, 57, 70, 0.2)',
              color: mfaMessage.type === 'success' 
                ? theme.colors.primary 
                : '#e63946',
              border: `1px solid ${mfaMessage.type === 'success' 
                ? theme.colors.primary 
                : '#e63946'}30`,
            }}
          >
            {mfaMessage.text}
          </div>
        )}
        
        <p 
          className="mb-4 text-sm"
          style={{ color: theme.colors.textSecondary }}
        >
          A autenticação de dois fatores adiciona uma camada extra de segurança à sua conta, exigindo um código além da sua senha ao fazer login.
        </p>
        
        <div 
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 rounded-md gap-3"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
        >
          <div>
            <p 
              className="font-medium"
              style={{ color: theme.colors.textPrimary }}
            >
              Status: <span style={{ color: mfaEnabled ? theme.colors.primary : theme.colors.error }}>
                {mfaEnabled ? 'Ativada' : 'Desativada'}
              </span>
            </p>
            <p 
              className="text-sm mt-1"
              style={{ color: theme.colors.textSecondary }}
            >
              {mfaEnabled 
                ? 'Sua conta está protegida com autenticação de dois fatores.' 
                : 'Recomendamos ativar a autenticação de dois fatores para maior segurança.'}
            </p>
          </div>
          <button
            onClick={handleToggleMfa}
            disabled={updatingMfa}
            className="px-4 py-2 rounded-md transition-colors disabled:opacity-50 text-sm sm:text-base touch-manipulation mt-2 sm:mt-0"
            style={{
              backgroundColor: mfaEnabled 
                ? 'rgba(230, 57, 70, 0.2)'
                : `${theme.colors.primary}20`,
              color: mfaEnabled 
                ? theme.colors.error
                : theme.colors.primary,
              border: `1px solid ${mfaEnabled ? theme.colors.error : theme.colors.primary}30`,
              fontFamily: theme.typography.fontFamily.heading
            }}
          >
            {updatingMfa 
              ? 'Processando...' 
              : mfaEnabled 
                ? 'Desativar' 
                : 'Ativar'}
          </button>
        </div>
      </div>
    </div>
  );
} 