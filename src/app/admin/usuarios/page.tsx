'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { isUserAdmin, UserProfile } from '@/lib/permissions';
import { User } from '@supabase/supabase-js';

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<(UserProfile & { email: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function checkAdmin() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push('/login');
        return;
      }

      setCurrentUser(session.user);
      
      const isAdmin = await isUserAdmin(session.user);
      if (!isAdmin) {
        router.push('/dashboard');
        return;
      }
      
      fetchUsers();
    }

    checkAdmin();
  }, [router, supabase]);

  async function fetchUsers() {
    try {
      setLoading(true);
      setError(null);
      
      // Buscar todos os usuários (auth + profiles)
      const { data: authUsers, error: authError } = await supabase
        .from('auth.users')
        .select('id, email, created_at')
        .order('created_at', { ascending: false });

      if (authError) {
        throw new Error('Erro ao buscar usuários: ' + authError.message);
      }

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) {
        throw new Error('Erro ao buscar perfis: ' + profilesError.message);
      }

      // Combinar dados de auth e profiles
      const combinedUsers = authUsers.map(authUser => {
        const profile = profiles.find(p => p.id === authUser.id) || {};
        return {
          ...profile,
          email: authUser.email,
          id: authUser.id,
          created_at: profile.created_at || authUser.created_at
        };
      });

      setUsers(combinedUsers);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function promoteToAdmin(userId: string) {
    try {
      setError(null);
      setSuccess(null);
      
      const { data, error } = await supabase
        .rpc('promote_to_admin', { target_user_id: userId });
        
      if (error) throw new Error('Erro ao promover usuário: ' + error.message);
      
      setSuccess('Usuário promovido a administrador com sucesso!');
      fetchUsers(); // Atualizar lista
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function demoteFromAdmin(userId: string) {
    if (userId === currentUser?.id) {
      setError('Você não pode remover suas próprias permissões de administrador!');
      return;
    }
    
    try {
      setError(null);
      setSuccess(null);
      
      const { data, error } = await supabase
        .rpc('demote_from_admin', { target_user_id: userId });
        
      if (error) throw new Error('Erro ao rebaixar usuário: ' + error.message);
      
      setSuccess('Usuário rebaixado para usuário comum com sucesso!');
      fetchUsers(); // Atualizar lista
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function banUser(userId: string, reason: string) {
    if (userId === currentUser?.id) {
      setError('Você não pode banir a si mesmo!');
      return;
    }
    
    try {
      setError(null);
      setSuccess(null);
      
      const { data, error } = await supabase
        .rpc('ban_user', { 
          user_id: userId,
          reason
        });
        
      if (error) throw new Error('Erro ao banir usuário: ' + error.message);
      
      setSuccess('Usuário banido com sucesso!');
      fetchUsers(); // Atualizar lista
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Gerenciamento de Usuários</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}
      
      {loading ? (
        <p>Carregando usuários...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 text-left">Nome</th>
                <th className="px-4 py-2 text-left">Email</th>
                <th className="px-4 py-2 text-left">Papel</th>
                <th className="px-4 py-2 text-left">Data de Criação</th>
                <th className="px-4 py-2 text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="border-t border-gray-200">
                  <td className="px-4 py-2">{user.nome_completo || 'Sem nome'}</td>
                  <td className="px-4 py-2">{user.email}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded text-sm ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                      {user.role === 'ADMIN' ? 'Administrador' : 'Usuário'}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    {new Date(user.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-2 flex justify-center space-x-2">
                    {user.role !== 'ADMIN' ? (
                      <button 
                        onClick={() => promoteToAdmin(user.id)}
                        className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                      >
                        Promover
                      </button>
                    ) : (
                      <button 
                        onClick={() => demoteFromAdmin(user.id)}
                        className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600"
                        disabled={user.id === currentUser?.id}
                      >
                        Rebaixar
                      </button>
                    )}
                    
                    <button 
                      onClick={() => {
                        const reason = prompt('Motivo do banimento:');
                        if (reason) banUser(user.id, reason);
                      }}
                      className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                      disabled={user.id === currentUser?.id}
                    >
                      Banir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 