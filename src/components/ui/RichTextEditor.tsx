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
    type: 'supabase' | 'external';
    originalSrc: string;
  }>>([]);
  const { processWordImages } = useWordImageUploader();

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
      .replace(/<br[^>]*>/g, '<br>');
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
      const newValue = editorRef.current.innerHTML;
      onChange(newValue);
      setHtmlValue(newValue);
    }
  };

  // Sincronizar valor externo
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
    setHtmlValue(value);
    
    // Atualizar cache de links quando o valor mudar
    const newLinks = extractImageLinks();
    setLinksCache(newLinks);
  }, [value]);

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
        type: 'supabase' | 'external';
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
  const refreshLinksCache = () => {
    const newLinks = extractImageLinks();
    setLinksCache(newLinks);
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
        }

        .editor-area ul,
        .editor-area ol {
          margin: 0.5rem 0;
          padding-left: 1.5rem;
        }

        .editor-area li {
          margin: 0.25rem 0;
        }

        .editor-area a {
          color: ${themeProp?.colors?.primary || '#7fdb3f'};
          text-decoration: underline;
        }

        .editor-area img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
          margin: 1rem 0;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .editor-area img:hover {
          box-shadow: 0 0 0 2px ${themeProp?.colors?.primary || '#7fdb3f'};
        }

        .editor-area img.selected {
          box-shadow: 0 0 0 3px ${themeProp?.colors?.primary || '#7fdb3f'};
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
    </div>
  );
};

export default RichTextEditor; 