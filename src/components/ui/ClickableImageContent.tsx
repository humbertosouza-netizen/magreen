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
    // Apenas tornar imagens clicáveis; não criar carrosséis
    const processed = processContent(content);
    setProcessedContent(processed);
  }, [content]);

  // Função para processar conteúdo e inserir carrosséis inline
  const processContentWithCarousels = (htmlContent: string) => {
    console.log('Processando conteúdo para carrosséis');
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;

    // Encontrar todas as tabelas
    const tables = tempDiv.querySelectorAll('table');
    
    tables.forEach((table, tableIndex) => {
      const imgElements = table.querySelectorAll('img');
      if (imgElements.length > 0) {
        // Criar elemento carrossel
        console.log('Criando carrossel para tabela', tableIndex);
        const carouselDiv = document.createElement('div');
        carouselDiv.className = 'mobile-carousel';
        carouselDiv.setAttribute('data-table-index', tableIndex.toString());
        
        // Adicionar container do carrossel
        const containerDiv = document.createElement('div');
        containerDiv.className = 'mobile-carousel-container';
        
        // Adicionar slides
        imgElements.forEach((img, imgIndex) => {
          const slideDiv = document.createElement('div');
          slideDiv.className = `mobile-carousel-slide ${imgIndex === 0 ? 'active' : ''}`;
          
          const newImg = document.createElement('img');
          newImg.src = img.src;
          newImg.alt = img.alt || `Slide ${imgIndex + 1}`;
          newImg.style.cursor = 'pointer';
          newImg.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            openLightbox(img.src, img.alt || `Imagem ${imgIndex + 1}`);
          });
          
          slideDiv.appendChild(newImg);
          containerDiv.appendChild(slideDiv);
        });
        
        // Adicionar setas se houver mais de uma imagem
        if (imgElements.length > 1) {
          console.log('Criando setas para carrossel com', imgElements.length, 'imagens');
          
          const prevButton = document.createElement('button');
          prevButton.className = 'mobile-carousel-arrow prev';
          prevButton.innerHTML = '‹';
          prevButton.setAttribute('aria-label', 'Imagem anterior');
          prevButton.setAttribute('onclick', `
            (function(e) {
              e.preventDefault();
              e.stopPropagation();
              console.log('Seta anterior clicada');
              
              const container = this.closest('.mobile-carousel-container');
              const slides = container.querySelectorAll('.mobile-carousel-slide');
              const activeSlide = container.querySelector('.mobile-carousel-slide.active');
              const currentIndex = Array.from(slides).indexOf(activeSlide);
              const prevIndex = (currentIndex - 1 + slides.length) % slides.length;
              
              console.log('Slides:', slides.length, 'Current:', currentIndex, 'Prev:', prevIndex);
              
              activeSlide.classList.remove('active');
              slides[prevIndex].classList.add('active');
              
              const navDiv = this.closest('.mobile-carousel').querySelector('.mobile-carousel-nav');
              if (navDiv) {
                const dots = navDiv.querySelectorAll('.mobile-carousel-dot');
                dots.forEach(dot => dot.classList.remove('active'));
                dots[prevIndex].classList.add('active');
              }
            })(event);
          `);
          console.log('Evento onclick adicionado ao botão prev');
          
          const nextButton = document.createElement('button');
          nextButton.className = 'mobile-carousel-arrow next';
          nextButton.innerHTML = '›';
          nextButton.setAttribute('aria-label', 'Próxima imagem');
          nextButton.setAttribute('onclick', `
            (function(e) {
              e.preventDefault();
              e.stopPropagation();
              console.log('Seta próxima clicada');
              
              const container = this.closest('.mobile-carousel-container');
              const slides = container.querySelectorAll('.mobile-carousel-slide');
              const activeSlide = container.querySelector('.mobile-carousel-slide.active');
              const currentIndex = Array.from(slides).indexOf(activeSlide);
              const nextIndex = (currentIndex + 1) % slides.length;
              
              console.log('Slides:', slides.length, 'Current:', currentIndex, 'Next:', nextIndex);
              
              activeSlide.classList.remove('active');
              slides[nextIndex].classList.add('active');
              
              const navDiv = this.closest('.mobile-carousel').querySelector('.mobile-carousel-nav');
              if (navDiv) {
                const dots = navDiv.querySelectorAll('.mobile-carousel-dot');
                dots.forEach(dot => dot.classList.remove('active'));
                dots[nextIndex].classList.add('active');
              }
            })(event);
          `);
          console.log('Evento onclick adicionado ao botão next');
          
          containerDiv.appendChild(prevButton);
          containerDiv.appendChild(nextButton);
        }
        
        // Adicionar navegação por pontos se houver mais de uma imagem
        if (imgElements.length > 1) {
          const navDiv = document.createElement('div');
          navDiv.className = 'mobile-carousel-nav';
          
          imgElements.forEach((_, imgIndex) => {
            const dotButton = document.createElement('button');
            dotButton.className = `mobile-carousel-dot ${imgIndex === 0 ? 'active' : ''}`;
            dotButton.setAttribute('aria-label', `Ir para imagem ${imgIndex + 1}`);
            dotButton.setAttribute('onclick', `
              (function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('Ponto clicado:', ${imgIndex});
                
                const carousel = this.closest('.mobile-carousel');
                const container = carousel.querySelector('.mobile-carousel-container');
                const slides = container.querySelectorAll('.mobile-carousel-slide');
                const dots = carousel.querySelectorAll('.mobile-carousel-dot');
                
                slides.forEach(slide => slide.classList.remove('active'));
                dots.forEach(dot => dot.classList.remove('active'));
                
                slides[${imgIndex}].classList.add('active');
                dots[${imgIndex}].classList.add('active');
              })(event);
            `);
            
            navDiv.appendChild(dotButton);
          });
          
          carouselDiv.appendChild(navDiv);
        }
        
        carouselDiv.appendChild(containerDiv);
        
        // Substituir a tabela pelo carrossel
        console.log('Substituindo tabela por carrossel');
        table.parentNode?.replaceChild(carouselDiv, table);
      }
    });

    return tempDiv.innerHTML;
  };

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
          display: block !important;
          width: 100% !important;
          max-width: 100% !important;
          height: auto !important;
          border-radius: 0.75rem !important;
          margin: 1.25rem auto !important;
          transition: all 0.2s ease;
          cursor: pointer;
        }

        /* Estilos para desktop - imagens lado a lado quando estão em grupos */
        @media (min-width: 768px) {
          .clickable-image-content :global(.simple-carousel) {
            display: block !important;
            width: 100% !important;
            margin: 1rem 0 !important;
          }
          
          .clickable-image-content :global(.simple-carousel-track) {
            display: grid !important;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)) !important;
            gap: 1rem !important;
          }
          
          .clickable-image-content :global(.simple-carousel-track img) {
            width: 100% !important;
            height: auto !important;
            border-radius: 0.5rem !important;
            display: block !important;
            margin: 0 !important;
          }

          /* Forçar imagens em tabelas a aparecerem lado a lado no desktop */
          .clickable-image-content :global(table) {
            display: table !important;
            width: 100% !important;
            table-layout: auto !important;
            border-collapse: collapse !important;
          }
          
          .clickable-image-content :global(table td) {
            padding: 0.5rem !important;
            vertical-align: top !important;
            width: auto !important;
          }
          
          .clickable-image-content :global(table img) {
            margin: 0 !important;
            width: 100% !important;
            height: auto !important;
            max-width: 100% !important;
            display: block !important;
          }

          /* Forçar imagens consecutivas a aparecerem lado a lado */
          .clickable-image-content :global(p:has(img) + p:has(img)) {
            display: inline-block !important;
            width: 48% !important;
            margin-right: 2% !important;
            vertical-align: top !important;
          }

          .clickable-image-content :global(p:has(img)) {
            display: inline-block !important;
            width: 48% !important;
            margin-right: 2% !important;
            vertical-align: top !important;
          }
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

        /* Renderização básica de um carrossel simples inserido pelo editor */
        .clickable-image-content :global(.simple-carousel) {
          width: 100%;
          margin: 1rem 0;
        }
        .clickable-image-content :global(.simple-carousel-track) {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1rem;
        }
        .clickable-image-content :global(.simple-carousel-track img) {
          width: 100% !important;
          height: auto !important;
          border-radius: 0.5rem;
          display: block;
        }

        /* Estilos para desktop - imagens lado a lado */
        @media (min-width: 768px) {
          .clickable-image-content :global(.simple-carousel-track) {
            display: grid !important;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)) !important;
            gap: 1rem !important;
          }
          
          .clickable-image-content :global(.simple-carousel-track img) {
            width: 100% !important;
            height: auto !important;
            border-radius: 0.5rem !important;
            display: block !important;
          }

          /* Forçar imagens em tabelas a aparecerem lado a lado no desktop */
          .clickable-image-content :global(table) {
            display: table !important;
            width: 100% !important;
            table-layout: auto !important;
            border-collapse: collapse !important;
          }
          
          .clickable-image-content :global(table td) {
            padding: 0.5rem !important;
            vertical-align: top !important;
            width: auto !important;
          }
          
          .clickable-image-content :global(table img) {
            margin: 0 !important;
            width: 100% !important;
            height: auto !important;
            max-width: 100% !important;
            display: block !important;
          }

          /* Forçar imagens consecutivas a aparecerem lado a lado */
          .clickable-image-content :global(p:has(img) + p:has(img)) {
            display: inline-block !important;
            width: 48% !important;
            margin-right: 2% !important;
            vertical-align: top !important;
          }

          .clickable-image-content :global(p:has(img)) {
            display: inline-block !important;
            width: 48% !important;
            margin-right: 2% !important;
            vertical-align: top !important;
          }
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
          text-align: justify;
          text-justify: inter-word;
          hyphens: auto;
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

          .clickable-image-content :global(p) {
            text-align: justify;
            text-justify: inter-word;
            hyphens: auto;
            word-break: break-word;
            overflow-wrap: break-word;
            font-size: 16px;
            line-height: 1.6;
            margin-bottom: 1rem;
          }

          /* Corrigir listas no mobile */
          .clickable-image-content :global(ul),
          .clickable-image-content :global(ol) {
            padding-left: 1rem;
            margin: 0.5rem 0;
            word-wrap: break-word;
            overflow-wrap: break-word;
            max-width: 100%;
          }

          .clickable-image-content :global(li) {
            margin: 0.25rem 0;
            word-wrap: break-word;
            overflow-wrap: break-word;
            max-width: 100%;
            padding-right: 0.5rem;
          }

          /* Garantir que nada saia do container */
          .clickable-image-content :global(*) {
            max-width: 100%;
            box-sizing: border-box;
          }

          /* CORREÇÃO ESPECÍFICA PARA ESPAÇAMENTO ENTRE TEXTO E IMAGENS */
          .clickable-image-content :global(img) {
            margin: 0.25rem 0 !important;
            width: 100% !important;
            height: auto !important;
            max-width: 100% !important;
            display: block !important;
          }

          .clickable-image-content :global(p + img),
          .clickable-image-content :global(img + p) {
            margin-top: 0.25rem !important;
            margin-bottom: 0.25rem !important;
          }

          .clickable-image-content :global(h1 + img),
          .clickable-image-content :global(h2 + img),
          .clickable-image-content :global(h3 + img),
          .clickable-image-content :global(img + h1),
          .clickable-image-content :global(img + h2),
          .clickable-image-content :global(img + h3) {
            margin-top: 0.25rem !important;
            margin-bottom: 0.25rem !important;
          }

          /* Sobrescrever estilos inline do Word/Office */
          .clickable-image-content :global(img[style*="margin"]) {
            margin: 0.25rem 0 !important;
          }

          .clickable-image-content :global(img[style*="margin-top"]) {
            margin-top: 0.25rem !important;
          }

          .clickable-image-content :global(img[style*="margin-bottom"]) {
            margin-bottom: 0.25rem !important;
          }

          /* Sobrescrever tabelas do Word */
          .clickable-image-content :global(table img) {
            margin: 0.25rem 0 !important;
            width: 100% !important;
            height: auto !important;
            max-width: 100% !important;
            display: block !important;
          }

          .clickable-image-content :global(table td img) {
            margin: 0.25rem 0 !important;
            width: 100% !important;
            height: auto !important;
            max-width: 100% !important;
            display: block !important;
          }

          /* Estilos para desktop - tabelas com imagens lado a lado */
          @media (min-width: 768px) {
            .clickable-image-content :global(table) {
              display: table !important;
              width: 100% !important;
              table-layout: auto !important;
              border-collapse: collapse !important;
            }
            
            .clickable-image-content :global(table td) {
              padding: 0.5rem !important;
              vertical-align: top !important;
              width: auto !important;
            }
            
            .clickable-image-content :global(table img) {
              margin: 0 !important;
              width: 100% !important;
              height: auto !important;
              max-width: 100% !important;
              display: block !important;
            }

            /* Forçar imagens consecutivas a aparecerem lado a lado */
            .clickable-image-content :global(p:has(img) + p:has(img)) {
              display: inline-block !important;
              width: 48% !important;
              margin-right: 2% !important;
              vertical-align: top !important;
            }

            .clickable-image-content :global(p:has(img)) {
              display: inline-block !important;
              width: 48% !important;
              margin-right: 2% !important;
              vertical-align: top !important;
            }
          }

          /* Sobrescrever qualquer elemento com imagem */
          .clickable-image-content :global(* img) {
            margin: 0.25rem 0 !important;
          }

          /* Sobrescrever parágrafos com estilos inline */
          .clickable-image-content :global(p[style*="margin"]) {
            margin: 0.25rem 0 !important;
          }

          .clickable-image-content :global(p[style*="margin-top"]) {
            margin-top: 0.25rem !important;
          }

          .clickable-image-content :global(p[style*="margin-bottom"]) {
            margin-bottom: 0.25rem !important;
          }

          /* Sobrescrever classes do Word */
          .clickable-image-content :global(.MsoNormal) {
            margin: 0.25rem 0 !important;
          }

          .clickable-image-content :global(p.MsoNormal) {
            margin: 0.25rem 0 !important;
          }

          /* Sobrescrever qualquer elemento com margem */
          .clickable-image-content :global(*[style*="margin"]) {
            margin: 0.25rem 0 !important;
          }

          .clickable-image-content :global(*[style*="margin-top"]) {
            margin-top: 0.25rem !important;
          }

          .clickable-image-content :global(*[style*="margin-bottom"]) {
            margin-bottom: 0.25rem !important;
          }

          /* Forçar espaçamento mínimo em todos os elementos */
          .clickable-image-content :global(*) {
            margin-top: 0.25rem !important;
            margin-bottom: 0.25rem !important;
          }

          /* Exceções para elementos específicos */
          .clickable-image-content :global(h1),
          .clickable-image-content :global(h2),
          .clickable-image-content :global(h3),
          .clickable-image-content :global(h4),
          .clickable-image-content :global(h5),
          .clickable-image-content :global(h6) {
            margin-top: 0.5rem !important;
            margin-bottom: 0.25rem !important;
          }

          .clickable-image-content :global(p:first-child) {
            margin-top: 0 !important;
          }

          .clickable-image-content :global(p:last-child) {
            margin-bottom: 0 !important;
          }

          /* Garantir que tabelas com imagens apareçam no mobile */
          .clickable-image-content :global(table) {
            display: table !important;
            width: 100% !important;
            table-layout: fixed !important;
            border-collapse: collapse !important;
          }

          /* Estilos para desktop - tabelas com imagens lado a lado */
          @media (min-width: 768px) {
            .clickable-image-content :global(table) {
              display: table !important;
              width: 100% !important;
              table-layout: auto !important;
              border-collapse: collapse !important;
            }
            
            .clickable-image-content :global(table td) {
              padding: 0.5rem !important;
              vertical-align: top !important;
              width: auto !important;
            }
            
            .clickable-image-content :global(table img) {
              margin: 0 !important;
              width: 100% !important;
              height: auto !important;
              max-width: 100% !important;
              display: block !important;
            }

            /* Forçar imagens consecutivas a aparecerem lado a lado */
            .clickable-image-content :global(p:has(img) + p:has(img)) {
              display: inline-block !important;
              width: 48% !important;
              margin-right: 2% !important;
              vertical-align: top !important;
            }

            .clickable-image-content :global(p:has(img)) {
              display: inline-block !important;
              width: 48% !important;
              margin-right: 2% !important;
              vertical-align: top !important;
            }
          }
          /* No mobile, o carrossel simples vira galeria rolável horizontal */
          .clickable-image-content :global(.simple-carousel-track) {
            display: flex !important;
            gap: 0.5rem !important;
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch !important;
            scroll-snap-type: x mandatory !important;
          }
          .clickable-image-content :global(.simple-carousel-track img) {
            min-width: 85% !important;
            scroll-snap-align: center !important;
          }

          /* Estilos para desktop - imagens lado a lado */
          @media (min-width: 768px) {
            .clickable-image-content :global(.simple-carousel-track) {
              display: grid !important;
              grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)) !important;
              gap: 1rem !important;
            }
            
            .clickable-image-content :global(.simple-carousel-track img) {
              min-width: auto !important;
              scroll-snap-align: none !important;
            }
          }

          .clickable-image-content :global(td) {
            padding: 0.25rem !important;
            vertical-align: top !important;
          }

          /* Carrosséis sempre visíveis em todas as telas */
          .clickable-image-content :global(.mobile-carousel) {
            display: block !important;
          }

          /* Integrar carrosséis ao texto */
          .clickable-image-content :global(.mobile-carousel) {
            margin: 0.25rem 0 !important;
            width: 100% !important;
            position: relative !important;
          }

          .clickable-image-content :global(.mobile-carousel-container) {
            width: 100% !important;
            overflow: hidden !important;
            position: relative !important;
            border-radius: 0.5rem !important;
          }

          .clickable-image-content :global(.mobile-carousel-slide) {
            width: 100% !important;
            display: none !important;
          }

          .clickable-image-content :global(.mobile-carousel-slide.active) {
            display: block !important;
          }

          .clickable-image-content :global(.mobile-carousel img) {
            width: 100% !important;
            height: auto !important;
            max-width: 100% !important;
            display: block !important;
            border-radius: 0.5rem !important;
          }

          .clickable-image-content :global(.mobile-carousel-nav) {
            display: flex !important;
            justify-content: center !important;
            align-items: center !important;
            gap: 0.5rem !important;
            margin-top: 0.5rem !important;
          }

          .clickable-image-content :global(.mobile-carousel-dot) {
            width: 8px !important;
            height: 8px !important;
            border-radius: 50% !important;
            background-color: rgba(255, 255, 255, 0.3) !important;
            cursor: pointer !important;
            transition: background-color 0.2s ease !important;
          }

          .clickable-image-content :global(.mobile-carousel-dot.active) {
            background-color: #7fdb3f !important;
          }

          .clickable-image-content :global(.mobile-carousel-arrow) {
            position: absolute !important;
            top: 50% !important;
            transform: translateY(-50%) !important;
            background-color: rgba(0, 0, 0, 0.7) !important;
            color: white !important;
            border: none !important;
            border-radius: 50% !important;
            width: 40px !important;
            height: 40px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            cursor: pointer !important;
            font-size: 18px !important;
            z-index: 10 !important;
          }

          .clickable-image-content :global(.mobile-carousel-arrow.prev) {
            left: 10px !important;
          }

          .clickable-image-content :global(.mobile-carousel-arrow.next) {
            right: 10px !important;
          }

          /* Carrosséis sempre visíveis */
          .clickable-image-content :global(.mobile-carousel) {
            display: block !important;
          }

          .clickable-image-content :global(.mobile-carousel) {
            display: block !important;
            width: 100% !important;
            position: relative !important;
            margin: 1rem 0 !important;
          }

          .clickable-image-content :global(.mobile-carousel-container) {
            width: 100% !important;
            overflow: hidden !important;
            position: relative !important;
            border-radius: 0.5rem !important;
          }

          .clickable-image-content :global(.mobile-carousel-slide) {
            width: 100% !important;
            display: none !important;
          }

          .clickable-image-content :global(.mobile-carousel-slide.active) {
            display: block !important;
          }

          .clickable-image-content :global(.mobile-carousel img) {
            width: 100% !important;
            height: auto !important;
            max-width: 100% !important;
            display: block !important;
            border-radius: 0.5rem !important;
          }

          .clickable-image-content :global(.mobile-carousel-nav) {
            display: flex !important;
            justify-content: center !important;
            align-items: center !important;
            gap: 0.5rem !important;
            margin-top: 1rem !important;
          }

          .clickable-image-content :global(.mobile-carousel-dot) {
            width: 8px !important;
            height: 8px !important;
            border-radius: 50% !important;
            background-color: rgba(255, 255, 255, 0.3) !important;
            cursor: pointer !important;
            transition: background-color 0.2s ease !important;
          }

          .clickable-image-content :global(.mobile-carousel-dot.active) {
            background-color: #7fdb3f !important;
          }

          .clickable-image-content :global(.mobile-carousel-arrow) {
            position: absolute !important;
            top: 50% !important;
            transform: translateY(-50%) !important;
            background-color: rgba(0, 0, 0, 0.7) !important;
            color: white !important;
            border: none !important;
            border-radius: 50% !important;
            width: 40px !important;
            height: 40px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            cursor: pointer !important;
            font-size: 18px !important;
            z-index: 10 !important;
          }

          .clickable-image-content :global(.mobile-carousel-arrow.prev) {
            left: 10px !important;
          }

          .clickable-image-content :global(.mobile-carousel-arrow.next) {
            right: 10px !important;
          }

          .clickable-image-content :global(.mobile-carousel-arrow:hover) {
            background-color: rgba(0, 0, 0, 0.9) !important;
          }
        }
      `}</style>
    </>
  );
};

export default ClickableImageContent; 