'use client';

import { useState, useEffect, useMemo } from 'react';
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
  
  // Forçar atualização do título
  useEffect(() => {
    document.title = 'Mag Green';
  }, []);
  
  // Usando usePageState para persistência de estado
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'cursos' | 'novo' | 'visualizar'>('cursos');
  const [editingCurso, setEditingCurso] = useState<Curso | null>(null);
  const [viewingCurso, setViewingCurso] = useState<Curso | null>(null);
  
  // Busca e paginação (cursos)
  const [searchQuery, setSearchQuery] = usePageState<string>('estudos_searchQuery', '');
  const [pageSize, setPageSize] = usePageState<number>('estudos_pageSize', 10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, pageSize]);
  
  const filteredCursos = useMemo(() => {
    const q = (searchQuery || '').trim().toLowerCase();
    if (!q) return cursos;
    return cursos.filter(c => {
      const fields = [c.titulo, c.descricao, c.categoria, c.instrutor, c.nivel];
      return fields.some(v => (v || '').toString().toLowerCase().includes(q));
    });
  }, [cursos, searchQuery]);
  
  const totalPages = useMemo(() => {
    const total = Math.ceil((filteredCursos.length || 0) / (pageSize || 1));
    return Math.max(1, total || 1);
  }, [filteredCursos.length, pageSize]);
  
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);
  
  const paginatedCursos = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return filteredCursos.slice(start, end);
  }, [filteredCursos, currentPage, pageSize]);
  
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
  
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    // Buscar os cursos do Supabase
    const fetchCursos = async () => {
      try {
        setLoading(true);
        
        // Se for admin, busca todos os cursos
        // Se for usuário comum, busca apenas cursos publicados
        let query = supabase
          .from('cursos')
          .select('*')
          .order('data_criacao', { ascending: false });
          
        if (!isAdmin) {
          query = query.eq('publicado', true);
        }
        
        const { data, error } = await query;
          
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
  }, [isAdmin]);
  
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
    // Validação dos campos obrigatórios do curso
    if (!titulo || !descricao || !imagemUrl) {
      alert('Por favor, preencha todos os campos obrigatórios do curso.');
      return;
    }
    setLoading(true);
    try {
      let data, error;
      if (editingCurso) {
        // Atualizar curso existente
        ({ data, error } = await supabase
          .from('cursos')
          .update({ titulo, descricao, imagem_url: imagemUrl })
          .eq('id', editingCurso.id)
          .select());
      } else {
        // Criar novo curso
        ({ data, error } = await supabase
          .from('cursos')
          .insert({ titulo, descricao, imagem_url: imagemUrl })
          .select());
      }
      if (error) throw error;
      if (data && data.length > 0) {
        const cursoId = data[0].id;
        setCursos([data[0], ...cursos]);
        // Atualiza os dados de aulas temporárias para o ID real do curso
        const aulasTemp = aulas.filter(a => a.curso_id === 'temp_new_course');
        if (aulasTemp.length > 0) {
          const aulasParaInserir = aulasTemp.map(a => ({
            ...a,
            curso_id: cursoId,
            id: undefined // Remover id temporário
          }));
          const { data: aulasInseridas, error: aulasInsertError } = await supabase
            .from('aulas')
            .insert(aulasParaInserir)
            .select();
          if (aulasInsertError) {
            console.error('Erro ao inserir aulas após criar curso:', aulasInsertError, JSON.stringify(aulasInsertError, null, 2));
            alert('Ocorreu um erro ao salvar as aulas. Veja o console para detalhes.');
          } else {
            setAulas([
              ...aulas.filter(a => a.curso_id !== 'temp_new_course'),
              ...(aulasInseridas || [])
            ]);
          }
        }
        // Mensagem de sucesso
        alert(editingCurso ? 'Curso atualizado com sucesso!' : 'Curso criado com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao salvar curso:', error, JSON.stringify(error, null, 2));
      alert('Ocorreu um erro ao salvar o curso. Veja o console para detalhes.');
    } finally {
      setLoading(false);
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

    // Permitir salvar aulas temporárias apenas no estado local
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(cursoId)) {
      // Salvar aula apenas no estado local
      const novaAula: Omit<Aula, 'id'> = {
        curso_id: cursoId,
        titulo: aulaTitulo,
        descricao: aulaDescricao,
        video_url: aulaVideoUrl,
        material_url: aulaMaterialUrl,
        duracao: aulaDuracao,
        ordem: aulaOrdem
      };
      setAulas([...aulas, { ...novaAula, id: `temp_${Date.now()}` }]);
      setShowAulaModal(false);
      resetAulaForm();
      return;
    }
    
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
      console.error('Erro ao salvar aula:', error, JSON.stringify(error, null, 2));
      if (error && error.message) {
        alert('Erro ao salvar aula: ' + error.message);
      } else {
        alert('Erro ao salvar aula. Veja o console para detalhes.');
      }
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

  // Função para upload de imagem
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
    const filePath = `${fileName}`;
    const { data, error } = await supabase.storage.from('cursos-capas').upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: file.type
    });
    if (error) {
      alert('Erro ao fazer upload da imagem.');
      setUploading(false);
      return;
    }
    // Obter URL pública
    const { data: publicData } = supabase.storage.from('cursos-capas').getPublicUrl(filePath);
    setImagemUrl(publicData.publicUrl);
    setUploading(false);
  };

  // Garantir reset ao carregar a página
  useEffect(() => {
    setActiveTab('cursos');
    setEditingCurso(null);
    setViewingCurso(null);
  }, []);

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
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-6 pb-24 md:pb-10">
        {/* Modal para adicionar/editar aulas */}
        {showAulaModal && (
          <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 backdrop-blur-sm p-2 md:p-4">
            <div className="rounded-xl overflow-hidden max-w-md sm:max-w-lg md:max-w-2xl lg:max-w-4xl w-full max-h-[95vh] overflow-y-auto"
                    style={{ 
                background: 'rgba(31, 41, 55, 0.95)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)'
              }}>
              <div className="p-4 md:p-6">
                <div className="flex justify-between items-center mb-4 md:mb-6">
                  <h3 className="text-lg md:text-xl font-bold" style={{ color: theme.colors.textPrimary }}>
                    {editingAula ? 'Editar Aula' : 'Nova Aula'}
                  </h3>
                  <button 
                    onClick={() => setShowAulaModal(false)} 
                    className="rounded-full p-1 md:p-2 hover:bg-opacity-10 transition-colors"
                    style={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      color: theme.colors.textSecondary,
                      touchAction: "manipulation"
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="mb-3 md:mb-4">
                  <label htmlFor="aulaTitulo" className="block text-sm font-medium mb-1.5" style={{ color: theme.colors.textPrimary }}>
                    Título da Aula *
                  </label>
                  <input
                    type="text"
                    id="aulaTitulo"
                    value={aulaTitulo}
                    onChange={(e) => setAulaTitulo(e.target.value)}
                    className="w-full px-3 py-2.5 md:py-2 rounded-md focus:outline-none focus:ring-2 text-sm md:text-base"
                    style={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.07)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: theme.colors.textPrimary 
                    }}
                    required
                  />
                </div>
                
                <div className="mb-3 md:mb-4">
                  <label htmlFor="aulaDescricao" className="block text-sm font-medium mb-1.5" style={{ color: theme.colors.textPrimary }}>
                    Descrição da Aula *
                  </label>
                  <textarea
                    id="aulaDescricao"
                    rows={3}
                    value={aulaDescricao}
                    onChange={(e) => setAulaDescricao(e.target.value)}
                    className="w-full px-3 py-2.5 md:py-2 rounded-md focus:outline-none focus:ring-2 text-sm md:text-base resize-none"
                    style={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.07)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: theme.colors.textPrimary 
                    }}
                    required
                  />
                </div>
                
                <div className="mb-3 md:mb-4">
                  <label htmlFor="aulaVideoUrl" className="block text-sm font-medium mb-1.5" style={{ color: theme.colors.textPrimary }}>
                    URL do Vídeo *
                  </label>
                  <input
                    type="url"
                    id="aulaVideoUrl"
                    value={aulaVideoUrl}
                    onChange={(e) => setAulaVideoUrl(e.target.value)}
                    className="w-full px-3 py-2.5 md:py-2 rounded-md focus:outline-none focus:ring-2 text-sm md:text-base"
                    style={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.07)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: theme.colors.textPrimary 
                    }}
                    placeholder="https://www.youtube.com/embed/video-id"
                    required
                  />
                </div>
                
                <div className="mb-3 md:mb-4">
                  <label htmlFor="aulaMaterialUrl" className="block text-sm font-medium mb-1.5" style={{ color: theme.colors.textPrimary }}>
                    Material (Opcional)
                  </label>
                  <input
                    type="url"
                    id="aulaMaterialUrl"
                    value={aulaMaterialUrl}
                    onChange={(e) => setAulaMaterialUrl(e.target.value)}
                    className="w-full px-3 py-2.5 md:py-2 rounded-md focus:outline-none focus:ring-2 text-sm md:text-base"
                    style={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.07)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: theme.colors.textPrimary 
                    }}
                    placeholder="https://exemplo.com/material.pdf"
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-6">
                  <div>
                    <label htmlFor="aulaDuracao" className="block text-sm font-medium mb-1.5" style={{ color: theme.colors.textPrimary }}>
                      Duração *
                    </label>
                    <input
                      type="text"
                      id="aulaDuracao"
                      value={aulaDuracao}
                      onChange={(e) => setAulaDuracao(e.target.value)}
                      className="w-full px-3 py-2.5 md:py-2 rounded-md focus:outline-none focus:ring-2 text-sm md:text-base"
                      style={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.07)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: theme.colors.textPrimary 
                      }}
                      placeholder="15min"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="aulaOrdem" className="block text-sm font-medium mb-1.5" style={{ color: theme.colors.textPrimary }}>
                      Ordem da Aula
                    </label>
                    <input
                      type="number"
                      id="aulaOrdem"
                      min="1"
                      value={aulaOrdem}
                      onChange={(e) => setAulaOrdem(parseInt(e.target.value))}
                      className="w-full px-3 py-2.5 md:py-2 rounded-md focus:outline-none focus:ring-2 text-sm md:text-base"
                      style={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.07)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: theme.colors.textPrimary 
                      }}
                    />
                  </div>
                </div>
                
                <div className="p-4 md:p-6 flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                  <button
                    type="button"
                    onClick={() => setShowAulaModal(false)}
                    className="px-4 py-2.5 rounded-md shadow-sm text-sm font-medium order-2 sm:order-1"
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
                    className="px-4 py-2.5 rounded-md shadow-sm text-sm font-medium text-black order-1 sm:order-2"
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
        
        {/* Cabeçalho com layout padronizado (Blog/Meu Cultivo) */}
        <div 
          className="mb-6 md:mb-10 relative overflow-hidden rounded-xl p-4 md:p-8"
          style={{
            background: `linear-gradient(135deg, ${theme.colors.primary}90, ${theme.colors.accent}70)`,
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
          }}
        >
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
                className="text-2xl md:text-3xl xl:text-4xl font-bold mb-2"
                style={{ 
                  color: '#fff',
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                }}
              >
                Estudos
              </h1>
              <p 
                className="text-sm md:text-lg"
                style={{ 
                  color: 'rgba(255, 255, 255, 0.9)',
                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
                }}
              >
                {isAdmin ? 'Gerenciar material de estudos e conteúdo educacional' : 'Material de estudos disponível para seu aprendizado'}
              </p>
            </div>

            {/* Ações */}
            {isAdmin && (
              <button
                className="mt-4 md:mt-0 px-4 md:px-6 py-2 md:py-3 rounded-full text-sm md:text-base font-medium transition-all transform hover:scale-105 flex items-center gap-2"
                style={{ 
                  background: `linear-gradient(135deg, #F8CC3C, #E3A507)`,
                  color: '#1F1F1F',
                  fontWeight: 'bold',
                  boxShadow: '0 4px 10px rgba(248, 204, 60, 0.3)',
                  touchAction: 'manipulation'
                }}
                onClick={() => {
                  resetForm();
                  setActiveTab('novo');
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                <span className="hidden md:inline">Adicionar Novo Material</span>
                <span className="md:hidden">Novo</span>
              </button>
            )}
          </div>
        </div>
      
        {/* Abas de navegação */}
        <div className="border-b mb-6" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
          <div className="flex -mb-px overflow-x-auto">
            <button
              className={`py-2 px-4 md:px-6 font-medium text-sm transition-all whitespace-nowrap ${
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
              <span className="hidden md:inline">Material de Estudos</span>
              <span className="md:hidden">Material de Estudos</span>
            </button>
            {/* Aba de novo/editar curso - apenas para admins */}
            {isAdmin && (
              <button
                className={`py-2 px-4 md:px-6 font-medium text-sm transition-all whitespace-nowrap ${
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
                <span className="hidden md:inline">{editingCurso ? 'Editar Material' : 'Novo Material'}</span>
                <span className="md:hidden">{editingCurso ? 'Editar' : 'Novo'}</span>
              </button>
            )}
            {viewingCurso && cursos.length > 0 && (
              <button
                className={`py-2 px-4 md:px-6 font-medium text-sm transition-all whitespace-nowrap ${
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
                <span className="hidden md:inline">Visualizar Material</span>
                <span className="md:hidden">Visualizar</span>
              </button>
            )}
          </div>
        </div>
        
        {/* Conteúdo baseado na aba ativa */}
        {activeTab === 'cursos' ? (
          <div>
            <div className="flex flex-col md:flex-row gap-3 md:gap-4 items-stretch md:items-center justify-between mb-6">
              <h2 className="text-xl font-semibold" style={{ 
                background: 'linear-gradient(135deg, #E0A800 0%, #FFD700 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>Material de estudo</h2>
              <div className="flex-1 md:max-w-md">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por título, descrição, categoria, instrutor ou nível..."
                  className="w-full px-4 py-3 rounded-lg text-white"
                  style={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.07)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    outline: 'none',
                  }}
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm" style={{ color: theme.colors.textSecondary }}>Itens por página</label>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="px-3 py-2 rounded-lg text-white"
                  style={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.07)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    outline: 'none',
                  }}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>
            
            {/* Grid de cursos em cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-10">
              {paginatedCursos.map((curso) => (
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
                    className="h-40 md:h-48 bg-cover bg-center relative"
                    style={{ 
                      backgroundImage: `url(${curso.imagem_url || `https://via.placeholder.com/400x200/333/666?text=${curso.titulo.charAt(0)}`})`,
                    }}
                  >
                    <div 
                      className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-80"
                    ></div>
                    <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4">
                      <div className="flex justify-between items-end">
                        <h3 className="text-base md:text-lg font-bold text-white">{curso.titulo}</h3>
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
                  
                  <div className="p-3 md:p-4">
                    <p className="text-gray-400 text-sm mb-3 md:mb-4 line-clamp-2">{curso.descricao}</p>
                    
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
                      <div className="flex space-x-1 md:space-x-2">
                        <button
                          onClick={() => handleViewCurso(curso)}
                          className="px-2 py-1 rounded text-xs transition-all hover:shadow-md"
                          style={{ 
                            background: 'rgba(224, 168, 0, 0.2)',
                            color: '#E0A800',
                            border: '1px solid rgba(224, 168, 0, 0.3)'
                          }}
                        >
                          <span className="hidden md:inline">Visualizar</span>
                          <span className="md:hidden">Ver</span>
                        </button>
                        {/* Botões de edição apenas para admins */}
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => handleEditCurso(curso)}
                              className="px-2 py-1 bg-gray-800 text-blue-400 rounded text-xs transition-all hover:bg-gray-700"
                            >
                              Editar Material
                            </button>
                            <button
                              onClick={() => handleDeleteCurso(curso.id)}
                              className="px-2 py-1 bg-red-800 text-red-400 rounded text-xs transition-all hover:bg-red-700"
                            >
                              Excluir Material
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Paginação */}
            {filteredCursos.length > 0 && (
              <div className="flex items-center justify-center gap-3 mt-2 mb-6">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-full text-sm font-medium"
                  style={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.07)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: currentPage === 1 ? 'rgba(255,255,255,0.4)' : '#fff'
                  }}
                >
                  Anterior
                </button>
                <span className="text-sm" style={{ color: theme.colors.textSecondary }}>
                  Página {currentPage} de {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="px-4 py-2 rounded-full text-sm font-medium"
                  style={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.07)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: currentPage >= totalPages ? 'rgba(255,255,255,0.4)' : '#fff'
                  }}
                >
                  Próxima
                </button>
              </div>
            )}

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
                    {paginatedCursos.map((curso) => (
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
                              onClick={() => handleViewCurso(curso)}
                              className="px-2 py-1 rounded text-xs"
                              style={{ 
                                background: 'rgba(224, 168, 0, 0.2)',
                                color: '#E0A800', 
                                border: '1px solid rgba(224, 168, 0, 0.3)'
                              }}
                            >
                              Visualizar Material
                            </button>
                            {/* Botões de administração apenas para admins */}
                            {isAdmin && (
                              <>
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
                              </>
                            )}
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
                    value={titulo ?? ''}
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
                    value={instrutor ?? ''}
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
                      value={categoria ?? ''}
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
                      value={nivel ?? ''}
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
                      value={totalAulas ?? 1}
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
                      value={duracaoTotal ?? ''}
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
                  {/* Upload da Imagem de Capa */}
                  <div>
                    <label htmlFor="imagemUrl" className="block text-sm font-medium mb-1" style={{ color: theme.colors.textPrimary }}>
                      Imagem de Capa
                    </label>
                    <input
                      type="file"
                      id="imagemUrl"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2"
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.07)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: theme.colors.textPrimary
                      }}
                      disabled={uploading}
                    />
                    {uploading && <p style={{ color: theme.colors.primary, marginTop: 8 }}>Enviando imagem...</p>}
                    {imagemUrl && (
                      <div className="mt-2">
                        <img src={imagemUrl} alt="Capa do curso" style={{ maxWidth: 320, borderRadius: 8 }} />
                        <p className="text-xs mt-1" style={{ color: theme.colors.textSecondary }}>{imagemUrl}</p>
                      </div>
                    )}
                  </div>
                  
                  {/* URL do Vídeo */}
                  <div>
                    <label htmlFor="videoUrl" className="block text-sm font-medium mb-1" style={{ color: theme.colors.textPrimary }}>
                      URL do Vídeo Embed (YouTube, Vimeo, etc.)
                    </label>
                    <input
                      type="url"
                      id="videoUrl"
                      value={videoUrl ?? ''}
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
                    value={materialUrl ?? ''}
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
                  value={descricao ?? ''}
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
            </form>
            
            {/* Seção de aulas - disponível tanto para novo curso quanto para edição */}
            <div className="mt-8 md:mt-12">
              <h2 className="text-lg md:text-xl font-bold mb-4 md:mb-6" style={{ color: theme.colors.textPrimary }}>
                Aulas do Curso
              </h2>
              
              <div className="rounded-lg overflow-hidden border shadow-lg"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                {/* Versão desktop da tabela */}
                <div className="hidden md:block">
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
                        .map((aula, idx) => (
                          <tr key={aula.id + '-' + idx} className="hover:bg-opacity-30 transition-colors" style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}>
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
                                {/* Botões de administração apenas para admins */}
                                {isAdmin && (
                                  <>
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
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                      </svg>
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
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                {/* Versão mobile das aulas */}
                <div className="md:hidden">
                  <div className="space-y-3 p-4">
                    {aulas
                      .filter(aula => editingCurso ? (aula.curso_id === editingCurso.id) : (aula.curso_id === 'temp_new_course'))
                      .sort((a, b) => a.ordem - b.ordem)
                      .map((aula, idx) => (
                        <div key={aula.id + '-' + idx} className="p-3 rounded-lg border transition-colors"
                          style={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid rgba(255, 255, 255, 0.1)'
                          }}>
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-3">
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
                              <div>
                                <div className="text-sm font-medium" style={{ color: theme.colors.textPrimary }}>{aula.titulo}</div>
                                <div className="text-xs" style={{ color: theme.colors.textSecondary }}>{aula.duracao}</div>
                              </div>
                            </div>
                            <div className="flex space-x-1">
                              {/* Botões de administração apenas para admins */}
                              {isAdmin && (
                                <>
                                  <button
                                    onClick={() => handleEditAula(aula)}
                                    className="p-1.5 rounded text-xs transition-all hover:bg-opacity-30"
                                    style={{ 
                                      backgroundColor: 'rgba(127, 219, 63, 0.1)',
                                      color: theme.colors.primary,
                                      border: '1px solid rgba(127, 219, 63, 0.2)',
                                      touchAction: "manipulation"
                                    }}
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteAula(aula.id)}
                                    className="p-1.5 rounded text-xs transition-all hover:bg-opacity-30"
                                    style={{ 
                                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                      color: '#F87171',
                                      border: '1px solid rgba(239, 68, 68, 0.2)',
                                      touchAction: "manipulation"
                                    }}
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="text-xs line-clamp-2" style={{ color: theme.colors.textSecondary }}>{aula.descricao}</div>
                        </div>
                      ))}
                  </div>
                </div>
                
                {(!editingCurso && aulas.filter(aula => aula.curso_id === 'temp_new_course').length === 0) || 
                 (editingCurso && aulas.filter(aula => aula.curso_id === editingCurso.id).length === 0) ? (
                  <div className="px-4 md:px-6 py-6 md:py-8 text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 md:h-12 md:w-12 mx-auto mb-3 md:mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: theme.colors.textSecondary }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <p className="mb-2 md:mb-4 text-sm md:text-base" style={{ color: theme.colors.textPrimary }}>Nenhuma aula cadastrada para este curso.</p>
                    <p className="text-xs md:text-sm" style={{ color: theme.colors.textSecondary }}>Adicione aulas para enriquecer o conteúdo do seu curso.</p>
                  </div>
                ) : null}
                
                <div className="px-4 md:px-6 py-3 md:py-4" style={{ background: 'rgba(127, 219, 63, 0.05)' }}>
                  {/* Botão de adicionar aula apenas para admins */}
                  {isAdmin && (
                    <button
                      onClick={handleAddAula}
                      className="w-full sm:w-auto px-4 py-2.5 md:py-2 rounded-full shadow-sm text-sm font-medium transition-all hover:shadow-lg"
                      style={{ 
                        background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.accent})`,
                        color: 'black',
                        boxShadow: '0 2px 5px rgba(127, 219, 63, 0.3)',
                        touchAction: "manipulation"
                      }}
                    >
                      <span className="flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <span className="hidden sm:inline">Adicionar Nova Aula</span>
                        <span className="sm:hidden">Nova Aula</span>
                      </span>
                    </button>
                  )}
                </div>
              </div>
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
                    className="h-48 md:h-64 lg:h-80 bg-cover bg-center"
                    style={{ 
                      backgroundImage: `url(${viewingCurso.imagem_url || `https://via.placeholder.com/1200x400/333/666?text=${viewingCurso.titulo.charAt(0)}`})`,
                      backgroundPosition: 'center',
                    }}
                  >
                    <div 
                      className="absolute inset-0 bg-gradient-to-b from-transparent to-black opacity-90"
                    ></div>
                    
                    <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 lg:p-8">
                      <div className="flex flex-col md:flex-row md:items-end justify-between space-y-3 md:space-y-0">
                        <div>
                          <span 
                            className="mb-2 inline-block px-2 md:px-3 py-1 text-xs font-bold rounded"
                            style={{ 
                              background: 'linear-gradient(135deg, #E0A800, #FFC107)',
                              color: '#000',
                              boxShadow: '0 4px 10px rgba(224, 168, 0, 0.3)'
                            }}
                          >
                            {viewingCurso.categoria}
                          </span>
                          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-white mb-2 drop-shadow-lg">
                            {viewingCurso.titulo}
                          </h1>
                          <div className="flex flex-wrap items-center text-gray-300 text-xs md:text-sm gap-2 md:gap-4">
                            <span className="flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 md:h-4 md:w-4 mr-1 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              {viewingCurso.instrutor}
                            </span>
                            <span className="flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 md:h-4 md:w-4 mr-1 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                              </svg>
                              {viewingCurso.nivel}
                            </span>
                            <span className="flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 md:h-4 md:w-4 mr-1 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {viewingCurso.duracao_total}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2">
                          {/* Botão de edição apenas para admins */}
                          {isAdmin && (
                            <button
                              onClick={() => handleEditCurso(viewingCurso)}
                              className="px-3 md:px-4 py-2 rounded text-sm transition-all hover:bg-opacity-25"
                              style={{ 
                                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                                color: '#fff'
                              }}
                            >
                              <span className="hidden md:inline">Editar Curso</span>
                              <span className="md:hidden">Editar</span>
                            </button>
                          )}
                          <button
                            onClick={handleVoltarParaLista}
                            className="px-3 md:px-4 py-2 rounded text-sm transition-all hover:shadow-md"
                            style={{ 
                              background: 'rgba(224, 168, 0, 0.2)',
                              color: '#E0A800',
                              border: '1px solid rgba(224, 168, 0, 0.3)'
                            }}
                          >
                            <span className="hidden md:inline">Voltar para Lista</span>
                            <span className="md:hidden">Voltar</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Conteúdo principal */}
                <div className="p-4 md:p-6 lg:p-8">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                    <div className="lg:col-span-2">
                      {/* Player de vídeo */}
                      {assistindoAula && currentAula ? (
                        <div className="mb-6 md:mb-8">
                          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 space-y-2 md:space-y-0">
                            <h2 className="text-lg md:text-xl font-bold" style={{ 
                              background: 'linear-gradient(135deg, #E0A800 0%, #FFD700 100%)',
                              WebkitBackgroundClip: 'text',
                              WebkitTextFillColor: 'transparent'
                            }}>
                              Aula: {currentAula.titulo}
                            </h2>
                            <button
                              onClick={handleVoltarAosCursos}
                              className="px-3 py-1 rounded text-xs transition-all hover:bg-opacity-30 self-start md:self-auto"
                              style={{ 
                                backgroundColor: 'rgba(224, 168, 0, 0.2)',
                                color: '#E0A800',
                                border: '1px solid rgba(224, 168, 0, 0.3)'
                              }}
                            >
                              <span className="hidden md:inline">Voltar ao curso</span>
                              <span className="md:hidden">Voltar</span>
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
                          <div className="mt-4 p-3 md:p-4 bg-gray-800 rounded-lg shadow-md">
                            <h3 className="font-semibold mb-2 text-sm md:text-base" style={{ color: '#E0A800' }}>Descrição da Aula</h3>
                            <p className="text-gray-300 text-sm md:text-base">{currentAula.descricao}</p>
                            
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
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                  </svg>
                                  <span className="text-sm md:text-base">Material da aula</span>
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : viewingCurso.video_url ? (
                        <div className="mb-6 md:mb-8">
                          <h2 className="text-lg md:text-xl font-bold mb-4" style={{ 
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
                        <div className="mb-6 md:mb-8 bg-gray-800 rounded-lg p-6 md:p-8 text-center shadow-lg">
                          <h2 className="text-lg md:text-xl font-bold mb-4" style={{ 
                            background: 'linear-gradient(135deg, #E0A800 0%, #FFD700 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                          }}>Vídeo do Curso</h2>
                          <p className="text-gray-400 text-sm md:text-base">Este curso ainda não possui um vídeo.</p>
                        </div>
                      )}
                      
                      {/* Descrição - mostrada apenas quando não estiver assistindo aula */}
                      {!assistindoAula && (
                        <div className="mb-6 md:mb-8">
                          <h2 className="text-lg md:text-xl font-bold mb-4" style={{ 
                            background: 'linear-gradient(135deg, #E0A800 0%, #FFD700 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                          }}>Sobre o Curso</h2>
                          <div className="p-3 md:p-4 bg-gray-800 rounded-lg shadow-md">
                            <p className="text-gray-300 text-sm md:text-base whitespace-pre-line">{viewingCurso.descricao}</p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div>
                      {/* Aulas do curso */}
                      <div className="bg-gray-800 rounded-lg p-4 md:p-5 shadow-lg border border-gray-700">
                        <h2 className="text-base md:text-lg font-bold mb-3 md:mb-4" style={{
                          background: 'linear-gradient(135deg, #E0A800 0%, #FFD700 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent'
                        }}>Aulas do Curso</h2>
                        
                        {aulas.filter(aula => aula.curso_id === viewingCurso.id).length > 0 ? (
                          <ul className="space-y-2 md:space-y-3">
                            {aulas
                              .filter(aula => aula.curso_id === viewingCurso.id)
                              .sort((a, b) => a.ordem - b.ordem)
                              .map((aula, idx) => (
                                <li 
                                  key={aula.id + '-' + idx}
                                  className="flex items-start p-2 md:p-3 rounded transition-all hover:bg-gray-700 cursor-pointer"
                                  onClick={() => handleViewAula(aula)}
                                >
                                  <div 
                                    className="w-6 h-6 md:w-8 md:h-8 flex items-center justify-center rounded-full mr-2 md:mr-3 flex-shrink-0 text-xs md:text-sm"
                                    style={{ 
                                      background: 'linear-gradient(135deg, #E0A800, #FFC107)',
                                      color: '#000',
                                      fontWeight: 'bold'
                                    }}
                                  >
                                    {aula.ordem}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h3 className="font-medium text-white mb-1 text-sm md:text-base truncate">{aula.titulo}</h3>
                                    <p className="text-xs text-gray-400 truncate line-clamp-2">{aula.descricao}</p>
                                    <div className="flex items-center mt-1 md:mt-2">
                                      <span className="text-xs text-amber-400 flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        {aula.duracao}
                                      </span>
                                    </div>
                                  </div>
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5 text-amber-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </li>
                              ))}
                          </ul>
                        ) : (
                          <p className="text-gray-400 text-sm md:text-base">Este curso ainda não possui aulas.</p>
                        )}
                      </div>

                      {/* Informações do curso */}
                      <div className="mb-6 md:mb-8 mt-6 md:mt-8 bg-gray-800 rounded-lg p-4 md:p-5 shadow-lg border border-gray-700">
                        <h2 className="text-base md:text-lg font-bold mb-3 md:mb-4" style={{ 
                          background: 'linear-gradient(135deg, #E0A800 0%, #FFD700 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent'
                        }}>Informações do Curso</h2>
                        
                        <ul className="space-y-2 md:space-y-3">
                          <li className="flex items-center justify-between p-2 rounded hover:bg-gray-700 transition-colors">
                            <span className="text-gray-400 flex items-center text-sm md:text-base">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 md:h-4 md:w-4 mr-2 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                              Aulas
                            </span>
                            <span className="text-white font-medium text-sm md:text-base">{viewingCurso.total_aulas}</span>
                          </li>
                          <li className="flex items-center justify-between p-2 rounded hover:bg-gray-700 transition-colors">
                            <span className="text-gray-400 flex items-center text-sm md:text-base">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 md:h-4 md:w-4 mr-2 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Duração
                            </span>
                            <span className="text-white font-medium text-sm md:text-base">{viewingCurso.duracao_total}</span>
                          </li>
                          <li className="flex items-center justify-between p-2 rounded hover:bg-gray-700 transition-colors">
                            <span className="text-gray-400 flex items-center text-sm md:text-base">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 md:h-4 md:w-4 mr-2 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                              </svg>
                              Nível
                            </span>
                            <span className="text-white font-medium text-sm md:text-base">{viewingCurso.nivel}</span>
                          </li>
                          <li className="flex items-center justify-between p-2 rounded hover:bg-gray-700 transition-colors">
                            <span className="text-gray-400 flex items-center text-sm md:text-base">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 md:h-4 md:w-4 mr-2 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              Visualizações
                            </span>
                            <span className="text-white font-medium text-sm md:text-base">{viewingCurso.visualizacoes}</span>
                          </li>
                          <li className="flex items-center justify-between p-2 rounded hover:bg-gray-700 transition-colors">
                            <span className="text-gray-400 flex items-center text-sm md:text-base">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 md:h-4 md:w-4 mr-2 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                            <span className="text-gray-400 flex items-center text-sm md:text-base">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 md:h-4 md:w-4 mr-2 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              Data
                            </span>
                            <span className="text-white font-medium text-sm md:text-base">
                              {new Date(viewingCurso.data_criacao).toLocaleDateString('pt-BR')}
                            </span>
                          </li>
                        </ul>
                      </div>
                      
                      {/* Material de apoio */}
                      <div className="mb-6 md:mb-8 bg-gray-800 rounded-lg p-4 md:p-5 shadow-lg border border-gray-700">
                        <h2 className="text-base md:text-lg font-bold mb-3 md:mb-4" style={{
                          background: 'linear-gradient(135deg, #E0A800 0%, #FFD700 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent'
                        }}>Material de Apoio</h2>
                        
                        {viewingCurso.material_url ? (
                          <a 
                            href={viewingCurso.material_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center p-2 md:p-3 rounded transition-all hover:bg-gray-700"
                            style={{ 
                              backgroundColor: 'rgba(224, 168, 0, 0.1)'
                            }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="#E0A800">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                            </svg>
                            <span className="text-white font-medium text-sm md:text-base">Baixar Material</span>
                          </a>
                        ) : (
                          <p className="text-gray-400 text-sm md:text-base">Este curso ainda não possui material de apoio.</p>
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