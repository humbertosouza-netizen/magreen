'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/contexts/UserContext';
import { supabase } from '@/lib/supabase';
import { colors } from '@/styles/colors';
import { UserProfile } from '@/types/user';
import { useRouter } from 'next/navigation';
import { updateEmpresarialKlugeToAdmin } from '@/lib/auth';

export default function AdminUsersPage() {
  const { user, isAdmin } = useUser();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{text: string, type: 'info' | 'success' | 'error'} | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Redirecionar se não for admin
    if (user && !isAdmin) {
      router.push('/dashboard');
    }
    
    fetchUsers();
  }, [user, isAdmin, router]);

  const fetchUsers = async () => {
    setLoading(true);
    
    try {
      // Buscar usuários da tabela profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (profilesError) {
        console.error('Erro ao buscar usuários:', profilesError);
      } else {
        setUsers(profilesData as UserProfile[]);
      }
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: 'admin' | 'user') => {
    try {
      // Atualizar role na tabela profiles
      const { error: profilesError } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);
      
      if (profilesError) {
        console.error('Erro ao atualizar papel na tabela profiles:', profilesError);
        
        // Tentar na tabela perfis
        const { error: perfisError } = await supabase
          .from('perfis')
          .update({ role: newRole })
          .eq('id', userId);
        
        if (perfisError) {
          console.error('Erro ao atualizar papel na tabela perfis:', perfisError);
          setMessage({
            text: 'Erro ao atualizar papel do usuário.',
            type: 'error'
          });
          return false;
        }
      }
      
      // Atualizar lista de usuários
      fetchUsers();
      setMessage({
        text: `Usuário atualizado com sucesso para ${newRole === 'admin' ? 'Administrador' : 'Usuário comum'}.`,
        type: 'success'
      });
      
      return true;
    } catch (error) {
      console.error('Erro ao atualizar papel do usuário:', error);
      setMessage({
        text: 'Erro ao atualizar papel do usuário.',
        type: 'error'
      });
      return false;
    }
  };

  const updateEmpresarialKluge = async () => {
    setLoading(true);
    setMessage({ text: 'Atualizando usuário empresarialkluge@gmail.com para admin...', type: 'info' });
    
    try {
      // Usar a função especializada da lib/auth
      const resultado = await updateEmpresarialKlugeToAdmin();
      
      if (resultado) {
        console.log('Usuário empresarialkluge@gmail.com atualizado com sucesso!');
        
        // Recarregar lista de usuários
        await fetchUsers();
        
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

  const toggleBanUser = async (userId: string, banned: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ banned })
        .eq('id', userId);
      
      if (error) {
        console.error('Erro ao atualizar status de banimento:', error);
        setMessage({
          text: 'Erro ao atualizar status de banimento.',
          type: 'error'
        });
        return false;
      }
      
      // Atualizar lista de usuários
      fetchUsers();
      setMessage({
        text: `Usuário ${banned ? 'banido' : 'desbanido'} com sucesso.`,
        type: 'success'
      });
      
      return true;
    } catch (error) {
      console.error('Erro ao atualizar status de banimento:', error);
      setMessage({
        text: 'Erro ao atualizar status de banimento.',
        type: 'error'
      });
      return false;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Você não tem permissão para acessar esta página.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: '#1A1A1A', color: 'white' }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Gerenciamento de Usuários</h1>
          
          <button
            onClick={updateEmpresarialKluge}
            className="px-4 py-2 rounded-md font-medium"
            style={{ backgroundColor: colors.greenLight, color: 'white' }}
            disabled={loading}
          >
            Atualizar empresarialkluge@gmail.com para Admin
          </button>
        </div>
        
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
        
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="px-4 py-2 text-left">Email</th>
                  <th className="px-4 py-2 text-left">Nome</th>
                  <th className="px-4 py-2 text-left">Papel</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Criado em</th>
                  <th className="px-4 py-2 text-left">Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-2 text-center">Carregando...</td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-2 text-center">Nenhum usuário encontrado</td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="border-b border-gray-700">
                      <td className="px-4 py-2">{u.email}</td>
                      <td className="px-4 py-2">{u.name || '-'}</td>
                      <td className="px-4 py-2">
                        <span 
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            u.role === 'admin' ? 'bg-purple-800 text-purple-100' : 'bg-blue-800 text-blue-100'
                          }`}
                        >
                          {u.role === 'admin' ? 'Admin' : 'Usuário'}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <span 
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            u.banned ? 'bg-red-800 text-red-100' : 'bg-green-800 text-green-100'
                          }`}
                        >
                          {u.banned ? 'Banido' : 'Ativo'}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        {new Date(u.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => updateUserRole(u.id, u.role === 'admin' ? 'user' : 'admin')}
                            className="px-2 py-1 text-xs rounded-md"
                            style={{ 
                              backgroundColor: u.role === 'admin' ? '#3B82F6' : colors.greenLight,
                              color: 'white'
                            }}
                          >
                            {u.role === 'admin' ? 'Tornar Usuário' : 'Tornar Admin'}
                          </button>
                          
                          <button
                            onClick={() => toggleBanUser(u.id, !u.banned)}
                            className="px-2 py-1 text-xs rounded-md"
                            style={{ 
                              backgroundColor: u.banned ? colors.greenLight : '#EF4444',
                              color: 'white'
                            }}
                          >
                            {u.banned ? 'Desbanir' : 'Banir'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 