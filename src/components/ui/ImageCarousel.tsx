'use client';

import React, { useState, useEffect } from 'react';
import { useImageLightbox } from '@/hooks/useImageLightbox';
import ImageLightbox from './ImageLightbox';
import theme from '@/styles/theme';

interface ImageCarouselProps {
  images: string[];
  className?: string;
  showOnMobile?: boolean;
  showOnDesktop?: boolean;
}

const ImageCarousel: React.FC<ImageCarouselProps> = ({
  images,
  className = '',
  showOnMobile = true,
  showOnDesktop = false
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { lightboxState, openLightbox, closeLightbox } = useImageLightbox();

  // Auto-play para o carrossel
  useEffect(() => {
    if (images.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === images.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000); // Muda a cada 5 segundos

    return () => clearInterval(interval);
  }, [images.length]);

  const nextImage = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevImage = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  const goToImage = (index: number) => {
    setCurrentIndex(index);
  };

  const handleImageClick = () => {
    if (images[currentIndex]) {
      openLightbox(images[currentIndex], `Imagem ${currentIndex + 1} de ${images.length}`);
    }
  };

  if (images.length === 0) return null;

  // Se só tem uma imagem, mostra como imagem simples
  if (images.length === 1) {
    return (
      <div className={`image-carousel-single ${className}`}>
        <img
          src={images[0]}
          alt="Imagem"
          className="single-image"
          onClick={handleImageClick}
        />
        <ImageLightbox
          isOpen={lightboxState.isOpen}
          imageSrc={lightboxState.imageSrc}
          imageAlt={lightboxState.imageAlt}
          onClose={closeLightbox}
        />
        <style jsx>{`
          .image-carousel-single {
            width: 100%;
            max-width: 100%;
            overflow: hidden;
            border-radius: 0.5rem;
            margin: 1rem 0;
          }

          .single-image {
            width: 100%;
            height: auto;
            object-fit: cover;
            cursor: pointer;
            transition: transform 0.2s ease;
          }

          .single-image:hover {
            transform: scale(1.02);
          }

          /* Responsividade */
          @media (max-width: 640px) {
            .image-carousel-single {
              display: ${showOnMobile ? 'block' : 'none'};
            }
          }

          @media (min-width: 641px) {
            .image-carousel-single {
              display: ${showOnDesktop ? 'block' : 'none'};
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className={`image-carousel ${className}`}>
      {/* Container principal do carrossel */}
      <div className="carousel-container">
        {/* Botão anterior */}
        <button 
          className="carousel-button prev-button"
          onClick={prevImage}
          aria-label="Imagem anterior"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Imagem atual */}
        <div className="image-container" onClick={handleImageClick}>
          <img
            src={images[currentIndex]}
            alt={`Imagem ${currentIndex + 1} de ${images.length}`}
            className="current-image"
          />
          
          {/* Indicador de posição */}
          <div className="image-counter">
            {currentIndex + 1} / {images.length}
          </div>
        </div>

        {/* Botão próximo */}
        <button 
          className="carousel-button next-button"
          onClick={nextImage}
          aria-label="Próxima imagem"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Indicadores de pontos */}
      {images.length > 1 && (
        <div className="carousel-indicators">
          {images.map((_, index) => (
            <button
              key={index}
              className={`indicator ${index === currentIndex ? 'active' : ''}`}
              onClick={() => goToImage(index)}
              aria-label={`Ir para imagem ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Lightbox */}
      <ImageLightbox
        isOpen={lightboxState.isOpen}
        imageSrc={lightboxState.imageSrc}
        imageAlt={lightboxState.imageAlt}
        onClose={closeLightbox}
      />

      <style jsx>{`
        .image-carousel {
          width: 100%;
          max-width: 100%;
          margin: 1rem 0;
        }

        .carousel-container {
          position: relative;
          width: 100%;
          height: 420px;
          border-radius: 0.5rem;
          overflow: hidden;
          background-color: rgba(0, 0, 0, 0.1);
        }

        .image-container {
          position: relative;
          width: 100%;
          height: 100%;
          cursor: pointer;
        }

        .current-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }

        .current-image:hover {
          transform: scale(1.05);
        }

        .carousel-button {
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

        .carousel-button:hover {
          background-color: rgba(0, 0, 0, 0.9);
          transform: translateY(-50%) scale(1.1);
        }

        .prev-button {
          left: 1rem;
        }

        .next-button {
          right: 1rem;
        }

        .image-counter {
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

        .carousel-indicators {
          display: flex;
          justify-content: center;
          gap: 0.5rem;
          margin-top: 1rem;
        }

        .indicator {
          width: 0.75rem;
          height: 0.75rem;
          border-radius: 50%;
          border: none;
          background-color: rgba(255, 255, 255, 0.3);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .indicator.active {
          background-color: ${theme.colors?.primary || '#7fdb3f'};
          transform: scale(1.2);
        }

        .indicator:hover {
          background-color: rgba(255, 255, 255, 0.5);
        }

        /* Responsividade */
        @media (max-width: 640px) {
          .image-carousel {
            display: ${showOnMobile ? 'block' : 'none'};
          }

          .carousel-container {
            height: 250px;
          }

          .carousel-button {
            width: 2.5rem;
            height: 2.5rem;
          }

          .carousel-button svg {
            width: 1.25rem;
            height: 1.25rem;
          }

          .image-counter {
            font-size: 0.75rem;
            padding: 0.375rem 0.5rem;
          }

          .indicator {
            width: 0.5rem;
            height: 0.5rem;
          }
        }

        @media (min-width: 641px) {
          .image-carousel {
            display: ${showOnDesktop ? 'block' : 'none'};
          }

          .carousel-container {
            height: 520px;
          }
        }

        /* Animações */
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .current-image {
          animation: fadeIn 0.3s ease-in-out;
        }

        /* Touch gestures para mobile */
        @media (max-width: 640px) {
          .image-container {
            touch-action: pan-y pinch-zoom;
          }
        }
      `}</style>
    </div>
  );
};

export default ImageCarousel; 