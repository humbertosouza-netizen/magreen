'use client';

import { useState } from 'react';

interface ImageLightboxState {
  isOpen: boolean;
  imageSrc: string;
  imageAlt: string;
}

export const useImageLightbox = () => {
  const [lightboxState, setLightboxState] = useState<ImageLightboxState>({
    isOpen: false,
    imageSrc: '',
    imageAlt: ''
  });

  const openLightbox = (imageSrc: string, imageAlt: string = '') => {
    setLightboxState({
      isOpen: true,
      imageSrc,
      imageAlt
    });
  };

  const closeLightbox = () => {
    setLightboxState(prev => ({
      ...prev,
      isOpen: false
    }));
  };

  return {
    lightboxState,
    openLightbox,
    closeLightbox
  };
}; 