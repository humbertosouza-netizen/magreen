import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface DashboardStateContextProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  currentSubView: string;
  setCurrentSubView: (subView: string) => void;
  viewingItemId: string | null;
  setViewingItemId: (id: string | null) => void;
  restoreState: () => void;
}

const DashboardStateContext = createContext<DashboardStateContextProps | undefined>(undefined);

export function DashboardStateProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  
  // Estados principais do dashboard
  const [currentView, setCurrentViewState] = useState<string>('');
  const [currentSubView, setCurrentSubViewState] = useState<string>('');
  const [viewingItemId, setViewingItemIdState] = useState<string | null>(null);
  
  // Inicializar os estados a partir do localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedView = localStorage.getItem('dashboard_current_view');
        const savedSubView = localStorage.getItem('dashboard_current_subview');
        const savedViewingItemId = localStorage.getItem('dashboard_viewing_item_id');
        
        if (savedView) setCurrentViewState(savedView);
        if (savedSubView) setCurrentSubViewState(savedSubView);
        if (savedViewingItemId) setViewingItemIdState(savedViewingItemId);
      } catch (error) {
        console.error('Erro ao carregar estado do dashboard:', error);
      }
    }
  }, []);
  
  // Salvar os estados atuais no localStorage quando mudam
  const setCurrentView = (view: string) => {
    setCurrentViewState(view);
    localStorage.setItem('dashboard_current_view', view);
  };
  
  const setCurrentSubView = (subView: string) => {
    setCurrentSubViewState(subView);
    localStorage.setItem('dashboard_current_subview', subView);
  };
  
  const setViewingItemId = (id: string | null) => {
    setViewingItemIdState(id);
    if (id) {
      localStorage.setItem('dashboard_viewing_item_id', id);
    } else {
      localStorage.removeItem('dashboard_viewing_item_id');
    }
  };
  
  // Função para salvar o estado atual quando a aba for minimizada
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        localStorage.setItem('dashboard_current_path', pathname || '');
        localStorage.setItem('dashboard_current_view', currentView);
        localStorage.setItem('dashboard_current_subview', currentSubView);
        if (viewingItemId) {
          localStorage.setItem('dashboard_viewing_item_id', viewingItemId);
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [pathname, currentView, currentSubView, viewingItemId]);
  
  // Função para restaurar o estado
  const restoreState = () => {
    const savedPath = localStorage.getItem('dashboard_current_path');
    
    if (savedPath && savedPath !== pathname && savedPath.startsWith('/dashboard')) {
      router.push(savedPath);
    }
  };
  
  return (
    <DashboardStateContext.Provider
      value={{
        currentView,
        setCurrentView,
        currentSubView,
        setCurrentSubView,
        viewingItemId,
        setViewingItemId,
        restoreState
      }}
    >
      {children}
    </DashboardStateContext.Provider>
  );
}

export function useDashboardState() {
  const context = useContext(DashboardStateContext);
  if (context === undefined) {
    throw new Error('useDashboardState deve ser usado dentro de um DashboardStateProvider');
  }
  return context;
}

export default DashboardStateContext; 