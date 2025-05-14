'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import theme from '@/styles/theme';

interface UserProfile {
  id: string;
  bio?: string;
  avatar_url?: string;
  nickname?: string;
  instagram?: string;
}

export default function PerfilPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function loadUserAndProfile() {
      try {
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          router.push('/login');
          return;
        }

        const currentUser = data.session.user;
        setUser(currentUser);

        // Verificar se o perfil existe, se não existir, criar um
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            // Perfil não existe, vamos criar um
            // Usar os dados dos metadados do usuário se disponíveis
            const userMetadata = currentUser.user_metadata || {};
            const { data: newProfile, error: createError } = await supabase
              .from('profiles')
              .insert([{ 
                id: currentUser.id,
                nickname: userMetadata.nickname || '',
                instagram: userMetadata.instagram || ''
              }])
              .select()
              .single();

            if (createError) {
              console.error('Erro ao criar perfil:', createError);
            } else {
              setProfile(newProfile);
            }
          } else {
            console.error('Erro ao buscar perfil:', error);
          }
        } else {
          // Verificar se os dados do perfil precisam ser atualizados dos metadados
          const userMetadata = currentUser.user_metadata || {};
          
          // Se o perfil não tem nickname ou instagram mas os metadados têm, atualize o perfil
          if ((userMetadata.nickname && !profileData.nickname) || 
              (userMetadata.instagram && !profileData.instagram)) {
            
            const updates = {
              ...profileData,
              nickname: profileData.nickname || userMetadata.nickname || '',
              instagram: profileData.instagram || userMetadata.instagram || '',
            };
            
            const { data: updatedProfile, error: updateError } = await supabase
              .from('profiles')
              .update(updates)
              .eq('id', currentUser.id)
              .select()
              .single();
              
            if (updateError) {
              console.error('Erro ao atualizar perfil com metadados:', updateError);
              setProfile(profileData);
            } else {
              setProfile(updatedProfile);
            }
          } else {
            setProfile(profileData);
          }
        }
      } catch (error) {
        console.error('Erro:', error);
      } finally {
        setLoading(false);
      }
    }

    loadUserAndProfile();
  }, [router]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          nickname: profile?.nickname,
          instagram: profile?.instagram,
          bio: profile?.bio,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;
      setMessage({ text: 'Perfil atualizado com sucesso!', type: 'success' });
    } catch (error: any) {
      console.error('Erro ao atualizar perfil:', error);
      setMessage({ text: 'Erro ao atualizar perfil. Tente novamente.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setProfile({
      ...profile!,
      [e.target.name]: e.target.value,
    });
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
          Informações Pessoais
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

      {message && (
        <div 
          className={`p-4 mb-6 rounded-md ${message.type === 'success' ? 'bg-green-100' : 'bg-red-100'}`}
          style={{ 
            backgroundColor: message.type === 'success' 
              ? `${theme.colors.primary}20` 
              : 'rgba(230, 57, 70, 0.2)',
            color: message.type === 'success' 
              ? theme.colors.primary 
              : '#e63946',
            border: `1px solid ${message.type === 'success' 
              ? theme.colors.primary 
              : '#e63946'}30`,
          }}
        >
          {message.text}
        </div>
      )}

      <div 
        className="rounded-lg p-4 sm:p-6 shadow-md"
        style={{ 
          backgroundColor: theme.colors.surface,
          boxShadow: theme.shadows.md,
          border: `1px solid ${theme.colors.primary}30`,
        }}
      >
        <form onSubmit={handleProfileUpdate}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div>
              <label 
                htmlFor="email" 
                className="block text-sm font-medium mb-1"
                style={{ 
                  color: theme.colors.textSecondary,
                  fontFamily: theme.typography.fontFamily.heading
                }}
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                value={user?.email || ''}
                disabled
                className="w-full px-3 py-2 border rounded-md text-sm sm:text-base"
                style={{ 
                  backgroundColor: `${theme.colors.background}80`,
                  borderColor: `${theme.colors.primary}30`,
                  color: theme.colors.textSecondary
                }}
              />
              <p 
                className="mt-1 text-xs"
                style={{ color: theme.colors.textSecondary }}
              >
                O email não pode ser alterado
              </p>
            </div>

            <div>
              <label 
                htmlFor="nickname" 
                className="block text-sm font-medium mb-1"
                style={{ 
                  color: theme.colors.textSecondary,
                  fontFamily: theme.typography.fontFamily.heading
                }}
              >
                Nickname
              </label>
              <input
                type="text"
                id="nickname"
                name="nickname"
                value={profile?.nickname || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-md focus:outline-none text-sm sm:text-base"
                style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderColor: `${theme.colors.primary}30`,
                  color: theme.colors.textPrimary,
                  transition: theme.transitions.medium
                }}
              />
            </div>

            <div>
              <label 
                htmlFor="instagram" 
                className="block text-sm font-medium mb-1"
                style={{ 
                  color: theme.colors.textSecondary,
                  fontFamily: theme.typography.fontFamily.heading
                }}
              >
                Instagram (@ ou link)
              </label>
              <input
                type="text"
                id="instagram"
                name="instagram"
                value={profile?.instagram || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-md focus:outline-none text-sm sm:text-base"
                style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderColor: `${theme.colors.primary}30`,
                  color: theme.colors.textPrimary,
                  transition: theme.transitions.medium
                }}
                placeholder="@seuinsta ou instagram.com/seuinsta"
              />
            </div>
          </div>

          <div className="mt-6">
            <label 
              htmlFor="bio" 
              className="block text-sm font-medium mb-1"
              style={{ 
                color: theme.colors.textSecondary,
                fontFamily: theme.typography.fontFamily.heading
              }}
            >
              Biografia
            </label>
            <textarea
              id="bio"
              name="bio"
              rows={4}
              value={profile?.bio || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-md focus:outline-none text-sm sm:text-base"
              style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderColor: `${theme.colors.primary}30`,
                color: theme.colors.textPrimary,
                transition: theme.transitions.medium
              }}
            />
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-md disabled:opacity-50 transition-all text-sm sm:text-base touch-manipulation"
              style={{ 
                backgroundColor: theme.colors.primary,
                color: theme.colors.background,
                fontFamily: theme.typography.fontFamily.heading,
                fontWeight: theme.typography.fontWeight.semiBold,
                boxShadow: theme.shadows.sm
              }}
            >
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 