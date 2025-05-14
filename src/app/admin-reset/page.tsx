'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminResetPage() {
  const [status, setStatus] = useState<string>('Iniciando diagnóstico...');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  const [userRole, setUserRole] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [fixAttempted, setFixAttempted] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    async function diagnose() {
      setStatus('Verificando autenticação...');
      try {
        // Verificar autenticação
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          setIsAuthenticated(false);
          setStatus('Você não está autenticado. Por favor, faça login primeiro.');
          setLoading(false);
          return;
        }

        setIsAuthenticated(true);
        setUserId(data.session.user.id);
        setUserEmail(data.session.user.email || '');
        setStatus('Verificando perfil...');

        // Buscar perfil diretamente do banco de dados
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.session.user.id)
          .single();

        if (profileError) {
          setStatus(`Erro ao verificar perfil: ${profileError.message}`);
          setLoading(false);
          return;
        }

        if (!profileData) {
          setStatus('Perfil não encontrado no banco de dados.');
          setLoading(false);
          return;
        }

        setUserRole(profileData.role || 'Não definido');
        setIsAdmin(profileData.role?.toUpperCase() === 'ADMIN');
        setStatus('Diagnóstico concluído.');
        setLoading(false);

      } catch (error: any) {
        setStatus(`Erro durante o diagnóstico: ${error.message}`);
        setLoading(false);
      }
    }

    diagnose();
  }, [fixAttempted]);

  const handleFixAdmin = async () => {
    if (!userId) {
      setStatus('Você precisa estar autenticado para corrigir as permissões.');
      return;
    }

    setLoading(true);
    setStatus('Aplicando correção...');

    try {
      // Atualizar diretamente o banco de dados
      const { error } = await supabase
        .from('profiles')
        .update({ 
          role: 'ADMIN',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        setStatus(`Erro ao atualizar permissões: ${error.message}`);
        setLoading(false);
        return;
      }

      setStatus('Correção aplicada com sucesso! Atualizando diagnóstico...');
      setFixAttempted(prev => !prev); // Isto forçará o useEffect a executar novamente

    } catch (error: any) {
      setStatus(`Erro ao aplicar correção: ${error.message}`);
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    setStatus('Fazendo logout...');
    try {
      await supabase.auth.signOut();
      setStatus('Logout realizado com sucesso. Redirecionando...');
      router.push('/login');
    } catch (error: any) {
      setStatus(`Erro ao fazer logout: ${error.message}`);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold text-white mb-6">Diagnóstico e Correção de Admin</h1>
        
        <div className="mb-6 p-4 bg-gray-700 rounded-lg">
          <p className="text-blue-300 font-medium mb-2">Status:</p>
          <p className="text-white">{status}</p>
        </div>

        {!loading && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">Resultado do Diagnóstico</h2>
            
            <div className="space-y-2 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-300">Autenticado:</span>
                <span className={isAuthenticated ? "text-green-400" : "text-red-400"}>
                  {isAuthenticated ? "Sim" : "Não"}
                </span>
              </div>
              
              {isAuthenticated && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Email:</span>
                    <span className="text-white">{userEmail}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-300">Role no banco de dados:</span>
                    <span className={userRole === 'ADMIN' ? "text-green-400 font-semibold" : "text-yellow-400"}>
                      {userRole}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-300">É admin:</span>
                    <span className={isAdmin ? "text-green-400 font-semibold" : "text-red-400"}>
                      {isAdmin ? "Sim" : "Não"}
                    </span>
                  </div>
                </>
              )}
            </div>

            <div className="space-y-4">
              {isAuthenticated && !isAdmin && (
                <button
                  onClick={handleFixAdmin}
                  disabled={loading}
                  className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  Corrigir Permissões de Admin
                </button>
              )}
              
              {isAuthenticated && isAdmin && (
                <div className="p-4 bg-green-800 bg-opacity-20 border border-green-600 rounded-lg">
                  <p className="text-green-400 mb-2 font-medium">Status de Admin Confirmado!</p>
                  <p className="text-white text-sm">
                    Você está configurado como ADMIN no banco de dados. Se o sistema ainda não reconhece, 
                    tente fazer logout e login novamente para atualizar a sessão.
                  </p>
                </div>
              )}
              
              {isAuthenticated && (
                <button
                  onClick={handleLogout}
                  disabled={loading}
                  className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  Fazer Logout
                </button>
              )}
              
              {!isAuthenticated && (
                <Link 
                  href="/login"
                  className="block w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors text-center"
                >
                  Ir para Login
                </Link>
              )}
              
              <Link 
                href="/dashboard"
                className="block w-full py-2 px-4 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors text-center"
              >
                Voltar ao Dashboard
              </Link>
            </div>
          </div>
        )}
        
        {loading && (
          <div className="flex justify-center my-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>
    </div>
  );
} 