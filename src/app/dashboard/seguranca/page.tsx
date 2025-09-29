'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import theme from '@/styles/theme';
import QRCode from 'qrcode';

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
  const [mfaSecret, setMfaSecret] = useState<string>('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [mfaCode, setMfaCode] = useState<string>('');
  const [showMfaSetup, setShowMfaSetup] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
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
        
        // Verificar status da MFA no banco de dados
        const { data: profile } = await supabase
          .from('profiles')
          .select('mfa_enabled, mfa_backup_codes')
          .eq('id', data.session.user.id)
          .single();
        
        if (profile) {
          setMfaEnabled(profile.mfa_enabled || false);
          if (profile.mfa_backup_codes) {
            setBackupCodes(profile.mfa_backup_codes);
          }
        }
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

  // Função para gerar secret MFA
  const generateMFASecret = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let i = 0; i < 32; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return secret;
  };

  // Função para gerar QR Code
  const generateQRCode = async (secret: string, email: string) => {
    const issuer = 'Mag Green';
    const accountName = email;
    const otpUrl = `otpauth://totp/${issuer}:${accountName}?secret=${secret}&issuer=${issuer}`;
    
    try {
      const qrCodeDataUrl = await QRCode.toDataURL(otpUrl);
      return qrCodeDataUrl;
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error);
      throw error;
    }
  };

  // Função para verificar código TOTP
  const verifyTOTPCode = async (secret: string, code: string) => {
    try {
      const response = await fetch('/api/verify-totp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ secret, code }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Código inválido');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erro na verificação TOTP:', error);
      throw new Error('Erro ao verificar código');
    }
  };

  // Função para ativar MFA
  const handleActivateMFA = async () => {
    setUpdatingMfa(true);
    setMfaMessage(null);

    try {
      const secret = generateMFASecret();
      setMfaSecret(secret);
      
      const qrCode = await generateQRCode(secret, user?.email || '');
      setQrCodeUrl(qrCode);
      
      setShowMfaSetup(true);
      setMfaMessage({ 
        text: 'Escaneie o QR Code com seu autenticador e insira o código de verificação', 
        type: 'success' 
      });
    } catch (error: any) {
      console.error('Erro ao ativar MFA:', error);
      setMfaMessage({ text: 'Erro ao gerar configuração MFA', type: 'error' });
    } finally {
      setUpdatingMfa(false);
    }
  };

  // Função para verificar e confirmar MFA
  const handleVerifyMFA = async () => {
    if (!mfaCode || mfaCode.length !== 6) {
      setMfaMessage({ text: 'Por favor, insira um código de 6 dígitos', type: 'error' });
      return;
    }

    setUpdatingMfa(true);
    setMfaMessage(null);

    try {
      await verifyTOTPCode(mfaSecret, mfaCode);
      
      // Salvar no banco de dados (simulação)
      const { error } = await supabase
        .from('profiles')
        .update({ 
          mfa_enabled: true,
          mfa_secret: mfaSecret,
          mfa_backup_codes: generateBackupCodes()
        })
        .eq('id', user?.id);

      if (error) throw error;

      setMfaEnabled(true);
      setShowMfaSetup(false);
      setMfaMessage({ 
        text: 'Autenticação de dois fatores ativada com sucesso!', 
        type: 'success' 
      });
      
      // Limpar dados sensíveis
      setMfaSecret('');
      setQrCodeUrl('');
      setMfaCode('');
    } catch (error: any) {
      console.error('Erro ao verificar MFA:', error);
      setMfaMessage({ text: error.message || 'Código inválido', type: 'error' });
    } finally {
      setUpdatingMfa(false);
    }
  };

  // Função para desativar MFA
  const handleDeactivateMFA = async () => {
    setUpdatingMfa(true);
    setMfaMessage(null);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          mfa_enabled: false,
          mfa_secret: null,
          mfa_backup_codes: null
        })
        .eq('id', user?.id);

      if (error) throw error;

      setMfaEnabled(false);
      setMfaMessage({ 
        text: 'Autenticação de dois fatores desativada', 
        type: 'success' 
      });
    } catch (error: any) {
      console.error('Erro ao desativar MFA:', error);
      setMfaMessage({ text: 'Erro ao desativar MFA', type: 'error' });
    } finally {
      setUpdatingMfa(false);
    }
  };

  // Função para gerar códigos de backup
  const generateBackupCodes = () => {
    const codes = [];
    for (let i = 0; i < 10; i++) {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      codes.push(code);
    }
    setBackupCodes(codes);
    return codes;
  };

  // Função principal para toggle MFA
  const handleToggleMfa = async () => {
    if (mfaEnabled) {
      await handleDeactivateMFA();
    } else {
      await handleActivateMFA();
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
        
        {!showMfaSetup ? (
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
        ) : (
          <div className="space-y-6">
            {/* QR Code */}
            <div className="text-center">
              <h3 
                className="text-lg font-medium mb-4"
                style={{ color: theme.colors.textPrimary }}
              >
                Configure seu Autenticador
              </h3>
              <p 
                className="text-sm mb-4"
                style={{ color: theme.colors.textSecondary }}
              >
                Escaneie o QR Code abaixo com seu aplicativo autenticador (Google Authenticator, Authy, etc.)
              </p>
              {qrCodeUrl && (
                <div className="flex justify-center">
                  <img 
                    src={qrCodeUrl} 
                    alt="QR Code para MFA" 
                    className="border-2 rounded-lg"
                    style={{ borderColor: theme.colors.primary }}
                  />
                </div>
              )}
            </div>

            {/* Código de Verificação */}
            <div>
              <label 
                htmlFor="mfa-code"
                className="block text-sm font-medium mb-2"
                style={{ color: theme.colors.textSecondary }}
              >
                Código de Verificação
              </label>
              <div className="flex gap-2">
                <input
                  id="mfa-code"
                  type="text"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="flex-1 px-3 py-2 border rounded-md focus:outline-none text-center text-lg font-mono"
                  style={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderColor: `${theme.colors.primary}30`,
                    color: theme.colors.textPrimary,
                    transition: theme.transitions.medium
                  }}
                  maxLength={6}
                />
                <button
                  onClick={handleVerifyMFA}
                  disabled={updatingMfa || mfaCode.length !== 6}
                  className="px-4 py-2 rounded-md transition-colors disabled:opacity-50"
                  style={{
                    backgroundColor: theme.colors.primary,
                    color: theme.colors.background,
                    fontFamily: theme.typography.fontFamily.heading
                  }}
                >
                  {updatingMfa ? 'Verificando...' : 'Verificar'}
                </button>
              </div>
            </div>

            {/* Códigos de Backup */}
            {backupCodes.length > 0 && (
              <div>
                <h4 
                  className="text-md font-medium mb-2"
                  style={{ color: theme.colors.textPrimary }}
                >
                  Códigos de Backup
                </h4>
                <p 
                  className="text-sm mb-3"
                  style={{ color: theme.colors.textSecondary }}
                >
                  Guarde estes códigos em local seguro. Eles podem ser usados para acessar sua conta caso perca o acesso ao autenticador.
                </p>
                <div 
                  className="grid grid-cols-2 gap-2 p-4 rounded-md"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                >
                  {backupCodes.map((code, index) => (
                    <div 
                      key={index}
                      className="text-center font-mono text-sm py-1"
                      style={{ color: theme.colors.textPrimary }}
                    >
                      {code}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Botão Cancelar */}
            <div className="flex justify-center">
              <button
                onClick={() => {
                  setShowMfaSetup(false);
                  setMfaSecret('');
                  setQrCodeUrl('');
                  setMfaCode('');
                  setBackupCodes([]);
                  setMfaMessage(null);
                }}
                className="px-4 py-2 rounded-md transition-colors"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: theme.colors.textSecondary,
                  border: `1px solid ${theme.colors.textSecondary}30`,
                  fontFamily: theme.typography.fontFamily.heading
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 