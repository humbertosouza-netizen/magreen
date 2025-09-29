'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { UserProfile } from '@/types/user';
import { getCurrentUserProfile, clearProfileCache } from '@/lib/auth';

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
  
  // Refs para controlar estado e evitar re-execuções desnecessárias
  const isLoadingRef = useRef(false);
  const lastSessionIdRef = useRef<string | null>(null);
  const authListenerRef = useRef<any>(null);
  
  useEffect(() => {
    // Função para carregar usuário - definida dentro do useEffect para evitar dependências
    const loadUser = async (forceRefresh = false) => {
      // Evitar múltiplas chamadas simultâneas
      if (isLoadingRef.current && !forceRefresh) {
        return;
      }
      
      try {
        isLoadingRef.current = true;
        setLoading(true);
        setError(null);
        
        // Verificar se a sessão mudou antes de fazer a requisição
        const { data: authData } = await supabase.auth.getSession();
        const currentSessionId = authData.session?.user?.id;
        
        // Se a sessão não mudou e não é um refresh forçado, não recarregar
        if (!forceRefresh && currentSessionId === lastSessionIdRef.current) {
          setLoading(false);
          isLoadingRef.current = false;
          return;
        }
        
        if (!authData.session) {
          setUser(null);
          lastSessionIdRef.current = null;
          setLoading(false);
          isLoadingRef.current = false;
          return;
        }
        
        // Atualizar o ID da sessão atual
        lastSessionIdRef.current = currentSessionId;
        
        const userProfile = await getCurrentUserProfile();
        console.log("Perfil carregado:", userProfile); // Log para debug
        setUser(userProfile);
      } catch (err) {
        console.error('Erro ao carregar usuário:', err);
        setError('Falha ao carregar os dados do usuário');
      } finally {
        setLoading(false);
        isLoadingRef.current = false;
      }
    };

    // Carregar usuário quando o componente for montado
    loadUser();

    // Configurar listener para mudanças na autenticação apenas uma vez
    if (!authListenerRef.current) {
      authListenerRef.current = supabase.auth.onAuthStateChange((event, session) => {
        console.log('Auth state change:', event, session?.user?.id);
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          // Só recarregar se a sessão realmente mudou
          const newSessionId = session?.user?.id;
          if (newSessionId !== lastSessionIdRef.current) {
            loadUser(true);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          lastSessionIdRef.current = null;
        }
      });
    }

    // Listener para detectar quando a aba volta a ficar ativa
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Só verificar se a sessão ainda é válida, sem recarregar tudo
        supabase.auth.getSession().then(({ data }) => {
          if (!data.session) {
            // Sessão expirou, limpar usuário
            setUser(null);
            lastSessionIdRef.current = null;
          }
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Limpar listeners quando o componente for desmontado
    return () => {
      if (authListenerRef.current) {
        try {
          // O onAuthStateChange retorna um objeto com data.subscription.unsubscribe()
          if (authListenerRef.current.data?.subscription?.unsubscribe) {
            authListenerRef.current.data.subscription.unsubscribe();
          }
        } catch (error) {
          console.warn('Erro ao fazer unsubscribe do auth listener:', error);
        }
        authListenerRef.current = null;
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []); // Remover loadUser das dependências para evitar re-execuções

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

  // Função de refresh que força o recarregamento
  const refreshUser = useCallback(async () => {
    // Limpar cache antes de recarregar
    if (user?.id) {
      clearProfileCache(user.id);
    }
    
    // Recarregar usuário forçando refresh
    try {
      isLoadingRef.current = true;
      setLoading(true);
      setError(null);
      
      const { data: authData } = await supabase.auth.getSession();
      if (!authData.session) {
        setUser(null);
        lastSessionIdRef.current = null;
        setLoading(false);
        isLoadingRef.current = false;
        return;
      }
      
      const currentSessionId = authData.session.user.id;
      lastSessionIdRef.current = currentSessionId;
      
      const userProfile = await getCurrentUserProfile();
      console.log("Perfil recarregado:", userProfile);
      setUser(userProfile);
    } catch (err) {
      console.error('Erro ao recarregar usuário:', err);
      setError('Falha ao recarregar os dados do usuário');
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [user?.id]);

  // Usar useMemo para o valor do contexto
  const contextValue = useMemo(() => ({
    user, 
    loading, 
    error, 
    refreshUser,
    isAdmin: userIsAdmin,
    hasPermission: checkUserPermission
  }), [user, loading, error, refreshUser, userIsAdmin, checkUserPermission]);

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext); 