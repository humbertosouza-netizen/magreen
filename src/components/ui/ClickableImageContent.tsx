'use client';

import React from 'react';
import { useImageLightbox } from '@/hooks/useImageLightbox';
import ImageLightbox from './ImageLightbox';
import theme from '@/styles/theme';

interface ClickableImageContentProps {
  content: string;
  className?: string;
}

const ClickableImageContent: React.FC<ClickableImageContentProps> = ({ 
  content, 
  className = '' 
}) => {
  const { lightboxState, openLightbox, closeLightbox } = useImageLightbox();

  // Função para processar o HTML e tornar imagens clicáveis
  const processContent = (htmlContent: string) => {
    // Criar um elemento temporário para manipular o DOM
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;

    // Encontrar todas as imagens
    const images = tempDiv.querySelectorAll('img');
    
    images.forEach((img, index) => {
      // Adicionar classes e estilos para indicar que é clicável
      img.classList.add('clickable-image');
      img.style.cursor = 'pointer';
      img.style.transition = 'all 0.2s ease';
      
      // Adicionar evento de clique
      img.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const src = img.getAttribute('src') || '';
        const alt = img.getAttribute('alt') || `Imagem ${index + 1}`;
        
        openLightbox(src, alt);
      });

      // Adicionar tooltip
      img.title = 'Clique para ampliar';
    });

    return tempDiv.innerHTML;
  };

  // Processar o conteúdo apenas no cliente
  const [processedContent, setProcessedContent] = React.useState(content);

  React.useEffect(() => {
    setProcessedContent(processContent(content));
  }, [content]);

  return (
    <>
      <div
        className={`clickable-image-content ${className}`}
        dangerouslySetInnerHTML={{ __html: processedContent }}
      />
      
      <ImageLightbox
        isOpen={lightboxState.isOpen}
        imageSrc={lightboxState.imageSrc}
        imageAlt={lightboxState.imageAlt}
        onClose={closeLightbox}
      />

      <style jsx>{`
        .clickable-image-content {
          line-height: 1.6;
          color: ${theme.colors?.textPrimary || '#ffffff'};
        }

        .clickable-image-content :global(.clickable-image) {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
          margin: 1rem 0;
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .clickable-image-content :global(.clickable-image:hover) {
          transform: scale(1.02);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        .clickable-image-content :global(.clickable-image:active) {
          transform: scale(0.98);
        }

        /* Estilos para diferentes elementos do conteúdo */
        .clickable-image-content :global(h1),
        .clickable-image-content :global(h2),
        .clickable-image-content :global(h3),
        .clickable-image-content :global(h4),
        .clickable-image-content :global(h5),
        .clickable-image-content :global(h6) {
          margin: 1rem 0 0.5rem 0;
          font-weight: 600;
          line-height: 1.3;
          color: ${theme.colors?.textPrimary || '#ffffff'};
        }

        .clickable-image-content :global(h1) {
          font-size: 2rem;
          border-bottom: 2px solid ${theme.colors?.primary || '#7fdb3f'};
          padding-bottom: 0.5rem;
        }

        .clickable-image-content :global(h2) {
          font-size: 1.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          padding-bottom: 0.5rem;
        }

        .clickable-image-content :global(h3) {
          font-size: 1.25rem;
        }

        .clickable-image-content :global(p) {
          margin: 0.5rem 0;
          color: ${theme.colors?.textPrimary || '#ffffff'};
        }

        .clickable-image-content :global(ul),
        .clickable-image-content :global(ol) {
          margin: 0.5rem 0;
          padding-left: 1.5rem;
        }

        .clickable-image-content :global(li) {
          margin: 0.25rem 0;
          color: ${theme.colors?.textPrimary || '#ffffff'};
        }

        .clickable-image-content :global(a) {
          color: ${theme.colors?.primary || '#7fdb3f'};
          text-decoration: underline;
          transition: color 0.2s ease;
        }

        .clickable-image-content :global(a:hover) {
          color: ${theme.colors?.accent || '#5a9c2e'};
        }

        .clickable-image-content :global(blockquote) {
          border-left: 4px solid ${theme.colors?.primary || '#7fdb3f'};
          margin: 1rem 0;
          padding-left: 1rem;
          font-style: italic;
          color: rgba(255, 255, 255, 0.8);
        }

        .clickable-image-content :global(code) {
          background-color: rgba(255, 255, 255, 0.1);
          padding: 0.125rem 0.25rem;
          border-radius: 0.25rem;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 0.875em;
        }

        .clickable-image-content :global(pre) {
          background-color: rgba(0, 0, 0, 0.3);
          padding: 1rem;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin: 1rem 0;
        }

        .clickable-image-content :global(pre code) {
          background-color: transparent;
          padding: 0;
        }

        /* Indicador visual para imagens clicáveis */
        .clickable-image-content :global(.clickable-image::after) {
          content: '🔍';
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          background-color: rgba(0, 0, 0, 0.7);
          color: white;
          padding: 0.25rem;
          border-radius: 0.25rem;
          font-size: 0.75rem;
          opacity: 0;
          transition: opacity 0.2s ease;
          pointer-events: none;
        }

        .clickable-image-content :global(.clickable-image:hover::after) {
          opacity: 1;
        }

        /* Responsividade */
        @media (max-width: 768px) {
          .clickable-image-content :global(.clickable-image) {
            margin: 0.5rem 0;
          }

          .clickable-image-content :global(h1) {
            font-size: 1.5rem;
          }

          .clickable-image-content :global(h2) {
            font-size: 1.25rem;
          }

          .clickable-image-content :global(h3) {
            font-size: 1.125rem;
          }
        }
      `}</style>
    </>
  );
};

export default ClickableImageContent; 