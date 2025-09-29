'use client';

import React, { useEffect, useRef } from 'react';
import { useImageExtractor } from '@/hooks/useImageExtractor';
import ImageCarousel from './ImageCarousel';
import ClickableImageContent from './ClickableImageContent';

interface ContentWithCarouselProps {
  content: string;
  className?: string;
}

const ContentWithCarousel: React.FC<ContentWithCarouselProps> = ({
  content,
  className = ''
}) => {
  const { imageGroups, processedContent, hasMultipleImages } = useImageExtractor(content);
  const shouldProcessPlaceholders = hasMultipleImages || (processedContent?.includes('image-carousel-placeholder') ?? false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !shouldProcessPlaceholders) return;

    // Processar placeholders e substituir por carrosséis
    const placeholders = containerRef.current.querySelectorAll('.image-carousel-placeholder');
    
    placeholders.forEach((placeholder) => {
      const imagesData = placeholder.getAttribute('data-images');
      
      if (!imagesData) return;
      
      let images: string[] = [];
      try {
        images = JSON.parse(imagesData);
      } catch (e) {
        images = [];
      }
      
      // Fallback: se não houver imagens parseadas, tenta extrair imagens dentro do próprio placeholder (se houver)
      if (!images || images.length === 0) {
        const imgs = placeholder.querySelectorAll('img');
        images = Array.from(imgs)
          .map(img => img.getAttribute('src'))
          .filter((src): src is string => Boolean(src));
      }

      if (!images || images.length === 0) return;

      // Criar container para o carrossel (ou bloco de imagens se houver apenas uma)
      const container = document.createElement('div');
      container.className = 'image-carousel-container';
      
      if (images.length === 1) {
        // Fallback simples: renderizar a imagem única
        container.innerHTML = `<img src="${images[0]}" alt="Imagem" class="current-image" />`;
        placeholder.parentNode?.replaceChild(container, placeholder);
        return;
      }
      
      container.innerHTML = `
        <div class="image-carousel mb-4" data-images='${JSON.stringify(images)}'>
          <div class="carousel-container">
            <button class="carousel-button prev-button" aria-label="Imagem anterior">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div class="image-container clickable-image" title="Clique para ampliar">
              <img src="${images[0]}" alt="Imagem 1 de ${images.length}" class="current-image" />
              <div class="image-counter">1 / ${images.length}</div>
            </div>
            <button class="carousel-button next-button" aria-label="Próxima imagem">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <div class="carousel-indicators">
            ${images.map((_, index) => `
              <button class="indicator ${index === 0 ? 'active' : ''}" aria-label="Ir para imagem ${index + 1}"></button>
            `).join('')}
          </div>
        </div>
      `;
      
      // Substituir o placeholder pelo carrossel
      placeholder.parentNode?.replaceChild(container, placeholder);
      
      // Adicionar funcionalidade JavaScript ao carrossel
      const carousel = container.querySelector('.image-carousel');
      if (carousel) {
        addCarouselFunctionality(carousel, images);
      }
    });
  }, [processedContent, imageGroups, hasMultipleImages]);

  // Função para adicionar funcionalidade ao carrossel
  const addCarouselFunctionality = (carousel: Element, images: string[]) => {
    let currentIndex = 0;
    
    const updateImage = (index: number) => {
      currentIndex = index;
      const img = carousel.querySelector('.current-image') as HTMLImageElement;
      const counter = carousel.querySelector('.image-counter') as HTMLElement;
      const indicators = carousel.querySelectorAll('.indicator');
      
      if (img) img.src = images[index];
      if (counter) counter.textContent = `${index + 1} / ${images.length}`;
      
      indicators.forEach((indicator, i) => {
        indicator.classList.toggle('active', i === index);
      });
    };
    
    // Botões de navegação
    const prevButton = carousel.querySelector('.prev-button');
    const nextButton = carousel.querySelector('.next-button');
    
    prevButton?.addEventListener('click', () => {
      const newIndex = currentIndex === 0 ? images.length - 1 : currentIndex - 1;
      updateImage(newIndex);
    });
    
    nextButton?.addEventListener('click', () => {
      const newIndex = currentIndex === images.length - 1 ? 0 : currentIndex + 1;
      updateImage(newIndex);
    });
    
    // Indicadores
    const indicators = carousel.querySelectorAll('.indicator');
    indicators.forEach((indicator, index) => {
      indicator.addEventListener('click', () => updateImage(index));
    });
    
    // Lightbox para ampliar imagem
    const imageContainer = carousel.querySelector('.image-container');
    imageContainer?.addEventListener('click', () => {
      // Criar lightbox simples
      const lightbox = document.createElement('div');
      lightbox.className = 'lightbox-overlay';
      lightbox.innerHTML = `
        <div class="lightbox-content">
          <button class="lightbox-close">&times;</button>
          <img src="${images[currentIndex]}" alt="Imagem ampliada" class="lightbox-image" />
          <div class="lightbox-counter">${currentIndex + 1} / ${images.length}</div>
        </div>
      `;
      
      document.body.appendChild(lightbox);
      
      // Fechar lightbox
      const closeButton = lightbox.querySelector('.lightbox-close');
      closeButton?.addEventListener('click', () => {
        document.body.removeChild(lightbox);
      });
      
      lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
          document.body.removeChild(lightbox);
        }
      });
      
      // ESC para fechar
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          document.body.removeChild(lightbox);
          document.removeEventListener('keydown', handleEsc);
        }
      };
      document.addEventListener('keydown', handleEsc);
    });
    
    // Auto-play
    const interval = setInterval(() => {
      const newIndex = currentIndex === images.length - 1 ? 0 : currentIndex + 1;
      updateImage(newIndex);
    }, 5000);
    
    // Limpar intervalo quando componente for desmontado
    return () => clearInterval(interval);
  };

  // Se não há múltiplas imagens, renderizar normalmente
  if (!shouldProcessPlaceholders) {
    return (
      <ClickableImageContent 
        content={content}
        className={className}
      />
    );
  }

  return (
    <div ref={containerRef} className={className}>
      <ClickableImageContent 
        content={processedContent}
        className="content-with-carousel"
      />
      
      <style jsx>{`
        .content-with-carousel {
          width: 100%;
        }
        
        .image-carousel-container {
          margin: 1rem 0;
          width: 100%;
        }
        
        /* Garantir que imagens individuais sejam responsivas */
        .content-with-carousel :global(img) {
          display: block !important;
          width: 100% !important;
          max-width: 100% !important;
          height: auto !important;
          margin: 1rem auto !important;
          border-radius: 0.5rem !important;
        }
        
        /* Responsividade */
        @media (max-width: 640px) {
          .content-with-carousel :global(img) {
            margin: 0.5rem 0;
          }
        }
        
        /* Estilos para o carrossel */
        .image-carousel-container :global(.image-carousel) {
          width: 100%;
          max-width: 100%;
          margin: 1rem 0;
        }
        
        .image-carousel-container :global(.carousel-container) {
          position: relative;
          width: 100%;
          height: 300px;
          border-radius: 0.5rem;
          overflow: hidden;
          background-color: rgba(0, 0, 0, 0.1);
        }
        
        .image-carousel-container :global(.image-container) {
          position: relative;
          width: 100%;
          height: 100%;
          cursor: pointer;
        }
        
        .image-carousel-container :global(.current-image) {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }
        
        .image-carousel-container :global(.current-image:hover) {
          transform: scale(1.05);
        }
        
        .image-carousel-container :global(.carousel-button) {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background-color: rgba(0, 0, 0, 0.7);
          border: none;
          border-radius: 50%;
          width: 3rem;
          height: 3rem;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          cursor: pointer;
          z-index: 10;
          transition: all 0.2s ease;
          backdrop-filter: blur(4px);
        }
        
        .image-carousel-container :global(.carousel-button:hover) {
          background-color: rgba(0, 0, 0, 0.9);
          transform: translateY(-50%) scale(1.1);
        }
        
        .image-carousel-container :global(.prev-button) {
          left: 1rem;
        }
        
        .image-carousel-container :global(.next-button) {
          right: 1rem;
        }
        
        .image-carousel-container :global(.image-counter) {
          position: absolute;
          bottom: 1rem;
          right: 1rem;
          background-color: rgba(0, 0, 0, 0.7);
          color: white;
          padding: 0.5rem 0.75rem;
          border-radius: 0.25rem;
          font-size: 0.875rem;
          font-weight: 500;
          backdrop-filter: blur(4px);
        }
        
        .image-carousel-container :global(.carousel-indicators) {
          display: flex;
          justify-content: center;
          gap: 0.5rem;
          margin-top: 1rem;
        }
        
        .image-carousel-container :global(.indicator) {
          width: 0.75rem;
          height: 0.75rem;
          border-radius: 50%;
          border: none;
          background-color: rgba(255, 255, 255, 0.3);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .image-carousel-container :global(.indicator.active) {
          background-color: #7fdb3f;
          transform: scale(1.2);
        }
        
        .image-carousel-container :global(.indicator:hover) {
          background-color: rgba(255, 255, 255, 0.5);
        }
        
        /* Responsividade do carrossel */
        @media (max-width: 640px) {
          .image-carousel-container :global(.carousel-container) {
            height: 250px;
          }
          
          .image-carousel-container :global(.carousel-button) {
            width: 2.5rem;
            height: 2.5rem;
          }
          
          .image-carousel-container :global(.carousel-button svg) {
            width: 1.25rem;
            height: 1.25rem;
          }
          
          .image-carousel-container :global(.image-counter) {
            font-size: 0.75rem;
            padding: 0.375rem 0.5rem;
          }
          
          .image-carousel-container :global(.indicator) {
            width: 0.5rem;
            height: 0.5rem;
          }
        }
        
        /* Animações */
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .image-carousel-container :global(.current-image) {
          animation: fadeIn 0.3s ease-in-out;
        }
        
        /* Estilos para o lightbox */
        :global(.lightbox-overlay) {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.9);
          backdrop-filter: blur(8px);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          animation: fadeIn 0.3s ease-out;
        }
        
        :global(.lightbox-content) {
          position: relative;
          max-width: 90vw;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        :global(.lightbox-close) {
          position: absolute;
          top: -2rem;
          right: 0;
          background: none;
          border: none;
          color: white;
          font-size: 2rem;
          cursor: pointer;
          z-index: 10;
          padding: 0.5rem;
          border-radius: 50%;
          transition: background-color 0.2s ease;
        }
        
        :global(.lightbox-close:hover) {
          background-color: rgba(255, 255, 255, 0.1);
        }
        
        :global(.lightbox-image) {
          max-width: 100%;
          max-height: 80vh;
          object-fit: contain;
          border-radius: 0.5rem;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        }
        
        :global(.lightbox-counter) {
          margin-top: 1rem;
          color: white;
          font-size: 0.875rem;
          background-color: rgba(0, 0, 0, 0.7);
          padding: 0.5rem 1rem;
          border-radius: 0.25rem;
          backdrop-filter: blur(4px);
        }
        
        /* Responsividade do lightbox */
        @media (max-width: 640px) {
          :global(.lightbox-overlay) {
            padding: 0.5rem;
          }
          
          :global(.lightbox-image) {
            max-height: 70vh;
          }
          
          :global(.lightbox-close) {
            top: -1.5rem;
            font-size: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default ContentWithCarousel; 