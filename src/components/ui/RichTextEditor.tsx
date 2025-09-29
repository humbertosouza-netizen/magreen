'use client';

import React, { useRef, useEffect, useState } from 'react';
import theme from '@/styles/theme';
import { useWordImageUploader } from './WordImageUploader';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  theme?: any;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Escreva o conteúdo completo do post...",
  theme: themeProp
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null);
  const [showImageControls, setShowImageControls] = useState(false);
  const [processingImages, setProcessingImages] = useState(false);
  const [activeTab, setActiveTab] = useState<'visual' | 'html' | 'links'>('visual');
  const [htmlValue, setHtmlValue] = useState(value);
  const [editingLinkIndex, setEditingLinkIndex] = useState<number | null>(null);
  const [editingLinkValue, setEditingLinkValue] = useState('');
  const [linksCache, setLinksCache] = useState<Array<{ 
    src: string; 
    alt: string; 
    index: number; 
    type: 'supabase' | 'external' | 'empty';
    originalSrc: string;
  }>>([]);
  // Estado do modal de carrossel
  const [isCarouselModalOpen, setIsCarouselModalOpen] = useState(false);
  const [carouselCandidates, setCarouselCandidates] = useState<Array<{ src: string; alt: string; index: number }>>([]);
  const [selectedCarousel, setSelectedCarousel] = useState<string[]>([]);
  // Modal de URLs para carrossel
  const [isUrlCarouselModalOpen, setIsUrlCarouselModalOpen] = useState(false);
  const [urlFields, setUrlFields] = useState<string[]>(['']);
  // Modal de carrossel vazio (slots)
  const [isEmptyCarouselModalOpen, setIsEmptyCarouselModalOpen] = useState(false);
  const [emptySlots, setEmptySlots] = useState<number>(3);
  // Fileiras de imagens detectadas (para transformar em carrossel)
  const [imageRows, setImageRows] = useState<Array<{
    id: string;
    type: 'table' | 'inline';
    srcs: string[];
    tableIndex?: number;
    containerIndex?: number;
    start?: number;
    length?: number;
  }>>([]);
  // Fileiras já criadas (carrosséis detectados)
  const [createdRows, setCreatedRows] = useState<Array<{ id: string; srcs: string[] }>>([]);
  // Evitar clique duplo durante transformação
  const [transformingRowId, setTransformingRowId] = useState<string | null>(null);
  // Modal de substituição em sequência (externos -> Supabase)
  const [isBulkReplaceOpen, setIsBulkReplaceOpen] = useState(false);
  const [bulkReplaceText, setBulkReplaceText] = useState('');
  const { processWordImages } = useWordImageUploader();
  // Helper para inserir HTML no cursor com fallback
  const insertHtmlAtCursor = (html: string) => {
    try {
      // Garantir foco no editor
      editorRef.current?.focus();
      const supported = document.queryCommandSupported && document.queryCommandSupported('insertHTML');
      if (supported) {
        const ok = document.execCommand('insertHTML', false, html);
        if (!ok) {
          // Fallback para append
          if (editorRef.current) {
            editorRef.current.innerHTML = (editorRef.current.innerHTML || '') + html;
          }
        }
      } else {
        if (editorRef.current) {
          editorRef.current.innerHTML = (editorRef.current.innerHTML || '') + html;
        }
      }
    } catch (e) {
      if (editorRef.current) {
        editorRef.current.innerHTML = (editorRef.current.innerHTML || '') + html;
      }
    }
    // Atualizar estados
    handleInput();
  };

  // Aplicar comandos de formatação
  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  // Função para limpar HTML do Word
  const cleanWordHtml = (html: string) => {
    return html
      .replace(/<o:p>/g, '')
      .replace(/<\/o:p>/g, '')
      .replace(/<w:/g, '')
      .replace(/<\/w:/g, '')
      .replace(/xmlns:[^=]*="[^"]*"/g, '')
      .replace(/xmlns="[^"]*"/g, '')
      .replace(/class="[^"]*"/g, '')
      .replace(/style="[^"]*"/g, '')
      .replace(/<span[^>]*>/g, '')
      .replace(/<\/span>/g, '')
      .replace(/<p[^>]*>/g, '<p>')
      .replace(/<div[^>]*>/g, '<div>')
      .replace(/<br[^>]*>/g, '<br>')
      .replace(/<!--\[if[^>]*>([\s\S]*?)<!\[endif\]-->/g, '')
      .replace(/<v:[^>]*>([\s\S]*?)<\/v:[^>]*>/g, '')
      .replace(/<m:[^>]*>([\s\S]*?)<\/m:[^>]*>/g, '')
      .replace(/<xml[^>]*>([\s\S]*?)<\/xml>/g, '')
      .replace(/<![^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Lidar com colagem
  const handlePaste = async (e: React.ClipboardEvent) => {
    e.preventDefault();
    
    // Tentar obter HTML primeiro (inclui imagens)
    let html = e.clipboardData.getData('text/html');
    let text = e.clipboardData.getData('text/plain');
    
    if (html) {
      setProcessingImages(true);
      
      try {
        // Processar imagens do Word e fazer upload
        const processedHtml = await processWordImages(html, (uploadedUrl, originalSrc) => {
          console.log('Imagem do Word enviada:', uploadedUrl);
        });
        
        // Limpar HTML e inserir
        const cleanText = cleanWordHtml(processedHtml);
        document.execCommand('insertHTML', false, cleanText);
      } catch (error) {
        console.error('Erro ao processar imagens do Word:', error);
        // Fallback: inserir HTML original limpo
        const cleanText = cleanWordHtml(html);
        document.execCommand('insertHTML', false, cleanText);
      } finally {
        setProcessingImages(false);
      }
    } else if (text) {
      // Se não há HTML, inserir como texto simples
      document.execCommand('insertText', false, text);
    }
  };

  // Atualizar valor quando o conteúdo mudar
  const handleInput = () => {
    if (editorRef.current) {
      // Aplicar justificação a novos parágrafos
      const paragraphs = editorRef.current.querySelectorAll('p');
      paragraphs.forEach(p => {
        if (!p.style.textAlign || p.style.textAlign !== 'justify') {
          p.style.textAlign = 'justify';
          (p.style as any).textJustify = 'inter-word';
          p.style.hyphens = 'auto';
        }
      });

      const newValue = editorRef.current.innerHTML;
      onChange(newValue);
      setHtmlValue(newValue);
      // Atualizar Links e Fileiras imediatamente para refletir no Preview/Links
      try {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = newValue;
        const images = tempDiv.querySelectorAll('img');
        const links = Array.from(images).map((img, idx) => {
          const src = img.getAttribute('src');
          const alt = img.getAttribute('alt') || `Imagem ${idx + 1}`;
          if (src && src.trim() !== '') {
            const isSupabase = src.includes('supabase.co') || src.includes('blog-conteudo');
            return { src: src.trim(), alt, index: idx + 1, type: isSupabase ? 'supabase' : 'external', originalSrc: src.trim() };
          }
          return { src: '', alt, index: idx + 1, type: 'empty', originalSrc: '' };
        });
        setLinksCache(links as any);
        detectImageRows();
        detectCreatedRows();
      } catch {}
    }
  };

  // Sincronizar valor externo
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      // Limpar HTML do Word se presente
      const cleanedValue = value.includes('<!--[if') ? cleanWordHtml(value) : value;
      editorRef.current.innerHTML = cleanedValue;
    }
    setHtmlValue(value);
    
    // Atualizar cache de links quando o valor mudar
    const newLinks = extractImageLinks();
    setLinksCache(newLinks);
    detectCreatedRows();
  }, [value]);

  // Aplicar justificação por padrão quando o editor for focado pela primeira vez
  useEffect(() => {
    const handleFirstFocus = () => {
      if (editorRef.current && !editorRef.current.dataset.justified) {
        // Aplicar justificação a todos os parágrafos existentes
        const paragraphs = editorRef.current.querySelectorAll('p');
        paragraphs.forEach(p => {
          p.style.textAlign = 'justify';
          (p.style as any).textJustify = 'inter-word';
          p.style.hyphens = 'auto';
        });
        
        // Marcar como justificado
        editorRef.current.dataset.justified = 'true';
      }
    };

    const editor = editorRef.current;
    if (editor) {
      editor.addEventListener('focus', handleFirstFocus, { once: true });
    }

    return () => {
      if (editor) {
        editor.removeEventListener('focus', handleFirstFocus);
      }
    };
  }, []);

  // Lidar com clique em imagens
  const handleImageClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLImageElement;
    if (target.tagName === 'IMG') {
      setSelectedImage(target);
      setShowImageControls(true);
    } else {
      setSelectedImage(null);
      setShowImageControls(false);
    }
  };

  // Redimensionar imagem
  const resizeImage = (width: number, height?: number) => {
    if (selectedImage) {
      selectedImage.style.width = `${width}px`;
      if (height) {
        selectedImage.style.height = `${height}px`;
      } else {
        selectedImage.style.height = 'auto';
      }
      handleInput();
    }
  };

  // Alinhar imagem
  const alignImage = (alignment: string) => {
    if (selectedImage) {
      selectedImage.style.display = 'block';
      selectedImage.style.margin = '1rem auto';
      
      switch (alignment) {
        case 'left':
          selectedImage.style.float = 'left';
          selectedImage.style.margin = '0 1rem 1rem 0';
          break;
        case 'center':
          selectedImage.style.float = 'none';
          selectedImage.style.margin = '1rem auto';
          break;
        case 'right':
          selectedImage.style.float = 'right';
          selectedImage.style.margin = '0 0 1rem 1rem';
          break;
      }
      handleInput();
    }
  };

  // Remover imagem
  const removeImage = () => {
    if (selectedImage) {
      selectedImage.remove();
      setSelectedImage(null);
      setShowImageControls(false);
      handleInput();
    }
  };

  // Lidar com mudança na aba HTML
  const handleHtmlChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newHtmlValue = e.target.value;
    setHtmlValue(newHtmlValue);
    onChange(newHtmlValue);
  };

  // Alternar entre abas
  const switchToVisual = () => {
    setActiveTab('visual');
    // Sincronizar HTML com o editor visual
    if (editorRef.current) {
      editorRef.current.innerHTML = htmlValue;
    }
  };

  const switchToHtml = () => {
    setActiveTab('html');
    // Sincronizar editor visual com HTML
    setHtmlValue(value);
  };

  const switchToLinks = () => {
    setActiveTab('links');
    // Atualizar cache de links ao entrar na aba
    const newLinks = extractImageLinks();
    setLinksCache(newLinks);
    detectImageRows();
    detectCreatedRows();
  };

  // Abrir modal de criação de carrossel com imagens do Supabase
  const openCarouselBuilder = () => {
    const images = (linksCache.length > 0 ? linksCache : extractImageLinks()).filter(l => l.type === 'supabase');
    const candidates = images.map(l => ({ src: l.src, alt: l.alt, index: l.index }));
    setCarouselCandidates(candidates);
    setSelectedCarousel([]);
    setIsCarouselModalOpen(true);
  };

  const toggleCarouselItem = (src: string) => {
    setSelectedCarousel(prev => prev.includes(src) ? prev.filter(s => s !== src) : [...prev, src]);
  };

  const moveCarouselItem = (src: string, direction: 'up' | 'down') => {
    setSelectedCarousel(prev => {
      const arr = [...prev];
      const idx = arr.indexOf(src);
      if (idx === -1) return arr;
      const swapWith = direction === 'up' ? idx - 1 : idx + 1;
      if (swapWith < 0 || swapWith >= arr.length) return arr;
      const temp = arr[swapWith];
      arr[swapWith] = arr[idx];
      arr[idx] = temp;
      return arr;
    });
  };

  const insertCarouselIntoEditor = () => {
    const urls = selectedCarousel;
    if (!urls || urls.length === 0) {
      setIsCarouselModalOpen(false);
      return;
    }
    const imagesHtml = urls.map((u, i) => `<img src="${u}" alt="Imagem ${i + 1}" />`).join('');
    const html = `
      <div class="simple-carousel" data-type="simple-carousel">
        <div class="simple-carousel-track">
          ${imagesHtml}
        </div>
      </div>
    `;
    insertHtmlAtCursor(html);
    setIsCarouselModalOpen(false);
  };

  // Substituir, em sequência, os <img> externos por URLs do Supabase fornecidas
  const bulkReplaceExternalWithSupabase = (urls: string[]) => {
    try {
      const currentHtml = value || '';
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = currentHtml;
      const imgs = Array.from(tempDiv.querySelectorAll('img')) as HTMLImageElement[];
      const externalImages = imgs
        .map((img, idx) => ({ img, idx }))
        .filter(({ img }) => {
          const src = img.getAttribute('src') || '';
          return !(src.includes('supabase.co') || src.includes('blog-conteudo'));
        });

      const count = Math.min(urls.length, externalImages.length);
      for (let i = 0; i < count; i++) {
        externalImages[i].img.setAttribute('src', urls[i]);
      }

      const updatedHtml = tempDiv.innerHTML;
      if (editorRef.current) editorRef.current.innerHTML = updatedHtml;
      onChange(updatedHtml);
      setHtmlValue(updatedHtml);
      setLinksCache(extractImageLinksFrom(updatedHtml));
      detectImageRows();
    } catch (e) {
      console.error('Erro na substituição em sequência:', e);
    }
  };

  // Função para extrair links das imagens
  const extractImageLinks = () => {
    try {
      // Usar o HTML atual do editor (value) em vez de depender do DOM
      const currentHtml = value || '';
      
      // Criar um elemento temporário para manipular o HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = currentHtml;
      
      const images = tempDiv.querySelectorAll('img');
      const links: Array<{ 
        src: string; 
        alt: string; 
        index: number; 
        type: 'supabase' | 'external' | 'empty';
        originalSrc: string;
      }> = [];
      
      images.forEach((img, index) => {
        const src = img.getAttribute('src');
        const alt = img.getAttribute('alt') || `Imagem ${index + 1}`;
        
        if (src && src.trim() !== '') {
          // Determinar se é link do Supabase ou externo
          const isSupabase = src.includes('supabase.co') || src.includes('blog-conteudo');
          const type = isSupabase ? 'supabase' : 'external';
          
          links.push({
            src: src.trim(),
            alt: alt.trim(),
            index: index + 1,
            type,
            originalSrc: src.trim()
          });
        } else {
          // Entrada vazia/pendente para permitir edição de link
          links.push({
            src: '',
            alt: alt.trim(),
            index: index + 1,
            type: 'empty',
            originalSrc: ''
          });
        }
      });
      
      return links;
    } catch (error) {
      console.error('Erro ao extrair links das imagens:', error);
      return [];
    }
  };

  // Função para atualizar link de imagem
  const updateImageLink = (index: number, newSrc: string) => {
    console.log('Atualizando link da imagem:', index, 'para:', newSrc);
    
    // Usar o HTML atual do editor (value) em vez de depender do DOM
    const currentHtml = value || '';
    
    // Criar um elemento temporário para manipular o HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = currentHtml;
    
    const images = tempDiv.querySelectorAll('img');
    const targetImage = images[index - 1]; // index é baseado em 1
    
    if (targetImage) {
      const oldSrc = targetImage.getAttribute('src');
      console.log('Encontrada imagem:', index, 'src atual:', oldSrc);
      
      // Atualizar o src da imagem
      targetImage.setAttribute('src', newSrc);
      
      // Obter o HTML atualizado
      const updatedHtml = tempDiv.innerHTML;
      
      // Atualizar o editor
      onChange(updatedHtml);
      setHtmlValue(updatedHtml);
      
      console.log('Imagem atualizada com sucesso');
    } else {
      console.error('Imagem não encontrada para atualizar:', index, 'Total de imagens:', images.length);
    }
  };

  // Função para iniciar edição de link
  const startEditingLink = (index: number, currentSrc: string) => {
    setEditingLinkIndex(index);
    setEditingLinkValue(currentSrc);
  };

  // Função para salvar edição de link
  const saveEditingLink = () => {
    if (editingLinkIndex && editingLinkValue.trim()) {
      console.log('Salvando link:', editingLinkIndex, 'para:', editingLinkValue.trim());
      
      // Atualizar o link da imagem
      updateImageLink(editingLinkIndex, editingLinkValue.trim());
      
      // Forçar atualização do cache após um pequeno delay
      setTimeout(() => {
        const newLinks = extractImageLinks();
        setLinksCache(newLinks);
        console.log('Cache atualizado após salvar:', newLinks);
      }, 100);
      
      // Limpar estado de edição
      setEditingLinkIndex(null);
      setEditingLinkValue('');
    }
  };

  // Função para cancelar edição de link
  const cancelEditingLink = () => {
    setEditingLinkIndex(null);
    setEditingLinkValue('');
  };

  // Função para forçar atualização do cache de links
  const extractImageLinksFrom = (html: string) => {
    try {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html || '';
      const images = tempDiv.querySelectorAll('img');
      const links: Array<{ src: string; alt: string; index: number; type: 'supabase' | 'external' | 'empty'; originalSrc: string }>=[];
      images.forEach((img, index) => {
        const src = img.getAttribute('src');
        const alt = img.getAttribute('alt') || `Imagem ${index + 1}`;
        if (src && src.trim() !== '') {
          const isSupabase = src.includes('supabase.co') || src.includes('blog-conteudo');
          const type = isSupabase ? 'supabase' : 'external';
          links.push({ src: src.trim(), alt: alt.trim(), index: index + 1, type, originalSrc: src.trim() });
        } else {
          links.push({ src: '', alt: alt.trim(), index: index + 1, type: 'empty', originalSrc: '' });
        }
      });
      return links;
    } catch {
      return [];
    }
  };

  const refreshLinksCache = () => {
    const newLinks = extractImageLinks();
    setLinksCache(newLinks);
    detectImageRows();
    detectCreatedRows();
  };

  const arraysEqual = (a: string[], b: string[]) => a.length === b.length && a.every((v, i) => v === b[i]);

  const detectImageRows = () => {
    try {
      const temp = document.createElement('div');
      temp.innerHTML = value || '';
      const rows: Array<{ id: string; type: 'table' | 'inline'; srcs: string[]; tableIndex?: number; containerIndex?: number; start?: number; length?: number; }> = [];

      // Tabelas com várias imagens
      const tables = Array.from(temp.querySelectorAll('table'));
      tables.forEach((table, idx) => {
        const srcs = Array.from(table.querySelectorAll('img')).map(img => img.getAttribute('src') || '').filter(Boolean);
        if (srcs.length > 1) rows.push({ id: `table-${idx}`, type: 'table', srcs, tableIndex: idx });
      });

      // Blocos inline com imagens consecutivas
      const candidates = Array.from(temp.querySelectorAll('div, p, section, article, figure'));
      candidates.forEach((container, cidx) => {
        // Ignorar containers que já contenham um carrossel simples
        if (container.querySelector('.simple-carousel')) return;
        const children = Array.from(container.childNodes);
        let buf: string[] = [];
        let runStart = -1;
        const flush = () => {
          if (buf.length > 1 && runStart >= 0) {
            rows.push({ id: `inline-${cidx}-${rows.length}`, type: 'inline', srcs: [...buf], containerIndex: cidx, start: runStart, length: buf.length });
          }
          buf = []; runStart = -1;
        };
        children.forEach(n => {
          if (n.nodeType === 1 && (n as Element).tagName === 'IMG') {
            const src = (n as HTMLImageElement).getAttribute('src') || '';
            if (src) { if (runStart === -1) runStart = children.indexOf(n); buf.push(src); }
          } else {
            flush();
          }
        });
        flush();
      });

      setImageRows(rows);
    } catch {
      setImageRows([]);
    }
  };

  // Detectar fileiras já criadas (carrosséis) no HTML atual
  const detectCreatedRows = (htmlOverride?: string) => {
    try {
      const temp = document.createElement('div');
      temp.innerHTML = htmlOverride ?? (value || '');
      const carousels = Array.from(temp.querySelectorAll('.simple-carousel')) as HTMLElement[];
      const list: Array<{ id: string; srcs: string[] }> = carousels.map((wrapper, idx) => {
        const imgs = Array.from(wrapper.querySelectorAll('.simple-carousel-track img')) as HTMLImageElement[];
        const srcs = imgs.map(i => i.getAttribute('src') || '').filter(Boolean);
        return { id: `created-${idx}`, srcs };
      });
      setCreatedRows(list);
    } catch {
      setCreatedRows([]);
    }
  };

  const transformRowToCarousel = (row: { id: string; type: 'table' | 'inline'; srcs: string[]; tableIndex?: number; containerIndex?: number; start?: number; length?: number; }) => {
    try {
      if (transformingRowId) return; // já processando alguma fileira
      setTransformingRowId(row.id);
      const temp = document.createElement('div');
      temp.innerHTML = value || '';
      let transformed = false;

      if (row.type === 'table') {
        // Encontrar a tabela pelo conjunto exato de imagens (ordem)
        const tables = Array.from(temp.querySelectorAll('table')) as HTMLTableElement[];
        for (const t of tables) {
          const srcs = Array.from(t.querySelectorAll('img')).map(i => i.getAttribute('src') || '').filter(Boolean);
          if (arraysEqual(srcs, row.srcs)) {
            const wrapper = document.createElement('div');
            wrapper.className = 'simple-carousel';
            const track = document.createElement('div');
            track.className = 'simple-carousel-track';
            row.srcs.forEach((s, i) => { const img = document.createElement('img'); img.src = s; img.alt = `Imagem ${i + 1}`; track.appendChild(img); });
            wrapper.appendChild(track);
            t.parentNode?.replaceChild(wrapper, t);
            transformed = true;
            break;
          }
        }
      } else {
        // Localizar a sequência exata de <img> consecutivos com os mesmos srcs
        const containers = Array.from(temp.querySelectorAll('div, p, section, article, figure')) as HTMLElement[];
        outer: for (const container of containers) {
          if (container.querySelector('.simple-carousel')) continue;
          const children = Array.from(container.childNodes);
          let run: { startIndex: number; nodes: HTMLImageElement[]; srcs: string[] } | null = null;
          const flush = () => {
            if (run && run.srcs.length > 1) {
              if (arraysEqual(run.srcs, row.srcs)) {
                const wrapper = document.createElement('div');
                wrapper.className = 'simple-carousel';
                const track = document.createElement('div');
                track.className = 'simple-carousel-track';
                row.srcs.forEach((s, idx) => { const img = document.createElement('img'); img.src = s; img.alt = `Imagem ${idx + 1}`; track.appendChild(img); });
                wrapper.appendChild(track);
                container.insertBefore(wrapper, run.nodes[0]);
                run.nodes.forEach(n => n.remove());
                transformed = true;
              }
            }
            run = null;
          };
          for (let i = 0; i < children.length; i++) {
            const n = children[i];
            if (n.nodeType === 1 && (n as Element).tagName === 'IMG') {
              const img = n as HTMLImageElement;
              const s = img.getAttribute('src') || '';
              if (!run) run = { startIndex: i, nodes: [], srcs: [] };
              run.nodes.push(img);
              if (s) run.srcs.push(s);
            } else {
              // Fim da sequência de imagens
              flush();
              if (transformed) break outer;
            }
          }
          // Final do container
          flush();
          if (transformed) break;
        }
      }

      if (transformed) {
        const html = temp.innerHTML;
        if (editorRef.current) editorRef.current.innerHTML = html;
        onChange(html);
        setHtmlValue(html);
        setLinksCache(extractImageLinksFrom(html));
        // Recalcular fileiras com o HTML atualizado
        try {
          const temp2 = document.createElement('div');
          temp2.innerHTML = html;
          const rowsNew: Array<{ id: string; type: 'table' | 'inline'; srcs: string[]; tableIndex?: number; containerIndex?: number; start?: number; length?: number; }> = [];
          const tables2 = Array.from(temp2.querySelectorAll('table'));
          tables2.forEach((table, idx2) => {
            const srcs = Array.from(table.querySelectorAll('img')).map(i => i.getAttribute('src') || '').filter(Boolean);
            if (srcs.length > 1) rowsNew.push({ id: `table-${idx2}`, type: 'table', srcs, tableIndex: idx2 });
          });
          const candidates2 = Array.from(temp2.querySelectorAll('div, p, section, article, figure'));
          candidates2.forEach((container, cidx2) => {
            if ((container as HTMLElement).querySelector('.simple-carousel')) return;
            const children = Array.from(container.childNodes);
            let buf: string[] = []; let runStart=-1;
            const flush=()=>{ if(buf.length>1 && runStart>=0){ rowsNew.push({ id:`inline-${cidx2}-${rowsNew.length}`, type:'inline', srcs:[...buf], containerIndex:cidx2, start:runStart, length:buf.length}); } buf=[]; runStart=-1; };
            children.forEach(n=>{ if(n.nodeType===1 && (n as Element).tagName==='IMG'){ const s=(n as HTMLImageElement).getAttribute('src')||''; if(s){ if(runStart===-1) runStart=children.indexOf(n); buf.push(s);} } else { flush(); } });
            flush();
          });
          setImageRows(rowsNew);
          // Se a row recém-transformada ainda aparecer por erro de index, filtrar pelo conteúdo
          setImageRows(prev => prev.filter(r => !arraysEqual(r.srcs, row.srcs)));
          // Atualizar lista de fileiras criadas
          detectCreatedRows(html);
        } catch { setImageRows([]); }
      } else {
        alert('Não foi possível localizar essa fileira no conteúdo atual.');
      }
    } catch (e) { console.error('Erro ao transformar fileira:', e); }
    finally { setTransformingRowId(null); }
  };

  // Inserir carrossel de imagens (molde via tabela)
  // Abrir modal de URLs
  const openUrlCarouselModal = () => {
    setUrlFields(['', '', '']);
    setIsUrlCarouselModalOpen(true);
  };

  const addUrlField = () => setUrlFields(prev => [...prev, '']);
  const removeUrlField = (idx: number) => setUrlFields(prev => prev.filter((_, i) => i !== idx));
  const updateUrlField = (idx: number, value: string) => setUrlFields(prev => prev.map((v, i) => (i === idx ? value : v)));
  const moveUrlField = (idx: number, dir: 'up' | 'down') => setUrlFields(prev => {
    const arr = [...prev];
    const swap = dir === 'up' ? idx - 1 : idx + 1;
    if (swap < 0 || swap >= arr.length) return arr;
    const t = arr[swap];
    arr[swap] = arr[idx];
    arr[idx] = t;
    return arr;
  });

  const bulkPasteUrls = (text: string) => {
    const urls = text
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    if (urls.length > 0) setUrlFields(urls);
  };

  const insertUrlCarousel = () => {
    const urls = urlFields.map(s => s.trim()).filter(Boolean);
    if (urls.length === 0) {
      setIsUrlCarouselModalOpen(false);
      return;
    }
    const imagesHtml = urls.map((u, i) => `<img src="${u}" alt="Imagem ${i + 1}" />`).join('');
    const html = `
      <div class="simple-carousel" data-type="simple-carousel">
        <div class="simple-carousel-track">
          ${imagesHtml}
        </div>
      </div>
    `;
    insertHtmlAtCursor(html);
    setIsUrlCarouselModalOpen(false);
  };

  // Botões da barra de ferramentas
  const ToolbarButton = ({ 
    onClick, 
    children, 
    title, 
    active = false 
  }: { 
    onClick: () => void; 
    children: React.ReactNode; 
    title: string; 
    active?: boolean;
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`toolbar-btn ${active ? 'active' : ''}`}
    >
      {children}
    </button>
  );

  return (
    <div className="rich-text-editor">
      {/* Abas de edição */}
      <div className="editor-tabs">
        <button
          type="button"
          onClick={switchToVisual}
          className={`tab-btn ${activeTab === 'visual' ? 'active' : ''}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
          </svg>
          Visual
        </button>
        <button
          type="button"
          onClick={switchToHtml}
          className={`tab-btn ${activeTab === 'html' ? 'active' : ''}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          HTML
        </button>
        <button
          type="button"
          onClick={switchToLinks}
          className={`tab-btn ${activeTab === 'links' ? 'active' : ''}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
          </svg>
          Links
        </button>
      </div>

      {/* Barra de ferramentas (apenas na aba visual) */}
      {activeTab === 'visual' && (
        <>
          <div className="toolbar">
            <div className="toolbar-group">
              <ToolbarButton 
                onClick={() => execCommand('formatBlock', '<h1>')} 
                title="Título 1"
              >
                H1
              </ToolbarButton>
              <ToolbarButton 
                onClick={() => execCommand('formatBlock', '<h2>')} 
                title="Título 2"
              >
                H2
              </ToolbarButton>
              <ToolbarButton 
                onClick={() => execCommand('formatBlock', '<h3>')} 
                title="Título 3"
              >
                H3
              </ToolbarButton>
            </div>

            <div className="toolbar-group">
              <ToolbarButton 
                onClick={() => execCommand('bold')} 
                title="Negrito"
              >
                <strong>B</strong>
              </ToolbarButton>
              <ToolbarButton 
                onClick={() => execCommand('italic')} 
                title="Itálico"
              >
                <em>I</em>
              </ToolbarButton>
              <ToolbarButton 
                onClick={() => execCommand('underline')} 
                title="Sublinhado"
              >
                <u>U</u>
              </ToolbarButton>
              <ToolbarButton 
                onClick={() => execCommand('strikeThrough')} 
                title="Tachado"
              >
                <s>S</s>
              </ToolbarButton>
            </div>

            <div className="toolbar-group">
              <ToolbarButton 
                onClick={openUrlCarouselModal}
                title="Criar carrossel a partir de links (modal)"
              >
                Carrossel
              </ToolbarButton>
            </div>

            <div className="toolbar-group">
              <ToolbarButton 
                onClick={() => execCommand('insertUnorderedList')} 
                title="Lista não ordenada"
              >
                • Lista
              </ToolbarButton>
              <ToolbarButton 
                onClick={() => execCommand('insertOrderedList')} 
                title="Lista ordenada"
              >
                1. Lista
              </ToolbarButton>
            </div>

            <div className="toolbar-group">
              <ToolbarButton 
                onClick={() => execCommand('justifyLeft')} 
                title="Alinhar à esquerda"
              >
                ←
              </ToolbarButton>
              <ToolbarButton 
                onClick={() => execCommand('justifyCenter')} 
                title="Centralizar"
              >
                ↔
              </ToolbarButton>
              <ToolbarButton 
                onClick={() => execCommand('justifyRight')} 
                title="Alinhar à direita"
              >
                →
              </ToolbarButton>
              <ToolbarButton 
                onClick={() => execCommand('justifyFull')} 
                title="Justificar texto"
              >
                ⇔
              </ToolbarButton>
            </div>

            <div className="toolbar-group">
              <ToolbarButton 
                onClick={() => {
                  const url = prompt('Digite a URL:');
                  if (url) execCommand('createLink', url);
                }} 
                title="Inserir link"
              >
                🔗
              </ToolbarButton>
              <ToolbarButton 
                onClick={() => execCommand('removeFormat')} 
                title="Limpar formatação"
              >
                🧹
              </ToolbarButton>
            </div>
          </div>

          {/* Indicador de processamento de imagens */}
          {processingImages && (
            <div className="processing-indicator">
              <div className="spinner"></div>
              <span>Processando imagens do Word...</span>
            </div>
          )}

          {/* Controles de imagem */}
          {showImageControls && selectedImage && (
            <div className="image-controls">
              <div className="control-group">
                <span className="control-label">Tamanho:</span>
                <button onClick={() => resizeImage(200)} className="size-btn">Pequena</button>
                <button onClick={() => resizeImage(400)} className="size-btn">Média</button>
                <button onClick={() => resizeImage(600)} className="size-btn">Grande</button>
                <button onClick={() => resizeImage(800)} className="size-btn">Extra</button>
              </div>
              <div className="control-group">
                <span className="control-label">Alinhamento:</span>
                <button onClick={() => alignImage('left')} className="align-btn">←</button>
                <button onClick={() => alignImage('center')} className="align-btn">↔</button>
                <button onClick={() => alignImage('right')} className="align-btn">→</button>
              </div>
              <div className="control-group">
                <button onClick={removeImage} className="remove-btn">🗑️ Remover</button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Área de edição */}
      {activeTab === 'visual' ? (
        <div
          ref={editorRef}
          className={`editor-area ${isFocused ? 'focused' : ''}`}
          contentEditable
          onInput={handleInput}
          onPaste={handlePaste}
          onClick={handleImageClick}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          dangerouslySetInnerHTML={{ __html: value }}
        />
      ) : activeTab === 'html' ? (
        <textarea
          className="html-editor"
          value={htmlValue}
          onChange={handleHtmlChange}
          placeholder="Edite o código HTML diretamente..."
          rows={15}
        />
      ) : (
        <div className="links-panel">
          <div className="links-header">
            <div className="header-content">
              <h3 className="links-title">Links das Imagens</h3>
              <p className="links-description">
                Gerencie os links das imagens do seu conteúdo
              </p>
            </div>
            <button
              type="button"
              className="refresh-btn"
              onClick={refreshLinksCache}
              title="Atualizar lista de links"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <button type="button" className="build-carousel-btn" onClick={openCarouselBuilder} title="Criar carrossel com imagens hospedadas">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M3 5h18v2H3zM3 11h18v2H3zM3 17h18v2H3z"/></svg>
              Criar carrossel
            </button>
            <button type="button" className="build-carousel-btn" onClick={() => { setEmptySlots(3); setIsEmptyCarouselModalOpen(true); }} title="Criar carrossel vazio (defina a quantidade de imagens)">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4v16m8-8H4"/></svg>
              Carrossel vazio
            </button>
          </div>
          
          <div className="links-content">
            {(() => {
              // Usar cache de links para evitar problemas de sincronização
              const imageLinks = linksCache.length > 0 ? linksCache : extractImageLinks();
              
              if (imageLinks.length === 0) {
                return (
                  <div className="no-links">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p>Nenhuma imagem encontrada no conteúdo</p>
                    <p className="text-sm text-gray-400">
                      Use o botão "Inserir Imagem no Conteúdo" para adicionar imagens
                    </p>
                  </div>
                );
              }

              // Separar links por tipo
              const supabaseLinks = imageLinks.filter(link => link.type === 'supabase');
              const externalLinks = imageLinks.filter(link => link.type === 'external');
              
              return (
                <div className="links-sections">
                  {/* Fileiras detectadas para transformar em carrossel */}
                  {imageRows.length > 0 && (
                    <div className="links-section">
                      <div className="section-header">
                        <div className="section-icon external-icon">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M3 5h14v2H3zM3 9h14v2H3zM3 13h14v2H3z" />
                          </svg>
                        </div>
                        <div className="section-info">
                          <h4 className="section-title">Fileiras de imagens detectadas</h4>
                          <p className="section-count">{imageRows.length} fileira(s)</p>
                        </div>
                      </div>
                      <div className="links-list">
                        {imageRows.map((row, idx) => (
                          <div key={row.id} className="link-item">
                            <div className="link-header">
                              <span className="link-number">#{idx + 1}</span>
                              <span className="link-alt">{row.type === 'table' ? 'Tabela' : 'Inline'} • {row.srcs.length} imagem(ns)</span>
                            </div>
                            <div className="link-actions">
                              <button type="button" className="btn-insert" disabled={transformingRowId === row.id} onClick={() => transformRowToCarousel(row)}>
                                {transformingRowId === row.id ? 'Criando…' : 'Transformar em carrossel'}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {createdRows.length > 0 && (
                    <div className="links-section">
                      <div className="section-header">
                        <div className="section-icon supabase-icon">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M3 5h14v2H3zM3 9h14v2H3zM3 13h14v2H3z" />
                          </svg>
                        </div>
                        <div className="section-info">
                          <h4 className="section-title">Fileiras criadas</h4>
                          <p className="section-count">{createdRows.length} carrossel(is)</p>
                        </div>
                      </div>
                      <div className="links-list">
                        {createdRows.map((row, idx) => (
                          <div key={row.id} className="link-item">
                            <div className="link-header">
                              <span className="link-number">#{idx + 1}</span>
                              <span className="link-alt">Carrossel • {row.srcs.length} imagem(ns)</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Seção de Links do Supabase */}
                  {supabaseLinks.length > 0 && (
                    <div className="links-section">
                      <div className="section-header">
                        <div className="section-icon supabase-icon">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="section-info">
                          <h4 className="section-title">Imagens Hospedadas (Supabase)</h4>
                          <p className="section-count">{supabaseLinks.length} imagem(s)</p>
                        </div>
                      </div>
                      <div className="links-list">
                        {supabaseLinks.map((link, index) => (
                          <div key={`supabase-${index}`} className="link-item supabase-item">
                            <div className="link-header">
                              <span className="link-number">#{link.index}</span>
                              <span className="link-alt">{link.alt}</span>
                              <span className="link-type-badge supabase-badge">Supabase</span>
                            </div>
                            <div className="link-url">
                              {editingLinkIndex === link.index ? (
                                <div className="edit-link-container">
                                  <input
                                    type="text"
                                    id={`edit-link-${link.index}`}
                                    name={`edit-link-${link.index}`}
                                    value={editingLinkValue}
                                    onChange={(e) => setEditingLinkValue(e.target.value)}
                                    className="edit-link-input"
                                    placeholder="Digite o novo link..."
                                  />
                                  <div className="edit-actions">
                                    <button
                                      type="button"
                                      className="save-btn"
                                      onClick={saveEditingLink}
                                    >
                                      Salvar
                                    </button>
                                    <button
                                      type="button"
                                      className="cancel-btn"
                                      onClick={cancelEditingLink}
                                    >
                                      Cancelar
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <input
                                    type="text"
                                    id={`link-input-${link.index}`}
                                    name={`link-input-${link.index}`}
                                    value={link.src}
                                    readOnly
                                    className="link-input"
                                    onClick={(e) => (e.target as HTMLInputElement).select()}
                                  />
                                  <div className="link-actions">
                                    <button
                                      type="button"
                                      className="edit-btn"
                                      onClick={() => startEditingLink(link.index, link.src)}
                                      title="Editar link"
                                    >
                                      ✏️
                                    </button>
                                    <button
                                      type="button"
                                      className="copy-btn"
                                      onClick={() => {
                                        navigator.clipboard.writeText(link.src);
                                        // Feedback visual
                                        const btn = document.querySelector(`[data-link="supabase-${index}"]`) as HTMLButtonElement;
                                        if (btn) {
                                          const originalText = btn.textContent;
                                          btn.textContent = 'Copiado!';
                                          btn.style.backgroundColor = '#10b981';
                                          setTimeout(() => {
                                            btn.textContent = originalText;
                                            btn.style.backgroundColor = '';
                                          }, 1000);
                                        }
                                      }}
                                      data-link={`supabase-${index}`}
                                    >
                                      Copiar
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Seção de Links Externos */}
                  {externalLinks.length > 0 && (
                    <div className="links-section">
                      <div className="section-header">
                        <div className="section-icon external-icon">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                            <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                          </svg>
                        </div>
                        <div className="section-info">
                          <h4 className="section-title">Links Externos</h4>
                          <p className="section-count">{externalLinks.length} imagem(s)</p>
                        </div>
                      </div>
                      <div className="links-list">
                        {externalLinks.map((link, index) => (
                          <div key={`external-${index}`} className="link-item external-item">
                            <div className="link-header">
                              <span className="link-number">#{link.index}</span>
                              <span className="link-alt">{link.alt}</span>
                              <span className="link-type-badge external-badge">Externo</span>
                            </div>
                            <div className="link-url">
                              {editingLinkIndex === link.index ? (
                                <div className="edit-link-container">
                                  <input
                                    type="text"
                                    id={`edit-link-${link.index}`}
                                    name={`edit-link-${link.index}`}
                                    value={editingLinkValue}
                                    onChange={(e) => setEditingLinkValue(e.target.value)}
                                    className="edit-link-input"
                                    placeholder="Digite o novo link..."
                                  />
                                  <div className="edit-actions">
                                    <button
                                      type="button"
                                      className="save-btn"
                                      onClick={saveEditingLink}
                                    >
                                      Salvar
                                    </button>
                                    <button
                                      type="button"
                                      className="cancel-btn"
                                      onClick={cancelEditingLink}
                                    >
                                      Cancelar
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <input
                                    type="text"
                                    id={`link-input-${link.index}`}
                                    name={`link-input-${link.index}`}
                                    value={link.src}
                                    readOnly
                                    className="link-input"
                                    onClick={(e) => (e.target as HTMLInputElement).select()}
                                  />
                                  <div className="link-actions">
                                    <button
                                      type="button"
                                      className="edit-btn"
                                      onClick={() => startEditingLink(link.index, link.src)}
                                      title="Editar link"
                                    >
                                      ✏️
                                    </button>
                                    <button
                                      type="button"
                                      className="copy-btn"
                                      onClick={() => {
                                        navigator.clipboard.writeText(link.src);
                                        // Feedback visual
                                        const btn = document.querySelector(`[data-link="external-${index}"]`) as HTMLButtonElement;
                                        if (btn) {
                                          const originalText = btn.textContent;
                                          btn.textContent = 'Copiado!';
                                          btn.style.backgroundColor = '#10b981';
                                          setTimeout(() => {
                                            btn.textContent = originalText;
                                            btn.style.backgroundColor = '';
                                          }, 1000);
                                        }
                                      }}
                                      data-link={`external-${index}`}
                                    >
                                      Copiar
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      <style jsx>{`
        .rich-text-editor {
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 0.5rem;
          overflow: hidden;
          background-color: rgba(255, 255, 255, 0.07);
        }

        .editor-tabs {
          display: flex;
          background-color: rgba(255, 255, 255, 0.05);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .tab-btn {
          display: flex;
          align-items: center;
          padding: 0.75rem 1rem;
          background-color: transparent;
          border: none;
          color: ${themeProp?.colors?.textSecondary || '#cccccc'};
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          border-bottom: 2px solid transparent;
        }

        .tab-btn:hover {
          background-color: rgba(255, 255, 255, 0.05);
          color: ${themeProp?.colors?.textPrimary || '#ffffff'};
        }

        .tab-btn.active {
          color: ${themeProp?.colors?.primary || '#7fdb3f'};
          border-bottom-color: ${themeProp?.colors?.primary || '#7fdb3f'};
          background-color: rgba(127, 219, 63, 0.1);
        }

        .toolbar {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          padding: 0.75rem;
          background-color: rgba(255, 255, 255, 0.05);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .toolbar-group {
          display: flex;
          gap: 0.25rem;
          padding: 0.25rem;
          border-right: 1px solid rgba(255, 255, 255, 0.1);
        }

        .toolbar-group:last-child {
          border-right: none;
        }

        .toolbar-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 2rem;
          height: 2rem;
          padding: 0.25rem 0.5rem;
          background-color: transparent;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 0.25rem;
          color: ${themeProp?.colors?.textPrimary || '#ffffff'};
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .toolbar-btn:hover {
          background-color: rgba(255, 255, 255, 0.1);
          border-color: ${themeProp?.colors?.primary || '#7fdb3f'};
        }

        .toolbar-btn.active {
          background-color: ${themeProp?.colors?.primary || '#7fdb3f'};
          color: #000000;
          border-color: ${themeProp?.colors?.primary || '#7fdb3f'};
        }

        .processing-indicator {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background-color: rgba(127, 219, 63, 0.1);
          border-bottom: 1px solid rgba(127, 219, 63, 0.2);
          color: ${themeProp?.colors?.primary || '#7fdb3f'};
          font-size: 0.875rem;
        }

        .spinner {
          width: 1rem;
          height: 1rem;
          border: 2px solid rgba(127, 219, 63, 0.3);
          border-top: 2px solid ${themeProp?.colors?.primary || '#7fdb3f'};
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .image-controls {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          padding: 0.75rem;
          background-color: rgba(255, 255, 255, 0.08);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          align-items: center;
        }

        .control-group {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .control-label {
          color: ${themeProp?.colors?.textSecondary || '#cccccc'};
          font-size: 0.875rem;
          font-weight: 500;
        }

        .size-btn, .align-btn {
          padding: 0.25rem 0.5rem;
          background-color: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 0.25rem;
          color: ${themeProp?.colors?.textPrimary || '#ffffff'};
          font-size: 0.75rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .size-btn:hover, .align-btn:hover {
          background-color: rgba(255, 255, 255, 0.2);
          border-color: ${themeProp?.colors?.primary || '#7fdb3f'};
        }

        .remove-btn {
          padding: 0.25rem 0.75rem;
          background-color: rgba(239, 68, 68, 0.2);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 0.25rem;
          color: #fca5a5;
          font-size: 0.75rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .remove-btn:hover {
          background-color: rgba(239, 68, 68, 0.3);
          border-color: rgba(239, 68, 68, 0.5);
        }

        .editor-area {
          min-height: 200px;
          padding: 1rem;
          color: ${themeProp?.colors?.textPrimary || '#ffffff'};
          background-color: transparent;
          outline: none;
          line-height: 1.6;
        }

        .editor-area:empty:before {
          content: "${placeholder}";
          color: rgba(255, 255, 255, 0.5);
          font-style: italic;
        }

        .editor-area.focused {
          background-color: rgba(255, 255, 255, 0.02);
        }

        .html-editor {
          width: 100%;
          min-height: 200px;
          padding: 1rem;
          background-color: rgba(0, 0, 0, 0.3);
          border: none;
          outline: none;
          color: ${themeProp?.colors?.textPrimary || '#ffffff'};
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 0.875rem;
          line-height: 1.5;
          resize: vertical;
        }

        .html-editor::placeholder {
          color: rgba(255, 255, 255, 0.5);
        }

        /* Estilos para a aba Links */
        .links-panel {
          padding: 1rem;
          background-color: rgba(0, 0, 0, 0.2);
          min-height: 300px;
        }

        .links-header {
          margin-bottom: 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .header-content {
          flex: 1;
          text-align: left;
        }

        .refresh-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 2.5rem;
          height: 2.5rem;
          background-color: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 0.5rem;
          color: ${themeProp?.colors?.textSecondary || '#cccccc'};
          cursor: pointer;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .refresh-btn:hover {
          background-color: rgba(255, 255, 255, 0.2);
          border-color: ${themeProp?.colors?.primary || '#7fdb3f'};
          color: ${themeProp?.colors?.primary || '#7fdb3f'};
          transform: rotate(180deg);
        }

        .build-carousel-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          background-color: rgba(127, 219, 63, 0.15);
          border: 1px solid rgba(127, 219, 63, 0.35);
          border-radius: 0.5rem;
          color: ${themeProp?.colors?.primary || '#7fdb3f'};
          cursor: pointer;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .build-carousel-btn:hover {
          background-color: rgba(127, 219, 63, 0.25);
          transform: translateY(-1px);
        }

        .links-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: ${themeProp?.colors?.textPrimary || '#ffffff'};
          margin-bottom: 0.5rem;
        }

        .links-description {
          color: ${themeProp?.colors?.textSecondary || '#cccccc'};
          font-size: 0.875rem;
        }

        /* Modal de carrossel */
        .carousel-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
        }

        .carousel-modal {
          width: min(900px, 92vw);
          max-height: 86vh;
          overflow: hidden;
          background: rgba(24, 24, 28, 0.98);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 0.75rem;
          display: flex;
          flex-direction: column;
        }

        .carousel-modal-header {
          padding: 1rem 1.25rem;
          border-bottom: 1px solid rgba(255,255,255,0.1);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }

        .carousel-modal-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: ${themeProp?.colors?.textPrimary || '#ffffff'};
        }

        .carousel-modal-body {
          padding: 1rem;
          overflow: auto;
        }

        .carousel-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: 0.75rem;
        }

        .carousel-item {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 0.5rem;
          padding: 0.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .carousel-item img {
          width: 100%;
          height: 90px;
          object-fit: cover;
          border-radius: 0.375rem;
        }

        .carousel-item-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 0.5rem;
        }

        .carousel-checkbox {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          color: ${themeProp?.colors?.textSecondary || '#cccccc'};
          font-size: 0.875rem;
        }

        .carousel-order-btns {
          display: inline-flex;
          gap: 0.25rem;
        }

        .order-btn {
          width: 28px;
          height: 28px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 0.375rem;
          color: ${themeProp?.colors?.textPrimary || '#ffffff'};
          cursor: pointer;
        }

        .carousel-modal-footer {
          padding: 0.75rem 1rem;
          border-top: 1px solid rgba(255,255,255,0.1);
          display: flex;
          justify-content: flex-end;
          gap: 0.5rem;
        }

        .btn-cancel {
          padding: 0.5rem 0.9rem;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.15);
          color: ${themeProp?.colors?.textPrimary || '#ffffff'};
          border-radius: 0.5rem;
          cursor: pointer;
        }

        .btn-insert {
          padding: 0.5rem 0.9rem;
          background: ${themeProp?.colors?.primary || '#7fdb3f'};
          border: none;
          color: #000;
          font-weight: 600;
          border-radius: 0.5rem;
          cursor: pointer;
        }

        .no-links {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem 1rem;
          text-align: center;
          color: ${themeProp?.colors?.textSecondary || '#cccccc'};
        }

        .no-links svg {
          margin-bottom: 1rem;
          opacity: 0.5;
        }

        .no-links p {
          margin-bottom: 0.5rem;
        }

        .links-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .link-item {
          background-color: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 0.5rem;
          padding: 1rem;
          transition: all 0.2s ease;
        }

        .link-item:hover {
          background-color: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .link-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.75rem;
        }

        .link-number {
          background-color: ${themeProp?.colors?.primary || '#7fdb3f'};
          color: #000000;
          font-weight: 600;
          font-size: 0.75rem;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          min-width: 2rem;
          text-align: center;
        }

        .link-alt {
          color: ${themeProp?.colors?.textPrimary || '#ffffff'};
          font-weight: 500;
          font-size: 0.875rem;
        }

        .link-url {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }

        .link-input {
          flex: 1;
          padding: 0.5rem 0.75rem;
          background-color: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 0.25rem;
          color: ${themeProp?.colors?.textPrimary || '#ffffff'};
          font-size: 0.875rem;
          font-family: 'Courier New', monospace;
          cursor: text;
        }

        .link-input:focus {
          outline: none;
          border-color: ${themeProp?.colors?.primary || '#7fdb3f'};
          background-color: rgba(0, 0, 0, 0.4);
        }

        .copy-btn {
          padding: 0.5rem 1rem;
          background-color: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 0.25rem;
          color: ${themeProp?.colors?.textPrimary || '#ffffff'};
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .copy-btn:hover {
          background-color: rgba(255, 255, 255, 0.2);
          border-color: ${themeProp?.colors?.primary || '#7fdb3f'};
        }

        .copy-btn:active {
          transform: scale(0.95);
        }

        /* Estilos para seções de links */
        .links-sections {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .links-section {
          background-color: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 0.75rem;
          padding: 1.5rem;
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .section-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 0.5rem;
          color: #ffffff;
        }

        .supabase-icon {
          background-color: rgba(59, 130, 246, 0.2);
          border: 1px solid rgba(59, 130, 246, 0.3);
        }

        .external-icon {
          background-color: rgba(245, 158, 11, 0.2);
          border: 1px solid rgba(245, 158, 11, 0.3);
        }

        .section-info {
          flex: 1;
        }

        .section-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: ${themeProp?.colors?.textPrimary || '#ffffff'};
          margin-bottom: 0.25rem;
        }

        .section-count {
          font-size: 0.875rem;
          color: ${themeProp?.colors?.textSecondary || '#cccccc'};
        }

        /* Badges de tipo */
        .link-type-badge {
          font-size: 0.75rem;
          font-weight: 600;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .supabase-badge {
          background-color: rgba(59, 130, 246, 0.2);
          color: #60a5fa;
          border: 1px solid rgba(59, 130, 246, 0.3);
        }

        .external-badge {
          background-color: rgba(245, 158, 11, 0.2);
          color: #fbbf24;
          border: 1px solid rgba(245, 158, 11, 0.3);
        }

        /* Ações de link */
        .link-actions {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }

        .edit-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 2rem;
          height: 2rem;
          background-color: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.2);
          border-radius: 0.25rem;
          color: #60a5fa;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 0.875rem;
        }

        .edit-btn:hover {
          background-color: rgba(59, 130, 246, 0.2);
          border-color: rgba(59, 130, 246, 0.4);
        }

        /* Edição de links */
        .edit-link-container {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          width: 100%;
        }

        .edit-link-input {
          width: 100%;
          padding: 0.75rem;
          background-color: rgba(0, 0, 0, 0.4);
          border: 2px solid ${themeProp?.colors?.primary || '#7fdb3f'};
          border-radius: 0.5rem;
          color: ${themeProp?.colors?.textPrimary || '#ffffff'};
          font-size: 0.875rem;
          font-family: 'Courier New', monospace;
        }

        .edit-link-input:focus {
          outline: none;
          border-color: ${themeProp?.colors?.primary || '#7fdb3f'};
          box-shadow: 0 0 0 3px rgba(127, 219, 63, 0.1);
        }

        .edit-actions {
          display: flex;
          gap: 0.5rem;
          justify-content: flex-end;
        }

        .save-btn {
          padding: 0.5rem 1rem;
          background-color: ${themeProp?.colors?.primary || '#7fdb3f'};
          border: none;
          border-radius: 0.25rem;
          color: #000000;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .save-btn:hover {
          background-color: #6bcb2f;
          transform: translateY(-1px);
        }

        .cancel-btn {
          padding: 0.5rem 1rem;
          background-color: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 0.25rem;
          color: #f87171;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .cancel-btn:hover {
          background-color: rgba(239, 68, 68, 0.2);
          border-color: rgba(239, 68, 68, 0.5);
        }

        /* Responsividade para seções */
        @media (max-width: 768px) {
          .links-header {
            align-items: stretch;
          }

          .build-carousel-btn, .refresh-btn {
            width: 100%;
          }

          .links-section {
            padding: 1rem;
          }

          .section-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.75rem;
          }

          .link-actions {
            flex-direction: column;
            gap: 0.25rem;
          }

          .edit-actions {
            flex-direction: column;
          }
        }

        .editor-area h1,
        .editor-area h2,
        .editor-area h3,
        .editor-area h4,
        .editor-area h5,
        .editor-area h6 {
          margin: 1rem 0 0.5rem 0;
          font-weight: 600;
          line-height: 1.3;
        }

        .editor-area h1 {
          font-size: 2rem;
          border-bottom: 2px solid ${themeProp?.colors?.primary || '#7fdb3f'};
          padding-bottom: 0.5rem;
        }

        .editor-area h2 {
          font-size: 1.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          padding-bottom: 0.5rem;
        }

        .editor-area h3 {
          font-size: 1.25rem;
        }

        .editor-area p {
          margin: 0.5rem 0;
          text-align: justify;
          text-justify: inter-word;
          hyphens: auto;
        }

        /* Reduzir espaçamento de parágrafos no mobile */
        @media (max-width: 768px) {
          .editor-area p {
            margin: 0.25rem 0 !important;
          }

          .editor-area h1,
          .editor-area h2,
          .editor-area h3,
          .editor-area h4,
          .editor-area h5,
          .editor-area h6 {
            margin: 0.5rem 0 0.25rem 0 !important;
          }

          /* Sobrescrever estilos inline do Word/Office para parágrafos */
          .editor-area p[style*="margin"] {
            margin: 0.25rem 0 !important;
          }

          .editor-area p[style*="margin-top"] {
            margin-top: 0.25rem !important;
          }

          .editor-area p[style*="margin-bottom"] {
            margin-bottom: 0.25rem !important;
          }

          /* Sobrescrever classes específicas do Word */
          .editor-area .MsoNormal {
            margin: 0.25rem 0 !important;
          }

          .editor-area p.MsoNormal {
            margin: 0.25rem 0 !important;
          }

          /* Sobrescrever qualquer elemento com margem */
          .editor-area *[style*="margin"] {
            margin: 0.25rem 0 !important;
          }

          .editor-area *[style*="margin-top"] {
            margin-top: 0.25rem !important;
          }

          .editor-area *[style*="margin-bottom"] {
            margin-bottom: 0.25rem !important;
          }
        }

        .editor-area ul,
        .editor-area ol {
          margin: 0.5rem 0;
          padding-left: 1.5rem;
        }

        .editor-area li {
          margin: 0.25rem 0;
        }

        /* Reduzir espaçamento de listas no mobile */
        @media (max-width: 768px) {
          .editor-area ul,
          .editor-area ol {
            margin: 0.25rem 0 !important;
            padding-left: 1rem !important;
          }

          .editor-area li {
            margin: 0.125rem 0 !important;
          }
        }

        .editor-area a {
          color: ${themeProp?.colors?.primary || '#7fdb3f'};
          text-decoration: underline;
        }

        .editor-area img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
          margin: 0.5rem 0;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        /* Reduzir espaçamento de imagens no mobile */
        @media (max-width: 768px) {
          .editor-area img {
            margin: 0.25rem 0 !important;
          }

          .editor-area p + img,
          .editor-area img + p {
            margin-top: 0.25rem !important;
            margin-bottom: 0.25rem !important;
          }

          .editor-area h1 + img,
          .editor-area h2 + img,
          .editor-area h3 + img,
          .editor-area img + h1,
          .editor-area img + h2,
          .editor-area img + h3 {
            margin-top: 0.25rem !important;
            margin-bottom: 0.25rem !important;
          }

          /* Sobrescrever estilos inline do Word/Office */
          .editor-area img[style*="margin"] {
            margin: 0.25rem 0 !important;
          }

          .editor-area img[style*="margin-top"] {
            margin-top: 0.25rem !important;
          }

          .editor-area img[style*="margin-bottom"] {
            margin-bottom: 0.25rem !important;
          }

          /* Sobrescrever tabelas do Word */
          .editor-area table img {
            margin: 0.25rem 0 !important;
          }

          .editor-area table td img {
            margin: 0.25rem 0 !important;
          }

          /* Sobrescrever qualquer elemento com imagem */
          .editor-area * img {
            margin: 0.25rem 0 !important;
          }
        }

        .editor-area img:hover {
          box-shadow: 0 0 0 2px ${themeProp?.colors?.primary || '#7fdb3f'};
        }

        .editor-area img.selected {
          box-shadow: 0 0 0 3px ${themeProp?.colors?.primary || '#7fdb3f'};
        }

        /* Tabela de "molde" do carrossel no editor */
        .editor-area table.image-carousel-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0.5rem;
          margin: 0.5rem 0;
        }
        .editor-area table.image-carousel-table td {
          padding: 0.25rem;
          vertical-align: middle;
        }

        .editor-area blockquote {
          border-left: 4px solid ${themeProp?.colors?.primary || '#7fdb3f'};
          margin: 1rem 0;
          padding-left: 1rem;
          font-style: italic;
          color: rgba(255, 255, 255, 0.8);
        }

        /* Responsividade */
        @media (max-width: 768px) {
          .toolbar {
            flex-direction: column;
            gap: 0.25rem;
          }

          .toolbar-group {
            border-right: none;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            padding-bottom: 0.5rem;
          }

          .toolbar-group:last-child {
            border-bottom: none;
          }

          .toolbar-btn {
            min-width: 1.5rem;
            height: 1.5rem;
            font-size: 0.75rem;
          }

          .image-controls {
            flex-direction: column;
            gap: 0.5rem;
          }

          .control-group {
            justify-content: center;
          }

          .editor-tabs {
            flex-direction: column;
          }

          .tab-btn {
            justify-content: center;
          }
        }
      `}</style>

      {isCarouselModalOpen && (
        <div className="carousel-modal-overlay" onClick={() => setIsCarouselModalOpen(false)}>
          <div className="carousel-modal" onClick={(e) => e.stopPropagation()}>
            <div className="carousel-modal-header">
              <div className="carousel-modal-title">Criar Carrossel</div>
              <button className="btn-cancel" onClick={() => setIsCarouselModalOpen(false)}>Fechar</button>
            </div>
            <div className="carousel-modal-body">
              {carouselCandidates.length === 0 ? (
                <p style={{ color: themeProp?.colors?.textSecondary || '#ccc' }}>Nenhuma imagem hospedada encontrada nesta página. Use o botão "Inserir Imagem no Conteúdo" acima do editor para enviar imagens.</p>
              ) : (
                <div className="carousel-grid">
                  {carouselCandidates.map((c) => (
                    <div key={c.src} className="carousel-item">
                      <img src={c.src} alt={c.alt} />
                      <div className="carousel-item-actions">
                        <label className="carousel-checkbox">
                          <input 
                            type="checkbox" 
                            id={`carousel-checkbox-${c.src}`}
                            checked={selectedCarousel.includes(c.src)} 
                            onChange={() => toggleCarouselItem(c.src)} 
                          />
                          Incluir
                        </label>
                        {selectedCarousel.includes(c.src) && (
                          <div className="carousel-order-btns">
                            <button type="button" className="order-btn" onClick={() => moveCarouselItem(c.src, 'up')}>↑</button>
                            <button type="button" className="order-btn" onClick={() => moveCarouselItem(c.src, 'down')}>↓</button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="carousel-modal-footer">
              <button className="btn-cancel" onClick={() => setIsCarouselModalOpen(false)}>Cancelar</button>
              <button className="btn-insert" onClick={insertCarouselIntoEditor} disabled={selectedCarousel.length === 0}>Inserir carrossel</button>
            </div>
          </div>
        </div>
      )}

      {isUrlCarouselModalOpen && (
        <div className="carousel-modal-overlay" onClick={() => setIsUrlCarouselModalOpen(false)}>
          <div className="carousel-modal" onClick={(e) => e.stopPropagation()}>
            <div className="carousel-modal-header">
              <div className="carousel-modal-title">Carrossel por links</div>
              <button className="btn-cancel" onClick={() => setIsUrlCarouselModalOpen(false)}>Fechar</button>
            </div>
            <div className="carousel-modal-body">
              <div style={{ marginBottom: '0.75rem', color: themeProp?.colors?.textSecondary || '#ccc' }}>
                Cole vários links (um por linha) ou adicione/remova campos. Reordene com ↑ ↓.
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <textarea
                  id="bulk-urls-textarea"
                  name="bulk-urls-textarea"
                  rows={4}
                  placeholder="Cole aqui vários links (um por linha)"
                  onPaste={(e) => {
                    const text = e.clipboardData.getData('text/plain');
                    if (text && text.includes('\n')) {
                      e.preventDefault();
                      bulkPasteUrls(text);
                    }
                  }}
                  className="html-editor"
                  style={{ flex: 1 }}
                />
                <button type="button" className="btn-insert" onClick={() => bulkPasteUrls(prompt('Cole os links (um por linha):', '') || '')}>Colar</button>
              </div>
              {urlFields.map((value, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <input 
                    type="text" 
                    id={`url-field-${idx}`}
                    name={`url-field-${idx}`}
                    value={value}
                    onChange={e => updateUrlField(idx, e.target.value)}
                    placeholder={`Link da imagem #${idx + 1}`}
                    className="edit-link-input" 
                    style={{ flex: 1 }}
                  />
                  <button type="button" className="order-btn" onClick={() => moveUrlField(idx, 'up')}>↑</button>
                  <button type="button" className="order-btn" onClick={() => moveUrlField(idx, 'down')}>↓</button>
                  <button type="button" className="btn-cancel" onClick={() => removeUrlField(idx)}>Remover</button>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                <button type="button" className="btn-cancel" onClick={addUrlField}>Adicionar link</button>
                <span style={{ color: themeProp?.colors?.textSecondary || '#ccc', fontSize: '0.9rem' }}>{urlFields.length} link(s)</span>
              </div>
            </div>
            <div className="carousel-modal-footer">
              <button className="btn-cancel" onClick={() => setIsUrlCarouselModalOpen(false)}>Cancelar</button>
              <button className="btn-insert" onClick={insertUrlCarousel} disabled={urlFields.filter(Boolean).length === 0}>Inserir carrossel</button>
            </div>
          </div>
        </div>
      )}

      {isEmptyCarouselModalOpen && (
        <div className="carousel-modal-overlay" onClick={() => setIsEmptyCarouselModalOpen(false)}>
          <div className="carousel-modal" onClick={(e) => e.stopPropagation()}>
            <div className="carousel-modal-header">
              <div className="carousel-modal-title">Criar carrossel vazio</div>
              <button className="btn-cancel" onClick={() => setIsEmptyCarouselModalOpen(false)}>Fechar</button>
            </div>
            <div className="carousel-modal-body">
              <div style={{ marginBottom: '0.75rem', color: themeProp?.colors?.textSecondary || '#ccc' }}>
                Defina quantos slots (imagens) o carrossel terá. Depois você poderá editar os links na aba Links.
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <label htmlFor="empty-slots" className="sr-only">Número de slots do carrossel</label>
                <input 
                  type="number" 
                  id="empty-slots"
                  min={1} 
                  max={20} 
                  value={emptySlots} 
                  onChange={(e) => setEmptySlots(Math.max(1, Math.min(20, parseInt(e.target.value || '1', 10))))} 
                  className="edit-link-input" 
                  style={{ width: 120 }} 
                />
                <span style={{ color: themeProp?.colors?.textSecondary || '#ccc' }}>imagem(ns)</span>
              </div>
            </div>
            <div className="carousel-modal-footer">
              <button className="btn-cancel" onClick={() => setIsEmptyCarouselModalOpen(false)}>Cancelar</button>
              <button className="btn-insert" onClick={() => {
                const imgs = Array.from({ length: emptySlots }).map((_, i) => `<img src="" alt="Imagem ${i + 1}" />`).join('');
                const html = `
                  <div class=\"simple-carousel\" data-type=\"simple-carousel\">
                    <div class=\"simple-carousel-track\">${imgs}</div>
                  </div>
                `;
                document.execCommand('insertHTML', false, html);
                handleInput();
                setIsEmptyCarouselModalOpen(false);
                // Atualizar a aba Links para permitir preencher os URLs
                setTimeout(() => {
                  switchToLinks();
                  refreshLinksCache();
                }, 100);
              }}>Inserir carrossel vazio</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RichTextEditor; 