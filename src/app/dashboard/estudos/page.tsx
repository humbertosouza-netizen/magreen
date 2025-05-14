'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { colors } from '@/styles/colors';
import { useUser } from '@/contexts/UserContext';
import { useDashboardState } from '@/contexts/DashboardStateContext';
import { usePageState } from '@/hooks/usePageState';
import theme from '@/styles/theme';

// Definir interfaces
interface Curso {
  id: string;
  titulo: string;
  descricao: string;
  categoria: string;
  instrutor: string;
  imagem_url?: string;
  video_url?: string;
  material_url?: string;
  total_aulas: number;
  duracao_total: string;
  nivel: 'Iniciante' | 'Intermediário' | 'Avançado';
  data_criacao: string;
  visualizacoes: number;
  publicado: boolean;
}

interface Aula {
  id: string;
  curso_id: string;
  titulo: string;
  descricao: string;
  video_url: string;
  material_url?: string;
  duracao: string;
  ordem: number;
}

export default function AdminEstudosPage() {
  const { user, isAdmin } = useUser();
  const router = useRouter();
  const { setViewingItemId } = useDashboardState();
  
  // Usando usePageState para persistência de estado
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = usePageState<'cursos' | 'novo' | 'visualizar'>('estudos_activeTab', 'cursos');
  const [editingCurso, setEditingCurso] = usePageState<Curso | null>('estudos_editingCurso', null);
  const [viewingCurso, setViewingCurso] = usePageState<Curso | null>('estudos_viewingCurso', null);
  
  // Estados para o formulário de novo curso
  const [titulo, setTitulo] = usePageState<string>('estudos_titulo', '');
  const [descricao, setDescricao] = usePageState<string>('estudos_descricao', '');
  const [categoria, setCategoria] = usePageState<string>('estudos_categoria', 'Frontend');
  const [instrutor, setInstrutor] = usePageState<string>('estudos_instrutor', '');
  const [imagemUrl, setImagemUrl] = usePageState<string>('estudos_imagemUrl', '');
  const [videoUrl, setVideoUrl] = usePageState<string>('estudos_videoUrl', '');
  const [materialUrl, setMaterialUrl] = usePageState<string>('estudos_materialUrl', '');
  const [totalAulas, setTotalAulas] = usePageState<number>('estudos_totalAulas', 1);
  const [duracaoTotal, setDuracaoTotal] = usePageState<string>('estudos_duracaoTotal', '');
  const [nivel, setNivel] = usePageState<'Iniciante' | 'Intermediário' | 'Avançado'>('estudos_nivel', 'Iniciante');
  const [publicado, setPublicado] = usePageState<boolean>('estudos_publicado', false);
  
  // Estados para aulas
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [currentAula, setCurrentAula] = usePageState<Aula | null>('estudos_currentAula', null);
  const [assistindoAula, setAssistindoAula] = usePageState<boolean>('estudos_assistindoAula', false);
  const [showAulaModal, setShowAulaModal] = usePageState<boolean>('estudos_showAulaModal', false);
  const [editingAula, setEditingAula] = usePageState<Aula | null>('estudos_editingAula', null);
  
  // Estados para o formulário de nova aula
  const [aulaTitulo, setAulaTitulo] = usePageState<string>('estudos_aulaTitulo', '');
  const [aulaDescricao, setAulaDescricao] = usePageState<string>('estudos_aulaDescricao', '');
  const [aulaVideoUrl, setAulaVideoUrl] = usePageState<string>('estudos_aulaVideoUrl', '');
  const [aulaMaterialUrl, setAulaMaterialUrl] = usePageState<string>('estudos_aulaMaterialUrl', '');
  const [aulaDuracao, setAulaDuracao] = usePageState<string>('estudos_aulaDuracao', '');
  const [aulaOrdem, setAulaOrdem] = usePageState<number>('estudos_aulaOrdem', 1);
  
  // Lista de categorias disponíveis
  const categorias = [
    'Frontend', 
    'Backend', 
    'DevOps', 
    'Agricultura', 
    'Energia',
    'Gestão',
    'Certificação',
    'Sustentabilidade'
  ];
  
  // Níveis disponíveis
  const niveis = ['Iniciante', 'Intermediário', 'Avançado'];
  
  useEffect(() => {
    // Verificar se o usuário é admin
    if (!isAdmin) {
      router.push('/dashboard');
      return;
    }
    
    // Buscar os cursos do Supabase
    const fetchCursos = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('cursos')
          .select('*')
          .order('data_criacao', { ascending: false });
          
        if (error) throw error;
        setCursos(data || []);
        
        // Buscar as aulas dos cursos
        const { data: aulasData, error: aulasError } = await supabase
          .from('aulas')
          .select('*')
          .order('ordem', { ascending: true });
          
        if (aulasError) throw aulasError;
        setAulas(aulasData || []);
      } catch (error) {
        console.error('Erro ao buscar cursos:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCursos();
  }, [isAdmin, router]);
  
  // Evento para quando a visibilidade da página muda (minimizar/restaurar)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Quando a página é minimizada, salvamos o estado atual em localStorage
        if (viewingCurso) {
          setViewingItemId(viewingCurso.id);
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [viewingCurso, setViewingItemId]);

  // Função para editar um curso
  const handleEditCurso = (curso: Curso) => {
    setEditingCurso(curso);
    setTitulo(curso.titulo);
    setDescricao(curso.descricao);
    setCategoria(curso.categoria);
    setInstrutor(curso.instrutor);
    setImagemUrl(curso.imagem_url || '');
    setVideoUrl(curso.video_url || '');
    setMaterialUrl(curso.material_url || '');
    setTotalAulas(curso.total_aulas);
    setDuracaoTotal(curso.duracao_total);
    setNivel(curso.nivel);
    setPublicado(curso.publicado);
    setActiveTab('novo');
  };

  // Função para visualizar um curso
  const handleViewCurso = (curso: Curso) => {
    setViewingCurso(curso);
    setCurrentAula(null);
    setAssistindoAula(false);
    setActiveTab('visualizar');
  };

  // Função para visualizar uma aula específica
  const handleViewAula = (aula: Aula) => {
    setCurrentAula(aula);
    setAssistindoAula(true);
  };
  
  // Função para voltar à visão geral do curso
  const handleVoltarAosCursos = () => {
    setAssistindoAula(false);
    setCurrentAula(null);
    
    // Atualizar localStorage
    localStorage.removeItem('currentAula');
    localStorage.setItem('assistindoAula', 'false');
  };

  // Função para adicionar/atualizar um curso
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!titulo || !descricao || !categoria || !instrutor || !nivel || !duracaoTotal) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    
    try {
      const cursoDados = {
        titulo,
        descricao,
        categoria,
        instrutor,
        imagem_url: imagemUrl,
        video_url: videoUrl,
        material_url: materialUrl,
        total_aulas: totalAulas,
        duracao_total: duracaoTotal,
        nivel,
        publicado
      };
      
      if (editingCurso) {
        // Atualização de curso existente
        const { error } = await supabase
          .from('cursos')
          .update(cursoDados)
          .eq('id', editingCurso.id);
          
        if (error) throw error;
        
        // Atualiza o curso na lista local
        setCursos(cursos.map(c => 
          c.id === editingCurso.id ? { ...c, ...cursoDados } : c
        ));
        
        // Atualiza os dados de aulas temporárias para o ID real do curso
        for (const aula of aulas.filter(a => a.curso_id === 'temp_new_course')) {
          const { error: aulaError } = await supabase
            .from('aulas')
            .update({ curso_id: editingCurso.id })
            .eq('id', aula.id);
            
          if (aulaError) throw aulaError;
        }
        
        setAulas(aulas.map(a => 
          a.curso_id === 'temp_new_course' ? { ...a, curso_id: editingCurso.id } : a
        ));
      } else {
        // Criação de novo curso
        const novoCurso = {
          ...cursoDados,
          data_criacao: new Date().toISOString(),
          visualizacoes: 0
        };
        
        // Insere o curso e retorna o registro com o ID gerado
        const { data, error } = await supabase
          .from('cursos')
          .insert(novoCurso)
          .select();
          
        if (error) throw error;
        
        if (data && data.length > 0) {
          const cursoId = data[0].id;
          
          // Adiciona o novo curso à lista local
          setCursos([data[0], ...cursos]);
          
          // Atualiza os dados de aulas temporárias para o ID real do curso
          for (const aula of aulas.filter(a => a.curso_id === 'temp_new_course')) {
            const { error: aulaError } = await supabase
              .from('aulas')
              .update({ curso_id: cursoId })
              .eq('id', aula.id);
              
            if (aulaError) throw aulaError;
          }
          
          // Atualiza o estado local das aulas
          setAulas(aulas.map(a => 
            a.curso_id === 'temp_new_course' ? { ...a, curso_id: cursoId } : a
          ));
        }
      }
      
      // Limpa formulário e retorna para lista de cursos
      resetForm();
      setActiveTab('cursos');
    } catch (error) {
      console.error('Erro ao salvar curso:', error);
      alert('Ocorreu um erro ao salvar o curso. Tente novamente.');
    }
  };

  // Função para excluir um curso
  const handleDeleteCurso = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este curso?')) {
      return;
    }
    
    try {
      // Primeiro exclui as aulas relacionadas
      const { error: aulasError } = await supabase
        .from('aulas')
        .delete()
        .eq('curso_id', id);
        
      if (aulasError) throw aulasError;
      
      // Depois exclui o curso
      const { error } = await supabase
        .from('cursos')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      // Atualiza o estado local
      setCursos(cursos.filter(c => c.id !== id));
      setAulas(aulas.filter(a => a.curso_id !== id));
    } catch (error) {
      console.error('Erro ao excluir curso:', error);
      alert('Ocorreu um erro ao excluir o curso. Tente novamente.');
    }
  };

  // Função para alternar o status de publicação de um curso
  const handleTogglePublicado = async (id: string, novoStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('cursos')
        .update({ publicado: novoStatus })
        .eq('id', id);
        
      if (error) throw error;
      
      // Atualiza o estado local
      setCursos(cursos.map(c => c.id === id ? {...c, publicado: novoStatus} : c));
    } catch (error) {
      console.error('Erro ao atualizar status do curso:', error);
      alert('Ocorreu um erro ao atualizar o status do curso. Tente novamente.');
    }
  };

  // Função para limpar o formulário
  const resetForm = () => {
    setEditingCurso(null);
    setTitulo('');
    setDescricao('');
    setCategoria('Frontend');
    setInstrutor('');
    setImagemUrl('');
    setVideoUrl('');
    setMaterialUrl('');
    setTotalAulas(1);
    setDuracaoTotal('');
    setNivel('Iniciante');
    setPublicado(false);
    
    // Limpar aulas temporárias quando resetar o formulário
    setAulas(aulas.filter(aula => aula.curso_id !== 'temp_new_course'));
  };

  // Função para limpar o formulário de aula
  const resetAulaForm = () => {
    setEditingAula(null);
    setAulaTitulo('');
    setAulaDescricao('');
    setAulaVideoUrl('');
    setAulaMaterialUrl('');
    setAulaDuracao('');
    
    // Calcular a próxima ordem baseado nas aulas existentes
    const cursoId = editingCurso ? editingCurso.id : 'temp_new_course';
    const aulasExistentes = aulas.filter(aula => aula.curso_id === cursoId);
    setAulaOrdem(aulasExistentes.length + 1);
  };

  // Função para abrir o modal de adicionar aula
  const handleAddAula = () => {
    resetAulaForm();
    setShowAulaModal(true);
  };

  // Função para editar uma aula
  const handleEditAula = (aula: Aula) => {
    setEditingAula(aula);
    setAulaTitulo(aula.titulo);
    setAulaDescricao(aula.descricao);
    setAulaVideoUrl(aula.video_url);
    setAulaMaterialUrl(aula.material_url || '');
    setAulaDuracao(aula.duracao);
    setAulaOrdem(aula.ordem);
    setShowAulaModal(true);
  };

  // Função para salvar uma aula
  const handleSaveAula = async () => {
    if (!aulaTitulo || !aulaDescricao || !aulaVideoUrl || !aulaDuracao) {
      alert('Por favor, preencha todos os campos obrigatórios da aula.');
      return;
    }

    // Definir o ID do curso (real ou temporário)
    const cursoId = editingCurso ? editingCurso.id : 'temp_new_course';
    
    try {
      if (editingAula) {
        // Atualizar aula existente
        const aulaAtualizada: Aula = {
          ...editingAula,
          titulo: aulaTitulo,
          descricao: aulaDescricao,
          video_url: aulaVideoUrl,
          material_url: aulaMaterialUrl,
          duracao: aulaDuracao,
          ordem: aulaOrdem
        };

        // Persistir no Supabase
        const { error } = await supabase
          .from('aulas')
          .update(aulaAtualizada)
          .eq('id', editingAula.id);
          
        if (error) throw error;

        // Atualizar estado local
        setAulas(aulas.map(a => a.id === editingAula.id ? aulaAtualizada : a));
      } else {
        // Criar nova aula
        const novaAula: Omit<Aula, 'id'> = {
          curso_id: cursoId,
          titulo: aulaTitulo,
          descricao: aulaDescricao,
          video_url: aulaVideoUrl,
          material_url: aulaMaterialUrl,
          duracao: aulaDuracao,
          ordem: aulaOrdem
        };

        // Persistir no Supabase
        const { data, error } = await supabase
          .from('aulas')
          .insert(novaAula)
          .select();
          
        if (error) throw error;
        
        // Adicionar a nova aula com o ID gerado pelo Supabase
        if (data && data.length > 0) {
          setAulas([...aulas, data[0]]);
          
          // Atualizar o total de aulas no curso, se estiver editando
          if (editingCurso) {
            const cursoAtualizado = {...editingCurso, total_aulas: editingCurso.total_aulas + 1};
            
            // Atualizar no Supabase
            await supabase
              .from('cursos')
              .update({ total_aulas: cursoAtualizado.total_aulas })
              .eq('id', editingCurso.id);
              
            setCursos(cursos.map(c => c.id === editingCurso.id ? cursoAtualizado : c));
            setEditingCurso(cursoAtualizado);
          } else {
            // Se estiver criando um novo curso, atualizar o contador no formulário
            setTotalAulas(totalAulas + 1);
          }
        }
      }

      // Fechar modal e limpar formulário
      setShowAulaModal(false);
      resetAulaForm();
    } catch (error) {
      console.error('Erro ao salvar aula:', error);
      alert('Ocorreu um erro ao salvar a aula. Tente novamente.');
    }
  };

  // Função para excluir uma aula
  const handleDeleteAula = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta aula?')) {
      return;
    }

    try {
      const aulaParaExcluir = aulas.find(a => a.id === id);
      
      if (aulaParaExcluir) {
        // Excluir no Supabase
        const { error } = await supabase
          .from('aulas')
          .delete()
          .eq('id', id);
          
        if (error) throw error;
        
        // Atualizar o total de aulas no curso, se estiver editando
        if (editingCurso && aulaParaExcluir.curso_id === editingCurso.id) {
          const cursoAtualizado = {...editingCurso, total_aulas: Math.max(0, editingCurso.total_aulas - 1)};
          
          // Atualizar no Supabase
          await supabase
            .from('cursos')
            .update({ total_aulas: cursoAtualizado.total_aulas })
            .eq('id', editingCurso.id);
            
          setCursos(cursos.map(c => c.id === editingCurso.id ? cursoAtualizado : c));
          setEditingCurso(cursoAtualizado);
        } else if (aulaParaExcluir.curso_id === 'temp_new_course') {
          // Se for uma aula de um novo curso, atualizar o contador no formulário
          setTotalAulas(Math.max(0, totalAulas - 1));
        }
      }
      
      // Atualizar estado local
      setAulas(aulas.filter(a => a.id !== id));
    } catch (error) {
      console.error('Erro ao excluir aula:', error);
      alert('Ocorreu um erro ao excluir a aula. Tente novamente.');
    }
  };

  // Limpar localStorage ao voltar para a lista de cursos
  const handleVoltarParaLista = () => {
    setActiveTab('cursos');
    resetForm();
    setViewingCurso(null);
    setCurrentAula(null);
    setAssistindoAula(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent" 
             style={{ borderColor: theme.colors.primary, borderTopColor: 'transparent' }}></div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Fundo estilizado com padrão de folhas */}
      <div 
        className="absolute inset-0 z-0 opacity-5 pointer-events-none" 
        style={{
          backgroundImage: `url('/images/leaf-pattern-bg.svg')`,
          backgroundSize: '250px',
          backgroundRepeat: 'repeat',
        }}
      />

      {/* Elemento decorativo do templo maia */}
      <div className="absolute bottom-0 right-0 w-96 h-96 opacity-5 pointer-events-none z-0 hidden md:block">
        <div 
          className="w-full h-full"
          style={{
            backgroundImage: `url('/images/mayan-temple-background.png')`,
            backgroundSize: 'contain',
            backgroundPosition: 'bottom right',
            backgroundRepeat: 'no-repeat',
          }}
        />
      </div>
      
      <div className="relative z-10">
        {/* Modal para adicionar registros/fotos/produtos */}
        {showAulaModal && (
          <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 backdrop-blur-sm p-4">
            <div className="rounded-xl overflow-hidden max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                    style={{ 
                background: 'rgba(31, 41, 55, 0.95)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)'
              }}>
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold" style={{ color: theme.colors.textPrimary }}>
                    {editingAula ? 'Editar Aula' : 'Nova Aula'}
                  </h3>
                  <button 
                    onClick={() => setShowAulaModal(false)} 
                    className="rounded-full p-2 hover:bg-opacity-10 transition-colors"
                    style={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      color: theme.colors.textSecondary,
                      touchAction: "manipulation"
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="mb-4">
                  <label htmlFor="aulaTitulo" className="block text-sm font-medium mb-1" style={{ color: theme.colors.textPrimary }}>
                    Título da Aula *
                  </label>
                  <input
                    type="text"
                    id="aulaTitulo"
                    value={aulaTitulo}
                    onChange={(e) => setAulaTitulo(e.target.value)}
                    className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2"
                    style={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.07)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: theme.colors.textPrimary 
                    }}
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="aulaDescricao" className="block text-sm font-medium mb-1" style={{ color: theme.colors.textPrimary }}>
                    Descrição da Aula *
                  </label>
                  <textarea
                    id="aulaDescricao"
                    rows={3}
                    value={aulaDescricao}
                    onChange={(e) => setAulaDescricao(e.target.value)}
                    className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2"
                    style={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.07)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: theme.colors.textPrimary 
                    }}
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="aulaVideoUrl" className="block text-sm font-medium mb-1" style={{ color: theme.colors.textPrimary }}>
                    URL do Vídeo Embed (YouTube, Vimeo, etc.) *
                  </label>
                  <input
                    type="url"
                    id="aulaVideoUrl"
                    value={aulaVideoUrl}
                    onChange={(e) => setAulaVideoUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2"
                    style={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.07)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: theme.colors.textPrimary 
                    }}
                    placeholder="https://www.youtube.com/embed/video-id"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="aulaMaterialUrl" className="block text-sm font-medium mb-1" style={{ color: theme.colors.textPrimary }}>
                    URL do Material da Aula
                  </label>
                  <input
                    type="url"
                    id="aulaMaterialUrl"
                    value={aulaMaterialUrl}
                    onChange={(e) => setAulaMaterialUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2"
                    style={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.07)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: theme.colors.textPrimary 
                    }}
                    placeholder="https://exemplo.com/material.pdf"
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="aulaDuracao" className="block text-sm font-medium mb-1" style={{ color: theme.colors.textPrimary }}>
                    Duração da Aula (ex: 15min) *
                  </label>
                  <input
                    type="text"
                    id="aulaDuracao"
                    value={aulaDuracao}
                    onChange={(e) => setAulaDuracao(e.target.value)}
                    className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2"
                    style={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.07)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: theme.colors.textPrimary 
                    }}
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="aulaOrdem" className="block text-sm font-medium mb-1" style={{ color: theme.colors.textPrimary }}>
                    Ordem da Aula
                  </label>
                  <input
                    type="number"
                    id="aulaOrdem"
                    min="1"
                    value={aulaOrdem}
                    onChange={(e) => setAulaOrdem(parseInt(e.target.value))}
                    className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2"
                    style={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.07)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: theme.colors.textPrimary 
                    }}
                  />
                </div>
                
                <div className="p-6 flex justify-end space-x-3 border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                  <button
                    type="button"
                    onClick={() => setShowAulaModal(false)}
                    className="px-4 py-2 rounded-md shadow-sm text-sm font-medium"
                    style={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      color: theme.colors.textSecondary
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveAula}
                    className="px-4 py-2 rounded-md shadow-sm text-sm font-medium text-black"
                    style={{ 
                      background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.accent})`,
                      boxShadow: '0 4px 10px rgba(127, 219, 63, 0.3)'
                    }}
                  >
                    {editingAula ? 'Atualizar Aula' : 'Adicionar Aula'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Cabeçalho com estilo Maia/Green */}
        <div 
          className="mb-10 relative overflow-hidden rounded-xl p-8"
          style={{
            background: `linear-gradient(135deg, ${theme.colors.primary}90, ${theme.colors.accent}70)`,
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
          }}
        >
          {/* Overlay com padrão de folhas */}
          <div 
            className="absolute inset-0 z-0 opacity-10" 
            style={{
              backgroundImage: `url('/images/leaf-pattern-bg.svg')`,
              backgroundSize: '100px',
              backgroundRepeat: 'repeat',
            }}
          />
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center">
            <div>
              <h1 
                className="text-3xl md:text-4xl font-bold mb-2"
                style={{ 
                  color: '#fff',
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                }}
              >
                Método MAGNIFICÊNCIA
              </h1>
              <p 
                className="text-lg"
                style={{ 
                  color: 'rgba(255, 255, 255, 0.9)',
                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
                }}
              >
                Gerencie cursos, aulas e materiais de aprendizado
              </p>
            </div>
            
            <button
              className="px-6 py-3 rounded-full text-black font-medium transition-all hover:shadow-lg mt-4 md:mt-0"
              style={{ 
                background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.accent})`,
                boxShadow: '0 4px 10px rgba(127, 219, 63, 0.3)',
                touchAction: "manipulation"
              }}
              onClick={() => {
                resetForm();
                setActiveTab('novo');
              }}
            >
              Adicionar Novo Curso
            </button>
          </div>
        </div>
      
        {/* Abas de navegação */}
        <div className="border-b mb-6" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
          <div className="flex -mb-px">
            <button
              className={`py-2 px-6 font-medium text-sm transition-all ${
                activeTab === 'cursos'
                  ? 'border-b-2'
                  : 'hover:text-white'
              }`}
              style={{ 
                borderColor: activeTab === 'cursos' ? theme.colors.primary : 'transparent',
                color: activeTab === 'cursos' ? theme.colors.primary : theme.colors.textSecondary 
              }}
              onClick={handleVoltarParaLista}
            >
              Cursos Disponíveis
            </button>
            <button
              className={`py-2 px-6 font-medium text-sm transition-all ${
                activeTab === 'novo'
                  ? 'border-b-2'
                  : 'hover:text-white'
              }`}
              style={{ 
                borderColor: activeTab === 'novo' ? theme.colors.primary : 'transparent',
                color: activeTab === 'novo' ? theme.colors.primary : theme.colors.textSecondary 
              }}
              onClick={() => setActiveTab('novo')}
            >
              {editingCurso ? 'Editar Curso' : 'Novo Curso'}
            </button>
            {viewingCurso && (
              <button
                className={`py-2 px-6 font-medium text-sm transition-all ${
                  activeTab === 'visualizar'
                    ? 'border-b-2'
                    : 'hover:text-white'
                }`}
                style={{ 
                  borderColor: activeTab === 'visualizar' ? theme.colors.primary : 'transparent',
                  color: activeTab === 'visualizar' ? theme.colors.primary : theme.colors.textSecondary 
                }}
                onClick={() => setActiveTab('visualizar')}
              >
                Visualizar Curso
              </button>
            )}
          </div>
        </div>
        
        {/* Conteúdo baseado na aba ativa */}
        {activeTab === 'cursos' ? (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold" style={{ 
                background: 'linear-gradient(135deg, #E0A800 0%, #FFD700 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>Lista de Cursos</h2>
            </div>
            
            {/* Grid de cursos em cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
              {cursos.map((curso) => (
                <div 
                  key={curso.id} 
                  className="rounded-lg overflow-hidden border border-gray-800 shadow-xl transition-all hover:transform hover:scale-[1.02] hover:shadow-2xl"
                  style={{ 
                    background: 'linear-gradient(135deg, #222 0%, #1a1a1a 100%)', 
                    transition: 'all 0.3s ease',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
                  }}
                >
                  <div 
                    className="h-48 bg-cover bg-center relative"
                    style={{ 
                      backgroundImage: `url(${curso.imagem_url || `https://via.placeholder.com/400x200/333/666?text=${curso.titulo.charAt(0)}`})`,
                    }}
                  >
                    <div 
                      className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-80"
                    ></div>
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <div className="flex justify-between items-end">
                        <h3 className="text-lg font-bold text-white">{curso.titulo}</h3>
                        <span 
                          className="px-2 py-1 text-xs rounded-full"
                          style={{ 
                            background: 'linear-gradient(135deg, #E0A800, #FFC107)',
                            color: 'black',
                            fontWeight: 'bold',
                            boxShadow: '0 2px 5px rgba(224, 168, 0, 0.3)'
                          }}
                        >
                          {curso.nivel}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">{curso.descricao}</p>
                    
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-xs text-gray-400">{curso.duracao_total}</span>
                      </div>
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <span className="text-xs text-gray-400">{curso.total_aulas} aulas</span>
                      </div>
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span className="text-xs text-gray-400">{curso.visualizacoes}</span>
                      </div>
                    </div>
                    
                    {/* Indicador de progresso */}
                    <div className="mb-4">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-400">Progresso</span>
                        <span className="text-amber-400">0%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-1.5">
                        <div 
                          className="h-1.5 rounded-full"
                          style={{ 
                            width: '0%',
                            background: 'linear-gradient(90deg, #E0A800, #FFC107)'
                          }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span 
                        className={`px-2 py-1 text-xs rounded-full ${
                          curso.publicado
                            ? 'bg-green-900 text-green-300'
                            : 'bg-gray-800 text-gray-400'
                        }`}
                      >
                        {curso.publicado ? 'Publicado' : 'Rascunho'}
                      </span>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewCurso(curso)}
                          className="px-2 py-1 rounded text-xs transition-all hover:shadow-md"
                          style={{ 
                            background: 'rgba(224, 168, 0, 0.2)',
                            color: '#E0A800',
                            border: '1px solid rgba(224, 168, 0, 0.3)'
                          }}
                        >
                          Visualizar
                        </button>
                        <button
                          onClick={() => handleEditCurso(curso)}
                          className="px-2 py-1 bg-gray-800 text-blue-400 rounded text-xs transition-all hover:bg-gray-700"
                        >
                          Editar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Tabela de cursos mantida como alternativa */}
            <details>
              <summary className="cursor-pointer text-amber-400 mb-4">Visualizar em forma de tabela</summary>
              <div className="overflow-x-auto rounded-lg shadow" style={{ background: '#222' }}>
                <table className="min-w-full divide-y" style={{ borderColor: '#333' }}>
                  <thead>
                    <tr style={{ borderColor: '#333' }}>
                      <th className="px-6 py-3 text-left text-xs font-medium text-amber-500 uppercase tracking-wider" style={{ background: '#1a1a1a' }}>
                        Título
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-amber-500 uppercase tracking-wider" style={{ background: '#1a1a1a' }}>
                        Categoria
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-amber-500 uppercase tracking-wider" style={{ background: '#1a1a1a' }}>
                        Instrutor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-amber-500 uppercase tracking-wider" style={{ background: '#1a1a1a' }}>
                        Nível
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-amber-500 uppercase tracking-wider" style={{ background: '#1a1a1a' }}>
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-amber-500 uppercase tracking-wider" style={{ background: '#1a1a1a' }}>
                        Visualizações
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-amber-500 uppercase tracking-wider" style={{ background: '#1a1a1a' }}>
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: '#333' }}>
                    {cursos.map((curso) => (
                      <tr key={curso.id} style={{ borderColor: '#333' }}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0">
                              <img
                                className="h-10 w-10 rounded-md object-cover"
                                src={curso.imagem_url || `https://via.placeholder.com/150?text=${curso.titulo.charAt(0)}`}
                                alt={curso.titulo}
                              />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-white">{curso.titulo}</div>
                              <div className="text-sm text-gray-400 truncate max-w-xs">{curso.descricao}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full text-black" style={{ backgroundColor: '#E0A800' }}>
                            {curso.categoria}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {curso.instrutor}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {curso.nivel}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              curso.publicado
                                ? 'bg-green-900 text-green-300'
                                : 'bg-gray-700 text-gray-300'
                            }`}
                          >
                            {curso.publicado ? 'Publicado' : 'Rascunho'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {curso.visualizacoes}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => handleTogglePublicado(curso.id, !curso.publicado)}
                              className={`px-2 py-1 rounded text-xs ${
                                curso.publicado
                                  ? 'bg-gray-700 text-gray-300'
                                  : 'bg-green-900 text-green-300'
                              }`}
                            >
                              {curso.publicado ? 'Despublicar' : 'Publicar'}
                            </button>
                            <button
                              onClick={() => handleViewCurso(curso)}
                              className="px-2 py-1 rounded text-xs"
                              style={{ 
                                background: 'rgba(224, 168, 0, 0.2)',
                                color: '#E0A800', 
                                border: '1px solid rgba(224, 168, 0, 0.3)'
                              }}
                            >
                              Visualizar
                            </button>
                            <button
                              onClick={() => handleEditCurso(curso)}
                              className="px-2 py-1 bg-gray-700 text-blue-300 rounded text-xs"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleDeleteCurso(curso.id)}
                              className="px-2 py-1 bg-gray-700 text-red-300 rounded text-xs"
                            >
                              Excluir
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </div>
        ) : activeTab === 'novo' ? (
          <div>
            <h2 className="text-xl font-semibold mb-6" style={{ color: '#E0A800' }}>
              {editingCurso ? 'Editar Curso' : 'Novo Curso'}
            </h2>
            
            <form onSubmit={handleSubmit} className="rounded-xl overflow-hidden"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
              }}>
              <div className="p-6 space-y-6">
                {/* Título */}
                <div>
                  <label htmlFor="titulo" className="block text-sm font-medium mb-1" style={{ color: theme.colors.textPrimary }}>
                    Título *
                  </label>
                  <input
                    type="text"
                    id="titulo"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2"
                    style={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.07)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: theme.colors.textPrimary
                    }}
                    required
                  />
                </div>
                
                {/* Instrutor */}
                <div>
                  <label htmlFor="instrutor" className="block text-sm font-medium mb-1" style={{ color: theme.colors.textPrimary }}>
                    Instrutor *
                  </label>
                  <input
                    type="text"
                    id="instrutor"
                    value={instrutor}
                    onChange={(e) => setInstrutor(e.target.value)}
                    className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2"
                    style={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.07)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: theme.colors.textPrimary
                    }}
                    required
                  />
                </div>
                
                {/* Grid de 2 colunas para categoria e nível */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Categoria */}
                  <div>
                    <label htmlFor="categoria" className="block text-sm font-medium mb-1" style={{ color: theme.colors.textPrimary }}>
                      Categoria *
                    </label>
                    <select
                      id="categoria"
                      value={categoria}
                      onChange={(e) => setCategoria(e.target.value)}
                      className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2"
                      style={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.07)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: theme.colors.textPrimary
                      }}
                      required
                    >
                      {categorias.map((cat) => (
                        <option key={cat} value={cat} style={{ backgroundColor: theme.colors.backgroundDark, color: theme.colors.textPrimary }}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Nível */}
                  <div>
                    <label htmlFor="nivel" className="block text-sm font-medium mb-1" style={{ color: theme.colors.textPrimary }}>
                      Nível *
                    </label>
                    <select
                      id="nivel"
                      value={nivel}
                      onChange={(e) => setNivel(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2"
                      style={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.07)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: theme.colors.textPrimary
                      }}
                      required
                    >
                      {niveis.map((n) => (
                        <option key={n} value={n} style={{ backgroundColor: theme.colors.backgroundDark, color: theme.colors.textPrimary }}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                {/* Grid de 2 colunas para aulas e duração */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Total de Aulas */}
                  <div>
                    <label htmlFor="totalAulas" className="block text-sm font-medium mb-1" style={{ color: theme.colors.textPrimary }}>
                      Total de Aulas
                    </label>
                    <input
                      type="number"
                      id="totalAulas"
                      min="1"
                      value={totalAulas}
                      onChange={(e) => setTotalAulas(parseInt(e.target.value))}
                      className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2"
                      style={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.07)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: theme.colors.textPrimary
                      }}
                    />
                  </div>
                  
                  {/* Duração Total */}
                  <div>
                    <label htmlFor="duracaoTotal" className="block text-sm font-medium mb-1" style={{ color: theme.colors.textPrimary }}>
                      Duração Total (ex: 2h 30min)
                    </label>
                    <input
                      type="text"
                      id="duracaoTotal"
                      value={duracaoTotal}
                      onChange={(e) => setDuracaoTotal(e.target.value)}
                      className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2"
                      style={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.07)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: theme.colors.textPrimary
                      }}
                      placeholder="Ex: 2h 30min"
                    />
                  </div>
                </div>
                
                {/* Grid de 2 colunas para URLs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* URL da Imagem */}
                  <div>
                    <label htmlFor="imagemUrl" className="block text-sm font-medium mb-1" style={{ color: theme.colors.textPrimary }}>
                      URL da Imagem de Capa
                    </label>
                    <input
                      type="url"
                      id="imagemUrl"
                      value={imagemUrl}
                      onChange={(e) => setImagemUrl(e.target.value)}
                      className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2"
                      style={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.07)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: theme.colors.textPrimary
                      }}
                      placeholder="https://exemplo.com/imagem.jpg"
                    />
                  </div>
                  
                  {/* URL do Vídeo */}
                  <div>
                    <label htmlFor="videoUrl" className="block text-sm font-medium mb-1" style={{ color: theme.colors.textPrimary }}>
                      URL do Vídeo Embed (YouTube, Vimeo, etc.)
                    </label>
                    <input
                      type="url"
                      id="videoUrl"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2"
                      style={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.07)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: theme.colors.textPrimary
                      }}
                      placeholder="https://www.youtube.com/embed/video-id"
                    />
                  </div>
                </div>
                
                {/* URL do Material */}
                <div>
                  <label htmlFor="materialUrl" className="block text-sm font-medium mb-1" style={{ color: theme.colors.textPrimary }}>
                    URL do Material de Apoio
                  </label>
                  <input
                    type="url"
                    id="materialUrl"
                    value={materialUrl}
                    onChange={(e) => setMaterialUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2"
                    style={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.07)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: theme.colors.textPrimary
                    }}
                    placeholder="https://exemplo.com/material.pdf"
                  />
                </div>
                
                {/* Status de Publicação */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="publicado"
                    checked={publicado}
                    onChange={(e) => setPublicado(e.target.checked)}
                    className="h-4 w-4 rounded"
                    style={{ accentColor: theme.colors.primary }}
                  />
                  <label htmlFor="publicado" className="ml-2 block text-sm" style={{ color: theme.colors.textPrimary }}>
                    Publicar curso (visível para todos os usuários)
                  </label>
                </div>
              </div>
              
              {/* Descrição */}
              <div className="mb-6">
                <label htmlFor="descricao" className="block text-sm font-medium text-amber-400 mb-1">
                  Descrição *
                </label>
                <textarea
                  id="descricao"
                  rows={4}
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  className="w-full px-3 py-2 rounded-md text-white focus:outline-none focus:ring-2"
                  style={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderColor: '#333',
                    border: '1px solid #333'
                  }}
                  required
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setActiveTab('cursos');
                  }}
                  className="px-4 py-2 rounded-md shadow-sm text-sm font-medium"
                  style={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    color: '#fff'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-md shadow-sm text-sm font-medium text-black"
                  style={{ 
                    background: 'linear-gradient(135deg, #E0A800, #FFC107)',
                    boxShadow: '0 4px 10px rgba(224, 168, 0, 0.3)'
                  }}
                >
                  {editingCurso ? 'Atualizar Curso' : 'Criar Curso'}
                </button>
              </div>
            </form>
            
            {/* Seção de aulas - disponível tanto para novo curso quanto para edição */}
            <div className="mt-12">
              <h2 className="text-xl font-bold mb-6" style={{ color: theme.colors.textPrimary }}>
                Aulas do Curso
              </h2>
              
              <div className="rounded-lg overflow-hidden border shadow-lg"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                <table className="min-w-full divide-y" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ 
                        background: 'rgba(127, 219, 63, 0.1)',
                        color: theme.colors.primary
                      }}>Ordem</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ 
                        background: 'rgba(127, 219, 63, 0.1)',
                        color: theme.colors.primary
                      }}>Título</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ 
                        background: 'rgba(127, 219, 63, 0.1)',
                        color: theme.colors.primary
                      }}>Duração</th>
                      <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ 
                        background: 'rgba(127, 219, 63, 0.1)',
                        color: theme.colors.primary
                      }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                    {aulas
                      .filter(aula => editingCurso ? (aula.curso_id === editingCurso.id) : (aula.curso_id === 'temp_new_course'))
                      .sort((a, b) => a.ordem - b.ordem)
                      .map(aula => (
                        <tr key={aula.id} className="hover:bg-opacity-30 transition-colors" style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span 
                              className="w-6 h-6 flex items-center justify-center rounded-full text-xs"
                              style={{ 
                                background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.accent})`,
                                color: 'black',
                                fontWeight: 'bold'
                              }}
                            >
                              {aula.ordem}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium" style={{ color: theme.colors.textPrimary }}>{aula.titulo}</div>
                            <div className="text-sm truncate max-w-xs" style={{ color: theme.colors.textSecondary }}>{aula.descricao}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: theme.colors.textSecondary }}>{aula.duracao}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => handleEditAula(aula)}
                                className="px-2 py-1 rounded text-xs transition-all hover:bg-opacity-30"
                                style={{ 
                                  backgroundColor: 'rgba(127, 219, 63, 0.1)',
                                  color: theme.colors.primary,
                                  border: '1px solid rgba(127, 219, 63, 0.2)',
                                  touchAction: "manipulation"
                                }}
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => handleDeleteAula(aula.id)}
                                className="px-2 py-1 rounded text-xs transition-all hover:bg-opacity-30"
                                style={{ 
                                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                  color: '#F87171',
                                  border: '1px solid rgba(239, 68, 68, 0.2)',
                                  touchAction: "manipulation"
                                }}
                              >
                                Excluir
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
                
                {(!editingCurso && aulas.filter(aula => aula.curso_id === 'temp_new_course').length === 0) || 
                 (editingCurso && aulas.filter(aula => aula.curso_id === editingCurso.id).length === 0) ? (
                  <div className="px-6 py-8 text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: theme.colors.textSecondary }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <p className="mb-4" style={{ color: theme.colors.textPrimary }}>Nenhuma aula cadastrada para este curso.</p>
                    <p className="text-sm" style={{ color: theme.colors.textSecondary }}>Adicione aulas para enriquecer o conteúdo do seu curso.</p>
                  </div>
                ) : null}
                
                <div className="px-6 py-4" style={{ background: 'rgba(127, 219, 63, 0.05)' }}>
                  <button
                    onClick={handleAddAula}
                    className="px-4 py-2 rounded-full shadow-sm text-sm font-medium transition-all hover:shadow-lg"
                    style={{ 
                      background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.accent})`,
                      color: 'black',
                      boxShadow: '0 2px 5px rgba(127, 219, 63, 0.3)',
                      touchAction: "manipulation"
                    }}
                  >
                    <span className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Adicionar Nova Aula
                    </span>
                  </button>
                </div>
              </div>
            </div>
            
            {/* Rodapé do formulário */}
            <div className="px-6 py-4 flex justify-end" style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}>
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setActiveTab('cursos');
                }}
                className="px-4 py-2 rounded-md shadow-sm text-sm font-medium mr-3"
                style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: theme.colors.textPrimary,
                  touchAction: "manipulation"
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-3 rounded-full text-sm font-bold transition-all transform hover:scale-105"
                style={{ 
                  background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.accent})`,
                  color: 'black',
                  boxShadow: '0 4px 10px rgba(127, 219, 63, 0.3)',
                  touchAction: "manipulation"
                }}
              >
                {editingCurso ? 'Atualizar Curso' : 'Criar Curso'}
              </button>
            </div>
          </div>
        ) : (
          <div>
            {viewingCurso && (
              <div className="bg-gray-900 rounded-lg border border-gray-800 shadow-2xl overflow-hidden" 
                style={{ 
                  background: 'linear-gradient(145deg, #222 0%, #111 100%)', 
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
                }}
              >
                {/* Banner com imagem e informações do curso */}
                <div className="relative">
                  <div 
                    className="h-64 md:h-80 bg-cover bg-center"
                    style={{ 
                      backgroundImage: `url(${viewingCurso.imagem_url || `https://via.placeholder.com/1200x400/333/666?text=${viewingCurso.titulo.charAt(0)}`})`,
                      backgroundPosition: 'center',
                    }}
                  >
                    <div 
                      className="absolute inset-0 bg-gradient-to-b from-transparent to-black opacity-90"
                    ></div>
                    
                    <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                      <div className="flex flex-col md:flex-row md:items-end justify-between">
                        <div>
                          <span 
                            className="mb-2 inline-block px-3 py-1 text-xs font-bold rounded"
                            style={{ 
                              background: 'linear-gradient(135deg, #E0A800, #FFC107)',
                              color: '#000',
                              boxShadow: '0 4px 10px rgba(224, 168, 0, 0.3)'
                            }}
                          >
                            {viewingCurso.categoria}
                          </span>
                          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 drop-shadow-lg">
                            {viewingCurso.titulo}
                          </h1>
                          <div className="flex flex-wrap items-center text-gray-300 text-sm">
                            <span className="mr-4 flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              {viewingCurso.instrutor}
                            </span>
                            <span className="mr-4 flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                              </svg>
                              {viewingCurso.nivel}
                            </span>
                            <span className="flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {viewingCurso.duracao_total}
                            </span>
                          </div>
                        </div>
                        
                        <div className="mt-4 md:mt-0">
                          <button
                            onClick={() => handleEditCurso(viewingCurso)}
                            className="px-4 py-2 rounded text-sm mr-2 transition-all hover:bg-opacity-25"
                            style={{ 
                              backgroundColor: 'rgba(255, 255, 255, 0.15)',
                              color: '#fff'
                            }}
                          >
                            Editar Curso
                          </button>
                          <button
                            onClick={handleVoltarParaLista}
                            className="px-4 py-2 rounded text-sm transition-all hover:shadow-md"
                            style={{ 
                              background: 'rgba(224, 168, 0, 0.2)',
                              color: '#E0A800',
                              border: '1px solid rgba(224, 168, 0, 0.3)'
                            }}
                          >
                            Voltar para Lista
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Conteúdo principal */}
                <div className="p-6 md:p-8">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                      {/* Player de vídeo */}
                      {assistindoAula && currentAula ? (
                        <div className="mb-8">
                          <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold" style={{ 
                              background: 'linear-gradient(135deg, #E0A800 0%, #FFD700 100%)',
                              WebkitBackgroundClip: 'text',
                              WebkitTextFillColor: 'transparent'
                            }}>
                              Aula: {currentAula.titulo}
                            </h2>
                            <button
                              onClick={handleVoltarAosCursos}
                              className="px-3 py-1 rounded text-xs transition-all hover:bg-opacity-30"
                              style={{ 
                                backgroundColor: 'rgba(224, 168, 0, 0.2)',
                                color: '#E0A800',
                                border: '1px solid rgba(224, 168, 0, 0.3)'
                              }}
                            >
                              Voltar ao curso
                            </button>
                          </div>
                          <div className="relative pt-[56.25%] bg-black rounded-lg overflow-hidden shadow-lg">
                            <iframe
                              className="absolute inset-0 w-full h-full"
                              src={currentAula.video_url}
                              title={currentAula.titulo}
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            ></iframe>
                          </div>
                          <div className="mt-4 p-4 bg-gray-800 rounded-lg shadow-md">
                            <h3 className="font-semibold mb-2" style={{ color: '#E0A800' }}>Descrição da Aula</h3>
                            <p className="text-gray-300">{currentAula.descricao}</p>
                            
                            {currentAula.material_url && (
                              <div className="mt-4">
                                <a 
                                  href={currentAula.material_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex items-center p-2 rounded w-fit transition-all hover:bg-opacity-30"
                                  style={{ 
                                    backgroundColor: 'rgba(224, 168, 0, 0.1)',
                                    color: '#E0A800'
                                  }}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                  </svg>
                                  Material da aula
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : viewingCurso.video_url ? (
                        <div className="mb-8">
                          <h2 className="text-xl font-bold mb-4" style={{ 
                            background: 'linear-gradient(135deg, #E0A800 0%, #FFD700 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                          }}>Vídeo do Curso</h2>
                          <div className="relative pt-[56.25%] bg-black rounded-lg overflow-hidden shadow-lg">
                            <iframe
                              className="absolute inset-0 w-full h-full"
                              src={viewingCurso.video_url}
                              title={viewingCurso.titulo}
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            ></iframe>
                          </div>
                        </div>
                      ) : (
                        <div className="mb-8 bg-gray-800 rounded-lg p-8 text-center shadow-lg">
                          <h2 className="text-xl font-bold mb-4" style={{ 
                            background: 'linear-gradient(135deg, #E0A800 0%, #FFD700 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                          }}>Vídeo do Curso</h2>
                          <p className="text-gray-400">Este curso ainda não possui um vídeo.</p>
                        </div>
                      )}
                      
                      {/* Descrição - mostrada apenas quando não estiver assistindo aula */}
                      {!assistindoAula && (
                        <div className="mb-8">
                          <h2 className="text-xl font-bold mb-4" style={{ 
                            background: 'linear-gradient(135deg, #E0A800 0%, #FFD700 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                          }}>Sobre o Curso</h2>
                          <div className="p-4 bg-gray-800 rounded-lg shadow-md">
                            <p className="text-gray-300 whitespace-pre-line">{viewingCurso.descricao}</p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div>
                      {/* Aulas do curso */}
                      <div className="bg-gray-800 rounded-lg p-5 shadow-lg border border-gray-700">
                        <h2 className="text-lg font-bold mb-4" style={{
                          background: 'linear-gradient(135deg, #E0A800 0%, #FFD700 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent'
                        }}>Aulas do Curso</h2>
                        
                        {aulas.filter(aula => aula.curso_id === viewingCurso.id).length > 0 ? (
                          <ul className="space-y-3">
                            {aulas
                              .filter(aula => aula.curso_id === viewingCurso.id)
                              .sort((a, b) => a.ordem - b.ordem)
                              .map(aula => (
                                <li 
                                  key={aula.id}
                                  className="flex items-start p-3 rounded transition-all hover:bg-gray-700 cursor-pointer"
                                  onClick={() => handleViewAula(aula)}
                                >
                                  <div 
                                    className="w-8 h-8 flex items-center justify-center rounded-full mr-3 flex-shrink-0"
                                    style={{ 
                                      background: 'linear-gradient(135deg, #E0A800, #FFC107)',
                                      color: '#000',
                                      fontWeight: 'bold'
                                    }}
                                  >
                                    {aula.ordem}
                                  </div>
                                  <div className="flex-1">
                                    <h3 className="font-medium text-white mb-1">{aula.titulo}</h3>
                                    <p className="text-xs text-gray-400 truncate">{aula.descricao}</p>
                                    <div className="flex items-center mt-2">
                                      <span className="text-xs text-amber-400 flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        {aula.duracao}
                                      </span>
                                    </div>
                                  </div>
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </li>
                              ))}
                          </ul>
                        ) : (
                          <p className="text-gray-400">Este curso ainda não possui aulas.</p>
                        )}
                      </div>

                      {/* Informações do curso */}
                      <div className="mb-8 mt-8 bg-gray-800 rounded-lg p-5 shadow-lg border border-gray-700">
                        <h2 className="text-lg font-bold mb-4" style={{ 
                          background: 'linear-gradient(135deg, #E0A800 0%, #FFD700 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent'
                        }}>Informações do Curso</h2>
                        
                        <ul className="space-y-3">
                          <li className="flex items-center justify-between p-2 rounded hover:bg-gray-700 transition-colors">
                            <span className="text-gray-400 flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                              Aulas
                            </span>
                            <span className="text-white font-medium">{viewingCurso.total_aulas}</span>
                          </li>
                          <li className="flex items-center justify-between p-2 rounded hover:bg-gray-700 transition-colors">
                            <span className="text-gray-400 flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Duração
                            </span>
                            <span className="text-white font-medium">{viewingCurso.duracao_total}</span>
                          </li>
                          <li className="flex items-center justify-between p-2 rounded hover:bg-gray-700 transition-colors">
                            <span className="text-gray-400 flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                              </svg>
                              Nível
                            </span>
                            <span className="text-white font-medium">{viewingCurso.nivel}</span>
                          </li>
                          <li className="flex items-center justify-between p-2 rounded hover:bg-gray-700 transition-colors">
                            <span className="text-gray-400 flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              Visualizações
                            </span>
                            <span className="text-white font-medium">{viewingCurso.visualizacoes}</span>
                          </li>
                          <li className="flex items-center justify-between p-2 rounded hover:bg-gray-700 transition-colors">
                            <span className="text-gray-400 flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Status
                            </span>
                            <span 
                              className={`px-2 py-1 rounded-full text-xs ${
                                viewingCurso.publicado ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-red-300'
                              }`}
                            >
                              {viewingCurso.publicado ? 'Publicado' : 'Rascunho'}
                            </span>
                          </li>
                          <li className="flex items-center justify-between p-2 rounded hover:bg-gray-700 transition-colors">
                            <span className="text-gray-400 flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              Data
                            </span>
                            <span className="text-white font-medium">
                              {new Date(viewingCurso.data_criacao).toLocaleDateString('pt-BR')}
                            </span>
                          </li>
                        </ul>
                      </div>
                      
                      {/* Material de apoio */}
                      <div className="mb-8 bg-gray-800 rounded-lg p-5 shadow-lg border border-gray-700">
                        <h2 className="text-lg font-bold mb-4" style={{
                          background: 'linear-gradient(135deg, #E0A800 0%, #FFD700 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent'
                        }}>Material de Apoio</h2>
                        
                        {viewingCurso.material_url ? (
                          <a 
                            href={viewingCurso.material_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center p-3 rounded transition-all hover:bg-gray-700"
                            style={{ 
                              backgroundColor: 'rgba(224, 168, 0, 0.1)'
                            }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="#E0A800">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                            </svg>
                            <span className="text-white font-medium">Baixar Material</span>
                          </a>
                        ) : (
                          <p className="text-gray-400">Este curso ainda não possui material de apoio.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 