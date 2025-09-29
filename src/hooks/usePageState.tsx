import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Hook personalizado para gerenciar o estado da página e persistir no localStorage
 * @param key Chave única para o armazenamento no localStorage
 * @param initialState Estado inicial
 * @returns [state, setState] - Estado atual e função para atualizá-lo
 */
export function usePageState<T>(key: string, initialState: T): [T, (value: T | ((prevState: T) => T)) => void] {
  const pathname = usePathname();
  const META_KEY = `page_state_meta_${key}`;
  const TTL_MS = 24 * 60 * 60 * 1000; // 24h
  
  // Inicializar o estado, tentando carregar do localStorage primeiro
  const [state, setState] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialState;
    }
    
    try {
      // Obter a última rota visitada
      const lastRoute = window.localStorage.getItem('last_route');
      const currentRoute = pathname;
      
      // Se a rota mudou ou não há rota anterior, use o estado inicial
      if (!lastRoute || lastRoute !== currentRoute) {
        // Salvar a rota atual
        window.localStorage.setItem('last_route', currentRoute || '');
        return initialState;
      }
      
      // Se a rota não mudou, tente recuperar o estado do localStorage
      const item = window.localStorage.getItem(`page_state_${key}`);
      if (!item) return initialState;
      // Checar metadados para evitar restaurar rascunho muito antigo
      const metaRaw = window.localStorage.getItem(META_KEY);
      if (metaRaw) {
        try {
          const meta = JSON.parse(metaRaw) as { updatedAt: number };
          if (meta?.updatedAt && Date.now() - meta.updatedAt > TTL_MS) {
            // Expirado
            window.localStorage.removeItem(`page_state_${key}`);
            window.localStorage.removeItem(META_KEY);
            return initialState;
          }
        } catch {}
      }
      return JSON.parse(item) as T;
    } catch (error) {
      console.error('Erro ao carregar estado do localStorage:', error);
      return initialState;
    }
  });

  // Atualizar a rota atual quando o componente monta
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('last_route', pathname || '');
    }
  }, [pathname]);

  // Salvar no localStorage quando o estado mudar
  useEffect(() => {
    if (state !== initialState) {
      try {
        const stateString = JSON.stringify(state);
        
        // Verificar se o conteúdo é muito grande (> 2MB)
        if (stateString.length > 2 * 1024 * 1024) {
          console.warn('Conteúdo muito grande para localStorage, limpando dados antigos...');
          
          // Limpar dados antigos do localStorage
          const keysToRemove = [];
          for (let i = 0; i < window.localStorage.length; i++) {
            const storageKey = window.localStorage.key(i);
            if (storageKey && (storageKey.startsWith('page_state_') || storageKey.startsWith('local_'))) {
              keysToRemove.push(storageKey);
            }
          }
          
          // Remover chaves antigas
          keysToRemove.forEach(key => {
            if (key !== `page_state_${key}` && key !== META_KEY) {
              window.localStorage.removeItem(key);
            }
          });
          
          // Tentar salvar novamente
          try {
            window.localStorage.setItem(`page_state_${key}`, stateString);
            window.localStorage.setItem(META_KEY, JSON.stringify({ updatedAt: Date.now() }));
          } catch (retryError) {
            console.error('Ainda não foi possível salvar após limpeza:', retryError);
            // Se ainda falhar, não salvar
            return;
          }
        } else {
          // Tamanho normal, salvar normalmente
          window.localStorage.setItem(`page_state_${key}`, stateString);
          window.localStorage.setItem(META_KEY, JSON.stringify({ updatedAt: Date.now() }));
        }
      } catch (error) {
        console.error('Erro ao salvar estado no localStorage:', error);
        
        // Se for erro de quota, tentar limpar dados antigos
        if (error.name === 'QuotaExceededError') {
          console.warn('Quota excedida, limpando dados antigos...');
          
          // Limpar todos os dados de estado antigos
          const keysToRemove = [];
          for (let i = 0; i < window.localStorage.length; i++) {
            const storageKey = window.localStorage.key(i);
            if (storageKey && (storageKey.startsWith('page_state_') || storageKey.startsWith('local_'))) {
              keysToRemove.push(storageKey);
            }
          }
          
          keysToRemove.forEach(key => {
            if (key !== `page_state_${key}` && key !== META_KEY) {
              window.localStorage.removeItem(key);
            }
          });
          
          // Tentar salvar novamente
          try {
            window.localStorage.setItem(`page_state_${key}`, JSON.stringify(state));
            window.localStorage.setItem(META_KEY, JSON.stringify({ updatedAt: Date.now() }));
          } catch (retryError) {
            console.error('Não foi possível salvar mesmo após limpeza:', retryError);
          }
        }
      }
    }
  }, [state, key, initialState, META_KEY]);

  // Função para salvar estado quando a aba for minimizada
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        try {
          const stateString = JSON.stringify(state);
          
          // Verificar tamanho antes de salvar
          if (stateString.length > 2 * 1024 * 1024) {
            console.warn('Conteúdo muito grande, pulando salvamento automático');
            return;
          }
          
          window.localStorage.setItem(`page_state_${key}`, stateString);
        } catch (error) {
          console.error('Erro ao salvar estado no localStorage:', error);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [state, key]);

  return [state, setState];
}

/**
 * Hook para persistir um valor simples no localStorage
 * @param key Chave única para o armazenamento no localStorage
 * @param initialValue Valor inicial
 * @returns [value, setValue] - Valor atual e função para atualizá-lo
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prevValue: T) => T)) => void] {
  return usePageState<T>(`local_${key}`, initialValue);
}

/**
 * Função para limpar todos os dados de estado do localStorage
 */
export function clearPageStateData(): void {
  if (typeof window === 'undefined') return;
  
  try {
    const keysToRemove = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const storageKey = window.localStorage.key(i);
      if (storageKey && (storageKey.startsWith('page_state_') || storageKey.startsWith('local_'))) {
        keysToRemove.push(storageKey);
      }
    }
    
    keysToRemove.forEach(key => {
      window.localStorage.removeItem(key);
    });
    
    console.log(`Limpeza concluída: ${keysToRemove.length} itens removidos do localStorage`);
  } catch (error) {
    console.error('Erro ao limpar dados do localStorage:', error);
  }
}

/**
 * Função para verificar o uso do localStorage
 */
export function getLocalStorageUsage(): { used: number; total: number; percentage: number } {
  if (typeof window === 'undefined') return { used: 0, total: 0, percentage: 0 };
  
  let used = 0;
  for (let key in window.localStorage) {
    if (window.localStorage.hasOwnProperty(key)) {
      used += window.localStorage[key].length + key.length;
    }
  }
  
  // Estimativa do limite total (geralmente 5-10MB)
  const total = 5 * 1024 * 1024; // 5MB
  const percentage = (used / total) * 100;
  
  return { used, total, percentage };
}

export default usePageState; 