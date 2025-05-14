'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

// Exemplo de tipo para notificações
interface Notificacao {
  id: string;
  titulo: string;
  descricao: string;
  tipo: 'evento' | 'webinar' | 'conteudo' | 'interacao';
  data: string;
  lida: boolean;
  link?: string;
}

export default function NotificacoesPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [filtro, setFiltro] = useState<string>('todas');
  const router = useRouter();

  // Dados de exemplo - Em uma implementação real, isso viria do backend
  const notificacoesExemplo: Notificacao[] = [
    {
      id: '1',
      titulo: 'Webinar: Introdução ao Next.js',
      descricao: 'Participe do nosso webinar sobre Next.js e aprenda a construir aplicações modernas.',
      tipo: 'webinar',
      data: '2025-05-10T15:00:00Z',
      lida: false,
      link: 'https://exemplo.com/webinar-nextjs'
    },
    {
      id: '2',
      titulo: 'Novo conteúdo disponível',
      descricao: 'Acabamos de adicionar novos tutoriais sobre Supabase e autenticação.',
      tipo: 'conteudo',
      data: '2025-05-05T08:30:00Z',
      lida: true,
      link: 'https://exemplo.com/tutoriais-supabase'
    },
    {
      id: '3',
      titulo: 'Evento presencial: Meetup de desenvolvedores',
      descricao: 'Venha participar do nosso encontro mensal de desenvolvedores front-end.',
      tipo: 'evento',
      data: '2025-05-15T18:00:00Z',
      lida: false,
      link: 'https://exemplo.com/meetup-devs'
    },
    {
      id: '4',
      titulo: 'Maria comentou no seu post',
      descricao: 'Maria deixou um comentário no seu projeto "Dashboard React".',
      tipo: 'interacao',
      data: '2025-05-03T14:22:00Z',
      lida: false,
      link: 'https://exemplo.com/posts/15'
    },
    {
      id: '5',
      titulo: 'Atualização de segurança disponível',
      descricao: 'Uma nova atualização de segurança foi lançada para o seu projeto.',
      tipo: 'conteudo',
      data: '2025-05-01T10:45:00Z',
      lida: true,
      link: 'https://exemplo.com/updates/security'
    }
  ];

  useEffect(() => {
    async function loadUser() {
      try {
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          router.push('/login');
          return;
        }

        setUser(data.session.user);
        
        // Em uma implementação real, buscaríamos as notificações do backend
        // Por exemplo: const { data: notificacoesData } = await supabase.from('notificacoes').select('*').eq('user_id', data.session.user.id);
        
        // Usando dados de exemplo para demonstração
        setNotificacoes(notificacoesExemplo);
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [router]);

  const formatarData = (dataString: string) => {
    const data = new Date(dataString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    }).format(data);
  };

  const marcarComoLida = (id: string) => {
    // Em uma implementação real, atualizaríamos o backend
    // Por exemplo: await supabase.from('notificacoes').update({ lida: true }).eq('id', id);
    
    setNotificacoes(notificacoes.map(notificacao => 
      notificacao.id === id ? { ...notificacao, lida: true } : notificacao
    ));
  };

  const marcarTodasComoLidas = () => {
    // Em uma implementação real, atualizaríamos o backend
    setNotificacoes(notificacoes.map(notificacao => ({ ...notificacao, lida: true })));
  };

  const getNotificacoesFiltradas = () => {
    if (filtro === 'todas') return notificacoes;
    return notificacoes.filter(notificacao => notificacao.tipo === filtro);
  };

  const contarNaoLidas = () => {
    return notificacoes.filter(notificacao => !notificacao.lida).length;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Notificações</h1>
        <Link 
          href="/dashboard" 
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
        >
          Voltar ao Dashboard
        </Link>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <span className="mr-2 text-gray-700">Filtrar por:</span>
            <select 
              value={filtro} 
              onChange={(e) => setFiltro(e.target.value)}
              className="rounded-md border-gray-300 text-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="todas">Todas</option>
              <option value="evento">Eventos</option>
              <option value="webinar">Webinars</option>
              <option value="conteudo">Conteúdos</option>
              <option value="interacao">Interações</option>
            </select>
          </div>
          
          <div className="flex items-center">
            <span className="mr-4 text-sm bg-blue-100 text-blue-800 py-1 px-2 rounded-full">
              {contarNaoLidas()} não lidas
            </span>
            <button 
              onClick={marcarTodasComoLidas}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Marcar todas como lidas
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {getNotificacoesFiltradas().length === 0 ? (
            <div className="text-center py-8">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <p className="mt-4 text-gray-600">Nenhuma notificação encontrada</p>
            </div>
          ) : (
            getNotificacoesFiltradas().map((notificacao) => (
              <div 
                key={notificacao.id} 
                className={`p-4 border rounded-lg ${notificacao.lida ? 'bg-white' : 'bg-blue-50'}`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center mb-1">
                      {!notificacao.lida && (
                        <span className="h-2 w-2 bg-blue-600 rounded-full mr-2" />
                      )}
                      <h3 className="font-medium text-gray-900">{notificacao.titulo}</h3>
                    </div>
                    <p className="text-gray-600 text-sm">{notificacao.descricao}</p>
                    <div className="mt-2 flex items-center space-x-4">
                      <span className="text-xs text-gray-500">{formatarData(notificacao.data)}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        notificacao.tipo === 'evento' ? 'bg-purple-100 text-purple-800' :
                        notificacao.tipo === 'webinar' ? 'bg-green-100 text-green-800' :
                        notificacao.tipo === 'conteudo' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-pink-100 text-pink-800'
                      }`}>
                        {notificacao.tipo === 'evento' ? 'Evento' :
                         notificacao.tipo === 'webinar' ? 'Webinar' :
                         notificacao.tipo === 'conteudo' ? 'Conteúdo' :
                         'Interação'}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {!notificacao.lida && (
                      <button 
                        onClick={() => marcarComoLida(notificacao.id)}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Marcar como lida
                      </button>
                    )}
                    {notificacao.link && (
                      <a 
                        href={notificacao.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800 underline"
                      >
                        Ver detalhes
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
} 