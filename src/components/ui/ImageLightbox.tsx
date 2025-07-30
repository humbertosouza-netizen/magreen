'use client';

import React, { useEffect } from 'react';
import theme from '@/styles/theme';

interface ImageLightboxProps {
  isOpen: boolean;
  imageSrc: string;
  imageAlt: string;
  onClose: () => void;
}

const ImageLightbox: React.FC<ImageLightboxProps> = ({
  isOpen,
  imageSrc,
  imageAlt,
  onClose
}) => {
  // Fechar com ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden'; // Prevenir scroll
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="image-lightbox-overlay" onClick={onClose}>
      <div className="image-lightbox-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <div className="image-container">
          <img 
            src={imageSrc} 
            alt={imageAlt} 
            className="lightbox-image"
            loading="lazy"
          />
        </div>
        
        <div className="image-info">
          <p className="image-alt">{imageAlt}</p>
          <p className="image-src">{imageSrc}</p>
        </div>
      </div>

      <style jsx>{`
        .image-lightbox-overlay {
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

        .image-lightbox-content {
          position: relative;
          max-width: 95vw;
          max-height: 95vh;
          background-color: rgba(255, 255, 255, 0.1);
          border-radius: 1rem;
          overflow: hidden;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
          animation: scaleIn 0.3s ease-out;
        }

        .close-button {
          position: absolute;
          top: 1rem;
          right: 1rem;
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

        .close-button:hover {
          background-color: rgba(0, 0, 0, 0.9);
          transform: scale(1.1);
        }

        .image-container {
          display: flex;
          align-items: center;
          justify-content: center;
          max-height: calc(95vh - 120px);
          overflow: hidden;
        }

        .lightbox-image {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          border-radius: 0.5rem;
          transition: transform 0.3s ease;
        }

        .lightbox-image:hover {
          transform: scale(1.02);
        }

        .image-info {
          padding: 1rem;
          background-color: rgba(0, 0, 0, 0.8);
          color: white;
          text-align: center;
        }

        .image-alt {
          font-size: 1rem;
          font-weight: 500;
          margin: 0 0 0.5rem 0;
          color: ${theme.colors?.textPrimary || '#ffffff'};
        }

        .image-src {
          font-size: 0.75rem;
          color: ${theme.colors?.textSecondary || '#cccccc'};
          margin: 0;
          word-break: break-all;
          opacity: 0.7;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        /* Responsividade */
        @media (max-width: 768px) {
          .image-lightbox-overlay {
            padding: 0.5rem;
          }

          .image-lightbox-content {
            max-width: 100vw;
            max-height: 100vh;
            border-radius: 0;
          }

          .close-button {
            top: 0.5rem;
            right: 0.5rem;
            width: 2.5rem;
            height: 2.5rem;
          }

          .image-container {
            max-height: calc(100vh - 100px);
          }

          .image-info {
            padding: 0.75rem;
          }

          .image-alt {
            font-size: 0.875rem;
          }

          .image-src {
            font-size: 0.625rem;
          }
        }

        /* Zoom controls */
        .zoom-controls {
          position: absolute;
          bottom: 1rem;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 0.5rem;
          background-color: rgba(0, 0, 0, 0.7);
          padding: 0.5rem;
          border-radius: 0.5rem;
          backdrop-filter: blur(4px);
        }

        .zoom-btn {
          background-color: rgba(255, 255, 255, 0.2);
          border: none;
          border-radius: 0.25rem;
          width: 2rem;
          height: 2rem;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .zoom-btn:hover {
          background-color: rgba(255, 255, 255, 0.3);
        }

        .zoom-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default ImageLightbox; 