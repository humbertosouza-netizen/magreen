import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { User } from '@supabase/supabase-js';

export type UserRole = 'ADMIN' | 'USUARIO';

export interface UserProfile {
  id: string;
  nome_completo?: string;
  telefone?: string;
  bio?: string;
  avatar_url?: string;
  role: UserRole;
  created_at: string;
  updated_at?: string;
  banned?: boolean;
}

export interface UserPermissions {
  canCreatePost: boolean;
  canEditPost: boolean;
  canDeletePost: boolean;
  canManageUsers: boolean;
  canViewAllUsers: boolean;
  canBanUsers: boolean;
  canViewAdminPanel: boolean;
  canEditProfile: boolean;
  canComment: boolean;
}

export const DEFAULT_PERMISSIONS: UserPermissions = {
  canCreatePost: false,
  canEditPost: false,
  canDeletePost: false,
  canManageUsers: false,
  canViewAllUsers: false,
  canBanUsers: false,
  canViewAdminPanel: false,
  canEditProfile: true, // Todos podem editar seu próprio perfil
  canComment: true,     // Todos podem comentar
};

export const ADMIN_PERMISSIONS: UserPermissions = {
  canCreatePost: true,
  canEditPost: true,
  canDeletePost: true,
  canManageUsers: true,
  canViewAllUsers: true,
  canBanUsers: true,
  canViewAdminPanel: true,
  canEditProfile: true,
  canComment: true,
};

/**
 * Obtém o perfil completo do usuário incluindo role
 */
export async function getUserProfile(user: User | null): Promise<UserProfile | null> {
  if (!user) return null;
  
  const supabase = createClientComponentClient();
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
    
  if (error) {
    console.error('Erro ao obter perfil do usuário:', error);
    return null;
  }
  
  return data as UserProfile;
}

/**
 * Verifica se o usuário atual é administrador
 */
export async function isUserAdmin(user: User | null): Promise<boolean> {
  if (!user) return false;
  
  const profile = await getUserProfile(user);
  return profile?.role === 'ADMIN';
}

/**
 * Obtém as permissões do usuário com base no seu perfil
 */
export async function getUserPermissions(user: User | null): Promise<UserPermissions> {
  if (!user) return DEFAULT_PERMISSIONS;
  
  const profile = await getUserProfile(user);
  
  if (!profile) return DEFAULT_PERMISSIONS;
  
  if (profile.banned) {
    // Usuário banido não tem permissões exceto ver seu próprio perfil
    return {
      ...DEFAULT_PERMISSIONS,
      canComment: false,
    };
  }
  
  if (profile.role === 'ADMIN') {
    return ADMIN_PERMISSIONS;
  }
  
  return DEFAULT_PERMISSIONS;
}

/**
 * Verifica se o usuário tem uma permissão específica
 */
export async function checkPermission(
  user: User | null, 
  permission: keyof UserPermissions
): Promise<boolean> {
  const permissions = await getUserPermissions(user);
  return permissions[permission];
}

/**
 * Verifica se um usuário pode editar um artigo específico
 */
export async function canEditArticle(user: User | null, authorId: string): Promise<boolean> {
  if (!user) return false;
  
  const profile = await getUserProfile(user);
  if (!profile || profile.banned) return false;
  
  // Administradores podem editar qualquer artigo
  if (profile.role === 'ADMIN') return true;
  
  // Usuários comuns só podem editar seus próprios artigos
  return profile.id === authorId;
}

/**
 * Retorna o nome da permissão para exibição na UI
 */
export function getPermissionLabel(permission: keyof UserPermissions): string {
  const labels: Record<keyof UserPermissions, string> = {
    canCreatePost: 'Criar posts',
    canEditPost: 'Editar posts',
    canDeletePost: 'Excluir posts',
    canManageUsers: 'Gerenciar usuários',
    canViewAllUsers: 'Ver todos os usuários',
    canBanUsers: 'Banir usuários',
    canViewAdminPanel: 'Acessar painel admin',
    canEditProfile: 'Editar perfil',
    canComment: 'Comentar em posts',
  };
  
  return labels[permission] || permission;
} 