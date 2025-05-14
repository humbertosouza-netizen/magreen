'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@/contexts/UserContext';
import { supabase } from '@/lib/supabase';

export default function AdminDebugPage() {
  const { user, isAdmin, refreshUser } = useUser();
  const [dbRole, setDbRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function checkDirectFromDb() {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          // Consultar diretamente da tabela profiles
          const { data: profileData } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.session.user.id)
            .single();
          
          if (profileData) {
            setDbRole(profileData.role);
          }
        }
        setLoading(false);
      } catch (error) {
        console.error('Erro ao verificar papel do usuário:', error);
        setLoading(false);
      }
    }
    
    checkDirectFromDb();
  }, []);
  
  return (
    <div className="p-8 max-w-md mx-auto bg-gray-800 rounded-lg mt-10 text-white">
      <h1 className="text-2xl font-bold mb-6">Diagnóstico de Admin</h1>
      
      {loading ? (
        <p>Carregando informações...</p>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-gray-700 rounded-lg">
            <h2 className="font-medium text-lg mb-2">Status do Contexto</h2>
            <div className="space-y-2 text-sm">
              <p><strong>Email:</strong> {user?.email || 'Não autenticado'}</p>
              <p><strong>Role no contexto:</strong> {user?.role || 'Não definido'}</p>
              <p><strong>É admin (contexto):</strong> {isAdmin ? 'Sim' : 'Não'}</p>
            </div>
          </div>
          
          <div className="p-4 bg-gray-700 rounded-lg">
            <h2 className="font-medium text-lg mb-2">Status no Banco de Dados</h2>
            <div className="space-y-2 text-sm">
              <p><strong>Role direta do DB:</strong> {dbRole || 'Não encontrado'}</p>
              <p><strong>É admin (DB):</strong> {dbRole?.toUpperCase() === 'ADMIN' ? 'Sim' : 'Não'}</p>
            </div>
          </div>
          
          <div className="flex space-x-3 pt-4">
            <button 
              onClick={refreshUser}
              className="px-4 py-2 bg-blue-600 rounded-md text-white text-sm"
            >
              Atualizar Contexto
            </button>
            
            <button 
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.href = '/login';
              }}
              className="px-4 py-2 bg-red-600 rounded-md text-white text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 