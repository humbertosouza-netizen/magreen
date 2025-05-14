'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/contexts/UserContext';
import { supabase } from '@/lib/supabase';
import { colors } from '@/styles/colors';
import { updateEmpresarialKlugeToAdmin } from '@/lib/auth';

export default function AdminDiagnosticPage() {
  const { user, refreshUser, isAdmin } = useUser();
  const [rawProfileData, setRawProfileData] = useState<any>(null);
  const [profilesData, setProfilesData] = useState<any>(null);
  const [perfisData, setPerfisData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{text: string, type: 'info' | 'success' | 'error'} | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('diagnóstico');

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setUserId(data.session.user.id);
      }
    };
    
    checkAuth();
  }, []);

  // Função para buscar dados brutos do perfil
  const fetchRawProfileData = async () => {
    if (!userId) return;
    
    setLoading(true);
    setMessage({ text: 'Buscando dados brutos do perfil...', type: 'info' });
    
    try {
      // Tentar buscar o perfil na tabela profiles
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (!profileError && profileData) {
        setProfilesData(profileData);
        console.log('Dados da tabela profiles:', profileData);
      } else {
        console.log('Erro ou nenhum dado encontrado na tabela profiles:', profileError);
      }
      
      // Tentar buscar o perfil na tabela perfis
      const { data: perfilData, error: perfilError } = await supabase
        .from('perfis')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (!perfilError && perfilData) {
        setPerfisData(perfilData);
        console.log('Dados da tabela perfis:', perfilData);
      } else {
        console.log('Erro ou nenhum dado encontrado na tabela perfis:', perfilError);
      }
      
      // Tentar buscar dados brutos do usuário
      const { data: rawData, error: rawError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId);
      
      if (!rawError && rawData) {
        setRawProfileData(rawData);
        console.log('Dados brutos de profiles:', rawData);
      }
      
      await refreshUser();
      
      setMessage({ 
        text: 'Diagnóstico completo! Verifique o console do navegador para detalhes.', 
        type: 'success' 
      });
    } catch (error) {
      console.error('Erro durante diagnóstico:', error);
      setMessage({ 
        text: 'Erro durante diagnóstico. Verifique o console para detalhes.', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  // Função para corrigir o papel de admin diretamente
  const forceAdminRole = async () => {
    if (!userId) return;
    
    setLoading(true);
    setMessage({ text: 'Aplicando correção de emergência...', type: 'info' });
    
    try {
      // Tentar atualizar na tabela profiles
      try {
        const { error: profilesError } = await supabase
          .from('profiles')
          .update({ 
            role: 'admin',
            tipo: 'admin', // Tentar outro nome de campo possível
            admin: true,   // Tentar outro formato possível
            is_admin: true // Tentar outro formato possível
          })
          .eq('id', userId);
          
        if (profilesError) {
          console.log('Erro ao atualizar na tabela profiles:', profilesError);
        } else {
          console.log('Atualização na tabela profiles concluída!');
        }
      } catch (e) {
        console.error('Exceção ao tentar atualizar profiles:', e);
      }
      
      // Tentar atualizar na tabela perfis
      try {
        const { error: perfisError } = await supabase
          .from('perfis')
          .update({ 
            role: 'admin',
            tipo: 'admin',
            admin: true,
            is_admin: true
          })
          .eq('id', userId);
          
        if (perfisError) {
          console.log('Erro ao atualizar na tabela perfis:', perfisError);
        } else {
          console.log('Atualização na tabela perfis concluída!');
        }
      } catch (e) {
        console.error('Exceção ao tentar atualizar perfis:', e);
      }
      
      // Buscar novamente os dados para confirmar
      await fetchRawProfileData();
      await refreshUser();
      
      setMessage({ 
        text: 'Correção aplicada! Por favor, faça logout e login novamente.', 
        type: 'success' 
      });
    } catch (error) {
      console.error('Erro ao aplicar correção:', error);
      setMessage({ 
        text: 'Erro ao aplicar correção. Verifique o console para detalhes.', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  // Função para fazer logout
  const handleLogout = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      window.location.href = '/login';
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      setLoading(false);
    }
  };

  // Função específica para atualizar empresarialkluge@gmail.com como admin
  const updateEmpresarialKluge = async () => {
    setLoading(true);
    setMessage({ text: 'Atualizando usuário empresarialkluge@gmail.com para admin...', type: 'info' });
    
    try {
      // Usar a função especializada da lib/auth
      const resultado = await updateEmpresarialKlugeToAdmin();
      
      if (resultado) {
        console.log('Usuário empresarialkluge@gmail.com atualizado com sucesso!');
        
        // Recarregar dados para confirmação
        await fetchRawProfileData();
        await refreshUser();
        
        setMessage({ 
          text: 'Atualização do usuário empresarialkluge@gmail.com concluída! Faça logout e login novamente para ver as alterações.', 
          type: 'success' 
        });
      } else {
        console.error('Falha ao atualizar usuário empresarialkluge@gmail.com');
        setMessage({ 
          text: 'Falha ao atualizar usuário. Verifique o console para detalhes.', 
          type: 'error' 
        });
      }
    } catch (error) {
      console.error('Erro ao atualizar usuário específico:', error);
      setMessage({ 
        text: 'Erro ao atualizar usuário específico. Verifique o console para detalhes.', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  // Função para buscar todas as tabelas disponíveis
  const listAllTables = async () => {
    setLoading(true);
    setMessage({ text: 'Listando todas as tabelas...', type: 'info' });
    
    try {
      // Esta é uma consulta SQL que lista todas as tabelas
      const { data, error } = await supabase
        .rpc('list_all_tables');
      
      if (error) {
        console.error('Erro ao listar tabelas:', error);
        
        // Tentar método alternativo
        const { data: tables, error: tablesError } = await supabase
          .from('pg_tables')
          .select('tablename')
          .eq('schemaname', 'public');
        
        if (tablesError) {
          console.error('Erro ao listar tabelas (método alternativo):', tablesError);
        } else {
          console.log('Tabelas disponíveis (método alternativo):', tables);
        }
      } else {
        console.log('Tabelas disponíveis:', data);
      }
      
      setMessage({ 
        text: 'Listagem de tabelas concluída! Verifique o console para detalhes.', 
        type: 'success' 
      });
    } catch (error) {
      console.error('Exceção ao listar tabelas:', error);
      setMessage({ 
        text: 'Erro ao listar tabelas. Tentando método alternativo...', 
        type: 'error' 
      });
      
      // Tentar método mais direto
      try {
        const query = `
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public'
        `;
        const { data, error } = await supabase.rpc('execute_sql', { query });
        console.log('Tabelas (SQL direto):', data, error);
      } catch (e) {
        console.error('Falha ao usar SQL direto:', e);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: '#1A1A1A', color: 'white' }}>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Diagnóstico Avançado de Permissões</h1>
        
        {message && (
          <div 
            className={`p-4 mb-6 rounded-lg ${
              message.type === 'success' ? 'bg-green-800' : 
              message.type === 'error' ? 'bg-red-800' : 'bg-blue-800'
            }`}
          >
            <p className="text-white">{message.text}</p>
          </div>
        )}
        
        {/* Informações do usuário atual */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Informações do Usuário Atual</h2>
          
          <div className="bg-gray-900 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Contexto Atual:</h3>
            <ul className="space-y-1 text-gray-300">
              <li><strong>ID:</strong> {userId || 'Não disponível'}</li>
              <li><strong>Email:</strong> {user?.email || 'Não disponível'}</li>
              <li><strong>Papel (role):</strong> <span className={user?.role === 'admin' ? 'text-green-400 font-bold' : 'text-red-400'}>{user?.role || 'Não disponível'}</span></li>
              <li><strong>É Admin (isAdmin):</strong> <span className={isAdmin ? 'text-green-400 font-bold' : 'text-red-400'}>{isAdmin ? 'Sim' : 'Não'}</span></li>
              <li><strong>Logado:</strong> {userId ? 'Sim' : 'Não'}</li>
            </ul>
          </div>
          
          <div className="flex space-x-2">
            <button 
              onClick={refreshUser}
              className="px-4 py-2 rounded-md font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors"
              disabled={loading}
            >
              Atualizar Contexto
            </button>
            
            <button 
              onClick={handleLogout}
              className="px-4 py-2 rounded-md font-medium bg-red-600 hover:bg-red-700 text-white transition-colors"
              disabled={loading}
            >
              Logout
            </button>
            
            <button 
              onClick={updateEmpresarialKluge}
              className="px-4 py-2 rounded-md font-medium"
              style={{ backgroundColor: colors.greenLight, color: 'white' }}
              disabled={loading}
            >
              Atualizar empresarialkluge@gmail.com
            </button>
          </div>
        </div>
        
        {/* Abas para diferentes funcionalidades */}
        <div className="mb-6">
          <div className="flex border-b border-gray-700">
            <button
              className={`px-4 py-2 font-medium ${activeTab === 'diagnóstico' ? 'text-white border-b-2 border-blue-500' : 'text-gray-400 hover:text-white'}`}
              onClick={() => setActiveTab('diagnóstico')}
            >
              Diagnóstico
            </button>
            <button
              className={`px-4 py-2 font-medium ${activeTab === 'correção' ? 'text-white border-b-2 border-blue-500' : 'text-gray-400 hover:text-white'}`}
              onClick={() => setActiveTab('correção')}
            >
              Correção
            </button>
            <button
              className={`px-4 py-2 font-medium ${activeTab === 'avançado' ? 'text-white border-b-2 border-blue-500' : 'text-gray-400 hover:text-white'}`}
              onClick={() => setActiveTab('avançado')}
            >
              Avançado
            </button>
          </div>
        </div>
        
        {/* Conteúdo da aba de diagnóstico */}
        {activeTab === 'diagnóstico' && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Diagnóstico de Banco de Dados</h2>
            <p className="text-gray-300 mb-4">
              Esta ferramenta verificará os dados brutos do seu perfil diretamente no banco de dados.
            </p>
            
            <button 
              onClick={fetchRawProfileData}
              className="px-4 py-2 rounded-md font-medium mb-6"
              style={{ backgroundColor: colors.greenLight, color: 'white' }}
              disabled={loading || !userId}
            >
              {loading ? 'Analisando...' : 'Executar Diagnóstico Completo'}
            </button>
            
            {profilesData && (
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Dados da tabela 'profiles':</h3>
                <pre className="bg-gray-900 p-4 rounded-lg overflow-auto text-xs text-gray-300">
                  {JSON.stringify(profilesData, null, 2)}
                </pre>
              </div>
            )}
            
            {perfisData && (
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Dados da tabela 'perfis':</h3>
                <pre className="bg-gray-900 p-4 rounded-lg overflow-auto text-xs text-gray-300">
                  {JSON.stringify(perfisData, null, 2)}
                </pre>
              </div>
            )}
            
            {!profilesData && !perfisData && rawProfileData && (
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Dados brutos encontrados:</h3>
                <pre className="bg-gray-900 p-4 rounded-lg overflow-auto text-xs text-gray-300">
                  {JSON.stringify(rawProfileData, null, 2)}
                </pre>
              </div>
            )}
            
            {(!profilesData && !perfisData && !rawProfileData && !loading) && (
              <div className="bg-gray-900 p-4 rounded-lg">
                <p className="text-gray-400">Nenhum dado encontrado ainda. Execute o diagnóstico para buscar.</p>
              </div>
            )}
          </div>
        )}
        
        {/* Conteúdo da aba de correção */}
        {activeTab === 'correção' && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Correção de Emergência</h2>
            <p className="text-gray-300 mb-4">
              Esta ferramenta tentará várias abordagens para corrigir o problema de permissão, tentando diferentes 
              nomes de campo e formatos.
            </p>
            
            <div className="bg-yellow-800 p-4 rounded-lg mb-6">
              <p className="text-white">
                <strong>Atenção:</strong> Esta ferramenta tentará forçar seu perfil como administrador usando diversas 
                abordagens. Após a conclusão, você deverá fazer logout e login novamente para aplicar as alterações.
              </p>
            </div>
            
            <button 
              onClick={forceAdminRole}
              className="px-4 py-2 rounded-md font-medium bg-red-600 hover:bg-red-700 text-white transition-colors"
              disabled={loading || !userId}
            >
              {loading ? 'Aplicando correção...' : 'Aplicar Correção de Emergência'}
            </button>
          </div>
        )}
        
        {/* Conteúdo da aba avançada */}
        {activeTab === 'avançado' && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Ferramentas Avançadas</h2>
            <p className="text-gray-300 mb-4">
              Ferramentas para diagnóstico e análise aprofundada do banco de dados.
            </p>
            
            <button 
              onClick={listAllTables}
              className="px-4 py-2 rounded-md font-medium bg-purple-600 hover:bg-purple-700 text-white transition-colors"
              disabled={loading}
            >
              {loading ? 'Listando...' : 'Listar Todas as Tabelas'}
            </button>
            
            <div className="mt-6 text-gray-400 text-sm">
              <p>Consulte o console do navegador (F12) para ver os resultados detalhados.</p>
            </div>
          </div>
        )}
        
        <div className="mt-6 text-gray-400 text-sm">
          <p>
            Se os diagnósticos acima não resolverem o problema, você pode precisar verificar a estrutura do banco de dados 
            e garantir que a tabela contém os campos esperados com os nomes corretos.
          </p>
        </div>
      </div>
    </div>
  );
} 