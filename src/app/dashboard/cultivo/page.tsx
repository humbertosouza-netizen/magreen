'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { colors } from '@/styles/colors';
import { useUser } from '@/contexts/UserContext';
import { useDashboardState } from '@/contexts/DashboardStateContext';
import { usePageState } from '@/hooks/usePageState';
import { v4 as uuidv4 } from 'uuid';
import theme from '@/styles/theme';

// Interfaces
interface Cultivo {
  id: string;
  titulo: string;
  genetica: string;
  ambiente: string;
  iluminacao?: string;
  substrato?: string;
  sistema?: string;
  data_inicio: string;
  data_fim?: string;
  status: 'em_andamento' | 'finalizado' | 'cancelado';
  observacoes?: string;
  data_criacao: string;
}

interface Registro {
  id: string;
  cultivo_id: string;
  semana: number;
  fase: 'germinacao' | 'vegetativo' | 'floracao';
  altura?: number;
  ph?: number;
  ec?: number;
  temperatura?: number;
  umidade?: number;
  vpd?: number;
  horas_luz?: number;
  temperatura_solucao?: number;
  volume_reservatorio?: number;
  area_cultivo?: number;
  aroma?: string;
  tecnicas_aplicadas?: string;
  observacoes?: string;
  data_registro: string;
}

interface Foto {
  id?: string;
  url: string; // Para fotos locais durante upload
  url_imagem?: string; // Para fotos salvas no Supabase
  descricao: string;
  ordem?: number;
  cultivo_registros?: {
    id: string;
    cultivo_id: string;
    [key: string]: any;
  };
}

interface Produto {
  id: string;
  registro_id: string;
  nome: string;
  fabricante?: string;
  categoria?: string;
  dosagem?: string;
  observacoes?: string;
}

// Corrigir a declaração do tipo modalType
type ModalType = 'registro' | 'produto' | 'foto';

