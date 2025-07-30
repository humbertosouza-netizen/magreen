'use client';

import { supabase } from '@/lib/supabase';

export const useWordImageUploader = () => {
  const uploadWordImage = async (dataUrl: string, index: number): Promise<string> => {
    try {
      // Converter data URL para blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      
      // Criar arquivo
      const file = new File([blob], `word-image-${Date.now()}-${index}.png`, { 
        type: blob.type || 'image/png' 
      });
      
      // Fazer upload para o Supabase
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      const filePath = `blog-conteudo/${fileName}`;
      
      const { data, error } = await supabase.storage
        .from('blog-conteudo')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type
        });
      
      if (error) {
        console.error('Erro ao fazer upload da imagem do Word:', error);
        throw error;
      }
      
      // Obter URL pública
      const { data: publicData } = supabase.storage
        .from('blog-conteudo')
        .getPublicUrl(filePath);
      
      return publicData.publicUrl;
    } catch (error) {
      console.error('Erro ao processar imagem do Word:', error);
      throw error;
    }
  };

  const processWordImages = async (html: string, onImageUploaded?: (url: string, originalSrc: string) => void): Promise<string> => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    const images = tempDiv.querySelectorAll('img');
    let processedHtml = html;
    
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      const originalSrc = img.src;
      
      if (originalSrc.startsWith('data:image')) {
        try {
          const uploadedUrl = await uploadWordImage(originalSrc, i);
          
          // Substituir data URL pela URL do Supabase
          processedHtml = processedHtml.replace(originalSrc, uploadedUrl);
          
          // Notificar componente pai se callback fornecido
          if (onImageUploaded) {
            onImageUploaded(uploadedUrl, originalSrc);
          }
          
          console.log(`Imagem do Word ${i + 1} processada e enviada:`, uploadedUrl);
        } catch (error) {
          console.error(`Erro ao processar imagem ${i + 1}:`, error);
          // Manter a imagem original se houver erro
        }
      }
    }
    
    return processedHtml;
  };

  return { processWordImages };
}; 