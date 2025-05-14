'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/contexts/UserContext';
import { verificarECorrigirRoleAdmin, getCurrentUserProfile } from '@/lib/auth';
import { colors } from '@/styles/colors';

export default function AdminFixPage() {
  const { user, refreshUser } = useUser();
  const [email, setEmail] = useState('empresarialkluge@gmail.com');
  const [message, setMessage] = useState<{text: string, type: 'success' | 'error' | 'info'} | null>(null);
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);

  useEffect(() => {
    // Mostrar informações do usuário atual logo ao carregar a página
    if (user) {
      setUserInfo(user);
    }
  }, [user]);

  const handleCheckUser = async () => {
    setLoading(true);
    setMessage({ text: 'Verificando usuário atual...', type: 'info' });
    
    try {
      // Forçar uma busca atualizada do perfil do usuário
      await refreshUser();
      
      setMessage({ 
        text: 'Informações do usuário atualizadas. Verifique o console do navegador para detalhes.', 
        type: 'success' 
      });
      
      // Atualizar as informações exibidas
      const profile = await getCurrentUserProfile();
      setUserInfo(profile);
    } catch (error) {
      console.error('Erro ao verificar usuário:', error);
      setMessage({ 
        text: 'Erro ao verificar usuário. Verifique o console para mais detalhes.', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFixAdmin = async () => {
    setLoading(true);
    setMessage({ text: `Corrigindo permissões para ${email}...`, type: 'info' });
    
    try {
      const success = await verificarECorrigirRoleAdmin(email);
      
      if (success) {
        setMessage({ 
          text: `Permissões verificadas/atualizadas com sucesso para ${email}`, 
          type: 'success' 
        });
        
        // Recarregar o perfil do usuário para refletir as mudanças
        await refreshUser();
        // Atualizar as informações exibidas
        const profile = await getCurrentUserProfile();
        setUserInfo(profile);
      } else {
        setMessage({ 
          text: `Não foi possível verificar/atualizar as permissões para ${email}`, 
          type: 'error' 
        });
      }
    } catch (error) {
      console.error('Erro ao corrigir permissões:', error);
      setMessage({ 
        text: 'Erro ao corrigir permissões. Verifique o console para mais detalhes.', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: '#1A1A1A', color: 'white' }}>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Ferramenta de Correção de Permissões Administrativas</h1>
        
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
        
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">1. Verificar Usuário Atual</h2>
          <p className="text-gray-300 mb-4">
            Esta operação irá verificar as informações do usuário atualmente logado e mostrar detalhes no console.
          </p>
          
          <button 
            onClick={handleCheckUser}
            className="px-4 py-2 rounded-md font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            disabled={loading}
          >
            {loading ? 'Verificando...' : 'Verificar Usuário Atual'}
          </button>
          
          {userInfo && (
            <div className="mt-4 p-4 bg-gray-900 rounded-lg">
              <h3 className="font-semibold mb-2">Informações do Usuário:</h3>
              <ul className="space-y-1 text-gray-300">
                <li><strong>ID:</strong> {userInfo.id}</li>
                <li><strong>Email:</strong> {userInfo.email}</li>
                <li><strong>Nome:</strong> {userInfo.name || 'Não definido'}</li>
                <li><strong>Papel:</strong> <span className={userInfo.role === 'admin' ? 'text-green-400' : ''}>{userInfo.role}</span></li>
                <li><strong>Banido:</strong> {userInfo.banned ? 'Sim' : 'Não'}</li>
                <li><strong>Criado em:</strong> {new Date(userInfo.created_at).toLocaleString('pt-BR')}</li>
              </ul>
            </div>
          )}
        </div>
        
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">2. Corrigir Permissões de Administrador</h2>
          <p className="text-gray-300 mb-4">
            Esta operação irá verificar e corrigir as permissões de administrador para o e-mail fornecido.
          </p>
          
          <div className="mb-4">
            <label className="block text-gray-400 mb-2">Email do Usuário</label>
            <input 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white"
              placeholder="exemplo@email.com"
            />
          </div>
          
          <button 
            onClick={handleFixAdmin}
            className="px-4 py-2 rounded-md font-medium"
            style={{ backgroundColor: colors.greenLight, color: 'white' }}
            disabled={loading || !email}
          >
            {loading ? 'Processando...' : 'Corrigir Permissões de Admin'}
          </button>
        </div>
        
        <div className="mt-8">
          <p className="text-gray-400 text-sm">
            Após corrigir as permissões, você pode precisar fazer logout e login novamente para que as alterações tenham efeito.
          </p>
          <p className="text-gray-400 text-sm mt-2">
            Verifique o console do navegador (F12) para obter informações mais detalhadas sobre o processo.
          </p>
        </div>
      </div>
    </div>
  );
} 