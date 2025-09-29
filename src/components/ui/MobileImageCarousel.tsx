'use client';

import React, { useEffect, useState } from 'react';

interface MobileImageCarouselProps {
  tableElement: HTMLTableElement;
}

const MobileImageCarousel: React.FC<MobileImageCarouselProps> = ({ tableElement }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    // Extrair todas as imagens da tabela
    const imgElements = tableElement.querySelectorAll('img');
    const imageUrls = Array.from(imgElements).map(img => img.src);
    setImages(imageUrls);
  }, [tableElement]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % images.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + images.length) % images.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  if (images.length === 0) return null;

  return (
    <div className="mobile-carousel">
      <div className="mobile-carousel-container">
        {images.map((src, index) => (
          <div
            key={index}
            className={`mobile-carousel-slide ${index === currentSlide ? 'active' : ''}`}
          >
            <img src={src} alt={`Slide ${index + 1}`} />
          </div>
        ))}
        
        {images.length > 1 && (
          <>
            <button
              className="mobile-carousel-arrow prev"
              onClick={prevSlide}
              aria-label="Imagem anterior"
            >
              ‹
            </button>
            <button
              className="mobile-carousel-arrow next"
              onClick={nextSlide}
              aria-label="Próxima imagem"
            >
              ›
            </button>
          </>
        )}
      </div>
      
      {images.length > 1 && (
        <div className="mobile-carousel-nav">
          {images.map((_, index) => (
            <button
              key={index}
              className={`mobile-carousel-dot ${index === currentSlide ? 'active' : ''}`}
              onClick={() => goToSlide(index)}
              aria-label={`Ir para imagem ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MobileImageCarousel; 