export default function CultivoPage() {
  const { user, isAdmin } = useUser();
  const router = useRouter();
  const { setViewingItemId } = useDashboardState();
  
  const [cultivos, setCultivos] = useState<Cultivo[]>([]);
  const [activeTab, setActiveTab] = usePageState<'cultivos' | 'novo' | 'visualizar' | 'visualizar-registro'>('cultivo_activeTab', 'cultivos');
  const [viewingCultivo, setViewingCultivo] = usePageState<Cultivo | null>('cultivo_viewingCultivo', null);
  const [loading, setLoading] = useState(true);
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [viewingRegistro, setViewingRegistro] = usePageState<Registro | null>('cultivo_viewingRegistro', null);
  
  // Estados para o formulário de novo cultivo
  const [titulo, setTitulo] = usePageState<string>('cultivo_titulo', '');
  const [genetica, setGenetica] = usePageState<string>('cultivo_genetica', '');
  const [ambiente, setAmbiente] = usePageState<string>('cultivo_ambiente', 'indoor');
  const [iluminacao, setIluminacao] = usePageState<string>('cultivo_iluminacao', '');
  const [substrato, setSubstrato] = usePageState<string>('cultivo_substrato', '');
  const [sistema, setSistema] = usePageState<string>('cultivo_sistema', '');
  const [dataInicio, setDataInicio] = usePageState<string>('cultivo_dataInicio', '');
  const [observacoes, setObservacoes] = usePageState<string>('cultivo_observacoes', '');
  const [editingCultivo, setEditingCultivo] = usePageState<Cultivo | null>('cultivo_editingCultivo', null);
  
  // Modal
  const [showModal, setShowModal] = usePageState<boolean>('cultivo_showModal', false);
  const [modalType, setModalType] = usePageState<ModalType>('cultivo_modalType', 'registro');
  
  // Estados para o formulário de registro
  const [registroFase, setRegistroFase] = usePageState<'germinacao' | 'vegetativo' | 'floracao'>('cultivo_registroFase', 'germinacao');
  const [registroSemana, setRegistroSemana] = usePageState<number>('cultivo_registroSemana', 1);
  const [registroAltura, setRegistroAltura] = usePageState<string>('cultivo_registroAltura', '');
  const [registroPh, setRegistroPh] = usePageState<string>('cultivo_registroPh', '');
  const [registroEc, setRegistroEc] = usePageState<string>('cultivo_registroEc', '');
  const [registroTemperatura, setRegistroTemperatura] = usePageState<string>('cultivo_registroTemperatura', '');
  const [registroUmidade, setRegistroUmidade] = usePageState<string>('cultivo_registroUmidade', '');
  const [registroVpd, setRegistroVpd] = usePageState<string>('cultivo_registroVpd', '');
  const [registroHorasLuz, setRegistroHorasLuz] = usePageState<string>('cultivo_registroHorasLuz', '');
  const [registroTempSolucao, setRegistroTempSolucao] = usePageState<string>('cultivo_registroTempSolucao', '');
  const [registroVolumeReservatorio, setRegistroVolumeReservatorio] = usePageState<string>('cultivo_registroVolumeReservatorio', '');
  const [registroAreaCultivo, setRegistroAreaCultivo] = usePageState<string>('cultivo_registroAreaCultivo', '');
  const [registroAroma, setRegistroAroma] = usePageState<string>('cultivo_registroAroma', '');
  const [registroTecnicas, setRegistroTecnicas] = usePageState<string>('cultivo_registroTecnicas', '');
  const [registroObservacoes, setRegistroObservacoes] = usePageState<string>('cultivo_registroObservacoes', '');
  const [registroProdutos, setRegistroProdutos] = usePageState<{nome: string, fabricante: string, categoria: string, dosagem: string}[]>('cultivo_registroProdutos', []);
  const [registroFotos, setRegistroFotos] = usePageState<Foto[]>('cultivo_registroFotos', []);
  
  // Estado para controlar o carregamento de imagens
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    fetchCultivos();
  }, [user]);
  
  useEffect(() => {
    if (viewingCultivo) {
      fetchRegistros(viewingCultivo.id);
      fetchProdutos(viewingCultivo.id);
      fetchFotos(viewingCultivo.id);
    }
  }, [viewingCultivo]);
  
  // Evento para quando a visibilidade da página muda (minimizar/restaurar)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Quando a página é minimizada, salvamos o estado atual usando o ID
        if (viewingCultivo) {
          setViewingItemId(viewingCultivo.id);
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [viewingCultivo, setViewingItemId]);
  
  const fetchCultivos = async () => {
    try {
      if (!user) return;
      
      setLoading(true);
      const { data, error } = await supabase
        .from('cultivos')
        .select('*')
        .order('data_criacao', { ascending: false });
      
      if (error) throw error;
      setCultivos(data || []);
    } catch (error) {
      console.error('Erro ao buscar cultivos:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchRegistros = async (cultivoId: string) => {
    try {
      const { data, error } = await supabase
        .from('cultivo_registros')
        .select('*')
        .eq('cultivo_id', cultivoId)
        .order('semana', { ascending: true });
      
      if (error) throw error;
      setRegistros(data || []);
    } catch (error) {
      console.error('Erro ao buscar registros:', error);
    }
  };
  
  const fetchProdutos = async (cultivoId: string) => {
    try {
      const { data, error } = await supabase
        .from('cultivo_produtos')
        .select('*, cultivo_registros!inner(*)')
        .eq('cultivo_registros.cultivo_id', cultivoId);
      
      if (error) throw error;
      setProdutos(data || []);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
    }
  };
  
  const fetchFotos = async (cultivoId: string) => {
    try {
      const { data, error } = await supabase
        .from('cultivo_fotos')
        .select('*, cultivo_registros!inner(*)')
        .eq('cultivo_registros.cultivo_id', cultivoId)
        .order('ordem', { ascending: true });
      
      if (error) throw error;
      setFotos(data || []);
    } catch (error) {
      console.error('Erro ao buscar fotos:', error);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!titulo || !genetica || !ambiente || !dataInicio) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    
    try {
      const cultivoData = {
        titulo,
        genetica,
        ambiente,
        iluminacao,
        substrato,
        sistema,
        data_inicio: dataInicio,
        status: 'em_andamento',
        observacoes,
        user_id: user?.id
      };
      
      if (editingCultivo) {
        // Atualizar cultivo existente
        const { error } = await supabase
          .from('cultivos')
          .update(cultivoData)
          .eq('id', editingCultivo.id);
        
        if (error) throw error;
        
        setCultivos(cultivos.map(c => 
          c.id === editingCultivo.id ? { ...c, ...cultivoData } as Cultivo : c
        ));
      } else {
        // Criar novo cultivo
        const { data, error } = await supabase
          .from('cultivos')
          .insert(cultivoData)
          .select();
        
        if (error) throw error;
        
        if (data) {
          setCultivos([data[0], ...cultivos]);
        }
      }
      
      // Limpar formulário e voltar para lista
      resetForm();
      handleVoltarParaLista();
    } catch (error) {
      console.error('Erro ao salvar cultivo:', error);
      alert('Ocorreu um erro ao salvar o cultivo. Tente novamente.');
    }
  };
  
  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este cultivo?')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('cultivos')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setCultivos(cultivos.filter(c => c.id !== id));
    } catch (error) {
      console.error('Erro ao excluir cultivo:', error);
      alert('Ocorreu um erro ao excluir o cultivo. Tente novamente.');
    }
  };
  
  const handleEdit = (cultivo: Cultivo) => {
    setEditingCultivo(cultivo);
    setTitulo(cultivo.titulo);
    setGenetica(cultivo.genetica);
    setAmbiente(cultivo.ambiente);
    setIluminacao(cultivo.iluminacao || '');
    setSubstrato(cultivo.substrato || '');
    setSistema(cultivo.sistema || '');
    setDataInicio(cultivo.data_inicio);
    setObservacoes(cultivo.observacoes || '');
    setActiveTab('novo');
  };
  
  const resetForm = () => {
    setEditingCultivo(null);
    setTitulo('');
    setGenetica('');
    setAmbiente('indoor');
    setIluminacao('');
    setSubstrato('');
    setSistema('');
    setDataInicio('');
    setObservacoes('');
  };
  
  // Função para voltar para a lista de cultivos e limpar o estado
  const handleVoltarParaLista = () => {
    setActiveTab('cultivos');
    setViewingCultivo(null);
    setViewingRegistro(null);
    resetForm();
  };
  
  const handleViewCultivo = (cultivo: Cultivo) => {
    setViewingCultivo(cultivo);
    setActiveTab('visualizar');
  };
  
  // Função para formatar data no padrão brasileiro
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString('pt-BR', options);
  };
  
  const resetRegistroForm = () => {
    setRegistroFase('germinacao');
    setRegistroSemana(1);
    setRegistroAltura('');
    setRegistroPh('');
    setRegistroEc('');
    setRegistroTemperatura('');
    setRegistroUmidade('');
    setRegistroVpd('');
    setRegistroHorasLuz('');
    setRegistroTempSolucao('');
    setRegistroVolumeReservatorio('');
    setRegistroAreaCultivo('');
    setRegistroAroma('');
    setRegistroTecnicas('');
    setRegistroObservacoes('');
    setRegistroProdutos([]);
    setRegistroFotos([]);
  };
  
  const handleRegistroSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!viewingCultivo) return;
    
    try {
      console.log('Iniciando salvamento de registro...');
      // Dados básicos do registro
      const registroData = {
        cultivo_id: viewingCultivo.id,
        semana: registroSemana,
        fase: registroFase,
        altura: registroAltura ? parseFloat(registroAltura) : null,
        ph: registroPh ? parseFloat(registroPh) : null,
        ec: registroEc ? parseFloat(registroEc) : null,
        temperatura: registroTemperatura ? parseFloat(registroTemperatura) : null,
        umidade: registroUmidade ? parseInt(registroUmidade) : null,
        vpd: registroVpd ? parseFloat(registroVpd) : null,
        horas_luz: registroHorasLuz ? parseInt(registroHorasLuz) : null,
        temperatura_solucao: registroTempSolucao ? parseFloat(registroTempSolucao) : null,
        volume_reservatorio: registroVolumeReservatorio ? parseInt(registroVolumeReservatorio) : null,
        area_cultivo: registroAreaCultivo ? parseFloat(registroAreaCultivo) : null,
        aroma: registroFase === 'floracao' ? registroAroma : null,
        tecnicas_aplicadas: registroTecnicas,
        observacoes: registroObservacoes
      };
      
      console.log('Dados do registro a serem salvos:', registroData);
      
      // Inserir registro
      const { data, error } = await supabase
        .from('cultivo_registros')
        .upsert(registroData, { 
          onConflict: 'cultivo_id,semana',
          ignoreDuplicates: false 
        })
        .select();
      
      if (error) {
        console.error('Erro detalhado ao salvar registro:', error.message, error.details, error.hint);
        throw error;
      }
      
      console.log('Registro salvo com sucesso:', data);
      
      if (data && data.length > 0) {
        const novoRegistro = data[0] as Registro;
        setRegistros([...registros, novoRegistro]);
        
        // Adicionar produtos se houver
        if (registroProdutos.length > 0) {
          console.log('Salvando produtos relacionados:', registroProdutos.length);
          const produtosData = registroProdutos.map(produto => ({
            registro_id: novoRegistro.id,
            nome: produto.nome,
            fabricante: produto.fabricante,
            categoria: produto.categoria,
            dosagem: produto.dosagem
          }));
          
          const { error: errorProdutos } = await supabase
            .from('cultivo_produtos')
            .insert(produtosData);
          
          if (errorProdutos) {
            console.error('Erro detalhado ao salvar produtos:', errorProdutos.message, errorProdutos.details, errorProdutos.hint);
          }
        }
        
        // Adicionar fotos se houver
        if (registroFotos.length > 0) {
          console.log('Salvando fotos relacionadas:', registroFotos.length);
          const fotosData = registroFotos.map((foto, index) => ({
            registro_id: novoRegistro.id,
            url_imagem: foto.url, // Corrigido: usar foto.url em vez de foto.url_imagem
            descricao: foto.descricao,
            ordem: index
          }));
          
          const { error: errorFotos } = await supabase
            .from('cultivo_fotos')
            .insert(fotosData);
          
          if (errorFotos) {
            console.error('Erro detalhado ao salvar fotos:', errorFotos.message, errorFotos.details, errorFotos.hint);
          }
        }
        
        resetRegistroForm();
        setShowModal(false);
        
        // Recarregar os registros para atualizar a lista
        if (viewingCultivo) {
          await fetchRegistros(viewingCultivo.id);
        }
        
        alert('Registro adicionado com sucesso!');
      } else {
        console.error('Registro salvo, mas nenhum dado retornado');
        alert('Registro salvo, mas houve um problema ao recuperar os dados. Verifique se foi salvo corretamente.');
      }
    } catch (error: any) {
      console.error('Erro ao salvar registro:', error);
      console.error('Detalhes do erro:', error?.message, error?.details, error?.code);
      alert(`Ocorreu um erro ao salvar o registro: ${error?.message || 'Erro desconhecido'}. Tente novamente.`);
    }
  };
  
  const adicionarProduto = () => {
    setRegistroProdutos([
      ...registroProdutos, 
      { nome: '', fabricante: '', categoria: '', dosagem: '' }
    ]);
  };
  
  const atualizarProduto = (index: number, campo: string, valor: string) => {
    const novosProdutos = [...registroProdutos];
    novosProdutos[index] = { ...novosProdutos[index], [campo]: valor };
    setRegistroProdutos(novosProdutos);
  };
  
  const removerProduto = (index: number) => {
    setRegistroProdutos(registroProdutos.filter((_, i) => i !== index));
  };
  
  // Adicionar após a função uploadImage
  
  // Função para atualizar as políticas de segurança do bucket
  const atualizarPoliticasBucket = async (bucketName: string) => {
    try {
      console.log("Atualizando políticas RLS do bucket", bucketName);
      
      // Obter referência ao usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error("Usuário não autenticado");
        return false;
      }
      
      // Fazer upload de um arquivo de teste para forçar a criação do bucket se ainda não existir
      // Muitas vezes, apenas criar o bucket não é suficiente para configurar as políticas
      const testFile = new Blob(['test'], { type: 'text/plain' });
      const testFileName = `policy-test-${Date.now()}.txt`;
      
      const { data: testUpload, error: testUploadError } = await supabase.storage
        .from(bucketName)
        .upload(testFileName, testFile, {
          upsert: true
        });
      
      if (testUploadError) {
        console.log("Erro no upload de teste (isso pode ser normal se as políticas ainda não existirem):", testUploadError);
      } else {
        console.log("Upload de teste bem-sucedido:", testUpload);
        
        // Limpar o arquivo de teste se conseguiu fazer upload
        await supabase.storage
          .from(bucketName)
          .remove([testFileName]);
      }
      
      return true;
    } catch (error) {
      console.error("Erro ao atualizar políticas:", error);
      return false;
    }
  }
  
  // Função para fazer upload de imagem para o Supabase Storage
  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      setUploading(true);
      
      const bucketName = 'cultivo-fotos';
      
      // Verificar autenticação
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('Usuário não autenticado para upload de imagens');
        setUploading(false);
        return null;
      }
      
      // Criar um nome único para o arquivo usando UUID
      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `${fileName}`;
      
      console.log(`Iniciando upload de ${file.name} para ${bucketName}/${filePath}`);
      
      // Fazer upload do arquivo com token de autenticação
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,  // Permitir substituição se arquivo existir
          contentType: file.type
        });
      
      if (error) {
        console.error('Erro no upload:', error);
        console.error('Mensagem:', error.message);
        setUploading(false);
        return null;
      }
      
      console.log('Upload bem-sucedido:', data);
      
      // Obter URL pública do arquivo
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);
      
      setUploading(false);
      return publicUrl;
    } catch (error) {
      console.error('Erro no upload da imagem:', error);
      setUploading(false);
      return null;
    }
  }
  
  // Função para lidar com a seleção de arquivos
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const files = e.target.files;
      if (!files || files.length === 0) return;
      
      // Verificar se há sessão ativa
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('Usuário não autenticado');
        return;
      }
      
      console.log(`Processando ${files.length} arquivo(s) para upload`);
      
      // Processar cada arquivo selecionado
      const uploadPromises = Array.from(files).map(async (file) => {
        const url = await uploadImage(file);
        if (url) {
          return {
            url,
            descricao: `Foto do cultivo - ${new Date().toLocaleDateString()}`
          } as Foto;
        }
        return null;
      });
      
      // Aguardar todos os uploads
      const resultados = await Promise.all(uploadPromises);
      
      // Filtrar uploads bem-sucedidos e adicionar ao estado
      const novasFotos = resultados.filter((foto): foto is Foto => foto !== null);
      
      if (novasFotos.length > 0) {
        console.log(`${novasFotos.length} foto(s) carregada(s) com sucesso`);
        setRegistroFotos([...registroFotos, ...novasFotos]);
      }
      
      // Limpar input para permitir selecionar os mesmos arquivos novamente
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      console.error('Erro ao processar arquivos selecionados:', error);
    }
  }
  
  // Função para adicionar descrição à foto
  const atualizarDescricaoFoto = (index: number, descricao: string) => {
    const novoRegistroFotos = [...registroFotos];
    novoRegistroFotos[index] = {
      ...novoRegistroFotos[index],
      descricao
    };
    setRegistroFotos(novoRegistroFotos);
  }
  
  // Função para remover uma foto
  const removerFoto = async (index: number) => {
    const foto = registroFotos[index];
    const bucketName = 'cultivo-fotos';
    
    console.log("Removendo foto:", foto.url);
    
    // Remover do Storage se o URL contém uma referência ao bucket do Supabase
    if (foto.url.includes(bucketName)) {
      try {
        // Extrair o caminho do arquivo da URL
        const url = new URL(foto.url);
        const pathSegments = url.pathname.split('/');
        const fileName = pathSegments[pathSegments.length - 1];
        
        console.log("Removendo arquivo do Storage:", fileName);
        
        // Remover arquivo do Storage
        const { error } = await supabase.storage
          .from(bucketName)
          .remove([fileName]);
        
        if (error) {
          console.error('Erro ao remover arquivo do Storage:', error);
        }
      } catch (error) {
        console.error('Erro ao processar URL para remoção:', error);
      }
    }
    
    // Atualizar o estado removendo a foto
    const novoRegistroFotos = [...registroFotos];
    novoRegistroFotos.splice(index, 1);
    setRegistroFotos(novoRegistroFotos);
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
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

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-10">
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
                Meu Cultivo
              </h1>
              <p 
                className="text-lg"
                style={{ 
                  color: 'rgba(255, 255, 255, 0.9)',
                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
                }}
              >
                Acompanhe e registre seu progresso
              </p>
            </div>
        
        <button
              className="mt-4 md:mt-0 px-6 py-3 rounded-full flex items-center justify-center transition-all transform hover:scale-105"
          style={{ 
                background: `linear-gradient(135deg, #F8CC3C, #E3A507)`,
                color: '#1F1F1F',
                fontWeight: 'bold',
                boxShadow: '0 4px 10px rgba(248, 204, 60, 0.3)'
          }}
          onClick={() => {
            resetForm();
            setActiveTab('novo');
          }}
        >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
          Novo Cultivo
        </button>
          </div>
      </div>
      
      {/* Abas de navegação */}
        <div className="mb-6 rounded-xl overflow-hidden bg-opacity-10 backdrop-blur-sm" 
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
          }}>
          <div className="flex">
          <button
              className={`py-3 px-6 font-medium text-sm transition-all ${
              activeTab === 'cultivos'
                  ? 'text-white bg-opacity-20'
                  : 'text-gray-400 hover:text-white'
            }`}
            style={{ 
                borderBottom: activeTab === 'cultivos' ? `2px solid ${theme.colors.primary}` : 'none',
                background: activeTab === 'cultivos' ? 'rgba(255, 255, 255, 0.05)' : 'transparent' 
            }}
            onClick={handleVoltarParaLista}
          >
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                Meus Cultivos
              </div>
          </button>
          <button
              className={`py-3 px-6 font-medium text-sm transition-all ${
              activeTab === 'novo'
                  ? 'text-white bg-opacity-20'
                  : 'text-gray-400 hover:text-white'
            }`}
            style={{ 
                borderBottom: activeTab === 'novo' ? `2px solid ${theme.colors.primary}` : 'none',
                background: activeTab === 'novo' ? 'rgba(255, 255, 255, 0.05)' : 'transparent' 
            }}
            onClick={() => setActiveTab('novo')}
          >
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
            {editingCultivo ? 'Editar Cultivo' : 'Novo Cultivo'}
              </div>
          </button>
          {viewingCultivo && (
            <button
                className={`py-3 px-6 font-medium text-sm transition-all ${
                  activeTab === 'visualizar' || activeTab === 'visualizar-registro'
                    ? 'text-white bg-opacity-20'
                    : 'text-gray-400 hover:text-white'
              }`}
              style={{ 
                  borderBottom: (activeTab === 'visualizar' || activeTab === 'visualizar-registro') ? `2px solid ${theme.colors.primary}` : 'none',
                  background: (activeTab === 'visualizar' || activeTab === 'visualizar-registro') ? 'rgba(255, 255, 255, 0.05)' : 'transparent' 
              }}
              onClick={() => setActiveTab('visualizar')}
            >
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
              Visualizar Cultivo
                </div>
            </button>
          )}
        </div>
      </div>
      
      {/* Conteúdo baseado na aba ativa */}
      {activeTab === 'cultivos' && (
        <div>
          {cultivos.length === 0 ? (
              <div className="text-center py-16 rounded-xl overflow-hidden" 
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
                }}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 mx-auto text-gray-600 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
              </svg>
                <h2 className="text-2xl font-semibold mb-3" style={{ color: theme.colors.textPrimary }}>Nenhum cultivo cadastrado</h2>
                <p className="text-lg mb-8" style={{ color: theme.colors.textSecondary }}>Comece adicionando seu primeiro cultivo para acompanhar seu progresso.</p>
              <button
                onClick={() => setActiveTab('novo')}
                  className="px-6 py-3 rounded-full transition-all transform hover:scale-105"
                style={{ 
                    background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.accent})`,
                    color: 'black',
                    fontWeight: 'bold',
                    boxShadow: '0 4px 15px rgba(127, 219, 63, 0.4)'
                }}
              >
                Iniciar meu primeiro cultivo
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cultivos.map(cultivo => (
                <div 
                  key={cultivo.id} 
                    className="rounded-xl overflow-hidden transform transition-all hover:scale-102 hover:shadow-xl"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    <div className="h-40 relative">
                      <div className="absolute inset-0" 
                        style={{
                          background: `linear-gradient(135deg, ${theme.colors.primary}70, ${theme.colors.accent}70)`
                        }}
                      />
                    <div className="absolute inset-0 opacity-30"
                      style={{
                        backgroundImage: "url('/images/leaf-pattern-bg.svg')",
                        backgroundSize: "150px",
                        backgroundRepeat: "repeat"
                      }}
                      />
                      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black to-transparent">
                      <div className="flex justify-between items-end">
                          <h3 className="text-xl font-bold text-white truncate">{cultivo.titulo}</h3>
                        <span 
                            className="px-3 py-1.5 rounded-full text-xs font-medium"
                            style={{ 
                              backgroundColor: cultivo.status === 'em_andamento' 
                                ? 'rgba(16, 185, 129, 0.3)' // Verde para em andamento
                                : cultivo.status === 'finalizado' 
                                  ? 'rgba(59, 130, 246, 0.3)' // Azul para finalizado
                                  : 'rgba(239, 68, 68, 0.3)', // Vermelho para cancelado
                              color: cultivo.status === 'em_andamento' ? '#a7f3d0' : 
                                    cultivo.status === 'finalizado' ? '#93c5fd' : '#fca5a5',
                              backdropFilter: 'blur(4px)',
                              border: cultivo.status === 'em_andamento' 
                                ? '1px solid rgba(16, 185, 129, 0.3)' 
                                : cultivo.status === 'finalizado'
                                  ? '1px solid rgba(59, 130, 246, 0.3)'
                                  : '1px solid rgba(239, 68, 68, 0.3)'
                            }}
                        >
                          {cultivo.status === 'em_andamento' ? 'Em andamento' : 
                           cultivo.status === 'finalizado' ? 'Finalizado' : 'Cancelado'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                    <div className="p-5">
                      <div className="grid grid-cols-2 gap-4 mb-5">
                      <div>
                          <p className="text-xs" style={{ color: theme.colors.textSecondary }}>Genética</p>
                          <p className="text-sm font-medium" style={{ color: theme.colors.textPrimary }}>{cultivo.genetica}</p>
                      </div>
                      <div>
                          <p className="text-xs" style={{ color: theme.colors.textSecondary }}>Ambiente</p>
                          <p className="text-sm font-medium capitalize" style={{ color: theme.colors.textPrimary }}>{cultivo.ambiente}</p>
                      </div>
                      <div>
                          <p className="text-xs" style={{ color: theme.colors.textSecondary }}>Início</p>
                          <p className="text-sm font-medium" style={{ color: theme.colors.textPrimary }}>{formatDate(cultivo.data_inicio)}</p>
                      </div>
                      <div>
                          <p className="text-xs" style={{ color: theme.colors.textSecondary }}>Sistema</p>
                          <p className="text-sm font-medium capitalize" style={{ color: theme.colors.textPrimary }}>{cultivo.sistema || '-'}</p>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex justify-between">
                      <button
                        onClick={() => handleViewCultivo(cultivo)}
                          className="px-4 py-2 rounded-full text-sm font-medium transition-all transform hover:scale-105"
                        style={{ 
                            background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.accent})`,
                            color: 'black',
                            boxShadow: '0 2px 10px rgba(127, 219, 63, 0.3)'
                        }}
                      >
                        Ver Detalhes
                      </button>
                      
                      <div className="space-x-2">
                        <button
                          onClick={() => handleEdit(cultivo)}
                            className="p-2 rounded-full"
                            style={{ 
                              backgroundColor: 'rgba(59, 130, 246, 0.15)',
                              color: '#93c5fd'
                            }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(cultivo.id)}
                            className="p-2 rounded-full"
                            style={{ 
                              backgroundColor: 'rgba(239, 68, 68, 0.15)',
                              color: '#fca5a5'
                            }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Formulário de novo/editar cultivo */}
      {activeTab === 'novo' && (
          <div className="rounded-xl overflow-hidden" 
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
            }}>
            <div className="p-6 border-b" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
              <h2 className="text-2xl font-bold" style={{ color: theme.colors.textPrimary }}>
            {editingCultivo ? 'Editar Cultivo' : 'Novo Cultivo'}
          </h2>
            </div>
          
            <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Título */}
              <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.textSecondary }}>
                  Título do Cultivo *
                </label>
                <input
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg text-white"
                  style={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.07)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      outline: 'none',
                  }}
                  required
                  placeholder="ex: Northern Lights #5 - Cultivo 1"
                />
              </div>
              
              {/* Genética */}
              <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.textSecondary }}>
                  Genética *
                </label>
                <input
                  type="text"
                  value={genetica}
                  onChange={(e) => setGenetica(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg text-white"
                  style={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.07)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      outline: 'none',
                  }}
                  required
                  placeholder="ex: Northern Lights Auto"
                />
              </div>
              
              {/* Ambiente */}
              <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.textSecondary }}>
                  Ambiente *
                </label>
                <select
                  value={ambiente}
                  onChange={(e) => setAmbiente(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg text-white appearance-none"
                  style={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.07)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      outline: 'none',
                      backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'white\' width=\'18px\' height=\'18px\'%3E%3Cpath d=\'M7 10l5 5 5-5z\'/%3E%3C/svg%3E")',
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 10px center'
                  }}
                  required
                >
                  <option value="indoor">Indoor</option>
                  <option value="outdoor">Outdoor</option>
                  <option value="estufa">Estufa</option>
                </select>
              </div>
              
              {/* Iluminação */}
              <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.textSecondary }}>
                  Iluminação
                </label>
                <input
                  type="text"
                  value={iluminacao}
                  onChange={(e) => setIluminacao(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg text-white"
                  style={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.07)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      outline: 'none',
                  }}
                  placeholder="ex: LED 240W Full Spectrum"
                />
              </div>
              
              {/* Substrato */}
              <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.textSecondary }}>
                  Substrato
                </label>
                <input
                  type="text"
                  value={substrato}
                  onChange={(e) => setSubstrato(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg text-white"
                  style={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.07)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      outline: 'none',
                  }}
                  placeholder="ex: Turfa + Perlita"
                />
              </div>
              
              {/* Sistema */}
              <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.textSecondary }}>
                  Sistema
                </label>
                <input
                  type="text"
                  value={sistema}
                  onChange={(e) => setSistema(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg text-white"
                  style={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.07)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      outline: 'none',
                  }}
                  placeholder="ex: Vaso 11L, DWC, Coco"
                />
              </div>
              
              {/* Data de Início */}
              <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.textSecondary }}>
                  Data de Início *
                </label>
                <input
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg text-white"
                  style={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.07)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      outline: 'none',
                      colorScheme: 'dark'
                  }}
                  required
                />
              </div>
            </div>
            
            {/* Observações */}
            <div className="mb-6">
                <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.textSecondary }}>
                Observações
              </label>
              <textarea
                rows={4}
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg text-white"
                style={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.07)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    outline: 'none',
                }}
                placeholder="Observações iniciais sobre o cultivo..."
              />
            </div>
            
            {/* Botões */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setActiveTab('cultivos');
                }}
                  className="px-4 py-2 rounded-full shadow-sm text-sm font-medium transition-all"
                style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    color: theme.colors.textPrimary
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                  className="px-5 py-2 rounded-full shadow-sm text-sm font-medium transition-all transform hover:scale-105"
                style={{ 
                    background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.accent})`,
                    color: 'black',
                    fontWeight: 'bold',
                  boxShadow: '0 4px 10px rgba(127, 219, 63, 0.3)'
                }}
              >
                {editingCultivo ? 'Atualizar Cultivo' : 'Criar Cultivo'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Visualização do cultivo */}
      {activeTab === 'visualizar' && viewingCultivo && (
          <div className="rounded-xl overflow-hidden" 
              style={{
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
            }}>
            <div className="relative p-6 border-b" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
              <div className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: `url('/images/leaf-pattern-bg.svg')`,
                  backgroundSize: '120px',
                  backgroundRepeat: 'repeat',
                  background: `linear-gradient(135deg, ${theme.colors.primary}40, ${theme.colors.accent}40)`
                }}
              />
            <div className="relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                  <div>
                    <h2 className="text-2xl font-bold" style={{ color: theme.colors.textPrimary }}>{viewingCultivo.titulo}</h2>
                    <div className="flex flex-wrap items-center mt-2">
                      <span className="flex items-center mr-4" style={{ color: theme.colors.textSecondary }}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {formatDate(viewingCultivo.data_inicio)}
                      </span>
                      {viewingCultivo.data_fim && (
                        <span className="flex items-center" style={{ color: theme.colors.textSecondary }}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {formatDate(viewingCultivo.data_fim)}
                        </span>
                      )}
                    </div>
                  </div>
                <span 
                    className="px-3 py-1.5 rounded-full text-xs font-medium mt-2 md:mt-0"
                    style={{ 
                      backgroundColor: viewingCultivo.status === 'em_andamento' 
                        ? 'rgba(16, 185, 129, 0.3)' // Verde para em andamento
                        : viewingCultivo.status === 'finalizado' 
                          ? 'rgba(59, 130, 246, 0.3)' // Azul para finalizado
                          : 'rgba(239, 68, 68, 0.3)', // Vermelho para cancelado
                      color: viewingCultivo.status === 'em_andamento' ? '#a7f3d0' : 
                            viewingCultivo.status === 'finalizado' ? '#93c5fd' : '#fca5a5',
                      backdropFilter: 'blur(4px)',
                      border: viewingCultivo.status === 'em_andamento' 
                        ? '1px solid rgba(16, 185, 129, 0.3)' 
                        : viewingCultivo.status === 'finalizado'
                          ? '1px solid rgba(59, 130, 246, 0.3)'
                          : '1px solid rgba(239, 68, 68, 0.3)'
                    }}
                >
                  {viewingCultivo.status === 'em_andamento' ? 'Em andamento' : 
                   viewingCultivo.status === 'finalizado' ? 'Finalizado' : 'Cancelado'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="rounded-lg p-4"
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                  }}>
                  <h3 className="font-semibold mb-3 flex items-center" style={{ color: theme.colors.primary }}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h10a2 2 0 012 2v2a2 2 0 01-2 2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Genética
                </h3>
                  <p style={{ color: theme.colors.textPrimary }}>{viewingCultivo.genetica}</p>
              </div>
                <div className="rounded-lg p-4"
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                  }}>
                  <h3 className="font-semibold mb-3 flex items-center" style={{ color: theme.colors.primary }}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Ambiente
                </h3>
                  <p style={{ color: theme.colors.textPrimary }} className="capitalize">{viewingCultivo.ambiente}</p>
                {viewingCultivo.iluminacao && (
                    <p className="mt-2 text-sm">
                      <span style={{ color: theme.colors.accent }}>Iluminação:</span> 
                      <span style={{ color: theme.colors.textSecondary }}> {viewingCultivo.iluminacao}</span>
                  </p>
                )}
              </div>
                <div className="rounded-lg p-4"
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                  }}>
                  <h3 className="font-semibold mb-3 flex items-center" style={{ color: theme.colors.primary }}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                  Sistema
                </h3>
                  <p style={{ color: theme.colors.textPrimary }}>{viewingCultivo.sistema || '-'}</p>
                {viewingCultivo.substrato && (
                    <p className="mt-2 text-sm">
                      <span style={{ color: theme.colors.accent }}>Substrato:</span>
                      <span style={{ color: theme.colors.textSecondary }}> {viewingCultivo.substrato}</span>
                  </p>
                )}
              </div>
            </div>
            
            {viewingCultivo.observacoes && (
                <div className="mb-8 rounded-lg p-5"
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                  }}>
                  <h3 className="font-semibold mb-3 flex items-center" style={{ color: theme.colors.primary }}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                    Observações
                  </h3>
                  <p className="whitespace-pre-line" style={{ color: theme.colors.textPrimary }}>{viewingCultivo.observacoes}</p>
              </div>
            )}
            
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-lg flex items-center" style={{ color: theme.colors.primary }}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Registros Semanais
                  </h3>
                <button
                  onClick={() => {
                    setModalType('registro');
                    setShowModal(true);
                  }}
                    className="px-4 py-2 rounded-full text-sm font-medium transition-all transform hover:scale-105"
                  style={{ 
                      background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.accent})`,
                      color: 'black',
                      fontWeight: 'bold',
                      boxShadow: '0 2px 10px rgba(127, 219, 63, 0.3)'
                  }}
                >
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                  Adicionar Registro
                    </div>
                </button>
              </div>
              
                <div className="rounded-lg overflow-hidden" 
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                  }}>
                {registros.length === 0 ? (
                  <div className="p-8 text-center">
                      <p style={{ color: theme.colors.textSecondary }}>Não há registros para este cultivo ainda.</p>
                      <p className="text-sm mt-2" style={{ color: theme.colors.textSecondary }}>Adicione registros semanais para acompanhar seu progresso.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                          <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                            <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: theme.colors.primary }}>Semana</th>
                            <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: theme.colors.primary }}>Fase</th>
                            <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: theme.colors.primary }}>Altura</th>
                            <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: theme.colors.primary }}>pH</th>
                            <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: theme.colors.primary }}>EC</th>
                            <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: theme.colors.primary }}>Temperatura</th>
                            <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: theme.colors.primary }}>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {registros.map((registro) => (
                            <tr key={registro.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }} 
                              className="hover:bg-white hover:bg-opacity-5 transition-all">
                              <td className="px-4 py-3 text-sm" style={{ color: theme.colors.textPrimary }}>Semana {registro.semana}</td>
                              <td className="px-4 py-3 text-sm capitalize" style={{ color: theme.colors.textPrimary }}>{registro.fase}</td>
                              <td className="px-4 py-3 text-sm" style={{ color: theme.colors.textPrimary }}>{registro.altura ? `${registro.altura} cm` : '-'}</td>
                              <td className="px-4 py-3 text-sm" style={{ color: theme.colors.textPrimary }}>{registro.ph || '-'}</td>
                              <td className="px-4 py-3 text-sm" style={{ color: theme.colors.textPrimary }}>{registro.ec || '-'}</td>
                              <td className="px-4 py-3 text-sm" style={{ color: theme.colors.textPrimary }}>{registro.temperatura ? `${registro.temperatura}°C` : '-'}</td>
                            <td className="px-4 py-3 text-sm">
                              <button
                                  className="px-3 py-1.5 rounded-full text-xs font-medium"
                                  style={{ 
                                    backgroundColor: 'rgba(59, 130, 246, 0.15)',
                                    color: '#93c5fd'
                                  }}
                                onClick={() => {
                                  setViewingRegistro(registro);
                                  setActiveTab('visualizar-registro');
                                }}
                              >
                                  Ver Detalhes
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
            
              <div className="flex justify-end space-x-3 mt-8">
              <button
                onClick={() => handleEdit(viewingCultivo)}
                  className="px-4 py-2 rounded-full shadow-sm text-sm font-medium"
                  style={{ 
                    backgroundColor: 'rgba(59, 130, 246, 0.15)',
                    color: '#93c5fd'
                  }}
                >
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                Editar Cultivo
                  </div>
              </button>
              <button
                onClick={handleVoltarParaLista}
                  className="px-4 py-2 rounded-full shadow-sm text-sm font-medium"
              style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    color: theme.colors.textPrimary
                  }}
                >
                    <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                      </svg>
                Voltar para Lista
                    </div>
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Visualização do detalhe do registro */}
      {activeTab === 'visualizar-registro' && viewingRegistro && viewingCultivo && (
        <div className="rounded-xl overflow-hidden" 
              style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
          }}>
          <div className="relative p-6 border-b" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
            <div className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `url('/images/leaf-pattern-bg.svg')`,
                backgroundSize: '120px',
                backgroundRepeat: 'repeat',
                background: `linear-gradient(135deg, ${theme.colors.primary}40, ${theme.colors.accent}40)`
              }}
            />
            <div className="relative z-10">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                <div>
                  <h2 className="text-2xl font-bold" style={{ color: theme.colors.textPrimary }}>
                    Semana {viewingRegistro.semana} - {viewingCultivo.titulo}
                  </h2>
                  <p className="text-sm mt-1" style={{ color: theme.colors.textSecondary }}>
                    Fase: <span className="capitalize" style={{ color: theme.colors.accent }}>{viewingRegistro.fase}</span>
                  </p>
                </div>
                <div>
                  <span 
                    className="px-3 py-1.5 rounded-full text-xs font-medium mt-2 md:mt-0"
                    style={{ 
                      backgroundColor: 'rgba(16, 185, 129, 0.3)',
                      color: '#a7f3d0',
                      backdropFilter: 'blur(4px)',
                      border: '1px solid rgba(16, 185, 129, 0.3)' 
                    }}
                  >
                    {new Date(viewingRegistro.data_registro).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {/* Coluna 1: Dados de crescimento */}
              <div className="rounded-lg p-4"
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.05)'
                }}>
                <h3 className="font-semibold mb-3 flex items-center" style={{ color: theme.colors.primary }}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10.5h14m-7-7v14" />
                  </svg>
                  Crescimento
                </h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs" style={{ color: theme.colors.textSecondary }}>Altura</p>
                    <p className="text-sm font-medium" style={{ color: theme.colors.textPrimary }}>
                      {viewingRegistro.altura ? `${viewingRegistro.altura} cm` : '-'}
                    </p>
              </div>
                  {viewingRegistro.fase === 'floracao' && viewingRegistro.aroma && (
                    <div>
                      <p className="text-xs" style={{ color: theme.colors.textSecondary }}>Aroma</p>
                      <p className="text-sm font-medium" style={{ color: theme.colors.textPrimary }}>
                        {viewingRegistro.aroma}
                      </p>
              </div>
                  )}
              </div>
            </div>
            
              {/* Coluna 2: Dados de ambiente */}
              <div className="rounded-lg p-4"
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.05)'
                }}>
                <h3 className="font-semibold mb-3 flex items-center" style={{ color: theme.colors.primary }}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                  </svg>
                  Ambiente
                </h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs" style={{ color: theme.colors.textSecondary }}>Temperatura</p>
                    <p className="text-sm font-medium" style={{ color: theme.colors.textPrimary }}>
                      {viewingRegistro.temperatura ? `${viewingRegistro.temperatura}°C` : '-'}
                    </p>
              </div>
                  <div>
                    <p className="text-xs" style={{ color: theme.colors.textSecondary }}>Umidade</p>
                    <p className="text-sm font-medium" style={{ color: theme.colors.textPrimary }}>
                      {viewingRegistro.umidade ? `${viewingRegistro.umidade}%` : '-'}
                    </p>
              </div>
                  <div>
                    <p className="text-xs" style={{ color: theme.colors.textSecondary }}>VPD</p>
                    <p className="text-sm font-medium" style={{ color: theme.colors.textPrimary }}>
                      {viewingRegistro.vpd ? `${viewingRegistro.vpd} kPa` : '-'}
                    </p>
            </div>
                  <div>
                    <p className="text-xs" style={{ color: theme.colors.textSecondary }}>Horas de Luz</p>
                    <p className="text-sm font-medium" style={{ color: theme.colors.textPrimary }}>
                      {viewingRegistro.horas_luz ? `${viewingRegistro.horas_luz}h` : '-'}
                    </p>
              </div>
                    </div>
                    </div>
                    
              {/* Coluna 3: Dados de solução */}
              <div className="rounded-lg p-4"
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.05)'
                }}>
                <h3 className="font-semibold mb-3 flex items-center" style={{ color: theme.colors.primary }}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                      </svg>
                  Solução
                </h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs" style={{ color: theme.colors.textSecondary }}>pH</p>
                    <p className="text-sm font-medium" style={{ color: theme.colors.textPrimary }}>
                      {viewingRegistro.ph || '-'}
                    </p>
                    </div>
                  <div>
                    <p className="text-xs" style={{ color: theme.colors.textSecondary }}>EC</p>
                    <p className="text-sm font-medium" style={{ color: theme.colors.textPrimary }}>
                      {viewingRegistro.ec ? `${viewingRegistro.ec} μS/cm` : '-'}
                    </p>
                    </div>
                      <div>
                    <p className="text-xs" style={{ color: theme.colors.textSecondary }}>Temperatura da Solução</p>
                    <p className="text-sm font-medium" style={{ color: theme.colors.textPrimary }}>
                      {viewingRegistro.temperatura_solucao ? `${viewingRegistro.temperatura_solucao}°C` : '-'}
                    </p>
                    </div>
                      <div>
                    <p className="text-xs" style={{ color: theme.colors.textSecondary }}>Volume do Reservatório</p>
                    <p className="text-sm font-medium" style={{ color: theme.colors.textPrimary }}>
                      {viewingRegistro.volume_reservatorio ? `${viewingRegistro.volume_reservatorio}L` : '-'}
                    </p>
                    </div>
                    </div>
                    </div>
                    </div>
                    
            {/* Técnicas Aplicadas */}
            {viewingRegistro.tecnicas_aplicadas && (
              <div className="mb-8 rounded-lg p-5"
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.05)'
                }}>
                <h3 className="font-semibold mb-3 flex items-center" style={{ color: theme.colors.primary }}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                  Técnicas Aplicadas
                </h3>
                <p className="whitespace-pre-line" style={{ color: theme.colors.textPrimary }}>{viewingRegistro.tecnicas_aplicadas}</p>
                    </div>
                              )}
            
            {/* Observações */}
            {viewingRegistro.observacoes && (
              <div className="mb-8 rounded-lg p-5"
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.05)'
                }}>
                <h3 className="font-semibold mb-3 flex items-center" style={{ color: theme.colors.primary }}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                  Observações
                </h3>
                <p className="whitespace-pre-line" style={{ color: theme.colors.textPrimary }}>{viewingRegistro.observacoes}</p>
                    </div>
      )}
      
            {/* Lista de produtos utilizados */}
            <div className="mb-8">
              <h3 className="font-semibold mb-4 flex items-center" style={{ color: theme.colors.primary }}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                Produtos Utilizados
                  </h3>
                  
              {produtos.filter(p => p.registro_id === viewingRegistro.id).length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {produtos.filter(p => p.registro_id === viewingRegistro.id).map(produto => (
                    <div key={produto.id} className="p-4 rounded-lg"
                          style={{ 
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.05)'
                      }}>
                      <h4 className="font-semibold mb-2" style={{ color: theme.colors.textPrimary }}>{produto.nome}</h4>
                      {produto.fabricante && (
                        <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                          Fabricante: {produto.fabricante}
                        </p>
                      )}
                      {produto.categoria && (
                        <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                          Categoria: {produto.categoria}
                        </p>
                      )}
                      {produto.dosagem && (
                        <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                          Dosagem: {produto.dosagem}
                        </p>
                      )}
                      </div>
                  ))}
                      </div>
              ) : (
                <div className="p-4 rounded-lg text-center"
                        style={{ 
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                  }}>
                  <p style={{ color: theme.colors.textSecondary }}>Nenhum produto registrado para esta semana.</p>
                      </div>
              )}
                  </div>

            {/* Galeria de fotos */}
            <div className="mb-8">
              <h3 className="font-semibold mb-4 flex items-center" style={{ color: theme.colors.primary }}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                Fotos do Cultivo
              </h3>
              
              {fotos.filter(f => f.cultivo_registros?.id === viewingRegistro.id).length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {fotos.filter(f => f.cultivo_registros?.id === viewingRegistro.id).map((foto, index) => (
                    <div key={foto.id || index} className="rounded-lg overflow-hidden"
                          style={{ 
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.05)'
                      }}>
                      <div className="aspect-w-16 aspect-h-9 w-full">
                        <img 
                          src={foto.url_imagem || foto.url} 
                                  alt={foto.descricao || `Foto ${index + 1}`}
                          className="object-cover w-full h-48"
                                />
                              </div>
                                <div className="p-3">
                        <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                          {foto.descricao || `Foto da semana ${viewingRegistro.semana}`}
                        </p>
                                </div>
                            </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-lg text-center"
                          style={{ 
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                  }}>
                  <p style={{ color: theme.colors.textSecondary }}>Nenhuma foto registrada para esta semana.</p>
                      </div>
                    )}
                  </div>

            {/* Botões de ação */}
            <div className="flex justify-end space-x-3 mt-8">
                    <button
                      onClick={() => {
                        setActiveTab('visualizar');
                        resetForm();
                      }}
                className="px-4 py-2 rounded-full shadow-sm text-sm font-medium"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: theme.colors.textPrimary
                }}
              >
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                              </svg>
                  Voltar para o Cultivo
                  </div>
              </button>
            </div>
          </div>
        </div>
      )}
      
        {/* Modal para adicionar registros/fotos/produtos */}
      {showModal && (
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
                  <h3 className="text-xl font-bold text-white">
                    {modalType === 'registro' && 'Adicionar Registro Semanal'}
                    {modalType === 'produto' && 'Adicionar Produto'}
                    {modalType === 'foto' && 'Adicionar Foto'}
                  </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
                {/* Conteúdo do modal para diferentes tipos */}
            {modalType === 'registro' && (
              <form onSubmit={handleRegistroSubmit}>
                    {/* Formulário básico de registro */}
                    <div className="mb-4">
                      <label htmlFor="fase" className="block text-sm font-medium mb-1" style={{ color: theme.colors.textSecondary }}>
                        Fase do Cultivo *
                      </label>
                      <select
                        id="fase"
                        value={registroFase}
                        onChange={(e) => setRegistroFase(e.target.value as 'germinacao' | 'vegetativo' | 'floracao')}
                        className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        style={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.07)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          color: theme.colors.textPrimary
                        }}
                        required
                      >
                        <option value="">Selecione a fase</option>
                        <option value="germinacao">Germinação</option>
                        <option value="vegetativo">Vegetativo</option>
                        <option value="floracao">Floração</option>
                      </select>
                    </div>
                    
                    <div className="mb-4">
                      <label htmlFor="semana" className="block text-sm font-medium mb-1" style={{ color: theme.colors.textSecondary }}>
                        Semana do Cultivo *
                      </label>
                      <input
                        id="semana"
                        type="number"
                        min="1"
                        value={registroSemana}
                        onChange={(e) => setRegistroSemana(parseInt(e.target.value))}
                        className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        style={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.07)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          color: theme.colors.textPrimary
                        }}
                        required
                      />
                </div>
                
                    {/* Seção de Crescimento */}
                    <div className="mt-8 border-t border-gray-700 pt-6">
                      <h4 className="text-lg font-medium text-white mb-4">Crescimento da Planta</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                          <label htmlFor="altura" className="block text-sm font-medium mb-1" style={{ color: theme.colors.textSecondary }}>
                          Altura (cm)
                        </label>
                        <input
                            id="altura"
                          type="number"
                          step="0.1"
                          min="0"
                            value={registroAltura || ''}
                          onChange={(e) => setRegistroAltura(e.target.value)}
                            className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                          style={{ 
                              backgroundColor: 'rgba(255, 255, 255, 0.07)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              color: theme.colors.textPrimary
                          }}
                        />
                      </div>
                    
                      <div>
                          <label htmlFor="aroma" className="block text-sm font-medium mb-1" style={{ color: theme.colors.textSecondary }}>
                            Aroma
                        </label>
                        <input
                            id="aroma"
                            type="text"
                            value={registroAroma || ''}
                            onChange={(e) => setRegistroAroma(e.target.value)}
                            className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                          style={{ 
                              backgroundColor: 'rgba(255, 255, 255, 0.07)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              color: theme.colors.textPrimary
                          }}
                            placeholder="Descreva o aroma percebido"
                        />
                      </div>
                      </div>
                    </div>

                    {/* Seção de Ambiente */}
                    <div className="mt-8 border-t border-gray-700 pt-6">
                      <h4 className="text-lg font-medium text-white mb-4">Ambiente</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                          <label htmlFor="temperatura" className="block text-sm font-medium mb-1" style={{ color: theme.colors.textSecondary }}>
                            Temperatura (°C)
                      </label>
                      <input
                            id="temperatura"
                        type="number"
                        step="0.1"
                        min="0"
                            value={registroTemperatura || ''}
                            onChange={(e) => setRegistroTemperatura(e.target.value)}
                            className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        style={{ 
                              backgroundColor: 'rgba(255, 255, 255, 0.07)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              color: theme.colors.textPrimary
                        }}
                      />
                    </div>
                    
                    <div>
                          <label htmlFor="umidade" className="block text-sm font-medium mb-1" style={{ color: theme.colors.textSecondary }}>
                            Umidade (%)
                      </label>
                      <input
                            id="umidade"
                        type="number"
                        step="0.1"
                        min="0"
                            max="100"
                            value={registroUmidade || ''}
                            onChange={(e) => setRegistroUmidade(e.target.value)}
                            className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        style={{ 
                              backgroundColor: 'rgba(255, 255, 255, 0.07)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              color: theme.colors.textPrimary
                        }}
                      />
                    </div>
                    
                    <div>
                          <label htmlFor="vpd" className="block text-sm font-medium mb-1" style={{ color: theme.colors.textSecondary }}>
                            VPD (kPa)
                      </label>
                      <input
                            id="vpd"
                        type="number"
                            step="0.01"
                            min="0"
                            value={registroVpd || ''}
                            onChange={(e) => setRegistroVpd(e.target.value)}
                            className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        style={{ 
                              backgroundColor: 'rgba(255, 255, 255, 0.07)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              color: theme.colors.textPrimary
                        }}
                      />
                    </div>
                    
                    <div>
                          <label htmlFor="horas_luz" className="block text-sm font-medium mb-1" style={{ color: theme.colors.textSecondary }}>
                            Horas de Luz
                      </label>
                      <input
                            id="horas_luz"
                        type="number"
                            step="0.5"
                        min="0"
                            max="24"
                            value={registroHorasLuz || ''}
                            onChange={(e) => setRegistroHorasLuz(e.target.value)}
                            className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        style={{ 
                              backgroundColor: 'rgba(255, 255, 255, 0.07)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              color: theme.colors.textPrimary
                        }}
                      />
                        </div>
                      </div>
                    </div>
                    
                    {/* Seção de Solução */}
                    <div className="mt-8 border-t border-gray-700 pt-6">
                      <h4 className="text-lg font-medium text-white mb-4">Solução Nutritiva</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                          <label htmlFor="ph" className="block text-sm font-medium mb-1" style={{ color: theme.colors.textSecondary }}>
                            pH
                        </label>
                        <input
                            id="ph"
                          type="number"
                            step="0.1"
                          min="0"
                            max="14"
                            value={registroPh || ''}
                            onChange={(e) => setRegistroPh(e.target.value)}
                            className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                          style={{ 
                              backgroundColor: 'rgba(255, 255, 255, 0.07)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              color: theme.colors.textPrimary
                          }}
                        />
                      </div>
                    
                      <div>
                          <label htmlFor="ec" className="block text-sm font-medium mb-1" style={{ color: theme.colors.textSecondary }}>
                            EC (mS/cm)
                        </label>
                        <input
                            id="ec"
                          type="number"
                          step="0.1"
                            min="0"
                            value={registroEc || ''}
                            onChange={(e) => setRegistroEc(e.target.value)}
                            className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                          style={{ 
                              backgroundColor: 'rgba(255, 255, 255, 0.07)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              color: theme.colors.textPrimary
                          }}
                        />
                      </div>
                    
                      <div>
                          <label htmlFor="temperatura_solucao" className="block text-sm font-medium mb-1" style={{ color: theme.colors.textSecondary }}>
                            Temperatura Solução (°C)
                        </label>
                        <input
                            id="temperatura_solucao"
                          type="number"
                            step="0.1"
                          min="0"
                            value={registroTempSolucao || ''}
                            onChange={(e) => setRegistroTempSolucao(e.target.value)}
                            className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                          style={{ 
                              backgroundColor: 'rgba(255, 255, 255, 0.07)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              color: theme.colors.textPrimary
                          }}
                        />
                      </div>
                    
                      <div>
                          <label htmlFor="volume_reservatorio" className="block text-sm font-medium mb-1" style={{ color: theme.colors.textSecondary }}>
                            Volume Reservatório (L)
                        </label>
                        <input
                            id="volume_reservatorio"
                          type="number"
                            step="0.1"
                          min="0"
                            value={registroVolumeReservatorio || ''}
                            onChange={(e) => setRegistroVolumeReservatorio(e.target.value)}
                            className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                          style={{ 
                              backgroundColor: 'rgba(255, 255, 255, 0.07)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              color: theme.colors.textPrimary
                          }}
                        />
                      </div>
                      </div>
                    </div>

                    {/* Seção de Técnicas Aplicadas */}
                    <div className="mt-8 border-t border-gray-700 pt-6">
                      <h4 className="text-lg font-medium text-white mb-4">Técnicas Aplicadas</h4>
                      
                      <div>
                        <label htmlFor="tecnicas_aplicadas" className="block text-sm font-medium mb-1" style={{ color: theme.colors.textSecondary }}>
                          Técnicas de Cultivo
                        </label>
                        <textarea
                          id="tecnicas_aplicadas"
                          rows={3}
                          value={registroTecnicas || ''}
                          onChange={(e) => setRegistroTecnicas(e.target.value)}
                          className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                          style={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.07)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: theme.colors.textPrimary
                          }}
                          placeholder="Descreva as técnicas aplicadas nesta semana (poda, defoliação, treinamento, etc.)"
                        />
                      </div>
                    </div>

                    {/* Seção de Fotos do Cultivo */}
                    <div className="mt-8 border-t border-gray-700 pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-medium text-white">Fotos do Cultivo</h4>
                        <label 
                          htmlFor="upload-foto"
                          className="px-3 py-1.5 rounded-full text-xs font-medium transition-all transform hover:scale-105 cursor-pointer"
                          style={{ 
                            background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.accent})`,
                            color: 'black',
                            fontWeight: 'bold',
                            boxShadow: '0 2px 8px rgba(127, 219, 63, 0.3)'
                          }}
                        >
                          <div className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                            </svg>
                            Adicionar Foto
                          </div>
                        </label>
                        <input
                          id="upload-foto"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileSelect}
                          multiple
                        />
                      </div>
                      
                      {registroFotos.length === 0 ? (
                        <div className="p-4 rounded-lg text-center mb-4"
                          style={{ 
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid rgba(255, 255, 255, 0.05)'
                          }}>
                          <p style={{ color: theme.colors.textSecondary }}>Nenhuma foto adicionada ainda. Clique em "Adicionar Foto" para incluir fotos do seu cultivo.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {registroFotos.map((foto, index) => (
                            <div key={index} className="relative rounded-lg overflow-hidden"
                              style={{ 
                                background: 'rgba(255, 255, 255, 0.03)',
                                border: '1px solid rgba(255, 255, 255, 0.05)'
                              }}>
                              <div className="relative pt-[100%]"> {/* Aspect ratio 1:1 */}
                                <img 
                                  src={foto.url || foto.url_imagem} 
                                  alt={`Foto ${index + 1}`}
                                  className="absolute inset-0 w-full h-full object-cover"
                                />
                              </div>
                              <div className="p-3">
                        <input
                          type="text"
                                  value={foto.descricao}
                                  onChange={(e) => atualizarDescricaoFoto(index, e.target.value)}
                                  className="w-full px-2 py-1 text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 mb-2"
                          style={{ 
                                    backgroundColor: 'rgba(255, 255, 255, 0.07)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    color: theme.colors.textPrimary
                                  }}
                                  placeholder="Descrição da foto"
                                />
                                <button 
                                  type="button" 
                                  onClick={() => removerFoto(index)}
                                  className="w-full text-red-400 hover:text-red-300 text-xs flex items-center justify-center"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                  </svg>
                                  Remover
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                    
                    {/* Observações */}
                    <div className="mt-8 border-t border-gray-700 pt-6">
                      <label htmlFor="observacoes" className="block text-sm font-medium mb-1" style={{ color: theme.colors.textSecondary }}>
                        Observações
                      </label>
                      <textarea
                        id="observacoes"
                        rows={3}
                        value={registroObservacoes || ''}
                        onChange={(e) => setRegistroObservacoes(e.target.value)}
                        className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        style={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.07)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          color: theme.colors.textPrimary
                        }}
                        placeholder="Observações adicionais sobre esta semana de cultivo"
                      />
                </div>
                
                    {/* Seção de Produtos */}
                    <div className="mt-8 border-t border-gray-700 pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-medium text-white">Produtos Utilizados</h4>
                    <button
                      type="button"
                      onClick={adicionarProduto}
                          className="px-3 py-1.5 rounded-full text-xs font-medium transition-all transform hover:scale-105"
                          style={{ 
                            background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.accent})`,
                            color: 'black',
                            fontWeight: 'bold',
                            boxShadow: '0 2px 8px rgba(127, 219, 63, 0.3)'
                          }}
                        >
                          <div className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                            Adicionar Produto
                          </div>
                    </button>
                  </div>
                  
                  {registroProdutos.length === 0 ? (
                        <div className="p-4 rounded-lg text-center mb-4"
                          style={{ 
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid rgba(255, 255, 255, 0.05)'
                          }}>
                          <p style={{ color: theme.colors.textSecondary }}>Nenhum produto adicionado ainda. Clique em "Adicionar Produto" para incluir produtos utilizados neste registro.</p>
                        </div>
                      ) : (
                        registroProdutos.map((produto, index) => (
                          <div key={index} className="mb-4 p-4 rounded-lg"
                            style={{ 
                              background: 'rgba(255, 255, 255, 0.03)',
                              border: '1px solid rgba(255, 255, 255, 0.05)'
                            }}>
                            <div className="flex justify-between mb-3">
                              <h5 className="text-sm font-medium text-white">Produto {index + 1}</h5>
                            <button
                              type="button"
                              onClick={() => removerProduto(index)}
                              className="text-red-400 hover:text-red-300"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>
                          
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor={`produto-nome-${index}`} className="block text-sm font-medium mb-1" style={{ color: theme.colors.textSecondary }}>
                                  Nome do Produto *
                                </label>
                              <input
                                  id={`produto-nome-${index}`}
                                type="text"
                                value={produto.nome}
                                onChange={(e) => atualizarProduto(index, 'nome', e.target.value)}
                                  className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                  style={{ 
                                    backgroundColor: 'rgba(255, 255, 255, 0.07)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    color: theme.colors.textPrimary
                                  }}
                                required
                              />
                            </div>
                              
                            <div>
                                <label htmlFor={`produto-fabricante-${index}`} className="block text-sm font-medium mb-1" style={{ color: theme.colors.textSecondary }}>
                                  Fabricante
                                </label>
                              <input
                                  id={`produto-fabricante-${index}`}
                                type="text"
                                  value={produto.fabricante || ''}
                                onChange={(e) => atualizarProduto(index, 'fabricante', e.target.value)}
                                  className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                  style={{ 
                                    backgroundColor: 'rgba(255, 255, 255, 0.07)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    color: theme.colors.textPrimary
                                  }}
                              />
                            </div>
                              
                            <div>
                                <label htmlFor={`produto-categoria-${index}`} className="block text-sm font-medium mb-1" style={{ color: theme.colors.textSecondary }}>
                                  Categoria
                                </label>
                              <input
                                  id={`produto-categoria-${index}`}
                                type="text"
                                  value={produto.categoria || ''}
                                onChange={(e) => atualizarProduto(index, 'categoria', e.target.value)}
                                  className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                  style={{ 
                                    backgroundColor: 'rgba(255, 255, 255, 0.07)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    color: theme.colors.textPrimary
                                  }}
                              />
                            </div>
                              
                            <div>
                                <label htmlFor={`produto-dosagem-${index}`} className="block text-sm font-medium mb-1" style={{ color: theme.colors.textSecondary }}>
                                  Dosagem
                                </label>
                              <input
                                  id={`produto-dosagem-${index}`}
                                type="text"
                                  value={produto.dosagem || ''}
                                onChange={(e) => atualizarProduto(index, 'dosagem', e.target.value)}
                                  className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    style={{ 
                                    backgroundColor: 'rgba(255, 255, 255, 0.07)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    color: theme.colors.textPrimary
                                  }}
                                  placeholder="Ex: 5ml/L"
                  />
                </div>
                </div>
                    </div>
                        ))
                  )}
                </div>
                
                  <button
                    type="submit"
                      className="w-full mt-6 px-5 py-3 rounded-lg shadow-sm font-medium transition-all transform hover:scale-105"
                    style={{ 
                        background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.accent})`,
                        color: 'black',
                        fontWeight: 'bold',
                      boxShadow: '0 4px 10px rgba(127, 219, 63, 0.3)'
                    }}
                  >
                    Salvar Registro
                  </button>
              </form>
            )}
              </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
} 