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
      return item ? JSON.parse(item) : initialState;
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
        window.localStorage.setItem(`page_state_${key}`, JSON.stringify(state));
      } catch (error) {
        console.error('Erro ao salvar estado no localStorage:', error);
      }
    }
  }, [state, key, initialState]);

  // Função para salvar estado quando a aba for minimizada
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        try {
          window.localStorage.setItem(`page_state_${key}`, JSON.stringify(state));
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

export default usePageState; 