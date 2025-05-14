'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { UserProfile } from '@/types/user';
import { getCurrentUserProfile } from '@/lib/auth';

interface UserPermissions {
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

interface UserContextType {
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
  refreshUser: () => Promise<void>;
  isAdmin: boolean;
  hasPermission: (action: keyof UserPermissions) => Promise<boolean>;
}

const UserContext = createContext<UserContextType>({
  user: null,
  loading: true,
  error: null,
  refreshUser: async () => {},
  isAdmin: false,
  hasPermission: async () => false,
});

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Usar useCallback para evitar recriações desnecessárias desta função
  const loadUser = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Força uma verificação de autenticação primeiro
      const { data: authData } = await supabase.auth.getSession();
      if (!authData.session) {
        setUser(null);
        setLoading(false);
        return;
      }
      
      const userProfile = await getCurrentUserProfile();
      console.log("Perfil carregado:", userProfile); // Log para debug
      setUser(userProfile);
    } catch (err) {
      console.error('Erro ao carregar usuário:', err);
      setError('Falha ao carregar os dados do usuário');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Carregar usuário quando o componente for montado
    loadUser();

    // Configurar listener para mudanças na autenticação de forma mais eficiente
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        loadUser();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    // Limpar listener quando o componente for desmontado
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [loadUser]);

  // Usar useMemo para calcular isAdmin apenas quando user muda
  const userIsAdmin = useMemo(() => {
    if (!user) return false;
    
    // Verificar se o usuário tem um perfil e uma role definida
    if (!user.role) {
      console.log("Usuário sem role definida:", user);
      return false;
    }
    
    // Tornar a comparação insensível a maiúsculas/minúsculas
    const normalizedRole = typeof user.role === 'string' ? user.role.toUpperCase() : '';
    console.log("Role normalizada:", normalizedRole);
    
    return normalizedRole === 'ADMIN';
  }, [user]);

  // Otimizar função de verificação de permissões com useCallback
  const checkUserPermission = useCallback(async (action: keyof UserPermissions): Promise<boolean> => {
    if (!user) return false;
    
    // Se o usuário está banido, ele não tem permissões extras
    if (user.banned) {
      return action === 'canEditProfile'; // Usuários banidos só podem editar seu perfil
    }
    
    // Se o usuário é admin, ele tem todas as permissões (insensível a maiúsculas/minúsculas)
    const normalizedRole = typeof user.role === 'string' ? user.role.toUpperCase() : '';
    if (normalizedRole === 'ADMIN') {
      return true;
    }
    
    // Permissões padrão para usuários comuns
    const defaultPermissions: Record<keyof UserPermissions, boolean> = {
      canCreatePost: false,
      canEditPost: false,
      canDeletePost: false,
      canManageUsers: false,
      canViewAllUsers: false,
      canBanUsers: false,
      canViewAdminPanel: false,
      canEditProfile: true,
      canComment: true
    };
    
    return defaultPermissions[action] || false;
  }, [user]);

  // Usar useMemo para o valor do contexto
  const contextValue = useMemo(() => ({
    user, 
    loading, 
    error, 
    refreshUser: loadUser,
    isAdmin: userIsAdmin,
    hasPermission: checkUserPermission
  }), [user, loading, error, loadUser, userIsAdmin, checkUserPermission]);

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext); 