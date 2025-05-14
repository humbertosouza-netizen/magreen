'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { colors } from '@/styles/colors';

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setUser(data.session.user);
        
        // Buscar o perfil do usuário
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.session.user.id)
          .single();
          
        if (profileData) {
          setProfile(profileData);
        }
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent" 
             style={{ borderColor: colors.greenLight, borderTopColor: 'transparent' }}></div>
      </div>
    );
  }

  return (
    <div>
      {/* Seção de boas-vindas */}
      <div className="mb-8 p-8 rounded-xl relative overflow-hidden" 
        style={{
          background: 'linear-gradient(135deg, #3b1d59 0%, #2c1241 100%)',
          border: '1px solid rgba(127, 219, 63, 0.3)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
        }}>
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "url('/images/leaf-pattern-bg.svg')",
            backgroundSize: "200px",
            backgroundRepeat: "repeat"
          }}
        ></div>
        
        {/* Elemento decorativo inspirado na pirâmide maia */}
        <div className="absolute right-0 bottom-0 w-32 h-32 opacity-20"
          style={{
            backgroundImage: "url('/images/mayan-temple-background.png')",
            backgroundSize: "contain",
            backgroundPosition: "bottom right",
            backgroundRepeat: "no-repeat"
          }}
        ></div>
        
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2" 
            style={{ 
              background: 'linear-gradient(135deg, #7FDB3F 0%, #F8CC3C 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 2px 10px rgba(127, 219, 63, 0.3)'
            }}>
            Bem-vindo à Comunidade, {profile?.nickname || profile?.nome_completo || user?.email?.split('@')[0] || 'Cultivador'}!
          </h1>
          <p className="text-green-100 text-lg">
            Explore nossos conteúdos exclusivos, registre seu cultivo e conecte-se com a comunidade.
          </p>
        </div>
      </div>

      {/* Cabeçalho da seção de conteúdos */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold" style={{ 
          background: 'linear-gradient(135deg, #7FDB3F 0%, #F8CC3C 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textShadow: '0 2px 10px rgba(127, 219, 63, 0.3)'
        }}>
          Conteúdo
        </h2>
        <p className="text-green-200">Cursos e conteúdos exclusivos Magnificência Green</p>
      </div>

      {/* Cards de conteúdo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Card Estude Aqui */}
        <Link href="/dashboard/estudos" 
          className="group rounded-2xl overflow-hidden backdrop-blur-sm border border-opacity-40 border-green-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-green-900/20 hover:border-green-500/60 hover:translate-y-[-5px] relative"
          style={{ background: 'rgba(22, 28, 36, 0.8)' }}>
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/50 to-green-900/40 opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
          <div className="absolute inset-0 bg-[url('/images/leaf-pattern-bg.svg')] bg-repeat opacity-5 group-hover:opacity-10 transition-opacity duration-300" style={{ backgroundSize: '120px' }}></div>
          <div className="h-52 bg-gradient-to-r from-blue-900 to-green-900 relative overflow-hidden">
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <div className="px-5 py-3 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 shadow-lg transform group-hover:scale-105 transition-transform duration-300">
                <h3 className="text-xl font-bold text-white text-center">Meu Primeiro Curso Online</h3>
              </div>
            </div>
            <div className="absolute top-4 right-4 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-xs font-bold rounded-full shadow-lg">
              LANÇAMENTO
            </div>
          </div>
          <div className="p-5 relative z-10">
            <h3 className="text-xl font-bold mb-3" style={{ 
              background: 'linear-gradient(135deg, #7FDB3F 0%, #F8CC3C 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>Estude Aqui</h3>
            <p className="text-gray-300 mb-4 line-clamp-2">Acesse nossos cursos e materiais exclusivos para expandir seu conhecimento.</p>
            <div className="flex justify-between items-center">
              <span className="px-4 py-1.5 rounded-full text-black font-semibold group-hover:scale-105 transition-all shadow-md"
                style={{ background: 'linear-gradient(135deg, #7FDB3F, #F8CC3C)' }}>
                Acessar
              </span>
            </div>
          </div>
        </Link>

        {/* Card Registre seu Cultivo */}
        <Link href="/dashboard/cultivo" 
          className="group rounded-2xl overflow-hidden backdrop-blur-sm border border-opacity-40 border-green-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-green-900/20 hover:border-green-500/60 hover:translate-y-[-5px] relative"
          style={{ background: 'rgba(22, 28, 36, 0.8)' }}>
          <div className="absolute inset-0 bg-gradient-to-br from-green-900/50 to-yellow-800/40 opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
          <div className="absolute inset-0 bg-[url('/images/leaf-pattern-bg.svg')] bg-repeat opacity-5 group-hover:opacity-10 transition-opacity duration-300" style={{ backgroundSize: '120px' }}></div>
          <div className="h-52 bg-gradient-to-r from-green-900 to-yellow-800 relative overflow-hidden">
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <div className="px-5 py-3 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 shadow-lg transform group-hover:scale-105 transition-transform duration-300">
                <h3 className="text-xl font-bold text-white text-center">Iniciando sua Jornada Digital</h3>
              </div>
            </div>
            <div className="absolute top-4 right-4 px-3 py-1.5 bg-gradient-to-r from-green-600 to-green-500 text-white text-xs font-bold rounded-full shadow-lg">
              GRATUITO
            </div>
          </div>
          <div className="p-5 relative z-10">
            <h3 className="text-xl font-bold mb-3" style={{ 
              background: 'linear-gradient(135deg, #7FDB3F 0%, #F8CC3C 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>Registre seu Cultivo</h3>
            <p className="text-gray-300 mb-4 line-clamp-2">Acompanhe e documente o progresso do seu cultivo com nossas ferramentas.</p>
            <div className="flex justify-between items-center">
              <span className="px-4 py-1.5 rounded-full text-black font-semibold group-hover:scale-105 transition-all shadow-md"
                style={{ background: 'linear-gradient(135deg, #7FDB3F, #F8CC3C)' }}>
                Acessar
              </span>
            </div>
          </div>
        </Link>

        {/* Card Produtos */}
        <Link href="/dashboard/produtos" 
          className="group rounded-2xl overflow-hidden backdrop-blur-sm border border-opacity-40 border-green-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-green-900/20 hover:border-green-500/60 hover:translate-y-[-5px] relative"
          style={{ background: 'rgba(22, 28, 36, 0.8)' }}>
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-800/50 to-green-800/40 opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
          <div className="absolute inset-0 bg-[url('/images/leaf-pattern-bg.svg')] bg-repeat opacity-5 group-hover:opacity-10 transition-opacity duration-300" style={{ backgroundSize: '120px' }}></div>
          <div className="h-52 bg-gradient-to-r from-yellow-800 to-green-800 relative overflow-hidden">
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <div className="px-5 py-3 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 shadow-lg transform group-hover:scale-105 transition-transform duration-300">
                <h3 className="text-xl font-bold text-white text-center">Catálogo Completo</h3>
              </div>
            </div>
            <div className="absolute top-4 right-4 px-3 py-1.5 bg-gradient-to-r from-yellow-600 to-yellow-500 text-white text-xs font-bold rounded-full shadow-lg">
              NOVOS PRODUTOS
            </div>
          </div>
          <div className="p-5 relative z-10">
            <h3 className="text-xl font-bold mb-3" style={{ 
              background: 'linear-gradient(135deg, #7FDB3F 0%, #F8CC3C 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>Nossos Produtos</h3>
            <p className="text-gray-300 mb-4 line-clamp-2">Conheça nossa linha completa de produtos para otimizar seu cultivo.</p>
            <div className="flex justify-between items-center">
              <span className="px-4 py-1.5 rounded-full text-black font-semibold group-hover:scale-105 transition-all shadow-md"
                style={{ background: 'linear-gradient(135deg, #7FDB3F, #F8CC3C)' }}>
                Acessar
              </span>
            </div>
          </div>
        </Link>

        {/* Card Nosso Blog */}
        <Link href="/dashboard/blog" 
          className="group rounded-2xl overflow-hidden backdrop-blur-sm border border-opacity-40 border-green-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-green-900/20 hover:border-green-500/60 hover:translate-y-[-5px] relative"
          style={{ background: 'rgba(22, 28, 36, 0.8)' }}>
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/50 to-blue-900/40 opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
          <div className="absolute inset-0 bg-[url('/images/leaf-pattern-bg.svg')] bg-repeat opacity-5 group-hover:opacity-10 transition-opacity duration-300" style={{ backgroundSize: '120px' }}></div>
          <div className="h-52 bg-gradient-to-r from-purple-900 to-blue-900 relative overflow-hidden">
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <div className="px-5 py-3 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 shadow-lg transform group-hover:scale-105 transition-transform duration-300">
                <h3 className="text-xl font-bold text-white text-center">Máquina de Criativos</h3>
              </div>
            </div>
            <div className="absolute top-4 right-4 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-purple-500 text-white text-xs font-bold rounded-full shadow-lg">
              GRATUITO
            </div>
          </div>
          <div className="p-5 relative z-10">
            <h3 className="text-xl font-bold mb-3" style={{ 
              background: 'linear-gradient(135deg, #7FDB3F 0%, #F8CC3C 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>Nosso Blog</h3>
            <p className="text-gray-300 mb-4 line-clamp-2">Leia artigos informativos, dicas e compartilhe suas experiências com a comunidade.</p>
            <div className="flex justify-between items-center">
              <span className="px-4 py-1.5 rounded-full text-black font-semibold group-hover:scale-105 transition-all shadow-md"
                style={{ background: 'linear-gradient(135deg, #7FDB3F, #F8CC3C)' }}>
                Acessar
              </span>
            </div>
          </div>
        </Link>
      </div>

      {/* Seção de destaque Magnificência */}
      <div className="mt-12 p-6 rounded-lg bg-gradient-to-r from-purple-900 to-green-900 border border-green-800 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "url('/images/leaf-pattern-bg.svg')",
            backgroundSize: "200px",
            backgroundRepeat: "repeat"
          }}
        ></div>
        
        <div className="absolute right-6 bottom-6 w-24 h-24 opacity-30"
          style={{
            backgroundImage: "url('/images/logo/magnificencia-green-logo.svg')",
            backgroundSize: "contain",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat"
          }}
        ></div>
        
        <div className="relative z-10">
          <h2 className="text-2xl font-bold mb-3" style={{ 
            background: 'linear-gradient(135deg, #7FDB3F 0%, #F8CC3C 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Magnificência Green
          </h2>
          <p className="text-green-100 mb-4">
            Somos a maior comunidade de cultivadores do Brasil. Nossa missão é promover conhecimento, 
            troca de experiências e produtos de qualidade para todos os níveis de cultivo.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/dashboard/sobre" className="px-4 py-2 rounded-lg bg-green-700 text-white hover:bg-green-600 transition-colors">
              Sobre nós
            </Link>
            <Link href="/dashboard/contato" className="px-4 py-2 rounded-lg bg-purple-800 text-white hover:bg-purple-700 transition-colors">
              Entre em contato
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 